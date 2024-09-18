/* eslint-disable no-unused-expressions */
import {
  html, fixtureSync, expect, oneEvent,
} from '@open-wc/testing';

import '../index.js';

describe('fx-dispatch tests', () => {
  it('dispatches an event with a static property', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data></data>
          </fx-instance>
        </fx-model>
        <fx-trigger>
          <button>dispatch it</button>
          <fx-dispatch name="foo" targetid="bar">
            <fx-property name="string" value="aString"></fx-property>
          </fx-dispatch>
        </fx-trigger>
      </fx-fore>
      <div id="bar"></div>
    `);

    await oneEvent(el, 'refresh-done');

    const bar = document.getElementById('bar');
    bar.addEventListener('foo', (event) => {
      bar.innerText = event.detail.string;
    });

    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    expect(bar.innerText).to.equal('aString');
  });

  it('dispatches an event with a dynamic property', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <foo>fooVal</foo>
              <bar>barVal</bar>
            </data>
          </fx-instance>
        </fx-model>
        <fx-trigger>
          <button>dispatch it</button>
          <fx-dispatch name="foo" targetid="bar">
            <fx-property name="instance" expr="instance()"></fx-property>
          </fx-dispatch>
        </fx-trigger>
      </fx-fore>
      <div id="bar"></div>
    `);

    await oneEvent(el, 'refresh-done');

    const bar = document.getElementById('bar');
    bar.addEventListener('foo', (event) => {
      bar.innerText = event.detail.instance;
    });

    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    expect(bar.innerText).to.equal('<data>\n<foo>fooVal</foo>\n<bar>barVal</bar>\n</data>');
  });

  it('dispatches an event with a mixed properties', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <foo>fooVal</foo>
              <bar>barVal</bar>
            </data>
          </fx-instance>
        </fx-model>
        <fx-trigger>
          <button>dispatch it</button>
          <fx-dispatch name="foo" targetid="bar">
            <fx-property name="instance" expr="instance('default')"></fx-property>
            <fx-property name="string" value="aString"></fx-property>
          </fx-dispatch>
        </fx-trigger>
      </fx-fore>
      <div id="bar"></div>
      <div id="displayValue"></div>
    `);

    await oneEvent(el, 'refresh-done');

    const bar = document.getElementById('bar');
    const dVal = document.getElementById('displayValue');
    bar.addEventListener('foo', (event) => {
      bar.innerText = event.detail.instance;
      dVal.innerText = event.detail.string;
    });

    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    expect(bar.innerText).to.equal('<data>\n<foo>fooVal</foo>\n<bar>barVal</bar>\n</data>');
    expect(dVal.innerText).to.equal('aString');
  });

  it('fires within an fx-action', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <foo>fooVal</foo>
              <bar>barVal</bar>
            </data>
          </fx-instance>
        </fx-model>
        <fx-trigger>
          <button>dispatch it</button>
          <fx-action>
            <fx-dispatch name="foo" targetid="bar">
              <fx-property name="instance" expr="instance('default')"></fx-property>
              <fx-property name="string" value="aString"></fx-property>
            </fx-dispatch>
          </fx-action>
        </fx-trigger>
      </fx-fore>
      <div id="bar"></div>
      <div id="displayValue"></div>
    `);

    await oneEvent(el, 'refresh-done');

    const bar = document.getElementById('bar');
    const dVal = document.getElementById('displayValue');
    bar.addEventListener('foo', (event) => {
      bar.innerText = event.detail.instance;
      dVal.innerText = event.detail.string;
    });

    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    expect(bar.innerText).to.equal('<data>\n<foo>fooVal</foo>\n<bar>barVal</bar>\n</data>');
    expect(dVal.innerText).to.equal('aString');
  });

  it('fires from another event', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <foo>fooVal</foo>
              <bar>barVal</bar>
            </data>
          </fx-instance>
        </fx-model>
        <fx-trigger>
          <button>change value</button>
          <fx-setvalue ref="foo">foo</fx-setvalue>
        </fx-trigger>

        <fx-control ref="foo">
          <fx-dispatch name="click" targetid="bar" event="value-changed">
            <fx-property name="string" value="aString"></fx-property>
          </fx-dispatch>
        </fx-control>
      </fx-fore>
      <div id="bar" onclick="event.target.innerHTML = 'foobar'"></div>
    `);

    await oneEvent(el, 'refresh-done');

    const bar = document.getElementById('bar');
    const control = el.querySelector('fx-control');
    /*
                bar.addEventListener('click', (event) => {
                    bar.innerText = event.detail.instance;
                });
        */

    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    expect(bar.innerText).to.equal('foobar');
  });
});
