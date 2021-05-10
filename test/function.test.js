import { html, oneEvent, fixtureSync, expect } from '@open-wc/testing';

import '../index.js';

describe('functions', () => {
  describe('Functions in JavaScript', () => {
    it('can define a simple function', async () => {
      const el = await fixtureSync(html`
        <fx-form>
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
        </fx-form>
      `);

      await oneEvent(el, 'refresh-done');

      const label = el.querySelector('label');
      expect(label.innerText).to.equal('42');
    });

    it('can define a simple function with an argument', async () => {
      const el = await fixtureSync(html`
        <fx-form>
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
        </fx-form>
      `);

      await oneEvent(el, 'refresh-done');

      const label = el.querySelector('label');
      expect(label.innerText).to.equal('100');
    });
  });

  describe('functions in XPath', () => {
    it('can define a simple function', async () => {
      const el = await fixtureSync(html`
        <fx-form>
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
        </fx-form>
      `);

      await oneEvent(el, 'refresh-done');

      const label = el.querySelector('label');
      expect(label.innerText).to.equal('Hello World');
    });

    it('can define a simple function with an argument', async () => {
      const el = await fixtureSync(html`
        <fx-form>
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
        </fx-form>
      `);

      await oneEvent(el, 'refresh-done');

      const label = el.querySelector('label');
      expect(label.innerText).to.equal('Hello World');
    });
  });

  // The following two tests are failing. Unknown why
  it.skip('can define a simple function', async () => {
    const el = await fixtureSync(html`
      <fx-form>
        <fx-model>
          <fx-function
            signature="local:theanswer() as xs:decimal"
            override="no"
            type="text/javascript"
          >
            return 21*2;
          </fx-function>
        </fx-model>
        <fx-output ref="theAnswer">{local:theanswer()}</fx-output>
      </fx-form>
    `);

    await oneEvent(el, 'refresh-done');
    const model = el.querySelector('fx-model');
    console.log('modelitems ', model.modelItems);
    expect(model.modelItems.length).to.equal(1);

    const mi1 = model.modelItems[0];
    expect(mi1.value).to.equal('42');
  });

  it.skip('can define a simple function using explicit models', async () => {
    const el = await fixtureSync(html`
      <fx-form>
        <fx-model>
          <fx-instance>
            <data>
              <theAnswer></theAnswer>
            </data>
          </fx-instance>
          <fx-bind ref="theAnswer" required="true()" calculate="local:theans"></fx-bind>
          <fx-function
            signature="local:theanswer() as xs:decimal"
            override="no"
            type="text/javascript"
          >
            return 21*2;
          </fx-function>
        </fx-model>
        <fx-output ref="theAnswer">{local:theanswer()}</fx-output>
      </fx-form>
    `);

    await oneEvent(el, 'refresh-done');
    const model = el.querySelector('fx-model');
    console.log('modelitems ', model.modelItems);
    expect(model.modelItems.length).to.equal(1);

    const mi1 = model.modelItems[0];
    expect(mi1.value).to.equal('42');
  });
});
