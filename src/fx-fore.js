import { Fore } from './fore.js';
import './fx-instance.js';
import { FxModel } from './fx-model.js';
import '@jinntec/jinn-toast';
import { evaluateXPathToNodes, evaluateXPathToString } from './xpath-evaluation.js';
import getInScopeContext from './getInScopeContext.js';
import { XPathUtil } from './xpath-util.js';
import { FxRepeatAttributes } from './ui/fx-repeat-attributes.js';
import { FxBind } from './fx-bind.js';
import createNodes from './createNodes.js';

/**
 * Makes the dirty state of the form.
 *
 * Clean when there are no changes yet or all is submitted,
 * Dirty when there are unsaved changes.
 *
 * We might need a 'saving' state later
 */
const dirtyStates = {
  CLEAN: 'clean',
  DIRTY: 'dirty',
};

/**
 * Main class for Fore.Outermost container element for each Fore application.
 *
 * Root element for Fore. Kicks off initialization and displays messages.
 *
 * fx-fore is the outermost container for each form. A form can have exactly one model
 * with arbitrary number of instances.
 *
 * Main responsibilities are initialization and updating of model and instances, update of UI (refresh) and global messaging.
 *
 * @event compute-exception - dispatched in case the dependency graph is circular
 * @event refresh-done - dispatched after a refresh() run
 * @event ready - dispatched after Fore has fully been initialized
 * @event error - dispatches error when template expression fails to evaluate
 *
 * @ts-check
 */
export class FxFore extends HTMLElement {
  static outermostHandler = null;

  static draggedItem = null;

  // Records init gate events that have already happened for a given target (document/window/element).
  // This prevents “missed gate” situations when an fx-fore is replaced (e.g. via src loading)
  // after the init event already fired.
  static _initEventState = new WeakMap();

  static _hasSeenInitEvent(target, eventName) {
    const set = FxFore._initEventState.get(target);
    return !!(set && set.has(eventName));
  }

  static _markInitEventSeen(target, eventName) {
    let set = FxFore._initEventState.get(target);
    if (!set) {
      set = new Set();
      FxFore._initEventState.set(target, set);
    }
    set.add(eventName);
  }

  static get observedAttributes() {
    return ['src', 'selector'];
  }

  static get properties() {
    return {
      /**
       * wether to create nodes that are missing in the loaded data and
       * auto-create nodes when there's a binding found in the UI.
       */
      createNodes: {
        type: Boolean,
      },
      /**
       * ignore certain nodes for template expression search
       */
      ignoreExpressions: {
        type: String,
      },
      /**
       * merge-partial
       * @deprecated
       */
      mergePartial: {
        type: Boolean,
      },
      /**
       * Setting this marker attribute will refresh the UI in a lazy fashion just updating elements being
       * in viewport.
       *
       * this feature is still experimental and should be used with caution and extra testing
       */
      lazyRefresh: {
        type: Boolean,
      },
      model: {
        type: Object,
      },
      ready: {
        type: Boolean,
      },
      strict: {
        type: Boolean,
      },
      /**
       *
       */
      validateOn: {
        type: String,
      },
      version: {
        type: String,
      },
    };
  }

