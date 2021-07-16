import { AbstractAction } from './abstract-action.js';
import getInScopeContext from "../getInScopeContext";
import {evaluateXPath} from "../xpath-evaluation";

/**
 * `fx-insert`
 * inserts nodes into data instances
 *
 * @customElement
 */
export class FxInsert extends AbstractAction {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if(super.connectedCallback){
      super.connectedCallback();
    }
    const style = `
        :host{
            display:none;
        }
    `;
    this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
        <slot></slot>
    `;

    this.at = this.hasAttribute('at') ? this.getAttribute('at') : null; // default: size of nodeset, determined later
    this.position = this.hasAttribute('position') ? this.getAttribute('position') : 'after';
    this.origin =  this.hasAttribute('origin') ? this.getAttribute('origin') : null; // last item of context seq

  }

  perform() {
    // super.perform();
    const inscope = getInScopeContext(this, this.ref);
    const seq = evaluateXPath(this.ref, inscope, this.getOwnerForm());

    console.log('insert nodeset ', seq);
    let contextItem;
    // todo: eval 'at'
    if(this.at){
      contextItem = seq[this.at];
    }else{
      contextItem = seq[seq.length-1];
    }

    let originNodes;
    if(this.origin){
      // eval origin
    }else{
      originNodes = seq[seq.length-1].cloneNode(true);
    }

    if(this.position && this.position === 'before'){
      contextItem.parentNode.insertBefore();
    }
    console.log('insert context item ', contextItem);


    // this.needsUpdate = true;
  }

}

window.customElements.define('fx-insert', FxInsert);
