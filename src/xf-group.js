import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import {BoundElementMixin} from './BoundElementMixin.js';
import  './xf-case.js';


/**
 * `xf-group`
 * a container allowing to switch between xf-case elements
 *
 *
 *  * todo: implement
 * @customElement
 * @polymer
 */
class XfGroup extends BoundElementMixin(PolymerElement) {

    static get template() {
        return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <slot></slot>
    `;
    }

    /*
        static get properties() {
            return {
            }
        }
    */


    init() {
        super.init();
        console.log('### init ', this);
        console.log('### init modelItem', this.modelItem);
        // if (!this.repeated) {
        // }

    }



}

window.customElements.define('xf-group', XfGroup);
