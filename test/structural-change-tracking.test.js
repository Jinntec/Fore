/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent, waitUntil } from '@open-wc/testing';

import '../index.js';

/**
 * Phase 2 — structural-change consumer.
 *
 * Structural producers (fx-insert, fx-delete, fx-append, fx-setattribute) call
 * signalChangeToElement(localName). The partial-refresh path consumes those signals
 * and refreshes [ref] elements whose expressions may be affected
 * (DependentXPathQueries.isInvalidatedByChildlistChanges). This covers changes that
 * node-level observation cannot see: deleted rows and attributes that did not exist
 * when the ref was last evaluated.
 */
describe('structural change tracking', () => {
  it('updates an aggregate fx-output when fx-delete removes a matched row', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="data">
            <data>
              <item keep="true">a</item>
              <item keep="true">b</item>
              <item keep="true">c</item>
            </data>
          </fx-instance>
        </fx-model>
        <fx-output id="kept" ref="count(instance('data')/item[@keep='true'])"></fx-output>
        <fx-trigger id="del">
          <button></button>
          <fx-delete ref="instance('data')/item[2]"></fx-delete>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#kept');
    expect(String(output.value)).to.equal('3');

    const trigger = el.querySelector('#del');
    await trigger.performActions();

    await waitUntil(() => String(output.value) === '2', 'aggregate output updates after delete');
  });

  it('updates an aggregate fx-output when fx-setattribute creates a new attribute', async () => {
    // The predicate reads @keep, but no item carries the attribute yet — the facade
    // only reports existing attributes, so no observer covers the future attribute
    // node. Only the structural signal from fx-setattribute reaches the output.
    // concat() keeps the nodeset truthy when the count is 0 (a bare numeric 0 result
    // is collapsed to null by evalInContext and marks the output nonrelevant).
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="data">
            <data>
              <item>a</item>
              <item>b</item>
            </data>
          </fx-instance>
        </fx-model>
        <fx-output
          id="kept"
          ref="concat(count(instance('data')/item[@keep='true']), ' kept')"
        ></fx-output>
        <fx-trigger id="mark">
          <button></button>
          <fx-setattribute
            ref="instance('data')/item[1]"
            name="keep"
            value="true"
          ></fx-setattribute>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#kept');
    expect(String(output.value)).to.equal('0 kept');

    const trigger = el.querySelector('#mark');
    await trigger.performActions();

    await waitUntil(
      () => String(output.value) === '1 kept',
      'aggregate output updates after first-time attribute creation',
    );
  });

  it('updates an aggregate fx-output when fx-insert adds a row before the first', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="data">
            <data>
              <item>a</item>
              <item>b</item>
            </data>
          </fx-instance>
        </fx-model>
        <fx-output id="total" ref="count(instance('data')/item)"></fx-output>
        <fx-trigger id="grow">
          <button></button>
          <fx-insert ref="instance('data')/item" at="1" position="before"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#total');
    expect(String(output.value)).to.equal('2');

    const trigger = el.querySelector('#grow');
    await trigger.performActions();

    await waitUntil(() => String(output.value) === '3', 'aggregate output updates after insert');
  });

  it('consumes pending structural signals so they do not leak into later refreshes', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="data">
            <data>
              <item keep="true">a</item>
            </data>
          </fx-instance>
        </fx-model>
        <fx-output
          id="kept"
          ref="concat(count(instance('data')/item[@keep='true']), ' kept')"
        ></fx-output>
        <fx-trigger id="del">
          <button></button>
          <fx-delete ref="instance('data')/item[1]"></fx-delete>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const trigger = el.querySelector('#del');
    await trigger.performActions();

    const output = el.querySelector('#kept');
    await waitUntil(() => String(output.value) === '0 kept', 'aggregate output updates');

    expect(el._localNamesWithChanges.size, 'signal set drained').to.equal(0);
  });
});
