import { Fore } from './fore.js';
import './fx-instance.js';
import { FxModel } from './fx-model.js';
import '@jinntec/jinn-toast';
import { evaluateXPathToNodes, evaluateXPathToString } from './xpath-evaluation.js';
import getInScopeContext from './getInScopeContext.js';
import { XPathUtil } from './xpath-util.js';
import { FxRepeatAttributes } from './ui/fx-repeat-attributes.js';
import { FxBind } from './fx-bind.js';

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
             border-radius: 5px;

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
    this.validateOn = this.hasAttribute('validate-on')
      ? this.getAttribute('validate-on')
      : 'update';
    // this.mergePartial = this.hasAttribute('merge-partial')? true:false;
    this.mergePartial = false;
    this.createNodes = this.hasAttribute('create-nodes') ? true : false;
    this._localNamesWithChanges = new Set();
    this.setAttribute('role', 'form'); // set aria role
  }

  /**
   * Resolve elements from the `wait-for` attribute.
   * Supports comma-separated CSS selectors and the special value "closest".
   */
  _resolveDependencies() {
    const raw = this.getAttribute('wait-for');
    if (!raw) return [];
    const sels = raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const roots = [this.getRootNode?.() ?? document, document];
    const out = [];

    for (const sel of sels) {
      let el = null;

      if (sel === 'closest') {
        el = this.closest('fx-fore');
      } else {
        for (const r of roots) {
          if (r && 'querySelector' in r) {
            el = r.querySelector(sel);
            if (el) break;
          }
        }
      }
      if (el) out.push(el);
    }
    return out;
  }

  /**
   * Wait until all dependencies are ready (i.e., they set `ready = true`
   * and dispatch the `ready` event).
   */
  _whenDependenciesReady() {
    const raw = this.getAttribute('wait-for');
    if (!raw) return Promise.resolve();

    const sels = raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const roots = [this.getRootNode?.() ?? document, document];

    const query = sel => {
      for (const r of roots) {
        if (r && 'querySelector' in r) {
          const el = r.querySelector(sel);
          if (el) return el;
        }
      }
      return null;
    };

    const isReadyNow = sel => {
      if (sel === 'closest') {
        const outer = this.closest('fx-fore');
        return !!(outer && outer.ready === true);
      }
      const el = query(sel);
      return !!(el && el.ready === true);
    };

    const waitOne = sel =>
      new Promise(resolve => {
        // fast path
        if (isReadyNow(sel)) return resolve();

        // robust path: listen at the document/root so replacement doesn't matter
        const onReady = ev => {
          const t = ev.target;
          if (sel === 'closest') {
            // outer fore becoming ready anywhere above us
            if (t?.tagName === 'FX-FORE' && t.contains(this)) {
              cleanup();
              resolve();
            }
          } else if (t?.matches?.(sel)) {
            cleanup();
            resolve();
          }
        };

        const root = document; // capture at doc to catch composed events
        const cleanup = () => root.removeEventListener('ready', onReady, true);

        root.addEventListener('ready', onReady, true);

        // also re-check on DOM changes in case a ready fore is inserted without firing (paranoia)
        const mo = new MutationObserver(() => {
          if (isReadyNow(sel)) {
            mo.disconnect();
            cleanup();
            resolve();
          }
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
      });

    return Promise.all(sels.map(waitOne));
  }

  _onSlotChange = async ev => {
    // 1) Capture the slot element BEFORE any await
    const slotEl = ev.currentTarget;
    if (!(slotEl instanceof HTMLSlotElement)) return;

    // avoid double init
    if (this.inited) return;

    // 2) Wait for dependencies if needed
    if (this.hasAttribute('wait-for')) {
      try {
        await this._whenDependenciesReady();
      } catch (e) {
        console.warn('wait-for failed', e);
        return;
      }
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
    const children = slotEl.assignedElements({ flatten: true });

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

      await modelElement.modelConstruct();
      this._handleModelConstructDone();
    }
    this.model = modelElement;

    this._createRepeatsFromAttributes();
    this.inited = true;
  };

  connectedCallback() {
    this.style.visibility = 'hidden';
    console.time('init');
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
    this.ignoreExpressions = this.hasAttribute('ignore-expressions')
      ? this.getAttribute('ignore-expressions')
      : null;

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
      this._loadFromSrc();
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

  _injectDevtools() {
    if (this.ownerDocument.querySelector('fx-devtools')) {
      // There's already a devtools, so we can ignore this one.
      // One devtools can focus multiple fore elements
      return;
    }
    const { search } = window.location;
    const urlParams = new URLSearchParams(search);
    if (urlParams.has('inspect')) {
      const devtools = document.createElement('fx-devtools');
      document.body.appendChild(devtools);
    }
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
    this.addEventListener(
      'value-changed',
      () => {
        this.dirtyState = dirtyStates.DIRTY;
      },
      { once: true },
    );
    this.dirtyState = dirtyStates.CLEAN;
  }

  /**
   * loads a Fore from an URL given by `src`.
   *
   * Will extract the `fx-fore` element from that target file and use and replace current `fx-fore` element with the loaded one.
   * @private
   */
  async _loadFromSrc() {
    // console.log('########## loading Fore from ', this.src, '##########');
    if (this.hasAttribute('wait-for')) {
      await this._whenDependenciesReady();
    }
    await Fore.loadForeFromSrc(this, this.src, 'fx-fore');
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
  async refresh(force) {
    if (this.isRefreshing) {
      return;
    }

    /*
    if (force !== true && this._localNamesWithChanges.size > 0) {
      force = {
        ...(force || { reason: undefined }),
        elementLocalnamesWithChanges: Array.from(this._localNamesWithChanges),
      };
      this._localNamesWithChanges.clear();
    }
*/

    this.isRefreshing = true;
    this.isRefreshPhase = true;

    // refresh () {
    // ### refresh Fore UI elements
    // if (!this.initialRun && this.toRefresh.length !== 0) {
    // if (!this.initialRun && this.toRefresh.length !== 0) {
    // if (!force && !this.initialRun && this.toRefresh.length !== 0) {
    if (force === true || this.initialRun) {
      console.log('🔄 🔴🔴🔴 ### full refresh() on ', this);
      Fore.refreshChildren(this, force);
    } else {
      // Process all batched no tifications at the end of the refresh phase
      console.log('🔄 🎯  ### processing batched notifications');
      await this._processBatchedNotifications();
    }

    // ### refresh template expressions
    if (force === true || this.initialRun || this._scanForNewTemplateExpressionsNextRefresh) {
      this._updateTemplateExpressions();
      this._scanForNewTemplateExpressionsNextRefresh = false; // reset
    }

    this._processTemplateExpressions();

    this.isRefreshPhase = false;

    // console.log('### <<<<< dispatching refresh-done - end of UI update cycle >>>>>');
    // this.dispatchEvent(new CustomEvent('refresh-done'));
    this.initialRun = false;
    this.style.visibility = 'visible';
    console.info(
      `%c ✅ refresh-done on #${this.id}`,
      'background:darkorange; color:black; padding:.5rem; display:inline-block; white-space: nowrap; border-radius:0.3rem;width:100%;',
      this.getModel().modelItems,
    );

    Fore.dispatch(this, 'refresh-done', {});

    const subFores = Array.from(this.querySelectorAll('fx-fore'));
    /*
        calling the parent to refresh causes errors and inconsistent state. Also it is questionable
        if a child should actually interact with its parent in this way.

        This only affects the refreshing NOT the data mutation itself which is happening as expected.

        Current solution is that a child that wants the parent to refresh must do so by adding an additional
        event handler that dispatches an event upwards and having a handler in the parent to refresh itself.

        So refreshed propagate downwards but not upwards which is at least an option to consider.

        if(this.parentNode.nodeType !== Node.DOCUMENT_FRAGMENT_NODE){
            // await this.parentNode.closest('fx-fore')?.refresh(false);
        }
    */
    for (const subFore of subFores) {
      // subFore.refresh(false, changedPaths);
      if (subFore.ready) {
        // Do an unconditional hard refresh: there might be changes that are relevant
        // todo: investigate impact of observer architecture - do we really want to refresh all subfore elements with a hard refresh?
        await subFore.refresh(true);
      }
    }
    this.isRefreshing = false;
    // Clear the batch
    // this.batchedNotifications.clear();
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
   * Process all batched notifications at the end of the refresh phase
   */
  _processBatchedNotifications() {
    if (this.batchedNotifications.size > 0) {
      // console.log(`🔍 Processing ${this.batchedNotifications.size} batched notifications`);

      // Process all batched notifications
      this.batchedNotifications.forEach(entry => {
        // console.log('batched update', entry);
        // handle repeatitems created via data-ref
        if (entry.classList && entry.classList.contains('fx-repeatitem')) {
          Fore.refreshChildren(entry, true);
        }
        if (entry && typeof entry.refresh === 'function') {
          // Entry is a Ui Element
          // Force refresh for this whole subtree
          const uiElement = /** @type {import('./ui/UIElement.js').UIElement} */ (entry);
          if (!uiElement.ownerDocument.contains(uiElement)) {
            // Something already removed this ui element. Skip.
            return;
          }
          uiElement.refresh(true);
        }
        const nonrelevant = Array.from(this.querySelectorAll('[nonrelevant]'));
        // loop nonrelevant elements
        if (nonrelevant) {
          nonrelevant.forEach(entry => {
            if (entry.refresh) {
              entry.refresh();
            }
          });
        }
        if (entry.observers) {
          // Item is a model item
          entry.observers.forEach(observer => {
            // console.log('🔍 processing observer', observer);
            if (typeof observer.update === 'function') {
              // console.log('updating observer', observer);
              observer.update(entry);
            }
          });
        }
      });

      // Clear the batch
      this.batchedNotifications.clear();
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
    console.log('processing template expressions ', this.storedTemplateExpressionByNode);
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
    // ### do not evaluate template expressions with nonrelevant sections
    if (node.nodeType === Node.ATTRIBUTE_NODE && node.ownerElement.closest('[nonrelevant]')) return;
    if (node.nodeType === Node.TEXT_NODE && node.parentNode.closest('[nonrelevant]')) return;
    if (node.nodeType === Node.ELEMENT_NODE && node.closest('[nonrelevant]')) return;

    // if(node.closest('[nonrelevant]')) return;
    const replaced = expr.replace(/{[^}]*}/g, match => {
      if (match === '{}') return match;
      const naked = match.substring(1, match.length - 1);
      const inscope = getInScopeContext(node, naked);
      if (!inscope) {
        console.warn('no inscope context for expr', naked);
        const errNode =
          node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ATTRIBUTE_NODE
            ? node.parentNode
            : node;
        return match;
      }
      // Templates are special: they use the namespace configuration from the place where they are
      // being defined
      const instanceId = XPathUtil.getInstanceId(naked);

      // If there is an instance referred
      const inst = instanceId
        ? this.getModel().getInstance(instanceId)
        : this.getModel().getDefaultInstance();

      try {
        const result = evaluateXPathToString(naked, inscope, node, null, inst);
        // console.log(`template expression result for ${naked}=${result}`);
        return result;
      } catch (error) {
        console.warn('ignoring unparseable expr', error);
        return match;
      }
    });

    // Update to the new value. Don't do it though if nothing changed to prevent iframes or
    // images from reloading for example
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
  }

  // eslint-disable-next-line class-methods-use-this
  _getTemplateExpression(node) {
    if (this.ignoredNodes) {
      if (node.nodeType === Node.ATTRIBUTE_NODE) {
        node = node.ownerElement;
      }
      const found = this.ignoredNodes.find(n => n.contains(node));
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
    this.markAsClean();

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
      this.initData();
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

    // console.log('### modelItems: ', this.getModel().modelItems);
    Fore.dispatch(this, 'ready', {});
    // console.log('dataChanged', FxModel.dataChanged);

    this.addEventListener('dragstart', this._handleDragStart);
    //	this.addEventListener('dragend', this._handleDragEnd);
    this.handleDrop = event => this._handleDrop(event);
    this.ownerDocument.body.addEventListener('drop', this.handleDrop);
    this.ownerDocument.body.addEventListener('dragover', e => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
    });
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
   *
   */
  initData(root = this) {
    // const created = new Promise(resolve => {
    console.log('INIT');
    // const boundControls = Array.from(root.querySelectorAll('[ref]:not(fx-model *),fx-repeatitem'));

    /**
     * @type {import('./ForeElementMixin.js').default[]}
     */
    const boundControls = Array.from(
      root.querySelectorAll(
        'fx-control[ref],fx-upload[ref],fx-group[ref],fx-repeat[ref], fx-switch[ref]',
      ),
    );
    if (root.matches && root.matches('fx-repeatitem')) {
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
      if (bound.nodeset !== null && !(Array.isArray(bound.nodeset) && bound.nodeset.length > 0)) {
        console.log('Node exists', bound.nodeset);
        continue;
      }
      console.log('Node does not exists', bound.ref);

      // We need to create that node!
      const previousControl = boundControls[i - 1];

      // Previous control can either be an ancestor of us, or a previous node, which can be a sibling, or a child of a sibling.
      // First: parent
      if (previousControl && previousControl.contains(bound)) {
        // Parent is here.
        console.log('insert into', bound, previousControl);
        console.log('insert into nodeset', bound.nodeset);
        /**
         * @type {ParentNode}
         */
        const parentNodeset = previousControl.nodeset;
        // console.log('parentNodeset', parentNodeset);

        // const parentModelItemNode = parentModelItem.node;
        const ref = bound.ref;
        // const newElement = parentModelItemNode.ownerDocument.createElement(ref);
        // if (parentNodeset.querySelector(`[ref="${ref}"]`)) {
        //   console.log(`Node with ref "${ref}" already exists.`);
        //   continue;
        // }

        const newNode = this._createNodes(ref, parentNodeset);
        if (!newNode) {
          // We could not make the node for some reason. Maybe it's something like `instance('XXX')`?
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
        bound.getModelItem().bind?.evalInContext();

        // console.log('CREATED child', newElement);
        // console.log('new control evaluated to ', control.nodeset);
        // Done!
        continue;
      }
      // console.log('previousControl', previousControl);
      // console.log('control', control);
      // Is previousControl a sibling or a descendant of a logical sibling? Keep looking backwards until we share parents!
      let ourParent = XPathUtil.getParentBindingElement(bound);
      // console.log('ourParent', ourParent);
      let siblingControl = null;
      /*
            for (let j = i - 1; j >= 0; --j) {
                const potentialSibling = boundControls[j];
                if (XPathUtil.getParentBindingElement(potentialSibling) === ourParent) {
                    siblingControl = potentialSibling;
                    break; // Exit once the sibling is found
                }
            }
*/
      for (let j = i - 1; j > 0; --j) {
        const siblingOrDescendant = boundControls[j];
        if (XPathUtil.getParentBindingElement(siblingOrDescendant) === ourParent) {
          siblingControl = siblingOrDescendant;
          break;
        }
      }
      if (!siblingControl) {
        console.log('No sibling found for', bound);
      }
      // console.log('sibling', siblingControl);
      // todo: review: should this not just be inscopeContext?
      let parentNodeset;
      if(!ourParent || !ourParent.nodeset){
          /*
          if we lost context somehow just always assume default context and append to that
          instead of bailing out.
           */
          parentNodeset = root.getModel().getDefaultContext();
      } else {
        parentNodeset = ourParent.nodeset;
      }
      const ref = bound.ref;

      const newNode = this._createNodes(ref, parentNodeset);
      if (newNode.nodeType === Node.ATTRIBUTE_NODE) {
        parentNodeset.setAttributeNode(newNode);
      } else {
        let referenceNode = this._findReferenceNodeForNewElement(
          newNode,
          parentNodeset,
          siblingControl,
        );

        if (referenceNode) {
          // console.log('insert after', referenceNode,newNode);
          if(referenceNode.nodeType === Node.DOCUMENT_NODE){
            referenceNode.firstElementChild.append(newNode);
           }else{
            referenceNode.after(newNode);
          }
        } else {
          parentNodeset.prepend(newNode);
        }
      }

      /*
            console.log('control inscope', control.getInScopeContext());
            console.log('control ref', control.ref);
            console.log('control new element parent', newElement.parentNode.nodeName);
      */

      bound.evalInContext();
      bound.getModelItem().bind?.evalInContext();

      if (!bound.nodeset) {
        throw new Error('Creating annode failed');
      }
      // console.log('new control evaluated to ', control.nodeset);
      // console.log('CREATED sibling', newElement);
    }
    // console.log('DATA', this.getModel().getDefaultContext());
  }

  _createNodes(ref, referenceNode) {
    // console.log('creating', ref)
    // console.log('ownerDoc', referenceNode.ownerDocument);
    /*
        const existingNode = evaluateXPathToFirstNode(ref, referenceNode, this);
        if(existingNode){
            console.log(`Node already exists for ref: ${ref}`);
            return existingNode;
        }
    console.log(`creating new node for ref: ${ref}`);
    */
    if (/instance\([^\)]*\)/.test(ref)) {
      // This is an absolute path for some instance. Not supporteed for now
      return null;
    }
    let newElement;
    if (ref.includes('/')) {
      // multi-step ref expressions
      newElement = XPathUtil.createNodesFromXPath(ref, referenceNode.ownerDocument, this);
      // console.log('new subtree', newElement);
      return newElement;
    } else {
      return XPathUtil.createNodesFromXPath(ref, referenceNode.ownerDocument, this);
    }
  }

  _handleDragStart(event) {
    const draggedItem = event.target.closest('[draggable="true"]');
    this.originalDraggedItem = draggedItem;
    console.log('DRAG START', this);
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
    console.log('DROP ON BODY', this);
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
    e.stopPropagation();
    e.preventDefault();

    console.error('ERROR', e.detail.message);
    console.error(e.detail.origin);
    if (e.detail.expr) {
      console.error('Failing expression', e.detail.expr);
    }
    if (this.strict) {
      this._displayError(e);
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
