import { Fore } from './fore.js';
import './fx-instance.js';
import { FxModel } from './fx-model.js';
import '@jinntec/jinn-toast';
import {
  evaluateXPathToBoolean,
  evaluateXPathToNodes,
  evaluateXPathToFirstNode,
  evaluateXPathToString,
} from './xpath-evaluation.js';
import getInScopeContext from './getInScopeContext.js';
import { XPathUtil } from './xpath-util.js';
import { FxRepeatAttributes } from './ui/fx-repeat-attributes.js';

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

    this.model = {};
    this.inited = false;
    // this.addEventListener('model-construct-done', this._handleModelConstructDone);
    // todo: refactoring - these should rather go into connectedcallback
    this.addEventListener('message', this._displayMessage);
    // this.addEventListener('error', this._displayError);
    this.addEventListener('error', this._logError);
    this.addEventListener('warn', this._displayWarning);
    // this.addEventListener('log', this._logError);
    window.addEventListener('compute-exception', (e) => {
      console.error('circular dependency: ', e);
    });

    this.ready = false;
    this.storedTemplateExpressionByNode = new Map();

    // Stores the outer most action handler. If an action handler is already running, all
    // updates are included in that one
    this.outermostHandler = null;

    this.copiedElements = new WeakSet();

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
  }

  connectedCallback() {
    this.style.visibility = 'hidden';
    console.time('init');
    this.strict = !!this.hasAttribute('strict');
    /*
        document.addEventListener('ready', (e) =>{
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

    const slot = this.shadowRoot.querySelector('slot#default');
    slot.addEventListener('slotchange', async (event) => {
      // preliminary addition for auto-conversion of non-prefixed element into prefixed elements. See fore.js
      console.log(`### <<<<< slotchange on '${this.id}' >>>>>`);
      if (this.inited) return;
      if (this.hasAttribute('convert')) {
        this.replaceWith(Fore.copyDom(this));
        // Fore.copyDom(this);
        return;
      }

      if (this.ignoreExpressions) {
        this.ignoredNodes = Array.from(this.querySelectorAll(this.ignoreExpressions));
      }

      const children = event.target.assignedElements();
      let modelElement = children.find(
        modelElem => modelElem.nodeName.toUpperCase() === 'FX-MODEL',
      );
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
          `%cFore is processing fx-fore#${this.id}`,
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
        }(this));

        await modelElement.modelConstruct();
        this._handleModelConstructDone();
      }
      this.model = modelElement;

      this._createRepeatsFromAttributes();
      this.inited = true;
    });
    this.addEventListener('path-mutated', () => {
      this.someInstanceDataStructureChanged = true;
    });
    this.addEventListener('refresh', () => {
      this.refresh(true);
    });
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
  }

  /**
   * Add a model item to the refresh list
   *
   * @param {import('./modelitem.js').ModelItem} modelItem
   * @returns {void}
   */
  addToRefresh(modelItem) {
    const found = this.toRefresh.find(mi => mi.path === modelItem.path);
    if (!found) {
      this.toRefresh.push(modelItem);
    }
  }

  /**
   * Raise a flag that there might be new template expressions under some node. This happens with
   * repeats updating (new repeat items can have new template expressions) or switches changing their case (new case = new raw HTML)
   */
  scanForNewTemplateExpressionsNextRefresh() {
    // TODO: also ask for the root of any new HTML: this can prevent some very deep queries.
    this._scanForNewTemplateExpressionsNextRefresh = true;
  }

  /**
   * loads a Fore from an URL given by `src`.
   *
   * Will extract the `fx-fore` element from that target file and use and replace current `fx-fore` element with the loaded one.
   * @private
   */
  async _loadFromSrc() {
    // console.log('########## loading Fore from ', this.src, '##########');
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

    entries.forEach((entry) => {
      const { target } = entry;

      const fore = Fore.getFore(target);
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
   * refreshes the whole UI by visiting each bound element (having a 'ref' attribute) and applying the state of
   * the bound modelItem to the bound element.
   *
   *
   * force - boolean - if true will refresh all children disregarding toRefresh array
   *
   */
  async forceRefresh() {
    // console.time('refresh');
    // console.group('### forced refresh', this);

    Fore.refreshChildren(this, true);
    this._updateTemplateExpressions();
    this._scanForNewTemplateExpressionsNextRefresh = false; // reset
    this._processTemplateExpressions();

    console.log(`### <<<<< refresh-done ${this.id} >>>>>`);

    Fore.dispatch(this, 'refresh-done', {});

    // console.groupEnd();
    // console.timeEnd('refresh');
  }

  // async refresh(force, changedPaths) {
  async refresh(force) {
    /*

                if (!changedPaths) {
                    changedPaths = this.toRefresh.map(item => item.path);
                } else {
                    this.toRefresh.push(
                        ...changedPaths
                            .map(
                                path =>
                                this.getModel()
                                    .modelItems
                                    .find(item => item.path === path)
                            )
                            .filter(Boolean)
                    );

                    for(const changedPath of changedPaths) {
                        for (const repeat of this.querySelectorAll('fx-repeat')) {
                            if (repeat.closest('fx-fore') !== this) {
                                continue;
                            }

                            if (repeat.touchedPaths && repeat.touchedPaths.has(changedPath)) {
                                // Make a temporary model-item-like structure for this
                                this.toRefresh.push({
                                    path: changedPath,
                                    boundControls: [repeat]
                                });

                                console.log('Found a repeat to update!!!', repeat)
                            }
                        }
                    }
		}
        */
    if (this.isRefreshing) {
      return;
    }
    this.isRefreshing = true;
    console.log(`### <<<<< refresh() on '${this.id}' >>>>>`);

    // refresh () {
    // ### refresh Fore UI elements
    // if (!this.initialRun && this.toRefresh.length !== 0) {
    if (!force && !this.initialRun && this.toRefresh.length !== 0) {
      // console.log('toRefresh', this.toRefresh);
      let needsRefresh = false;

      // ### after recalculation the changed modelItems are copied to 'toRefresh' array for processing
      this.toRefresh.forEach((modelItem) => {
        // check if modelItem has boundControls - if so, call refresh() for each of them
        const controlsToRefresh = modelItem.boundControls;
        if (controlsToRefresh) {
          controlsToRefresh.forEach((ctrl) => {
            ctrl.refresh(force);
          });
        }

        // ### check if other controls depend on current modelItem
        const { mainGraph } = this.getModel();
        if (mainGraph && mainGraph.hasNode(modelItem.path)) {
          const deps = this.getModel().mainGraph.dependentsOf(modelItem.path, false);
          // ### iterate dependant modelItems and refresh all their boundControls
          if (deps.length !== 0) {
            deps.forEach((dep) => {
              // ### if changed modelItem has a 'facet' path we use the basePath that is the locationPath without facet name
              const basePath = XPathUtil.getBasePath(dep);
              const modelItemOfDep = this.getModel().modelItems.find(mip => mip.path === basePath);
              // ### refresh all boundControls
              modelItemOfDep.boundControls.forEach((control) => {
                control.refresh(force);
              });
            });
            needsRefresh = true;
          }
        }
      });
      this.toRefresh = [];
      /*
            if (!needsRefresh) {
                console.log('no dependants to refresh');
            }
*/
    } else {
      // ### resetting visited state for controls to refresh
      /*
            const visited = this.parentNode.querySelectorAll('.visited');
            Array.from(visited).forEach(v =>{
                v.classList.remove('visited');
            });
*/

      if (this.inited) {
        Fore.refreshChildren(this, true);
      }
      // console.timeEnd('refreshChildren');
    }

    // ### refresh template expressions
    if (this.initialRun || this._scanForNewTemplateExpressionsNextRefresh) {
      this._updateTemplateExpressions();
      this._scanForNewTemplateExpressionsNextRefresh = false; // reset
    }

    this._processTemplateExpressions();

    // console.log('### <<<<< dispatching refresh-done - end of UI update cycle >>>>>');
    // this.dispatchEvent(new CustomEvent('refresh-done'));
    // this.initialRun = false;
    this.style.visibility = 'visible';
    console.log(`### <<<<< refresh-done ${this.id} >>>>>`);
    Fore.dispatch(this, 'refresh-done', {});

    // this.isRefreshing = true;
    // this.parentNode.closest('fx-fore')?.refresh(false, changedPaths);

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
        await subFore.refresh(false);
      }
    }
    this.isRefreshing = false;
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
    const search = "(descendant-or-self::*!(text(), @*))[contains(., '{')][substring-after(., '{') => contains('}')][not(ancestor-or-self::fx-model)]";

    const tmplExpressions = evaluateXPathToNodes(search, this, this);
    // console.log('template expressions found ', tmplExpressions);

    if (!this.storedTemplateExpressions) {
      this.storedTemplateExpressions = [];
    }

    // console.log('######### storedTemplateExpressions', this.storedTemplateExpressions.length);

    /*
            storing expressions and their nodes for re-evaluation
             */
    Array.from(tmplExpressions).forEach((node) => {
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
    const replaced = expr.replace(/{[^}]*}/g, (match) => {
      if (match === '{}') return match;
      const naked = match.substring(1, match.length - 1);
      const inscope = getInScopeContext(node, naked);
      if (!inscope) {
        console.warn('no inscope context for expr', naked);
        const errNode = node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ATTRIBUTE_NODE
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
        return evaluateXPathToString(naked, inscope, node, null, inst);
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
    /*
        listening on beforeunload after model is constructed - this is to be able to evaluate a condition on the data
        that specifies whether or not to show confirmation.
         */
    if (this.hasAttribute('show-confirmation')) {
      const condition = this.getAttribute('show-confirmation');
      if (
        condition
        && condition !== 'show-confirmation'
        && condition !== 'true'
        && condition !== ''
      ) {
        window.addEventListener('beforeunload', (event) => {
          const mustDisplay = evaluateXPathToBoolean(
            condition,
            this.getModel().getDefaultContext(),
            this,
          );
          if (mustDisplay) {
            return (event.returnValue = 'are you sure');
          }
          event.preventDefault();
        });
      } else {
        window.addEventListener('beforeunload', (event) => {
          // if(AbstractAction.dataChanged){
          if (FxModel.dataChanged) {
            return (event.returnValue = 'are you sure');
          }
          event.preventDefault();
        });
      }
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
    const parentFore = this.parentNode.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
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
        steps.forEach((step) => {
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

  /*
          _createStep(){

          }
        */

  /*
          _generateInstance(start, parent) {
            if (start.hasAttribute('ref')) {
              const ref = start.getAttribute('ref');

              if(ref.includes('/')){
                console.log('complex path to create ', ref);
                const steps = ref.split('/');
                steps.forEach(step => {
                  console.log('step ', step);

                });
              }

              // const generated = document.createElement(ref);
              const generated = parent.ownerDocument.createElement(ref);
              if (start.children.length === 0) {
                generated.textContent = start.textContent;
              }
              parent.appendChild(generated);
              parent = generated;
            }

            if (start.hasChildNodes()) {
              const list = start.children;
              for (let i = 0; i < list.length; i += 1) {
                this._generateInstance(list[i], parent);
              }
            }
            return parent;
          }
        */

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
    // console.log('### _initUI()');
    console.log(`### <<<<< _initUI '${this.id}' >>>>>`);

    if (!this.initialRun) return;
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
    await this.refresh(true);
    // this.style.display='block'
    this.classList.add('fx-ready');
    document.body.classList.add('fx-ready');

    this.ready = true;
    this.initialRun = false;
    // console.log('### >>>>> dispatching ready >>>>>', this);
    console.log(`### <<<<< ${this.id} ready >>>>>`);

    // console.log('### modelItems: ', this.getModel().modelItems);
    Fore.dispatch(this, 'ready', {});
    // console.log('dataChanged', FxModel.dataChanged);
    console.timeEnd('init');

    this.addEventListener('dragstart', this._handleDragStart);
    //	this.addEventListener('dragend', this._handleDragEnd);
    this.handleDrop = event => this._handleDrop(event);
    this.ownerDocument.body.addEventListener('drop', this.handleDrop);
    this.ownerDocument.body.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
    });
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
      Array.from(repeats).forEach((item) => {
        if (item.closest('fx-control')) return;
        /*
                const parentRepeat = item.closest('fx-repeat');
                if(parentRepeat){
                    this.dispatchEvent(
                        new CustomEvent('log', {
                            composed: false,
                            bubbles: true,
                            cancelable:true,
                            detail: { id:this.id, message: `nesting elements with data-ref attributes within fx-repeat is not supported by now`, level:'Error'},
                        }),
                    );
                }
*/

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
