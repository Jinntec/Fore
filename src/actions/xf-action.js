import {LitElement, html} from 'lit-element';

import {BoundElement} from "../BoundElement";
import "../xf-form.js";
import "../xf-model.js";


/**
 * `xf-action`
 * a button triggering Fore actions
 *
 * @customElement
 * @demo demo/index.html
 */
export class XfAction extends BoundElement{

    static get properties() {
        return {
            ...super.properties,
            needsRebuild:{
                type:Boolean
            },
            needsRecalculate:{
                type:Boolean
            },
            needsRevalidate:{
                type:Boolean
            },
            needsRefresh:{
                type:Boolean
            }
        };
    }

    // eslint-disable-next-line no-useless-constructor
    constructor(){
        super();
        this.model={};
        this.needsRebuild = false;
        this.needsRecalculate = false;
        this.needsRevalidate = false;
        this.needsRefresh = false;
    }

    execute (){
        if(this.getBindingExpr()){
            this.nodeset = this.evalBinding();
        }
    }

    actionPerformed(){
        if(this.needsRebuild){
            this.model.rebuild();
        }
        if(this.needsRecalculate){
            this.model.recalculate();
        }
        if(this.needsRevalidate){
            this.model.revalidate();
        }
        if(this.needsRefresh){
            this.closest('xf-form').refresh();
        }
    }


    dispatchActionPerformed(){
        this.dispatchEvent(new CustomEvent('action-performed', {composed: true, bubbles: true, detail: {}}));
    }
}

window.customElements.define('xf-action', XfAction);
