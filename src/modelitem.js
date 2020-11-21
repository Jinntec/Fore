

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
     * @param {*} isReadonly - boolean to signal readonly/readwrite state
     * @param {*} isRelevant - boolean to signal relevant/non-relevant state
     * @param {*} isRequired - boolean to signal required/optional state
     * @param {*} isValid - boolean boolean to signal valid/invalid state
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
        this.isReadonly = readonly;
        this.isRelevant = relevant;
        this.isRequired = required;
        this.isValid = valid;
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

