const t = 1024;
let e = 0;
class s {
  constructor(t, e) {
    (this.from = t), (this.to = e);
  }
}
class r {
  constructor(t = {}) {
    (this.id = e++),
      (this.perNode = !!t.perNode),
      (this.deserialize =
        t.deserialize ||
        (() => {
          throw new Error("This node type doesn't define a deserialize function");
        }));
  }
  add(t) {
    if (this.perNode) throw new RangeError("Can't add per-node props to node types");
    return (
      'function' != typeof t && (t = n.match(t)),
      e => {
        let s = t(e);
        return void 0 === s ? null : [this, s];
      }
    );
  }
}
(r.closedBy = new r({ deserialize: t => t.split(' ') })),
  (r.openedBy = new r({ deserialize: t => t.split(' ') })),
  (r.group = new r({ deserialize: t => t.split(' ') })),
  (r.contextHash = new r({ perNode: !0 })),
  (r.lookAhead = new r({ perNode: !0 })),
  (r.mounted = new r({ perNode: !0 }));
const i = Object.create(null);
class n {
  constructor(t, e, s, r = 0) {
    (this.name = t), (this.props = e), (this.id = s), (this.flags = r);
  }
  static define(t) {
    let e = t.props && t.props.length ? Object.create(null) : i,
      s = (t.top ? 1 : 0) | (t.skipped ? 2 : 0) | (t.error ? 4 : 0) | (null == t.name ? 8 : 0),
      r = new n(t.name || '', e, t.id, s);
    if (t.props)
      for (let s of t.props)
        if ((Array.isArray(s) || (s = s(r)), s)) {
          if (s[0].perNode) throw new RangeError("Can't store a per-node prop on a node type");
          e[s[0].id] = s[1];
        }
    return r;
  }
  prop(t) {
    return this.props[t.id];
  }
  get isTop() {
    return (1 & this.flags) > 0;
  }
  get isSkipped() {
    return (2 & this.flags) > 0;
  }
  get isError() {
    return (4 & this.flags) > 0;
  }
  get isAnonymous() {
    return (8 & this.flags) > 0;
  }
  is(t) {
    if ('string' == typeof t) {
      if (this.name == t) return !0;
      let e = this.prop(r.group);
      return !!e && e.indexOf(t) > -1;
    }
    return this.id == t;
  }
  static match(t) {
    let e = Object.create(null);
    for (let s in t) for (let r of s.split(' ')) e[r] = t[s];
    return t => {
      for (let s = t.prop(r.group), i = -1; i < (s ? s.length : 0); i++) {
        let r = e[i < 0 ? t.name : s[i]];
        if (r) return r;
      }
    };
  }
}
n.none = new n('', Object.create(null), 0, 8);
class h {
  constructor(t) {
    this.types = t;
    for (let e = 0; e < t.length; e++)
      if (t[e].id != e)
        throw new RangeError(
          'Node type ids should correspond to array positions when creating a node set',
        );
  }
  extend(...t) {
    let e = [];
    for (let s of this.types) {
      let r = null;
      for (let e of t) {
        let t = e(s);
        t && (r || (r = Object.assign({}, s.props)), (r[t[0].id] = t[1]));
      }
      e.push(r ? new n(s.name, r, s.id, s.flags) : s);
    }
    return new h(e);
  }
}
const o = new WeakMap(),
  a = new WeakMap();
