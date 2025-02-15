import {Binding} from "./Binding.js";

export class ControlBinding extends Binding{
    constructor(control) {
        super(control.getModelItem().path,'control');
        this.modelItem = control.getModelItem();
        this.control = control;
    }

    update(){
        super.update();
        this.refresh();
    }

    refresh(){
        console.log('control refreshing')
        this.control.refresh();
    }
}