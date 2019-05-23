import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import '../assets/@polymer/paper-listbox/paper-listbox.js';
import '../assets/@polymer/paper-item/paper-item.js';
import '../assets/@polymer/polymer/lib/elements/dom-repeat.js';


import { XfBound } from './xf-bound.js';


/**
 * `xf-itemset`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 */
class XfItemset extends XfBound {
    static get template() {
        return html`
      <style>
        :host {
          display: inline;
        }
      </style>
      <paper-listbox id="listbox" slot="dropdown-content" class="dropdown-content" attr-for-selected="value">
        <template is="dom-repeat" items="[[list]]">
            <paper-item value="[[_getItemValue(item)]]">[[_getItemLabel(item)]]</paper-item>
        </template>
      </paper-listbox>
    `;
    }


    static get properties() {
        return {
            list: {
                type: Array,
                value: function () {return [];}
            },
            bindLabel:{
                type:String
            },
            bindValue:{
                type:String
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        // console.log('xf-itemset bound children: ', this.proxy);
        // todo: fetch bind object for given bind id

        window.addEventListener('WebComponentsReady', function () {
            // console.log('#### WebComponentsReady catched in itemset #####');
            // console.log('itemset bound to proxy ', this.proxy.bind);
            // console.log('itemset bindLabel ', this.bindLabel);
            // console.log('itemset bindValue ', this.bindValue);
            this.list = this.proxy.bind;
        }.bind(this));

    }

    init(proxy){
        super.init(proxy);
        console.log('xf-itemset bound children: ', this.proxy);
    }

    selectItem(value){
        this.$.listbox.select(value);
    }

    _getItemValue(item){
        return item.find(x => x.id === this.bindValue).value;
    }

    _getItemLabel(item){
        return item.find(x => x.id === this.bindLabel).value;
    }


}

window.customElements.define('xf-itemset', XfItemset);
