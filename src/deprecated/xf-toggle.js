import { XfAction } from "../actions/xf-action.js";



/**
 * `xf-toggle`
 * toggle a xf-case element
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
export class XfToggle extends XfAction{

    static get properties() {
        return {
            case:{
                type: String
            }
        };
    }



    execute(){
        const targetCase = document.getElementById(this.case);
        if(targetCase === undefined){
            this.dispatchEvent(new CustomEvent('action-error', {
                composed: true, bubbles: true, detail: {
                    "case": this.case
                }
            }));
        }else {
            const parentSwitch = targetCase.parentNode;
            parentSwitch.toggleCase(this.case);
        }
    }

}

window.customElements.define('xf-toggle', XfToggle);
