/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixtureSync, expect } from '@open-wc/testing';

import '../index.js';

describe('required marker', () => {
  async function build() {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = '/base/resources/fore.css';
    document.head.appendChild(style);
    await new Promise(r => {
      style.onload = r;
      style.onerror = r;
    });
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance><data><name></name></data></fx-instance>
          <fx-bind ref="name" required="true()"></fx-bind>
        </fx-model>
        <fx-control ref="name"><label>Name</label><input /></fx-control>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    return { el, style };
  }

  it('gives the "*" the text alternative "required"', async () => {
    const { el, style } = await build();
    try {
      const content = getComputedStyle(el.querySelector('label'), '::after').content;
      expect(content).to.include('*');
      expect(content).to.include('required');
    } finally {
      style.remove();
    }
  });

  it('lets a project override marker and text via custom properties', async () => {
    const { el, style } = await build();
    try {
      el.style.setProperty('--fore-required-text', '"obligatoire"');
      el.style.setProperty('--fore-required-marker', '"(!)"');
      const content = getComputedStyle(el.querySelector('label'), '::after').content;
      expect(content).to.include('(!)');
      expect(content).to.include('obligatoire');
    } finally {
      style.remove();
    }
  });
});
