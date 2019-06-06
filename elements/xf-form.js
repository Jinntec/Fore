import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import '../assets/@polymer/iron-ajax/iron-ajax.js';


/**
 * this array defines which elements are accepted as controls (get eventlisteners attached)
 */
window.BOUND_ELEMENTS =
    ['INPUT',
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
    'XF-UPLOAD'];

window.ACTION_ELEMENTS =
    ['XF-DELETE'];

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
            proxies: {
                type: Array,
                value: {}
            }
        };
    }

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('xf-form connected ', window.location.pathname);

        // this.$.initForm.params = {"token": this.token};
        // this.$.initForm.generateRequest();

        this.addEventListener('model-ready', this._modelReady);

        window.addEventListener('WebComponentsReady', function () {
            console.log('#### WebComponentsReady #####');
            this._init();
        }.bind(this));

    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('model-ready', this._modelReady);
    }


    _init() {
        // console.log('### xf-form init ', this);
        // ### with the 'mockup' property local mockup data can be passed to the form.

        this._update();
        this.dispatchEvent(new CustomEvent('model-ready', {composed: true, bubbles: true, detail: {}}));
    }

    /**
     * updates the model data. As we have limited capabilities on the client _update serves the purpose of the
     * rebuild, recalculate and revalidate function of XForms.
     *
     * @private
     */
    _update(){
        if (this.mockup) {
            // console.log('loading mockup data from : ', this.mockup);
            this.modelData = JSON.parse(this.mockup);
        }else{
            //todo: load via ajax
        }
    }



    /**
     * (re)build the modelData. Will recursively step through the bind objects and create associated proxy object for each
     * of them.
     *
     * @private
     */
    _rebuild() {
        // ### initialize modelData
        console.log('modelData ', this.modelData);
        if (this.modelData) {
            this.proxies = [];
            console.log('proxies after data processing', this.proxies);
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
        this.refresh();
        console.log('### _modelReady proxies: ', this.proxies);
    }

    /**
     * find a proxy for given bindId
     *
     * First checks wether a proxy is already present and just returning that if it exists
     * If no proxy is present consult the parent for a proxy and check for bindId within its context.
     * Continue upwards until 'xf-form' element is reached.
     *
     * @param bindId
     * @param boundElement
     * @private
     */
    resolveProxy(bindId, boundElement) {
        console.log('>>>>> resolveProxy boundElement ', boundElement );



        if (boundElement.hasOwnProperty('proxy')) {
            console.log('resolveProxy - already exists on element. Returning it: ', boundElement.proxy);
            return boundElement.proxy;
        } else {
            console.warn('resolveProxy - element has no proxy ', boundElement);



            console.log('>>>>> resolveProxy modelData ', this.modelData );
            // todo: potential weak and might not find binding under certain nested conditions
            // const target = this.modelData.find(x => x.bind.id === bindId).bind;

            const target = this._findById(this.modelData,bindId);
            // console.log('++++++++++ test ', test);


            console.log('>>>>> resolveProxy modelData target', target);
            const parentBind = this.closest('[bind]');
            console.log('>>>>> resolveProxy parent? ', parentBind);

            if(parentBind === null){

                // ### we're outermost
                // ### check this.proxies for entry
                console.log('>>>>> resolveProxy this.proxies: ', this.proxies);
                console.log('>>>>> resolveProxy this.proxies id: ', this.proxies[bindId]);
                // if(this.proxies[bindId] !== undefined){
                // if(this.proxies[bindId].length === 0){
                if(this.proxies[bindId] === undefined){
                    // ### create proxy and store in `proxies`
                    const p = this.createBindProxy(target, 0);
                    this._addProxy(bindId, p); // add to list of top-level proxies
                    console.log('>>>>> resolveProxy new proxy ', p);
                    return p;
                }else {
                    console.log('exists with id: ', this.proxies);
                    // this.proxies[bindId].bound = boundElement;
                    return this.proxies[bindId][0]; // ### should be fine to use index '0' as we are outermost and there can be only one
                }
            }else{
                // ### do we have a parent ?
                //todo get parent proxy
                //todo check for proxy obj
                //todo if not there create it
                //todo continue upwards if necessary

            }

            return null;

            // walking upwards the tree of UIElements to find the proxy
            // return null;
        }
    }

    _findById(o, id) {
        console.log('/////////// o ',o);
        //Early return
        if( o.hasOwnProperty('id') && o.id === id ){
            return o;
        }
        var result, p;
        for (p in o) {
            if( o.hasOwnProperty(p) && typeof o[p] === 'object' ) {
                result = this._findById(o[p], id);
                if(result){
                    return result;
                }
            }
        }
        return result;
    }

    /**
     * get or create a proxy object for given `bind`, `boundElement` and `index`
     *
     * @param bind
     * @param boundElement
     * @param index
     * @returns {boolean|*}
     * @private
     */
    createBindProxy(bind, index){
        const handler = {
            get(target, key) {
                // console.log('getting value: ', target[key]);
                return target[key];
            },
            set(target, key, value) {
                // console.log('setting value ', value);
                // console.log('@@@bind ', bind);

                // ### bound controls are stored in an array 'boundElements' inside of the proxy
                if (key === 'bound') {
                    if (target.boundElements === undefined) {
                        target.boundElements = [];
                    }
                    if (window.BOUND_ELEMENTS.indexOf(value.nodeName.toUpperCase()) != -1) {
                        // console.log('added bound control: ', value);
                        target.boundElements.push(value);
                    }
                }

                if (key === 'sequence') {
                    target[key] = value;
                }

                if (key === 'index') {
                    target[key] = index;
                }

                if (key === 'delete') {
                    console.log('####### target ', target);
                    console.log('####### target.bind ', target.proxies);
                    console.log('####### delete from proxy ', key, value);

                    // target.proxies.splice(value, 1);
                    target.bind.splice(value, 1);


                    target.boundElements.splice(value, 1);

                    console.log('result target ', target);

                }

                // ### actual setting of values
                if (key === 'value') {
                    // console.log('setting value ', value);

                    target[key] = value;
                    target.boundElements.forEach(control => {
                        control.value = value;
                    });

                }
                if (key === 'proxies') {
                    // console.log('setting value ', value);

                    target[key] = value;

                }
                return true;
            }

        };

        const proxy = new Proxy(bind, handler);
        proxy.index = index;
        if (bind['sequence']) {
            proxy.sequence = true;
        }
        return proxy;

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
            // console.log('>>>>> resolveProxy ', bindId);

            // const proxy = this.getProxy(bindId);
            const proxy = this.resolveProxy(bindId,elem);
            console.log('>>>>> _resolvedProxy ', proxy);

            if (proxy !== null) {
                proxy.bound = elem;
                console.log('### control ', boundElements[i], ' bound to proxy ', proxy);

                if(elem.nodeName === "XF-REPEAT"){
                    // ### xf-repeat refreshes itself
                    elem.refresh(proxy);
                }else if (elem.nodeName.indexOf('-') > -1) {
                    // ### initialize bound web component control
                    if (typeof elem.refresh === 'function') {
                        elem.refresh(proxy);
                    }
                } else {
                    // ### initialize core HTML control
                    this._applyPropertiesToNativeControls(elem, proxy);
                    this._attachListenerToNativeControls(elem, proxy);
                }
            }else{
                //todo: proxy might not exist - should behave like not relevant

            }

        }
        /*
                Object.keys(this.proxies).forEach(function(key,index) {
                    // key: the name of the object key
                    // index: the ordinal position of the key within the object
                    console.log('initUI key ',key);
                    const proxy = this.getProxy(key,0);
                    console.log('initUI proxy ', proxy);
                    console.log('initUI proxy ', proxy.id);
                    this._initBoundElements(proxy.id, proxy.index);

                }.bind(this));
        */




    }



    // ########## function below are supporting HTML Core Controls ##########
    // ########## function below are supporting HTML Core Controls ##########
    // ########## function below are supporting HTML Core Controls ##########


    _addProxy(bindId, proxy) {
        console.log('_addProxy ', bindId, proxy);
        console.log('_addProxy ', this.proxies);

        const entry = this.proxies[bindId];
        if (entry === undefined) {
            // this.proxies['items'] = new Array();
            this.proxies[bindId] = [];
            this.proxies[bindId][0] = proxy;
        } else {
            this.proxies[bindId].push(proxy);
        }
        console.log('_addProxy proxies updated', this.proxies);

    }

    /**
     * Attaches eventlisteners to bound controls to report back value-changes triggered by the user.
     *
     * @param control the control
     * @param proxy the proxy object
     * @private
     */
    _attachListenerToNativeControls(control, proxy) {

        // xf-output is the exception from the rule. Outputs do not have update listeners
        // console.log('#', control.nodeName.toUpperCase());
        // console.log('#', window.BOUND_ELEMENTS.indexOf(control.nodeName.toUpperCase()));
        const ctrl = control.nodeName.toUpperCase();

        if (window.BOUND_ELEMENTS.indexOf(ctrl) != -1) {
            // console.log('attaching listener to ', control);

            if (control.nodeName === 'SELECT') {
                control.addEventListener('change', function (e) {
                    console.log('changing....... ', e);
                    proxy.value = e.target.value;
                }.bind(this));
            } else if (control.hasAttribute('incremental')) {
                console.log('incremental handler');

                control.addEventListener('keyup', function (e) {
                    console.log('keyup....... ', e);
                    proxy.value = e.target.value;
                }.bind(this));
            } else {
                control.addEventListener('blur', function (e) {
                    proxy.value = e.target.value;
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
    _applyPropertiesToNativeControls(control, proxy) {
        if (proxy.alert !== undefined) {
            // console.log('apply alert prop ', proxy.alert);
            //todo
        }
        if (proxy.readonly !== undefined) {
            // console.log('apply readonly prop ', proxy.readonly);
            if (proxy.readonly) {
                control.setAttribute('readonly', 'readonly')
            } else {
                control.removeAttribute('readonly');
            }
        }
        if (proxy.required !== undefined) {
            // console.log('apply required prop ', proxy.required);
            control.setAttribute('required', 'required');
        }
        if (proxy.relevant !== undefined) {
            // console.log('apply relevant prop ', proxy.relevant);
            if (proxy.relevant) {
                control.style.display = 'inline-block';
            } else {
                control.style.display = 'none';
            }
        }
        if (proxy.valid !== undefined) {
            // console.log('apply valid prop ', proxy.valid);
            //todo
        }
        if (proxy.type !== undefined) {
            // console.log('apply type prop ', proxy.type);
            //todo
        }
        if (proxy.value !== undefined) {
            // console.log('apply value prop ', proxy.value);

            //todo: this is obviously not optimal as it requires too much knowledge about certain controls
            // todo: why does third condition does not apply to normal input control?
            if (control.type === 'checkbox') {
                control.checked = proxy.value;
            } else if (control.value !== 'undefined') {
                // ### all controls should have a 'value' property
                control.value = proxy.value;
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
