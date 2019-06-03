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
        'XF-UPLOAD',
        'XF-DELETE'];


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
                type: Object,
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

        window.addEventListener('WebComponentsReady', function () {
            console.log('#### WebComponentsReady #####');
            // document.querySelector('xf-form').init();
            this._init();
        }.bind(this));

        this.addEventListener('model-ready', this._modelReady);
        this.addEventListener('xf-delete', this._xfDelete);
    }

    _xfDelete(e) {
        console.log('_xfDelete location ', e.detail.deleteLocation);
        console.log('_xfDelete items ', e.detail.deleteItems);
        console.log('_xfDelete proxies ', this.proxies);

    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('model-ready', this._modelReady);
    }

    _init() {
        // console.log('### xf-form init ', this);
        // ### with the 'mockup' property local mockup data can be passed to the form.
        if (this.mockup) {
            // console.log('loading mockup data from : ', this.mockup);
            this.modelData = JSON.parse(this.mockup);
        }

        this._rebuild();

        // ### notification event to signal that the form is ready for action
        // document.dispatchEvent(new CustomEvent('ui-initialized', {composed:true, bubbles:true, detail: {target: this}}));
    }


    /**
     * (re)build the modelData. Will recursively step through the bind objects and create associated proxy object for each
     * of them.
     *
     * @private
     */
    _rebuild() {
        // ### initialize modelData
        // console.log('modelData ', this.modelData);
        if (this.modelData) {
            // this.modelData.forEach(item => this._processData(item, 0));
            this._processData(this.modelData, 0);
            console.log('proxies after data processing', this.proxies);
            this.dispatchEvent(new CustomEvent('model-ready', {composed: true, bubbles: true, detail: {}}));

            // this._initUI();
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
        this._initUI();
    }

    _initUI() {
        console.log('>>>>> _initUI');
        // iterate the UI in search for bound controls
        const boundElements = this.querySelectorAll('[bind]');
        for (let i = 0; i < boundElements.length; i++) {
            console.log('>>>>> bound UI element ', boundElements[i], i+1 , ' of ', boundElements.length );
            // console.log('>>>>> bound UI element ', boundElements[i].getAttribute('bind'));
            const elem = boundElements[i];
            const bindId = elem.getAttribute('bind');

            // const proxy = this.getProxy(bindId,0);
            const proxy = this.getProxy(bindId);
            console.log('>>>>> proxy ', proxy);

            //todo: proxy might not exist - should behave like not relevant

            proxy.bound = elem;
            console.log('### control ', boundElements[i], ' bound to proxy ', proxy);


            // ### if we are a core HTML control apply properties and attach change listeners
            if (elem.nodeName.indexOf('-') > -1) {
                // ### initialize bound web component control
                if (typeof elem.refresh === 'function') {
                    elem.refresh(proxy);
                }
            } else {
                // ### initialize core HTML control
                this._applyPropertiesToNativeControls(elem, proxy);
                this._attachListenerToNativeControls(elem, proxy);
                3
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


    /**
     * returns a proxy object for a bind. `index` param is only effective if the requested proxy exists more than once.
     *
     * @param bindId the bind id as given by the client-side modelData
     * @returns {any}
     */
    getProxy(bindId, index) {
        console.log('### getProxy ', bindId, index);

        if (this.proxies[bindId].length === 1) {
            return this.proxies[bindId][0];
        }
        return this.proxies[bindId][index];
    }


    /*
        #### todo: deprecated - remove?
        _getBindId(bind) {
            if (bind.bind && bind.bind.id) {
                return bind.bind.id;
            } else if (bind.id) {
                return bind.id
            }
        }
    */

    /**
     * recursively processes all modelData data (JSON) to initialize the UI
     *
     *
     * todo: check for correctness with larger nested structures.
     *
     * @param bind the bind object to process
     * @param index
     * @private
     */
    _processData(bind, index, parent) {
        let p;
        // ### PROCESS SELF
        if (bind.id) {
            // console.log("_processData bind: ", bind);
            // console.log("call _initBoundElements for bind ", bind.id);
            // ### create a single proxy object for each bind object in the modelData
            p = this._createProxy(bind, index);
            // console.log('#### proxies ', this.proxies);
            // todo: we can pass the proxy here however does not matter too much
            // this._initBoundElements(bind, index);
        }

        // ### PROCESS CHILDREN
        if (bind.bind) {
            console.log(1, 'child bind ', bind.bind.id);
            // if(bind.bind.id){
                this._processData(bind.bind, 0, p);
            // }
        } else if (Array.isArray(bind) && Array.isArray(bind[0])) {
            console.log(2, "bind is an array of arrays", parent);
            let proxies = [];
            const set = bind;
            // console.log('set ', bind);
            for (let i = 0; i < set.length; i++) {
                const inner = set[i];
                // console.log('outer ', set[i]);
                const innerSet = [];
                for (let j = 0; j < inner.length; j++) {
                    // console.log('inner ', inner[j]);
                    innerSet.push(this._processData(inner[j], i));
                }
                proxies.push(innerSet)
            }
            parent.proxies = proxies;
        } else if (Array.isArray(bind)) {
            console.log(3, 'isArray bind ', bind);
            let proxies = [];
            const plain = bind;
            console.log(3, 'isArray bind isRepeated', bind);
            for (let i = 0; i < plain.length; i++) {
                // proxies.push(this._processData(plain[i], i));
                this._processData(plain[i],i);
            }
            return proxies;
        } else if (bind.bind && bind.bind.bind) {
            console.log(4, 'yes, we have children');
            const child = bind.bind.bind;
            // console.log("child ", child);
            parent.proxies = [this._processData(child, 0)];
        }
        return p;
    }

    /**
     * Processes controls bound to given bind object. Creates a proxy object for the bind object which handles the
     * actual updates of values. The proxy will hold references to all controls that are bound to a certain bind object.
     *
     * This function also applies all properties of the bind object to the bound controls and attaches eventlisteners
     * to the controls to propagate the changes back to the modelData (via the proxy).
     *
     * todo: repeat processing
     * todo: review later: this function still uses the 'bind' object instead of proxy - should that change?
     *
     * @param bind the bind object
     * @param index
     * @private
     */
    _initBoundElements(bind, index) {
        console.log('_initBoundElements for bind ', bind, index);

        // ### searching all controls that are bound to given bind id
        const search = '[bind=' + bind.id + ']';
        const found = Array.from(document.querySelectorAll(search));
        console.log('found controls ', search, found);

        // ### filter controls from search-result (which may also contain actions
        // const allControls = Array.from(found).filter(this._filterControls);
        // console.log('### all controls found for search', search,  allControls);

        // ### if no controls are bound back out
        // if (!allControls[0]) {
        if (!found[0]) {
            console.warn('bind with id ' + bind.id + ' is not bound in this form currently');
            return;
        }

        /*
        *  not really happy with this part - there should be a better distinction between repeated and non-repeated data.
        */
        const repeated = found[0].closest('XF-REPEAT');
        console.log('is repeated ', repeated);
        if (repeated) {
            const item = found[index];
            // console.log('found item ', item);

            // ### add control to 'boundElements' array in proxy
            const proxy = this.getProxy(bind.id, index);
            proxy.bound = item;

            // ### if we are a core HTML control apply properties and attach change listeners
            if (item.nodeName.indexOf('-') > -1) {
                // ### initialize bound web component control
                if (typeof item.init === 'function') {
                    item.init(proxy, index);
                }
            } else {
                // ### initialize core HTML control
                this._applyPropertiesToNativeControls(item, proxy);
                this._attachListenerToNativeControls(item, proxy);
            }
        } else {
            found.forEach((elem) => {
                // ### store control in proxy object
                // const proxy = this.proxies.get(bind.id);
                // const proxy = this.proxies[bind.id];

                // ### add control to 'boundElements' array in proxy
                const proxy = this.getProxy(bind.id, index);
                proxy.bound = elem;

                // ### if we are a core HTML control apply properties and attach change listeners
                if (elem.nodeName.indexOf('-') > -1) {
                    // ### initialize bound web component control
                    if (typeof elem.init === 'function') {
                        elem.init(proxy, index);
                    }
                } else {
                    // ### initialize core HTML control
                    this._applyPropertiesToNativeControls(elem, proxy);
                    this._attachListenerToNativeControls(elem, proxy);
                }

            });
        }

    }

    /**
     * filters all elements out that are NOT defined in window.BOUND_ELEMENTS
     *
     * @param controlName
     * @returns {boolean}
     * @private
     */
    _filterControls(control) {
        // console.log('#### controlName: ', control.nodeName);
        return window.BOUND_ELEMENTS.indexOf(control.nodeName) !== -1;
    }

    /**
     * Creates a proxy for every bind object in the data-modelData. This serves as a central for mutations of the data-modelData
     * and updates all bound controls when value changes occur. All proxy objects will be stored in a local map of this
     * form instance.
     *
     * @param bind the bind object which gets proxied.
     * @returns {boolean|*}
     * @private
     */
    _createProxy(bind, index) {
        // ### setting up a proxy object for binding with also keeps references to all bound controls
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

                    target.proxies.splice(value, 1);
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

        // ### add new proxy to 'proxies' map
        // this.proxies.set(bind.id, proxy);
        this._addProxy(bind.id, proxy);
        return proxy;
        // console.log('>>>>>>>>>>>proxies ', this.proxies);
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
