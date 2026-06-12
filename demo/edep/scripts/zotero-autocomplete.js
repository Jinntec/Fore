/*
 Light-DOM web component with Fore-friendly events & multiline overlay
 */
class ZoteroAutocomplete extends HTMLElement {
    static get observedAttributes() {
        return ['endpoint', 'tag', 'limit', 'debounce', 'value', 'name', 'wait-ready'];
    }

    constructor() {
        super();
        // state
        this.fore = {};
        this._items = [];
        this._active = -1;
        this._selected = null;
        this._debounceMs = 250;
        this._minlen = 2;
        this._uidBase = Math.random().toString(36).slice(2);
        this._value = ''; // Fore-facing value (TAG)
        this._deferUntilReady = this.hasAttribute('wait-ready');
        this._ready = !this._deferUntilReady;
        this._pendingValue = null; // value set before ready is fired
        this._readyHandler = null;

        // light DOM markup
        this.classList.add('za');
        if (!this.querySelector('input')) {
            this.innerHTML = `
        <div class="za-field">
          <input class="za-input" type="text" autocomplete="off" aria-autocomplete="list"
                 aria-expanded="false" aria-controls="za-list-${this._uidBase}"
                 placeholder="Search references…">
          <div class="za-overlay" aria-hidden="true"></div>
          <button type="button" class="za-clear" aria-label="Clear" title="Clear">×</button>
        </div>
        <ul class="za-list" id="za-list-${this._uidBase}" role="listbox"></ul>
      `;
        }

        // refs
        this.$field = this.querySelector('.za-field');
        this.$input = this.querySelector('.za-input') || this.querySelector('input');
        this.$overlay = this.querySelector('.za-overlay');
        this.$clear = this.querySelector('.za-clear');
        this.$list = this.querySelector('.za-list');

        // handlers
        this._onInput = this._debounce(this._handleInput.bind(this), this._debounceMs);
        this._onKeyInput = this._handleKeyOnInput.bind(this);
        this._onKeyItem = this._handleKeyOnItem.bind(this);
        this._onClick = this._handleClick.bind(this);
        this._onBlur = this._handleBlur.bind(this);
        this._onFocus = this._handleFocus.bind(this);
        this._onClear = this._handleClear.bind(this);
    }

    connectedCallback() {
        // config (initial — may be template, re-read on 'ready' if deferred)
        this._endpoint = this.getAttribute('endpoint') || '/api/zotero/items/suggest';
        this._tag = this.getAttribute('tag') || '';
        this._limit = parseInt(this.getAttribute('limit') || '8', 10);
        this._minlen = parseInt(this.getAttribute('minlength') || String(this._minlen), 10);
        this._debounceMs = parseInt(this.getAttribute('debounce') || String(this._debounceMs), 10);
        this._deferUntilReady = this.hasAttribute('wait-ready');
        this._ready = !this._deferUntilReady;

        // listeners
        this.$input.addEventListener('input', this._onInput);
        this.$input.addEventListener('keydown', this._onKeyInput);
        this.$list.addEventListener('mousedown', this._onClick);
        this.$list.addEventListener('keydown', this._onKeyItem);
        this.addEventListener('focusout', this._onBlur);
        this.addEventListener('focusin', this._onFocus);
        this.$clear.addEventListener('click', this._onClear);

        // optional name passthrough
        const nameAttr = this.getAttribute('name');
        if (nameAttr) this.$input.name = nameAttr;

        if (this._deferUntilReady) {
            // wait for Fore to resolve template attributes & models
            this._readyHandler = () => this._onReadyOnce();
            document.addEventListener('ready', this._readyHandler, { once: true });
            // document.addEventListener('model-construct-done', this._readyHandler, { once: true });

            // If a preset value is already present, stash it so we can resolve after 'ready'
            const initVal = this.getAttribute('value');
            if (initVal) {
                this._pendingValue = String(initVal).trim();
                // provide a harmless placeholder so users see *something* before ready
                this.$input.value = this._pendingValue;
                this._showOverlay(this._pendingValue);
                this._toggleClear();
            }
        } else {
            // normal immediate init
            queueMicrotask(() => this._notifyValueChanged());
            const initVal = this.getAttribute('value');
            if (initVal) this.value = initVal;
        }
    }

