// import "../xf-form.js";
import "../xf-model.js";

import { foreElementMixin } from "../ForeElementMixin.js";

/**
 * `xf-action`
 * a button triggering Fore actions
 *
 * @customElement
 * @demo demo/index.html
 */
export class XfAction extends foreElementMixin(HTMLElement){

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
        this.needsRebuild = false;
        this.needsRecalculate = false;
        this.needsRevalidate = false;
        this.needsRefresh = false;
    }

    execute (){
        if(this.isBound()){
            this.evalInContext();
        }
    }

    actionPerformed(){
        if(this.needsRebuild){
            // @ts-ignore
            this.getModel().rebuild();
        }
        if(this.needsRecalculate){
            // @ts-ignore
            this.getModel().recalculate();
        }
        if(this.needsRevalidate){
            // @ts-ignore
            this.getModel().revalidate();
        }
        if(this.needsRefresh){
            // this.closest('xf-form').refresh();
            // @ts-ignore
            document.querySelector('xf-form').refresh();
        }
    }


    dispatchActionPerformed(){
        this.dispatchEvent(new CustomEvent('action-performed', {composed: true, bubbles: true, detail: {}}));
    }
}

window.customElements.define('xf-action', XfAction);
