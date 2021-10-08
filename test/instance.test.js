/* eslint-disable no-unused-expressions */
import { html, oneEvent, fixtureSync, expect } from '@open-wc/testing';

import '../src/fx-instance.js';
import {Fore} from '../src/fore.js';

describe('instance Tests', () => {
  it('has "default" as id', async () => {
    const el = await fixtureSync(html`
      <fx-instance>
        <data>
          <foobar></foobar>
        </data>
      </fx-instance>
    `);

    // await elementUpdated(el);
    expect(el.id).to.equal('default');
  });

  it('init creates instanceData', async () => {
    const el = await fixtureSync(html`
      <fx-instance>
        <data>
          <foobar></foobar>
        </data>
      </fx-instance>
    `);

    el.init();
    // await elementUpdated(el);
    expect(el.instanceData).to.exist;
    expect(el.instanceData.nodeType).to.equal(Node.DOCUMENT_NODE);
  });

  it('evaluates xpath in its default context', async () => {
    const el = await fixtureSync(html`
      <fx-instance>
        <data>
          <foobar></foobar>
        </data>
      </fx-instance>
    `);

    el.init();
    const result = el.evalXPath('//foobar');
    expect(result).to.exist;
    expect(result.nodeType).to.equal(Node.ELEMENT_NODE);
    expect(result.nodeName).to.equal('foobar');
  });

  it('provides default evaluation context', async () => {
    const el = await fixtureSync(html`
      <fx-instance>
        <data>
          <foobar></foobar>
        </data>
      </fx-instance>
    `);

    el.init();
    const context = el.getDefaultContext();
    expect(context).to.exist;
    expect(context.nodeType).to.equal(Node.ELEMENT_NODE);
    expect(context.nodeName).to.equal('data');
  });

  it('does NOT copy a "body" element from inline data', async () => {
    const el = await fixtureSync(html`
      <fx-instance>
        <data>
          <body>
            <arm side="left">
              <hand>
                <finger index="3">middle</finger>
              </hand>
            </arm>
          </body>
        </data>
      </fx-instance>
    `);

    el.init();
    const doc = el.getInstanceData();
    expect(doc).to.exist;

    const root = doc.documentElement;
    expect(root.nodeName).to.equal('data');
    console.log('root children ', root.children);

    let n = root.firstElementChild;
    expect(n.nodeName).to.equal('arm');

    n = n.firstElementChild;
    expect(n.nodeName).to.equal('hand');

    n = n.firstElementChild;
    expect(n.nodeName).to.equal('finger');
    expect(n.textContent).to.equal('middle');
  });

  it('resolves instances with the instance() function', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <foobar></foobar>
            </data>
          </fx-instance>
          <fx-instance id="second">
            <data>
              <item>second</item>
            </data>
          </fx-instance>

          <fx-bind ref="instance('second')/item"></fx-bind>
        </fx-model>
        <fx-output ref="instance('second')//item"></fx-output>
      </fx-fore>
    `);

    // await elementUpdated(el);
    await oneEvent(el, 'refresh-done');

    const instances = el.querySelectorAll('fx-instance');
    expect(instances[0].id).to.equal('default');
    expect(instances[1].id).to.equal('second');

    const model = el.querySelector('fx-model');
    const { modelItems } = model;
    expect(modelItems[0].value).to.equal('second');

    const out = el.querySelector('fx-output');
    expect(out.value).to.equal('second');
  });

  it('Allows calling the boolean-from-string function', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <foobar></foobar>
            </data>
          </fx-instance>
          <fx-instance id="second">
            <data>
              <item>Maybe</item>
            </data>
          </fx-instance>

          <fx-bind
            ref="instance('second')/item"
            required="boolean-from-string('maybe!~')"
          ></fx-bind>
        </fx-model>
      </fx-fore>
    `);

    // await elementUpdated(el);
    await oneEvent(el, 'refresh-done');

    const instances = el.querySelectorAll('fx-instance');
    expect(instances[0].id).to.equal('default');
    expect(instances[1].id).to.equal('second');

    const model = el.querySelector('fx-model');
    // await elementUpdated(model);
    const { modelItems } = model;
    // expect(modelItems[0].required).to.be.false;
    console.log('>>>>>>>>>>>< modelitem ', modelItems[0]);
    expect(modelItems[0].required).to.equal(false);
  });

  it('Can run the instance function from text nodes', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <foobar></foobar>
            </data>
          </fx-instance>
          <fx-instance id="second">
            <data>
              <item>Maybe</item>
            </data>
          </fx-instance>
        </fx-model>
        <span id="the-span">{instance('second')/item}</span>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const theSpan = el.querySelector('#the-span');
    expect(theSpan.innerText).to.equal('Maybe');
  });

  it('loads data from external file via src attr', async () => {
    const el = await fixtureSync(html`
                <fx-fore>
                    <fx-model id="model1">
                        <fx-instance src="base/test/instance1.xml"></fx-instance>
                        <fx-bind ref="greeting"</fx-bind>
                    </fx-model>
                </fx-fore>
            `);

    await oneEvent(el, 'refresh-done');

    const instances = el.querySelectorAll('fx-instance');
    expect(instances[0].id).to.equal('default');

    const model = el.querySelector('fx-model');
    const { modelItems } = model;

    expect(modelItems[0].required).to.be.false;
    expect(modelItems[0].value).to.equal('hello from file');
  });

  it('uses correct content-type for xml', async () => {
    const el = await fixtureSync(html`
                <fx-fore>
                    <fx-model id="model1">
                        <fx-instance src="base/test/instance1.xml"></fx-instance>
                    </fx-model>
                </fx-fore>
            `);

    await oneEvent(el, 'refresh-done');

    const instances = el.querySelectorAll('fx-instance');
    expect(Fore.getContentType(instances[0])).to.equal('application/xml; charset=UTF-8');

  });

  it('uses correct content-type for json', async () => {
    const el = await fixtureSync(html`
                <fx-fore>
                    <fx-model id="model1">
                        <fx-instance src="base/test/automobiles.json" type="json"></fx-instance>
                    </fx-model>
                </fx-fore>
            `);

    await oneEvent(el, 'refresh-done');

    const instances = el.querySelectorAll('fx-instance');
    expect(Fore.getContentType(instances[0])).to.equal('application/json');

  });

  it('loads inline json data', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance type="json">
            { "automobiles": [ { "maker": "Nissan", "model": "Teana", "year": 2000 }, { "maker":
            "Honda", "model": "Jazz", "year": 2023 }, { "maker": "Honda", "model": "Civic", "year":
            2007 }, { "maker": "Toyota", "model": "Yaris", "year": 2008 }, { "maker": "Honda",
            "model": "Accord", "year": 2011 } ], "motorcycles": [{ "maker": "Honda", "model":
            "ST1300", "year": 2012 }] }
          </fx-instance>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const instances = el.querySelectorAll('fx-instance');
    expect(instances[0].id).to.equal('default');
    expect(instances[0].instanceData).to.exist;
    expect(instances[0].instanceData.automobiles).to.exist;
    expect(instances[0].instanceData.automobiles[0].maker).to.equal('Nissan');
  });

  it('loads data from external json file via src attr', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance src="base/test/automobiles.json" type="json"></fx-instance>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const instances = el.querySelectorAll('fx-instance');
    expect(instances[0].id).to.equal('default');
    expect(instances[0].instanceData).to.exist;

    // const model = el.querySelector('fx-model');
    // const { modelItems } = model;
    // expect(modelItems[0].value).to.equal('hello from file');

    // const out = el.querySelector('fx-output');
    // const span = el.querySelector('fx-output');
    // expect(span.textContent).to.equal('Honda');
    // expect(out.textContent).to.equal('Honda');
  });

  it('will create an instance', async () => {
    const el = await fixtureSync(html`
                <fx-fore>
                    <fx-model id="model1">
                        <fx-instance></fx-instance>
                    </fx-model>
                </fx-fore>
            `);

    await oneEvent(el, 'refresh-done');

    const instances = el.querySelectorAll('fx-instance');
    expect(instances[0].id).to.equal('default');
    expect(instances[0].getInstanceData()).to.exist;
    expect(instances[0].getDefaultContext()).to.exist;

  })

  /*
          it('does NOT copy a "body" element from inline data', async () => {
              const el =  (
                  await fixtureSync(html`
                      <fx-instance>
                          <data>
                              <body>
                                  <arm side="left">
                                      <hand>
                                          <finger index="3">middle</finger>
                                      </hand>
                                  </arm>
                              </body>
                          </data>
                      </fx-instance>

                  `)
              );

              el.init();
              await elementUpdated(el);
              const doc = el.getInstanceData();
              expect(doc).to.exist;

              const root = doc.documentElement;
              expect(root.nodeName).to.equal('data');
              console.log('root children ', root.children );

              const body = root.firstElementChild;
              expect(body.nodeName).to.equal('body');

              const arm = body.firstElementChild;
              expect(root.nodeName).to.equal('arm');

              const hand = arm.firstElementChild;
              expect(root.nodeName).to.equal('hand');

              const finger = hand.firstElementChild();
              expect(root.nodeName).to.equal('finger');
              expect(root.textContent).to.equal('middle');
          });
      */
});

;

