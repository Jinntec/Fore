import { XPathUtil } from './xpath-util.js';
import { FxModel } from './fx-model.js';
import {
  evaluateXPath,
  evaluateXPathToFirstNode,
  evaluateXPathToString,
} from './xpath-evaluation.js';
import getInScopeContext from './getInScopeContext.js';

export const foreElementMixin = superclass =>
  class ForeElementMixin extends superclass {
    static get properties() {
      return {
        /**
         * context object for evaluation
         */
        context: {
          type: Object,
        },
        /**
         * the model of this element
         */
        model: {
          type: Object,
        },
        /**
         * The modelitem object associated to the bound node holding the evaluated state.
         */
        modelItem: {
          type: Object,
        },
        /**
         * the node(s) bound by this element
         */
        nodeset: {
          type: Object,
        },
        /**
         * XPath binding expression pointing to bound node
         */
        ref: {
          type: String,
        },
      };
    }

    constructor() {
      super();
      this.context = null;
      this.model = null;
      this.modelItem = {};
      this.ref = this.hasAttribute('ref') ? this.getAttribute('ref') : '';
    }

    getModel() {
      // console.log('getModel this ', this);
      if (this.model) {
        return this.model;
      }
      // const ownerForm = this.closest('fx-fore');
      // const ownerForm = this.getOwnerForm(this);
      const ownerForm = this.getOwnerForm();
      return ownerForm.querySelector('fx-model');
    }

    /**
     *
     * @returns {{parentNode}|ForeElementMixin}
     */
    getOwnerForm() {
      let currentElement = this;
      while (currentElement && currentElement.parentNode) {
        // console.log('current ', currentElement);

        if (currentElement.nodeName.toUpperCase() === 'FX-FORE') {
          return currentElement;
        }

        if (currentElement.parentNode instanceof DocumentFragment) {
          currentElement = currentElement.parentNode.host;
        } else {
          currentElement = currentElement.parentNode;
        }
      }
      return currentElement;
    }

    /**
     * evaluation of fx-bind and UiElements differ in details so that each class needs it's own implementation.
     */
    evalInContext() {
      // const inscopeContext = this.getInScopeContext();
      const inscopeContext = getInScopeContext(this, this.ref);
      if (!inscopeContext) {
        console.warn('no inscopeContext for ', this);
        return;
      }
      if (this.ref === '') {
        this.nodeset = inscopeContext;
      } else if (Array.isArray(inscopeContext)) {
        inscopeContext.forEach(n => {
          if (XPathUtil.isSelfReference(this.ref)) {
            this.nodeset = inscopeContext;
          } else {
            const localResult = evaluateXPathToFirstNode(this.ref, n, this);
            // console.log('local result: ', localResult);
            this.nodeset.push(localResult);
          }
        });
      } else {
        // this.nodeset = fx.evaluateXPathToFirstNode(this.ref, inscopeContext, null, {namespaceResolver: this.namespaceResolver});

        // todo: code below fails - why?
        const formElement = this.getOwnerForm();
        if (inscopeContext.nodeType) {
          this.nodeset = evaluateXPathToFirstNode(this.ref, inscopeContext, this);
        } else {
          this.nodeset = evaluateXPath(this.ref, inscopeContext, this);
        }
        // this.nodeset = evaluateXPath(this.ref,inscopeContext,formElement)
      }
      // console.log('UiElement evaluated to nodeset: ', this.nodeset);
    }

    isNotBound() {
      return !this.hasAttribute('ref');
    }

    isBound() {
      return this.hasAttribute('ref');
    }

    getBindingExpr() {
      if (this.hasAttribute('ref')) {
        return this.getAttribute('ref');
      }
      // try to get closest parent bind
      const parent = this.parentNode.closest('[ref]');
      if (!parent) {
        return 'instance()'; // the default instance
      }
      return parent.getAttribute('ref');
    }

    getInstance() {
      if (this.ref.startsWith('instance(')) {
        const instId = XPathUtil.getInstanceId(this.ref);
        return this.getModel().getInstance(instId);
      }
      return this.getModel().getInstance('default');
    }

    _getParentBindingElement(start) {
      if (start.parentNode.host) {
        const { host } = start.parentNode;
        if (host.hasAttribute('ref')) {
          return host;
        }
      } else if (start.parentNode) {
        if (start.parentNode.hasAttribute('ref')) {
          return this.parentNode;
        }
        this._getParentBindingElement(this.parentNode);
      }
      return null;
    }

    getModelItem() {
      // return this.model.bindingMap.find(m => m.refnode === this.nodeset);
      // return this.getModel().bindingMap.find(m => m.refnode === this.nodeset);

      const mi = this.getModel().getModelItem(this.nodeset);
      if (mi) {
        this.modelItem = mi;
      }

      const repeated = this.closest('fx-repeatitem');
      let existed;
      if (repeated) {
        const { index } = this.closest('fx-repeatitem');
        if (Array.isArray(this.nodeset)) {
          existed = this.getModel().getModelItem(this.nodeset[index - 1]);
        } else {
          existed = this.getModel().getModelItem(this.nodeset);
        }
      } else {
        existed = this.getModel().getModelItem(this.nodeset);
      }

      if (!existed) {
        return FxModel.lazyCreateModelItem(this.getModel(), this.ref, this.nodeset);
      }
      return existed;
    }

    /**
     * Returns the effective value for the element.
     * a: look for 'value' attribute and if present evaluate it and return the resulting value
     * b: look for textContent and return the value if present
     * c: return null
     */
    getValue() {
      if (this.hasAttribute('value')) {
        const valAttr = this.getAttribute('value');
        try {
          const inscopeContext = getInScopeContext(this, valAttr);
          return evaluateXPathToString(valAttr, inscopeContext, this.getOwnerForm());
        } catch (error) {
          console.error(error);
          this.dispatch('error', { message: error });
        }
      }
      if (this.textContent) {
        return this.textContent;
      }
      return null;
    }

    getInScopeContext() {
      return getInScopeContext(this, this.ref);
    }

    dispatch(eventName, detail) {
      const event = new CustomEvent(eventName, {
        composed: true,
        bubbles: true,
        detail,
      });
      // console.log('firing', event);
      this.dispatchEvent(event);
    }
  };
