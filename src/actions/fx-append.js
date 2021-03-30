import { FxAction } from "./fx-action.js";
// import '../fx-model.js';
// import '../fx-instance.js';
import * as fx from 'fontoxpath';
import {FxInstance} from "../fx-instance";
import {FxBind} from "../fx-bind";

/**
 * `fx-append`
 * appends an entry to a `fx-repeat`.
 *
 * Setting the optional `clear` attribute to 'false' will append an entry that is a copy of the last repeat item.
 *
 * @customElement
 */
class FxAppend extends FxAction {

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
        // const originModelItem = this.getModel().getModelItem(last);

        let newItem;
/*
        if(last){
            console.log('last in nodeset',last);
            newItem = last.cloneNode(true);
            inscope.appendChild(newItem);
        }else{
*/
            newItem = this._dataFromTemplate(inscope);
        // }
        console.log('################ newItem ',newItem)

        // console.log('All modelItems in append - ', this.getModel().modelItems);

        console.log('clear flag ', this.clear);
        if(this.clear === 'true'){
            newItem.textContent = "";
            this._clear(newItem);
            console.log('newItem clear',newItem);
            newItem.innerText = '';
        }
        inscope.appendChild(newItem);

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

    _dataFromTemplate(inscope){
        const parentForm = this.getOwnerForm(this);
        const repeat = parentForm.querySelector(`#${this.repeat}`)
        console.log('_dataFromTemplate repeat', repeat);
        console.log('_dataFromTemplate repeat ref', repeat.ref);


        const templ = repeat.shadowRoot.querySelector('template');
        console.log('_dataFromTemplate ', templ);
        console.log('_dataFromTemplate content', templ.content);

        // iterate template for refs
        // todo: will fail for pathes with predicates - need to be filtered before
        // const rootNode = document.createElement(repeat.ref);



        // const rootNode = document.createElement(repeat.ref);
        const rootNode = inscope.ownerDocument.createElement(repeat.ref);



        // const data = this._dataFromRefs(rootNode, templ.content)
        const data = this._generateInstance(templ.content,rootNode);
        console.log('_dataFromTemplate DATA', data);
        return data;
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

    _generateInstance(start, parent){

        if(start.nodeType === 1 && start.hasAttribute('ref')){
            const ref = start.getAttribute('ref');

            let generated;
            if(ref === '.'){
                // node.appendChild(document.createElement(repeatRef));
            }else if(ref.startsWith('@')){
                parent.setAttribute(ref.substring(1),'');
            }else{
                generated = document.createElement(ref);
                parent.appendChild(generated);
                if(start.children.length === 0){
                    generated.textContent = start.textContent;
                }
            }
        }

        if(start.hasChildNodes()){
            const list = start.children;
            for(let i=0; i < list.length; i++){
                this._generateInstance(list[i],parent)
            }
        }
        return parent;
    }


    getInstanceId(){
        if(this.ref.startsWith('instance(')){
            return 'not implemented';
        }else{
            return 'default';
        }
    }


}

window.customElements.define('fx-append', FxAppend);
