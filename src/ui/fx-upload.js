import XfAbstractControl from './abstract-control.js';
import {
  evaluateXPath,
  evaluateXPathToString,
  evaluateXPathToFirstNode,
} from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';
import { Fore } from '../fore.js';
import { ModelItem } from '../modelitem.js';
import { debounce } from '../events.js';
import { FxModel } from '../fx-model.js';

const WIDGETCLASS = 'widget';

/**
 * `fx-upload` allows to embed uploaded content into XML.
 *
 * @customElement
 */


export default class FxUpload extends XfAbstractControl {
  constructor() {
    super();
    this.inited = false;
    this.attachShadow({ mode: 'open' });
  }

  static get properties() {
    return {
      ...XfAbstractControl.properties,
      accept: {
        type: String,
      },
      fileNameExpr: {
        type: String,
      },
      mimetypeExpr: {
        type: String,
      },
    };
  }

  async _importUploadedContent(event) {
    console.log('_importUploadedContent',event);
    const file = event.target.files[0];

    this.evalInContext();
    // update file ref
    const fileNode = evaluateXPathToFirstNode(this.fileNameExpr,this.nodeset,this.getOwnerForm());
    if(fileNode){
      this.fileName = fileNode.nodeValue = file.name;
    }
    this.mimetype = file.type;

    // update mediatype
    const mimetypeNode = evaluateXPathToFirstNode(this.mimetypeExpr,this.nodeset, this.getOwnerForm());
    if(mimetypeNode){
      mimetypeNode.nodeValue = this.mimetype;
    }

    let content = await this._readFile(file);
    // const setval = this.shadowRoot.getElementById('setvalue');
    console.log('content',content);
    if(file.type.endsWith('xml')){
      const uploadedXML = new DOMParser().parseFromString(content, 'application/xml');
      content = uploadedXML.firstElementChild;
    }
    this.setValue(content);
    // // this.value=content;
    // return content;
  }

  async _readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      // Determine how to read the file based on MIME type
      const isTextFile = file.type.startsWith("text/");
      const readMethod = isTextFile ? "readAsText" : "readAsDataURL";

      reader.onload = () => {
        const result = reader.result;
        // If it's a binary file, return only the Base64 content without the MIME prefix
        if (!isTextFile) {
          const base64Content = result.split(",")[1]; // Remove MIME prefix
          resolve(base64Content);
        } else {
          resolve(result); // Return plain text
        }
      };

      reader.onerror = () => reject(new Error("Error reading file"));

      // Start reading the file
      reader[readMethod](file);
    });
  }


  connectedCallback() {

    this.updateEvent = 'change';
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

    this.addEventListener('mousedown', e => {
      // ### prevent mousedown events on all control content that is not the widget or within the widget
      if (!Fore.isWidget(e.target) && !e.target?.classList.contains('fx-hint')) {
        e.preventDefault();
        // e.stopImmediatePropagation();
      }
      this.widget.focus();
    });

    // console.log('widget ', this.widget);
    let listenOn = this.widget; // default: usually listening on widget

    // ### convenience marker event
    if (this.debounceDelay) {
      listenOn.addEventListener(
        this.updateEvent,
        debounce(
          this,
          () => {
            // console.log('eventlistener ', this.updateEvent);
            // console.info('handling Event:', event.type, listenOn);
            this._importUploadedContent();
          },
          this.debounceDelay,
        ),
      );
    } else {
      listenOn.addEventListener(this.updateEvent, async event => {
        this._importUploadedContent(event);
      });
    }
    this.boundInitialized = false;
    this.fileNameExpr = this.getAttribute('filename');
    this.mimetypeExpr = this.getAttribute('mimetype');

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
    this.value=val;
    const modelitem = this.getModelItem();

    if(this.mimetype.endsWith('xml')){
      this.nodeset.textContent = '';
      this.nodeset.append(document.importNode(val,true));
    }else{
      modelitem.value = val;
    }


    if (this.getAttribute('class')) {
      this.classList.add('visited');
    } else {
      this.setAttribute('class', 'visited');
    }

    if (modelitem?.readonly) {
      console.warn('attempt to change readonly node', modelitem);
      return; // do nothing when modelItem is readonly
    }

    // const setval = this.shadowRoot.getElementById('setvalue');
    // setval.setValue(modelitem, val);

    if (this.modelItem instanceof ModelItem && !this.modelItem?.boundControls.includes(this)) {
      this.modelItem.boundControls.push(this);
    }
    const model = this.getModel();
    Fore.dispatch(this, 'value-changed', {
      path: this.modelItem.path,
      value: this.modelItem.value,
      oldvalue: "",
      instanceId:this.modelItem.instanceId,
      foreId:this.getOwnerForm().id
    });
    this.getModel().updateModel();
    this.getOwnerForm().refresh(true);

    // console.log('data', this.getOwnerForm().getModel().getDefaultInstanceData());
  }


  renderHTML(ref) {
    return `
            ${this.label ? `${this.label}` : ''}
            <slot></slot>
            <input type="file">
            <fx-setvalue id="setvalue" ref="${ref}"></fx-setvalue>
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
    return this.shadowRoot.querySelector('input');
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

    let { widget } = this;
    if (!widget) {
      widget = this;
    }

    if (widget.value !== this.value) {
      // widget.value = this.value;
    }
  }

  async refresh(force) {
    // console.log('fx-control refresh', this);
    super.refresh(force);
    // ### if we find a ref on control we have a 'select' control of some kind
    Fore.refreshChildren(this, force);
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
if (!customElements.get('fx-upload')) {
  window.customElements.define('fx-upload', FxUpload);
}
