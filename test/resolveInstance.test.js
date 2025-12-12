import { html, fixture, expect } from '@open-wc/testing';
import { XPathUtil } from '../src/xpath-util.js';

describe('XPathUtil.resolveInstance', () => {
  it('resolves explicit instance from ref', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="foo">
            <data><item>42</item></data>
          </fx-instance>
        </fx-model>
        <fx-control ref="instance('foo')/item"></fx-control>
      </fx-fore>
    `);

    const control = el.querySelector('fx-control');
    const result = XPathUtil.resolveInstance(control, control.getAttribute('ref'));
    expect(result).to.equal('foo');
  });

  it('resolves instance from parent binding', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="my-json" type="json">
            {"data": {"name": "test"}}
          </fx-instance>
        </fx-model>
        <fx-group ref="instance('my-json')/data">
          <fx-control id="ctrl" ref="name"></fx-control>
        </fx-group>
      </fx-fore>
    `);

    const control = el.querySelector('#ctrl');
    const result = XPathUtil.resolveInstance(control, control.getAttribute('ref'));
    expect(result).to.equal('my-json');
  });

  it('falls back to default instance if none found', async () => {
    const el = await fixture(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="default">
            <data><x>y</x></data>
          </fx-instance>
        </fx-model>
        <fx-control id="ctrl" ref="x"></fx-control>
      </fx-fore>
    `);

    const control = el.querySelector('#ctrl');
    const result = XPathUtil.resolveInstance(control, control.getAttribute('ref'));
    expect(result).to.equal('default');
  });
});
