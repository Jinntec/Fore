import {html, fixtureSync, expect, oneEvent} from '@open-wc/testing';

import '../index.js';

describe('create-nodes', () => {
    it('works for a simple case', async () => {
        const el = await fixtureSync(html`
            <fx-fore create-nodes>
                <fx-model id="model1">
                    <fx-instance>
                        <data>
                            <greeting>Hello!</greeting>
                        </data>
                    </fx-instance>
                    <fx-group ref=".">
                        <fx-control ref="greeting"></fx-control>
                        <fx-control ref="new-greeting"></fx-control>
                    </fx-group>
                </fx-model>
            </fx-fore>
        `);

        //      await elementUpdated(el);
        await oneEvent(el, 'ready');

        const inst = document.querySelector('fx-instance');

        expect(inst.instanceData.documentElement.innerHTML.replaceAll(/\s/g, '')).to.equal(
            '<greeting>Hello!</greeting><new-greeting/>',
        );
    });

    it('ignores "." expressions since they are not steps in our case', async () => {
        const el = await fixtureSync(html`
            <fx-fore create-nodes>
                <fx-model id="model1">
                    <fx-instance>
                        <data>
                            <greeting>Hello!</greeting>
                        </data>
                    </fx-instance>
                    <fx-group ref=".">
                        <fx-control ref="greeting"></fx-control>
                        <fx-control ref="./new-greeting/."></fx-control>
                    </fx-group>
                </fx-model>
            </fx-fore>
        `);

        //      await elementUpdated(el);
        await oneEvent(el, 'ready');

        const inst = document.querySelector('fx-instance');

        expect(inst.instanceData.documentElement.innerHTML.replaceAll(/\s/g, '')).to.equal(
            '<greeting>Hello!</greeting><new-greeting/>',
        );
    });

    it('works for a complex case', async () => {
        const el = await fixtureSync(html`
            <fx-fore create-nodes>
                <fx-model>
                    <fx-instance>
                        <data>
                            <root>
                                <foo>FOO</foo>
                                <bar>BAR</bar>
                            </root>
                        </data>
                    </fx-instance>
                </fx-model>

                <fx-group ref="root">
                    <fx-control ref="foo">
                        <label>I'm here from the get-go</label>
                    </fx-control>
                    <fx-control ref="baz">
                        <label>Not there initially, but will be created!</label>
                    </fx-control>
                    <fx-control ref="bar">
                        <label>I'm here from the get-go</label>
                    </fx-control>
                    <fx-control ref="new-element[@role='special']">
                        <label
                        >Not there initially, but will be created! With the attribute set to "{@role}"
                            ~~</label
                        >
                    </fx-control>
                    <fx-control ref="newest-element[@role='special']/extra-special[@specialness='extreme']">
                        <label
                        >Not there initially, but will be created! With the attribute, and a child! The
                            attributes are set to {ancestor-or-self::*/@*/(name() || "=" || .)} ~~</label
                        >
                    </fx-control>
                    <fx-group ref="a/very/deep[@path='here']">
                        <fx-control ref="and/now[@i='map']/to/@anAttribute"
                        ><label>And this nests ina group, and addresses an attribute!</label></fx-control
                        >
                    </fx-group>
                </fx-group>
            </fx-fore>
        `);

        //      await elementUpdated(el);
        await oneEvent(el, 'ready');

        const inst = document.querySelector('fx-instance');

        expect(inst.instanceData.documentElement.innerHTML.replaceAll(/\s/g, '')).to.equal(
            `<root>
        <foo>FOO</foo>
        <baz />
        <bar>BAR</bar>
        <new-elementrole ="special" />
        <newest-element role="special">
          <extra-special specialness="extreme" />
        </newest-element>
        <a>
          <very>
            <deep path="here">
              <and>
                <now i="map"><to anAttribute="" /> </now>
              </and>
            </deep>
          </very>
        </a>
      </root>`.replace(/\s/g, ''),
        );
    });

    it('uses binds to choose between positions', async () => {
        const el = fixtureSync(html`
            <fx-fore create-nodes>
                <fx-model>
                    <fx-instance>
                        <data>
                            <root>
                                <foo>FOO</foo>
                                <bar>BAR</bar>
                            </root>
                        </data>
                    </fx-instance>

                    <fx-bind ref="root">
                        <fx-bind ref="foo"></fx-bind>
                        <fx-bind ref="baz"></fx-bind>
                        <fx-bind ref="between-baz-and-bar"></fx-bind>
                        <fx-bind ref="bar"></fx-bind>
                        <fx-bind ref="new-element"></fx-bind>
                    </fx-bind>
                </fx-model>

                <fx-group ref="root">
                    <fx-control ref="foo"></fx-control>
                    <fx-control ref="baz"></fx-control>
                    <fx-control ref="bar"></fx-control>
                    <fx-control ref="new-element[@role='special']"></fx-control>
                    <fx-control ref="newest-element[@role='special']/extra-special[@specialness='extreme']">
                    </fx-control>
                    <fx-group ref="a/very/deep[@path='here']">
                        <fx-control ref="and/now[@i='map']/to/@anAttribute"></fx-control>
                    </fx-group>
                    <fx-control ref="between-baz-and-bar"></fx-control>
                </fx-group>
            </fx-fore>
        `);

        await oneEvent(el, 'ready');

        const inst = document.querySelector('fx-instance');

        expect(inst.instanceData.documentElement.innerHTML.replaceAll(/\s/g, '')).to.equal(
            `<root>
        <foo>FOO</foo>
        <baz />
        <between-baz-and-bar />
        <bar>BAR</bar>
        <new-element role="special" />
        <newest-element role="special">
          <extra-special specialness="extreme" />
        </newest-element>
        <a>
          <very>
            <deep path="here">
              <and>
                <now i="map">
                  <to anAttribute="" />
                </now>
              </and>
            </deep>
          </very>
        </a>
      </root>`.replaceAll(/\s/g, ''),
        );
    });

    it('accepts binds starting at the documentelement', async () => {
        const el = fixtureSync(html`
            <fx-fore create-nodes>
                <fx-model>
                    <fx-instance src="/base/test/foobar.xml"></fx-instance>

                    <fx-bind ref="root"></fx-bind>
                    <fx-bind ref="foo"></fx-bind>
                    <fx-bind ref="bar"></fx-bind>
                </fx-model>

                <fx-group ref=".">
                    <fx-control ref="baz"></fx-control>
                    <fx-control ref="foo"></fx-control>
                    <fx-control ref="bar"></fx-control>
                </fx-group>
            </fx-fore>
        `);

        await oneEvent(el, 'ready');

        const inst = document.querySelector('fx-instance');

        expect(inst.instanceData.documentElement.outerHTML.replaceAll(/\s/g, '')).to.equal(
            `<root>
        <foo>FOO</foo>
        <bar />
        <baz>BAZ</baz>
      </root> `.replaceAll(/\s/g, ''),
        );
    });

    it('Does not panic when a repeat over strings is near the controls', async () => {
        const el = fixtureSync(html`
            <fx-fore create-nodes>
                <fx-model>
                    <fx-instance src="/base/test/foobar.xml"></fx-instance>

                    <fx-bind ref="root"></fx-bind>
                    <fx-bind ref="foo"></fx-bind>
                    <fx-bind ref="bar"></fx-bind>
                </fx-model>

                <fx-repeat ref="('a', 'b', 'c')">
                    <template>
                        <fx-output ref="."></fx-output>
                    </template>
                </fx-repeat>

                <fx-group ref=".">
                    <fx-control ref="baz"></fx-control>
                    <fx-control ref="foo"></fx-control>
                    <fx-control ref="bar"></fx-control>
                </fx-group>
            </fx-fore>
        `);

        await oneEvent(el, 'ready');

        const inst = document.querySelector('fx-instance');

        expect(inst.instanceData.documentElement.outerHTML.replaceAll(/\s/g, '')).to.equal(
            `<root>
        <foo>FOO</foo>
        <bar />
        <baz>BAZ</baz>
      </root> `.replaceAll(/\s/g, ''),
        );
    });

    it('creates *:gender/@value for a practitioner loaded from external xml', async () => {
        const el = fixtureSync(html`
            <fx-fore
                    create-nodes
                    xmlns:fhir="http://hl7.org/fhir"
                    id="fx-practitioner-edit"
                    role="form"
            >
                <fx-model>
                    <fx-instance src="/base/test/data/practitioner.xml"></fx-instance>

                    <fx-instance id="i-datatypes">
                        <data>
                            <gender value="">
                                <code value="male" label="male"></code>
                                <code value="female" label="female"></code>
                            </gender>
                        </data>
                    </fx-instance>
                </fx-model>

                <fx-group ref="instance()">
                    <fieldset id="practitioner-edit">
                        <legend>
                            <label>Practitioner</label>
                        </legend>

                        <fx-control id="tce-gender" ref="*:gender/@value">
                            <label>Geschlecht</label>
                            <select class="widget" ref="instance('i-datatypes')/gender/code">
                                <template>
                                    <option value="{@value}">{@label}</option>
                                </template>
                            </select>
                        </fx-control>
                    </fieldset>
                </fx-group>
            </fx-fore>
        `);

        await oneEvent(el, 'ready');

        const inst = el.querySelector('fx-instance');
        const practitioner = inst.instanceData.documentElement;

        expect(practitioner.localName).to.equal('Practitioner');
        expect(practitioner.namespaceURI).to.equal('http://hl7.org/fhir');

        const gender = practitioner.getElementsByTagNameNS('http://hl7.org/fhir', 'gender')[0];
        expect(gender).to.exist;
        expect(gender.getAttribute('value')).to.equal('');

        const control = el.querySelector('#tce-gender');
        expect(control).to.exist;

        const modelItem = control.getModelItem();
        expect(modelItem).to.exist;
        expect(modelItem.node).to.exist;
        expect(modelItem.node.nodeType).to.equal(Node.ATTRIBUTE_NODE);
        expect(modelItem.node.name).to.equal('value');
        expect(modelItem.node.ownerElement.localName).to.equal('gender');
        expect(modelItem.node.ownerElement.namespaceURI).to.equal('http://hl7.org/fhir');
    });
});
