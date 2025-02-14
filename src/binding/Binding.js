import {DependencyTracker} from "../DependencyTracker.js";

/**
 * Common base class for all bindings allowing to register them with DependencyTracker
 *
 */
export class Binding {
    constructor(key, type) {
        this.xpath = key;
        this.bindingType = type;
        // DependencyTracker.getInstance().registerBinding(this.xpath, this);
    }

    update(){
        console.log('updating key',this.xpath);
    }
}