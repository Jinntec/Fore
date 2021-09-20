/* eslint-disable no-unused-expressions */
// eslint-disable-next-line no-unused-vars
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';
import * as fx from 'fontoxpath';

import '../index.js';

describe('submissionn tests', () => {
  it.skip('replaces the default instance with empty response', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <greeting>Hello World!</greeting>
              <prop></prop>
              <class>dynamic</class>
            </data>
          </fx-instance>
          <fx-submission
            id="submission"
            url="/base/test/answer.xml"
            method="POST"
            replace="instance"
            instance="default"
          >
          </fx-submission>
        </fx-model>
        <fx-trigger>
          <fx-send submission="submission"></fx-send>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();
  });

  it('selects relevant nodes', async () => {
    const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <fx-instance>
                        <data>
                            <vehicle>car</vehicle>
                            <car>
                                <motor>electric</motor>
                            </car>
                            <thing>thing</thing>
                            <something>something</something>
                        </data>
                    </fx-instance>
                    <fx-bind ref="car/motor" relevant="false()"></fx-bind>
                    <fx-bind ref="something" relevant="false()"></fx-bind>
                    <fx-submission id="submission"
                                    url="/submission2"
                                    replace="instance">
                    </fx-submission>
                </fx-model>
            </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const sm = el.querySelector('#submission');
    expect(sm).to.exist;

    sm.evalInContext();
    const result = sm.selectRelevant();
    console.log('@@@',result);
    const vehicle = fx.evaluateXPath('vehicle', result, null, {});
    expect(vehicle).to.exist;

    const vehicleText = fx.evaluateXPathToBoolean("vehicle/text() = 'car'", result, null, {});
    expect(vehicleText).to.be.true;


    const car = fx.evaluateXPath('exists(car)', result, null, {});
    expect(car).to.be.true;

    const motor = fx.evaluateXPath('exists(car/motor)', result, null, {});
    expect(motor).to.be.false;

    const thing = fx.evaluateXPath('exists(thing)', result, null, {});
    expect(thing).to.be.true;

    const something = fx.evaluateXPath('exists(something)', result, null, {});
    expect(something).to.be.false;

  });
});
