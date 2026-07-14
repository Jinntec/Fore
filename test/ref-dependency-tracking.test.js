/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent, waitUntil } from '@open-wc/testing';

import '../index.js';

/**
 * Phase 1 — generic ref-dependency tracking.
 *
 * Raw ref expressions with predicates or function calls read nodes the element never
 * binds to. Those evaluations run through a DependencyNotifyingDomFacade and register
 * the element as observer on every touched node's ModelItem, so a plain data change
 * (fx-setvalue, no forced refresh) updates the element.
 */
describe('ref dependency tracking', () => {
  it('updates an aggregate fx-output when a predicate dependency changes', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="data">
            <data>
              <item keep="true">a</item>
              <item keep="true">b</item>
              <item keep="false">c</item>
            </data>
          </fx-instance>
        </fx-model>
        <fx-output id="kept" ref="count(instance('data')/item[@keep='true'])"></fx-output>
        <fx-trigger id="toggle">
          <button></button>
          <fx-setvalue ref="instance('data')/item[3]/@keep">true</fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#kept');
    expect(String(output.value)).to.equal('2');

    const trigger = el.querySelector('#toggle');
    await trigger.performActions();

    // the batched-notification drain refreshes the output asynchronously
    await waitUntil(() => String(output.value) === '3', 'aggregate output updates');
  });

  it('updates repeatitem count of a bare predicate fx-repeat without fx-bind', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="data">
            <data>
              <item keep="true">a</item>
              <item keep="true">b</item>
              <item keep="false">c</item>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="rep" ref="instance('data')/item[@keep='true']">
          <template>
            <fx-output ref="."></fx-output>
          </template>
        </fx-repeat>
        <fx-trigger id="toggle">
          <button></button>
          <fx-setvalue ref="instance('data')/item[3]/@keep">true</fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const repeat = el.querySelector('#rep');
    expect(repeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(2);

    const trigger = el.querySelector('#toggle');
    await trigger.performActions();

    await waitUntil(
      () => repeat.querySelectorAll(':scope > fx-repeatitem').length === 3,
      'repeat grows by one item',
    );
  });

  it('tracks a predicated widget ref in the widget bucket and rebuilds the list', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <selected></selected>
            </data>
          </fx-instance>
          <fx-instance id="opts">
            <data>
              <opt active="true">one</opt>
              <opt active="false">two</opt>
            </data>
          </fx-instance>
        </fx-model>
        <fx-control id="ctrl" ref="selected" update-event="input">
          <select class="widget" ref="instance('opts')/opt[@active='true']">
            <template>
              <option value="{.}">{.}</option>
            </template>
          </select>
        </fx-control>
        <fx-trigger id="activate">
          <button></button>
          <fx-setvalue ref="instance('opts')/opt[2]/@active">true</fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('#ctrl');
    const widgetDeps = control._refTrackedModelItems.get('widget');
    expect(widgetDeps, 'widget bucket is tracked').to.exist;
    expect(widgetDeps.size).to.be.greaterThan(0);
    widgetDeps.forEach(mi => expect(mi.observers.has(control)).to.be.true);

    expect(el.querySelectorAll('#ctrl option').length).to.equal(1);

    const trigger = el.querySelector('#activate');
    await trigger.performActions();

    // the control's forced refresh runs asynchronously in the batched drain
    await waitUntil(
      () => el.querySelectorAll('#ctrl option').length === 2,
      'option list rebuilds with the newly active option',
    );
  });

  it('does not unregister widget-bucket observers when the ref bucket re-evaluates', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <selected></selected>
            </data>
          </fx-instance>
          <fx-instance id="opts">
            <data>
              <opt active="true">one</opt>
              <opt active="false">two</opt>
            </data>
          </fx-instance>
        </fx-model>
        <fx-control id="ctrl" ref="selected" update-event="input">
          <select class="widget" ref="instance('opts')/opt[@active='true']">
            <template>
              <option value="{.}">{.}</option>
            </template>
          </select>
        </fx-control>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('#ctrl');
    const widgetDeps = control._refTrackedModelItems.get('widget');
    expect(widgetDeps.size).to.be.greaterThan(0);

    // Re-track the 'ref' bucket with an empty set — must not touch the widget bucket
    control._trackRefDependencies(new Set(), 'ref');

    expect(control._refTrackedModelItems.get('widget')).to.equal(widgetDeps);
    widgetDeps.forEach(mi => expect(mi.observers.has(control)).to.be.true);
  });

  it('does not track plain single-node refs', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <value>A</value>
            </data>
          </fx-instance>
        </fx-model>
        <fx-output id="out" ref="value"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#out');
    expect(output._refTrackedModelItems.size).to.equal(0);
  });

  it('tracks dependencies across instances (per-node instance resolution)', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="a">
            <data>
              <item>1</item>
            </data>
          </fx-instance>
          <fx-instance id="b">
            <data>
              <item>1</item>
              <item>2</item>
            </data>
          </fx-instance>
        </fx-model>
        <fx-output
          id="total"
          ref="count(instance('a')/item) + count(instance('b')/item)"
        ></fx-output>
        <fx-trigger id="grow">
          <button></button>
          <fx-insert ref="instance('b')/item"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#total');
    expect(String(output.value)).to.equal('3');

    const tracked = output._refTrackedModelItems.get('ref');
    expect(tracked, 'ref bucket is tracked').to.exist;
    const instanceIds = new Set(Array.from(tracked).map(mi => mi.instanceId));
    expect(instanceIds.has('a'), 'tracks nodes of instance a').to.be.true;
    expect(instanceIds.has('b'), 'tracks nodes of instance b').to.be.true;
  });

  it('removes stale observers when the touched-node set shrinks', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="data">
            <data>
              <item keep="true">a</item>
              <item keep="true">b</item>
            </data>
          </fx-instance>
        </fx-model>
        <fx-output id="kept" ref="count(instance('data')/item[@keep='true'])"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#kept');
    const doc = el.querySelector('fx-instance').getInstanceData();
    const [item1, item2] = Array.from(doc.querySelectorAll('item'));

    output._trackRefDependencies(new Set([item1, item2]));
    const model = el.querySelector('fx-model');
    const mi1 = model.getModelItem(item1);
    const mi2 = model.getModelItem(item2);
    expect(mi1.observers.has(output)).to.be.true;
    expect(mi2.observers.has(output)).to.be.true;

    output._trackRefDependencies(new Set([item1]));
    expect(mi1.observers.has(output)).to.be.true;
    expect(mi2.observers.has(output), 'stale observer removed').to.be.false;
  });

  it('removes all tracked observers on disconnect', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="data">
            <data>
              <item keep="true">a</item>
              <item keep="false">b</item>
            </data>
          </fx-instance>
        </fx-model>
        <fx-output id="kept" ref="count(instance('data')/item[@keep='true'])"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#kept');
    const tracked = Array.from(output._refTrackedModelItems.get('ref') ?? []);
    expect(tracked.length).to.be.greaterThan(0);

    output.remove();

    expect(output._refTrackedModelItems.size).to.equal(0);
    tracked.forEach(mi => expect(mi.observers.has(output)).to.be.false);
  });

  it('JSON checkpoint: gated refs over JSON lens contexts stay on forced refresh', async () => {
    // Known limitation (documented): fontoxpath cannot navigate JSON lens nodes —
    // real JSON traffic uses the custom `?key` lookup branches, which bypass facades.
    // A gated ref over a JSON context must not throw and must not register tracking.
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="json">
            { "items": [ { "keep": true }, { "keep": false } ] }
          </fx-instance>
        </fx-model>
        <fx-output id="out" ref="count($default?items?*)"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#out');
    // no XML-style tracking materialized for lookup-based JSON refs
    const tracked = output._refTrackedModelItems.get('ref');
    expect(!tracked || tracked.size === 0, 'JSON lookup refs are untracked').to.be.true;
  });

  it('keeps modelItems[] and both index maps consistent under heavy lazy creation', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="data">
            <data>
              <item keep="true">a</item>
              <item keep="true">b</item>
              <item keep="false">c</item>
              <item keep="false">d</item>
              <item keep="true">e</item>
            </data>
          </fx-instance>
        </fx-model>
        <fx-output id="kept" ref="count(instance('data')/item[@keep='true'])"></fx-output>
        <fx-repeat id="rep" ref="instance('data')/item[@keep='true']">
          <template>
            <fx-output ref="."></fx-output>
          </template>
        </fx-repeat>
        <fx-trigger id="toggle">
          <button></button>
          <fx-setvalue ref="instance('data')/item[3]/@keep">true</fx-setvalue>
          <fx-setvalue ref="instance('data')/item[4]/@keep">true</fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const trigger = el.querySelector('#toggle');
    await trigger.performActions();

    const output = el.querySelector('#kept');
    await waitUntil(() => String(output.value) === '5', 'aggregate reflects both toggles');

    const model = el.querySelector('fx-model');
    // aggregate refs evaluating to atomic values create pathless ModelItems keyed by
    // the value (pre-existing legacy behavior) — the path index only covers node-backed
    // ModelItems, so consistency is asserted for those
    const pathed = model.modelItems.filter(mi => mi.path);
    expect(model._modelItemsByPath.size).to.equal(pathed.length);
    pathed.forEach(mi => {
      expect(model.getModelItem(mi.path)).to.equal(mi);
      expect(model.getModelItem(mi.node)).to.equal(mi);
      expect(model._modelItemsByPath.get(mi.path)).to.equal(mi);
      expect(model._modelItemsByKey.get(mi.node)).to.equal(mi);
    });
  });
});
