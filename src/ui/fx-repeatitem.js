import { Fore } from '../fore.js';
import { foreElementMixin } from '../ForeElementMixin.js';
import {Relevance} from "../relevance.js";

/**
 * `fx-repeat`
 * an xformish form for eXist-db
 *
 * @customElement
 * @demo demo/index.html
 */
export class FxRepeatitem extends foreElementMixin(HTMLElement) {
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

    this.attachShadow({ mode: 'open', delegatesFocus: true });
  }

  _handleFocus() {
    this.parentNode.setIndex(this.index);
    // TODO: do this somewhere else, somewhere more central

    /**
     * todo: resolve - this is problematic as it triggers a lot of unneeded refreshes but it needed
     * when you want to support activating the right repeatitem when the user tabs through controls.
     */
    // this.closest('fx-fore').refresh();
  }

  _dispatchIndexChange() {
    // console.log('_dispatchIndexChange on index ', this.index);
    if (this.parentNode) {
      this.parentNode.dispatchEvent(
        new CustomEvent('item-changed', { composed: false, bubbles: true, detail: { item: this , index:this.index } }),
      );
    }
  }

  connectedCallback() {
    this.display = this.style.display;

    const html = `
           <slot></slot>
        `;

    this.shadowRoot.innerHTML = `
            ${html}
        `;
      this.getOwnerForm().registerLazyElement(this);

	  this.ref = `${this.parentNode.ref}`;
  }

  disconnectedCallback() {
    // console.log('disconnectedCallback ', this);
    this.removeEventListener('click', this._dispatchIndexChange());
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

  refresh(force) {
    this.modelItem = this.getModelItem();
    // ### register ourselves as boundControl
    if (!this.modelItem.boundControls.includes(this)) {
      this.modelItem.boundControls.push(this);
    }

    // Relevance.handleRelevance(this);
    if (this.modelItem && !this.modelItem.relevant) {
        this.removeAttribute('relevant');
        this.setAttribute('nonrelevant','');
    } else {
        this.removeAttribute('nonrelevant');
		this.setAttribute('relevant','');
    }

    /*
    if (this?.modelItem?.relevant) {
      // Fore.refreshChildren(this);
    } else {
    }
*/

    Fore.refreshChildren(this, force);
  }
}

if (!customElements.get('fx-repeatitem')) {
  window.customElements.define('fx-repeatitem', FxRepeatitem);
}
