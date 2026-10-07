/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent, waitUntil } from '@open-wc/testing';

import '../index.js';

describe('fx-upload label', () => {
  it('shows the label attribute, also when it is a template evaluated after rendering', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance src="/base/test/data/predicate-repeat.xml"></fx-instance>
          <fx-instance type="json" id="lang">{"label": "Attachment"}</fx-instance>
        </fx-model>
        <fx-upload id="up" ref="item[1]/v" label="{instance('lang')?label}"></fx-upload>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const upload = el.querySelector('#up');
    const shown = () => upload.shadowRoot.querySelector('.upload-label').textContent;
    await waitUntil(() => shown() === 'Attachment');

    upload.setAttribute('label', 'Plain');
    expect(shown()).to.equal('Plain');
  });
});
