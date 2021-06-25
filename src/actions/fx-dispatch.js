import {AbstractAction} from "./abstract-action.js";
import { evaluateXPath } from '../xpath-evaluation.js';

/**
 * `fx-dispatch`
 *
 * dispatches an event with optional details.
 *
 * Properties given by `fx-property` child elements are stored to the events' details object and
 * can be accessed in usual JavaScript way.
 */
export class FxDispatch extends AbstractAction {

  constructor() {
    super();
    this.event = null;
    this.targetid = null;
    this.details = null;
    this.attachShadow({ mode: 'open' });
  }

  /**
   * checks for `event` attribute. If not present will throw an Error
   *
   * @throws Error when no `event` attribute is given
   */
  connectedCallback() {
    this.event = this.getAttribute('event');
    if(!this.event){
      throw new Error('no event specified for dispatch', this);
    }

    this.targetid = this.hasAttribute('targetid')? this.getAttribute('targetid'):null;

    // ### has a shadow just to hide
/*
    this.shadowRoot.innerHTML = `
        <style>
            :host *{
                display: none;
            }
        </style>
        <slot></slot>
    `;
*/

  }

  /*
    disconnectedCallback() {
        super.disconnectedCallback();
    }

*/

  perform() {
    console.log('### fx-dispatch.perform ', this);

    const properties = this.querySelectorAll('fx-property');
    let details = {};
    Array.from(properties).forEach(prop => {
      console.log('prop ', prop);
      const name = prop.getAttribute('name');
      const value = prop.getAttribute('value');
      const expr = prop.getAttribute('expr');

      let propVal;
      if(expr){
        if(value) {
          throw new Error('if "expr" is given there must not be a "value" attribute');
        }
        const result = evaluateXPath(expr,this.getInScopeContext(),this.getOwnerForm());
        let serialized = null;
        if(result.nodeName){
          const serializer = new XMLSerializer();
          serialized = serializer.serializeToString(result);
        }
        if(serialized){
          details[name] = serialized;
        }else{
          details[name] = result;
        }
      }

      if(value){
        details[name] = value;
      }
    });

    console.log('details ', details);

    // ### when targetid is given dispatch to that if present (throw an error if not) - otherwise dispatch to document
    if(this.targetid){
      const target = document.getElementById(this.targetid);
      if(!target){
        throw new Error(`targetid ${this.targetid} does not exist in document`);
      }
      target.dispatchEvent(
          new CustomEvent(this.event, {
            composed: true,
            bubbles: true,
            detail: details,
          }),
      );
    }else{
      document.dispatchEvent(
          new CustomEvent(this.event, {
            composed: true,
            bubbles: true,
            detail: details,
          }),
      );
    }

  }


}

window.customElements.define('fx-dispatch', FxDispatch);
