import { AbstractAction } from './abstract-action.js';
import getInScopeContext from '../getInScopeContext.js';
import {
  evaluateXPathToNodes,
  evaluateXPathToFirstNode,
  evaluateXPathToNumber,
} from '../xpath-evaluation.js';
import {XPathUtil} from "../xpath-util";
import {Fore} from '../fore.js';

/**
 * `fx-insert`
 * inserts nodes into data instances
 *
 *                         <fx-insertChild parent="instance('i-stopwatches')/stopwatches"
 *                                         child="watch"
 *                                         template="instance('vars')/templates/watch"
 *                                         at="1"
 *                                         position="before"></fx-insertChild>
 * @customElement
 */
export class FxInsertchild extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      at: {
        type: Number,
      },
      child:{
        type: String
      },
      parent: {
        type: String,
      },
      origin: {
        type: Object,
      },
      keepValues: {
        type: Boolean,
      },
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.at = Number(this.hasAttribute('at') ? this.getAttribute('at') : 1); // default: size of nodeset, determined later
    this.child = this.getAttribute('child');
    this.parent = this.getAttribute('parent');
    this.position = this.hasAttribute('position') ? this.getAttribute('position') : 'after';
    this.origin = this.hasAttribute('origin') ? this.getAttribute('origin') : null; // last item of context seq
    this.keepValues = !!this.hasAttribute('keep-values');


    const style = `
        :host{
            display:none;
        }
    `;
    this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
        <fx-insert context="${this.parent}"
                   ref="${this.ref}"
                   origin="${this.origin}"
                   at="${this.at}"
                   position="${this.position}"></fx-insert>
                   
    `;

  }

  async perform() {
    super.perform();
    const insert = this.shadowRoot.querySelector('fx-insert');
    await insert.perform();
    this.needsUpdate = true;

  }

}

if (!customElements.get('fx-insertChild')) {
  window.customElements.define('fx-insertchild', FxInsertchild);
}
