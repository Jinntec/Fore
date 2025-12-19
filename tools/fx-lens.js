/**
 * fx-lens — dependency-less instance viewer (light DOM, tree view)
 *
 * PERFORMANCE:
 * - The tree is only built for instance panels (<details class="instance">) that are OPEN.
 * - Closed instance panels keep their view empty (or a small placeholder) to avoid creating tons of DOM nodes.
 *
 * Features:
 * - No external libraries
 * - Light DOM (no shadow)
 * - XML / HTML / JSON / text instance viewing
 * - Tree view using <ul>/<li> and <details>/<summary> (styleable)
 * - Instance panel open/closed state is persisted across reloads (localStorage: lens-panels-keys)
 * - Optional auto-attach when URL has ?lens or ?inspect
 *
 * URL flags:
 * - ?lens     -> auto-attach and open the lens panel
 * - ?inspect  -> same as lens (kept for compatibility)
 */

export class FxLens extends HTMLElement {
  constructor() {
    super();

    this.isResizing = false;
    this.lastX = 0;
    this.lastWidth = 0;

    this._initDone = false;
    this._boundFores = new WeakSet();

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._init = this._init.bind(this);
  }

  connectedCallback() {
    if (this._initDone) return;
    this._initDone = true;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this._init, { once: true });
    } else {
      this._init();
    }
  }

  disconnectedCallback() {
    document.removeEventListener('DOMContentLoaded', this._init);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
  }

  _hasUrlFlag() {
    const p = new URLSearchParams(location.search);
    return p.has('lens') || p.has('inspect');
  }

  _init() {
    this._hookFores();
    this.render();
  }

  _hookFores() {
    const fores = Array.from(document.querySelectorAll('fx-fore'));
    fores.forEach(fore => {
      if (this._boundFores.has(fore)) return;
      this._boundFores.add(fore);

      fore.addEventListener('ready', () => this.render());

      // Refresh signals (from legacy fx-lens)
      fore.addEventListener('value-changed', ev => {
        this.update(false);
        ev.preventDefault();
      });
      fore.addEventListener('deleted', () => this.update(false));
      fore.addEventListener('insert', () => this.update(false));
      fore.addEventListener('index-changed', () => this.update(false));
      fore.addEventListener('submit', () => this.update(false));
      fore.addEventListener('submit-done', () => this.update(false));
      fore.addEventListener('submit-error', () => this.update(false));
      fore.addEventListener('optional', () => this.update(false));
      fore.addEventListener('required', () => this.update(false));
      fore.addEventListener('readonly', () => this.update(false));
      fore.addEventListener('readwrite', () => this.update(false));
      fore.addEventListener('relevant', () => this.update(false));
      fore.addEventListener('nonrelevant', () => this.update(false));
      fore.addEventListener('valid', () => this.update(false));
      fore.addEventListener('invalid', () => this.update(false));
    });

    // If fores are added later, re-scan on capturing ready
    document.addEventListener(
      'ready',
      ev => {
        if (ev?.target?.tagName === 'FX-FORE') this._hookFores();
      },
      true,
    );
  }

  render() {
    const style = `
      fx-lens{
        position:fixed;
        display:block;
        top:0;
        right:0;
        bottom:0;
        height:100vh;
        width:var(--inspector-handle-width, 28px);
        overflow:hidden;
        z-index:900;
        max-width:calc(100vw - var(--inspector-handle-width, 28px));
        min-width:var(--inspector-handle-width, 28px);
        box-shadow:-2px -2px 8px rgba(0,0,0,0.3);
        font:12px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
        color:#111;
        background:aliceblue;
      }
      fx-lens[open]{ width:40vw; }
      fx-lens .main{
        padding-left:var(--inspector-handle-width, 28px);
        height:100vh;
        overflow:hidden;
        background:ghostwhite;
      }
      fx-lens .main > div{
        height:100vh;
        overflow:auto;
      }

      fx-lens .handle{
        display:flex;
        justify-content:center;
        height:100%;
        width:var(--inspector-handle-width, 28px);
        background:var(--inspector-handle-bg, #3b3b3b);
        position:absolute;
        left:0;
        color:white;
        cursor:pointer;
        z-index:800;
      }
      fx-lens .handle::before{
        content:'Data Lens';
        white-space:nowrap;
        transform:rotate(-90deg);
        display:inline-block;
        position:absolute;
        left:-85px;
        width:200px;
        top:-1rem;
        z-index:801;
      }
      fx-lens .handle a,
      fx-lens .handle a:visited,
      fx-lens .handle a:link{
        text-decoration:none;
        color:white;
        width:1.5rem;
        height:1.5rem;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        position:absolute;
        z-index:850;
      }

      fx-lens details.instance summary{
        font-size:1.05rem;
        background:ghostwhite;
        padding:0.5rem;
        border-bottom:1px solid rgba(0,0,0,0.08);
        user-select:none;
          padding:0.25rem 0.5rem;
      }
      fx-lens details.instance > summary {
          background: #2196f3;
          color: white;
      }
      fx-lens details summary::marker{
        color:#2196f3;
      }
      fx-lens .instance-view{
        margin:0;
        padding:0.5rem 0.5rem 1rem 1.5rem;
        overflow:auto;
        background:white;
        border-bottom:1px solid rgba(0,0,0,0.06);
      }

      /* Tree */
      fx-lens .tree{
        font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
      }
      fx-lens .tree ul{
        list-style:none;
        margin:0;
        padding-left:1rem;
        border-left:1px solid rgba(0,0,0,0.10);
      }
      fx-lens .tree li{
        margin:0;
      }
      fx-lens .tree details > summary{
        cursor:pointer;
        user-select:none;
        background:#e3f2fd;
      }
      fx-lens details > summary::marker{
        color:#1976d2;
      }
      fx-lens .tree .k{ color:#0b5394; }
      fx-lens .tree .t{ color:#38761d; }
      fx-lens .tree .v{ 
        color:#444;
        font-size:0.9rem; 
      }
      fx-lens .tree .muted{ color:#777; }

      /* Placeholder for closed instance panels */
      fx-lens .placeholder{
        color:#777;
        font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
        padding:0.5rem 0;
      }

      /* Resizer */
      fx-lens .resizer{
        width:0.25rem;
        height:100vh;
        background:rgba(215,220,235,0.3);
        cursor:ew-resize;
        position:absolute;
        top:0;
        left:0;
        z-index:999;
      }
    `;

    const instances = Array.from(document.querySelectorAll('fx-instance'));

    this.innerHTML = `
      <style>${style}</style>
      <div class="main">
        <div class="resizer" title="resize"></div>
        <div class="handle" title="toggle"><a href="#" id="reset" title="reset panel state to defaults">&#x2715;</a></div>
        <div id="instances">${this._renderInstances(instances)}</div>
      </div>
    `;

    // Lens panel open/close persistence
    const lensWidth = localStorage.getItem('lens-width');
    const opened = localStorage.getItem('lens-open');
    const shouldAutoOpen = this._hasUrlFlag();

    if (opened != null) {
      if (opened === 'true') {
        this.setAttribute('open', 'open');
        if (lensWidth) this.style.width = `${lensWidth}px`;
      } else {
        this.removeAttribute('open');
        this.removeAttribute('style');
      }
    } else if (shouldAutoOpen) {
      this.setAttribute('open', 'open');
    } else {
      this.removeAttribute('open');
      this.removeAttribute('style');
    }

    // Toggle open/close for the whole lens panel
    const handle = this.querySelector('.handle');
    handle?.addEventListener('click', () => {
      if (this.hasAttribute('open')) {
        this.removeAttribute('open');
        this.removeAttribute('style');
        localStorage.setItem('lens-open', 'false');
      } else {
        this.setAttribute('open', 'open');
        if (lensWidth) this.style.width = `${lensWidth}px`;
        localStorage.setItem('lens-open', 'true');
        // When opening the panel, render open instances only
        this.update(false);
      }
    });

    // Reset local state
    const reset = this.querySelector('#reset');
    reset?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      localStorage.removeItem('lens-width');
      localStorage.removeItem('lens-open');
      localStorage.removeItem('lens-panels-keys');
      this.removeAttribute('open');
      this.removeAttribute('style');
    });

    // Apply instance open state from storage BEFORE we build any trees
    const openKeys = this._readOpenInstanceKeys();
    const instanceDetails = Array.from(this.querySelectorAll('details.instance'));
    instanceDetails.forEach(d => {
      const k = d.getAttribute('data-key');
      if (k && openKeys.includes(k)) d.setAttribute('open', 'open');
      else d.removeAttribute('open');
    });

    // Persist instance open state + (lazy) build tree only when opened
    instanceDetails.forEach(d => {
      d.addEventListener('toggle', () => {
        const k = d.getAttribute('data-key');
        if (!k) return;

        const current = this._readOpenInstanceKeys();
        const idx = current.indexOf(k);
        const isOpen = d.hasAttribute('open');

        if (isOpen && idx === -1) current.push(k);
        if (!isOpen && idx !== -1) current.splice(idx, 1);

        localStorage.setItem('lens-panels-keys', JSON.stringify(current));

        // Build/clear tree depending on state
        if (isOpen) {
          this._renderInstancePanelIfNeeded(d, /* force */ true);
        } else {
          this._clearInstancePanel(d);
        }
      });
    });

    // Start with minimal DOM: only render open instance panels
    this.update(false);

    // Resizing handlers
    this.resizer = this.querySelector('.resizer');
    this.resizer?.addEventListener('mousedown', event => {
      this.isResizing = true;
      this.lastX = event.clientX;
      this.lastWidth = this.offsetWidth;
      document.addEventListener('mousemove', this._onMouseMove);
      document.addEventListener('mouseup', this._onMouseUp);
    });
  }

  _readOpenInstanceKeys() {
    try {
      const v = JSON.parse(localStorage.getItem('lens-panels-keys') || '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }

  _onMouseMove(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isResizing) return;
    const delta = event.clientX - this.lastX;
    this.style.width = `${this.lastWidth - delta}px`;
  }

  _onMouseUp(event) {
    event.preventDefault();
    event.stopPropagation();
    this.isResizing = false;
    this.lastX = event.clientX;
    this.lastWidth = this.offsetWidth;

    if (this.hasAttribute('open')) {
      localStorage.setItem('lens-width', String(this.lastWidth));
    }

    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
  }

  _renderInstances(instances) {
    const fores = Array.from(document.querySelectorAll('fx-fore'));
    return instances
      .map((instance, index) => {
        const fore = instance.closest('fx-fore');
        const foreId = fore?.id || `fx-fore-${fores.indexOf(fore)}`;
        const instId = instance.getAttribute('id') || 'default';
        const key = `${foreId}#${instId}`;

        return `
          <details id="d${index}" class="instance" data-key="${key}">
            <summary>${key}</summary>
            <div class="instance-view tree" data-key="${key}"></div>
          </details>
        `;
      })
      .join('');
  }

  update(forceRebuild = false) {
    try {
      // If the whole lens panel is closed, do nothing (keep DOM minimal)
      if (!this.hasAttribute('open')) return;

      const instances = Array.from(document.querySelectorAll('fx-instance'));
      const views = Array.from(this.querySelectorAll('.instance-view'));

      if (!instances.length) return;

      if (forceRebuild || instances.length !== views.length) {
        const container = this.querySelector('#instances');
        if (!container) return;
        container.innerHTML = this._renderInstances(instances);

        // Re-apply open state after rebuild
        const openKeys = this._readOpenInstanceKeys();
        const instanceDetails = Array.from(this.querySelectorAll('details.instance'));
        instanceDetails.forEach(d => {
          const k = d.getAttribute('data-key');
          if (k && openKeys.includes(k)) d.setAttribute('open', 'open');
          else d.removeAttribute('open');
        });

        // Rebind toggle listeners after rebuild
        instanceDetails.forEach(d => {
          d.addEventListener('toggle', () => {
            const k = d.getAttribute('data-key');
            if (!k) return;

            const current = this._readOpenInstanceKeys();
            const idx = current.indexOf(k);
            const isOpen = d.hasAttribute('open');

            if (isOpen && idx === -1) current.push(k);
            if (!isOpen && idx !== -1) current.splice(idx, 1);

            localStorage.setItem('lens-panels-keys', JSON.stringify(current));

            if (isOpen) this._renderInstancePanelIfNeeded(d, true);
            else this._clearInstancePanel(d);
          });
        });
      }

      const byKey = new Map(
        Array.from(this.querySelectorAll('details.instance')).map(d => [
          d.getAttribute('data-key') || '',
          d,
        ]),
      );

      // Only render trees for OPEN instance panels
      const fores = Array.from(document.querySelectorAll('fx-fore'));
      for (const inst of instances) {
        const fore = inst.closest('fx-fore');
        const foreId = fore?.id || `fx-fore-${fores.indexOf(fore)}`;
        const instId = inst.getAttribute('id') || 'default';
        const key = `${foreId}#${instId}`;

        const detailsEl = byKey.get(key);
        if (!detailsEl) continue;

        if (detailsEl.hasAttribute('open')) {
          // force refresh on updates
          this._renderInstancePanelIfNeeded(detailsEl, true, inst);
        } else {
          // keep minimal; clear if previously rendered
          this._clearInstancePanel(detailsEl);
        }
      }
    } catch (err) {
      console.warn('[fx-lens] update(): failed, but safely ignored:', err);
    }
  }

  _renderInstancePanelIfNeeded(detailsEl, force = false, inst = null) {
    const view = detailsEl.querySelector('.instance-view');
    if (!view) return;

    // If no instance was passed, look it up
    let instanceEl = inst;
    if (!instanceEl) {
      const key = detailsEl.getAttribute('data-key');
      if (!key) return;
      instanceEl = this._findInstanceByKey(key);
      if (!instanceEl) return;
    }

    const already = view.getAttribute('data-rendered') === '1';
    if (already && !force) return;

    // Build the tree (can be expensive, but only for open instances)
    view.replaceChildren(this._buildInstanceTree(instanceEl));
    view.setAttribute('data-rendered', '1');
  }

  _clearInstancePanel(detailsEl) {
    const view = detailsEl.querySelector('.instance-view');
    if (!view) return;
    if (view.getAttribute('data-rendered') !== '1') {
      // ensure a tiny placeholder (optional)
      if (!view.childNodes.length) {
        const p = document.createElement('div');
        p.className = 'placeholder';
        p.textContent = '(open panel to render)';
        view.appendChild(p);
      }
      return;
    }
    view.replaceChildren();
    const p = document.createElement('div');
    p.className = 'placeholder';
    p.textContent = '(open panel to render)';
    view.appendChild(p);
    view.setAttribute('data-rendered', '0');
  }

  _findInstanceByKey(key) {
    // key = `${foreId}#${instanceId}`
    const [foreId, instId] = String(key).split('#');
    let fore = null;

    if (foreId) {
      fore = document.getElementById(foreId);
      if (!fore || fore.tagName !== 'FX-FORE') fore = null;
    }

    if (fore) {
      const inst = fore.querySelector(`fx-instance#${CSS.escape(instId || 'default')}`);
      if (inst) return inst;
      // fallback: default instance without id
      if ((instId || 'default') === 'default')
        return fore.querySelector('fx-instance:not([id])') || null;
      return null;
    }

    // Fallback search (less ideal but robust)
    if ((instId || 'default') === 'default') {
      return (
        document.querySelector('fx-instance:not([id])') ||
        document.querySelector('fx-instance') ||
        null
      );
    }
    return document.querySelector(`fx-instance#${CSS.escape(instId)}`) || null;
  }

  // ---------- TREE BUILDERS (same as before) ----------

  _buildInstanceTree(inst) {
    const raw = inst.instanceData;
    const t = (inst.getAttribute('type') || inst.type || 'xml').toLowerCase();

    const root = document.createElement('div');

    if (raw == null) {
      root.appendChild(this._textLine('(empty)', 'muted'));
      return root;
    }

    if (t === 'json') {
      let jsonVal = raw;
      if (typeof raw === 'string') {
        try {
          jsonVal = JSON.parse(raw);
        } catch {
          root.appendChild(this._textLine(raw, 'v'));
          return root;
        }
      }
      root.appendChild(this._jsonNode('(root)', jsonVal));
      return root;
    }

    if (t === 'text') {
      root.appendChild(this._textLine(String(raw), 'v'));
      return root;
    }

    // HTML: Fore stores HTMLCollection in instanceData; show wrapper/root from markup when available
    if (t === 'html') {
      const wrapper = inst.firstElementChild;
      if (wrapper) {
        root.appendChild(this._xmlElementNode(wrapper, false));
      } else if (raw && typeof raw.length === 'number') {
        const ul = document.createElement('ul');
        for (const n of Array.from(raw)) {
          const li = document.createElement('li');
          if (n && n.nodeType === 1) li.appendChild(this._xmlElementNode(n, false));
          else li.appendChild(this._textLine(String(n), 'v'));
          ul.appendChild(li);
        }
        root.appendChild(ul);
      } else {
        root.appendChild(this._textLine(String(raw), 'v'));
      }
      return root;
    }

    // XML nodes: Document/Element/Fragment
    const isNode =
      raw &&
      typeof raw === 'object' &&
      (raw.nodeType === 1 || raw.nodeType === 9 || raw.nodeType === 11);

    if (isNode) {
      const node = raw.nodeType === 9 ? raw.documentElement : raw;
      if (node) root.appendChild(this._xmlElementNode(node, false));
      else root.appendChild(this._textLine('(no documentElement)', 'muted'));
      return root;
    }

    root.appendChild(this._textLine(String(raw), 'v'));
    return root;
  }

  _textLine(text, cls = '') {
    const div = document.createElement('div');
    if (cls) div.classList.add(cls);
    div.textContent = text;
    return div;
  }

  _span(text, cls) {
    const s = document.createElement('span');
    s.className = cls;
    s.textContent = text;
    return s;
  }

  _details(summaryParts, bodyEl, open = true) {
    const d = document.createElement('details');
    if (open) d.setAttribute('open', 'open');
    const s = document.createElement('summary');
    for (const p of summaryParts) s.appendChild(p);
    d.appendChild(s);
    d.appendChild(bodyEl);
    return d;
  }

  _jsonNode(label, value) {
    const isArr = Array.isArray(value);
    const isObj = value && typeof value === 'object' && !isArr;

    if (!isObj && !isArr) {
      const line = document.createElement('div');
      line.appendChild(this._span(`${label}: `, 'k'));
      line.appendChild(this._span(String(value), 'v'));
      return line;
    }

    const ul = document.createElement('ul');

    if (isArr) {
      for (let i = 0; i < value.length; i++) {
        const li = document.createElement('li');
        li.appendChild(this._jsonNode(`[${i}]`, value[i]));
        ul.appendChild(li);
      }
      return this._details(
        [this._span(label, 'k'), this._span(' ', ''), this._span(`[array ${value.length}]`, 't')],
        ul,
        true,
      );
    }

    for (const [k, v] of Object.entries(value)) {
      const li = document.createElement('li');
      li.appendChild(this._jsonNode(k, v));
      ul.appendChild(li);
    }

    return this._details([this._span(label, 'k'), this._span(' {object}', 't')], ul, true);
  }

  _xmlElementNode(el, open = false) {
    if (!el || el.nodeType !== 1) return this._textLine(String(el), 'v');

    const attrs = [];
    if (el.attributes && el.attributes.length) {
      for (const a of Array.from(el.attributes)) {
        attrs.push(` ${a.name}="${a.value}"`);
      }
    }

    const summaryParts = [
      this._span('<', 'muted'),
      this._span(el.tagName.toLowerCase(), 'k'),
      this._span(attrs.join(''), 'v'),
      this._span('>', 'muted'),
    ];

    const ul = document.createElement('ul');

    for (const n of Array.from(el.childNodes || [])) {
      if (n.nodeType === 3) {
        const txt = (n.nodeValue || '').replace(/\s+/g, ' ').trim();
        if (txt) {
          const li = document.createElement('li');
          li.appendChild(this._span(txt, 'v'));
          ul.appendChild(li);
        }
      } else if (n.nodeType === 1) {
        const li = document.createElement('li');
        li.appendChild(this._xmlElementNode(n, false));
        ul.appendChild(li);
      } else if (n.nodeType === 8) {
        const li = document.createElement('li');
        li.appendChild(this._span(`<!-- ${n.nodeValue || ''} -->`, 'muted'));
        ul.appendChild(li);
      }
    }

    if (!ul.childNodes.length) {
      const li = document.createElement('li');
      li.appendChild(this._span('(empty)', 'muted'));
      ul.appendChild(li);
    }

    return this._details(summaryParts, ul, true);
  }
}

if (!customElements.get('fx-lens')) {
  customElements.define('fx-lens', FxLens);
}

// Optional auto-attach: if URL has ?lens or ?inspect and no <fx-lens> exists, append one.
(function autoAttach() {
  const p = new URLSearchParams(location.search);
  const shouldAttach = p.has('lens') || p.has('inspect');
  if (!shouldAttach) return;

  const attach = () => {
    if (document.querySelector('fx-lens')) return;
    document.body.appendChild(document.createElement('fx-lens'));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach, { once: true });
  } else {
    attach();
  }
})();
