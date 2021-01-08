/// BareSpecifier=@vaadin/vaadin-text-field/src/vaadin-email-field
/**
@license
Copyright (c) 2018 Vaadin Ltd.
This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
*/
import '../../../@polymer/polymer/polymer-element.js';

import '../../../@polymer/polymer/lib/elements/custom-style.js';
import { TextFieldElement } from './vaadin-text-field.js';
import { DomModule } from '../../../@polymer/polymer/lib/elements/dom-module.js';
import { html } from '../../../@polymer/polymer/lib/utils/html-tag.js';

const $_documentContainer = html`<dom-module id="vaadin-email-field-template">
  <template>
    <style>
      :host([dir="rtl"]) [part="input-field"] {
        direction: ltr;
      }

      :host([dir="rtl"]) [part="value"]::placeholder {
        direction: rtl;
        text-align: left;
      }

      :host([dir="rtl"]) [part="input-field"] ::slotted(input)::placeholder {
        direction: rtl;
        text-align: left;
      }

      :host([dir="rtl"]) [part="value"]:-ms-input-placeholder,
      :host([dir="rtl"]) [part="input-field"] ::slotted(input):-ms-input-placeholder {
        direction: rtl;
        text-align: left;
      }
    </style>
  </template>
  
</dom-module>`;

document.head.appendChild($_documentContainer.content);
let memoizedTemplate;

/**
 * `<vaadin-email-field>` is a Web Component for email field control in forms.
 *
 * ```html
 * <vaadin-email-field label="Email">
 * </vaadin-email-field>
 * ```
 *
 * ### Styling
 *
 * See vaadin-text-field.html for the styling documentation
 *
 * See [ThemableMixin – how to apply styles for shadow parts](https://github.com/vaadin/vaadin-themable-mixin/wiki)
 *
 * @extends TextFieldElement
 * @demo demo/index.html
 */
class EmailFieldElement extends TextFieldElement {
  static get is() {
    return 'vaadin-email-field';
  }

  static get version() {
    return '2.8.2';
  }

  static get template() {
    if (!memoizedTemplate) {
      // Clone the superclass template
      memoizedTemplate = super.template.cloneNode(true);

      // Retrieve this element's dom-module template
      const thisTemplate = DomModule.import(this.is + '-template', 'template');
      const styles = thisTemplate.content.querySelector('style');

      // Add the and styles to the text-field template
      memoizedTemplate.content.appendChild(styles);
    }

    return memoizedTemplate;
  }

  /** @protected */
  ready() {
    super.ready();
    this.inputElement.type = 'email';
    this.inputElement.autocapitalize = 'off';
  }

  /** @protected */
  _createConstraintsObserver() {
    // NOTE: pattern needs to be set before constraints observer is initialized
    this.pattern = this.pattern || '^([a-zA-Z0-9_\\.\\-+])+@[a-zA-Z0-9-.]+\\.[a-zA-Z0-9-]{2,}$';

    super._createConstraintsObserver();
  }
}

customElements.define(EmailFieldElement.is, EmailFieldElement);

export { EmailFieldElement };