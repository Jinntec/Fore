import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

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
    expect(label.textContent).to.equal('Content of div: ')

    const content = control.shadowRoot.querySelector('span');
    expect(content.textContent).to.equal('hey there')


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
    expect(label.textContent).to.equal('Content of div: ')

    const content = control.shadowRoot.querySelector('span');
    expect(content.textContent).to.equal('hey there')


  });

  it('renders HTML of referenced node', async () => {
    const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <fx-instance>
                        <data>
                            <div style="color:white;background:#333;padding:1rem;">hey there</div>
                        </data>
                    </fx-instance>
                </fx-model>
                <fx-output ref="div" html>
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
    expect(label.textContent).to.equal('Output bound node as HTML: ')

    const content = control.shadowRoot.querySelector('span');
    expect(content.textContent).to.equal('hey there')

    const div = content.querySelector('div');
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
                <fx-output ref="div" html>
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
    expect(label.textContent).to.equal('Output bound node as HTML: ')

    const content = control.shadowRoot.querySelector('span');
    expect(content.textContent).to.equal('hey there')

    const div = content.querySelector('div');
    expect(div).to.exist;
    expect(div.getAttribute('style')).to.equal('color:white;background:#333;padding:1rem;');
    expect(div.textContent).to.equal('hey there');
  });



});
