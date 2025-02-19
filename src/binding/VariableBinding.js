import { Binding } from './Binding';

export class VariableBinding extends Binding {
    constructor(xpath) {
        super(xpath, 'variable');
    }

    update() {
        super.update();
    }
}
