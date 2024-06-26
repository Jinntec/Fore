/* eslint-disable no-unused-expressions */
import {
  html, oneEvent, fixtureSync, expect, elementUpdated,
} from '@open-wc/testing';

import '../index.js';

describe('scoped resolution tests', () => {
  it('inscopeContext for child bind is equal to its parent', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <arm side="left">
                <hand>
                  <finger index="3">middle</finger>
                </hand>
              </arm>
            </data>
          </fx-instance>
          <fx-bind id="parent" ref="arm">
            <fx-bind id="child" ref="@side"></fx-bind>
          </fx-bind>
        </fx-model>
      </fx-fore>
    `);

    await elementUpdated(el);
    const model = el.querySelector('fx-model');
    expect(model.modelItems.length).to.equal(2);

    const parent = el.querySelector('#parent');
    const child = el.querySelector('#child');

    expect(child.getInScopeContext()).to.equal(parent.nodeset);
  });

  it('inscopeContext in a repeat', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <arm side="left">
                <hand>
                  <finger index="1">
                    <name>thumb</name>
                    <bone index="1"></bone>
                    <bone index="2"></bone>
                  </finger>
                  <finger index="2">
                    <name>pointer</name>
                    <bone index="1"></bone>
                    <bone index="2"></bone>
                    <bone index="3"></bone>
                  </finger>
                  <finger index="3">
                    <name>middle</name>
                    <bone index="1"></bone>
                    <bone index="2"></bone>
                    <bone index="3"></bone>
                  </finger>
                  <finger index="4">
                    <name>ring</name>
                    <bone index="1"></bone>
                    <bone index="2"></bone>
                    <bone index="3"></bone>
                  </finger>
                  <finger index="5">
                    <name>pinky</name>
                    <bone index="1"></bone>
                    <bone index="2"></bone>
                    <bone index="3"></bone>
                  </finger>
                </hand>
              </arm>
            </data>
          </fx-instance>
          <fx-bind id="parent" ref="arm">
            <fx-bind id="child" ref="@side"></fx-bind>
          </fx-bind>
        </fx-model>

        <fx-repeat ref="arm/hand/finger" id="finger">
          <template>
            <strong><fx-output value="name"></fx-output></strong>
            <fx-repeat ref="bone" class="{name}">
              <template>
                <strong><fx-output value="@index"></fx-output></strong>
                <fx-repeat ref="(1,2,3,4)">
                  <template>
                    <fx-output value="."></fx-output>
                    <fx-output class="fingername" value="context('finger')/name"></fx-output>
                    <br />
                  </template>
                </fx-repeat>
              </template>
            </fx-repeat>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');
    await elementUpdated(el);

    el.querySelectorAll('.thumb .fingername').forEach((fingerOutput) => {
      expect(fingerOutput.value).to.equal('thumb');
    });
    el.querySelectorAll('.pointer .fingername').forEach(fingerOutput => expect(fingerOutput.value).to.equal('pointer'));
    el.querySelectorAll('.middle .fingername').forEach(fingerOutput => expect(fingerOutput.value).to.equal('middle'));
    el.querySelectorAll('.ring .fingername').forEach(fingerOutput => expect(fingerOutput.value).to.equal('ring'));
    el.querySelectorAll('.pinky .fingername').forEach(fingerOutput => expect(fingerOutput.value).to.equal('pinky'));
  });

  it('inscopeContext for second child bind is equal to its parent', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <arm side="left">
                <hand>
                  <finger index="3">middle</finger>
                </hand>
              </arm>
            </data>
          </fx-instance>
          <fx-bind id="parent" ref="arm">
            <fx-bind id="child1" ref="@side"></fx-bind>
            <fx-bind id="child2" ref="hand"></fx-bind>
          </fx-bind>
        </fx-model>
      </fx-fore>
    `);

    await elementUpdated(el);
    const model = el.querySelector('fx-model');
    expect(model.modelItems.length).to.equal(3);

    const parent = el.querySelector('#parent');
    const child = el.querySelector('#child2');
    expect(child.getInScopeContext()).to.equal(parent.nodeset);
  });

  it('inscopeContext for subchild bind is equal to its parent', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <arm side="left">
                <hand>
                  <finger index="3">middle</finger>
                </hand>
              </arm>
            </data>
          </fx-instance>
          <fx-bind id="parent" ref="arm">
            <fx-bind id="child1" ref="@side"></fx-bind>
            <fx-bind id="child2" ref="hand">
              <fx-bind id="subchild" ref="finger"></fx-bind>
            </fx-bind>
          </fx-bind>
        </fx-model>
      </fx-fore>
    `);

    await elementUpdated(el);
    const model = el.querySelector('fx-model');
    expect(model.modelItems.length).to.equal(4);

    const child = el.querySelector('#child2');
    const subchild = el.querySelector('#subchild');

    const c = subchild.getInScopeContext();
    expect(c).to.equal(child.nodeset);
  });

  it('has 2 arms as nodeset', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <arm side="left">
                <hand>
                  <finger index="3">middle</finger>
                </hand>
              </arm>
              <arm side="right">
                <hand>
                  <finger index="4">ring</finger>
                </hand>
              </arm>
            </data>
          </fx-instance>
          <fx-bind id="parent" ref="arm">
            <fx-bind id="child1" ref="@side"></fx-bind>
            <fx-bind id="child2" ref="hand">
              <fx-bind id="subchild" ref="finger"></fx-bind>
            </fx-bind>
          </fx-bind>
        </fx-model>
      </fx-fore>
    `);

    await elementUpdated(el);

    const parent = el.querySelector('#parent');
    expect(parent.nodeset.length).to.equal(2);
  });

  it('has a 3 finger nodeset for the left arm', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <arm side="left">
                <hand>
                  <finger index="2">pointer</finger>
                  <finger index="3">middle</finger>
                  <finger index="4">ring</finger>
                </hand>
              </arm>
              <arm side="right">
                <hand>
                  <finger index="4">ring</finger>
                </hand>
              </arm>
            </data>
          </fx-instance>
          <fx-bind id="parent" ref="arm">
            <fx-bind id="child1" ref="@side"></fx-bind>
            <fx-bind id="child2" ref="hand">
              <fx-bind id="subchild" ref="finger"></fx-bind>
            </fx-bind>
          </fx-bind>
        </fx-model>
      </fx-fore>
    `);

    await elementUpdated(el);
    const model = el.querySelector('fx-model');
    expect(model.modelItems.length).to.equal(10);

    const parent = el.querySelector('#parent');
    expect(parent.nodeset.length).to.equal(2);
  });

  it('correctly binds form controls', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <arm side="left">
                <hand>
                  <finger index="2">index</finger>
                </hand>
              </arm>
              <arm side="right">
                <hand>
                  <finger index="3">middle</finger>
                </hand>
              </arm>
            </data>
          </fx-instance>
          <fx-bind ref="arm">
            <fx-bind ref="hand">
              <fx-bind ref="finger">middle</fx-bind>
            </fx-bind>
          </fx-bind>
        </fx-model>
        <fx-group ref="arm">
          <h1>
            hold up one finger!:
            <fx-output ref=".[1]/hand/finger" id="output"></fx-output>
          </h1>
          <h2>
            left or right?
            <fx-output id="output2" ref="@side"></fx-output>
            <fx-output id="output3" ref="/data/arm[2]/@side"></fx-output>
          </h2>
        </fx-group>
      </fx-fore>
    `);

    const model = el.querySelector('fx-model');

    await oneEvent(el, 'refresh-done');
    expect(model.modelItems.length).to.equal(8);

    let out = el.querySelector('#output');
    expect(out.modelItem.value).to.equal('index');

    out = el.querySelector('#output3');
    expect(out.modelItem.value).to.equal('right');
  });

  it('returns the context of nearest fx-fore elements next in document hierarchy upwards ', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <from></from>
              <to></to>
              <subject></subject>
              <message></message>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>
          <fx-control ref="from" src="/base/test/email.html" initial="from">
            <label>From</label>
            <fx-fore class="widget">
              <fx-model>
                <fx-instance>
                  <data>
                    <email>default</email>
                  </data>
                </fx-instance>
              </fx-model>
              <fx-control ref="email"></fx-control>
            </fx-fore>
          </fx-control>

          <fx-control ref="to" src="/base/test/email.html" initial="to">
            <label>To</label>
          </fx-control>
          <fx-control ref="subject">
            <label>Subject</label>
          </fx-control>
          <fx-control ref="message">
            <label>Message</label>
            <textarea class="widget" rows="10"></textarea>
          </fx-control>
        </fx-group>
      </fx-fore>
    `);

    // const model = el.querySelector('fx-fore fx-model');
    await oneEvent(el, 'ready');
    const control = el.querySelector('fx-fore fx-fore fx-control');
    expect(control.getAttribute('ref')).to.equal('email');

    const model = el.querySelector('fx-fore fx-fore fx-model');
    expect(model.modelItems.length).to.equal(1);
    expect(model.modelItems[0].value).to.equal('default');
  });

  it('resolves group within repeat', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
<data><ol><li><p>66</p></li><li><p>78</p></li></ol></data>
</fx-instance>
        </fx-model>
        <fx-group ref="ol">
          <fx-repeat ref="//li">
            <template>
              <fx-group ref="p">
                <fx-control ref=".">
                  <label>Breite2</label>
                </fx-control>
              </fx-group>
            </template>
          </fx-repeat>
        </fx-group>
      </fx-fore>
    `);

    // const model = el.querySelector('fx-fore fx-model');
    await oneEvent(el, 'ready');

    const controls = el.querySelectorAll('fx-control');
    expect(controls.length).to.equal(2);

    expect(controls[0].value).to.equal('66');
    expect(controls[1].value).to.equal('78');
  });

  it('resolves group within repeat (external instance)', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance src="/base/test/HD025278.xml" xpath-default-namespace="http://www.tei-c.org/ns/1.0"></fx-instance>
        </fx-model>
        <fx-group ref="teiHeader">
{count(//*:msPart)}
          <fx-repeat ref=".//msPart">
            <template>
---{name(.)}---
              <fx-group ref="physDesc/objectDesc/supportDesc/support/dimensions">
                <fx-control ref="width">
                  <label>Breite2</label>
                </fx-control>
              </fx-group>
            </template>
          </fx-repeat>
        </fx-group>
      </fx-fore>
    `);

    // const model = el.querySelector('fx-fore fx-model');
    await oneEvent(el, 'ready');

    const controls = el.querySelectorAll('fx-control');
    console.log(el.outerHTML);
    expect(controls.length).to.equal(2);

    expect(controls[0].value).to.equal('66');
    expect(controls[1].value).to.equal('78');
  });

  it('resolves correctly within a fx-control in template expression and actions', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <ptr target="target"></ptr>
              <check></check>
            </data>
          </fx-instance>
        </fx-model>
        <fx-control ref="ptr/@target">
          <label>{.}</label>
          <fx-action event="init"  if="string-length(.) != 0">
            <fx-setvalue ref="../../check">ok</fx-setvalue>
          </fx-action>
        </fx-control>
        <fx-output ref="check"></fx-output>
        <fx-inspector></fx-inspector>
      </fx-fore>
    `);

    // const model = el.querySelector('fx-fore fx-model');
    await oneEvent(el, 'ready');

    const control = el.querySelector('fx-control');
    expect(control).to.exist;

    const label = el.querySelector('label');
    expect(label).to.exist;

    expect(label.textContent).to.equal('target');

    await oneEvent(el, 'refresh-done');
    const output = el.querySelector('fx-output');
    expect(output).to.exist;
    expect(output.value).to.equal('ok');
  });
  it('resolves correctly when a fx-control binds with the instance() function', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <ptr target="target"></ptr>
              <check></check>
            </data>
          </fx-instance>
          <fx-instance id="var">
            <data>
              <var1>aValue</var1>
            </data>
          </fx-instance>
        </fx-model>
        <fx-control ref="instance('var')/var1">
          <label>{.}</label>
        </fx-control>
      </fx-fore>
    `);

    // const model = el.querySelector('fx-fore fx-model');
    await oneEvent(el, 'ready');

    const control = el.querySelector('fx-control');
    expect(control).to.exist;
    control.getWidget().click();

    const label = el.querySelector('label');
    expect(label).to.exist;
    expect(label.textContent).to.equal('aValue');

    // await oneEvent(el, 'refresh-done');
    // const output = el.querySelector('fx-output');
    // expect(output).to.exist;
    // expect(output.value).to.equal('ok');
  });
});
