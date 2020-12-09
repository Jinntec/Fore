import {LitElement, css} from 'lit-element';

import fx from "fontoxpath";
import DepGraph from "./dep_graph.js";
import {Fore} from './fore.js';
import './xf-instance.js';
import './xf-bind.js';
import {XPathUtil} from "./xpath-util";

export class XfModel extends LitElement {

    static get styles() {
        return css`
            :host {
                display: none;
            }
        `;
    }

    static get properties() {
        return {
            id: {
                type: String
            },
            instances: {
                type: Array
            },
            /*
                        defaultInstance: {
                            type: Object
                        },
            */
            defaultContext: {
                type: Object
            },
            modelItems: {
                type: Array
            }

        };
    }

    constructor() {
        super();
        this.id = '';
        this.instances = [];
        this.modelItems = [];
        this.defaultContext = {};

        this.addEventListener('model-construct', this._modelConstruct);
        this.addEventListener('ready', this._ready);

        this.mainGraph = new DepGraph(false);
    }

    _modelConstruct(e) {
        // console.log('MODEL::model-construct received ', this.id);
        const instances = this.querySelectorAll('xf-instance');
        if (instances.length > 0) {
            // console.group('init instances');
            instances.forEach(instance => {
                instance.init();
            });
            this.instances = Array.from(instances);
            console.groupEnd();
            // console.log('model instances ', this.instances);

            // this._initOutermostBindings();

            this.updateModel();
            // console.groupEnd();
            // console.log('dispatching model-construct-done');
            this.dispatchEvent(new CustomEvent('model-construct-done', {
                composed: true,
                bubbles: true,
                detail: {model: this}
            }));
        } else {
            // this._initOutermostBindings();
            this.dispatchEvent(new CustomEvent('model-construct-done', {
                composed: true,
                bubbles: true,
                detail: {model: this}
            }));
        }
    }

    registerModelItem(modelItem) {
        console.log('ModelItem registered ', modelItem);
        this.modelItems.push(modelItem);
    }

    /**
     * update action triggering the update cycle
     */
    updateModel() {
        this.rebuild();
        this.recalculate();
        this.revalidate();
    }

    rebuild() {
        console.group('### rebuild');

        this.modelItems = [];

        // trigger recursive initialization of the xf-bind elements
        const binds = this.querySelectorAll('xf-model > xf-bind');
        binds.forEach(bind => {
            bind.init(this);
        });

        // console.log(`dependencies of a `, this.mainGraph.dependenciesOf("/Q{}data[1]/Q{}a[1]:required"));
        // console.log(`dependencies of b `, this.mainGraph.dependenciesOf("/Q{}data[1]/Q{}b[1]:required"));
        console.log(`rebuild mainGraph`, this.mainGraph);
        console.log(`rebuild mainGraph calc order`, this.mainGraph.overallOrder());
        console.log(`rebuild finished with modelItems ${this.modelItems.length} item(s)`, this.modelItems);
        console.groupEnd();
    }

    recalculate() {
        console.group('### recalculate');

        const v = this.mainGraph.overallOrder();
        v.forEach(path =>{
            // console.log('recalculating path ', path);

            const node = this.mainGraph.getNodeData(path);
            // console.log('recalculating node ', node);
            const modelItem = this.getModelItem(node);
            console.log('modelitem ', modelItem);

            if(modelItem && path.indexOf(':')){
                const property = path.split(':')[1];
                if(property){
                    if(property === 'calculate'){
                        const expr = modelItem.bind[property];
                        const compute = Fore.evaluateXPath(expr, modelItem.node, this, Fore.namespaceResolver);
                        modelItem.value = compute;
                    }else if(property !== 'constraint' && property !== 'type') {
                        console.log('recalculating property ', property);

                        const expr = modelItem.bind[property];
                        console.log('recalc expr: ', expr);
                        const compute = Fore.evaluateToBoolean(expr, modelItem.node, this, Fore.namespaceResolver);

                        console.log(`${property} computed`, compute);
                        modelItem[property] = compute;
                    }
                }
            }
        })


        /*
                const binds = this.querySelectorAll('xf-bind[calculate]');
                binds.forEach(bind => {
                    const contextNode = bind.nodeset[0];
                    const compute = fx.evaluateXPath(bind.required, contextNode, null, {});
                    this.getModelItem(contextNode).value = compute;
                    console.log('computed ', compute);
                });
        */
        console.log(`recalculate finished with modelItems ${this.modelItems.length} item(s)`, this.modelItems);
        console.groupEnd();
    }

    revalidate() {
        console.group('### revalidate');

        this.modelItems.forEach(modelItem => {
            console.log('validating node ', modelItem.node);

            const bind = modelItem.bind;
            if (bind) {
                console.log('modelItem bind ', bind);

                /*
                if there is a bind for this modelitem we'll evaluate all of its modelitem properties.

                In case modelItems are lazy-created there won't be any bind element for them.
                 */
                if (bind) {

                    const {constraint} = bind;
                    let constraintValid;
                    if (constraint) {
                        const compute = Fore.evaluateToBoolean(constraint, modelItem.node, this, Fore.namespaceResolver);
                        // item.required = compute;
                        constraintValid = compute;
                    }

                    const {type} = bind;
                    if (type) {
                        // todo: datatype check
                        const check = true;
                        modelItem.required = constraintValid && check;
                    }

                }
            }

        });

        console.groupEnd();
    }

    getModelItem(node) {
        return this.modelItems.find(m => m.node === node);
    }

    /*
        _initOutermostBindings(){
            console.group('### initialize bindings');

            this.modelItems = [];
            const binds = this.querySelectorAll('xf-model > xf-bind');
            binds.forEach(bind => {
                bind.init(this);
            });
            console.groupEnd();
        }
    */


    _handleModelConstructDone(e) {
        console.log('_handleModelConstructDone');
        this.refresh();
    }


    /**
     * get the default evaluation context for this model.
     * @returns {Element} the
     */
    getDefaultContext() {
        // console.log('getDefaultContext instanceData ', this.instances[0].instanceData);
        // console.log('getDefaultContext firstChild ', this.instances[0].instanceData.firstElementChild);
        // return this.instances[0].instanceData.firstElementChild;
        return this.instances[0].getDefaultContext();
    }

    getDefaultInstance() {
        return this.instances[0];
    }

    getDefaultInstanceData() {
        console.log('default instance data ', this.instances[0].instanceData);
        return this.instances[0].instanceData;
    }

    getInstance(id) {
        console.log('getInstance ', id);
        console.log('instances ', this.instances);
        // console.log('instances array ',Array.from(this.instances));

        const instArray = Array.from(this.instances);
        return instArray.find(inst => inst.id === id);
    }


    evalBinding(bindingExpr) {
        // console.log('MODEL.evalBinding ', bindingExpr);
        //default context of evaluation is always the default instance


        const result = this.instances[0].evalXPath(bindingExpr);


        return result;

    }

    _ready(e) {
        console.log('model is ready');
    }

    createRenderRoot() {
        /**
         * Render template without shadow DOM. Note that shadow DOM features like
         * encapsulated CSS and slots are unavailable.
         */
        return this;
    }


}

customElements.define('xf-model', XfModel);