// import { FxAction } from './fx-action.js';
import '../fx-model.js';
import {AbstractAction} from "./abstract-action.js";

/**
 * `fx-setvalue`
 *
 * @customElement
 */
export default class FxSetvalue extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      ref: {
        type: String,
      },
      value: {
        type: String,
      },
    };
  }

  constructor() {
    super();
    this.ref = '';
    this.value = '';
  }

  connectedCallback() {
    console.log('connectedCallback ', this);
    super.connectedCallback();
    if (this.hasAttribute('ref')) {
      this.ref = this.getAttribute('ref');
    } else {
      throw new Error('fx-setvalue must specify a "ref" attribute');
    }
    this.value = this.getAttribute('value');
  }

  perform() {
    super.perform();
    let { value } = this;
    if (this.value !== null) {
      value = this.value;
    } else if (this.textContent !== '') {
      value = this.textContent;
    } else {
      value = '';
    }
    const mi = this.getModelItem();
    this.setValue(mi, value);

  }

/*
  execute(e) {
    super.execute(e);
    if(!this.ifCondition) return ;
    // this.setValue(this.modelItem, this.value);

    let { value } = this;
    if (this.value !== null) {
      value = this.value;
    } else if (this.textContent !== '') {
      value = this.textContent;
    } else {
      value = '';
    }
    this.setValue(this.getModelItem(), value);
    this.actionPerformed();

    // return true;
    /!*
                const repeated = this.closest('fx-repeat-item');

                const path = this.ownerForm.resolveBinding(this);
                console.log('### fx-setvalue path ', path);


                if(repeated){
                    const item = repeated.modelItem;
                    const target = this.ownerForm.findById(item,this.bind);
                    target.value = this.value;
                    this.dispatchEvent(new CustomEvent('value-changed', {
                        composed: true,
                        bubbles: true,
                        detail: {'modelItem': target,"path":path,"target":this}
                    }));

                }else{
                    this.modelItem.value = this.value;
                    this.dispatchEvent(new CustomEvent('value-changed', {
                        composed: true,
                        bubbles: true,
                        detail: {'modelItem': this.modelItem,"path":path,"target":this}
                    }));
                }
        *!/

    // super.execute();
  }
*/

  setValue(modelItem, newVal) {
    console.log('setvalue[1]  ', modelItem, newVal);

    const item = modelItem;
    if (!item) return;

    if (item.value !== newVal) {
      item.value = newVal;
      item.changed = true;

      // this.needsRebuild = false;
      // this.needsRecalculate = true;
      // this.needsRevalidate = true;
      // this.needsRefresh = true;

      this.needsUpdate = true;

      console.log('setvalue[2] ', item, newVal);
    }
    // this.setAttribute('value', modelItem.value);
  }
}

window.customElements.define('fx-setvalue', FxSetvalue);
