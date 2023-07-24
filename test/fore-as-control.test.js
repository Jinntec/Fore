import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../src/fx-instance.js';
import '../src/ui/fx-container.js';
import '../src/fx-bind.js';

describe('Fore as Control Tests (nesting fx-fore elements)', () => {
  it('finds and inlines Fore elements referenced by "url" attribute on control', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-setvalue ref="cnt" event="ready" value=". + 1"></fx-setvalue>
        <fx-model>
          <fx-instance>
            <data>
              <from>John</from>
              <to></to>
              <subject></subject>
              <message></message>
              <cnt>0</cnt>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group>
          <fx-control ref="from" url="/base/test/email.html" initial=".">
            <label>From</label>
          </fx-control>
          <fx-output ref="cnt"></fx-output>
        </fx-group>
      </fx-fore>
    `);
    const control = el.querySelector('fx-control');
    await oneEvent(control, 'loaded');

    const nestedFore = el.querySelector('fx-control fx-fore');
    console.log('nested', nestedFore);
    expect(nestedFore).to.exist;

    const nestedControl = nestedFore.querySelector('fx-control');
    expect(nestedControl).to.exist;
    expect(nestedControl.getAttribute('ref')).to.equal('email');

    // asserting that out is '1' meaning it has be fired just once and did not pick the 'ready' from its child.
    const out = el.querySelector('fx-output');
    expect(out.value).to.equal('1');
    // await oneEvent(nestedControl, 'ready');
    // expect(nestedControl.value).to.equal('default');
  });
});
