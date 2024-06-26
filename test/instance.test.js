/* eslint-disable no-unused-expressions */
import {
  html, oneEvent, fixtureSync, expect,
} from '@open-wc/testing';

import '../src/fx-instance.js';
import { Fore } from '../src/fore.js';
import { XPathUtil } from '../src/xpath-util';

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
    expect(XPathUtil.getPath(result, 'default')).to.equal('$default/foobar[1]');
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
    expect(XPathUtil.getPath(context, 'default')).to.equal('$default/data[1]');
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
    expect(XPathUtil.getPath(root, 'default')).to.equal('$default/data[1]');

    console.log('root children ', root.children);
    let n = root.firstElementChild;
    expect(n.nodeName).to.equal('arm');

    expect(XPathUtil.getPath(n, 'default')).to.equal('$default/arm[1]');

    n = n.firstElementChild;
    expect(n.nodeName).to.equal('hand');

    n = n.firstElementChild;
    expect(n.nodeName).to.equal('finger');
    expect(XPathUtil.getPath(n, 'default')).to.equal('$default/arm[1]/hand[1]/finger[1]');
    expect(n.textContent).to.equal('middle');
    expect(XPathUtil.getPath(n, 'default')).to.equal('$default/arm[1]/hand[1]/finger[1]');
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

    expect(XPathUtil.getPath(instances[0].getDefaultContext(), 'default')).to.equal('$default/data[1]');
    expect(XPathUtil.getPath(instances[1].getDefaultContext(), 'second')).to.equal('$second/data[1]');

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

  it('uses the correct namespace bindings', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance
            id="instance-1"
            xpath-default-namespace="http://www.example.com/"
            src="base/test/instance-namespace.xml"
          ></fx-instance>
        </fx-model>

        <span id="default-span">{greeting}</span>
        <span id="pointed-span">{instance("instance-1")/greeting}</span>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const defaultSpan = el.querySelector('#default-span');
    const pointedSpan = el.querySelector('#pointed-span');

    expect(defaultSpan.innerText).to.equal('hello from the file');
    expect(pointedSpan.innerText).to.equal('hello from the file');
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
  });

  it('resolves instance correctly for nested fore elements', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <value>outer value</value>
            </data>
          </fx-instance>
          <fx-instance id="another">
            <data>
              <value>another outer value</value>
            </data>
          </fx-instance>
        </fx-model>

        <div id="outer">{value}</div>
        <div id="anotherouter">{instance('another')/value}</div>

        <fx-fore>
          <fx-model>
            <fx-instance>
              <data>
                <value>inner value</value>
              </data>
            </fx-instance>
            <fx-instance id="another">
              <data>
                <value>another inner value</value>
              </data>
            </fx-instance>
          </fx-model>

          <div id="inner">{value}</div>
          <div id="anotherinner">{instance('another')/value}</div>

        </fx-fore>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const outer = el.querySelector('#outer');
    expect(outer.innerText).to.equal('outer value');
    const anotherouter = el.querySelector('#anotherouter');
    expect(anotherouter.innerText).to.equal('another outer value');

    const inner = el.querySelector('#inner');
    expect(inner.innerText).to.equal('inner value');
    const anotherinner = el.querySelector('#anotherinner');
    expect(anotherinner.innerText).to.equal('another inner value');
  });

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
