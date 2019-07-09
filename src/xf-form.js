import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import '../assets/@polymer/iron-ajax/iron-ajax.js';
// import '../assets/@polymer/paper-toast/paper-toast.js';
import '../assets/@polymer/paper-styles/paper-styles.js';
import '../assets/@polymer/paper-styles/color.js';
import '../assets/@polymer/paper-styles/typography.js';
import '../assets/@polymer/paper-icon-button/paper-icon-button.js';
import '../assets/@polymer/iron-icons/iron-icons.js';
import '../assets/@polymer/iron-icon/iron-icon.js';
import '../assets/@polymer/paper-dialog/paper-dialog.js';
import '../assets/@polymer/paper-button/paper-button.js';
import '../assets/@vaadin/vaadin-notification/vaadin-notification.js';



/**
 * `xf-form`
 * an xformish form framework for eXist-db.
 *
 * 'xf-form' is the main component of the client-side part of Fore. Just like an HTML form it wraps the controls
 * belonging to the form. A complete form consists of a server-side part (the modelData) and a client-side part.
 *
 * On the client the modelData is represented in JSON which reflects the structure of the modelData-bindings. Value updates and
 * simple validations are conducted on the client directly. Second-level validation and submissions are executed on the
 * server.
 *
 * While the data-modelData can be directly inlined within the HTML it will never be exposed to the client at runtime.
 *
 # * @polymer
 * @demo demo/index.html
 */
export class XfForm extends PolymerElement {


    static get BOUNDELEMENTS() {
        return [
            'INPUT',
            'SELECT',
            'TEXTAREA',
            'XF-BUTTON',
            'XF-INPUT',
            'XF-ITEMSET',
            'XF-RANGE',
            'XF-REPEAT',
            'XF-REPEAT-ITEM',
            'XF-SELECT',
            'XF-SELECT1',
            'XF-TEXTAREA',
            'XF-OUTPUT',
            'XF-UPLOAD'
        ];
    }

/*
    static get ACTIONELEMENTS() {
        return [
            'XF-APPEND',
            'XF-DELETE'
        ];
    }
*/

    static get template() {
        return html`
          <style is="custom-style">
            :host {
              display: block;
              @apply(--paper-font-common-base);
            }
            paper-icon-button{
                position: absolute;
                right: 10px;
                top:5px;
            }
            paper-dialog{
                width:300px;
            }
            paper-dialog .dialogActions{
                background:var(--paper-grey-100);
                text-align: center;
                padding: 6px;
                margin:0;                
            }
            #messageContent{
                padding: 20px;
                margin:0;
            }
          </style>          
          
          <slot> </slot>
          <iron-ajax id="initForm" 
                     url="/exist/apps/fore/init"
                     handle-as="json" 
                     method="GET"> </iron-ajax>
                     
           
           <paper-dialog id="modalMessage" modal="true">
                <div id="messageContent"></div>
                <div class="dialogActions">
                    <paper-button dialog-dismiss autofocus>Close</paper-button>
                </div>
           </paper-dialog>          
        `;
    }


    static get properties() {
        return {
            token: {
                type: String
            },
            mockup: {
                type: String
            },
            /**
             * The modelData are the parsed JSON data that are returned from the server.
             */
            modelData: {
                type: Array,
                value: function () {
                    return [];
                },
                notify: true,
                reflectToAttribute: true
            },
            changed: {
                type: Array,
                value: []
            }

        };
    }

    /**
     * checks wether an element is bound or not. A bound element is can be updated from its modelItem.
     *
     * Note: actions are not bound elements though they have a binding expression. However they do not receive updates
     * on state changes etc.
     *
     * @param element
     * @returns {boolean}
     */
    static isBoundComponent(element) {
        return (XfForm.BOUNDELEMENTS.indexOf(element.nodeName.toUpperCase()) > -1);
    }


    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('### xf-form connected ', window.location.pathname);

        // this.$.initForm.params = {"token": this.token};
        // this.$.initForm.generateRequest();

        this.addEventListener('item-appended', this._itemAppended);
        this.addEventListener('value-changed', this._handleValueChange);
        this.addEventListener('message', this._displayMessage);

