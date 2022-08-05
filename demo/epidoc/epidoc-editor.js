(()=>{var h=`
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
    }`,i=class extends HTMLElement{constructor(){super();this._wrapper=null,this.xmlEditor=null,this.valid=!0,this.schema=null,this.attachShadow({mode:"open"})}set value(e){if(this._wrapper===e){console.debug("value unchanged");return}if(e||(this._wrapper=null),!(e instanceof Element))throw new Error("Value is not a node");this._wrapper=e;let n=e.firstElementChild;if(!this.xmlEditor)throw new Error("XML editor not initialized");this.xmlEditor.value=n}get value(){return this._wrapper}connectedCallback(){var r,d,a;this.schema=this.getAttribute("schema"),this.shadowRoot.innerHTML=`
            <style>
                ${h}
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
        `;let e=(r=this.shadowRoot)==null?void 0:r.querySelector("#xml-editor"),n=(d=this.shadowRoot)==null?void 0:d.querySelector("#leiden-editor"),l=(a=this.shadowRoot)==null?void 0:a.querySelector("#import");if(!(e&&n&&l))throw new Error("One or more components were not initialized");l.addEventListener("click",()=>{n.classList.toggle("hidden")||n.focus()}),n.addEventListener("update",t=>{t.stopPropagation(),e.content=t.detail.content}),this.xmlEditor=e,e.addEventListener("update",t=>{var s,c,u;if(t.stopPropagation(),!this._wrapper)return console.log("no wrapper !!!"),null;let m=((s=this._wrapper)==null?void 0:s.children.length)||0;for(let o=0;o<m;o++)(c=this._wrapper)==null||c.removeChild(this._wrapper.children[o]);if(!e.value)console.log("xml editor value is empty");else if(e.value instanceof Element)console.log("appending",e.value),(u=this._wrapper)==null||u.appendChild(e.value);else throw new Error("XML editor value is not a node");let p=this._wrapper;this.dispatchEvent(new CustomEvent("update",{detail:{content:p},composed:!0,bubbles:!0}))}),e.addEventListener("invalid",t=>{t.stopPropagation(),this.valid=!1}),e.addEventListener("valid",t=>{t.stopPropagation(),this.valid=!0})}};customElements.get("jinn-epidoc-editor")||window.customElements.define("jinn-epidoc-editor",i);})();
//# sourceMappingURL=epidoc-editor.js.map
