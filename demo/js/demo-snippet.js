/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/

import '@polymer/polymer/polymer-legacy.js';
import '@polymer/marked-element/marked-element.js';
import '@polymer/prism-element/prism-highlighter.js';
import '@polymer/prism-element/prism-theme-default.js';

import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';

/**
`demo-snippet` is a helper element that displays the source of a code snippet
and its rendered demo. It can be used for both native elements and Polymer
elements.

    Example of a native element demo

        <demo-snippet>
          <template>
            <input type="date">
          </template>
        </demo-snippet>

    Example of a Polymer <paper-checkbox> demo

        <demo-snippet>
          <template>
            <paper-checkbox>Checkbox</paper-checkbox>
            <paper-checkbox checked>Checkbox</paper-checkbox>
          </template>
        </demo-snippet>

### Styling

The following custom properties and mixins are available for styling:

Custom property | Description | Default
----------------|-------------|----------
`--demo-snippet` | Mixin applied to the entire element | `{}`
`--demo-snippet-demo` | Mixin applied to just the demo section | `{}`
`--demo-snippet-code` | Mixin applied to just the code section | `{}`

@element demo-snippet
@demo demo/index.html
*/
Polymer({
  _template: html`
    <style include="prism-theme-default">
      :host {
        display: block;
        /*margin-bottom: 40px;*/
        @apply --demo-snippet;
      }

      .demo {
        display: block;
        /*border-bottom: 1px solid #e0e0e0;*/
        background: rgba(240,245,255,0.5)
        margin: 0;
        padding: 1rem;
        @apply --demo-snippet-demo;
        display: flex;
        align-items:center;
      }

      .code-container {
        margin: 0;
        /*background-color: rgba(240,245,255,0.8);*/
        font-size: 13px;
        overflow: auto;
        padding: 0 20px;
        z-index: -1;
        @apply --demo-snippet-code;
        margin-bottom: 1rem;
      }

      .code {
        margin: 0;
        background-color: var(--google-grey-100);
        font-size: 0.9rem;
        overflow: auto;
        @apply --demo-snippet-code;
        padding: 0 1rem;
        /*
        border-top: 2px solid rgba(255,255,255,0.9);
        border-left:2px solid rgba(255,255,255,0.9);
        border-bottom: thin solid rgba(0,0,0,0.2);
        border-right: thin solid rgba(0,0,0,0.2);
        border-radius: 0.75rem;
        */
      }
      
      .code > pre {
        margin: 0;
        padding: 0 0 10px 0;
        background: transparent;
      }

      button {
        position: absolute;
        top: 0;
        right: 0px;
        text-transform: uppercase;
        border: none;
        cursor: pointer;
        background: #e0e0e0;
      }
    </style>

    <prism-highlighter></prism-highlighter>

    <div class="demo">
      <slot id="content"></slot>
    </div>

    <div class="code-container">
      <marked-element markdown="[[_markdown]]" id="marked">
        <div class="code" slot="markdown-html" id="code"></div>
      </marked-element>
      <!--      <button id="copyButton" title="copy to clipboard" on-tap="_copyToClipboard">Copy</button>-->
    </div>
  `,

  is: 'demo-snippet',

  properties: {
    /**
     * Fired when the demo-snippet is ready, i.e. when it has injected the code to demo
     * in the DOM and it can be interacted with
     *
     * @event dom-ready
     */

    /** @private */
    _markdown: {
      type: String,
    },
  },

  attached: function() {
    this._observer = dom(this.$.content).observeNodes(
      function(info) {
        this._updateMarkdown();
      }.bind(this),
    );
  },

  detached: function() {
    if (this._observer) {
      dom(this.$.content).unobserveNodes(this._observer);
      this._observer = null;
    }
  },

  _updateMarkdown: function() {
    var template = dom(this).queryDistributedElements('template')[0];

    // If there's no template, render empty code.
    if (!template) {
      this._markdown = '';
      return;
    }

    var snippet = this.$.marked.unindent(template.innerHTML);

    // Hack: In safari + shady dom, sometime we get an empty 'class' attribute.
    // if we do, delete it.
    snippet = snippet.replace(/ class=""/g, '');

    // Boolean properties are displayed as checked="", so remove the ="" bit.
    snippet = snippet.replace(/=""/g, '');

    this._markdown = '```\n' + snippet + '\n' + '```';
    // Stamp the template.
    if (!template.hasAttribute('is')) {
      // Don't need to listen for more changes (since stamping the template
      // will trigger an observeNodes)
      dom(this.$.content).unobserveNodes(this._observer);
      this._observer = null;
      dom(this).appendChild(document.importNode(template.content, true));
    }
    this.dispatchEvent(new CustomEvent('dom-ready'));
  },

  _copyToClipboard: function() {
    // From
    // https://github.com/google/material-design-lite/blob/master/docs/_assets/snippets.js
    var snipRange = document.createRange();
    snipRange.selectNodeContents(this.$.code);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(snipRange);
    var result = false;
    try {
      result = document.execCommand('copy');
      this.$.copyButton.textContent = 'done';
    } catch (err) {
      // Copy command is not available
      console.error(err);
      this.$.copyButton.textContent = 'error';
    }

    // Return to the copy button after a second.
    setTimeout(this._resetCopyButtonState.bind(this), 1000);

    selection.removeAllRanges();
    return result;
  },

  _resetCopyButtonState: function() {
    this.$.copyButton.textContent = 'copy';
  },
});
