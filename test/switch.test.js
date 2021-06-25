/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixtureSync, expect, elementUpdated } from '@open-wc/testing';

import '../index.js';
import { FxModel } from '../src/fx-model.js';

describe('fx-switch Tests', () => {
  it('shows first case by default', async () => {
    const el = await fixtureSync(html`
            <fx-form>
                <fx-trigger label="page 1">
                    <paper-button>toggle page 1</paper-button>
                    <fx-toggle case="one"></fx-toggle>
                </fx-trigger>

                <fx-trigger label="page 2" raised="raised">
                    <paper-button>toggle page 2</paper-button>
                    <fx-toggle case="two"></fx-toggle>
                </fx-trigger>

                <fx-trigger label="page 3" raised="raised">
                    <paper-button>toggle page 3</paper-button>
                    <fx-toggle case="three"></fx-toggle>
                </fx-trigger>

                <fx-switch>
                    <fx-case id="one" name="page1">
                        some exclusive content
                    </fx-case>
                    <fx-case id="two" name="page2">
                        some further content
                    </fx-case>
                    <fx-case id="three" name="page3">
                        some completely unneeded content
                    </fx-case>
                </fx-switch>
            </fx-form>

    `);

    await oneEvent(el, 'refresh-done');
    const cases = el.querySelectorAll('fx-case');
    expect(cases[0].style.display).to.equal('block');
    expect(cases[1].style.display).to.equal('none');
    expect(cases[2].style.display).to.equal('none');

    // expect(model.modelItems[5].value).to.equal('2019-01-04');
  });

  it('toggles case by action', async () => {
    const el = await fixtureSync(html`
            <fx-form>
                <fx-trigger label="page 1">
                    <paper-button>toggle page 1</paper-button>
                    <fx-toggle case="one"></fx-toggle>
                </fx-trigger>

                <fx-trigger label="page 2" raised="raised">
                    <paper-button>toggle page 2</paper-button>
                    <fx-toggle case="two"></fx-toggle>
                </fx-trigger>

                <fx-trigger label="page 3" raised="raised">
                    <paper-button>toggle page 3</paper-button>
                    <fx-toggle case="three"></fx-toggle>
                </fx-trigger>

                <fx-switch>
                    <fx-case id="one" name="page1">
                        some exclusive content
                    </fx-case>
                    <fx-case id="two" name="page2">
                        some further content
                    </fx-case>
                    <fx-case id="three" name="page3">
                        some completely unneeded content
                    </fx-case>
                </fx-switch>
            </fx-form>

    `);

    await oneEvent(el, 'refresh-done');

    const trigger = el.querySelectorAll('fx-trigger');

    trigger[1].performActions();


    const cases = el.querySelectorAll('fx-case');
    expect(cases[0].style.display).to.equal('none');
    expect(cases[1].style.display).to.equal('block');
    expect(cases[2].style.display).to.equal('none');
  });

  it('activates case that matches bound value', async () => {
    const el = await fixtureSync(html`
      <fx-form>
          <fx-model>
              <fx-instance>
                  <data>
                      <page>page3</page>
                  </data>
              </fx-instance>
          </fx-model>
  
          <fx-control ref="page" update-event="change">
              <label>select page</label>
              <select class="widget">
                  <option>page1</option>
                  <option>page2</option>
                  <option>page3</option>
              </select>
          </fx-control>
  
          <fx-switch ref="page">
              <fx-case name="page1">
                  <h2>Page1</h2>
              </fx-case>
              <fx-case name="page2">
                  <h2>Page 2</h2>
              </fx-case>
              <fx-case name="page3">
                  <h2>Page 3</h2>
              </fx-case>
          </fx-switch>
      </fx-form>
    `);

    await oneEvent(el, 'refresh-done');

    const cases = el.querySelectorAll('fx-case');
    expect(cases[0].style.display).to.equal('none');
    expect(cases[1].style.display).to.equal('none');
    expect(cases[2].style.display).to.equal('block');
  });











});
