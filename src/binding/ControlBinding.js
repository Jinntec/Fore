import { DependencyTracker } from '../DependencyTracker.js';
import ForeElementMixin from '../ForeElementMixin.js';
import { ModelItem } from '../modelitem.js';
import { Binding } from './Binding.js';
// import { detectTemplateExpressions } from './detectTemplateStrings.js';

export class ControlBinding extends Binding {
    constructor(xpath, control) {
        super(xpath, 'control');
        /**
         * @type {ModelItem}
         */
        this.modelItem = control.getModelItem();
        /**
         * @type {ForeElementMixin}
         */
        this.control = control;

        // The control depends on some facets of the bound node / model item
/*
        to NOT register ourselves - we've been registered already
        DependencyTracker.getInstance().registerBinding(
            this.modelItem.path,
            this,
        );
*/
        if (this.modelItem.bind?.getAttribute('readonly')) {
            DependencyTracker.getInstance().registerBinding(
                `${this.modelItem.path}:readonly`,
                this,
            );
        }
        if (this.modelItem.bind?.getAttribute('relevant')) {
            DependencyTracker.getInstance().registerBinding(
                `${this.modelItem.path}:relevant`,
                this,
            );
        }
        if (this.modelItem.bind?.getAttribute('required')) {
            DependencyTracker.getInstance().registerBinding(
                `${this.modelItem.path}:required`,
                this,
            );
        }
        if (this.modelItem.bind?.getAttribute('constraint')) {
            DependencyTracker.getInstance().registerBinding(
                `${this.modelItem.path}:constraint`,
                this,
            );
        }
    }

    update() {
        super.update();
        this.refresh();
    }

    refresh() {
        // console.log('control refreshing')
        if (this.control.isDestroyed) {
            console.log(
                `Cancelling update for control for ${this.xpath} that is already destroyed`,
            );
            return;
        }
        this.control.refresh();
    }
}
