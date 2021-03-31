import { FxAction } from "./fx-action.js";
// import '../fx-model.js';
// import '../fx-instance.js';
import * as fx from 'fontoxpath';
import {FxInstance} from "../fx-instance";
import {FxBind} from "../fx-bind";

/**
 * `fx-append`
 *
 *
 *
 *
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
    }

    connectedCallback(){
        console.log('connectedCallback ', this);
        this.ref = this.getAttribute('ref');
        this.repeat = this.getAttribute('repeat');
    }

    /**
     * appends a instance of the repeat template to the existing ones.
     *
     * The data structure to insert into the instance data is determined by the 'ref' attributes
     * found in the template of the repeat. This is similar to lazy instance creation.
     *
     * Note: This is a significant difference to XForms which takes the instance nodes as template to insert but
     * has the problem of empty nodesets not being able to insert an entry without using a separate instance
     * holding the template.
     *
     * As a consequence the item that are appended are not propagated with values but empty. However usually
     * that's what the user wants and not the other way round (duplicating the last data items). If the XForms
     * behavior should be needed for some reason later on, it can be added easier by a providing an 'duplicate' action.
     *
     */
    execute(){
        const inscope = this._inScopeContext();
        this.nodeset = fx.evaluateXPathToNodes(this.ref, inscope, null, {});
        const newItem = this._dataFromTemplate(inscope);
        console.log('################ newItem ',newItem)

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
    }

    _dataFromTemplate(inscope){
        const parentForm = this.getOwnerForm(this);
        const repeat = parentForm.querySelector(`#${this.repeat}`)
        // console.log('_dataFromTemplate repeat', repeat);
        // console.log('_dataFromTemplate repeat ref', repeat.ref);


        const templ = repeat.shadowRoot.querySelector('template');
        // console.log('_dataFromTemplate ', templ);
        // console.log('_dataFromTemplate content', templ.content);

        // iterate template for refs
        // todo: will fail for pathes with predicates - need to be filtered before
        // const rootNode = document.createElement(repeat.ref);



        // const rootNode = document.createElement(repeat.ref);
        const rootNode = inscope.ownerDocument.createElement(repeat.ref);



        // const data = this._dataFromRefs(rootNode, templ.content)
        const data = this._generateInstance(templ.content,rootNode);
        // console.log('_dataFromTemplate DATA', data);
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

    _fadeIn(el, display){
        el.style.opacity = 0;
        el.style.display = display || "block";

        (function fade() {
            var val = parseFloat(el.style.opacity);
            if (!((val += .1) > 1)) {
                el.style.opacity = val;
                requestAnimationFrame(fade);
            }
        })();
    };

}

window.customElements.define('fx-append', FxAppend);
