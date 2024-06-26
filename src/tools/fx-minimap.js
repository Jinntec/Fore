class FxMinimap extends HTMLElement {
  constructor() {
    super();
    this.canvas = document.createElement('canvas');
    this.options = this.getAttribute('options') ? JSON.parse(this.getAttribute('options')) : {};
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(this.canvas);
    this.WIN = window;
    this.DOC = this.WIN.document;
    this.DOC_EL = this.DOC.documentElement;
    this.BODY = this.DOC.querySelector('body');
  }

  connectedCallback() {
    this.ctx = this.canvas.getContext('2d');
    this.black = pc => `rgba(0,0,0,${pc / 100})`;
    this.viewport = this.querySelector(this.getAttribute('selector'));
    this.settings = {
      viewport: this.viewport,
      styles: {
        'header,footer,section,article': this.black(8),
        'h1,a': this.black(10),
        'h2,h3,h4': this.black(8),
      },
      back: this.black(2),
      view: this.black(5),
      drag: this.black(10),
      interval: null,
      ...this.options,
    };

    const _listener = (el, method, types, fn) =>
      types.split(/\s+/).forEach(type => el[method](type, fn));
    this.on = (el, types, fn) => _listener(el, 'addEventListener', types, fn);
    this.off = (el, types, fn) => _listener(el, 'removeEventListener', types, fn);

    this.Rect = (x, y, w, h) => ({
      x,
      y,
      w,
      h,
    });

    this.rect_rel_to = (rect, pos = { x: 0, y: 0 }) =>
      this.Rect(rect.x - pos.x, rect.y - pos.y, rect.w, rect.h);

    this.rect_of_doc = () =>
      this.Rect(0, 0, document.documentElement.scrollWidth, document.documentElement.scrollHeight);

    this.rect_of_win = () =>
      this.Rect(
        window.pageXOffset,
        window.pageYOffset,
        document.documentElement.clientWidth,
        document.documentElement.clientHeight,
      );

    this.el_get_offset = el => {
      const br = el.getBoundingClientRect();
      return { x: br.left + window.pageXOffset, y: br.top + window.pageYOffset };
    };

    this.rect_of_el = el => {
      const { x, y } = this.el_get_offset(el);
      return this.Rect(x, y, el.offsetWidth, el.offsetHeight);
    };

    this.rect_of_viewport = el => {
      const { x, y } = this.el_get_offset(el);
      return this.Rect(x + el.clientLeft, y + el.clientTop, el.clientWidth, el.clientHeight);
    };

    this.rect_of_content = el => {
      const { x, y } = this.el_get_offset(el);
      return this.Rect(
        x + el.clientLeft - el.scrollLeft,
        y + el.clientTop - el.scrollTop,
        el.scrollWidth,
        el.scrollHeight,
      );
    };

    this.calc_scale = (() => {
      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight;
      return (w, h) => Math.min(width / w, height / h);
    })();

    this.resize_canvas = (w, h) => {
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
    };

    this.viewport = this.settings.viewport;
    this.find = sel => Array.from((this.viewport || document).querySelectorAll(sel));

    this.drag = false;
    this.root_rect = null;
    this.view_rect = null;
    this.scale = null;
    this.drag_rx = null;
    this.drag_ry = null;
  }

  draw_rect(rect, col) {
    if (col) {
      this.ctx.beginPath();
      this.ctx.rect(rect.x, rect.y, rect.w, rect.h);
      this.ctx.fillStyle = col;
      this.ctx.fill();
    }
  }

  find(sel) {
    return Array.from((this.viewport || this.DOC).querySelectorAll(sel));
  }

  apply_styles(styles) {
    Object.keys(styles).forEach(sel => {
      const col = styles[sel];
      this.find(sel).forEach(el => {
        this.draw_rect(this.rect_rel_to(this.rect_of_el(el), this.root_rect), col);
      });
    });
  }

  draw() {
    this.root_rect = this.viewport ? this.rect_of_content(this.viewport) : this.rect_of_doc();
    this.view_rect = this.viewport ? this.rect_of_viewport(this.viewport) : this.rect_of_win();
    this.scale = this.calc_scale(this.root_rect.w, this.root_rect.h);

    this.resize_canvas(this.root_rect.w * this.scale, this.root_rect.h * this.scale);

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.scale(this.scale, this.scale);

    this.draw_rect(this.rect_rel_to(this.root_rect, this.root_rect), this.settings.back);
    this.apply_styles(this.settings.styles);
    this.draw_rect(
      this.rect_rel_to(this.view_rect, this.root_rect),
      this.drag ? this.settings.drag : this.settings.view,
    );
  }

  on_drag(ev) {
    ev.preventDefault();
    const cr = this.rect_of_viewport(this.canvas);
    const x = (ev.pageX - cr.x) / this.scale - this.view_rect.w * this.drag_rx;
    const y = (ev.pageY - cr.y) / this.scale - this.view_rect.h * this.drag_ry;

    if (this.viewport) {
      this.viewport.scrollLeft = x;
      this.viewport.scrollTop = y;
    } else {
      this.WIN.scrollTo(x, y);
    }
    this.draw();
  }

  on_drag_end(ev) {
    this.drag = false;
    this.canvas.style.cursor = 'pointer';
    this.BODY.style.cursor = 'auto';
    this.off(this.WIN, 'mousemove', this.on_drag);
    this.off(this.WIN, 'mouseup', this.on_drag_end);
    this.on_drag(ev);
  }

  on_drag_start(ev) {
    this.drag = true;

    const cr = this.rect_of_viewport(this.canvas);
    const vr = this.rect_rel_to(this.view_rect, this.root_rect);
    this.drag_rx = ((ev.pageX - cr.x) / this.scale - vr.x) / vr.w;
    this.drag_ry = ((ev.pageY - cr.y) / this.scale - vr.y) / vr.h;
    if (this.drag_rx < 0 || this.drag_rx > 1 || this.drag_ry < 0 || this.drag_ry > 1) {
      this.drag_rx = 0.5;
      this.drag_ry = 0.5;
    }

    this.canvas.style.cursor = 'crosshair';
    this.BODY.style.cursor = 'crosshair';
    this.on(this.WIN, 'mousemove', this.on_drag);
    this.on(this.WIN, 'mouseup', this.on_drag_end);
    this.on_drag(ev);
  }

  init() {
    this.canvas.style.cursor = 'pointer';
    this.on(this.canvas, 'mousedown', this.on_drag_start);
    this.on(this.viewport || this.WIN, 'load resize scroll', this.draw());
    if (this.settings.interval > 0) {
      setInterval(() => this.draw(), this.settings.interval);
    }
    this.draw();
  }
}
if (!customElements.get('fx-minimap')) {
  customElements.define('fx-minimap', FxMinimap);
}
