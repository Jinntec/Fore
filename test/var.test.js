import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../src/fx-instance.js';
import '../src/fx-var.js';
import '../src/fx-bind.js';

describe('var Tests', () => {
  it('can declare a variable', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <counter>0</counter>
            </data>
          </fx-instance>
        </fx-model>
        <fx-var name="my-var" value="counter + 2">
        <span id="output">{$my-var}</span>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control1 = el.querySelector('#output');
    expect(control1.innerText).to.equal('2');
  });

  it('can declare a variable in a repeat', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <items>
                <item>1</item>
                <item>2</item>
                <item>3</item>
                <item>4</item>
              </items>
            </data>
          </fx-instance>
        </fx-model>
        <fx-var name="my-var" value="2+2"></fx-var>
        <fx-repeat ref="items/*" id="repeat">
          <template>
            <fx-var name="my-var-2" value="$my-var || '-' || ."></fx-var>
            <span index="{.}">{$my-var-2}</span>
          </template>
        </fx-repeat>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const control1 = el.querySelector('span[index="1"]');
    expect(control1).to.be.ok;
    expect(control1.innerText).to.equal('4-1');
    const control2 = el.querySelector('span[index="2"]');
    expect(control2).to.be.ok;
    expect(control2.innerText).to.equal('4-2');
    const control3 = el.querySelector('span[index="3"]');
    expect(control3).to.be.ok;
    expect(control3.innerText).to.equal('4-3');
    const control4 = el.querySelector('span[index="4"]');
    expect(control4).to.be.ok;
    expect(control4.innerText).to.equal('4-4');
  });
});
