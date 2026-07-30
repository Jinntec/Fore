/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';
import '../tools/debug/fx-debugger.js';

function detailValue(panel, label) {
  const dt = Array.from(panel.querySelectorAll('.fx-debugger__details dt')).find(
    node => node.textContent.trim() === label,
  );

  return dt ? dt.nextElementSibling.textContent.trim() : undefined;
}

function activePanelEl(debuggerEl) {
  return debuggerEl.querySelector('.fx-debugger__panel');
}

describe('fx-debugger tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows an error notice when the target fx-fore cannot be resolved', async () => {
    const el = await fixtureSync(html`
      <fx-debugger for="does-not-exist"></fx-debugger>
    `);

    const notice = el.querySelector('.fx-debugger__notice--error');
    expect(notice).to.exist;
    expect(notice.textContent).to.include('Could not resolve a target');
  });

  it('resolves the target fore and shows correct top-level info in the Fore panel', async () => {
    const el = await fixtureSync(html`
      <div>
        <fx-debugger for="f1"></fx-debugger>
        <fx-fore id="f1">
          <fx-model>
            <fx-instance>
              <data>
                <name>Alice</name>
              </data>
            </fx-instance>
            <fx-bind ref="name" required="true()"></fx-bind>
            <fx-submission id="save" method="post" url="#"></fx-submission>
          </fx-model>
          <fx-control ref="name"></fx-control>
        </fx-fore>
      </div>
    `);

    const fore = el.querySelector('fx-fore');
    const debuggerEl = el.querySelector('fx-debugger');

    await oneEvent(fore, 'ready');
    debuggerEl.refresh();
    debuggerEl.render();

    const panel = activePanelEl(debuggerEl);
    expect(detailValue(panel, 'ID')).to.equal('f1');
    expect(detailValue(panel, 'Ready')).to.equal('true');
    expect(detailValue(panel, 'Instances')).to.equal('1');
    expect(detailValue(panel, 'Bindings')).to.equal('1');
    expect(detailValue(panel, 'Submissions')).to.equal('1');
    expect(detailValue(panel, 'Bound elements')).to.equal('1');
  });

  it('Instances panel shows correct instance data after switching tabs', async () => {
    const el = await fixtureSync(html`
      <div>
        <fx-debugger for="f1"></fx-debugger>
        <fx-fore id="f1">
          <fx-model>
            <fx-instance>
              <data>
                <name>Alice</name>
              </data>
            </fx-instance>
          </fx-model>
          <fx-control ref="name"></fx-control>
        </fx-fore>
      </div>
    `);

    const fore = el.querySelector('fx-fore');
    const debuggerEl = el.querySelector('fx-debugger');

    await oneEvent(fore, 'refresh-done');
    debuggerEl.refresh();
    debuggerEl.render();

    debuggerEl.querySelector('[data-panel="instances"]').click();

    // render() replaces the whole innerHTML on tab switch, so re-query fresh nodes.
    expect(debuggerEl.querySelector('[data-panel="instances"]').getAttribute('aria-selected')).to.equal(
      'true',
    );

    const row = debuggerEl.querySelector('.fx-debugger__panel table tbody tr');
    expect(row).to.exist;

    const cells = row.querySelectorAll('td');
    expect(cells[1].textContent.trim()).to.equal('xml'); // Type
    expect(cells[4].textContent.trim()).to.equal('true'); // Has data
  });

  it('Bindings panel shows correct bind attributes', async () => {
    const el = await fixtureSync(html`
      <div>
        <fx-debugger for="f1"></fx-debugger>
        <fx-fore id="f1">
          <fx-model>
            <fx-instance>
              <data>
                <name>Alice</name>
              </data>
            </fx-instance>
            <fx-bind ref="name" required="true()"></fx-bind>
          </fx-model>
          <fx-control ref="name"></fx-control>
        </fx-fore>
      </div>
    `);

    const fore = el.querySelector('fx-fore');
    const debuggerEl = el.querySelector('fx-debugger');

    await oneEvent(fore, 'refresh-done');
    debuggerEl.activePanel = 'bindings';
    debuggerEl.refresh();
    debuggerEl.render();

    const row = debuggerEl.querySelector('.fx-debugger__panel table tbody tr');
    expect(row).to.exist;

    const cells = row.querySelectorAll('td');
    expect(cells[1].textContent.trim()).to.equal('name'); // Ref
    expect(cells[6].textContent.trim()).to.equal('true()'); // Required (raw attribute value)
  });

  it('Model Items panel shows correct values and the path filter narrows results', async () => {
    const el = await fixtureSync(html`
      <div>
        <fx-debugger for="f1"></fx-debugger>
        <fx-fore id="f1">
          <fx-model>
            <fx-instance>
              <data>
                <name>Alice</name>
              </data>
            </fx-instance>
          </fx-model>
          <fx-control ref="name"></fx-control>
        </fx-fore>
      </div>
    `);

    const fore = el.querySelector('fx-fore');
    const debuggerEl = el.querySelector('fx-debugger');

    await oneEvent(fore, 'refresh-done');
    debuggerEl.activePanel = 'modelItems';
    debuggerEl.refresh();
    debuggerEl.render();

    let rows = debuggerEl.querySelectorAll('.fx-debugger__panel table tbody tr');
    const values = Array.from(rows).map(row => row.querySelectorAll('td')[3].textContent.trim());
    expect(values).to.include('Alice');

    const filterInput = debuggerEl.querySelector('[data-model-items-path-filter]');
    filterInput.value = 'does-not-match-anything';
    filterInput.dispatchEvent(new Event('input', { bubbles: true }));

    expect(debuggerEl.querySelector('.fx-debugger__empty').textContent).to.include(
      'No model items match filter.',
    );

    debuggerEl.querySelector('[data-action="clear-model-items-filter"]').click();

    rows = debuggerEl.querySelectorAll('.fx-debugger__panel table tbody tr');
    expect(rows.length).to.be.greaterThan(0);
  });

  it('Bound Elements panel shows the correct control value', async () => {
    const el = await fixtureSync(html`
      <div>
        <fx-debugger for="f1"></fx-debugger>
        <fx-fore id="f1">
          <fx-model>
            <fx-instance>
              <data>
                <name>Alice</name>
              </data>
            </fx-instance>
          </fx-model>
          <fx-control ref="name"></fx-control>
        </fx-fore>
      </div>
    `);

    const fore = el.querySelector('fx-fore');
    const debuggerEl = el.querySelector('fx-debugger');

    await oneEvent(fore, 'refresh-done');
    debuggerEl.activePanel = 'boundElements';
    debuggerEl.refresh();
    debuggerEl.render();

    const row = debuggerEl.querySelector('.fx-debugger__panel table tbody tr');
    expect(row).to.exist;

    const cells = row.querySelectorAll('td');
    expect(cells[2].textContent.trim()).to.equal('name'); // Ref
    expect(cells[5].textContent.trim()).to.equal('Alice'); // Value
  });

  it('reflects a value change automatically, without an explicit refresh() call', async () => {
    const el = await fixtureSync(html`
      <div>
        <fx-debugger for="f1"></fx-debugger>
        <fx-fore id="f1">
          <fx-model>
            <fx-instance>
              <data>
                <name>Alice</name>
              </data>
            </fx-instance>
          </fx-model>
          <fx-control ref="name"></fx-control>
          <fx-trigger>
            <button></button>
            <fx-setvalue ref="name">Bob</fx-setvalue>
          </fx-trigger>
        </fx-fore>
      </div>
    `);

    const fore = el.querySelector('fx-fore');
    const debuggerEl = el.querySelector('fx-debugger');
    const trigger = el.querySelector('fx-trigger');

    await oneEvent(fore, 'refresh-done');
    debuggerEl.activePanel = 'boundElements';
    debuggerEl.refresh();
    debuggerEl.render();

    let row = debuggerEl.querySelector('.fx-debugger__panel table tbody tr');
    expect(row.querySelectorAll('td')[5].textContent.trim()).to.equal('Alice');

    // No explicit debuggerEl.refresh()/render() call here: this relies purely
    // on fx-debugger's own 'refresh-done' listener to stay up to date. Arm the
    // listener before acting, since 'refresh-done' can fire before
    // performActions() resolves.
    const refreshDone = oneEvent(fore, 'refresh-done');
    await trigger.performActions();
    await refreshDone;

    row = debuggerEl.querySelector('.fx-debugger__panel table tbody tr');
    expect(row.querySelectorAll('td')[5].textContent.trim()).to.equal('Bob');
  });

  it('Refresh button re-syncs the panel with the current model state', async () => {
    const el = await fixtureSync(html`
      <div>
        <fx-debugger for="f1"></fx-debugger>
        <fx-fore id="f1">
          <fx-model>
            <fx-instance>
              <data>
                <name>Alice</name>
              </data>
            </fx-instance>
          </fx-model>
          <fx-control ref="name"></fx-control>
          <fx-trigger>
            <button></button>
            <fx-setvalue ref="name">Bob</fx-setvalue>
          </fx-trigger>
        </fx-fore>
      </div>
    `);

    const fore = el.querySelector('fx-fore');
    const debuggerEl = el.querySelector('fx-debugger');
    const trigger = el.querySelector('fx-trigger');

    await oneEvent(fore, 'refresh-done');
    debuggerEl.activePanel = 'boundElements';
    debuggerEl.refresh();
    debuggerEl.render();

    // Mutate the model and click Refresh right away, without waiting for
    // 'refresh-done' — the button's own refresh()+render() call must show
    // the current value regardless of the automatic listener's timing.
    await trigger.performActions();
    debuggerEl.querySelector('[data-action="refresh"]').click();

    const row = debuggerEl.querySelector('.fx-debugger__panel table tbody tr');
    expect(row.querySelectorAll('td')[5].textContent.trim()).to.equal('Bob');
  });

  it('Events panel captures fore events and clear-events empties it', async () => {
    const el = await fixtureSync(html`
      <div>
        <fx-debugger for="f1"></fx-debugger>
        <fx-fore id="f1">
          <fx-model>
            <fx-instance>
              <data>
                <name>Alice</name>
              </data>
            </fx-instance>
          </fx-model>
          <fx-control ref="name"></fx-control>
          <fx-trigger>
            <button></button>
            <fx-setvalue ref="name">Bob</fx-setvalue>
          </fx-trigger>
        </fx-fore>
      </div>
    `);

    const fore = el.querySelector('fx-fore');
    const debuggerEl = el.querySelector('fx-debugger');
    const trigger = el.querySelector('fx-trigger');

    await oneEvent(fore, 'refresh-done');
    debuggerEl.activePanel = 'events';
    debuggerEl.refresh();
    debuggerEl.render();

    await trigger.performActions();
    debuggerEl.render();

    const rows = debuggerEl.querySelectorAll('.fx-debugger__event-table tbody tr');
    expect(rows.length).to.be.greaterThan(0);

    const badge = debuggerEl.querySelector('[data-panel="events"] .fx-debugger__badge');
    expect(Number(badge.textContent.trim())).to.be.greaterThan(0);

    debuggerEl.querySelector('[data-action="clear-events"]').click();

    expect(debuggerEl.querySelector('.fx-debugger__event-table')).to.not.exist;
    expect(debuggerEl.querySelector('.fx-debugger__empty').textContent).to.include(
      'No Fore events captured yet',
    );
  });

  it('shows empty states for panels with no data', async () => {
    const el = await fixtureSync(html`
      <div>
        <fx-debugger for="f1"></fx-debugger>
        <fx-fore id="f1">
          <fx-model>
            <fx-instance>
              <data>
                <name>Alice</name>
              </data>
            </fx-instance>
          </fx-model>
        </fx-fore>
      </div>
    `);

    const fore = el.querySelector('fx-fore');
    const debuggerEl = el.querySelector('fx-debugger');

    await oneEvent(fore, 'refresh-done');

    debuggerEl.activePanel = 'bindings';
    debuggerEl.refresh();
    debuggerEl.render();
    expect(debuggerEl.querySelector('.fx-debugger__empty').textContent).to.include(
      'No bindings found.',
    );

    debuggerEl.activePanel = 'submissions';
    debuggerEl.refresh();
    debuggerEl.render();
    expect(debuggerEl.querySelector('.fx-debugger__empty').textContent).to.include(
      'No submissions found.',
    );
  });

  it('lists multiple fore targets and switches between them', async () => {
    const el = await fixtureSync(html`
      <div>
        <fx-debugger for="f1"></fx-debugger>
        <fx-fore id="f1">
          <fx-model>
            <fx-instance>
              <data>
                <name>Alice</name>
              </data>
            </fx-instance>
          </fx-model>
          <fx-control ref="name"></fx-control>
        </fx-fore>
        <fx-fore id="f2">
          <fx-model>
            <fx-instance>
              <data>
                <name>Carol</name>
              </data>
            </fx-instance>
          </fx-model>
          <fx-control ref="name"></fx-control>
        </fx-fore>
      </div>
    `);

    const [fore1, fore2] = el.querySelectorAll('fx-fore');
    const debuggerEl = el.querySelector('fx-debugger');

    // Arm both listeners before awaiting either: the two fores initialize
    // concurrently, so awaiting fore1 first can miss fore2's first
    // 'refresh-done' if it fires while we're still waiting on fore1.
    const fore1Done = oneEvent(fore1, 'refresh-done');
    const fore2Done = oneEvent(fore2, 'refresh-done');
    await fore1Done;
    await fore2Done;
    debuggerEl.activePanel = 'boundElements';
    debuggerEl.refresh();
    debuggerEl.render();

    const targetButtons = debuggerEl.querySelectorAll('[data-fore-target]');
    expect(targetButtons.length).to.equal(2);

    const currentButton = debuggerEl.querySelector('.fx-debugger__fore-target--current');
    expect(currentButton.dataset.foreTarget).to.equal('f1');

    debuggerEl.querySelector('[data-fore-target="f2"]').click();

    expect(debuggerEl.getAttribute('for')).to.equal('f2');

    const row = debuggerEl.querySelector('.fx-debugger__panel table tbody tr');
    expect(row.querySelectorAll('td')[5].textContent.trim()).to.equal('Carol');
  });
});
