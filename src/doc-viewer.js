// Import the LitElement base class and html helper function
import { LitElement, html, css } from '../assets/lit-element/lit-element.js';
import '../assets/@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '../assets/@polymer/app-layout/app-drawer/app-drawer.js';
import '../assets/@polymer/paper-styles/color.js';
import '../assets/@polymer/paper-styles/typography.js';

// Extend the LitElement base class
class DocViewer extends LitElement {

    static get styles() {
        return css`
            :host {
              display: block;
              background:blue;
            }
            `;
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
        <app-drawer-layout fullbleed>
            <app-drawer name="drawerSlot">
<!--                <slot></slot>-->
            </app-drawer>
        
            <slot></slot>
        </app-drawer-layout>
        `;
    }


    static get properties() {
        return {
            defaultPage: {
                type: String,
                value:'index.html'
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.loader = this.shadowRoot.getElementById('loadTopic');
        this.loader.generateRequest();
    }

}
// Register the new element with the browser.
customElements.define('doc-viewer', DocViewer);


