import {FxAction} from './fx-action.js';

import "../fx-model.js";
import "../fx-submission.js";

/**
 * `fx-send` - finds and activates a `fx-submission` element.
 *
 *
 * @customElement
 */
export default class FxSend extends FxAction {

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
        if(submission === null){
            this.dispatchEvent(new CustomEvent('error', {
                composed: true,
                bubbles: true,
                detail: {message: `fx-submission element with id: '${  this.submission  }' not found`}
            }));

        }
        console.log('submission', submission);
        submission.submit();


        //if not of type fx-submission signal error


    }


}

window.customElements.define('fx-send', FxSend);
