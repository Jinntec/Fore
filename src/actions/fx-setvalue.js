import { FxAction } from './fx-action.js';

import '../fx-model.js';

/**
 * `fx-setvalue`
 *
 * @customElement
 */
export default class FxSetvalue extends FxAction {
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
    // console.log('connectedCallback ', this);
    if (this.hasAttribute('ref')) {
      this.ref = this.getAttribute('ref');
    } else {
      throw new Error('fx-setvalue must specify a "ref" attribute');
    }
    this.value = this.getAttribute('value');
  }

  execute() {
    super.execute();
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

    /*
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
        */

    // super.execute();
  }

  setValue(modelItem, newVal) {
    console.log('setvalue[1]  ', modelItem, newVal);

    if (!modelItem) return;

    if (modelItem.value !== newVal) {
      modelItem.value = newVal;
      modelItem.changed = true;

      this.needsRebuild = false;
      this.needsRecalculate = true;
      this.needsRevalidate = true;
      this.needsRefresh = true;
      console.log('setvalue[2] ', modelItem, newVal);
      this.actionPerformed();
    }
    // this.setAttribute('value', modelItem.value);
  }
}

window.customElements.define('fx-setvalue', FxSetvalue);
