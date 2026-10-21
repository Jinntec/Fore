/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent, elementUpdated } from '@open-wc/testing';

import '../index.js';
import { isSafeNavigationUrl, isSameOrigin } from '../src/same-origin.js';
import { Fore } from '../src/fore.js';

describe('same-origin guard', () => {
  let warnings;
  let origWarn;

  beforeEach(() => {
    warnings = [];
    origWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));
  });

  afterEach(() => {
    console.warn = origWarn;
  });

  it('isSameOrigin tells same-origin from cross-origin urls', () => {
    expect(isSameOrigin('foo.html')).to.be.true;
    expect(isSameOrigin('/foo.html')).to.be.true;
    expect(isSameOrigin('#echo')).to.be.true;
    expect(isSameOrigin('localStore:key')).to.be.true;
    expect(isSameOrigin(`${window.location.origin}/foo.html`)).to.be.true;
    expect(isSameOrigin('https://evil.example/foo.html')).to.be.false;
    expect(isSameOrigin('//evil.example/foo.html')).to.be.false;
    expect(isSameOrigin('javascript:alert(1)')).to.be.false;
  });

  it('fx-load refuses to attach cross-origin content and warns', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-load event="ready" url="https://evil.example/payload.html" attach-to="#thetarget"></fx-load>
        <div id="thetarget"></div>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    await elementUpdated(el);
    expect(el.querySelector('#thetarget').children.length).to.equal(0);
    expect(warnings.some(w => w.includes('fx-load') && w.includes('evil.example'))).to.be.true;
  });

  it('fx-submission replace="target" refuses a cross-origin response and warns', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance><data></data></fx-instance>
          <fx-submission id="s" url="https://evil.example/x.html" method="get" replace="target" target="#thetarget">
          </fx-submission>
        </fx-model>
        <div id="thetarget"></div>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const sub = el.querySelector('#s');
    await sub._handleResponse('<img src=x onerror=alert(1)>', 'https://evil.example/x.html', 'text/html');
    expect(el.querySelector('#thetarget').children.length).to.equal(0);
    expect(warnings.some(w => w.includes('fx-submission') && w.includes('evil.example'))).to.be.true;
  });

  it('fx-submission replace="target" still works same-origin', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance><data></data></fx-instance>
          <fx-submission id="s" url="x.html" method="get" replace="target" target="#thetarget">
          </fx-submission>
        </fx-model>
        <div id="thetarget"></div>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const sub = el.querySelector('#s');
    await sub._handleResponse('<p>ok</p>', 'x.html', 'text/html');
    expect(el.querySelector('#thetarget p')).to.exist;
  });
  it('isSafeNavigationUrl only allows http(s) and relative urls', () => {
    expect(isSafeNavigationUrl('foo.html')).to.be.true;
    expect(isSafeNavigationUrl('/foo.html')).to.be.true;
    expect(isSafeNavigationUrl('#top')).to.be.true;
    expect(isSafeNavigationUrl('http://example.com/')).to.be.true;
    expect(isSafeNavigationUrl('https://example.com/')).to.be.true;
    expect(isSafeNavigationUrl('javascript:alert(1)')).to.be.false;
    expect(isSafeNavigationUrl(' JavaScript:alert(1)')).to.be.false;
    expect(isSafeNavigationUrl('data:text/html,<script>alert(1)</script>')).to.be.false;
    expect(isSafeNavigationUrl('vbscript:foo')).to.be.false;
  });

  it('fx-load refuses to navigate to a javascript: url and warns', async () => {
    window.__jsUrlRan = false;
    const el = fixtureSync(html`
      <fx-fore>
        <fx-load event="ready" url="javascript:window.__jsUrlRan=true" attach-to="_self"></fx-load>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    await elementUpdated(el);
    expect(window.__jsUrlRan).to.be.false;
    expect(warnings.some(w => w.includes('fx-load') && w.includes('javascript:'))).to.be.true;
  });

  it('fx-load refuses content when a same-origin url redirects cross-origin', async () => {
    const origFetch = window.fetch;
    window.fetch = async () => ({
      ok: true,
      url: 'https://evil.example/payload.html',
      text: async () => '<html><body><img src=x onerror="window.__redirectPwned=true"></body></html>',
    });
    try {
      window.__redirectPwned = false;
      const el = fixtureSync(html`
        <fx-fore>
          <fx-load event="ready" url="payload.html" attach-to="#thetarget"></fx-load>
          <div id="thetarget"></div>
        </fx-fore>
      `);
      await oneEvent(el, 'ready');
      await elementUpdated(el);
      expect(el.querySelector('#thetarget').children.length).to.equal(0);
      expect(warnings.some(w => w.includes('fx-load') && w.includes('evil.example'))).to.be.true;
    } finally {
      window.fetch = origFetch;
    }
  });

  it('fx-submission replace="target" refuses a response that was redirected cross-origin', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance><data></data></fx-instance>
          <fx-submission id="s" url="x.html" method="get" replace="target" target="#thetarget">
          </fx-submission>
        </fx-model>
        <div id="thetarget"></div>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    const sub = el.querySelector('#s');
    await sub._handleResponse(
      '<img src=x onerror=alert(1)>',
      'x.html',
      'text/html',
      'https://evil.example/x.html',
    );
    expect(el.querySelector('#thetarget').children.length).to.equal(0);
    expect(warnings.some(w => w.includes('fx-submission') && w.includes('evil.example'))).to.be.true;
  });

  it('fx-submission replace="redirect" refuses a javascript: url and warns', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance><data></data></fx-instance>
          <fx-submission id="s" url="x.html" method="get" replace="redirect"></fx-submission>
        </fx-model>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');
    window.__redirectRan = false;
    const sub = el.querySelector('#s');
    await sub._handleResponse('javascript:window.__redirectRan=true', 'x.html', 'text/plain');
    expect(window.__redirectRan).to.be.false;
    expect(warnings.some(w => w.includes('fx-submission') && w.includes('javascript:'))).to.be.true;
  });
  it('warning for blocked cross-origin content points to the github issue tracker', async () => {
    await Fore.loadHtml('https://evil.example/payload.html');
    expect(warnings.some(w => w.includes('https://github.com/Jinntec/Fore'))).to.be.true;
  });

  it('Fore.loadHtml refuses cross-origin urls without fetching', async () => {
    const origFetch = window.fetch;
    let fetched = false;
    window.fetch = async () => {
      fetched = true;
      return {};
    };
    try {
      const result = await Fore.loadHtml('https://evil.example/payload.html');
      expect(result).to.be.undefined;
      expect(fetched).to.be.false;
    } finally {
      window.fetch = origFetch;
    }
  });

  it('Fore.loadHtml refuses html that a same-origin url redirected cross-origin', async () => {
    const origFetch = window.fetch;
    window.fetch = async () => ({
      ok: true,
      url: 'https://evil.example/payload.html',
      headers: new Headers({ 'content-type': 'text/html' }),
      text: async () => '<img src=x onerror="window.__loadHtmlPwned=true">',
    });
    try {
      const result = await Fore.loadHtml('payload.html');
      expect(result).to.be.undefined;
      expect(warnings.some(w => w.includes('evil.example'))).to.be.true;
    } finally {
      window.fetch = origFetch;
    }
  });

  it('fx-include refuses cross-origin src and includes nothing', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-include immediate src="https://evil.example/payload.html"></fx-include>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    await elementUpdated(el);
    const inc = el.querySelector('fx-include');
    await inc.include();
    expect(inc.querySelector('[data-fx-include-content]')).to.not.exist;
    expect(warnings.some(w => w.includes('fx-include') && w.includes('evil.example'))).to.be.true;
  });

  it('fx-include still includes a same-origin template', async () => {
    const el = fixtureSync(html`
      <fx-fore>
        <fx-include immediate>
          <template><p id="inc">hi</p></template>
        </fx-include>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');
    await elementUpdated(el);
    expect(el.querySelector('#inc')).to.exist;
  });

  it('fx-control refuses a cross-origin src and warns', async () => {
    const origFetch = window.fetch;
    let fetched = false;
    window.fetch = async () => {
      fetched = true;
      return {};
    };
    try {
      const el = fixtureSync(html`
        <fx-fore>
          <fx-model><fx-instance><data><v>1</v></data></fx-instance></fx-model>
          <fx-control ref="v" src="https://evil.example/payload.html"></fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'ready');
      await elementUpdated(el);
      await el.querySelector('fx-control')._loadForeFromSrc();
      expect(fetched).to.be.false;
      expect(warnings.some(w => w.includes('fx-control') && w.includes('evil.example'))).to.be.true;
    } finally {
      window.fetch = origFetch;
    }
  });
});
