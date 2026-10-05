/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixtureSync, expect, waitUntil } from '@open-wc/testing';

import '../index.js';

describe('on-demand accessibility', () => {
  async function buildFixture() {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <name>Ada</name>
              <phone>123</phone>
              <fax>456</fax>
            </data>
          </fx-instance>
        </fx-model>

        <fx-group id="outer" show-icon>
          <fx-control ref="name"><label>Name</label></fx-control>
          <fx-control id="phone" ref="phone" on-demand="true"><label>Telephone</label></fx-control>
          <fx-control id="fax" ref="fax" on-demand="true"><label>Fax</label></fx-control>
        </fx-group>

        <fx-control-menu id="menu" select="#outer"><button>+</button></fx-control-menu>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    return el;
  }

  const announcer = () => document.body.querySelector('[data-fore-announcer]');

  it('gives every hide button a unique, label based name and keyboard access', async () => {
    const el = await buildFixture();
    const phone = el.querySelector('#phone .trash');
    const fax = el.querySelector('#fax .trash');
    expect(phone.getAttribute('role')).to.equal('button');
    expect(phone.getAttribute('tabindex')).to.equal('0');
    expect(phone.getAttribute('aria-label')).to.equal('Hide Telephone');
    expect(fax.getAttribute('aria-label')).to.equal('Hide Fax');
    expect(phone.querySelector('svg').getAttribute('aria-hidden')).to.equal('true');
  });

  it('hides with Enter, moves focus to the menu trigger and announces', async () => {
    const el = await buildFixture();
    const phone = el.querySelector('#phone');
    const trash = phone.querySelector('.trash');
    // a shown (value present) on-demand control is hidden again
    phone.removeAttribute('on-demand');
    trash.focus();
    expect(document.activeElement).to.equal(trash);

    trash.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await waitUntil(() => phone.getAttribute('on-demand') === 'true');
    await waitUntil(() => announcer()?.textContent === 'Telephone hidden');

    expect(phone.style.display).to.equal('none');
    expect(document.activeElement).to.equal(el.querySelector('#menu button'));
    expect(announcer().getAttribute('role')).to.equal('status');
    expect(announcer().getAttribute('aria-live')).to.equal('polite');
  });

  it('names menu entries from the control label, also for the label attribute', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model><fx-instance><data><a></a><b></b></data></fx-instance></fx-model>
        <fx-group id="g">
          <fx-control ref="a" on-demand="true" label="Alpha"></fx-control>
          <fx-control ref="b" on-demand="true" aria-label="Beta"></fx-control>
        </fx-group>
        <fx-control-menu select="#g"><button>+</button></fx-control-menu>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const items = el
      .querySelector('fx-control-menu')
      .shadowRoot.querySelectorAll('[role="menuitem"]');
    expect(Array.from(items).map(i => i.textContent)).to.deep.equal(['Alpha', 'Beta']);
  });
});
