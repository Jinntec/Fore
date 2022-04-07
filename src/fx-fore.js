import { Fore } from './fore.js';
import './fx-instance.js';
import './fx-model.js';
import '@jinntec/jinn-toast';
import { evaluateXPathToNodes, evaluateXPathToString } from './xpath-evaluation.js';
import getInScopeContext from './getInScopeContext.js';
import { XPathUtil } from './xpath-util.js';

/**
 * Main class for Fore.Outermost container element for each Fore application.
 *
 * Root element for Fore. Kicks off initialization and displays messages.
 *
 * fx-fore is the outermost container for each form. A form can have exactly one model
 * with arbitrary number of instances.
 *
 * Main responsiblities are initialization and updating of model and instances, update of UI (refresh) and global messaging.
 *
 *
 *
 * @ts-check
 */
export class FxFore extends HTMLElement {
  static get properties() {
    return {
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
    this.model = {};
    this.addEventListener('model-construct-done', this._handleModelConstructDone);
    this.addEventListener('message', this._displayMessage);
    this.addEventListener('error', this._displayError);
    window.addEventListener('compute-exception', e => {
      console.error('circular dependency: ', e);
    });

    this.ready = false;
    this.storedTemplateExpressionByNode = new Map();

    const style = `
            :host {
                // display: none;
                height:auto;
                padding:var(--model-element-padding);
                font-family:Roboto, sans-serif;
                color:var(--paper-grey-900);
            }
            :host ::slotted(fx-model){
                display:none;
            }
            :host(.fx-ready){
                animation: fadein .4s forwards;
                display:block;
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
            @keyframes fadein {
              0% {
                  opacity:0;
              }
              100% {
                  opacity:1;
              }
            }
        `;

    const html = `
           <jinn-toast id="message" gravity="bottom" position="left"></jinn-toast>
           <jinn-toast id="sticky" gravity="bottom" position="left" duration="-1" close="true" data-class="sticky-message"></jinn-toast>
           <jinn-toast id="error" text="error" duration="-1" data-class="error" close="true" position="left" gravity="bottom"></jinn-toast>
           <slot></slot>
           <div id="modalMessage" class="overlay">
                <div class="popup">
                   <h2></h2>
                    <a class="close" href="#"  onclick="event.target.parentNode.parentNode.classList.remove('show')" autofocus>&times;</a>
                    <div id="messageContent"></div>
                </div>
           </div>
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
    this.someInstanceDataStructureChanged = false;
  }

  connectedCallback() {
    this.lazyRefresh = this.hasAttribute('refresh-on-view');
    if (this.lazyRefresh) {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3,
      };
      this.intersectionObserver = new IntersectionObserver(this.handleIntersect, options);
    }

    this.src = this.hasAttribute('src')? this.getAttribute('src'):null;
    if(this.src){
      this._loadFromSrc();
      return ;
    }

    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', event => {
      const children = event.target.assignedElements();
      let modelElement = children.find(
        modelElem => modelElem.nodeName.toUpperCase() === 'FX-MODEL',
      );
      if (!modelElement) {
        const generatedModel = document.createElement('FX-model');
        this.appendChild(generatedModel);
        modelElement = generatedModel;
      }
      if (!modelElement.inited) {
        console.log(
          `########## FORE: kick off processing for ... ${window.location.href} ##########`,
        );
        if(this.src){
          console.log('########## FORE: loaded from ... ', this.src, '##########');
        }
        modelElement.modelConstruct();
      }
      this.model = modelElement;
    });
    this.addEventListener('path-mutated', (e) =>{
      console.log('path-mutated event received', e.detail.path, e.detail.index);
      this.someInstanceDataStructureChanged = true;
    });
  }


  addToRefresh(modelItem){
    const found = this.toRefresh.find(mi => mi.path === modelItem.path );
    if(!found){
      this.toRefresh.push(modelItem);
    }
  }

  /**
   * loads a Fore from an URL given by `src`.
   *
   * Will extract the `fx-fore` element from that target file and use and replace current `fx-fore` element with the loaded one.
   * @private
   */
  _loadFromSrc() {
    console.log('########## loading Fore from ',this.src ,'##########');
    fetch(this.src, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'text/html',
      },
    })
        .then(response => {
          const responseContentType = response.headers.get('content-type').toLowerCase();
          console.log('********** responseContentType *********', responseContentType);
          if (responseContentType.startsWith('text/html')) {
            // const htmlResponse = response.text();
            // return new DOMParser().parseFromString(htmlResponse, 'text/html');
            // return response.text();
            return response.text().then(result =>
                // console.log('xml ********', result);
                new DOMParser().parseFromString(result, 'text/html'),
            );
          }
          return 'done';
        })
        .then(data => {
          // const theFore = fxEvaluateXPathToFirstNode('//fx-fore', data.firstElementChild);
          const theFore = data.querySelector('fx-fore');

          // console.log('thefore', theFore)
          if(!theFore){
            this.dispatchEvent(new CustomEvent('error',{detail:{message: `Fore element not found in '${this.src}'. Maybe wrapped within 'template' element?`}}));
          }
          theFore.setAttribute('from-src', this.src);
          this.replaceWith(theFore);
        })
        .catch(error => {
          this.dispatchEvent(new CustomEvent('error',{detail:{message: `'${this.src}' not found or does not contain Fore element.`}}));
        });
  }

  /**
   * refreshes the UI by using IntersectionObserver API. This is the handler being called
   * by the observer whenever elements come into / move out of viewport.
   * @param entries
   * @param observer
   */
  handleIntersect(entries, observer) {
    console.time('refreshLazy');
    entries.forEach(entry => {
      const { target } = entry;

      if (entry.isIntersecting) {
        console.log('in view', entry);
        // console.log('repeat in view entry', entry.target);
        // const target = entry.target;
        // if(target.hasAttribute('refresh-on-view')){
        target.classList.add('loaded');
        // }

        // todo: too restrictive here? what if target is a usual html element? shouldn't it refresh downwards?
        if (typeof target.refresh === 'function') {
          console.log('refreshing target', target);
          target.refresh(target, true);
        } else {
          console.log('refreshing children', target);
          Fore.refreshChildren(target, true);
        }
      }
    });
    entries[0].target.getOwnerForm().dispatchEvent(new CustomEvent('refresh-done'));

    console.timeEnd('refreshLazy');
  }

  evaluateToNodes(xpath, context) {
    return evaluateXPathToNodes(xpath, context, this);
  }

  disconnectedCallback() {
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
   * AVT:
   *
   */
  async refresh(force) {
    // refresh () {
    console.group('### refresh');

    console.time('refresh');

    // ### refresh Fore UI elements
    console.time('refreshChildren');
    console.log('toRefresh',this.toRefresh);

    if(!this.initialRun && this.toRefresh.length !== 0){
      let needsRefresh = false;

      // ### after recalculation the changed modelItems are copied to 'toRefresh' array for processing
      this.toRefresh.forEach(modelItem => {
        // check if modelItem has boundControls - if so, call refresh() for each of them
        const controlsToRefresh = modelItem.boundControls;
        if(controlsToRefresh){
          controlsToRefresh.forEach(ctrl => {
            ctrl.refresh();
          });
        }

        // ### check if other controls depend on current modelItem
        const mainGraph = this.getModel().mainGraph;
        if(mainGraph && mainGraph.hasNode(modelItem.path)){
          const deps = this.getModel().mainGraph.dependentsOf(modelItem.path, false);
          // ### iterate dependant modelItems and refresh all their boundControls
          if(deps.length !== 0){
            deps.forEach(dep => {
              // ### if changed modelItem has a 'facet' path we use the basePath that is the locationPath without facet name
              const basePath = XPathUtil.getBasePath(dep);
              const modelItemOfDep = this.getModel().modelItems.find(mip => mip.path === basePath);
              // ### refresh all boundControls
              modelItemOfDep.boundControls.forEach(control =>{control.refresh()});
            });
            needsRefresh = true;
          }
        }
      });
      this.toRefresh = [];
      if(!needsRefresh){
        console.log('skipping refresh - no dependants');
      }
    }else{
      Fore.refreshChildren(this, true);
      console.timeEnd('refreshChildren');
    }

    // ### refresh template expressions
    if(this.initialRun || this.someInstanceDataStructureChanged){
      this._updateTemplateExpressions();
      this.someInstanceDataStructureChanged = false; //reset
    }
    this._processTemplateExpressions();

    console.timeEnd('refresh');

    console.groupEnd();
    console.log('### <<<<< dispatching refresh-done - end of UI update cycle >>>>>');
    this.dispatchEvent(new CustomEvent('refresh-done'));
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
    // Note the fact we're going over HTML here: therefore the `html` prefix.
    const search =
      "(descendant-or-self::*/(text(), @*))[matches(.,'\\{.*\\}')] except descendant-or-self::fx-model/descendant-or-self::node()/(., @*)";

    const tmplExpressions = evaluateXPathToNodes(search, this, this);
    console.log('template expressions found ', tmplExpressions);

    if (!this.storedTemplateExpressions) {
      this.storedTemplateExpressions = [];
    }

    console.log('######### storedTemplateExpressions', this.storedTemplateExpressions.length);

    /*
        storing expressions and their nodes for re-evaluation
         */
    Array.from(tmplExpressions).forEach(node => {
      if (this.storedTemplateExpressionByNode.has(node)) {
        // If the node is already known, do not process it twice
        return;
      }
      const expr = this._getTemplateExpression(node);

      // console.log('storedTemplateExpressionByNode', this.storedTemplateExpressionByNode);
      this.storedTemplateExpressionByNode.set(node, expr);
    });
    console.log('stored template expressions ', this.storedTemplateExpressionByNode);

    // TODO: Should we clean up nodes that existed but are now gone?
    this._processTemplateExpressions();

  }

  _processTemplateExpressions() {
    for (const node of this.storedTemplateExpressionByNode.keys()) {
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
    this.evaluateTemplateExpression(expr, node, this);
  }

  /**
   * evaluate a template expression (some expression in {} brackets) on a node (either text- or attribute node.
   * @param expr the XPath to evaluate
   * @param node the node which will get updated with evaluation result
   * @param form the form element
   */
  evaluateTemplateExpression(expr, node) {
    if (expr === '{}') return;
    const matches = expr.match(/{[^}]*}/g);
    const namespaceContextNode =
      node.nodeType === node.TEXT_NODE ? node.parentNode : node.ownerElement;
    if (matches) {
      matches.forEach(match => {
        // console.log('match ', match);
        let naked = match.substring(1, match.length - 1);
        const inscope = getInScopeContext(node, naked);
        if (!inscope) {
          const errNode =
            node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ATTRIBUTE_NODE
              ? node.parentNode
              : node;
          console.warn('no inscope context for ', errNode);
          return;
        }
        // Templates are special: they use the namespace configuration from the place where they are
        // being defined
        const instanceId = XPathUtil.getInstanceId(naked);
        // console.log('target instance ', instanceId);
        const inst = this.getModel().getInstance(instanceId);
        try {
          const result = evaluateXPathToString(naked, inscope, node, null, inst);

          // console.log('result of eval ', result);
          const replaced = expr.replaceAll(match, result);
          // console.log('result of replacing ', replaced);

          if (node.nodeType === Node.ATTRIBUTE_NODE) {
            const parent = node.ownerElement;

            // parent.setAttribute(name, replaced);
            parent.setAttribute(node.nodeName, replaced);
          } else if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = replaced;
          }

          if (replaced.includes('{')) {
            // console.log('need to go next round');

            // todo: duplicated code here - see above
            naked = replaced.substring(1, replaced.length);
            this.evaluateTemplateExpression(replaced, node);
          }
        } catch (error) {
          // console.log(error);
          this.dispatchEvent(new CustomEvent('error', { detail: error }));
        }
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  _getTemplateExpression(node) {
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
   * start initing of the UI.
   *
   * @private
   */
  _handleModelConstructDone() {
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
    if (model.instances.length === 0) {
      console.log('### lazy creation of instance');
      const generatedInstance = document.createElement('fx-instance');
      model.appendChild(generatedInstance);

      const generated = document.implementation.createDocument(null, 'data', null);
      // const newData = this._generateInstance(this, generated.firstElementChild);
      this._generateInstance(this, generated.firstElementChild);
      generatedInstance.instanceData = generated;
      model.instances.push(generatedInstance);
      console.log('generatedInstance ', this.getModel().getDefaultInstanceData());
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
        console.log('complex path to create ', ref);
        const steps = ref.split('/');
        steps.forEach(step => {
          console.log('step ', step);

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
    console.log('### _initUI()');

    await this._lazyCreateInstance();

    console.log('registering variables!');
    const variables = new Map();
    (function registerVariables(node) {
      for (const child of node.children) {
        if ('setInScopeVariables' in child) {
          child.setInScopeVariables(variables);
        }
        registerVariables(child);
      }
    })(this);
    console.log('Found variables:', variables);

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.3,
    };

    await this.refresh();
    // this.style.display='block'
    this.classList.add('fx-ready');
    document.body.classList.add('fx-ready');

    this.ready = true;
    this.initialRun = false;
    console.log('### >>>>> dispatching ready >>>>>', this);
    console.log('modelItems: ',this.getModel().modelItems);
    console.log('### <<<<< FORE: form fully initialized...', this);
    // this.dispatchEvent(new CustomEvent('ready', {}));

    this.dispatchEvent(new CustomEvent('ready', {
      composed: true,
      bubbles: false,
      detail: {},
    }));

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
    const { level } = e.detail;
    const msg = e.detail.message;
    this._showMessage(level, msg);
  }

  _displayError(e) {
    // const { error } = e.detail;
    const msg = e.detail.message;
    // this._showMessage('modal', msg);
    const toast = this.shadowRoot.querySelector('#error');
    toast.showToast(msg);
  }

  _showMessage(level, msg) {
    if (level === 'modal') {
      // this.$.messageContent.innerText = msg;
      // this.$.modalMessage.open();

      this.shadowRoot.getElementById('messageContent').innerText = msg;
      // this.shadowRoot.getElementById('modalMessage').open();
      this.shadowRoot.getElementById('modalMessage').classList.add('show');
    } else if (level === 'sticky') {
      // const notification = this.$.modeless;
      this.shadowRoot.querySelector('#sticky').showToast(msg);
    } else {
      const toast = this.shadowRoot.querySelector('#message');
      toast.showToast(msg);
    }
  }
}

customElements.define('fx-fore', FxFore);
