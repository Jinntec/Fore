import {Fore} from '../fore.js';
import ForeElementMixin from '../ForeElementMixin.js';
import {withDraggability} from "../withDraggability.js";

/**
 * `fx-repeat`
 * an xformish form for eXist-db
 *
 * @customElement
 * @demo demo/index.html
 */
export class FxRepeatitem extends withDraggability(ForeElementMixin, true) {
    static get properties() {
        return {
            inited: {
                type: Boolean,
            },
        };
    }

    constructor() {
        super();
        this.inited = false;

        this.addEventListener('click', this._dispatchIndexChange);
        // this.addEventListener('focusin', this._handleFocus);
        this.addEventListener('focusin', this._dispatchIndexChange);

        this.attachShadow({mode: 'open', delegatesFocus: true});

        this.dropTarget = null;

    }

    connectedCallback() {
        super.connectedCallback();
        this.display = this.style.display;

        const html = `
           <slot></slot>
        `;

        this.shadowRoot.innerHTML = `
            ${html}
        `;
        this.getOwnerForm().registerLazyElement(this);

        this.ref = `${this.parentNode.ref}`;

        this.tabindex = 0;

    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('click', this._dispatchIndexChange);
        this.removeEventListener('focusin', this._handleFocus);
    }


    init() {
        // console.log('repeatitem init model ', this.nodeset);
        // this._initializeChildren(this);
        this.inited = true;
    }

    /*
      getModelItem() {
      super.getModelItem();
      // console.log('modelItem in repeatitem ', this.getModelItem()[this.index]);
      return this.getModelItem()[this.index];
      }
    */

    _dispatchIndexChange() {
        this.dispatchEvent(
            new CustomEvent('item-changed', {composed: false, bubbles: true, detail: {item: this, index: this.index}}),
        );
    }


    refresh(force) {
        this.modelItem = this.getModelItem();
        // ### register ourselves as boundControl
        if (!this.modelItem.boundControls.includes(this)) {
            this.modelItem.boundControls.push(this);

            if (this.modelItem && !this.modelItem.relevant) {
                this.removeAttribute('relevant');
                this.setAttribute('nonrelevant', '');
            } else {
                this.removeAttribute('nonrelevant');
                this.setAttribute('relevant', '');
            }
        }
        // Always recurse for these refreshes, especially when forced
        Fore.refreshChildren(this, force);
    }
}

if (!customElements.get('fx-repeatitem')) {
    window.customElements.define('fx-repeatitem', FxRepeatitem);
}
