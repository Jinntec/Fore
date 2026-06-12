/**
 * @typedef {{label: string, title: string, snippet: string}} Snippet
 */

/**
 * @param {Snippet[]} snippets
 */
const makeToolbarHTML = snippets => `
        <div slot="toolbar">
            <button
                data-command="selectElement"
                title="Select element around current cursor position"
            >
                &lt;|&gt;
            </button>
            <button
                data-command="encloseWith"
                title="Enclose selection in new element"
            >
                &lt;...&gt;
            </button>
            <button
                data-command="removeEnclosing"
                title="Remove enclosing tags"
                class="sep"
            >
                &lt;X&gt;
            </button>
            ${snippets.map(
                ({ title, label, snippet }) => `<button
                    data-command="snippet"
                    data-params="${snippet}"
                    title="${title}"
                >
                    &lt;${label}&gt;
                </button> `,
            )}
        </div>
    `;

/**
 * A jinn-xml-editor preconfigured for EDEP
 */
class EdepXMLEditor extends HTMLElement {
    constructor() {
        super();
        /**
         * @type {string}
         */
        this.schemaRoot = '';
        /**
         * @type {string}
         */
        this.placeholder = '';

        /**
         * @type Snippet[]
         */
        this.snippets = [];

        // Constants
        this.schema = 'resources/scripts/tei.json';
        this.unwrap = 'unwrap';
        this.namespace = 'http://www.tei-c.org/ns/1.0';

        this.baseUrl = '';

        /**
         * @type {HTMLElement}
         */
        this.jinnXMLEditor = null;
    }

    set value(newValue) {
        this.jinnXMLEditor.value = newValue;
    }

    get value() {
        return this.jinnXMLEditor.value;
    }

    connectedCallback() {
        this.schemaRoot = this.getAttribute('schema-root');
        this.placeholder = this.getAttribute('placeholder');
        this.baseUrl = this.getAttribute('base-url');
        this.snippets = this.hasAttribute('snippets')
            ? JSON.parse(this.getAttribute('snippets'))
            : [
                  {
                      label: 'ref',
                      title: 'Insert reference',
                      snippet: '&lt;ref type=&#34;biblio&#34; target=&#34;$|1|&#34;&gt;$|_|&lt;/ref&gt;',
                  },
              ];

        this.innerHTML = `<jinn-xml-editor
            unwrap="${this.unwrap}"
            placeholder="${this.placeholder}"
            schema="${this.schema}"
            schema-root="${this.schemaRoot}"
            namespace="${this.namespace}"
            base-url="${this.baseUrl}"
            providers="zotero"
            >${makeToolbarHTML(this.snippets)}</jinn-xml-editor
        >`;

        this.jinnXMLEditor = this.firstElementChild;
    }
}

window.customElements.define('edep-xml-editor', EdepXMLEditor);
