import { evaluateXPath, evaluateXPathToString, resolveId } from '../xpath-evaluation.js';
import FxControl from './fx-control.js';
import { Fore } from '../fore.js';
import { XPathUtil } from '../xpath-util.js';

/**
 * FxItems provides a templated list over its bound nodes. It is not standalone but expects to be used
 * within an fx-control element.
 *
 * @demo demo/selects3.html
 */
export class FxItems extends FxControl {
  static get properties() {
    return {
      ...super.properties,
      valueAttr: {
        type: String,
      },
    };
  }

  constructor() {
    super();
    this.valueAttr = this.hasAttribute('value') ? this.getAttribute('value') : null;
  }

  connectedCallback() {
    super.connectedCallback();
    // Some other library is stealing focus when clicking on the label of a checkbox list.
    // The browser should handle this, but we need to manually focus the checkbox if the label is pressed
    // TODO: find a better solution
    this.addEventListener('mousedown', e => {
      // const items = this.querySelectorAll('[value]');

      if (!Fore.isWidget(e.target)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }

      if (e.target.nodeName === 'LABEL') {
        const target = resolveId(e.target.getAttribute('for'), this);
        target.focus();
      }
    });

    // Some other library is stealing focus when clicking on the label of a checkbox list.
    // The browser should handle this, but we need to manually focus the checkbox if the label is pressed
    // TODO: find a better solution
    this.addEventListener('mousedown', e => {
      const items = this.querySelectorAll('[value]');

      if (e.target.nodeName === 'LABEL') {
        const target = resolveId(e.target.getAttribute('for'), this);
        target.focus();
      }
    });

    this.addEventListener('click', e => {
      e.preventDefault; // keep as-is (do not change behavior here)
      e.stopPropagation();
      const items = this.querySelectorAll('[value]');

      let val = '';
      Array.from(items).forEach(item => {
        if (item.checked) {
          // ROOT FIX: for generated inputs, attribute "value" may still be "{value}".
          // The DOM property .value is the authoritative one.
          const v = item.value != null ? item.value : item.getAttribute('value');
          val += ` ${v}`;
        }
      });
      this.setAttribute('value', val.trim());

      // ### check for parent control
      const parentBind = XPathUtil.getClosest('[ref]', this.parentNode);
      if (!parentBind) return;
      const modelitem = parentBind.getModelItem();
      const setval = this.shadowRoot.getElementById('setvalue');
      setval.setValue(modelitem, val.trim());
      setval.actionPerformed();
    });
  }

  getWidget() {
    return this;
  }

  async refresh(force = false) {
    super.refresh(force);
    console.log('fx-items.refresh() called');
  }

  async updateWidgetValue() {
    console.log('setting items value');

    const parentBind = XPathUtil.getClosest('[ref]', this.parentNode);
    if (parentBind) {
      this.value = parentBind.value;
    }
    this.setAttribute('value', this.value);
  }

  /**
   * Updates an entry by setting the label and the value.
   *
   * Will connect label and control with `for` attribute with generated id.
   *
   * attention: limitations here: assumes that there's an `label` element plus an element with an `value`
   * attribute which it will update.
   *
   * @param newEntry
   * @param node
   */
  updateEntry(newEntry, node) {
    console.log('fx-items updateEntry', this.value);

    // ### create unique id to connect label and input
    const id = Fore.createUUID();

    // ### handle 'label'
    const label = newEntry.querySelector('label');
    const lblExpr = Fore.getExpression(label.textContent);

    // ROOT FIX: JSON lens nodes are objects; do NOT use direct JS property access.
    // Always go through evaluateXPathToString() for JSON too.
    const lblEvaluated = evaluateXPathToString(lblExpr, node, this);
    console.log('lblEvaluated ', lblEvaluated);
    label.textContent = lblEvaluated;

    label.setAttribute('for', id);

    // ### handle the 'value'
    // getting element which has 'value' attr
    const input = newEntry.querySelector('[value]');
    // getting expr
    const expr = input.value;
    const cutted = Fore.getExpression(expr);

    // ROOT FIX: same here
    const evaluated = evaluateXPathToString(cutted, node, this);
    console.log('evaluated ', lblEvaluated);

    // Set both property and attribute so *any* downstream code path works
    input.value = evaluated;
    input.setAttribute('value', evaluated);

    input.setAttribute('id', id);

    // Normalize the current value (remove newlines, tabs, excessive spaces)
    const currentValue = (this.getAttribute('value') || '').replace(/\s+/g, ' ').trim();
    const valueList = currentValue.split(/\s+/); // Split on whitespace

    if (valueList.includes(evaluated)) {
      input.checked = true;
    }
  }
}

if (!customElements.get('fx-items')) {
  customElements.define('fx-items', FxItems);
}