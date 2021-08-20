import { XPathUtil } from './xpath-util.js';
import { FxModel } from './fx-model.js';
import { evaluateXPath, evaluateXPathToFirstNode } from './xpath-evaluation.js';
import getInScopeContext from './getInScopeContext.js';

export const foreElementMixin = superclass =>
  class ForeElementMixin extends superclass {
    static get properties() {
      return {
        context:{
          type: Object
        },
        model: {
          type: Object,
        },
        ref: {
          type: String,
        },
        modelItem: {
          type: Object,
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
      // todo: should be replaced with Fore.getInScopeContext
      // const inscopeContext = this.getInScopeContext();
      const inscopeContext = getInScopeContext(this, this.ref);

      if (this.ref === '') {
        this.nodeset = inscopeContext;
      } else if (Array.isArray(inscopeContext)) {
        inscopeContext.forEach(n => {
          if (XPathUtil.isSelfReference(this.ref)) {
            this.nodeset = inscopeContext;
          } else {
            const localResult = evaluateXPathToFirstNode(this.ref, n, null);
            // console.log('local result: ', localResult);
            this.nodeset.push(localResult);
          }
        });
      } else {
        // this.nodeset = fx.evaluateXPathToFirstNode(this.ref, inscopeContext, null, {namespaceResolver: this.namespaceResolver});

        // todo: code below fails - why?
        const formElement = this.getOwnerForm();
        if (inscopeContext.nodeType) {
          this.nodeset = evaluateXPathToFirstNode(this.ref, inscopeContext, formElement);
        } else {
          this.nodeset = evaluateXPath(this.ref, inscopeContext, formElement);
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
      /*
        if(this.modelItem.node instanceof Node){
            // console.log('modelItem is already initialized ', this.modelItem);
            return this.modelItem;
        }
*/

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

    getInScopeContext() {
      let resultNodeset;

      const repeatItem = this.parentNode.closest('fx-repeatitem');
      if (repeatItem) {
        return repeatItem.nodeset;
      }

      const parentBind = this.parentNode.closest('[ref]');

      if (parentBind !== null) {
        resultNodeset = parentBind.nodeset;
      } else if (XPathUtil.isAbsolutePath(this.ref)) {
        const instanceId = XPathUtil.getInstanceId(this.ref);
        resultNodeset = this.getModel()
          .getInstance(instanceId)
          .getDefaultContext();
      } else if (this.getModel().getDefaultInstance() !== null) {
        resultNodeset = this.getModel()
          .getDefaultInstance()
          .getDefaultContext();
      } else {
        return [];
      }

      // console.log('getInScopeContext ', resultNodeset);
      // todo: no support for xforms 'context' yet - see https://github.com/betterFORM/betterFORM/blob/02fd3ec595fa275589185658f3011a2e2e826f4d/core/src/main/java/de/betterform/xml/xforms/XFormsElement.java#L451
      return resultNodeset;
    }
  };
