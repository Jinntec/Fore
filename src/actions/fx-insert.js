import {AbstractAction} from './abstract-action.js';
import getInScopeContext from "../getInScopeContext";
import {evaluateXPath} from "../xpath-evaluation";

/**
 * `fx-insert`
 * inserts nodes into data instances
 *
 * @customElement
 */
export class FxInsert extends AbstractAction {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    connectedCallback() {
        if (super.connectedCallback) {
            super.connectedCallback();
        }
        const style = `
        :host{
            display:none;
        }
    `;
        this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
        <slot></slot>
    `;

        this.at = Number(this.hasAttribute('at') ? this.getAttribute('at') : 0); // default: size of nodeset, determined later
        this.position = this.hasAttribute('position') ? this.getAttribute('position') : 'after';
        this.origin = this.hasAttribute('origin') ? this.getAttribute('origin') : null; // last item of context seq

    }

    perform() {
        // super.perform();
        const inscope = getInScopeContext(this, this.ref);

        // todo: does probably more than needed as this.nodeset should equal the targetSequence...?
        const targetSequence = evaluateXPath(this.ref, inscope, this.getOwnerForm());
        console.log('insert nodeset ', targetSequence);

        let originSequence;
        // ### if there's an origin use it
        if (this.origin) {
            originSequence = evaluateXPath(this.origin, inscope, this.getOwnerForm());
        } else if (targetSequence) {
            // ### if there's a targetSequence take from there
/*
            if (Array.isArray(targetSequence)) {
                originSequence = targetSequence[targetSequence.length - 1].cloneNode(true);
            } else {
                originSequence = targetSequence.cloneNode(true);
            }
*/
            originSequence = this._getTargetSequence(targetSequence);
        }
        if (!originSequence) return;


        let contextItem;
        // todo: eval 'at'
        if (this.at) {
            contextItem = targetSequence[this.at - 1];
        } else {
            this.at = targetSequence.length;
            contextItem = targetSequence[targetSequence.length - 1];
        }


        if (this.position && this.position === 'before') {
            contextItem.parentNode.insertBefore(originSequence.cloneNode(true), contextItem);
        }

        if (this.position && this.position === 'after') {
            // contextItem.parentNode.append(originSequence);
            const nextSibl = contextItem.nextSibling;
            this.at += 1;
            contextItem.insertAdjacentElement('afterend',originSequence.cloneNode(true));
        }

        // console.log('insert context item ', contextItem);
        // console.log('parent ', contextItem.parentNode);
        // console.log('instance ', this.getModel().getDefaultContext());

        console.log('<<<<<<< at', this.at);
        document.dispatchEvent(
            new CustomEvent('insert', {
                composed: true,
                bubbles: true,
                detail: { insertedNodes:originSequence, position: this.at },
            }),
        );

        this.needsUpdate = true;
    }

    // eslint-disable-next-line class-methods-use-this
    _getTargetSequence (seq){
        if (Array.isArray(seq)) {
            return  seq[seq.length - 1].cloneNode(true);
        }
        return seq.cloneNode(true);
    }


    actionPerformed() {
        this.getModel().rebuild();
        super.actionPerformed();
    }

}

window.customElements.define('fx-insert', FxInsert);
