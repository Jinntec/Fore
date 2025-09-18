/* eslint-disable no-unused-expressions */
import {
  html, fixture, fixtureSync, expect, elementUpdated, oneEvent, fixtureCleanup
} from '@open-wc/testing';

import '../index.js';

afterEach(() => {
  // Cleanup after each test
  fixtureCleanup();
});

describe('data-ref Tests', () => {
  it('data-ref is creating modelitems and rolling out table', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <bound>a</bound>
              <item>
                <field name="a">a</field>
                <field name="b">b</field>
                <field name="c">c</field>
                <field name="d">d</field>
                <field name="e">e</field>
                <field name="f">f</field>
              </item>
              <item>
                <field name="a">g</field>
                <field name="b">h</field>
                <field name="c">i</field>
                <field name="d">j</field>
                <field name="e">k</field>
                <field name="f">l</field>
              </item>
              <item>
                <field name="a">m</field>
                <field name="b">n</field>
                <field name="c">o</field>
                <field name="d">p</field>
                <field name="e">q</field>
                <field name="f">r</field>
              </item>
            </data>
          </fx-instance>
        </fx-model>

        <h1>Simple Table via attributes</h1>
        <p>To bind data nodes the <code><a href="https://jinntec.github.io/fore-docs/glossary/#binding-expression" target="_blank">data-ref</a></code> attribute is used instead of the usual <code><a href="https://jinntec.github.io/fore-docs/glossary/#binding-expression" target="_blank">ref</a></code> found
          on the Fore elements.</p>
        <p>You still have to wrap the repeated content in a <code><a href="https://jinntec.github.io/fore-docs/elements/ui/repeat/#description" target="_blank">template</a></code> as with usual repeats.</p>
        <table data-ref="item">
          <template>
            <tr>
              <td>
                <fx-output ref="field[@name='a']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='b']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='c']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='d']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='e']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='f']"></fx-output>
              </td>
            </tr>
          </template>
        </table>
      </fx-fore>
    `);

    //      await elementUpdated(el);
	  await oneEvent(el, 'ready');
    //check model
    const model = el.querySelector('fx-model');
    expect(model.modelItems.length).to.equal(18);
    expect(model.modelItems[0].path).to.equal('$default/item[1]/field[1]');
    expect(model.modelItems[0].observers.size).to.equal(1);

    expect(model.modelItems[1].path).to.equal('$default/item[1]/field[2]');
    expect(model.modelItems[1].observers.size).to.equal(1);

    expect(model.modelItems[2].path).to.equal('$default/item[1]/field[3]');
    expect(model.modelItems[2].observers.size).to.equal(1);

    expect(model.modelItems[3].path).to.equal('$default/item[1]/field[4]');
    expect(model.modelItems[3].observers.size).to.equal(1);

    expect(model.modelItems[4].path).to.equal('$default/item[1]/field[5]');
    expect(model.modelItems[4].observers.size).to.equal(1);

    expect(model.modelItems[5].path).to.equal('$default/item[1]/field[6]');
    expect(model.modelItems[5].observers.size).to.equal(1);

    expect(model.modelItems[6].path).to.equal('$default/item[2]/field[1]');
    expect(model.modelItems[6].observers.size).to.equal(1);

    expect(model.modelItems[7].path).to.equal('$default/item[2]/field[2]');
    expect(model.modelItems[7].observers.size).to.equal(1);

    expect(model.modelItems[8].path).to.equal('$default/item[2]/field[3]');
    expect(model.modelItems[8].observers.size).to.equal(1);

    expect(model.modelItems[9].path).to.equal('$default/item[2]/field[4]');
    expect(model.modelItems[9].observers.size).to.equal(1);

    expect(model.modelItems[10].path).to.equal('$default/item[2]/field[5]');
    expect(model.modelItems[10].observers.size).to.equal(1);

    expect(model.modelItems[11].path).to.equal('$default/item[2]/field[6]');
    expect(model.modelItems[11].observers.size).to.equal(1);

    expect(model.modelItems[12].path).to.equal('$default/item[3]/field[1]');
    expect(model.modelItems[12].observers.size).to.equal(1);

    expect(model.modelItems[13].path).to.equal('$default/item[3]/field[2]');
    expect(model.modelItems[13].observers.size).to.equal(1);

    expect(model.modelItems[14].path).to.equal('$default/item[3]/field[3]');
    expect(model.modelItems[14].observers.size).to.equal(1);

    expect(model.modelItems[15].path).to.equal('$default/item[3]/field[4]');
    expect(model.modelItems[15].observers.size).to.equal(1);

    expect(model.modelItems[16].path).to.equal('$default/item[3]/field[5]');
    expect(model.modelItems[16].observers.size).to.equal(1);

    expect(model.modelItems[17].path).to.equal('$default/item[3]/field[6]');
    expect(model.modelItems[17].observers.size).to.equal(1);

    //check ui
    const repeat = el.querySelector('fx-repeat-attributes');
    expect(repeat).to.exist;
    expect(repeat.getAttribute('index')).to.equal('1');

    const repeatitems = Array.from(el.querySelectorAll('.fx-repeatitem'));
    expect(repeatitems.length).to.equal(3);

    expect(repeatitems[0].hasAttribute('repeat-index')).to.be.true;

    repeatitems[1].click();
    expect(repeatitems[1].hasAttribute('repeat-index')).to.be.true;
    expect(repeat.getAttribute('index')).to.equal('2');
  });

  it.skip('appends an item to the table', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <bound>a</bound>
              <item>
                <field name="a">a</field>
                <field name="b">b</field>
                <field name="c">c</field>
                <field name="d">d</field>
                <field name="e">e</field>
                <field name="f">f</field>
              </item>
              <item>
                <field name="a">g</field>
                <field name="b">h</field>
                <field name="c">i</field>
                <field name="d">j</field>
                <field name="e">k</field>
                <field name="f">l</field>
              </item>
              <item>
                <field name="a">m</field>
                <field name="b">n</field>
                <field name="c">o</field>
                <field name="d">p</field>
                <field name="e">q</field>
                <field name="f">r</field>
              </item>
            </data>
          </fx-instance>
        </fx-model>

        <h1>Table with header via attributes</h1>
        <p>The <code><a href="https://jinntec.github.io/fore-docs/glossary/#binding-expression" target="_blank">data-ref</a></code> can also be used deeper down in the markup like here on a <code>tbody</code>.</p>
        <table>
          <thead>
          <th>A</th>
          <th>B</th>
          <th>C</th>
          <th>D</th>
          <th>E</th>
          <th>F</th>
          <th>x</th>
          </thead>
          <tbody data-ref="item">
          <template>
            <tr>
              <td>
                <fx-output ref="field[@name='a']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='b']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='c']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='d']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='e']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='f']"></fx-output>
              </td>
              <td>
                <fx-trigger>
                  <button>del</button>
                  <fx-delete ref="."></fx-delete>
                </fx-trigger>
              </td>
            </tr>
          </template>
          </tbody>
        </table>
        <fx-trigger>
          <button>append</button>
          <fx-insert ref="item" keep-values></fx-insert>
        </fx-trigger>
        <fx-trigger>
          <button>delete second</button>
          <fx-delete ref="item[2]"></fx-delete>
        </fx-trigger>
        <fx-trigger>
          <button>insert before second</button>
          <fx-insert ref="item" at="2" position="before"></fx-insert>
        </fx-trigger>
        <fx-trigger>
          <button>insert after second with values</button>
          <fx-insert ref="item" at="2" keep-values></fx-insert>
        </fx-trigger>
      </fx-fore>

    `);
    await oneEvent(el, 'ready');
    let repeatitems = Array.from(el.querySelectorAll('.fx-repeatitem'));
    const buttons = Array.from(el.querySelectorAll('button'));

    const done = oneEvent(el, 'refresh-done');
    buttons[0].click(); // append an item
    await done;

    const repeat = el.querySelector('fx-repeat-attributes');
    expect(repeat).to.exist;
    expect(repeat.getAttribute('index')).to.equal('4');

    repeatitems = Array.from(el.querySelectorAll('.fx-repeatitem'));
    expect(repeatitems[3].hasAttribute('repeat-index')).to.be.true;
  });

  it.skip('deletes an item from the table', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <bound>a</bound>
              <item>
                <field name="a">a</field>
                <field name="b">b</field>
                <field name="c">c</field>
                <field name="d">d</field>
                <field name="e">e</field>
                <field name="f">f</field>
              </item>
              <item>
                <field name="a">g</field>
                <field name="b">h</field>
                <field name="c">i</field>
                <field name="d">j</field>
                <field name="e">k</field>
                <field name="f">l</field>
              </item>
              <item>
                <field name="a">m</field>
                <field name="b">n</field>
                <field name="c">o</field>
                <field name="d">p</field>
                <field name="e">q</field>
                <field name="f">r</field>
              </item>
            </data>
          </fx-instance>
        </fx-model>

        <h1>Table with header via attributes</h1>
        <p>The <code><a href="https://jinntec.github.io/fore-docs/glossary/#binding-expression" target="_blank">data-ref</a></code> can also be used deeper down in the markup like here on a <code>tbody</code>.</p>
        <table>
          <thead>
          <th>A</th>
          <th>B</th>
          <th>C</th>
          <th>D</th>
          <th>E</th>
          <th>F</th>
          <th>x</th>
          </thead>
          <tbody data-ref="item">
          <template>
            <tr>
              <td>
                <fx-output ref="field[@name='a']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='b']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='c']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='d']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='e']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='f']"></fx-output>
              </td>
              <td>
                <fx-trigger>
                  <button>del</button>
                  <fx-delete ref="."></fx-delete>
                </fx-trigger>
              </td>
            </tr>
          </template>
          </tbody>
        </table>
        <fx-trigger>
          <button>append</button>
          <fx-insert ref="item" keep-values></fx-insert>
        </fx-trigger>
        <fx-trigger>
          <button>delete second</button>
          <fx-delete ref="item[2]"></fx-delete>
        </fx-trigger>
        <fx-trigger>
          <button>insert before second</button>
          <fx-insert ref="item" at="2" position="before"></fx-insert>
        </fx-trigger>
        <fx-trigger>
          <button>insert after second with values</button>
          <fx-insert ref="item" at="2" keep-values></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
let repeatitems = Array.from(el.querySelectorAll('.fx-repeatitem'));
    const buttons = Array.from(el.querySelectorAll('button'));
    const done = oneEvent(el, 'refresh-done');
    buttons[1].click(); // delete

    await done;
    const repeat = el.querySelector('fx-repeat-attributes');
    expect(repeat.getAttribute('index')).to.equal('2');
    repeatitems = Array.from(el.querySelectorAll('.fx-repeatitem'));
    expect(repeatitems[3].hasAttribute('repeat-index')).to.be.true;

  });

  it.skip('inserts an item as second', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <bound>a</bound>
              <item>
                <field name="a">a</field>
                <field name="b">b</field>
                <field name="c">c</field>
                <field name="d">d</field>
                <field name="e">e</field>
                <field name="f">f</field>
              </item>
              <item>
                <field name="a">g</field>
                <field name="b">h</field>
                <field name="c">i</field>
                <field name="d">j</field>
                <field name="e">k</field>
                <field name="f">l</field>
              </item>
              <item>
                <field name="a">m</field>
                <field name="b">n</field>
                <field name="c">o</field>
                <field name="d">p</field>
                <field name="e">q</field>
                <field name="f">r</field>
              </item>
            </data>
          </fx-instance>
        </fx-model>

        <h1>Table with header via attributes</h1>
        <p>The <code><a href="https://jinntec.github.io/fore-docs/glossary/#binding-expression" target="_blank">data-ref</a></code> can also be used deeper down in the markup like here on a <code>tbody</code>.</p>
        <table>
          <thead>
          <th>A</th>
          <th>B</th>
          <th>C</th>
          <th>D</th>
          <th>E</th>
          <th>F</th>
          <th>x</th>
          </thead>
          <tbody data-ref="item">
          <template>
            <tr>
              <td>
                <fx-output ref="field[@name='a']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='b']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='c']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='d']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='e']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='f']"></fx-output>
              </td>
              <td>
                <fx-trigger>
                  <button>del</button>
                  <fx-delete ref="."></fx-delete>
                </fx-trigger>
              </td>
            </tr>
          </template>
          </tbody>
        </table>
        <fx-trigger>
          <button>append</button>
          <fx-insert ref="item" keep-values></fx-insert>
        </fx-trigger>
        <fx-trigger>
          <button>delete second</button>
          <fx-delete ref="item[2]"></fx-delete>
        </fx-trigger>
        <fx-trigger>
          <button>insert before second</button>
          <fx-insert ref="item" at="2" position="before"></fx-insert>
        </fx-trigger>
        <fx-trigger>
          <button>insert after second with values</button>
          <fx-insert ref="item" at="2" keep-values></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');

    let repeatitems = Array.from(el.querySelectorAll('.fx-repeatitem'));
    const buttons = Array.from(el.querySelectorAll('button'));
    const done = oneEvent(el, 'refresh-done');
    buttons[2].click(); // delete

    await done;
    const repeat = el.querySelector('fx-repeat-attributes');
    expect(repeat.index).to.equal(2);

    repeatitems = Array.from(el.querySelectorAll('.fx-repeatitem'));
    expect(repeatitems[1].hasAttribute('repeat-index')).to.be.true;

  });
  it.skip('deletes row with repeat', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <bound>a</bound>
              <item>
                <field name="a">a</field>
                <field name="b">b</field>
                <field name="c">c</field>
                <field name="d">d</field>
                <field name="e">e</field>
                <field name="f">f</field>
              </item>
              <item>
                <field name="a">g</field>
                <field name="b">h</field>
                <field name="c">i</field>
                <field name="d">j</field>
                <field name="e">k</field>
                <field name="f">l</field>
              </item>
              <item>
                <field name="a">m</field>
                <field name="b">n</field>
                <field name="c">o</field>
                <field name="d">p</field>
                <field name="e">q</field>
                <field name="f">r</field>
              </item>
            </data>
          </fx-instance>
        </fx-model>

        <h1>Table with header and nested repeat within a cell</h1>
        <table>
          <thead>
          <th>all</th>
          <th>A</th>
          <th>B</th>
          <th>C</th>
          <th>D</th>
          <th>E</th>
          <th>F</th>
          <th>x</th>
          </thead>
          <tbody class="outer" data-ref="item">
          <template>
            <tr>
              <td>
                <fx-repeat ref="field">
                  <template>
                    <span>{.}</span>
                  </template>
                </fx-repeat>
              </td>
              <td>
                <fx-output ref="field[@name='a']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='b']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='c']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='d']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='e']"></fx-output>
              </td>
              <td>
                <fx-output ref="field[@name='f']"></fx-output>
              </td>
              <td>
                <fx-trigger>
                  <button>del</button>
                  <fx-delete ref="."></fx-delete>
                </fx-trigger>
              </td>
            </tr>
          </template>
          </tbody>
        </table>
      </fx-fore>
    `);


    await oneEvent(el, 'ready');
    let repeatitems = Array.from(el.querySelectorAll('.fx-repeatitem'));
    const buttons = Array.from(el.querySelectorAll('button'));
    const done = oneEvent(el, 'refresh-done');
    buttons[1].click(); // delete second row

    await done;
    const repeat = el.querySelector('fx-repeat-attributes');
    expect(repeat.index).to.equal(2);

    repeatitems = Array.from(el.querySelectorAll('.fx-repeatitem'));
    expect(repeatitems[1].hasAttribute('repeat-index')).to.be.true;

  });

});
