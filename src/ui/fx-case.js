// import { foreElementMixin } from '../ForeElementMixin';

import { FxContainer } from './fx-container.js';
import { Fore } from '../fore.js';

/**
 * `fx-case`
 * a container allowing to switch between fx-case elements
 *
 *  * todo: implement
 * @customElement
 */
export class FxCase extends FxContainer {
  static get properties() {
    return {
      ...super.properties,
      label: {
        type: String,
      },
      name: {
        type: String,
      },
      selected: {
        type: String,
      },
      selector: {
        type: String,
      },
      src: {
        type: String,
      },
    };
  }

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
    this.selector = this.hasAttribute('selector') ? this.getAttribute('selector') : 'fx-case';
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

    this.addEventListener('select', async () => {
      const ownerForm = this.getOwnerForm();
      if (this.src) {
        // We will replace the node. So this node will be detached after these async function
        // calls. Save all important state first.
        const { parentNode } = this;
        const replacement = await this._loadFromSrc();
        if(!replacement){
          Fore.dispatch(this, 'error', {
            detail: {
              message: `HTML page couldn't be loaded`,
            },
          });
          return;
        }
        await parentNode.replaceCase(this, replacement);
      }
      const model = ownerForm.getModel();
      model.updateModel();
      ownerForm.refresh(true);
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
    return Fore.loadForeFromSrc(this, this.src, this.selector);
  }
}

if (!customElements.get('fx-case')) {
  window.customElements.define('fx-case', FxCase);
}
