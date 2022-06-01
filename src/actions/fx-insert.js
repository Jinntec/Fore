import { AbstractAction } from './abstract-action.js';
import getInScopeContext from '../getInScopeContext.js';
import {
  evaluateXPath,
  evaluateXPathToNodes,
  evaluateXPathToFirstNode,
  evaluateXPathToNumber,
} from '../xpath-evaluation.js';

/**
 * `fx-insert`
 * inserts nodes into data instances
 *
 * @customElement
 */
export class FxInsert extends AbstractAction {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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
    this.keepValues = !!this.hasAttribute('keep-values');
  }

  _cloneOriginSequence(inscope, targetSequence) {
    let originSequenceClone;
    if (this.origin) {
      // ### if there's an origin attribute use it
      let originTarget;
      try {

        /*
        todo: discuss where to pass vars from event.detail into function context
         */
        // this.setInScopeVariables(this.detail);

        // originTarget = evaluateXPathToFirstNode(this.origin, inscope, this);
        originTarget = evaluateXPathToFirstNode(this.origin, inscope, this.getOwnerForm());
        if (Array.isArray(originTarget) && originTarget.length === 0) {
          console.warn('invalid origin for this insert action - ignoring...', this);
          originSequenceClone = null;
        }
        originSequenceClone = originTarget.cloneNode(true);
      } catch (error) {
        console.warn('invalid origin for this insert action - ignoring...', this);
      }
    } else if (targetSequence) {
      // ### use last item of targetSequence
      originSequenceClone = this._cloneTargetSequence(targetSequence);
      if (originSequenceClone && !this.keepValues) {
        this._clear(originSequenceClone);
      }
    }
    return originSequenceClone;
  }

  _getInsertIndex(inscope, targetSequence) {
    if (targetSequence.length === 0) {
      return null;
    }
    if (this.hasAttribute('at')) {
      return evaluateXPathToNumber(this.getAttribute('at'), inscope, this.getOwnerForm());
    }
    return targetSequence.length;
  }

  perform() {
    // super.perform();

    /*
         todo: !!! calling super here does not correctly give the nodeset - it's likely still a bug in ForeElementMixin !!!
        // super.perform();
        console.log('this.nodeset', this.nodeset);
        */

    let inscope;
    // ### 'context' attribute takes precedence over 'ref'
    let targetSequence;
    if (this.hasAttribute('context')) {
      inscope = getInScopeContext(this.getAttributeNode('context'), this.getAttribute('context'));
      targetSequence = evaluateXPathToNodes(
        this.getAttribute('context'),
        inscope,
        this.getOwnerForm(),
      );
    }

    if (this.hasAttribute('ref')) {
      if (inscope) {
        targetSequence = evaluateXPathToNodes(this.ref, inscope, this.getOwnerForm());
      } else {
        inscope = getInScopeContext(this.getAttributeNode('ref'), this.ref);
        targetSequence = evaluateXPathToNodes(this.ref, inscope, this.getOwnerForm());
      }
    }
    const originSequenceClone = this._cloneOriginSequence(inscope, targetSequence);
    if (!originSequenceClone) return; // if no origin back out without effect

    let insertLocationNode;
    let index;

    // const idx = this._getInsertIndex(inscope, targetSequence);
    // console.log('insert index', idx);

    // if the targetSequence is empty but we got an originSequence use inscope as context and ignore 'at' and 'position'
    if (targetSequence.length === 0) {
      insertLocationNode = inscope;
      inscope.appendChild(originSequenceClone);
      index = 1;
      console.log('appended', inscope);
    } else {
      /* ### insert at position given by 'at' or use the last item in the targetSequence ### */
      if (this.hasAttribute('at')) {
        // todo: eval 'at'
        // index = this.at;
        // insertLocationNode = targetSequence[this.at - 1];

        index = evaluateXPathToNumber(this.getAttribute('at'), inscope, this.getOwnerForm());
        insertLocationNode = targetSequence[index - 1];
      } else {
        // this.at = targetSequence.length;
        index = targetSequence.length;
        insertLocationNode = targetSequence[targetSequence.length - 1];
      }

      // ### if the insertLocationNode is undefined use the targetSequence - usually the case when the targetSequence just contains a single node
      if (!insertLocationNode) {
        index = 1;

        insertLocationNode = targetSequence;
        const context = evaluateXPathToNumber(
          'count(preceding::*)',
          targetSequence,
          this.getOwnerForm(),
        );
        // console.log('context', context);
        index = context + 1;
        // index = targetSequence.findIndex(insertLocationNode);
      }

      if (this.position && this.position === 'before') {
        // this.at -= 1;
        insertLocationNode.parentNode.insertBefore(originSequenceClone, insertLocationNode);
      }

      if (this.position && this.position === 'after') {
        // insertLocationNode.parentNode.append(originSequence);
        // const nextSibl = insertLocationNode.nextSibling;
        index += 1;
        if (this.hasAttribute('context') && this.hasAttribute('ref')) {
          // index=1;
          inscope.append(originSequenceClone);
        } else if (this.hasAttribute('context')) {
          const contextAttr = this.getAttribute('context');
          index = 1;
          insertLocationNode.prepend(originSequenceClone);
        } else {
          insertLocationNode.insertAdjacentElement('afterend', originSequenceClone);
        }
      }
    }

    // console.log('insert context item ', insertLocationNode);
    // console.log('parent ', insertLocationNode.parentNode);
    // console.log('instance ', this.getModel().getDefaultContext());

    console.log('<<<<<<< at', this.at);
    console.log('<<<<<<< index', index);
    // todo: this actually should dispatch to respective instance
    document.dispatchEvent(
      // new CustomEvent('insert', {
      new CustomEvent('index-changed', {
        composed: true,
        bubbles: true,
        detail: {
          insertedNodes: originSequenceClone,
          index,
        },
      }),
    );

    this.needsUpdate = true;
  }

  // eslint-disable-next-line class-methods-use-this
  _cloneTargetSequence(seq) {
    if (Array.isArray(seq) && seq.length !== 0) {
      return seq[seq.length - 1].cloneNode(true);
    }
    if (!Array.isArray(seq) && seq) {
      return seq.cloneNode(true);
    }
    return null;
  }

  actionPerformed() {
    this.getModel().rebuild();
    super.actionPerformed();
  }

  /**
   * clear all text nodes and attribute values to get a 'clean' template.
   * @param n
   * @private
   */
  _clear(n) {
    const attrs = n.attributes;

    // clear attrs
    for (let i = 0; i < attrs.length; i += 1) {
      // n.setAttribute(attrs[i].name,'');
      attrs[i].value = '';
    }
    // clear text content
    if (n.textContent) {
      n.textContent = '';
    }

    let node = n.firstChild;
    while (node) {
      if (node.nodeType === 1 && node.hasAttributes()) {
        node.textContent = '';
      }
      this._clear(node);
      node = node.nextSibling;
    }
  }
}

window.customElements.define('fx-insert', FxInsert);
