import { XfAction } from "./xf-action.js";
// import '../xf-model.js';
// import '../xf-instance.js';
import * as fx from 'fontoxpath';
import {XfInstance} from "../xf-instance";
import {XfBind} from "../xf-bind";

/**
 * `xf-append`
 * appends an entry to a `xf-repeat`.
 *
 * Setting the optional `clear` attribute to 'false' will append an entry that is a copy of the last repeat item.
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
                type:String
            }
        };
    }

    constructor(){
        super();
        this.repeat = "";
        this.clear = 'false';
    }

    connectedCallback(){
        console.log('connectedCallback ', this);
        this.ref = this.getAttribute('ref');
        this.repeat = this.getAttribute('repeat');
        if(this.hasAttribute('clear')){
            this.clear = this.getAttribute('clear');
        }
    }


    execute(){
        // super.execute();
        // get instance for binding expr
        // const instanceId = this.getInstanceId();
        // const inst = this.model.getInstance(instanceId);
        // console.log('target instance',inst);
        // console.log('append parent nodeset',this.nodeset[0].parentNode);

        const inscope = this._inScopeContext();
        this.nodeset = fx.evaluateXPathToNodes(this.ref, inscope, null, {});
        console.log('append nodeset',this.nodeset);


        // const parentNodeset = this.nodeset[0].parentNode;
        // const last = this.nodeset[this.nodeset.length -1];
        const last = inscope.lastElementChild;
        const originModelItem = this.getModel().getModelItem(last);

        console.log('last in nodeset',last);
        console.log('modelItem for last',originModelItem);

        //clone origin ModelItem

        let newItem = last.cloneNode(true);
        inscope.appendChild(newItem);

        console.log('All modelItems in append - ', this.getModel().modelItems);

        // console.log('clear flag ', this.clear);

        if(this.clear === 'true'){
            newItem.textContent = "";
            this._clear(newItem);
            console.log('newItem clear',newItem);
            newItem.innerText = '';
        }

        // newItem.textContent="new";

        const instData = new XMLSerializer().serializeToString(this.getModel().getDefaultInstance().getInstanceData());
        // console.log('modified instance ', this.getModel().getDefaultInstance().getInstanceData());
        console.log('modified instance >>>');
        console.log(instData);

        this.needsRebuild=true;
        this.needsRecalculate=true;
        this.needsRevalidate=true;
        this.needsRefresh=true;
        this.actionPerformed();

        const repeat = document.getElementById(this.repeat);
        repeat.setIndex(this.nodeset.length+1);


        //always call superClass at the end of processing.
        // super.execute();

        // const s = new XMLSerializer();
        // console.log('modified xml instance ', s.serializeToString(this.model.getDefaultInstance().getInstanceData()));

    }

    dispatch(){
        const repeat = document.getElementById(this.repeat);
        console.log('dispatching index change ', this.nodeset.length+1);
        repeat.dispatchEvent(new CustomEvent('index-changed', {composed: true, bubbles: true, detail: {index:this.nodeset.length+1}}));
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
