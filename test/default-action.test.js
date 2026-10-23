import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

describe('default-action attribute', () => {
  async function actionWith(attrs) {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data><value>A</value></data>
          </fx-instance>
        </fx-model>
        <fx-control ref="value"></fx-control>
        <fx-message id="msg"></fx-message>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const action = el.querySelector('#msg');
    Object.entries(attrs).forEach(([name, value]) => action.setAttribute(name, value));
    action.connectedCallback();
    return action;
  }

  it('defaults to perform', async () => {
    const action = await actionWith({});
    expect(action.defaultAction).to.equal('perform');
  });

  it('accepts the kebab-case spelling', async () => {
    const action = await actionWith({ 'default-action': 'cancel' });
    expect(action.defaultAction).to.equal('cancel');
  });

  it('still accepts the legacy camelCase spelling', async () => {
    const action = await actionWith({ defaultAction: 'cancel' });
    expect(action.defaultAction).to.equal('cancel');
  });

  it('prefers default-action when both are given', async () => {
    const action = await actionWith({ 'default-action': 'perform', defaultAction: 'cancel' });
    expect(action.defaultAction).to.equal('perform');
  });
});
