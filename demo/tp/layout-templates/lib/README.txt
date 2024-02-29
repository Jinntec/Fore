****************************************************
YAY! AN INTEROPERABLE WEB COMPONENT FOR CSS LAYOUT!
****************************************************

You can use this component in Vue, Preact, markdown (etc, etc) with ease. Here are a few tips:

  1. Initialize the component by importing it like `import ComponentName from './path/to/ComponentName.js'`. If you are not using a bundler, the `<script>` that does the importing needs `type="module"`.
  2. Remember to include the accompanying CSS file, which has the initial styles, and fallback styles for when either JS or custom element support is not available. Adapt this stylesheet to better suit your intended default settings for the component.
  3. If you want to support older browsers (rather than using progressive enhancement), include the webcomponentsjs (https://github.com/webcomponents/webcomponentsjs) polyfill. Where you are bundling with webpack, you will also need custom-elements-es5-adapter.js. This MUST be added separately, and not compiled, because custom elements cannot be converted to ES5.
  4. The component may use a (default) value from the modular scale used at https://every-layout.dev. It will look something like `var(--s[number])`. You should either steal Every Layout's modular scale (see https://every-layout.dev/rudiments/modular-scale), make your own with the same naming conventions, or use a different value within the JavaScript file. 
  5. This layout component re-renders whenever you change one of its attribute's values. This way, you can play with the layout live (in browser dev tools) and affect the layout using inherited application state!