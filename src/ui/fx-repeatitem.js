import { Fore } from '../fore.js';
import ForeElementMixin from '../ForeElementMixin.js';
import { withDraggability } from '../withDraggability.js';
import { DependencyTracker } from '../DependencyTracker';
import { ControlBinding } from '../binding/ControlBinding';

/**
 * `fx-repeat`
 * an xformish form for eXist-db
 *
 * @customElement
 * @demo demo/index.html
 *
 * @extends {ForeElementMixin}
 */
export class FxRepeatitem extends withDraggability(ForeElementMixin, true) {
    static get properties() {
        return {
            ...super.properties,
            inited: {
                type: Boolean,
            },
        };
    }

    constructor() {
        super();
        this.inited = false;
        this.binding = null;

        this.addEventListener('click', this._dispatchIndexChange);
        // this.addEventListener('focusin', this._handleFocus);
        this.addEventListener('focusin', this._dispatchIndexChange);

        this.attachShadow({ mode: 'open', delegatesFocus: true });

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
        this.removeEventListener('focusin', this._dispatchIndexChange);
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

    _dispatchIndexChange(event) {
        event.preventDefault();
        event.stopPropagation();
        /**
         * @type {import('./fx-repeat.js').FxRepeat}
         */
        // const repeat = this.parentNode;
        const repeat = event.target.closest('fx-repeat');
        if (repeat.index === this.index) {
            // The index did not really change if it did not change :wink:
            return;
        }

        console.log('_dispatchIndexChange', this, this.index);

        // const path = t
        DependencyTracker.getInstance().updateRepeatIndex(
            this.modelItem.path,
            this.index,
        );
        this.dispatchEvent(
            new CustomEvent('item-changed', {
                composed: false,
                bubbles: true,
                detail: { item: this, index: this.index },
            }),
        );
    }

    refresh(force) {
        // if(!typeof this.refresh === 'function') return;
        console.log('repeatitem refresh', this);
        this.modelItem = this.getModelItem();
        // ### register ourselves as boundControl
        /*
        DependencyTracker.getInstance().registerControl(
            this.modelItem.path,
            this,
        );
*/
        if (!this.binding) {
            this.binding = new ControlBinding(this.modelItem.path, this);
            DependencyTracker.getInstance().registerControl(
                this.modelItem.path,
                this.binding,
            );
        }

        if (this.modelItem && !this.modelItem.relevant) {
            this.removeAttribute('relevant');
            this.setAttribute('nonrelevant', '');
        } else {
            this.removeAttribute('nonrelevant');
            this.setAttribute('relevant', '');
        }
        // Always recurse for these refreshes, especially when forced
        // todo: refresh all children - to be changed later
        Fore.refreshChildren(this, force);
    }
}

if (!customElements.get('fx-repeatitem')) {
    window.customElements.define('fx-repeatitem', FxRepeatitem);
}
