import {LitElement, html, css} from 'lit-element';

import '../assets/@polymer/paper-dialog/paper-dialog.js';
import '../assets/@polymer/paper-button/paper-button.js';
import '../assets/@polymer/paper-icon-button/paper-icon-button.js';
import '../assets/@polymer/iron-icons/iron-icons.js';
import '../assets/@polymer/iron-icon/iron-icon.js';

// import {registerCustomXPathFunction} from 'fontoxpath';
import {Fore} from './fore.js';

// model classes
import './xf-model.js';
import './xf-instance.js';
import './xf-bind.js';
// import './xf-submission.js';

// ui classes
import './ui/xf-group.js';
import './ui/xf-button.js';
import './ui/xf-output.js';
import './ui/xf-input.js';
import './ui/xf-hint.js';
import './ui/xf-alert.js';

// action classes
/*
import './actions/xf-action.js';
import './deprecated/xf-message.js';
import './actions/xf-append.js';
import './actions/xf-delete.js';
import "./actions/xf-setvalue.js";
*/

import '../assets/@vaadin/vaadin-notification/vaadin-notification.js';

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
            :host ::slotted(xf-model){
                display:none;
            }
        `;
    }

    static get properties() {
        return {
            model:{
                type: Object
            },
            /**
             * array of xf-model elements contained in this form
             */
            models:{
                type: Array
            },
            ready:{
                type:Boolean
            }
        };
    }

    constructor() {
        super();
        this.model = {};
        this.models = [];
        this.addEventListener('model-construct-done', this._handleModelConstructDone);
        this.addEventListener('message', this._displayMessage);
        this.addEventListener('error', this._displayError);
        this.ready = false;
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

    /**
     * kick off from processing...
     *
     * @param _changedProperties
     */
    firstUpdated(_changedProperties) {
        console.log('########## FORE: kick off processing... ##########');
        window.addEventListener('compute-exception', e =>{
            console.error("circular dependency: ", e);
        });
        this.init();
    }

    init(){
        this.model = this.querySelector('xf-model');
        if(!this.model){
            const generatedModel = document.createElement('xf-model');
            this.appendChild(generatedModel);
            this.model=generatedModel;
        }
        this.model.modelConstruct();
    }

    /**
     * refreshes the whole UI by visiting each bound element (having a 'ref' attribute) and applying the state of
     * the bound modelItem to the bound element.
     */
    async refresh () {
        console.group('### refresh');
        const uiElements = this.querySelectorAll('*');
        await this.updateComplete;
        Fore.refreshChildren(this);
        console.log('### <<<<< dispatching refresh-done - end of update cycle >>>>>');
        this.dispatchEvent(new CustomEvent('refresh-done', {detail:'foo'}));
        console.groupEnd();
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
        // console.log('modelConstructDone received', e.detail.model.id);
        if(this.model.instances.length === 0){
            console.log('### lazy creation of instance');
            const generated = new DOMParser().parseFromString('<data></data>','application/xml');
            console.log('generated root element ', generated.firstElementChild);
            const newData = this._generateInstance(this, generated.firstElementChild);
            console.log('newnewnewe',newData);

            const generatedInstance = document.createElement('xf-instance');
            generatedInstance.appendChild(newData);
            generatedInstance.init();
            this.model.instances.push(generatedInstance);
            // this.model.updateModel();
        }
        this._initUI();
    }

    /**
     * @param {Element} start
     * @param {Element} parent
     */
    _generateInstance(start, parent){

        if(start.hasAttribute('ref')){
            const ref = start.getAttribute('ref');
            const generated = document.createElement(ref);
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
        await this.updateComplete;
        await this.refresh();
        this.ready = true;
        console.log('')
         console.log('########## FORE: form fully initialized... ##########');
         console.log('### <<<<< dispatching ready >>>>>');
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