import { XPathUtil } from './xpath-util';

/**
 * ModelItem is a state objects that wraps a Node and holds the current state of facets like 'readonly', 'required', 'relevant', 'constraint'
 * and 'calculate' as well as the canonical XPath.
 *
 * Each bound node in an instance has exactly one ModelItem associated with it.
 */
export class ModelItem {
    static READONLY_DEFAULT = false;
    static REQUIRED_DEFAULT = false;
    static RELEVANT_DEFAULT = true;
    static CONSTRAINT_DEFAULT = true;
    static TYPE_DEFAULT = 'xs:string';

    /**
     *
     * @param {string} path calculated normalized path expression linking to data
     * @param {string} ref relative binding expression
     * @param {Node} node - the node the 'ref' expression is referring to
     * @param {import('./fx-bind').FxBind} bind - the fx-bind element having created this modelItem
     * @param {string} instance - the fx-instance id having created this modelItem
     */
    constructor(
        path,
        ref,
        node,
        bind,
        instance,
    ) {
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
        this.constraint = ModelItem.CONSTRAINT_DEFAULT;
        /**
         * @type {boolean}
         */
        this.readonly = ModelItem.READONLY_DEFAULT;
        /**
         * @type {boolean}
         */
        this.relevant = ModelItem.RELEVANT_DEFAULT;
        /**
         * @type {boolean}
         */
        this.required = ModelItem.REQUIRED_DEFAULT;
        /**
         * @type {string}
         */
        this.type = ModelItem.TYPE_DEFAULT;
        /**
         * The value this model item represents. Usually a node, but for
         * fx-output and fx-container it can also refer to a simple type, like a
         * JSON map, JSON array, string, number or boolean
         *
         * @type {Node|string}
         */
        this.node = node;
        /**
         * @type {import('./fx-bind').FxBind} - optional fx-bind element being used to enforce facets
         */
        this.bind = bind;
        this.changed = false;
        /**
         * @type {import('./ui/fx-alert').FxAlert[]}
         */
        this.alerts = [];
        // this.value = this._getValue();
        this.instanceId = instance;

        if (!this.path) {
            // this.path = 'anon';
            this.path = XPathUtil.getCanonicalXPath(this.node);
        }
    }

    /*
    get ref(){
        return this.bind.ref;
    }
*/

    get value() {
        if (!this.node) {
            return null;
        }
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
