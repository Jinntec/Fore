/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';
import * as fx from 'fontoxpath';

// Verifies that multi-step refs like "cac:TaxCategory/cbc:ID" create
// intermediate modelItems and can be targeted by actions/controls.
// Pattern mirrors the existing setattribute test.

describe('multi-step refs', () => {
  it('updates output inside a group bound to an intermediate step', async () => {
    const el = await fixtureSync(html`
      <fx-fore
        xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
        xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
        xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
      >
        <fx-model>
          <fx-instance src="/base/test/data/ubl.xml"> </fx-instance>
        </fx-model>

        <section>
          <!-- bind context to the intermediate step -->
          <fx-group ref="cac:TaxCategory">
            <fx-output id="idOut" ref="cbc:ID"></fx-output>
          </fx-group>

          <!-- set value through a multi-step ref -->
          <fx-trigger>
            <button>set</button>
            <fx-setvalue ref="cac:TaxCategory/cbc:ID">VAT</fx-setvalue>
          </fx-trigger>
        </section>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');

    const button = el.querySelector('button');
    button.click();
    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#idOut');
    expect(output.value).to.equal('VAT');
  });

  it('also resolves a control bound directly to the full multi-step ref', async () => {
    const el = await fixtureSync(html`
      <fx-fore
        xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
        xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
        xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
      >
        <fx-model>
          <fx-instance src="/base/test/data/ubl.xml"> </fx-instance>
        </fx-model>

        <section>
          <fx-control ref="cac:TaxCategory/cbc:ID">
            <label>ID</label>
            <input class="widget" />
          </fx-control>

          <fx-trigger>
            <button>set</button>
            <fx-setvalue ref="cac:TaxCategory/cbc:ID">ABC</fx-setvalue>
          </fx-trigger>

          <fx-output id="directOut" ref="cac:TaxCategory/cbc:ID"></fx-output>
        </section>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');

    const button = el.querySelector('button');
    button.click();
    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#directOut');
    expect(output.value).to.equal('ABC');
  });

  it('works within repeat resolves a control bound directly to the full multi-step ref', async () => {
    const el = await fixtureSync(html`
      <fx-fore
        xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
        xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
        xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
      >
        <fx-model>
          <fx-instance src="/base/test/data/ubl.xml"> </fx-instance>
        </fx-model>

        <section>
          <fx-control ref="cac:TaxCategory/cbc:ID">
            <label>ID</label>
            <input class="widget" />
          </fx-control>

          <fx-trigger>
            <button>set</button>
            <fx-setvalue ref="cac:TaxCategory/cbc:ID">ABC</fx-setvalue>
          </fx-trigger>

          <fx-output id="directOut" ref="cac:TaxCategory/cbc:ID"></fx-output>
        </section>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');

    const button = el.querySelector('button');
    button.click();
    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#directOut');
    expect(output.value).to.equal('ABC');
  });
});
