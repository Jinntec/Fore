import XfAbstractControl from './abstract-control.js';
import {
  evaluateXPath,
  evaluateXPathToString,
  evaluateXPathToFirstNode,
  evaluateXPathToBoolean,
} from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';
import { Fore } from '../fore.js';
import { ModelItem } from '../modelitem.js';
import { debounce } from '../events.js';
import { FxModel } from '../fx-model.js';
import { DependencyNotifyingDomFacade } from '../DependencyNotifyingDomFacade';
import { extractPredicateDependencies } from '../extract-predicate-deps.js';

const WIDGETCLASS = 'widget';

/**
 * `fx-control`
 * a generic wrapper for controls
 *
 *
 *
 * @customElement
 * @demo demo/index.html
 */

/*
function debounce( func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}
*/
export default class FxControl extends XfAbstractControl {
  constructor() {
    super();
    this.inited = false;
    this.nodeset = null;
    this.attachShadow({ mode: 'open' });
  }

  static get properties() {
    return {
      ...XfAbstractControl.properties,
      credentials: {
        type: String,
      },
      initial: {
        type: Boolean,
      },
      src: {
        type: String,
      },
    };
  }

  _getValueOfWidget() {
    if (this.valueProp === 'selectedOptions') {
      // We have multiple! Just return that as space-separated for now
      return [...this.widget.selectedOptions].map(option => option.value).join(' ');
    }
    return this.widget[this.valueProp];
  }