var l;
!(function(t) {
  (t[(t.ExcludeBuffers = 1)] = 'ExcludeBuffers'),
    (t[(t.IncludeAnonymous = 2)] = 'IncludeAnonymous'),
    (t[(t.IgnoreMounts = 4)] = 'IgnoreMounts'),
    (t[(t.IgnoreOverlays = 8)] = 'IgnoreOverlays');
})(l || (l = {}));
class u {
  constructor(t, e, s, r, i) {
    if (
      ((this.type = t),
      (this.children = e),
      (this.positions = s),
      (this.length = r),
      (this.props = null),
      i && i.length)
    ) {
      this.props = Object.create(null);
      for (let [t, e] of i) this.props['number' == typeof t ? t : t.id] = e;
    }
  }
  toString() {
    let t = this.prop(r.mounted);
    if (t && !t.overlay) return t.tree.toString();
    let e = '';
    for (let t of this.children) {
      let s = t.toString();
      s && (e && (e += ','), (e += s));
    }
    return this.type.name
      ? (/\W/.test(this.type.name) && !this.type.isError
          ? JSON.stringify(this.type.name)
          : this.type.name) + (e.length ? '(' + e + ')' : '')
      : e;
  }
  cursor(t = 0) {
    return new y(this.topNode, t);
  }
  cursorAt(t, e = 0, s = 0) {
    let r = o.get(this) || this.topNode,
      i = new y(r);
    return i.moveTo(t, e), o.set(this, i._tree), i;
  }
  get topNode() {
    return new k(this, 0, 0, null);
  }
  resolve(t, e = 0) {
    let s = g(o.get(this) || this.topNode, t, e, !1);
    return o.set(this, s), s;
  }
  resolveInner(t, e = 0) {
    let s = g(a.get(this) || this.topNode, t, e, !0);
    return a.set(this, s), s;
  }
  iterate(t) {
    let { enter: e, leave: s, from: r = 0, to: i = this.length } = t;
    for (let n = this.cursor((t.mode || 0) | l.IncludeAnonymous); ; ) {
      let t = !1;
      if (n.from <= i && n.to >= r && (n.type.isAnonymous || !1 !== e(n))) {
        if (n.firstChild()) continue;
        t = !0;
      }
      for (; t && s && !n.type.isAnonymous && s(n), !n.nextSibling(); ) {
        if (!n.parent()) return;
        t = !0;
      }
    }
  }
  prop(t) {
    return t.perNode ? (this.props ? this.props[t.id] : void 0) : this.type.prop(t);
  }
  get propValues() {
    let t = [];
    if (this.props) for (let e in this.props) t.push([+e, this.props[e]]);
    return t;
  }
  balance(t = {}) {
    return this.children.length <= 8
      ? this
      : w(
          n.none,
          this.children,
          this.positions,
          0,
          this.children.length,
          0,
          this.length,
          (t, e, s) => new u(this.type, t, e, s, this.propValues),
          t.makeTree || ((t, e, s) => new u(n.none, t, e, s)),
        );
  }
  static build(t) {
    return v(t);
  }
}
u.empty = new u(n.none, [], [], 0);
class f {
  constructor(t, e) {
    (this.buffer = t), (this.index = e);
  }
  get id() {
    return this.buffer[this.index - 4];
  }
  get start() {
    return this.buffer[this.index - 3];
  }
  get end() {
    return this.buffer[this.index - 2];
  }
  get size() {
    return this.buffer[this.index - 1];
  }
  get pos() {
    return this.index;
  }
  next() {
    this.index -= 4;
  }
  fork() {
    return new f(this.buffer, this.index);
  }
}
class c {
  constructor(t, e, s) {
    (this.buffer = t), (this.length = e), (this.set = s);
  }
  get type() {
    return n.none;
  }
  toString() {
    let t = [];
    for (let e = 0; e < this.buffer.length; ) t.push(this.childString(e)), (e = this.buffer[e + 3]);
    return t.join(',');
  }
  childString(t) {
    let e = this.buffer[t],
      s = this.buffer[t + 3],
      r = this.set.types[e],
      i = r.name;
    if ((/\W/.test(i) && !r.isError && (i = JSON.stringify(i)), s == (t += 4))) return i;
    let n = [];
    for (; t < s; ) n.push(this.childString(t)), (t = this.buffer[t + 3]);
    return i + '(' + n.join(',') + ')';
  }
  findChild(t, e, s, r, i) {
    let { buffer: n } = this,
      h = -1;
    for (let o = t; o != e && !(p(i, r, n[o + 1], n[o + 2]) && ((h = o), s > 0)); o = n[o + 3]);
    return h;
  }
  slice(t, e, s, r) {
    let i = this.buffer,
      n = new Uint16Array(e - t);
    for (let r = t, h = 0; r < e; )
      (n[h++] = i[r++]), (n[h++] = i[r++] - s), (n[h++] = i[r++] - s), (n[h++] = i[r++] - t);
    return new c(n, r - s, this.set);
  }
}
function p(t, e, s, r) {
  switch (t) {
    case -2:
      return s < e;
    case -1:
      return r >= e && s < e;
    case 0:
      return s < e && r > e;
    case 1:
      return s <= e && r > e;
    case 2:
      return r > e;
    case 4:
      return !0;
  }
}
function d(t, e) {
  let s = t.childBefore(e);
  for (; s; ) {
    let e = s.lastChild;
    if (!e || e.to != s.to) break;
    e.type.isError && e.from == e.to ? ((t = s), (s = e.prevSibling)) : (s = e);
  }
  return t;
}
function g(t, e, s, r) {
  for (
    var i;
    t.from == t.to || (s < 1 ? t.from >= e : t.from > e) || (s > -1 ? t.to <= e : t.to < e);

  ) {
    let e = !r && t instanceof k && t.index < 0 ? null : t.parent;
    if (!e) return t;
    t = e;
  }
  let n = r ? 0 : l.IgnoreOverlays;
  if (r)
    for (let r = t, h = r.parent; h; r = h, h = r.parent)
      r instanceof k &&
        r.index < 0 &&
        (null === (i = h.enter(e, s, n)) || void 0 === i ? void 0 : i.from) != r.from &&
        (t = h);
  for (;;) {
    let r = t.enter(e, s, n);
    if (!r) return t;
    t = r;
  }
}
class k {
  constructor(t, e, s, r) {
    (this._tree = t), (this.from = e), (this.index = s), (this._parent = r);
  }
  get type() {
    return this._tree.type;
  }
  get name() {
    return this._tree.type.name;
  }
  get to() {
    return this.from + this._tree.length;
  }
  nextChild(t, e, s, i, n = 0) {
    for (let h = this; ; ) {
      for (let { children: o, positions: a } = h._tree, u = e > 0 ? o.length : -1; t != u; t += e) {
        let u = o[t],
          f = a[t] + h.from;
        if (p(i, s, f, f + u.length))
          if (u instanceof c) {
            if (n & l.ExcludeBuffers) continue;
            let r = u.findChild(0, u.buffer.length, e, s - f, i);
            if (r > -1) return new O(new b(h, u, t, f), null, r);
          } else if (n & l.IncludeAnonymous || !u.type.isAnonymous || P(u)) {
            let o;
            if (!(n & l.IgnoreMounts) && u.props && (o = u.prop(r.mounted)) && !o.overlay)
              return new k(o.tree, f, t, h);
            let a = new k(u, f, t, h);
            return n & l.IncludeAnonymous || !a.type.isAnonymous
              ? a
              : a.nextChild(e < 0 ? u.children.length - 1 : 0, e, s, i);
          }
      }
      if (n & l.IncludeAnonymous || !h.type.isAnonymous) return null;
      if (
        ((t = h.index >= 0 ? h.index + e : e < 0 ? -1 : h._parent._tree.children.length),
        (h = h._parent),
        !h)
      )
        return null;
    }
  }
  get firstChild() {
    return this.nextChild(0, 1, 0, 4);
  }
  get lastChild() {
    return this.nextChild(this._tree.children.length - 1, -1, 0, 4);
  }
  childAfter(t) {
    return this.nextChild(0, 1, t, 2);
  }
  childBefore(t) {
    return this.nextChild(this._tree.children.length - 1, -1, t, -2);
  }
  enter(t, e, s = 0) {
    let i;
    if (!(s & l.IgnoreOverlays) && (i = this._tree.prop(r.mounted)) && i.overlay) {
      let s = t - this.from;
      for (let { from: t, to: r } of i.overlay)
        if ((e > 0 ? t <= s : t < s) && (e < 0 ? r >= s : r > s))
          return new k(i.tree, i.overlay[0].from + this.from, -1, this);
    }
    return this.nextChild(0, 1, t, e, s);
  }
  nextSignificantParent() {
    let t = this;
    for (; t.type.isAnonymous && t._parent; ) t = t._parent;
    return t;
  }
  get parent() {
    return this._parent ? this._parent.nextSignificantParent() : null;
  }
  get nextSibling() {
    return this._parent && this.index >= 0 ? this._parent.nextChild(this.index + 1, 1, 0, 4) : null;
  }
  get prevSibling() {
    return this._parent && this.index >= 0
      ? this._parent.nextChild(this.index - 1, -1, 0, 4)
      : null;
  }
  cursor(t = 0) {
    return new y(this, t);
  }
  get tree() {
    return this._tree;
  }
  toTree() {
    return this._tree;
  }
  resolve(t, e = 0) {
    return g(this, t, e, !1);
  }
  resolveInner(t, e = 0) {
    return g(this, t, e, !0);
  }
  enterUnfinishedNodesBefore(t) {
    return d(this, t);
  }
  getChild(t, e = null, s = null) {
    let r = x(this, t, e, s);
    return r.length ? r[0] : null;
  }
  getChildren(t, e = null, s = null) {
    return x(this, t, e, s);
  }
  toString() {
    return this._tree.toString();
  }
  get node() {
    return this;
  }
  matchContext(t) {
    return m(this, t);
  }
}
function x(t, e, s, r) {
  let i = t.cursor(),
    n = [];
  if (!i.firstChild()) return n;
  if (null != s) for (; !i.type.is(s); ) if (!i.nextSibling()) return n;
  for (;;) {
    if (null != r && i.type.is(r)) return n;
    if ((i.type.is(e) && n.push(i.node), !i.nextSibling())) return null == r ? n : [];
  }
}
function m(t, e, s = e.length - 1) {
  for (let r = t.parent; s >= 0; r = r.parent) {
    if (!r) return !1;
    if (!r.type.isAnonymous) {
      if (e[s] && e[s] != r.name) return !1;
      s--;
    }
  }
  return !0;
}
class b {
  constructor(t, e, s, r) {
    (this.parent = t), (this.buffer = e), (this.index = s), (this.start = r);
  }
}
class O {
  constructor(t, e, s) {
    (this.context = t),
      (this._parent = e),
      (this.index = s),
      (this.type = t.buffer.set.types[t.buffer.buffer[s]]);
  }
  get name() {
    return this.type.name;
  }
  get from() {
    return this.context.start + this.context.buffer.buffer[this.index + 1];
  }
  get to() {
    return this.context.start + this.context.buffer.buffer[this.index + 2];
  }
  child(t, e, s) {
    let { buffer: r } = this.context,
      i = r.findChild(this.index + 4, r.buffer[this.index + 3], t, e - this.context.start, s);
    return i < 0 ? null : new O(this.context, this, i);
  }
  get firstChild() {
    return this.child(1, 0, 4);
  }
  get lastChild() {
    return this.child(-1, 0, 4);
  }
  childAfter(t) {
    return this.child(1, t, 2);
  }
  childBefore(t) {
    return this.child(-1, t, -2);
  }
  enter(t, e, s = 0) {
    if (s & l.ExcludeBuffers) return null;
    let { buffer: r } = this.context,
      i = r.findChild(
        this.index + 4,
        r.buffer[this.index + 3],
        e > 0 ? 1 : -1,
        t - this.context.start,
        e,
      );
    return i < 0 ? null : new O(this.context, this, i);
  }
  get parent() {
    return this._parent || this.context.parent.nextSignificantParent();
  }
  externalSibling(t) {
    return this._parent ? null : this.context.parent.nextChild(this.context.index + t, t, 0, 4);
  }
  get nextSibling() {
    let { buffer: t } = this.context,
      e = t.buffer[this.index + 3];
    return e < (this._parent ? t.buffer[this._parent.index + 3] : t.buffer.length)
      ? new O(this.context, this._parent, e)
      : this.externalSibling(1);
  }
  get prevSibling() {
    let { buffer: t } = this.context,
      e = this._parent ? this._parent.index + 4 : 0;
    return this.index == e
      ? this.externalSibling(-1)
      : new O(this.context, this._parent, t.findChild(e, this.index, -1, 0, 4));
  }
  cursor(t = 0) {
    return new y(this, t);
  }
  get tree() {
    return null;
  }
  toTree() {
    let t = [],
      e = [],
      { buffer: s } = this.context,
      r = this.index + 4,
      i = s.buffer[this.index + 3];
    if (i > r) {
      let n = s.buffer[this.index + 1],
        h = s.buffer[this.index + 2];
      t.push(s.slice(r, i, n, h)), e.push(0);
    }
    return new u(this.type, t, e, this.to - this.from);
  }
  resolve(t, e = 0) {
    return g(this, t, e, !1);
  }
  resolveInner(t, e = 0) {
    return g(this, t, e, !0);
  }
  enterUnfinishedNodesBefore(t) {
    return d(this, t);
  }
  toString() {
    return this.context.buffer.childString(this.index);
  }
  getChild(t, e = null, s = null) {
    let r = x(this, t, e, s);
    return r.length ? r[0] : null;
  }
  getChildren(t, e = null, s = null) {
    return x(this, t, e, s);
  }
  get node() {
    return this;
  }
  matchContext(t) {
    return m(this, t);
  }
}
class y {
  constructor(t, e = 0) {
    if (
      ((this.mode = e),
      (this.buffer = null),
      (this.stack = []),
      (this.index = 0),
      (this.bufferNode = null),
      t instanceof k)
    )
      this.yieldNode(t);
    else {
      (this._tree = t.context.parent), (this.buffer = t.context);
      for (let e = t._parent; e; e = e._parent) this.stack.unshift(e.index);
      (this.bufferNode = t), this.yieldBuf(t.index);
    }
  }
  get name() {
    return this.type.name;
  }
  yieldNode(t) {
    return (
      !!t && ((this._tree = t), (this.type = t.type), (this.from = t.from), (this.to = t.to), !0)
    );
  }
  yieldBuf(t, e) {
    this.index = t;
    let { start: s, buffer: r } = this.buffer;
    return (
      (this.type = e || r.set.types[r.buffer[t]]),
      (this.from = s + r.buffer[t + 1]),
      (this.to = s + r.buffer[t + 2]),
      !0
    );
  }
  yield(t) {
    return (
      !!t &&
      (t instanceof k
        ? ((this.buffer = null), this.yieldNode(t))
        : ((this.buffer = t.context), this.yieldBuf(t.index, t.type)))
    );
  }
  toString() {
    return this.buffer ? this.buffer.buffer.childString(this.index) : this._tree.toString();
  }
  enterChild(t, e, s) {
    if (!this.buffer)
      return this.yield(
        this._tree.nextChild(t < 0 ? this._tree._tree.children.length - 1 : 0, t, e, s, this.mode),
      );
    let { buffer: r } = this.buffer,
      i = r.findChild(this.index + 4, r.buffer[this.index + 3], t, e - this.buffer.start, s);
    return !(i < 0) && (this.stack.push(this.index), this.yieldBuf(i));
  }
  firstChild() {
    return this.enterChild(1, 0, 4);
  }
  lastChild() {
    return this.enterChild(-1, 0, 4);
  }
  childAfter(t) {
    return this.enterChild(1, t, 2);
  }
  childBefore(t) {
    return this.enterChild(-1, t, -2);
  }
  enter(t, e, s = this.mode) {
    return this.buffer
      ? !(s & l.ExcludeBuffers) && this.enterChild(1, t, e)
      : this.yield(this._tree.enter(t, e, s));
  }
  parent() {
    if (!this.buffer)
      return this.yieldNode(
        this.mode & l.IncludeAnonymous ? this._tree._parent : this._tree.parent,
      );
    if (this.stack.length) return this.yieldBuf(this.stack.pop());
    let t =
      this.mode & l.IncludeAnonymous
        ? this.buffer.parent
        : this.buffer.parent.nextSignificantParent();
    return (this.buffer = null), this.yieldNode(t);
  }
  sibling(t) {
    if (!this.buffer)
      return (
        !!this._tree._parent &&
        this.yield(
          this._tree.index < 0
            ? null
            : this._tree._parent.nextChild(this._tree.index + t, t, 0, 4, this.mode),
        )
      );
    let { buffer: e } = this.buffer,
      s = this.stack.length - 1;
    if (t < 0) {
      let t = s < 0 ? 0 : this.stack[s] + 4;
      if (this.index != t) return this.yieldBuf(e.findChild(t, this.index, -1, 0, 4));
    } else {
      let t = e.buffer[this.index + 3];
      if (t < (s < 0 ? e.buffer.length : e.buffer[this.stack[s] + 3])) return this.yieldBuf(t);
    }
    return (
      s < 0 && this.yield(this.buffer.parent.nextChild(this.buffer.index + t, t, 0, 4, this.mode))
    );
  }
  nextSibling() {
    return this.sibling(1);
  }
  prevSibling() {
    return this.sibling(-1);
  }
  atLastNode(t) {
    let e,
      s,
      { buffer: r } = this;
    if (r) {
      if (t > 0) {
        if (this.index < r.buffer.buffer.length) return !1;
      } else
        for (let t = 0; t < this.index; t++) if (r.buffer.buffer[t + 3] < this.index) return !1;
      ({ index: e, parent: s } = r);
    } else ({ index: e, _parent: s } = this._tree);
    for (; s; { index: e, _parent: s } = s)
      if (e > -1)
        for (let r = e + t, i = t < 0 ? -1 : s._tree.children.length; r != i; r += t) {
          let t = s._tree.children[r];
          if (this.mode & l.IncludeAnonymous || t instanceof c || !t.type.isAnonymous || P(t))
            return !1;
        }
    return !0;
  }
  move(t, e) {
    if (e && this.enterChild(t, 0, 4)) return !0;
    for (;;) {
      if (this.sibling(t)) return !0;
      if (this.atLastNode(t) || !this.parent()) return !1;
    }
  }
  next(t = !0) {
    return this.move(1, t);
  }
  prev(t = !0) {
    return this.move(-1, t);
  }
  moveTo(t, e = 0) {
    for (
      ;
      (this.from == this.to ||
        (e < 1 ? this.from >= t : this.from > t) ||
        (e > -1 ? this.to <= t : this.to < t)) &&
      this.parent();

    );
    for (; this.enterChild(1, t, e); );
    return this;
  }
  get node() {
    if (!this.buffer) return this._tree;
    let t = this.bufferNode,
      e = null,
      s = 0;
    if (t && t.context == this.buffer)
      t: for (let r = this.index, i = this.stack.length; i >= 0; ) {
        for (let n = t; n; n = n._parent)
          if (n.index == r) {
            if (r == this.index) return n;
            (e = n), (s = i + 1);
            break t;
          }
        r = this.stack[--i];
      }
    for (let t = s; t < this.stack.length; t++) e = new O(this.buffer, e, this.stack[t]);
    return (this.bufferNode = new O(this.buffer, e, this.index));
  }
  get tree() {
    return this.buffer ? null : this._tree._tree;
  }
  iterate(t, e) {
    for (let s = 0; ; ) {
      let r = !1;
      if (this.type.isAnonymous || !1 !== t(this)) {
        if (this.firstChild()) {
          s++;
          continue;
        }
        this.type.isAnonymous || (r = !0);
      }
      for (; r && e && e(this), (r = this.type.isAnonymous), !this.nextSibling(); ) {
        if (!s) return;
        this.parent(), s--, (r = !0);
      }
    }
  }
  matchContext(t) {
    if (!this.buffer) return m(this.node, t);
    let { buffer: e } = this.buffer,
      { types: s } = e.set;
    for (let r = t.length - 1, i = this.stack.length - 1; r >= 0; i--) {
      if (i < 0) return m(this.node, t, r);
      let n = s[e.buffer[this.stack[i]]];
      if (!n.isAnonymous) {
        if (t[r] && t[r] != n.name) return !1;
        r--;
      }
    }
    return !0;
  }
}
function P(t) {
  return t.children.some(t => t instanceof c || !t.type.isAnonymous || P(t));
}
function v(e) {
  var s;
  let {
      buffer: i,
      nodeSet: n,
      maxBufferLength: h = t,
      reused: o = [],
      minRepeatType: a = n.types.length,
    } = e,
    l = Array.isArray(i) ? new f(i, i.length) : i,
    p = n.types,
    d = 0,
    g = 0;
  function k(t, e, s, r, i) {
    let { id: u, start: f, end: P, size: v } = l,
      C = g;
    for (; v < 0; ) {
      if ((l.next(), -1 == v)) {
        let e = o[u];
        return s.push(e), void r.push(f - t);
      }
      if (-3 == v) return void (d = u);
      if (-4 == v) return void (g = u);
      throw new RangeError(`Unrecognized record size: ${v}`);
    }
    let S,
      A,
      T = p[u],
      N = f - t;
    if (P - f <= h && (A = O(l.pos - e, i))) {
      let e = new Uint16Array(A.size - A.skip),
        s = l.pos - A.size,
        r = e.length;
      for (; l.pos > s; ) r = y(A.start, e, r);
      (S = new c(e, P - A.start, n)), (N = A.start - t);
    } else {
      let t = l.pos - v;
      l.next();
      let e = [],
        s = [],
        r = u >= a ? u : -1,
        i = 0,
        n = P;
      for (; l.pos > t; )
        r >= 0 && l.id == r && l.size >= 0
          ? (l.end <= n - h && (m(e, s, f, i, l.end, n, r, C), (i = e.length), (n = l.end)),
            l.next())
          : k(f, t, e, s, r);
      if (
        (r >= 0 && i > 0 && i < e.length && m(e, s, f, i, f, n, r, C),
        e.reverse(),
        s.reverse(),
        r > -1 && i > 0)
      ) {
        let t = x(T);
        S = w(T, e, s, 0, e.length, 0, P - f, t, t);
      } else S = b(T, e, s, P - f, C - P);
    }
    s.push(S), r.push(N);
  }
  function x(t) {
    return (e, s, i) => {
      let n,
        h,
        o = 0,
        a = e.length - 1;
      if (a >= 0 && (n = e[a]) instanceof u) {
        if (!a && n.type == t && n.length == i) return n;
        (h = n.prop(r.lookAhead)) && (o = s[a] + n.length + h);
      }
      return b(t, e, s, i, o);
    };
  }
  function m(t, e, s, r, i, h, o, a) {
    let l = [],
      u = [];
    for (; t.length > r; ) l.push(t.pop()), u.push(e.pop() + s - i);
    t.push(b(n.types[o], l, u, h - i, a - h)), e.push(i - s);
  }
  function b(t, e, s, i, n = 0, h) {
    if (d) {
      let t = [r.contextHash, d];
      h = h ? [t].concat(h) : [t];
    }
    if (n > 25) {
      let t = [r.lookAhead, n];
      h = h ? [t].concat(h) : [t];
    }
    return new u(t, e, s, i, h);
  }
  function O(t, e) {
    let s = l.fork(),
      r = 0,
      i = 0,
      n = 0,
      o = s.end - h,
      u = { size: 0, start: 0, skip: 0 };
    t: for (let h = s.pos - t; s.pos > h; ) {
      let t = s.size;
      if (s.id == e && t >= 0) {
        (u.size = r), (u.start = i), (u.skip = n), (n += 4), (r += 4), s.next();
        continue;
      }
      let l = s.pos - t;
      if (t < 0 || l < h || s.start < o) break;
      let f = s.id >= a ? 4 : 0,
        c = s.start;
      for (s.next(); s.pos > l; ) {
        if (s.size < 0) {
          if (-3 != s.size) break t;
          f += 4;
        } else s.id >= a && (f += 4);
        s.next();
      }
      (i = c), (r += t), (n += f);
    }
    return (
      (e < 0 || r == t) && ((u.size = r), (u.start = i), (u.skip = n)), u.size > 4 ? u : void 0
    );
  }
  function y(t, e, s) {
    let { id: r, start: i, end: n, size: h } = l;
    if ((l.next(), h >= 0 && r < a)) {
      let o = s;
      if (h > 4) {
        let r = l.pos - (h - 4);
        for (; l.pos > r; ) s = y(t, e, s);
      }
      (e[--s] = o), (e[--s] = n - t), (e[--s] = i - t), (e[--s] = r);
    } else -3 == h ? (d = r) : -4 == h && (g = r);
    return s;
  }
  let P = [],
    v = [];
  for (; l.pos > 0; ) k(e.start || 0, e.bufferStart || 0, P, v, -1);
  let C = null !== (s = e.length) && void 0 !== s ? s : P.length ? v[0] + P[0].length : 0;
  return new u(p[e.topID], P.reverse(), v.reverse(), C);
}
const C = new WeakMap();
function S(t, e) {
  if (!t.isAnonymous || e instanceof c || e.type != t) return 1;
  let s = C.get(e);
  if (null == s) {
    s = 1;
    for (let r of e.children) {
      if (r.type != t || !(r instanceof u)) {
        s = 1;
        break;
      }
      s += S(t, r);
    }
    C.set(e, s);
  }
  return s;
}
function w(t, e, s, r, i, n, h, o, a) {
  let l = 0;
  for (let s = r; s < i; s++) l += S(t, e[s]);
  let u = Math.ceil((1.5 * l) / 8),
    f = [],
    c = [];
  function p(e, s, r, i, h) {
    for (let o = r; o < i; ) {
      let r = o,
        l = s[o],
        d = S(t, e[o]);
      for (o++; o < i; o++) {
        let s = S(t, e[o]);
        if (d + s >= u) break;
        d += s;
      }
      if (o == r + 1) {
        if (d > u) {
          let t = e[r];
          p(t.children, t.positions, 0, t.children.length, s[r] + h);
          continue;
        }
        f.push(e[r]);
      } else {
        let i = s[o - 1] + e[o - 1].length - l;
        f.push(w(t, e, s, r, o, l, i, null, a));
      }
      c.push(l + h - n);
    }
  }
  return p(e, s, r, i, 0), (o || a)(f, c, h);
}
class A {
  constructor(t, e, s, r, i = !1, n = !1) {
    (this.from = t),
      (this.to = e),
      (this.tree = s),
      (this.offset = r),
      (this.open = (i ? 1 : 0) | (n ? 2 : 0));
  }
  get openStart() {
    return (1 & this.open) > 0;
  }
  get openEnd() {
    return (2 & this.open) > 0;
  }
  static addTree(t, e = [], s = !1) {
    let r = [new A(0, t.length, t, 0, !1, s)];
    for (let s of e) s.to > t.length && r.push(s);
    return r;
  }
  static applyChanges(t, e, s = 128) {
    if (!e.length) return t;
    let r = [],
      i = 1,
      n = t.length ? t[0] : null;
    for (let h = 0, o = 0, a = 0; ; h++) {
      let l = h < e.length ? e[h] : null,
        u = l ? l.fromA : 1e9;
      if (u - o >= s)
        for (; n && n.from < u; ) {
          let e = n;
          if (o >= e.from || u <= e.to || a) {
            let t = Math.max(e.from, o) - a,
              s = Math.min(e.to, u) - a;
            e = t >= s ? null : new A(t, s, e.tree, e.offset + a, h > 0, !!l);
          }
          if ((e && r.push(e), n.to > u)) break;
          n = i < t.length ? t[i++] : null;
        }
      if (!l) break;
      (o = l.toA), (a = l.toA - l.toB);
    }
    return r;
  }
}
class T {
  startParse(t, e, r) {
    return (
      'string' == typeof t && (t = new N(t)),
      (r = r ? (r.length ? r.map(t => new s(t.from, t.to)) : [new s(0, 0)]) : [new s(0, t.length)]),
      this.createParse(t, e || [], r)
    );
  }
  parse(t, e, s) {
    let r = this.startParse(t, e, s);
    for (;;) {
      let t = r.advance();
      if (t) return t;
    }
  }
}
class N {
  constructor(t) {
    this.string = t;
  }
  get length() {
    return this.string.length;
  }
  chunk(t) {
    return this.string.slice(t);
  }
  get lineChunks() {
    return !1;
  }
  read(t, e) {
    return this.string.slice(t, e);
  }
}
new r({ perNode: !0 });
class R {
  constructor(t, e, s, r, i, n, h, o, a, l = 0, u) {
    (this.p = t),
      (this.stack = e),
      (this.state = s),
      (this.reducePos = r),
      (this.pos = i),
      (this.score = n),
      (this.buffer = h),
      (this.bufferBase = o),
      (this.curContext = a),
      (this.lookAhead = l),
      (this.parent = u);
  }
  toString() {
    return `[${this.stack.filter((t, e) => e % 3 == 0).concat(this.state)}]@${this.pos}${
      this.score ? '!' + this.score : ''
    }`;
  }
  static start(t, e, s = 0) {
    let r = t.parser.context;
    return new R(t, [], e, s, s, 0, [], 0, r ? new _(r, r.start) : null, 0, null);
  }
  get context() {
    return this.curContext ? this.curContext.context : null;
  }
  pushState(t, e) {
    this.stack.push(this.state, e, this.bufferBase + this.buffer.length), (this.state = t);
  }
  reduce(t) {
    let e = t >> 19,
      s = 65535 & t,
      { parser: r } = this.p,
      i = r.dynamicPrecedence(s);
    if ((i && (this.score += i), 0 == e))
      return (
        this.pushState(r.getGoto(this.state, s, !0), this.reducePos),
        s < r.minRepeatTerm && this.storeNode(s, this.reducePos, this.reducePos, 4, !0),
        void this.reduceContext(s, this.reducePos)
      );
    let n = this.stack.length - 3 * (e - 1) - (262144 & t ? 6 : 0),
      h = this.stack[n - 2],
      o = this.stack[n - 1],
      a = this.bufferBase + this.buffer.length - o;
    if (s < r.minRepeatTerm || 131072 & t) {
      let t = r.stateFlag(this.state, 1) ? this.pos : this.reducePos;
      this.storeNode(s, h, t, a + 4, !0);
    }
    if (262144 & t) this.state = this.stack[n];
    else {
      let t = this.stack[n - 3];
      this.state = r.getGoto(t, s, !0);
    }
    for (; this.stack.length > n; ) this.stack.pop();
    this.reduceContext(s, h);
  }
  storeNode(t, e, s, r = 4, i = !1) {
    if (
      0 == t &&
      (!this.stack.length ||
        this.stack[this.stack.length - 1] < this.buffer.length + this.bufferBase)
    ) {
      let t = this,
        r = this.buffer.length;
      if (
        (0 == r && t.parent && ((r = t.bufferBase - t.parent.bufferBase), (t = t.parent)),
        r > 0 && 0 == t.buffer[r - 4] && t.buffer[r - 1] > -1)
      ) {
        if (e == s) return;
        if (t.buffer[r - 2] >= e) return void (t.buffer[r - 2] = s);
      }
    }
    if (i && this.pos != s) {
      let i = this.buffer.length;
      if (i > 0 && 0 != this.buffer[i - 4])
        for (; i > 0 && this.buffer[i - 2] > s; )
          (this.buffer[i] = this.buffer[i - 4]),
            (this.buffer[i + 1] = this.buffer[i - 3]),
            (this.buffer[i + 2] = this.buffer[i - 2]),
            (this.buffer[i + 3] = this.buffer[i - 1]),
            (i -= 4),
            r > 4 && (r -= 4);
      (this.buffer[i] = t),
        (this.buffer[i + 1] = e),
        (this.buffer[i + 2] = s),
        (this.buffer[i + 3] = r);
    } else this.buffer.push(t, e, s, r);
  }
  shift(t, e, s) {
    let r = this.pos;
    if (131072 & t) this.pushState(65535 & t, this.pos);
    else if (0 == (262144 & t)) {
      let i = t,
        { parser: n } = this.p;
      (s > this.pos || e <= n.maxNode) &&
        ((this.pos = s), n.stateFlag(i, 1) || (this.reducePos = s)),
        this.pushState(i, r),
        this.shiftContext(e, r),
        e <= n.maxNode && this.buffer.push(e, r, s, 4);
    } else
      (this.pos = s),
        this.shiftContext(e, r),
        e <= this.p.parser.maxNode && this.buffer.push(e, r, s, 4);
  }
  apply(t, e, s) {
    65536 & t ? this.reduce(t) : this.shift(t, e, s);
  }
  useNode(t, e) {
    let s = this.p.reused.length - 1;
    (s < 0 || this.p.reused[s] != t) && (this.p.reused.push(t), s++);
    let r = this.pos;
    (this.reducePos = this.pos = r + t.length),
      this.pushState(e, r),
      this.buffer.push(s, r, this.reducePos, -1),
      this.curContext &&
        this.updateContext(
          this.curContext.tracker.reuse(
            this.curContext.context,
            t,
            this,
            this.p.stream.reset(this.pos - t.length),
          ),
        );
  }
  split() {
    let t = this,
      e = t.buffer.length;
    for (; e > 0 && t.buffer[e - 2] > t.reducePos; ) e -= 4;
    let s = t.buffer.slice(e),
      r = t.bufferBase + e;
    for (; t && r == t.bufferBase; ) t = t.parent;
    return new R(
      this.p,
      this.stack.slice(),
      this.state,
      this.reducePos,
      this.pos,
      this.score,
      s,
      r,
      this.curContext,
      this.lookAhead,
      t,
    );
  }
  recoverByDelete(t, e) {
    let s = t <= this.p.parser.maxNode;
    s && this.storeNode(t, this.pos, e, 4),
      this.storeNode(0, this.pos, e, s ? 8 : 4),
      (this.pos = this.reducePos = e),
      (this.score -= 190);
  }
  canShift(t) {
    for (let e = new z(this); ; ) {
      let s = this.p.parser.stateSlot(e.state, 4) || this.p.parser.hasAction(e.state, t);
      if (0 == (65536 & s)) return !0;
      if (0 == s) return !1;
      e.reduce(s);
    }
  }
  recoverByInsert(t) {
    if (this.stack.length >= 300) return [];
    let e = this.p.parser.nextStates(this.state);
    if (e.length > 8 || this.stack.length >= 120) {
      let s = [];
      for (let r, i = 0; i < e.length; i += 2)
        (r = e[i + 1]) != this.state && this.p.parser.hasAction(r, t) && s.push(e[i], r);
      if (this.stack.length < 120)
        for (let t = 0; s.length < 8 && t < e.length; t += 2) {
          let r = e[t + 1];
          s.some((t, e) => 1 & e && t == r) || s.push(e[t], r);
        }
      e = s;
    }
    let s = [];
    for (let t = 0; t < e.length && s.length < 4; t += 2) {
      let r = e[t + 1];
      if (r == this.state) continue;
      let i = this.split();
      i.pushState(r, this.pos),
        i.storeNode(0, i.pos, i.pos, 4, !0),
        i.shiftContext(e[t], this.pos),
        (i.score -= 200),
        s.push(i);
    }
    return s;
  }
  forceReduce() {
    let t = this.p.parser.stateSlot(this.state, 5);
    if (0 == (65536 & t)) return !1;
    let { parser: e } = this.p;
    if (!e.validAction(this.state, t)) {
      let s = t >> 19,
        r = 65535 & t,
        i = this.stack.length - 3 * s;
      if (i < 0 || e.getGoto(this.stack[i], r, !1) < 0) return !1;
      this.storeNode(0, this.reducePos, this.reducePos, 4, !0), (this.score -= 100);
    }
    return this.reduce(t), !0;
  }
  forceAll() {
    for (; !this.p.parser.stateFlag(this.state, 2); )
      if (!this.forceReduce()) {
        this.storeNode(0, this.pos, this.pos, 4, !0);
        break;
      }
    return this;
  }
  get deadEnd() {
    if (3 != this.stack.length) return !1;
    let { parser: t } = this.p;
    return 65535 == t.data[t.stateSlot(this.state, 1)] && !t.stateSlot(this.state, 4);
  }
  restart() {
    (this.state = this.stack[0]), (this.stack.length = 0);
  }
  sameState(t) {
    if (this.state != t.state || this.stack.length != t.stack.length) return !1;
    for (let e = 0; e < this.stack.length; e += 3) if (this.stack[e] != t.stack[e]) return !1;
    return !0;
  }
  get parser() {
    return this.p.parser;
  }
  dialectEnabled(t) {
    return this.p.parser.dialect.flags[t];
  }
  shiftContext(t, e) {
    this.curContext &&
      this.updateContext(
        this.curContext.tracker.shift(this.curContext.context, t, this, this.p.stream.reset(e)),
      );
  }
  reduceContext(t, e) {
    this.curContext &&
      this.updateContext(
        this.curContext.tracker.reduce(this.curContext.context, t, this, this.p.stream.reset(e)),
      );
  }
  emitContext() {
    let t = this.buffer.length - 1;
    (t < 0 || -3 != this.buffer[t]) &&
      this.buffer.push(this.curContext.hash, this.reducePos, this.reducePos, -3);
  }
  emitLookAhead() {
    let t = this.buffer.length - 1;
    (t < 0 || -4 != this.buffer[t]) &&
      this.buffer.push(this.lookAhead, this.reducePos, this.reducePos, -4);
  }
  updateContext(t) {
    if (t != this.curContext.context) {
      let e = new _(this.curContext.tracker, t);
      e.hash != this.curContext.hash && this.emitContext(), (this.curContext = e);
    }
  }
  setLookAhead(t) {
    t > this.lookAhead && (this.emitLookAhead(), (this.lookAhead = t));
  }
  close() {
    this.curContext && this.curContext.tracker.strict && this.emitContext(),
      this.lookAhead > 0 && this.emitLookAhead();
  }
}
class _ {
  constructor(t, e) {
    (this.tracker = t), (this.context = e), (this.hash = t.strict ? t.hash(e) : 0);
  }
}
var $;
!(function(t) {
  (t[(t.Insert = 200)] = 'Insert'),
    (t[(t.Delete = 190)] = 'Delete'),
    (t[(t.Reduce = 100)] = 'Reduce'),
    (t[(t.MaxNext = 4)] = 'MaxNext'),
    (t[(t.MaxInsertStackDepth = 300)] = 'MaxInsertStackDepth'),
    (t[(t.DampenInsertStackDepth = 120)] = 'DampenInsertStackDepth');
})($ || ($ = {}));
class z {
  constructor(t) {
    (this.start = t),
      (this.state = t.state),
      (this.stack = t.stack),
      (this.base = this.stack.length);
  }
  reduce(t) {
    let e = 65535 & t,
      s = t >> 19;
    0 == s
      ? (this.stack == this.start.stack && (this.stack = this.stack.slice()),
        this.stack.push(this.state, 0, 0),
        (this.base += 3))
      : (this.base -= 3 * (s - 1));
    let r = this.start.p.parser.getGoto(this.stack[this.base - 3], e, !0);
    this.state = r;
  }
}
class Q {
  constructor(t, e, s) {
    (this.stack = t),
      (this.pos = e),
      (this.index = s),
      (this.buffer = t.buffer),
      0 == this.index && this.maybeNext();
  }
  static create(t, e = t.bufferBase + t.buffer.length) {
    return new Q(t, e, e - t.bufferBase);
  }
  maybeNext() {
    let t = this.stack.parent;
    null != t &&
      ((this.index = this.stack.bufferBase - t.bufferBase),
      (this.stack = t),
      (this.buffer = t.buffer));
  }
  get id() {
    return this.buffer[this.index - 4];
  }
  get start() {
    return this.buffer[this.index - 3];
  }
  get end() {
    return this.buffer[this.index - 2];
  }
  get size() {
    return this.buffer[this.index - 1];
  }
  next() {
    (this.index -= 4), (this.pos -= 4), 0 == this.index && this.maybeNext();
  }
  fork() {
    return new Q(this.stack, this.pos, this.index);
  }
}
class I {
  constructor() {
    (this.start = -1),
      (this.value = -1),
      (this.end = -1),
      (this.extended = -1),
      (this.lookAhead = 0),
      (this.mask = 0),
      (this.context = 0);
  }
}
const D = new I();
class B {
  constructor(t, e) {
    (this.input = t),
      (this.ranges = e),
      (this.chunk = ''),
      (this.chunkOff = 0),
      (this.chunk2 = ''),
      (this.chunk2Pos = 0),
      (this.next = -1),
      (this.token = D),
      (this.rangeIndex = 0),
      (this.pos = this.chunkPos = e[0].from),
      (this.range = e[0]),
      (this.end = e[e.length - 1].to),
      this.readNext();
  }
  resolveOffset(t, e) {
    let s = this.range,
      r = this.rangeIndex,
      i = this.pos + t;
    for (; i < s.from; ) {
      if (!r) return null;
      let t = this.ranges[--r];
      (i -= s.from - t.to), (s = t);
    }
    for (; e < 0 ? i > s.to : i >= s.to; ) {
      if (r == this.ranges.length - 1) return null;
      let t = this.ranges[++r];
      (i += t.from - s.to), (s = t);
    }
    return i;
  }
  peek(t) {
    let e,
      s,
      r = this.chunkOff + t;
    if (r >= 0 && r < this.chunk.length) (e = this.pos + t), (s = this.chunk.charCodeAt(r));
    else {
      let r = this.resolveOffset(t, 1);
      if (null == r) return -1;
      if (((e = r), e >= this.chunk2Pos && e < this.chunk2Pos + this.chunk2.length))
        s = this.chunk2.charCodeAt(e - this.chunk2Pos);
      else {
        let t = this.rangeIndex,
          r = this.range;
        for (; r.to <= e; ) r = this.ranges[++t];
        (this.chunk2 = this.input.chunk((this.chunk2Pos = e))),
          e + this.chunk2.length > r.to && (this.chunk2 = this.chunk2.slice(0, r.to - e)),
          (s = this.chunk2.charCodeAt(0));
      }
    }
    return e >= this.token.lookAhead && (this.token.lookAhead = e + 1), s;
  }
  acceptToken(t, e = 0) {
    let s = e ? this.resolveOffset(e, -1) : this.pos;
    if (null == s || s < this.token.start) throw new RangeError('Token end out of bounds');
    (this.token.value = t), (this.token.end = s);
  }
  getChunk() {
    if (this.pos >= this.chunk2Pos && this.pos < this.chunk2Pos + this.chunk2.length) {
      let { chunk: t, chunkPos: e } = this;
      (this.chunk = this.chunk2),
        (this.chunkPos = this.chunk2Pos),
        (this.chunk2 = t),
        (this.chunk2Pos = e),
        (this.chunkOff = this.pos - this.chunkPos);
    } else {
      (this.chunk2 = this.chunk), (this.chunk2Pos = this.chunkPos);
      let t = this.input.chunk(this.pos),
        e = this.pos + t.length;
      (this.chunk = e > this.range.to ? t.slice(0, this.range.to - this.pos) : t),
        (this.chunkPos = this.pos),
        (this.chunkOff = 0);
    }
  }
  readNext() {
    return this.chunkOff >= this.chunk.length &&
      (this.getChunk(), this.chunkOff == this.chunk.length)
      ? (this.next = -1)
      : (this.next = this.chunk.charCodeAt(this.chunkOff));
  }
  advance(t = 1) {
    for (this.chunkOff += t; this.pos + t >= this.range.to; ) {
      if (this.rangeIndex == this.ranges.length - 1) return this.setDone();
      (t -= this.range.to - this.pos),
        (this.range = this.ranges[++this.rangeIndex]),
        (this.pos = this.range.from);
    }
    return (
      (this.pos += t),
      this.pos >= this.token.lookAhead && (this.token.lookAhead = this.pos + 1),
      this.readNext()
    );
  }
  setDone() {
    return (
      (this.pos = this.chunkPos = this.end),
      (this.range = this.ranges[(this.rangeIndex = this.ranges.length - 1)]),
      (this.chunk = ''),
      (this.next = -1)
    );
  }
  reset(t, e) {
    if (
      (e
        ? ((this.token = e), (e.start = t), (e.lookAhead = t + 1), (e.value = e.extended = -1))
        : (this.token = D),
      this.pos != t)
    ) {
      if (((this.pos = t), t == this.end)) return this.setDone(), this;
      for (; t < this.range.from; ) this.range = this.ranges[--this.rangeIndex];
      for (; t >= this.range.to; ) this.range = this.ranges[++this.rangeIndex];
      t >= this.chunkPos && t < this.chunkPos + this.chunk.length
        ? (this.chunkOff = t - this.chunkPos)
        : ((this.chunk = ''), (this.chunkOff = 0)),
        this.readNext();
    }
    return this;
  }
  read(t, e) {
    if (t >= this.chunkPos && e <= this.chunkPos + this.chunk.length)
      return this.chunk.slice(t - this.chunkPos, e - this.chunkPos);
    if (t >= this.chunk2Pos && e <= this.chunk2Pos + this.chunk2.length)
      return this.chunk2.slice(t - this.chunk2Pos, e - this.chunk2Pos);
    if (t >= this.range.from && e <= this.range.to) return this.input.read(t, e);
    let s = '';
    for (let r of this.ranges) {
      if (r.from >= e) break;
      r.to > t && (s += this.input.read(Math.max(r.from, t), Math.min(r.to, e)));
    }
    return s;
  }
}
class V {
  constructor(t, e) {
    (this.data = t), (this.id = e);
  }
  token(t, e) {
    L(this.data, t, e, this.id);
  }
}
V.prototype.contextual = V.prototype.fallback = V.prototype.extend = !1;
class E {
  constructor(t, e = {}) {
    (this.token = t),
      (this.contextual = !!e.contextual),
      (this.fallback = !!e.fallback),
      (this.extend = !!e.extend);
  }
}
function L(t, e, s, r) {
  let i = 0,
    n = 1 << r,
    { parser: h } = s.p,
    { dialect: o } = h;
  t: for (; 0 != (n & t[i]); ) {
    let s = t[i + 1];
    for (let r = i + 3; r < s; r += 2)
      if ((t[r + 1] & n) > 0) {
        let s = t[r];
        if (
          o.allows(s) &&
          (-1 == e.token.value || e.token.value == s || h.overrides(s, e.token.value))
        ) {
          e.acceptToken(s);
          break;
        }
      }
    for (let r = e.next, n = 0, h = t[i + 2]; n < h; ) {
      let o = (n + h) >> 1,
        a = s + o + (o << 1),
        l = t[a],
        u = t[a + 1];
      if (r < l) h = o;
      else {
        if (!(r >= u)) {
          (i = t[a + 2]), e.advance();
          continue t;
        }
        n = o + 1;
      }
    }
    break;
  }
}
function M(t, e = Uint16Array) {
  if ('string' != typeof t) return t;
  let s = null;
  for (let r = 0, i = 0; r < t.length; ) {
    let n = 0;
    for (;;) {
      let e = t.charCodeAt(r++),
        s = !1;
      if (126 == e) {
        n = 65535;
        break;
      }
      e >= 92 && e--, e >= 34 && e--;
      let i = e - 32;
      if ((i >= 46 && ((i -= 46), (s = !0)), (n += i), s)) break;
      n *= 46;
    }
    s ? (s[i++] = n) : (s = new e(n));
  }
  return s;
}
const G = 'undefined' != typeof process && /\bparse\b/.test(process.env.LOG);
let F = null;
var U, Z;
function j(t, e, s) {
  let r = t.cursor(l.IncludeAnonymous);
  for (r.moveTo(e); ; )
    if (!(s < 0 ? r.childBefore(e) : r.childAfter(e)))
      for (;;) {
        if ((s < 0 ? r.to < e : r.from > e) && !r.type.isError)
          return s < 0
            ? Math.max(0, Math.min(r.to - 1, e - 25))
            : Math.min(t.length, Math.max(r.from + 1, e + 25));
        if (s < 0 ? r.prevSibling() : r.nextSibling()) break;
        if (!r.parent()) return s < 0 ? 0 : t.length;
      }
}
!(function(t) {
  t[(t.Margin = 25)] = 'Margin';
})(U || (U = {}));
class q {
  constructor(t, e) {
    (this.fragments = t),
      (this.nodeSet = e),
      (this.i = 0),
      (this.fragment = null),
      (this.safeFrom = -1),
      (this.safeTo = -1),
      (this.trees = []),
      (this.start = []),
      (this.index = []),
      this.nextFragment();
  }
  nextFragment() {
    let t = (this.fragment = this.i == this.fragments.length ? null : this.fragments[this.i++]);
    if (t) {
      for (
        this.safeFrom = t.openStart ? j(t.tree, t.from + t.offset, 1) - t.offset : t.from,
          this.safeTo = t.openEnd ? j(t.tree, t.to + t.offset, -1) - t.offset : t.to;
        this.trees.length;

      )
        this.trees.pop(), this.start.pop(), this.index.pop();
      this.trees.push(t.tree),
        this.start.push(-t.offset),
        this.index.push(0),
        (this.nextStart = this.safeFrom);
    } else this.nextStart = 1e9;
  }
  nodeAt(t) {
    if (t < this.nextStart) return null;
    for (; this.fragment && this.safeTo <= t; ) this.nextFragment();
    if (!this.fragment) return null;
    for (;;) {
      let e = this.trees.length - 1;
      if (e < 0) return this.nextFragment(), null;
      let s = this.trees[e],
        i = this.index[e];
      if (i == s.children.length) {
        this.trees.pop(), this.start.pop(), this.index.pop();
        continue;
      }
      let n = s.children[i],
        h = this.start[e] + s.positions[i];
      if (h > t) return (this.nextStart = h), null;
      if (n instanceof u) {
        if (h == t) {
          if (h < this.safeFrom) return null;
          let t = h + n.length;
          if (t <= this.safeTo) {
            let e = n.prop(r.lookAhead);
            if (!e || t + e < this.fragment.to) return n;
          }
        }
        this.index[e]++,
          h + n.length >= Math.max(this.safeFrom, t) &&
            (this.trees.push(n), this.start.push(h), this.index.push(0));
      } else this.index[e]++, (this.nextStart = h + n.length);
    }
  }
}
class W {
  constructor(t, e) {
    (this.stream = e),
      (this.tokens = []),
      (this.mainToken = null),
      (this.actions = []),
      (this.tokens = t.tokenizers.map(t => new I()));
  }
  getActions(t) {
    let e = 0,
      s = null,
      { parser: r } = t.p,
      { tokenizers: i } = r,
      n = r.stateSlot(t.state, 3),
      h = t.curContext ? t.curContext.hash : 0,
      o = 0;
    for (let r = 0; r < i.length; r++) {
      if (0 == ((1 << r) & n)) continue;
      let a = i[r],
        l = this.tokens[r];
      if (
        (!s || a.fallback) &&
        ((a.contextual || l.start != t.pos || l.mask != n || l.context != h) &&
          (this.updateCachedToken(l, a, t), (l.mask = n), (l.context = h)),
        l.lookAhead > l.end + 25 && (o = Math.max(l.lookAhead, o)),
        0 != l.value)
      ) {
        let r = e;
        if (
          (l.extended > -1 && (e = this.addActions(t, l.extended, l.end, e)),
          (e = this.addActions(t, l.value, l.end, e)),
          !a.extend && ((s = l), e > r))
        )
          break;
      }
    }
    for (; this.actions.length > e; ) this.actions.pop();
    return (
      o && t.setLookAhead(o),
      s ||
        t.pos != this.stream.end ||
        ((s = new I()),
        (s.value = t.p.parser.eofTerm),
        (s.start = s.end = t.pos),
        (e = this.addActions(t, s.value, s.end, e))),
      (this.mainToken = s),
      this.actions
    );
  }
  getMainToken(t) {
    if (this.mainToken) return this.mainToken;
    let e = new I(),
      { pos: s, p: r } = t;
    return (
      (e.start = s),
      (e.end = Math.min(s + 1, r.stream.end)),
      (e.value = s == r.stream.end ? r.parser.eofTerm : 0),
      e
    );
  }
  updateCachedToken(t, e, s) {
    if ((e.token(this.stream.reset(s.pos, t), s), t.value > -1)) {
      let { parser: e } = s.p;
      for (let r = 0; r < e.specialized.length; r++)
        if (e.specialized[r] == t.value) {
          let i = e.specializers[r](this.stream.read(t.start, t.end), s);
          if (i >= 0 && s.p.parser.dialect.allows(i >> 1)) {
            0 == (1 & i) ? (t.value = i >> 1) : (t.extended = i >> 1);
            break;
          }
        }
    } else (t.value = 0), (t.end = Math.min(s.p.stream.end, s.pos + 1));
  }
  putAction(t, e, s, r) {
    for (let e = 0; e < r; e += 3) if (this.actions[e] == t) return r;
    return (this.actions[r++] = t), (this.actions[r++] = e), (this.actions[r++] = s), r;
  }
  addActions(t, e, s, r) {
    let { state: i } = t,
      { parser: n } = t.p,
      { data: h } = n;
    for (let t = 0; t < 2; t++)
      for (let o = n.stateSlot(i, t ? 2 : 1); ; o += 3) {
        if (65535 == h[o]) {
          if (1 != h[o + 1]) {
            0 == r && 2 == h[o + 1] && (r = this.putAction(et(h, o + 2), e, s, r));
            break;
          }
          o = et(h, o + 2);
        }
        h[o] == e && (r = this.putAction(et(h, o + 1), e, s, r));
      }
    return r;
  }
}
!(function(t) {
  (t[(t.Distance = 5)] = 'Distance'),
    (t[(t.MaxRemainingPerStep = 3)] = 'MaxRemainingPerStep'),
    (t[(t.MinBufferLengthPrune = 500)] = 'MinBufferLengthPrune'),
    (t[(t.ForceReduceLimit = 10)] = 'ForceReduceLimit'),
    (t[(t.CutDepth = 15e3)] = 'CutDepth'),
    (t[(t.CutTo = 9e3)] = 'CutTo');
})(Z || (Z = {}));
class X {
  constructor(t, e, s, r) {
    (this.parser = t),
      (this.input = e),
      (this.ranges = r),
      (this.recovering = 0),
      (this.nextStackID = 9812),
      (this.minStackPos = 0),
      (this.reused = []),
      (this.stoppedAt = null),
      (this.stream = new B(e, r)),
      (this.tokens = new W(t, this.stream)),
      (this.topTerm = t.top[1]);
    let { from: i } = r[0];
    (this.stacks = [R.start(this, t.top[0], i)]),
      (this.fragments =
        s.length && this.stream.end - i > 4 * t.bufferLength ? new q(s, t.nodeSet) : null);
  }
  get parsedPos() {
    return this.minStackPos;
  }
  advance() {
    let t,
      e,
      s = this.stacks,
      r = this.minStackPos,
      i = (this.stacks = []);
    for (let n = 0; n < s.length; n++) {
      let h = s[n];
      for (;;) {
        if (((this.tokens.mainToken = null), h.pos > r)) i.push(h);
        else {
          if (this.advanceStack(h, i, s)) continue;
          {
            t || ((t = []), (e = [])), t.push(h);
            let s = this.tokens.getMainToken(h);
            e.push(s.value, s.end);
          }
        }
        break;
      }
    }
    if (!i.length) {
      let e = t && rt(t);
      if (e) return this.stackToTree(e);
      if (this.parser.strict)
        throw (G &&
          t &&
          console.log(
            'Stuck with token ' +
              (this.tokens.mainToken ? this.parser.getName(this.tokens.mainToken.value) : 'none'),
          ),
        new SyntaxError('No parse at ' + r));
      this.recovering || (this.recovering = 5);
    }
    if (this.recovering && t) {
      let s =
        null != this.stoppedAt && t[0].pos > this.stoppedAt ? t[0] : this.runRecovery(t, e, i);
      if (s) return this.stackToTree(s.forceAll());
    }
    if (this.recovering) {
      let t = 1 == this.recovering ? 1 : 3 * this.recovering;
      if (i.length > t) for (i.sort((t, e) => e.score - t.score); i.length > t; ) i.pop();
      i.some(t => t.reducePos > r) && this.recovering--;
    } else if (i.length > 1)
      t: for (let t = 0; t < i.length - 1; t++) {
        let e = i[t];
        for (let s = t + 1; s < i.length; s++) {
          let r = i[s];
          if (e.sameState(r) || (e.buffer.length > 500 && r.buffer.length > 500)) {
            if (!((e.score - r.score || e.buffer.length - r.buffer.length) > 0)) {
              i.splice(t--, 1);
              continue t;
            }
            i.splice(s--, 1);
          }
        }
      }
    this.minStackPos = i[0].pos;
    for (let t = 1; t < i.length; t++) i[t].pos < this.minStackPos && (this.minStackPos = i[t].pos);
    return null;
  }
  stopAt(t) {
    if (null != this.stoppedAt && this.stoppedAt < t)
      throw new RangeError("Can't move stoppedAt forward");
    this.stoppedAt = t;
  }
  advanceStack(t, e, s) {
    let i = t.pos,
      { parser: n } = this,
      h = G ? this.stackID(t) + ' -> ' : '';
    if (null != this.stoppedAt && i > this.stoppedAt) return t.forceReduce() ? t : null;
    if (this.fragments) {
      let e = t.curContext && t.curContext.tracker.strict,
        s = e ? t.curContext.hash : 0;
      for (let o = this.fragments.nodeAt(i); o; ) {
        let i = this.parser.nodeSet.types[o.type.id] == o.type ? n.getGoto(t.state, o.type.id) : -1;
        if (i > -1 && o.length && (!e || (o.prop(r.contextHash) || 0) == s))
          return (
            t.useNode(o, i),
            G && console.log(h + this.stackID(t) + ` (via reuse of ${n.getName(o.type.id)})`),
            !0
          );
        if (!(o instanceof u) || 0 == o.children.length || o.positions[0] > 0) break;
        let a = o.children[0];
        if (!(a instanceof u && 0 == o.positions[0])) break;
        o = a;
      }
    }
    let o = n.stateSlot(t.state, 4);
    if (o > 0)
      return (
        t.reduce(o),
        G && console.log(h + this.stackID(t) + ` (via always-reduce ${n.getName(65535 & o)})`),
        !0
      );
    if (t.stack.length >= 15e3) for (; t.stack.length > 9e3 && t.forceReduce(); );
    let a = this.tokens.getActions(t);
    for (let r = 0; r < a.length; ) {
      let o = a[r++],
        l = a[r++],
        u = a[r++],
        f = r == a.length || !s,
        c = f ? t : t.split();
      if (
        (c.apply(o, l, u),
        G &&
          console.log(
            h +
              this.stackID(c) +
              ` (via ${
                0 == (65536 & o) ? 'shift' : `reduce of ${n.getName(65535 & o)}`
              } for ${n.getName(l)} @ ${i}${c == t ? '' : ', split'})`,
          ),
        f)
      )
        return !0;
      c.pos > i ? e.push(c) : s.push(c);
    }
    return !1;
  }
  advanceFully(t, e) {
    let s = t.pos;
    for (;;) {
      if (!this.advanceStack(t, null, null)) return !1;
      if (t.pos > s) return Y(t, e), !0;
    }
  }
  runRecovery(t, e, s) {
    let r = null,
      i = !1;
    for (let n = 0; n < t.length; n++) {
      let h = t[n],
        o = e[n << 1],
        a = e[1 + (n << 1)],
        l = G ? this.stackID(h) + ' -> ' : '';
      if (h.deadEnd) {
        if (i) continue;
        if (
          ((i = !0),
          h.restart(),
          G && console.log(l + this.stackID(h) + ' (restarted)'),
          this.advanceFully(h, s))
        )
          continue;
      }
      let u = h.split(),
        f = l;
      for (let t = 0; u.forceReduce() && t < 10; t++) {
        if (
          (G && console.log(f + this.stackID(u) + ' (via force-reduce)'), this.advanceFully(u, s))
        )
          break;
        G && (f = this.stackID(u) + ' -> ');
      }
      for (let t of h.recoverByInsert(o))
        G && console.log(l + this.stackID(t) + ' (via recover-insert)'), this.advanceFully(t, s);
      this.stream.end > h.pos
        ? (a == h.pos && (a++, (o = 0)),
          h.recoverByDelete(o, a),
          G && console.log(l + this.stackID(h) + ` (via recover-delete ${this.parser.getName(o)})`),
          Y(h, s))
        : (!r || r.score < h.score) && (r = h);
    }
    return r;
  }
  stackToTree(t) {
    return (
      t.close(),
      u.build({
        buffer: Q.create(t),
        nodeSet: this.parser.nodeSet,
        topID: this.topTerm,
        maxBufferLength: this.parser.bufferLength,
        reused: this.reused,
        start: this.ranges[0].from,
        length: t.pos - this.ranges[0].from,
        minRepeatType: this.parser.minRepeatTerm,
      })
    );
  }
  stackID(t) {
    let e = (F || (F = new WeakMap())).get(t);
    return e || F.set(t, (e = String.fromCodePoint(this.nextStackID++))), e + t;
  }
}
function Y(t, e) {
  for (let s = 0; s < e.length; s++) {
    let r = e[s];
    if (r.pos == t.pos && r.sameState(t)) return void (e[s].score < t.score && (e[s] = t));
  }
  e.push(t);
}
class H {
  constructor(t, e, s) {
    (this.source = t), (this.flags = e), (this.disabled = s);
  }
  allows(t) {
    return !this.disabled || 0 == this.disabled[t];
  }
}
const J = t => t;
class K {
  constructor(t) {
    (this.start = t.start),
      (this.shift = t.shift || J),
      (this.reduce = t.reduce || J),
      (this.reuse = t.reuse || J),
      (this.hash = t.hash || (() => 0)),
      (this.strict = !1 !== t.strict);
  }
}
class tt extends T {
  constructor(e) {
    if ((super(), (this.wrappers = []), 14 != e.version))
      throw new RangeError(`Parser version (${e.version}) doesn't match runtime version (14)`);
    let s = e.nodeNames.split(' ');
    this.minRepeatTerm = s.length;
    for (let t = 0; t < e.repeatNodeCount; t++) s.push('');
    let i = Object.keys(e.topRules).map(t => e.topRules[t][1]),
      o = [];
    for (let t = 0; t < s.length; t++) o.push([]);
    function a(t, e, s) {
      o[t].push([e, e.deserialize(String(s))]);
    }
    if (e.nodeProps)
      for (let t of e.nodeProps) {
        let e = t[0];
        'string' == typeof e && (e = r[e]);
        for (let s = 1; s < t.length; ) {
          let r = t[s++];
          if (r >= 0) a(r, e, t[s++]);
          else {
            let i = t[s + -r];
            for (let n = -r; n > 0; n--) a(t[s++], e, i);
            s++;
          }
        }
      }
    (this.nodeSet = new h(
      s.map((t, s) =>
        n.define({
          name: s >= this.minRepeatTerm ? void 0 : t,
          id: s,
          props: o[s],
          top: i.indexOf(s) > -1,
          error: 0 == s,
          skipped: e.skippedNodes && e.skippedNodes.indexOf(s) > -1,
        }),
      ),
    )),
      e.propSources && (this.nodeSet = this.nodeSet.extend(...e.propSources)),
      (this.strict = !1),
      (this.bufferLength = t);
    let l = M(e.tokenData);
    if (
      ((this.context = e.context),
      (this.specialized = new Uint16Array(e.specialized ? e.specialized.length : 0)),
      (this.specializers = []),
      e.specialized)
    )
      for (let t = 0; t < e.specialized.length; t++)
        (this.specialized[t] = e.specialized[t].term),
          (this.specializers[t] = e.specialized[t].get);
    (this.states = M(e.states, Uint32Array)),
      (this.data = M(e.stateData)),
      (this.goto = M(e.goto)),
      (this.maxTerm = e.maxTerm),
      (this.tokenizers = e.tokenizers.map(t => ('number' == typeof t ? new V(l, t) : t))),
      (this.topRules = e.topRules),
      (this.dialects = e.dialects || {}),
      (this.dynamicPrecedences = e.dynamicPrecedences || null),
      (this.tokenPrecTable = e.tokenPrec),
      (this.termNames = e.termNames || null),
      (this.maxNode = this.nodeSet.types.length - 1),
      (this.dialect = this.parseDialect()),
      (this.top = this.topRules[Object.keys(this.topRules)[0]]);
  }
  createParse(t, e, s) {
    let r = new X(this, t, e, s);
    for (let i of this.wrappers) r = i(r, t, e, s);
    return r;
  }
  getGoto(t, e, s = !1) {
    let r = this.goto;
    if (e >= r[0]) return -1;
    for (let i = r[e + 1]; ; ) {
      let e = r[i++],
        n = 1 & e,
        h = r[i++];
      if (n && s) return h;
      for (let s = i + (e >> 1); i < s; i++) if (r[i] == t) return h;
      if (n) return -1;
    }
  }
  hasAction(t, e) {
    let s = this.data;
    for (let r = 0; r < 2; r++)
      for (let i, n = this.stateSlot(t, r ? 2 : 1); ; n += 3) {
        if (65535 == (i = s[n])) {
          if (1 != s[n + 1]) {
            if (2 == s[n + 1]) return et(s, n + 2);
            break;
          }
          i = s[(n = et(s, n + 2))];
        }
        if (i == e || 0 == i) return et(s, n + 1);
      }
    return 0;
  }
  stateSlot(t, e) {
    return this.states[6 * t + e];
  }
  stateFlag(t, e) {
    return (this.stateSlot(t, 0) & e) > 0;
  }
  validAction(t, e) {
    if (e == this.stateSlot(t, 4)) return !0;
    for (let s = this.stateSlot(t, 1); ; s += 3) {
      if (65535 == this.data[s]) {
        if (1 != this.data[s + 1]) return !1;
        s = et(this.data, s + 2);
      }
      if (e == et(this.data, s + 1)) return !0;
    }
  }
  nextStates(t) {
    let e = [];
    for (let s = this.stateSlot(t, 1); ; s += 3) {
      if (65535 == this.data[s]) {
        if (1 != this.data[s + 1]) break;
        s = et(this.data, s + 2);
      }
      if (0 == (1 & this.data[s + 2])) {
        let t = this.data[s + 1];
        e.some((e, s) => 1 & s && e == t) || e.push(this.data[s], t);
      }
    }
    return e;
  }
  overrides(t, e) {
    let s = st(this.data, this.tokenPrecTable, e);
    return s < 0 || st(this.data, this.tokenPrecTable, t) < s;
  }
  configure(t) {
    let e = Object.assign(Object.create(tt.prototype), this);
    if ((t.props && (e.nodeSet = this.nodeSet.extend(...t.props)), t.top)) {
      let s = this.topRules[t.top];
      if (!s) throw new RangeError(`Invalid top rule name ${t.top}`);
      e.top = s;
    }
    return (
      t.tokenizers &&
        (e.tokenizers = this.tokenizers.map(e => {
          let s = t.tokenizers.find(t => t.from == e);
          return s ? s.to : e;
        })),
      t.contextTracker && (e.context = t.contextTracker),
      t.dialect && (e.dialect = this.parseDialect(t.dialect)),
      null != t.strict && (e.strict = t.strict),
      t.wrap && (e.wrappers = e.wrappers.concat(t.wrap)),
      null != t.bufferLength && (e.bufferLength = t.bufferLength),
      e
    );
  }
  hasWrappers() {
    return this.wrappers.length > 0;
  }
  getName(t) {
    return this.termNames
      ? this.termNames[t]
      : String((t <= this.maxNode && this.nodeSet.types[t].name) || t);
  }
  get eofTerm() {
    return this.maxNode + 1;
  }
  get topNode() {
    return this.nodeSet.types[this.top[1]];
  }
  dynamicPrecedence(t) {
    let e = this.dynamicPrecedences;
    return null == e ? 0 : e[t] || 0;
  }
  parseDialect(t) {
    let e = Object.keys(this.dialects),
      s = e.map(() => !1);
    if (t)
      for (let r of t.split(' ')) {
        let t = e.indexOf(r);
        t >= 0 && (s[t] = !0);
      }
    let r = null;
    for (let t = 0; t < e.length; t++)
      if (!s[t])
        for (let s, i = this.dialects[e[t]]; 65535 != (s = this.data[i++]); )
          (r || (r = new Uint8Array(this.maxTerm + 1)))[s] = 1;
    return new H(t, s, r);
  }
  static deserialize(t) {
    return new tt(t);
  }
}
function et(t, e) {
  return t[e] | (t[e + 1] << 16);
}
function st(t, e, s) {
  for (let r, i = e; 65535 != (r = t[i]); i++) if (r == s) return i - e;
  return -1;
}
function rt(t) {
  let e = null;
  for (let s of t) {
    let t = s.p.stoppedAt;
    (s.pos == s.p.stream.end || (null != t && s.pos > t)) &&
      s.p.parser.stateFlag(s.state, 2) &&
      (!e || e.score < s.score) &&
      (e = s);
  }
  return e;
}
const it = 28,
  nt = 29,
  ht = 1,
  ot = 8,
  at = 1,
  lt = 2,
  ut = '() <>?=.0123456789[]〚〛',
  ft = new E(t => {
    let e = '';
    for (; !(t.next < 0); ) {
      if (46 === t.next && 'lost' === e) return t.advance(), void t.acceptToken(nt);
      const s = String.fromCharCode(t.next);
      if (ut.indexOf(s) > -1) break;
      if (803 === t.peek(1)) break;
      (e += s), t.advance();
    }
    e.length > 0 && t.acceptToken(it);
  }),
  ct = new E(t => {
    let e = 0;
    for (; !(t.next < 0 || ut.indexOf(String.fromCharCode(t.next)) > -1); ) {
      if (803 !== t.peek(1)) break;
      e++, t.advance(2);
    }
    e > 0 && t.acceptToken(ht);
  }),
  pt = new E(t => {
    let e = '';
    for (; !(t.next < 0) && ((e += String.fromCharCode(t.next)), /\S+/.test(e)); ) {
      if (40 === t.peek(1)) {
        t.acceptToken(at);
        break;
      }
      t.advance();
    }
    console.log('chars: %s', e), e.length > 0 && t.acceptToken(ot);
  }),
  dt = new E(t => {
    if (40 === t.next) {
      let e;
      for (; (e = t.advance()) > -1; ) if (41 === e) return void t.acceptToken(lt);
    }
  }),
  gt = tt.deserialize({
    version: 14,
    states:
      "'nOQOVOOOQOVO'#C_OQOVO'#C`OQOVO'#CaO!eOWO'#CbO!mOVO'#CjO#tOVO'#CkOOOR'#Cm'#CmO$OOSO'#CnO!mOVO'#CoOOOR'#DV'#DVOOOR'#Cp'#CpO$TOSO'#CrO!mOVO'#CtOOOR'#Cf'#CfOOOR'#Cz'#CzOOOR'#Cu'#CuQQOVOOO$]OVO,58yO$dOVO,58zO$kOVO,58{OQOVO,58|OQOVO,59OOOOR'#Cv'#CvO$rOVO,59UO$yOVO,59VOOOR,59V,59VO%TOSO,59VO%YOSO,59YO%_OVO,59ZO%iOSO,59^O%nOVO,59`OOOR-E6s-E6sOOOR1G.e1G.eOOOR1G.f1G.fOOOR1G.g1G.gO%uOVO1G.hO%|OVO1G.jOOOR-E6t-E6tOOOR1G.p1G.pOOOR1G.q1G.qO&TOSO1G.qOOOR1G.t1G.tOOOR1G.u1G.uO&YOSO1G.uOOOR1G.x1G.xOOOR1G.z1G.zOOOR7+$S7+$SOOOR7+$U7+$UOOOR7+$]7+$]OOOR7+$a7+$a",
    stateData:
      '&b~OP^OZ^O[^O]^OeZOg^OlZOm[OoPOqQOsROtSOuTOwUOzVO{WO}XO!OZO!PZO!QZO!S]O~OVeOXfO~OP^OZ^O[^O]^OeZOg^OlZOm[OuTOwUOzVO{WO}XO!OZO!PZO!QZO!S]O~O`kOxjO~P!mO]lO~O]nOenO~OpqO~PQOrrO~PQOrsO~PQOvwO~P!mO`yOxxO~P!mOxxO~O|zO~O`|O|{O~P!mO!R}O~O!T!OO~P!mOr!PO~PQOr!QO~PQOx!RO~O|!SO~O[]~',
    goto:
      '$}zPPP{{{{P{P!ZPPP!s!sP#Z#Z#Z!sP!sP!s#q$]PPP$oPPPPPPPPPP!si_OPQRabcdeftuh_OPQRabcdeftuagTUX]himoy^OPQRTUX]abcdefhimotuyYOPQRTUX]abcdefhimotuQaOQbPQcQQdR[pabcdtuQteRufQhTQiUQmXQo]Xvhimoi`OPQRabcdeftu',
    nodeNames:
      '⚠ Unclear Document Div Recto Verso Part PartId Fragment FragmentNum Inline LineBreakWrapped LineBreak Number Abbrev Supplied CertLow GapUnknown Gap SuppliedLost Text QuestionMark LostLines Illegible Erasure',
    maxTerm: 51,
    skippedNodes: [0],
    repeatNodeCount: 2,
    tokenData:
      "+O~Rapq!Wxy!]yz!p!O!P!u!Q![#v!^!_&{!_!`(O!`!a(k!a!b(p!c!}&f!}#O(u#P#Q)b#T#`&f#`#a)g#a#o&f&Fp&Fq*t&Fq&Fr*y~!]O!P~~!bPu~!a!b!e~!hPyz!k~!pO`~~!uOv~~!zQ!O~!Q![#Q!a!b#n~#VQg~!Q![#Q#`#a#]~#`P#]#^#c~#fP#b#c#i~#nOg~~#sPg~#`#a#]~#{S]P!O!P$X!Q![#v!c!}&f#T#o&f~$^S[Ppq$j}!O$o#Y#Z$|#d#e%}P$oO[P~$tPZ~pq$w~$|OZ~~%PP#f#g%S~%VP#T#U%Y~%]P#Z#[%`~%cP#a#b%f~%iP#X#Y%l~%oP#b#c%r~%uP#h#i%x~%}OX~Q&QP#T#U&TQ&WP#f#g&ZQ&^P#h#i&aQ&fOVQQ&iS!O!P&u!Q![&f!c!}&f#T#o&fQ&xP#d#e%}~'QQw~!_!`'W!f!g']~']Oo~~'`P!_!`'c~'fP!O!P'i~'nQt~#f#g't#j#k'y~'yOq~~(OOs~~(TQ!Q~!`!a(Z!f!g(`~(`Op~~(cP!`!a(f~(kOr~~(pOx~~(uOe~~(zP}~!O!P(}~)SP{~!a!b)V~)YP#P#Q)]~)bOz~~)gO|~R)jU!O!P&u!Q![&f!c!}&f#T#]&f#]#^)|#^#o&fR*PU!O!P&u!Q![&f!c!}&f#T#b&f#b#c*c#c#o&fR*hS!RP!O!P&u!Q![&f!c!}&f#T#o&f~*yO!S~~+OO!T~",
    tokenizers: [ft, ct, 0, 1],
    topRules: { Document: [0, 2] },
    tokenPrec: 245,
  }),
  kt = ['Recto', 'Verso', 'Fragment', 'Part', 'Div'],
  xt = 'xmlns="http://www.tei-c.org/ns/1.0"';
