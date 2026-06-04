/**
 * Fore DevTools - <fx-debugger>
 *
 * First static debugger shell.
 *
 * Responsibilities:
 * - resolve the target <fx-fore>
 * - call fore.getDebugSnapshot()
 * - render a read-only overview
 * - provide simple initial panels:
 *   - Fore
 *   - Instances
 *   - Model Items
 *   - Bound Elements
 *   - Raw snapshot
 *
 * Non-goals for this phase:
 * - no mutation
 * - no editing
 * - no breakpoints
 * - no event timeline yet
 * - no dependency graph yet
 */

export class FxDebugger extends HTMLElement {
  static get observedAttributes() {
    return ['for'];
  }

  static get styles() {
    return `
    .fx-debugger {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 2147483647;
      display: block;
      height: 32vh;
      min-height: 12rem;
      max-height: 85vh;
      overflow: hidden;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      line-height: 1.4;
      color: #202124;
      background: #fff;
      border-top: 1px solid #c4c7ce;
      box-shadow: 0 -0.35rem 1rem rgba(0, 0, 0, 0.14);
    }

    .fx-debugger *,
    .fx-debugger *::before,
    .fx-debugger *::after {
      box-sizing: border-box;
    }

    .fx-debugger__shell {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #fff;
    }

    .fx-debugger__resize-hint {
      flex: 0 0 auto;
      height: 0.45rem;
      cursor: ns-resize;
      touch-action: none;
      user-select: none;
      background:
        linear-gradient(to bottom, #f1f3f4, #fff),
        repeating-linear-gradient(
          to right,
          transparent 0,
          transparent 6px,
          #c4c7ce 6px,
          #c4c7ce 8px
        );
      border-bottom: 1px solid #e3e5ea;
    }

    .fx-debugger__resize-hint:hover {
      background:
        linear-gradient(to bottom, #e8eaed, #fff),
        repeating-linear-gradient(
          to right,
          transparent 0,
          transparent 6px,
          #9aa0a6 6px,
          #9aa0a6 8px
        );
    }

    .fx-debugger--resizing,
    .fx-debugger--resizing * {
      cursor: ns-resize !important;
      user-select: none !important;
    }

    .fx-debugger__header {
      flex: 0 0 auto;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e3e5ea;
      background: #f8f9fb;
    }

    .fx-debugger__title {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
    }

    .fx-debugger__target {
      margin: 0.25rem 0 0;
      color: #5f6368;
    }

    .fx-debugger__target--missing {
      color: #9b1c1c;
    }

    .fx-debugger__refresh {
      appearance: none;
      border: 1px solid #c4c7ce;
      border-radius: 0.35rem;
      background: #fff;
      color: #202124;
      padding: 0.4rem 0.7rem;
      font: inherit;
      cursor: pointer;
    }

    .fx-debugger__refresh:hover {
      background: #f1f3f4;
    }

    .fx-debugger__notice {
      flex: 0 0 auto;
      margin: 1rem;
      padding: 0.75rem;
      border-radius: 0.35rem;
    }

    .fx-debugger__notice--error {
      border: 1px solid #f1b8b8;
      background: #fff4f4;
      color: #8a1111;
    }

    .fx-debugger__notice--warning {
      border: 1px solid #efd38f;
      background: #fff9e6;
      color: #6f4e00;
    }

    .fx-debugger__tabs {
      flex: 0 0 auto;
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      padding: 0.5rem 1rem 0;
      border-bottom: 1px solid #e3e5ea;
      background: #fff;
    }

    .fx-debugger__tab {
      appearance: none;
      border: 1px solid transparent;
      border-bottom: none;
      border-radius: 0.35rem 0.35rem 0 0;
      background: transparent;
      color: #444;
      padding: 0.5rem 0.75rem;
      font: inherit;
      cursor: pointer;
    }

    .fx-debugger__tab:hover {
      background: #f5f6f8;
    }

    .fx-debugger__tab[aria-selected="true"] {
      border-color: #d6d9df;
      background: #f8f9fb;
      color: #111;
      font-weight: 600;
    }

    .fx-debugger__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.5em;
      margin-left: 0.35rem;
      padding: 0 0.35rem;
      border-radius: 999px;
      background: #e8eaed;
      color: #3c4043;
      font-size: 0.8em;
    }

    .fx-debugger__panel {
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
      padding: 1rem;
    }

    .fx-debugger__section + .fx-debugger__section {
      margin-top: 1.25rem;
    }

    .fx-debugger__section h3 {
      margin: 0 0 0.75rem;
      font-size: 0.95rem;
      font-weight: 700;
    }

    .fx-debugger__details {
      display: grid;
      grid-template-columns: max-content minmax(0, 1fr);
      gap: 0.4rem 1rem;
      margin: 0;
    }

    .fx-debugger__details dt {
      color: #5f6368;
      font-weight: 600;
    }

    .fx-debugger__details dd {
      margin: 0;
      min-width: 0;
    }

    .fx-debugger__table-wrap {
      max-height: 100%;
      overflow: auto;
      border: 1px solid #e3e5ea;
      border-radius: 0.35rem;
    }

    .fx-debugger__table {
      width: 100%;
      min-width: 760px;
      border-collapse: collapse;
    }

    .fx-debugger__table th,
    .fx-debugger__table td {
      padding: 0.45rem 0.55rem;
      border-bottom: 1px solid #eceff3;
      text-align: left;
      vertical-align: top;
    }

    .fx-debugger__table th {
      position: sticky;
      top: 0;
      background: #f8f9fb;
      color: #3c4043;
      font-weight: 700;
      white-space: nowrap;
    }

    .fx-debugger__table tr:last-child td {
      border-bottom: none;
    }

    .fx-debugger__table code,
    .fx-debugger__details code,
    .fx-debugger__target code,
    .fx-debugger__notice code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 0.92em;
    }

    .fx-debugger__json {
      display: block;
      max-height: calc(32vh - 10rem);
      min-height: 6rem;
      overflow: auto;
      margin: 0;
      padding: 0.75rem;
      border: 1px solid #e3e5ea;
      border-radius: 0.35rem;
      background: #f8f9fb;
      font-size: 0.85rem;
      white-space: pre;
    }

    .fx-debugger[style*="height"] .fx-debugger__json {
      max-height: calc(100vh - 14rem);
    }

    .fx-debugger__muted {
      color: #8a9099;
    }

    .fx-debugger__bool {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 0.92em;
    }

    .fx-debugger__bool--true {
      color: #137333;
    }

    .fx-debugger__bool--false {
      color: #a50e0e;
    }

    .fx-debugger__empty {
      padding: 1rem;
      border: 1px dashed #cfd3da;
      border-radius: 0.35rem;
      color: #5f6368;
      background: #fafafa;
    }
  `;
  }

