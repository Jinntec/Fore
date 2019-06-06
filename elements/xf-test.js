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
 * `xf-test`
 * an xformish form framework for eXist-db.
 *
 * 'xf-test' is the main component of the client-side part of Fore. Just like an HTML form it wraps the controls
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
export class XfTest extends PolymerElement {

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
                    return [
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
                                                                "value":123
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
                                                    "value":22.50
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
                                                                "value":456
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
                                                                "value":678
                                                            },
                                                            {
                                                                "id": "b-origin",
                                                                "value": "Bangladesh"
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
                    ];
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
        console.log('xf-test connected ', window.location.pathname);

        console.log('b-cart: ', this.modelData.find(x => x.bind.id === 'b-cart').bind);
        console.log('b-products: ', this._findById(this.modelData,'b-products'));
        console.log('b-info: ', this._findById(this.modelData,'b-info'));
        console.log('b-serial: ', this._findById(this.modelData,'b-serial'));



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








}

window.customElements.define('xf-test', XfTest);