    disconnectedCallback() {
        this.$input.removeEventListener('input', this._onInput);
        this.$input.removeEventListener('keydown', this._onKeyInput);
        this.$list.removeEventListener('mousedown', this._onClick);
        this.$list.removeEventListener('keydown', this._onKeyItem);
        this.removeEventListener('focusout', this._onBlur);
        this.removeEventListener('focusin', this._onFocus);
        this.$clear.removeEventListener('click', this._onClear);
        if (this._readyHandler) {
            document.removeEventListener('ready', this._readyHandler);
            // document.removeEventListener('model-construct-done', this._readyHandler);
            this._readyHandler = null;
        }
    }

    attributeChangedCallback(name, _old, value) {
        if (!this.isConnected) return;
        if (name === 'endpoint') this._endpoint = value || this._endpoint;
        if (name === 'tag') this._tag = value || '';
        if (name === 'limit') this._limit = parseInt(value || '8', 10);
        if (name === 'minlength') this._minlen = parseInt(value || '2', 10);
        if (name === 'debounce') {
            this._debounceMs = parseInt(value || '250', 10);
            this.$input?.removeEventListener('input', this._onInput);
            this._onInput = this._debounce(this._handleInput.bind(this), this._debounceMs);
            this.$input?.addEventListener('input', this._onInput);
        }
        if (name === 'name' && value) this.$input.name = value;
        if (name === 'wait-ready') this._deferUntilReady = this.hasAttribute('wait-ready');

        if (name === 'value' && value !== this.value) {
            // If deferring, just stash it until ready
            if (this._deferUntilReady && !this._ready) {
                this._pendingValue = String(value || '').trim();
                // lightweight placeholder (no network before ready)
                this.$input.value = this._pendingValue;
                this._showOverlay(this._pendingValue);
                this._toggleClear();
            } else {
                this.value = value || '';
            }
        }
    }

    // Called once when Fore emits 'ready' (or 'model-construct-done')
    _onReadyOnce() {
        this._ready = true;
        // re-read endpoint after template resolution
        this._endpoint = this.getAttribute('endpoint') || this._endpoint;

        // Prefer pending value set via property/attribute before ready; else attribute value
        const start =
            (this._pendingValue && this._pendingValue.trim()) ||
            (this.getAttribute('value') && this.getAttribute('value').trim()) ||
            '';

        if (start) {
            // Apply now with full resolution (fetch bib if needed)
            this._pendingValue = null;
            this.value = start;
        } else {
            this._notifyValueChanged();
        }
        // cleanup listeners
        if (this._readyHandler) {
            document.removeEventListener('ready', this._readyHandler);
            document.removeEventListener('model-construct-done', this._readyHandler);
            this._readyHandler = null;
        }
    }

    /* ===== Fore contract ===== */
    get value() {
        // VALUE IS THE TAG (not the visible text)
        return this._value || '';
    }
    set value(v) {
        // v is TAG
        const tag = String(v || '').trim();
        if (!tag) {
            this.clear();
            this._notifyValueChanged();
            return;
        }

        // If we’re deferring and not ready yet, just stage and show placeholder (no fetch)
        if (this._deferUntilReady && !this._ready) {
            this._pendingValue = tag;
            this._value = tag;
            this.$input.dataset.tag = tag;
            this.$input.value = tag;
            this._showOverlay(tag);
            this._toggleClear();
            // Do not notify yet; Fore will sync on ready
            return;
        }

        // store tag as the component value (ready path)
        this._value = tag;
        this.$input.dataset.tag = tag;

        this._selected = { tag, title: '', bib: '' };

        // resolve bib using local cache first, then single request by tag
        this._fetchBib(tag)
            .then(html => {
                this._selected.bib = html || '';
                const plain = this._stripHtml(html || '') || '';
                // show something human-friendly; we only know the tag here
                this.$input.value = plain || tag;
                this._showOverlay(html || plain || tag);
                this._setTagHints(tag);
                this._toggleClear();
                this._notifyValueChanged();
            })
            .catch(() => {
                this.$input.value = tag;
                this._showOverlay(tag);
                this._setTagHints(tag);
                this._toggleClear();
                this._notifyValueChanged();
            });
    }
    setValue(v) {
        this.value = v;
    }
    getValue() {
        return this.value;
    }

