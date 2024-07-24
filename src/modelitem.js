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
   * @param {string} path calculated normalized path expression linking to data
   * @param {string} ref relative binding expression
   * @param {boolean} readonly - boolean to signal readonly/readwrite state
   * @param {boolean} relevant - boolean to signal relevant/non-relevant state
   * @param {boolean} required - boolean to signal required/optional state
   * @param {boolean} constraint - boolean boolean to signal valid/invalid state
   * @param {string} type - string expression to set a datatype
   * @param {Node} node - the node the 'ref' expression is referring to
   * @param {import('./fx-bind').FxBind} bind - the fx-bind element having created this modelItem
   */
  constructor(path, ref, readonly, relevant, required, constraint, type, node, bind) {
    /**
     * @type {string}
     */
    this.path = path;
    /**
     * @type {string}
     */
    this.ref = ref;
    /**
     * @type {boolean}
     */
    this.constraint = constraint;
    /**
     * @type {boolean}
     */
    this.readonly = readonly;
    /**
     * @type {boolean}
     */
    this.relevant = relevant;
    /**
     * @type {boolean}
     */
    this.required = required;
    /**
     * @type {string}
     */
    this.type = type;
    /**
     * @type {Node}
     */
    this.node = node;
    /**
     * @type {import('./fx-bind').FxBind}
     */
    this.bind = bind;
    this.changed = false;
    /**
     * @type {import('./ui/fx-alert').FxAlert[]}
     */
    this.alerts = [];
    /**
     * @type {import('./ui/fx-control').default[]}
     */
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
   * @param  {Node} newVal
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
