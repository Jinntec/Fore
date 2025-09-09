import { AbstractAction } from './abstract-action.js';
import getInScopeContext from '../getInScopeContext.js';
import {
  evaluateXPathToNodes,
  evaluateXPathToFirstNode,
  evaluateXPathToNumber,
} from '../xpath-evaluation.js';
import { XPathUtil } from '../xpath-util';
import { Fore } from '../fore.js';
import { getPath } from '../xpath-path.js';

/**
 * `fx-insert`
 * inserts nodes into data instances
 *
 * @customElement
 */
export class FxInsert extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      at: {
        type: Number,
      },
      position: {
        type: Number,
      },
      origin: {
        type: Object,
      },
      keepValues: {
        type: Boolean,
      },
    };
  }

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

        /*
        if in 'create-nodes' mode and origin targets a repeat, the repeat
        we use the already during initData() created nodeset as a template for insertion
         */
        if (this.origin.startsWith('#') && this.getOwnerForm().createNodes) {
          const repeat = this.getOwnerForm().querySelector(this.origin);
          originSequenceClone = repeat.createdNodeset.cloneNode(true);
          if (!originSequenceClone) {
            console.error(`createdNodeset for repeat ${this.origin} does not exist`);
          }
        } else {
          // originTarget = evaluateXPathToFirstNode(this.origin, inscope, this);
          originTarget = evaluateXPathToFirstNode(this.origin, inscope, this);
          if (Array.isArray(originTarget) && originTarget.length === 0) {
            console.warn('invalid origin for this insert action - ignoring...', this);
            originSequenceClone = null;
          }
          originSequenceClone = originTarget.cloneNode(true);
        }
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
      return evaluateXPathToNumber(this.getAttribute('at'), inscope, this);
    }
    return targetSequence.length;
  }

  async perform() {
    // We have a few terms here: `inScope` is the 'current item' we have. It is the item we're
    // copying and inserting elsewhere.  If we have a `ref`, one of the nodes returned will
    // become the sibling of this copy.  The `context` is the new parent of the copied
    // element. It's usually better to add a `context` because that deals with empty elements.
    let inscope;
    let context;
    let targetSequence = [];
    const inscopeContext = getInScopeContext(this);

    const fore = this.getOwnerForm();

    // ### 'context' attribute takes precedence over 'ref'
    if (this.hasAttribute('context')) {
      [context] = evaluateXPathToNodes(this.getAttribute('context'), inscopeContext, this);
      inscope = inscopeContext;
    }

    if (this.hasAttribute('ref')) {
      if (inscope) {
        targetSequence = evaluateXPathToNodes(this.ref, inscope, this);
      } else {
        inscope = getInScopeContext(this.getAttributeNode('ref'), this.ref);
        targetSequence = evaluateXPathToNodes(this.ref, inscope, this);
      }
    }
    // const originSequenceClone = this._cloneOriginSequence(inscope, targetSequence);

    const originSequenceClone = this._cloneOriginSequence(inscope, targetSequence);
    if (!originSequenceClone) return; // if no origin back out without effect

    let insertLocationNode;
    let index;

    // if the targetSequence is empty but we got an originSequence use inscope as context and ignore 'at' and 'position'
    if (targetSequence.length === 0) {
      if (context) {
        insertLocationNode = context;
        context.appendChild(originSequenceClone);
        fore.signalChangeToElement(insertLocationNode.localName);
        fore.signalChangeToElement(originSequenceClone.localName);
        index = 1;
      } else {
        // No context but creating nodes from UI
        if (!inscope && this.getOwnerForm().createNodes) {
          const repeat = this.getOwnerForm().querySelector(this.origin);
          inscope = getInScopeContext(repeat, repeat.ref);
          insertLocationNode = inscope;
          inscope.appendChild(originSequenceClone);
          index = inscope.length - 1;
        } else {
          insertLocationNode = inscope;
          inscope.appendChild(originSequenceClone);
          index = 1;
        }
      }
    } else {
      /* ### insert at position given by 'at' or use the last item in the targetSequence ### */
      if (this.hasAttribute('at')) {
        // todo: eval 'at'
        // index = this.at;
        // insertLocationNode = targetSequence[this.at - 1];

        index = evaluateXPathToNumber(this.getAttribute('at'), inscope, this);
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
        fore.signalChangeToElement(insertLocationNode.parentNode);
        fore.signalChangeToElement(originSequenceClone.localName);
      }

      if (this.position && this.position === 'after') {
        // insertLocationNode.parentNode.append(originSequence);
        // const nextSibl = insertLocationNode.nextSibling;
        index += 1;
        if (this.hasAttribute('context') && this.hasAttribute('ref')) {
          // index=1;
          inscope.append(originSequenceClone);
          fore.signalChangeToElement(insertLocationNode);
          fore.signalChangeToElement(originSequenceClone.localName);
        } else if (this.hasAttribute('context')) {
          index = 1;
          insertLocationNode.prepend(originSequenceClone);
          fore.signalChangeToElement(insertLocationNode);
          fore.signalChangeToElement(originSequenceClone.localName);
        } else {
          insertLocationNode.insertAdjacentElement('afterend', originSequenceClone);
          fore.signalChangeToElement(insertLocationNode);
          fore.signalChangeToElement(originSequenceClone.localName);
        }
      }
    }
    // instance('default')/items/item[index()]

    // console.log('insert context item ', insertLocationNode);
    // console.log('parent ', insertLocationNode.parentNode);
    // console.log('instance ', this.getModel().getDefaultContext());
    // Fore.dispatch()

    // const instanceId = XPathUtil.resolveInstance(this, this.getAttribute('context'));
    const instanceId = XPathUtil.resolveInstance(this, this.ref);
    const inst = this.getModel().getInstance(instanceId);
    // console.log('<<<<<<< resolved instance', inst);
    // Note: the parent to insert under is always the parent of the inserted node. The 'context' is not always the parent if the sequence is empty, or the position is different
    // const xpath = XPathUtil.getPath(originSequenceClone.parentNode, instanceId);
    const xpath = getPath(insertLocationNode.parentNode, instanceId);

    const path = Fore.getDomNodeIndexString(originSequenceClone);
    this.dispatchEvent(
      new CustomEvent('execute-action', {
        composed: true,
        bubbles: true,
        cancelable: true,
        detail: { action: this, event: this.event, path },
      }),
    );

    Fore.dispatch(inst, 'insert', {
      insertedNodes: originSequenceClone,
      insertedParent: insertLocationNode.parentNode,
      ref: this.ref,
      location: insertLocationNode,
      position: this.position,
      instanceId,
      foreId: fore.id,
      index,
    });

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
    console.log('Changed!', xpath);
    return [xpath];
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

  actionPerformed(changedPaths) {
    // ### make sure the necessary modelItems will get created
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

if (!customElements.get('fx-insert')) {
  window.customElements.define('fx-insert', FxInsert);
}
