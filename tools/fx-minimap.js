const DEFAULT_STYLES = {
  h1: 'rgba(20,20,20,0.55)',
  'h2,h3,h4': 'rgba(20,20,20,0.35)',
  nav: 'rgba(60,60,60,0.12)',
  'details,section,article,fieldset': 'rgba(60,60,60,0.08)',
  img: 'rgba(90,140,255,0.35)',
  'input,textarea,select,button': 'rgba(90,140,255,0.18)',
};

/**
 * `<fx-minimap>` renders a small, fixed-position overview of the page (or of
 * a given scroll container) and lets the user click/drag on it to navigate,
 * similar to minimaps in code editors or games.
 *
 * Attributes:
 * - `selector`   CSS selector of the scrollable container to map. Defaults to the whole document.
 * - `width`      Width of the minimap in px (default 180). The map is always scaled to this
 *                width; height follows the page's aspect ratio and is not capped.
 * - `max-height` Maximum visible height of the minimap in px. Defaults to the available
 *                space between the panel and the bottom of the viewport, recomputed on
 *                resize, so the map uses as much of the screen as it can. Taller pages
 *                scroll within this bound instead of shrinking the width to fit.
 * - `corner`     One of `top-right` (default), `top-left`, `bottom-right`, `bottom-left`.
 * - `styles`     JSON object of `{ selector: cssColor }` merged over the built-in defaults.
 * - `collapsed`  Start collapsed.
 * - `area-scale` Multiplier (default 1) applied to every drawn marker box (control rects and
 *                the focus marker), inflated around its own center, so small elements stay
 *                visible on the map. Values > 1 enlarge; 1 is exact/true-to-size.
 */
class FxMinimap extends HTMLElement {
  constructor() {
    super();
    this._onScroll = this._onScroll.bind(this);
    this._onResize = this._onResize.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._draw = this._draw.bind(this);
    this._raf = null;
    this._dragging = false;
    this._scale = 1;
    this._focusRect = null;
    this._onFocusIn = this._onFocusIn.bind(this);
  }

  connectedCallback() {
    if (!this.shadowRoot) this._render();

    this.width = Number(this.getAttribute('width')) || 180;
    this._fixedMaxHeight = Number(this.getAttribute('max-height')) || null;
    this._areaScale = Number(this.getAttribute('area-scale')) || 1;

    this.styles = { ...DEFAULT_STYLES };
    const stylesAttr = this.getAttribute('styles');
    if (stylesAttr) {
      try {
        Object.assign(this.styles, JSON.parse(stylesAttr));
      } catch (e) {
        console.warn('fx-minimap: could not parse "styles" attribute', e);
      }
    }

    const selector = this.getAttribute('selector');
    this.viewportEl = selector ? document.querySelector(selector) : null;

    this._applyCorner();
    this._updateMaxHeight();

    this.collapsed = this.hasAttribute('collapsed') || localStorage.getItem('fx-minimap-collapsed') === 'true';
    this._syncCollapsed();

    this.canvas.addEventListener('pointerdown', this._onPointerDown);
    this.toggleBtn.addEventListener('click', () => this._toggleCollapsed());

    const scrollTarget = this.viewportEl || window;
    scrollTarget.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onResize);
    window.addEventListener('load', this._scheduleDraw.bind(this));

    const focusRoot = this.viewportEl || document;
    focusRoot.addEventListener('focusin', this._onFocusIn);

    this._resizeObserver = new ResizeObserver(() => this._scheduleDraw());
    this._resizeObserver.observe(this.viewportEl || document.scrollingElement || document.documentElement);

