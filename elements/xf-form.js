import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import '../assets/@polymer/iron-ajax/iron-ajax.js';


/**
 * this array defines which elements are accepted as controls (get eventlisteners attached)
 */
window.CONTROLS = ['INPUT',
                   'SELECT',
                   'TEXTAREA',
                   'XF-OUTPUT'];

/**
 * `xf-form`
 * an xformish form framework for eXist-db.
 *
 * 'xf-form' is the main component of the client-side part of Fore. Just like an HTML form it wraps the controls
 * belonging to the form. A complete form consists of a server-side part (the model) and a client-side part.
 *
 * On the client the model is represented in JSON which reflects the structure of the model-bindings. Value updates and
 * simple validations are conducted on the client directly. Second-level validation and submissions are executed on the
 * server.
 *
 * While the data-model can be directly inlined within the HTML it will never be exposed to the client at runtime.
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
            mockup:{
                type:String
            },
            model: {
                type: Array,
                value:function () { return []; },
                notify:true
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('xf-form connected ', window.location.pathname);
        this.proxies = new Map();

        // this.$.initForm.params = {"token": this.token};
        // this.$.initForm.generateRequest();

    }

    ready() {
        super.ready();

        window.addEventListener('WebComponentsReady', function () {
            console.log('#### WebComponentsReady #####');
            document.querySelector('xf-form').init();
        });
    }

    init() {

        // ### with the 'mockup' property local mockup data can be passed to the form.
        if(this.mockup){
            // console.log('loading mockup data from : ', this.mockup);
            this.model = JSON.parse(this.mockup);
        }

        // ### initialize model
        if(this.model){
            this.model.forEach(item => this._processData(item, 0));
        }

        // ### notification event to signal that the form is ready for action
        this.dispatchEvent(new CustomEvent('ui-initialized'));
    }

    /**
     * returns a proxy object for a bind.
     *
     * @param bindId the bind id as given by the client-side model
     * @returns {any}
     */
    getProxy(bindId){
        return this.proxies.get(bindId);
    }


    _getBindId(bind) {
        if (bind.bind && bind.bind.id) {
            return bind.bind.id;
        } else if (bind.id) {
            return bind.id
        }
    }

    /**
     * recursively processes all model data (JSON) to initialize the UI
     *
     *
     * todo: check for correctness with larger nested structures.
     *
     * @param bind the bind object to process
     * @param index
     * @private
     */
    _processData(bind, index) {
        // console.log("bind: ", bind);
        // console.log("bind index ", index);

/*
        if (bind.bind && bind.bind.id) {
            console.log("call APPLY-STATE 1 for bind ", bind.bind.id);
            this._initControls(bind.bind.id, bind.bind, index);
        } else
*/
        if (bind.id) {
            // console.log("call _initControls for bind ", bind.id);
            // this._initControls(bind.id, bind, index);
            this._initControls(bind, index);
        }

        // PROCESS CHILDREN
        // is it a 'complex' bind?
        if (Array.isArray(bind) && Array.isArray(bind[0])) {
            // console.log("bind is an array of arrays");

            const set = bind;
            // console.log('set ', bind);
            for (let i = 0; i < set.length; i++) {
                const inner = set[i];
                // console.log('outer ', set[i]);

                for (let j = 0; j < inner.length; j++) {
                    // console.log('inner ', inner[j])
                    this._processData(inner[j], i);
                }
            }
        } else if (Array.isArray(bind)) {
            const plain = bind;
            for (let i = 0; i < plain.length; i++) {
                this._processData(plain[i], i);
            }
        } else if (bind.bind && bind.bind.bind) {
            // console.log('yes, we have children');
            const child = bind.bind.bind;
            // console.log("child ", child);
            this._processData(child, 0);
        } else if (bind.bind) {
            this._processData(bind.bind, 0);
        }

    }

    /**
     * Processes controls bound to given bind object. Creates a proxy object for the bind object which handles the
     * actual updates of values. The proxy will hold references to all controls that are bound to a certain bind object.
     *
     * This function also applies all properties of the bind object to the bound controls and attaches eventlisteners
     * to the controls to propagate the changes back to the model (via the proxy).
     *
     * todo: repeat processing
     *
     * @param bind the bind object
     * @param index
     * @private
     */
    // _initControls(bindId, bind, index) {
    _initControls(bind, index) {
        // console.log('_initControls for bind ', bindId, bind, index);

        // ### searching all controls that are bound to given bind id
        // const search = '[bind=' + bindId + ']';
        const search = '[bind=' + bind.id + ']';
        const found = document.querySelectorAll(search);
        // console.log('found controls ', found);

        // ### filter controls from search-result (which may also contain actions
        const allControls = Array.from(found).filter(this._filterControls);
        console.log('### all controls found ', allControls);

        // ### if no controls are bound back out
        if(!allControls[0]) {
            console.warn('bind with id ' + bind.id + ' is not bound in this form');
            return;
        }

        // ### create a single proxy object for each bind in the model
        this._createProxy(bind);

        allControls.forEach((elem) => {
           //todo: if bind id is not defined we might have a simple set bindings - needs special treatment

           // store control in proxy object
           const proxy = this.proxies.get(bind.id);
           proxy.bound = elem;

           this._applyProperties(elem, bind);
           this._attachListener(elem,proxy);

       });


        // call refresh on control and pass bind data to it
/*
        if(typeof found[0].refresh === 'function') {
            found[0].refresh(bind);
        }
*/


        /*
                if(found[0].nodeName.toUpperCase() === 'XF-REPEAT'){
                    console.log('>>>>>>>> init repeat');

                }
        */


        if (bind.bind && Array.isArray(bind.bind[0])) {
            console.log('>>>>>>>> init repeat');
            const items = bind.bind;

            for (const item in items) {
                const repeat = found[0];
                console.log('repeat ', repeat);
                if(repeat){
                    repeat.append();
                }
            }
        }

    }

    /**
     * filters all elements out that are NOT defined in window.CONTROLS
     *
     * @param controlName
     * @returns {boolean}
     * @private
     */
    _filterControls(control){
        // console.log('#### controlName: ', control.nodeName);
        return window.CONTROLS.indexOf(control.nodeName) !== -1;
    }

    /**
     * Creates a proxy for every bind object in the data-model. This serves as a central for mutations of the data-model
     * and updates all bound controls when value changes occur. All proxy objects will be stored in a local map of this
     * form instance.
     *
     * @param bind the bind object which gets proxied.
     * @returns {boolean|*}
     * @private
     */
    _createProxy(bind){
        // ### setting up a proxy object for binding with also keeps references to all bound controls
        const handler = {
            get(target, key){
                console.log('getting value: ', target[key]);
                return target[key];
            },
            set(target, key,value){
                // console.log('setting value ', value);
                // console.log('@@@bind ', bind);

                // ### bound controls are stored in an array 'boundElements'
                if(key === 'bound'){
                    if(target.boundElements === undefined){
                        target.boundElements=[];
                    }
                    if(window.CONTROLS.indexOf(value.nodeName.toUpperCase()) != -1) {
                        // console.log('added bound control: ', value);
                        target.boundElements.push(value);
                    }
                }

                // ### actual setting of values
                if(key === 'value'){
                    console.log('setting value ', value);

                    target[key] = value;
                    target.boundElements.forEach( control => {
                        control.value = value;
                    });

                }
                return true;
            }

        };
        const proxy = new Proxy(bind, handler);
        this.proxies.set(bind.id,proxy);
        console.log('proxies ', this.proxies);
    }

    /**
     * Attaches eventlisteners to bound controls to report back value-changes triggered by the user.
     *
     * @param control the control
     * @param proxy the proxy object
     * @private
     */
    _attachListener(control,proxy){

        // xf-output is the exception from the rule. Outputs do not have update listeners
        console.log('#', control.nodeName.toUpperCase());
        console.log('#', window.CONTROLS.indexOf(control.nodeName.toUpperCase()));
        const ctrl = control.nodeName.toUpperCase();

        // ### attach listener to controls with the exception of 'xf-output' controls which cannot be changed.
        if(window.CONTROLS.indexOf(ctrl) != -1 && ctrl !== 'XF-OUTPUT'){
            console.log('attaching listener to ', control);

            if(control.nodeName === 'SELECT'){
                control.addEventListener('change', function(e){
                    console.log('changing....... ', e);
                    proxy.value = e.target.value;
                }.bind(this));
            }else
            if(control.hasAttribute('incremental')){
                console.log('incremental handler');

                control.addEventListener('keyup', function(e){
                    console.log('keyup....... ', e);
                   proxy.value = e.target.value;
                }.bind(this));
            }else{
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
    _applyProperties(control, bind){
        if (bind.alert !== undefined) {
            // console.log('apply alert prop ', bind.alert);
            //todo
        }
        if (bind.readonly !== undefined) {
            // console.log('apply readonly prop ', bind.readonly);
            if(bind.readonly){
                control.setAttribute('readonly','readonly')
            }else{
                control.removeAttribute('readonly');
            }
        }
        if (bind.required !== undefined) {
            // console.log('apply required prop ', bind.required);
            control.setAttribute('required', 'required');
        }
        if (bind.relevant !== undefined) {
            // console.log('apply relevant prop ', bind.relevant);
            if(bind.relevant){
                control.style.display = 'inline-block';
            }else {
                control.style.display = 'none';
            }
        }
        if (bind.valid !== undefined) {
            // console.log('apply valid prop ', bind.valid);
            //todo
        }
        if (bind.type !== undefined) {
            // console.log('apply type prop ', bind.type);
            //todo
        }
        if (bind.value !== undefined) {
            console.log('apply value prop ', bind.value);

            //todo: this is obviously not optimal as it requires too much knowledge about certain controls
            // todo: why does third condition does not apply to normal input control?
            if(control.type === 'checkbox'){
                control.checked = bind.value;
            }else if(control.value !== 'undefined'){
                // ### all controls should have a 'value' property
                control.value = bind.value;
            }else{
                console.warn(control, ' has no "value" property')
            }

        }
    }

}

window.customElements.define('xf-form', XfForm);
