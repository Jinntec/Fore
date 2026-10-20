/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

describe('rebuild keeps controls bound to a JSON instance alive', () => {
  it('a control on a JSON instance still reports value-changed after the model was rebuilt', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <a>1</a>
            </data>
          </fx-instance>
          <fx-instance id="i18n" type="json" static="static">{"lang": "de"}</fx-instance>
          <fx-bind ref="a" required="true()"></fx-bind>
        </fx-model>
        <fx-control id="lang" ref="instance('i18n')?lang" update-event="change">
          <select class="widget">
            <option value="de">de</option>
            <option value="en">en</option>
          </select>
        </fx-control>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');

    const control = el.querySelector('#lang');
    let changes = 0;
    el.addEventListener('value-changed', () => {
      changes += 1;
    });

    control.setValue('en');
    await new Promise(r => setTimeout(r, 100));
    expect(changes, 'before the rebuild').to.equal(1);

    // what happens when nodes are created in a lazily loaded section: the model is rebuilt, but only the
    // new section is refreshed - this control keeps the model item it already has
    el.getModel().updateModel();

    control.setValue('de');
    await new Promise(r => setTimeout(r, 100));
    expect(changes, 'after the rebuild').to.equal(2);
  });
});
