/* eslint-disable no-unused-expressions */
import {
  html, oneEvent, fixtureSync, expect,
} from '@open-wc/testing';

import '../index.js';

describe('template expressions', () => {
  it('detects template expressions', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <greeting>Hello Universe</greeting>
            </data>
          </fx-instance>
        </fx-model>

        <div class="static {greeting}">Greeting: {greeting} another {greeting}</div>
        <fx-input ref="greeting" label="greeting"></fx-input>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const div = el.querySelector('div');
    const attrNode = div.getAttributeNode('class');
    expect(el.storedTemplateExpressionByNode).to.exist;
    expect(el.storedTemplateExpressionByNode.size).to.equal(2);
    expect(el.storedTemplateExpressionByNode.get(attrNode)).to.equal('static {greeting}');
    expect(el.storedTemplateExpressionByNode.get(div.firstChild)).to.equal(
      'Greeting: {greeting} another {greeting}',
    );

    const theDiv = el.querySelector('.static');

    expect(theDiv.getAttribute('class')).to.equal('static Hello Universe');
    expect(theDiv.textContent).to.equal('Greeting: Hello Universe another Hello Universe');
  });

  it('detects template expressions with multiple lines', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <greeting>Hello Universe</greeting>
            </data>
          </fx-instance>
        </fx-model>

        <div class="{
if (greeting => contains('Universe')) then
'Hello Everyone'
else
greeting
}">Greeting: {
greeting

|| " With
             new
lines
"
} another {greeting}</div>
        <fx-input ref="greeting" label="greeting"></fx-input>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    const div = el.querySelector('div');

    expect(div.getAttribute('class')).to.equal('Hello Everyone');
    expect(div.textContent).to.equal(`Greeting: Hello Universe With
             new
lines
 another Hello Universe`);
  });

  it('skips the contents of fx-model for template detection', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <greeting>Hello {unreplaced} Universe</greeting>
            </data>
          </fx-instance>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');
    expect(el.storedTemplateExpressionByNode.size).to.equal(0);

    const greeting = el.querySelector('greeting');

    expect(greeting.textContent).to.equal('Hello {unreplaced} Universe');
  });

  it('Correctly resolves namespaces based on the context of the template', async () => {
    const el = await fixtureSync(html`
      <fx-fore xpath-default-namespace="CCC">
        <fx-model>
          <fx-instance>
            <data>
              <greeting xmlns="AAA">Hello AAA</greeting>
              <greeting xmlns="BBB">Hello BBB</greeting>
              <greeting xmlns="CCC">Hello CCC</greeting>
            </data>
          </fx-instance>
        </fx-model>

        <div xmlns:ns="AAA" class="greetingA {ns:greeting}">
          Greeting: {ns:greeting} another {ns:greeting}
        </div>
        <div xmlns:ns="BBB" class="greetingB {ns:greeting}">
          Greeting: {ns:greeting} another {ns:greeting}
        </div>
        <div class="greetingC {greeting}">
          Greeting: {greeting} another {greeting}
        </div>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const theDivA = el.querySelector('.greetingA');

    expect(theDivA.getAttribute('class')).to.equal('greetingA Hello AAA');
    expect(theDivA.innerText).to.equal('Greeting: Hello AAA another Hello AAA');

    const theDivB = el.querySelector('.greetingB');
    expect(theDivB.getAttribute('class')).to.equal('greetingB Hello BBB');
    expect(theDivB.innerText).to.equal('Greeting: Hello BBB another Hello BBB');

    const theDivC = el.querySelector('.greetingC');
    expect(theDivC.getAttribute('class')).to.equal('greetingC Hello CCC');
    expect(theDivC.innerText).to.equal('Greeting: Hello CCC another Hello CCC');
  });

  it('evaluates multiple templates with an attribute', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-action event="ready" while="true()" delay="5000">
          <fx-update></fx-update>
          <fx-refresh></fx-refresh>
        </fx-action>

        <fx-model>
          <fx-instance>
            <data>
              <color1>#000</color1>
              <color2>#fff</color2>
              <opacity></opacity>
            </data>
          </fx-instance>
        </fx-model>

        <div
          class="wrapper"
          style="
            background:linear-gradient(to right,{color1},{color2});"
        ></div>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const theDiv = el.querySelector('.wrapper');
    const attr = theDiv.getAttribute('style');

    expect(attr.trim()).to.equal('background:linear-gradient(to right,#000,#fff);');
  });

  it('empty template expression just does nothing', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-action event="ready" while="true()" delay="5000">
          <fx-update></fx-update>
          <fx-refresh></fx-refresh>
        </fx-action>

        <fx-model>
          <fx-instance>
            <data>
              <color1>#000</color1>
              <color2>#fff</color2>
              <opacity></opacity>
            </data>
          </fx-instance>
        </fx-model>

        <div class="wrapper" style="background:{}"></div>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const theDiv = el.querySelector('.wrapper');
    const attr = theDiv.getAttribute('style');

    expect(attr.trim()).to.equal('background:{}');
  });

  it('does not double-parse expressions', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <braces>I contain {braces}</braces>
            </data>
          </fx-instance>
        </fx-model>

        <div class="static">Braces! {braces}</div>
        <fx-input ref="greeting" label="greeting"></fx-input>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const theDiv = el.querySelector('.static');

    expect(theDiv.textContent).to.equal('Braces! I contain {braces}');
  });

  it('does ignore elements matched by ignore-expression attribute', async () => {
    const el = await fixtureSync(html`
          <fx-fore ignore-expressions=".myElement">
            <fx-model>
              <fx-instance>
                <data>
                  <greeting>Hello</greeting>
                  <ignored>if you read this it does not work</ignored>
                </data>
              </fx-instance>
            </fx-model>

            <div id="one">{greeting}</div>
            <div class="myElement">
              {ignored}{{whatever}}
            </div>


            <div class="myElement">
              {}{}{{{}}}
            </div>

            <div class="myElement">
              <span>{}{}{{{}}}</span>
            </div>


          </fx-fore>    
        `);

    await oneEvent(el, 'refresh-done');

    const theDiv = el.querySelector('#one');
    expect(theDiv.textContent).to.equal('Hello');

    const myElements = Array.from(document.querySelectorAll('.myElement'));
    expect(myElements.length).to.equal(3);
    console.log('####', myElements[0].textContent.trim());

    expect(myElements[0].textContent.trim()).to.equal('{ignored}{{whatever}}');
    expect(myElements[1].textContent.trim()).to.equal('{}{}{{{}}}');
    expect(myElements[2].textContent.trim()).to.equal('{}{}{{{}}}');
  });

  it('does ignore attributes on elements matched by ignore-expression attribute', async () => {
    const el = await fixtureSync(html`
          <fx-fore ignore-expressions="pb-authority">
            <fx-model>
              <fx-instance>
                <data>
                </data>
              </fx-instance>
            </fx-model>

            <pb-authority connector="Airtable" name="person" api-key="keyFpBEqgkRWCNrfK" base="appcVM9MIZSxyvkCU" table="People" fields="Name, Direct Order Name, Variants" label="{Name}" tokenize="Name, Variants" tokenize-regex="\\s*;\\s*" filter="or(search('{key}', lower({Name})), search('{key}', lower({Direct Order Name})), search('{key}', lower({Variants})))">
                <template class="info">
                    <h3>{Name}</h3>
                    <p>{Variants}</p>
                </template>
                <template class="detail">
                    {Variants}
                </template>
            </pb-authority>
          </fx-fore>    
        `);

    await oneEvent(el, 'refresh-done');

    const pb = document.querySelector('pb-authority');
    expect(pb.getAttribute('label')).to.equal('{Name}');
  });
});
