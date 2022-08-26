import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

describe('Relevance Tests', () => {
  it('does not display control whose xml binding does not exist', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="default">
            <data></data>
          </fx-instance>
        </fx-model>

        <fx-control ref="item">
          <label>should not be displayed</label>
        </fx-control>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-control');
    expect(control.style.display).to.equal('none');
  });

  it('does not display output whose xml binding does not exist', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="default">
            <data></data>
          </fx-instance>
        </fx-model>

        <fx-output ref="item">
          <label>should not be displayed</label>
        </fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-output');
    expect(control.style.display).to.equal('none');
  });

  it('does not display trigger whose xml binding does not exist', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="default">
            <data></data>
          </fx-instance>
        </fx-model>

        <fx-trigger ref="item">
          <button>should not be displayed</button>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-trigger');
    expect(control.style.display).to.equal('none');
  });

  it('does not display control whose json binding does not exist', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="default" type="json">{}</fx-instance>
        </fx-model>

        <fx-control ref="?item">
          <label>should not be displayed</label>
        </fx-control>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-control');
    expect(control.style.display).to.equal('none');
  });

  it('does not display output whose json binding does not exist', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="default" type="json">{}</fx-instance>
        </fx-model>

        <fx-output ref="?item">
          <label>should not be displayed</label>
        </fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-output');
    expect(control.style.display).to.equal('none');
  });

  it('does not display trigger whose json binding does not exist', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="default" type="json">{}</fx-instance>
        </fx-model>

        <fx-trigger ref="?item">
          <button>should not be displayed</button>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-trigger');
    expect(control.style.display).to.equal('none');
  });

});
