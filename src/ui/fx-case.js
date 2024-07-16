// import { foreElementMixin } from '../ForeElementMixin';

import {FxContainer} from "./fx-container.js";
import {Fore} from "../fore.js";

/**
 * `fx-case`
 * a container allowing to switch between fx-case elements
 *
 *  * todo: implement
 * @customElement
 */
class FxCase extends FxContainer {
    static get properties() {
        return {
            ...super.properties,
            label:{
                type: String
            },
            name:{
                type: String
            },
            selected:{
                type:String
            },
            selector:{
                type: String
            },
            src: {
                type: String,
            },
        };
    }

    /*
      constructor() {
        super();
      }
    */

    connectedCallback() {
        if (this.hasAttribute('label')) {
            this.label = this.getAttribute('label');
        }
        if (this.hasAttribute('name')) {
            this.name = this.getAttribute('name');
        }
        if (this.hasAttribute('selected')) {
            this.selected = this.getAttribute('selected');
        }
        if (this.hasAttribute('selector')) {
            this.selector = this.hasAttribute('selector') ? this.getAttribute('selector'): 'fx-fore';
        }
        if (this.hasAttribute('src')) {
            this.src = this.getAttribute('src');
        }

        const style = `
            :host {
                visibility: none;
            }
        `;
        const html = `
           ${this.label ? `<span>${this.label}</span>` : ''}
           <slot></slot>
        `;
        this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${html}
        `;

        this.addEventListener('select', () =>{
            if(this.src){
                this._loadFromSrc()
            }
            this.getOwnerForm().refresh(true);
        });
    }

    /**
     * loads a Fore from an URL given by `src`.
     *
     * Will extract the `fx-fore` element from that target file and use and replace current `fx-fore` element with the loaded one.
     * @private
     */
    async _loadFromSrc() {
        // console.log('########## loading Fore from ', this.src, '##########');
        await Fore.loadForeFromSrc(this, this.src, this.selector);
    }

}

if (!customElements.get('fx-case')) {
    window.customElements.define('fx-case', FxCase);
}
