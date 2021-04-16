import './fx-repeatitem.js';
import * as fx from 'fontoxpath';

import { Fore } from '../fore.js';
import { foreElementMixin } from '../ForeElementMixin.js';

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
 */
export class FxRepeat extends foreElementMixin(HTMLElement) {
  static get properties() {
    return {
      ...super.properties,
      index: {
        type: Number,
      },
      ref: {
        type: String,
      },
      template: {
        type: Object,
      },
      focusOnCreate: {
        type: String,
      },
      initDone: {
        type: Boolean,
      },
      repeatIndex: {
        type: Number,
      },
      nodeset: {
        type: Array,
      },
    };
  }

  constructor() {
    super();
    this.ref = '';
    this.dataTemplate = [];
    this.focusOnCreate = '';
    this.initDone = false;
    this.repeatIndex = 1;
    this.nodeset = [];
    this.inited = false;
    this.index = 1;
    this.repeatSize = 0;
    this.attachShadow({ mode: 'open' });
  }

  get repeatSize() {
    return this.querySelectorAll(':scope > fx-repeatitem').length;
  }

  set repeatSize(size) {
    this.size = size;
  }

  setIndex(index) {
    // console.log('new repeat index ', index);
    this.index = index;
    const rItems = this.querySelectorAll(':scope > fx-repeatitem');
    this._setIndex(rItems[this.index - 1]);
  }

  connectedCallback() {
    this.ref = this.getAttribute('ref');
    // console.log('### fx-repeat connected ', this.id);
    this.addEventListener('index-changed', e => {
      const { item } = e.detail;
      const idx = Array.from(this.children).indexOf(item);
      this._setIndex(this.children[idx]);
    });

    const style = `
            :host {
                display: none;
            }
            ::slotted(*){
                display:none;
            }
            .fade-out-bottom {
                -webkit-animation: fade-out-bottom 0.7s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
                animation: fade-out-bottom 0.7s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
            }
            .fade-out-bottom {
                -webkit-animation: fade-out-bottom 0.7s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
                animation: fade-out-bottom 0.7s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
            }
        `;
    const html = `
          <slot></slot>
        `;
    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${html}
        `;
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

  /**
   * repeat has no own modelItems
   * @private
   */
  _evalNodeset() {
    const inscope = this._inScopeContext();
    // console.log('##### inscope ', inscope);
    // console.log('##### ref ', this.ref);
    this.nodeset = fx.evaluateXPathToNodes(this.ref, inscope, null, {});
  }

  async refresh() {
    console.group('fx-repeat.refresh on', this.id);

    if (!this.inited) this.init();

    const inscope = this._inScopeContext();
    this.nodeset = fx.evaluateXPathToNodes(this.ref, inscope, null, {});
    // console.log('repeat refresh nodeset ', this.nodeset);

    const repeatItems = this.querySelectorAll(':scope > fx-repeatitem');
    const repeatItemCount = repeatItems.length;

    let nodeCount = 1;
    if (Array.isArray(this.nodeset)) {
      nodeCount = this.nodeset.length;
    }

    // const contextSize = this.nodeset.length;
    const contextSize = nodeCount;
    const modified = [];
    if (contextSize < repeatItemCount) {
      for (let position = repeatItemCount; position > contextSize; position -= 1) {
        // remove repeatitem
        const itemToRemove = repeatItems[position - 1];
        this._fadeOut(itemToRemove);
        // setTimeout(itemToRemove.parentNode.removeChild(itemToRemove),1000);
        // itemToRemove.parentNode.removeChild(itemToRemove);
        // modified.push(itemToRemove);
      }

      // todo: update index
    }

    if (contextSize > repeatItemCount) {
      for (let position = repeatItemCount + 1; position <= contextSize; position += 1) {
        // add new repeatitem

        // const lastRepeatItem = repeatItems[repeatItemCount-1];
        // const newItem = lastRepeatItem.cloneNode(true);

        const newItem = document.createElement('fx-repeatitem');
        const clonedTemplate = this._clone();

        newItem.style.display = 'none';
        newItem.appendChild(clonedTemplate);
        this._fadeIn(newItem, 'block');
        // const tmpl = this.shadowRoot.querySelector('template');
        // const newItem = tmpl.content.cloneNode(true);

        newItem.nodeset = this.nodeset[position - 1];
        newItem.index = position;
        this.appendChild(newItem);
        modified.push(newItem);
      }
    }
    if (modified.length > 0) {
      modified.forEach(mod => {
        mod.refresh();
      });
    }
    if (!this.inited) {
      Fore.refreshChildren(this);
    }
    if (contextSize === repeatItemCount) {
      Fore.refreshChildren(this);
    }
    console.groupEnd();
  }

  // eslint-disable-next-line class-methods-use-this
  _fadeIn(el, display) {
    // eslint-disable-next-line no-param-reassign
    el.style.opacity = 0;
    // eslint-disable-next-line no-param-reassign
    el.style.display = display || 'block';

    (function fade() {
      let val = parseFloat(el.style.opacity);
      val += 0.1;
      if (!(val > 1)) {
        // eslint-disable-next-line no-param-reassign
        el.style.opacity = val;
        requestAnimationFrame(fade);
      }
    })();
  }

  // eslint-disable-next-line class-methods-use-this
  _fadeOut(el) {
    el.classList.add('fade-out-bottom');
    /*
        el.style.opacity = 1;

        (function fade() {
            if ((el.style.opacity -= .01) < 0) {
                el.style.display = "none";
            } else {
                requestAnimationFrame(fade);
            }
        })();
*/
  }

  _initTemplate() {
    const shadowTemplate = this.shadowRoot.querySelector('template');
    console.log('shadowtempl ', shadowTemplate);

    // const defaultSlot = this.shadowRoot.querySelector('slot');
    // todo: this is still weak - should handle that better maybe by an explicit slot?
    this.template = this.firstElementChild;
    console.log('### init template for repeat ', this.id, this.template);

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
    this.textContent = '';
    this.nodeset.forEach((item, index) => {
      const repeatItem = document.createElement('fx-repeatitem');
      repeatItem.nodeset = this.nodeset[index];
      repeatItem.index = index + 1; // 1-based index

      const clone = this._clone();
      repeatItem.appendChild(clone);
      this.appendChild(repeatItem);

      if (repeatItem.index === 1) {
        this._setIndex(repeatItem);
      }
    });
  }

  _clone() {
    // const content = this.template.content.cloneNode(true);
    this.template = this.shadowRoot.querySelector('template');
    const content = this.template.content.cloneNode(true);
    return document.importNode(content, true);
  }

  _setIndex(repeatItem) {
    this._removeIndexMarker();
    if (repeatItem) {
      repeatItem.setAttribute('repeat-index', '');
    }
  }

  _removeIndexMarker() {
    Array.from(this.children).forEach(item => {
      item.removeAttribute('repeat-index');
    });
  }
}

window.customElements.define('fx-repeat', FxRepeat);
