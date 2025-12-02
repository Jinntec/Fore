// demo-snippet (vanilla, zero dependencies)
// Usage:
// <demo-snippet open>
//   <template>
//     <input type="date" />
//   </template>
// </demo-snippet>
//
// Optional attributes:
//  - open : source panel initially expanded (uses <details>)
//  - run-scripts : execute <script> tags found inside the template (OFF by default)
//
// Events:
//  - dom-ready : fired after the demo content has been stamped into the DOM

class DemoSnippet extends HTMLElement {
  static get observedAttributes() {
    return ['run-scripts'];
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });

    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <style>
        :host { display: block; font: 14px/1.45 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif; color: #222; }
        .wrapper { border: 1px solid rgba(0,0,0,.12); border-radius: 12px; overflow: hidden; background: #fff; }
        .demo { padding: 16px; }
        details { border-top: 1px solid rgba(0,0,0,.08); background: #fafafa; }
        details > summary { cursor: pointer; user-select: none; padding: 10px 14px; outline: none; font-weight: 600; }
        details[open] > summary { border-bottom: 1px solid rgba(0,0,0,.08); background: #f5f5f5; }
        .source { position: relative; }
        pre { margin: 0; padding: 14px; overflow: auto; tab-size: 2; }
        code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12.5px; }
        .toolbar { position: absolute; top: 8px; right: 8px; display: flex; gap: 6px; }
        button { border: 1px solid rgba(0,0,0,.2); background: #fff; border-radius: 8px; padding: 6px 8px; font: inherit; cursor: pointer; }
        button:active { transform: translateY(1px); }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
      </style>
      <div class="wrapper">
        <div part="demo" class="demo"><slot></slot></div>
        <details part="details" class="details">
          <summary>Source</summary>
          <div class="source">
            <div class="toolbar">
              <button part="copy" type="button" title="Copy source" class="copy">Copy</button>
            </div>
            <pre part="pre"><code part="code" class="code"></code></pre>
          </div>
        </details>
      </div>
    `;

    root.appendChild(tpl.content.cloneNode(true));

    this.$demo = root.querySelector('.demo');
    this.$details = root.querySelector('details');
    this.$code = root.querySelector('code');
    this.$copy = root.querySelector('.copy');

    this._boundCopy = () => this.copySource();
    this.$copy.addEventListener('click', this._boundCopy);

    // Keep the demo + code in sync when the light DOM <template> changes
    this._mo = new MutationObserver(recs => {
      // Only respond to mutations that occur within the <template> itself
      for (const r of recs) {
        const t = r.target;
        const n = t && t.nodeType === Node.TEXT_NODE ? t.parentNode : t;
        if (n && n.closest && n.closest('template')) {
          this.refresh();
          break;
        }
      }
    });
  }

  connectedCallback() {
    // Initialize state from attributes
    if (this.hasAttribute('open')) {
      this.$details.setAttribute('open', '');
    } else {
      this.$details.removeAttribute('open');
    }

    // Observe changes to children (e.g., editing the template in dev tools)
    this._attachObserver();

    // First render
    this.refresh();
  }

  disconnectedCallback() {
    this._mo.disconnect();
    this.$copy.removeEventListener('click', this._boundCopy);
  }

  attributeChangedCallback(name) {
    if (name === 'run-scripts') this.refresh();
  }

  /** Public: re-reads the <template>, re-stamps the demo and updates the code block */
  refresh() {
    if (this._isRefreshing) return;
    this._isRefreshing = true;
    try {
      const tpl = this.querySelector('template');
      if (!tpl) {
        this.renderError('No <template> child found.');
        return;
      }

      // Temporarily stop observing to avoid loops while we mutate DOM
      if (this._mo) this._mo.disconnect();

      // Remove previously stamped demo content
      this.querySelectorAll('[data-demo-stamped]').forEach(n => n.remove());

      // Clone & optionally activate scripts
      const frag = tpl.content.cloneNode(true);
^^^      if (this.hasAttribute('run-scripts')) this.activateScripts(frag);

      // Stamp into LIGHT DOM so page CSS applies
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-demo-stamped', '');
      wrapper.style.display = 'contents';
      wrapper.appendChild(frag);
      if (tpl.nextSibling) tpl.parentNode.insertBefore(wrapper, tpl.nextSibling);
      else this.appendChild(wrapper);

      // Render source code
      const raw = this.serializeTemplate(tpl);
      this.$code.textContent = raw;

      // Fire dom-ready for compatibility
      this.dispatchEvent(new CustomEvent('dom-ready', { bubbles: true, composed: true }));
    } finally {
      // Re-attach observer
      this._attachObserver();
      this._isRefreshing = false;
    }
  }

  copySource() {
    const text = this.$code.textContent || '';
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        this.$copy.textContent = 'Copied';
        setTimeout(() => (this.$copy.textContent = 'Copy'), 1200);
      })
      .catch(() => {
        // Fallback if clipboard API is unavailable
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          this.$copy.textContent = 'Copied';
        } catch {
          /* ignore */
        } finally {
          document.body.removeChild(ta);
          setTimeout(() => (this.$copy.textContent = 'Copy'), 1200);
        }
      });
  }

  renderError(msg) {
    // Clear any stamped light-DOM demo content
    this.querySelectorAll('[data-demo-stamped]').forEach(n => n.remove());

    // Stamp an inline error into LIGHT DOM (keep the <slot> intact)
    const tpl = this.querySelector('template');
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-demo-stamped', '');
    wrapper.innerHTML = `<em style="color:#b00020">${this.escapeHTML(msg)}</em>`;
    if (tpl && tpl.nextSibling) tpl.parentNode.insertBefore(wrapper, tpl.nextSibling);
    else this.appendChild(wrapper);

    this.$code.textContent = '';
  }

  _attachObserver() {
    if (!this._mo) return;
    try {
      const tpl = this.querySelector('template');
      if (!tpl) return;
      this._mo.observe(tpl, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });
    } catch (e) {}
  }

  // --- helpers ---

  activateScripts(root) {
    const scripts = root.querySelectorAll('script');
    scripts.forEach(old => {
      const s = document.createElement('script');
      // copy attributes
      for (const { name, value } of old.attributes) s.setAttribute(name, value);
      s.textContent = old.textContent;
      old.replaceWith(s);
    });
  }

  serializeTemplate(tplEl) {
    // Get a string of the template's child HTML
    const container = document.createElement('div');
    container.appendChild(tplEl.content.cloneNode(true));
    let html = container.innerHTML.trim();

    // Normalize whitespace: remove a common leading indent for readability
    html = this.stripCommonIndent(html);

    // Optionally emulate Polymer's demo-snippet behavior of removing empty attribute values
    html = html.replace(/=""/g, '');

    return html;
  }

  stripCommonIndent(str) {
    const lines = str.split(/\r?\n/);
    const nonEmpty = lines.filter(l => l.trim().length);
    const indents = nonEmpty.map(l => l.match(/^\s*/)?.[0].length || 0);
    const min = indents.length ? Math.min(...indents) : 0;
    return lines.map(l => l.slice(min)).join('\n');
  }

  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

customElements.define('demo-snippet', DemoSnippet);

export { DemoSnippet };