    this._mutationObserver = new MutationObserver(() => this._scheduleDraw());
    this._mutationObserver.observe(this.viewportEl || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['open', 'class', 'style', 'hidden'],
    });

    this._scheduleDraw();
  }

  disconnectedCallback() {
    const scrollTarget = this.viewportEl || window;
    scrollTarget.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    const focusRoot = this.viewportEl || document;
    focusRoot.removeEventListener('focusin', this._onFocusIn);
    this._resizeObserver?.disconnect();
    this._mutationObserver?.disconnect();
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  _render() {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host {
          all: initial;
          position: fixed;
          z-index: 100000;
          font-family: system-ui, sans-serif;
          user-select: none;
        }
        .panel {
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(0,0,0,0.15);
          border-radius: 6px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.18);
          overflow: hidden;
        }
        .bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 6px;
          font-size: 10px;
          color: #555;
          background: rgba(0,0,0,0.04);
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        button {
          all: unset;
          cursor: pointer;
          font-size: 11px;
          line-height: 1;
          padding: 0 4px;
          color: #555;
        }
        button:hover { color: #000; }
        .canvas-wrap {
          overflow-y: auto;
          overflow-x: hidden;
        }
        canvas {
          display: block;
          cursor: grab;
        }
        canvas.dragging { cursor: grabbing; }
        :host([data-collapsed='true']) .canvas-wrap { display: none; }
      </style>
      <div class="panel">
        <div class="bar">
          <span>Map</span>
          <button type="button" class="toggle" title="Toggle minimap">–</button>
        </div>
        <div class="canvas-wrap">
          <canvas></canvas>
        </div>
      </div>
    `;
    this.bar = root.querySelector('.bar');
    this.canvasWrap = root.querySelector('.canvas-wrap');
    this.canvas = root.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.toggleBtn = root.querySelector('.toggle');
  }

  _applyCorner() {
    const corner = this.getAttribute('corner') || 'top-right';
    const offset = '1rem';
    this.style.top = corner.startsWith('top') ? offset : '';
    this.style.bottom = corner.startsWith('bottom') ? offset : '';
    this.style.left = corner.endsWith('left') ? offset : '';
    this.style.right = corner.endsWith('right') ? offset : '';
  }

  _toggleCollapsed() {
    this.collapsed = !this.collapsed;
    localStorage.setItem('fx-minimap-collapsed', String(this.collapsed));
    this._syncCollapsed();
  }

  _syncCollapsed() {
    this.setAttribute('data-collapsed', String(this.collapsed));
    this.toggleBtn.textContent = this.collapsed ? '▢' : '–';
    if (!this.collapsed) this._scheduleDraw();
  }

  _scheduleDraw() {
    if (this._raf || this.collapsed) return;
    this._raf = requestAnimationFrame(this._draw);
  }

  _onScroll() {
    this._scheduleDraw();
  }

  _onResize() {
    this._updateMaxHeight();
    this._scheduleDraw();
  }

  _onFocusIn(ev) {
    if (ev.target === this || this.contains(ev.target)) return;
    this._focusRect = this._toContentCoords(ev.target.getBoundingClientRect());
    this._scheduleDraw();
  }

  _updateMaxHeight() {
    if (this._fixedMaxHeight) {
      this.canvasWrap.style.maxHeight = `${this._fixedMaxHeight}px`;
      return;
    }
    const bottomMargin = 16;
    const hostTop = this.getBoundingClientRect().top;
    const barHeight = this.bar.getBoundingClientRect().height;
    const available = window.innerHeight - hostTop - barHeight - bottomMargin;
    this.canvasWrap.style.maxHeight = `${Math.max(80, Math.round(available))}px`;
  }

  _rectOfDoc() {
    const el = this.viewportEl || document.scrollingElement || document.documentElement;
    return { w: el.scrollWidth, h: el.scrollHeight };
  }

  _rectOfViewport() {
    const el = this.viewportEl || document.scrollingElement || document.documentElement;
    return { x: el.scrollLeft, y: el.scrollTop, w: el.clientWidth, h: el.clientHeight };
  }

  _toContentCoords(rect) {
    if (this.viewportEl) {
      const cr = this.viewportEl.getBoundingClientRect();
      return {
        x: rect.left - cr.left + this.viewportEl.scrollLeft,
        y: rect.top - cr.top + this.viewportEl.scrollTop,
        w: rect.width,
        h: rect.height,
      };
    }
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      w: rect.width,
      h: rect.height,
    };
  }

  _scaledRect(r) {
    if (this._areaScale === 1) return r;
    const w = r.w * this._areaScale;
    const h = r.h * this._areaScale;
    return { x: r.x - (w - r.w) / 2, y: r.y - (h - r.h) / 2, w, h };
  }

  _resizeCanvas(cssW, cssH) {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
  }

  _draw() {
    this._raf = null;
    const doc = this._rectOfDoc();
    if (!doc.w || !doc.h) return;

    const scale = this.width / doc.w;
    this._scale = scale;
    const cssW = this.width;
    const cssH = Math.max(1, Math.round(doc.h * scale));
    this._resizeCanvas(cssW, cssH);

    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.clearRect(0, 0, doc.w, doc.h);
    ctx.fillStyle = 'rgba(0,0,0,0.035)';
    ctx.fillRect(0, 0, doc.w, doc.h);

    const root = this.viewportEl || document;
    Object.entries(this.styles).forEach(([sel, color]) => {
      let nodes;
      try {
        nodes = root.querySelectorAll(sel);
      } catch (e) {
        return;
      }
      // Collect all matched rects into a single path and fill it once, rather
      // than fillRect-ing each element individually: overlapping rects (e.g.
      // a tightly packed toolbar, or boxes overlapping after area-scale
      // inflation) would otherwise blend their translucent color on top of
      // each other on every overlap, darkening into a solid blotch.
      ctx.fillStyle = color;
      ctx.beginPath();
      nodes.forEach(el => {
        // checkVisibility() (unlike offsetWidth/offsetHeight) correctly
        // reports false for content inside a closed <details>: browsers
        // hide that content via content-visibility, which by design keeps
        // reporting its last-known geometry from offsetWidth/getBoundingClientRect.
        if (typeof el.checkVisibility === 'function') {
          if (!el.checkVisibility()) return;
        } else if (el.offsetWidth === 0 && el.offsetHeight === 0) {
          return;
        }
        // Skip nested elements matched by the same rule so overlapping
        // containers (e.g. a fieldset inside a section inside a details)
        // don't stack their translucent fills into a darker blotch.
        if (el.parentElement && el.parentElement.closest(sel)) return;
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed') return;
        const r = this._scaledRect(this._toContentCoords(el.getBoundingClientRect()));
        ctx.rect(r.x, r.y, r.w, r.h);
      });
      ctx.fill();
    });

    const vp = this._rectOfViewport();
    ctx.fillStyle = this._dragging ? 'rgba(37,99,235,0.35)' : 'rgba(37,99,235,0.18)';
    ctx.fillRect(vp.x, vp.y, vp.w, vp.h);
    ctx.strokeStyle = 'rgba(37,99,235,0.9)';
    ctx.lineWidth = 1 / scale;
    ctx.strokeRect(vp.x, vp.y, vp.w, vp.h);

    if (this._focusRect) {
      const r = this._scaledRect(this._focusRect);
      ctx.fillStyle = 'rgba(255,255,224,0.6)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = 'rgba(255,255,224,0.9)';
      ctx.lineWidth = 1.5 / scale;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    }

    this._ensureViewportVisible(vp, scale);
  }

  _ensureViewportVisible(vp, scale) {
    const wrap = this.canvasWrap;
    const top = vp.y * scale;
    const bottom = (vp.y + vp.h) * scale;
    if (top < wrap.scrollTop) {
      wrap.scrollTop = top;
    } else if (bottom > wrap.scrollTop + wrap.clientHeight) {
      wrap.scrollTop = bottom - wrap.clientHeight;
    }
  }

  _scrollToPointer(ev) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) / this._scale;
    const y = (ev.clientY - rect.top) / this._scale;
    const vp = this._rectOfViewport();
    const left = x - vp.w / 2;
    const top = y - vp.h / 2;

    if (this.viewportEl) {
      this.viewportEl.scrollTo({ left, top, behavior: 'instant' });
    } else {
      window.scrollTo({ left, top, behavior: 'instant' });
    }
    this._scheduleDraw();
  }

  _onPointerDown(ev) {
    this._dragging = true;
    this.canvas.classList.add('dragging');
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    this._scrollToPointer(ev);
  }

  _onPointerMove(ev) {
    if (!this._dragging) return;
    this._scrollToPointer(ev);
  }

  _onPointerUp() {
    this._dragging = false;
    this.canvas.classList.remove('dragging');
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    this._scheduleDraw();
  }
}

if (!customElements.get('fx-minimap')) {
  customElements.define('fx-minimap', FxMinimap);
}
