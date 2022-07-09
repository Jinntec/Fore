// import { FxAction } from './fx-action.js';
import '../fx-model.js';
import { AbstractAction } from './abstract-action.js';
import { evaluateXPathToFirstNode } from '../xpath-evaluation.js';

/**
 * `fx-replace` - replaces the node referred to with 'ref' with node referred to with 'with' attribute.
 *
 * @customElement
 */
export default class FxReplacechild extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      with: {
        type: String,
      },
      replaceNode: Object,
    };
  }

  constructor() {
    super();
    this.child = '';
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.child = this.getAttribute('child');
  }

  perform() {
    super.perform();
    console.log('replacechild action', this.ref, this.child);
    // console.log('replace action variables', this.inScopeVariables);
/*
    if (!this.nodeset) {
      return;
    }
*/
    const child = evaluateXPathToFirstNode(this.child, this.nodeset, this);
    if (!child) return;

    this.replacechild(this.nodeset, child);
    this.needsUpdate = true;

  }

  replacechild(parent, child) {
    if (!parent || !child) return; // bail out silently
    if (!parent.nodeName || !child.nodeName) {
      console.warn('fx-replace: one argument is not a node');
      return;
    }
    const newChild = child.cloneNode(true);

    // only handle element nodes
    if (child.nodeType === Node.ELEMENT_NODE) {
      const cloned = child.cloneNode(true);

      console.log('parent has child ', parent.contains(child));
      const theChild = parent.querySelector(child.nodeName);
      console.log('parent has child ', parent.contains(theChild));

      if(parent.contains(theChild)){
        // console.log('replacing child', child,' with ', newChild);
        child.replaceWith(newChild);
      }else{
        parent.appendChild(cloned);
      }

    }
    console.log('replace changed node', parent);

    if(this.getModelItem()){
      this.getModel().changed.push(this.getModelItem());
    }
  }
}

if (!customElements.get('fx-replacechild')) {
  window.customElements.define('fx-replacechild', FxReplacechild);
}
