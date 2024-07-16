import {
  html, fixtureSync, expect, oneEvent,
} from '@open-wc/testing';

import '../src/fx-instance.js';
import '../src/fx-var.js';
import '../src/fx-bind.js';

describe('toggleboolean Tests', () => {
  it('toggles Boolean value from false to true', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-toggleboolean ref="toggle" event="model-construct-done"></fx-toggleboolean>
        <fx-model>
          <fx-instance>
            <data>
              <toggle>false</toggle>
            </data>
          </fx-instance>
        </fx-model>
        <div id="toggle">{toggle}</div>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    const toggle = el.querySelector('#toggle');
    expect(toggle.innerText).to.equal('true');
  });

  it('toggles Boolean value from true to false', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-toggleboolean ref="toggle" event="model-construct-done"></fx-toggleboolean>
        <fx-model>
          <fx-instance>
            <data>
              <toggle>true</toggle>
            </data>
          </fx-instance>
        </fx-model>
        <div id="toggle">{toggle}</div>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    const toggle = el.querySelector('#toggle');
    expect(toggle.innerText).to.equal('false');
  });

  it('toggles lazy-created node to true for first toggle', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-toggleboolean ref="toggle" event="instance-loaded"></fx-toggleboolean>
        <div id="toggle">{toggle}</div>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    const toggle = el.querySelector('#toggle');
    expect(toggle.innerText).to.equal('true');
  });
});
