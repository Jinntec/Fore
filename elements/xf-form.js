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
                 method="GET"
                 ></iron-ajax>
       <slot></slot>
    `;
    }


    static get properties() {
        return {
            token: {
                type: String
            },
            data:{
                type:Array,
                value:[
                    {
                        "bind": {
                            "id": "b-todo",
                            "bind": [
                                [
                                    {
                                        "id": "b-task",
                                        "required": true,
                                        "value":"Pick up Milk"
                                    },
                                    {
                                        "id": "b-state",
                                        "type": "boolean",
                                        "value": false
                                    },
                                    {
                                        "id": "b-due",
                                        "type": "date",
                                        "value":"2019-03-01"
                                    }
                                ],
                                [
                                    {
                                        "id": "b-task",
                                        "required": true,
                                        "value":"Make tutorial part"
                                    },
                                    {
                                        "id": "b-state",
                                        "type": "boolean",
                                        "value": true
                                    },
                                    {
                                        "id": "b-due",
                                        "type": "date",
                                        "value":"2019-04-01"
                                    }
                                ]
                            ]
                        }
                    }
                ]

            }
        };
    }


    connectedCallback() {
        super.connectedCallback();
        console.log('xf-form connected ', this);
        console.log('xf-form connected ', window.location.pathname);

        // this.$.initForm.params = {"token": this.token};
        // this.$.initForm.generateRequest();

    }

    ready(){
        super.ready;
        console.log('all components are up');

        window.addEventListener('WebComponentsReady', function() {
            console.log('#### WebComponentsReady #####');
            document.querySelector('xf-form').init();
        });
    }

    init() {
        this.data.forEach(bind => this._initBinding(bind, 0));
    }

    _getBindId(bind){
        if (bind.bind && bind.bind.id) {
            return bind.bind.id;
        } else if (bind.id) {
            return bind.id
        }
    }

    _initBinding(bind, index) {
        // console.log("bind: ", bind);

        if (bind.bind && bind.bind.id) {
            // console.log("call APPLY-STATE 1 for bind ", bind.bind.id);
            this._applyInitialState(bind.bind.id, bind.bind, index);
        } else if (bind.id) {
            // console.log("call APPLY-STATE 2 for bind ", bind.id);
            this._applyInitialState(bind.id, bind, index);
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
                    this._initBinding(inner[j], i);
                }
            }
        } else if (Array.isArray(bind)) {
            const plain = bind;
            for (let i = 0; i < plain.length; i++) {
                this._initBinding(plain[i], i);
            }
        } else if (bind.bind && bind.bind.bind) {
            // console.log('yes, we have children');
            const child = bind.bind.bind;
            // console.log("child ", child);
            this._initBinding(child ,0);
        } else if (bind.bind) {
            this._initBinding(bind.bind, 0);
        }

    }

    _applyInitialState(bindId, bind, index){
        console.log('_applyInitialState for bind ', bind);
        // console.log('_applyInitialState for bind id ', bindId);
        // console.log('_applyInitialState index ', index);
        const search = '[bind=' + bindId + ']';

        const found = document.querySelectorAll(search);
        console.log('found controls ', found);

        const targetElem = found[0];
/*
        if(found[0].nodeName.toUpperCase() === 'XF-REPEAT'){
            console.log('>>>>>>>> init repeat');

        }
*/

        if(bind.bind && Array.isArray(bind.bind[0])){
            console.log('>>>>>>>> init repeat');
            const items = bind.bind;

            for(const item in items){
                const repeat = found[0];
                console.log('repeat ', repeat);
                repeat.append();
            }
        }

        // console.log('_applyInitialState for bind id ', this._getBindId(bind));

        //todo: if bind id is not defined we might have a simple set bindings - needs special treatment

        if(bind.alert !== undefined){
            console.log('apply alert prop ', bind.alert);
        }
        if(bind.readonly !== undefined){
            console.log('apply readonly prop ', bind.readonly);
        }
        if(bind.required !== undefined){
            console.log('apply required prop ', bind.required);
            found[index].setAttribute('required','required');
        }
        if(bind.relevant !== undefined){
            console.log('apply relevant prop ', bind.relevant);
        }
        if(bind.valid !== undefined){
            console.log('apply valid prop ', bind.valid);
        }
        if(bind.type !== undefined){
            console.log('apply type prop ', bind.type);
        }
        if(bind.value !== undefined){
            console.log('apply value prop ', bind.value);

            //todo: this is obviously not optimal as it requires too much knowledge about certain controls
            const control = found[index];
            if(control.type === 'text'){
                control.value = bind.value;
            }else if(control.type === 'checkbox'){
                control.checked = bind.value;
            }
        }
    }

}

window.customElements.define('xf-form', XfForm);
