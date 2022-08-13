import {AbstractAction} from "./abstract-action";
import {resolveId} from "../xpath-evaluation";

/**
 * `fx-setfocus`
 * Set the focus to a target control.
 *
 * @customElement
 */
export class FxSetfocus extends AbstractAction {
  connectedCallback() {
      super.connectedCallback();
      this.control = this.hasAttribute('control') ? this.getAttribute('control') : null;
  }

  perform() {
      console.log('setting focus', this.control);
      // super.perform();

      // const targetElement = resolveId(this.control, this);
      const selector = '#'+this.control;
      let targetElement = document.querySelector(selector);
      const repeatitem = targetElement.closest('fx-repeatitem, .fx-repeatitem');
      if(repeatitem){
        // targetElement is repeated
        // get the active repeatitem (only for fx-repeat for now - todo: support repeat attributes
        const repeat = repeatitem.parentNode;
        targetElement = repeat.querySelector('[repeat-index] ' + selector);

      }
      targetElement.getWidget().focus();
  }
}

if (!customElements.get('fx-setfocus')) {
  window.customElements.define('fx-setfocus', FxSetfocus);
}
