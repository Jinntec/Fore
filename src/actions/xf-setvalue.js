import {XfAction} from './xf-action.js';

import "../xf-model.js";

/**
 * `xf-setvalue`
 *
 * @customElement
 * @polymer
 */
export default class XfSetvalue extends XfAction {

    static get properties() {
        return {
            ...super.properties,
            value: {
                type: String
            }
        };
    }

    constructor(){
        super();
    }

    execute() {
        super.execute();

        const modelItem = this.getModelItem();
        this.setValue(modelItem,this.value);

/*
        const newVal = this.value;
        console.log('setvalue nodeset ', this.nodeset, this.value);
        this.nodeset.textContent = newVal;
        console.log('setvalue nodeset ', this.nodeset);
        console.log('setvalue modelItem ', this.getModelItem());

        // this.doRebuild(true);
        // this.doRecalculate(true);
        // this.doRevalidate(true);
        // this.doRefresh(true);
        this.needsRebuild = true;
        this.needsRecalculate = true;
        this.needsRevalidate = true;
        this.needsRefresh = true;
        this.actionPerformed();
*/

        /*
                const repeated = this.closest('xf-repeat-item');

                const path = this.ownerForm.resolveBinding(this);
                console.log('### xf-setvalue path ', path);


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

    setValue(modelItem, newVal){
        // console.log('setvalue nodeset ', this.nodeset, this.value);

        if(modelItem.value !== newVal){
            modelItem.value = newVal;

            this.needsRebuild = true;
            this.needsRecalculate = true;
            this.needsRevalidate = true;
            this.needsRefresh = true;
            this.actionPerformed();
        }

/*
        if(node.textContent !== newVal) {
            node.textContent = newVal;
            // console.log('setvalue nodeset ', this.nodeset);
            // console.log('setvalue modelItem ', this.getModelItem());

            this.needsRebuild = true;
            this.needsRecalculate = true;
            this.needsRevalidate = true;
            this.needsRefresh = true;
            this.actionPerformed();
        }
*/

    }

}

window.customElements.define('xf-setvalue', XfSetvalue);
