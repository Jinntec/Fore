// import {css, html} from 'lit-element';
import XfAbstractControl from './abstract-control.js';
import {Fore} from '../fore.js';
import {evaluateXPathToNodes} from '../xpath-evaluation.js';

/**
 * `fx-control`
 * a generic wrapper for controls
 *
 *
 *
 * @customElement
 * @demo demo/index.html
 */
class FxControl extends XfAbstractControl {


    constructor() {
        super();
        this.inited = false;
        this.attachShadow({mode: 'open'});

    }

    connectedCallback() {
        this.updateEvent = this.hasAttribute('update-event') ? this.getAttribute('update-event') : 'blur';
        this.valueProp = this.hasAttribute('value-prop') ? this.getAttribute('value-prop') : 'value';

        const style = `
          :host {
            display: inline-block;
          }
          #widget {
            display: inline-block;
          }
          [name='label'] {
            display: inline;
          }
        `;

        const controlHtml = `
            <slot></slot>
            <fx-setvalue id="setvalue" ref="${this.ref}"></fx-setvalue>
        `;

        this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${controlHtml}
        `
        this.widget = this.getWidget();
        console.log('widget ', this.widget);
        this.widget.addEventListener(this.updateEvent, () => {
            console.log('eventlistener ', this.updateEvent);

            const modelitem = this.getModelItem();
            const setval = this.shadowRoot.getElementById('setvalue');
            setval.setValue(modelitem, this.widget[this.valueProp]);
            // console.log('updated modelitem ', modelitem);
        });

    }

    getWidget() {
        let widget =  this.querySelector('.fxWidget');
        if(!widget){
            widget = this.querySelector('input');
        }
        if(!widget){
            const input = document.createElement('input');
            input.classList.add('fxWidget');
            input.setAttribute('type', 'text');
            this.appendChild(input);
            return input;
        }
        return widget;
    }

    async updateWidgetValue() {
        // this.control[this.valueProp] = this.value;
        if (this.valueProp === 'checked') {
            if (this.value === 'true') {
                this.widget.checked = true;
            } else {
                this.widget.checked = false;
            }
        } else {
            let { widget } = this;
            if (!widget) {
                widget = this;
            }
            widget.value = this.value;
        }
    }


    async refresh() {
        super.refresh();
        const {widget} = this;

        // ### if we find a ref on control we have a 'select' control of some kind
        // todo: review - seems a bit implicite to draw that 'itemset decision' just from the existence of a 'ref'
        if (this.widget.hasAttribute('ref')) {
            const tmpl = this.widget.querySelector('template');

            // ### eval nodeset for list control
            const ref = this.widget.getAttribute('ref');
            const inscope = this._inScopeContext();
            const formElement = this.closest('fx-form');
            const nodeset = evaluateXPathToNodes(ref, inscope, formElement, Fore.namespaceResolver);

            // ### clear items
            const {children} = this.widget;
            Array.from(children).forEach(child => {
                if (child.nodeName.toLowerCase() !== 'template') {
                    child.parentNode.removeChild(child);
                }
            });

            // ### build the items
            Array.from(nodeset).forEach(node => {
                const content = tmpl.content.firstElementChild.cloneNode(true);
                const newEntry = document.importNode(content, true);
                // console.log('newEntry ', newEntry);
                this.widget.appendChild(newEntry);

                // ### initialize new entry
                // ### set value
                const valueAttribute = this._getValueAttribute(newEntry);
                const valueExpr = valueAttribute.value;
                const cutted = valueExpr.substring(1, valueExpr.length - 1);
                const evaluated = Fore.evaluateXPath(cutted, node, formElement, Fore.namespaceResolver);
                valueAttribute.value = evaluated;

                // ### set label
                const optionLabel = newEntry.textContent;
                const labelExpr = optionLabel.substring(1, optionLabel.length - 1);
                console.log('label Expr ', labelExpr);

                // todo : should use evaluateToString()
                const label = Fore.evaluateXPath(labelExpr, node, formElement, Fore.namespaceResolver);
                newEntry.textContent = label.textContent;
            });
        }
    }

    // eslint-disable-next-line class-methods-use-this
    _getValueAttribute(element) {
        let result;
        Array.from(element.attributes).forEach(attribute => {
            const attrVal = attribute.value;
            if (attrVal.indexOf('{') !== -1) {
                // console.log('avt found ', attribute);
                result = attribute;
            }
        });
        return result;
    }

}

window.customElements.define('fx-control', FxControl);
