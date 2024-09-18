/**
 * A simple collapsible treeview for showing JSON data.
 *
 */
class FxJsonInstance extends HTMLElement {
  // constructor(container, options = {}) {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    this.instanceElement = null;
    this.foreSelector = null;
  }

  connectedCallback() {
    this.container = this.querySelector('.json-path-picker-container');
    this.foreSelector = this.hasAttribute('fore') ? this.getAttribute('fore') : 'fx-fore'; // default to first one in doc
    this.render();
  }

  render() {
    const style = `
        @import '../../resources/fore.css';
      
        :host {
          display:block;
          font-size:0.8em;
          background:rgba(250, 250, 250, 0.9);
        }
        .container{
            margin-left:1em;
        }
        .header{
            margin-left:0;
        }

        ::slot[name='header']{
            margin-left:-1em;
        }
        /* Syntax highlighting for JSON objects */
        ul.json-dict, ol.json-array {
          list-style-type: none;
          margin: 0 0 0 1px;
          border-left: 1px dotted #ccc;
          padding-left: 2em;
        }
        .json-string {
          // color: #0B7500;
        }
        .json-literal {
          color: #1A01CC;
          font-weight: bold;
        }
        
        /* Toggle button */
        a.json-toggle {
          position: relative;
          color: inherit;
          text-decoration: none;
        }
        a.json-toggle:focus {
          outline: none;
        }
        a.json-toggle:before {
          content: "\\25BC"; /* down arrow */
          position: absolute;
          display: inline-block;
          width: 1em;
          left: -1.2em;
          font-size:0.8em;
        }
        a.json-toggle.collapsed:before {
          content: "\\25B6"; /* left arrow */
        }
        
        /* Collapsable placeholder links */
        a.json-placeholder {
          color: #aaa;
          padding: 0 1em;
          text-decoration: none;
        }
        a.json-placeholder:hover {
          text-decoration: underline;
        }
        
        /* Copy path icon */
        .pick-path {
          color: lightgray;
          cursor: pointer;
          margin-left: 3px;
        }
        
        .pick-path:hover {
          color: darkgray;
        }
        
      `;

    const instanceId = this.hasAttribute('instance') ? this.getAttribute('instance') : 'default';
    const fore = document.querySelector(this.foreSelector);
    if (!fore) {
      throw new Error(`this '${this.foreSelector}' does not match a fx-fore element`);
    }

    const html = `
          <div class="container"></div>
      `;

    this.shadowRoot.innerHTML = `
          <style>
              ${style}
          </style>
          <slot name="header">
            <header class="header">${instanceId}</header>
          </slot>
          <slot></slot>
          ${html}
      `;

    // fore.addEventListener('ready', e => {

    const instanceElement = document.querySelector(`#${instanceId}`);
    if (
      !instanceElement ||
      instanceElement.nodeName !== 'FX-INSTANCE' ||
      instanceElement.getAttribute('type') !== 'json'
    ) {
      throw new Error(
        `this '${instanceId}' does not match an fx-instance element or is not of type JSON`,
      );
    }
    const container = this.shadowRoot.querySelector('.container');

    const json = instanceElement.instanceData;
    let tree = this.json2html(json, { outputWithQuotes: true });
    if (this.isCollapsable(json)) tree = '<a href=\'#\' class="json-toggle"></a>'.concat(tree); // Insert HTML in target DOM element

    container.innerHTML = tree;

    const toggles = this.shadowRoot.querySelectorAll('.json-toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', this._handleToggleEvent.bind(this));
    });
    // container.addEventListener('click', (event) => this._handleToggleEvent);
    // });
  }

  disconnectedCallback() {}

  _isHidden(elem) {
    const width = elem.offsetWidth;
    const height = elem.offsetHeight;
    return (width === 0 && height === 0) || window.getComputedStyle(elem).display === 'none';
  }

  _handleToggleEvent(event) {
    // Change class
    // event.preventDefault();
    // event.stopPropagation();

    const elm = event.target;
    elm.classList.toggle('collapsed'); // Fetch every json-dict and json-array to toggle them

    const subTarget = this._siblings(elm, 'ul.json-dict, ol.json-array', el => {
      el.style.display = el.style.display === '' || el.style.display === 'block' ? 'none' : 'block';
    }); // ForEach subtarget, previous siblings return array so we parse it

    for (let i = 0; i < subTarget.length; i += 1) {
      if (!this._isHidden(subTarget[i])) {
        // Parse every siblings with '.json-placehoder' and remove them (previous add by else)
        this._siblings(subTarget[i], '.json-placeholder', el => el.parentNode.removeChild(el));
      } else {
        // count item in object / array
        const childs = subTarget[i].children;
        let count = 0;

        for (let j = 0; j < childs.length; j += 1) {
          if (childs[j].tagName === 'LI') {
            count += 1;
          }
        }

        const placeholder = count + (count > 1 ? ' items' : ' item'); // Append a placeholder
        subTarget[i].insertAdjacentHTML(
          'afterend',
          '<a href class="json-placeholder">'.concat(placeholder, '</a>'),
        );
      }
    } // Prevent propagation

    event.stopPropagation();
    event.preventDefault();
  }

  _siblings(el, sel, callback) {
    const sibs = [];

    for (let i = 0; i < el.parentNode.children.length; i += 1) {
      const child = el.parentNode.children[i];

      if (child !== el && typeof sel === 'string' && child.matches(sel)) {
        sibs.push(child);
      }
    } // If a callback is passed, call it on each sibs

    if (callback && typeof callback === 'function') {
      for (let _i = 0; _i < sibs.length; _i += 1) {
        callback(sibs[_i]);
      }
    }

    return sibs;
  }

  json2html(json, options) {
    let html = '';

    if (typeof json === 'string') {
      // Escape tags
      const tmp = json
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      if (this.isUrl(tmp)) {
        html += '<a href="'.concat(tmp, '" class="json-string">').concat(tmp, '</a>');
      } else {
        html += '<span class="json-string">"'.concat(tmp, '"</span>');
      }
    } else if (typeof json === 'number') {
      html += '<span class="json-literal">'.concat(json, '</span>');
    } else if (typeof json === 'boolean') {
      html += '<span class="json-literal">'.concat(json, '</span>');
    } else if (json === null) {
      html += '<span class="json-literal">null</span>';
    } else if (json instanceof Array) {
      if (json.length > 0) {
        html += '[<ol class="json-array">';

        for (let i = 0; i < json.length; i += 1) {
          html += '<li data-key-type="array" data-key="'.concat(i, '">'); // Add toggle button if item is collapsable

          if (this.isCollapsable(json[i])) {
            html += '<a href="#" class="json-toggle"></a>';
          }

          html += this.json2html(json[i], options); // Add comma if item is not last

          if (i < json.length - 1) {
            html += ',';
          }

          html += '</li>';
        }

        html += '</ol>]';
      } else {
        html += '[]';
      }
    } else if (this._typeof(json) === 'object') {
      let keyCount = Object.keys(json).length;

      if (keyCount > 0) {
        html += '{<ul class="json-dict">';

        for (const key in json) {
          if (json.hasOwnProperty(key)) {
            html += '<li data-key-type="object" data-key="'.concat(key, '">');
            const keyRepr = options.outputWithQuotes
              ? '<span class="json-string">"'.concat(key, '"</span>')
              : key; // Add toggle button if item is collapsable

            if (this.isCollapsable(json[key])) {
              html += '<a href=\'#\' class="json-toggle">'.concat(keyRepr, '</a>');
            } else {
              html += keyRepr;
            }

            // ### keep the following comment for later - pick path is a good idea but needs to be adapted to XPath syntax
            // html += '<span class="pick-path" title="Pick path">&#10697;</span>';
            html += ': '.concat(this.json2html(json[key], options)); // Add comma if item is not last

            keyCount -= 1;

            if (keyCount > 0) {
              html += ',';
            }

            html += '</li>';
          }
        }

        html += '</ul>}';
      } else {
        html += '{}';
      }
    }

    return html;
  }

  isUrl(string) {
    const regexp =
      /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#:.?+=&%@!\-/]))?/;
    return regexp.test(string);
  }

  _typeof(obj) {
    if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
      this._typeof = function _typeof(obj) {
        return typeof obj;
      };
    } else {
      this._typeof = function _typeof(obj) {
        return obj &&
          typeof Symbol === 'function' &&
          obj.constructor === Symbol &&
          obj !== Symbol.prototype
          ? 'symbol'
          : typeof obj;
      };
    }
    return this._typeof(obj);
  }

  isCollapsable(arg) {
    return arg instanceof Object && Object.keys(arg).length > 0;
  }

  /*
    setup() {
        // Create shadow DOM

        // Add styles to shadow DOM
        const style = document.createElement('style');
        style.textContent = `
    /!* add your CSS styles here *!/
  `;
        shadowRoot.appendChild(style);

        // Move content to shadow DOM
        const container = this.container.cloneNode(true);
        shadowRoot.appendChild(container);
        this.container.remove();
        this.container = shadowRoot.querySelector('.json-path-picker-container');
        this.clearBtn = shadowRoot.querySelector('.json-path-picker-clear-btn');
        this.jsonTextarea = shadowRoot.querySelector('.json-path-picker-json');
        this.treeView = shadowRoot.querySelector('.json-path-picker-tree');
        this.resultView = shadowRoot.querySelector('.json-path-picker-result');

        const data = {
            "automobiles": [
                {
                    "maker": "Nissan",
                    "model": "Teana",
                    "year": 2000
                },
                {
                    "maker": "Honda",
                    "model": "Jazz",
                    "year": 2023
                },
                {
                    "maker": "Honda",
                    "model": "Civic",
                    "year": 2007
                },
                {
                    "maker": "Toyota",
                    "model": "Yaris",
                    "year": 2008
                },
                {
                    "maker": "Honda",
                    "model": "Accord",
                    "year": 2011
                }
            ],
            "motorcycles": [{
                "maker": "Honda",
                "model": "ST1300",
                "year": 2012
            }]
        }

        this.updateTree(JSON.stringify(data));

    }
*/

  static get observedAttributes() {
    return ['data'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data') {
      this.jsonTextarea.value = newValue;
      this.updateTree(newValue);
    }
  }

  updateTree(jsonString) {
    try {
      this.data = JSON.parse(jsonString);
      this.treeView.innerHTML = '';
      this.treeView.appendChild(this.createTreeView(this.data, ''));
    } catch (e) {
      console.error(e);
      alert('Invalid JSON');
    }
  }

  createTreeView(data, path) {
    const ul = document.createElement('ul');
    ul.classList.add('jp-ul');
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const li = document.createElement('li');
        li.classList.add('jp-li');
        const newPath = `${path}[${index}]`;
        li.appendChild(this.createItemView(newPath, item));
        ul.appendChild(li);
      });
    } else if (typeof data === 'object' && data !== null) {
      Object.keys(data).forEach(key => {
        const li = document.createElement('li');
        li.classList.add('jp-li');
        const newPath = `${path}.${key}`;
        li.appendChild(this.createItemView(newPath, data[key]));
        ul.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.classList.add('jp-li');
      li.appendChild(this.createItemView(path, data));
      ul.appendChild(li);
    }
    return ul;
  }
}

if (!customElements.get('fx-json-instance')) {
  customElements.define('fx-json-instance', FxJsonInstance);
}
