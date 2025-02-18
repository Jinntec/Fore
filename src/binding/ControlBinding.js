import { DependencyTracker } from '../DependencyTracker.js';
import ForeElementMixin from '../ForeElementMixin.js';
import { ModelItem } from '../modelitem.js';
import { evaluateXPathToNodes } from '../xpath-evaluation.js';
import { Binding } from './Binding.js';
import { detectTemplateExpressions } from './detectTemplateStrings.js';

export class ControlBinding extends Binding {
  constructor(control) {
    super(control.getModelItem().path, 'control');
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
