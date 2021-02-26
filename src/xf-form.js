import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-icon/iron-icon.js';

import {Fore} from './fore.js';
import './xf-model.js';
import './xf-instance.js';

import '@vaadin/vaadin-notification/vaadin-notification.js';

/**
 * Root element for forms. Kicks off initialization and displays messages.
 *
 * xf-form is the outermost container for each form. A form can have exactly one model
 * with arbitrary number of instances.
 *
 * Main responsiblities are initialization of model, update of UI (refresh) and global messaging
 *
 * This element uses LitElement as it uses shadowDOM to tempate global message dialogs
 */
export class XfForm extends HTMLElement {


    static get properties() {
        return {
            model:{
                type: Object
            },
            ready:{
                type:Boolean
            }
        };
    }

    constructor() {
        super();
        this.model = {};
        this.addEventListener('model-construct-done', this._handleModelConstructDone);
        this.addEventListener('message', this._displayMessage);
        this.addEventListener('error', this._displayError);
        window.addEventListener('compute-exception', e =>{
            console.error("circular dependency: ", e);
        });

        this.ready = false;

        const style = `
            :host {
                display: block;
                height:auto;
                padding:var(--model-element-padding);
                font-family:Roboto, sans-serif;
                color:var(--paper-grey-900);
            }
            :host ::slotted(xf-model){
                display:none;
            }
            #modalMessage .dialogActions{
                text-align:center;
            }
        `;

        const html = `
           <slot></slot>
           <paper-dialog id="modalMessage" modal="true">
                <div id="messageContent"></div>
                <div class="dialogActions">
                    <paper-button dialog-dismiss autofocus>Close</paper-button>
                </div>
           </paper-dialog>
        `;

        this.attachShadow({mode:'open'});
        this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${html}
        `;

        const slot = this.shadowRoot.querySelector('slot');
        slot.addEventListener('slotchange', (event) => {
            const children = event.target.assignedElements();
            let model = children.find(model => model.nodeName.toUpperCase() === 'XF-MODEL');
            if(!model){
                const generatedModel = document.createElement('xf-model');
                this.appendChild(generatedModel);
                model=generatedModel;
            }
            if(!model.inited){
                console.log('########## FORE: kick off processing... ##########');
                model.modelConstruct();
            }
            this.model = model;
        });

    }

    connectedCallback() {
        // super.connectedCallback();
        // console.log('connectedCallback ', this);
        // console.log('########## FORE: kick off processing... ##########');
        // window.addEventListener('compute-exception', e =>{
        //     console.error("circular dependency: ", e);
        // });
        // this.init();

    }

    /**
     * refreshes the whole UI by visiting each bound element (having a 'ref' attribute) and applying the state of
     * the bound modelItem to the bound element.
     */
    async refresh () {
    // refresh () {
        console.group('### refresh');
        const uiElements = this.querySelectorAll('*');
        // await this.updateComplete;
        Fore.refreshChildren(this);
        // this.dispatchEvent(new CustomEvent('refresh-done', {detail:'foo'}));
        console.groupEnd();
        console.log('### <<<<< dispatching refresh-done - end of UI update cycle >>>>>');
        this.dispatchEvent(new CustomEvent('refresh-done'));
    }

    _refreshChildren(){
        const uiElements = this.querySelectorAll('*');

        uiElements.forEach(element => {

            if (Fore.isUiElement(element.nodeName) && typeof element.refresh === 'function') {
                element.refresh();
            }

        });

    }

    _handleModelConstructDone(e){
        this._initUI();
    }

    async _lazyCreateInstance(){
        const model = this.querySelector('xf-model');
        if(model.instances.length === 0){
            console.log('### lazy creation of instance');
            const generatedInstance = document.createElement('xf-instance');
            model.appendChild(generatedInstance);

            const generated = document.implementation.createDocument(null, "data");
            const newData = this._generateInstance(this, generated.firstElementChild);
            generatedInstance.instanceData = generated;
            model.instances.push(generatedInstance);
        }
    }

    /**
     * @param {Element} start
     * @param {Element} parent
     */
    _generateInstance(start, parent){

        if(start.hasAttribute('ref')){
            const ref = start.getAttribute('ref');
            // const generated = document.createElement(ref);
            const generated = parent.ownerDocument.createElement(ref);
            if(start.children.length === 0){
                generated.textContent = start.textContent;
            }
            parent.appendChild(generated);
            parent=generated;
        }

        if(start.hasChildNodes()){
            const list = start.children;
            for(let i=0; i < list.length; i++){
                this._generateInstance(list[i],parent)
            }
        }
        return parent;
    }



     async _initUI(){
        console.log('### _initUI()');

         await this._lazyCreateInstance();
         await this.refresh();
         this.ready = true;
         console.log('### <<<<< dispatching ready >>>>>');
         console.log('########## FORE: form fully initialized... ##########');
         this.dispatchEvent(new CustomEvent('ready', {}));
     }

    _displayMessage(e) {
        const {level} = e.detail;
        const msg = e.detail.message;
        this._showMessage(level,msg);
    }

    _displayError(e){
        const {error} = e.detail;
        const msg = e.detail.message;
        this._showMessage('modal',msg);
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
                // console.log('root ', root);

                root.textContent = msg;

                const closeIcon = window.document.createElement('paper-icon-button');
                closeIcon.setAttribute('icon', 'close');
                closeIcon.addEventListener('click', (e) => {
                    // console.log(e);
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