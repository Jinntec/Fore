/* eslint-disable no-unused-expressions */
import {
  html, oneEvent, fixtureSync, expect,
} from '@open-wc/testing';
import * as fx from 'fontoxpath';

import '../src/fx-instance.js';

describe('insert Tests', () => {
  it('does nothing when nodeset is empty', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data> </data>
          </fx-instance>
          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert ref="task"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const tasks = fx.evaluateXPath('//task', inst, null, {});

    expect(tasks.length).to.equal(0);
  });

  it('inserts at end by default', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
              <task complete="true" due="2020-01-05">Make tutorial part 2</task>
            </data>
          </fx-instance>
          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert ref="task" keep-values></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const tasks = fx.evaluateXPath('//task', inst, null, {});

    expect(tasks.length).to.equal(4);
    expect(tasks[2].textContent).to.equal('Make tutorial part 2');
    expect(tasks[2].getAttribute('complete')).to.equal('true');
    expect(tasks[2].getAttribute('due')).to.equal('2020-01-05');

    expect(tasks[3].textContent).to.equal('Make tutorial part 2');
    expect(tasks[3].getAttribute('complete')).to.equal('true');
    expect(tasks[3].getAttribute('due')).to.equal('2020-01-05');

    expect(el.getModel().modelItems.length).to.equal(4);

    expect(tasks[2].textContent).to.equal(tasks[3].textContent);
    expect(tasks[2].getAttribute('complete')).to.equal(tasks[3].getAttribute('complete'));
    expect(tasks[2].getAttribute('due')).to.equal(tasks[3].getAttribute('due'));
  });

  it('deeply clones when inserting', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
              <task complete="true" due="2020-01-05">
                <subtask>Make tutorial part 2</subtask>
                <attachment>attached</attachment>
              </task>
            </data>
          </fx-instance>
          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert ref="task" keep-values></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const tasks = fx.evaluateXPath('//task', inst, null, {});

    expect(tasks.length).to.equal(4);
    let subtask = fx.evaluateXPath('./subtask', tasks[2], null, {});
    expect(subtask).to.exist;
    expect(subtask.textContent).to.equal('Make tutorial part 2');
    let attachment = fx.evaluateXPath('./attachment', tasks[2], null, {});
    expect(attachment.textContent).to.equal('attached');
    expect(tasks[2].getAttribute('complete')).to.equal('true');
    expect(tasks[2].getAttribute('due')).to.equal('2020-01-05');

    subtask = fx.evaluateXPath('./subtask', tasks[3], null, {});
    expect(subtask).to.exist;
    expect(subtask.textContent).to.equal('Make tutorial part 2');

    attachment = fx.evaluateXPath('./attachment', tasks[3], null, {});
    expect(attachment.textContent).to.equal('attached');

    expect(tasks[3].getAttribute('complete')).to.equal('true');
    expect(tasks[3].getAttribute('due')).to.equal('2020-01-05');

    expect(el.getModel().modelItems.length).to.equal(4);

    expect(tasks[2].textContent).to.equal(tasks[3].textContent);
    expect(tasks[2].getAttribute('complete')).to.equal(tasks[3].getAttribute('complete'));
    expect(tasks[2].getAttribute('due')).to.equal(tasks[3].getAttribute('due'));
  });

  it('inserts as first with position=before', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
              <task complete="true" due="2020-01-05">Make tutorial part 2</task>
            </data>
          </fx-instance>
          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert as first</button>
          <fx-insert ref="task" position="before" at="1" keep-values></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const tasks = fx.evaluateXPath('//task', inst, null, {});

    expect(tasks.length).to.equal(4);
    expect(tasks[0].textContent).to.equal('Make tutorial part 2');
    expect(tasks[0].getAttribute('complete')).to.equal('true');
    expect(tasks[0].getAttribute('due')).to.equal('2020-01-05');

    expect(el.getModel().modelItems.length).to.equal(4);

    expect(tasks[0].textContent).to.equal(tasks[3].textContent);
    expect(tasks[0].getAttribute('complete')).to.equal(tasks[3].getAttribute('complete'));
    expect(tasks[0].getAttribute('due')).to.equal(tasks[3].getAttribute('due'));
  });

  it('inserts after first with position=after', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task complete="false" due="2019-02-04">Pick up Milk</task>
              <task complete="true" due="2019-01-04">Make tutorial part 1</task>
              <task complete="true" due="2020-01-05">Make tutorial part 2</task>
            </data>
          </fx-instance>
          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert after first</button>
          <fx-insert ref="task" position="after" at="1" keep-values></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const tasks = fx.evaluateXPath('//task', inst, null, {});

    expect(tasks.length).to.equal(4);
    expect(tasks[1].textContent).to.equal('Make tutorial part 2');
    expect(tasks[1].getAttribute('complete')).to.equal('true');
    expect(tasks[1].getAttribute('due')).to.equal('2020-01-05');

    expect(el.getModel().modelItems.length).to.equal(4);

    expect(tasks[1].textContent).to.equal(tasks[3].textContent);
    expect(tasks[1].getAttribute('complete')).to.equal(tasks[3].getAttribute('complete'));
    expect(tasks[1].getAttribute('due')).to.equal(tasks[3].getAttribute('due'));
  });

  it('inserts from origin', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task></task>
            </data>
          </fx-instance>
          <fx-instance id="templ">
            <data>
              <task> </task>
              <foo> </foo>
            </data>
          </fx-instance>
          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert ref="instance('default')/data" origin="instance('templ')/foo"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const tasks = fx.evaluateXPathToNodes('//foo', inst, null, {});

    expect(tasks.length).to.equal(1);
  });

  it('inserts when targetSequence is a single item', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task></task>
            </data>
          </fx-instance>
          <fx-bind ref="task">
            <fx-bind ref="./text()" required="true()"></fx-bind>
          </fx-bind>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" id="r-todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert ref="task"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const tasks = fx.evaluateXPath('//task', inst, null, {});

    expect(tasks.length).to.equal(2);
  });

  it('inserts after current repeatitem', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task>one</task>
              <task>two</task>
              <task>three</task>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert ref="task" at="index('todos')" keep-values></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    const tasks = fx.evaluateXPath('//task', inst, null, {});

    expect(tasks.length).to.equal(4);
    expect(tasks[1].textContent).to.equal('three');
  });

  it('inserts before current repeatitem', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <task>one</task>
              <task>two</task>
              <task>three</task>
            </data>
          </fx-instance>
        </fx-model>
        <fx-repeat focus-on-create="task" id="todos" ref="task">
          <template>
            <fx-control id="task" ref="."></fx-control>
          </template>
        </fx-repeat>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert ref="task" at="index('todos')" position="before" keep-values></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const tasks = fx.evaluateXPath('//task', inst, null, {});

    expect(tasks.length).to.equal(4);

    expect(tasks[0].textContent).to.equal('three');
  });

  it('inserts with context wether list is empty or not', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <list><a>1</a><a>2</a><a>3</a></list>
              <blank><a>0</a></blank>
            </data>
          </fx-instance>
        </fx-model>

        <fx-trigger>
          <button>insert at end</button>
          <!--          <fx-insert context="list" ref="a" origin="../blank/a"></fx-insert>-->
          <fx-insert context="list" origin="../blank/a"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    const items = fx.evaluateXPath('//list/a', inst, null, {});

    expect(items.length).to.equal(4);
    expect(items[3].textContent).to.equal('0');
  });

  it('inserts into inhomogenious nodeset at right position', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="record">
          <fx-instance>
            <data>
              <a>a1</a>
              <a>a2</a>
              <a>a3</a>
              <b>b1</b>
            </data>
          </fx-instance>
        </fx-model>

        <fx-trigger>
          <button>insert at end</button>
          <fx-insert ref="a"></fx-insert>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    await trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);

    let item = fx.evaluateXPath('//a[1]', inst, null, {});
    expect(item.textContent).to.equal('a1');
    item = fx.evaluateXPath('//a[2]', inst, null, {});
    expect(item.textContent).to.equal('a2');

    item = fx.evaluateXPath('//a[3]', inst, null, {});
    expect(item.textContent).to.equal('a3');
    item = fx.evaluateXPath('//a[4]', inst, null, {});
    expect(item.textContent).to.equal('');
    item = fx.evaluateXPath('//*[4]', inst, null, {});
    expect(item.textContent).to.equal('');

    item = fx.evaluateXPath('//*[5]', inst, null, {});
    expect(item.textContent).to.equal('b1');
    item = fx.evaluateXPath('//b[1]', inst, null, {});
    expect(item.textContent).to.equal('b1');
  });

  it('inserts into outer repeat with "context", "ref" and "origin" attribute', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model-1">
          <fx-instance
            id="default"
            src="/base/test/ling-sources.xml"
            xpath-default-namespace="http://www.tei-c.org/ns/1.0"
         ></fx-instance>

          <fx-instance
            id="i-template"
            src="/base/test/template.xml"
            xpath-default-namespace="http://www.tei-c.org/ns/1.0"
          ></fx-instance>
          <fx-instance id="temp">
            <data>
              <hypotheses>1</hypotheses>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group ref="//entry[true()]">
          <fx-trigger id="addGrp">
            <button>add</button>
            <fx-insert
              context="//entry"
              ref="gramGrp"
              origin="instance('i-template')//gramGrp[@type='segmentation']"
            ></fx-insert>
          </fx-trigger>
          <fx-repeat ref="gramGrp[@type='segmentation']" id="r-gramGrp">
            <template>
              <h3>Segmentation hypothesis</h3>
              <section class="tp-row tp-repeat-add">
                <h5 class="h4 tp-repeat-headline">Sources</h5>
                <div class="tp-repeat-button-left">
                  <div class="tp-button-row tp-add">
                    <label>Add significant source</label>
                    <fx-trigger class="addBibl">
                      <button>add</button>
                      <fx-insert
                        context="listBibl"
                        origin="instance('i-template')//cit[@type='source']"
                      ></fx-insert>
                    </fx-trigger>
                  </div>
                </div>
              </section>

              <fx-repeat ref="listBibl/cit[@type='source']" id="r-cit-source">
                <template>
                  <fx-control ref="ref"></fx-control>
                  <fx-trigger>
                    <button>delete</button>
                    <fx-delete
                      nodeset="//gramGrp[@type='segmentation'][index('r-gramGrp')]/listBibl/cit[@type='source'][index('r-cit-source')]"
                    ></fx-delete>
                  </fx-trigger>
                </template>
              </fx-repeat>

              <label><b>Delete segmentation hypothesis</b></label>
              <fx-trigger>
                <button>Delete</button>
                <fx-delete
                  nodeset="//gramGrp[@type='segmentation'][index('r-gramGrp')]"
                ></fx-delete>
              </fx-trigger>
            </template>
          </fx-repeat>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('#addGrp');
    await trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    // el.getModel().updateModel();
    const item = fx.evaluateXPathToBoolean(
      'exists(//gramGrp[@type="segmentation"])',
      inst,
      null,
      {},
    );
    expect(item).to.be.true;

    el.refresh();
    const outer = el.querySelector('#r-gramGrp');
    expect(outer.index).to.equal(1);
  });

  it('inserts into outer repeat with "context" and "origin" attribute', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model-1">
          <fx-instance
            id="default"
            src="/base/test/ling-sources.xml"
            xpath-default-namespace="http://www.tei-c.org/ns/1.0"
          ></fx-instance>

          <fx-instance
            id="i-template"
            src="/base/test/template.xml"
            xpath-default-namespace="http://www.tei-c.org/ns/1.0"
          ></fx-instance>
          <fx-instance id="temp">
            <data>
              <hypotheses>1</hypotheses>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group ref="//entry">
          <fx-trigger id="addGrp">
            <button>add</button>
            <fx-insert
              context="//entry"
              origin="instance('i-template')//gramGrp[@type='segmentation']"
            ></fx-insert>
          </fx-trigger>
          <fx-repeat ref="gramGrp[@type='segmentation']" id="r-gramGrp">
            <template>
              <h3>Segmentation hypothesis</h3>
              <section class="tp-row tp-repeat-add">
                <h5 class="h4 tp-repeat-headline">Sources</h5>
                <div class="tp-repeat-button-left">
                  <div class="tp-button-row tp-add">
                    <label>Add significant source</label>
                    <fx-trigger class="addBibl">
                      <button>add</button>
                      <fx-insert
                        context="listBibl"
                        origin="instance('i-template')//cit[@type='source']"
                      ></fx-insert>
                    </fx-trigger>
                  </div>
                </div>
              </section>

              <fx-repeat ref="listBibl/cit[@type='source']" id="r-cit-source">
                <template>
                  <fx-control ref="ref"></fx-control>
                  <fx-trigger>
                    <button>delete</button>
                    <fx-delete
                      nodeset="//gramGrp[@type='segmentation'][index('r-gramGrp')]/listBibl/cit[@type='source'][index('r-cit-source')]"
                    ></fx-delete>
                  </fx-trigger>
                </template>
              </fx-repeat>

              <label><b>Delete segmentation hypothesis</b></label>
              <fx-trigger>
                <button>Delete</button>
                <fx-delete
                  nodeset="//gramGrp[@type='segmentation'][index('r-gramGrp')]"
                ></fx-delete>
              </fx-trigger>
            </template>
          </fx-repeat>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('#addGrp');
    await trigger.performActions();

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    // el.getModel().updateModel();
    const item = fx.evaluateXPathToBoolean(
      'exists(//gramGrp[@type="segmentation"])',
      inst,
      null,
      {},
    );
    expect(item).to.be.true;
    const outer = el.querySelector('#r-gramGrp');
    expect(outer.index).to.equal(1);
  });

  it('inserts into inner repeat with "context" and "origin" attribute', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-action event="ready">
          <fx-insert
            context="//listBibl"
            origin="instance('i-template')//cit[@type='source']"
          ></fx-insert>
        </fx-action>

        <fx-model id="model-1">
          <fx-instance
            id="default"
            src="/base/test/ling-sources-nested.xml"
            xpath-default-namespace="http://www.tei-c.org/ns/1.0"
          ></fx-instance>

          <fx-instance
            id="i-template"
            src="/base/test/template.xml"
            xpath-default-namespace="http://www.tei-c.org/ns/1.0"
          ></fx-instance>
          <fx-instance id="temp">
            <data>
              <hypotheses>1</hypotheses>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group ref="//entry">
          <fx-repeat ref="gramGrp[@type='segmentation']" id="r-gramGrp">
            <template>
              <h3>Segmentation hypothesis</h3>
              <section class="tp-row tp-repeat-add">
                <h5 class="h4 tp-repeat-headline">Sources</h5>
                <div class="tp-repeat-button-left">
                  <div class="tp-button-row tp-add"><label>Add significant source</label></div>
                </div>
              </section>

              <fx-repeat ref="listBibl/cit[@type='source']" id="r-cit-source">
                <template>
                  <fx-control ref="ref"></fx-control>
                  <fx-trigger>
                    <button>delete</button>
                    <fx-delete
                      nodeset="//gramGrp[@type='segmentation'][index('r-gramGrp')]/listBibl/cit[@type='source'][index('r-cit-source')]"
                    ></fx-delete>
                  </fx-trigger>
                </template>
              </fx-repeat>

              <label><b>Delete segmentation hypothesis</b></label>
              <fx-trigger>
                <button>Delete</button>
                <fx-delete
                  nodeset="//gramGrp[@type='segmentation'][index('r-gramGrp')]"
                ></fx-delete>
              </fx-trigger>
            </template>
          </fx-repeat>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    let item = fx.evaluateXPathToBoolean("exists(//gramGrp[@type='segmentation'])", inst, null, {});
    expect(item).to.be.true;
    item = fx.evaluateXPathToBoolean('exists(//listBibl/cit)', inst, null, {});
    expect(item).to.be.true;
    const outer = el.querySelector('#r-gramGrp');
    expect(outer.index).to.equal(1);
  });

  it('inserts into inner repeat with "context", "ref" and "origin" attribute', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-action event="ready">
          <fx-insert
            context="//listBibl"
            ref="cit"
            origin="instance('i-template')//cit[@type='source']"
          ></fx-insert>
        </fx-action>

        <fx-model id="model-1">
          <fx-instance
            id="default"
            src="/base/test/ling-sources-nested.xml"
            xpath-default-namespace="http://www.tei-c.org/ns/1.0"
          ></fx-instance>

          <fx-instance
            id="i-template"
            src="/base/test/template.xml"
            xpath-default-namespace="http://www.tei-c.org/ns/1.0"
          ></fx-instance>
          <fx-instance id="temp">
            <data>
              <hypotheses>1</hypotheses>
            </data>
          </fx-instance>
        </fx-model>
        <fx-group ref="//entry">
          <fx-repeat ref="gramGrp[@type='segmentation']" id="r-gramGrp">
            <template>
              <h3>Segmentation hypothesis</h3>
              <section class="tp-row tp-repeat-add">
                <h5 class="h4 tp-repeat-headline">Sources</h5>
                <div class="tp-repeat-button-left">
                  <div class="tp-button-row tp-add"><label>Add significant source</label></div>
                </div>
              </section>

              <fx-repeat ref="listBibl/cit[@type='source']" id="r-cit-source">
                <template>
                  <fx-control ref="ref"></fx-control>
                  <fx-trigger>
                    <button>delete</button>
                    <fx-delete
                      nodeset="//gramGrp[@type='segmentation'][index('r-gramGrp')]/listBibl/cit[@type='source'][index('r-cit-source')]"
                    ></fx-delete>
                  </fx-trigger>
                </template>
              </fx-repeat>

              <label><b>Delete segmentation hypothesis</b></label>
              <fx-trigger>
                <button>Delete</button>
                <fx-delete
                  nodeset="//gramGrp[@type='segmentation'][index('r-gramGrp')]"
                ></fx-delete>
              </fx-trigger>
            </template>
          </fx-repeat>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');

    const inst = el.getModel().getDefaultContext();
    console.log('instance after insert', inst);
    let item = fx.evaluateXPathToBoolean("exists(//gramGrp[@type='segmentation'])", inst, null, {});
    expect(item).to.be.true;
    item = fx.evaluateXPathToBoolean('exists(//listBibl/cit)', inst, null, {});
    expect(item).to.be.true;
    const inner = el.querySelector('#r-cit-source');
    expect(Number(inner.index)).to.equal(1);
  });
});
