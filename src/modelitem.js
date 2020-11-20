

/**
 * Class for holding ModelItem facets.
 *
 * A ModelItem annotates nodes that are referred by a xf-bind element with facets for calculation and validation.
 *
 * Each bound node in an instance has exactly one ModelItem associated with it.
 */
export class ModelItem {

    /**
     *
     * @param {path} calculated normalized path expression linking to data
     * @param {ref} ref relative binding expression
     * @param {*} readonly - boolean expression to calculate readonly/readwrite state
     * @param {*} relevant - boolean expression to calculate relevant/non-relevant state
     * @param {*} required - boolean expression to calculate required/optional state
     * @param {*} valid - boolean expression to calculate valid/invalid state
     * @param {*} type - string expression to set a datatype
     * @param {*} node - the node the 'ref' expression is referring to
     * @param {*} bind - the xf-bind element having created this modelItem
     */
    constructor(
                path,
                ref,
                readonly,
                relevant,
                required,
                valid,
                type,
                node,
                bind) {
        this.path = path;
        this.ref = ref;
        this.readonly = readonly;
        this.relevant = relevant;
        this.required = required;
        this.valid = valid;
        this.type = type;
        this.node = node;
        this.bind = bind;
        // this.value = this._getValue();
    }

/*
    get ref(){
        return this.bind.ref;
    }
*/

    get value(){
        if(this.node.nodeType === Node.ATTRIBUTE_NODE){
            return this.node.nodeValue;
        }else{
            return this.node.textContent;
        }
    }

    set value(newVal) {
        console.log('modelitem.setvalue oldVal', this.value);
        console.log('modelitem.setvalue newVal', newVal);
        if(this.node.nodeType === Node.ATTRIBUTE_NODE){
            this.node.nodeValue = newVal;
        }else{
            this.node.textContent = newVal;
        }

    }

}

