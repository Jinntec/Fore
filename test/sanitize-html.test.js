import { expect } from '@open-wc/testing';

import { setSanitizedHtml } from '../src/sanitize-html.js';

describe('sanitize-html', () => {
  const payload =
    '<p onclick="window.xssHappened()">text</p>' +
    '<img src="x" onerror="window.xssHappened()">' +
    '<script>window.xssHappened()</script>';

  it('keeps benign markup intact', () => {
    const el = document.createElement('div');
    setSanitizedHtml(
      el,
      '<div class="a" style="color:red"><b>bold</b> <img src="pic.png" alt="pic"> <a href="https://example.com/">link</a></div>',
    );
    const div = el.querySelector('div.a');
    expect(div.getAttribute('style')).to.equal('color:red');
    expect(div.querySelector('b').textContent).to.equal('bold');
    expect(div.querySelector('img').getAttribute('src')).to.equal('pic.png');
    expect(div.querySelector('img').getAttribute('alt')).to.equal('pic');
    expect(div.querySelector('a').getAttribute('href')).to.equal('https://example.com/');
  });

  it('strips scripts and event handlers but keeps benign parts', () => {
    const el = document.createElement('div');
    setSanitizedHtml(el, payload);
    expect(el.querySelector('script')).to.not.exist;
    expect(el.querySelector('p').getAttribute('onclick')).to.not.exist;
    expect(el.querySelector('img').getAttribute('onerror')).to.not.exist;
    expect(el.querySelector('p').textContent).to.equal('text');
    expect(el.querySelector('img').getAttribute('src')).to.equal('x');
  });

  it('strips javascript: URLs', () => {
    const el = document.createElement('div');
    setSanitizedHtml(el, '<a href="javascript:window.xssHappened()">x</a>');
    expect(el.querySelector('a').getAttribute('href')).to.not.equal(
      'javascript:window.xssHappened()',
    );
  });

  it('is hardened against mutation-XSS vectors', () => {
    const el = document.createElement('div');
    setSanitizedHtml(
      el,
      '<math><mtext><table><mglyph><style><!--</style><img src="x" onerror="window.xssHappened()">',
    );
    el.querySelectorAll('img').forEach(img => {
      expect(img.getAttribute('onerror')).to.not.exist;
    });
  });
});