  /**
   * attaches handlers for
   *
   * - `model-construct-done` to trigger the processing of the UI
   * - `message` - to display a message triggered by an fx-message action
   * - `error` - to display an error message
   * - 'compute-exception`  - warn about circular dependencies in graph
   */
  constructor() {
    super();
    this.version = '[VI]Version: {version} - built on {date}[/VI]';

    /**
     * @type {import('./fx-model.js').FxModel}
     */
    this.model = null;
    this.inited = false;
    this._initGatesPromise = null;
    this._warnedWaitForDeprecation = false;
    this._srcLoadPromise = null;
    // this.addEventListener('model-construct-done', this._handleModelConstructDone);
    // todo: refactoring - these should rather go into connectedcallback
    this.addEventListener('message', this._displayMessage);
    // this.addEventListener('error', this._displayError);
    this.addEventListener('error', this._logError);
    this.addEventListener('warn', this._displayWarning);
    // this.addEventListener('log', this._logError);
    window.addEventListener('compute-exception', e => {
      console.error('circular dependency: ', e);
    });

    this.ready = false;
    this.storedTemplateExpressionByNode = new Map();

    // Stores the outer most action handler. If an action handler is already running, all
    // updates are included in that one
    this.outermostHandler = null;

    this.copiedElements = new WeakSet();

    this.dirtyState = dirtyStates.CLEAN;
    this.showConfirmation = false;

    // Batching for observer notifications during refresh
    this.isRefreshPhase = false;
    /**
     * The model items that will be updated next refresh
     *
     * @type {Set<ModelItem|import('./ui/UIElement.js').UIElement}
     */
    this.batchedNotifications = new Set();

    const style = `
            :host {
                display: block;
            }
            :host ::slotted(fx-model){
                display:none;
            }

            #modalMessage .dialogActions{
                text-align:center;
            }
            .overlay {
              position: fixed;
              top: 0;
              bottom: 0;
              left: 0;
              right: 0;
              background: rgba(0, 0, 0, 0.7);
              transition: all 500ms;
              visibility: hidden;
              opacity: 0;
              z-index:10;
            }
            .overlay.show {
              visibility: visible;
              opacity: 1;
            }

            .popup {
              margin: 70px auto;
              background: #fff;
              border-radius: 5px;
              width: 30%;
              position: relative;
              transition: all 5s ease-in-out;
                            padding: 20px;

            }
            .popup h2 {
              margin-top: 0;
              width:100%;
              background:#eee;
              position:absolute;
              top:0;
              right:0;
              left:0;
              height:40px;
            }
            .popup .close {
                position: absolute;
                top: 3px;
                right: 10px;
                transition: all 200ms;
                font-size: 30px;
                font-weight: bold;
                text-decoration: none;
                color: #333;
            }
            .popup .close:focus{
                outline:none;
            }

            .popup .close:hover {
                color: #06D85F;
            }
            #messageContent{
                margin-top:40px;
            }
            .warning{
                background:orange;
            }
            #authoringErrors {
              z-index: 20;
            }
            #authoringErrors .popup {
              width: 70%;
              max-height: 80vh;
              overflow:hidden;
            }
            #authoringErrors h2 {
              background: #c62828;
              color: white;
              padding-left: 12px;
              line-height: 40px;
              font-size: 1rem;
            }
            #authoringErrors table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.85rem;
            }
            #authoringErrors th {
              text-align: left;
              border-bottom: 2px solid #c62828;
              padding: 4px 8px;
            }
            #authoringErrors td {
              padding: 4px 8px;
              border-bottom: 1px solid #ddd;
              vertical-align: top;
            }
            #authoringErrors td:first-child {
              color: #555;
              font-family: monospace;
              white-space: nowrap;
            }
            #authoringErrors .ae-actions {
              text-align: center;
              margin-top: 12px;
            }
            #authoringErrors .ae-actions button {
              padding: 6px 20px;
              background: #c62828;
              color: white;
              border: none;
              border-radius: 3px;
              cursor: pointer;
            }
        `;

    const html = `
<!--           <slot name="errors"></slot> -->
           <jinn-toast id="message" gravity="bottom" position="left"></jinn-toast>
           <jinn-toast id="sticky" gravity="bottom" position="left" duration="-1" close="true" data-class="sticky-message"></jinn-toast>
           <jinn-toast id="error" text="error" duration="-1" data-class="error" close="true" position="right" gravity="top" escape-markup="false"></jinn-toast>
           <jinn-toast id="warn" text="warning" duration="5000" data-class="warning" position="left" gravity="top"></jinn-toast>
           <slot id="default"></slot>
           <slot name="messages"></slot>
           <div id="modalMessage" class="overlay">
                <div class="popup">
                   <h2></h2>
                    <a class="close" href="#"  onclick="event.target.parentNode.parentNode.classList.remove('show')" autofocus>&times;</a>
                    <div id="messageContent"></div>
                </div>
           </div>
           <div id="authoringErrors" class="overlay">
                <div class="popup">
                    <h2>Authoring Errors</h2>
                    <a class="close" href="#" onclick="event.preventDefault();event.target.closest('.overlay').classList.remove('show')">&times;</a>
                    <div id="authoringErrorsContent" style="margin-top:48px;"></div>
                    <div class="ae-actions"><button onclick="this.closest('.overlay').classList.remove('show')">Dismiss</button></div>
                </div>
           </div>
           <slot name="event"></slot>
        `;

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${html}
        `;

    this.toRefresh = [];
    this.initialRun = true;
    this._scanForNewTemplateExpressionsNextRefresh = false;
    this.repeatsFromAttributesCreated = false;
    /*
    this.validateOn = this.hasAttribute('validate-on')
      ? this.getAttribute('validate-on')
      : 'update';
*/
    // this.mergePartial = this.hasAttribute('merge-partial')? true:false;
    this.mergePartial = false;
    this.createNodes = this.hasAttribute('create-nodes') ? true : false;
    this._localNamesWithChanges = new Set();
    this.setAttribute('role', 'form'); // set aria role
    this._pendingRefresh = false;

    this.debugInfo = {
      id: this.id || null,
      debugId: crypto.randomUUID ? crypto.randomUUID() : `fore-${Date.now()}`,
      createdAt: performance.now(),
      readyAt: null,
      modelConstructStartedAt: null,
      modelConstructDoneAt: null,
      refreshCount: 0,
      lastRefreshAt: null,
      lastRefreshForce: null,
      lastRefresh: null,
    };
  }

  getDebugInfo() {
    return {
      ...this.debugInfo,
      id: this.id || null,
      ready: this.ready,
      lazyRefresh: this.lazyRefresh,
      createNodes: this.createNodes,

      initOn: this.getAttribute('init-on') || null,
      initOnTarget: this.getAttribute('init-on-target') || null,
      ignoreExpressions: this.getAttribute('ignore-expressions') || null,

      model: this.model?.getDebugInfo?.() || null,
    };
  }

  getDebugSnapshot(options = {}) {
    const model = this.model;

    const debugRefElements = Array.from(this.querySelectorAll('[ref]')).filter(
      element => typeof element.getDebugInfo === 'function',
    );

    const bindingElements = debugRefElements.filter(element => element.localName === 'fx-bind');

    const boundElementNames = new Set([
      'fx-control',
      'fx-output',
      'fx-upload',
      'fx-group',
      'fx-repeat',
      'fx-switch',
    ]);

    const boundUiElements = debugRefElements.filter(element =>
      boundElementNames.has(element.localName),
    );

    const bindings = bindingElements.map(element => element.getDebugInfo());

    const boundElements = boundUiElements.map(element => element.getDebugInfo());

    const submissions = Array.from(this.querySelectorAll('fx-submission'))
      .filter(element => typeof element.getDebugInfo === 'function')
      .map(element => element.getDebugInfo());

    return {
      fore: this.getDebugInfo?.() || null,

      model:
        model?.getDebugInfo?.({
          includeGraphs: options.includeGraphs === true,
        }) || null,

      instances: model?.instances?.map(instance => instance.getDebugInfo?.()) || [],
      modelItems: model?.modelItems?.map(item => item.getDebugInfo?.()) || [],

      bindings,
      boundElements,
      submissions,
    };
  }

  /**
   * Parse a list of target specs.
   *
   * We accept both comma- and whitespace-separated lists (for backward compatibility with `wait-for`).
   * Each token can be:
   * - "self" (default)
   * - "closest" (closest fx-fore)
   * - "document"
   * - "window"
   * - a CSS selector (no whitespace)
   */
  _parseTargetList(raw) {
    if (!raw) return [];
    return raw
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  _findBySelector(sel) {
    const roots = [this.getRootNode?.() ?? document, document];
    for (const r of roots) {
      if (r && 'querySelector' in r) {
        const el = r.querySelector(sel);
        if (el) return el;
      }
    }
    return null;
  }

  static _isReadyTarget(el) {
    return !!(
      el &&
      (el.ready === true ||
        (el.classList && el.classList.contains('fx-ready')) ||
        (typeof el.hasAttribute === 'function' && el.hasAttribute('ready')))
    );
  }

  /**
   * Resolves once `fore` has dispatched its initial `ready` event (or
   * immediately, if it's already ready).
   */
  static waitUntilReady(fore) {
    if (FxFore._isReadyTarget(fore)) {
      return Promise.resolve();
    }
    return FxFore._waitForEvent(fore, 'ready', FxFore._isReadyTarget);
  }

  /**
   * Collect all init gates derived from attributes.
   *
   * - `wait-for` (DEPRECATED) becomes: init-on="ready" + init-on-target=<list>
   * - `init-on` / `init-on-target` define a generic event gate
   */
  _collectInitGates() {
    const gates = [];

    const waitForRaw = this.getAttribute('wait-for');
    if (waitForRaw) {
      if (!this._warnedWaitForDeprecation) {
        console.warn(
          '[fx-fore] The "wait-for" attribute is deprecated. Use init-on="ready" init-on-target="..." instead.',
        );
        this._warnedWaitForDeprecation = true;
      }

      const deps = this._parseTargetList(waitForRaw);
      for (const dep of deps) {
        gates.push({ event: 'ready', targetSpec: dep });
      }
    }

    const initOn = this.getAttribute('init-on');
    const initOnTargetRaw = this.getAttribute('init-on-target');
    if (initOn || initOnTargetRaw) {
      const eventName = initOn || 'ready';
      const targets = initOnTargetRaw ? this._parseTargetList(initOnTargetRaw) : ['self'];
      for (const t of targets) {
        gates.push({ event: eventName, targetSpec: t });
      }
    }

    return gates;
  }

  static _waitForEvent(target, eventName, isSatisfiedFn = null) {
    // If a caller provides an explicit satisfaction check, honor it first.
    if (typeof isSatisfiedFn === 'function' && isSatisfiedFn(target)) {
      FxFore._markInitEventSeen(target, eventName);
      return Promise.resolve();
    }

    // Sticky gate: if this event already happened on this target, don't wait again.
    if (FxFore._hasSeenInitEvent(target, eventName)) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const ac = new AbortController();
      const on = () => {
        FxFore._markInitEventSeen(target, eventName);
        ac.abort();
        resolve();
      };
      target.addEventListener(eventName, on, { once: true, signal: ac.signal });
    });
  }

  _waitForMatchingEvent(eventName, matchesEventFn, recheckFn = null) {
    if (typeof recheckFn === 'function' && recheckFn()) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const root = document;

      const cleanupAll = () => {
        root.removeEventListener(eventName, onEvent, true);
        if (mo) mo.disconnect();
      };

      const onEvent = ev => {
        if (matchesEventFn(ev)) {
          cleanupAll();
          resolve();
        }
      };

      root.addEventListener(eventName, onEvent, true);

      // Only used for `ready` (or any other gate that provides a recheck function)
      let mo = null;
      if (typeof recheckFn === 'function') {
        mo = new MutationObserver(() => {
          if (recheckFn()) {
            cleanupAll();
            resolve();
          }
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
      }
    });
  }

  _waitForInitGate({ event, targetSpec }) {
    // Direct targets
    if (targetSpec === 'self') {
      const satisfied = event === 'ready' ? t => FxFore._isReadyTarget(t) : null;
      return FxFore._waitForEvent(this, event, satisfied);
    }
    if (targetSpec === 'document') {
      return FxFore._waitForEvent(document, event);
    }
    if (targetSpec === 'window') {
      return FxFore._waitForEvent(window, event);
    }

    // Special: closest fx-fore
    if (targetSpec === 'closest') {
      const recheckFn =
        event === 'ready' ? () => FxFore._isReadyTarget(this.closest('fx-fore')) : null;

      const matchesFn = ev => {
        const t = ev.target;
        return t?.tagName === 'FX-FORE' && t.contains(this);
      };

      return this._waitForMatchingEvent(event, matchesFn, recheckFn);
    }

    // Selector targets
    const selector = targetSpec;

    const recheckFn =
      event === 'ready' ? () => FxFore._isReadyTarget(this._findBySelector(selector)) : null;

    if (typeof recheckFn === 'function' && recheckFn()) {
      return Promise.resolve();
    }

    const matchesFn = ev => {
      // Prefer composedPath() so events coming from inside shadow DOM still match
      const path = typeof ev.composedPath === 'function' ? ev.composedPath() : [];
      for (const n of path) {
        if (n && n.matches && n.matches(selector)) return true;
      }
      const t = ev.target;
      return !!(t && t.closest && t.closest(selector));
    };

    return this._waitForMatchingEvent(event, matchesFn, recheckFn);
  }

  /**
   * Wait until all configured init gates are satisfied.
   * This is the single consolidation point for init gating.
   */
  _waitForInitGates() {
    if (this._initGatesPromise) return this._initGatesPromise;

    const gates = this._collectInitGates();
    if (!gates.length) {
      this._initGatesPromise = Promise.resolve();
      return this._initGatesPromise;
    }

    this._initGatesPromise = Promise.all(gates.map(g => this._waitForInitGate(g))).then(
      () => undefined,
    );
    return this._initGatesPromise;
  }

  _onSlotChange = async ev => {
    // 1) Capture the slot element BEFORE any await
    const slotEl = ev.currentTarget;
    if (!(slotEl instanceof HTMLSlotElement)) return;

    // avoid double init
    if (this.inited) return;

    // 2) Wait for init gates (init-on / init-on-target / wait-for)
    try {
      await this._waitForInitGates();
    } catch (e) {
      console.warn('init gating failed', e);
      return;
    }

    // 3) Bail if we got disconnected/replaced while waiting
    if (!this.isConnected) return;

    if (this.ignoreExpressions) {
      this.ignoredNodes = Array.from(this.querySelectorAll(this.ignoreExpressions));
    }

    // 4) Safely read assigned content
    const getAssignedElements = () => {
      if (typeof slotEl.assignedElements === 'function') {
        return slotEl.assignedElements({ flatten: true });
      }
      // Fallback for odd engines/polyfills
      return (slotEl.assignedNodes({ flatten: true }) || []).filter(
        n => n.nodeType === Node.ELEMENT_NODE,
      );
    };

    // SAFE: slotEl is the actual event source, not a fresh query
    const children = getAssignedElements();

    let modelElement = children.find(modelElem => modelElem.nodeName.toUpperCase() === 'FX-MODEL');
    if (!modelElement) {
      const generatedModel = document.createElement('fx-model');
      this.appendChild(generatedModel);
      modelElement = generatedModel;
      // We are going to get a new slotchange event immediately, because we changed a slot.
      // so cancel this one.
      return;
    }
    if (!modelElement.inited) {
      console.info(
        `%cFore running ... ${this.id ? '#' + this.id : ''}`,
        'background:#64b5f6; color:white; padding:.5rem; display:inline-block; white-space: nowrap; border-radius:0.3rem;width:100%;',
      );

      const variables = new Map();
      (function registerVariables(node) {
        for (const child of node.children) {
          if ('setInScopeVariables' in child) {
            child.setInScopeVariables(variables);
          }
          registerVariables(child);
        }
      })(this);

      // Ensure all function libraries are loaded/registered before model construction,
      // so binds/calculate/XPath evaluations can safely call them.
      const libs = Array.from(this.querySelectorAll('fx-functionlib'));
      await Promise.all(libs.map(l => l.readyPromise || Promise.resolve()));

      this.debugInfo.modelConstructStartedAt = performance.now();
      await modelElement.modelConstruct();
      this.debugInfo.modelConstructDoneAt = performance.now();

      console.log('varbindings ', this._instanceVarBindings);
      this._handleModelConstructDone();
    }

    this._createRepeatsFromAttributes();
    this.inited = true;
  };

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'src') {
      this.src = newValue;
      if (!newValue) {
        // Reset so a later src assignment can load again
        this._srcLoadPromise = null;
        return;
      }
      if (this.isConnected) {
        this._maybeLoadFromSrc();
      }
      return;
    }

    if (name === 'selector') {
      // Selector changes should affect a pending src-load
      if (this.isConnected && this.src && !this._srcLoadPromise) {
        this._maybeLoadFromSrc();
      }
    }
  }

  _maybeLoadFromSrc() {
    if (!this.src) return null;
    if (this._srcLoadPromise) return this._srcLoadPromise;

    this._srcLoadPromise = (async () => {
      await this._waitForInitGates();
      if (!this.isConnected) return;
      const selector = this.getAttribute('selector') || 'fx-fore';
      await Fore.loadForeFromSrc(this, this.src, selector);
    })();

    return this._srcLoadPromise;
  }

  connectedCallback() {
    const modelElement = Array.from(this.children).find(
      modelElem => modelElem.nodeName.toUpperCase() === 'FX-MODEL',
    );

    this.model = modelElement;

    this.style.visibility = 'hidden';
    // console.time('init');
    this.strict = !!this.hasAttribute('strict');
    /*
            document.re('ready', (e) =>{
              if(e.target !== this){
                // e.preventDefault();
                console.log('>>> e', e);
                console.log('event this', this);
                // console.log('event eventPhase', e.eventPhase);
                // console.log('event cancelable', e.cancelable);
                console.log('event target', e.target);
                console.log('event composed', e.composedPath());
                console.log('<<< event stopping');
                e.stopPropagation();
              }else{
                console.log('event proceed', this);
              }
              // e.stopImmediatePropagation();
            },true);
        */
    const userIgnore = this.getAttribute('ignore-expressions');
    this.ignoreExpressions = userIgnore ? `[pattern], ${userIgnore}` : '[pattern]';

    this.lazyRefresh = this.hasAttribute('refresh-on-view');
    if (this.lazyRefresh) {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3,
      };
      this.intersectionObserver = new IntersectionObserver(this.handleIntersect, options);
    }

    this.src = this.hasAttribute('src') ? this.getAttribute('src') : null;
    if (this.src) {
      this._maybeLoadFromSrc();
      return;
    }

    this._injectDevtools();

    // const slot = this.shadowRoot.querySelector('slot#default');

    const slot = this.shadowRoot?.querySelector('slot') || this.querySelector('slot');
    if (slot) slot.addEventListener('slotchange', this._onSlotChange);

    this.addEventListener('path-mutated', () => {
      this.someInstanceDataStructureChanged = true;
    });
    this.addEventListener('refresh', () => {
      this.refresh(true);
    });

    if (this.hasAttribute('show-confirmation')) {
      this.showConfirmation = true;
    }
  }

  /**
   * Ensure there is an fx-var for each fx-instance in this fx-fore's fx-model scope.
   *
   * - For instances with an @id, create `$id` with value `instance('id')`.
   * - For the first instance WITHOUT an @id, create `$default` with value `instance()`.
   * - IMPORTANT: if an instance has id="default", we STILL bind `$default` to `instance()`
   *   (avoids recursion / stack overflow during fx-var refresh in some cycles).
   *
   * Vars are inserted as direct children of `<fx-fore>` immediately before `<fx-model>`.
   * The method is idempotent.
   */
  _ensureInstanceVars() {
    if (this.__instanceVarsEnsured) return;
    this.__instanceVarsEnsured = true;

    // Resolve this fx-fore's own fx-model (not nested ones)
    const model = this.querySelector(':scope > fx-model');
    if (!model) return;

    // Collect instances that are direct children of this model (doc order)
    const instances = Array.from(model.querySelectorAll(':scope > fx-instance'));

    // Collect existing fx-var names at fx-fore scope (author-defined and previously generated)
    const existingVars = new Set(
      Array.from(this.querySelectorAll(':scope > fx-var'))
        .map(v => (v.getAttribute('name') || '').trim())
        .filter(Boolean),
    );

    let defaultAssigned = false;

    for (const inst of instances) {
      const rawId = (inst.getAttribute('id') || '').trim();

      // First id-less instance => $default = instance()
      if (!rawId) {
        if (defaultAssigned) continue;
        defaultAssigned = true;

        const name = 'default';
        if (existingVars.has(name)) continue;

        const fxVar = document.createElement('fx-var');
        fxVar.setAttribute('name', name);
        fxVar.setAttribute('value', 'instance()');
        fxVar.setAttribute('data-generated', 'instance-var');

        this.insertBefore(fxVar, model);
        existingVars.add(name);
        continue;
      }

      // Normal id-based instance var
      const name = rawId;
      if (existingVars.has(name)) continue;

      const fxVar = document.createElement('fx-var');
      fxVar.setAttribute('name', name);

      // IMPORTANT: avoid `instance('default')` recursion in fx-var refresh
      if (name === 'default') {
        fxVar.setAttribute('value', 'instance()');
      } else {
        fxVar.setAttribute('value', `instance('${name}')`);
      }

      fxVar.setAttribute('data-generated', 'instance-var');

      this.insertBefore(fxVar, model);
      existingVars.add(name);
    }
  }

  _injectDevtools() {
    if (this.ownerDocument.querySelector('fx-lens')) {
      // There's already a lens, so we can ignore this one.
      // One lens can focus multiple fore elements
      return;
    }
    const { search } = window.location;
    const urlParams = new URLSearchParams(search);
    if (urlParams.has('lens')) {
      const lens = document.createElement('fx-lens');
      document.body.appendChild(lens);
      lens.setAttribute('open', 'open');
    }
  }

  /**
   * Signal something happened with an element with the given local name. This will be used in the
   * next (non-forceful) refresh to detect whether a component (usually a repeat) should update
   *
   * @param {string} localNameOfElement
   */
  signalChangeToElement(localNameOfElement) {
    this._localNamesWithChanges.add(localNameOfElement);
  }

  /**
   * Raise a flag that there might be new template expressions under some node. This happens with
   * repeats updating (new repeat items can have new template expressions) or switches changing their case (new case = new raw HTML)
   */
  scanForNewTemplateExpressionsNextRefresh() {
    // TODO: also ask for the root of any new HTML: this can prevent some very deep queries.
    this._scanForNewTemplateExpressionsNextRefresh = true;
  }

  markAsClean() {
    console.log('marking as clean', this);
    this.addEventListener(
      'value-changed',
      () => {
        console.log('MARK as modified', this);
        this.dirtyState = dirtyStates.DIRTY;
        this.classList.toggle('fx-modified');
      },
      { once: true },
    );
    this.dirtyState = dirtyStates.CLEAN;
    this.classList.remove('fx-modified');
    this.querySelectorAll('.visited').forEach(el => el.classList.remove('visited'));
  }

  /**
   * loads a Fore from an URL given by `src`.
   *
   * Will extract the `fx-fore` element from that target file and use and replace current `fx-fore` element with the loaded one.
   * @private
   */
  async _loadFromSrc() {
    return this._maybeLoadFromSrc();
  }

  /**
   * refreshes the UI by using IntersectionObserver API. This is the handler being called
   * by the observer whenever elements come into / move out of viewport.
   * @param entries
   * @param observer
   */
  handleIntersect(entries, observer) {
    // console.time('refreshLazy');

    entries.forEach(entry => {
      const { target } = entry;

      const fore = Fore.getFore(target);
      // Skip if this is the initial run of the fore element
      // This check prevents issues with nested fx-fore elements loaded via fx-control
      if (fore.initialRun) return;

      if (entry.isIntersecting) {
        // console.log('in view', entry);
        // console.log('repeat in view entry', entry.target);
        // const target = entry.target;
        // if(target.hasAttribute('refresh-on-view')){
        target.classList.add('loaded');
        // }

        // todo: too restrictive here? what if target is a usual html element? shouldn't it refresh downwards?
        if (typeof target.refresh === 'function') {
          // console.log('refreshing target', target);
          target.refresh(target, true);
        } else {
          // console.log('refreshing children', target);
          Fore.refreshChildren(target, true);
        }
      }
    });
    entries[0].target.getOwnerForm().dispatchEvent(new CustomEvent('refresh-done'));

    // console.timeEnd('refreshLazy');
  }

  evaluateToNodes(xpath, context) {
    return evaluateXPathToNodes(xpath, context, this);
  }

  disconnectedCallback() {
    this.removeEventListener('dragstart', this.dragstart);
    /*
            this.removeEventListener('model-construct-done', this._handleModelConstructDone);
            this.removeEventListener('message', this._displayMessage);
            this.removeEventListener('error', this._displayError);
            this.storedTemplateExpressionByNode=null;
            this.shadowRoot = undefined;
        */
  }

  /**
   * @param {(boolean|{reason:'index-function'})} [force]fx-fore
   */
  /**
   * @param {(boolean|{reason:'index-function'})} [force]
   */
  /**
   * @param {(boolean|{reason:'index-function'})} [force]
   */
  async refresh(force) {
    // If we're already refreshing, do NOT drop the request.
    // Queue a hard refresh and return a promise that resolves when the next refresh finishes.

    this.debugInfo.refreshCount += 1;
    this.debugInfo.lastRefreshAt = performance.now();
    this.debugInfo.lastRefreshForce = !!force;

    if (this.isRefreshing) {
      // keep "strongest" request: any true means hard refresh
      this._pendingRefresh = this._pendingRefresh || force === true;

      return new Promise(resolve => {
        this.addEventListener('refresh-done', () => resolve(), { once: true });
      });
    }

    this.isRefreshing = true;
    this.isRefreshPhase = true;

    const refreshStart = performance.now();
    const isFullRefresh = force === true || this.initialRun;
    const batchedCount = this.batchedNotifications.size;

    try {
      if (isFullRefresh) {
        performance.mark('force-refresh-start');
        console.log('🔄 🔴🔴🔴 ### full refresh() on ', this);
        await Fore.refreshChildren(this, force);
        performance.mark('force-refresh-end');
        performance.measure('force-refresh', 'force-refresh-start', 'force-refresh-end');
      } else {
        await this._processBatchedNotifications();
      }

      if (force === true || this.initialRun || this._scanForNewTemplateExpressionsNextRefresh) {
        this._updateTemplateExpressions();
        this._scanForNewTemplateExpressionsNextRefresh = false;
      }

      this._processTemplateExpressions();

      this.isRefreshPhase = false;
      this.initialRun = false;
      this.style.visibility = 'visible';

      console.info(
        `%c ✅ refresh-done on #${this.id}`,
        'background:darkorange; color:black; padding:.5rem; display:inline-block; white-space: nowrap; border-radius:0.3rem;width:100%;',
        this.getModel().modelItems,
      );