    _notifyValueChanged() {
        const val = this.value;
        if (val) this.setAttribute('value', val);
        else this.removeAttribute('value');

        const opts = { bubbles: true, composed: true };
        const withDetail = name => new CustomEvent(name, { ...opts, detail: { value: val } });

        // fire on host ONLY (avoid inner input events that expose human text)
        this.dispatchEvent(new Event('input', opts));
        this.dispatchEvent(new Event('change', opts));
        this.dispatchEvent(withDetail('value-changed'));
    }

    /* ===== public helpers ===== */
    get selected() {
        return this._selected || null;
    }
    clear() {
        this._value = '';
        this._pendingValue = null;
        this.$input.value = '';
        this.$input.dataset.tag = '';
        this._selected = null;
        this._render([]);
        this._hideOverlay();
        this._toggleClear();
    }

    _setTagHints(tag) {
        const t = tag && String(tag).trim() ? `tag: ${tag.trim()}` : '';
        if (this.$overlay) {
            if (t) {
                this.$overlay.setAttribute('title', t);
                this.$overlay.setAttribute('aria-label', t);
            } else {
                this.$overlay.removeAttribute('title');
                this.$overlay.removeAttribute('aria-label');
            }
        }
        if (this.$input) {
            if (t) this.$input.setAttribute('title', t);
            else this.$input.removeAttribute('title');
        }
    }

