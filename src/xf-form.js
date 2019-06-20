import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import '../assets/@polymer/iron-ajax/iron-ajax.js';


/**
 * ModelItem is a decorator class for a `bind` in the modelData. There will be a single ModelItem for each
 * `bind` object in the modelData.
 *
 * This class also knows about the controls which bind to a given modelItem and handles updates to those.
 */
/*
class ModelItem {

    constructor(bind) {
        this._bind = bind;
        this.boundElements = [];
        // console.log('new ModelItem ', this);
    }

    get children(){
        if(Array.isArray(this._bind.bind)){
            return this._bind.bind;
        }
    }

    /!**
     * get the
     * @returns {*}
     *!/
    get boundItem(){
        return this._bind;
    }

    get value() {
        return this._bind.value;
    }

    set value(newVal) {
        console.log('*** ModelItem changed value ', this._bind.value, newVal);
        this._bind.value = newVal;

        // ### update all other elements that are bound to this ModelItem obj
        this.boundElements.forEach((control) => {
            control.value = newVal;
        });

    }

    set index(index) {
        this._index = index;
    }

    set sequence(bool) {
        this._sequence = bool;
    }

    set dataTemplate(dataTemplate){
        this._dataTemplate = Array.from(dataTemplate);
    }


    addBoundElement(element) {
        if (XfForm.isBoundComponent(element)){
            if(this.boundElements.indexOf(element) == -1){
                this.boundElements.push(element);
            }
        }
    }

    append(dataTemplate){
        // const newEntry = this._dataTemplate.splice();

        const newEntry = Array.from(dataTemplate);
        this.children.push(newEntry);

    }

    delete(index) {
        console.log('ModelItem delete ', this._bind);
        this.children.splice(index,1);
    }
}
*/

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

    static get ACTIONELEMENTS(){
        return [
            'XF-APPEND',
            'XF-DELETE'
        ];
    }

    static get template() {
        return html`
          <style>
            :host {
              display: block;
            }
          </style>          

          <iron-ajax id="initForm" 
                     url="/exist/apps/fore/init"
                     handle-as="json" 
                     method="GET"></iron-ajax>
                     
           <slot></slot>
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
            changed:{
                type: Array,
                value:[]
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

        this.addEventListener('model-ready', this._modelReady);
        this.addEventListener('item-appended', this._itemAppended);
        this.addEventListener('value-changed', this._handleValueChange);
        this.addEventListener('action-performed', this._handleActionPerformed);

        /*
        form processing starts here when all components have be loaded and instanciated by calling the `update`
        function.
         */
        window.addEventListener('WebComponentsReady', function () {
            console.log('#### WebComponentsReady #####');
            this.update();
            this.dispatchEvent(new CustomEvent('model-ready', {composed: true, bubbles: true, detail: {}}));
        }.bind(this));

    }

    _handleValueChange(e){
        console.log('_handleValueChange ',e.target);
        console.log('_handleValueChange ',e.target.modelItem);

/*
        //this is for handling deferred update for action blocks
        //check if action block has been started and add changes as necessary
        const modelItem = e.target.modelItem;
        if(this.changed.indexOf(modelItem) === -1){
            this.changed.push(modelItem);
        }else{
            const idx = this.changed.findIndex((obj => obj.id == modelItem.id));
            this.changed[idx] = modelItem;
        }
        console.log('### change list ', this.changed);
*/
        this.refresh();

    }

    _handleActionPerformed(e){
        console.log('_handleActionPerformed ',e.target);
        // todo: finer-grained updating by using 'changed' array?
        this.refresh();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('model-ready', this._modelReady);
        this.removeEventListener('item-appended', this._itemAppended);
    }

    // this is just a first non-optimized implemenation. Whenever an append has happened a full UI refresh is done.
    _itemAppended(e) {
        console.log('##### item was appended ', e.detail);
        this.refresh();
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
            this.modelData = mockupElement.getData();
        } else {
            //todo: load via ajax
        }
    }


    /**
     * called after `model-ready` event fired to signal that all model initialization is complete.
     *
     * @event listener for `model-ready` event
     * @private
     */
    _modelReady() {
        console.log('### model-ready event fired');
        // this.refresh();
        this._initUI();
        document.dispatchEvent(new CustomEvent('ui-initialized', {composed: true, bubbles: true, detail: {}}));
        this.dispatchEvent(new CustomEvent('form-ready', {composed: true, bubbles: true, detail: {}}));

    }


    _initUI() {
        console.log('### init the UI');
        // iterate the UI in search for bound controls
        const boundElements = this.querySelectorAll('[bind]');
        for (let i = 0; i < boundElements.length; i++) {
            console.log('##### init UI element ', i + 1, ' of ', boundElements.length);
            const boundElement = boundElements[i];
            const bindId = boundElement.getAttribute('bind');
            // if(XfForm.isBoundComponent(boundElement)){
            boundElement.init();
            // }

        }
    }


    refresh(){
        console.log('### refresh');
        this.dispatchEvent(new CustomEvent('refresh', {composed: true, bubbles: true, detail: {}}));


        const boundElements = this.querySelectorAll('[bind]');
        for (let i = 0; i < boundElements.length; i++) {
            console.log('##### bound UI element ', boundElements[i], i + 1, ' of ', boundElements.length);
            // console.log('>>>>> bound UI element ', boundElements[i].getAttribute('bind'));
            const elem = boundElements[i];
            const bindId = elem.getAttribute('bind');
            if (typeof elem.refresh === 'function') {
                elem.refresh();
            }
        }
        this.dispatchEvent(new CustomEvent('refresh-done', {composed: true, bubbles: true, detail: {}}));
    }

    /**
     * creates a ModelItem object which wrap the passed bind object.
     *
     * @param bind - the bind to be wrapped
     * @param index -
     * @returns {ModelItem}
     */
/*
    createModelItem(bind, index) {
        const state = new ModelItem(bind);
        state.index = index;

        if (bind['sequence']) {
            state.sequence = true;
        }
        return state;
    }
*/

    /**
     * searches the modelData for given bindId and returns the object.
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

    _isWebComponent(elementName) {
        return (elementName.indexOf('-') > -1);
    }


}

window.customElements.define('xf-form', XfForm);
