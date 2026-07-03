import { expect } from 'chai';
import createNodes from '../src/createNodes.js';
import '../src/fx-fore.js';
import { fixture, html } from '@open-wc/testing';

/**
 * @type {import('../src/fx-fore.js').FxFore}
 */
let foreElement = null;

/**
 * @type {Element}
 */
let baseElement = null;
describe('createNodes', () => {
  beforeEach(async () => {
    foreElement = await fixture(html`<fx-fore />`);

    baseElement = new window.DOMParser().parseFromString(
      '<xml />',
      'application/xml',
    ).documentElement;
  });

  it('can create a simple node ', () => {
    const xpath = 'p';
    const result = createNodes(xpath, baseElement, foreElement);
    expect(result).to.not.equal(null, 'The result should not be null');
    expect(result.outerHTML).to.equal('<p/>');
  });

  it('can create two nodes ', () => {
    const xpath = 'div/p';
    const result = createNodes(xpath, baseElement, foreElement);
    expect(result).to.not.equal(null, 'The result should not be null');
    expect(result.outerHTML).to.equal('<div><p/></div>');
  });

  it('can create a node with an attribute ', () => {
    const xpath = 'p[@class="aaa"]';
    const result = createNodes(xpath, baseElement, foreElement);
    expect(result).to.not.equal(null, 'The result should not be null');
    expect(result.outerHTML).to.equal('<p class="aaa"/>');
  });

  it('can create a node with a namespace ', () => {
    const xpath = 'my-prefix:p';
    foreElement.setAttribute('xmlns:my-prefix', 'my-namespace');
    const result = createNodes(xpath, baseElement, foreElement);
    expect(result).to.not.equal(null, 'The result should not be null');
    expect(result.outerHTML).to.equal('<p xmlns="my-namespace"/>');
  });

  it('can create a node with mixed namespaces', () => {
    const xpath = 'my-prefix:p/other-prefix:b';
    foreElement.setAttribute('xmlns:my-prefix', 'my-namespace');
    foreElement.setAttribute('xmlns:other-prefix', 'my-other-namespace');
    const result = createNodes(xpath, baseElement, foreElement);
    expect(result).to.not.equal(null, 'The result should not be null');
    expect(result.outerHTML).to.equal(
      '<p xmlns="my-namespace"><b xmlns="my-other-namespace"/></p>',
    );
  });

  it(`works for "listBibl[@type='transmission']/bibl"`, () => {
    const node = createNodes(`listBibl[@type='transmission']/bibl`, baseElement, foreElement);

    expect(node.outerHTML).to.equal('<listBibl type="transmission"><bibl/></listBibl>');
  });

  describe('recursive processing', () => {
    it('can make a path with new expressions in the predicate', () => {
      const xpath = 'a[b/c]';
      const result = createNodes(xpath, baseElement, foreElement);
      expect(result).to.not.equal(null, 'The result should not be null');
      expect(result.outerHTML).to.equal('<a><b><c/></b></a>');
    });

    it('Can make a structure with nested predicates: `p[b[@class="my-class"]]/@value`', () => {
      const node = createNodes(
        `p[b[@class="my-class"]][@value = "my-value"]`,
        baseElement,
        foreElement,
      );

      expect(node.outerHTML).to.equal('<p value="my-value"><b class="my-class"/></p>');
    });
  });
});
