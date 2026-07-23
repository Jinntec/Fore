import { html, oneEvent, fixtureSync, expect } from '@open-wc/testing';

import '../index.js';

describe('recursive repeat (fx-repeat-ref) Tests', () => {
  it('renders an asymmetric-depth tree with a single template', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <node label="a">
                <node label="a1">
                  <node label="a1i">
                    <node label="a1i-x"></node>
                  </node>
                </node>
                <node label="a2"></node>
              </node>
              <node label="b"></node>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="tree" ref="node" recursive="true">
          <template>
            <li>
              <span>{@label}</span>
              <ul>
                <fx-repeat-ref></fx-repeat-ref>
              </ul>
            </li>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const items = el.querySelectorAll('fx-repeatitem');
    expect(items.length).to.equal(6);

    const labels = Array.from(items).map(item => item.querySelector(':scope > li > span')?.textContent);
    expect(labels).to.include.members(['a', 'a1', 'a1i', 'a1i-x', 'a2', 'b']);
  });

  it('terminates at a leaf: its synthesized nested repeat renders zero items', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <node label="a">
                <node label="a1"></node>
              </node>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="tree" ref="node" recursive="true">
          <template>
            <li>
              <span>{@label}</span>
              <ul>
                <fx-repeat-ref></fx-repeat-ref>
              </ul>
            </li>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    // No <fx-repeat-ref> should survive anywhere - every one synthesizes itself away.
    expect(el.querySelectorAll('fx-repeat-ref').length).to.equal(0);

    const items = el.querySelectorAll('fx-repeatitem');
    expect(items.length).to.equal(2);

    const leafItem = Array.from(items).find(
      item => item.querySelector(':scope > li > span')?.textContent === 'a1',
    );
    const nestedRepeat = leafItem.querySelector(':scope > li > ul > fx-repeat');
    expect(nestedRepeat).to.exist;
    expect(nestedRepeat.querySelectorAll(':scope > fx-repeatitem').length).to.equal(0);
  });

  it('deletes a mid-tree node and its whole rendered subtree, leaving siblings untouched', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <node label="a">
                <node label="a1">
                  <node label="a1i"></node>
                </node>
                <node label="a2"></node>
              </node>
              <node label="b"></node>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="tree" ref="node" recursive="true">
          <template>
            <li>
              <span>{@label}</span>
              <fx-trigger class="delete-trigger">
                <button>x</button>
                <fx-delete ref="."></fx-delete>
              </fx-trigger>
              <ul>
                <fx-repeat-ref></fx-repeat-ref>
              </ul>
            </li>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    expect(el.querySelectorAll('fx-repeatitem').length).to.equal(5);

    const a1Item = Array.from(el.querySelectorAll('fx-repeatitem')).find(
      item => item.querySelector(':scope > li > span')?.textContent === 'a1',
    );
    const deleteTrigger = a1Item.querySelector(':scope > li > fx-trigger.delete-trigger');
    await deleteTrigger.performActions();
    await oneEvent(el, 'refresh-done');

    const remainingLabels = Array.from(el.querySelectorAll('fx-repeatitem')).map(
      item => item.querySelector(':scope > li > span')?.textContent,
    );
    // a1 and its child a1i must both be gone; a, a2, b (untouched siblings) remain.
    expect(remainingLabels).to.not.include.members(['a1', 'a1i']);
    expect(remainingLabels).to.include.members(['a', 'a2', 'b']);
    expect(remainingLabels.length).to.equal(3);
  });

  it('inserting a child under a former leaf renders it via the recursive template', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <node label="a"></node>
            </data>
          </fx-instance>
          <fx-instance id="templates">
            <templates>
              <node label="new"></node>
            </templates>
          </fx-instance>
        </fx-model>
        <fx-repeat id="tree" ref="node" recursive="true">
          <template>
            <li>
              <span>{@label}</span>
              <fx-trigger class="add-trigger">
                <button>+</button>
                <fx-insertchild parent="." ref="node" origin="instance('templates')/node"></fx-insertchild>
              </fx-trigger>
              <ul>
                <fx-repeat-ref></fx-repeat-ref>
              </ul>
            </li>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    expect(el.querySelectorAll('fx-repeatitem').length).to.equal(1);

    const aItem = el.querySelector('fx-repeatitem');
    const addTrigger = aItem.querySelector(':scope > li > fx-trigger.add-trigger');
    await addTrigger.performActions();
    await oneEvent(el, 'refresh-done');

    const items = el.querySelectorAll('fx-repeatitem');
    expect(items.length).to.equal(2);
    const labels = Array.from(items).map(item => item.querySelector(':scope > li > span')?.textContent);
    expect(labels).to.include.members(['a', 'new']);
  });

  it('does not leak a spurious ModelItem for the synthesized nested <fx-repeat>', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <node label="a">
                <node label="a1"></node>
              </node>
            </data>
          </fx-instance>
          <fx-instance id="templates">
            <templates>
              <node label="new">
                <node label="new-child"></node>
              </node>
            </templates>
          </fx-instance>
        </fx-model>
        <fx-repeat id="tree" ref="node" recursive="true">
          <template>
            <li>
              <span>{@label}</span>
              <fx-trigger class="add-trigger">
                <button>+</button>
                <fx-insertchild parent="." ref="node" origin="instance('templates')/node"></fx-insertchild>
              </fx-trigger>
              <ul>
                <fx-repeat-ref></fx-repeat-ref>
              </ul>
            </li>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const model = el.querySelector('fx-model');
    const countBefore = model.modelItems.length;

    const a1Item = Array.from(el.querySelectorAll('fx-repeatitem')).find(
      item => item.querySelector(':scope > li > span')?.textContent === 'a1',
    );
    const addTrigger = a1Item.querySelector(':scope > li > fx-trigger.add-trigger');
    await addTrigger.performActions();
    await oneEvent(el, 'refresh-done');

    // The inserted subtree brings its own child along (<node label="new"> with
    // <node label="new-child"> already nested inside, per the origin template), so the
    // synthesized <fx-repeat ref="node"> wrapping "new" evaluates its ref against a real
    // match ("new-child") at insert time - the condition the FX-REPEAT exclusion guard in
    // _createModelItemsRecursively is meant to protect against (a generic ref-matching
    // walk picking up a nested repeat's own descendant instead of leaving it to that
    // repeat's own materialization). In this synchronous-construction design the nested
    // repeat's legitimate registration always wins the race by the time this walk runs,
    // so removing the guard does not currently reproduce a failure here - this asserts the
    // correct, non-duplicated end state as a sanity gate, not a proven-failing-without-it
    // regression test.
    expect(model.modelItems.length).to.equal(countBefore + 2);

    const newItem = Array.from(el.querySelectorAll('fx-repeatitem')).find(
      item => item.querySelector(':scope > li > span')?.textContent === 'new',
    );
    expect(newItem).to.exist;
    const newChildItem = newItem
      .querySelector(':scope > li > ul > fx-repeat')
      .querySelector(':scope > fx-repeatitem');
    expect(newChildItem.querySelector(':scope > li > span')?.textContent).to.equal('new-child');
  });

  it('supports an explicit ref override on <fx-repeat-ref>', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <folder name="root">
                <file name="a"></file>
                <file name="b"></file>
              </folder>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="tree" ref="folder" recursive="true">
          <template>
            <li>
              <span>{@name}</span>
              <ul>
                <fx-repeat-ref ref="file"></fx-repeat-ref>
              </ul>
            </li>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const items = el.querySelectorAll('fx-repeatitem');
    // 1 folder + 2 files, even though the outer repeat's own ref ("folder") would
    // never match <file> elements - proves the override, not the ancestor's ref, was used.
    expect(items.length).to.equal(3);
    const labels = Array.from(items).map(
      item => item.querySelector(':scope > li > span')?.textContent,
    );
    expect(labels).to.include.members(['root', 'a', 'b']);
  });

  it('scopes an <fx-var> independently per recursion depth, without cross-level collisions', async () => {
    // Regression test: <fx-repeat-ref> synthesizes and fully materializes its nested
    // <fx-repeat> synchronously, inside the connectedCallback cascade triggered by the
    // ancestor's own insertBefore() - which runs *before* the ancestor's _initVariables()
    // walk. That walk used to recurse straight through the (already fully rendered)
    // nested repeat, registering the same variable name from every recursion depth into
    // one shared scope map and making fx-var dispatch 'binding-error' ("declared more
    // than once") for every node past the first.
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <node label="a">
                <node label="a1">
                  <node label="a1i"></node>
                </node>
              </node>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="tree" ref="node" recursive="true">
          <template>
            <li>
              <fx-var name="own" value="@label"></fx-var>
              <span class="direct">{@label}</span>
              <span class="via-var">{$own}</span>
              <ul>
                <fx-repeat-ref></fx-repeat-ref>
              </ul>
            </li>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    // registration happens during async init - listen before refresh-done, same as the
    // "declared twice" shadowing test in var.test.js.
    let bindingError = false;
    el.addEventListener('binding-error', () => {
      bindingError = true;
    });

    await oneEvent(el, 'refresh-done');

    expect(bindingError).to.be.false;

    const items = el.querySelectorAll('fx-repeatitem');
    expect(items.length).to.equal(3);
    // Every level must resolve $own to *its own* node's label, not a neighboring depth's.
    items.forEach(item => {
      const direct = item.querySelector(':scope > li > span.direct')?.textContent;
      const viaVar = item.querySelector(':scope > li > span.via-var')?.textContent;
      expect(viaVar).to.equal(direct);
    });
  });
});
