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
          <fx-instance type="html">
            <data>
              <value></value>
            </data>
          </fx-instance>
        </fx-model>

        <section>
          <fx-trigger>
            <button>Create an attribute 'type' with value 'myType'</button>
            <fx-setattribute ref="value" name="type" value="'myType'"></fx-setattribute>
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
          <fx-instance type="html">
            <data>
              <value></value>
            </data>
          </fx-instance>
        </fx-model>

        <section>
          <fx-trigger>
            <button>Create an attribute 'type' with value 'myType'</button>
            <fx-setattribute ref="value" name="type" value="'myType'"></fx-setattribute>
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

  it('evaluates value as an XPath expression', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data>
              <value>abc</value>
              <origin>from-data</origin>
            </data>
          </fx-instance>
        </fx-model>

        <section>
          <fx-trigger>
            <button>set</button>
            <fx-setattribute ref="value" name="copy" value="../origin"></fx-setattribute>
            <fx-setattribute ref="value" name="len" value="string-length(../origin)"></fx-setattribute>
            <fx-setattribute ref="value" name="lit" value="'plain'"></fx-setattribute>
            <fx-setattribute ref="value" name="empty" value=""></fx-setattribute>
          </fx-trigger>
        </section>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');

    el.querySelector('button').click();
    await oneEvent(el, 'refresh-done');
    // all four actions run in sequence; the first refresh-done only covers the first one
    await new Promise(resolve => setTimeout(resolve, 100));

    const node = el.getModel().getDefaultInstance().getDefaultContext().querySelector('value');
    expect(node.getAttribute('copy')).to.equal('from-data');
    expect(node.getAttribute('len')).to.equal('9');
    expect(node.getAttribute('lit')).to.equal('plain');
    expect(node.getAttribute('empty')).to.equal('');
  });
});
