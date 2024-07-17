import {
  html, oneEvent, fixtureSync, expect,
} from '@open-wc/testing';

import '../index.js';
import { evaluateXPathToNodes, evaluateXPath } from 'fontoxpath';

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

    it('can define a simple function without any prefix', async () => {
      const el = await fixtureSync(html`
        <fx-fore>
          <fx-model>
            <fx-function signature="hello-world() as xs:string" override="no" type="text/xpath">
              ("Hello", "World") =&gt; string-join(" ")
            </fx-function>
          </fx-model>
          <label>{hello-world()}</label>
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
    await trigger.performActions();

    const indexVal = document.getElementById('index').innerText;
    expect(Number(indexVal)).to.equal(3);
  });

  it.skip('returns correct index after insert for nested repeat index()', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <item>1</item>
              <item>2</item>
              <item>3</item>
            </data>
          </fx-instance>
        </fx-model>
        <pre id="indices">
        <fx-repeat id="repeat" ref="/data/item">
          <template>
            <fx-repeat id="nested-repeat" ref="/data/item">
              <template>
                <span>({index("repeat") || ";" || index("nested-repeat")})</span>
<input type="text"/>

              </template>
            </fx-repeat>
          </template>
        </fx-repeat>
</pre>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    el.style.display = 'block';
    // Second row, second item
    const span = el.querySelectorAll('input')[3 + 1];
    span.focus();
    el.refresh();

    const indices = document.getElementById('indices');
    expect(indices.innerText.replace(/\s/g, '')).to.equal(
      '(2;1)(2;1)(2;1)(2;2)(2;2)(2;2)(2;1)(2;1)(2;1)',
      'The outer repeat is indexed at 2, the first and last inner ones at 1, the middle inner one at 2!',
    );
  });

  it('context() in repeats returns the correct item', async () => {
    const el = await fixtureSync(html`
          <fx-fore>
              <fx-model>
                   <fx-instance id="mapping">
                      <data>
                          <df tag="245" scope="bf:Instance" scope-rel="bf:title" domain="bf:Title">
                              <sf code="a">bf:mainTitle</sf>
                              <sf code="b">bf:subtitle</sf>
                              <sf code="c">bf:responsibilityStatement</sf>
                          </df>
                      </data>
                  </fx-instance>
                  <fx-instance id="desc">
                      <data>
                          <df>
                              <tag>245</tag>
                              <ind1></ind1>
                              <ind2></ind2>
                              <sfs>
                                  <sf>
                                      <code>a</code>
                                      <value>value-of-a</value>
                                  </sf>
                                  <sf>
                                      <code>b</code>
                                      <value>value-of-b</value>
                                  </sf>
                              </sfs>
                          </df>
                      </data>
                  </fx-instance>
              </fx-model>

              <fx-repeat ref="instance('desc')/df">
                  <template>
                      <fx-control ref="tag" update-event="input">
                          <label>Datafield</label>
                      </fx-control>
                      <fx-control ref="sfs/sf/code" update-event="input">
                          <label>Subfield</label>
                      </fx-control>
                      <fx-control ref="sfs/sf/value" update-event="input">
                          <label>Content</label>
                      </fx-control>
                  </template>
              </fx-repeat>

              <fx-repeat ref="instance('mapping')/df[@tag = instance('desc')/df/tag]" id="outer-repeat">
                  <template>
                      <h2>{@scope || " ➙ " || @scope-rel || " ➙ " || @domain}</h2>
                      <fx-repeat ref="sf[@code = instance('desc')/df/sfs/sf/code]" id="inner-repeat">
                          <template>
                              <fx-var name="current" value="."></fx-var>
                              <h3 style="display: inline;">{.}</h3>

                              <!-- context() does not work here, but $current does -->
<span id="context-item-span">{@code}</span>
<span id="context-function-span">{context()/@code}</span>
<span id="current-span">{$current/@code}</span>
                              <p id="result-p-with-context" style="display: inline;">{instance('desc')/df/sfs/sf[code = context()/@code]/value}</p>
                              <p id="result-p-with-current" style="display: inline;">{instance('desc')/df/sfs/sf[code = $current/@code]/value}</p>
                          </template>
                      </fx-repeat>
                  </template>
              </fx-repeat>
          </fx-fore>`);

    await oneEvent(el, 'refresh-done');
    const contextItemSpans = el.querySelectorAll('#context-item-span');
    const contextFunctionSpans = el.querySelectorAll('#context-function-span');

    const firstContextItemSpan = contextItemSpans[0];
    expect(firstContextItemSpan.innerText).to.equal('a', 'firstContextItemSpan.innerText should be OK');
    const firstContextFunctionSpan = contextFunctionSpans[0];
    expect(firstContextFunctionSpan.innerText).to.equal('a', 'firstContextFunctionSpan.innerText should be OK');

    const secondContextItemSpan = contextItemSpans[1];
    expect(secondContextItemSpan.innerText).to.equal('b', 'secondContextItemSpan.innerText should be OK');
    const secondContextFunctionSpan = contextFunctionSpans[1];
    expect(secondContextFunctionSpan.innerText).to.equal('b', 'secondContextFunctionSpan.innerText should be OK');

    const contextPs = el.querySelectorAll('#result-p-with-context');
    const currentPs = el.querySelectorAll('#result-p-with-current');

    expect(contextPs[0].innerText).to.equal(currentPs[0].innerText, 'The second result in the P should be correct');
    expect(contextPs[1].innerText).to.equal(currentPs[1].innerText, 'The second result in the P should be correct');
  });
/*
  it.only('context() function returns correct nodesets', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <group>
                <item attr="foo">bar</item>
              </group>
              <copy></copy>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group ref="group">
            <fx-control ref="item/@attr">
              <fx-setvalue event="value-changed" ref="copy" value="context()"></fx-setvalue>
            </fx-control>
            <div id="result">{copy}</div>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-control');
    control.setValue("fooo");

    const action = el.querySelector('fx-setvalue');
    action.perform();
    // const result = evaluateXPath('context()',action);
    // await oneEvent(action, 'action-performed');
    const copy = el.querySelector('#result');

    expect(copy.innerHTML).to.equal('foo');
  });
*/
});
