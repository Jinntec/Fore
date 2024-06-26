/**
 * Class for holding ModelItem facets.
 *
 * A ModelItem annotates nodes that are referred by a fx-bind element with facets for calculation and validation.
 *
 * Each bound node in an instance has exactly one ModelItem associated with it.
 */
export class ModelItem {
  /**
   *
   * @param {path} calculated normalized path expression linking to data
   * @param {ref} ref relative binding expression
   * @param {*} isReadonly - boolean to signal readonly/readwrite state
   * @param {*} relevant - boolean to signal relevant/non-relevant state
   * @param {*} required - boolean to signal required/optional state
   * @param {*} required - boolean boolean to signal valid/invalid state
   * @param {*} type - string expression to set a datatype
   * @param {*} node - the node the 'ref' expression is referring to
   * @param {*} bind - the fx-bind element having created this modelItem
   */
  constructor(path, ref, readonly, relevant, required, constraint, type, node, bind) {
    this.path = path;
    this.ref = ref;
    this.constraint = constraint;
    this.readonly = readonly;
    this.relevant = relevant;
    this.required = required;
    this.type = type;
    this.node = node;
    this.bind = bind;
    this.changed = false;
    this.alerts = [];
    this.boundControls = [];
    // this.value = this._getValue();
  }

  /*
    get ref(){
        return this.bind.ref;
    }
*/

  get value() {
    if (!this.node.nodeType) return this.node;

    if (this.node.nodeType === Node.ATTRIBUTE_NODE) {
      return this.node.nodeValue;
    }
    return this.node.textContent;
  }

  /**
   * @param  {Node} newValue
   */
  set value(newVal) {
    // console.log('modelitem.setvalue oldVal', this.value);
    // console.log('modelitem.setvalue newVal', newVal);

    if (newVal.nodeType === Node.DOCUMENT_NODE) {
      this.node.replaceWith(newVal.firstElementChild);
      this.node = newVal.firstElementChild;
      // this.node.appendChild(newVal.firstElementChild);
    } else if (newVal.nodeType === Node.ELEMENT_NODE) {
      this.node.replaceWith(newVal);
      this.node = newVal;
      // this.node.appendChild(newVal);
    } else if (this.node.nodeType === Node.ATTRIBUTE_NODE) {
      this.node.nodeValue = newVal;
    } else {
      this.node.textContent = newVal;
    }
  }

  addAlert(alert) {
    if (!this.alerts.includes(alert)) {
      this.alerts.push(alert);
    }
  }

  cleanAlerts() {
    this.alerts = [];
  }
}
