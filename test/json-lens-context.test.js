/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';
import {
  evaluateXPath,
  evaluateXPathToBoolean,
  evaluateXPathToFirstNode,
  evaluateXPathToNodes,
  evaluateXPathToNumber,
  evaluateXPathToString,
  evaluateXPathToStrings,
} from '../src/xpath-evaluation.js';

// A JSON lens handed to the XPath engine as context item used to overflow the stack (and silently
// evaluate to nothing) for every expression that was not a plain `?key` lookup.
describe('XPath expressions with a JSON lens as context item', () => {
  let model;
  let count;
  let obj;

  before(async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="j" type="json">{"count": 5, "label": "xy", "o": {"a": 1, "b": 2}}</fx-instance>
        </fx-model>
        <fx-group>
          <fx-output ref="instance('j')?count"></fx-output>
          <fx-output ref="instance('j')?o"></fx-output>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    model = el.getModel();
    count = model.getModelItem('$j/count').lens;
    obj = model.getModelItem('$j/o').lens;
  });

  it('evaluates plain expressions', () => {
    expect(evaluateXPathToString('concat("a", "b")', count, model)).to.equal('ab');
    expect(evaluateXPathToBoolean('true()', count, model)).to.be.true;
    expect(evaluateXPathToNumber('10', count, model)).to.equal(10);
    expect(evaluateXPathToStrings('10', count, model)).to.deep.equal(['10']);
    expect(evaluateXPath('10', count, model)).to.deep.equal([10]);
  });

  it('uses the value of the node as context item', () => {
    expect(evaluateXPathToNumber('. + 1', count, model)).to.equal(6);
    expect(evaluateXPathToString('string(.)', count, model)).to.equal('5');
    expect(evaluateXPathToString('.?a', obj, model)).to.equal('1');
  });

  it('evaluates complex expressions containing a lookup', () => {
    expect(evaluateXPathToNumber("instance('j')?count + 1", count, model)).to.equal(6);
    expect(evaluateXPathToString("instance('j')?count + 1", count, model)).to.equal('6');
    expect(evaluateXPathToString("string-length(instance('j')?label)", count, model)).to.equal('2');
  });

  it('does not take a `?` in a string literal for a lookup', () => {
    expect(evaluateXPathToString("'really?'", count, model)).to.equal('really?');
    expect(evaluateXPathToBoolean("'a?b' = 'a?b'", count, model)).to.be.true;
  });

  describe('axis steps', () => {
    const values = nodes => nodes.map(n => n.value);

    it('resolves child, parent and self steps to the lens nodes', () => {
      expect(values(evaluateXPathToNodes('*', obj, model))).to.deep.equal([1, 2]);
      expect(values(evaluateXPathToNodes('child::*', obj, model))).to.deep.equal([1, 2]);
      expect(values(evaluateXPathToNodes('b', obj, model))).to.deep.equal([2]);
      expect(values(evaluateXPathToNodes('*[2]', obj, model))).to.deep.equal([2]);
      expect(evaluateXPathToNodes('..', obj, model)[0].getParent()).to.equal(null);
      expect(evaluateXPathToNodes('parent::*', obj, model)[0].value).to.have.property('count');
      expect(evaluateXPathToNodes('self::*', obj, model)[0]).to.equal(obj);
    });

    it('resolves multi-step and absolute paths', () => {
      expect(values(evaluateXPathToNodes('../count', obj, model))).to.deep.equal([5]);
      expect(values(evaluateXPathToNodes('../o/a', obj, model))).to.deep.equal([1]);
      expect(values(evaluateXPathToNodes('/count', obj, model))).to.deep.equal([5]);
      expect(evaluateXPathToFirstNode('../label', count, model).value).to.equal('xy');
    });

    it('returns nothing, without error, for steps that do not match', () => {
      expect(evaluateXPathToNodes('nope', obj, model)).to.deep.equal([]);
      expect(evaluateXPathToNodes('*[9]', obj, model)).to.deep.equal([]);
      expect(evaluateXPathToFirstNode('..', model.getModelItem('$j/o').lens.getParent(), model)).to
        .be.null;
    });

    it('reports unsupported expressions instead of overflowing the stack', () => {
      let message = '';
      model.addEventListener(
        'error',
        e => {
          message = e.detail.message;
        },
        { once: true },
      );
      expect(evaluateXPathToNodes('//a', obj, model)).to.deep.equal([]);
      expect(message).to.contain('not supported on JSON nodes');
    });

    it('also works for the value evaluators', () => {
      expect(evaluateXPathToString('../label', count, model)).to.equal('xy');
      expect(evaluateXPathToNumber('../count', obj, model)).to.equal(5);
      expect(evaluateXPathToBoolean('../label', count, model)).to.be.true;
      expect(evaluateXPathToBoolean('../nope', count, model)).to.be.false;
      expect(evaluateXPathToStrings('*', obj, model)).to.deep.equal(['1', '2']);
    });
  });
});
