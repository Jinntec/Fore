import { DependencyTracker } from '../DependencyTracker.js';

/**
 * Common base class for all bindings allowing to register them with DependencyTracker
 *
 */
export class UIBinding {
    constructor(key, refreshAble) {
        this.xpath = key;
        this.refreshAble = refreshAble;
    }

    update() {
        // console.log(`updating Binding ${this.xpath}`, this);
        DependencyTracker.getInstance().pendingUpdates.delete(this);
        this.refresh();
        // console.log('pendingUpdates after deletion', Array.from(DependencyTracker.getInstance().pendingUpdates));
    }

    refresh(){
        this.refreshAble.refresh();
    }
}