function mt(t, e = gt.parse(t)) {
  function s(e) {
    return t.substring(e.from, e.to);
  }
  const r = [];
  return (
    e.iterate({
      enter: t => {
        if (t.type.isError) return void r.push(`\x3c!-- Error:${s(t)} --\x3e`);
        const e = t.name;
        switch (e) {
          case 'Document':
            break;
          case 'Text':
            r.push(s(t));
            break;
          case 'Abbreviation':
            r.push('<expan>');
            break;
          case 'Abbrev':
            r.push('<ex>');
            break;
          default:
            r.push(`<${e}>`);
        }
      },
      leave: t => {
        switch (t.name) {
          case 'Abbreviation':
            r.push('</expan>');
            break;
          case 'Abbrev':
            r.push('</ex>');
        }
      },
    }),
    r.join('')
  );
}
function bt(t, e = gt.parse(t)) {
  function s(e) {
    return t.substring(e.from, e.to);
  }
  const r = [],
    i = [];
  let n,
    h = !1,
    o = !0,
    a = 'ab';
  return (
    e.iterate({
      enter: t => {
        if (t.type.isError) return void i.push(`\x3c!-- Error:${s(t)} --\x3e`);
        const e = t.name;
        switch (e) {
          case 'Document':
            let l = 0;
            if (t.firstChild())
              do {
                l++, kt.includes(t.type.name) && (a = 'div'), (h = h || 'Inline' === t.type.name);
              } while (t.nextSibling());
            (h = l > 1 || h), h && ((o = !1), i.push(`<${a} ${xt}>`)), t.parent();
            break;
          case 'Text':
          case 'Number':
            i.push(s(t));
            break;
          case 'LineBreak':
            t.firstChild(), (n = /^([0-9]+)\..*$/.exec(s(t))), i.push(`<lb n="${n ? n[1] : ''}"/>`);
            break;
          case 'LineBreakWrapped':
            t.firstChild(),
              (n = /^([0-9]+)\..*$/.exec(s(t))),
              i.push(`<lb n="${n ? n[1] : ''}" break="no"/>`);
            break;
          case 'Div':
            let u = '<ab';
            o && ((u += ' ' + xt), (o = !1)), (u += '>'), i.push(u);
            break;
          case 'Recto':
          case 'Verso':
            let f = '<div n="r" type="textpart"';
            o && ((f += ' ' + xt), (o = !1)), (f += '>'), i.push(f);
            break;
          case 'Fragment':
            t.firstChild(), (n = /^([0-9]+)\..*$/.exec(s(t)));
            let c = `<div n="${n ? n[1] : ''}" subtype="fragment" type="textpart"`;
            o && ((c += ' ' + xt), (o = !1)), (c += '>'), i.push(c);
            break;
          case 'Part':
            t.firstChild(), (n = /^([a-zA-Z0-9]+)\..*$/.exec(s(t)));
            let p = `<div n="${n ? n[1] : ''}" subtype="part" type="textpart"`;
            o && ((p += ' ' + xt), (o = !1)), (p += '>'), i.push(p);
            break;
          case 'Unclear':
            const d = s(t);
            let g = '';
            for (let t = 0; t < d.length; t++) {
              const e = d.codePointAt(t);
              e && 803 !== e && (g += String.fromCodePoint(e));
            }
            return i.push(`<unclear>${g}</unclear>`), !1;
          case 'Gap':
            return (
              t.next(!0), i.push(`<gap reason="lost" quantity="${s(t)}" unit="character"/>`), !1
            );
          case 'GapUnknown':
            return i.push('<gap reason="lost" extent="unknown" unit="character"/>'), !1;
          case 'Illegible':
            return (
              (n = /^\.([0-9?]+)(lin)?$/.exec(s(t))),
              n &&
                ('lin' === n[2]
                  ? i.push(`<gap reason="illegible" quantity="${n ? n[1] : ''}" unit="line"/>`)
                  : '?' === n[1]
                  ? i.push('<gap reason="illegible" extent="unkown" unit="character"/>')
                  : i.push(
                      `<gap reason="illegible" quantity="${n ? n[1] : ''}" unit="character"/>`,
                    )),
              !1
            );
          case 'Erasure':
            i.push('<del rend="erasure">');
            break;
          case 'LostLines':
            return (
              (n = /^lost\.([0-9?]+)lin$/.exec(s(t))),
              n &&
                ('?' === n[1]
                  ? i.push('<gap reason="lost" extent="unknown" unit="line"/>')
                  : i.push(`<gap reason="lost" quantity="${n ? n[1] : ''}" unit="line"/>`)),
              !1
            );
          case 'Abbrev':
            r.length > 0
              ? (t.lastChild(),
                (n = s(t)),
                n.length > 0 && '?' === n.charAt(n.length - 1)
                  ? i.push('<ex cert="low">')
                  : i.push('<ex>'),
                t.parent())
              : i.push('<expan>'),
              r.push('expan');
            break;
          case 'Supplied':
            t.lastChild(),
              'CertLow' === t.name
                ? i.push('<supplied reason="omitted" cert="low">')
                : i.push('<supplied reason="omitted">'),
              t.parent();
            break;
          case 'SuppliedLost':
            t.lastChild(),
              'CertLow' === t.name
                ? i.push('<supplied reason="lost" cert="low">')
                : i.push('<supplied reason="lost">'),
              t.parent();
            break;
          case 'CertLow':
            return !1;
          case 'QuestionMark':
            return r.length < 2 && i.push('?'), !1;
          case 'Inline':
            break;
          default:
            i.push(`<${e}>`);
        }
      },
      leave: t => {
        switch (t.name) {
          case 'Document':
            h && i.push(`</${a}>`);
            break;
          case 'Abbrev':
            if (r.length > 1) {
              const t = i[i.length - 1];
              t.endsWith('?') && (i[i.length - 1] = t.substring(0, t.length - 2)), i.push('</ex>');
            } else i.push('</expan>');
            r.pop();
            break;
          case 'Div':
            i.push('</ab>');
            break;
          case 'Recto':
          case 'Verso':
          case 'Fragment':
          case 'Part':
            i.push('</div>');
            break;
          case 'Supplied':
          case 'SuppliedLost':
            i.push('</supplied>');
            break;
          case 'Erasure':
            i.push('</del>');
        }
      },
    }),
    'Inline' === e.type.name && i.push('</ab>'),
    i.join('')
  );
}
export {
  K as C,
  E,
  l as I,
  tt as L,
  r as N,
  T as P,
  u as T,
  n as a,
  A as b,
  dt as c,
  bt as d,
  mt as e,
  pt as l,
  gt as p,
};
