/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixtureSync, expect } from '@open-wc/testing';

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
});
