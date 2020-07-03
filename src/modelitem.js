

/**
 * Class for holding ModelItem facets.
 *
 * A ModelItem annotates nodes that are referred by a xf-bind element with facets for calculation and validation.
 *
 * Each bound node in an instance has exactly one ModelItem associated with it.
 */
export class ModelItem {


    static get properties() {
        return {
            readonly: {
                type: Boolean
            },
            relevant: {
                type: Boolean
            },
            required: {
                type: Boolean
            },
            valid: {
                type: Boolean
            },
            value: {
                type: String
            },
            node:{
                type:Object
            }

        };
    }

    constructor() {
        this.readonly = false;
        this.relevant = true;
        this.required = false;
        this.valid = true;
        this.value = '';
        this.node = {};
    }


    setNodeValue (newVal) {
        if(this.node.nodeType === Node.ATTRIBUTE_NODE){
            this.node.nodeValue = newVal;
        }else{
            this.node.textContent = newVal;
        }

    }

}

