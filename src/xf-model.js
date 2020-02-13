import {LitElement, html, css} from 'lit-element';

import * as fontoxpath from '../output/fontoxpath.js';

export class XfModel extends LitElement {

    static get styles() {
        return css`
            :host {
                display: block;
                height:auto;
                background:blue;
                padding:10px;
            }
        `;
    }

    static get properties() {
        return {
            id:{
                type: String
            },
            instances:{
                type: Array
            }
        };
    }

    constructor() {
        super();
        this.id='';
        this.instances = [];
    }

    render() {
        return html`
             <slot></slot>
        `;
    }

    firstUpdated(_changedProperties) {
        console.log('MODEL.firstUpdated');
        this.addEventListener('model-construct', this._modelConstruct);
        this.addEventListener('instance-ready', this._callUpdate);
        this.addEventListener('ready', this._ready);

    }

    _modelConstruct(){
        console.log('model-construct received ', this.id);
        const instances = this.querySelectorAll('xf-instance');

        if(instances.length > 0){
            instances.forEach(instance =>  {
                instance.init();
            });
        }else{
            this.dispatchEvent(new CustomEvent('model-construct-done', {composed: true, bubbles: true, detail: {model: this}}));
        }

        this.instances = instances;
    }

    /**
     * update action triggering the update cycle
     */
    updateModel(){
        console.log('updateModel',this.id);

        this.rebuild();
        this.recalculate();
        this.revalidate();
    }

    rebuild(){
        // tbd
        console.log('rebuild');
    }

    recalculate(){
        // tbd
        console.log('recalculate');
    }

    revalidate(){
        // tbd
        console.log('revalidate');

    }

    refresh(){
        // tbd
    }

    _callUpdate(e){

        // fire construct-done only in case we received the event from the last instance meaning all instances are up
        const instances = this.querySelectorAll('xf-instance');
        if(instances.length > 0 ){
            const cnt = instances.length;
            const last = this.querySelectorAll('xf-instance')[cnt-1];

            const targetInstance = document.getElementById(e.detail.id);
            if(targetInstance === last){
                console.log('last instance fired ', last.id);
                this.updateModel();
                this.dispatchEvent(new CustomEvent('model-construct-done', {composed: true, bubbles: true, detail: {model: this}}));
            }
        }else{
            // there are no instances at model construction time
            this.dispatchEvent(new CustomEvent('model-construct-done', {composed: true, bubbles: true, detail: {model: this}}));
        }

    }

    _ready(e){
        console.log('model is ready');
    }

}
customElements.define('xf-model', XfModel);