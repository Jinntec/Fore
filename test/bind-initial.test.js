/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent, waitUntil } from '@open-wc/testing';

import '../index.js';

describe('fx-bind initial', () => {
  it('overwrites an existing value once and leaves the node writable', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data>
              <a>old</a>
            </data>
          </fx-instance>
          <fx-bind ref="a" initial="'new'"></fx-bind>
        </fx-model>
        <fx-group>
          <fx-output id="out" ref="a"></fx-output>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');

    expect(el.querySelector('#out').value).to.equal('new');
    const mi = el.getModel().getModelItem(el.querySelector('#out').nodeset);
    expect(mi.readonly).to.be.false;
  });

  it('runs before calculate', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data>
              <balance></balance>
              <credit>5</credit>
              <double></double>
            </data>
          </fx-instance>
          <fx-bind ref="balance" initial="10"></fx-bind>
          <fx-bind ref="double" calculate="../balance * 2"></fx-bind>
        </fx-model>
        <fx-group>
          <fx-output id="out" ref="double"></fx-output>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    expect(el.querySelector('#out').value).to.equal('20');
  });

  it('is evaluated only once - later rebuilds keep user changes', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data>
              <a></a>
            </data>
          </fx-instance>
          <fx-bind ref="a" initial="'first'"></fx-bind>
        </fx-model>
        <fx-group>
          <fx-output id="out" ref="a"></fx-output>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    const model = el.getModel();
    const mi = model.getModelItem(el.querySelector('#out').nodeset);
    mi.value = 'changed';

    model.updateModel();
    await model.updateModel();
    expect(model.getModelItem(el.querySelector('#out').nodeset).value).to.equal('changed');
  });

  it('yields the empty string if the expression fails', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data>
              <a>keep?</a>
            </data>
          </fx-instance>
          <fx-bind ref="a" initial="error()"></fx-bind>
        </fx-model>
        <fx-group>
          <fx-output id="out" ref="a"></fx-output>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    expect(el.querySelector('#out').value).to.equal('');
  });

  it('costs nothing when no bind declares initial', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data>
              <a>x</a>
            </data>
          </fx-instance>
          <fx-bind ref="a" readonly="false()"></fx-bind>
        </fx-model>
        <fx-group>
          <fx-output id="out" ref="a"></fx-output>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    const model = el.getModel();
    expect(model._hasInitial).to.be.false;
    expect(model._initialDone.size).to.equal(0);
    expect(el.querySelector('#out').value).to.equal('x');
  });

  it('gives an inserted row its initial value once', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data>
              <line><amount>1</amount><note>seed</note></line>
            </data>
          </fx-instance>
          <fx-bind ref="line/note" initial="'init'"></fx-bind>
        </fx-model>
        <fx-repeat id="r" ref="line">
          <template>
            <fx-output ref="note"></fx-output>
          </template>
        </fx-repeat>
        <fx-trigger id="add">
          <button>add</button>
          <fx-insert ref="line" origin="line[1]"></fx-insert>
          <fx-update></fx-update>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    const rows = () =>
      Array.from(
        el.getModel().instances[0].instanceData.documentElement.querySelectorAll(':scope > line'),
      );
    expect(rows()[0].querySelector('note').textContent, 'seed row').to.equal('init');

    // user edit on the first row must survive the rebuild caused by the insert
    rows()[0].querySelector('note').textContent = 'edited';

    el.querySelector('#add button').click();
    await waitUntil(() => rows().length === 2);
    await new Promise(r => setTimeout(r, 200));

    expect(rows()[0].querySelector('note').textContent, 'existing row untouched').to.equal(
      'edited',
    );
    expect(rows()[1].querySelector('note').textContent, 'inserted row initialized').to.equal(
      'init',
    );
  });

  it('applies initial to a JSON instance node', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="j" type="json"
            >{"count": 5, "label": "x", "copy": "", "next": 0, "sibling": ""}</fx-instance
          >
          <fx-bind ref="instance('j')?count" initial="10"></fx-bind>
          <fx-bind ref="instance('j')?label" initial="concat('a', 'b')"></fx-bind>
          <fx-bind ref="instance('j')?copy" initial="instance('j')?label"></fx-bind>
          <fx-bind ref="instance('j')?next" initial="instance('j')?count + 1"></fx-bind>
          <fx-bind ref="instance('j')?sibling" initial="../label"></fx-bind>
        </fx-model>
        <fx-group>
          <fx-output ref="instance('j')?count"></fx-output>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    const model = el.getModel();
    expect(model.getModelItem('$j/count').value).to.equal(10);
    expect(model.getModelItem('$j/label').value).to.equal('ab');
    expect(model.getModelItem('$j/copy').value).to.equal('ab');
    expect(model.getModelItem('$j/next').value).to.equal(11);
    expect(model.getModelItem('$j/sibling').value).to.equal('ab');
  });

  it('JSON calculate stores the typed result and runs after initial', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="j" type="json">{"count": 1, "double": 0}</fx-instance>
          <fx-bind ref="instance('j')?count" initial="21"></fx-bind>
          <fx-bind ref="instance('j')?double" calculate="instance('j')?count * 2"></fx-bind>
        </fx-model>
        <fx-group>
          <fx-output ref="instance('j')?double"></fx-output>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    expect(el.getModel().getModelItem('$j/double').value).to.equal(42);
  });
});
