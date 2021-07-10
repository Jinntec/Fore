import {foreElementMixin} from '../ForeElementMixin.js';
import {Fore} from '../fore.js';
import {FxContainer} from './fx-container.js';

/**
 * `fx-switch`
 * a container allowing to switch between fx-case elements
 *
 *  * todo: implement
 * @customElement
 */
class FxSwitch extends FxContainer {
    /*
      constructor() {
        super();
        // this.attachShadow({ mode: 'open' });
      }
    */

    connectedCallback() {
        super.connectedCallback();
/*
        if (this.hasAttribute('ref')) {
            this.ref = this.getAttribute('ref');
        }
*/

        /*
            const style = `
                    :host {
                        display: block;
                    }
                    :host ::slotted(fx-case){
                        display:none;
                    }
                `;
            const html = `
                   <slot></slot>
                `;
            this.shadowRoot.innerHTML = `
                    <style>
                        ${style}
                    </style>
                    ${html}
                `;
        */

        const slot = this.shadowRoot.querySelector('slot');
        slot.addEventListener('slotchange', event => {
            // console.log('fx-switch slotchange ', event.target.assignedElements());
            const cases = event.target.assignedElements();
            // console.log('fx-switch slotchange ', cases[0]);

/*
            if (this.isBound()) {
                cases.forEach(caseElem => {
                    const name = caseElem.getAttribute('name');
                    if (name === this.modelItem.value) {
                        caseElem.style.display = 'block';
                    } else {
                        caseElem.style.display = 'none';
                    }
                });
            } else {
                cases[0].style.display = 'block';
            }
*/


        });
    }

    refresh() {
        super.refresh();
        console.log('refresh on switch ');
        const cases = this.querySelectorAll('fx-case');
        if (this.isBound()) {
            Array.from(cases).forEach(caseElem => {
                const name = caseElem.getAttribute('name');
                if (name === this.modelItem.value) {
                    caseElem.style.display = 'block';
                } else {
                    caseElem.style.display = 'none';
                }
            });
        } else {
            cases[0].style.display = 'block';
        }


        Fore.refreshChildren(this);

        // console.log('value ', this.value);
    }

    toggle(caseElement) {
        const cases = this.querySelectorAll('fx-case');
        Array.from(cases).forEach(c => {
            if (caseElement === c) {
                // eslint-disable-next-line no-param-reassign
                c.style.display = 'block';
            } else {
                // eslint-disable-next-line no-param-reassign
                c.style.display = 'none';
            }
        });
    }
}

window.customElements.define('fx-switch', FxSwitch);
