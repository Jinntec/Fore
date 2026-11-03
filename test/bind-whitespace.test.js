/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

describe('fx-bind whitespace', () => {
  const cases = {
    preserve: '  a \t b  ',
    remove: 'ab',
    trim: 'a \t b',
    collapse: ' a b ',
    normalize: 'a b',
  };

  Object.entries(cases).forEach(([mode, expected]) => {
    it(`${mode} is applied on load`, async () => {
      const el = fixtureSync(html`
        <fx-fore>
          <fx-model>
            <fx-instance type="html">
              <data>
                <v>${'  a \t b  '}</v>
              </data>
            </fx-instance>
            <fx-bind ref="v" whitespace="${mode}"></fx-bind>
          </fx-model>
          <fx-output ref="v"></fx-output>
        </fx-fore>
      `);
      await oneEvent(el, 'ready');
      const mi = el.getModel().modelItems.find(m => m.node?.nodeName === 'v');
      expect(mi.value).to.equal(expected);
    });
  });

  it('is applied when the value changes, before calculate', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data>
              <name></name>
              <len></len>
            </data>
          </fx-instance>
          <fx-bind ref="name" whitespace="normalize"></fx-bind>
          <fx-bind ref="len" calculate="string-length(../name)"></fx-bind>
        </fx-model>
        <fx-control ref="name"><input id="in" /></fx-control>
        <fx-output id="len" ref="len"></fx-output>
        <fx-trigger id="t"
          ><button>go</button>
          <fx-setvalue ref="name" value="'  Ada   Lovelace '"></fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    el.querySelector('#t').performActions();
    await new Promise(r => setTimeout(r, 100));
    const name = el.getModel().modelItems.find(m => m.node?.nodeName === 'name');
    expect(name.value).to.equal('Ada Lovelace');
    expect(el.querySelector('#len').value).to.equal('12');
  });
});
