import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';


/**
 * `xf-refresh`
 * general class for bound elements
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class XfRefresh extends PolymerElement {


    execute(){
        // console.log('#### refresh fired');
        this.closest('xf-form').refresh();
    }


}

window.customElements.define('xf-refresh', XfRefresh);
