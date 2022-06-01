import { FxAction } from './fx-action.js';
import {AbstractAction} from "./abstract-action";

/**
 * `fx-return`
 * returns data from a nested Fore to it's host Fore.
 *
 * behaves like a `<fx-submission @replace='instance' with `targetref` and respects relevance processing.
 *
 * `targetref` will be the `ref` of the host control.
 *
 * @customElement
 */
export class FxReturn extends AbstractAction {


  connectedCallback() {
    super.connectedCallback();
    const nonrelevant = this.hasAttribute('nonrelevant') ? this.getAttribute('nonrelevant'):null;
  }

  perform() {
    super.perform();
    console.log('performing return with nodes',this.nodeset);

    /*
    ### note that this event does not use Fore.dispatch as the event uses 'composed:true' to let the event travel
    up through the shadowRoot and being catched in outer form.
    */
    const event = new CustomEvent('return', {
      composed: true,
      bubbles: true,
      detail:{nodeset:this.nodeset}
    });
    this.getOwnerForm().dispatchEvent(event);
  }
}

window.customElements.define('fx-return', FxReturn);
