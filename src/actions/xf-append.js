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
        // const originClone = { ...originModelItem };
        // console.log('cloned original ModelItem ', originClone);

        let newItem = last.cloneNode(true);
        inscope.appendChild(newItem);

        // originClone.node = newItem;

        // const path = fx.evaluateXPath('path()',newItem);
/*
        const newModelItem = new ModelItem(
                                           originModelItem.bind,
                                           path,
                                           originmodelItem.isReadonly,
                                           originModelItem.isRelevant,
                                           originModelItem.isRequired,
                                           originModelItem.isValid,
                                           newItem);
*/


        // this.getModel().registerModelItem(newModelItem);
        console.log('All modelItems in append - ', this.getModel().modelItems);

        // console.log('clear flag ', this.clear);

        if(this.clear === 'true'){
        // if(this.clear){
            newItem.textContent = "";
            this._clear(newItem);
            console.log('newItem clear',newItem);
            newItem.innerText = '';

        }

newItem.textContent="new";

        console.log('modified instance ', this.getModel().getDefaultInstance().getInstanceData());

        //todo: create modelItems as appropriate for newly inserted entry
        // const existed = this.getModel().getModelItem(this.nodeset);
        // if(!existed) {
        //     XfBind.lazyCreateModelitems(this.getModel(), this.ref, newItem);
        // }

        this.needsRebuild=true;
        this.needsRecalculate=true;
        this.needsRevalidate=true;
        this.needsRefresh=true;
        this.actionPerformed();




        //always call superClass at the end of processing.
        // super.execute();

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
