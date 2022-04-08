import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../src/fx-instance.js';
import '../src/ui/fx-container.js';
import '../src/fx-bind.js';

describe('Fore as Control Tests (nesting fx-fore elements)', () => {
  it('finds and inlines Fore elements referenced by "url" attribute on control', async () => {
    const el = await fixtureSync(html`
    <fx-fore>
        <fx-model>
            <fx-instance>
                <data>
                    <from></from>
                    <to></to>
                    <subject></subject>
                    <message></message>
                </data>
            </fx-instance>
        </fx-model>
        <fx-group>
            <fx-control ref="from"
                        url="/base/test/email.html">
                <label>From</label>
            </fx-control>
        </fx-group>
    </fx-fore>
    `);
    const control = el.querySelector('fx-control');
    await oneEvent(control, 'loaded');

    const nestedFore = el.querySelector('fx-control fx-fore');
    console.log("nested", nestedFore);
    expect(nestedFore).to.exist;
    await oneEvent(el, 'refresh-done');

    const nestedControl = nestedFore.querySelector('fx-control');
    expect(nestedControl).to.exist;
    expect(nestedControl.getAttribute('ref')).to.equal('email');
    expect(nestedControl.value).to.equal('default');

  });


});
