/// BareSpecifier=@vaadin/vaadin-text-field/theme/lumo/vaadin-placeholder-styles
import { html } from '../../../../@polymer/polymer/lib/utils/html-tag.js';

const $_documentContainer = html`<dom-module id="lumo-placeholder-styles">
  <template>
    <style>
      input[slot="input"]::-webkit-input-placeholder,
      textarea[slot="textarea"]::-webkit-input-placeholder {
        color: inherit;
        transition: opacity 0.175s 0.05s;
        opacity: 0.5;
      }

      input[slot="input"]::-ms-input-placeholder,
      textarea[slot="textarea"]::-ms-input-placeholder {
        color: inherit;
        opacity: 0.5;
      }

      input[slot="input"]::-moz-placeholder,
      textarea[slot="textarea"]::-moz-placeholder {
        color: inherit;
        transition: opacity 0.175s 0.05s;
        opacity: 0.5;
      }

      input[slot="input"]::placeholder,
      textarea[slot="textarea"]::placeholder {
        color: inherit;
        transition: opacity 0.175s 0.1s;
        opacity: 0.5;
      }

      /* Read-only and disabled */
      [readonly] > input[slot="input"]::-webkit-input-placeholder,
      [readonly] > textarea[slot="textarea"]::-webkit-input-placeholder,
      [disabled] > input[slot="input"]::-webkit-input-placeholder,
      [disabled] > textarea[slot="textarea"]::-webkit-input-placeholder {
        opacity: 0;
      }

      [readonly] > input[slot="input"]::-ms-input-placeholder,
      [readonly] > textarea[slot="textarea"]::-ms-input-placeholder,
      [disabled] > input[slot="input"]::-ms-input-placeholder,
      [disabled] > textarea[slot="textarea"]::-ms-input-placeholder {
        opacity: 0;
      }

      [readonly] > input[slot="input"]::-moz-placeholder,
      [readonly] > textarea[slot="textarea"]::-moz-placeholder,
      [disabled] > input[slot="input"]::-moz-placeholder,
      [disabled] > textarea[slot="textarea"]::-moz-placeholder {
        opacity: 0;
      }

      [readonly] > input[slot="input"]::placeholder,
      [readonly] > textarea[slot="textarea"]::placeholder,
      [disabled] > input[slot="input"]::placeholder,
      [disabled] > textarea[slot="textarea"]::placeholder {
        opacity: 0;
      }
    </style>
  </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);