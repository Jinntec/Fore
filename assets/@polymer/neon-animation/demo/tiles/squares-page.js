/// BareSpecifier=@polymer/neon-animation/demo/tiles/squares-page
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
import '../../../polymer/polymer-legacy.js';

import { Polymer } from '../../../polymer/lib/legacy/polymer-fn.js';
import { dom } from '../../../polymer/lib/legacy/polymer.dom.js';
import { html } from '../../../polymer/lib/utils/html-tag.js';

import { NeonSharedElementAnimatableBehavior } from '../../neon-shared-element-animatable-behavior.js';

Polymer({
  _template: html`
    <style>
      .header {
        height: 40%;
        background: var(--color-one);
      }

      .body {
        text-align: center;
        padding: 8px;
      }

      .square {
        display: inline-block;
        width: 150px;
        height: 150px;
        margin: 8px;
        background: var(--color-two);
      }
    </style>

    <div id="header" class="header"></div>

    <div class="body">
      <div class="square"></div>
      <div class="square"></div>
      <div class="square"></div>
      <div class="square"></div>
    </div>
  `,

  is: 'squares-page',
  behaviors: [NeonSharedElementAnimatableBehavior],

  properties: {

    sharedElements: { type: Object },

    animationConfig: { type: Object }
  },

  attached: function () {
    if (this.animationConfig) {
      return;
    }

    this.sharedElements = { 'hero': this.$.header };
    var squares = dom(this.root).querySelectorAll('.square');
    var squaresArray = Array.from(squares);
    this.animationConfig = {
      'entry': [{ name: 'hero-animation', id: 'hero', toPage: this }, {
        name: 'cascaded-animation',
        animation: 'transform-animation',
        transformFrom: 'translateY(100%)',
        nodes: squaresArray
      }],

      'exit': [{ name: 'slide-up-animation', node: this.$.header }, {
        name: 'cascaded-animation',
        animation: 'transform-animation',
        transformTo: 'translateY(60vh)',
        nodes: squaresArray
      }]
    };
  }
});