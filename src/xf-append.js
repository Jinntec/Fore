import { XfAction } from "./xf-action.js";
import './xf-model.js';
import './xf-instance.js';

/**
 * `xf-append`
 * appends an entry to a `xf-repeat`.
 *
 * @customElement
 */
class XfAppend extends XfAction {

    static get properties() {
        return {
            ref: {
                type: String
            },
            repeat:{
                type: String
            },
            clear:{
                type:Boolean
            }
        };
    }

    constructor(){
        super();
        this.repeat = "";
        this.clear = true;
    }

    execute(){
        super.execute();


        // get instance for binding expr
        const instanceId = this.getInstanceId();

        const inst = this.model.getInstance(instanceId);
        console.log('target instance',inst);
        console.log('append nodeset',this.nodeset);
        console.log('append parent nodeset',this.nodeset[0].parentNode);

        const parentNodeset = this.nodeset[0].parentNode;

        const last = this.nodeset[this.nodeset.length -1];
        console.log('last in nodeset',last);

        let newItem = last.cloneNode(true);
/*
        if(this.clear){
            newItem.textContent = "";
            this._clear(newItem);
            console.log('newItem clear',newItem);

        }
*/


        parentNodeset.appendChild(newItem);
        this.doRebuild(true);
        this.doRecalculate(true);
        this.doRevalidate(true);
        this.doRefresh(true);
        console.log('modified instance ', this.model.getDefaultInstance().getInstanceData());

        //always call superClass at the end of processing.
        super.execute();

        // const s = new XMLSerializer();
        // console.log('modified xml instance ', s.serializeToString(this.model.getDefaultInstance().getInstanceData()));

    }

    /**
     * clear all text nodes and attribute values to get a 'clean' template.
     * @param n
     * @private
     */
    _clear(n){
        let node = n.firstChild;
        const attrs = n.attributes;
        for (let i = 0; i < attrs.length; i++) {
            // n.setAttribute(attrs[i].name,'');
            attrs[i].value = '';
        }
        while (node) {
            if(node.nodeType === 1 && node.hasAttributes()){
                node.textContent = "";
            }
            this._clear(node);
            node = node.nextSibling;
        }

    }


    getInstanceId(){
        if(this.ref.startsWith('instance(')){
            return 'not implemented';
        }else{
            return 'default';
        }
    }


}

window.customElements.define('xf-append', XfAppend);