  connectedCallback() {
    this.initial = this.hasAttribute('initial') ? this.getAttribute('initial') : null;
    this.src = this.hasAttribute('src') ? this.getAttribute('src') : null;
    this.loaded = false;
    this.initialNode = null;
    this.debounceDelay = this.hasAttribute('debounce') ? this.getAttribute('debounce') : null;

    this.updateEvent = this.hasAttribute('update-event')
      ? this.getAttribute('update-event')
      : 'blur';
    this.label = this.hasAttribute('label') ? this.getAttribute('label') : null;
    const style = `
      :host {
        display: flex;
        align-items: center;
        gap: 0.4em;
        position: relative;
      }
      .trash {
        position: absolute;
        right:0;
        top:0;
        cursor: pointer;
        color: #888;
        font-size: 0.65rem;
        align-self: center;
      }
      .trash:hover {
        color: red;
      }
      `;

    this.credentials = this.hasAttribute('credentials')
      ? this.getAttribute('credentials')
      : 'same-origin';
    if (!['same-origin', 'include', 'omit'].includes(this.credentials)) {
      console.error(
        `fx-submission: the value of credentials is not valid. Expected 'same-origin', 'include' or 'omit' but got '${this.credentials}'`,
        this,
      );
    }

    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${this.renderHTML(this.ref)}
        `;

    this.widget = this.getWidget();

    this.addEventListener('mousedown', e => {
      // ### prevent mousedown events on all control content that is not the widget or within the widget
      if (!Fore.isWidget(e.target) && !e.target?.classList.contains('fx-hint')) {
        e.preventDefault();
        // e.stopImmediatePropagation();
      }
      this.widget.focus();
    });

    const defaultValueProp = this.widget.hasAttribute('multiple') ? 'selectedOptions' : 'value';
    this.valueProp = this.hasAttribute('value-prop')
      ? this.getAttribute('value-prop')
      : defaultValueProp;

    // console.log('widget ', this.widget);
    let listenOn = this.widget; // default: usually listening on widget

    if (this.hasAttribute('listen-on')) {
      const q = this.getAttribute('listen-on');
      const target = this.querySelector(q);
      if (target) {
        listenOn = target;
      }
    }

    this.addEventListener('keyup', () => {
      FxModel.dataChanged = true;
    });

    // ### convenience marker event
    if (this.updateEvent === 'enter') {
      this.widget.addEventListener('keyup', event => {
        if (event.keyCode === 13) {
          // console.info('handling Event:', event.type, listenOn);
          // Cancel the default action, if needed
          event.preventDefault();
          this.setValue(this._getValueOfWidget());
        }
      });
      this.updateEvent = 'blur'; // needs to be registered too
    }
    if (this.debounceDelay) {
      listenOn.addEventListener(
        this.updateEvent,
        debounce(
          this,
          () => {
            // console.log('eventlistener ', this.updateEvent);
            // console.info('handling Event:', event.type, listenOn);
            this.setValue(this._getValueOfWidget());
          },
          this.debounceDelay,
        ),
      );
    } else {
      listenOn.addEventListener(this.updateEvent, event => {
        this.setValue(this._getValueOfWidget());
      });
      listenOn.addEventListener(
        'blur',
        event => {
          this.setValue(this._getValueOfWidget());
        },
        { once: true },
      );
    }

    this.addEventListener('return', e => {
      const newNodes = e.detail.nodeset;
      e.stopPropagation();

      this._replaceNode(newNodes);
    });

    this.widget.addEventListener('focus', () => {
      /*
            if (!this.classList.contains('visited')) {
                this.classList.add('visited');
            }
*/
    });

    this.template = this.querySelector('template');
    this.boundInitialized = false;
    this.static = !!this.widget.hasAttribute('static');
    super.connectedCallback();
  }

  /**
   * activates a control that uses 'on-demand' attribute
   */
  activate() {
    console.log('fx-control.activate() called');
    this.removeAttribute('on-demand');
    this.style.display = '';
    this.refresh(true);
    Fore.dispatch(this, 'show-control', {});
    // Focus the widget after the control becomes visible
    requestAnimationFrame(() => {
      this.getWidget()?.focus();
    });
  }

  _debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
      const context = this;
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(context, args);
      }, timeout);
    };
  }

  /**
   * updates the model with a new value by executing it's `<fx-setvalue>` action.
   *
   * In case the `as='node'` is given the bound node is replaced with the widgets' value with is
   * expected to be a node again.
   *
   * @param val the new value to be set
   */
  setValue(val) {
    console.log('Control.setValue', val, 'on', this);
    const modelitem = this.getModelItem();

    if (this.getAttribute('class')) {
      this.classList.add('visited');
    } else {
      this.setAttribute('class', 'visited');
    }

    if (modelitem?.readonly) {
      console.warn('attempt to change readonly node', modelitem);
      return; // do nothing when modelItem is readonly
    }

    if (this.getAttribute('as') === 'node') {
      const replace = this.shadowRoot.getElementById('replace');
      const widgetValue = this.getWidget()[this.valueProp];
      replace.replace(this.nodeset, widgetValue);
      if (modelitem && widgetValue && widgetValue !== modelitem.value) {
        modelitem.value = widgetValue;
        FxModel.dataChanged = true;
        replace.actionPerformed();
      }
      return;
    }
    const setval = this.shadowRoot.getElementById('setvalue');
    setval.setValue(modelitem, val);

    /*
    if (this.modelItem instanceof ModelItem && !this.modelItem?.boundControls.includes(this)) {
      this.modelItem.boundControls.push(this);
    }
*/

    setval.actionPerformed(false);
    // this.visited = true;
  }

  _replaceNode(node) {
    // Note: clone the node while replacing to prevent the instances to leak through
    if (node.nodeType === Node.ATTRIBUTE_NODE) {
      this.modelItem.node.nodeValue = node.nodeValue;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      this.modelItem.node.replaceWith(node.cloneNode(true));
    } else if (node.nodeType === Node.TEXT_NODE) {
      this.modelItem.node.nodeValue = node.textContent;
    } else {
      Fore.dispatch(this, 'warn', {
        message: 'trying to replace a node that is neither an Attribute, Elemment or Text node',
      });
    }
    // this.getOwnerForm().refresh();
    const body = this.closest('body');
    const outerfore = body.querySelector('fx-fore');
    outerfore.refresh(true);
  }

  renderHTML(ref) {
    const showTrash = this.hasAttribute('on-demand');
    const showIcon = this.closest('[show-icon]');
    return `
            ${this.label ? `${this.label}` : ''}
              <slot></slot>
            ${
              this.hasAttribute('as') && this.getAttribute('as') === 'node'
                ? '<fx-replace id="replace" ref=".">'
                : `<fx-setvalue id="setvalue" ref="${ref}"></fx-setvalue>`
            }

        `;
  }

  /**
   * The widget is the actual control being used in the UI e.g. a native input control or any
   * other component that presents a control that can be interacted with.
   *
   * This function returns the widget by querying the children of this control for an element
   * with `class="widget"`. If that cannot be found it searches for an native `input` of any type.
   * If either cannot be found a `<input type="text">` is created.
   *
   * @returns {HTMLElement|*}
   */
  getWidget() {
    if (this.widget) return this.widget;
    let widget = this.querySelector(`.${WIDGETCLASS}`);
    if (!widget) {
      widget = this.querySelector('input');
      if (widget && !widget.classList.contains('widget')) {
        widget.classList.add('widget');
      }
    }
    if (!widget) {
      const input = document.createElement('input');
      input.classList.add(WIDGETCLASS);
      input.setAttribute('type', 'text');
      this.appendChild(input);
      return input;
    }
    return widget;
  }

  /**
   * updates the widget from the modelItem value. During refresh the a control
   * evaluates it's binding expression to determine the bound node. The bound node corresponds
   * to a modelItem which acts a the state object of a node. The modelItem determines the value
   * and the state of the node and set the `value` property of this class.
   *
   * @returns {Promise<void>}
   */
  async updateWidgetValue() {
    // this._getValueFromHtmlDom() = this.value;
    if (this.value) {
      // Fire and forget this: the value is set right away anyway
      this.setAttribute('has-value', '');
      Fore.dispatch(this, 'show-control');
    } else {
      this.removeAttribute('has-value');
    }

    let { widget } = this;
    if (!widget) {
      widget = this;
    }
    // ### value is bound to checkbox
    if (this.valueProp === 'checked') {
      if (this.value === 'true') {
        widget.checked = true;
      } else {
        widget.checked = false;
      }
      return;
    }

    // ### value is bound to radio
    if (this.widget.type === 'radio') {
      const matches = this.querySelector(`input[value=${this.value}]`);
      if (matches) {
        matches.checked = true;
      }
      return;
    }

    if (this.valueProp === 'selectedOptions') {
      const valueSet = new Set(this.value.split(' '));
      for (const option of [...this.widget.querySelectorAll('option')]) {
        if (valueSet.has(option.value)) {
          option.selected = true;
        } else {
          option.selected = false;
        }
      }
      return;
    }

    if (this.hasAttribute('as')) {
      const as = this.getAttribute('as');

      // ### when there's an `as=text` attribute serialize nodeset to prettified string
      if (as === 'text') {
        const serializer = new XMLSerializer();
        const pretty = Fore.prettifyXml(serializer.serializeToString(this.nodeset));
        widget.value = pretty;
      }
      if (as === 'node' && this.nodeset !== widget.value) {
        // const oldVal = this.nodeset.innerHTML;
        const oldVal = this.nodeset;
        if (widget.value) {
          if (oldVal !== this.widget.value) {
            // console.log('changed');
            widget.value = this.nodeset.cloneNode(true);
            return;
          }
        }

        widget.value = this.nodeset.cloneNode(true);
        // todo: should be more like below but that can cause infinite loop when controll trigger update event due to calling a setter for property
        // widget[this.valueProp] = this.nodeset.cloneNode(true);
        // console.log('passed value to widget', widget.value);
      }

      return;
    }

    // ### when there's a src Fore is used as widget and will be loaded from external file
    if (this.src && !this.loaded && this.modelItem.relevant) {
      // ### evaluate initial data if necessary

      if (this.initial) {
        this.initialNode = evaluateXPathToFirstNode(this.initial, this.nodeset, this);
        // console.log('initialNodes', this.initialNode);
      }

      // ### load the markup from src
      await this._loadForeFromSrc();
      this.loaded = true;

      // ### replace default instance of embedded Fore with initial nodes
      // const innerInstance = this.querySelector('fx-instance');
      // console.log('innerInstance',innerInstance);
      return;
    }

    if (widget.value !== this.value) {
      widget.value = this.value;
    }
  }

  /**
   * loads an external Fore from an HTML file given by `src` attribute and embed it as child of this control.
   *
   * Will look for the `<fx-fore>` element within the returned HTML file and return that element.
   *
   * If that cannot be found an error is dispatched.
   *
   * todo: dispatch link error
   * @private
   */
  async _loadForeFromSrc() {
    console.info(
      `%cControl ref="${this.ref}" is loading ${this.src}`,
      'background:#64b5f6; color:white; padding:0.5rem; display:inline-block; white-space: nowrap; border-radius:0.3rem;width:100%;',
    );
    try {
      const response = await fetch(this.src, {
        method: 'GET',
        credentials: this.credentials,
        mode: 'cors',
        headers: {
          'Content-Type': 'text/html',
        },
      });

      const responseContentType = response.headers.get('content-type').toLowerCase();
      // console.log('********** responseContentType *********', responseContentType);
      let data;
      if (responseContentType.startsWith('text/html')) {
        data = await response.text().then(result =>
          // console.log('xml ********', result);
          new DOMParser().parseFromString(result, 'text/html'),
        );
      } else {
        data = 'done';
      }
      // const theFore = fxEvaluateXPathToFirstNode('//fx-fore', data.firstElementChild);
      const theFore = data.querySelector('fx-fore');
      const imported = document.importNode(theFore, true);

      imported.classList.add('widget'); // is the new widget
      imported.addEventListener(
        'model-construct-done',
        e => {
          const defaultInst = imported.querySelector('fx-instance');
          if (this.initial) {
            const doc = new DOMParser().parseFromString('<data></data>', 'application/xml');
            // Note: Clone the input to prevent the inner fore from editing the outer node
            // Also update the `initialNode` to make sure we have an up-to-date version
            this.initialNode = evaluateXPathToFirstNode(this.initial, this.nodeset, this);

            doc.firstElementChild.appendChild(this.initialNode.cloneNode(true));
            defaultInst.instanceData = doc;
          }
          imported.model = imported.querySelector('fx-model');
          imported.model.updateModel();

          // Ensure initialRun is true for the first refresh
          imported.initialRun = true;
          imported.refresh(true);
        },
        { once: true },
      );

      const dummy = this.querySelector('input');
      /*
            todo: the mechanism to import constructed stylesheets as in fore-component is still missing here.
            There no way yet to specify CSS for a embedded fx-fore in shadowDOM.
             */
      if (this.hasAttribute('shadow')) {
        dummy.parentNode.removeChild(dummy);
        this.shadowRoot.appendChild(imported);
      } else if (!this.loaded) {
        dummy.replaceWith(imported);
      }

      if (!theFore) {
        Fore.dispatch('error', {
          detail: {
            message: `Fore element not found in '${this.src}'. Maybe wrapped within 'template' element?`,
          },
        });
      }
      Fore.dispatch('loaded', { detail: { fore: theFore } });
    } catch (error) {
      // console.log('error', error);
      Fore.dispatch(this, 'error', {
        origin: this,
        message: `control couldn't be loaded from src '${this.src}'`,
        level: 'Error',
      });
    }
  }

  getTemplate() {
    return this.querySelector('template');
  }

  async refresh(force = false) {
    console.log('🔄 fx-control refresh', this);
    super.refresh(force);
    // console.log('refresh template', this.template);
    // const {widget} = this;

    // ### if we find a ref on control we have a 'select' control of some kind
    const widget = this.getWidget();
    this._handleBoundWidget(widget, force);
    this._handleDataAttributeBinding();
    Fore.refreshChildren(this, force);
  }

  /**
   * handle non-Fore elements like 'select' and 'datalist' which have a 'data-ref' attribute
   * @private
   */
  _handleDataAttributeBinding() {
    const dataRefd = this.querySelector('[data-ref]');
    // Handle nested fx-controls
    if (dataRefd && dataRefd.closest('fx-control') === this) {
      this.boundList = dataRefd;
      const ref = dataRefd.getAttribute('data-ref');
      this._handleBoundWidget(dataRefd, true); //todo: revisit !!! observer
    }
  }

  /**
   * If the widget itself has a `ref` it binds to another nodeset to provide some
   * dynamic items to be created from a template usually. Examples are dynamic select option lists
   * or a set of checkboxes.
   *
   * @param widget the widget to handle
   * @private
   */
  _handleBoundWidget(widget, force = false) {
    // console.log('_handleBoundWidget', widget);
    if (this.boundInitialized && this.static) return;

    const ref = widget.hasAttribute('ref')
      ? widget.getAttribute('ref')
      : widget.getAttribute('data-ref');
    // if (widget && widget.hasAttribute('ref')) {
    if (widget && ref) {
      // ### eval nodeset for list control
      const inscope = getInScopeContext(this, ref);
      // const nodeset = evaluateXPathToNodes(ref, inscope, this);

      const touchedNodes = new Set();
      const domFacade = new DependencyNotifyingDomFacade(node => touchedNodes.add(node));

      const nodeset = evaluateXPath(ref, inscope, this, domFacade);

      const contextNode = Array.isArray(inscope) ? inscope[0] : inscope;
      console.log('Extracting model', this.getModel());
      console.log('Extracting model inited', this.getModel().inited);
      const model = this.getModel();
      if (!contextNode) return;
      console.log('Extracting predicate deps from ref:', ref);
      extractPredicateDependencies(
        ref,
        model,
        mi => mi.addObserver(this),
        node => model.getModelItem(node),
      );

      // ### bail out when nodeset is array and empty
      if (Array.isArray(nodeset) && nodeset.length === 0) return;

      // ### build the items
      const { template } = this;
      if (template) {
        // ### clear items
        // if (force === true || !this.boundInitialized) {
        if (force === true) {
          const { children } = widget;
          Array.from(children).forEach(child => {
            if (child.nodeName.toLowerCase() !== 'template') {
              child.parentNode.removeChild(child);
            }
          });
        } else {
          return;
        }

        // ### handle 'selection'  open and insert an empty option in that case
        if (
          this.widget.nodeName === 'SELECT' &&
          this.widget.hasAttribute('selection') &&
          this.widget.getAttribute('selection') === 'open'
        ) {
          const firstTemplateChild = this.template.firstElementChild;
          // todo: create the element which is used in the template  instead of 'option'
          const option = document.createElement('option');
          this.widget.insertBefore(option, firstTemplateChild);
        }

        if (nodeset.length !== 0) {
          // console.log('nodeset', nodeset);
          const fragment = document.createDocumentFragment();
          // console.time('offscreen');
          Array.from(nodeset).forEach(node => {
            // console.log('#### node', node);
            // ### initialize new entry
            const newEntry = this.createEntry();
            fragment.appendChild(newEntry);
            // ### set value
            this.updateEntry(newEntry, node);
          });
          this.template.parentNode.appendChild(fragment);
          // console.timeEnd('offscreen');
        } else {
          const newEntry = this.createEntry();
          this.template.parentNode.appendChild(newEntry);
          this.updateEntry(newEntry, nodeset);
        }
        this.boundInitialized = true;
      }

      if (this.valueProp === 'selectedOptions') {
        const valueSet = new Set(this.value.split(' '));
        const options = this.getWidget().querySelectorAll('option');
        for (const option of [...options]) {
          if (valueSet.has(option.value)) {
            option.selected = true;
          } else {
            option.selected = false;
          }
        }
      }
    }
  }

  updateEntry(newEntry, node) {
    // ### >>> todo: needs rework this code is heavily assuming a select control with 'value' attribute - not generic at all yet.

    const valueAttribute = newEntry.getAttribute('value');
    if (!valueAttribute) {
      // Fore.dispatch(this,'warn',{message:'no value attribute specified for template entry.'});
      return;
    }

    const valueExpr = valueAttribute;
    const cutted = valueExpr.substring(1, valueExpr.length - 1);
    const evaluated = evaluateXPathToString(cutted, node, this);
    newEntry.setAttribute('value', evaluated);

    if (this.value === evaluated) {
      newEntry.setAttribute('selected', 'selected');
    }

    if (newEntry.hasAttribute('title')) {
      let titleExpr = newEntry.getAttribute('title');
      titleExpr = titleExpr.substring(1, titleExpr.length - 1);
      const evaluated = evaluateXPathToString(titleExpr, node, newEntry);
      newEntry.setAttribute('title', evaluated);
    }
    // ### set label
    const optionLabel = newEntry.textContent.trim();
    this.evalLabel(optionLabel, node, newEntry);
    //  ### <<< needs rework
  }

  evalLabel(optionLabel, node, newEntry) {
    const labelExpr = optionLabel.substring(1, optionLabel.length - 1);
    if (!labelExpr) return;

    const label = evaluateXPathToString(labelExpr, node, this);
    newEntry.textContent = label;
  }

  createEntry() {
    return this.template.content.firstElementChild.cloneNode(true);
    // const content = this.template.content.firstElementChild.cloneNode(true);
    // return content;
    // const newEntry = document.importNode(content, true);
    // this.template.parentNode.appendChild(newEntry);
    // return newEntry;
  }

  // eslint-disable-next-line class-methods-use-this
  _getValueAttribute(element) {
    let result;
    Array.from(element.attributes).forEach(attribute => {
      const attrVal = attribute.value;
      if (attrVal.indexOf('{') !== -1) {
        // console.log('avt found ', attribute);
        result = attribute;
      }
    });
    return result;
  }
}
if (!customElements.get('fx-control')) {
  window.customElements.define('fx-control', FxControl);
}
