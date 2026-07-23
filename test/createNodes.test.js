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

  it('can create a simple node', () => {
    const xpath = 'p';
    const result = createNodes(xpath, baseElement, foreElement);
    expect(result).to.not.equal(null, 'The result should not be null');
    expect(result.outerHTML).to.equal('<p/>');
  });

  it('can create two nodes', () => {
    const xpath = 'div/p';
    const result = createNodes(xpath, baseElement, foreElement);
    expect(result).to.not.equal(null, 'The result should not be null');
    expect(result.outerHTML).to.equal('<div><p/></div>');
  });

  it('can create a node with an attribute', () => {
    const xpath = 'p[@class="aaa"]';
    const result = createNodes(xpath, baseElement, foreElement);
    expect(result).to.not.equal(null, 'The result should not be null');
    expect(result.outerHTML).to.equal('<p class="aaa"/>');
  });

  it('can create a node with an attribute set to empty string', () => {
    const xpath = 'p[@class=""]';
    const result = createNodes(xpath, baseElement, foreElement);
    expect(result).to.not.equal(null, 'The result should not be null');
    expect(result.outerHTML).to.equal('<p class=""/>');
  });

  it('can create a node with an attribute as a path step', () => {
    const xpath = 'p/@class';
    const result = createNodes(xpath, baseElement, foreElement);
    expect(result).to.not.equal(null, 'The result should not be null');
    expect(result.outerHTML).to.equal('<p class=""/>');
  });

  it('can create a node with a namespace', () => {
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

  it('Does not create attribute path nodes on the root, only in predicates', () => {
    // Otherwise groups would never turn irrelevant. This would just create the attribute:  <fx-group ref="foo/@type='not-baz'">
    const result = createNodes(`foo/@type='not-baz'`, baseElement, foreElement);
    expect(result).to.equal(null, 'The result should be null');
  });

  it('Does not create attribute path nodes on the root, only in predicates. Even if the attribute is tested to be empty', () => {
    // Otherwise groups would never turn irrelevant. This would just create the attribute:  <fx-group ref="foo/@type='not-baz'">
    const result = createNodes(`foo/@type=''`, baseElement, foreElement);
    expect(result).to.equal(null, 'The result should be null');
  });

  it('Does not set the values of elements outside of predicates', () => {
    const result = createNodes(
      `InvoiceLine/Item/AdditionalItemProperty/Name='RightType'`,
      baseElement,
      foreElement,
    );
    expect(result).to.equal(null, 'The result should be null');
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

    it('Can make a structure with nested predicates: `*:name[*:name/@attr="value"]`', () => {
      const result = createNodes(`*:name[*:name/@attr='value']`, baseElement, foreElement);
      expect(result).to.not.equal(null, 'The result should not be null');

      expect(result.outerHTML).to.equal('<name><name attr="value"/></name>');
    });

    it('Can set values of elements in predicates', () => {
      const result = createNodes(
        `InvoiceLine/Item/AdditionalItemProperty[Name='RightType']/Value`,
        baseElement,
        foreElement,
      );
      expect(result).to.not.equal(null, 'The result should not be null');

      expect(result.outerHTML).to.equal(
        '<InvoiceLine><Item><AdditionalItemProperty><Name>RightType</Name><Value/></AdditionalItemProperty></Item></InvoiceLine>',
      );
    });
  });
});
