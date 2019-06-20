/// BareSpecifier=@vaadin/vaadin-item/src/vaadin-item
/**
@license
Copyright (c) 2017 Vaadin Ltd.
This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
*/
import { PolymerElement } from '../../../@polymer/polymer/polymer-element.js';

import { ThemableMixin } from '../../vaadin-themable-mixin/vaadin-themable-mixin.js';
import { ItemMixin } from './vaadin-item-mixin.js';
import { html } from '../../../@polymer/polymer/lib/utils/html-tag.js';
/**
 * `<vaadin-item>` is a Web Component providing layout for items in tabs and menus.
 *
 * ```
 *   <vaadin-item>
 *     Item content
 *   </vaadin-item>
 * ```
 *
 * ### Selectable
 *
 * `<vaadin-item>` has the `selected` property and the corresponding state attribute.
 * Currently, the component sets the `selected` to false, when `disabled` property is set to true.
 * But other than that, the `<vaadin-item>` does not switch selection by itself.
 * In general, it is the wrapper component, like `<vaadin-list-box>`, which should update
 * the `selected` property on the items, e. g. on mousedown or when Enter / Spacebar is pressed.
 *
 * ### Styling
 *
 * The following shadow DOM parts are available for styling:
 *
 * Part name | Description
 * ---|---
 * `content` | The element that wraps the slot
 *
 * The following state attributes are available for styling:
 *
 * Attribute  | Description | Part name
 * -----------|-------------|------------
 * `disabled` | Set to a disabled item | :host
 * `focused` | Set when the element is focused | :host
 * `focus-ring` | Set when the element is keyboard focused | :host
 * `selected` | Set when the item is selected | :host
 * `active` | Set when mousedown or enter/spacebar pressed | :host
 *
 * @memberof Vaadin
 * @mixes Vaadin.ItemMixin
 * @mixes Vaadin.ThemableMixin
 */
class ItemElement extends ItemMixin(ThemableMixin(PolymerElement)) {
  static get template() {
    return html`
    <style>
      :host {
        display: inline-block;
      }

      :host([hidden]) {
        display: none !important;
      }
    </style>
    <div part="content">
      <slot></slot>
    </div>
`;
  }

  static get is() {
    return 'vaadin-item';
  }

  static get version() {
    return '2.1.1';
  }

  constructor() {
    super();

    /**
     * Submittable string value. The default value is the trimmed text content of the element.
     * @type {string}
     */
    this.value;
  }
}

customElements.define(ItemElement.is, ItemElement);

export { ItemElement };