    /* ===== input/search ===== */
    async _handleInput(e) {
        // ignore synthetic input events (Fore/programmatic) to prevent overlay flicker
        if (e && e.isTrusted === false) return;

        const q = e.target.value.trim();

        // real typing → drop selection & overlay and notify empty value
        if (this._selected) {
            this._selected = null;
            this._value = '';
            this.$input.dataset.tag = '';
            this._hideOverlay();
            this._notifyValueChanged();
        }
        this._toggleClear();

        if (q.length < this._minlen) {
            this._render([]);
            return;
        }

        try {
            const url = new URL(this._endpoint, window.location.href);
            url.searchParams.set('q', q);
            if (this._tag) url.searchParams.set('tag', this._tag);
            if (this._limit) url.searchParams.set('limit', String(this._limit));
            const res = await fetch(url.toString(), { credentials: 'include' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();

            // Robust mapping: pull tag from several possible shapes
            const firstTag = obj => {
                if (!obj) return '';
                if (typeof obj.tag === 'string') return obj.tag;
                if (Array.isArray(obj.tags) && obj.tags.length && typeof obj.tags[0]?.tag === 'string')
                    return obj.tags[0].tag;
                if (
                    obj.data &&
                    Array.isArray(obj.data.tags) &&
                    obj.data.tags.length &&
                    typeof obj.data.tags[0]?.tag === 'string'
                )
                    return obj.data.tags[0].tag;
                if (typeof obj.topTag === 'string') return obj.topTag;
                if (typeof obj.matchTag === 'string') return obj.matchTag;
                return '';
            };

            let list = (Array.isArray(data) ? data : data.items || [])
                .map(it => ({
                    key: it.key || it.data?.key || '',
                    tag: (it.tag || firstTag(it) || '').trim(),
                    title: it.title || it.data?.title || '',
                    bib: it.bib || it.html || '',
                }))
                .filter(x => x.tag);

            // If no bib included, fetch snippets for visible set (by TAG)
            if (list.length && !list[0].bib) {
                const limited = list.slice(0, this._limit);
                const htmls = await Promise.all(
                    limited.map(i => (i.tag ? this._fetchBib(i.tag).catch(() => '') : Promise.resolve(''))),
                );
                limited.forEach((i, idx) => (i.bib = htmls[idx] || this._escape(i.title || i.tag || '[untitled]')));
                list = limited;
            }
            this._render(list);
        } catch (err) {
            console.error('[zotero-autocomplete] suggest error:', err);
            this._render([]);
        }
    }

    // Local helper: read bib from current rendered items (no network)
    _getBib(id) {
        const needle = (id || '').trim().toLowerCase();
        if (!needle) return '';

        const items = Array.isArray(this._items) ? this._items : [];
        const hit = items.find(it => {
            const tag = (it && it.tag ? String(it.tag) : '').trim().toLowerCase();
            const key = (it && it.key ? String(it.key) : '').trim().toLowerCase();
            return (tag && tag === needle) || (key && key === needle);
        });

        return hit && typeof hit.bib === 'string' ? hit.bib : '';
    }

    // Use cached suggestions first; if not found (preset value), resolve once by TAG
    async _fetchBib(id) {
        const local = this._getBib(id);
        if (local) return local;

        const tag = (id || '').trim();
        if (!tag) return '';

        try {
            const url = new URL(this._endpoint, document.baseURI);
            url.searchParams.set('tag', tag);
            url.searchParams.set('limit', '1');

            const resp = await fetch(url.toString(), {
                headers: { Accept: 'application/json' },
                credentials: 'include',
            });
            if (!resp.ok) return '';

            const arr = await resp.json();
            return Array.isArray(arr) && arr.length && typeof arr[0].bib === 'string' ? arr[0].bib : '';
        } catch (_) {
            return '';
        }
    }

    /* ===== render list ===== */
    _render(items) {
        this._items = items;
        this._active = -1;
        this.$list.innerHTML = '';
        if (!items.length) {
            this.$list.classList.remove('is-open');
            this.$input.setAttribute('aria-expanded', 'false');
            return;
        }

        items.forEach((it, idx) => {
            const id = `${this._uidBase}-opt-${idx}`;
            const li = document.createElement('li');
            li.className = 'za-item';
            li.id = id;
            li.setAttribute('role', 'option');
            li.setAttribute('data-idx', String(idx));
            li.setAttribute('data-tag', it.tag || '');
            li.tabIndex = -1;
            li.innerHTML = `<div class="za-bib">${it.bib || this._escape(it.title || it.tag || '[untitled]')}</div>`;
            li.addEventListener('mouseenter', () => this._setActive(idx, true));
            this.$list.appendChild(li);
        });

        this.$list.classList.add('is-open');
        this.$input.setAttribute('aria-expanded', 'true');
        this.$input.setAttribute('aria-activedescendant', '');
        this._toggleClear();
    }

    /* ===== keyboard ===== */
    _handleKeyOnInput(e) {
        const hasMenu = this._items.length > 0;
        if (!hasMenu && e.key === 'Tab') return;
        switch (e.key) {
            case 'ArrowDown':
                if (hasMenu) {
                    e.preventDefault();
                    this._focusItem(0);
                }
                break;
            case 'Tab':
                if (hasMenu && !e.shiftKey) {
                    e.preventDefault();
                    this._focusItem(0);
                }
                break;
            case 'Escape':
                this._render([]);
                break;
        }
    }

    _handleKeyOnItem(e) {
        const li = e.target.closest('.za-item');
        if (!li) return;
        const idx = parseInt(li.getAttribute('data-idx') || '-1', 10);
        if (idx < 0) return;
        const last = this._items.length - 1;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this._focusItem(Math.min(last, idx + 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (idx === 0) {
                    this.$input.focus();
                    this._setActive(-1, true);
                } else this._focusItem(idx - 1);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this._choose(idx);
                break;
            case 'Tab':
                if (!e.shiftKey) {
                    e.preventDefault();
                    this._choose(idx);
                }
                break;
            case 'Escape':
                this._render([]);
                this.$input.focus();
                break;
        }
    }

    /* ===== mouse ===== */
    _handleClick(e) {
        const li = e.target.closest('.za-item');
        if (!li) return;
        const idx = parseInt(li.getAttribute('data-idx') || '-1', 10);
        if (idx >= 0) this._choose(idx);
    }

    /* ===== focus/blur ===== */
    _handleBlur(e) {
        const related = e.relatedTarget;
        if (!this.contains(related)) this._render([]);
    }
    _handleFocus() {
        // if overlay is active, ensure no text selection band is visible
        if (this.$field?.classList.contains('has-overlay')) {
            const len = this.$input.value.length;
            try {
                this.$input.setSelectionRange(len, len);
            } catch (_) {}
        }

        const q = this.$input.value.trim();
        if (q.length >= this._minlen && this._items.length) {
            this.$list.classList.add('is-open');
            this.$input.setAttribute('aria-expanded', 'true');
        }
        this._toggleClear();
    }

    /* ===== clear ===== */
    _handleClear() {
        this.clear();
        this._notifyValueChanged(); // Fore: value -> ""
        this.$input.focus();
    }

    /* ===== overlay ===== */
    _showOverlay(htmlOrText) {
        if (!this.$overlay) return;
        this.$overlay.innerHTML = htmlOrText || '';
        this.$field?.classList.toggle('has-overlay', !!htmlOrText);
    }
    _hideOverlay() {
        if (!this.$overlay) return;
        this.$overlay.innerHTML = '';
        this.$field?.classList.remove('has-overlay');
    }

    /* ===== selection ===== */
    _setActive(idx, noFocus = false) {
        const items = Array.from(this.$list.children);
        items.forEach(el => {
            el.setAttribute('aria-selected', 'false');
        });
        this._active = idx;
        if (idx >= 0 && items[idx]) {
            items[idx].setAttribute('aria-selected', 'true');
            this.$input.setAttribute('aria-activedescendant', items[idx].id || '');
            if (!noFocus) items[idx].focus({ preventScroll: false });
            items[idx].scrollIntoView({ block: 'nearest' });
        } else {
            this.$input.setAttribute('aria-activedescendant', '');
        }
    }
    _focusItem(idx) {
        this._setActive(idx);
    }

    _choose(idx) {
        const item = this._items[idx];
        if (!item) return;

        // Store selection
        this._selected = item;
        const plain = this._stripHtml(item.bib) || item.title || item.tag || '';
        this.$input.value = plain;

        // VALUE MUST BE TAG (not key, not title)
        this._value = (item.tag || '').trim();
        this.$input.dataset.tag = this._value;

        this._render([]); // hide menu
        this._showOverlay(item.bib || plain);
        this._setTagHints(this._value);
        this._toggleClear();

        // Fore: emit (value == tag)
        this._notifyValueChanged();
        this.dispatchEvent(
            new CustomEvent('zotero-select', {
                bubbles: true,
                detail: { key: item.key, tag: item.tag, title: item.title || '', bib: item.bib || '' },
            }),
        );
    }

    /* ===== utils ===== */
    _toggleClear() {
        const show = !!(this.$input.value || this._selected);
        this.$clear.classList.toggle('is-visible', show);
    }
    _debounce(fn, ms) {
        let t = null;
        return (...a) => {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, a), ms);
        };
    }
    _escape(s) {
        return String(s).replace(
            /[&<>"']/g,
            ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
        );
    }
    _stripHtml(s) {
        const tmp = document.createElement('div');
        tmp.innerHTML = s || '';
        return tmp.textContent || '';
    }
}

customElements.define('zotero-autocomplete', ZoteroAutocomplete);
