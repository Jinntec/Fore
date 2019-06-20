/// BareSpecifier=@vaadin/vaadin-combo-box/theme/lumo/vaadin-combo-box-styles
import '../../../vaadin-lumo-styles/font-icons.js';
import '../../../vaadin-lumo-styles/mixins/field-button.js';
import '../../../vaadin-text-field/theme/lumo/vaadin-text-field.js';
import { html } from '../../../../@polymer/polymer/lib/utils/html-tag.js';

const $_documentContainer = html`<dom-module id="lumo-combo-box" theme-for="vaadin-combo-box">
  <template>
    <style include="lumo-field-button">
      :host {
        outline: none;
      }

      [part="toggle-button"]::before {
        content: var(--lumo-icons-dropdown);
      }
    </style>
  </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);