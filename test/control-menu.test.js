/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixtureSync, expect, waitUntil } from '@open-wc/testing';

import '../index.js';

describe('fx-control-menu Tests', () => {
  async function buildFixture() {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <greetings>hello</greetings>
              <ondemand></ondemand>
              <ondemand2></ondemand2>
            </data>
          </fx-instance>
        </fx-model>

        <fx-group id="outer">
          <fx-control ref="greetings">
            <label>Greetings</label>
          </fx-control>
          <fx-control ref="ondemand" on-demand="true">
            <label>On demand</label>
          </fx-control>
          <fx-control ref="ondemand2" on-demand="true">
            <label>optional field</label>
          </fx-control>
        </fx-group>

        <fx-control-menu id="menu" select="#outer">
          <button>+</button>
        </fx-control-menu>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    return el;
  }

  it('wires ARIA menu-button semantics on the trigger and popup', async () => {
    const el = await buildFixture();
    const controlMenu = el.querySelector('fx-control-menu');
    const button = controlMenu.querySelector('button');
    const menu = controlMenu.shadowRoot.querySelector('[role="menu"]');

    expect(menu).to.exist;
    expect(button.getAttribute('aria-haspopup')).to.equal('true');
    expect(button.getAttribute('aria-expanded')).to.equal('false');
    expect(button.hasAttribute('aria-controls')).to.be.false;
  });

  it('opens the menu on click with role=menuitem entries and a roving tabindex', async () => {
    const el = await buildFixture();
    const controlMenu = el.querySelector('fx-control-menu');
    const button = controlMenu.querySelector('button');
    const menu = controlMenu.shadowRoot.querySelector('[role="menu"]');

    button.click();

    expect(button.getAttribute('aria-expanded')).to.equal('true');
    expect(menu.classList.contains('visible')).to.be.true;

    const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
    expect(items).to.have.lengthOf(2);
    expect(items[0].getAttribute('tabindex')).to.equal('0');
    expect(items[1].getAttribute('tabindex')).to.equal('-1');
    expect(controlMenu.shadowRoot.activeElement).to.equal(items[0]);
  });

  it('moves the roving tabindex and focus with ArrowDown/ArrowUp', async () => {
    const el = await buildFixture();
    const controlMenu = el.querySelector('fx-control-menu');
    const button = controlMenu.querySelector('button');
    const menu = controlMenu.shadowRoot.querySelector('[role="menu"]');

    button.click();
    const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));

    const down = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true });
    Object.defineProperty(down, 'target', { value: items[0] });
    menu.dispatchEvent(down);

    expect(items[0].getAttribute('tabindex')).to.equal('-1');
    expect(items[1].getAttribute('tabindex')).to.equal('0');

    const up = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true });
    Object.defineProperty(up, 'target', { value: items[1] });
    menu.dispatchEvent(up);

    expect(items[0].getAttribute('tabindex')).to.equal('0');
    expect(items[1].getAttribute('tabindex')).to.equal('-1');
  });

  it('closes on Escape and restores aria-expanded to false', async () => {
    const el = await buildFixture();
    const controlMenu = el.querySelector('fx-control-menu');
    const button = controlMenu.querySelector('button');
    const menu = controlMenu.shadowRoot.querySelector('[role="menu"]');

    button.click();
    expect(menu.classList.contains('visible')).to.be.true;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(menu.classList.contains('visible')).to.be.false;
    expect(button.getAttribute('aria-expanded')).to.equal('false');
  });

  it('selecting an item activates the target control and closes the menu', async () => {
    const el = await buildFixture();
    const controlMenu = el.querySelector('fx-control-menu');
    const button = controlMenu.querySelector('button');
    const menu = controlMenu.shadowRoot.querySelector('[role="menu"]');
    const ondemandControl = el.querySelector('fx-control[ref="ondemand"]');

    expect(ondemandControl.hasAttribute('on-demand')).to.be.true;

    button.click();
    const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
    items[0].click();

    expect(menu.classList.contains('visible')).to.be.false;
    expect(button.getAttribute('aria-expanded')).to.equal('false');

    await waitUntil(
      () => !ondemandControl.hasAttribute('on-demand'),
      'ondemand control should become visible after activation',
    );
  });
});
