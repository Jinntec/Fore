// import { FxAction } from './fx-action.js';
import '../fx-model.js';
import { AbstractAction } from './abstract-action.js';
import { evaluateXPath, evaluateXPathToFirstNode } from '../xpath-evaluation.js';

/**
 * `fx-replace` - teplaces the node referred to with 'ref' with node referred to with 'with' attribute.
 *
 * @customElement
 */
export default class FxReplace extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      with: {
        type: String,
      },
      replaceNode:Object
    };
  }

  constructor() {
    super();
    this.with = '';
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.with = this.getAttribute('with');
  }

  perform() {
    super.perform();
    console.log('replace action')
    if(!this.nodeset){
      return;
    }
    const target = evaluateXPath(this.with, this.nodeset, this);
    if(!target) return;

/*
    const cloned = target.cloneNode(true);
    this.nodeset.replaceWith(cloned);
    this.needsUpdate = true;
*/
    this.replace(this.nodeset,target)
  }

  replace(toReplace,replaceWith){
    if(!toReplace || !replaceWith) return; // bail out silently

    const cloned = replaceWith.cloneNode(true);
    toReplace.replaceWith(cloned);
    this.needsUpdate = true;
  }

}

window.customElements.define('fx-replace', FxReplace);
