import {XfAction} from './xf-action.js';

import "../xf-model.js";
import "../xf-submission.js";

/**
 * `xf-send` - finds and activates a `xf-submission` element.
 *
 *
 * @customElement
 */
export default class XfSend extends XfAction {

    static get properties() {
        return {
            ...super.properties,
            submission: {
                type: String
            }
        };
    }

    constructor(){
        super();
        this.value = "";
    }

    connectedCallback(){
        console.log('connectedCallback ', this);
        this.submission = this.getAttribute('submission');
    }

    execute() {
        super.execute();

        console.log('submitting ', this.submission);
        console.log('submitting model', this.getModel());

        //if not exists signal error
        const submission = this.getModel().querySelector(`#${this.submission}`);
        console.log('submission', submission);
        submission.submit();


        //if not of type xf-submission signal error


    }


}

window.customElements.define('xf-send', XfSend);
