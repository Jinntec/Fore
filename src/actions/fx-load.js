import {AbstractAction} from './abstract-action.js';
import {evaluateXPathToString, resolveId} from "../xpath-evaluation";
import {Fore} from "../fore";
import getInScopeContext from '../getInScopeContext.js';

/**
 * `fx-message`
 *
 * Action to display messages to the user.
 *
 *
 */
class FxLoad extends AbstractAction {

    static get properties() {
        return {
            ...super.properties,
            attachTo: {
                type: String
            },
            url: {
                type: String
            }
        }
    }

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    connectedCallback() {
        super.connectedCallback();
        this.attachTo = this.hasAttribute('attach-to') ? this.getAttribute('attach-to') : '_self';
        // this.url = this.hasAttribute('url') ? this.getAttribute('url') : '';
        const style = `
        :host{
            display:none;
        }
    `;
        this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
        ${this.renderHTML()}
        this.urlContent = this.url;
    `;
    }

    disconnectedCallback() {
        // super.disconnectedCallback();
        this.targetElement.removeEventListener(this.event, e => this.execute(e));
    }

    // eslint-disable-next-line class-methods-use-this
    renderHTML() {
        return `
        <slot></slot>
    `;
    }

    async perform() {
        await super.perform();

        // this.getOwnerForm().evaluateTemplateExpression(this.urlContent, this);

        this.url = Fore.evaluateAttributeTemplateExpression(this.getAttribute('url'),this);
        if(this.attachTo === '_blank'){
            window.open(this.url);
        }

        if(this.attachTo === '_self'){
            window.location.href = this.url;
        }

        try {
            const response = await fetch(this.url, {
                method: 'GET',
                mode: 'cors',
                // credentials: 'include',
                /*
                        headers: {
                          'Content-Type': contentType,
                        },
                */
            });
            const {status} = response;
            const data = await response.text();
            // console.log('data loaded: ', data);

            if(!this.attachTo){
                this.innerHtml = data;
            }
            if (this.attachTo.startsWith('#')) {
                const targetId = this.attachTo.substring(1);
                const resolved = resolveId(targetId,this);
                resolved.innerHTML = '';
                resolved.innerHTML = data;
            }



        } catch (error) {
            throw new Error(`failed loading data ${error}`);
        }


        this.dispatchEvent(
            new CustomEvent('url-loaded', {
                composed: true,
                bubbles: true,
                detail: {url: this.url},
            }),
        );
    }

/*
    _getValue() {
        if (this.hasAttribute('value')) {
            const valAttr = this.getAttribute('value');
            try {
                const inscopeContext = getInScopeContext(this, valAttr);
                return evaluateXPathToString(valAttr, inscopeContext, this);
            } catch (error) {
                console.error(error);
                Fore.dispatch(this, 'error', {message: error});
            }
        }
        if (this.textContent) {
            return this.textContent;
        }
        return null;
    }
*/

}

if (!customElements.get('fx-load')) {
    window.customElements.define('fx-load', FxLoad);
}
