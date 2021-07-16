/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixtureSync, expect, elementUpdated } from '@open-wc/testing';

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

  /*
    it('dispatches a bind exception for non-existing ref', async () => {
        const el =  (
            await fixtureSync(html`
                <fx-fore>
                    <fx-model id="record">
                        <fx-instance>
                            <data>
                                <foo></foo>
                            </data>
                        </fx-instance>
                        <fx-bind ref="bar"></fx-bind>
                    </fx-model>
                    <fx-group ref="bar">
                    </fx-group>
                </fx-fore>`)
        );

        await elementUpdated(el);
/!*
        const model = el.querySelector('fx-model');
        expect(model.modelItems.length).to.equal(8);

        let out = el.querySelector('#output');
        expect(out.modelItem.value).to.equal('index');

        out = el.querySelector('#output3');
        expect(out.modelItem.value).to.equal('right');
*!/

    });
*/
});
