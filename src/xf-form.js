import {LitElement, html, css} from 'lit-element';

import * as fontoxpath from '../output/fontoxpath.js';

export class XfForm extends LitElement {

    static get styles() {
        return css`
            :host {
                display: block;
                height:auto;
                background:red;
                padding:10px;
            }
            div{
                background:red;
            }
        `;
    }

    static get properties() {
        return {
            prop1:{
                type:String
            },
            models:{
                type: Array
            }
        };
    }

    constructor() {
        super();
        this.prop1 = "eeyyyy!"
        this.models = [];
    }

    render() {
        return html`
            <slot></slot>
        `;
    }

    firstUpdated(_changedProperties) {
        console.log('kick off processing...');

        this.addEventListener('model-construct-done', this._handleModelConstructDone);
        // this.addEventListener('ready', this.initUI);

        /*
        form processing starts here when all components have be loaded and instanciated by calling the `update`
        function.
         */
        window.addEventListener('WebComponentsReady', () => {
            console.log('### ----------- WebComponentsReady ----------- ###');
            this._init();
        });



        // this._init();

    }

    _init(){
        // wait for children to be ready
        const models = this.querySelectorAll('xf-model');
        this.models = models;
        this._dispatchModelConstruct();
    }


    _dispatchModelConstruct(){
        console.log('model-construct');
        this.models.forEach(model =>  {
            model.dispatchEvent(new CustomEvent('model-construct', {composed: true, bubbles: true, detail: {}}));
            // console.log('models update complete');
        });
    }

    _handleModelConstructDone(e){
        console.log('modelConstructDone', e.detail.model);
        // console.log('modelConstructDone', e.detail.model.id);
        // console.log('modelConstructDone', this.models);
        // console.log('modelConstructDone', this.models.length);

        // const models = this.querySelectorAll('xf-model');

        if(this.models.length > 0 ){
            // const cnt = this.models.length;
            // const last = this.querySelectorAll('xf-model')[cnt-1];
            const last = this.models[this.models.length-1];
            // console.log('last ', last);

            const targetModel = document.getElementById(e.detail.model.id);
            // console.log('targetModel', targetModel);

            if(targetModel === last){
                this.initUI();
            }
        }else{
            // there are no instances at model construction time
            this.initUI();
        }

    }

    initUI(){
        console.log('initUI', this);
        // console.log('initUI', e.detail.model);

        // e.detail.model.dispatchEvent(new CustomEvent('ready', {composed: true, bubbles: true, detail: {}}));
        this.models.forEach(model => {
            model.dispatchEvent(new CustomEvent('ready', {composed: true, bubbles: true, detail: {}}));
        });


    }

}
customElements.define('xf-form', XfForm);