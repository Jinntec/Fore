import XfAbstractControl from './abstract-control.js';
import {evaluateXPath, evaluateXPathToString, evaluateXPathToNodes} from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';
import FxControl from "./fx-control.js";
import {Fore} from "../fore.js";

/**
 * FxItems provices a templated list over its bound nodes. It is not standalone but expects to be used
 * within an fx-control element.
 *
 * @demo demo/selects3.html
 */
export class FxItems extends FxControl {
    static get properties() {
        return {
            ...super.properties,
            valueAttr: {
                type: String,
            },
        };
    }

    constructor() {
        super();
        this.valueAttr = this.hasAttribute('value') ? this.getAttribute('value') : null;
    }

    connectedCallback() {
        super.connectedCallback();

        this.addEventListener('click',(e) => {
            const items = this.querySelectorAll('[value]');

            let target;
            if(e.target.nodeName === 'LABEL') {
                target = document.getElementById(e.target.getAttribute('for'));
                if (target.checked) {
                    target.checked = false;
                } else{
                    target.checked = true;
                }
            }

            const oldVal = this.getAttribute('value');

            let val = '';
            Array.from(items).forEach(item => {
                if(item.checked){
                    val += ' ' + item.getAttribute('value');
                }
            });
            this.setAttribute('value',val.trim());

            const parentBind = this.parentNode.closest('[ref]');
            if(!parentBind) return ;
            const setval = this.shadowRoot.getElementById('setvalue');
            const modelitem = parentBind.getModelItem();
            setval.setValue(modelitem, val.trim());
            setval.actionPerformed();

        });
    }


    getTemplate() {
        return this.querySelector('template');
    }


    getWidget() {
        return this;
    }

    async updateWidgetValue(){
        console.log('setting items value');

        const parentBind = this.parentNode.closest('[ref]');
        if(parentBind){
            this.value = parentBind.value;
        }
        this.setAttribute('value', this.value);

    }

    createEntry(node, tmpl) {
        // const content = tmpl.content.firstElementChild.cloneNode(true);
        const content = this.getTemplate().content.firstElementChild.cloneNode(true);
        const newEntry = document.importNode(content, true);
        console.log('newEntry ', newEntry);

        this.appendChild(newEntry);
        return newEntry;
    }


    updateEntry(newEntry, node) {
        console.log('fx-items updateEntry', this.value);
        // super.updateEntry(newEntry,node);

        // ### danger zone - highly specific ###
        // ### danger zone - highly specific ###
        // ### danger zone - highly specific ###
        const label = newEntry.querySelector('label');
        label.textContent = node.textContent;

        const id = Fore.createUUID();
        label.setAttribute('for', id);


        // getting element which has 'value' attr
        const input = newEntry.querySelector('[value]');
        // getting expr
        const expr = input.value;
        const cutted = expr.substring(1, expr.length - 1);
        const evaluated = evaluateXPath(cutted, node, newEntry);

        const valAttr = this.getAttribute('value');
        input.value = evaluated;
        input.setAttribute('id', id);
        if (valAttr.indexOf(input.value) !== -1) {
            input.checked = true;
        }
    }

}

customElements.define('fx-items', FxItems);
