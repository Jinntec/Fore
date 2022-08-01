import {FxRepeat} from "./fx-repeat";

/*
import { Fore } from '../fore.js';
import { evaluateXPath } from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';
import { XPathUtil } from '../xpath-util.js';
*/

/**
 * `fx-repeat`
 *
 * Repeats its template for each node in its' bound nodeset.
 *
 * Template is a standard HTML `<template>` element. Once instanciated the template
 * is moved to the shadowDOM of the repeat for safe re-use.
 *
 *
 *
 * @customElement
 * @demo demo/todo.html
 *
 * todo: it should be seriously be considered to extend FxContainer instead but needs refactoring first.
 */
export class FxRepeatAttributes extends FxRepeat {
  static get properties() {
    return {
      ...super.properties,
    };
  }

  constructor() {
    super();
  }

  get repeatSize() {
    // return this.querySelectorAll(':scope > fx-repeatitem').length;
    return this.querySelectorAll(':scope > *').length;
  }

  set repeatSize(size) {
    super.repeatSize = size;
  }


  setIndex(index) {
    // console.log('new repeat index ', index);
    this.index = index;
    const rItems = this.querySelectorAll(':scope > *');
    this.applyIndex(rItems[this.index - 1]);
  }

/*
  applyIndex(repeatItem) {
    this._removeIndexMarker();
    if (repeatItem) {
      repeatItem.setAttribute('repeat-index', '');
    }
  }
*/

/*
  get index() {
    return this.getAttribute('index');
  }

  set index(idx) {
    this.setAttribute('index', idx);
  }
*/

  connectedCallback() {
    super.connectedCallback();
  }

  init() {
    // ### there must be a single 'template' child
    // console.log('##### repeat init ', this.id);
    // if(!this.inited) this.init();
    // does not use this.evalInContext as it is expecting a nodeset instead of single node
    this._evalNodeset();
    // console.log('##### ',this.id, this.nodeset);

    this._initTemplate();
    this._initRepeatItems();

    this.setAttribute('index', this.index);
    this.inited = true;
  }

  _getRef(){
    return this.getAttribute('data-ref');
  }

  /**
   * repeat has no own modelItems
   * @private
   */
  _evalNodeset() {
    // const inscope = this.getInScopeContext();
    const inscope = getInScopeContext(this.getAttributeNode('ref') || this, this.ref);
    // console.log('##### inscope ', inscope);
    // console.log('##### ref ', this.ref);
    // now we got a nodeset and attach MutationObserver to it

    if (this.mutationObserver && inscope.nodeName) {
      this.mutationObserver.observe(inscope, {
        childList: true,
        subtree: true,
      });
    }

    const rawNodeset = evaluateXPath(this.ref, inscope, this);
    if (rawNodeset.length === 1 && Array.isArray(rawNodeset[0])) {
      // This XPath likely returned an XPath array. Just collapse to that array
      this.nodeset = rawNodeset[0];
      return;
    }
    this.nodeset = rawNodeset;
  }

  async refresh(force) {
    // console.group('fx-repeat.refresh on', this.id);

    if (!this.inited) this.init();
    console.time('repeat-refresh', this);
    this._evalNodeset();
    // console.log('repeat refresh nodeset ', this.nodeset);
    // console.log('repeatCount', this.repeatCount);

    const repeatItems = this.querySelectorAll(':scope > fx-repeatitem');
    const repeatItemCount = repeatItems.length;

    let nodeCount = 1;
    if (Array.isArray(this.nodeset)) {
      nodeCount = this.nodeset.length;
    }

    // const contextSize = this.nodeset.length;
    const contextSize = nodeCount;
    // todo: review - cant the context really never be smaller than the repeat count?
    // todo: this code can be deprecated probably but check first
    if (contextSize < repeatItemCount) {
      for (let position = repeatItemCount; position > contextSize; position -= 1) {
        // remove repeatitem
        const itemToRemove = repeatItems[position - 1];
        itemToRemove.parentNode.removeChild(itemToRemove);
        this.getOwnerForm().unRegisterLazyElement(itemToRemove);
        // this._fadeOut(itemToRemove);
        // Fore.fadeOutElement(itemToRemove)
      }
    }

    if (contextSize > repeatItemCount) {
      for (let position = repeatItemCount + 1; position <= contextSize; position += 1) {
        // add new repeatitem

        const newItem = document.createElement('fx-repeatitem');
        const clonedTemplate = this._clone();
        newItem.appendChild(clonedTemplate);
        this.appendChild(newItem);

        this._initVariables(newItem);

        newItem.nodeset = this.nodeset[position - 1];
        newItem.index = position;
        this.getOwnerForm().someInstanceDataStructureChanged = true;
      }
    }

    // ### update nodeset of repeatitems
    for (let position = 0; position < repeatItemCount; position += 1) {
      const item = repeatItems[position];
      this.getOwnerForm().registerLazyElement(item);

      if (item.nodeset !== this.nodeset[position]) {
        item.nodeset = this.nodeset[position];
      }
    }

    // Fore.refreshChildren(clone,true);
    const fore = this.getOwnerForm();
    if (!fore.lazyRefresh || force) {
      Fore.refreshChildren(this, force);
    }
    // this.style.display = 'block';
    // this.style.display = this.display;
    this.setIndex(this.index);
    console.timeEnd('repeat-refresh');

    // this.replaceWith(clone);

    // this.repeatCount = contextSize;
    // console.log('repeatCount', this.repeatCount);
    console.groupEnd();
  }

