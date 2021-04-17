import { XPathUtil } from './xpath-util.js';
import { FxModel } from './fx-model.js';
import { Fore } from './fore.js';
import { evaluateXPathToFirstNode } from './xpath-evaluation.js';

// export class ForeElement extends LitElement {
export const foreElementMixin = superclass =>
  class ForeElementMixin extends superclass {
    static get properties() {
      return {
        model: {
          type: Object,
        },
        ref: {
          type: String,
        },
        modelItem: {
          type: Object,
        },
        repeated: {
          type: Boolean,
        },
      };
    }

    constructor() {
      super();
      this.model = null;
      this.modelItem = {};
      this.ref = this.hasAttribute('ref')?this.getAttribute('ref'):'';
      this.repeated = false;
    }

    getModel() {
      // console.log('getModel this ', this);
      if (this.model) {
        return this.model;
      }
      // const ownerForm = this.closest('fx-form');
      const ownerForm = this.getOwnerForm(this);
      return ownerForm.querySelector('fx-model');
    }

    getOwnerForm() {
      let currentElement = this;
      while (currentElement && currentElement.parentNode) {
        // console.log('current ', currentElement);

        if (currentElement.nodeName.toUpperCase() === 'FX-FORM') {
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
      const inscopeContext = this._inScopeContext();

      if (this.ref === '') {
        this.nodeset = inscopeContext;
      } else if (Array.isArray(inscopeContext)) {
        inscopeContext.forEach(n => {
          if (XPathUtil.isSelfReference(this.ref)) {
            this.nodeset = inscopeContext;
          } else {
            const localResult = evaluateXPathToFirstNode(this.ref, n, null, {
              namespaceResolver: this.namespaceResolver,
            });
            // console.log('local result: ', localResult);
            this.nodeset.push(localResult);
          }
        });
      } else {
        // this.nodeset = fx.evaluateXPathToFirstNode(this.ref, inscopeContext, null, {namespaceResolver: this.namespaceResolver});

        // todo: code below fails - why?
        const formElement = this.closest('fx-form');
        this.nodeset = evaluateXPathToFirstNode(
          this.ref,
          inscopeContext,
          formElement,
          Fore.namespaceResolver,
        );
        // this.nodeset = Fore.evaluateXPath(this.ref,inscopeContext,formElement,Fore.namespaceResolver)
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

    _inScopeContext() {
      let resultNodeset;

      // console.log('this ', this);
      // console.log('this ', this.parentNode);

      /*
        if(this.nodeName.toUpperCase() === 'fx-REPEATITEM'){
            const index = this.index;
            console.log('>>>>>>>>>>< index ', index);
            return this.parentNode.host.nodeset[this.index -1];
        }
*/
      /*
        if(this.repeated){
            const parentItem = this.parentNode.closest('fx-repeatitem');
            return parentItem.nodeset;
        }
*/
      const repeatItem = this.parentNode.closest('fx-repeatitem');
      if (repeatItem) {
        return repeatItem.nodeset;
      }

      /*

        let parentBind;
        if(this.parentNode.host){
            parentBind = this.parentNode.host;
        }else{
            parentBind = this.parentNode.closest('[ref]');
        }
        // const parentBind = this.parentNode.closest('[ref]');
        // console.log('parentBind ', parentBind);
*/

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

      // console.log('_inScopeContext ', resultNodeset);
      // todo: no support for xforms 'context' yet - see https://github.com/betterFORM/betterFORM/blob/02fd3ec595fa275589185658f3011a2e2e826f4d/core/src/main/java/de/betterform/xml/xforms/XFormsElement.java#L451
      return resultNodeset;
    }
  };
