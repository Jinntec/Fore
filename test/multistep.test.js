/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

describe('multi-step refs', () => {
  it('creates modelitems for repeat correct initially', async () => {
    const el = await fixtureSync(html`
      <fx-fore
        create-nodes="create-nodes"
        id="fx-invoice"
        xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
        xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
      >
        <fx-model>
          <fx-instance src="/base/test/data/ubl-empty.xml"></fx-instance>
          <fx-instance id="untdid-5305" src="/base/test/data/UNTDID-5305-3.xml"></fx-instance>
        </fx-model>

        <fx-group id="outer" ref=".">
          <section class="repeat-container" id="BG-20">
            <header>
              DOCUMENT LEVEL ALLOWANCES
              <fx-trigger>
                <button>add</button>
                <fx-insert origin="#r-BG-20" ref="cac:AllowanceCharge"></fx-insert>
              </fx-trigger>
            </header>
            <fx-repeat id="r-BG-20" ref="cac:AllowanceCharge">
              <template>
                <fx-control id="BT-95" ref="cac:TaxCategory/cbc:ID">
                  <label for="BT-95">Document level allowance VAT category code</label>
                  <select
                    class="widget"
                    id="BT-95"
                    ref="instance('untdid-5305')//Row"
                    selection="open"
                  >
                    <template>
                      <option title="{Value[3]/SimpleValue}" value="{Value[1]/SimpleValue}">
                        {Value[2]/SimpleValue}
                      </option>
                    </template>
                  </select>
                </fx-control>
                <fx-control id="BT-96" ref="cac:TaxCategory/cbc:Percent">
                  <label for="BT-96">Document level allowance VAT rate</label>
                  <input type="number"
                /></fx-control>

                <fx-trigger>
                  <button>delete</button>
                  <fx-delete ref="."></fx-delete>
                </fx-trigger>
              </template>
            </fx-repeat>
          </section>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');
    expect(el.getModel().modelItems.length).to.equal(4);

    expect(el.getModel().getModelItem('$default/AllowanceCharge[1]')).to.exist;
    expect(el.getModel().getModelItem('$default/AllowanceCharge[1]/TaxCategory[1]/ID[1]')).to.exist;
    expect(el.getModel().getModelItem('$default/AllowanceCharge[1]/TaxCategory[2]/Percent[1]')).to
      .exist;
  });

  it('creates modelitems dynamically in fx-repeat', async () => {
    const el = await fixtureSync(html`
      <fx-fore
        create-nodes="create-nodes"
        id="fx-invoice"
        xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
        xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
      >
        <fx-model>
          <fx-instance src="/base/test/data/ubl-empty.xml"></fx-instance>
          <fx-instance id="untdid-5305" src="/base/test/data/UNTDID-5305-3.xml"></fx-instance>
        </fx-model>

        <fx-group id="outer" ref=".">
          <section class="repeat-container" id="BG-20">
            <header>
              DOCUMENT LEVEL ALLOWANCES
              <fx-trigger>
                <button>add</button>
                <fx-insert origin="#r-BG-20" ref="cac:AllowanceCharge"></fx-insert>
              </fx-trigger>
            </header>
            <fx-repeat id="r-BG-20" ref="cac:AllowanceCharge">
              <template>
                <fx-control id="BT-95" ref="cac:TaxCategory/cbc:ID">
                  <label for="BT-95">Document level allowance VAT category code</label>
                  <select
                    class="widget"
                    id="BT-95"
                    ref="instance('untdid-5305')//Row"
                    selection="open"
                  >
                    <template>
                      <option title="{Value[3]/SimpleValue}" value="{Value[1]/SimpleValue}">
                        {Value[2]/SimpleValue}
                      </option>
                    </template>
                  </select>
                </fx-control>
                <fx-control id="BT-96" ref="cac:TaxCategory/cbc:Percent">
                  <label for="BT-96">Document level allowance VAT rate</label>
                  <input type="number"
                /></fx-control>
                <fx-trigger>
                  <button>delete</button>
                  <fx-delete ref="."></fx-delete>
                </fx-trigger>
              </template>
            </fx-repeat>
          </section>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');
    const button = el.querySelector('button');
    button.click();
    await oneEvent(el, 'refresh-done');
    expect(el.getModel().modelItems.length).to.equal(7);
    expect(el.getModel().getModelItem('$default/AllowanceCharge[2]_1')).to.exist;
    expect(el.getModel().getModelItem('$default/AllowanceCharge[2]_1/TaxCategory[1]/ID[1]')).to
      .exist;
    expect(el.getModel().getModelItem('$default/AllowanceCharge[2]_1/TaxCategory[2]/Percent[1]')).to
      .exist;
  });

  it('creates correct number of modelItems for a set of actions', async () => {
    const el = await fixtureSync(html`
      <fx-fore
        create-nodes="create-nodes"
        id="fx-invoice"
        xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
        xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
      >
        <fx-model>
          <fx-instance src="/base/test/data/ubl-empty.xml"></fx-instance>
          <fx-instance id="untdid-5305" src="/base/test/data/UNTDID-5305-3.xml"></fx-instance>
        </fx-model>

        <fx-group id="outer" ref=".">
          <section class="repeat-container" id="BG-20">
            <header>
              DOCUMENT LEVEL ALLOWANCES
              <fx-trigger>
                <button>add</button>
                <fx-insert origin="#r-BG-20" ref="cac:AllowanceCharge"></fx-insert>
                <fx-insert origin="#r-BG-20" ref="cac:AllowanceCharge"></fx-insert>
                <fx-insert origin="#r-BG-20" ref="cac:AllowanceCharge"></fx-insert>
              </fx-trigger>
            </header>
            <fx-repeat id="r-BG-20" ref="cac:AllowanceCharge">
              <template>
                <fx-control id="BT-95" ref="cac:TaxCategory/cbc:ID">
                  <label for="BT-95">Document level allowance VAT category code</label>
                  <select
                    class="widget"
                    id="BT-95"
                    ref="instance('untdid-5305')//Row"
                    selection="open"
                  >
                    <template>
                      <option title="{Value[3]/SimpleValue}" value="{Value[1]/SimpleValue}">
                        {Value[2]/SimpleValue}
                      </option>
                    </template>
                  </select>
                </fx-control>
                <fx-control id="BT-96" ref="cac:TaxCategory/cbc:Percent">
                  <label for="BT-96">Document level allowance VAT rate</label>
                  <input type="number"
                /></fx-control>

                <fx-trigger>
                  <button>delete</button>
                  <fx-delete ref="."></fx-delete>
                </fx-trigger>
              </template>
            </fx-repeat>
          </section>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');
    const button = el.querySelector('button');
    button.click();
    await oneEvent(el, 'refresh-done');
    expect(el.getModel().modelItems.length).to.equal(10);
  });
  it('created modelItems are observed by correct elements', async () => {
    const el = await fixtureSync(html`
      <fx-fore
        create-nodes="create-nodes"
        id="fx-invoice"
        xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
        xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
      >
        <fx-model>
          <fx-instance src="/base/test/data/ubl-empty.xml"></fx-instance>
          <fx-instance id="untdid-5305" src="/base/test/data/UNTDID-5305-3.xml"></fx-instance>
        </fx-model>

        <fx-group id="outer" ref=".">
          <section class="repeat-container" id="BG-20">
            <header>
              DOCUMENT LEVEL ALLOWANCES
              <fx-trigger>
                <button>add</button>
                <fx-insert origin="#r-BG-20" ref="cac:AllowanceCharge"></fx-insert>
              </fx-trigger>
            </header>
            <fx-repeat id="r-BG-20" ref="cac:AllowanceCharge">
              <template>
                <fx-control id="BT-95" ref="cac:TaxCategory/cbc:ID">
                  <label for="BT-95">Document level allowance VAT category code</label>
                  <select
                    class="widget"
                    id="BT-95"
                    ref="instance('untdid-5305')//Row"
                    selection="open"
                  >
                    <template>
                      <option title="{Value[3]/SimpleValue}" value="{Value[1]/SimpleValue}">
                        {Value[2]/SimpleValue}
                      </option>
                    </template>
                  </select>
                </fx-control>
                <fx-control id="BT-96" ref="cac:TaxCategory/cbc:Percent">
                  <label for="BT-96">Document level allowance VAT rate</label>
                  <input type="number"
                /></fx-control>

                <fx-trigger>
                  <button>delete</button>
                  <fx-delete ref="."></fx-delete>
                </fx-trigger>
              </template>
            </fx-repeat>
          </section>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');
    const button = el.querySelector('button');
    button.click();
    await oneEvent(el, 'refresh-done');
    expect(el.getModel().modelItems.length).to.equal(7);

    const repeatitems = el.querySelectorAll('fx-repeatitem');
    expect(repeatitems.length).to.equal(2);
    const modelItems = el.getModel().modelItems;

    const mi4 = modelItems[4];
    expect(mi4.observers.has(repeatitems[1])).to.be.true;
    expect(mi4.path).to.equal('$default/AllowanceCharge[2]_1');

    const mi5 = modelItems[5];
    let control = repeatitems[1].querySelector('#BT-95');
    expect(control).to.exist;
    expect(mi5.observers.has(control)).to.be.true;
    expect(mi5.path).to.equal('$default/AllowanceCharge[2]_1/TaxCategory[1]/ID[1]');

    const mi6 = modelItems[6];
    control = repeatitems[1].querySelector('#BT-96');
    expect(control).to.exist;
    expect(mi6.observers.has(control)).to.be.true;
    expect(mi6.path).to.equal('$default/AllowanceCharge[2]_1/TaxCategory[2]/Percent[1]');
  });
});
