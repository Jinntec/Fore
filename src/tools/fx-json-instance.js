import '../../devtools/node_modules/jsonpath-picker-vanilla/index.js';
export class FxJsonInstance extends HTMLElement{

    constructor() {
        super();
    }

    connectedCallback(){

    }


}

if (!customElements.get('fx-json-instance')) {
    customElements.define('fx-json-instance', FxJsonInstance);
}
