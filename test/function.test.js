import { html, oneEvent, fixtureSync, expect } from '@open-wc/testing';

import '../index.js';

describe('functions', () => {
  describe('Functions in JavaScript', () => {
    it('can define a simple function', async () => {
      const el = await fixtureSync(html`
        <fx-fore>
          <fx-model>
            <fx-function
              signature="local:theanswer() as xs:decimal"
              override="no"
              type="text/javascript"
            >
              return 21*2;
            </fx-function>
          </fx-model>
          <label>{local:theanswer()}</label>
        </fx-fore>
      `);

      await oneEvent(el, 'refresh-done');

      const label = el.querySelector('label');
      expect(label.innerText).to.equal('42');
    });

    it('can define a simple function with an argument', async () => {
      const el = await fixtureSync(html`
        <fx-fore>
          <fx-model>
            <fx-function
              signature="local:pow2($arg as xs:decimal) as xs:decimal"
              override="no"
              type="text/javascript"
            >
              return $arg * $arg;
            </fx-function>
          </fx-model>
          <label>{local:pow2(10)}</label>
        </fx-fore>
      `);

      await oneEvent(el, 'refresh-done');

      const label = el.querySelector('label');
      expect(label.innerText).to.equal('100');
    });
  });

  describe('functions in XPath', () => {
    it('can define a simple function', async () => {
      const el = await fixtureSync(html`
        <fx-fore>
          <fx-model>
            <fx-function
              signature="local:hello-world() as xs:string"
              override="no"
              type="text/xpath"
            >
              ("Hello", "World") =&gt; string-join(" ")
            </fx-function>
          </fx-model>
          <label>{local:hello-world()}</label>
        </fx-fore>
      `);

      await oneEvent(el, 'refresh-done');

      const label = el.querySelector('label');
      expect(label.innerText).to.equal('Hello World');
    });

    it('can define a simple function with an argument', async () => {
      const el = await fixtureSync(html`
        <fx-fore>
          <fx-model>
            <fx-function
              signature="local:hello($who as xs:string) as xs:string"
              override="no"
              type="text/xpath"
            >
              "Hello " || $who
            </fx-function>
          </fx-model>
          <label>{local:hello("World")}</label>
        </fx-fore>
      `);

      await oneEvent(el, 'refresh-done');

      const label = el.querySelector('label');
      expect(label.innerText).to.equal('Hello World');
    });
  });

  // The following two tests are failing.
  it('can define a simple function', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-function
            signature="local:theanswer() as xs:decimal"
            override="no"
            type="text/javascript"
          >
            return 21*2;
          </fx-function>
        </fx-model>
        <fx-output ref="theanswer">{local:theanswer()}</fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const model = el.querySelector('fx-model');
    console.log('modelitems ', model.modelItems);
    expect(model.modelItems.length).to.equal(1);

    const output = el.querySelector('fx-output');
    expect(output.textContent).to.equal('42');
  });

  it('can define a simple function using explicit models', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <theanswer></theanswer>
            </data>
          </fx-instance>
          <fx-bind ref="theanswer" required="true()" calculate="local:theans"></fx-bind>
          <fx-function
            signature="local:theanswer() as xs:decimal"
            override="no"
            type="text/javascript"
          >
            return 21*2;
          </fx-function>
        </fx-model>
        <div id="output">{local:theanswer()}</div>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const model = el.querySelector('fx-model');
    console.log('modelitems ', model.modelItems);
    expect(model.modelItems.length).to.equal(1);

    // following assumptions were wrong - output is never setting the value
    const output = el.querySelector('#output');
    expect(output.textContent).to.equal('42');
  });

  it('returns 1 for repeat index() by default', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <theanswer></theanswer>
              <theanswer></theanswer>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="repeat">
            <template>
                <fx-output ref="theanswer"></fx-output>
            </template>
        </fx-repeat>
        <span id="index">{index('repeat')}</span>
        
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const indexVal = document.getElementById('index').innerText;

    expect(Number(indexVal)).to.equal(1);

  });

  it('returns correct index after insert for repeat index()', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <theanswer></theanswer>
              <theanswer></theanswer>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat id="repeat">
            <template>
                <fx-output ref="theanswer"></fx-output>
            </template>
        </fx-repeat>
        <span id="index">{index('repeat')}</span>
        <fx-trigger>
            <button>insert at end</button>
            <fx-insert ref="theanswer"></fx-insert>
        </fx-trigger>

      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();

    const indexVal = document.getElementById('index').innerText;
    expect(Number(indexVal)).to.equal(3);

  });
});
