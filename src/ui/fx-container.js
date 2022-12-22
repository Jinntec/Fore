import '../fx-model.js';
import { Fore } from '../fore.js';
import { foreElementMixin } from '../ForeElementMixin.js';

/**
 * `fx-container` -
 * is a general class for container elements.
 *
 */
export class FxContainer extends foreElementMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const style = `
        :host {
            display: block;
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

    this.getOwnerForm().registerLazyElement(this);
  }

  /**
   * (re)apply all state properties to this control.
   */
  async refresh(force) {
    if (!force && this.hasAttribute('refresh-on-view')) return;
    // console.log('### FxContainer.refresh on : ', this);

    if (this.isBound()) {
      this.evalInContext();
      this.modelItem = this.getModelItem();
      if (this.modelItem && !this.modelItem.boundControls.includes(this)) {
        this.modelItem.boundControls.push(this);
      }
      this.handleModelItemProperties();
    }

    // state change event do not fire during init phase (initial refresh)
    // if (this._getForm().ready) {
    //   this.handleModelItemProperties();
    // }
    // Fore.refreshChildren(this, force);
  }

  /**
   * anly relevance is processed for container controls
   */
  handleModelItemProperties() {
    this.handleRelevant();
  }

  _getForm() {
    return this.getModel().parentNode;
  }

  handleRelevant() {
    // console.log('mip valid', this.modelItem.enabled);
    if (!this.modelItem) {
      console.log('container is not relevant');
      this.removeAttribute('relevant','');
      this.setAttribute('nonrelevant','');
      this.dispatchEvent(new CustomEvent('disabled', {}));
      return;
    }

    if (this.isEnabled() !== this.modelItem.enabled) {
      if (this.modelItem.relevant) {
        // this.style.display = 'block';
        this.removeAttribute('nonrelevant','');
        this.setAttribute('relevant','');
        this.dispatchEvent(new CustomEvent('enabled', {}));
      } else {
        this.removeAttribute('relevant','');
        this.setAttribute('nonrelevant','');
        this.dispatchEvent(new CustomEvent('disabled', {}));
      }
    }
  }

  isReadonly() {
    if (this.hasAttribute('readonly')) {
      return true;
    }
    return false;
  }

  isEnabled() {
    if (this.style.display === 'none') {
      return false;
    }
    return true;
  }
}

if (!customElements.get('fx-container')) {
  window.customElements.define('fx-container', FxContainer);
}
