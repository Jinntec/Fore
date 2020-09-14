import {LitElement, html, css} from 'lit-element';
import {BoundElement} from "../BoundElement";



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


    init(model){
        super.init(model);
        console.log(this, this.modelItem);
    }

    render() {
        return html`
            <slot></slot>
        `;
    }


}

window.customElements.define('xf-group', XfGroup);
