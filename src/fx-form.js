import { Fore } from './fore.js';
import './fx-instance.js';
import './fx-model.js';
import '@jinntec/jinn-toast';
import { evaluateXPathToNodes, evaluateTemplateExpression } from './xpath-evaluation.js';

function close() {
  document.getElementById('modalMessage').classList.remove('show');
}
/**
 * Root element for forms. Kicks off initialization and displays messages.
 *
 * fx-form is the outermost container for each form. A form can have exactly one model
 * with arbitrary number of instances.
 *
 * Main responsiblities are initialization of model, update of UI (refresh) and global messaging
 *
 * @ts-check
 */
export class FxForm extends HTMLElement {
  static get properties() {
    return {
      model: {
        type: Object,
      },
      ready: {
        type: Boolean,
      },
    };
  }

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

    const style = `
            :host {
                display: block;
                height:auto;
                padding:var(--model-element-padding);
                font-family:Roboto, sans-serif;
                color:var(--paper-grey-900);
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


        `;

    const html = `
           <jinn-toast id="message" gravity="bottom" position="left"></jinn-toast>
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
  }

  connectedCallback() {
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
        console.log('########## FORE: kick off processing... ##########');
        modelElement.modelConstruct();
      }
      this.model = modelElement;
    });
  }

  evaluateToNodes(xpath, context) {
    return evaluateXPathToNodes(xpath, context, this);
  }

  disconnectedCallback() {}

  /**
   * refreshes the whole UI by visiting each bound element (having a 'ref' attribute) and applying the state of
   * the bound modelItem to the bound element.
   *
   *
   * AVT:
   *
   */
  async refresh() {
    // refresh () {
    console.group('### refresh');
    // await this.updateComplete;

    Fore.refreshChildren(this);
    // this.dispatchEvent(new CustomEvent('refresh-done', {detail:'foo'}));

    // ### refresh template expressions
    this._updateTemplateExpressions();

    console.groupEnd();
    console.log('### <<<<< dispatching refresh-done - end of UI update cycle >>>>>');
    this.dispatchEvent(new CustomEvent('refresh-done'));
  }

  /**
   * entry point for processing of template expression enclosed in '{}' brackets.
   *
   * Expressions are found with an XPath search. For each node an entry is added to storedTemplateExpressions array.
   *
   *
   * @private
   */
  _updateTemplateExpressions() {
    // Note the fact we're going over HTML here: therefore the `html` prefix.
    const search =
      "(descendant-or-self::*/(text(), @*))[matches(.,'\\{.*\\}')] except descendant-or-self::xhtml:fx-model/descendant-or-self::node()/(., @*)";

    const tmplExpressions = evaluateXPathToNodes(search, this, null);
    console.log('template expressions found ', tmplExpressions);

    if (!this.storedTemplateExpressions) {
      this.storedTemplateExpressions = [];
    }

    /*
        storing expressions and their nodes for re-evaluation
         */
    Array.from(tmplExpressions).forEach(node => {
      const expr = this._getTemplateExpression(node);
      this.storedTemplateExpressions.push({
        expr,
        node,
      });
    });

    this.storedTemplateExpressions.forEach(tmpl => {
      this._processTemplateExpression(tmpl);
    });

    console.log('stored template expressions ', this.storedTemplateExpressions);
  }

  // eslint-disable-next-line class-methods-use-this
  _processTemplateExpression(exprObj) {
    console.log('processing template expression ', exprObj);

    const { expr } = exprObj;
    const { node } = exprObj;
    // console.log('expr ', expr);
    evaluateTemplateExpression(expr, node, this);
  }

  // eslint-disable-next-line class-methods-use-this
  _getTemplateExpression(node) {
    if (node.nodeType === Node.ATTRIBUTE_NODE) {
      return node.value;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    return null;
  }

  _refreshChildren() {
    const uiElements = this.querySelectorAll('*');

    uiElements.forEach(element => {
      if (Fore.isUiElement(element.nodeName) && typeof element.refresh === 'function') {
        element.refresh();
      }
    });
  }

  _handleModelConstructDone() {
    this._initUI();
  }

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

  async _initUI() {
    console.log('### _initUI()');

    await this._lazyCreateInstance();
    await this.refresh();
    this.ready = true;
    console.log('### <<<<< dispatching ready >>>>>');
    console.log('########## modelItems: ', this.getModel().modelItems);
    console.log('########## FORE: form fully initialized... ##########');
    this.dispatchEvent(new CustomEvent('ready', {}));
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
    this._showMessage('modal', msg);
  }

  _showMessage(level, msg) {
    if (level === 'modal') {
      // this.$.messageContent.innerText = msg;
      // this.$.modalMessage.open();

      this.shadowRoot.getElementById('messageContent').innerText = msg;
      // this.shadowRoot.getElementById('modalMessage').open();
      this.shadowRoot.getElementById('modalMessage').classList.add('show');
    } else if (level === 'modeless') {
      // const notification = this.$.modeless;
      this.shadowRoot.querySelector('#message').showToast(msg);
    } else {
      const toast = this.shadowRoot.querySelector('#message');
      toast.showToast(msg);
    }
  }
}

customElements.define('fx-form', FxForm);
