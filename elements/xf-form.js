import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import '../assets/@polymer/iron-ajax/iron-ajax.js';

/**
 * `fore-form`
 * an xformish form for eXist-db
 *
 * @customElement
 * @polymer
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
            data: {
                type: Array,
                value:[
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
                                                    {
                                                        "id": "b-serial",
                                                        "type": "xs:integer"
                                                    },
                                                    {
                                                        "id": "b-origin"
                                                    }
                                                ]
                                            },
                                            {
                                                "id": "price",
                                                "type": "xs:double"
                                            }
                                        ],
                                        [
                                            {
                                                "id": "b-info",
                                                "bind": [
                                                    {
                                                        "id": "b-serial",
                                                        "type": "xs:integer"
                                                    },
                                                    {
                                                        "id": "b-origin"
                                                    }
                                                ]
                                            },
                                            {
                                                "id": "price",
                                                "type": "xs:double"
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
        console.log("data ", this.data);
        // this.$.initForm.params = {"token": this.token};
        // this.$.initForm.generateRequest();

        this.refresh();
    }

    refresh() {
        this.data.forEach(binding => this._initBinding(binding));
    }


    _initBinding(binding) {
        console.log('init binding ', binding);



        //get the bind id
        let bindId;
        if(binding.bind !== undefined) {
            bindId = binding.bind.id;
        }else{
            bindId = binding.id;
        }
        // console.log("bind id: ", bindId);

        const search = '[bind=' + bindId + ']';
        console.log("binding query ", search);

        const boundElements = this.querySelectorAll('[bind="' + bindId + '"]');
        // console.log('found bound control ', boundElements);

        // console.log('has children: ',binding.bind.bind);
        // if (binding.bind.bind) {
        if (Array.isArray(binding.bind)) {
            console.log('its a set');


            const items = binding.bind.bind;
            for (let i = 0; i < items.length; i++) {
                console.log('item ', items[i]);
                const entry = items[i];
                for (let j = 0; j < entry.length; j++) {
                    console.log('child bind ', entry[j].id);
                    this._initBinding(entry[j]);
                }
            }

        } else {
            if(binding.bind !== undefined){
                // console.log("child bind ", binding.bind.bind);
                const subBind = binding.bind.bind;
                if(Array.isArray(subBind)){
                    console.log('is an array ', subBind );

                    for (let i = 0; i < subBind.length; i++) {
                        console.log("subBind idx", i);
                        console.log("subBind ", subBind[i]);
                        if(Array.isArray(subBind[i])){

                            const entry = subBind[i];
                            for (let j = 0; j < entry.length; j++) {
                                console.log('child bind ', entry[j].id);
                                this._initBinding(entry[j]);
                            }


                        }else {
                            this._initBinding(subBind[i]);
                        }
                    }

                }else{
                    console.log('is not an array');
                }
            }
        }
    }
}

window.customElements.define('xf-form', XfForm);
