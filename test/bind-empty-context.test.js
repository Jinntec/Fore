import { fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

/**
 * A nested fx-bind whose parent bind has an empty nodeset has an empty in-scope context. Its ref
 * must resolve to an empty nodeset instead of being evaluated against an undefined context, which
 * raises XPDY0002 ('context is absent').
 *
 * This happens with create-nodes: the parent bind of an implicitly created node keeps its stale,
 * empty nodeset while the bind of the explicitly created child is re-evaluated.
 *
 * Refs are prefixed on purpose: plain names take a shortcut that never evaluates XPath.
 */
async function setup() {
  const el = fixtureSync(`
    <fx-fore xmlns:cbc="urn:test:cbc">
      <fx-model>
        <fx-instance src="/base/test/data/bind-empty-context.xml"></fx-instance>
        <fx-bind ref="cbc:p">
          <fx-bind ref="cbc:q" required="true()"><fx-bind ref="@id"></fx-bind></fx-bind>
        </fx-bind>
      </fx-model>
    </fx-fore>
  `);
  await oneEvent(el, 'ready');
  const parent = el.querySelector('fx-bind[ref="cbc:p"]');
  const child = el.querySelector('fx-bind[ref="cbc:q"]');
  const grandChild = el.querySelector('fx-bind[ref="@id"]');

  // binds report evaluation errors as events on themselves
  const errors = [];
  [parent, child, grandChild].forEach(bind =>
    bind.addEventListener('error', e => errors.push(e.detail?.message)),
  );
  return { parent, child, grandChild, errors };
}

describe('bind: empty in-scope context', () => {
  it('child bind of a parent bind with an empty nodeset resolves to an empty nodeset', async () => {
    const { parent, child, errors } = await setup();
    expect(child.nodeset.length).to.equal(1);

    parent.nodeset = [];
    child.evalInContext();

    expect(child.nodeset).to.deep.equal([]);
    expect(errors).to.deep.equal([]);
  });

  it('applies to grandchildren as well (attribute refs)', async () => {
    const { child, grandChild, errors } = await setup();

    child.nodeset = [];
    grandChild.evalInContext();

    expect(grandChild.nodeset).to.deep.equal([]);
    expect(errors).to.deep.equal([]);
  });

  it('keeps resolving against a non-empty parent nodeset', async () => {
    const { child, errors } = await setup();
    child.evalInContext();
    expect(child.nodeset.length).to.equal(1);
    expect(child.nodeset[0].textContent).to.equal('x');
    expect(errors).to.deep.equal([]);
  });
});
