import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { foreHtml } from './fore-html-mode.js';

const STYLES = `
  :host { display: block; }
  .cm-editor { height: 100%; }
  .cm-scroller { overflow: auto; }
`;

/**
 * Source-code editor for Fore markup: HTML extended with knowledge of Fore's
 * fx-* elements/attributes (tag + attribute completion, and a linter flagging
 * unknown fx-* tags/attributes). See src/fore-html-mode.js.
 *
 * @attr {string} code - initial content
 * @attr {string} placeholder - placeholder text shown when empty
 * @prop {string} content - current editor content (get/set)
 * @fires update - fired (debounced) after the document changes; detail is the current text
 */
export class ForeCodemirror extends HTMLElement {
  static get observedAttributes() {
    return ['code'];
  }

  #view;
  #updateTimer;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const style = document.createElement('style');
    style.textContent = STYLES;
    this.shadowRoot.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.id = 'editor';
    this.shadowRoot.appendChild(wrapper);

    const initialDoc = this.getAttribute('code') || this.textContent.trim() || '';

    this.#view = new EditorView({
      state: EditorState.create({
        doc: initialDoc,
        extensions: [
          basicSetup,
          EditorView.lineWrapping,
          foreHtml(),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) this.#emitUpdate();
          }),
        ],
      }),
      parent: wrapper,
    });
  }

  disconnectedCallback() {
    this.#view?.destroy();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'code' && this.#view && oldValue !== newValue) {
      this.content = newValue || '';
    }
  }

  #emitUpdate() {
    clearTimeout(this.#updateTimer);
    this.#updateTimer = setTimeout(() => {
      this.dispatchEvent(new CustomEvent('update', { detail: this.content, bubbles: true, composed: true }));
    }, 300);
  }

  get content() {
    return this.#view ? this.#view.state.doc.toString() : '';
  }

  set content(text) {
    if (!this.#view) return;
    this.#view.dispatch({
      changes: { from: 0, to: this.#view.state.doc.length, insert: text || '' },
    });
  }

  focus() {
    this.#view?.focus();
  }
}

customElements.define('fore-codemirror', ForeCodemirror);
