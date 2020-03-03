import {LitElement, html, css} from 'lit-element';

import '../assets/@polymer/paper-dialog/paper-dialog.js';
import '../assets/@polymer/paper-button/paper-button.js';
import '../assets/@polymer/paper-icon-button/paper-icon-button.js';
import '../assets/@polymer/iron-icons/iron-icons.js';
import '../assets/@polymer/iron-icon/iron-icon.js';
import './xf-model.js';

import '../assets/@vaadin/vaadin-notification/vaadin-notification.js';


/**
 * Root element for forms. Kicks off initialization and displays messages.
 */
export class XfForm extends LitElement {

    static get styles() {
        return css`
            :host {
                display: block;
                height:auto;
                padding:var(--model-element-padding);
                font-family:Roboto, sans-serif;
                color:var(--paper-grey-900);
                background:var(--paper-blue-50);
            }
        `;
    }

    static get properties() {
        return {
            /**
             * array of xf-model elements contained in this form
             */
            models:{
                type: Array
            }
        };
    }

    constructor() {
        super();
        this.models = [];
        this.addEventListener('model-construct-done', this._handleModelConstructDone);
        this.addEventListener('message', this._displayMessage);
    }

    render() {
        return html`
            <slot></slot>
            
           <paper-dialog id="modalMessage" modal="true">
                <div id="messageContent"></div>
                <div class="dialogActions">
                    <paper-button dialog-dismiss autofocus>Close</paper-button>
                </div>
           </paper-dialog>          

        `;
    }

/*
    getDefaultModel(){
        if (this.models){
            return this.models[0];
        }
        return null;
    }
*/

    /**
     * kick off from processing...
     *
     * @param _changedProperties
     */
    firstUpdated(_changedProperties) {
        console.log('xf-form: kick off processing...');
        this._init();
    }

    _init(){
        const models = this.querySelectorAll('xf-model');
        this.models = models;
        this._dispatchModelConstruct();
    }

    _dispatchModelConstruct(){
        console.log('dispatching model-construct');
        this.models.forEach(model =>  {
            model.dispatchEvent(new CustomEvent('model-construct', { detail: {model:model}}));
        });
    }

    /**
     * refreshes the whole UI by visiting each bound element (having a 'ref' attribute) and applying the state of
     * the bound modelItem to the bound element.
     */
    refresh () {

        console.group('refresh');
        const boundElements = document.querySelectorAll('[ref]');
        boundElements.forEach(bound => {

            // console.log('refresh bound element ', bound);
            // console.log('refresh bound element ', bound.tagName);
            // console.log('refresh bound element ', bound.closest('xf-model'));


            // ### do NOT process bindings that are part of the model
            const isModel = /** @type (XfModel) */ (bound.closest('xf-model'));
            if(!isModel){
                console.log('refresh bound element ', bound.tagName);
                /** @type (BoundElement) */ (bound).refresh();
            }

        });
        console.groupEnd();

    }

    _handleModelConstructDone(e){
        console.log('modelConstructDone received', e.detail.model.id);
        // console.log('modelConstructDone', e.detail.model);
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
        this.models.forEach(model => {
            //notification event only - not used internally
            model.dispatchEvent(new CustomEvent('ready', { detail: {model:model}}));
        });

        console.log('initUI', this);
        this.refresh();
    }

    _displayMessage(e) {
        const level = e.detail.level;
        const msg = e.detail.message;
        this._showMessage(level,msg);
    }

    _showMessage(level, msg){
        if (level === 'modal') {
            // this.$.messageContent.innerText = msg;
            // this.$.modalMessage.open();

            this.shadowRoot.getElementById('messageContent').innerText = msg;
            this.shadowRoot.getElementById('modalMessage').open();
        } else if (level === 'modeless') {
            // const notification = this.$.modeless;

            const notification = document.createElement('vaadin-notification');
            notification.duration = 0;
            notification.setAttribute('theme', 'error');
            notification.renderer = function (root) {
                console.log('root ', root);

                root.textContent = msg;

                const closeIcon = window.document.createElement('paper-icon-button');
                closeIcon.setAttribute('icon', 'close');
                closeIcon.addEventListener('click', function (e) {
                    console.log(e);
                    notification.close();
                });
                root.appendChild(closeIcon);
            };
            this.appendChild(notification);
            notification.open();

        } else {
            const notification = document.createElement('vaadin-notification');
            notification.renderer = function (root) {
                root.textContent = msg;
            };
            this.appendChild(notification);
            notification.open();
        }

    }




}
customElements.define('xf-form', XfForm);