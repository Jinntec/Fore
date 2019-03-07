import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import '../assets/@polymer/iron-ajax/iron-ajax.js';

/**
 * `fore-form`
 * an xformish form for eXist-db
 *
 # * @polymer
 * @demo demo/index.html
 */
class XfForm extends PolymerElement {
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
            todo:{
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
                                        "type": "date"
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
                                        "type": "date"
                                    }
                                ]
                            ]
                        }
                    }
                ]

            },
            data: {
                type: Array,
                value: [
                    {
                        "bind": {
                            "id": "b-cart",
                            "bind": [
                                {
                                    "id": "b-total",
                                    "valid": false,
                                    "alert": "total must sum up to 70.20"
                                },
                                {
                                    "id": "b-products",
                                    "bind": [
                                        [
                                            {
                                                "id": "b-info",
                                                "bind": [
                                                    [
                                                        {
                                                            "id": "b-serial",
                                                            "type": "xs:integer",
                                                            "value": 123
                                                        },
                                                        {
                                                            "id": "b-origin",
                                                            "value": "China"
                                                        }
                                                    ]
                                                ]
                                            },
                                            {
                                                "id": "price",
                                                "type": "xs:double",
                                                "value": 22.50
                                            }
                                        ],
                                        [
                                            {
                                                "id": "b-info",
                                                "bind": [
                                                    [
                                                        {
                                                            "id": "b-serial",
                                                            "type": "xs:integer",
                                                            "value": 456
                                                        },
                                                        {
                                                            "id": "b-origin",
                                                            "value": "China"
                                                        }
                                                    ]
                                                ]
                                            },
                                            {
                                                "id": "price",
                                                "type": "xs:double",
                                                "value": 34.50
                                            }
                                        ],
                                        [
                                            {
                                                "id": "b-info",
                                                "bind": [
                                                    [
                                                        {
                                                            "id": "b-serial",
                                                            "type": "xs:integer",
                                                            "value": 678
                                                        },
                                                        {
                                                            "id": "b-origin",
                                                            "value": "Bangladesh"
                                                        }
                                                    ],
                                                    [
                                                        {
                                                            "id": "b-serial",
                                                            "type": "xs:integer",
                                                            "value": 999
                                                        },
                                                        {
                                                            "id": "b-origin",
                                                            "value": "Canada"
                                                        }
                                                    ]
                                                ]
                                            },
                                            {
                                                "id": "price",
                                                "type": "xs:double",
                                                "value": 13.25
                                            }
                                        ]
                                    ]
                                }
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
        console.log("data ", this.todo);

        // this.$.initForm.params = {"token": this.token};
        // this.$.initForm.generateRequest();


        this.refresh();
    }

    refresh() {
        this.todo.forEach(bind => this._initBinding(bind));
    }

    _getBindId(bind){
        if (bind.bind && bind.bind.id) {
            return bind.bind.id;
        } else if (bind.id) {
            return bind.id
        }
    }

    _initBinding(bind) {
        // console.log("bind: ", bind);

        if (bind.bind && bind.bind.id) {
            // console.log("call APPLY-STATE 1 for bind ", bind.bind.id);
            this._applyState(bind.bind.id, bind.bind);
        } else if (bind.id) {
            // console.log("call APPLY-STATE 2 for bind ", bind.id);
            this._applyState(bind.id, bind);
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
                    this._initBinding(inner[j]);
                }
            }
        } else if (Array.isArray(bind)) {
            const plain = bind;
            for (let i = 0; i < plain.length; i++) {
                this._initBinding(plain[i]);
            }
        } else if (bind.bind && bind.bind.bind) {
            // console.log('yes, we have children');
            const child = bind.bind.bind;
            // console.log("child ", child);
            this._initBinding(child);
        } else if (bind.bind) {
            this._initBinding(bind.bind);
        }

    }

    _applyState(bindId,bind){
        // console.log('_applyState for bind ', bind);
        console.log('_applyState for bind id ', bindId);
        // console.log('_applyState for bind id ', this._getBindId(bind));

        //todo: if bind id is not defined we might have a simple set bindings - needs special treatment

        if(bind.alert !== undefined){
            console.log('apply alert prop ', bind.alert);
        }
        if(bind.readonly !== undefined){
            console.log('apply readonly prop ', bind.readonly);
        }
        if(bind.required !== undefined){
            console.log('apply required prop ', bind.required);
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
        }
    }

}

window.customElements.define('xf-form', XfForm);
