

/**
 * Class for holding ModelItem facets.
 *
 * A ModelItem annotates nodes that are referred by a xf-bind element with facets for calculation and validation.
 *
 * Each bound node in an instance has exactly one ModelItem associated with it.
 */
export class ModelItem {


    constructor(readonly,
                relevant,
                required,
                valid,
                type,
                node) {
        this.readonly = readonly;
        this.relevant = relevant;
        this.required = required;
        this.valid = valid;
        this.type = type;
        this.node = node;
        // this.value = this._getValue();
    }

    get value(){
        if(this.node.nodeType === Node.ATTRIBUTE_NODE){
            return this.node.nodeValue;
        }else{
            return this.node.textContent;
        }
    }

    set value(newVal) {
        if(this.node.nodeType === Node.ATTRIBUTE_NODE){
            this.node.nodeValue = newVal;
        }else{
            this.node.textContent = newVal;
        }

    }

}

