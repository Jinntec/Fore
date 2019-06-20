import {dedupingMixin} from '../assets/@polymer/polymer/lib/utils/mixin.js';

/**
 *
 * A bound element is an element having a `bind` attribute. All Controls are bound elements, however not all bound elements
 * are controls (e.g. itemset, repeat, group and actions).
 *
 * A bound element gets access to the modelData via a proxy object that is passed in during initialization of the form.
 *
 * @polymer
 * @mixinClass
 * @param superClass
 */
let bound = (superClass) =>
    class extends superClass {

        constructor() {
            super();

        }

        static get properties() {
            return {
                /**
                 * the proxy property holds a reference to the proxy object that itself gives access to the modelData
                 */
/*
                proxy: {
                    type: Object
                },
*/
                bind:{
                    type: String
                },
                ownerForm:{
                    type: Object
                },
                modelItem:{
                    type:Object
                },
                repeated:{
                    type: Boolean,
                    value:false
                }
            };
        }

        connectedCallback(){
            super.connectedCallback();
            this.ownerForm = this.closest('xf-form');
        }

        init(){
            this.modelItem = this.ownerForm.findById(this.ownerForm.modelData, this.bind)
        }

        /**
         * initialize the bound element by storing the reference to its proxy.
         *
         * @param proxy - the proxy object
         */
        // refresh() {
            // this.proxy = proxy;
            // this.modelItem = modelItem;
            // console.log('BoundElementMixing proxy ', this.proxy);
        // }

        /**
         * find the ModelItem for given bindId
         *
         * If no ModelItem is present consult the parent for a ModelItem and check for bindId within its context.
         * Continue upwards until 'xf-form' element is reached.
         *
         * @param bindId
         * @param boundElement
         * @private
         */
/*
        _resolve(bindId, boundElement) {
            // console.log('>>>>> resolve boundElement ', boundElement);

            if (boundElement.hasOwnProperty('modelItem')) {
                // console.log('resolve - already exists on element. Returning it: ', boundElement.modelItem);
                return boundElement.modelItem;
            } else {
                console.warn('resolve - element has no modelItem ', boundElement);
                // console.log('>>>>> resolve modelData ', this.modelData );

                const target = this._findById(this.modelData, bindId);
                // console.log('++++++++++ test ', test);

                if (this.modelItems[bindId] === undefined) {
                    // ### create modelItem and store in `modelItems`
                    // const state = this.createBindProxy(target, 0);
                    const state = this.createModelItem(target, 0);
                    // this._addModelItem(bindId, state);
                    return state;
                } else {
                    return this.modelItems[bindId][0]; // ### should be fine to use index '0' as we are outermost and there can be only one
                }

                return null;

                // walking upwards the tree of UIElements to find the modelItem
                // return null;
            }
        }
*/



        isBoundComponent(element){
            console.log('### isBoundComponent ', element);
            return element.hasAttribute('bind') && (window.BOUND_ELEMENTS.indexOf(element.nodeName.toUpperCase()) > -1);
        }




    };

export const BoundElementMixin = dedupingMixin(bound);