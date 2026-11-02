/* eslint-disable no-unused-expressions */
import { fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

async function setup(binds, data = '<item>x</item><pp>true</pp><qq>false</qq>') {
  const el = fixtureSync(`
    <fx-fore>
      <fx-model id="model1">
        <fx-instance type="html"><data>${data}</data></fx-instance>
        ${binds}
      </fx-model>
    </fx-fore>
  `);
  await oneEvent(el, 'ready');
  return { el, model: el.querySelector('fx-model') };
}

describe('combined binds', () => {
  it('registers all binds on a single ModelItem', async () => {
    const { model } = await setup(`
      <fx-bind id="b1" ref="item" constraint="true()"></fx-bind>
      <fx-bind id="b2" ref="item" required="true()"></fx-bind>`);
    const items = model.modelItems.filter(mi => mi.node.nodeName === 'item');
    expect(items.length).to.equal(1);
    expect(items[0].binds.length).to.equal(2);
  });

  it('constraint: all must be true', async () => {
    const { model } = await setup(`
      <fx-bind ref="item" constraint="string-length(.) &gt; 0"></fx-bind>
      <fx-bind ref="item" constraint="string-length(.) &lt; 3"></fx-bind>`);
    const mi = model.modelItems.find(m => m.node.nodeName === 'item');
    expect(mi.constraint).to.be.true;

    mi.node.textContent = 'toolong';
    model.revalidate();
    expect(mi.constraint).to.be.false;

    mi.node.textContent = '';
    model.revalidate();
    expect(mi.constraint).to.be.false;

    mi.node.textContent = 'ok';
    model.revalidate();
    expect(mi.constraint).to.be.true;
  });

  it('relevant: all must be true', async () => {
    const { model } = await setup(`
      <fx-bind ref="item" relevant="../pp = 'true'"></fx-bind>
      <fx-bind ref="item" relevant="../qq = 'true'"></fx-bind>`);
    const root = model.querySelector('fx-instance').getDefaultContext();
    const mi = model.modelItems.find(m => m.node.nodeName === 'item');
    expect(mi.relevant).to.be.false;

    root.querySelector('qq').textContent = 'true';
    await model.recalculate();
    expect(mi.relevant).to.be.true;

    root.querySelector('pp').textContent = 'false';
    await model.recalculate();
    expect(mi.relevant).to.be.false;
  });

  it('readonly: one is enough', async () => {
    const { model } = await setup(`
      <fx-bind ref="item" readonly="../pp = 'true'"></fx-bind>
      <fx-bind ref="item" readonly="../qq = 'true'"></fx-bind>`);
    const root = model.querySelector('fx-instance').getDefaultContext();
    const mi = model.modelItems.find(m => m.node.nodeName === 'item');
    expect(mi.readonly).to.be.true; // p is true

    root.querySelector('pp').textContent = 'false';
    await model.recalculate();
    expect(mi.readonly).to.be.false;

    root.querySelector('qq').textContent = 'true';
    await model.recalculate();
    expect(mi.readonly).to.be.true;
  });

  it('required: one is enough', async () => {
    const { model } = await setup(`
      <fx-bind ref="item" required="../qq = 'true'"></fx-bind>
      <fx-bind ref="item" required="../pp = 'true'"></fx-bind>`);
    const root = model.querySelector('fx-instance').getDefaultContext();
    const mi = model.modelItems.find(m => m.node.nodeName === 'item');
    model.revalidate();
    expect(mi.required).to.be.true;

    root.querySelector('pp').textContent = 'false';
    model.revalidate();
    expect(mi.required).to.be.false;
  });

  it('a required bind makes an empty node invalid even if another bind is not required', async () => {
    const { model } = await setup(`
      <fx-bind ref="item" required="false()"></fx-bind>
      <fx-bind ref="item" required="true()"></fx-bind>`, '<item></item>');
    expect(model.revalidate()).to.be.false;
  });

  it('keeps calculate readonly when another bind says readonly=false', async () => {
    const { model } = await setup(`
      <fx-bind ref="item" calculate="'calc'"></fx-bind>
      <fx-bind ref="item" readonly="false()"></fx-bind>`);
    const mi = model.modelItems.find(m => m.node.nodeName === 'item');
    expect(mi.readonly).to.be.true;
    expect(mi.value).to.equal('calc');
  });

  it('collects the alerts of all binds', async () => {
    const { model } = await setup(`
      <fx-bind ref="item" constraint="true()" alert="one"></fx-bind>
      <fx-bind ref="item" constraint="true()" alert="two"></fx-bind>`);
    const mi = model.modelItems.find(m => m.node.nodeName === 'item');
    expect(mi.alerts).to.have.members(['one', 'two']);
  });

  it('only the alerts of failing constraints are kept', async () => {
    const { model } = await setup(`
      <fx-bind ref="item" constraint="string-length(.) &gt; 1" alert="too short"></fx-bind>
      <fx-bind ref="item" constraint="string-length(.) &lt; 5" alert="too long"></fx-bind>`);
    const mi = model.modelItems.find(m => m.node.nodeName === 'item');
    mi.node.textContent = 'x';
    model.revalidate();
    expect(mi.alerts).to.deep.equal(['too short']);
    mi.node.textContent = 'xxxxxxxx';
    model.revalidate();
    expect(mi.alerts).to.deep.equal(['too long']);
  });

  it('survives a rebuild without duplicating binds', async () => {
    const { model } = await setup(`
      <fx-bind ref="item" constraint="true()"></fx-bind>
      <fx-bind ref="item" constraint="true()"></fx-bind>`);
    model.rebuild();
    const mi = model.modelItems.find(m => m.node.nodeName === 'item');
    expect(mi.binds.length).to.equal(2);
  });
});
