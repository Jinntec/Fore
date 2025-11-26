import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

describe('create-nodes', () => {
  it('works for a simple case', async () => {
    const el = await fixtureSync(html`
      <fx-fore create-nodes>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting>Hello!</greeting>
            </data>
          </fx-instance>
          <fx-group ref=".">
            <fx-control ref="greeting"></fx-control>
            <fx-control ref="new-greeting"></fx-control>
          </fx-group>
        </fx-model>
      </fx-fore>
    `);

    //      await elementUpdated(el);
    await oneEvent(el, 'ready');

    const inst = document.querySelector('fx-instance');

    expect(inst.instanceData.documentElement.innerHTML.replaceAll(/\s/g, '')).to.equal(
      '<greeting>Hello!</greeting><new-greeting/>',
    );
  });

  it('ignores "." expressions since they are not steps in our case', async () => {
    const el = await fixtureSync(html`
      <fx-fore create-nodes>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting>Hello!</greeting>
            </data>
          </fx-instance>
          <fx-group ref=".">
            <fx-control ref="greeting"></fx-control>
            <fx-control ref="./new-greeting/."></fx-control>
          </fx-group>
        </fx-model>
      </fx-fore>
    `);

    //      await elementUpdated(el);
    await oneEvent(el, 'ready');

    const inst = document.querySelector('fx-instance');

    expect(inst.instanceData.documentElement.innerHTML.replaceAll(/\s/g, '')).to.equal(
      '<greeting>Hello!</greeting><new-greeting/>',
    );
  });

  it('works for a complex case', async () => {
    const el = await fixtureSync(html`
      <fx-fore create-nodes>
        <fx-model>
          <fx-instance>
            <data>
              <root>
                <foo>FOO</foo>
                <bar>BAR</bar>
              </root>
            </data>
          </fx-instance>
        </fx-model>

        <fx-group ref="root">
          <fx-control ref="foo">
            <label>I'm here from the get-go</label>
          </fx-control>
          <fx-control ref="baz">
            <label>Not there initially, but will be created!</label>
          </fx-control>
          <fx-control ref="bar">
            <label>I'm here from the get-go</label>
          </fx-control>
          <fx-control ref="new-element[@role='special']">
            <label
              >Not there initially, but will be created! With the attribute set to "{@role}"
              ~~</label
            >
          </fx-control>
          <fx-control ref="newest-element[@role='special']/extra-special[@specialness='extreme']">
            <label
              >Not there initially, but will be created! With the attribute, and a child! The
              attributes are set to {ancestor-or-self::*/@*/(name() || "=" || .)} ~~</label
            >
          </fx-control>
          <fx-group ref="a/very/deep[@path='here']">
            <fx-control ref="and/now[@i='map']/to/@anAttribute"
              ><label>And this nests ina group, and addresses an attribute!</label></fx-control
            >
          </fx-group>
        </fx-group>
      </fx-fore>
    `);

    //      await elementUpdated(el);
    await oneEvent(el, 'ready');

    const inst = document.querySelector('fx-instance');

    expect(inst.instanceData.documentElement.innerHTML.replaceAll(/\s/g, '')).to.equal(
      `<root>
        <foo>FOO</foo>
        <baz />
        <bar>BAR</bar>
        <new-elementrole ="special" />
        <newest-element role="special">
          <extra-special specialness="extreme" />
        </newest-element>
        <a>
          <very>
            <deep path="here">
              <and>
                <now i="map"><to anAttribute="" /> </now>
              </and>
            </deep>
          </very>
        </a>
      </root>`.replace(/\s/g, ''),
    );
  });

  it('uses binds to choose between positions', async () => {
    const el = fixtureSync(html`
      <fx-fore create-nodes>
        <fx-model>
          <fx-instance>
            <data>
              <root>
                <foo>FOO</foo>
                <bar>BAR</bar>
              </root>
            </data>
          </fx-instance>

          <fx-bind ref="root">
            <fx-bind ref="foo"></fx-bind>
            <fx-bind ref="baz"></fx-bind>
            <fx-bind ref="between-baz-and-bar"></fx-bind>
            <fx-bind ref="bar"></fx-bind>
            <fx-bind ref="new-element"></fx-bind>
          </fx-bind>
        </fx-model>

        <fx-group ref="root">
          <fx-control ref="foo"></fx-control>
          <fx-control ref="baz"></fx-control>
          <fx-control ref="bar"></fx-control>
          <fx-control ref="new-element[@role='special']"></fx-control>
          <fx-control ref="newest-element[@role='special']/extra-special[@specialness='extreme']">
          </fx-control>
          <fx-group ref="a/very/deep[@path='here']">
            <fx-control ref="and/now[@i='map']/to/@anAttribute"></fx-control>
          </fx-group>
          <fx-control ref="between-baz-and-bar"></fx-control>
        </fx-group>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');

    const inst = document.querySelector('fx-instance');

    expect(inst.instanceData.documentElement.innerHTML.replaceAll(/\s/g, '')).to.equal(
      `<root>
        <foo>FOO</foo>
        <baz />
        <between-baz-and-bar />
        <bar>BAR</bar>
        <new-element role="special" />
        <newest-element role="special">
          <extra-special specialness="extreme" />
        </newest-element>
        <a>
          <very>
            <deep path="here">
              <and>
                <now i="map">
                  <to anAttribute="" />
                </now>
              </and>
            </deep>
          </very>
        </a>
      </root>`.replaceAll(/\s/g, ''),
    );
  });
});