        /*
        form processing starts here when all components have be loaded and instanciated by calling the `update`
        function.
         */
        window.addEventListener('WebComponentsReady', function () {
            console.log('---------- WebComponentsReady ----------');
            this.update();
            this.dispatchEvent(new CustomEvent('model-ready', {composed: true, bubbles: true, detail: {}}));
            this._initUI();

        }.bind(this));

    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('item-appended', this._itemAppended);
        this.removeEventListener('value-change', this._handleValueChange);
        this.removeEventListener('message', this._displayMessage);
    }


    /**
     * updates the model data. As we have limited capabilities on the client _update serves the purpose of the
     * `rebuild`, `recalculate` and `revalidate` function of XForms.
     *
     */
    update() {
        if (this.mockup) {
            // console.log('loading mockup data from : ', this.mockup);
            // this.modelData = JSON.parse(this.mockup);
            const mockupElement = document.getElementById(this.mockup);
            mockupElement.init(); // init mockup data
            this.modelData = mockupElement.getData();
        } else {
            //todo: load via ajax
        }
        // this.dispatchEvent(new CustomEvent('model-ready', {composed: false, bubbles: false, detail: {}}));
    }

    /**
     * refresh is trigged whenever controls need to be updated to the latest state of the modelData. It will visit all elements
     * in the UI that have a `bind` attribute and call their `refresh` method.
     */
    refresh() {
        console.log('### refresh');
        this.dispatchEvent(new CustomEvent('refresh', {composed: true, bubbles: true, detail: {}}));


        // console.groupCollapsed('refresh');
        console.group('refresh');
        const boundElements = this.querySelectorAll('[bind]');
        for (let i = 0; i < boundElements.length; i++) {
            console.log('### bound UI element ', boundElements[i], i + 1, ' of ', boundElements.length);
            // console.log('>>>>> bound UI element ', boundElements[i].getAttribute('bind'));
            const elem = boundElements[i];
            const bindId = elem.getAttribute('bind');
            if (typeof elem.refresh === 'function') {
                elem.refresh();
            }
        }
        console.groupEnd('refresh');
        this.dispatchEvent(new CustomEvent('refresh-done', {composed: true, bubbles: true, detail: {}}));
    }

    /**
     * searches the modelData for given bindId and returns the object (ModelItem).
     *
     * @param o the object to search
     * @param id the bindId
     * @returns {{id}|*|*}
     * @private
     */
    findById(o, id) {
        // console.log('_findById o ', o);
        //Early return
        if (o.hasOwnProperty('id') && o.id === id) {
            return o;
        }
        var result, p;
        for (p in o) {
            if (o.hasOwnProperty(p) && typeof o[p] === 'object') {
                result = this.findById(o[p], id);
                if (result) {
                    return result;
                }
            }
        }
        return result;
    }

    _displayMessage(e){

        const level = e.detail.level;
        const msg = e.detail.message;

        if (level === 'modal') {
            this.$.messageContent.innerText = msg;
            this.$.modalMessage.open();
        } else if(level === 'modeless'){
            // const notification = this.$.modeless;

            const notification = document.createElement('vaadin-notification');
            notification.duration=0;
            notification.setAttribute('theme','error');
            notification.renderer = function(root){
                console.log('root ', root);

                root.textContent = msg;

                const closeIcon = window.document.createElement('paper-icon-button');
                closeIcon.setAttribute('icon','close');
                closeIcon.addEventListener('click',function(e){
                    console.log(e);
                   notification.close();
                });
                root.appendChild(closeIcon);
            };
            this.appendChild(notification);
            notification.open();

        }
        else {
            const notification = document.createElement('vaadin-notification');
            notification.renderer = function(root){
                root.textContent = msg;
            };
            this.appendChild(notification);
            notification.open();
        }
    }

    _handleValueChange(e) {
        console.log('_handleValueChange ', e.target);
        console.log('_handleValueChange ', e.target.modelItem);

        //this is for handling deferred update for action blocks
        //check if action block has been started and add changes as necessary
        const modelItem = e.target.modelItem;
        if (this.changed.indexOf(modelItem) === -1) {
            this.changed.push(modelItem);
        } else {
            const idx = this.changed.findIndex((obj => obj.id == modelItem.id));
            this.changed[idx] = modelItem;
        }
        console.log('### list of changes ###');
        console.table(this.changed);
        console.log('### modelData ', this.modelData);
        this.refresh();

    }



    _initUI() {
        // console.log('### init the UI');
        // iterate the UI in search for bound controls
        const boundElements = this.querySelectorAll('[bind]');
        console.group('initUI');
        for (let i = 0; i < boundElements.length; i++) {
            console.info('### init UI element ', i + 1, ' of ', boundElements.length);
            const boundElement = boundElements[i];
            const bindId = boundElement.getAttribute('bind');
            // if(XfForm.isBoundComponent(boundElement)){
                boundElement.init();
            // }

        }
        console.groupEnd('initUI');

        this.dispatchEvent(new CustomEvent('form-ready', {composed: true, bubbles: false, detail: {}}));
    }

    // this is just a first non-optimized implemenation. Whenever an append has happened a full UI refresh is done.
    _itemAppended(e) {
        console.log('### item was appended ', e.detail);
        this.refresh();
    }


    _isWebComponent(elementName) {
        return (elementName.indexOf('-') > -1);
    }

    _closeToast(e) {
        this.$.important.close();
    }
}

window.customElements.define('xf-form', XfForm);
