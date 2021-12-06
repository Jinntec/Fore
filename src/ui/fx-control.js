import XfAbstractControl from './abstract-control.js';
import { evaluateXPath, evaluateXPathToString } from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';
import { XPathUtil } from '../xpath-util';

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
class FxControl extends XfAbstractControl {
  constructor() {
    super();
    this.inited = false;
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.updateEvent = this.hasAttribute('update-event')
      ? this.getAttribute('update-event')
      : 'blur';
    this.valueProp = this.hasAttribute('value-prop') ? this.getAttribute('value-prop') : 'value';
    this.label = this.hasAttribute('label') ? this.getAttribute('label') : null;

    const repeated = this.closest('fx-repeatitem');
    if(!repeated){
      let options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      }

      let observer = new IntersectionObserver(this.handleIntersect, options);
      observer.observe(this);
      console.log('observing intersection', observer);
    }


/*
    const observer = new window.IntersectionObserver(([entry]) =>{
      if(entry.isIntersecting){
        console.log('entering....');
      }
      console.log('leave....');
    });

    observer.observe(document.body);
*/


    const style = `
            :host{
                display:inline-block;
            }
        `;

    /*
        const controlHtml = `
            <slot></slot>
            <fx-setvalue id="setvalue" ref="${this.ref}"></fx-setvalue>
        `;
*/

    /*
        this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${controlHtml}
        `
*/
    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${this.renderHTML(this.ref)}
        `;

    this.widget = this.getWidget();
    console.log('widget ', this.widget);

    // ### convenience marker event
    if (this.updateEvent === 'enter') {
      this.widget.addEventListener('keyup', event => {
        if (event.keyCode === 13) {
          // Cancel the default action, if needed
          event.preventDefault();
          this.setValue(this.widget[this.valueProp]);
        }
        // console.log('enter handler ', this.updateEvent);
        // this.setValue(this.widget[this.valueProp]);
      });
      this.updateEvent = 'blur'; // needs to be registered too
    }
    this.widget.addEventListener(this.updateEvent, () => {
      console.log('eventlistener ', this.updateEvent);
      this.setValue(this.widget[this.valueProp]);
    });
  }

  handleIntersect(entries, observer) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // console.log('in view', this);
        // console.log('in view entry', entry.target);
        entry.target.getOwnerForm().inView.push(entry.target);
        console.log('inView', entry.target.getOwnerForm().inView);
      }
    });
  }


  set Value(val) {
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
    if (this.valueProp === 'checked') {
      if (this.value === 'true') {
        this.widget.checked = true;
      } else {
        this.widget.checked = false;
      }
    } else {
      let { widget } = this;
      if (!widget) {
        widget = this;
      }
      widget.value = this.value;
    }
  }

  async refresh() {
    super.refresh();
    // const {widget} = this;

    // ### if we find a ref on control we have a 'select' control of some kind
    if (this.widget.hasAttribute('ref')) {
      const tmpl = this.widget.querySelector('template');

      // ### eval nodeset for list control
      const ref = this.widget.getAttribute('ref');

      /*
      actually a ref on a select or similar component should point to a different instance
      with an absolute expr e.g. 'instance('theId')/...'

      todo: even bail out if ref is not absolute?
       */
      const instanceId = XPathUtil.getInstanceId(ref);

      const inscope = getInScopeContext(this, ref);
      const formElement = this.closest('fx-fore');
      const nodeset = evaluateXPath(ref, inscope, this);

      // ### clear items
      const { children } = this.widget;
      Array.from(children).forEach(child => {
        if (child.nodeName.toLowerCase() !== 'template') {
          child.parentNode.removeChild(child);
        }
      });

      // ### build the items
      if (nodeset.length) {
        console.log('nodeset', nodeset);
        Array.from(nodeset).forEach(node => {
          console.log('#### node', node);
          const newEntry = this._createEntry(tmpl);

          // ### initialize new entry
          // ### set value
          this._updateEntry(newEntry, node, formElement);
        });
      } else {
        const newEntry = this._createEntry(tmpl);
        this._updateEntry(newEntry, nodeset, formElement);
      }
    }
  }

  _updateEntry(newEntry, node, formElement) {
    // ### >>> todo: needs rework this code is heavily assuming a select control with 'value' attribute - not generic at all yet.
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

  _createEntry(tmpl) {
    const content = tmpl.content.firstElementChild.cloneNode(true);
    const newEntry = document.importNode(content, true);
    // console.log('newEntry ', newEntry);
    this.widget.appendChild(newEntry);
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
