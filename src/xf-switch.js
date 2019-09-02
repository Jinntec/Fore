import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import {BoundElementMixin} from './BoundElementMixin.js';
import  './xf-case.js';


/**
 * `xf-switch`
 * a container allowing to switch between xf-case elements
 *
 *
 * @customElement
 * @polymer
 */
class XfSwitch extends BoundElementMixin(PolymerElement) {

    static get template() {
        return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <slot></slot>
    `;
    }

    /*
        static get properties() {
            return {
            }
        }
    */


    init() {
        super.init();
        console.log('### init ', this);
        console.log('### init modelItem', this.modelItem);
        // if (!this.repeated) {
        // }

        if(this.bind){
            const cases = this.querySelectorAll('xf-case');
            Array.from(cases).forEach(caseElem => {
                console.log('case name: ', caseElem.name);
                if(caseElem.name === this.modelItem.value){
                    caseElem.hidden = false;
                }else{
                    caseElem.hidden = true;
                }
            });
        }

    }

    toggleCase(caseId){
        const cases = this.querySelectorAll('xf-case');
        Array.from(cases).forEach(caseElem => {
            console.log('case name: ', caseElem.name);
            if(caseElem.id === caseId){
                caseElem.hidden = false;

                // ### if the switch is bound the value of the bound node is updated and set to the value of the toggled cases' 'name' attribute.
                if(this.bind){
                    const path = this.ownerForm.resolveBinding(this);
                    this.modelItem.value = caseElem.name;

                    this.dispatchEvent(new CustomEvent('value-changed', {
                        composed: true,
                        bubbles: true,
                        detail: {'modelItem': this.modelItem,"path":path,"target":this}
                    }));
                }


            }else{
                caseElem.hidden = true;
            }
        });

    }


}

window.customElements.define('xf-switch', XfSwitch);
