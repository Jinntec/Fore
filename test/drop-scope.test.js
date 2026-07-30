import { html, oneEvent, fixtureSync, expect } from '@open-wc/testing';

import '../index.js';

describe('drop-scope Tests', () => {
  it('drop-scope="parent" distinguishes real data parentage across structurally identical nested repeats', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <group name="A">
                <item name="A1"></item>
                <item name="A2"></item>
              </group>
              <group name="B">
                <item name="B1"></item>
              </group>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="groups" ref="group">
          <template>
            <fx-repeat id="items" ref="item">
              <template drop-scope="parent">
                <span>{@name}</span>
              </template>
            </fx-repeat>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const itemRepeats = Array.from(el.querySelectorAll('fx-repeat#items'));
    expect(itemRepeats.length).to.equal(2);

    const [groupARepeat, groupBRepeat] = itemRepeats;
    const [a1, a2] = groupARepeat.querySelectorAll(':scope > fx-repeatitem');
    const [b1] = groupBRepeat.querySelectorAll(':scope > fx-repeatitem');

    // Same real parent (<group name="A">): same drop scope.
    expect(a1._sameDropScope(a2)).to.be.true;
    // Different real parent (<group name="A"> vs <group name="B">), despite both
    // item-repeats sharing the literal id="items": different drop scope.
    expect(a1._sameDropScope(b1)).to.be.false;
  });

  it('without drop-scope, falls back to today\'s id-string-equality scoping', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <group name="A">
                <item name="A1"></item>
              </group>
              <group name="B">
                <item name="B1"></item>
              </group>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="groups" ref="group">
          <template>
            <fx-repeat id="items" ref="item">
              <template>
                <span>{@name}</span>
              </template>
            </fx-repeat>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const itemRepeats = Array.from(el.querySelectorAll('fx-repeat#items'));
    const [groupARepeat, groupBRepeat] = itemRepeats;
    const [a1] = groupARepeat.querySelectorAll(':scope > fx-repeatitem');
    const [b1] = groupBRepeat.querySelectorAll(':scope > fx-repeatitem');

    // Both item-repeats share the literal id="items" - without an opt-in drop-scope,
    // they are (today, intentionally - see demo/kanban.html) treated as the same scope.
    expect(a1._sameDropScope(b1)).to.be.true;
  });
});
