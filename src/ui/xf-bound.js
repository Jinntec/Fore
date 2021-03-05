import {css, html} from 'lit-element';
import XfAbstractControl from "./xf-abstract-control.js";
import {Fore} from "../fore.js";

/**
 * `xf-bound`
 * a generic wrapper for controls
 *
 *
 *
 * @customElement
 * @demo demo/index.html
 */
class XfBound extends XfAbstractControl {

    static get styles() {
        return css`
        :host {
          display: inline-block;
        }
        `;
    }

    static get properties() {
        return {
            ...super.properties,
            updateEvent:{
                type: String,
                attribute:'update-event'
            },
            valueProp:{
                type:String,
                attribute:'value-prop'
            }
        };
    }

    constructor(){
        super();
        this.updateEvent='blur';
        this.valueProp='value'; // default
        this.inited = false;
    }

    render() {
        return html`
           <slot name="alert"></slot>
           <slot name="label"></slot>
           <slot></slot>    
           <slot name="hint"></slot>    
           <xf-setvalue id="setvalue" ref="${this.ref}"></xf-setvalue>
        `;
    }

    firstUpdated(_changedProperties) {
        // console.log('firstUpdated ', _changedProperties);
        super.firstUpdated(_changedProperties);
        // console.log('updateEvent', this.updateEvent);

        let {control} = this;
        if(!control){
            const input = document.createElement('input');
            input.setAttribute('type', 'text');
            this.appendChild(input);
            control = input;
        }

        control.addEventListener(this.updateEvent, (e) => {
            console.log('eventlistener ', this.updateEvent);

            const modelitem = this.getModelItem();
            const setval = this.shadowRoot.getElementById('setvalue');
            setval.setValue(modelitem, control[this.valueProp]);
            // console.log('updated modelitem ', modelitem);
        });

        this.inited = true;
    }

    get control(){
        const defaultSlot = this.shadowRoot.querySelector('slot:not([name])');
        const ctrl = defaultSlot.assignedElements({flatten: true})[0];
        return  ctrl;
    }

    refresh () {
        super.refresh();
        // await this.updateComplete;
        const {control} = this;

        // ### if we find a ref on control we have a 'select' control of some kind
        // todo: review - seems a bit implicite to draw that 'itemset decision' just from the existence of a 'ref'
        if(this.control.hasAttribute('ref')){
            const tmpl = control.querySelector('template');

            // ### eval nodeset for list control
            const ref = control.getAttribute('ref');
            const inscope = this._inScopeContext();
            const formElement = this.closest('xf-form');
            const nodeset = Fore.evaluateToNodes (ref, inscope, formElement, Fore.namespaceResolver) ;

            // ### clear items
            const children = this.control.children;
            Array.from(children).forEach(child => {
               if(child.nodeName.toLowerCase() !== 'template'){
                   child.parentNode.removeChild(child);
               }
            });

            // ### build the items
            Array.from(nodeset).forEach(node => {
                const content = tmpl.content.firstElementChild.cloneNode(true);
                const newEntry = document.importNode(content, true);
                // console.log('newEntry ', newEntry);
                this.control.appendChild(newEntry);

                // ### initialize new entry
                // ### set value
                const valueAttribute = this._getValueAttribute(newEntry);
                const valueExpr = valueAttribute.value;
                const cutted = valueExpr.substring(1, valueExpr.length -1);
                const evaluated = Fore.evaluateXPath(cutted, node, formElement, Fore.namespaceResolver) ;
                valueAttribute.value = evaluated;

                // ### set label
                const optionLabel = newEntry.textContent;
                const labelExpr = optionLabel.substring(1, optionLabel.length-1);
                console.log('label Expr ', labelExpr);

                // todo : should use evaluateToString()
                const label = Fore.evaluateXPath(labelExpr, node, formElement, Fore.namespaceResolver) ;
                newEntry.textContent = label.textContent;

            });
        }

    }

    _getValueAttribute (element){
        let result;
        Array.from(element.attributes).forEach(attribute => {
            const attrVal = attribute.value;
            if(attrVal.indexOf('{') !== -1){
                // console.log('avt found ', attribute);
                result =  attribute;
            }

        });
        return result;
    }

/*
    getAVTs (element){
        let n;
        const arr = [];

        const walker = document.createTreeWalker(element,
            NodeFilter.SHOW_ALL,
            {
                acceptNode(node) {
                    if(node.nodeType === Node.TEXT_NODE){
                        return NodeFilter.FILTER_ACCEPT;
                    }else if (node.nodeType === Node.ATTRIBUTE_NODE){
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_REJECT;
                }
            });
        console.log('walker current ', walker.currentNode);
/!*
        while(walker.nextNode()){
            arr.push(walker.currentNode);
        }
*!/
/!*
        n = walker.nextNode();
        while( walker.nextNode() ){
            arr.push(n)
            n = walker.nextNode()
        }
*!/
        return arr;
    }
*/

}

window.customElements.define('xf-bound', XfBound);