      // Record timing before dispatching 'refresh-done' since listeners (eg. fx-debugger)
      // may synchronously read this.debugInfo.lastRefresh in response to the event.
      this.debugInfo.lastRefresh = {
        timestamp: performance.now(),
        kind: isFullRefresh ? 'full' : 'partial',
        durationMs: performance.now() - refreshStart,
        batchedCount,
      };

      Fore.dispatch(this, 'refresh-done', {});

      const subFores = Array.from(this.querySelectorAll('fx-fore'));
      for (const subFore of subFores) {
        if (subFore.ready) {
          await subFore.refresh(true);
        }
      }
    } finally {
      this.isRefreshing = false;

      // If anything requested a refresh while we were refreshing, run exactly one more.
      // This prevents "dropped" refresh requests (your timeout).
      if (this._pendingRefresh) {
        const pendingHard = this._pendingRefresh === true;
        this._pendingRefresh = false;
        // Important: do NOT await in finally without clearing flags first.
        await this.refresh(pendingHard);
      }
    }
  }
  /**
   * Add a ModelItem to the batch of notifications to be processed at the end of the refresh phase
   * @param {ModelItem | import('./ui/UIElement.js').UIElement} item - The ModelItem or UI Element to add to the batch
   */
  addToBatchedNotifications(item) {
    if (!this.batchedNotifications.has(item)) {
      // console.log('adding to batched notifications', item);
      this.batchedNotifications.add(item);
    }
  }

  /**
   * Process all batched notifications at the end of the refresh phase.
   * Async so that all control refresh() calls (which are themselves async) are awaited
   * before refresh-done fires — prevents _isRefreshing from being true when the
   * next user input event arrives.
   */
  async _processBatchedNotifications() {
    if (this.batchedNotifications.size > 0) {
      console.log(`🔄 🎯  ### processing ${this.batchedNotifications.size} batched notifications`);
      console.log('🔄 🎯  ### processing ', Array.from(this.batchedNotifications));

      const refreshPromises = [];

      // Process all batched notifications.
      // Note: Set.forEach visits items added during iteration (they are appended to the end),
      // so controls added via observer.update() (which calls addToBatchedNotifications) are
      // also visited and their refresh() promises collected.
      this.batchedNotifications.forEach(entry => {
        if (entry.classList && entry.classList.contains('fx-repeatitem')) {
          refreshPromises.push(Fore.refreshChildren(entry, true));
        }
        if (entry && typeof entry.refresh === 'function') {
          const uiElement = /** @type {import('./ui/UIElement.js').UIElement} */ (entry);
          if (!uiElement.ownerDocument.contains(uiElement)) {
            return;
          }
          refreshPromises.push(uiElement.refresh(true));
        }
        const nonrelevant = Array.from(this.querySelectorAll('[nonrelevant]'));
        if (nonrelevant) {
          nonrelevant.forEach(el => {
            if (el.refresh) {
              refreshPromises.push(el.refresh());
            }
          });
        }
        if (entry.observers) {
          entry.observers.forEach(observer => {
            if (typeof observer.update === 'function') {
              observer.update(entry);
            }
          });
        }
      });

      this._processTemplateExpressions();
      this.batchedNotifications.clear();

      if (refreshPromises.length > 0) {
        await Promise.all(refreshPromises);
      }

      // Items added to batchedNotifications during the async Promise.all phase
      // (e.g. by a second event listener that fired after the batch was cleared)
      // are picked up here so they aren't lost.
      if (this.batchedNotifications.size > 0) {
        await this._processBatchedNotifications();
      }
    }
  }

  /**
   * entry point for processing of template expression enclosed in '{}' brackets.
   *
   * Expressions are found with an XPath search. For each node an entry is added to the storedTemplateExpressionByNode map.
   *
   *
   * @private
   */
  _updateTemplateExpressions() {
    const search =
      "(descendant-or-self::*!(text(), @*))[contains(., '{')][substring-after(., '{') => contains('}')][not(ancestor-or-self::*[self::fx-model or self::fx-function])]";

    const tmplExpressions = evaluateXPathToNodes(search, this, this);
    // console.log('template expressions found ', tmplExpressions);

    if (!this.storedTemplateExpressions) {
      this.storedTemplateExpressions = [];
    }

    // console.log('######### storedTemplateExpressions', this.storedTemplateExpressions.length);

    if (!tmplExpressions) return;
    /*
    storing expressions and their nodes for re-evaluation
    */
    Array.from(tmplExpressions).forEach(node => {
      const ele = node.nodeType === Node.ATTRIBUTE_NODE ? node.ownerElement : node.parentNode;
      if (ele.closest('fx-fore') !== this) {
        // We found something in a sub-fore. Act like it's not there
        return;
      }
      if (this.storedTemplateExpressionByNode.has(node)) {
        // If the node is already known, do not process it twice
        return;
      }
      const expr = this._getTemplateExpression(node);

      // console.log('storedTemplateExpressionByNode', this.storedTemplateExpressionByNode);
      if (expr) {
        this.storedTemplateExpressionByNode.set(node, expr);
      }
    });
    // console.log('stored template expressions ', this.storedTemplateExpressionByNode);

    // TODO: Should we clean up nodes that existed but are now gone?
    this._processTemplateExpressions();
  }

  _processTemplateExpressions() {
    // console.log('processing template expressions ', this.storedTemplateExpressionByNode);
    for (const node of Array.from(this.storedTemplateExpressionByNode.keys())) {
      if (node.nodeType === Node.ATTRIBUTE_NODE) {
        // Attribute nodes are not contained by the document, but their owner elements are!
        if (!XPathUtil.contains(this, node.ownerElement)) {
          this.storedTemplateExpressionByNode.delete(node);
          continue;
        }
      } else if (!XPathUtil.contains(this, node)) {
        // For all other nodes, if this `fore` element does not contain them, they are dead
        this.storedTemplateExpressionByNode.delete(node);
        continue;
      }
      this._processTemplateExpression({
        node,
        expr: this.storedTemplateExpressionByNode.get(node),
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  _processTemplateExpression(exprObj) {
    // console.log('processing template expression ', exprObj);

    const { expr } = exprObj;
    const { node } = exprObj;
    // console.log('expr ', expr);
    this.evaluateTemplateExpression(expr, node);
  }

  /**
   * evaluate a template expression on a node either text- or attribute node.
   * @param {string} expr The string to parse for expressions
   * @param {Node} node the node which will get updated with evaluation result
   */
  evaluateTemplateExpression(expr, node) {
    // ### do not evaluate template expressions within nonrelevant sections
    if (node.nodeType === Node.ATTRIBUTE_NODE && node.ownerElement.closest('[nonrelevant]')) return;
    if (node.nodeType === Node.TEXT_NODE && node.parentNode.closest('[nonrelevant]')) return;
    if (node.nodeType === Node.ELEMENT_NODE && node.closest('[nonrelevant]')) return;

    // ---- IMPORTANT GUARD ----
    // Prevent JSON object/array literals in fx-insert@origin from being treated as
    // template expressions (they contain {...} but are not XPath templates).
    if (node.nodeType === Node.ATTRIBUTE_NODE) {
      const el = node.ownerElement;
      if (el && el.localName === 'fx-insert' && node.name === 'origin') {
        const v = String(node.value ?? '').trim();
        const isJsonLiteral =
          (v.startsWith('{') && v.endsWith('}')) || (v.startsWith('[') && v.endsWith(']'));
        if (isJsonLiteral) return;
      }
    }
    // -------------------------

    // The element that "defines" the template expression is the correct basis for:
    // - namespace resolution (xmlns lookup)
    // - fx-var scoping (in-scope variables)
    // - context() in repeats (repeat item detection)
    const definitionElement =
      node.nodeType === Node.ATTRIBUTE_NODE
        ? node.ownerElement
        : node.nodeType === Node.TEXT_NODE
          ? node.parentElement || node.parentNode
          : node;

    const formElement =
      definitionElement && definitionElement.nodeType === Node.ELEMENT_NODE
        ? definitionElement
        : this;

    const replaced = String(expr ?? '').replace(/{[^}]*}/g, match => {
      if (match === '{}') return match;

      const naked = match.substring(1, match.length - 1);
      const inscope = getInScopeContext(node, naked);

      if (!inscope) {
        return match;
      }

      try {
        // IMPORTANT:
        // Do NOT pass `null` as the 4th argument here.
        // Passing `null` suppresses variable collection, which hides implicit vars
        // like `$default`.
        return evaluateXPathToString(naked, inscope, formElement);
      } catch (error) {
        console.warn('ignoring unparseable expr', error);
        return match;
      }
    });

    // Update to the new value only if it changed (avoid iframe/image reload etc.)
    if (node.nodeType === Node.ATTRIBUTE_NODE) {
      const parent = node.ownerElement;
      if (parent.getAttribute(node.nodeName) !== replaced) {
        parent.setAttribute(node.nodeName, replaced);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent !== replaced) {
        node.textContent = replaced;
      }
    }
  } // eslint-disable-next-line class-methods-use-this
  _getTemplateExpression(node) {
    if (this.ignoredNodes) {
      const checkNode = node.nodeType === Node.ATTRIBUTE_NODE ? node.ownerElement : node;
      const found = this.ignoredNodes.find(n => n.contains(checkNode));
      if (found) return null;
    }
    if (node.nodeType === Node.ATTRIBUTE_NODE) {
      return node.value;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent.trim();
    }
    return null;
  }

  /**
   * called when `model-construct-done` event is received to
   * start initing the UI.
   *
   * @private
   */
  _handleModelConstructDone() {
    this.debugInfo.modelConstructDoneAt = performance.now();
    if (this.showConfirmation) {
      window.addEventListener('beforeunload', event => {
        if (this.dirtyState === dirtyStates.DIRTY) {
          event.preventDefault();
          return true;
        }
        return false;
      });
    }
    this._initUI();
  }

  /**
   * If there's no instance element found in a fx-model during init it will construct
   * an instance from UI bindings.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _lazyCreateInstance() {
    const model = this.querySelector('fx-model');

    // ##### lazy creation should NOT take place if there's a parent Fore using shared instances
    const parentFore =
      this.parentNode.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
        ? this.parentNode.closest('fx-fore')
        : null;
    if (this.parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      console.log('fragment', this.parentNode);
    }

    if (parentFore) {
      const shared = parentFore
        .getModel()
        .instances.filter(shared => shared.hasAttribute('shared'));
      if (shared.length !== 0) return;
    }

    // still need to catch just in case...
    try {
      if (model.instances.length === 0) {
        // console.log('### lazy creation of instance');
        const generatedInstance = document.createElement('fx-instance');
        model.appendChild(generatedInstance);

        const generated = document.implementation.createDocument(null, 'data', null);
        // const newData = this._generateInstance(this, generated.firstElementChild);
        this._generateInstance(this, generated.firstElementChild);
        generatedInstance.instanceData = generated;
        model.instances.push(generatedInstance);
        // console.log('generatedInstance ', this.getModel().getDefaultInstanceData());
        Fore.dispatch(this, 'instance-loaded', { instance: this });
      }
    } catch (e) {
      console.warn(
        'lazyCreateInstance created an error attempting to create a document',
        e.message,
      );
    }
  }

  /**
   * @param {Element} start
   * @param {Element} parent
   */
  _generateInstance(start, parent) {
    if (start.hasAttribute('ref') && !Fore.isActionElement(start.nodeName)) {
      const ref = start.getAttribute('ref');

      if (ref.includes('/')) {
        // console.log('complex path to create ', ref);
        const steps = ref.split('/');
        steps.forEach(step => {
          // const generated = document.createElement(ref);
          parent = this._generateNode(parent, step, start);
        });
      } else {
        parent = this._generateNode(parent, ref, start);
      }
    }

    if (start.hasChildNodes()) {
      const list = start.children;
      for (let i = 0; i < list.length; i += 1) {
        this._generateInstance(list[i], parent);
      }
    }
    return parent;
  }

  // eslint-disable-next-line class-methods-use-this
  _generateNode(parent, step, start) {
    const generated = parent.ownerDocument.createElement(step);
    if (start.children.length === 0) {
      generated.textContent = start.textContent;
    }
    parent.appendChild(generated);
    parent = generated;
    return parent;
  }

  /**
   * Start the initialization of the UI by
   *
   * 1. checking if a instance needs to be generated
   * 2. attaching lazy loading intersection observers if `refresh-on-view` attributes are found
   * 3. doing a full refresh of the UI
   *
   * @returns {Promise<void>}
   * @private
   */
  async _initUI() {
    console.info(
      `%cinitUI #${this.id}`,
      'background:lightblue; color:black; padding:.5rem; display:inline-block; white-space: nowrap; border-radius:0.3rem;width:100%;',
    );

    const parentFore = this.closest('fx-fore');
    if (parentFore) {
      this.initialRun = false;
    } else {
      if (!this.initialRun) return;
    }
    this.classList.add('initialRun');
    await this._lazyCreateInstance();

    /*
          const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.3,
          };
      */

    // First refresh should be forced
    if (this.createNodes) {
      performance.mark('initData-start');
      this.initData();
      performance.mark('initData-end');

      performance.measure('initData', 'initData-start', 'initData-end');

      const binds = this.getModel().querySelector('fx-bind');
      if (binds) {
        this.getModel().updateModel();
      }
    }
    // await this.forceRefresh();
    await this.refresh(true);
    // await Fore.initUI(this);

    // this.style.display='block'
    this.classList.add('fx-ready');
    document.body.classList.add('fx-ready');

    this.ready = true;
    this.initialRun = false;
    // console.log('### >>>>> dispatching ready >>>>>', this);
    console.info(
      `%c ✅ ${this.id ? '#' + this.id : 'Fore'} is ready`,
      'background:lightgreen; color:black; padding:.5rem; display:inline-block; white-space: nowrap; border-radius:0.3rem;width:100%;',
    );

    // console.log(`### <<<<< ${this.id} ready >>>>>`);

    Fore.dispatch(this, 'ready', {});
    this.debugInfo.readyAt = performance.now();
    // console.log('dataChanged', FxModel.dataChanged);
    this.markAsClean();

    this.addEventListener('dragstart', this._handleDragStart);
    //	this.addEventListener('dragend', this._handleDragEnd);
    this.handleDrop = event => this._handleDrop(event);
    this.ownerDocument.body.addEventListener('drop', this.handleDrop);
    this.ownerDocument.body.addEventListener('dragover', e => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
    });

    // Run authoring checks after ready — they're diagnostic only and must not delay
    // the ready event or drag-listener registration (both of which tests depend on).
    try {
      await this._runAuthoringChecks();
    } catch (e) {
      console.warn('[fore] authoring check failed:', e.message);
    }
  }

  async _runAuthoringChecks() {
    if (this.hasAttribute('no-check')) return;
    if (new URLSearchParams(window.location.search).has('no-check')) return;

    const { checkAuthoring } = await import('./authoring-check.js');
    const errors = checkAuthoring(this);
    if (errors.length) {
      this._showAuthoringErrors(errors);
    }
  }

  _showAuthoringErrors(errors) {
    const overlay = this.shadowRoot.getElementById('authoringErrors');
    const content = this.shadowRoot.getElementById('authoringErrorsContent');
    if (!overlay || !content) return;

    const rows = errors
      .map(({ element, message }) => {
        const path = element
          ? element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '')
          : '?';
        const safeMsg = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safePath = path.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<tr><td>${safePath}</td><td>${safeMsg}</td></tr>`;
      })
      .join('');

    content.innerHTML = `
      <table>
        <thead><tr><th>Element</th><th>Problem</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;

    overlay.classList.add('show');
  }

  /**
   * @summary
   * Find the reference node (the future previous sibling) for a newly created element.
   *
   * @description This works in two passes: if there is a bind available for both the parent and the
   * child, it determines where to insert based on those binds: after an element matching the previous bind in document order, before the next sibling of that one cause `insertBefore` is easier .
   *
   * For example, take this structure:
   * ```html
   * <fx-bind ref="root">
   *   <fx-bind ref="a" />
   *   <fx-bind ref="b" />
   *   <fx-bind ref="c" />
   * </fx-bind>
   * ```
   * Inserting a `<b/>`, it will be inserted before a `<c/>`, or at the end. Whatever comes after the `<a/>`.
   *
   * If there are no binds, the previous bound element will be used to determine the location.
   * @private
   *
   * @param {Element} newElement - The newly created element
   * @param {ParentNode} parentElement - The parent under which the element will be inserted
   * @param {import('./ForeElementMixin.js').default} previousControl - The previous control. Will
   * be used to determine a fallback to snert the element under if there are no binds for the parent
   *
   * @returns {ChildNode}
   */
  _findReferenceNodeForNewElement(newElement, parentElement, previousControl) {
    const bindForElement = this.model.getModelItem(parentElement)?.bind;
    if (!bindForElement) {
      // Parent is unbound. No clue what to do with this. Insert based on previous control
      let referenceNode = previousControl?.getModelItem()?.node;
      // We know which node to insert this new element to, but it might be a descendant of a child
      // of the actual parent. Walk up until we have a reference under our parent
      while (referenceNode?.parentNode && referenceNode?.parentNode !== parentElement) {
        referenceNode = referenceNode.parentNode;
      }
      if (referenceNode?.nodeType === Node.ATTRIBUTE_NODE) {
        // Insert the new node at the start: the previous control was an attribute
        return null;
      }
      return referenceNode;
    }

    // Temporarily insert the new element under the parent to see which XPath will match
    try {
      parentElement.appendChild(newElement);

      const bindForElement = this.model.getBindForElement(newElement);
      if (bindForElement) {
        // There is a bind for this element! Insert the new element after the last element that
        // matched in the preceding fx-bind

        /*
         * Assumes a bind structure like this:
         *
         * ```xml
         *  <fx-bind ref="root">
         *   <fx-bind ref="a" />
         *   <fx-bind ref="b" />
         *  </fx-bind>
         * ```
         *
         * It will then attempt to keep all `b` elements after all `a` elements.
         */

        /**
         * @type {FxBind}
         */
        const previousBind = bindForElement.previousElementSibling;
        if (previousBind) {
          /**
           * @type ChildNode[]}
           */
          const nodeset = previousBind.nodeset;
          const lastMatchingSibling = nodeset.reverse().find(node => parentElement.contains(node));
          if (lastMatchingSibling) {
            return lastMatchingSibling;
          }
          // Otherwise, just default to appending... If this runs multiple times for multiple nodes
          // it's unexpected to always prepend and get the order of children reversed from the UI.

          // Do not fall back on the UI here, just keep it predictable if binds are in play
          return parentElement.lastElementChild;
        }
      }
    } finally {
      newElement.remove();
    }
    // No clue.  Insert based on previous control.  We know which node to insert this new element
    // into, but it might be a descendant of a child of the actual parent. Walk up until we have a
    // reference under our parent
    let referenceNode = previousControl?.getModelItem()?.node;
    while (referenceNode?.parentNode && referenceNode?.parentNode !== parentElement) {
      referenceNode = referenceNode.parentNode;
    }
    if (referenceNode?.nodeType === Node.ATTRIBUTE_NODE) {
      // Insert the new node at the start: the previous control was an attribute
      return null;
    }
    // Insert after the previous control
    return referenceNode;
  }
  /**
   * @param  {HTMLElement}  root The root of the data initialization. fx-repeat overrides this when it makes new repeat items
   */
  initData(root = this) {
    /**
     * @param {*} value
     * @returns {boolean}
     */
    const isObjectLike = value =>
      value !== null && (typeof value === 'object' || typeof value === 'function');

    /**
     * @param {*} nodeset
     * @returns {boolean}
     */
    const hasResolvedNodeset = nodeset => {
      if (nodeset == null) return false;

      // Atomic values like strings/numbers/booleans are valid resolved XPath results
      if (!isObjectLike(nodeset)) return true;

      if (Array.isArray(nodeset)) return nodeset.length > 0;

      if (typeof nodeset.length === 'number' && !('nodeType' in nodeset)) {
        return nodeset.length > 0;
      }

      if (typeof nodeset[Symbol.iterator] === 'function' && !('nodeType' in nodeset)) {
        for (const item of nodeset) {
          return item !== undefined;
        }
        return false;
      }

      return !!nodeset.nodeType;
    };

    /**
     * Only try create-nodes for path-like refs, not general expressions like sequences.
     * @param {string} ref
     * @returns {boolean}
     */
    const isCreateNodesCandidate = ref => {
      const expr = String(ref || '').trim();
      if (!expr || expr === '.') return false;
      if (expr.startsWith('"') || expr.startsWith("'")) return false;

      // Ignore only simple literal sequences like ('a', 'b', 'c') or (1, 2, 3).
      // Keep fx-repeat refs that are real path expressions or more complex XPath.
      const simpleSequencePattern =
        /^\(\s*(?:(?:'[^']*'|"[^"]*"|\d+(?:\.\d+)?|\.)(?:\s*,\s*(?:'[^']*'|"[^"]*"|\d+(?:\.\d+)?|\.))*)?\s*\)$/;
      if (simpleSequencePattern.test(expr)) return false;

      return true;
    };

    /**
     * Detect whether a ref ends in an attribute step.
     * @param {string} ref
     * @returns {boolean}
     */
    const isAttributeRef = ref => /(^|\/)\s*@/.test(String(ref || '').trim());

    /**
     * Normalize a possibly sequence-like nodeset/context to a single DOM node.
     * @param {*} candidate
     * @returns {*}
     */
    const firstNode = candidate => {
      if (!candidate) return null;
      if (!isObjectLike(candidate)) return null;
      if (candidate.nodeType) return candidate;

      if (Array.isArray(candidate)) {
        return candidate.find(item => item && isObjectLike(item) && item.nodeType) || null;
      }

      if (typeof candidate.length === 'number' && typeof candidate.item === 'function') {
        for (let i = 0; i < candidate.length; i += 1) {
          const item = candidate.item(i);
          if (item && isObjectLike(item) && item.nodeType) return item;
        }
      }

      return null;
    };

    /**
     * Detect XPath results that are sequences of atomic values rather than DOM nodes.
     * These are valid resolved results for repeats, but they must never trigger create-nodes.
     * @param {*} candidate
     * @returns {boolean}
     */
    const isAtomicSequence = candidate => {
      if (!candidate) return false;

      // A single primitive value is also atomic from our perspective
      if (!isObjectLike(candidate)) return true;

      if (candidate.nodeType) return false;

      if (Array.isArray(candidate)) {
        return (
          candidate.length > 0 &&
          !candidate.some(item => item && isObjectLike(item) && item.nodeType)
        );
      }

      if (typeof candidate.length === 'number' && typeof candidate.item === 'function') {
        return false;
      }

      if (typeof candidate[Symbol.iterator] === 'function') {
        for (const item of candidate) {
          return !(item && isObjectLike(item) && item.nodeType);
        }
      }

      return false;
    };

    /**
     * Check whether a bound element is resolved after evalInContext.
     * Attribute refs often expose an empty string as nodeset, so use the model item node in that case.
     * @param {import('./ForeElementMixin.js').default} bound
     * @returns {boolean}
     */
    const isResolvedBound = bound => {
      if (hasResolvedNodeset(bound.nodeset)) return true;
      if (bound.nodeName === 'FX-REPEAT' && isAtomicSequence(bound.nodeset)) return true;
      if (isAttributeRef(bound.ref)) {
        const modelItem = typeof bound.getModelItem === 'function' ? bound.getModelItem() : null;
        return !!modelItem?.node;
      }
      return false;
    };

    /**
     * Determine the best context node for lazy node creation.
     * Prefer the bound element's in-scope context, but fall back to a structural parent.
     * @param {import('./ForeElementMixin.js').default} bound
     * @param {*} fallback
     * @returns {*}
     */
    const getCreationContext = (bound, fallback) => {
      const direct =
        typeof bound.getInScopeContext === 'function' ? firstNode(bound.getInScopeContext()) : null;
      if (direct) return direct;

      const dotCtx = firstNode(getInScopeContext(bound, '.'));
      if (dotCtx) return dotCtx;

      const refCtx = firstNode(getInScopeContext(bound, bound.ref));
      if (refCtx) return refCtx;

      return firstNode(fallback);
    };

    /**
     * @type {import('./ForeElementMixin.js').default[]}
     */
    const boundControls = Array.from(
      root.querySelectorAll(
        'fx-control[ref],fx-upload[ref],fx-group[ref],fx-repeat[ref], fx-switch[ref]',
      ),
    ).filter(boundEl => {
      if (boundEl.nodeName !== 'FX-REPEAT') return true;

      const repeatRef = String(boundEl.getAttribute('ref') || '').trim();

      // Any repeat whose ref is a pure parenthesized expression is not a create-nodes candidate.
      // Example: ('a', 'b', 'c')
      if (repeatRef.startsWith('(')) return false;

      return isCreateNodesCandidate(repeatRef);
    });

    if (root.matches && root.matches('fx-repeatitem') && firstNode(root.nodeset)) {
      boundControls.unshift(root);
    }

    console.log('_initData', boundControls);

    for (let i = 0; i < boundControls.length; i++) {
      const bound = boundControls[i];

      /*
      ignore bound elements that are enclosed with a control like <select> or <fx-items> and repeated items
       */
      if (!bound.matches('fx-repeatitem') && !bound.parentNode.closest('fx-control')) {
        // Repeat items are dumb. They do not respond to evalInContext
        bound.evalInContext();
      }

      if (bound.nodeName === 'FX-REPEAT' && isAtomicSequence(bound.nodeset)) {
        continue;
      }
      if (isResolvedBound(bound)) {
        continue;
      }
      if (!isCreateNodesCandidate(bound.ref)) {
        continue;
      }

      // Ignore bound elements in a different form. They will be taken care of in the other form.
      if (bound.closest('fx-fore') !== this) {
        continue;
      }

      // We need to create that node!
      const previousControl = boundControls[i - 1];

      // Previous control can either be an ancestor of us, or a previous node, which can be a sibling, or a child of a sibling.
      // First: parent
      if (previousControl && previousControl.contains(bound)) {
        /**
         * @type {ParentNode}
         */
        const parentNodeset =
          firstNode(previousControl.nodeset) || firstNode(root.getModel().getDefaultContext());
        const creationContext = getCreationContext(bound, parentNodeset);
        const ref = bound.ref;

        const newNode = this._createNodes(ref, creationContext || parentNodeset);
        if (!newNode || !parentNodeset) {
          continue;
        }
        if (newNode.nodeType === Node.ATTRIBUTE_NODE) {
          parentNodeset.setAttributeNode(newNode);
        } else {
          const referenceNode = this._findReferenceNodeForNewElement(newNode, parentNodeset, null);
          if (referenceNode) {
            referenceNode.after(newNode);
          } else {
            parentNodeset.prepend(newNode);
          }
        }
        bound.evalInContext();
        if (bound.nodeName !== 'FX-REPEAT') {
          // Do not try to get a bind for a nodeSET of a repeat. there are multiple.
          bound.getModelItem()?.bind?.evalInContext();
        }
        continue;
      }

      // Is previousControl a sibling or a descendant of a logical sibling? Keep looking backwards until we share parents!
      const ourParent = XPathUtil.getParentBindingElement(bound);
      let siblingControl = null;

      for (let j = i - 1; j > 0; --j) {
        const siblingOrDescendant = boundControls[j];
        if (siblingOrDescendant.nodeset && !('nodeType' in siblingOrDescendant.nodeset)) {
          continue;
        }
        if (XPathUtil.getParentBindingElement(siblingOrDescendant) === ourParent) {
          siblingControl = siblingOrDescendant;
          break;
        }
      }

      let parentNodeset;
      if (!ourParent || !ourParent.nodeset) {
        /*
          if we lost context somehow just always assume default context and append to that
          instead of bailing out.
           */
        parentNodeset = root.getModel().getDefaultContext();
      } else {
        parentNodeset = firstNode(ourParent.nodeset) || root.getModel().getDefaultContext();
      }
      const ref = bound.ref;
      const creationContext = getCreationContext(bound, parentNodeset);

      const newNode = this._createNodes(ref, creationContext || parentNodeset);
      if (!newNode) {
        continue;
      }

      if (newNode.nodeType === Node.ATTRIBUTE_NODE) {
        parentNodeset.setAttributeNode(newNode);
      } else {
        let referenceNode = this._findReferenceNodeForNewElement(
          newNode,
          parentNodeset,
          siblingControl,
        );

        if (referenceNode) {
          if (referenceNode.nodeType === Node.DOCUMENT_NODE) {
            referenceNode.firstElementChild.append(newNode);
          } else {
            referenceNode.after(newNode);
          }
        } else {
          parentNodeset.prepend(newNode);
        }
      }

      bound.evalInContext();
      bound.getModelItem()?.bind?.evalInContext();

      if (!isResolvedBound(bound)) {
        console.warn('create-nodes: could not resolve bound after node creation, skipping', bound);
        continue;
      }
    }
  }
  /**
   * Create Nodes from an XPath
   * @param {string} ref
   * @param {Element} referenceNode
   */
  _createNodes(ref, referenceNode) {
    if (!ref || !referenceNode) return null;

    const xpath = String(ref).trim();
    if (!xpath || xpath === '.') return null;

    if (/^instance\([^\)]*\)/.test(xpath)) {
      // This is an absolute path for some instance. Not supported for create-nodes here.
      return null;
    }

    const ownerDoc =
      referenceNode.nodeType === Node.DOCUMENT_NODE ? referenceNode : referenceNode.ownerDocument;

    if (!ownerDoc) return null;

    const baseElement =
      referenceNode.nodeType === Node.DOCUMENT_NODE
        ? referenceNode.documentElement
        : referenceNode.nodeType === Node.ATTRIBUTE_NODE
          ? referenceNode.ownerElement
          : referenceNode;

    return createNodes(ref, baseElement, this);
  }

  _handleDragStart(event) {
    const draggedItem = event.target.closest('[draggable="true"]');
    this.originalDraggedItem = draggedItem;
    // console.log('DRAG START', this);
    if (draggedItem.getAttribute('drop-action') === 'copy') {
      event.dataTransfer.dropEffect = 'copy';
      event.dataTransfer.effectAllowed = 'copy';
      this.draggedItem = draggedItem.cloneNode(true);
      this.draggedItem.setAttribute('drop-action', 'move');
      this.copiedElements.add(this.draggedItem);
    } else {
      event.dataTransfer.dropEffect = 'move';
      event.dataTransfer.effectAllowed = 'move';
      this.draggedItem = draggedItem;
    }
  }

  _handleDrop(event) {
    // console.log('DROP ON BODY', this);
    if (!this.draggedItem) {
      return;
    }
    // A drop on 'body' should be a removal.
    if (event.dataTransfer.dropEffect === 'none') {
      if (this.copiedElements.has(this.originalDraggedItem)) {
        this.originalDraggedItem.remove();
      }
    }
    this.originalDraggedItem = null;
    this.draggedItem = null;
    event.stopPropagation();
  }

  registerLazyElement(element) {
    if (this.intersectionObserver) {
      // console.log('registerLazyElement',element);
      this.intersectionObserver.observe(element);
    }
  }

  unRegisterLazyElement(element) {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
  }

  /**
   *
   * @returns {FxModel}
   */
  getModel() {
    return this.querySelector('fx-model');
  }

  _displayMessage(e) {
    // console.log('_displayMessage',e);
    const { level } = e.detail;
    const msg = e.detail.message;
    this._showMessage(level, msg);
    e.stopPropagation();
  }

  _displayError(e) {
    // const { error } = e.detail;
    const msg = e.detail.message;
    // this._showMessage('modal', msg);
    const toast = this.shadowRoot.querySelector('#error');
    toast.showToast(msg);
  }

  _displayWarning(e) {
    const msg = e.detail.message;
    // this._showMessage('modal', msg);
    const path = XPathUtil.shortenPath(evaluateXPathToString('path()', e.target, this));
    const toast = this.shadowRoot.querySelector('#warn');
    toast.showToast(`WARN: ${path}:${msg}`);
  }

  _logError(e) {
    // Prevent the error event from bubbling up and potentially triggering
    // parent error handlers that might call refresh() again
    e.stopPropagation();
    e.stopImmediatePropagation(); // Added to stop other listeners on this element
    e.preventDefault();

    console.error('ERROR', e.detail.message);

    // Guard the display logic: if showing the error causes another error,
    // we must break the cycle.
    if (this.strict && !this._isLogging) {
      this._isLogging = true;
      try {
        this._displayError(e);
      } finally {
        this._isLogging = false;
      }
    }
  }

  _copyToClipboard(target) {
    console.log('copyToClipboard', target.value);
    navigator.clipboard.writeText(target.value);
  }

  _showMessage(level, msg) {
    if (level === 'modal') {
      // this.$.messageContent.innerText = msg;
      // this.$.modalMessage.open();

      this.shadowRoot.getElementById('messageContent').innerText = msg;
      // this.shadowRoot.getElementById('modalMessage').open();
      this.shadowRoot.getElementById('modalMessage').classList.add('show');
    } else if (level === 'sticky' || level === 'error' || level === 'warn') {
      // const notification = this.$.modeless;
      this.shadowRoot.querySelector(`#${level}`).showToast(msg);
    } else {
      const toast = this.shadowRoot.querySelector('#message');
      toast.showToast(msg);
    }
  }

  /**
   * wraps the element having a 'data-ref' attribute with an fx-repeat-attributes element.
   * @private
   */
  _createRepeatsFromAttributes() {
    if (this.repeatsFromAttributesCreated) return;
    const repeats = this.querySelectorAll('[data-ref]');
    if (repeats) {
      Array.from(repeats).forEach(item => {
        const table = item.parentNode.closest('table');
        let host;
        if (table) {
          host = table.cloneNode(true);
        } else {
          host = item.cloneNode(true);
        }
        // ### clone original item to move it into fx-repeat-attributes
        // const host = item.cloneNode(true);

        // ### create wrapper element
        const repeatFromAttr = new FxRepeatAttributes();
        // const repeatFromAttr = document.createElement('fx-repeat-attributes');

        // ### copy the value of 'data-ref' to 'ref' on fx-repeat-attributes
        repeatFromAttr.setAttribute('ref', item.getAttribute('data-ref'));
        // item.removeAttribute('data-ref');

        // ### append the cloned original element to fx-repeat-attributes
        repeatFromAttr.appendChild(host);

        // ### insert fx-repeat-attributes element before element with the 'data-ref'
        // repeats[0].parentNode.insertBefore(repeatFromAttr,repeats[0]);

        if (table) {
          table.parentNode.insertBefore(repeatFromAttr, table);
          table.parentNode.removeChild(table);
        } else {
          item.parentNode.insertBefore(repeatFromAttr, item);
          item.parentNode.removeChild(item);
        }

        // ### remove original item from DOM
        item.setAttribute('insertPoint', '');
      });
    }
    this.repeatsFromAttributesCreated = true;
  }
}

if (!customElements.get('fx-fore')) {
  customElements.define('fx-fore', FxFore);
}
