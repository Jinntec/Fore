import {AbstractAction} from './abstract-action.js';
import {evaluateXPathToString, resolveId} from "../xpath-evaluation.js";
import getInScopeContext from '../getInScopeContext.js';
import {XPathUtil} from "../xpath-util.js";
import {Fore} from "../fore.js";

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
        this.url='';
    }

    connectedCallback() {
        super.connectedCallback();
        this.attachTo = this.hasAttribute('attach-to') ? this.getAttribute('attach-to') : '_self';

		// Add a 'doneEvent' to block the action chain untill the event fired on the element we're
		// loading something into.
        this.awaitEvent = this.hasAttribute('await') ? this.getAttribute('await') : '';
        this.url = this.hasAttribute('url') ? this.getAttribute('url') : '';
        const style = `
            :host{
                display:none;
            }
        `;
        this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${this.renderHTML()}`;
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

        const template = this.querySelector('template');
        if(template){
            const clone = template.content.cloneNode(true);
            const content = document.importNode(clone, true);
            // this._attachToElement(content);
            if (this.attachTo.startsWith('#')) {
                const targetId = this.attachTo.substring(1);
                const resolved = resolveId(targetId, this);
                // remove all children
                while (resolved.firstChild) {
                    resolved.removeChild(resolved.firstChild);
                }
				if (this.awaitEvent) {
					let resolveEvent;
					const waitForEvent = new Promise((resolve) => {
						resolveEvent = resolve;
					});
					const eventListener = () => {
						resolveEvent();
						resolved.removeEventListener(this.awaitEvent, eventListener);
					};

					resolved.appendChild(content);
					resolved.addEventListener(this.awaitEvent, eventListener);

					await waitForEvent;

					this.needsUpdate  = true;

					Fore.dispatch(this, 'loaded', {attachPoint:this.attachTo, content});
					return;
				}

                resolved.appendChild(content);

				this.needsUpdate  = true;
            }
            Fore.dispatch(this, 'loaded', {});
            return;
        }

        if(!this.url){
            // for authoring errors we log errors directly to DOM

            this.dispatchEvent(
                new CustomEvent('log', {
                    composed: false,
                    bubbles: true,
                    cancelable:true,
                    detail: { id:this.id, message: `neiter template element nor Url was specified.`, level:'Error'},
                }),
            );
            return;
        }
        this.url = this._evaluateUrlExpression();
        if (this.attachTo === '_blank') {
            window.open(this.url);
        }

        if (this.attachTo === '_self') {
            window.location.href = this.url;
        }

        try {
            const response = await fetch(this.url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'same-origin',
                headers: {
                  'Content-Type': "text/html",
                },
            });
            const data = await response.text();
            // console.log('data loaded: ', data);

            // todo: if data contain '<template' element as first child instanciate and insert it
            if (!this.attachTo) {
                this.innerHtml = data;
            }
/*
            if (this.attachTo.startsWith('#')) {
                const targetId = this.attachTo.substring(1);
                const resolved = resolveId(targetId, this);
                resolved.innerHTML = '';
                resolved.innerHTML = data;
            }
*/
            this._attachToElement(data);


            Fore.dispatch(this, 'loaded', {url: this.url})

        } catch (error) {
            // throw new Error(`failed loading data ${error}`);
            console.warn(`failed loading data ${error}`);
            return;
            // Fore.dispatch(this, 'load-error', {message: `failed loading data ${error}`})
        }
    }

    _attachToElement(content){
        if (this.attachTo.startsWith('#')) {
            const targetId = this.attachTo.substring(1);
            const resolved = resolveId(targetId, this);
            resolved.innerHTML = '';
            resolved.innerHTML = content;
        }
    }

    _evaluateUrlExpression() {
        const url = this.getAttribute('url');
        if (!url) {
            throw new Error('url not specified');
        }

        const replaced = url.replace(/{[^}]*}/g, match => {
            if (match === '{}') return match;
            const naked = match.substring(1, match.length - 1);
            const inscope = getInScopeContext(this, naked);
            if (!inscope) {
                console.warn('no inscope context for ', this);
                return match;
            }
            // Templates are special: they use the namespace configuration from the place where they are
            // being defined
            const instanceId = XPathUtil.getInstanceId(naked);

            // If there is an instance referred
            const inst = instanceId ? this.getModel().getInstance(instanceId) : this.getModel().getDefaultInstance();
            try {
                return evaluateXPathToString(naked, inscope, this, null, inst);
            } catch (error) {
                console.warn('ignoring unparseable url', error);
                return match;
            }
        });
        return replaced;
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
