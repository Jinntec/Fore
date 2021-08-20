import {AbstractAction} from './abstract-action.js';
import getInScopeContext from "../getInScopeContext.js";
import {evaluateXPath} from "../xpath-evaluation.js";

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

        /*
         todo: !!! calling super here does not correctly give the nodeset - it's likely still a bug in ForeElementMixin !!!
        super.perform();
        console.log('this.nodeset', this.nodeset);
        */

        // ### obtaining targetSequence
        const inscope = getInScopeContext(this, this.ref);
        // @ts-ignore
        const targetSequence = evaluateXPath(this.ref, inscope, this.getOwnerForm());
        console.log('insert nodeset ', targetSequence);

        // ### obtaining originSequence
        let originSequence;
        if (this.origin) {
            // ### if there's an origin attribute use it
            const originTarget = evaluateXPath(this.origin, inscope, this.getOwnerForm());
            if(Array.isArray(originTarget) && originTarget.length === 0){
                console.warn('invalid origin for this insert action - ignoring...', this);
                return;
            }
            originSequence = originTarget.cloneNode(true);
        } else if (targetSequence) {
            // ### use last item of targetSequence
            originSequence = this._cloneTargetSequence(targetSequence);
        }
        if (!originSequence) return; // if no origin back out without effect

        let contextItem;
        let index;

        // if the targetSequence is empty but we got an originSequence use inscope as context and ignore 'at' and 'position'
        if(targetSequence.length === 0){
            contextItem = inscope;
            inscope.appendChild(originSequence);
            index = 1;
            console.log('appended', inscope);
        } else {
            // todo: eval 'at'

            /*
            insert at position given by 'at' or use the last item in the targetSequence
             */
            // if (this.at) {
            if (this.hasAttribute('at')) {
                // index = this.at;
                // contextItem = targetSequence[this.at - 1];

                index = evaluateXPath(this.getAttribute('at'), inscope, this.getOwnerForm());
                contextItem = targetSequence[index - 1];
            } else {
                // this.at = targetSequence.length;
                index = targetSequence.length;
                contextItem = targetSequence[targetSequence.length - 1];
            }

            // ### if the contextItem is undefined use the targetSequence - usually the case when the targetSequence just contains a single node
            if(!contextItem){
                contextItem = targetSequence;
            }

            if (this.position && this.position === 'before') {
                // this.at -= 1;
                contextItem.parentNode.insertBefore(originSequence.cloneNode(true), contextItem);
            }

            if (this.position && this.position === 'after') {
                // contextItem.parentNode.append(originSequence);
                const nextSibl = contextItem.nextSibling;
                index += 1;
                contextItem.insertAdjacentElement('afterend',originSequence.cloneNode(true));
            }

        }

        // console.log('insert context item ', contextItem);
        // console.log('parent ', contextItem.parentNode);
        console.log('instance ', this.getModel().getDefaultContext());

        console.log('<<<<<<< at', this.at);
        console.log('<<<<<<< index', index);
        document.dispatchEvent(
            new CustomEvent('insert', {
                composed: true,
                bubbles: true,
                detail: { insertedNodes:originSequence, position: index },
            }),
        );

        this.needsUpdate = true;
    }

    // eslint-disable-next-line class-methods-use-this
    _cloneTargetSequence (seq){
        if (Array.isArray(seq) && seq.length !== 0) {
            return  seq[seq.length - 1].cloneNode(true);
        }
        if(!Array.isArray(seq) && seq){
            return seq.cloneNode(true);
        }
        return null;
    }


    actionPerformed() {
        this.getModel().rebuild();
        super.actionPerformed();
    }

}

window.customElements.define('fx-insert', FxInsert);
