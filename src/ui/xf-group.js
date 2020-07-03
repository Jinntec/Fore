import {LitElement, html, css} from 'lit-element';
import '../deprecated/xf-case.js';
import {BoundElement} from "../BoundElement.js";


/**
 * `xf-group`
 * a container allowing to switch between xf-case elements
 *
 *
 *  * todo: implement
 * @customElement
 * @polymer
 */
class XfGroup extends BoundElement{


    render() {
        return html`
            <slot></slot>
        `;
    }


}

window.customElements.define('xf-group', XfGroup);
