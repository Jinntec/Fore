import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';
import '../index.js';
import { DependencyNotifyingDomFacade } from '../src/DependencyNotifyingDomFacade.js';
import { TemplateDependencyTracker } from '../src/template-dependency-tracker.js';

describe('DependencyNotifyingDomFacade and attributes', () => {
  it('a ref with a function can go to the parent of an attribute context', async () => {
    const fore = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html"
            ><data><item on="yes">A</item></data></fx-instance
          >
        </fx-model>
        <fx-group ref="item/@on">
          <fx-output id="o" ref="(..)[1]"></fx-output>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(fore, 'ready');
    expect(fore.querySelector('#o').value).to.equal('A');
  });

  it('a plain ref can go to the parent of an attribute context', async () => {
    const fore = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html"
            ><data><item on="yes">A</item></data></fx-instance
          >
        </fx-model>
        <fx-group ref="item/@on">
          <fx-output id="o" ref=".."></fx-output>
        </fx-group>
      </fx-fore>
    `);
    await oneEvent(fore, 'ready');
    expect(fore.querySelector('#o').value).to.equal('A');
  });

  it('does not report a parent for the data of a detached text node', () => {
    const touched = [];
    const facade = new DependencyNotifyingDomFacade(node => touched.push(node));
    const text = document.createTextNode('x');
    expect(facade.getData(text)).to.equal('x');
    expect(touched).to.deep.equal([]);
  });

  it('records an evaluation although a null was reported', () => {
    const root = document.implementation.createDocument(null, 'data');
    const tracker = new TemplateDependencyTracker(() => [root]);
    tracker.begin();
    const holder = document.createTextNode('{.}');
    expect(() => tracker.record(holder, [root.documentElement], new Set([null]))).not.to.throw();
  });
});
