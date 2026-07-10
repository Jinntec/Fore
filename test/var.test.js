import {
  html, fixtureSync, expect, oneEvent,
} from '@open-wc/testing';

// full index: the fixtures use fx-fore, fx-trigger, fx-action, fx-delete etc. —
// importing them all keeps this spec runnable standalone via --grep
import '../index.js';
import { evaluateXPathToString } from '../src/xpath-evaluation.js';

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

  it('re-evaluates UI variables on partial refresh (stale $var regression)', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <counter>1</counter>
            </data>
          </fx-instance>
        </fx-model>
        <fx-var name="doubled" value="counter * 2"></fx-var>
        <fx-output id="out" value="$doubled"></fx-output>
        <fx-trigger>
          <button>inc</button>
          <fx-setvalue ref="counter" value=". + 1"></fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#out');
    expect(output.value).to.equal('2');

    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    // no forced refresh anywhere — the partial refresh must re-evaluate the variable
    // and refresh its consumers
    expect(output.value).to.equal('4');
  });

  it('cascades variable changes through dependent variables in document order', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <counter>1</counter>
            </data>
          </fx-instance>
        </fx-model>
        <fx-var name="base" value="xs:integer(counter)"></fx-var>
        <fx-var name="derived" value="$base * 10"></fx-var>
        <fx-output id="out" value="$derived"></fx-output>
        <fx-trigger>
          <button>inc</button>
          <fx-setvalue ref="counter" value=". + 1"></fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#out');
    expect(output.value).to.equal('10');

    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    expect(output.value).to.equal('20');
  });

  it('a variable does not see variables declared after it (lexical scoping)', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <counter>1</counter>
            </data>
          </fx-instance>
        </fx-model>
        <fx-var name="early" value="$late"></fx-var>
        <fx-var name="late" value="'here'"></fx-var>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    // $late is declared after $early, so it is not visible at $early's evaluation
    // point — bare $name references to unknown variables resolve to the empty
    // sequence (evaluateXPath's lookup branch), they never see the later value
    const early = el.querySelector('fx-var[name="early"]');
    const late = el.querySelector('fx-var[name="late"]');
    expect(late._rawValues).to.deep.equal(['here']);
    expect(early._rawValues).to.deep.equal([]);
  });

  it('evaluates action variables in sequence between sibling actions', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <greeting>original</greeting>
              <captured></captured>
            </data>
          </fx-instance>
        </fx-model>
        <fx-trigger>
          <button>run</button>
          <fx-action>
            <fx-setvalue ref="greeting">changed</fx-setvalue>
            <fx-var name="snap" value="string(greeting)"></fx-var>
            <fx-setvalue ref="captured" value="$snap"></fx-setvalue>
          </fx-action>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    await el.querySelector('fx-trigger').performActions();

    // the variable is evaluated at its position in the sequence: after the first
    // setvalue (so it sees 'changed'), before the second (which consumes it)
    const model = el.querySelector('fx-model');
    const captured = model.getDefaultInstance().evalXPath('captured');
    expect(captured.textContent).to.equal('changed');
  });

  it('re-evaluates action variables on each iterate iteration', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <item>a</item>
              <item>b</item>
              <item>c</item>
              <collected></collected>
            </data>
          </fx-instance>
        </fx-model>
        <fx-trigger>
          <button>run</button>
          <fx-action iterate="item">
            <fx-var name="current" value="string(.)"></fx-var>
            <fx-setvalue ref="../collected" value="concat(../collected, $current)"></fx-setvalue>
          </fx-action>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    await el.querySelector('fx-trigger').performActions();

    const model = el.querySelector('fx-model');
    const collected = model.getDefaultInstance().evalXPath('collected');
    expect(collected.textContent).to.equal('abc');
  });

  it('keeps a variable value stable within an action block (snapshot semantics)', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <item>1</item>
              <item>2</item>
              <item>3</item>
              <countsnapshot></countsnapshot>
            </data>
          </fx-instance>
        </fx-model>
        <fx-trigger>
          <button>run</button>
          <fx-action>
            <fx-var name="items" value="item"></fx-var>
            <fx-delete ref="item[1]"></fx-delete>
            <fx-setvalue ref="countsnapshot" value="count($items)"></fx-setvalue>
          </fx-action>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    await el.querySelector('fx-trigger').performActions();

    // the delete does NOT re-evaluate $items — it still holds the 3 nodes captured
    // at its evaluation point earlier in the sequence
    const model = el.querySelector('fx-model');
    const countsnapshot = model.getDefaultInstance().evalXPath('countsnapshot');
    expect(countsnapshot.textContent).to.equal('3');
  });

  it('evaluates model variables before recalculate (usable from calculate)', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <price>10</price>
              <factor>2</factor>
              <total></total>
            </data>
          </fx-instance>
          <fx-var name="factor" value="xs:integer(factor)"></fx-var>
          <fx-bind ref="total" calculate="xs:integer(../price) * $factor"></fx-bind>
        </fx-model>
        <fx-output id="total-out" value="total"></fx-output>
        <fx-trigger>
          <button>change factor</button>
          <fx-setvalue ref="factor">3</fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#total-out');
    expect(output.value).to.equal('20');

    await el.querySelector('fx-trigger').performActions();

    // the model variable got its evaluation point before recalculate, so the
    // calculate saw the new $factor
    const model = el.querySelector('fx-model');
    const total = model.getDefaultInstance().evalXPath('total');
    expect(total.textContent).to.equal('30');
  });

  it('dispatches xforms-binding-error when a variable is declared twice (shadowing)', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <counter>1</counter>
            </data>
          </fx-instance>
        </fx-model>
        <fx-var name="dup" value="'first'"></fx-var>
        <fx-var name="dup" value="'second'"></fx-var>
      </fx-fore>
    `);

    // registration happens during async init — listen before refresh-done
    let bindingError = false;
    el.addEventListener('xforms-binding-error', () => {
      bindingError = true;
    });
    await oneEvent(el, 'refresh-done');

    expect(bindingError).to.be.true;
  });

  it('lets an explicit fx-var override an implicit instance binding of the same name', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <value>default-data</value>
            </data>
          </fx-instance>
          <fx-instance id="other">
            <data>
              <value>other-data</value>
            </data>
          </fx-instance>
        </fx-model>
        <fx-var name="other" value="'overridden'"></fx-var>
        <fx-output id="var-out" value="$other"></fx-output>
        <fx-output id="default-out" value="$default/value"></fx-output>
        <fx-trigger>
          <button>touch</button>
          <fx-setvalue ref="value">changed</fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    // explicit fx-var wins over the implicit $other instance binding;
    // $default stays the untouched implicit binding
    expect(el.querySelector('#var-out').value).to.equal('overridden');
    expect(el.querySelector('#default-out').value).to.equal('default-data');

    // a partial refresh (UI-var evaluation point) must not disturb either resolution;
    // $default is checked via direct evaluation — the output is an untracked raw
    // value expression that only re-renders on forced refresh (Phase 1 scope)
    await el.querySelector('fx-trigger').performActions();
    expect(el.querySelector('#var-out').value).to.equal('overridden');
    const instance = el.querySelector('fx-instance');
    expect(
      evaluateXPathToString('$default/value', instance.getDefaultContext(), el),
    ).to.equal('changed');
  });

  it('rebuilds $default after instance data replacement (replace="instance")', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <value>old</value>
            </data>
          </fx-instance>
        </fx-model>
        <fx-output id="out" value="$default/value"></fx-output>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const output = el.querySelector('#out');
    expect(output.value).to.equal('old');

    // what replace="instance" does: assign new instanceData, update the model, refresh
    const instance = el.querySelector('fx-instance');
    const newDoc = new DOMParser().parseFromString(
      '<data><value>replaced</value></data>',
      'application/xml',
    );
    instance.instanceData = newDoc;
    el.querySelector('fx-model').updateModel();
    await el.refresh(true);

    // the implicit binding must point into the new document, not the replaced one
    expect(el._instanceVarBindings.default.ownerDocument).to.equal(newDoc);
    expect(output.value).to.equal('replaced');
  });

  it('handles variables in actions', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data>
              <counter>0</counter>
              <oof></oof>
            </data>
          </fx-instance>
        </fx-model>

        <fx-trigger class="start">
          <button>Start</button>
          <fx-var name="steps" value="1"></fx-var>
          <fx-var name="max" value="10"></fx-var>

          <fx-action while="counter < $max">
            <fx-setvalue ref="counter" value=".+$steps"></fx-setvalue>
            <fx-update></fx-update>
            <fx-refresh force></fx-refresh>
            <fx-message>{counter}</fx-message>
          </fx-action>
        </fx-trigger>
        <fx-output value="counter"></fx-output>
        <fx-trigger>
          <button>reset</button>
          <fx-setvalue ref="counter" value="0"></fx-setvalue>
        </fx-trigger>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const trigger = el.querySelector('fx-trigger.start');
    const action = el.querySelector('fx-action');
	  await trigger.performActions();

    const output = el.querySelector('fx-output');
    expect(output.value).to.equal('10');
  });
});
