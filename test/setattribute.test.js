/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, elementUpdated, oneEvent } from '@open-wc/testing';

import '../index.js';
import * as fx from 'fontoxpath';

describe('setattribute tests', () => {
  it('creates attribute', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <!-- inline xml instance -->
          <fx-instance>
            <data>
              <value></value>
            </data>
          </fx-instance>
        </fx-model>

        <section>
          <fx-trigger>
            <button>Create an attribute 'type' with value 'myType'</button>
            <fx-setattribute ref="value" name="type" value="myType"></fx-setattribute>
          </fx-trigger>
          <div>{value/@type}</div>
        </section>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');

    const button = el.querySelector('button');
    button.click();
    await oneEvent(el, 'refresh-done');

    const div = el.querySelector('div');

    expect(div.innerText).to.equal('myType');
  });
  it('switch nonrelevant after attr creation', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <!-- inline xml instance -->
          <fx-instance>
            <data>
              <value></value>
            </data>
          </fx-instance>
        </fx-model>

        <section>
          <fx-trigger>
            <button>Create an attribute 'type' with value 'myType'</button>
            <fx-setattribute ref="value" name="type" value="myType"></fx-setattribute>
          </fx-trigger>
          <div>{value/@type}</div>

          <fx-output ref="value/@type"></fx-output>
        </section>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');

    const button = el.querySelector('button');
    button.click();
    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('fx-output');
    expect(output.value).to.equal('myType');
  });
});
