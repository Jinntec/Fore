(() => {
  // src/epidoc-editor.ts
  var style = `
    :host{
        display: block;
        width: 100%;
    }
    jinn-codemirror {
        font-size: 1rem;
        display:block;
        width:100%;
    }
    jinn-codemirror[valid="true"] {
        outline: thin solid green;
    }
    jinn-codemirror[valid="false"] {
        outline: thin solid red;
    }
    #leiden-editor {
        margin-bottom:0.5rem;
    }
    .hidden {
        display: none;
    }
    [slot=toolbar] {
        display: block;
        width: 100%;
        margin-bottom: 0.75rem;
    }
    [slot=toolbar] * {
        font-size: .85rem;
        border: 1px solid transparent;
        background-color: inherit;
    }
    [slot=toolbar] *:hover {
        border: 1px solid orange;
    }`;
  var JinnEpidocEditor = class extends HTMLElement {
    constructor() {
      super();
      this._wrapper = null;
      this._remote = false;
      this.xmlEditor = null;
      this.valid = true;
      this.schema = null;
      this.attachShadow({ mode: "open" });
    }
    set value(value) {
      if (this._wrapper === value) {
        console.debug("value unchanged");
        return;
      }
      if (!value) {
        this._wrapper = null;
      }
      if (!(value instanceof Element)) {
        throw new Error("Value is not a node");
      }
      this._wrapper = value;
      const node = value.firstElementChild;
      if (!this.xmlEditor) {
        throw new Error("XML editor not initialized");
      }
      this.xmlEditor.value = node;
    }
    get value() {
      return this._wrapper;
    }
    connectedCallback() {
      var _a, _b, _c;
      this.schema = this.getAttribute("schema");
      this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            <jinn-codemirror id="leiden-editor" class="leiden hidden">
                <div slot="toolbar">
                    <select name="modes">
                        <option value="edcs" selected>EDCS/EDH</option>
                        <option value="default">Petrae</option>
                        <option value="leiden_plus">Leiden+</option>
                    </select>
                    <button data-command="expan" class="leiden_plus">(a(bcd))</button>
                    <button data-command="erasure" class="leiden_plus">\u301Aabc\u301B</button>
                    <button data-command="unclear" class="leiden_plus">a\u0323</button>
                    <button data-command="div" class="leiden_plus">&lt;=...</button>
                    <!--button data-command="fragment" class="leiden_plus">&lt;D=.1.fragment...</button-->
                    <button data-command="part" class="leiden_plus">&lt;D=.A.part...</button>
                    <button data-command="recto" class="leiden_plus">&lt;D=.r...</button>
                    <button data-command="verso" class="leiden_plus">&lt;D=.v...</button>
                    <button data-command="erasure" class="edcs">\u301Aabc\u301B</button>
                    <button data-command="gap" class="edcs">[...]</button>
                    <button data-command="convert" class="edcs">Leiden+</button>
                </div>
            </jinn-codemirror>
            <jinn-codemirror id="xml-editor" mode="xml" schema="${this.schema}"
                    namespace="http://www.tei-c.org/ns/1.0">
                <div slot="toolbar">
                    <button id="import" title="Import from Leiden markup">Import Leiden</button>
                    <button data-command="selectElement" title="Select element around current cursor position">&lt;|></button>
                    <button data-command="encloseWith" title="Enclose selection in new element">&lt;...&gt;</button>
                    <button data-command="removeEnclosing" title="Remove enclosing tags">&lt;X></button>
                </div>
            </jinn-codemirror>
        `;
      const xmlEditor = (_a = this.shadowRoot) == null ? void 0 : _a.querySelector("#xml-editor");
      const leidenEditor = (_b = this.shadowRoot) == null ? void 0 : _b.querySelector("#leiden-editor");
      const toggle = (_c = this.shadowRoot) == null ? void 0 : _c.querySelector("#import");
      if (!(xmlEditor && leidenEditor && toggle)) {
        throw new Error("One or more components were not initialized");
      }
      toggle.addEventListener("click", () => {
        const hidden = leidenEditor.classList.toggle("hidden");
        if (!hidden) {
          leidenEditor.focus();
        }
      });
      leidenEditor.addEventListener("update", (ev) => {
        ev.stopPropagation();
        xmlEditor.content = ev.detail.content;
      });
      this.xmlEditor = xmlEditor;
      xmlEditor.addEventListener("update", (ev) => {
        var _a2, _b2, _c2;
        ev.stopPropagation();
        if (!this._wrapper) {
          console.log("no wrapper !!!");
          return null;
        }
        if (this._remote) {
          this._remote = false;
          console.log("set value was called - so no update");
          return;
        }
        const cl = ((_a2 = this._wrapper) == null ? void 0 : _a2.children.length) || 0;
        for (let i = 0; i < cl; i++) {
          (_b2 = this._wrapper) == null ? void 0 : _b2.removeChild(this._wrapper.children[i]);
        }
        if (!xmlEditor.value) {
          console.log("xml editor value is empty");
        } else if (!(xmlEditor.value instanceof Element)) {
          throw new Error("XML editor value is not a node");
        } else {
          console.log("appending", xmlEditor.value);
          (_c2 = this._wrapper) == null ? void 0 : _c2.appendChild(xmlEditor.value);
        }
        const content = this._wrapper;
        this.dispatchEvent(new CustomEvent("update", {
          detail: { content },
          composed: true,
          bubbles: true
        }));
      });
      xmlEditor.addEventListener("invalid", (ev) => {
        ev.stopPropagation();
        this.valid = false;
      });
      xmlEditor.addEventListener("valid", (ev) => {
        ev.stopPropagation();
        this.valid = true;
      });
    }
  };
  if (!customElements.get("jinn-epidoc-editor")) {
    window.customElements.define("jinn-epidoc-editor", JinnEpidocEditor);
  }
})();
