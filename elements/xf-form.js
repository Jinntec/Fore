import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import '../assets/@polymer/iron-ajax/iron-ajax.js';


/**
 * this array defines which elements are accepted as controls (get eventlisteners attached)
 */
window.BOUND_ELEMENTS = [
    'INPUT',
    'SELECT',
    'TEXTAREA',
    'XF-BUTTON',
    'XF-INPUT',
    'XF-ITEMSET',
    'XF-RANGE',
    'XF-REPEAT',
    'XF-SELECT',
    'XF-SELECT1',
    'XF-TEXTAREA',
    'XF-OUTPUT',
    'XF-UPLOAD'
];

window.ACTION_ELEMENTS = [
    'XF-APPEND',
    'XF-DELETE'
];


/**
 * ModelItem is a decorator class for a `bind` in the modelData. It controls access to the
 */
class ModelItem {

    constructor(bind) {
        this._bind = bind;
        this.boundElements = [];
        console.log('new ModelItem ', this);
    }

    get children(){
        if(Array.isArray(this._bind.bind)){
            return this._bind.bind;
        }
    }

    /**
     * get the
     * @returns {*}
     */
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
        if (XfForm.isBoundComponent(element))
            this.boundElements.push(element);
    }

    append(){
        // const newEntry = this._dataTemplate.splice();
        const newEntry = Array.from(this._dataTemplate);
        this.children.push(newEntry);

    }

    delete(index) {
        console.log('ModelItem delete ', this._bind);
        this.children.splice(index,1);
    }
}

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
            'XF-SELECT',
            'XF-SELECT1',
            'XF-TEXTAREA',
            'XF-OUTPUT',
            'XF-UPLOAD'
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
            modelData: {
                type: Array,
                value: function () {
                    return [];
                },
                notify: true,
                reflectToAttribute: true
            },
            modelItems: {
                type: Object,
                value: {}
            }

        };
    }

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

        window.addEventListener('WebComponentsReady', function () {
            console.log('#### WebComponentsReady #####');
            this.update();
        }.bind(this));

    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('model-ready', this._modelReady);
    }

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
            this.modelData = JSON.parse(this.mockup);
        } else {
            //todo: load via ajax
        }
        this.dispatchEvent(new CustomEvent('model-ready', {composed: true, bubbles: true, detail: {}}));
    }


    /**
     * called after `model-ready` event fired to signal that all model initialization is complete.
     *
     * @event listener for `model-ready` event
     * @private
     */
    _modelReady() {
        console.log('### model-ready event fired');
        this.refresh();
        console.log('### _modelReady modelItems: ', this.modelItems);
    }

    /**
     * find a ModelItem for given bindId
     *
     * First checks wether a ModelItem is already present and just returning that if it exists
     * If no ModelItem is present consult the parent for a ModelItem and check for bindId within its context.
     * Continue upwards until 'xf-form' element is reached.
     *
     * @param bindId
     * @param boundElement
     * @private
     */
    resolve(bindId, boundElement) {
        // console.log('>>>>> resolve boundElement ', boundElement);

        if (boundElement.hasOwnProperty('modelItem')) {
            // console.log('resolve - already exists on element. Returning it: ', boundElement.modelItem);
            return boundElement.modelItem;
        } else {
            console.warn('resolve - element has no modelItem ', boundElement);
            // console.log('>>>>> resolve modelData ', this.modelData );

            // todo: potential weak and might not find binding under certain nested conditions
            // const target = this.modelData.find(x => x.bind.id === bindId).bind;

            const target = this._findById(this.modelData, bindId);
            // console.log('++++++++++ test ', test);

            if (this.modelItems[bindId] === undefined) {
                // ### create modelItem and store in `modelItems`
                // const state = this.createBindProxy(target, 0);
                const state = this.createModelItem(target, 0);
                this._addModelItem(bindId, state);
                return state;
            } else {
                return this.modelItems[bindId][0]; // ### should be fine to use index '0' as we are outermost and there can be only one
            }

            return null;

            // walking upwards the tree of UIElements to find the modelItem
            // return null;
        }
    }

    createModelItem(bind, index) {
        const state = new ModelItem(bind);
        state.index = index;

        if (bind['sequence']) {
            state.sequence = true;
        }
        return state;
    }

    _findById(o, id) {
        // console.log('/////////// o ', o);
        //Early return
        if (o.hasOwnProperty('id') && o.id === id) {
            return o;
        }
        var result, p;
        for (p in o) {
            if (o.hasOwnProperty(p) && typeof o[p] === 'object') {
                result = this._findById(o[p], id);
                if (result) {
                    return result;
                }
            }
        }
        return result;
    }


    refresh() {
        console.log('>>>>> refresh');


        // iterate the UI in search for bound controls
        const boundElements = this.querySelectorAll('[bind]');
        for (let i = 0; i < boundElements.length; i++) {
            console.log('>>>>> bound UI element ', boundElements[i], i + 1, ' of ', boundElements.length);
            // console.log('>>>>> bound UI element ', boundElements[i].getAttribute('bind'));
            const elem = boundElements[i];
            const bindId = elem.getAttribute('bind');


            // const proxy = this.getProxy(bindId,0);
            // console.log('>>>>> resolve ', bindId);

            // const proxy = this.getProxy(bindId);
            const modelItem = this.resolve(bindId, elem);
            console.log('>>>>> _resolved modelItem ', modelItem);

            if (modelItem !== null) {
                modelItem.addBoundElement(elem);
                console.log('### control ', boundElements[i], ' bound to modelItem ', modelItem);

                if (elem.nodeName === "XF-REPEAT") {
                    // ### xf-repeat refreshes itself
                    elem.refresh(modelItem);
                } else if (elem.nodeName.indexOf('-') > -1) {
                    // ### initialize bound web component control
                    if (typeof elem.refresh === 'function') {
                        elem.refresh(modelItem);
                    }
                } else {
                    // ### initialize core HTML control
                    this._applyPropertiesToNativeControls(elem, modelItem);
                    this._attachListenerToNativeControls(elem, modelItem);
                }
            } else {
                //todo: modelItem might not exist - should behave like not relevant

            }

        }
    }

    _addModelItem(bindId, modelItem) {
        const entry = this.modelItems[bindId];
        if (entry === undefined) {
            this.modelItems[bindId] = [];
            this.modelItems[bindId][0] = modelItem;
        } else {
            this.modelItems[bindId].push(modelItem);
        }
        console.log('_addModelItem modelItems updated', this.modelItems);
    }


    /**
     * Attaches eventlisteners to bound controls to report back value-changes triggered by the user.
     *
     * @param control the control
     * @param modelItem the ModelItem object
     * @private
     */
    _attachListenerToNativeControls(control, modelItem) {

        // xf-output is the exception from the rule. Outputs do not have update listeners
        // console.log('#', control.nodeName.toUpperCase());
        // console.log('#', window.BOUND_ELEMENTS.indexOf(control.nodeName.toUpperCase()));
        const ctrl = control.nodeName.toUpperCase();

        if (window.BOUND_ELEMENTS.indexOf(ctrl) != -1) {
            // console.log('attaching listener to ', control);

            if (control.nodeName === 'SELECT') {
                control.addEventListener('change', function (e) {
                    console.log('changing....... ', e);
                    modelItem.value = e.target.value;
                }.bind(this));
            } else if (control.hasAttribute('incremental')) {
                console.log('incremental handler');

                control.addEventListener('keyup', function (e) {
                    console.log('keyup....... ', e);
                    modelItem.value = e.target.value;
                }.bind(this));
            } else {
                control.addEventListener('blur', function (e) {
                    modelItem.value = e.target.value;
                });
            }

        }
    }

    /**
     * applies the properties of the bind object to the control.
     *
     * @param control the control to initialize
     * @param bind the bind object
     * @private
     */
    _applyPropertiesToNativeControls(control, modelItem) {
        if (modelItem.alert !== undefined) {
            // console.log('apply alert prop ', modelItem.alert);
            //todo
        }
        if (modelItem.readonly !== undefined) {
            // console.log('apply readonly prop ', modelItem.readonly);
            if (modelItem.readonly) {
                control.setAttribute('readonly', 'readonly')
            } else {
                control.removeAttribute('readonly');
            }
        }
        if (modelItem.required !== undefined) {
            // console.log('apply required prop ', modelItem.required);
            control.setAttribute('required', 'required');
        }
        if (modelItem.relevant !== undefined) {
            // console.log('apply relevant prop ', modelItem.relevant);
            if (modelItem.relevant) {
                control.style.display = 'inline-block';
            } else {
                control.style.display = 'none';
            }
        }
        if (modelItem.valid !== undefined) {
            // console.log('apply valid prop ', modelItem.valid);
            //todo
        }
        if (modelItem.type !== undefined) {
            // console.log('apply type prop ', modelItem.type);
            //todo
        }
        if (modelItem.value !== undefined) {
            // console.log('apply value prop ', modelItem.value);

            //todo: this is obviously not optimal as it requires too much knowledge about certain controls
            // todo: why does third condition does not apply to normal input control?
            if (control.type === 'checkbox') {
                control.checked = modelItem.value;
            } else if (control.value !== 'undefined') {
                // ### all controls should have a 'value' property
                control.value = modelItem.value;
            } else {
                console.warn(control, ' has no "value" property')
            }

        }
    }

    _isWebComponent(elementName) {
        return (elementName.indexOf('-') > -1);
    }

    _isNativeControl(elementName) {
        return (elementName.indexOf)
    }

}

window.customElements.define('xf-form', XfForm);
