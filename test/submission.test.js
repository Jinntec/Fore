/* eslint-disable no-unused-expressions */
// eslint-disable-next-line no-unused-vars
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';
import * as fx from 'fontoxpath';

import '../index.js';

describe('submissionn tests', () => {
  it.skip('replaces the default instance with response', async () => {
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
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const sm = el.querySelector('#submission');
    expect(sm).to.exist;
    sm.submit();

    const inst = el.querySelector('fx-instance');
    expect(inst).to.exist;
    expect(inst.instanceData).to.exist;
    console.log('ljsldkjflsfjkd', inst.instanceData);

    const answer = fx.evaluateXPathToString('//theAnswer/text()', inst.instanceData, null, {});
    expect(answer).to.exist;
    console.log('ljsldkjflsfjkd', answer);
    expect(answer.innerHTML).to.equal(42);
  });

  it('selects relevant nodes', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <vehicle>suv</vehicle>
              <car>
                <motor>electric</motor>
              </car>
              <thing>thing</thing>
              <something>something</something>
            </data>
          </fx-instance>
          <fx-bind ref="vehicle/@attr1" relevant="false()"></fx-bind>
          <fx-bind ref="something" relevant="false()"></fx-bind>
          <fx-submission id="submission" url="/submission2" replace="instance"> </fx-submission>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const sm = el.querySelector('#submission');
    expect(sm).to.exist;

    sm.evalInContext();
    const result = sm.selectRelevant();
    const vehicle = fx.evaluateXPath('vehicle', result, null, {});
    expect(vehicle).to.exist;

    const vehicleText = fx.evaluateXPathToBoolean("vehicle/text() = 'suv'", result, null, {});
    expect(vehicleText).to.be.true;

    const car = fx.evaluateXPath('exists(car)', result, null, {});
    expect(car).to.be.true;

    const motor = fx.evaluateXPath('car/motor/data()', result, null, {});
    expect(motor).to.equal('electric');

    const thing = fx.evaluateXPath('exists(thing)', result, null, {});
    expect(thing).to.be.true;

    const something = fx.evaluateXPath('exists(something)', result, null, {});
    expect(something).to.be.false;
  });

  it('filters non-relevant attrs', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <vehicle attr1="a1" attr2="a2">suv</vehicle>
              <car>
                <motor type="otto">electric</motor>
              </car>
              <thing>thing</thing>
              <something>something</something>
            </data>
          </fx-instance>
          <fx-bind ref="vehicle/@attr1" relevant="false()"></fx-bind>
          <fx-bind ref="car/motor/@type" relevant="false()"></fx-bind>
          <fx-submission id="submission" url="/submission2" replace="instance"> </fx-submission>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const sm = el.querySelector('#submission');
    expect(sm).to.exist;

    sm.evalInContext();
    const result = sm.selectRelevant();
    const vehicle = fx.evaluateXPath('vehicle', result, null, {});
    expect(vehicle).to.exist;

    const vehicleText = fx.evaluateXPathToBoolean("vehicle/text() = 'suv'", result, null, {});
    expect(vehicleText).to.be.true;

    const vehicleAttr1 = fx.evaluateXPathToBoolean('exists(vehicle/@attr1)', result, null, {});
    expect(vehicleAttr1).to.be.false;

    const motorAttr = fx.evaluateXPathToBoolean('exists(car/motor/@type)', result, null, {});
    expect(motorAttr).to.be.false;
  });
  it('filter non-relevant textnodes', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <vehicle attr1="a1" attr2="a2">suv</vehicle>
              <car>
                <motor type="otto">electric</motor>
              </car>
            </data>
          </fx-instance>
          <fx-bind ref="vehicle/text()" relevant="false()"></fx-bind>
          <fx-bind ref="car/motor/text()" relevant="false()"></fx-bind>
          <fx-submission id="submission" url="/submission2" replace="instance"> </fx-submission>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const sm = el.querySelector('#submission');
    expect(sm).to.exist;

    sm.evalInContext();
    const result = sm.selectRelevant();
    const vehicle = fx.evaluateXPathToBoolean('exists(vehicle/text())', result, null, {});
    expect(vehicle).to.be.false;

    const motor = fx.evaluateXPathToBoolean('exists(car/motor/text())', result, null, {});
    expect(motor).to.be.false;
  });

  it('supports "empty" for non-relevant nodes', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <vehicle attr1="a1" attr2="a2">suv</vehicle>
              <car>
                <motor type="otto">electric</motor>
              </car>
            </data>
          </fx-instance>
          <fx-bind ref="vehicle/text()" relevant="false()"></fx-bind>
          <fx-bind ref="car/motor/text()" relevant="false()"></fx-bind>
          <fx-submission id="submission" url="/submission2" replace="none" nonrelevant="empty">
          </fx-submission>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const sm = el.querySelector('#submission');
    expect(sm).to.exist;

    sm.evalInContext();
    const result = sm.selectRelevant();
    const vehicle = fx.evaluateXPath('vehicle/text()', result, null, {});
    // expect(vehicle).to.be.true;
    expect(vehicle).to.be.empty;

    const motor = fx.evaluateXPath('car/motor/text()', result, null, {});
    expect(motor).to.be.empty;
  });

  it('supports serialization none ', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-send event="ready" submission="submission"></fx-send>

        <fx-model>
          <fx-instance>
            <data>
              <vehicle attr1="a1" attr2="a2">suv</vehicle>
              <car>
                <motor type="otto">electric</motor>
              </car>
            </data>
          </fx-instance>
          <fx-submission
            id="submission"
            method="post"
            url="#echo"
            replace="instance"
            serialization="none">
          </fx-submission>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const sm = el.querySelector('#submission');
    expect(sm).to.exist;

    sm.submit();
    await oneEvent(sm, 'submit-done');

    const inst = el.querySelector('fx-instance');
    console.log('instancedata', inst.instanceData);
    expect(inst).to.exist;
    expect(inst.getInstanceData()).to.exist;
    expect(inst.getInstanceData().firstElementChild.nodeName).to.equal('data');
    expect(inst.getInstanceData().firstElementChild.childNodes).to.not.exist;
  });

  it('supports ref and targetref ', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <!--        <fx-send event="ready" submission="submission" delay="3000"></fx-send>-->

        <fx-model>
          <fx-instance>
            <data>
              <vehicle attr1="a1" attr2="a2">suv</vehicle>
              <car>
                <motor type="otto">electric</motor>
              </car>
            </data>
          </fx-instance>
          <fx-instance id="result">
            <data>
              <result></result>
            </data>
          </fx-instance>
          <fx-submission
            id="submission"
            ref="vehicle"
            method="post"
            url="#echo"
            replace="instance"
            instance="result"
            targetref="instance('result')/result"
          >
          </fx-submission>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const sm = el.querySelector('#submission');
    expect(sm).to.exist;
    sm.submit();

    const inst = el.querySelectorAll('fx-instance');
    expect(inst[1]).to.exist;
    expect(inst[1].instanceData).to.exist;
    await oneEvent(sm, 'submit-done');

    const vehicle = inst.instanceData;
    expect(inst[1].instanceData.firstElementChild.firstElementChild.textContent).to.equal('suv');
  });
});
