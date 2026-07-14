import { Fore } from '../fore.js';
import XfAbstractControl from './abstract-control.js';
import { evaluateXPath, evaluateXPathToStrings } from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';

/**
 * todo: review placing of value. should probably work with value attribute and not allow slotted content.
 */
export class FxOutput extends XfAbstractControl {
  /*
  static get properties() {
    return {
      ...super.properties,
      valueAttr: {
        type: String,
      },
    };
  }

*/
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.valueAttr = this.hasAttribute('value') ? this.getAttribute('value') : null;
    // Outputs are always readonly!
    this.readonly = true;
  }

  connectedCallback() {
    const style = `
          :host {
            display: inline-block;
            max-width:100%;
          }
          #widget {
            display: inline-block;
          }
          .label{
            display: inline-block;
          }
          #value{
            max-width:100%;
          }
        `;

    const outputHtml = `
            <slot name="label"></slot>

            <span id="value">
                <slot name="default"></slot>
            </span>
        `;

    const sheet = Fore.getSharedStyleSheet(style);
    if (sheet) {
      this.shadowRoot.innerHTML = outputHtml;
      this.shadowRoot.adoptedStyleSheets = [sheet];
    } else {
      this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${outputHtml}
        `;
    }
    // this.widget = this.shadowRoot.querySelector('#widget');
    // this.widget = this.getWidget();
    // console.log('widget ', this.widget);
    this.mediatype = this.hasAttribute('mediatype') ? this.getAttribute('mediatype') : null;

    // The label is a slotted light-DOM element while the widget is a shadow-DOM <span> - an id
    // reference (for/aria-labelledby) can't cross that boundary, so derive an aria-label string
    // (which can) from the slotted label's text instead.
    const labelSlot = this.shadowRoot.querySelector('slot[name="label"]');
    const applyLabel = () => {
      const text = this._getLabelText();
      const valueEl = this.getWidget();
      if (text) {
        valueEl.setAttribute('aria-label', text);
      } else {
        valueEl.removeAttribute('aria-label');
      }
    };
    labelSlot.addEventListener('slotchange', applyLabel);
    applyLabel();

    /*
    this.addEventListener('slotchange', e => {
      console.log('slotchange ', e);
    });
*/
  }

  async refresh() {
    // Resolve the ref first. The ref will set the `nodeset` which is important for the 'context'
    if (this.ref) {
      await super.refresh();
    }

    // ### 2. Eval the value
    if (this.valueAttr) {
      this.value = this.getValue();
      await this.updateWidgetValue();
    }
  }

  getValue() {
    // return 'foobar';
    try {
      const inscopeContext = getInScopeContext(this, this.valueAttr);
      if (this.hasAttribute('html')) {
        return evaluateXPath(this.valueAttr, inscopeContext, this)[0];
      }

      return evaluateXPathToStrings(this.valueAttr, inscopeContext, this)[0];
    } catch (error) {
      console.error(error);
      Fore.dispatch(this, 'error', { message: error });
    }
    return null;
  }

  getWidget() {
    const valueWrapper = this.shadowRoot.getElementById('value');
    return valueWrapper;
  }

  _getLabelText() {
    const labelSlot = this.shadowRoot.querySelector('slot[name="label"]');
    if (!labelSlot) return '';
    return labelSlot
      .assignedNodes({ flatten: true })
      .map(n => n.textContent)
      .join('')
      .trim();
  }

  handleReadonly() {
    // An output is always read-only
    this.setAttribute('readonly', 'readonly');
  }

  async updateWidgetValue() {
    // console.log('updateWidgetValue');
    const valueWrapper = this.shadowRoot.getElementById('value');
    valueWrapper.innerHTML = '';

    // if (this.mediatype === 'markdown') {
    //   const md = markdown(this.nodeset);
    //   this.innerHtml = md;
    // }

    if (this.mediatype === 'html') {
      // JSON instances use a lens, so modelItem.node is null — fall back to this.value
      const source = this.modelItem.node ?? this.value;
      if (source) {
        if (source.nodeType) {
          valueWrapper.append(source);
          return;
        }
        // parse string as HTML
        const tmpDoc = new DOMParser().parseFromString(source, 'text/html');
        Array.from(tmpDoc.body.childNodes).forEach(n => {
          valueWrapper.append(n);
        });
      }
      return;
    }

    if (this.mediatype === 'image') {
      const img = document.createElement('img');
      img.setAttribute('src', this.value);
      // axe/WCAG require the accessible name directly on the <img> - aria-label on the
      // wrapping #value span (see applyLabel() above) doesn't satisfy that for a descendant
      // img. Empty alt is still valid (marks it decorative) when no label is given.
      img.setAttribute('alt', this._getLabelText());
      // Reset the output before adding the image
      this.innerHTML = '';
      valueWrapper.appendChild(img);
      return;
    }

    valueWrapper.innerHTML = this.value;
  }

  isReadonly() {
    return true;
  }
}

if (!customElements.get('fx-output')) {
  customElements.define('fx-output', FxOutput);
}
