import { AbstractAction } from './abstract-action.js';
import { evaluateXPath, resolveId } from '../xpath-evaluation.js';

/**
 * `fx-dispatch`
 *
 * dispatches an event with optional details.
 *
 * Properties given by `fx-property` child elements are stored to the events' details object and
 * can be accessed in usual JavaScript way.
 */
export class FxDispatch extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      name: {
        type: String,
      },
      targetid: {
        type: String,
      },
      details: {
        type: String,
      },
    };
  }

  constructor() {
    super();
    this.name = null;
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
    super.connectedCallback();
    this.name = this.getAttribute('name');
    if (!this.name) {
      throw new Error('no event specified for dispatch', this);
    }

    this.targetid = this.hasAttribute('targetid') ? this.getAttribute('targetid') : null;

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

  async perform() {
    super.perform();

    const properties = this.querySelectorAll('fx-property');
    const details = {};
    Array.from(properties).forEach(prop => {
      // console.log('prop ', prop);
      const name = prop.getAttribute('name');
      const value = prop.getAttribute('value');
      const expr = prop.getAttribute('expr');

      if (expr) {
        if (value) {
          throw new Error('if "expr" is given there must not be a "value" attribute');
        }
        const [result] = evaluateXPath(expr, this.getInScopeContext(), this);

        let serialized = null;
        if (result.nodeName) {
          const serializer = new XMLSerializer();
          serialized = serializer.serializeToString(result);
        }
        if (serialized) {
          details[name] = serialized;
        } else {
          details[name] = result;
        }
      }

      if (value) {
        details[name] = value;
      }
    });

    // console.log('details ', details);

    // ### when targetid is given dispatch to that if present (throw an error if not) - otherwise dispatch to document
    if (this.targetid) {
      let target = resolveId(this.targetid, this.parentNode, null);
      if (!target) {
        // TODO: essentially, we want to highly prefer the closest target. in the same subcontrol.
        // However, it may be that our target is elsewhere. Do a global search for that case
        target = document.getElementById(this.targetid);
      }
      if (!target) {
        throw new Error(`targetid ${this.targetid} does not exist in document`);
      }
      target.dispatchEvent(
        new CustomEvent(this.name, {
          composed: true,
          bubbles: true,
          detail: details,
        }),
      );
    } else {
      document.dispatchEvent(
        new CustomEvent(this.name, {
          composed: true,
          bubbles: true,
          detail: details,
        }),
      );
    }
  }
}

if (!customElements.get('fx-dispatch')) {
  window.customElements.define('fx-dispatch', FxDispatch);
}
