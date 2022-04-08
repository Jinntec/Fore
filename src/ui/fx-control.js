import XfAbstractControl from './abstract-control.js';
import { evaluateXPath, evaluateXPathToString, evaluateXPathToNodes } from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';
import { Fore } from '../fore.js';

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
export default class FxControl extends XfAbstractControl {
  constructor() {
    super();
    this.inited = false;
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.url = this.hasAttribute('url') ? this.getAttribute('url'):null;
    this.loaded=false;

    this.updateEvent = this.hasAttribute('update-event')
      ? this.getAttribute('update-event')
      : 'blur';
    this.valueProp = this.hasAttribute('value-prop') ? this.getAttribute('value-prop') : 'value';
    this.label = this.hasAttribute('label') ? this.getAttribute('label') : null;
    const style = `
            :host{
                display:inline-block;
            }
        `;

    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${this.renderHTML(this.ref)}
        `;

    this.widget = this.getWidget();
    // console.log('widget ', this.widget);

    // ### convenience marker event
    if (this.updateEvent === 'enter') {
      this.widget.addEventListener('keyup', event => {
        if (event.keyCode === 13) {
          // Cancel the default action, if needed
          event.preventDefault();
          this.setValue(this.widget[this.valueProp]);
        }
      });
      this.updateEvent = 'blur'; // needs to be registered too
    }
    this.widget.addEventListener(this.updateEvent, () => {
      // console.log('eventlistener ', this.updateEvent);
      this.setValue(this.widget[this.valueProp]);
    });

    const slot = this.shadowRoot.querySelector('slot');
    this.template = this.querySelector('template');
    // console.log('template',this.template);
  }

  setValue(val) {
    const modelitem = this.getModelItem();
    const setval = this.shadowRoot.getElementById('setvalue');
    setval.setValue(modelitem, val);
    setval.actionPerformed();
  }

  renderHTML(ref) {
    return `
            ${this.label ? `${this.label}` : ''}
            <slot></slot>
            <fx-setvalue id="setvalue" ref="${ref}"></fx-setvalue>
        `;
  }

  /**
   *
   * @returns {HTMLElement|*}
   */
  getWidget() {
    if (this.widget) return this.widget;
    let widget = this.querySelector(`.${WIDGETCLASS}`);
    if (!widget) {
      widget = this.querySelector('input');
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

  // todo: check again
  async updateWidgetValue() {
    // this.widget[this.valueProp] = this.value;

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

    // ### when there's an `as=text` attribute serialize nodeset to prettified string
    if(this.hasAttribute('as')){
      const as = this.getAttribute('as');
      if(as === 'text'){
        const serializer = new XMLSerializer();
        const pretty = Fore.prettifyXml(serializer.serializeToString(this.nodeset))
        widget.value = pretty;
      }
      return;
    }

    if(this.url && !this.loaded){
      this._loadForeFromUrl();
      this.loaded=true;
      return;
    }
    widget.value = this.value;
  }

  _loadForeFromUrl() {
    console.log('########## loading Fore from ',this.src ,'##########');
    fetch(this.url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'text/html',
      },
    })
        .then(response => {
          const responseContentType = response.headers.get('content-type').toLowerCase();
          console.log('********** responseContentType *********', responseContentType);
          if (responseContentType.startsWith('text/html')) {
            return response.text().then(result =>
                // console.log('xml ********', result);
                new DOMParser().parseFromString(result, 'text/html'),
            );
          }
          return 'done';
        })
        .then(data => {
          // const theFore = fxEvaluateXPathToFirstNode('//fx-fore', data.firstElementChild);
          const theFore = data.querySelector('fx-fore');
          // console.log('thefore', theFore)
          if(!theFore){
            this.dispatchEvent(new CustomEvent('error',{detail:{message: `Fore element not found in '${this.src}'. Maybe wrapped within 'template' element?`}}));
          }
          theFore.classList.add('widget'); // is the new widget
          const dummy = this.querySelector('input');
          dummy.replaceWith(theFore);
          // this.shadowRoot.appendChild(theFore);
          this.dispatchEvent(new CustomEvent('loaded',{}));
        })
        .catch(error => {
          console.log('error',error);
          this.getOwnerForm().dispatchEvent(new CustomEvent('error',{detail:{message:`${this.url} not found`}}));
        });
  }
  getTemplate() {
    return this.querySelector('template');
  }

  async refresh(force) {
    // console.log('fx-control refresh', this);
    super.refresh();
    // console.log('refresh template', this.template);
    // const {widget} = this;

    // ### if we find a ref on control we have a 'select' control of some kind
    const widget = this.getWidget();
    this._handleBoundWidget(widget);
    Fore.refreshChildren(this, force);
  }

  /**
   * If the widget itself has a `ref` it binds to another nodeset to provide some
   * dynamic items to be created from a template usually. Examples are dynamic select option lists
   * or a set of checkboxes.
   *
   * @param widget the widget to handle
   * @private
   */
  _handleBoundWidget(widget) {
    if (widget && widget.hasAttribute('ref')) {
      // ### eval nodeset for list control
      const ref = widget.getAttribute('ref');
      /*
      actually a ref on a select or similar component should point to a different instance
      with an absolute expr e.g. 'instance('theId')/...'

      todo: even bail out if ref is not absolute?
       */

      const inscope = getInScopeContext(this, ref);
      // const nodeset = evaluateXPathToNodes(ref, inscope, this);
      const nodeset = evaluateXPath(ref, inscope, this);

      // ### clear items
      const { children } = widget;
      Array.from(children).forEach(child => {
        if (child.nodeName.toLowerCase() !== 'template') {
          child.parentNode.removeChild(child);
        }
      });

      // ### build the items
      if (this.template) {
        if (nodeset.length) {
          // console.log('nodeset', nodeset);
          Array.from(nodeset).forEach(node => {
            // console.log('#### node', node);
            const newEntry = this.createEntry();

            // ### initialize new entry
            // ### set value
            this.updateEntry(newEntry, node);
          });
        } else {
          const newEntry = this.createEntry();
          this.updateEntry(newEntry, nodeset);
        }
      }
    }
  }

  updateEntry(newEntry, node) {
    // ### >>> todo: needs rework this code is heavily assuming a select control with 'value' attribute - not generic at all yet.

    if (this.widget.nodeName !== 'SELECT') return;
    const valueAttribute = this._getValueAttribute(newEntry);
    const valueExpr = valueAttribute.value;
    const cutted = valueExpr.substring(1, valueExpr.length - 1);
    const evaluated = evaluateXPath(cutted, node, newEntry);
    valueAttribute.value = evaluated;

    if (this.value === evaluated) {
      newEntry.setAttribute('selected', 'selected');
    }

    // ### set label
    const optionLabel = newEntry.textContent;
    const labelExpr = optionLabel.substring(1, optionLabel.length - 1);

    const label = evaluateXPathToString(labelExpr, node, newEntry);
    newEntry.textContent = label;
    //  ### <<< needs rework
  }

  createEntry() {
    const content = this.template.content.firstElementChild.cloneNode(true);
    const newEntry = document.importNode(content, true);
    this.template.parentNode.appendChild(newEntry);
    return newEntry;
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

window.customElements.define('fx-control', FxControl);
