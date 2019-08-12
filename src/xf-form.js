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
            .error {
                background: var(--paper-red-500);
                color:white;
            }
            .error .dialogActions{
                color:black;
            }
          </style>          
          
          <slot> </slot>
          <iron-ajax id="initForm" 
                     url="/exist/apps/fore/init"
                     handle-as="json"
                     on-response="_handleInitialState"
                     on-error="_handleError"
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
                notify: true
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

    static getPath(element) {

    }

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('### ============================================== ###');
        console.log('### xf-form connected ', window.location.pathname);

        // this.$.initForm.params = {"token": this.token};
        // this.$.initForm.generateRequest();

        this.addEventListener('repeat-item-appended', this._itemAppended);
        this.addEventListener('repeat-item-deleted', this._itemDeleted);
        this.addEventListener('value-changed', this._handleValueChange);
        this.addEventListener('message', this._displayMessage);

        /*
        form processing starts here when all components have be loaded and instanciated by calling the `update`
        function.
         */
        window.addEventListener('WebComponentsReady', function () {
            console.log('### ----------- WebComponentsReady ----------- ###');
            this.update();
            // this.dispatchEvent(new CustomEvent('model-ready', {composed: true, bubbles: true, detail: {}}));
            // this._initUI();

        }.bind(this));

    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('repeat-item-appended', this._itemAppended);
        this.removeEventListener('value-change', this._handleValueChange);
        this.removeEventListener('message', this._displayMessage);
    }


    /**
     * updates the model data. As we have limited capabilities on the client _update serves the purpose of the
     * `rebuild`, `recalculate` and `revalidate` function of XForms.
     *
     */
    update() {

        // ### if we get a token that means we're running with eXist-db instead of Polymer serve
        if (this.token) {
            console.log('>>>> token ', this.token);
            this.$.initForm.params.token = this.token;
            this.$.initForm.generateRequest();
            return;
        } else if (this.mockup) {
            // console.log('loading mockup data from : ', this.mockup);
            // this.modelData = JSON.parse(this.mockup);
            const mockupElement = document.getElementById(this.mockup);
            if (!mockupElement) {
                this._showError('mockupElement "' + this.mockup + '" not found - stopping');
                return;
            }
            mockupElement.init(); // init mockup data
            this.modelData = mockupElement.getData();
            console.log('### modelData ', this.modelData);
            this._initUI();
        } else {
            this._showError('Neither server- nor mockup-data available - stopping');
        }
        this.dispatchEvent(new CustomEvent('model-ready', {composed: false, bubbles: false, detail: {}}));
    }

    _handleInitialState(e) {
        console.log('### token as param ', this.$.initForm.params);
        this.modelData = this.$.initForm.lastResponse;
        console.log('### initial data loaded from server');
        if (this.modelData === null) {
            this._showError('server did not return any modelData - stopping');
        } else {
            console.log('### modelData from remote ', this.modelData);
            this._initUI();
            this.dispatchEvent(new CustomEvent('model-ready', {composed: false, bubbles: false, detail: {}}));
        }
    }

    _handleError(e) {
        this._showError(this.$.initForm.lastError.error);
    }

    _showError(error) {
        this.$.modalMessage.classList.add('error');
        this.$.messageContent.innerText = error;
        this.$.modalMessage.open();
    }

    /**
     * refresh is trigged whenever controls need to be updated to the latest state of the modelData. It will visit all elements
     * in the UI that have a `bind` attribute and call their `refresh` method.
     */
    refresh() {
        // console.log('### refresh');
        this.dispatchEvent(new CustomEvent('refresh', {composed: true, bubbles: true, detail: {}}));


        // console.groupCollapsed('refresh');
        // console.group('refresh');
        const boundElements = this.querySelectorAll('[bind]');
        for (let i = 0; i < boundElements.length; i++) {
            // console.log('### bound UI element ', boundElements[i], i + 1, ' of ', boundElements.length);
            // console.log('>>>>> bound UI element ', boundElements[i].getAttribute('bind'));
            const elem = boundElements[i];
            const bindId = elem.getAttribute('bind');
            if (typeof elem.refresh === 'function') {
                elem.refresh();
            }
        }
        // console.groupEnd('refresh');
        this.dispatchEvent(new CustomEvent('refresh-done', {composed: true, bubbles: true, detail: {}}));
    }

    /*
        findById(id, currentNode) {

            if (id == currentNode.id) {
                return currentNode;
            } else {
                for(var index in currentNode.children){
                    var node = currentNode.children[index];
                    if(node.id == id)
                        return node;
                    findById(id, node);
                }
                return "No Node Present";
            }
        }
    */

    /*
        findById(data, id) {
            var ret = -1
            for(var i = 0; i < data.length; i++) {
                if (data[i].id === id) {
                    return data[i];
                } else if (data[i].children && data[i].children.length && typeof data[i].children === "object") {
                    ret = findById(data[i].children, id);
                    if (ret.id === id) {
                        return ret;
                    }
                }
            }
            return ret;
        }
    */

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

    _displayMessage(e) {

        const level = e.detail.level;
        const msg = e.detail.message;

        if (level === 'modal') {
            this.$.messageContent.innerText = msg;
            this.$.modalMessage.open();
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

    _handleValueChange(e) {
        console.log('_handleValueChange ', e.target);
        console.log('_handleValueChange ', e.target.modelItem);

        //this is for handling deferred update for action blocks
        //check if action block has been started and add changes as necessary
        const modelItem = e.detail.modelItem;

        // modelItem.changed = true;
        let path = e.detail.path;
        let action = {};

        // if (path) {
            // const idx = e.detail.index
            // path = path + '/' + modelItem.id + ':' + idx;
            // path = path + '/' + modelItem.id;
        // } else {
        //     path = modelItem.id;
        // }
        // action = {'action': 'setvalue', 'bind': modelItem.id, 'value': modelItem.value, 'path': path};
        action = {'action': 'setvalue', 'value': modelItem.value, 'path': path};


        // modelItem.path = path + '/' + modelItem.id + ':' + e.detail.index;

        // const mod = {'action':'setvalue','bind':modelItem.id, 'value':modelItem.value,'path':path};
        // this.changed.push(mod);
        // if (this.changed.indexOf(modelItem) === -1) {


        const found = this.changed.findIndex((obj) => obj.path == path);
        console.log('*************** found ', found);
        if(found !== -1){
            this.changed[found] = action;
        }else{
            this.changed.push(action);
        }

/*
        if (this.changed.indexOf(action) === -1) {
            // this.changed.push(modelItem);
            this.changed.push(action);
        } else {
            const idx = this.changed.findIndex((obj => obj.id == modelItem.id));
            // this.changed[idx] = modelItem;
            this.changed[idx] = action;
        }
*/
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
        console.log('### _itemAppended ', e.detail);

        const bind = e.detail.bind;
        const modelItem = e.detail.appendedItem;
        const index = e.detail.appendLocation;
        const path = e.detail.path;

        // modelItem.path = bind + ':' + index;

        const change = {
            "action": "append",
            "bind": bind,
            "index": index,
            "modelItem": modelItem
        };
        this.changed.push(change);
        console.table(this.changed);

        this.refresh();
    }

    _itemDeleted(e){
        const bind = e.detail.bind;
        const item  = e.detail.deleteItems;
        const idx = e.detail.deleteLocation;
        const change = {
            "action": "delete",
            "bind":bind,
            "index": idx,
            "modelItem": item
        };
        this.changed.push(change);
        console.table(this.changed);


    }


    _isWebComponent(elementName) {
        return (elementName.indexOf('-') > -1);
    }

    _closeToast(e) {
        this.$.important.close();
    }

    resolveBinding(boundElement) {
        if (boundElement.repeated) {
            let elem = boundElement.closest('xf-repeat');
            let path = elem.bind + ':' + elem.repeatIndex;

            let found = true;
            while (found) {
                elem = elem.parentNode.closest('xf-repeat');
                if (elem === null) {
                    found = false;
                } else {
                    path = elem.bind + ':' + elem.repeatIndex + '/' + path;
                }
            }
            console.log('### resolveBinding path ', path);
            return path + '/' + boundElement.bind;
        }else{
            return boundElement.bind;
        }
    }
}

window.customElements.define('xf-form', XfForm);
