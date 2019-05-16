import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import '../assets/@polymer/iron-ajax/iron-ajax.js';

/**
 * `fore-form`
 * an xformish form for eXist-db
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
                value:function () { return [] },
                notify:true
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('xf-form connected ', window.location.pathname);


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

        if(this.mockup){
            // console.log('loading mockup data from : ', this.mockup);
            this.model = JSON.parse(this.mockup);
        }

        if(this.model){
            this.model.forEach(item => this._processData(item, 0));
            this.dispatchEvent(new CustomEvent('ui-initialized'));
        }

    }
    _updateData(){
        console.log('### updateData ', this.model);
    }

    _getBindId(bind) {
        if (bind.bind && bind.bind.id) {
            return bind.bind.id;
        } else if (bind.id) {
            return bind.id
        }
    }

    /**
     * recursively processes all model data to initialize the UI
     *
     * @param bind
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
            this._initControls(bind.id, bind, index);
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

    _initControls(bindId, bind, index) {
        // console.log('_initControls for bind ', bindId, bind, index);

        // ### searching all controls that are bound to given bind id
        const search = '[bind=' + bindId + ']';
        const found = document.querySelectorAll(search);
        // console.log('found controls ', found);

        // ### if no controls are bound back out
        if(!found[0]) {
            // console.warn('bind with id ' + bindId + ' is not bound in this form');
            return;
        }

        // ### setting up a proxy object for binding with also keeps references to all bound controls
        const handler = {
            get(target, key){
                console.log('getting value: ', target[key]);
                return target[key];
            },
            set(target, key,value){
                console.log('setting value ', value);
                // console.log('@@@bind ', bind);
                console.log('@@@bind id ', bind.id);

                // ### bound controls are stored in an array 'boundElements'
                if(key === 'bound'){
                    if(target.boundElements === undefined){
                        target.boundElements=[];
                    }
                    console.log('added bound control: ', proxy);
                    target.boundElements.push(value);
                }

                // ### actual setting of values
                if(key === 'value'){

                    target[key] = value;

                    target.boundElements.forEach( control => {
                       control.value = value;
                    });

                }
                return true;
            }

        };
        const proxy = new Proxy(bind, handler);
        console.log('new proxy ', proxy);


        found.forEach((elem) => {
           //todo: if bind id is not defined we might have a simple set bindings - needs special treatment

           // store control in proxy object
           proxy.bound = elem;

           this._applyProperties(elem, bind);
           this._attachListener(elem,bind,proxy);

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

    _attachListener(control,bind,proxy){

        // xf-output is the exception from the rule. Outputs do not have update listeners
        if(control.nodeName.toUpperCase() !== 'XF-OUTPUT'){
            console.log('attaching listener to ', control);

            if(control.hasAttribute('incremental')){
                console.log('incremental handler');

                control.addEventListener('keyup', function(e){
                    console.log('changing....... ', e);
                   proxy.value = e.target.value;
                }.bind(this));
            }else{
                control.addEventListener('blur', function (e) {
                    proxy.value = e.target.value;
                });
            }


        }
    }

    _applyProperties(control, bind){
        if (bind.alert !== undefined) {
            // console.log('apply alert prop ', bind.alert);
        }
        if (bind.readonly !== undefined) {
            // console.log('apply readonly prop ', bind.readonly);
        }
        if (bind.required !== undefined) {
            // console.log('apply required prop ', bind.required);
            control.setAttribute('required', 'required');
        }
        if (bind.relevant !== undefined) {
            // console.log('apply relevant prop ', bind.relevant);
        }
        if (bind.valid !== undefined) {
            // console.log('apply valid prop ', bind.valid);
        }
        if (bind.type !== undefined) {
            // console.log('apply type prop ', bind.type);
        }
        if (bind.value !== undefined) {
            // console.log('apply value prop ', bind.value);

            //todo: this is obviously not optimal as it requires too much knowledge about certain controls
            // todo: why does third condition does not apply to normal input control?
            if (control.type === 'text') {
                control.value = bind.value;
            } else if (control.type === 'checkbox') {
                control.checked = bind.value;
            } else if('undefined' === typeof (control.value)) {
                // ### if control has a value property
                control.value = bind.value;
            }
        }
    }

}

window.customElements.define('xf-form', XfForm);
