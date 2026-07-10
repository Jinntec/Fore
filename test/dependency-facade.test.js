/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';
import sinon from 'sinon';

import '../index.js';
import { evaluateXPath } from '../src/xpath-evaluation.js';
import { DependencyNotifyingDomFacade } from '../src/DependencyNotifyingDomFacade.js';
import { JSONNode } from '../src/json/JSONNode.js';
import { JSONDomFacade } from '../src/json/JSONDomFacade.js';

describe('DependencyNotifyingDomFacade', () => {
  it('notifies touched nodes for XML evaluation without console output', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <item keep="true">a</item>
              <item keep="false">b</item>
            </data>
          </fx-instance>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const context = el.querySelector('fx-instance').getDefaultContext();
    const touched = [];
    const facade = new DependencyNotifyingDomFacade(node => touched.push(node));

    const logSpy = sinon.spy(console, 'log');
    try {
      const result = evaluateXPath("count(item[@keep='true'])", context, el, {}, {}, facade);
      expect(result).to.deep.equal([1]);
      expect(touched.length).to.be.greaterThan(0);
      // regression guard: getAttribute used to console.log every access
      expect(logSpy.called).to.be.false;
    } finally {
      logSpy.restore();
    }

    // the predicate read the keep attributes — they must be among the touched nodes
    const touchedAttrs = touched.filter(n => n.nodeType === Node.ATTRIBUTE_NODE);
    expect(touchedAttrs.some(a => a.name === 'keep')).to.be.true;
  });

  it('withInner() delegates accessors to the inner facade and notifies touches', () => {
    const root = new JSONNode({ automobiles: [{ maker: 'Nissan' }, { maker: 'Honda' }] });

    const touched = [];
    const outer = new DependencyNotifyingDomFacade(node => touched.push(node));
    const facade = outer.withInner(new JSONDomFacade());

    const [automobiles] = facade.getChildNodes(root);
    expect(automobiles.getKey()).to.equal('automobiles');
    expect(touched).to.include(automobiles);

    const entries = facade.getChildren(automobiles);
    expect(entries).to.have.lengthOf(2);
    entries.forEach(entry => expect(touched).to.include(entry));

    const maker = facade.getFirstChild(entries[0]);
    expect(facade.getData(maker)).to.equal('Nissan');
    expect(touched).to.include(maker);

    // navigating up never registers a dependency
    const touchCountBefore = touched.length;
    expect(facade.getParentNode(maker)).to.equal(entries[0]);
    expect(touched.length).to.equal(touchCountBefore);
  });

  it('passes a facade through the fontoxpath JSON branch without changing results', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="json">
            { "automobiles": [ { "maker": "Nissan", "year": 2000 }, { "maker": "Honda", "year":
            2023 } ] }
          </fx-instance>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const context = el.querySelector('fx-instance').getDefaultContext();
    expect(context && context.__jsonlens__ === true, 'context is a JSON lens node').to.be.true;

    // Known limitation (Phase 1 checkpoint): fontoxpath cannot navigate lens nodes —
    // real JSON traffic uses the custom `?key` lookup branches, which bypass facades.
    // This pins the plumbing: a passed facade must not throw or alter the result.
    const expected = evaluateXPath('count(*/*)', context, el);
    const facade = new DependencyNotifyingDomFacade(() => {});
    const result = evaluateXPath('count(*/*)', context, el, {}, {}, facade);
    expect(result).to.deep.equal(expected);
  });
});
