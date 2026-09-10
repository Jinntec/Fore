/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent, waitUntil } from '@open-wc/testing';

import '../index.js';

/**
 * Issue #373 — a `relevant` / `readonly` expression on a node whose value is toggled
 * by `fx-setvalue` children of an `fx-submission` (`event="submit"` /
 * `event="submit-done"`) stays stale after the submission completes.
 *
 * The `submit-done` setvalue runs *after* fx-submission has already done its own
 * updateModel()+refresh() for a `replace="instance"` response. `fx-send` holds the
 * outermost-handler slot for the whole async `submit()`, so that late change is only
 * deferred back to `fx-send` — whose `actionPerformed()` override used to swallow it.
 * The changed ModelItem was left in `model.changed`, its facets never recomputed.
 */
describe('issue #373 - facet recompute after submit-done setvalue', () => {
  it('records a dependency edge for a self-referential relevant expr (sanity)', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="ui"
            ><data><busy>false</busy></data></fx-instance
          >
          <fx-bind ref="instance('ui')/busy" relevant=". = 'true'"></fx-bind>
        </fx-model>
        <fx-group id="loading" ref="instance('ui')/busy"><p>Loading</p></fx-group>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');

    const graph = el.querySelector('fx-model').mainGraph;
    const relevantKey = Object.keys(graph.outgoingEdges).find(n => n.endsWith(':relevant'));
    const base = relevantKey.replace(/:relevant$/, '');
    expect(graph.dependantsOf(base, false)).to.include(relevantKey);
  });

  it('recomputes a self-referential relevant on a plain fx-setvalue', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="ui"
            ><data><busy>false</busy></data></fx-instance
          >
          <fx-bind ref="instance('ui')/busy" relevant=". = 'true'"></fx-bind>
        </fx-model>
        <fx-group id="loading" ref="instance('ui')/busy"><p>Loading</p></fx-group>
        <fx-trigger id="go-busy"
          ><button>busy</button>
          <fx-setvalue ref="instance('ui')/busy">true</fx-setvalue></fx-trigger
        >
        <fx-trigger id="go-idle"
          ><button>idle</button>
          <fx-setvalue ref="instance('ui')/busy">false</fx-setvalue></fx-trigger
        >
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const group = el.querySelector('#loading');
    expect(group.hasAttribute('nonrelevant'), 'initially nonrelevant').to.be.true;

    await el.querySelector('#go-busy').performActions();
    await waitUntil(() => group.hasAttribute('relevant'), 'relevant once busy=true');

    await el.querySelector('#go-idle').performActions();
    await waitUntil(() => group.hasAttribute('nonrelevant'), 'nonrelevant once busy=false');
  });

  it('recomputes relevant after a submit-done setvalue resets the bound node', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="ui"
            ><data><busy>false</busy></data></fx-instance
          >
          <fx-instance id="recipes"
            ><data><placeholder /></data
          ></fx-instance>
          <fx-bind ref="instance('ui')/busy" relevant=". = 'true'"></fx-bind>

          <fx-submission
            id="s-load"
            method="get"
            url="/base/test/answer.xml"
            replace="instance"
            instance="recipes"
          >
            <fx-setvalue ref="instance('ui')/busy" event="submit">true</fx-setvalue>
            <fx-setvalue ref="instance('ui')/busy" event="submit-done">false</fx-setvalue>
          </fx-submission>
        </fx-model>

        <fx-group id="loading" ref="instance('ui')/busy"><p>Loading</p></fx-group>
        <fx-trigger id="load"
          ><button>load</button> <fx-send submission="s-load"></fx-send
        ></fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');

    const group = el.querySelector('#loading');
    const busy = () =>
      el.querySelector('fx-instance#ui').instanceData.documentElement.querySelector('busy')
        .textContent;

    expect(group.hasAttribute('nonrelevant'), 'initially nonrelevant').to.be.true;

    const sub = el.querySelector('#s-load');
    el.querySelector('#load').performActions();
    await oneEvent(sub, 'submit-done');

    await waitUntil(() => busy() === 'false', 'busy data resets to false');
    await waitUntil(
      () => group.hasAttribute('nonrelevant'),
      () =>
        `group stuck relevant after load; busy="${busy()}" ` +
        `relevant=${group.hasAttribute('relevant')} nonrelevant=${group.hasAttribute('nonrelevant')}`,
    );
    expect(group.hasAttribute('relevant'), 'group is not relevant').to.be.false;
  });

  it('also recomputes a cross-referential readonly after submit-done', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="ui"
            ><data><busy>false</busy><name>x</name></data></fx-instance
          >
          <fx-instance id="recipes"
            ><data><placeholder /></data
          ></fx-instance>
          <fx-bind ref="instance('ui')/name" readonly="instance('ui')/busy = 'true'"></fx-bind>

          <fx-submission
            id="s-load2"
            method="get"
            url="/base/test/answer.xml"
            replace="instance"
            instance="recipes"
          >
            <fx-setvalue ref="instance('ui')/busy" event="submit">true</fx-setvalue>
            <fx-setvalue ref="instance('ui')/busy" event="submit-done">false</fx-setvalue>
          </fx-submission>
        </fx-model>

        <fx-input id="nameField" ref="instance('ui')/name"></fx-input>
        <fx-trigger id="load2"
          ><button>load</button> <fx-send submission="s-load2"></fx-send
        ></fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');

    const model = el.querySelector('fx-model');
    const nameMI = () =>
      model.getModelItem(
        el.querySelector('fx-instance#ui').instanceData.documentElement.querySelector('name'),
      );

    expect(nameMI().readonly, 'initially not readonly').to.be.false;

    const sub = el.querySelector('#s-load2');
    el.querySelector('#load2').performActions();
    await oneEvent(sub, 'submit-done');

    await waitUntil(
      () => nameMI() && nameMI().readonly === false,
      () => `name modelItem stuck readonly=${nameMI() && nameMI().readonly}`,
    );
  });
});
