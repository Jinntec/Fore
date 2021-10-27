import { Fore } from '../fore.js';
import { foreElementMixin } from '../ForeElementMixin.js';

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
    this.addEventListener('focusin', this._handleFocus);

    this.attachShadow({ mode: 'open', delegatesFocus: true });
  }

  _handleFocus() {
    this.parentNode.setIndex(this.index);
  }

  _dispatchIndexChange() {
    // console.log('_dispatchIndexChange on index ', this.index);
    if (this.parentNode) {
      this.parentNode.dispatchEvent(
        new CustomEvent('item-changed', { composed: true, bubbles: true, detail: { item: this } }),
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

  getModelItem() {
    super.getModelItem();
    // console.log('modelItem in repeatitem ', this.getModelItem()[this.index]);
    return this.getModelItem()[this.index];
  }

  refresh() {
    // console.log('refresh repeatitem: ',this.nodeset);
    // console.log('refresh repeatitem nodeset: ',this.nodeset);
    this.modelItem = this.getModel().getModelItem(this.nodeset);

    if (this.modelItem && !this.modelItem.relevant) {
      // await Fore.fadeOutElement(this)
      this.style.display = 'none';
    } else {
      // if(this.hasAttribute('repeat-index')){
      //   Fore.fadeInElement(this);
      // }
      this.style.display = this.display;
    }

    /*
    if (this?.modelItem?.relevant) {
      // Fore.refreshChildren(this);
    } else {
    }
*/

    Fore.refreshChildren(this);
  }
}

window.customElements.define('fx-repeatitem', FxRepeatitem);
