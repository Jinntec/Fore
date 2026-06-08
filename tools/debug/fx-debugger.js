/**
 * Fore DevTools - <fx-debugger>
 *
 * Read-only debugger shell.
 *
 * Responsibilities:
 * - resolve the target <fx-fore>
 * - call fore.getDebugSnapshot()
 * - render read-only overview panels
 * - render graph diagnostics on demand
 * - render passive event/action flow
 *
 * Non-goals for this phase:
 * - no mutation
 * - no editing
 * - no breakpoints
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

      .fx-debugger.fx-debugger--collapsed {
        min-height: 0;
        overflow: hidden;
      }

      .fx-debugger.fx-debugger--collapsed .fx-debugger__resize-hint,
      .fx-debugger.fx-debugger--collapsed .fx-debugger__tabs,
      .fx-debugger.fx-debugger--collapsed .fx-debugger__panel,
      .fx-debugger.fx-debugger--collapsed .fx-debugger__notice {
        display: none;
      }

      .fx-debugger.fx-debugger--collapsed .fx-debugger__shell {
        min-height: 0;
      }

      .fx-debugger.fx-debugger--collapsed .fx-debugger__header {
        border-bottom: none;
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
        cursor: default;
      }

      .fx-debugger__header::after {
        content: "Double-click header to collapse/open";
        align-self: center;
        margin-left: auto;
        color: #8a9099;
        font-size: 0.8rem;
        font-weight: 400;
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

      .fx-debugger__refresh,
      .fx-debugger__clear-events {
        appearance: none;
        border: 1px solid #c4c7ce;
        border-radius: 0.35rem;
        background: #fff;
        color: #202124;
        padding: 0.4rem 0.7rem;
        font: inherit;
        cursor: pointer;
      }

      .fx-debugger__refresh:hover,
      .fx-debugger__clear-events:hover {
        background: #f1f3f4;
      }

      .fx-debugger__shortcut {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.25em;
        margin-left: 0.35rem;
        padding: 0 0.25rem;
        border: 1px solid #d6d9df;
        border-radius: 0.25rem;
        background: #f8f9fb;
        color: #5f6368;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
        font-size: 0.82em;
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

      .fx-debugger__fore-targets {
        margin: 0 0 1rem;
        padding: 0.65rem;
        border: 1px solid #e3e5ea;
        border-radius: 0.35rem;
        background: #fafafa;
      }

      .fx-debugger__fore-targets-label {
        margin-bottom: 0.45rem;
        color: #5f6368;
        font-size: 0.85rem;
        font-weight: 700;
      }

      .fx-debugger__fore-target-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }

      .fx-debugger__fore-target {
        appearance: none;
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        border: 1px solid #c4c7ce;
        border-radius: 999px;
        background: #fff;
        color: #202124;
        padding: 0.35rem 0.55rem;
        font: inherit;
        cursor: pointer;
      }

      .fx-debugger__fore-target:hover {
        background: #f1f3f4;
      }

      .fx-debugger__fore-target--current {
        border-color: #174ea6;
        background: #e8f0fe;
      }

      .fx-debugger__fore-target-state {
        color: #5f6368;
        font-size: 0.78rem;
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
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
        font-size: 0.85rem;
        line-height: 1.45;
        white-space: pre;
        tab-size: 2;
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

      .fx-debugger__graph-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: 1rem;
      }

      .fx-debugger__graph-card {
        border: 1px solid #e3e5ea;
        border-radius: 0.35rem;
        padding: 0.75rem;
        background: #fff;
      }

      .fx-debugger__graph-card h4 {
        margin: 0 0 0.75rem;
        font-size: 0.9rem;
        font-weight: 700;
      }

      .fx-debugger__event-toolbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 0.75rem;
      }

      .fx-debugger__event-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem 0.9rem;
        align-items: center;
        margin: 0 0 0.75rem;
        padding: 0.55rem 0.65rem;
        border: 1px solid #e3e5ea;
        border-radius: 0.35rem;
        background: #fafafa;
      }

      .fx-debugger__event-filters legend {
        padding: 0 0.25rem;
      }

      .fx-debugger__event-filter {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        color: #3c4043;
        font-size: 0.86rem;
        white-space: nowrap;
        cursor: pointer;
      }

      .fx-debugger__event-filter input {
        margin: 0;
      }

      .fx-debugger__event-filter-count {
        color: #8a9099;
        font-size: 0.8rem;
      }

      .fx-debugger__dom-event-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem 0.75rem;
        align-items: center;
        width: 100%;
        margin-top: 0.15rem;
        padding-top: 0.45rem;
        border-top: 1px solid #e3e5ea;
      }

      .fx-debugger__dom-event-filter-label {
        color: #8a9099;
        font-size: 0.8rem;
        font-weight: 600;
      }

      .fx-debugger__custom-events {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        align-items: center;
        width: 100%;
        margin-top: 0.15rem;
        padding-top: 0.45rem;
        border-top: 1px solid #e3e5ea;
      }

      .fx-debugger__custom-events label {
        color: #8a9099;
        font-size: 0.8rem;
        font-weight: 600;
      }

      .fx-debugger__custom-events input[type="text"] {
        min-width: 18rem;
        flex: 1 1 18rem;
        border: 1px solid #c4c7ce;
        border-radius: 0.35rem;
        padding: 0.35rem 0.5rem;
        font: inherit;
      }

      .fx-debugger__custom-events button {
        appearance: none;
        border: 1px solid #c4c7ce;
        border-radius: 0.35rem;
        background: #fff;
        color: #202124;
        padding: 0.35rem 0.65rem;
        font: inherit;
        cursor: pointer;
      }

      .fx-debugger__custom-events button:hover {
        background: #f1f3f4;
      }

      .fx-debugger__event-table td:last-child code {
        white-space: normal;
        overflow-wrap: anywhere;
      }

      .fx-debugger__event-row--group-start td {
        border-top: 2px solid #c4c7ce;
        background: #f8f9fb;
      }

      .fx-debugger__event-row--group-end td {
        border-bottom: 2px solid #c4c7ce;
        background: #fafafa;
      }

      .fx-debugger__event-node {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        min-height: 1.45rem;
        padding-left: calc((var(--event-depth, 0) * 1.15rem) + 1.35rem);
        white-space: nowrap;
      }

      .fx-debugger__event-node::before {
        content: "";
        position: absolute;
        left: calc((var(--event-depth, 0) * 1.15rem) + 0.55rem);
        top: -0.55rem;
        bottom: -0.55rem;
        border-left: 1px solid #d6d9df;
      }

      .fx-debugger__event-node--flow-start::before {
        top: 50%;
      }

      .fx-debugger__event-node--flow-end::before {
        bottom: 50%;
      }

      .fx-debugger__event-node--outside::before {
        display: none;
      }

      .fx-debugger__event-branch {
        position: absolute;
        left: calc((var(--event-depth, 0) * 1.15rem) + 0.1rem);
        z-index: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 0.9rem;
        height: 0.9rem;
        border-radius: 999px;
        background: #fff;
        color: #8a9099;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
        font-size: 0.8rem;
        line-height: 1;
      }

      .fx-debugger__event-type--action {
        color: #174ea6;
        font-weight: 700;
      }

      .fx-debugger__event-type--lifecycle {
        color: #5f6368;
        font-weight: 600;
      }

      .fx-debugger__event-type--boundary {
        color: #3c4043;
        font-weight: 800;
      }

      .fx-debugger__event-type--update {
        color: #137333;
        font-weight: 700;
      }

      .fx-debugger__event-type--dom {
        color: #8a4b00;
        font-weight: 700;
      }

      .fx-debugger__action-detail {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.4rem;
      }

      .fx-debugger__action-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        background: #e8f0fe;
        color: #174ea6;
        padding: 0.1rem 0.45rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
        font-size: 0.82rem;
        font-weight: 700;
      }

      .fx-debugger__action-phase {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        background: #f1f3f4;
        color: #3c4043;
        padding: 0.1rem 0.45rem;
        font-size: 0.82rem;
        font-weight: 600;
      }
      .fx-debugger-highlight-target {
        outline: 3px solid #174ea6 !important;
        outline-offset: 4px !important;
        box-shadow: 0 0 0 6px rgba(23, 78, 166, 0.18) !important;
        transition:
          outline-color 0.2s ease,
          box-shadow 0.2s ease !important;
      }
      .fx-debugger__element-link {
        appearance: none;
        border: none;
        background: transparent;
        color: #174ea6;
        padding: 0;
        font: inherit;
        cursor: pointer;
        text-decoration: underline;
        text-underline-offset: 0.15em;
      }
      
      .fx-debugger__element-link:hover {
        color: #0b57d0;
      }
    `;
  }

  constructor() {
    super();

    this.fore = null;
    this.snapshot = null;
    this.activePanel = 'fore';

    this.eventLog = [];
    this.maxEventLogEntries = 200;
    this._eventFlowDepth = 0;
    this._eventFlowId = 0;

    this.eventFilters = {
      dom: true,
      action: true,
      update: true,
      data: true,
      submission: true,
      lifecycle: true,
      error: true,
      other: true,
    };

    this.domEventFilters = {
      input: true,
      blur: true,
      click: false,
      change: false,
      focusout: false,
      keydown: false,
    };

    this.customEventTypes = [];

    this.eventTypes = [
      'click',
      'input',
      'change',
      'blur',
      'focusout',
      'keydown',
      'model-construct',
      'model-construct-done',
      'ready',
      'refresh',
      'refresh-done',
      'rebuild-done',
      'recalculate-done',
      'revalidate-done',
      'path-mutated',
      'value-changed',
      'insert',
      'delete',
      'deleted',
      'submit',
      'submit-done',
      'submit-error',
      'outermost-action-start',
      'outermost-action-end',
      'action-start',
      'action-end',
      'action-performed',
      'error',
    ];
    this._onRefreshClick = this._onRefreshClick.bind(this);
    this._onPanelClick = this._onPanelClick.bind(this);
    this._onForeTargetClick = this._onForeTargetClick.bind(this);
    this._onBoundElementClick = this._onBoundElementClick.bind(this);
    this._onForeRefreshDone = this._onForeRefreshDone.bind(this);

    this._onResizePointerDown = this._onResizePointerDown.bind(this);
    this._onResizePointerMove = this._onResizePointerMove.bind(this);
    this._onResizePointerUp = this._onResizePointerUp.bind(this);
    this._onToggleClick = this._onToggleClick.bind(this);
    this._onDebugEvent = this._onDebugEvent.bind(this);
    this._onEventFilterChange = this._onEventFilterChange.bind(this);
    this._onDomEventFilterChange = this._onDomEventFilterChange.bind(this);
    this._onCustomEventsApply = this._onCustomEventsApply.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onForeTargetsChanged = this._onForeTargetsChanged.bind(this);

    this._resizeStartY = 0;
    this._resizeStartHeight = 0;
    this._storageKey = 'fore-devtools.fx-debugger.height';
    this._collapsedStorageKey = 'fore-devtools.fx-debugger.collapsed';
    this._eventSettingsStorageKey = 'fore-devtools.fx-debugger.eventSettings';
    this._activePanelStorageKey = 'fore-devtools.fx-debugger.activePanel';
    this._foreTargetObserver = null;
    this._foreTargetRenderQueued = false;

    this._highlightedElement = null;
    this._highlightedElementTimer = null;
    this._highlightedForeTarget = null;
    this._highlightedForeTargetTimer = null;
    this._collapsed = false;
    this._originalBodyPaddingBottom = undefined;
  }

  connectedCallback() {
    this.classList.add('fx-debugger');
    this.ensureGlobalHighlightStyle();

    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }

    this.addEventListener('keydown', this._onKeyDown);

    if (this.hasAttribute('gate-init')) {
      this.gateForeInitialization();
    }

    this.restorePanelState();
    this.restoreEventSettings();
    this.restoreActivePanel();

    this.fore = this.resolveFore();

    if (this.fore) {
      this.fore.addEventListener('refresh-done', this._onForeRefreshDone);
    }

    this.attachEventListeners();
    this.observeForeTargets();

    this.refresh();
    this.render();
    this.applyPageOffset();
    this.waitForForeUpgrade();
  }

  disconnectedCallback() {
    this.removeEventListener('keydown', this._onKeyDown);

    if (this.fore) {
      this.fore.removeEventListener('refresh-done', this._onForeRefreshDone);
    }

    this.clearHighlightedPageElement();
    this.detachEventListeners();
    this.disconnectForeTargetObserver();
    this.clearPageOffset();

    window.removeEventListener('pointermove', this._onResizePointerMove);
    window.removeEventListener('pointerup', this._onResizePointerUp);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name !== 'for' || oldValue === newValue || !this.isConnected) {
      return;
    }

    this.switchForeTarget(newValue, {
      updateAttribute: false,
      resetEvents: false,
    });
  }

  gateForeInitialization() {
    const targetId = this.getAttribute('for');

    if (!targetId) {
      return;
    }

    const fore = document.getElementById(targetId);

    if (!fore) {
      return;
    }

    this._debugInitEvent = fore.__debuggerManagedInitEvent || `fx-debugger-ready-${targetId}`;

    if (!fore.hasAttribute('init-on')) {
      fore.setAttribute('init-on', this._debugInitEvent);
      fore.setAttribute('init-on-target', 'document');
      fore.__debuggerManagedInitGate = true;
      fore.__debuggerManagedInitEvent = this._debugInitEvent;
    }
  }

  releaseForeInitialization() {
    if (!this._debugInitEvent || this._debugInitReleased) {
      return;
    }

    this._debugInitReleased = true;

    queueMicrotask(() => {
      document.dispatchEvent(new CustomEvent(this._debugInitEvent));

      requestAnimationFrame(() => {
        if (!this.isConnected) {
          return;
        }

        this.refresh();
        this.render();
        this.applyPageOffset();
      });
    });
  }

  async waitForForeUpgrade() {
    if (this.fore && typeof this.fore.getDebugSnapshot === 'function') {
      if (this.hasAttribute('gate-init')) {
        this.releaseForeInitialization();
      }

      requestAnimationFrame(() => {
        if (!this.isConnected) {
          return;
        }

        this.refresh();
        this.render();
        this.applyPageOffset();
      });

      return;
    }

    try {
      await customElements.whenDefined('fx-fore');
    } catch (error) {
      return;
    }

    if (!this.isConnected) {
      return;
    }

    this.detachEventListeners();

    if (this.fore) {
      this.fore.removeEventListener('refresh-done', this._onForeRefreshDone);
    }

    this.fore = this.resolveFore();

    if (this.fore) {
      this.fore.addEventListener('refresh-done', this._onForeRefreshDone);
    }

    this.attachEventListeners();

    if (this.hasAttribute('gate-init')) {
      this.releaseForeInitialization();
    }

    requestAnimationFrame(() => {
      if (!this.isConnected) {
        return;
      }

      this.refresh();
      this.render();
      this.applyPageOffset();
    });
  }

  resolveFore() {
    const target = this.getAttribute('for');

    if (target) {
      return document.getElementById(target);
    }

    return this.closest('fx-fore') || document.querySelector('fx-fore');
  }

  refresh() {
    this.snapshot =
      this.fore?.getDebugSnapshot?.({
        includeGraphs: this.activePanel === 'graphs',
      }) || null;
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
          ${this.renderTab('graphs', 'Graphs')}
          ${this.renderTab('events', `Events ${this.countBadge(this.eventLog)}`)}
          ${this.renderTab('instances', `Instances ${this.countBadge(this.snapshot?.instances)}`)}
          ${this.renderTab('bindings', `Bindings ${this.countBadge(this.snapshot?.bindings)}`)}
          ${this.renderTab('submissions', `Submissions ${this.countBadge(this.snapshot?.submissions)}`)}
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

    this.querySelectorAll('[data-action="clear-events"]').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        this.clearEvents();
      });
    });

    this.querySelectorAll('[data-event-filter]').forEach(input => {
      input.addEventListener('change', this._onEventFilterChange);
    });

    this.querySelectorAll('[data-dom-event-filter]').forEach(input => {
      input.addEventListener('change', this._onDomEventFilterChange);
    });

    this.querySelector('[data-action="apply-custom-events"]')?.addEventListener(
      'click',
      this._onCustomEventsApply,
    );

    const customEventsInput = this.querySelector('[data-custom-events-input]');

    customEventsInput?.addEventListener('input', event => {
      this.customEventTypes = this.parseCustomEventTypes(event.currentTarget.value || '');
      this.storeEventSettings();
    });

    customEventsInput?.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this._onCustomEventsApply();
      }
    });

    this.querySelector('.fx-debugger__header')?.addEventListener('dblclick', this._onToggleClick);

    this.querySelectorAll('[data-panel]').forEach(button => {
      button.addEventListener('click', this._onPanelClick);
    });

    this.querySelectorAll('[data-fore-target]').forEach(button => {
      button.addEventListener('click', this._onForeTargetClick);
    });

    this.querySelectorAll('[data-bound-element-index]').forEach(button => {
      button.addEventListener('click', this._onBoundElementClick);
    });

    this.querySelector('[data-action="resize"]')?.addEventListener(
      'pointerdown',
      this._onResizePointerDown,
    );
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
      case 'bindings':
        return this.renderBindingsPanel();
      case 'submissions':
        return this.renderSubmissionsPanel();
      case 'graphs':
        return this.renderGraphsPanel();
      case 'events':
        return this.renderEventsPanel();
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

      ${this.renderForeTargetList()}

      <dl class="fx-debugger__details">
        ${this.renderDetail('ID', fore.id)}
        ${this.renderDetail('Ready', fore.ready)}
        ${this.renderDetail('createNodes', fore.createNodes)}
        ${this.renderDetail('Lazy refresh', fore.lazyRefresh)}
        ${this.renderDetail('init-on', fore.initOn)}
        ${this.renderDetail('init-on-target', fore.initOnTarget)}
        ${this.renderDetail('ignore-expressions', fore.ignoreExpressions)}
        ${this.renderDetail('Instances', this.snapshot?.instances?.length ?? model.instanceCount)}
        ${this.renderDetail('Bindings', this.snapshot?.bindings?.length)}
        ${this.renderDetail('Submissions', this.snapshot?.submissions?.length)}
        ${this.renderDetail('Model items', this.snapshot?.modelItems?.length ?? model.modelItemCount)}
        ${this.renderDetail('Bound elements', this.snapshot?.boundElements?.length)}
      </dl>
    </section>
  `;
  }

  renderForeTargetList() {
    const fores = this.getAvailableFores();

    if (!fores.length) {
      return this.renderEmptyPanel('No live fx-fore elements found.');
    }

    return `
      <div class="fx-debugger__fore-targets">
        <div class="fx-debugger__fore-targets-label">Available Fore elements</div>

        <div class="fx-debugger__fore-target-list">
          ${fores
            .map(
              fore => `
                <button
                  class="fx-debugger__fore-target ${fore.current ? 'fx-debugger__fore-target--current' : ''}"
                  type="button"
                  data-fore-target="${this.escape(fore.id)}"
                  ${fore.current ? 'aria-current="true"' : ''}>
                  <code>${this.escape(fore.label)}</code>
                  <span class="fx-debugger__fore-target-state">
                    ${fore.ready ? 'ready' : 'not ready'}
                  </span>
                </button>
              `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  observeForeTargets() {
    if (this._foreTargetObserver || !document.documentElement) {
      return;
    }

    this._foreTargetObserver = new MutationObserver(records => {
      const hasForeChange = records.some(
        record =>
          Array.from(record.addedNodes).some(node => this.nodeContainsFore(node)) ||
          Array.from(record.removedNodes).some(node => this.nodeContainsFore(node)),
      );

      if (!hasForeChange) {
        return;
      }

      this._onForeTargetsChanged();
    });

    this._foreTargetObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  disconnectForeTargetObserver() {
    if (!this._foreTargetObserver) {
      return;
    }

    this._foreTargetObserver.disconnect();
    this._foreTargetObserver = null;
    this._foreTargetRenderQueued = false;
  }

  nodeContainsFore(node) {
    if (!(node instanceof Element)) {
      return false;
    }

    if (node.localName === 'fx-fore') {
      return true;
    }

    return Boolean(node.querySelector?.('fx-fore'));
  }

  _onForeTargetsChanged() {
    if (this._foreTargetRenderQueued) {
      return;
    }

    this._foreTargetRenderQueued = true;

    requestAnimationFrame(() => {
      this._foreTargetRenderQueued = false;

      if (!this.isConnected) {
        return;
      }

      /*
       * Only a re-render is needed to update the available Fore target list.
       * The current snapshot still belongs to the currently selected target.
       */
      this.render();
      this.applyPageOffset();
    });
  }

  getAvailableFores() {
    return Array.from(document.querySelectorAll('fx-fore')).map((fore, index) => {
      if (!fore.id) {
        fore.id = `fx-fore-debug-live-${index + 1}`;
      }

      return {
        id: fore.id,
        label: `#${fore.id}`,
        localName: fore.localName,
        ready: fore.ready === true,
        current: fore === this.fore,
      };
    });
  }

  getCurrentBoundDomElements() {
    if (!this.fore) {
      return [];
    }

    const boundElementNames = new Set([
      'fx-control',
      'fx-output',
      'fx-upload',
      'fx-group',
      'fx-repeat',
      'fx-switch',
    ]);

    return Array.from(this.fore.querySelectorAll('[ref]')).filter(element =>
      boundElementNames.has(element.localName),
    );
  }

  renderRawPanel() {
    return `
      <section class="fx-debugger__section">
        <h3>Raw snapshot</h3>
        ${this.renderJsonBlock(this.snapshot)}
      </section>
    `;
  }

  renderGraphsPanel() {
    const graphs = this.snapshot?.model?.graphs;

    if (!graphs) {
      return this.renderEmptyPanel('No recalculation graph information available.');
    }

    return `
      <section class="fx-debugger__section">
        <h3>Recalculation graphs</h3>

        <div class="fx-debugger__graph-grid">
          ${this.renderGraphSummaryCard('Main graph', graphs.mainGraph)}
          ${this.renderGraphSummaryCard('Sub graph', graphs.subGraph)}
        </div>
      </section>

      <section class="fx-debugger__section">
        <h3>Main graph calculation order</h3>
        ${this.renderCalculationOrderTable(graphs.mainGraph)}
      </section>

      <section class="fx-debugger__section">
        <h3>Sub graph calculation order</h3>
        ${this.renderCalculationOrderTable(graphs.subGraph)}
      </section>
    `;
  }

  renderGraphSummaryCard(title, graph) {
    if (!graph) {
      return `
        <article class="fx-debugger__graph-card">
          <h4>${this.escape(title)}</h4>
          <p class="fx-debugger__muted">No graph available.</p>
        </article>
      `;
    }

    return `
      <article class="fx-debugger__graph-card">
        <h4>${this.escape(title)}</h4>

        <dl class="fx-debugger__details">
          ${this.renderDetail('Nodes', graph.nodeCount)}
          ${this.renderDetail('Edges', graph.edgeCount)}
          ${this.renderDetail('Compute nodes', graph.computeNodeCount)}
          ${this.renderDetail('Calculation order', graph.calculationOrderCount)}
        </dl>
      </article>
    `;
  }

  renderCalculationOrderTable(graph) {
    const order = graph?.calculationOrder || [];

    if (!order.length) {
      return this.renderEmptyPanel('No calculation order available.');
    }

    return `
      <div class="fx-debugger__table-wrap">
        <table class="fx-debugger__table">
          <thead>
            <tr>
              <th>#</th>
              <th>Path</th>
              <th>Facet</th>
              <th>Ref</th>
              <th>Instance</th>
              <th>Data type</th>
              <th>Value</th>
              <th>Dependencies</th>
              <th>Dependants</th>
            </tr>
          </thead>
          <tbody>
            ${order
              .map(
                item => `
                  <tr>
                    <td>${this.renderValue(item?.index)}</td>
                    <td>${this.renderCodeOrDash(item?.path)}</td>
                    <td>${this.renderCodeOrDash(item?.facet)}</td>
                    <td>${this.renderCodeOrDash(item?.ref)}</td>
                    <td>${this.renderCodeOrDash(item?.instanceId)}</td>
                    <td>${this.renderCodeOrDash(item?.dataType)}</td>
                    <td>${this.renderValue(item?.value)}</td>
                    <td>${this.renderValue(item?.dependencies?.length || 0)}</td>
                    <td>${this.renderValue(item?.dependants?.length || 0)}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderEventsPanel() {
    const visibleEvents = this.getVisibleEventLog();

    if (!this.eventLog.length) {
      return this.renderEmptyPanel(
        'No Fore events captured yet. Interact with the form or press Refresh.',
      );
    }

    return `
      <section class="fx-debugger__section">
        <h3>Event flow</h3>

        <div class="fx-debugger__event-toolbar">
          <button
            class="fx-debugger__clear-events"
            type="button"
            data-action="clear-events"
            title="Clear events. Shortcut: c when the Events tab is focused.">
            Clear events <span class="fx-debugger__shortcut">c</span>
          </button>
        </div>

        ${this.renderEventFilters()}

        ${
          visibleEvents.length
            ? this.renderEventTable(visibleEvents)
            : this.renderEmptyPanel('No events match the current filters.')
        }
      </section>
    `;
  }

  renderEventFilters() {
    const counts = this.getEventCategoryCounts();
    const filters = [
      ['dom', 'DOM'],
      ['action', 'Actions'],
      ['update', 'Update cycle'],
      ['data', 'Data'],
      ['submission', 'Submissions'],
      ['lifecycle', 'Lifecycle'],
      ['error', 'Errors'],
      ['other', 'Other'],
    ];

    return `
      <fieldset class="fx-debugger__event-filters">
        <legend class="fx-debugger__muted">Show events</legend>
        ${filters
          .map(
            ([key, label]) => `
              <label class="fx-debugger__event-filter">
                <input
                  type="checkbox"
                  data-event-filter="${this.escape(key)}"
                  ${this.eventFilters[key] ? 'checked' : ''}>
                <span>${this.escape(label)}</span>
                <span class="fx-debugger__event-filter-count">${counts[key] || 0}</span>
              </label>
            `,
          )
          .join('')}
        ${this.renderDomEventFilters()}
        ${this.renderCustomEventInput()}
      </fieldset>
    `;
  }

  renderDomEventFilters() {
    const counts = this.getDomEventCounts();
    const filters = [
      ['input', 'input'],
      ['blur', 'blur'],
      ['click', 'click'],
      ['change', 'change'],
      ['focusout', 'focusout'],
      ['keydown', 'keydown'],
    ];

    return `
      <div class="fx-debugger__dom-event-filters">
        <span class="fx-debugger__dom-event-filter-label">DOM types</span>
        ${filters
          .map(
            ([key, label]) => `
              <label class="fx-debugger__event-filter">
                <input
                  type="checkbox"
                  data-dom-event-filter="${this.escape(key)}"
                  ${this.domEventFilters[key] ? 'checked' : ''}
                  ${this.eventFilters.dom ? '' : 'disabled'}>
                <span>${this.escape(label)}</span>
                <span class="fx-debugger__event-filter-count">${counts[key] || 0}</span>
              </label>
            `,
          )
          .join('')}
      </div>
    `;
  }

  renderCustomEventInput() {
    return `
      <div class="fx-debugger__custom-events">
        <label for="fx-debugger-custom-events">Custom events</label>
        <input
          id="fx-debugger-custom-events"
          type="text"
          data-custom-events-input
          value="${this.escape(this.customEventTypes.join(', '))}"
          placeholder="event-name, another-event">
        <button type="button" data-action="apply-custom-events">Listen</button>
      </div>
    `;
  }

  renderEventTable(events) {
    return `
      <div class="fx-debugger__table-wrap">
        <table class="fx-debugger__table fx-debugger__event-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Time</th>
              <th>Flow</th>
              <th>Target</th>
              <th>Origin</th>
              <th>Action / detail</th>
            </tr>
          </thead>
          <tbody>
            ${events
              .map(
                entry => `
                  <tr class="${this.getEventRowClass(entry)}">
                    <td>${this.renderValue(entry.index)}</td>
                    <td>${this.renderCodeOrDash(entry.timeLabel)}</td>
                    <td>${this.renderEventFlowCell(entry)}</td>
                    <td>${this.renderCodeOrDash(entry.target)}</td>
                    <td>${this.renderCodeOrDash(entry.origin)}</td>
                    <td>${this.renderEventDetail(entry)}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  getVisibleEventLog() {
    return this.eventLog.filter(entry => {
      const category = this.getEventCategory(entry.type);

      if (this.eventFilters[category] === false) {
        return false;
      }

      if (category === 'dom') {
        return this.domEventFilters[entry.type] !== false;
      }

      return true;
    });
  }

  getEventCategoryCounts() {
    return this.eventLog.reduce((counts, entry) => {
      const category = this.getEventCategory(entry.type);
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});
  }

  getDomEventCounts() {
    return this.eventLog.reduce((counts, entry) => {
      if (this.isDomEvent(entry.type)) {
        counts[entry.type] = (counts[entry.type] || 0) + 1;
      }

      return counts;
    }, {});
  }

  getEventCategory(type) {
    if (this.isDomEvent(type)) {
      return 'dom';
    }

    if (this.isCustomEvent(type)) {
      return 'other';
    }

    if (this.isActionEvent(type)) {
      return 'action';
    }

    if (this.isUpdateCycleEvent(type)) {
      return 'update';
    }

    if (['value-changed', 'path-mutated', 'insert', 'delete', 'deleted'].includes(type)) {
      return 'data';
    }

    if (['submit', 'submit-done', 'submit-error'].includes(type)) {
      return 'submission';
    }

    if (this.isLifecycleEvent(type)) {
      return 'lifecycle';
    }

    if (type === 'error') {
      return 'error';
    }

    return 'other';
  }

  renderEventFlowCell(entry) {
    const depth = Math.max(0, entry.depth || 0);
    const nodeClass = this.getEventNodeClass(entry);
    const typeClass = this.getEventTypeClass(entry.type);

    return `
      <span class="fx-debugger__event-node ${nodeClass}" style="--event-depth: ${depth}">
        <span class="fx-debugger__event-branch">${this.escape(this.getEventBranchGlyph(entry))}</span>
        <code class="${typeClass}">${this.escape(entry.type)}</code>
      </span>
    `;
  }

  getEventNodeClass(entry) {
    if (
      !entry.flowId &&
      entry.type !== 'outermost-action-start' &&
      entry.type !== 'outermost-action-end'
    ) {
      return 'fx-debugger__event-node--outside';
    }

    if (entry.type === 'outermost-action-start') {
      return 'fx-debugger__event-node--flow-start';
    }

    if (entry.type === 'outermost-action-end') {
      return 'fx-debugger__event-node--flow-end';
    }

    return '';
  }

  getEventTypeClass(type) {
    if (type === 'outermost-action-start' || type === 'outermost-action-end') {
      return 'fx-debugger__event-type--boundary';
    }

    if (this.isActionEvent(type)) {
      return 'fx-debugger__event-type--action';
    }

    if (this.isUpdateCycleEvent(type)) {
      return 'fx-debugger__event-type--update';
    }

    if (this.isDomEvent(type)) {
      return 'fx-debugger__event-type--dom';
    }

    if (this.isLifecycleEvent(type)) {
      return 'fx-debugger__event-type--lifecycle';
    }

    return '';
  }

  getEventBranchGlyph(entry) {
    if (entry.type === 'outermost-action-start') return '●';
    if (entry.type === 'outermost-action-end') return '●';
    if (entry.type === 'action-start') return '▶';
    if (entry.type === 'action-end') return '■';
    if (entry.type === 'action-performed') return '◆';
    if (this.isUpdateCycleEvent(entry.type)) return '✓';
    if (this.isDomEvent(entry.type)) return '↳';
    if (!entry.flowId) return '·';
    return '•';
  }

  getEventRowClass(entry) {
    if (entry.type === 'outermost-action-start') {
      return 'fx-debugger__event-row--group-start';
    }

    if (entry.type === 'outermost-action-end') {
      return 'fx-debugger__event-row--group-end';
    }

    return '';
  }

  isDomEvent(type) {
    return ['click', 'input', 'change', 'blur', 'focusout', 'keydown'].includes(type);
  }

  isCustomEvent(type) {
    return this.customEventTypes.includes(type);
  }

  isActionEvent(type) {
    return [
      'outermost-action-start',
      'outermost-action-end',
      'action-start',
      'action-end',
      'action-performed',
    ].includes(type);
  }

  isUpdateCycleEvent(type) {
    return ['recalculate-done', 'revalidate-done', 'refresh', 'refresh-done'].includes(type);
  }

  isLifecycleEvent(type) {
    return [
      'model-construct',
      'model-construct-done',
      'rebuild-done',
      'recalculate-done',
      'revalidate-done',
      'refresh',
      'refresh-done',
      'ready',
    ].includes(type);
  }

  renderEventDetail(entry) {
    if (!entry.detailSummary) {
      return '<span class="fx-debugger__muted">—</span>';
    }

    if (this.isActionEvent(entry.type)) {
      return this.renderActionEventDetail(entry);
    }

    return `<code>${this.escape(entry.detailSummary)}</code>`;
  }

  renderActionEventDetail(entry) {
    const detail = this.parseEventDetailSummary(entry.detailSummary);

    if (!detail) {
      return `<code>${this.escape(entry.detailSummary)}</code>`;
    }

    const action = detail.action || detail.actionClass || 'action';
    const phase =
      detail.phase ||
      (entry.type === 'action-start'
        ? 'start'
        : entry.type === 'action-end' || entry.type === 'action-performed'
          ? 'end'
          : '');

    const event = detail.event ? `event=${detail.event}` : '';
    const ref = detail.ref ? `ref=${detail.ref}` : '';
    const target = detail.target ? `target=${detail.target}` : '';
    const origin = detail.origin ? `origin=${detail.origin}` : '';
    const submission = detail.submission ? `submission=${detail.submission}` : '';
    const control = detail.control ? `control=${detail.control}` : '';
    const ownerFore = detail.ownerFore ? `fore=${detail.ownerFore}` : '';
    const needsUpdate = detail.needsUpdate === true ? 'needsUpdate=true' : '';
    const success = detail.success === false ? 'success=false' : '';

    const parts = [
      event,
      ref,
      target,
      origin,
      submission,
      control,
      ownerFore,
      needsUpdate,
      success,
    ].filter(Boolean);

    return `
      <div class="fx-debugger__action-detail">
        <span class="fx-debugger__action-pill">${this.escape(String(action))}</span>
        ${phase ? `<span class="fx-debugger__action-phase">${this.escape(String(phase))}</span>` : ''}
        ${
          parts.length
            ? `<code>${this.escape(parts.join(' · '))}</code>`
            : '<span class="fx-debugger__muted">—</span>'
        }
      </div>
    `;
  }

  parseEventDetailSummary(summary) {
    if (!summary || typeof summary !== 'string') {
      return null;
    }

    try {
      return JSON.parse(summary);
    } catch (error) {
      return null;
    }
  }

  renderBindingsPanel() {
    const bindings = this.snapshot?.bindings || [];

    if (!bindings.length) {
      return this.renderEmptyPanel('No bindings found.');
    }

    return `
      <section class="fx-debugger__section">
        <h3>Bindings</h3>

        <div class="fx-debugger__table-wrap">
          <table class="fx-debugger__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ref</th>
                <th>Instance</th>
                <th>Type</th>
                <th>Calculate</th>
                <th>Readonly</th>
                <th>Required</th>
                <th>Relevant</th>
                <th>Constraint</th>
                <th>Datatype</th>
                <th>Model items</th>
              </tr>
            </thead>
            <tbody>
              ${bindings
                .map(
                  bind => `
                    <tr>
                      <td>${this.renderCodeOrDash(bind?.id)}</td>
                      <td>${this.renderCodeOrDash(bind?.ref)}</td>
                      <td>${this.renderCodeOrDash(bind?.instanceId)}</td>
                      <td>${this.renderCodeOrDash(bind?.bindType)}</td>
                      <td>${this.renderCodeOrDash(bind?.calculate)}</td>
                      <td>${this.renderCodeOrDash(bind?.readonly)}</td>
                      <td>${this.renderCodeOrDash(bind?.required)}</td>
                      <td>${this.renderCodeOrDash(bind?.relevant)}</td>
                      <td>${this.renderCodeOrDash(bind?.constraint)}</td>
                      <td>${this.renderCodeOrDash(bind?.type)}</td>
                      <td>${this.renderValue(bind?.modelItemCount)}</td>
                    </tr>
                  `,
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  renderSubmissionsPanel() {
    const submissions = this.snapshot?.submissions || [];

    if (!submissions.length) {
      return this.renderEmptyPanel('No submissions found.');
    }

    return `
    <section class="fx-debugger__section">
      <h3>Submissions</h3>

      <div class="fx-debugger__table-wrap">
        <table class="fx-debugger__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Method</th>
              <th>URL</th>
              <th>Resource</th>
              <th>Ref</th>
              <th>Instance</th>
              <th>Replace</th>
              <th>Target</th>
              <th>Target ref</th>
              <th>Mediatype</th>
              <th>Serialization</th>
              <th>Validate</th>
              <th>Relevant</th>
              <th>Response</th>
            </tr>
          </thead>
          <tbody>
            ${submissions
              .map(
                submission => `
                  <tr>
                    <td>${this.renderCodeOrDash(submission?.id)}</td>
                    <td>${this.renderCodeOrDash(submission?.method)}</td>
                    <td>${this.renderCodeOrDash(submission?.url || submission?.action)}</td>
                    <td>${this.renderCodeOrDash(submission?.resource)}</td>
                    <td>${this.renderCodeOrDash(submission?.ref)}</td>
                    <td>${this.renderCodeOrDash(submission?.instance)}</td>
                    <td>${this.renderCodeOrDash(submission?.replace)}</td>
                    <td>${this.renderCodeOrDash(submission?.target)}</td>
                    <td>${this.renderCodeOrDash(submission?.targetref)}</td>
                    <td>${this.renderCodeOrDash(submission?.mediatype)}</td>
                    <td>${this.renderCodeOrDash(submission?.serialization)}</td>
                    <td>${this.renderCodeOrDash(submission?.validate)}</td>
                    <td>${this.renderCodeOrDash(submission?.relevant)}</td>
                    <td>${this.renderSubmissionResponse(submission)}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
  }

  renderSubmissionResponse(submission) {
    if (!submission?.hasResponse) {
      return '<span class="fx-debugger__muted">—</span>';
    }

    const status = submission.responseStatus || '';
    const text = submission.responseStatusText || '';

    return `<code>${this.escape(`${status} ${text}`.trim())}</code>`;
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
              ${instances
                .map(
                  instance => `
                    <tr>
                      <td><code>${this.escape(instance?.instanceId || instance?.id || '')}</code></td>
                      <td>${this.escape(instance?.type || '')}</td>
                      <td>${this.renderCodeOrDash(instance?.src)}</td>
                      <td>${this.formatBoolean(instance?.hasData)}</td>
                      <td>${this.formatBoolean(instance?.hasNodeset)}</td>
                      <td>${this.escape(instance?.defaultContextType || '')}</td>
                      <td>${this.escape(instance?.mutationCount ?? '')}</td>
                    </tr>
                  `,
                )
                .join('')}
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
              ${modelItems
                .map(
                  item => `
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
                  `,
                )
                .join('')}
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
            ${boundElements
              .map(
                (element, index) => `
                  <tr>
                    <td>
                      <button
                        class="fx-debugger__element-link"
                        type="button"
                        data-bound-element-index="${index}"
                        title="Highlight this bound element in the page">
                        <code>${this.escape(element?.localName || '')}</code>
                      </button>
                    </td>
                    <td>${this.renderCodeOrDash(element?.id)}</td>
                    <td>${this.renderCodeOrDash(element?.ref)}</td>
                    <td>${this.renderCodeOrDash(element?.modelItemPath)}</td>
                    <td>${this.renderCodeOrDash(element?.instanceId)}</td>
                    <td>${this.renderValue(element?.value)}</td>
                    <td>${this.formatBoolean(element?.required)}</td>
                    <td>${this.formatBoolean(element?.relevant)}</td>
                    <td>${this.formatBoolean(element?.readonly)}</td>
                  </tr>
                `,
              )
              .join('')}
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
      <pre class="fx-debugger__json">${this.escape(JSON.stringify(value, null, 2))}</pre>
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

  clearEvents() {
    this.eventLog = [];
    this._eventFlowDepth = 0;
    this._eventFlowId = 0;
    this.render();
    this.applyPageOffset();
  }

  _onKeyDown(event) {
    if (this.activePanel !== 'events') {
      return;
    }

    if (this.isEditableEventTarget(event.target)) {
      return;
    }

    if (event.key.toLowerCase() !== 'c' || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.clearEvents();
  }

  isEditableEventTarget(target) {
    if (!target) {
      return false;
    }

    const { localName } = target;

    return (
      localName === 'input' ||
      localName === 'textarea' ||
      localName === 'select' ||
      target.isContentEditable === true
    );
  }

  _onEventFilterChange(event) {
    const key = event.currentTarget?.dataset?.eventFilter;

    if (!key || !(key in this.eventFilters)) {
      return;
    }

    this.eventFilters[key] = event.currentTarget.checked;
    this.storeEventSettings();
    this.render();
    this.applyPageOffset();
  }

  _onDomEventFilterChange(event) {
    const key = event.currentTarget?.dataset?.domEventFilter;

    if (!key || !(key in this.domEventFilters)) {
      return;
    }

    this.domEventFilters[key] = event.currentTarget.checked;
    this.storeEventSettings();
    this.render();
    this.applyPageOffset();
  }

  _onCustomEventsApply() {
    const input = this.querySelector('[data-custom-events-input]');
    const nextTypes = this.parseCustomEventTypes(input?.value || '');

    this.detachEventListeners();
    this.customEventTypes = nextTypes;
    this.attachEventListeners();

    this.storeEventSettings();
    this.render();
    this.applyPageOffset();
  }

  _onRefreshClick(event) {
    event.stopPropagation();
    this.refresh();
    this.render();
    this.applyPageOffset();
  }

  _onPanelClick(event) {
    const panel = event.currentTarget?.dataset?.panel;

    if (!panel || panel === this.activePanel) {
      return;
    }

    this.activePanel = panel;
    this.storeActivePanel();
    this.refresh();
    this.render();
    this.applyPageOffset();
  }

  _onForeTargetClick(event) {
    const targetId = event.currentTarget?.dataset?.foreTarget;

    if (!targetId) {
      return;
    }

    if (this.fore?.id === targetId) {
      this.highlightForeTarget(this.fore);
      return;
    }

    this.switchForeTarget(targetId);
  }

  _onBoundElementClick(event) {
    const index = Number.parseInt(event.currentTarget?.dataset?.boundElementIndex, 10);

    if (!Number.isFinite(index)) {
      return;
    }

    const element = this.getCurrentBoundDomElements()[index];

    if (!element) {
      return;
    }

    this.highlightPageElement(element);
  }

  highlightPageElement(element) {
    if (!element) {
      return;
    }

    this.clearHighlightedPageElement();

    this._highlightedElement = element;
    element.classList.add('fx-debugger-highlight-target');

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });

    window.clearTimeout(this._highlightedElementTimer);
    this._highlightedElementTimer = window.setTimeout(() => {
      this.clearHighlightedPageElement();
    }, 1600);
  }

  clearHighlightedPageElement() {
    window.clearTimeout(this._highlightedElementTimer);
    this._highlightedElementTimer = null;

    if (this._highlightedElement) {
      this._highlightedElement.classList.remove('fx-debugger-highlight-target');
      this._highlightedElement = null;
    }
  }

  _onForeRefreshDone() {
    this.refresh();
    this.render();
    this.applyPageOffset();
  }

  switchForeTarget(targetId, options = {}) {
    const { updateAttribute = true, resetEvents = true, highlight = true } = options;
    const nextFore = document.getElementById(targetId);

    if (!nextFore || nextFore.localName !== 'fx-fore') {
      return;
    }

    this.detachEventListeners();

    if (this.fore) {
      this.fore.removeEventListener('refresh-done', this._onForeRefreshDone);
    }

    this.fore = nextFore;

    if (updateAttribute && this.getAttribute('for') !== targetId) {
      this.setAttribute('for', targetId);
    }

    this.fore.addEventListener('refresh-done', this._onForeRefreshDone);
    this.attachEventListeners();

    if (resetEvents) {
      this.eventLog = [];
      this._eventFlowDepth = 0;
      this._eventFlowId = 0;
    }

    this.refresh();
    this.render();
    this.applyPageOffset();

    if (highlight) {
      this.highlightForeTarget(this.fore);
    }
  }

  getObservedEventTypes() {
    return Array.from(new Set([...this.eventTypes, ...this.customEventTypes]));
  }

  attachEventListeners() {
    if (!this.fore) {
      return;
    }

    this.getObservedEventTypes().forEach(type => {
      this.fore.addEventListener(type, this._onDebugEvent, true);
    });
  }

  detachEventListeners() {
    if (!this.fore) {
      return;
    }

    this.getObservedEventTypes().forEach(type => {
      this.fore.removeEventListener(type, this._onDebugEvent, true);
    });
  }

  _onDebugEvent(event) {
    const entry = this.createEventLogEntry(event);
    this.updateEventFlowDepth(entry);

    this.eventLog.push(entry);

    if (this.eventLog.length > this.maxEventLogEntries) {
      this.eventLog.splice(0, this.eventLog.length - this.maxEventLogEntries);
    }

    this.eventLog = this.eventLog.map((item, index) => ({
      ...item,
      index: index + 1,
    }));

    if (this.activePanel === 'events') {
      this.render();
      this.applyPageOffset();
    }
  }

  createEventLogEntry(event) {
    const time = performance.now();

    return {
      index: this.eventLog.length + 1,
      time,
      timeLabel: `${time.toFixed(1)}ms`,
      type: event.type,
      target: this.describeEventTarget(event.target),
      origin: this.describeEventTarget(event.composedPath?.()[0] || event.target),
      detailSummary: this.summarizeEvent(event),
    };
  }

  updateEventFlowDepth(entry) {
    if (entry.type === 'outermost-action-start') {
      this._eventFlowId += 1;
      entry.flowId = this._eventFlowId;
      entry.depth = 0;
      this._eventFlowDepth = 1;
      return;
    }

    if (entry.type === 'outermost-action-end') {
      entry.flowId = this._eventFlowId;
      entry.depth = 0;
      this._eventFlowDepth = 0;
      return;
    }

    if (entry.type === 'action-start') {
      entry.flowId = this._eventFlowId || null;
      entry.depth = this._eventFlowDepth;
      this._eventFlowDepth += 1;
      return;
    }

    if (entry.type === 'action-end') {
      this._eventFlowDepth = Math.max(1, this._eventFlowDepth - 1);
      entry.flowId = this._eventFlowId || null;
      entry.depth = this._eventFlowDepth;
      return;
    }

    entry.flowId = this._eventFlowId || null;
    entry.depth = this._eventFlowDepth;
  }

  describeEventTarget(target) {
    if (!target) {
      return '';
    }

    const localName = target.localName || target.nodeName || target.constructor?.name || 'unknown';
    const id = target.id ? `#${target.id}` : '';

    return `${localName}${id}`;
  }

  summarizeEvent(event) {
    if (this.isDomEvent(event.type)) {
      return this.summarizeDomEvent(event);
    }

    return this.summarizeEventDetail(event.detail);
  }

  summarizeDomEvent(event) {
    const { target } = event;

    const summary = {
      type: event.type,
      target: this.describeEventTarget(target),
    };

    if (target && 'value' in target) {
      summary.value = target.value;
    }

    if (target && 'checked' in target) {
      summary.checked = target.checked;
    }

    if (target?.name) {
      summary.name = target.name;
    }

    if (target?.type) {
      summary.inputType = target.type;
    }

    if (event.type === 'keydown') {
      summary.key = event.key;
      summary.code = event.code;
    }

    if (event.relatedTarget) {
      summary.relatedTarget = this.describeEventTarget(event.relatedTarget);
    }

    return this.safeJson(summary);
  }

  summarizeEventDetail(detail) {
    if (detail === undefined || detail === null) {
      return '';
    }

    if (typeof detail !== 'object') {
      return String(detail);
    }

    const summary = {};

    Object.entries(detail).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        summary[key] = value;
        return;
      }

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        summary[key] = value;
        return;
      }

      if (Array.isArray(value)) {
        summary[key] = `[array:${value.length}]`;
        return;
      }

      summary[key] = this.describeEventTarget(value) || value.constructor?.name || typeof value;
    });

    return this.safeJson(summary);
  }

  parseCustomEventTypes(value) {
    return Array.from(
      new Set(
        String(value || '')
          .split(/[\s,]+/)
          .map(type => type.trim())
          .filter(Boolean),
      ),
    );
  }

  storeEventSettings() {
    try {
      localStorage.setItem(
        this._eventSettingsStorageKey,
        JSON.stringify({
          eventFilters: this.eventFilters,
          domEventFilters: this.domEventFilters,
          customEventTypes: this.customEventTypes,
        }),
      );
    } catch (error) {
      // Ignore storage errors, e.g. private mode or disabled localStorage.
    }
  }

  restoreEventSettings() {
    try {
      const raw = localStorage.getItem(this._eventSettingsStorageKey);

      if (!raw) {
        return;
      }

      const settings = JSON.parse(raw);

      if (settings?.eventFilters && typeof settings.eventFilters === 'object') {
        this.eventFilters = {
          ...this.eventFilters,
          ...settings.eventFilters,
        };
      }

      if (settings?.domEventFilters && typeof settings.domEventFilters === 'object') {
        this.domEventFilters = {
          ...this.domEventFilters,
          ...settings.domEventFilters,
        };
      }

      if (Array.isArray(settings?.customEventTypes)) {
        this.customEventTypes = this.parseCustomEventTypes(settings.customEventTypes.join(' '));
      }
    } catch (error) {
      // Ignore storage errors or invalid stored JSON.
    }
  }

  storeActivePanel() {
    try {
      localStorage.setItem(this._activePanelStorageKey, this.activePanel);
    } catch (error) {
      // Ignore storage errors, e.g. private mode or disabled localStorage.
    }
  }

  restoreActivePanel() {
    try {
      const activePanel = localStorage.getItem(this._activePanelStorageKey);

      if (
        activePanel &&
        [
          'fore',
          'graphs',
          'events',
          'instances',
          'bindings',
          'submissions',
          'modelItems',
          'boundElements',
          'raw',
        ].includes(activePanel)
      ) {
        this.activePanel = activePanel;
      }
    } catch (error) {
      // Ignore storage errors, e.g. private mode or disabled localStorage.
    }
  }

  _onResizePointerDown(event) {
    if (this._collapsed) {
      return;
    }

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
    this.applyPageOffset();
  }

  _onResizePointerUp() {
    this.classList.remove('fx-debugger--resizing');
    this.storeHeight();
    this.applyPageOffset();

    window.removeEventListener('pointermove', this._onResizePointerMove);
    window.removeEventListener('pointerup', this._onResizePointerUp);
  }

  _getCssPixelValue(property, fallback) {
    const value = Number.parseFloat(getComputedStyle(this).getPropertyValue(property));
    return Number.isFinite(value) ? value : fallback;
  }

  storeHeight() {
    try {
      const height = Math.round(this.getBoundingClientRect().height);
      localStorage.setItem(this._storageKey, String(height));
    } catch (error) {
      // Ignore storage errors, e.g. private mode or disabled localStorage.
    }
  }

  restoreHeight() {
    try {
      const storedHeight = Number.parseInt(localStorage.getItem(this._storageKey), 10);

      if (!Number.isFinite(storedHeight)) {
        return;
      }

      const minHeight = 192;
      const maxHeight = Math.min(window.innerHeight * 0.85, window.innerHeight - 40);
      const clampedHeight = Math.max(minHeight, Math.min(maxHeight, storedHeight));

      this.style.height = `${clampedHeight}px`;
    } catch (error) {
      // Ignore storage errors, e.g. private mode or disabled localStorage.
    }
  }

  _onToggleClick() {
    if (this._collapsed) {
      this.expandPanel();
    } else {
      this.collapsePanel();
    }

    this.render();
    this.applyPageOffset();
  }

  collapsePanel() {
    this.storeHeight();

    this._collapsed = true;
    this.classList.add('fx-debugger--collapsed');
    this.style.height = `${this.getCollapsedHeight()}px`;

    this.storeCollapsedState();
    this.applyPageOffset();
  }

  expandPanel() {
    this._collapsed = false;
    this.classList.remove('fx-debugger--collapsed');

    this.restoreHeight();
    this.storeCollapsedState();
    this.applyPageOffset();
  }

  storeCollapsedState() {
    try {
      localStorage.setItem(this._collapsedStorageKey, this._collapsed ? 'true' : 'false');
    } catch (error) {
      // Ignore storage errors, e.g. private mode or disabled localStorage.
    }
  }

  restorePanelState() {
    try {
      this._collapsed = localStorage.getItem(this._collapsedStorageKey) === 'true';
    } catch (error) {
      this._collapsed = false;
    }

    this.classList.toggle('fx-debugger--collapsed', this._collapsed);

    if (this._collapsed) {
      requestAnimationFrame(() => {
        this.style.height = `${this.getCollapsedHeight()}px`;
        this.applyPageOffset();
      });
      return;
    }

    this.restoreHeight();

    requestAnimationFrame(() => {
      this.applyPageOffset();
    });
  }

  getCollapsedHeight() {
    const header = this.querySelector('.fx-debugger__header');
    const headerHeight = header?.getBoundingClientRect().height || 56;

    return Math.ceil(headerHeight);
  }

  applyPageOffset() {
    if (!document.body) {
      return;
    }

    if (this._originalBodyPaddingBottom === undefined) {
      this._originalBodyPaddingBottom = document.body.style.paddingBottom || '';
    }

    const height = Math.ceil(this.getBoundingClientRect().height || this.getCollapsedHeight());
    document.body.style.paddingBottom = `${height}px`;
  }

  clearPageOffset() {
    if (!document.body) {
      return;
    }

    if (this._originalBodyPaddingBottom !== undefined) {
      document.body.style.paddingBottom = this._originalBodyPaddingBottom;
      this._originalBodyPaddingBottom = undefined;
      return;
    }

    document.body.style.paddingBottom = '';
  }

  ensureGlobalHighlightStyle() {
    const styleId = 'fx-debugger-global-highlight-style';

    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
    .fx-debugger-highlight-overlay {
      position: fixed;
      z-index: 2147483646;
      pointer-events: none;
      border: 3px solid #174ea6;
      border-radius: 0.35rem;
      box-shadow:
        0 0 0 6px rgba(23, 78, 166, 0.18),
        0 0 1.25rem rgba(23, 78, 166, 0.35);
      background: rgba(23, 78, 166, 0.04);
      transition:
        left 0.12s ease,
        top 0.12s ease,
        width 0.12s ease,
        height 0.12s ease,
        opacity 0.2s ease;
    }

    .fx-debugger-highlight-overlay.fx-debugger-highlight-overlay--fade {
      opacity: 0;
    }
  `;

    document.head.appendChild(style);
  }

  highlightForeTarget(target) {
    this.highlightPageElement(target);
  }

  clearHighlightedForeTarget() {
    window.clearTimeout(this._highlightedForeTargetTimer);
    this._highlightedForeTargetTimer = null;

    if (this._highlightedForeTarget) {
      this._highlightedForeTarget.classList.remove('fx-debugger-highlight-target');
      this._highlightedForeTarget = null;
    }
  }
}

if (!customElements.get('fx-debugger')) {
  customElements.define('fx-debugger', FxDebugger);
}