  constructor() {
    super();

    this.fore = null;
    this.snapshot = null;
    this.activePanel = 'fore';

    this._onRefreshClick = this._onRefreshClick.bind(this);
    this._onPanelClick = this._onPanelClick.bind(this);
    this._onForeRefreshDone = this._onForeRefreshDone.bind(this);
    this._onResizePointerDown = this._onResizePointerDown.bind(this);
    this._onResizePointerMove = this._onResizePointerMove.bind(this);
    this._onResizePointerUp = this._onResizePointerUp.bind(this);

    this._resizeStartY = 0;
    this._resizeStartHeight = 0;
  }

  connectedCallback() {
    this.classList.add('fx-debugger');

    this.fore = this.resolveFore();

    if (this.fore) {
      this.fore.addEventListener('refresh-done', this._onForeRefreshDone);
    }

    this.refresh();
    this.render();
  }

  disconnectedCallback() {
    if (this.fore) {
      this.fore.removeEventListener('refresh-done', this._onForeRefreshDone);
    }

    window.removeEventListener('pointermove', this._onResizePointerMove);
    window.removeEventListener('pointerup', this._onResizePointerUp);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name !== 'for' || oldValue === newValue || !this.isConnected) {
      return;
    }

    if (this.fore) {
      this.fore.removeEventListener('refresh-done', this._onForeRefreshDone);
    }

