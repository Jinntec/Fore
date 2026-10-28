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

  describe('touchOrigin', () => {
    const doc = () => new DOMParser().parseFromString('<d a="1"><x/><y/></d>', 'application/xml');

    const touchedBy = (options, read) => {
      const touched = [];
      read(
        new DependencyNotifyingDomFacade(n => touched.push(n), null, options),
        doc().documentElement,
      );
      return touched.map(n => n.nodeName);
    };

    it('is off by default: only what is returned is reported', () => {
      expect(touchedBy({}, (f, d) => f.getFirstChild(d))).to.deep.equal(['x']);
      expect(touchedBy({}, (f, d) => f.getAttribute(d, 'missing'))).to.deep.equal([]);
      expect(touchedBy({}, (f, d) => f.getChildNodes(d))).to.deep.equal(['x', 'y']);
    });

    it('also reports the node a step starts from', () => {
      expect(touchedBy({ touchOrigin: true }, (f, d) => f.getFirstChild(d))).to.deep.equal([
        'd',
        'x',
      ]);
      expect(touchedBy({ touchOrigin: true }, (f, d) => f.getLastChild(d))).to.deep.equal([
        'd',
        'y',
      ]);
      expect(
        touchedBy({ touchOrigin: true }, (f, d) => f.getNextSibling(d.firstChild)),
      ).to.deep.equal(['d', 'y']);
      expect(
        touchedBy({ touchOrigin: true }, (f, d) => f.getPreviousSibling(d.lastChild)),
      ).to.deep.equal(['d', 'x']);
      expect(touchedBy({ touchOrigin: true }, (f, d) => f.getChildNodes(d))).to.deep.equal([
        'd',
        'x',
        'y',
      ]);
      expect(
        touchedBy({ touchOrigin: true }, (f, d) => f.getAttribute(d, 'missing')),
      ).to.deep.equal(['d']);
    });

    it('keeps the option when delegating to an inner facade', () => {
      const facade = new DependencyNotifyingDomFacade(() => {}, null, { touchOrigin: true });
      expect(facade.withInner({})._touchOrigin).to.equal(true);
    });
  });
});
