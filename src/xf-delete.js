import {PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';

/**
 * `xf-delete`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 * @demo demo/todo.html
 */
class XfDelete extends PolymerElement {

    static get properties() {
        return {
            bind: {
                type: String
            }
        };
    }


    execute() {
        console.log('##### xf-delete executing...');

        const repeatItem = this.closest('xf-repeat-item');
        repeatItem.delete();

    }

}

window.customElements.define('xf-delete', XfDelete);
