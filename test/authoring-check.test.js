/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect } from '@open-wc/testing';
import { checkAuthoring } from '../src/authoring-check.js';

import '../index.js';

// checkAuthoring() does pure DOM queries — no need to wait for Fore's ready event.
// fixtureSync attaches elements to the document so ownerDocument.getElementById works.

describe('authoring-check Tests', () => {

  it('reports missing fx-submission', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-submission id="submit" method="post" url="#"></fx-submission>
        </fx-model>
        <fx-trigger><fx-send submission="save"></fx-send></fx-trigger>
      </fx-fore>
    `);
    const errors = checkAuthoring(fore);
    expect(errors.length).to.equal(1);
    expect(errors[0].message).to.include('save');
  });

  it('passes when fx-submission id matches', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-submission id="save" method="post" url="#"></fx-submission>
        </fx-model>
        <fx-trigger><fx-send submission="save"></fx-send></fx-trigger>
      </fx-fore>
    `);
    expect(checkAuthoring(fore)).to.deep.equal([]);
  });

  it('skips fx-send with template expression in submission', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model></fx-model>
        <fx-trigger><fx-send submission="{$sub}"></fx-send></fx-trigger>
      </fx-fore>
    `);
    expect(checkAuthoring(fore)).to.deep.equal([]);
  });

  it('reports missing fx-dispatch target element', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model></fx-model>
        <fx-trigger><fx-dispatch name="show" targetid="no-such-id"></fx-dispatch></fx-trigger>
      </fx-fore>
    `);
    const errors = checkAuthoring(fore);
    expect(errors.length).to.equal(1);
    expect(errors[0].message).to.include('no-such-id');
  });

  it('passes when fx-dispatch target element exists', () => {
    const fore = fixtureSync(html`
      <fx-fore id="my-fore">
        <fx-model></fx-model>
        <fx-trigger><fx-dispatch name="show" targetid="my-fore"></fx-dispatch></fx-trigger>
      </fx-fore>
    `);
    expect(checkAuthoring(fore)).to.deep.equal([]);
  });

  it('skips fx-dispatch with template expression in targetid', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model></fx-model>
        <fx-trigger><fx-dispatch name="show" targetid="{$id}"></fx-dispatch></fx-trigger>
      </fx-fore>
    `);
    expect(checkAuthoring(fore)).to.deep.equal([]);
  });

  it('reports instance() reference to missing fx-instance', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance><data></data></fx-instance>
          <fx-bind ref="x" relevant="instance('prefs')/debug = 'true'"></fx-bind>
        </fx-model>
      </fx-fore>
    `);
    const errors = checkAuthoring(fore);
    expect(errors.length).to.equal(1);
    expect(errors[0].message).to.include("instance('prefs')");
  });

  it('passes when instance() references existing fx-instance', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance><data></data></fx-instance>
          <fx-instance id="prefs"><prefs></prefs></fx-instance>
          <fx-bind ref="x" relevant="instance('prefs')/debug = 'true'"></fx-bind>
        </fx-model>
      </fx-fore>
    `);
    expect(checkAuthoring(fore)).to.deep.equal([]);
  });

  it('reports index() reference to missing fx-repeat', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance><data><pos>0</pos></data></fx-instance>
          <fx-bind ref="pos" calculate="index('my-list')"></fx-bind>
        </fx-model>
      </fx-fore>
    `);
    const errors = checkAuthoring(fore);
    expect(errors.length).to.equal(1);
    expect(errors[0].message).to.include("index('my-list')");
  });

  it('passes when index() references existing fx-repeat', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance><data><pos>0</pos><item>a</item></data></fx-instance>
          <fx-bind ref="pos" calculate="index('my-list')"></fx-bind>
        </fx-model>
        <fx-repeat id="my-list" ref="item"><template><span ref="."></span></template></fx-repeat>
      </fx-fore>
    `);
    expect(checkAuthoring(fore)).to.deep.equal([]);
  });

  it('reports fx-call action pointing to missing element', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model></fx-model>
        <fx-trigger><fx-call action="ghost-action"></fx-call></fx-trigger>
      </fx-fore>
    `);
    const errors = checkAuthoring(fore);
    expect(errors.length).to.equal(1);
    expect(errors[0].message).to.include('ghost-action');
  });

  it('passes when fx-call action element exists', () => {
    const fore = fixtureSync(html`
      <fx-fore id="call-fore">
        <fx-model></fx-model>
        <fx-trigger><fx-call action="call-fore"></fx-call></fx-trigger>
      </fx-fore>
    `);
    expect(checkAuthoring(fore)).to.deep.equal([]);
  });

  it('reports fx-show with missing dialog element', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model></fx-model>
        <fx-trigger><fx-show dialog="missing-dlg"></fx-show></fx-trigger>
      </fx-fore>
    `);
    const errors = checkAuthoring(fore);
    expect(errors.length).to.equal(1);
    expect(errors[0].message).to.include('missing-dlg');
  });

  it('reports fx-hide with missing dialog element', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model></fx-model>
        <fx-trigger><fx-hide dialog="missing-dlg"></fx-hide></fx-trigger>
      </fx-fore>
    `);
    const errors = checkAuthoring(fore);
    expect(errors.length).to.equal(1);
    expect(errors[0].message).to.include('missing-dlg');
  });

  it('passes when fx-show dialog element exists', () => {
    const fore = fixtureSync(html`
      <fx-fore id="dlg-fore">
        <fx-model></fx-model>
        <fx-trigger><fx-show dialog="dlg-fore"></fx-show></fx-trigger>
      </fx-fore>
    `);
    expect(checkAuthoring(fore)).to.deep.equal([]);
  });

  it('reports fx-load with missing attach-to target', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model></fx-model>
        <fx-trigger><fx-load attach-to="#no-such-slot" url="x.html"></fx-load></fx-trigger>
      </fx-fore>
    `);
    const errors = checkAuthoring(fore);
    expect(errors.length).to.equal(1);
    expect(errors[0].message).to.include('#no-such-slot');
  });

  it('passes when fx-load attach-to target exists', () => {
    const fore = fixtureSync(html`
      <fx-fore id="load-fore">
        <fx-model></fx-model>
        <fx-trigger><fx-load attach-to="#load-fore" url="x.html"></fx-load></fx-trigger>
      </fx-fore>
    `);
    expect(checkAuthoring(fore)).to.deep.equal([]);
  });

  it('skips fx-load _blank and _self targets', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model></fx-model>
        <fx-trigger><fx-load attach-to="_blank" url="x.html"></fx-load></fx-trigger>
      </fx-fore>
    `);
    expect(checkAuthoring(fore)).to.deep.equal([]);
  });

  it('reports fx-refresh with missing control element', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model></fx-model>
        <fx-trigger><fx-refresh control="ghost-ctrl"></fx-refresh></fx-trigger>
      </fx-fore>
    `);
    const errors = checkAuthoring(fore);
    expect(errors.length).to.equal(1);
    expect(errors[0].message).to.include('ghost-ctrl');
  });

  it('passes when fx-refresh control element exists', () => {
    const fore = fixtureSync(html`
      <fx-fore id="refresh-fore">
        <fx-model></fx-model>
        <fx-trigger><fx-refresh control="refresh-fore"></fx-refresh></fx-trigger>
      </fx-fore>
    `);
    expect(checkAuthoring(fore)).to.deep.equal([]);
  });

  it('reports fx-reset with missing instance', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance><data></data></fx-instance>
        </fx-model>
        <fx-trigger><fx-reset instance="scratch"></fx-reset></fx-trigger>
      </fx-fore>
    `);
    const errors = checkAuthoring(fore);
    expect(errors.length).to.equal(1);
    expect(errors[0].message).to.include('scratch');
  });

  it('passes when fx-reset instance exists', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance id="scratch"><data></data></fx-instance>
        </fx-model>
        <fx-trigger><fx-reset instance="scratch"></fx-reset></fx-trigger>
      </fx-fore>
    `);
    expect(checkAuthoring(fore)).to.deep.equal([]);
  });

  it('reports fx-setfocus with missing control element', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model></fx-model>
        <fx-trigger><fx-setfocus control="ghost-field"></fx-setfocus></fx-trigger>
      </fx-fore>
    `);
    const errors = checkAuthoring(fore);
    expect(errors.length).to.equal(1);
    expect(errors[0].message).to.include('ghost-field');
  });

  it('passes when fx-setfocus control element exists', () => {
    const fore = fixtureSync(html`
      <fx-fore id="focus-fore">
        <fx-model></fx-model>
        <fx-trigger><fx-setfocus control="focus-fore"></fx-setfocus></fx-trigger>
      </fx-fore>
    `);
    expect(checkAuthoring(fore)).to.deep.equal([]);
  });

  it('reports fx-toggle with missing fx-case', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model></fx-model>
        <fx-switch><fx-case id="tab-a" selected="true">A</fx-case></fx-switch>
        <fx-trigger><fx-toggle case="tab-b"></fx-toggle></fx-trigger>
      </fx-fore>
    `);
    const errors = checkAuthoring(fore);
    expect(errors.length).to.equal(1);
    expect(errors[0].message).to.include('tab-b');
  });

  it('passes when fx-toggle case exists', () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model></fx-model>
        <fx-switch>
          <fx-case id="tab-a" selected="true">A</fx-case>
          <fx-case id="tab-b">B</fx-case>
        </fx-switch>
        <fx-trigger><fx-toggle case="tab-b"></fx-toggle></fx-trigger>
      </fx-fore>
    `);
    expect(checkAuthoring(fore)).to.deep.equal([]);
  });

});
