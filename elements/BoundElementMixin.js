import {dedupingMixin} from '../assets/@polymer/polymer/lib/utils/mixin.js';

/**
 *
 * A bound element is an element having a `bind` attribute. All Controls are bound elements, however not all bound elements
 * are controls (e.g. itemset, repeat, group and actions).
 *
 * A bound element gets access to the model via a proxy object that is passed in during initialization of the form.
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
                 * the proxy property holds a reference to the proxy object that itself gives access to the model
                 */
                proxy: {
                    type: Object
                }
            };
        }

        /**
         * initialize the bound element by storing the reference to its proxy.
         *
         * @param proxy - the proxy object
         */
        init(proxy) {
            this.proxy = proxy;
        }

    };

export const BoundElementMixin = dedupingMixin(bound);