    this.fore = this.resolveFore();

    if (this.fore) {
      this.fore.addEventListener('refresh-done', this._onForeRefreshDone);
    }

    this.refresh();
    this.render();
  }

  resolveFore() {
    const target = this.getAttribute('for');

    if (target) {
      return document.getElementById(target);
    }

    return this.closest('fx-fore') || document.querySelector('fx-fore');
  }

  refresh() {
    this.snapshot = this.fore?.getDebugSnapshot?.() || null;
  }

  render() {
    this.innerHTML = `
      <style>${FxDebugger.styles}</style>

      <section class="fx-debugger__shell">
        <div class="fx-debugger__resize-hint" data-action="resize" title="Drag to resize debugger panel vertically"></div>

        <header class="fx-debugger__header">
          <div>
            <h2 class="fx-debugger__title">Fore Debugger</h2>
            ${this.renderTargetSummary()}
          </div>

          <button class="fx-debugger__refresh" type="button" data-action="refresh">
            Refresh
          </button>
        </header>

        ${this.renderStatus()}

        <nav class="fx-debugger__tabs" aria-label="Debugger panels">
          ${this.renderTab('fore', 'Fore')}
          ${this.renderTab('instances', `Instances ${this.countBadge(this.snapshot?.instances)}`)}
          ${this.renderTab('modelItems', `Model Items ${this.countBadge(this.snapshot?.modelItems)}`)}
          ${this.renderTab('boundElements', `Bound Elements ${this.countBadge(this.snapshot?.boundElements)}`)}
          ${this.renderTab('raw', 'Raw snapshot')}
        </nav>

        <main class="fx-debugger__panel">
          ${this.renderActivePanel()}
        </main>
      </section>
    `;

    this.querySelector('[data-action="refresh"]')?.addEventListener('click', this._onRefreshClick);

    this.querySelectorAll('[data-panel]').forEach(button => {
      button.addEventListener('click', this._onPanelClick);
    });

    this.querySelector('[data-action="resize"]')?.addEventListener('pointerdown', this._onResizePointerDown);
  }

  renderTargetSummary() {
    if (!this.fore) {
      return `<p class="fx-debugger__target fx-debugger__target--missing">No fx-fore found</p>`;
    }

    const id = this.fore.id ? `#${this.escape(this.fore.id)}` : '(no id)';

    return `
      <p class="fx-debugger__target">
        Target: <code>${id}</code>
      </p>
    `;
  }

  renderStatus() {
    if (!this.fore) {
      return `
        <div class="fx-debugger__notice fx-debugger__notice--error">
          Could not resolve a target <code>fx-fore</code>. Add <code>for="someForeId"</code>
          or place <code>&lt;fx-debugger&gt;</code> near a Fore element.
        </div>
      `;
    }

    if (!this.snapshot) {
      return `
        <div class="fx-debugger__notice fx-debugger__notice--warning">
          Target found, but it does not expose <code>getDebugSnapshot()</code> yet.
          Finish the runtime snapshot API before using this UI.
        </div>
      `;
    }

    return '';
  }

  renderTab(panel, label) {
    const selected = this.activePanel === panel;

    return `
      <button
        class="fx-debugger__tab"
        type="button"
        data-panel="${panel}"
        aria-selected="${selected ? 'true' : 'false'}">
        ${label}
      </button>
    `;
  }

  renderActivePanel() {
    if (!this.snapshot) {
      return this.renderEmptyPanel('No debug snapshot available.');
    }

    switch (this.activePanel) {
      case 'instances':
        return this.renderInstancesPanel();
      case 'modelItems':
        return this.renderModelItemsPanel();
      case 'boundElements':
        return this.renderBoundElementsPanel();
      case 'raw':
        return this.renderRawPanel();
      case 'fore':
      default:
        return this.renderForePanel();
    }
  }

  renderForePanel() {
    const fore = this.snapshot?.fore || {};
    const model = this.snapshot?.model || fore.model || {};

    return `
      <section class="fx-debugger__section">
        <h3>Fore</h3>

        <dl class="fx-debugger__details">
          ${this.renderDetail('ID', fore.id)}
          ${this.renderDetail('Ready', fore.ready)}
          ${this.renderDetail('Lazy refresh', fore.lazyRefresh)}
          ${this.renderDetail('Instances', this.snapshot?.instances?.length ?? model.instanceCount)}
          ${this.renderDetail('Model items', this.snapshot?.modelItems?.length ?? model.modelItemCount)}
          ${this.renderDetail('Bound elements', this.snapshot?.boundElements?.length)}
        </dl>
      </section>
    `;
  }

  renderRawPanel() {
    return `
      <section class="fx-debugger__section">
        <h3>Raw snapshot</h3>
        ${this.renderJsonBlock(this.snapshot)}
      </section>
    `;
  }

  renderInstancesPanel() {
    const instances = this.snapshot?.instances || [];

    if (!instances.length) {
      return this.renderEmptyPanel('No instances found.');
    }

    return `
      <section class="fx-debugger__section">
        <h3>Instances</h3>

        <div class="fx-debugger__table-wrap">
          <table class="fx-debugger__table">
            <thead>
              <tr>
                <th>Instance ID</th>
                <th>Type</th>
                <th>Source</th>
                <th>Has data</th>
                <th>Has nodeset</th>
                <th>Default context</th>
                <th>Mutations</th>
              </tr>
            </thead>
            <tbody>
              ${instances.map(instance => `
                <tr>
                  <td><code>${this.escape(instance?.instanceId || instance?.id || '')}</code></td>
                  <td>${this.escape(instance?.type || '')}</td>
                  <td>${this.renderCodeOrDash(instance?.src)}</td>
                  <td>${this.formatBoolean(instance?.hasData)}</td>
                  <td>${this.formatBoolean(instance?.hasNodeset)}</td>
                  <td>${this.escape(instance?.defaultContextType || '')}</td>
                  <td>${this.escape(instance?.mutationCount ?? '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  renderModelItemsPanel() {
    const modelItems = this.snapshot?.modelItems || [];

    if (!modelItems.length) {
      return this.renderEmptyPanel('No model items found.');
    }

    return `
      <section class="fx-debugger__section">
        <h3>Model Items</h3>

        <div class="fx-debugger__table-wrap">
          <table class="fx-debugger__table">
            <thead>
              <tr>
                <th>Path</th>
                <th>Ref</th>
                <th>Instance</th>
                <th>Value</th>
                <th>Required</th>
                <th>Relevant</th>
                <th>Readonly</th>
                <th>Constraint</th>
                <th>Backing</th>
                <th>Observers</th>
              </tr>
            </thead>
            <tbody>
              ${modelItems.map(item => `
                <tr>
                  <td>${this.renderCodeOrDash(item?.path)}</td>
                  <td>${this.renderCodeOrDash(item?.ref)}</td>
                  <td>${this.renderCodeOrDash(item?.instanceId)}</td>
                  <td>${this.renderValue(item?.value)}</td>
                  <td>${this.formatBoolean(item?.facets?.required)}</td>
                  <td>${this.formatBoolean(item?.facets?.relevant)}</td>
                  <td>${this.formatBoolean(item?.facets?.readonly)}</td>
                  <td>${this.formatBoolean(item?.facets?.constraint)}</td>
                  <td>${this.escape(item?.backing || '')}</td>
                  <td>${this.escape(item?.observerCount ?? '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  renderBoundElementsPanel() {
    const boundElements = this.snapshot?.boundElements || [];

    if (!boundElements.length) {
      return this.renderEmptyPanel('No bound elements found.');
    }

    return `
      <section class="fx-debugger__section">
        <h3>Bound Elements</h3>

        <div class="fx-debugger__table-wrap">
          <table class="fx-debugger__table">
            <thead>
              <tr>
                <th>Element</th>
                <th>ID</th>
                <th>Ref</th>
                <th>Model item path</th>
                <th>Instance</th>
                <th>Value</th>
                <th>Required</th>
                <th>Relevant</th>
                <th>Readonly</th>
              </tr>
            </thead>
            <tbody>
              ${boundElements.map(element => `
                <tr>
                  <td><code>${this.escape(element?.localName || '')}</code></td>
                  <td>${this.renderCodeOrDash(element?.id)}</td>
                  <td>${this.renderCodeOrDash(element?.ref)}</td>
                  <td>${this.renderCodeOrDash(element?.modelItemPath)}</td>
                  <td>${this.renderCodeOrDash(element?.instanceId)}</td>
                  <td>${this.renderValue(element?.value)}</td>
                  <td>${this.formatBoolean(element?.required)}</td>
                  <td>${this.formatBoolean(element?.relevant)}</td>
                  <td>${this.formatBoolean(element?.readonly)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  renderEmptyPanel(message) {
    return `
      <div class="fx-debugger__empty">
        ${this.escape(message)}
      </div>
    `;
  }

  renderDetail(label, value) {
    return `
      <dt>${this.escape(label)}</dt>
      <dd>${this.renderValue(value)}</dd>
    `;
  }

  renderJsonBlock(value) {
    return `
      <pre class="fx-debugger__json"><code>${this.escape(JSON.stringify(value, null, 2))}</code></pre>
    `;
  }

  renderValue(value) {
    if (value === undefined || value === null || value === '') {
      return '<span class="fx-debugger__muted">—</span>';
    }

    if (typeof value === 'boolean') {
      return this.formatBoolean(value);
    }

    if (typeof value === 'object') {
      return `<code>${this.escape(this.safeJson(value))}</code>`;
    }

    return this.escape(String(value));
  }

  renderCodeOrDash(value) {
    if (value === undefined || value === null || value === '') {
      return '<span class="fx-debugger__muted">—</span>';
    }

    return `<code>${this.escape(String(value))}</code>`;
  }

  formatBoolean(value) {
    if (value === true) {
      return '<span class="fx-debugger__bool fx-debugger__bool--true">true</span>';
    }

    if (value === false) {
      return '<span class="fx-debugger__bool fx-debugger__bool--false">false</span>';
    }

    return '<span class="fx-debugger__muted">—</span>';
  }

  countBadge(items) {
    if (!Array.isArray(items)) {
      return '';
    }

    return `<span class="fx-debugger__badge">${items.length}</span>`;
  }

  safeJson(value) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }

  escape(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
  }

  _onRefreshClick() {
    this.refresh();
    this.render();
  }

  _onPanelClick(event) {
    const panel = event.currentTarget?.dataset?.panel;

    if (!panel || panel === this.activePanel) {
      return;
    }

    this.activePanel = panel;
    this.render();
  }

  _onForeRefreshDone() {
    this.refresh();
    this.render();
  }

  _onResizePointerDown(event) {
    event.preventDefault();

    this._resizeStartY = event.clientY;
    this._resizeStartHeight = this.getBoundingClientRect().height;
    this.classList.add('fx-debugger--resizing');

    window.addEventListener('pointermove', this._onResizePointerMove);
    window.addEventListener('pointerup', this._onResizePointerUp);
  }

  _onResizePointerMove(event) {
    const delta = this._resizeStartY - event.clientY;
    const nextHeight = this._resizeStartHeight + delta;
    const minHeight = this._getCssPixelValue('min-height', 192);
    const maxHeight = Math.min(window.innerHeight * 0.85, window.innerHeight - 40);
    const clampedHeight = Math.max(minHeight, Math.min(maxHeight, nextHeight));

    this.style.height = `${clampedHeight}px`;
  }

  _onResizePointerUp() {
    this.classList.remove('fx-debugger--resizing');

    window.removeEventListener('pointermove', this._onResizePointerMove);
    window.removeEventListener('pointerup', this._onResizePointerUp);
  }

  _getCssPixelValue(property, fallback) {
    const value = Number.parseFloat(getComputedStyle(this).getPropertyValue(property));
    return Number.isFinite(value) ? value : fallback;
  }
}

if (!customElements.get('fx-debugger')) {
  customElements.define('fx-debugger', FxDebugger);
}