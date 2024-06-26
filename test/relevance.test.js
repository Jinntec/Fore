import {
  html, fixtureSync, expect, oneEvent,
} from '@open-wc/testing';

import '../index.js';
import * as fx from 'fontoxpath';
import { Relevance } from '../src/relevance';

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
    expect(control.hasAttribute('nonrelevant')).to.be.true;
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
    expect(control.hasAttribute('nonrelevant')).to.be.true;
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
    expect(control.hasAttribute('nonrelevant')).to.be.true;
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
    expect(control.hasAttribute('nonrelevant')).to.be.true;
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
    expect(control.hasAttribute('nonrelevant')).to.be.true;
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
    expect(control.hasAttribute('nonrelevant')).to.be.true;
  });

  it('removes empty attributes by default', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <vehicle attr1="a1" attr2="a2" attr3="" attr4="" attr5="">suv</vehicle>
              <car attr3="a3" xml:id="">
                <motor>electric</motor>
              </car>
              <thing>thing</thing>
              <something>something</something>
            </data>
          </fx-instance>
          <fx-bind ref="vehicle/@attr1" relevant="false()"></fx-bind>
          <fx-bind ref="car">
            <fx-bind ref="@attr3" relevant="false()"></fx-bind>
            <fx-bind ref="motor/text()" relevant="false()"></fx-bind>
          </fx-bind>
          <fx-bind ref="something" relevant="false()"></fx-bind>
          <fx-submission id="submission"
                         method="post"
                         url="#echo"
                         replace="instance">
            <fx-action event="submit-done">
              <fx-message>Submitted with non-relevant nodes being removed (default)</fx-message>
              <fx-refresh force></fx-refresh>
            </fx-action>
          </fx-submission>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const sm = el.querySelector('#submission');
    expect(sm).to.exist;
    await sm.submit();
    // const result = sm.selectRelevant('xml');
    // const result = Relevance.selectRelevant(sm, 'xml');

    const data = el.querySelector('fx-instance');
    // const vehicle = fx.evaluateXPath('vehicle', result, null, {});
    const vehicle = fx.evaluateXPath('//vehicle', data.instanceData, null, {});
    expect(vehicle).to.exist;

    // ### attr1 has a value but is non-relevant by binding
    expect(vehicle.hasAttribute('attr1')).to.be.false;
    // ### attr2 has a value but no binding (relevant by default)
    expect(vehicle.hasAttribute('attr2')).to.be.true;
    // ### attr3 is empty and will be removed
    expect(vehicle.hasAttribute('attr3')).to.be.false;
    // ### attr4 is empty and will be removed
    expect(vehicle.hasAttribute('attr4')).to.be.false;
    // ### attr5 is empty and will be removed
    expect(vehicle.hasAttribute('attr5')).to.be.false;
  });

  it('empties non-relevant nodes', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <vehicle attr1="a1" attr2="a2" attr3="" attr4="" attr5="">suv</vehicle>
              <car attr3="a3" xml:id="">
                <motor>electric</motor>
              </car>
              <thing>thing</thing>
              <something>something</something>
            </data>
          </fx-instance>
          <fx-bind ref="vehicle/@attr1" relevant="false()"></fx-bind>
          <fx-bind ref="car">
            <fx-bind ref="@attr3" relevant="false()"></fx-bind>
            <fx-bind ref="motor/text()" relevant="false()"></fx-bind>
          </fx-bind>
          <fx-bind ref="something" relevant="false()"></fx-bind>
          <fx-submission id="submission"
                         method="post"
                         url="#echo"
                         replace="instance"
                         nonrelevant="empty">
            <fx-action event="submit-done">
              <fx-message>Submitted with non-relevant nodes being removed (default)</fx-message>
              <fx-refresh force></fx-refresh>
            </fx-action>
          </fx-submission>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const sm = el.querySelector('#submission');
    expect(sm).to.exist;
    await sm.submit();
    // const result = sm.selectRelevant('xml');
    // const result = Relevance.selectRelevant(sm, 'xml');

    const data = el.querySelector('fx-instance');
    // const vehicle = fx.evaluateXPath('vehicle', result, null, {});
    const vehicle = fx.evaluateXPath('//vehicle', data.instanceData, null, {});
    expect(vehicle).to.exist;

    // ### attr1 has a value but is non-relevant by binding - it's value should be empty
    expect(vehicle.hasAttribute('attr1')).to.be.true;
    expect(vehicle.getAttribute('attr1')).to.equal('');

    // ### attr2 has a value but no binding (relevant by default)
    expect(vehicle.hasAttribute('attr2')).to.be.true;
    expect(vehicle.getAttribute('attr2')).to.equal('a2');

    // ### attr3 is empty and will be removed
    expect(vehicle.hasAttribute('attr3')).to.be.true;
    expect(vehicle.getAttribute('attr3')).to.equal('');
    // ### attr4 is empty and will be removed
    expect(vehicle.hasAttribute('attr4')).to.be.true;
    expect(vehicle.getAttribute('attr4')).to.equal('');
    // ### attr5 is empty and will be removed
    expect(vehicle.hasAttribute('attr5')).to.be.true;
    expect(vehicle.getAttribute('attr5')).to.equal('');
  });

  it('keeps all nodes with "keep"', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <vehicle attr1="a1" attr2="a2" attr3="" attr4="" attr5="">suv</vehicle>
              <car attr3="a3" xml:id="">
                <motor>electric</motor>
              </car>
              <thing>thing</thing>
              <something>something</something>
            </data>
          </fx-instance>
          <fx-bind ref="vehicle/@attr1" relevant="false()"></fx-bind>
          <fx-bind ref="car">
            <fx-bind ref="@attr3" relevant="false()"></fx-bind>
            <fx-bind ref="motor/text()" relevant="false()"></fx-bind>
          </fx-bind>
          <fx-bind ref="something" relevant="false()"></fx-bind>
          <fx-submission id="submission"
                         method="post"
                         url="#echo"
                         replace="instance"
                         nonrelevant="keep">
            <fx-action event="submit-done">
              <fx-message>Submitted with non-relevant nodes being removed (default)</fx-message>
              <fx-refresh force></fx-refresh>
            </fx-action>
          </fx-submission>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const sm = el.querySelector('#submission');
    expect(sm).to.exist;
    const dataBefore = await sm.submit();
    // const result = sm.selectRelevant('xml');
    // const result = Relevance.selectRelevant(sm, 'xml');

    const data = el.querySelector('fx-instance');
    const vehicle = fx.evaluateXPath('//vehicle', data.instanceData, null, {});
    expect(vehicle).to.exist;

    // ### attr1 has a value but is non-relevant by binding - it's value should be empty
    expect(vehicle.hasAttribute('attr1')).to.be.true;
    expect(vehicle.getAttribute('attr1')).to.equal('a1');

    // ### attr2 has a value but no binding (relevant by default)
    expect(vehicle.hasAttribute('attr2')).to.be.true;
    expect(vehicle.getAttribute('attr2')).to.equal('a2');

    // ### attr3 is empty and will be removed
    expect(vehicle.hasAttribute('attr3')).to.be.true;
    expect(vehicle.getAttribute('attr3')).to.equal('');
    // ### attr4 is empty and will be removed
    expect(vehicle.hasAttribute('attr4')).to.be.true;
    expect(vehicle.getAttribute('attr4')).to.equal('');
    // ### attr5 is empty and will be removed
    expect(vehicle.hasAttribute('attr5')).to.be.true;
    expect(vehicle.getAttribute('attr5')).to.equal('');
  });
});
