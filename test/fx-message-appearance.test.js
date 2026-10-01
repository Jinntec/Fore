/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, elementUpdated } from '@open-wc/testing';

import '../index.js';
import { FxFore } from '../src/fx-fore.js';

describe('fx-message appearance', () => {
  async function setup() {
    const el = fixtureSync(html`<fx-fore></fx-fore>`);
    await elementUpdated(el);
    const calls = [];
    ['message', 'sticky', 'error', 'warn'].forEach(id => {
      const toast = el.shadowRoot.querySelector(`#${id}`);
      toast.showToast = (text, options) => calls.push({ id, text, options });
    });
    return { el, calls };
  }

  it('passes no options without an appearance', async () => {
    const { el, calls } = await setup();
    el._showMessage('ephemeral', 'hi', null);
    expect(calls).to.deep.equal([{ id: 'message', text: 'hi', options: {} }]);
  });

  it('toast adds only the appearance class', async () => {
    const { el, calls } = await setup();
    el._showMessage('ephemeral', 'hi', 'toast');
    expect(calls[0].options).to.deep.equal({ className: 'appearance-toast' });
  });

  it('banner is a top, full-width bar with a close button, on the toast of the level', async () => {
    const { el, calls } = await setup();
    el._showMessage('sticky', 'hi', 'banner');
    expect(calls[0].id).to.equal('sticky');
    expect(calls[0].options).to.deep.equal({
      gravity: 'top',
      position: 'center',
      close: true,
      className: 'appearance-banner',
    });
  });

  it('an unknown appearance warns and falls back to the default look', async () => {
    const { el, calls } = await setup();
    const warn = console.warn;
    const warnings = [];
    console.warn = (...args) => warnings.push(args.join(' '));
    try {
      el._showMessage('ephemeral', 'hi', 'nope');
    } finally {
      console.warn = warn;
    }
    expect(calls[0].options).to.deep.equal({});
    expect(warnings.join()).to.include("unknown appearance 'nope'");
  });

  it('registers custom appearances', async () => {
    FxFore.registerMessageAppearance('corner', { gravity: 'bottom', position: 'right' });
    const { el, calls } = await setup();
    el._showMessage('ephemeral', 'hi', 'corner');
    expect(calls[0].options).to.deep.equal({
      gravity: 'bottom',
      position: 'right',
      className: 'appearance-corner',
    });
    delete FxFore.messageAppearances.corner;
  });

  it('fx-message passes its appearance through the message event', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-message id="m" appearance="banner">Hello</fx-message>
      </fx-fore>
    `);
    await elementUpdated(el);
    const seen = [];
    el.addEventListener('message', e => seen.push(e.detail), { capture: true });
    await document.getElementById('m').perform();
    expect(seen[0].appearance).to.equal('banner');
    expect(seen[0].level).to.equal('ephemeral');
  });
});
