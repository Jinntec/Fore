// Import the LitElement base class and html helper function
import { LitElement, html, css } from '../assets/lit-element/lit-element.js';
import '../assets/@polymer/paper-item/paper-item.js';
import '../assets/@polymer/paper-styles/color.js';

// Extend the LitElement base class
class DocTopic extends LitElement {

    static get styles() {
        return css`
            :host {
              display: block;
              background:var(--paper-grey-300);
              
            }
            paper-item{
                color:var(--paper-grey-900);
            }
            `;
    }

    static get properties() {
        return {
            src: {
                type: String
            },
            label:{
                type:String
            }
        };
    }

    /**
     * Implement `render` to define a template for your element.
     *
     * You must provide an implementation of `render` for any element
     * that uses LitElement as a base class.
     */
    render(){
        /**
         * `render` must return a lit-html `TemplateResult`.
         *
         * To create a `TemplateResult`, tag a JavaScript template literal
         * with the `html` helper function:
         */
        return html`
            <paper-item value="${this.src}">${this.label}</paper-item>
        `;
    }
}
// Register the new element with the browser.
customElements.define('doc-topic', DocTopic);


