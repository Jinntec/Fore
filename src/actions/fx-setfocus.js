import { AbstractAction } from './abstract-action.js';
import { Fore } from '../fore';

/**
 * `fx-setfocus`
 * Set the focus to a target control optionally selecting eventual value in case a `select` attribute is given.
 *
 * @customElement
 */
export class FxSetfocus extends AbstractAction {
  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.control = this.hasAttribute('control') ? this.getAttribute('control') : null;
  }

  async perform() {
    this.dispatchEvent(
      new CustomEvent('execute-action', {
        composed: true,
        bubbles: true,
        cancelable: true,
        detail: { action: this, event: this.event },
      }),
    );

    // super.perform();
    const selector = `#${this.control}`;

    let targetElement = document.querySelector(selector);

    if (!targetElement) {
      Fore.dispatch(this, 'error', {
        origin: this,
        message: `Instance '${this.control}' not found`,
        level: 'Error',
      });
      return;
    }

    // ### focus action is itself hosted within a repeat
    const parentIItem = targetElement.closest('fx-repeatitem');
    if (parentIItem) {
      targetElement = parentIItem.querySelector(selector);
      this._focus(targetElement);
      // return;
    }

    // ### the target element is hosted within a repeat
    const repeatitem = targetElement.closest('fx-repeatitem, .fx-repeatitem');
    if (repeatitem) {
      // targetElement is repeated
      // get the active repeatitem (only for fx-repeat for now - todo: support repeat attributes
      const repeat = repeatitem.parentNode;
      targetElement = repeat.querySelector(`[repeat-index] ${selector}`);
    }

    this._focus(targetElement);
    if (this.hasAttribute('select')) {
      this._select(targetElement);
    }
  }

  _focus(targetElement) {
    if (targetElement && typeof targetElement.getWidget === 'function') {
      targetElement.getWidget().focus();
    }
    if (targetElement && targetElement.nodeType === Node.ELEMENT_NODE) {
      targetElement.click();
    }
  }

  _select(targetElement) {
    if (targetElement) {
      targetElement.getWidget().select();
    }
  }
}

if (!customElements.get('fx-setfocus')) {
  window.customElements.define('fx-setfocus', FxSetfocus);
}
