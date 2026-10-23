/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

describe('binding a control to a text node', () => {
  it('edits only that text node when the element has child elements', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data>
              <p>Hello <b>big</b> world</p>
            </data>
          </fx-instance>
        </fx-model>
        <fx-control id="c" ref="p/text()[1]"><input class="widget" /></fx-control>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('#c');
    expect(control.getModelItem().node.nodeType, 'bound to the text node itself').to.equal(Node.TEXT_NODE);
    expect(control.getModelItem().value).to.equal('Hello ');

    control.setValue('Goodbye ');

    const p = el.querySelector('fx-instance').getDefaultContext().querySelector('p');
    expect(p.querySelector('b'), 'the child element survives').to.exist;
    expect(p.querySelector('b').textContent).to.equal('big');
    expect(p.firstChild.nodeValue).to.equal('Goodbye ');
    expect(p.lastChild.nodeValue).to.equal(' world');
  });

  it('still edits the element when the text is all it holds', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data>
              <p>Hello</p>
            </data>
          </fx-instance>
        </fx-model>
        <fx-control id="c" ref="p/text()"><input class="widget" /></fx-control>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');

    const control = el.querySelector('#c');
    expect(control.getModelItem().node.nodeType, 'text-only content maps to the element').to.equal(
      Node.ELEMENT_NODE,
    );

    control.setValue('Bye');
    const p = el.querySelector('fx-instance').getDefaultContext().querySelector('p');
    expect(p.textContent).to.equal('Bye');
  });
});