  // eslint-disable-next-line class-methods-use-this
  _fadeOut(el) {
    el.style.opacity = 1;

    (function fade() {
      // eslint-disable-next-line no-cond-assign
      if ((el.style.opacity -= 0.1) < 0) {
        el.style.display = 'none';
      } else {
        requestAnimationFrame(fade);
      }
    })();
  }

  // eslint-disable-next-line class-methods-use-this
  _fadeIn(el) {
    if (!el) return;

    el.style.opacity = 0;
    el.style.display = this.display;

    (function fade() {
      // setTimeout(() => {
      let val = parseFloat(el.style.opacity);
      // eslint-disable-next-line no-cond-assign
      if (!((val += 0.1) > 1)) {
        el.style.opacity = val;
        requestAnimationFrame(fade);
      }
      // }, 40);
    })();
  }

  _initTemplate() {
    // const shadowTemplate = this.shadowRoot.querySelector('template');
    // console.log('shadowtempl ', shadowTemplate);

    // const defaultSlot = this.shadowRoot.querySelector('slot');
    // todo: this is still weak - should handle that better maybe by an explicit slot?
    // this.template = this.firstElementChild;
    this.template = this.querySelector('template');
    // console.log('### init template for repeat ', this.id, this.template);

    if (this.template === null) {
      // console.error('### no template found for this repeat:', this.id);
      // todo: catch this on form element
      this.dispatchEvent(
        new CustomEvent('no-template-error', {
          composed: true,
          bubbles: true,
          detail: { message: `no template found for repeat:${this.id}` },
        }),
      );
    }

    this.shadowRoot.appendChild(this.template);
  }

  _initRepeatItems() {
    // const model = this.getModel();
    // this.textContent = '';
    this.nodeset.forEach((item, index) => {
      const repeatItem = document.createElement('fx-repeatitem');
      repeatItem.nodeset = this.nodeset[index];
      repeatItem.index = index + 1; // 1-based index

      const clone = this._clone();
      repeatItem.appendChild(clone);
      this.appendChild(repeatItem);

      if (repeatItem.index === 1) {
        this.applyIndex(repeatItem);
      }

      this._initVariables(repeatItem);
    });
  }

  _initVariables(newRepeatItem) {
    const inScopeVariables = new Map(this.inScopeVariables);
    newRepeatItem.setInScopeVariables(inScopeVariables);
    (function registerVariables(node) {
      for (const child of node.children) {
        if ('setInScopeVariables' in child) {
          child.setInScopeVariables(inScopeVariables);
        }
        registerVariables(child);
      }
    })(newRepeatItem);
  }

  _clone() {
    // const content = this.template.content.cloneNode(true);
    this.template = this.shadowRoot.querySelector('template');
    const content = this.template.content.cloneNode(true);
    return document.importNode(content, true);
  }

  _removeIndexMarker() {
    Array.from(this.children).forEach(item => {
      item.removeAttribute('repeat-index');
    });
  }

  setInScopeVariables(inScopeVariables) {
    // Repeats are interesting: the variables should be scoped per repeat item, they should not be
    // able to see the variables in adjacent repeat items!
    this.inScopeVariables = new Map(inScopeVariables);
  }
}

if (!customElements.get('fx-repeat-attributes')) {
  window.customElements.define('fx-repeat-attributes', FxRepeatAttributes);
}
