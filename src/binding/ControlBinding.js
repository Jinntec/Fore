import { DependencyTracker } from '../DependencyTracker.js';
import ForeElementMixin from '../ForeElementMixin.js';
import { ModelItem } from '../modelitem.js';
import { evaluateXPathToNodes } from '../xpath-evaluation.js';
import { Binding } from './Binding.js';
import { detectTemplateExpressions } from './detectTemplateStrings.js';

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

        // TODO: only for non-default directly
        detectTemplateExpressions(this.control);

        // The control depends on some facets of the bound node / model item
        DependencyTracker.getInstance().registerBinding(
            this.modelItem.path,
            this,
        );
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
        this.control.refresh();
    }
}
