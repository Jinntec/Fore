/* eslint-disable no-unused-expressions */
import {
  html, oneEvent, fixtureSync, expect, elementUpdated,
} from '@open-wc/testing';

import '../src/fx-fore.js';
import '../src/fx-model.js';
import '../src/fx-instance.js';
import '../src/fx-bind.js';

describe('initialize form', () => {
  it('model emits model-construct-done', async () => {
    const el = await fixtureSync(html`
      <fx-model id="model1"> </fx-model>
    `);

    setTimeout(() => el.modelConstruct());

    const { detail } = await oneEvent(el, 'model-construct-done');
    expect(detail.model.id).to.equal('model1');
  });

  it('ready event is emitted after first complete render', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting type="message:">Hello World!</greeting>
            </data>
          </fx-instance>
        </fx-model>
      </fx-fore>
    `);

    await oneEvent(el, 'ready');
    expect(el.ready).to.be.true;
  });

  it('initialized model', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting>Hello World!</greeting>
            </data>
          </fx-instance>
          <fx-instance id="second">
            <data>
              <outro>GoodBye</outro>
            </data>
          </fx-instance>
          <fx-bind id="b-greeting" ref="greeting" required="1 = 1"></fx-bind>
        </fx-model>
      </fx-fore>
    `);
    const model = el.querySelector('fx-model');
    // await model.updated();
    await elementUpdated(model);
    expect(model).to.exist;
    expect(model.id).to.equal('model1');
    expect(model.instances.length).to.equal(2);
  });

  it('created modelItem', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model id="model1">
          <fx-instance>
            <data>
              <greeting>Hello World!</greeting>
            </data>
          </fx-instance>
          <fx-instance id="second">
            <data>
              <greeting>GoodBye</greeting>
            </data>
          </fx-instance>
          <fx-bind id="b-greeting" ref="greeting" required="1 = 1"></fx-bind>
        </fx-model>
      </fx-fore>
    `);
    const model = el.querySelector('fx-model');
    // await model.updated();
    await elementUpdated(model);

    // there is one binding
    expect(el.model.modelItems.length).to.equal(1);

    const greetingMap = el.model.modelItems[0];

    // binding refers to <greeting> node
    expect(greetingMap.node.nodeName).to.equal('greeting');

    // modelitem is initialized to correct values
    const mi = greetingMap;
    expect(mi.readonly).to.equal(false);
    expect(mi.required).to.equal(true);
    expect(mi.relevant).to.equal(true);
    expect(mi.constraint).to.equal(true);
    // expect(mi.type).to.equal('xs:string');
  });

  it('has paper-dialog', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance>
            <data></data>
          </fx-instance>
        </fx-model>
      </fx-fore>
    `);
    // await model.updated();
    // await elementUpdated(el);
    await oneEvent(el, 'refresh-done');
    console.log('el ', el);
    const dialog = el.shadowRoot.querySelector('#modalMessage');
    expect(dialog).to.exist;
    expect(dialog.classList.contains('overlay')).to.be.true;
    expect(dialog).to.be.visible;
  });
});
