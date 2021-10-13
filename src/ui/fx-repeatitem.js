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
    this.display = this.style.display;
    this.addEventListener('click', this._dispatchIndexChange);
    this.attachShadow({ mode: 'open', delegatesFocus: true });
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

  /*
    _initializeChildren(node) {
        const children = Array.from(node.children);
        // console.log('_initializeChildren ', children);

        children.forEach(child => {
            if (Fore.isUiElement(child.nodeName)) {
                child.repeated = true;
            } else if (child.children.length !== 0) {
                const grantChildren = Array.from(child.children);
                grantChildren.forEach(grantChild => {
                    this._initializeChildren(grantChild);
                });
            }

        });
    }
*/

  /*
    firstUpdated(_changedProperties) {
        // console.log('### fx-repeatitem firstUpdated index ', this.index);
        // console.log('### fx-repeatitem firstUpdated nodeset ', this.nodeset);
        // console.log('### fx-repeatitem firstUpdated model ', this.model);
        this.dispatchEvent(new CustomEvent('repeatitem-created', {
            composed: true,
            bubbles: true,
            detail: {item: this}
        }));
        // this.init();
    }
*/

  refresh() {
    // console.log('refresh repeatitem: ',this.nodeset);
    /*
        if(!this.inited){
            this.init();
        }
*/
    // console.log('refresh repeatitem nodeset: ',this.nodeset);
    this.modelItem = this.getModel().getModelItem(this.nodeset);
    if (this.modelItem.relevant) {
      this.style.display = this.display;
      Fore.refreshChildren(this);
    } else {
      this.style.display = 'none';
    }

    // Fore.refreshChildren(this);
  }

  /*
    createRenderRoot() {
        /!**
         * Render template without shadow DOM. Note that shadow DOM features like
         * encapsulated CSS and slots are unavailable.
         *!/
        return this;
    }
*/
}

window.customElements.define('fx-repeatitem', FxRepeatitem);
