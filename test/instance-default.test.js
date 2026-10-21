import { html, oneEvent, fixtureSync, expect } from '@open-wc/testing';

import '../index.js';

describe('default instance', () => {
  it('is always the first instance of the model', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="first" type="html">
            <data><v>FIRST</v></data>
          </fx-instance>
          <fx-instance id="second" type="html">
            <data><v>SECOND</v></data>
          </fx-instance>
        </fx-model>
        <label id="a">{instance('default')/v}</label>
        <label id="b">{v}</label>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');

    expect(el.querySelector('#a').innerText).to.equal('FIRST');
    expect(el.querySelector('#b').innerText).to.equal('FIRST');
  });

  it('reports an error if a non-first instance uses id="default"', async () => {
    const messages = [];
    const listener = e => messages.push(e.detail);
    document.addEventListener('message', listener, true);
    const errors = [];
    const origError = console.error;
    console.error = (...args) => errors.push(args.join(' '));
    try {
      const el = await fixtureSync(html`
        <fx-fore>
          <fx-model>
            <fx-instance id="first" type="html">
              <data><v>FIRST</v></data>
            </fx-instance>
            <fx-instance id="default" type="html">
              <data><v>SECOND</v></data>
            </fx-instance>
          </fx-model>
        </fx-fore>
      `);
      await oneEvent(el, 'refresh-done');
    } finally {
      console.error = origError;
      document.removeEventListener('message', listener, true);
    }

    expect(errors, 'console.error calls').to.have.length.greaterThan(0);
    expect(errors.some(m => m.includes('not the first fx-instance')), 'error text').to.be.true;
    expect(messages.some(m => m?.level === 'error'), 'message event').to.be.true;
  });
});
