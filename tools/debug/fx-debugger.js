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

/**
 * Additional Fore events that fx-debugger does not observe by default.
 * Each entry can be toggled on individually in the "Fore events" filter group.
 */
const FORE_EVENT_TYPES = [
  { name: 'execute-action', description: 'fires when an action executes' },
  { name: 'init', description: 'fires when a control initializes' },
  { name: 'instance-loaded', description: 'fires after an fx-instance has been loaded' },
  { name: 'loaded', description: 'fires after a fx-load has loaded' },
  { name: 'reload', description: 'fires when a fx-reload action executes' },
  { name: 'return', description: 'fires after a fx-return returned' },
  { name: 'index-changed', description: 'fires when the repeat index changes' },
  { name: 'item-created', description: 'fires when a repeat item was created' },
  { name: 'item-changed', description: 'fires when a repeat item was changed' },
  { name: 'select', description: 'fires when an fx-case has been selected' },
  { name: 'deselect', description: 'fires when fx-case is deselected' },
  { name: 'dialog-shown', description: 'fired when a dialog has been shown' },
  { name: 'dialog-hidden', description: 'fires after fx-dialog has been hidden' },
  { name: 'valid', description: 'fires after a fx-control has become valid' },
  { name: 'invalid', description: 'fires after a control became invalid' },
  { name: 'relevant', description: 'fires after a fx-control has become relevant' },
  { name: 'nonrelevant', description: 'fires after an fx-control became nonrelevant' },
  { name: 'optional', description: 'fires after an fx-control became optional' },
  { name: 'required', description: 'fires after an fx-control has become required' },
  { name: 'readonly', description: 'fires after an fx-control became readonly' },
  { name: 'readwrite', description: 'fires after an fx-control became readwrite' },
  { name: 'show-control', description: 'fires when a control becomes visible' },
  { name: 'hide-control', description: 'fires when a control becomes hidden' },
  { name: 'show-group', description: 'fires when a group becomes visible' },
  { name: 'enabled', description: 'fires when a container becomes enabled' },
  { name: 'disabled', description: 'fires when a container becomes disabled' },
  { name: 'warn', description: 'fires when a control issues a warning' },
  { name: 'message', description: 'fires when an fx-message action displays a message' },
  {
    name: 'xforms-binding-error',
    description: 'fires when a variable name is declared more than once',
  },
  { name: 'no-template-error', description: 'fires when fx-repeat has no template to clone' },
  { name: 'include-done', description: 'fires after an fx-include has finished loading content' },
  { name: 'compute-exception', description: 'fires when a cyclic dependency is detected' },
  { name: 'open', description: 'fires when an fx-connection (WebSocket) opens' },
  { name: 'close', description: 'fires when an fx-connection (WebSocket) closes' },
  { name: 'channel-message', description: 'fires when an fx-connection receives a message' },
  { name: 'insert', description: 'fires when an fx-insert action inserts new nodes' },
  { name: 'deleted', description: 'fires when an fx-delete action deletes nodes' },
  { name: 'action-performed', description: 'fires after each action has been executed' },
];

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
        position: relative;
        flex: 0 0 auto;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(7rem, auto);
        align-items: start;
        gap: 1rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #e3e5ea;
        background: #f8f9fb;
        cursor: default;
      }

      .fx-debugger__header::after {
        content: "Double-click header to collapse/open";
        grid-column: 2;
        grid-row: 1;
        align-self: center;
        color: #8a9099;
        font-size: 0.8rem;
        font-weight: 400;
        line-height: 1;
        text-align: center;
        white-space: nowrap;
        pointer-events: none;
      }

      .fx-debugger__header-left {
        grid-column: 1;
        grid-row: 1;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .fx-debugger__refresh {
        grid-column: 3;
        grid-row: 1;
        justify-self: end;
        align-self: start;
      }
      .fx-debugger__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        padding:0.5rem 0;
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

      .fx-debugger__refresh {
        position: relative;
        z-index: 1;
        flex: 0 0 auto;
        margin-left: auto;
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

      main.fx-debugger__panel {
        display: flex;
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        padding: 1rem;
        width:calc(100vw - 1rem);
      }
      section.fx-debugger__section {
          width: 100%;
      }
      .fx-debugger__section h3 {
        margin: 0 0 0.75rem;
        font-size: 0.95rem;
        font-weight: 700;
        padding:1rem 0;
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
        margin: 0;
        padding: 0;
        border: none;
        border-radius: 0;
        background: transparent;
      }

      .fx-debugger__fore-targets-label {
        margin-bottom: 0.3rem;
        color: #5f6368;
        font-size: 0.8rem;
        font-weight: 600;
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
        z-index: 2;
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

      .fx-debugger__graphs-columns {
        display: flex;
        gap: 1.25rem;
        align-items: flex-start;
      }

      .fx-debugger__graph-col {
        flex: 1 1 50%;
        min-width: 0;
      }

      @keyframes fx-debugger-graph-flash {
        0% {
          background-color: #fef7e0;
          border-color: #fbbc04;
          box-shadow: 0 0 0 2px rgba(251, 188, 4, 0.45);
        }
        100% {
          background-color: #fff;
          border-color: #e3e5ea;
          box-shadow: 0 0 0 0 rgba(251, 188, 4, 0);
        }
      }

      .fx-debugger__graph-col--updated .fx-debugger__graph-summary,
      .fx-debugger__graph-col--updated .fx-debugger__table-wrap {
        animation: fx-debugger-graph-flash 1.2s ease-out;
      }

      .fx-debugger__graph-summary {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }

      .fx-debugger__graph-stat {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        border: 1px solid #e3e5ea;
        border-radius: 0.35rem;
        padding: 0.4rem 0.65rem;
        background: #fff;
        min-width: 5.5rem;
      }

      .fx-debugger__graph-stat-value {
        font-size: 1.05rem;
        font-weight: 700;
        color: #202124;
      }

      .fx-debugger__graph-stat-label {
        font-size: 0.72rem;
        color: #5f6368;
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }

      .fx-debugger__event-toolbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 0.75rem;
      }

      .fx-debugger__event-filters {
        margin: 0 0 0.75rem;
        padding: 0.4rem 0.65rem;
        border: 1px solid #e3e5ea;
        border-radius: 0.35rem;
        background: #fafafa;
      }

      .fx-debugger__event-filters summary {
        cursor: pointer;
        user-select: none;
        font-size: 0.86rem;
        line-height: 1.6;
      }

      .fx-debugger__event-filters-body {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        padding-top: 0.5rem;
      }

      .fx-debugger__event-filter-group {
        display: grid;
        grid-template-columns: 7rem 1fr;
        gap: 0.25rem 0.75rem;
        align-items: baseline;
        padding-top: 0.5rem;
        border-top: 1px solid #e3e5ea;
      }

      .fx-debugger__event-filter-group:first-child {
        padding-top: 0;
        border-top: none;
      }

      .fx-debugger__event-filter-group-label {
        color: #8a9099;
        font-size: 0.8rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .fx-debugger__event-filter-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
        gap: 0.3rem 0.75rem;
      }

      .fx-debugger__event-filter {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        color: #3c4043;
        font-size: 0.86rem;
        white-space: nowrap;
        cursor: pointer;
      }

      .fx-debugger__event-filter input {
        margin: 0;
        flex: none;
      }

      .fx-debugger__event-filter-count {
        margin-left: auto;
        padding-left: 0.4rem;
        color: #8a9099;
        font-size: 0.8rem;
        font-variant-numeric: tabular-nums;
      }

      .fx-debugger__custom-events {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        align-items: center;
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
      .fx-debugger__event-flow-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin: 0 0 0.75rem;
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

      .fx-debugger__perf-history-title {
        margin: 1.25rem 0 0.75rem;
        font-size: 0.95rem;
        font-weight: 700;
      }

      .fx-debugger__perf-row--spike td {
        background: #fce8e6;
        color: #a50e0e;
        font-weight: 700;
      }
    `;
  }

  constructor() {
    super();

    this.fore = null;
    this.snapshot = null;
    this.activePanel = 'fore';

    this.eventLog = [];
    this._eventFlowDepth = 0;
    this._eventFlowId = 0;

    this._perfHistory = [];
    this.maxPerfHistoryEntries = 50;
    this._lastPerfCycleTimestamp = null;
    this._lastPerfRefreshTimestamp = null;

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

    // action-start/action-end fire once per nested action and can flood the
    // table during bulk operations; outermost-action-start/end (the flow
    // boundaries) stay visible regardless of this toggle.
    this.actionEventFilters = {
      steps: false,
    };

    this.dataEventFilters = {
      'value-changed': true,
      'path-mutated': true,
      insert: true,
      delete: true,
      deleted: true,
    };

    this.foreEventFilters = FORE_EVENT_TYPES.reduce((filters, { name }) => {
      filters[name] = false;
      return filters;
    }, {});

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
      'delete',
      'deleted',
      'insert',
      'submit',
      'submit-done',
      'submit-error',
      'outermost-action-start',
      'outermost-action-end',
      'action-start',
      'action-end',
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
    this._onActionEventFilterChange = this._onActionEventFilterChange.bind(this);
    this._onDataEventFilterChange = this._onDataEventFilterChange.bind(this);
    this._onForeEventFilterChange = this._onForeEventFilterChange.bind(this);
    this._onCustomEventsApply = this._onCustomEventsApply.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onForeTargetsChanged = this._onForeTargetsChanged.bind(this);

    this._resizeStartY = 0;
    this._resizeStartHeight = 0;
    this._eventFiltersOpen = false;
    this._eventsRenderScheduled = false;
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

    this._previousGraphSnapshots = null;
    this._graphHighlights = {};
    this._graphHighlightTimer = null;
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

    window.clearTimeout(this._graphHighlightTimer);
    this._graphHighlightTimer = null;

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

    if (this.activePanel === 'graphs') {
      this.updateGraphHighlights(this.snapshot?.model?.graphs);
    }

    this.recordPerfHistory();
  }

  /**
   * Append a row to the performance history whenever the target's model/refresh
   * debug info reports a newer update cycle, so the Performance panel can show
   * a trend across refresh cycles (e.g. a sudden jump after adding a feature).
   */
  recordPerfHistory() {
    const cycle = this.snapshot?.model?.lastCycle || null;
    const refreshInfo = this.snapshot?.fore?.lastRefresh || null;

    const cycleChanged = !!cycle && cycle.timestamp !== this._lastPerfCycleTimestamp;
    const refreshChanged = !!refreshInfo && refreshInfo.timestamp !== this._lastPerfRefreshTimestamp;

    if (!cycleChanged && !refreshChanged) {
      return;
    }

    if (cycle) this._lastPerfCycleTimestamp = cycle.timestamp;
    if (refreshInfo) this._lastPerfRefreshTimestamp = refreshInfo.timestamp;

    this._perfHistory.push({
      time: Math.max(cycle?.timestamp || 0, refreshInfo?.timestamp || 0),
      rebuildMs: cycle?.rebuildMs ?? null,
      recalculateMs: cycle?.recalculateMs ?? null,
      revalidateMs: cycle?.revalidateMs ?? null,
      refreshMs: refreshInfo?.durationMs ?? null,
      refreshKind: refreshInfo?.kind ?? null,
      totalMs: (cycle?.totalMs || 0) + (refreshInfo?.durationMs || 0),
      computes: cycle?.computes ?? null,
      modelItemCount: cycle?.modelItemCount ?? null,
    });

    if (this._perfHistory.length > this.maxPerfHistoryEntries) {
      this._perfHistory.splice(0, this._perfHistory.length - this.maxPerfHistoryEntries);
    }
  }

  updateGraphHighlights(graphs) {
    const previous = this._previousGraphSnapshots;

    if (previous) {
      ['mainGraph', 'subGraph'].forEach(key => {
        if (JSON.stringify(graphs?.[key]) !== JSON.stringify(previous?.[key])) {
          this._graphHighlights[key] = true;
        }
      });
    }

    this._previousGraphSnapshots = graphs ? JSON.parse(JSON.stringify(graphs)) : null;

    if (this._graphHighlights.mainGraph || this._graphHighlights.subGraph) {
      window.clearTimeout(this._graphHighlightTimer);
      this._graphHighlightTimer = window.setTimeout(() => {
        this._graphHighlights = {};
        this._graphHighlightTimer = null;

        if (this.activePanel === 'graphs') {
          this.render();
        }
      }, 1200);
    }
  }

  render() {
    this.innerHTML = `
      <style>${FxDebugger.styles}</style>

      <section class="fx-debugger__shell">
        <div class="fx-debugger__resize-hint" data-action="resize" title="Drag to resize debugger panel vertically"></div>

        <header class="fx-debugger__header">
          <div class="fx-debugger__header-left">
            <h2 class="fx-debugger__title">Fore Debugger</h2>
            ${this.renderForeTargetList()}
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
          ${this.renderTab('perf', `Performance ${this.countBadge(this._perfHistory)}`)}
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

    this.querySelectorAll('[data-action="clear-perf"]').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        this.clearPerfHistory();
      });
    });

    this.querySelectorAll('[data-event-filter]').forEach(input => {
      input.addEventListener('change', this._onEventFilterChange);
    });

    this.querySelectorAll('[data-dom-event-filter]').forEach(input => {
      input.addEventListener('change', this._onDomEventFilterChange);
    });

    this.querySelectorAll('[data-action-event-filter]').forEach(input => {
      input.addEventListener('change', this._onActionEventFilterChange);
    });

    this.querySelectorAll('[data-data-event-filter]').forEach(input => {
      input.addEventListener('change', this._onDataEventFilterChange);
    });

    this.querySelectorAll('[data-fore-event-filter]').forEach(input => {
      input.addEventListener('change', this._onForeEventFilterChange);
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

    this.querySelector('.fx-debugger__event-filters')?.addEventListener('toggle', event => {
      this._eventFiltersOpen = event.target.open;
    });

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
      case 'perf':
        return this.renderPerformancePanel();
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
        <div class="fx-debugger__graphs-columns">
          <div class="fx-debugger__graph-col${this._graphHighlights.mainGraph ? ' fx-debugger__graph-col--updated' : ''}">
            <h3>Main graph</h3>
            ${this.renderGraphSummaryCard(graphs.mainGraph)}
            <h3>Calculation order</h3>
            ${this.renderCalculationOrderTable(graphs.mainGraph)}
          </div>

          <div class="fx-debugger__graph-col${this._graphHighlights.subGraph ? ' fx-debugger__graph-col--updated' : ''}">
            <h3>Sub graph</h3>
            ${this.renderGraphSummaryCard(graphs.subGraph)}
            <h3>Calculation order</h3>
            ${this.renderCalculationOrderTable(graphs.subGraph)}
          </div>
        </div>
      </section>
    `;
  }

  renderGraphSummaryCard(graph) {
    if (!graph) {
      return `<p class="fx-debugger__muted">No graph available.</p>`;
    }

    return `
      <div class="fx-debugger__graph-summary">
        ${this.renderGraphStat('Nodes', graph.nodeCount)}
        ${this.renderGraphStat('Edges', graph.edgeCount)}
        ${this.renderGraphStat('Compute nodes', graph.computeNodeCount)}
        ${this.renderGraphStat('Calculation order', graph.calculationOrderCount)}
      </div>
    `;
  }

  renderGraphStat(label, value) {
    return `
      <div class="fx-debugger__graph-stat">
        <span class="fx-debugger__graph-stat-value">${this.renderValue(value)}</span>
        <span class="fx-debugger__graph-stat-label">${label}</span>
      </div>
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
    const visibleEvents = this.getEventRows(this.getVisibleEventLog());

    if (!this.eventLog.length) {
      return this.renderEmptyPanel(
        'No Fore events captured yet. Interact with the form or press Refresh.',
      );
    }

    return `
      <section class="fx-debugger__section">

        <div class="fx-debugger__event-flow-header">
          <h3>Event flow</h3>
        
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

  renderPerformancePanel() {
    if (!this._perfHistory.length) {
      return this.renderEmptyPanel(
        'No update cycles recorded yet. Interact with the form to trigger a refresh.',
      );
    }

    const latest = this._perfHistory[this._perfHistory.length - 1];

    return `
      <section class="fx-debugger__section">
        <div class="fx-debugger__event-flow-header">
          <h3>Latest update cycle</h3>

          <button
            class="fx-debugger__clear-events"
            type="button"
            data-action="clear-perf"
            title="Clear performance history">
            Clear history
          </button>
        </div>

        <dl class="fx-debugger__details">
          ${this.renderDetail('Rebuild', this.formatMs(latest.rebuildMs))}
          ${this.renderDetail('Recalculate', this.formatMs(latest.recalculateMs))}
          ${this.renderDetail('Revalidate', this.formatMs(latest.revalidateMs))}
          ${this.renderDetail(
            'UI refresh',
            `${this.formatMs(latest.refreshMs)}${latest.refreshKind ? ` (${latest.refreshKind})` : ''}`,
          )}
          ${this.renderDetail('Total cycle', this.formatMs(latest.totalMs))}
          ${this.renderDetail(
            'Recalculated nodes',
            `${latest.computes ?? '—'} (model has ${latest.modelItemCount ?? '—'} items)`,
          )}
        </dl>

        <h3 class="fx-debugger__perf-history-title">History (last ${this._perfHistory.length} cycles)</h3>
        ${this.renderPerfHistoryTable()}
      </section>
    `;
  }

  renderPerfHistoryTable() {
    const rows = this._perfHistory;
    const baseline = this.getPerfBaseline(rows);

    return `
      <div class="fx-debugger__table-wrap">
        <table class="fx-debugger__table">
          <thead>
            <tr>
              <th>#</th>
              <th>Rebuild</th>
              <th>Recalculate</th>
              <th>Revalidate</th>
              <th>UI refresh</th>
              <th>Total</th>
              <th>Recalculated nodes</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((row, index) => {
                const spike = this.isPerfSpike(row, baseline);

                return `
                  <tr class="${spike ? 'fx-debugger__perf-row--spike' : ''}">
                    <td>${index + 1}</td>
                    <td>${this.formatMs(row.rebuildMs)}</td>
                    <td>${this.formatMs(row.recalculateMs)}</td>
                    <td>${this.formatMs(row.revalidateMs)}</td>
                    <td>
                      ${this.formatMs(row.refreshMs)}
                      ${row.refreshKind ? `<span class="fx-debugger__action-phase">${this.escape(row.refreshKind)}</span>` : ''}
                    </td>
                    <td>${spike ? '⚠ ' : ''}${this.formatMs(row.totalMs)}</td>
                    <td>${row.computes ?? '—'}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Median total cycle duration across the recorded history, used as a baseline
   * to flag cycles that are significantly slower than usual.
   */
  getPerfBaseline(rows) {
    const totals = rows.map(row => row.totalMs).filter(Number.isFinite);

    if (!totals.length) {
      return null;
    }

    const sorted = [...totals].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }

  isPerfSpike(row, baseline) {
    if (!baseline || !Number.isFinite(row.totalMs)) {
      return false;
    }

    return row.totalMs > baseline * 2 && row.totalMs - baseline > 2;
  }

  formatMs(value) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return '—';
    }

    return `${value.toFixed(2)} ms`;
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
      <details class="fx-debugger__event-filters"${this._eventFiltersOpen ? ' open' : ''}>
        <summary class="fx-debugger__muted">Show events</summary>
        <div class="fx-debugger__event-filters-body">
          <div class="fx-debugger__event-filter-group">
            <span class="fx-debugger__event-filter-group-label">Categories</span>
            <div class="fx-debugger__event-filter-list">
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
            </div>
          </div>
          ${this.renderDomEventFilters()}
          ${this.renderActionEventFilters()}
          ${this.renderDataEventFilters()}
          ${this.renderForeEventFilters()}
          ${this.renderCustomEventInput()}
        </div>
      </details>
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
      <div class="fx-debugger__event-filter-group">
        <span class="fx-debugger__event-filter-group-label">DOM events</span>
        <div class="fx-debugger__event-filter-list">
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
      </div>
    `;
  }

  renderActionEventFilters() {
    const count = this.getActionStepEventCount();

    return `
      <div class="fx-debugger__event-filter-group">
        <span class="fx-debugger__event-filter-group-label">Actions</span>
        <div class="fx-debugger__event-filter-list">
          <label
            class="fx-debugger__event-filter"
            title="By default each action's start/end pair collapses into a single row for the target action, with its duration. Enable to see the raw action-start/action-end events instead.">
            <input
              type="checkbox"
              data-action-event-filter="steps"
              ${this.actionEventFilters.steps ? 'checked' : ''}
              ${this.eventFilters.action ? '' : 'disabled'}>
            <span>Expand action start/end steps</span>
            <span class="fx-debugger__event-filter-count">${count}</span>
          </label>
        </div>
      </div>
    `;
  }

  getActionStepEventCount() {
    return this.eventLog.filter(
      entry => entry.type === 'action-start' || entry.type === 'action-end',
    ).length;
  }

  renderDataEventFilters() {
    const counts = this.getDataEventCounts();
    const filters = [
      ['value-changed', 'value-changed'],
      ['path-mutated', 'path-mutated'],
      ['insert', 'insert'],
      ['delete', 'delete'],
      ['deleted', 'deleted'],
    ];

    return `
      <div class="fx-debugger__event-filter-group">
        <span class="fx-debugger__event-filter-group-label">Data events</span>
        <div class="fx-debugger__event-filter-list">
          ${filters
            .map(
              ([key, label]) => `
                <label class="fx-debugger__event-filter">
                  <input
                    type="checkbox"
                    data-data-event-filter="${this.escape(key)}"
                    ${this.dataEventFilters[key] ? 'checked' : ''}
                    ${this.eventFilters.data ? '' : 'disabled'}>
                  <span>${this.escape(label)}</span>
                  <span class="fx-debugger__event-filter-count">${counts[key] || 0}</span>
                </label>
              `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  renderForeEventFilters() {
    const counts = this.getForeEventCounts();

    return `
      <div class="fx-debugger__event-filter-group">
        <span class="fx-debugger__event-filter-group-label">Fore events</span>
        <div class="fx-debugger__event-filter-list">
          ${FORE_EVENT_TYPES.map(
            ({ name, description }) => `
                <label class="fx-debugger__event-filter" title="${this.escape(description)}">
                  <input
                    type="checkbox"
                    data-fore-event-filter="${this.escape(name)}"
                    ${this.foreEventFilters[name] ? 'checked' : ''}>
                  <span>${this.escape(name)}</span>
                  <span class="fx-debugger__event-filter-count">${counts[name] || 0}</span>
                </label>
              `,
          ).join('')}
        </div>
      </div>
    `;
  }

  renderCustomEventInput() {
    return `
      <div class="fx-debugger__event-filter-group">
        <label class="fx-debugger__event-filter-group-label" for="fx-debugger-custom-events">Custom events</label>
        <div class="fx-debugger__custom-events">
          <input
            id="fx-debugger-custom-events"
            type="text"
            data-custom-events-input
            value="${this.escape(this.customEventTypes.join(', '))}"
            placeholder="event-name, another-event">
          <button type="button" data-action="apply-custom-events">Listen</button>
        </div>
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

      if (category === 'data') {
        return this.dataEventFilters[entry.type] !== false;
      }

      return true;
    });
  }

  /**
   * Collapses each action-start/action-end pair into a single "action" row
   * (unless expanded via the steps toggle) so the target action is the
   * visible unit, not the internal start/end bookkeeping.
   */
  getEventRows(events) {
    if (this.actionEventFilters.steps) {
      return events;
    }

    const rows = [];
    const openStarts = [];

    events.forEach(entry => {
      if (entry.type === 'action-start') {
        openStarts.push({ entry, rowIndex: rows.push(entry) - 1 });
        return;
      }

      if (entry.type === 'action-end') {
        const open = openStarts.pop();

        // No open action-start to pair with: the event log's fixed-size
        // buffer trimmed it from the front, leaving this end orphaned.
        // There's nothing meaningful to show, so drop it.
        if (!open) {
          return;
        }

        rows[open.rowIndex] = this.mergeActionEntries(open.entry, entry);
        return;
      }

      rows.push(entry);
    });

    return rows;
  }

  mergeActionEntries(start, end) {
    const startDetail = this.parseEventDetailSummary(start.detailSummary) || {};
    const endDetail = this.parseEventDetailSummary(end.detailSummary) || {};

    const duration =
      Number.isFinite(end.time) && Number.isFinite(start.time) ? end.time - start.time : null;

    return {
      index: start.index,
      time: start.time,
      timeLabel: start.timeLabel,
      type: 'action',
      actionName: startDetail.action || startDetail.actionClass || null,
      target: start.target,
      origin: start.origin,
      flowId: start.flowId,
      depth: start.depth,
      duration,
      // Keep the full start detail object (all action attributes, not a
      // curated subset) plus the outcome from the end event, so the detail
      // column still reflects the actual event payload.
      detailSummary: this.safeJson({
        ...startDetail,
        phase: undefined,
        success: endDetail.success,
      }),
    };
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

  getDataEventCounts() {
    return this.eventLog.reduce((counts, entry) => {
      if (this.isDataEvent(entry.type)) {
        counts[entry.type] = (counts[entry.type] || 0) + 1;
      }

      return counts;
    }, {});
  }

  getForeEventCounts() {
    return this.eventLog.reduce((counts, entry) => {
      if (this.isForeEvent(entry.type)) {
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

    if (this.isDataEvent(type)) {
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

    if (this.isForeEvent(type)) {
      return 'fore';
    }

    return 'other';
  }

  renderEventFlowCell(entry) {
    const depth = Math.max(0, entry.depth || 0);
    const nodeClass = this.getEventNodeClass(entry);
    const typeClass = this.getEventTypeClass(entry.type);
    const label = entry.type === 'action' && entry.actionName ? entry.actionName : entry.type;
    const duration =
      entry.type === 'action' && Number.isFinite(entry.duration)
        ? `<span class="fx-debugger__action-phase">${entry.duration.toFixed(2)}ms</span>`
        : '';

    return `
      <span class="fx-debugger__event-node ${nodeClass}" style="--event-depth: ${depth}">
        <span class="fx-debugger__event-branch">${this.escape(this.getEventBranchGlyph(entry))}</span>
        <code class="${typeClass}">${this.escape(label)}</code>
        ${duration}
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
    if (entry.type === 'action') return '▶■';
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

  isDataEvent(type) {
    return type in this.dataEventFilters;
  }

  isForeEvent(type) {
    return type in this.foreEventFilters;
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
      'action',
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

    // Actions are operations, not events with a payload: the Flow column
    // already names them, so this column stays to the same name badge used
    // elsewhere for actions instead of trying to render a detail object.
    if (entry.type === 'action') {
      return this.renderMergedActionDetail(entry);
    }

    if (this.isActionEvent(entry.type)) {
      return this.renderActionEventDetail(entry);
    }

    return `<code>${this.escape(entry.detailSummary)}</code>`;
  }

  renderMergedActionDetail(entry) {
    const detail = this.parseEventDetailSummary(entry.detailSummary);
    const name = entry.actionName || detail?.action || detail?.actionClass || 'action';
    const failed = detail?.success === false;

    return `
      <span class="fx-debugger__action-pill">${this.escape(String(name))}</span>
      ${failed ? '<span class="fx-debugger__action-phase">success=false</span>' : ''}
    `;
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
                <th>Shared</th>
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
                      <td>${this.formatBoolean(instance?.shared)}</td>
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

  clearPerfHistory() {
    this._perfHistory = [];
    this._lastPerfCycleTimestamp = null;
    this._lastPerfRefreshTimestamp = null;
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

  _onActionEventFilterChange(event) {
    const key = event.currentTarget?.dataset?.actionEventFilter;

    if (!key || !(key in this.actionEventFilters)) {
      return;
    }

    this.actionEventFilters[key] = event.currentTarget.checked;
    this.storeEventSettings();
    this.render();
    this.applyPageOffset();
  }

  _onDataEventFilterChange(event) {
    const key = event.currentTarget?.dataset?.dataEventFilter;

    if (!key || !(key in this.dataEventFilters)) {
      return;
    }

    this.dataEventFilters[key] = event.currentTarget.checked;
    this.storeEventSettings();
    this.render();
    this.applyPageOffset();
  }

  _onForeEventFilterChange(event) {
    const key = event.currentTarget?.dataset?.foreEventFilter;

    if (!key || !(key in this.foreEventFilters)) {
      return;
    }

    this.detachEventListeners();
    this.foreEventFilters[key] = event.currentTarget.checked;
    this.attachEventListeners();
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
    const enabledForeEvents = Object.keys(this.foreEventFilters).filter(
      type => this.foreEventFilters[type],
    );

    return Array.from(
      new Set([...this.eventTypes, ...enabledForeEvents, ...this.customEventTypes]),
    );
  }

  attachEventListeners() {
    if (!this.fore) {
      return;
    }

    this.getObservedEventTypes().forEach(type => {
      const target = type === 'compute-exception' ? window : this.fore;
      target.addEventListener(type, this._onDebugEvent, true);
    });
  }

  detachEventListeners() {
    if (!this.fore) {
      return;
    }

    this.getObservedEventTypes().forEach(type => {
      const target = type === 'compute-exception' ? window : this.fore;
      target.removeEventListener(type, this._onDebugEvent, true);
    });
  }

  _onDebugEvent(event) {
    const entry = this.createEventLogEntry(event);
    this.updateEventFlowDepth(entry);

    this.eventLog.push(entry);

    if (this.activePanel === 'events') {
      this.scheduleEventsRender();
    }
  }

  /**
   * A bulk operation (e.g. loading a large codelist) can dispatch hundreds of
   * events in the same tick. Coalesce those into a single render per animation
   * frame instead of a full innerHTML rebuild + forced reflow per event.
   */
  scheduleEventsRender() {
    if (this._eventsRenderScheduled) {
      return;
    }

    this._eventsRenderScheduled = true;

    requestAnimationFrame(() => {
      this._eventsRenderScheduled = false;

      if (!this.isConnected || this.activePanel !== 'events') {
        return;
      }

      this.render();
      this.applyPageOffset();
    });
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
          actionEventFilters: this.actionEventFilters,
          dataEventFilters: this.dataEventFilters,
          foreEventFilters: this.foreEventFilters,
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

      if (settings?.actionEventFilters && typeof settings.actionEventFilters === 'object') {
        this.actionEventFilters = {
          ...this.actionEventFilters,
          ...settings.actionEventFilters,
        };
      }

      if (settings?.dataEventFilters && typeof settings.dataEventFilters === 'object') {
        this.dataEventFilters = {
          ...this.dataEventFilters,
          ...settings.dataEventFilters,
        };
      }

      if (settings?.foreEventFilters && typeof settings.foreEventFilters === 'object') {
        this.foreEventFilters = {
          ...this.foreEventFilters,
          ...settings.foreEventFilters,
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
          'perf',
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
