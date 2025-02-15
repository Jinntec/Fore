import {DependencyTracker} from "../DependencyTracker.js";

/**
 * Common base class for all bindings allowing to register them with DependencyTracker
 *
 */
export class Binding {
    constructor(key, type) {
        this.xpath = key;
        this.bindingType = type;
    }

    update(){
        console.log(`updating Binding ${this.xpath}`, this);
        DependencyTracker.getInstance().pendingUpdates.delete(this);
        // console.log('pendingUpdates after deletion', Array.from(DependencyTracker.getInstance().pendingUpdates));
    }
}