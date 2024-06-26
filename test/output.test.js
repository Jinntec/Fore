import {
  html, fixtureSync, expect, oneEvent,
} from '@open-wc/testing';

import '../index.js';

describe('fx-output Tests', () => {
  it('has correct value from instance when using ref', async () => {
    const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <fx-instance>
                        <data>
                            <div style="color:white;background:#333;padding:1rem;">hey there</div>
                        </data>
                    </fx-instance>
                </fx-model>
                <fx-output ref="div">
                    <label slot="label">Content of div: </label>
                </fx-output>
            </fx-fore>
        `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-output');
    expect(control.value).to.equal('hey there');
    expect(control.getModelItem().value).to.equal('hey there');
    const label = control.querySelector('label');
    expect(label).to.exist;
    expect(label.textContent).to.equal('Content of div: ');

    const content = control.shadowRoot.querySelector('span');
    expect(content.textContent).to.equal('hey there');
  });

  it('has correct value from instance when using "value"', async () => {
    const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <fx-instance>
                        <data>
                            <div style="color:white;background:#333;padding:1rem;">hey there</div>
                        </data>
                    </fx-instance>
                </fx-model>
                <fx-output ref="div">
                    <label slot="label">Content of div: </label>
                </fx-output>
            </fx-fore>
        `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-output');
    expect(control.value).to.equal('hey there');
    expect(control.getModelItem().value).to.equal('hey there');
    const label = control.querySelector('label');
    expect(label).to.exist;
    expect(label.textContent).to.equal('Content of div: ');

    const content = control.shadowRoot.querySelector('span');
    expect(content.textContent).to.equal('hey there');
  });

  it('renders HTML of referenced node', async () => {
    const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <fx-instance>
                        <data>
                            <div class="test" style="color:white;background:#333;padding:1rem;">hey there</div>
                        </data>
                    </fx-instance>
                </fx-model>
                <fx-output ref="div" mediatype="html">
                    <label slot="label">Output bound node as HTML: </label>
                </fx-output>
            </fx-fore>
        `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-output');
    expect(control.value).to.equal('hey there');

    // todo: investigate - that crazy property is there but function can't be called though working in other tests
    // expect(control.getModelItem().value).to.equal('hey there');
    expect(control.modelItem.value).to.equal('hey there');
    const label = control.querySelector('label');
    // label exists in lightDOM
    expect(label).to.exist;
    expect(label.textContent).to.equal('Output bound node as HTML: ');

    const div = control.shadowRoot.querySelector('div');
    // div exists in lightDOM
    expect(div).to.exist;
    expect(div.getAttribute('style')).to.equal('color:white;background:#333;padding:1rem;');
    expect(div.textContent).to.equal('hey there');
  });

  it('renders HTML of evaluated node', async () => {
    const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <fx-instance>
                        <data>
                            <div style="color:white;background:#333;padding:1rem;">hey there</div>
                        </data>
                    </fx-instance>
                </fx-model>
                <fx-output ref="div" mediatype="html">
                    <label slot="label">Output bound node as HTML: </label>
                </fx-output>
            </fx-fore>
        `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-output');
    expect(control.value).to.equal('hey there');
    expect(control.getModelItem().value).to.equal('hey there');
    const label = control.querySelector('label');
    expect(label).to.exist;
    expect(label.textContent).to.equal('Output bound node as HTML: ');

    const div = control.shadowRoot.querySelector('div');
    expect(div).to.exist;
    expect(div.getAttribute('style')).to.equal('color:white;background:#333;padding:1rem;');
    expect(div.textContent).to.equal('hey there');
  });

  it('uses context attribute', async () => {
    const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <fx-instance>
                        <data>
                            <a><b>1</b></a>
                            <b>2</b>
                            <b>3</b>
                        </data>
                    </fx-instance>
                </fx-model>
                <div>
                    <fx-output context="a" value="b"></fx-output>
                    ⇒ 1
                </div>
            </fx-fore>
        `);

    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('fx-output');
    expect(control.value).to.equal('1');
    // expect(control.getModelItem().value).to.equal('1');
    const label = control.querySelector('label');
  });

  it('output an image with mediatype=image', async () => {
    const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <fx-instance>
                        <data>
                            <pic>base/resources/images/light7.png</pic>
                        </data>
                    </fx-instance>
                </fx-model>
                <fx-output ref="pic" mediatype="image"></fx-output>
            </fx-fore>
        `);

    await oneEvent(el, 'refresh-done');
    const control = el.querySelector('fx-output');
    const img = control.shadowRoot.querySelector('img');

    expect(img).to.exist;
    expect(img.getAttribute('src')).to.equal('base/resources/images/light7.png');
  });
});
