/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

const fore = staticAttr => html`
  <fx-fore>
    <fx-model>
      <fx-instance type="html"><data><x>1</x></data></fx-instance>
      <fx-instance id="lang" type="json" ?static=${staticAttr} src="/base/test/data-src-lang-de.json"></fx-instance>
      <fx-bind ref="x" calculate="1 + 1"></fx-bind>
      <fx-submission
        id="s-lang"
        method="get"
        url="/base/test/data-src-lang-en.json"
        serialization="none"
        validate="false"
        replace="instance"
        instance="lang"
      ></fx-submission>
    </fx-model>
    <fx-output ref="x"></fx-output>
  </fx-fore>
`;

describe('fx-instance static', () => {
  it('replacing a static instance skips the model update cycle', async () => {
    const el = fixtureSync(fore(true));
    await oneEvent(el, 'refresh-done');
    const model = el.getModel();
    const before = model.debugInfo.updateModelCount;
    await el.querySelector('#s-lang').submit();
    expect(model.debugInfo.updateModelCount).to.equal(before);
  });

  it('replacing a non-static instance runs the model update cycle', async () => {
    const el = fixtureSync(fore(false));
    await oneEvent(el, 'refresh-done');
    const model = el.getModel();
    const before = model.debugInfo.updateModelCount;
    await el.querySelector('#s-lang').submit();
    expect(model.debugInfo.updateModelCount).to.be.above(before);
  });

  it('the default instance is never treated as static', async () => {
    const el = fixtureSync(fore(false));
    await oneEvent(el, 'refresh-done');
    const model = el.getModel();
    model.instances[0].setAttribute('static', '');
    expect(model.isInstanceUsedByBinds(model.instances[0].id)).to.be.true;
  });
});
