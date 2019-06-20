[![Published on NPM](https://img.shields.io/npm/v/@polymer/paper-dropdown-menu.svg)](https://www.npmjs.com/package/@polymer/paper-dropdown-menu)
[![Build status](https://travis-ci.org/PolymerElements/paper-dropdown-menu.svg?branch=master)](https://travis-ci.org/PolymerElements/paper-dropdown-menu)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://webcomponents.org/element/@polymer/paper-dropdown-menu)

## &lt;paper-dropdown-menu&gt;
`paper-dropdown-menu` is similar to a native browser select element.
`paper-dropdown-menu` works with selectable content.

See: [Documentation](https://www.webcomponents.org/element/@polymer/paper-dropdown-menu),
  [Demo](https://www.webcomponents.org/element/@polymer/paper-dropdown-menu/demo/demo/index.html).

## Usage

### Installation
```
npm install --save @polymer/paper-dropdown-menu
```

### In an html file
```html
<html>
  <head>
    <script type="module">
      import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
      import '@polymer/paper-item/paper-item.js';
      import '@polymer/paper-listbox/paper-listbox.js';
    </script>
  </head>
  <body>
    <paper-dropdown-menu label="Dinosaurs">
      <paper-listbox slot="dropdown-content" selected="1">
        <paper-item>allosaurus</paper-item>
        <paper-item>brontosaurus</paper-item>
        <paper-item>carcharodontosaurus</paper-item>
        <paper-item>diplodocus</paper-item>
      </paper-listbox>
    </paper-dropdown-menu>
  </body>
</html>
```
### In a Polymer 3 element
```js
import {PolymerElement, html} from '@polymer/polymer';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-listbox/paper-listbox.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
      <paper-dropdown-menu label="Dinosaurs">
        <paper-listbox slot="dropdown-content" selected="1">
          <paper-item>allosaurus</paper-item>
          <paper-item>brontosaurus</paper-item>
          <paper-item>carcharodontosaurus</paper-item>
          <paper-item>diplodocus</paper-item>
        </paper-listbox>
      </paper-dropdown-menu>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

## Contributing
If you want to send a PR to this element, here are
the instructions for running the tests and demo locally:

### Installation
```sh
git clone https://github.com/PolymerElements/paper-dropdown-menu
cd paper-dropdown-menu
npm install
npm install -g polymer-cli
```

### Running the demo locally
```sh
polymer serve --npm
open http://127.0.0.1:<port>/demo/
```

### Running the tests
```sh
polymer test --npm
```
