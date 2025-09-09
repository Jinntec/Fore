import { Fore } from '../fore.js';
// import ForeElementMixin from '../ForeElementMixin.js';
import { withDraggability } from '../withDraggability.js';
import { UIElement } from './UIElement.js';

/**
 * `fx-repeat`
 * an xformish form for eXist-db
 *
 * @customElement
 * @demo demo/index.html
 *
 * @extends {UIElement}
 */
export class FxRepeatitem extends withDraggability(UIElement, true) {
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
    /**
     * @type {import('./fx-repeat.js').FxRepeat}
     */
    const repeat = this.parentNode;
    if (repeat.index === this.index) {
      // The index did not really change if it did not change :wink:
      return;
    }
    this.dispatchEvent(
      new CustomEvent('item-changed', {
        composed: false,
        bubbles: true,
        detail: { item: this, index: this.index },
      }),
    );
  }

  async refresh(force = false) {
    // this.modelItem = this.getModelItem();
    // console.log('repeatitem modelitem', this.getModelItem());
    this.attachObserver();

    if (this.modelItem && !this.modelItem.relevant) {
      this.removeAttribute('relevant');
      this.setAttribute('nonrelevant', '');
    } else {
      this.removeAttribute('nonrelevant');
      this.setAttribute('relevant', '');
    }
    await Fore.refreshChildren(this, force);
  }
}

if (!customElements.get('fx-repeatitem')) {
  window.customElements.define('fx-repeatitem', FxRepeatitem);
}
