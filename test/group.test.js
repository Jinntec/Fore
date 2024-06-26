/* eslint-disable no-unused-expressions */
import {
  html, fixtureSync, expect, elementUpdated, oneEvent,
} from '@open-wc/testing';

import '../index.js';

describe('group tests', () => {
  it('group is relevant when bound to a node', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
                  <foo>bar</foo>
            </data>
          </fx-instance>

        <fx-group ref="foo">
          <h2>a section of content being non-relevant initiallly</h2>
          <fx-control ref=".">
            <label>Foo</label>
          </fx-control>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);
    const group = el.querySelector("[ref='foo']");
    expect(group).to.exist;

    setTimeout(() => group.refresh());
    await oneEvent(group, 'enabled');

    console.log('failing expect here');
    expect(group.hasAttribute('relevant')).to.be.true;
  });

  it('group does not show if bound to non-existing node', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data></data>
          </fx-instance>
        </fx-model>

        <fx-group ref="foo">
          <h2>a section of content being non-relevant initiallly</h2>
          <fx-control ref=".">
            <label>Foo</label>
          </fx-control>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);
    const group = el.querySelector("[ref='foo']");
    expect(group).to.exist;

    setTimeout(() => group.refresh());

    await oneEvent(group, 'disabled');
    expect(group.hasAttribute('nonrelevant')).to.be.true;
  });

  it('group changes state when becoming relevant/nonrelevant', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data></data>
          </fx-instance>
          <fx-instance id="data">
            <data>
              <foo>bar</foo>
              <item type="color">blue</item>
              <item type="color">red</item>
              <item type="color">greeb</item>
            </data>
          </fx-instance>

          <fx-submission id="s-load"
                         method="post"
                         url="#echo"
                         ref="instance('data')"
                         replace="instance"
                         instance="default"></fx-submission>
        </fx-model>

        <fx-trigger id="t1">
          <button>switch group 1 relevant</button>
          <fx-send submission="s-load"></fx-send>
        </fx-trigger>

        <fx-group ref="foo">
          <h2>a section of content being non-relevant initiallly</h2>
          <fx-control ref=".">
            <label>Foo</label>
          </fx-control>
          <fx-trigger id="t2">
            <button>switch non-relevant again</button>
            <fx-delete ref="instance()/foo"></fx-delete>
          </fx-trigger>
        </fx-group>
      </fx-fore>
    `);

    await elementUpdated(el);
    const group = el.querySelector("[ref='foo']");
    expect(group).to.exist;

    setTimeout(() => group.refresh());

    await oneEvent(group, 'disabled');
    expect(group.hasAttribute('nonrelevant')).to.be.true;
    expect(group.hasAttribute('relevant')).to.be.false;

    const t1 = el.querySelector('#t1');
    t1.performActions();

    setTimeout(() => group.refresh());
    await oneEvent(group, 'enabled');

    expect(group.hasAttribute('relevant')).to.be.true;

    const t2 = el.querySelector('#t2');
    t2.performActions();
    await oneEvent(group, 'disabled');
    expect(group.hasAttribute('nonrelevant')).to.be.true;
  });
});
