(() => {
  const td = Object.defineProperty; const id = Object.defineProperties; const nd = Object.getOwnPropertyDescriptors; const _l = Object.getOwnPropertySymbols; const sd = Object.prototype.hasOwnProperty; const rd = Object.prototype.propertyIsEnumerable; const jl = (i, e, t) => (e in i ? td(i, e, {
    enumerable: !0, configurable: !0, writable: !0, value: t,
  }) : i[e] = t); const Gl = (i, e) => { for (var t in e || (e = {}))sd.call(e, t) && jl(i, t, e[t]); if (_l) for (var t of _l(e))rd.call(e, t) && jl(i, t, e[t]); return i; }; const Zl = (i, e) => id(i, nd(e)); const Ql = (i, e, t) => new Promise((n, s) => { const r = (a) => { try { l(t.next(a)); } catch (h) { s(h); } }; const o = (a) => { try { l(t.throw(a)); } catch (h) { s(h); } }; var l = a => (a.done ? n(a.value) : Promise.resolve(a.value).then(r, o)); l((t = t.apply(i, e)).next()); }); var z = class {
    constructor() {}

    lineAt(e) { if (e < 0 || e > this.length) throw new RangeError(`Invalid position ${e} in document of length ${this.length}`); return this.lineInner(e, !1, 1, 0); }

    line(e) { if (e < 1 || e > this.lines) throw new RangeError(`Invalid line number ${e} in ${this.lines}-line document`); return this.lineInner(e, !0, 1, 0); }

    replace(e, t, n) { const s = []; return this.decompose(0, e, s, 2), n.length && n.decompose(0, n.length, s, 3), this.decompose(t, this.length, s, 1), Be.from(s, this.length - (t - e) + n.length); }

    append(e) { return this.replace(this.length, this.length, e); }

    slice(e, t = this.length) { const n = []; return this.decompose(e, t, n, 0), Be.from(n, t - e); }

    eq(e) { if (e == this) return !0; if (e.length != this.length || e.lines != this.lines) return !1; const t = this.scanIdentical(e, 1); const n = this.length - this.scanIdentical(e, -1); const s = new Ht(this); const r = new Ht(e); for (let o = t, l = t; ;) { if (s.next(o), r.next(o), o = 0, s.lineBreak != r.lineBreak || s.done != r.done || s.value != r.value) return !1; if (l += s.value.length, s.done || l >= n) return !0; } }

    iter(e = 1) { return new Ht(this, e); }

    iterRange(e, t = this.length) { return new Rn(this, e, t); }

    iterLines(e, t) { let n; if (e == null)n = this.iter(); else { t == null && (t = this.lines + 1); const s = this.line(e).from; n = this.iterRange(s, Math.max(s, t == this.lines + 1 ? this.length : t <= 1 ? 0 : this.line(t - 1).to)); } return new Bn(n); }

    toString() { return this.sliceString(0); }

    toJSON() { const e = []; return this.flatten(e), e; }

    static of(e) { if (e.length == 0) throw new RangeError('A document must have at least one line'); return e.length == 1 && !e[0] ? z.empty : e.length <= 32 ? new Y(e) : Be.from(Y.split(e, [])); }
  }; var Y = class extends z {
    constructor(e, t = od(e)) { super(), this.text = e, this.length = t; }

    get lines() { return this.text.length; }

    get children() { return null; }

    lineInner(e, t, n, s) { for (let r = 0; ;r++) { const o = this.text[r]; const l = s + o.length; if ((t ? n : l) >= e) return new hr(s, l, n, o); s = l + 1, n++; } }

    decompose(e, t, n, s) { const r = e <= 0 && t >= this.length ? this : new Y(Xl(this.text, e, t), Math.min(t, this.length) - Math.max(0, e)); if (s & 1) { const o = n.pop(); const l = Ln(r.text, o.text.slice(), 0, r.length); if (l.length <= 32)n.push(new Y(l, o.length + r.length)); else { const a = l.length >> 1; n.push(new Y(l.slice(0, a)), new Y(l.slice(a))); } } else n.push(r); }

    replace(e, t, n) { if (!(n instanceof Y)) return super.replace(e, t, n); const s = Ln(this.text, Ln(n.text, Xl(this.text, 0, e)), t); const r = this.length + n.length - (t - e); return s.length <= 32 ? new Y(s, r) : Be.from(Y.split(s, []), r); }

    sliceString(e, t = this.length, n = `
`) { let s = ''; for (let r = 0, o = 0; r <= t && o < this.text.length; o++) { const l = this.text[o]; const a = r + l.length; r > e && o && (s += n), e < a && t > r && (s += l.slice(Math.max(0, e - r), t - r)), r = a + 1; } return s; }

    flatten(e) { for (const t of this.text)e.push(t); }

    scanIdentical() { return 0; }

    static split(e, t) { let n = []; let s = -1; for (const r of e)n.push(r), s += r.length + 1, n.length == 32 && (t.push(new Y(n, s)), n = [], s = -1); return s > -1 && t.push(new Y(n, s)), t; }
  }; var Be = class extends z {
    constructor(e, t) { super(), this.children = e, this.length = t, this.lines = 0; for (const n of e) this.lines += n.lines; }

    lineInner(e, t, n, s) { for (let r = 0; ;r++) { const o = this.children[r]; const l = s + o.length; const a = n + o.lines - 1; if ((t ? a : l) >= e) return o.lineInner(e, t, n, s); s = l + 1, n = a + 1; } }

    decompose(e, t, n, s) { for (let r = 0, o = 0; o <= t && r < this.children.length; r++) { const l = this.children[r]; const a = o + l.length; if (e <= a && t >= o) { const h = s & ((o <= e ? 1 : 0) | (a >= t ? 2 : 0)); o >= e && a <= t && !h ? n.push(l) : l.decompose(e - o, t - o, n, h); }o = a + 1; } }

    replace(e, t, n) { if (n.lines < this.lines) for (let s = 0, r = 0; s < this.children.length; s++) { const o = this.children[s]; const l = r + o.length; if (e >= r && t <= l) { const a = o.replace(e - r, t - r, n); const h = this.lines - o.lines + a.lines; if (a.lines < h >> 5 - 1 && a.lines > h >> 5 + 1) { const c = this.children.slice(); return c[s] = a, new Be(c, this.length - (t - e) + n.length); } return super.replace(r, l, a); }r = l + 1; } return super.replace(e, t, n); }

    sliceString(e, t = this.length, n = `
`) { let s = ''; for (let r = 0, o = 0; r < this.children.length && o <= t; r++) { const l = this.children[r]; const a = o + l.length; o > e && r && (s += n), e < a && t > o && (s += l.sliceString(e - o, t - o, n)), o = a + 1; } return s; }

    flatten(e) { for (const t of this.children)t.flatten(e); }

    scanIdentical(e, t) { if (!(e instanceof Be)) return 0; let n = 0; let [s, r, o, l] = t > 0 ? [0, 0, this.children.length, e.children.length] : [this.children.length - 1, e.children.length - 1, -1, -1]; for (;;s += t, r += t) { if (s == o || r == l) return n; const a = this.children[s]; const h = e.children[r]; if (a != h) return n + a.scanIdentical(h, t); n += a.length + 1; } }

    static from(e, t = e.reduce((n, s) => n + s.length + 1, -1)) { let n = 0; for (const d of e)n += d.lines; if (n < 32) { const d = []; for (const p of e)p.flatten(d); return new Y(d, t); } const s = Math.max(32, n >> 5); const r = s << 1; const o = s >> 1; const l = []; let a = 0; let h = -1; const c = []; function f(d) { let p; if (d.lines > r && d instanceof Be) for (const g of d.children)f(g); else d.lines > o && (a > o || !a) ? (u(), l.push(d)) : d instanceof Y && a && (p = c[c.length - 1]) instanceof Y && d.lines + p.lines <= 32 ? (a += d.lines, h += d.length + 1, c[c.length - 1] = new Y(p.text.concat(d.text), p.length + 1 + d.length)) : (a + d.lines > s && u(), a += d.lines, h += d.length + 1, c.push(d)); } function u() { a != 0 && (l.push(c.length == 1 ? c[0] : Be.from(c, h)), h = -1, a = c.length = 0); } for (const d of e)f(d); return u(), l.length == 1 ? l[0] : new Be(l, t); }
  }; z.empty = new Y([''], 0); function od(i) { let e = -1; for (const t of i)e += t.length + 1; return e; } function Ln(i, e, t = 0, n = 1e9) { for (let s = 0, r = 0, o = !0; r < i.length && s <= n; r++) { let l = i[r]; const a = s + l.length; a >= t && (a > n && (l = l.slice(0, n - s)), s < t && (l = l.slice(t - s)), o ? (e[e.length - 1] += l, o = !1) : e.push(l)), s = a + 1; } return e; } function Xl(i, e, t) { return Ln(i, [''], e, t); } var Ht = class {
    constructor(e, t = 1) { this.dir = t, this.done = !1, this.lineBreak = !1, this.value = '', this.nodes = [e], this.offsets = [t > 0 ? 1 : (e instanceof Y ? e.text.length : e.children.length) << 1]; }

    nextInner(e, t) {
      for (this.done = this.lineBreak = !1; ;) {
        const n = this.nodes.length - 1; const s = this.nodes[n]; const r = this.offsets[n]; const o = r >> 1; const l = s instanceof Y ? s.text.length : s.children.length; if (o == (t > 0 ? l : 0)) { if (n == 0) return this.done = !0, this.value = '', this; t > 0 && this.offsets[n - 1]++, this.nodes.pop(), this.offsets.pop(); } else if ((r & 1) == (t > 0 ? 0 : 1)) {
          if (this.offsets[n] += t, e == 0) {
            return this.lineBreak = !0, this.value = `
`, this;
          } e--;
        } else if (s instanceof Y) { const a = s.text[o + (t < 0 ? -1 : 0)]; if (this.offsets[n] += t, a.length > Math.max(0, e)) return this.value = e == 0 ? a : t > 0 ? a.slice(e) : a.slice(0, a.length - e), this; e -= a.length; } else { const a = s.children[o + (t < 0 ? -1 : 0)]; e > a.length ? (e -= a.length, this.offsets[n] += t) : (t < 0 && this.offsets[n]--, this.nodes.push(a), this.offsets.push(t > 0 ? 1 : (a instanceof Y ? a.text.length : a.children.length) << 1)); }
      }
    }

    next(e = 0) { return e < 0 && (this.nextInner(-e, -this.dir), e = this.value.length), this.nextInner(e, this.dir); }
  }; var Rn = class {
    constructor(e, t, n) { this.value = '', this.done = !1, this.cursor = new Ht(e, t > n ? -1 : 1), this.pos = t > n ? e.length : 0, this.from = Math.min(t, n), this.to = Math.max(t, n); }

    nextInner(e, t) { if (t < 0 ? this.pos <= this.from : this.pos >= this.to) return this.value = '', this.done = !0, this; e += Math.max(0, t < 0 ? this.pos - this.to : this.from - this.pos); let n = t < 0 ? this.pos - this.from : this.to - this.pos; e > n && (e = n), n -= e; const { value: s } = this.cursor.next(e); return this.pos += (s.length + e) * t, this.value = s.length <= n ? s : t < 0 ? s.slice(s.length - n) : s.slice(0, n), this.done = !this.value, this; }

    next(e = 0) { return e < 0 ? e = Math.max(e, this.from - this.pos) : e > 0 && (e = Math.min(e, this.to - this.pos)), this.nextInner(e, this.cursor.dir); }

    get lineBreak() { return this.cursor.lineBreak && this.value != ''; }
  }; var Bn = class {
    constructor(e) { this.inner = e, this.afterBreak = !0, this.value = '', this.done = !1; }

    next(e = 0) { const { done: t, lineBreak: n, value: s } = this.inner.next(e); return t ? (this.done = !0, this.value = '') : n ? this.afterBreak ? this.value = '' : (this.afterBreak = !0, this.next()) : (this.value = s, this.afterBreak = !1), this; }

    get lineBreak() { return !1; }
  }; typeof Symbol < 'u' && (z.prototype[Symbol.iterator] = function () { return this.iter(); }, Ht.prototype[Symbol.iterator] = Rn.prototype[Symbol.iterator] = Bn.prototype[Symbol.iterator] = function () { return this; }); var hr = class {
    constructor(e, t, n, s) { this.from = e, this.to = t, this.number = n, this.text = s; }

    get length() { return this.to - this.from; }
  }; const si = 'lc,34,7n,7,7b,19,,,,2,,2,,,20,b,1c,l,g,,2t,7,2,6,2,2,,4,z,,u,r,2j,b,1m,9,9,,o,4,,9,,3,,5,17,3,3b,f,,w,1j,,,,4,8,4,,3,7,a,2,t,,1m,,,,2,4,8,,9,,a,2,q,,2,2,1l,,4,2,4,2,2,3,3,,u,2,3,,b,2,1l,,4,5,,2,4,,k,2,m,6,,,1m,,,2,,4,8,,7,3,a,2,u,,1n,,,,c,,9,,14,,3,,1l,3,5,3,,4,7,2,b,2,t,,1m,,2,,2,,3,,5,2,7,2,b,2,s,2,1l,2,,,2,4,8,,9,,a,2,t,,20,,4,,2,3,,,8,,29,,2,7,c,8,2q,,2,9,b,6,22,2,r,,,,,,1j,e,,5,,2,5,b,,10,9,,2u,4,,6,,2,2,2,p,2,4,3,g,4,d,,2,2,6,,f,,jj,3,qa,3,t,3,t,2,u,2,1s,2,,7,8,,2,b,9,,19,3,3b,2,y,,3a,3,4,2,9,,6,3,63,2,2,,1m,,,7,,,,,2,8,6,a,2,,1c,h,1r,4,1c,7,,,5,,14,9,c,2,w,4,2,2,,3,1k,,,2,3,,,3,1m,8,2,2,48,3,,d,,7,4,,6,,3,2,5i,1m,,5,ek,,5f,x,2da,3,3x,,2o,w,fe,6,2x,2,n9w,4,,a,w,2,28,2,7k,,3,,4,,p,2,5,,47,2,q,i,d,,12,8,p,b,1a,3,1c,,2,4,2,2,13,,1v,6,2,2,2,2,c,,8,,1b,,1f,,,3,2,2,5,2,,,16,2,8,,6m,,2,,4,,fn4,,kh,g,g,g,a6,2,gt,,6a,,45,5,1ae,3,,2,5,4,14,3,4,,4l,2,fx,4,ar,2,49,b,4w,,1i,f,1k,3,1d,4,2,2,1x,3,10,5,,8,1q,,c,2,1g,9,a,4,2,,2n,3,2,,,2,6,,4g,,3,8,l,2,1l,2,,,,,m,,e,7,3,5,5f,8,2,3,,,n,,29,,2,6,,,2,,,2,,2,6j,,2,4,6,2,,2,r,2,2d,8,2,,,2,2y,,,,2,6,,,2t,3,2,4,,5,77,9,,2,6t,,a,2,,,4,,40,4,2,2,4,,w,a,14,6,2,4,8,,9,6,2,3,1a,d,,2,ba,7,,6,,,2a,m,2,7,,2,,2,3e,6,3,,,2,,7,,,20,2,3,,,,9n,2,f0b,5,1n,7,t4,,1r,4,29,,f5k,2,43q,,,3,4,5,8,8,2,7,u,4,44,3,1iz,1j,4,1e,8,,e,,m,5,,f,11s,7,,h,2,7,,2,,5,79,7,c5,4,15s,7,31,7,240,5,gx7k,2o,3k,6o'.split(',').map(i => (i ? parseInt(i, 36) : 1)); for (let i = 1; i < si.length; i++)si[i] += si[i - 1]; function ld(i) { for (let e = 1; e < si.length; e += 2) if (si[e] > i) return si[e - 1] <= i; return !1; } function Kl(i) { return i >= 127462 && i <= 127487; } const Jl = 8205; function ve(i, e, t = !0, n = !0) { return (t ? sa : ad)(i, e, n); } function sa(i, e, t) { if (e == i.length) return e; e && ra(i.charCodeAt(e)) && oa(i.charCodeAt(e - 1)) && e--; let n = ae(i, e); for (e += Ce(n); e < i.length;) { const s = ae(i, e); if (n == Jl || s == Jl || t && ld(s))e += Ce(s), n = s; else if (Kl(s)) { let r = 0; let o = e - 2; for (;o >= 0 && Kl(ae(i, o));)r++, o -= 2; if (r % 2 == 0) break; e += 2; } else break; } return e; } function ad(i, e, t) { for (;e > 0;) { const n = sa(i, e - 2, t); if (n < e) return n; e--; } return 0; } function ra(i) { return i >= 56320 && i < 57344; } function oa(i) { return i >= 55296 && i < 56320; } function ae(i, e) { const t = i.charCodeAt(e); if (!oa(t) || e + 1 == i.length) return t; const n = i.charCodeAt(e + 1); return ra(n) ? (t - 55296 << 10) + (n - 56320) + 65536 : t; } function _i(i) { return i <= 65535 ? String.fromCharCode(i) : (i -= 65536, String.fromCharCode((i >> 10) + 55296, (i & 1023) + 56320)); } function Ce(i) { return i < 65536 ? 1 : 2; } const cr = /\r\n?|\n/; var oe = (function (i) { return i[i.Simple = 0] = 'Simple', i[i.TrackDel = 1] = 'TrackDel', i[i.TrackBefore = 2] = 'TrackBefore', i[i.TrackAfter = 3] = 'TrackAfter', i; }(oe || (oe = {}))); var Ne = class {
    constructor(e) { this.sections = e; }

    get length() { let e = 0; for (let t = 0; t < this.sections.length; t += 2)e += this.sections[t]; return e; }

    get newLength() { let e = 0; for (let t = 0; t < this.sections.length; t += 2) { const n = this.sections[t + 1]; e += n < 0 ? this.sections[t] : n; } return e; }

    get empty() { return this.sections.length == 0 || this.sections.length == 2 && this.sections[1] < 0; }

    iterGaps(e) { for (let t = 0, n = 0, s = 0; t < this.sections.length;) { const r = this.sections[t++]; const o = this.sections[t++]; o < 0 ? (e(n, s, r), s += r) : s += o, n += r; } }

    iterChangedRanges(e, t = !1) { fr(this, e, t); }

    get invertedDesc() { const e = []; for (let t = 0; t < this.sections.length;) { const n = this.sections[t++]; const s = this.sections[t++]; s < 0 ? e.push(n, s) : e.push(s, n); } return new Ne(e); }

    composeDesc(e) { return this.empty ? e : e.empty ? this : la(this, e); }

    mapDesc(e, t = !1) { return e.empty ? this : ur(this, e, t); }

    mapPos(e, t = -1, n = oe.Simple) { let s = 0; let r = 0; for (let o = 0; o < this.sections.length;) { const l = this.sections[o++]; const a = this.sections[o++]; const h = s + l; if (a < 0) { if (h > e) return r + (e - s); r += l; } else { if (n != oe.Simple && h >= e && (n == oe.TrackDel && s < e && h > e || n == oe.TrackBefore && s < e || n == oe.TrackAfter && h > e)) return null; if (h > e || h == e && t < 0 && !l) return e == s || t < 0 ? r : r + a; r += a; }s = h; } if (e > s) throw new RangeError(`Position ${e} is out of range for changeset of length ${s}`); return r; }

    touchesRange(e, t = e) { for (let n = 0, s = 0; n < this.sections.length && s <= t;) { const r = this.sections[n++]; const o = this.sections[n++]; const l = s + r; if (o >= 0 && s <= t && l >= e) return s < e && l > t ? 'cover' : !0; s = l; } return !1; }

    toString() { let e = ''; for (let t = 0; t < this.sections.length;) { const n = this.sections[t++]; const s = this.sections[t++]; e += (e ? ' ' : '') + n + (s >= 0 ? `:${s}` : ''); } return e; }

    toJSON() { return this.sections; }

    static fromJSON(e) { if (!Array.isArray(e) || e.length % 2 || e.some(t => typeof t !== 'number')) throw new RangeError('Invalid JSON representation of ChangeDesc'); return new Ne(e); }
  }; var ie = class extends Ne {
    constructor(e, t) { super(e), this.inserted = t; }

    apply(e) { if (this.length != e.length) throw new RangeError('Applying change set to a document with the wrong length'); return fr(this, (t, n, s, r, o) => e = e.replace(s, s + (n - t), o), !1), e; }

    mapDesc(e, t = !1) { return ur(this, e, t, !0); }

    invert(e) { const t = this.sections.slice(); const n = []; for (let s = 0, r = 0; s < t.length; s += 2) { const o = t[s]; const l = t[s + 1]; if (l >= 0) { t[s] = l, t[s + 1] = o; const a = s >> 1; for (;n.length < a;)n.push(z.empty); n.push(o ? e.slice(r, r + o) : z.empty); }r += o; } return new ie(t, n); }

    compose(e) { return this.empty ? e : e.empty ? this : la(this, e, !0); }

    map(e, t = !1) { return e.empty ? this : ur(this, e, t, !0); }

    iterChanges(e, t = !1) { fr(this, e, t); }

    get desc() { return new Ne(this.sections); }

    filter(e) { const t = []; const n = []; const s = []; const r = new qt(this); e:for (let o = 0, l = 0; ;) { const a = o == e.length ? 1e9 : e[o++]; for (;l < a || l == a && r.len == 0;) { if (r.done) break e; const c = Math.min(r.len, a - l); ke(s, c, -1); const f = r.ins == -1 ? -1 : r.off == 0 ? r.ins : 0; ke(t, c, f), f > 0 && Wt(n, t, r.text), r.forward(c), l += c; } const h = e[o++]; for (;l < h;) { if (r.done) break e; const c = Math.min(r.len, h - l); ke(t, c, -1), ke(s, c, r.ins == -1 ? -1 : r.off == 0 ? r.ins : 0), r.forward(c), l += c; } } return { changes: new ie(t, n), filtered: new Ne(s) }; }

    toJSON() { const e = []; for (let t = 0; t < this.sections.length; t += 2) { const n = this.sections[t]; const s = this.sections[t + 1]; s < 0 ? e.push(n) : s == 0 ? e.push([n]) : e.push([n].concat(this.inserted[t >> 1].toJSON())); } return e; }

    static of(e, t, n) { let s = []; let r = []; let o = 0; let l = null; function a(c = !1) { if (!c && !s.length) return; o < t && ke(s, t - o, -1); const f = new ie(s, r); l = l ? l.compose(f.map(l)) : f, s = [], r = [], o = 0; } function h(c) { if (Array.isArray(c)) for (const f of c)h(f); else if (c instanceof ie) { if (c.length != t) throw new RangeError(`Mismatched change set length (got ${c.length}, expected ${t})`); a(), l = l ? l.compose(c.map(l)) : c; } else { const { from: f, to: u = f, insert: d } = c; if (f > u || f < 0 || u > t) throw new RangeError(`Invalid change range ${f} to ${u} (in doc of length ${t})`); const p = d ? typeof d === 'string' ? z.of(d.split(n || cr)) : d : z.empty; const g = p.length; if (f == u && g == 0) return; f < o && a(), f > o && ke(s, f - o, -1), ke(s, u - f, g), Wt(r, s, p), o = u; } } return h(e), a(!l), l; }

    static empty(e) { return new ie(e ? [e, -1] : [], []); }

    static fromJSON(e) { if (!Array.isArray(e)) throw new RangeError('Invalid JSON representation of ChangeSet'); const t = []; const n = []; for (let s = 0; s < e.length; s++) { const r = e[s]; if (typeof r === 'number')t.push(r, -1); else { if (!Array.isArray(r) || typeof r[0] !== 'number' || r.some((o, l) => l && typeof o !== 'string')) throw new RangeError('Invalid JSON representation of ChangeSet'); if (r.length == 1)t.push(r[0], 0); else { for (;n.length < s;)n.push(z.empty); n[s] = z.of(r.slice(1)), t.push(r[0], n[s].length); } } } return new ie(t, n); }
  }; function ke(i, e, t, n = !1) { if (e == 0 && t <= 0) return; const s = i.length - 2; s >= 0 && t <= 0 && t == i[s + 1] ? i[s] += e : e == 0 && i[s] == 0 ? i[s + 1] += t : n ? (i[s] += e, i[s + 1] += t) : i.push(e, t); } function Wt(i, e, t) { if (t.length == 0) return; const n = e.length - 2 >> 1; if (n < i.length)i[i.length - 1] = i[i.length - 1].append(t); else { for (;i.length < n;)i.push(z.empty); i.push(t); } } function fr(i, e, t) { const n = i.inserted; for (let s = 0, r = 0, o = 0; o < i.sections.length;) { let l = i.sections[o++]; let a = i.sections[o++]; if (a < 0)s += l, r += l; else { let h = s; let c = r; let f = z.empty; for (;h += l, c += a, a && n && (f = f.append(n[o - 2 >> 1])), !(t || o == i.sections.length || i.sections[o + 1] < 0);)l = i.sections[o++], a = i.sections[o++]; e(s, h, r, c, f), s = h, r = c; } } } function ur(i, e, t, n = !1) { const s = []; const r = n ? [] : null; const o = new qt(i); const l = new qt(e); for (let a = 0, h = 0; ;) if (o.ins == -1)a += o.len, o.next(); else if (l.ins == -1 && h < a) { const c = Math.min(l.len, a - h); l.forward(c), ke(s, c, -1), h += c; } else if (l.ins >= 0 && (o.done || h < a || h == a && (l.len < o.len || l.len == o.len && !t))) { for (ke(s, l.ins, -1); a > h && !o.done && a + o.len < h + l.len;)a += o.len, o.next(); h += l.len, l.next(); } else if (o.ins >= 0) { let c = 0; const f = a + o.len; for (;;) if (l.ins >= 0 && h > a && h + l.len < f)c += l.ins, h += l.len, l.next(); else if (l.ins == -1 && h < f) { const u = Math.min(l.len, f - h); c += u, l.forward(u), h += u; } else break; ke(s, c, o.ins), r && Wt(r, s, o.text), a = f, o.next(); } else { if (o.done && l.done) return r ? new ie(s, r) : new Ne(s); throw new Error('Mismatched change set lengths'); } } function la(i, e, t = !1) { const n = []; const s = t ? [] : null; const r = new qt(i); const o = new qt(e); for (let l = !1; ;) { if (r.done && o.done) return s ? new ie(n, s) : new Ne(n); if (r.ins == 0)ke(n, r.len, 0, l), r.next(); else if (o.len == 0 && !o.done)ke(n, 0, o.ins, l), s && Wt(s, n, o.text), o.next(); else { if (r.done || o.done) throw new Error('Mismatched change set lengths'); { const a = Math.min(r.len2, o.len); const h = n.length; if (r.ins == -1) { const c = o.ins == -1 ? -1 : o.off ? 0 : o.ins; ke(n, a, c, l), s && c && Wt(s, n, o.text); } else o.ins == -1 ? (ke(n, r.off ? 0 : r.len, a, l), s && Wt(s, n, r.textBit(a))) : (ke(n, r.off ? 0 : r.len, o.off ? 0 : o.ins, l), s && !o.off && Wt(s, n, o.text)); l = (r.ins > a || o.ins >= 0 && o.len > a) && (l || n.length > h), r.forward2(a), o.forward(a); } } } } var qt = class {
    constructor(e) { this.set = e, this.i = 0, this.next(); }

    next() { const { sections: e } = this.set; this.i < e.length ? (this.len = e[this.i++], this.ins = e[this.i++]) : (this.len = 0, this.ins = -2), this.off = 0; }

    get done() { return this.ins == -2; }

    get len2() { return this.ins < 0 ? this.len : this.ins; }

    get text() { const { inserted: e } = this.set; const t = this.i - 2 >> 1; return t >= e.length ? z.empty : e[t]; }

    textBit(e) { const { inserted: t } = this.set; const n = this.i - 2 >> 1; return n >= t.length && !e ? z.empty : t[n].slice(this.off, e == null ? void 0 : this.off + e); }

    forward(e) { e == this.len ? this.next() : (this.len -= e, this.off += e); }

    forward2(e) { this.ins == -1 ? this.forward(e) : e == this.ins ? this.next() : (this.ins -= e, this.off += e); }
  }; var Ot = class {
    constructor(e, t, n) { this.from = e, this.to = t, this.flags = n; }

    get anchor() { return this.flags & 16 ? this.to : this.from; }

    get head() { return this.flags & 16 ? this.from : this.to; }

    get empty() { return this.from == this.to; }

    get assoc() { return this.flags & 4 ? -1 : this.flags & 8 ? 1 : 0; }

    get bidiLevel() { const e = this.flags & 3; return e == 3 ? null : e; }

    get goalColumn() { const e = this.flags >> 5; return e == 33554431 ? void 0 : e; }

    map(e, t = -1) { let n; let s; return this.empty ? n = s = e.mapPos(this.from, t) : (n = e.mapPos(this.from, 1), s = e.mapPos(this.to, -1)), n == this.from && s == this.to ? this : new Ot(n, s, this.flags); }

    extend(e, t = e) { if (e <= this.anchor && t >= this.anchor) return m.range(e, t); const n = Math.abs(e - this.anchor) > Math.abs(t - this.anchor) ? e : t; return m.range(this.anchor, n); }

    eq(e) { return this.anchor == e.anchor && this.head == e.head; }

    toJSON() { return { anchor: this.anchor, head: this.head }; }

    static fromJSON(e) { if (!e || typeof e.anchor !== 'number' || typeof e.head !== 'number') throw new RangeError('Invalid JSON representation for SelectionRange'); return m.range(e.anchor, e.head); }
  }; var m = class {
    constructor(e, t = 0) { this.ranges = e, this.mainIndex = t; }

    map(e, t = -1) { return e.empty ? this : m.create(this.ranges.map(n => n.map(e, t)), this.mainIndex); }

    eq(e) { if (this.ranges.length != e.ranges.length || this.mainIndex != e.mainIndex) return !1; for (let t = 0; t < this.ranges.length; t++) if (!this.ranges[t].eq(e.ranges[t])) return !1; return !0; }

    get main() { return this.ranges[this.mainIndex]; }

    asSingle() { return this.ranges.length == 1 ? this : new m([this.main]); }

    addRange(e, t = !0) { return m.create([e].concat(this.ranges), t ? 0 : this.mainIndex + 1); }

    replaceRange(e, t = this.mainIndex) { const n = this.ranges.slice(); return n[t] = e, m.create(n, this.mainIndex); }

    toJSON() { return { ranges: this.ranges.map(e => e.toJSON()), main: this.mainIndex }; }

    static fromJSON(e) { if (!e || !Array.isArray(e.ranges) || typeof e.main !== 'number' || e.main >= e.ranges.length) throw new RangeError('Invalid JSON representation for EditorSelection'); return new m(e.ranges.map(t => Ot.fromJSON(t)), e.main); }

    static single(e, t = e) { return new m([m.range(e, t)], 0); }

    static create(e, t = 0) { if (e.length == 0) throw new RangeError('A selection needs at least one range'); for (let n = 0, s = 0; s < e.length; s++) { const r = e[s]; if (r.empty ? r.from <= n : r.from < n) return hd(e.slice(), t); n = r.to; } return new m(e, t); }

    static cursor(e, t = 0, n, s) { return new Ot(e, e, (t == 0 ? 0 : t < 0 ? 4 : 8) | (n == null ? 3 : Math.min(2, n)) | (s ?? 33554431) << 5); }

    static range(e, t, n) { const s = (n ?? 33554431) << 5; return t < e ? new Ot(t, e, 16 | s | 8) : new Ot(e, t, s | (t > e ? 4 : 0)); }
  }; function hd(i, e = 0) { const t = i[e]; i.sort((n, s) => n.from - s.from), e = i.indexOf(t); for (let n = 1; n < i.length; n++) { const s = i[n]; const r = i[n - 1]; if (s.empty ? s.from <= r.to : s.from < r.to) { const o = r.from; const l = Math.max(s.to, r.to); n <= e && e--, i.splice(--n, 2, s.anchor > s.head ? m.range(l, o) : m.range(o, l)); } } return new m(i, e); } function aa(i, e) { for (const t of i.ranges) if (t.to > e) throw new RangeError('Selection points outside of document'); } let wr = 0; var v = class {
    constructor(e, t, n, s, r) { this.combine = e, this.compareInput = t, this.compare = n, this.isStatic = s, this.extensions = r, this.id = wr++, this.default = e([]); }

    static define(e = {}) { return new v(e.combine || (t => t), e.compareInput || ((t, n) => t === n), e.compare || (e.combine ? (t, n) => t === n : kr), !!e.static, e.enables); }

    of(e) { return new ri([], this, 0, e); }

    compute(e, t) { if (this.isStatic) throw new Error("Can't compute a static facet"); return new ri(e, this, 1, t); }

    computeN(e, t) { if (this.isStatic) throw new Error("Can't compute a static facet"); return new ri(e, this, 2, t); }

    from(e, t) { return t || (t = n => n), this.compute([e], n => t(n.field(e))); }
  }; function kr(i, e) { return i == e || i.length == e.length && i.every((t, n) => t === e[n]); } var ri = class {
    constructor(e, t, n, s) { this.dependencies = e, this.facet = t, this.type = n, this.value = s, this.id = wr++; }

    dynamicSlot(e) { let t; const n = this.value; const s = this.facet.compareInput; const r = this.id; const o = e[r] >> 1; const l = this.type == 2; let a = !1; let h = !1; const c = []; for (const f of this.dependencies)f == 'doc' ? a = !0 : f == 'selection' ? h = !0 : (((t = e[f.id]) !== null && t !== void 0 ? t : 1) & 1) == 0 && c.push(e[f.id]); return { create(f) { return f.values[o] = n(f), 1; }, update(f, u) { if (a && u.docChanged || h && (u.docChanged || u.selection) || dr(f, c)) { const d = n(f); if (l ? !Yl(d, f.values[o], s) : !s(d, f.values[o])) return f.values[o] = d, 1; } return 0; }, reconfigure: (f, u) => { const d = n(f); const p = u.config.address[r]; if (p != null) { const g = $n(u, p); if (this.dependencies.every(b => (b instanceof v ? u.facet(b) === f.facet(b) : b instanceof V ? u.field(b, !1) == f.field(b, !1) : !0)) || (l ? Yl(d, g, s) : s(d, g))) return f.values[o] = g, 0; } return f.values[o] = d, 1; } }; }
  }; function Yl(i, e, t) { if (i.length != e.length) return !1; for (let n = 0; n < i.length; n++) if (!t(i[n], e[n])) return !1; return !0; } function dr(i, e) { let t = !1; for (const n of e)Wi(i, n) & 1 && (t = !0); return t; } function cd(i, e, t) { const n = t.map(a => i[a.id]); const s = t.map(a => a.type); const r = n.filter(a => !(a & 1)); const o = i[e.id] >> 1; function l(a) { const h = []; for (let c = 0; c < n.length; c++) { const f = $n(a, n[c]); if (s[c] == 2) for (const u of f)h.push(u); else h.push(f); } return e.combine(h); } return { create(a) { for (const h of n)Wi(a, h); return a.values[o] = l(a), 1; }, update(a, h) { if (!dr(a, r)) return 0; const c = l(a); return e.compare(c, a.values[o]) ? 0 : (a.values[o] = c, 1); }, reconfigure(a, h) { const c = dr(a, n); const f = h.config.facets[e.id]; const u = h.facet(e); if (f && !c && kr(t, f)) return a.values[o] = u, 0; const d = l(a); return e.compare(d, u) ? (a.values[o] = u, 0) : (a.values[o] = d, 1); } }; } const ea = v.define({ static: !0 }); var V = class {
    constructor(e, t, n, s, r) { this.id = e, this.createF = t, this.updateF = n, this.compareF = s, this.spec = r, this.provides = void 0; }

    static define(e) { const t = new V(wr++, e.create, e.update, e.compare || ((n, s) => n === s), e); return e.provide && (t.provides = e.provide(t)), t; }

    create(e) { const t = e.facet(ea).find(n => n.field == this); return (t?.create || this.createF)(e); }

    slot(e) { const t = e[this.id] >> 1; return { create: n => (n.values[t] = this.create(n), 1), update: (n, s) => { const r = n.values[t]; const o = this.updateF(r, s); return this.compareF(r, o) ? 0 : (n.values[t] = o, 1); }, reconfigure: (n, s) => (s.config.address[this.id] != null ? (n.values[t] = s.field(this), 0) : (n.values[t] = this.create(n), 1)) }; }

    init(e) { return [this, ea.of({ field: this, create: e })]; }

    get extension() { return this; }
  }; const ni = {
    lowest: 4, low: 3, default: 2, high: 1, highest: 0,
  }; function Vi(i) { return e => new Nn(e, i); } const Ye = {
    highest: Vi(ni.highest), high: Vi(ni.high), default: Vi(ni.default), low: Vi(ni.low), lowest: Vi(ni.lowest),
  }; var Nn = class {constructor(e, t) { this.inner = e, this.prec = t; }}; var li = class {
    of(e) { return new Hi(this, e); }

    reconfigure(e) { return li.reconfigure.of({ compartment: this, extension: e }); }

    get(e) { return e.config.compartments.get(this); }
  }; var Hi = class {constructor(e, t) { this.compartment = e, this.inner = t; }}; var ai = class {
    constructor(e, t, n, s, r, o) { for (this.base = e, this.compartments = t, this.dynamicSlots = n, this.address = s, this.staticValues = r, this.facets = o, this.statusTemplate = []; this.statusTemplate.length < n.length;) this.statusTemplate.push(0); }

    staticFacet(e) { const t = this.address[e.id]; return t == null ? e.default : this.staticValues[t >> 1]; }

    static resolve(e, t, n) { const s = []; const r = Object.create(null); const o = new Map(); for (const u of fd(e, t, o))u instanceof V ? s.push(u) : (r[u.facet.id] || (r[u.facet.id] = [])).push(u); const l = Object.create(null); const a = []; const h = []; for (const u of s)l[u.id] = h.length << 1, h.push(d => u.slot(d)); const c = n?.config.facets; for (const u in r) { const d = r[u]; const p = d[0].facet; const g = c && c[u] || []; if (d.every(b => b.type == 0)) if (l[p.id] = a.length << 1 | 1, kr(g, d))a.push(n.facet(p)); else { const b = p.combine(d.map(y => y.value)); a.push(n && p.compare(b, n.facet(p)) ? n.facet(p) : b); } else { for (const b of d)b.type == 0 ? (l[b.id] = a.length << 1 | 1, a.push(b.value)) : (l[b.id] = h.length << 1, h.push(y => b.dynamicSlot(y))); l[p.id] = h.length << 1, h.push(b => cd(b, p, d)); } } const f = h.map(u => u(l)); return new ai(e, o, f, l, a, r); }
  }; function fd(i, e, t) { const n = [[], [], [], [], []]; const s = new Map(); function r(o, l) { const a = s.get(o); if (a != null) { if (a <= l) return; const h = n[a].indexOf(o); h > -1 && n[a].splice(h, 1), o instanceof Hi && t.delete(o.compartment); } if (s.set(o, l), Array.isArray(o)) for (const h of o)r(h, l); else if (o instanceof Hi) { if (t.has(o.compartment)) throw new RangeError('Duplicate use of compartment in extensions'); const h = e.get(o.compartment) || o.inner; t.set(o.compartment, h), r(h, l); } else if (o instanceof Nn)r(o.inner, o.prec); else if (o instanceof V)n[l].push(o), o.provides && r(o.provides, l); else if (o instanceof ri)n[l].push(o), o.facet.extensions && r(o.facet.extensions, l); else { const h = o.extension; if (!h) throw new Error(`Unrecognized extension value in extension set (${o}). This sometimes happens because multiple instances of @codemirror/state are loaded, breaking instanceof checks.`); r(h, l); } } return r(i, ni.default), n.reduce((o, l) => o.concat(l)); } function Wi(i, e) { if (e & 1) return 2; const t = e >> 1; const n = i.status[t]; if (n == 4) throw new Error('Cyclic dependency between fields and/or facets'); if (n & 2) return n; i.status[t] = 4; const s = i.computeSlot(i, i.config.dynamicSlots[t]); return i.status[t] = 2 | s; } function $n(i, e) { return e & 1 ? i.config.staticValues[e >> 1] : i.values[e >> 1]; } const ha = v.define(); const ca = v.define({ combine: i => i.some(e => e), static: !0 }); const fa = v.define({ combine: i => (i.length ? i[0] : void 0), static: !0 }); const ua = v.define(); const da = v.define(); const pa = v.define(); const ma = v.define({ combine: i => (i.length ? i[0] : !1) }); const $e = class {
    constructor(e, t) { this.type = e, this.value = t; }

    static define() { return new pr(); }
  }; var pr = class {of(e) { return new $e(this, e); }}; const mr = class {
    constructor(e) { this.map = e; }

    of(e) { return new M(this, e); }
  }; var M = class {
    constructor(e, t) { this.type = e, this.value = t; }

    map(e) { const t = this.type.map(this.value, e); return t === void 0 ? void 0 : t == this.value ? this : new M(this.type, t); }

    is(e) { return this.type == e; }

    static define(e = {}) { return new mr(e.map || (t => t)); }

    static mapEffects(e, t) { if (!e.length) return e; const n = []; for (const s of e) { const r = s.map(t); r && n.push(r); } return n; }
  }; M.reconfigure = M.define(); M.appendConfig = M.define(); var ne = class {
    constructor(e, t, n, s, r, o) { this.startState = e, this.changes = t, this.selection = n, this.effects = s, this.annotations = r, this.scrollIntoView = o, this._doc = null, this._state = null, n && aa(n, t.newLength), r.some(l => l.type == ne.time) || (this.annotations = r.concat(ne.time.of(Date.now()))); }

    get newDoc() { return this._doc || (this._doc = this.changes.apply(this.startState.doc)); }

    get newSelection() { return this.selection || this.startState.selection.map(this.changes); }

    get state() { return this._state || this.startState.applyTransaction(this), this._state; }

    annotation(e) { for (const t of this.annotations) if (t.type == e) return t.value; }

    get docChanged() { return !this.changes.empty; }

    get reconfigured() { return this.startState.config != this.state.config; }

    isUserEvent(e) { const t = this.annotation(ne.userEvent); return !!(t && (t == e || t.length > e.length && t.slice(0, e.length) == e && t[e.length] == '.')); }
  }; ne.time = $e.define(); ne.userEvent = $e.define(); ne.addToHistory = $e.define(); ne.remote = $e.define(); function ud(i, e) { const t = []; for (let n = 0, s = 0; ;) { let r; let o; if (n < i.length && (s == e.length || e[s] >= i[n]))r = i[n++], o = i[n++]; else if (s < e.length)r = e[s++], o = e[s++]; else return t; !t.length || t[t.length - 1] < r ? t.push(r, o) : t[t.length - 1] < o && (t[t.length - 1] = o); } } function ga(i, e, t) {
    let n; let s; let r; let o; return t ? (s = e.changes, r = ie.empty(e.changes.length), o = i.changes.compose(e.changes)) : (s = e.changes.map(i.changes), r = i.changes.mapDesc(e.changes, !0), o = i.changes.compose(s)), {
      changes: o, selection: e.selection ? e.selection.map(r) : (n = i.selection) === null || n === void 0 ? void 0 : n.map(s), effects: M.mapEffects(i.effects, s).concat(M.mapEffects(e.effects, r)), annotations: i.annotations.length ? i.annotations.concat(e.annotations) : e.annotations, scrollIntoView: i.scrollIntoView || e.scrollIntoView,
    };
  } function gr(i, e, t) {
    const n = e.selection; let s = oi(e.annotations); return e.userEvent && (s = s.concat(ne.userEvent.of(e.userEvent))), {
      changes: e.changes instanceof ie ? e.changes : ie.of(e.changes || [], t, i.facet(fa)), selection: n && (n instanceof m ? n : m.single(n.anchor, n.head)), effects: oi(e.effects), annotations: s, scrollIntoView: !!e.scrollIntoView,
    };
  } function ba(i, e, t) { let n = gr(i, e.length ? e[0] : {}, i.doc.length); e.length && e[0].filter === !1 && (t = !1); for (let r = 1; r < e.length; r++) { e[r].filter === !1 && (t = !1); const o = !!e[r].sequential; n = ga(n, gr(i, e[r], o ? n.changes.newLength : i.doc.length), o); } const s = new ne(i, n.changes, n.selection, n.effects, n.annotations, n.scrollIntoView); return pd(t ? dd(s) : s); } function dd(i) { const e = i.startState; let t = !0; for (const s of e.facet(ua)) { const r = s(i); if (r === !1) { t = !1; break; }Array.isArray(r) && (t = t === !0 ? r : ud(t, r)); } if (t !== !0) { let s; let r; if (t === !1)r = i.changes.invertedDesc, s = ie.empty(e.doc.length); else { const o = i.changes.filter(t); s = o.changes, r = o.filtered.invertedDesc; }i = new ne(e, s, i.selection && i.selection.map(r), M.mapEffects(i.effects, r), i.annotations, i.scrollIntoView); } const n = e.facet(da); for (let s = n.length - 1; s >= 0; s--) { const r = n[s](i); r instanceof ne ? i = r : Array.isArray(r) && r.length == 1 && r[0] instanceof ne ? i = r[0] : i = ba(e, oi(r), !1); } return i; } function pd(i) { const e = i.startState; const t = e.facet(pa); let n = i; for (let s = t.length - 1; s >= 0; s--) { const r = t[s](i); r && Object.keys(r).length && (n = ga(i, gr(e, r, i.changes.newLength), !0)); } return n == i ? i : new ne(e, i.changes, i.selection, n.effects, n.annotations, n.scrollIntoView); } const md = []; function oi(i) { return i == null ? md : Array.isArray(i) ? i : [i]; } var le = (function (i) { return i[i.Word = 0] = 'Word', i[i.Space = 1] = 'Space', i[i.Other = 2] = 'Other', i; }(le || (le = {}))); const gd = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/; let br; try { br = new RegExp('[\\p{Alphabetic}\\p{Number}_]', 'u'); } catch {} function bd(i) { if (br) return br.test(i); for (let e = 0; e < i.length; e++) { const t = i[e]; if (/\w/.test(t) || t > '\x80' && (t.toUpperCase() != t.toLowerCase() || gd.test(t))) return !0; } return !1; } function yd(i) { return (e) => { if (!/\S/.test(e)) return le.Space; if (bd(e)) return le.Word; for (let t = 0; t < i.length; t++) if (e.indexOf(i[t]) > -1) return le.Word; return le.Other; }; } var $ = class {
    constructor(e, t, n, s, r, o) { this.config = e, this.doc = t, this.selection = n, this.values = s, this.status = e.statusTemplate.slice(), this.computeSlot = r, o && (o._state = this); for (let l = 0; l < this.config.dynamicSlots.length; l++)Wi(this, l << 1); this.computeSlot = null; }

    field(e, t = !0) { const n = this.config.address[e.id]; if (n == null) { if (t) throw new RangeError('Field is not present in this state'); return; } return Wi(this, n), $n(this, n); }

    update(...e) { return ba(this, e, !0); }

    applyTransaction(e) { let t = this.config; let { base: n, compartments: s } = t; for (const o of e.effects)o.is(li.reconfigure) ? (t && (s = new Map(), t.compartments.forEach((l, a) => s.set(a, l)), t = null), s.set(o.value.compartment, o.value.extension)) : o.is(M.reconfigure) ? (t = null, n = o.value) : o.is(M.appendConfig) && (t = null, n = oi(n).concat(o.value)); let r; t ? r = e.startState.values.slice() : (t = ai.resolve(n, s, this), r = new $(t, this.doc, this.selection, t.dynamicSlots.map(() => null), (l, a) => a.reconfigure(l, this), null).values), new $(t, e.newDoc, e.newSelection, r, (o, l) => l.update(o, e), e); }

    replaceSelection(e) { return typeof e === 'string' && (e = this.toText(e)), this.changeByRange(t => ({ changes: { from: t.from, to: t.to, insert: e }, range: m.cursor(t.from + e.length) })); }

    changeByRange(e) { const t = this.selection; const n = e(t.ranges[0]); let s = this.changes(n.changes); const r = [n.range]; let o = oi(n.effects); for (let l = 1; l < t.ranges.length; l++) { const a = e(t.ranges[l]); const h = this.changes(a.changes); const c = h.map(s); for (let u = 0; u < l; u++)r[u] = r[u].map(c); const f = s.mapDesc(h, !0); r.push(a.range.map(f)), s = s.compose(c), o = M.mapEffects(o, c).concat(M.mapEffects(oi(a.effects), f)); } return { changes: s, selection: m.create(r, t.mainIndex), effects: o }; }

    changes(e = []) { return e instanceof ie ? e : ie.of(e, this.doc.length, this.facet($.lineSeparator)); }

    toText(e) { return z.of(e.split(this.facet($.lineSeparator) || cr)); }

    sliceDoc(e = 0, t = this.doc.length) { return this.doc.sliceString(e, t, this.lineBreak); }

    facet(e) { const t = this.config.address[e.id]; return t == null ? e.default : (Wi(this, t), $n(this, t)); }

    toJSON(e) { const t = { doc: this.sliceDoc(), selection: this.selection.toJSON() }; if (e) for (const n in e) { const s = e[n]; s instanceof V && (t[n] = s.spec.toJSON(this.field(e[n]), this)); } return t; }

    static fromJSON(e, t = {}, n) { if (!e || typeof e.doc !== 'string') throw new RangeError('Invalid JSON representation for EditorState'); const s = []; if (n) for (const r in n) { const o = n[r]; const l = e[r]; s.push(o.init(a => o.spec.fromJSON(l, a))); } return $.create({ doc: e.doc, selection: m.fromJSON(e.selection), extensions: t.extensions ? s.concat([t.extensions]) : s }); }

    static create(e = {}) { const t = ai.resolve(e.extensions || [], new Map()); const n = e.doc instanceof z ? e.doc : z.of((e.doc || '').split(t.staticFacet($.lineSeparator) || cr)); let s = e.selection ? e.selection instanceof m ? e.selection : m.single(e.selection.anchor, e.selection.head) : m.single(0); return aa(s, n.length), t.staticFacet(ca) || (s = s.asSingle()), new $(t, n, s, t.dynamicSlots.map(() => null), (r, o) => o.create(r), null); }

    get tabSize() { return this.facet($.tabSize); }

    get lineBreak() {
      return this.facet($.lineSeparator) || `
`;
    }

    get readOnly() { return this.facet(ma); }

    phrase(e) { for (const t of this.facet($.phrases)) if (Object.prototype.hasOwnProperty.call(t, e)) return t[e]; return e; }

    languageDataAt(e, t, n = -1) { const s = []; for (const r of this.facet(ha)) for (const o of r(this, t, n))Object.prototype.hasOwnProperty.call(o, e) && s.push(o[e]); return s; }

    charCategorizer(e) { return yd(this.languageDataAt('wordChars', e).join('')); }

    wordAt(e) { const { text: t, from: n, length: s } = this.doc.lineAt(e); const r = this.charCategorizer(e); let o = e - n; let l = e - n; for (;o > 0;) { const a = ve(t, o, !1); if (r(t.slice(a, o)) != le.Word) break; o = a; } for (;l < s;) { const a = ve(t, l); if (r(t.slice(l, a)) != le.Word) break; l = a; } return o == l ? null : m.range(o + n, l + n); }
  }; $.allowMultipleSelections = ca; $.tabSize = v.define({ combine: i => (i.length ? i[0] : 4) }); $.lineSeparator = fa; $.readOnly = ma; $.phrases = v.define({ compare(i, e) { const t = Object.keys(i); const n = Object.keys(e); return t.length == n.length && t.every(s => i[s] == e[s]); } }); $.languageData = ha; $.changeFilter = ua; $.transactionFilter = da; $.transactionExtender = pa; li.reconfigure = M.define(); function me(i, e, t = {}) { const n = {}; for (const s of i) for (const r of Object.keys(s)) { const o = s[r]; const l = n[r]; if (l === void 0)n[r] = o; else if (!(l === o || o === void 0)) if (Object.hasOwnProperty.call(t, r))n[r] = t[r](l, o); else throw new Error(`Config merge conflict for field ${r}`); } for (const s in e)n[s] === void 0 && (n[s] = e[s]); return n; } const je = class {
    eq(e) { return this == e; }

    range(e, t = e) { return new qi(e, t, this); }
  }; je.prototype.startSide = je.prototype.endSide = 0; je.prototype.point = !1; je.prototype.mapMode = oe.TrackDel; var qi = class {constructor(e, t, n) { this.from = e, this.to = t, this.value = n; }}; function yr(i, e) { return i.from - e.from || i.value.startSide - e.value.startSide; } var Ui = class {
    constructor(e, t, n, s) { this.from = e, this.to = t, this.value = n, this.maxPoint = s; }

    get length() { return this.to[this.to.length - 1]; }

    findIndex(e, t, n, s = 0) { const r = n ? this.to : this.from; for (let o = s, l = r.length; ;) { if (o == l) return o; const a = o + l >> 1; const h = r[a] - e || (n ? this.value[a].endSide : this.value[a].startSide) - t; if (a == o) return h >= 0 ? o : l; h >= 0 ? l = a : o = a + 1; } }

    between(e, t, n, s) { for (let r = this.findIndex(t, -1e9, !0), o = this.findIndex(n, 1e9, !1, r); r < o; r++) if (s(this.from[r] + e, this.to[r] + e, this.value[r]) === !1) return !1; }

    map(e, t) { const n = []; const s = []; const r = []; let o = -1; let l = -1; for (let a = 0; a < this.value.length; a++) { const h = this.value[a]; const c = this.from[a] + e; const f = this.to[a] + e; let u; let d; if (c == f) { const p = t.mapPos(c, h.startSide, h.mapMode); if (p == null || (u = d = p, h.startSide != h.endSide && (d = t.mapPos(c, h.endSide), d < u))) continue; } else if (u = t.mapPos(c, h.startSide), d = t.mapPos(f, h.endSide), u > d || u == d && h.startSide > 0 && h.endSide <= 0) continue; (d - u || h.endSide - h.startSide) < 0 || (o < 0 && (o = u), h.point && (l = Math.max(l, d - u)), n.push(h), s.push(u - o), r.push(d - o)); } return { mapped: n.length ? new Ui(s, r, n, l) : null, pos: o }; }
  }; var I = class {
    constructor(e, t, n = I.empty, s) { this.chunkPos = e, this.chunk = t, this.nextLayer = n, this.maxPoint = s; }

    get length() { const e = this.chunk.length - 1; return e < 0 ? 0 : Math.max(this.chunkEnd(e), this.nextLayer.length); }

    get size() { if (this.isEmpty) return 0; let e = this.nextLayer.size; for (const t of this.chunk)e += t.value.length; return e; }

    chunkEnd(e) { return this.chunkPos[e] + this.chunk[e].length; }

    update(e) {
      let {
        add: t = [], sort: n = !1, filterFrom: s = 0, filterTo: r = this.length,
      } = e; const o = e.filter; if (t.length == 0 && !o) return this; if (n && (t = t.slice().sort(yr)), this.isEmpty) return t.length ? I.of(t) : this; const l = new In(this, null, -1).goto(0); let a = 0; const h = []; const c = new Ee(); for (;l.value || a < t.length;) if (a < t.length && (l.from - t[a].from || l.startSide - t[a].value.startSide) >= 0) { const f = t[a++]; c.addInner(f.from, f.to, f.value) || h.push(f); } else l.rangeIndex == 1 && l.chunkIndex < this.chunk.length && (a == t.length || this.chunkEnd(l.chunkIndex) < t[a].from) && (!o || s > this.chunkEnd(l.chunkIndex) || r < this.chunkPos[l.chunkIndex]) && c.addChunk(this.chunkPos[l.chunkIndex], this.chunk[l.chunkIndex]) ? l.nextChunk() : ((!o || s > l.to || r < l.from || o(l.from, l.to, l.value)) && (c.addInner(l.from, l.to, l.value) || h.push(new qi(l.from, l.to, l.value))), l.next()); return c.finishInner(this.nextLayer.isEmpty && !h.length ? I.empty : this.nextLayer.update({
        add: h, filter: o, filterFrom: s, filterTo: r,
      }));
    }

    map(e) { if (e.empty || this.isEmpty) return this; const t = []; const n = []; let s = -1; for (let o = 0; o < this.chunk.length; o++) { const l = this.chunkPos[o]; const a = this.chunk[o]; const h = e.touchesRange(l, l + a.length); if (h === !1)s = Math.max(s, a.maxPoint), t.push(a), n.push(e.mapPos(l)); else if (h === !0) { const { mapped: c, pos: f } = a.map(l, e); c && (s = Math.max(s, c.maxPoint), t.push(c), n.push(f)); } } const r = this.nextLayer.map(e); return t.length == 0 ? r : new I(n, t, r, s); }

    between(e, t, n) { if (!this.isEmpty) { for (let s = 0; s < this.chunk.length; s++) { const r = this.chunkPos[s]; const o = this.chunk[s]; if (t >= r && e <= r + o.length && o.between(r, e - r, t - r, n) === !1) return; } this.nextLayer.between(e, t, n); } }

    iter(e = 0) { return Ut.from([this]).goto(e); }

    get isEmpty() { return this.nextLayer == this; }

    static iter(e, t = 0) { return Ut.from(e).goto(t); }

    static compare(e, t, n, s, r = -1) { const o = e.filter(f => f.maxPoint > 0 || !f.isEmpty && f.maxPoint >= r); const l = t.filter(f => f.maxPoint > 0 || !f.isEmpty && f.maxPoint >= r); const a = ta(o, l, n); const h = new Vt(o, a, r); const c = new Vt(l, a, r); n.iterGaps((f, u, d) => ia(h, f, c, u, d, s)), n.empty && n.length == 0 && ia(h, 0, c, 0, 0, s); }

    static eq(e, t, n = 0, s) { s == null && (s = 1e9); const r = e.filter(c => !c.isEmpty && t.indexOf(c) < 0); const o = t.filter(c => !c.isEmpty && e.indexOf(c) < 0); if (r.length != o.length) return !1; if (!r.length) return !0; const l = ta(r, o); const a = new Vt(r, l, 0).goto(n); const h = new Vt(o, l, 0).goto(n); for (;;) { if (a.to != h.to || !xr(a.active, h.active) || a.point && (!h.point || !a.point.eq(h.point))) return !1; if (a.to > s) return !0; a.next(), h.next(); } }

    static spans(e, t, n, s, r = -1) { const o = new Vt(e, null, r).goto(t); let l = t; let a = o.openStart; for (;;) { const h = Math.min(o.to, n); if (o.point ? (s.point(l, h, o.point, o.activeForPoint(o.to), a, o.pointRank), a = o.openEnd(h) + (o.to > h ? 1 : 0)) : h > l && (s.span(l, h, o.active, a), a = o.openEnd(h)), o.to > n) break; l = o.to, o.next(); } return a; }

    static of(e, t = !1) { const n = new Ee(); for (const s of e instanceof qi ? [e] : t ? xd(e) : e)n.add(s.from, s.to, s.value); return n.finish(); }
  }; I.empty = new I([], [], null, -1); function xd(i) { if (i.length > 1) for (let e = i[0], t = 1; t < i.length; t++) { const n = i[t]; if (yr(e, n) > 0) return i.slice().sort(yr); e = n; } return i; }I.empty.nextLayer = I.empty; var Ee = class {
    constructor() { this.chunks = [], this.chunkPos = [], this.chunkStart = -1, this.last = null, this.lastFrom = -1e9, this.lastTo = -1e9, this.from = [], this.to = [], this.value = [], this.maxPoint = -1, this.setMaxPoint = -1, this.nextLayer = null; }

    finishChunk(e) { this.chunks.push(new Ui(this.from, this.to, this.value, this.maxPoint)), this.chunkPos.push(this.chunkStart), this.chunkStart = -1, this.setMaxPoint = Math.max(this.setMaxPoint, this.maxPoint), this.maxPoint = -1, e && (this.from = [], this.to = [], this.value = []); }

    add(e, t, n) { this.addInner(e, t, n) || (this.nextLayer || (this.nextLayer = new Ee())).add(e, t, n); }

    addInner(e, t, n) { const s = e - this.lastTo || n.startSide - this.last.endSide; if (s <= 0 && (e - this.lastFrom || n.startSide - this.last.startSide) < 0) throw new Error('Ranges must be added sorted by `from` position and `startSide`'); return s < 0 ? !1 : (this.from.length == 250 && this.finishChunk(!0), this.chunkStart < 0 && (this.chunkStart = e), this.from.push(e - this.chunkStart), this.to.push(t - this.chunkStart), this.last = n, this.lastFrom = e, this.lastTo = t, this.value.push(n), n.point && (this.maxPoint = Math.max(this.maxPoint, t - e)), !0); }

    addChunk(e, t) { if ((e - this.lastTo || t.value[0].startSide - this.last.endSide) < 0) return !1; this.from.length && this.finishChunk(!0), this.setMaxPoint = Math.max(this.setMaxPoint, t.maxPoint), this.chunks.push(t), this.chunkPos.push(e); const n = t.value.length - 1; return this.last = t.value[n], this.lastFrom = t.from[n] + e, this.lastTo = t.to[n] + e, !0; }

    finish() { return this.finishInner(I.empty); }

    finishInner(e) { if (this.from.length && this.finishChunk(!1), this.chunks.length == 0) return e; const t = new I(this.chunkPos, this.chunks, this.nextLayer ? this.nextLayer.finishInner(e) : e, this.setMaxPoint); return this.from = null, t; }
  }; function ta(i, e, t) { const n = new Map(); for (const r of i) for (let o = 0; o < r.chunk.length; o++)r.chunk[o].maxPoint <= 0 && n.set(r.chunk[o], r.chunkPos[o]); const s = new Set(); for (const r of e) for (let o = 0; o < r.chunk.length; o++) { const l = n.get(r.chunk[o]); l != null && (t ? t.mapPos(l) : l) == r.chunkPos[o] && !t?.touchesRange(l, l + r.chunk[o].length) && s.add(r.chunk[o]); } return s; } var In = class {
    constructor(e, t, n, s = 0) { this.layer = e, this.skip = t, this.minPoint = n, this.rank = s; }

    get startSide() { return this.value ? this.value.startSide : 0; }

    get endSide() { return this.value ? this.value.endSide : 0; }

    goto(e, t = -1e9) { return this.chunkIndex = this.rangeIndex = 0, this.gotoInner(e, t, !1), this; }

    gotoInner(e, t, n) { for (;this.chunkIndex < this.layer.chunk.length;) { const s = this.layer.chunk[this.chunkIndex]; if (!(this.skip && this.skip.has(s) || this.layer.chunkEnd(this.chunkIndex) < e || s.maxPoint < this.minPoint)) break; this.chunkIndex++, n = !1; } if (this.chunkIndex < this.layer.chunk.length) { const s = this.layer.chunk[this.chunkIndex].findIndex(e - this.layer.chunkPos[this.chunkIndex], t, !0); (!n || this.rangeIndex < s) && this.setRangeIndex(s); } this.next(); }

    forward(e, t) { (this.to - e || this.endSide - t) < 0 && this.gotoInner(e, t, !0); }

    next() { for (;;) if (this.chunkIndex == this.layer.chunk.length) { this.from = this.to = 1e9, this.value = null; break; } else { const e = this.layer.chunkPos[this.chunkIndex]; const t = this.layer.chunk[this.chunkIndex]; const n = e + t.from[this.rangeIndex]; if (this.from = n, this.to = e + t.to[this.rangeIndex], this.value = t.value[this.rangeIndex], this.setRangeIndex(this.rangeIndex + 1), this.minPoint < 0 || this.value.point && this.to - this.from >= this.minPoint) break; } }

    setRangeIndex(e) { if (e == this.layer.chunk[this.chunkIndex].value.length) { if (this.chunkIndex++, this.skip) for (;this.chunkIndex < this.layer.chunk.length && this.skip.has(this.layer.chunk[this.chunkIndex]);) this.chunkIndex++; this.rangeIndex = 0; } else this.rangeIndex = e; }

    nextChunk() { this.chunkIndex++, this.rangeIndex = 0, this.next(); }

    compare(e) { return this.from - e.from || this.startSide - e.startSide || this.rank - e.rank || this.to - e.to || this.endSide - e.endSide; }
  }; var Ut = class {
    constructor(e) { this.heap = e; }

    static from(e, t = null, n = -1) { const s = []; for (let r = 0; r < e.length; r++) for (let o = e[r]; !o.isEmpty; o = o.nextLayer)o.maxPoint >= n && s.push(new In(o, t, n, r)); return s.length == 1 ? s[0] : new Ut(s); }

    get startSide() { return this.value ? this.value.startSide : 0; }

    goto(e, t = -1e9) { for (const n of this.heap)n.goto(e, t); for (let n = this.heap.length >> 1; n >= 0; n--)ar(this.heap, n); return this.next(), this; }

    forward(e, t) { for (const n of this.heap)n.forward(e, t); for (let n = this.heap.length >> 1; n >= 0; n--)ar(this.heap, n); (this.to - e || this.value.endSide - t) < 0 && this.next(); }

    next() { if (this.heap.length == 0) this.from = this.to = 1e9, this.value = null, this.rank = -1; else { const e = this.heap[0]; this.from = e.from, this.to = e.to, this.value = e.value, this.rank = e.rank, e.value && e.next(), ar(this.heap, 0); } }
  }; function ar(i, e) { for (let t = i[e]; ;) { let n = (e << 1) + 1; if (n >= i.length) break; let s = i[n]; if (n + 1 < i.length && s.compare(i[n + 1]) >= 0 && (s = i[n + 1], n++), t.compare(s) < 0) break; i[n] = t, i[e] = s, e = n; } } var Vt = class {
    constructor(e, t, n) { this.minPoint = n, this.active = [], this.activeTo = [], this.activeRank = [], this.minActive = -1, this.point = null, this.pointFrom = 0, this.pointRank = 0, this.to = -1e9, this.endSide = 0, this.openStart = -1, this.cursor = Ut.from(e, t, n); }

    goto(e, t = -1e9) { return this.cursor.goto(e, t), this.active.length = this.activeTo.length = this.activeRank.length = 0, this.minActive = -1, this.to = e, this.endSide = t, this.openStart = -1, this.next(), this; }

    forward(e, t) { for (;this.minActive > -1 && (this.activeTo[this.minActive] - e || this.active[this.minActive].endSide - t) < 0;) this.removeActive(this.minActive); this.cursor.forward(e, t); }

    removeActive(e) { En(this.active, e), En(this.activeTo, e), En(this.activeRank, e), this.minActive = na(this.active, this.activeTo); }

    addActive(e) { let t = 0; const { value: n, to: s, rank: r } = this.cursor; for (;t < this.activeRank.length && this.activeRank[t] <= r;)t++; Dn(this.active, t, n), Dn(this.activeTo, t, s), Dn(this.activeRank, t, r), e && Dn(e, t, this.cursor.from), this.minActive = na(this.active, this.activeTo); }

    next() { const e = this.to; const t = this.point; this.point = null; const n = this.openStart < 0 ? [] : null; let s = 0; for (;;) { const r = this.minActive; if (r > -1 && (this.activeTo[r] - this.cursor.from || this.active[r].endSide - this.cursor.startSide) < 0) { if (this.activeTo[r] > e) { this.to = this.activeTo[r], this.endSide = this.active[r].endSide; break; } this.removeActive(r), n && En(n, r); } else if (this.cursor.value) if (this.cursor.from > e) { this.to = this.cursor.from, this.endSide = this.cursor.startSide; break; } else { const o = this.cursor.value; if (!o.point) this.addActive(n), this.cursor.next(); else if (t && this.cursor.to == this.to && this.cursor.from < this.cursor.to) this.cursor.next(); else { this.point = o, this.pointFrom = this.cursor.from, this.pointRank = this.cursor.rank, this.to = this.cursor.to, this.endSide = o.endSide, this.cursor.from < e && (s = 1), this.cursor.next(), this.forward(this.to, this.endSide); break; } } else { this.to = this.endSide = 1e9; break; } } if (n) { let r = 0; for (;r < n.length && n[r] < e;)r++; this.openStart = r + s; } }

    activeForPoint(e) { if (!this.active.length) return this.active; const t = []; for (let n = this.active.length - 1; n >= 0 && !(this.activeRank[n] < this.pointRank); n--)(this.activeTo[n] > e || this.activeTo[n] == e && this.active[n].endSide >= this.point.endSide) && t.push(this.active[n]); return t.reverse(); }

    openEnd(e) { let t = 0; for (let n = this.activeTo.length - 1; n >= 0 && this.activeTo[n] > e; n--)t++; return t; }
  }; function ia(i, e, t, n, s, r) { i.goto(e), t.goto(n); const o = n + s; let l = n; const a = n - e; for (;;) { const h = i.to + a - t.to || i.endSide - t.endSide; const c = h < 0 ? i.to + a : t.to; const f = Math.min(c, o); if (i.point || t.point ? i.point && t.point && (i.point == t.point || i.point.eq(t.point)) && xr(i.activeForPoint(i.to + a), t.activeForPoint(t.to)) || r.comparePoint(l, f, i.point, t.point) : f > l && !xr(i.active, t.active) && r.compareRange(l, f, i.active, t.active), c > o) break; l = c, h <= 0 && i.next(), h >= 0 && t.next(); } } function xr(i, e) { if (i.length != e.length) return !1; for (let t = 0; t < i.length; t++) if (i[t] != e[t] && !i[t].eq(e[t])) return !1; return !0; } function En(i, e) { for (let t = e, n = i.length - 1; t < n; t++)i[t] = i[t + 1]; i.pop(); } function Dn(i, e, t) { for (let n = i.length - 1; n >= e; n--)i[n + 1] = i[n]; i[e] = t; } function na(i, e) { let t = -1; let n = 1e9; for (let s = 0; s < e.length; s++)(e[s] - n || i[s].endSide - i[t].endSide) < 0 && (t = s, n = e[s]); return t; } function St(i, e, t = i.length) { let n = 0; for (let s = 0; s < t;)i.charCodeAt(s) == 9 ? (n += e - n % e, s++) : (n++, s = ve(i, s)); return n; } function Fn(i, e, t, n) { for (let s = 0, r = 0; ;) { if (r >= e) return s; if (s == i.length) break; r += i.charCodeAt(s) == 9 ? t - r % t : 1, s = ve(i, s); } return n === !0 ? -1 : i.length; } const vr = '\u037C'; const ya = typeof Symbol > 'u' ? `__${vr}` : Symbol.for(vr); const Or = typeof Symbol > 'u' ? `__styleSet${Math.floor(Math.random() * 1e8)}` : Symbol('styleSet'); const xa = typeof globalThis < 'u' ? globalThis : typeof window < 'u' ? window : {}; const Ie = class {
    constructor(e, t) { this.rules = []; const { finish: n } = t || {}; function s(o) { return /^@/.test(o) ? [o] : o.split(/,\s*/); } function r(o, l, a, h) { const c = []; const f = /^@(\w+)\b/.exec(o[0]); const u = f && f[1] == 'keyframes'; if (f && l == null) return a.push(`${o[0]};`); for (const d in l) { const p = l[d]; if (/&/.test(d))r(d.split(/,\s*/).map(g => o.map(b => g.replace(/&/, b))).reduce((g, b) => g.concat(b)), p, a); else if (p && typeof p === 'object') { if (!f) throw new RangeError(`The value of a property (${d}) should be a primitive value.`); r(s(d), p, c, u); } else p != null && c.push(`${d.replace(/_.*/, '').replace(/[A-Z]/g, g => `-${g.toLowerCase()}`)}: ${p};`); }(c.length || u) && a.push(`${(n && !f && !h ? o.map(n) : o).join(', ')} {${c.join(' ')}}`); } for (const o in e)r(s(o), e[o], this.rules); }

    getRules() {
      return this.rules.join(`
`);
    }

    static newName() { const e = xa[ya] || 1; return xa[ya] = e + 1, vr + e.toString(36); }

    static mount(e, t) { (e[Or] || new Sr(e)).mount(Array.isArray(t) ? t : [t]); }
  }; let zn = null; var Sr = class {
    constructor(e) { if (!e.head && e.adoptedStyleSheets && typeof CSSStyleSheet < 'u') { if (zn) return e.adoptedStyleSheets = [zn.sheet].concat(e.adoptedStyleSheets), e[Or] = zn; this.sheet = new CSSStyleSheet(), e.adoptedStyleSheets = [this.sheet].concat(e.adoptedStyleSheets), zn = this; } else { this.styleTag = (e.ownerDocument || e).createElement('style'); const t = e.head || e; t.insertBefore(this.styleTag, t.firstChild); } this.modules = [], e[Or] = this; }

    mount(e) {
      const t = this.sheet; let n = 0; let s = 0; for (let r = 0; r < e.length; r++) { const o = e[r]; let l = this.modules.indexOf(o); if (l < s && l > -1 && (this.modules.splice(l, 1), s--, l = -1), l == -1) { if (this.modules.splice(s++, 0, o), t) for (let a = 0; a < o.rules.length; a++)t.insertRule(o.rules[a], n++); } else { for (;s < l;)n += this.modules[s++].rules.length; n += o.rules.length, s++; } } if (!t) {
        let r = ''; for (let o = 0; o < this.modules.length; o++) {
          r += `${this.modules[o].getRules()}
`;
        } this.styleTag.textContent = r;
      }
    }
  }; const ft = {
    8: 'Backspace', 9: 'Tab', 10: 'Enter', 12: 'NumLock', 13: 'Enter', 16: 'Shift', 17: 'Control', 18: 'Alt', 20: 'CapsLock', 27: 'Escape', 32: ' ', 33: 'PageUp', 34: 'PageDown', 35: 'End', 36: 'Home', 37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown', 44: 'PrintScreen', 45: 'Insert', 46: 'Delete', 59: ';', 61: '=', 91: 'Meta', 92: 'Meta', 106: '*', 107: '+', 108: ',', 109: '-', 110: '.', 111: '/', 144: 'NumLock', 145: 'ScrollLock', 160: 'Shift', 161: 'Shift', 162: 'Control', 163: 'Control', 164: 'Alt', 165: 'Alt', 173: '-', 186: ';', 187: '=', 188: ',', 189: '-', 190: '.', 191: '/', 192: '`', 219: '[', 220: '\\', 221: ']', 222: "'", 229: 'q',
  }; const Wn = {
    48: ')', 49: '!', 50: '@', 51: '#', 52: '$', 53: '%', 54: '^', 55: '&', 56: '*', 57: '(', 59: ':', 61: '+', 173: '_', 186: ':', 187: '+', 188: '<', 189: '_', 190: '>', 191: '?', 192: '~', 219: '{', 220: '|', 221: '}', 222: '"', 229: 'Q',
  }; const wa = typeof navigator < 'u' && /Chrome\/(\d+)/.exec(navigator.userAgent); const wd = typeof navigator < 'u' && /Apple Computer/.test(navigator.vendor); const kd = typeof navigator < 'u' && /Gecko\/\d+/.test(navigator.userAgent); const ka = typeof navigator < 'u' && /Mac/.test(navigator.platform); const vd = typeof navigator < 'u' && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent); const Od = wa && (ka || +wa[1] < 57) || kd && ka; for (se = 0; se < 10; se++)ft[48 + se] = ft[96 + se] = String(se); var se; for (se = 1; se <= 24; se++)ft[se + 111] = `F${se}`; var se; for (se = 65; se <= 90; se++)ft[se] = String.fromCharCode(se + 32), Wn[se] = String.fromCharCode(se); var se; for (Vn in ft)Wn.hasOwnProperty(Vn) || (Wn[Vn] = ft[Vn]); let Vn; function va(i) { const e = Od && (i.ctrlKey || i.altKey || i.metaKey) || (wd || vd) && i.shiftKey && i.key && i.key.length == 1; let t = !e && i.key || (i.shiftKey ? Wn : ft)[i.keyCode] || i.key || 'Unidentified'; return t == 'Esc' && (t = 'Escape'), t == 'Del' && (t = 'Delete'), t == 'Left' && (t = 'ArrowLeft'), t == 'Up' && (t = 'ArrowUp'), t == 'Right' && (t = 'ArrowRight'), t == 'Down' && (t = 'ArrowDown'), t; } function Zn(i) { let e; return i.nodeType == 11 ? e = i.getSelection ? i : i.ownerDocument : e = i, e.getSelection(); } function di(i, e) { return e ? i == e || i.contains(e.nodeType != 1 ? e.parentNode : e) : !1; } function Sd() { let i = document.activeElement; for (;i && i.shadowRoot;)i = i.shadowRoot.activeElement; return i; } function Br(i, e) { if (!e.anchorNode) return !1; try { return di(i, e.anchorNode); } catch { return !1; } } function nn(i) { return i.nodeType == 3 ? sn(i, 0, i.nodeValue.length).getClientRects() : i.nodeType == 1 ? i.getClientRects() : []; } function Qn(i, e, t, n) { return t ? Oa(i, e, t, n, -1) || Oa(i, e, t, n, 1) : !1; } function Nr(i) { for (let e = 0; ;e++) if (i = i.previousSibling, !i) return e; } function Oa(i, e, t, n, s) { for (;;) { if (i == t && e == n) return !0; if (e == (s < 0 ? 0 : Xn(i))) { if (i.nodeName == 'DIV') return !1; const r = i.parentNode; if (!r || r.nodeType != 1) return !1; e = Nr(i) + (s < 0 ? 0 : 1), i = r; } else if (i.nodeType == 1) { if (i = i.childNodes[e + (s < 0 ? -1 : 0)], i.nodeType == 1 && i.contentEditable == 'false') return !1; e = s < 0 ? Xn(i) : 0; } else return !1; } } function Xn(i) { return i.nodeType == 3 ? i.nodeValue.length : i.childNodes.length; } const ah = {
    left: 0, right: 0, top: 0, bottom: 0,
  }; function us(i, e) {
    const t = e ? i.left : i.right; return {
      left: t, right: t, top: i.top, bottom: i.bottom,
    };
  } function Cd(i) {
    return {
      left: 0, right: i.innerWidth, top: 0, bottom: i.innerHeight,
    };
  } function Ad(i, e, t, n, s, r, o, l) {
    const a = i.ownerDocument; const h = a.defaultView; for (let c = i; c;) {
      if (c.nodeType == 1) {
        let f; const u = c == a.body; if (u)f = Cd(h); else {
          if (c.scrollHeight <= c.clientHeight && c.scrollWidth <= c.clientWidth) { c = c.parentNode; continue; } const g = c.getBoundingClientRect(); f = {
            left: g.left, right: g.left + c.clientWidth, top: g.top, bottom: g.top + c.clientHeight,
          };
        } let d = 0; let p = 0; if (s == 'nearest')e.top < f.top ? (p = -(f.top - e.top + o), t > 0 && e.bottom > f.bottom + p && (p = e.bottom - f.bottom + p + o)) : e.bottom > f.bottom && (p = e.bottom - f.bottom + o, t < 0 && e.top - p < f.top && (p = -(f.top + p - e.top + o))); else { const g = e.bottom - e.top; const b = f.bottom - f.top; p = (s == 'center' && g <= b ? e.top + g / 2 - b / 2 : s == 'start' || s == 'center' && t < 0 ? e.top - o : e.bottom - b + o) - f.top; } if (n == 'nearest' ? e.left < f.left ? (d = -(f.left - e.left + r), t > 0 && e.right > f.right + d && (d = e.right - f.right + d + r)) : e.right > f.right && (d = e.right - f.right + r, t < 0 && e.left < f.left + d && (d = -(f.left + d - e.left + r))) : d = (n == 'center' ? e.left + (e.right - e.left) / 2 - (f.right - f.left) / 2 : n == 'start' == l ? e.left - r : e.right - (f.right - f.left) + r) - f.left, d || p) {
          if (u)h.scrollBy(d, p); else {
            if (p) { const g = c.scrollTop; c.scrollTop += p, p = c.scrollTop - g; } if (d) { const g = c.scrollLeft; c.scrollLeft += d, d = c.scrollLeft - g; }e = {
              left: e.left - d, top: e.top - p, right: e.right - d, bottom: e.bottom - p,
            };
          }
        } if (u) break; c = c.assignedSlot || c.parentNode, n = s = 'nearest';
      } else if (c.nodeType == 11)c = c.host; else break;
    }
  } const $r = class {
    constructor() { this.anchorNode = null, this.anchorOffset = 0, this.focusNode = null, this.focusOffset = 0; }

    eq(e) { return this.anchorNode == e.anchorNode && this.anchorOffset == e.anchorOffset && this.focusNode == e.focusNode && this.focusOffset == e.focusOffset; }

    setRange(e) { this.set(e.anchorNode, e.anchorOffset, e.focusNode, e.focusOffset); }

    set(e, t, n, s) { this.anchorNode = e, this.anchorOffset = t, this.focusNode = n, this.focusOffset = s; }
  }; let hi = null; function hh(i) { if (i.setActive) return i.setActive(); if (hi) return i.focus(hi); const e = []; for (let t = i; t && (e.push(t, t.scrollTop, t.scrollLeft), t != t.ownerDocument); t = t.parentNode);if (i.focus(hi == null ? { get preventScroll() { return hi = { preventScroll: !0 }, !0; } } : void 0), !hi) { hi = !1; for (let t = 0; t < e.length;) { const n = e[t++]; const s = e[t++]; const r = e[t++]; n.scrollTop != s && (n.scrollTop = s), n.scrollLeft != r && (n.scrollLeft = r); } } } let Sa; function sn(i, e, t = e) { const n = Sa || (Sa = document.createRange()); return n.setEnd(i, t), n.setStart(i, e), n; } function Ki(i, e, t) {
    const n = {
      key: e, code: e, keyCode: t, which: t, cancelable: !0,
    }; const s = new KeyboardEvent('keydown', n); s.synthetic = !0, i.dispatchEvent(s); const r = new KeyboardEvent('keyup', n); return r.synthetic = !0, i.dispatchEvent(r), s.defaultPrevented || r.defaultPrevented;
  } function Td(i) { for (;i;) { if (i && (i.nodeType == 9 || i.nodeType == 11 && i.host)) return i; i = i.assignedSlot || i.parentNode; } return null; } function ch(i) { for (;i.attributes.length;)i.removeAttributeNode(i.attributes[0]); } var ce = class {
    constructor(e, t, n = !0) { this.node = e, this.offset = t, this.precise = n; }

    static before(e, t) { return new ce(e.parentNode, Nr(e), t); }

    static after(e, t) { return new ce(e.parentNode, Nr(e) + 1, t); }
  }; const xo = []; var K = class {
    constructor() { this.parent = null, this.dom = null, this.dirty = 2; }

    get editorView() { if (!this.parent) throw new Error('Accessing view in orphan content view'); return this.parent.editorView; }

    get overrideDOMText() { return null; }

    get posAtStart() { return this.parent ? this.parent.posBefore(this) : 0; }

    get posAtEnd() { return this.posAtStart + this.length; }

    posBefore(e) { let t = this.posAtStart; for (const n of this.children) { if (n == e) return t; t += n.length + n.breakAfter; } throw new RangeError('Invalid child in posBefore'); }

    posAfter(e) { return this.posBefore(e) + e.length; }

    coordsAt(e, t) { return null; }

    sync(e) { if (this.dirty & 2) { const t = this.dom; let n = null; let s; for (const r of this.children) { if (r.dirty) { if (!r.dom && (s = n ? n.nextSibling : t.firstChild)) { const o = K.get(s); (!o || !o.parent && o.constructor == r.constructor) && r.reuseDOM(s); }r.sync(e), r.dirty = 0; } if (s = n ? n.nextSibling : t.firstChild, e && !e.written && e.node == t && s != r.dom && (e.written = !0), r.dom.parentNode == t) for (;s && s != r.dom;)s = Ca(s); else t.insertBefore(r.dom, s); n = r.dom; } for (s = n ? n.nextSibling : t.firstChild, s && e && e.node == t && (e.written = !0); s;)s = Ca(s); } else if (this.dirty & 1) for (const t of this.children)t.dirty && (t.sync(e), t.dirty = 0); }

    reuseDOM(e) {}

    localPosFromDOM(e, t) { let n; if (e == this.dom)n = this.dom.childNodes[t]; else { let s = Xn(e) == 0 ? 0 : t == 0 ? -1 : 1; for (;;) { const r = e.parentNode; if (r == this.dom) break; s == 0 && r.firstChild != r.lastChild && (e == r.firstChild ? s = -1 : s = 1), e = r; }s < 0 ? n = e : n = e.nextSibling; } if (n == this.dom.firstChild) return 0; for (;n && !K.get(n);)n = n.nextSibling; if (!n) return this.length; for (let s = 0, r = 0; ;s++) { const o = this.children[s]; if (o.dom == n) return r; r += o.length + o.breakAfter; } }

    domBoundsAround(e, t, n = 0) {
      let s = -1; let r = -1; let o = -1; let l = -1; for (let a = 0, h = n, c = n; a < this.children.length; a++) { const f = this.children[a]; const u = h + f.length; if (h < e && u > t) return f.domBoundsAround(e, t, h); if (u >= e && s == -1 && (s = a, r = h), h > t && f.dom.parentNode == this.dom) { o = a, l = c; break; }c = u, h = u + f.breakAfter; } return {
        from: r, to: l < 0 ? n + this.length : l, startDOM: (s ? this.children[s - 1].dom.nextSibling : null) || this.dom.firstChild, endDOM: o < this.children.length && o >= 0 ? this.children[o].dom : null,
      };
    }

    markDirty(e = !1) { this.dirty |= 2, this.markParentsDirty(e); }

    markParentsDirty(e) { for (let t = this.parent; t; t = t.parent) { if (e && (t.dirty |= 2), t.dirty & 1) return; t.dirty |= 1, e = !1; } }

    setParent(e) { this.parent != e && (this.parent = e, this.dirty && this.markParentsDirty(!0)); }

    setDOM(e) { this.dom && (this.dom.cmView = null), this.dom = e, e.cmView = this; }

    get rootView() { for (let e = this; ;) { const t = e.parent; if (!t) return e; e = t; } }

    replaceChildren(e, t, n = xo) { this.markDirty(); for (let s = e; s < t; s++) { const r = this.children[s]; r.parent == this && r.destroy(); } this.children.splice(e, t - e, ...n); for (let s = 0; s < n.length; s++)n[s].setParent(this); }

    ignoreMutation(e) { return !1; }

    ignoreEvent(e) { return !1; }

    childCursor(e = this.length) { return new Kn(this.children, e, this.children.length); }

    childPos(e, t = 1) { return this.childCursor().findPos(e, t); }

    toString() { const e = this.constructor.name.replace('View', ''); return e + (this.children.length ? `(${this.children.join()})` : this.length ? `[${e == 'Text' ? this.text : this.length}]` : '') + (this.breakAfter ? '#' : ''); }

    static get(e) { return e.cmView; }

    get isEditable() { return !0; }

    merge(e, t, n, s, r, o) { return !1; }

    become(e) { return !1; }

    getSide() { return 0; }

    destroy() { this.parent = null; }
  }; K.prototype.breakAfter = 0; function Ca(i) { const e = i.nextSibling; return i.parentNode.removeChild(i), e; } var Kn = class {
    constructor(e, t, n) { this.children = e, this.pos = t, this.i = n, this.off = 0; }

    findPos(e, t = 1) { for (;;) { if (e > this.pos || e == this.pos && (t > 0 || this.i == 0 || this.children[this.i - 1].breakAfter)) return this.off = e - this.pos, this; const n = this.children[--this.i]; this.pos -= n.length + n.breakAfter; } }
  }; function fh(i, e, t, n, s, r, o, l, a) { const { children: h } = i; const c = h.length ? h[e] : null; const f = r.length ? r[r.length - 1] : null; const u = f ? f.breakAfter : o; if (!(e == n && c && !o && !u && r.length < 2 && c.merge(t, s, r.length ? f : null, t == 0, l, a))) { if (n < h.length) { let d = h[n]; d && s < d.length ? (e == n && (d = d.split(s), s = 0), !u && f && d.merge(0, s, f, !0, 0, a) ? r[r.length - 1] = d : (s && d.merge(0, s, null, !1, 0, a), r.push(d))) : d?.breakAfter && (f ? f.breakAfter = 1 : o = 1), n++; } for (c && (c.breakAfter = o, t > 0 && (!o && r.length && c.merge(t, c.length, r[0], !1, l, 0) ? c.breakAfter = r.shift().breakAfter : (t < c.length || c.children.length && c.children[c.children.length - 1].length == 0) && c.merge(t, c.length, null, !1, l, 0), e++)); e < n && r.length;) if (h[n - 1].become(r[r.length - 1]))n--, r.pop(), a = r.length ? 0 : l; else if (h[e].become(r[0]))e++, r.shift(), l = r.length ? 0 : a; else break; !r.length && e && n < h.length && !h[e - 1].breakAfter && h[n].merge(0, 0, h[e - 1], !1, l, a) && e--, (e < n || r.length) && i.replaceChildren(e, n, r); } } function uh(i, e, t, n, s, r) { const o = i.childCursor(); const { i: l, off: a } = o.findPos(t, 1); const { i: h, off: c } = o.findPos(e, -1); let f = e - t; for (const u of n)f += u.length; i.length += f, fh(i, h, c, l, a, n, 0, s, r); } const De = typeof navigator < 'u' ? navigator : { userAgent: '', vendor: '', platform: '' }; const Ir = typeof document < 'u' ? document : { documentElement: { style: {} } }; const Fr = /Edge\/(\d+)/.exec(De.userAgent); const dh = /MSIE \d/.test(De.userAgent); const zr = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(De.userAgent); const ds = !!(dh || zr || Fr); const Aa = !ds && /gecko\/(\d+)/i.test(De.userAgent); const Cr = !ds && /Chrome\/(\d+)/.exec(De.userAgent); const Ta = 'webkitFontSmoothing' in Ir.documentElement.style; const ph = !ds && /Apple Computer/.test(De.vendor); const Pa = ph && (/Mobile\/\w+/.test(De.userAgent) || De.maxTouchPoints > 2); const E = {
    mac: Pa || /Mac/.test(De.platform), windows: /Win/.test(De.platform), linux: /Linux|X11/.test(De.platform), ie: ds, ie_version: dh ? Ir.documentMode || 6 : zr ? +zr[1] : Fr ? +Fr[1] : 0, gecko: Aa, gecko_version: Aa ? +(/Firefox\/(\d+)/.exec(De.userAgent) || [0, 0])[1] : 0, chrome: !!Cr, chrome_version: Cr ? +Cr[1] : 0, ios: Pa, android: /Android\b/.test(De.userAgent), webkit: Ta, safari: ph, webkit_version: Ta ? +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1] : 0, tabSize: Ir.documentElement.style.tabSize != null ? 'tab-size' : '-moz-tab-size',
  }; const Pd = 256; var nt = class extends K {
    constructor(e) { super(), this.text = e; }

    get length() { return this.text.length; }

    createDOM(e) { this.setDOM(e || document.createTextNode(this.text)); }

    sync(e) { this.dom || this.createDOM(), this.dom.nodeValue != this.text && (e && e.node == this.dom && (e.written = !0), this.dom.nodeValue = this.text); }

    reuseDOM(e) { e.nodeType == 3 && this.createDOM(e); }

    merge(e, t, n) { return n && (!(n instanceof nt) || this.length - (t - e) + n.length > Pd) ? !1 : (this.text = this.text.slice(0, e) + (n ? n.text : '') + this.text.slice(t), this.markDirty(), !0); }

    split(e) { const t = new nt(this.text.slice(e)); return this.text = this.text.slice(0, e), this.markDirty(), t; }

    localPosFromDOM(e, t) { return e == this.dom ? t : t ? this.text.length : 0; }

    domAtPos(e) { return new ce(this.dom, e); }

    domBoundsAround(e, t, n) {
      return {
        from: n, to: n + this.length, startDOM: this.dom, endDOM: this.dom.nextSibling,
      };
    }

    coordsAt(e, t) { return Vr(this.dom, e, t); }
  }; var Fe = class extends K {
    constructor(e, t = [], n = 0) { super(), this.mark = e, this.children = t, this.length = n; for (const s of t)s.setParent(this); }

    setAttrs(e) { if (ch(e), this.mark.class && (e.className = this.mark.class), this.mark.attrs) for (const t in this.mark.attrs)e.setAttribute(t, this.mark.attrs[t]); return e; }

    reuseDOM(e) { e.nodeName == this.mark.tagName.toUpperCase() && (this.setDOM(e), this.dirty |= 6); }

    sync(e) { this.dom ? this.dirty & 4 && this.setAttrs(this.dom) : this.setDOM(this.setAttrs(document.createElement(this.mark.tagName))), super.sync(e); }

    merge(e, t, n, s, r, o) { return n && (!(n instanceof Fe && n.mark.eq(this.mark)) || e && r <= 0 || t < this.length && o <= 0) ? !1 : (uh(this, e, t, n ? n.children : [], r - 1, o - 1), this.markDirty(), !0); }

    split(e) { const t = []; let n = 0; let s = -1; let r = 0; for (const l of this.children) { const a = n + l.length; a > e && t.push(n < e ? l.split(e - n) : l), s < 0 && n >= e && (s = r), n = a, r++; } const o = this.length - e; return this.length = e, s > -1 && (this.children.length = s, this.markDirty()), new Fe(this.mark, t, o); }

    domAtPos(e) { return gh(this.dom, this.children, e); }

    coordsAt(e, t) { return yh(this, e, t); }
  }; function Vr(i, e, t) { const n = i.nodeValue.length; e > n && (e = n); let s = e; let r = e; let o = 0; e == 0 && t < 0 || e == n && t >= 0 ? E.chrome || E.gecko || (e ? (s--, o = 1) : (r++, o = -1)) : t < 0 ? s-- : r++; const l = sn(i, s, r).getClientRects(); if (!l.length) return ah; let a = l[(o ? o < 0 : t >= 0) ? 0 : l.length - 1]; return E.safari && !o && a.width == 0 && (a = Array.prototype.find.call(l, h => h.width) || a), o ? us(a, o < 0) : a || null; } var tt = class extends K {
    constructor(e, t, n) { super(), this.widget = e, this.length = t, this.side = n, this.prevWidget = null; }

    static create(e, t, n) { return new (e.customView || tt)(e, t, n); }

    split(e) { const t = tt.create(this.widget, this.length - e, this.side); return this.length -= e, t; }

    sync() { (!this.dom || !this.widget.updateDOM(this.dom)) && (this.dom && this.prevWidget && this.prevWidget.destroy(this.dom), this.prevWidget = null, this.setDOM(this.widget.toDOM(this.editorView)), this.dom.contentEditable = 'false'); }

    getSide() { return this.side; }

    merge(e, t, n, s, r, o) { return n && (!(n instanceof tt) || !this.widget.compare(n.widget) || e > 0 && r <= 0 || t < this.length && o <= 0) ? !1 : (this.length = e + (n ? n.length : 0) + (this.length - t), !0); }

    become(e) { return e.length == this.length && e instanceof tt && e.side == this.side && this.widget.constructor == e.widget.constructor ? (this.widget.eq(e.widget) || this.markDirty(!0), this.dom && !this.prevWidget && (this.prevWidget = this.widget), this.widget = e.widget, !0) : !1; }

    ignoreMutation() { return !0; }

    ignoreEvent(e) { return this.widget.ignoreEvent(e); }

    get overrideDOMText() { if (this.length == 0) return z.empty; let e = this; for (;e.parent;)e = e.parent; const t = e.editorView; const n = t && t.state.doc; const s = this.posAtStart; return n ? n.slice(s, s + this.length) : z.empty; }

    domAtPos(e) { return e == 0 ? ce.before(this.dom) : ce.after(this.dom, e == this.length); }

    domBoundsAround() { return null; }

    coordsAt(e, t) { const n = this.dom.getClientRects(); let s = null; if (!n.length) return ah; for (let r = e > 0 ? n.length - 1 : 0; s = n[r], !(e > 0 ? r == 0 : r == n.length - 1 || s.top < s.bottom); r += e > 0 ? -1 : 1);return e == 0 && t > 0 || e == this.length && t <= 0 ? s : us(s, e == 0); }

    get isEditable() { return !1; }

    destroy() { super.destroy(), this.dom && this.widget.destroy(this.dom); }
  }; const Jn = class extends tt {
    domAtPos(e) { const { topView: t, text: n } = this.widget; return t ? Wr(e, 0, t, n, (s, r) => s.domAtPos(r), s => new ce(n, Math.min(s, n.nodeValue.length))) : new ce(n, Math.min(e, n.nodeValue.length)); }

    sync() { this.setDOM(this.widget.toDOM()); }

    localPosFromDOM(e, t) { const { topView: n, text: s } = this.widget; return n ? mh(e, t, n, s) : Math.min(t, this.length); }

    ignoreMutation() { return !1; }

    get overrideDOMText() { return null; }

    coordsAt(e, t) { const { topView: n, text: s } = this.widget; return n ? Wr(e, t, n, s, (r, o, l) => r.coordsAt(o, l), (r, o) => Vr(s, r, o)) : Vr(s, e, t); }

    destroy() { let e; super.destroy(), (e = this.widget.topView) === null || e === void 0 || e.destroy(); }

    get isEditable() { return !0; }
  }; function Wr(i, e, t, n, s, r) { if (t instanceof Fe) { for (const o of t.children) { const l = di(o.dom, n); const a = l ? n.nodeValue.length : o.length; if (i < a || i == a && o.getSide() <= 0) return l ? Wr(i, e, o, n, s, r) : s(o, i, e); i -= a; } return s(t, t.length, -1); } return t.dom == n ? r(i, e) : s(t, i, e); } function mh(i, e, t, n) { if (t instanceof Fe) for (const s of t.children) { let r = 0; const o = di(s.dom, n); if (di(s.dom, i)) return r + (o ? mh(i, e, s, n) : s.localPosFromDOM(i, e)); r += o ? n.nodeValue.length : s.length; } else if (t.dom == n) return Math.min(e, n.nodeValue.length); return t.localPosFromDOM(i, e); } var Pt = class extends K {
    constructor(e) { super(), this.side = e; }

    get length() { return 0; }

    merge() { return !1; }

    become(e) { return e instanceof Pt && e.side == this.side; }

    split() { return new Pt(this.side); }

    sync() { if (!this.dom) { const e = document.createElement('img'); e.className = 'cm-widgetBuffer', e.setAttribute('aria-hidden', 'true'), this.setDOM(e); } }

    getSide() { return this.side; }

    domAtPos(e) { return ce.before(this.dom); }

    localPosFromDOM() { return 0; }

    domBoundsAround() { return null; }

    coordsAt(e) {
      const t = this.dom.getBoundingClientRect(); const n = Md(this, this.side > 0 ? -1 : 1); return n && n.top < t.bottom && n.bottom > t.top ? {
        left: t.left, right: t.right, top: n.top, bottom: n.bottom,
      } : t;
    }

    get overrideDOMText() { return z.empty; }
  }; nt.prototype.children = tt.prototype.children = Pt.prototype.children = xo; function Md(i, e) { let t = i.parent; let n = t ? t.children.indexOf(i) : -1; for (;t && n >= 0;) if (e < 0 ? n > 0 : n < t.children.length) { const s = t.children[n + e]; if (s instanceof nt) { const r = s.coordsAt(e < 0 ? s.length : 0, e); if (r) return r; }n += e; } else if (t instanceof Fe && t.parent)n = t.parent.children.indexOf(t) + (e < 0 ? 0 : 1), t = t.parent; else { const s = t.dom.lastChild; if (s && s.nodeName == 'BR') return s.getClientRects()[0]; break; } } function gh(i, e, t) { let n = 0; for (let s = 0; n < e.length; n++) { const r = e[n]; const o = s + r.length; if (!(o == s && r.getSide() <= 0)) { if (t > s && t < o && r.dom.parentNode == i) return r.domAtPos(t - s); if (t <= s) break; s = o; } } for (;n > 0; n--) { const s = e[n - 1].dom; if (s.parentNode == i) return ce.after(s); } return new ce(i, 0); } function bh(i, e, t) { let n; const { children: s } = i; t > 0 && e instanceof Fe && s.length && (n = s[s.length - 1]) instanceof Fe && n.mark.eq(e.mark) ? bh(n, e.children[0], t - 1) : (s.push(e), e.setParent(i)), i.length += e.length; } function yh(i, e, t) { for (let r = 0, o = 0; o < i.children.length; o++) { const l = i.children[o]; const a = r + l.length; let h; if ((t <= 0 || a == i.length || l.getSide() > 0 ? a >= e : a > e) && (e < a || o + 1 == i.children.length || (h = i.children[o + 1]).length || h.getSide() > 0)) { let c = 0; if (a == r) { if (l.getSide() <= 0) continue; c = t = -l.getSide(); } const f = l.coordsAt(Math.max(0, e - r), t); return c && f ? us(f, t < 0) : f; }r = a; } const n = i.dom.lastChild; if (!n) return i.dom.getBoundingClientRect(); const s = nn(n); return s[s.length - 1] || null; } function Hr(i, e) { for (const t in i)t == 'class' && e.class ? e.class += ` ${i.class}` : t == 'style' && e.style ? e.style += `;${i.style}` : e[t] = i[t]; return e; } function wo(i, e) { if (i == e) return !0; if (!i || !e) return !1; const t = Object.keys(i); const n = Object.keys(e); if (t.length != n.length) return !1; for (const s of t) if (n.indexOf(s) == -1 || i[s] !== e[s]) return !1; return !0; } function qr(i, e, t) { if (e) for (const n in e)t && n in t || i.removeAttribute(n); if (t) for (const n in t)e && e[n] == t[n] || i.setAttribute(n, t[n]); } const Ae = class {
    eq(e) { return !1; }

    updateDOM(e) { return !1; }

    compare(e) { return this == e || this.constructor == e.constructor && this.eq(e); }

    get estimatedHeight() { return -1; }

    ignoreEvent(e) { return !0; }

    get customView() { return null; }

    destroy(e) {}
  }; var _ = (function (i) { return i[i.Text = 0] = 'Text', i[i.WidgetBefore = 1] = 'WidgetBefore', i[i.WidgetAfter = 2] = 'WidgetAfter', i[i.WidgetRange = 3] = 'WidgetRange', i; }(_ || (_ = {}))); const A = class extends je {
    constructor(e, t, n, s) { super(), this.startSide = e, this.endSide = t, this.widget = n, this.spec = s; }

    get heightRelevant() { return !1; }

    static mark(e) { return new pi(e); }

    static widget(e) { let t = e.side || 0; const n = !!e.block; return t += n ? t > 0 ? 3e8 : -4e8 : t > 0 ? 1e8 : -1e8, new dt(e, t, t, n, e.widget || null, !1); }

    static replace(e) { const t = !!e.block; let n; let s; if (e.isBlockGap)n = -5e8, s = 4e8; else { const { start: r, end: o } = xh(e, t); n = (r ? t ? -3e8 : -1 : 5e8) - 1, s = (o ? t ? 2e8 : 1 : -6e8) + 1; } return new dt(e, n, s, t, e.widget || null, !0); }

    static line(e) { return new _t(e); }

    static set(e, t = !1) { return I.of(e, t); }

    hasHeight() { return this.widget ? this.widget.estimatedHeight > -1 : !1; }
  }; A.none = I.empty; var pi = class extends A {
    constructor(e) { const { start: t, end: n } = xh(e); super(t ? -1 : 5e8, n ? 1 : -6e8, null, e), this.tagName = e.tagName || 'span', this.class = e.class || '', this.attrs = e.attributes || null; }

    eq(e) { return this == e || e instanceof pi && this.tagName == e.tagName && this.class == e.class && wo(this.attrs, e.attrs); }

    range(e, t = e) { if (e >= t) throw new RangeError('Mark decorations may not be empty'); return super.range(e, t); }
  }; pi.prototype.point = !1; var _t = class extends A {
    constructor(e) { super(-2e8, -2e8, null, e); }

    eq(e) { return e instanceof _t && wo(this.spec.attributes, e.spec.attributes); }

    range(e, t = e) { if (t != e) throw new RangeError('Line decoration ranges must be zero-length'); return super.range(e, t); }
  }; _t.prototype.mapMode = oe.TrackBefore; _t.prototype.point = !0; var dt = class extends A {
    constructor(e, t, n, s, r, o) { super(t, n, r, e), this.block = s, this.isReplace = o, this.mapMode = s ? t <= 0 ? oe.TrackBefore : oe.TrackAfter : oe.TrackDel; }

    get type() { return this.startSide < this.endSide ? _.WidgetRange : this.startSide <= 0 ? _.WidgetBefore : _.WidgetAfter; }

    get heightRelevant() { return this.block || !!this.widget && this.widget.estimatedHeight >= 5; }

    eq(e) { return e instanceof dt && Ed(this.widget, e.widget) && this.block == e.block && this.startSide == e.startSide && this.endSide == e.endSide; }

    range(e, t = e) { if (this.isReplace && (e > t || e == t && this.startSide > 0 && this.endSide <= 0)) throw new RangeError('Invalid range for replacement decoration'); if (!this.isReplace && t != e) throw new RangeError('Widget decorations can only have zero-length ranges'); return super.range(e, t); }
  }; dt.prototype.point = !0; function xh(i, e = !1) { let { inclusiveStart: t, inclusiveEnd: n } = i; return t == null && (t = i.inclusive), n == null && (n = i.inclusive), { start: t ?? e, end: n ?? e }; } function Ed(i, e) { return i == e || !!(i && e && i.compare(e)); } function Ur(i, e, t, n = 0) { const s = t.length - 1; s >= 0 && t[s] + n >= i ? t[s] = Math.max(t[s], e) : t.push(i, e); } var pe = class extends K {
    constructor() { super(...arguments), this.children = [], this.length = 0, this.prevAttrs = void 0, this.attrs = null, this.breakAfter = 0; }

    merge(e, t, n, s, r, o) { if (n) { if (!(n instanceof pe)) return !1; this.dom || n.transferDOM(this); } return s && this.setDeco(n ? n.attrs : null), uh(this, e, t, n ? n.children : [], r, o), !0; }

    split(e) { const t = new pe(); if (t.breakAfter = this.breakAfter, this.length == 0) return t; let { i: n, off: s } = this.childPos(e); s && (t.append(this.children[n].split(s), 0), this.children[n].merge(s, this.children[n].length, null, !1, 0, 0), n++); for (let r = n; r < this.children.length; r++)t.append(this.children[r], 0); for (;n > 0 && this.children[n - 1].length == 0;) this.children[--n].destroy(); return this.children.length = n, this.markDirty(), this.length = e, t; }

    transferDOM(e) { !this.dom || (e.setDOM(this.dom), e.prevAttrs = this.prevAttrs === void 0 ? this.attrs : this.prevAttrs, this.prevAttrs = void 0, this.dom = null); }

    setDeco(e) { wo(this.attrs, e) || (this.dom && (this.prevAttrs = this.attrs, this.markDirty()), this.attrs = e); }

    append(e, t) { bh(this, e, t); }

    addLineDeco(e) { const t = e.spec.attributes; const n = e.spec.class; t && (this.attrs = Hr(t, this.attrs || {})), n && (this.attrs = Hr({ class: n }, this.attrs || {})); }

    domAtPos(e) { return gh(this.dom, this.children, e); }

    reuseDOM(e) { e.nodeName == 'DIV' && (this.setDOM(e), this.dirty |= 6); }

    sync(e) { let t; this.dom ? this.dirty & 4 && (ch(this.dom), this.dom.className = 'cm-line', this.prevAttrs = this.attrs ? null : void 0) : (this.setDOM(document.createElement('div')), this.dom.className = 'cm-line', this.prevAttrs = this.attrs ? null : void 0), this.prevAttrs !== void 0 && (qr(this.dom, this.prevAttrs, this.attrs), this.dom.classList.add('cm-line'), this.prevAttrs = void 0), super.sync(e); let n = this.dom.lastChild; for (;n && K.get(n) instanceof Fe;)n = n.lastChild; if (!n || !this.length || n.nodeName != 'BR' && ((t = K.get(n)) === null || t === void 0 ? void 0 : t.isEditable) == !1 && (!E.ios || !this.children.some(s => s instanceof nt))) { const s = document.createElement('BR'); s.cmIgnore = !0, this.dom.appendChild(s); } }

    measureTextSize() { if (this.children.length == 0 || this.length > 20) return null; let e = 0; for (const t of this.children) { if (!(t instanceof nt)) return null; const n = nn(t.dom); if (n.length != 1) return null; e += n[0].width; } return { lineHeight: this.dom.getBoundingClientRect().height, charWidth: e / this.length }; }

    coordsAt(e, t) { return yh(this, e, t); }

    become(e) { return !1; }

    get type() { return _.Text; }

    static find(e, t) { for (let n = 0, s = 0; n < e.children.length; n++) { const r = e.children[n]; const o = s + r.length; if (o >= t) { if (r instanceof pe) return r; if (o > t) break; }s = o + r.breakAfter; } return null; }
  }; var ut = class extends K {
    constructor(e, t, n) { super(), this.widget = e, this.length = t, this.type = n, this.breakAfter = 0, this.prevWidget = null; }

    merge(e, t, n, s, r, o) { return n && (!(n instanceof ut) || !this.widget.compare(n.widget) || e > 0 && r <= 0 || t < this.length && o <= 0) ? !1 : (this.length = e + (n ? n.length : 0) + (this.length - t), !0); }

    domAtPos(e) { return e == 0 ? ce.before(this.dom) : ce.after(this.dom, e == this.length); }

    split(e) { const t = this.length - e; this.length = e; const n = new ut(this.widget, t, this.type); return n.breakAfter = this.breakAfter, n; }

    get children() { return xo; }

    sync() { (!this.dom || !this.widget.updateDOM(this.dom)) && (this.dom && this.prevWidget && this.prevWidget.destroy(this.dom), this.prevWidget = null, this.setDOM(this.widget.toDOM(this.editorView)), this.dom.contentEditable = 'false'); }

    get overrideDOMText() { return this.parent ? this.parent.view.state.doc.slice(this.posAtStart, this.posAtEnd) : z.empty; }

    domBoundsAround() { return null; }

    become(e) { return e instanceof ut && e.type == this.type && e.widget.constructor == this.widget.constructor ? (e.widget.eq(this.widget) || this.markDirty(!0), this.dom && !this.prevWidget && (this.prevWidget = this.widget), this.widget = e.widget, this.length = e.length, this.breakAfter = e.breakAfter, !0) : !1; }

    ignoreMutation() { return !0; }

    ignoreEvent(e) { return this.widget.ignoreEvent(e); }

    destroy() { super.destroy(), this.dom && this.widget.destroy(this.dom); }
  }; var rn = class {
    constructor(e, t, n, s) { this.doc = e, this.pos = t, this.end = n, this.disallowBlockEffectsFor = s, this.content = [], this.curLine = null, this.breakAtStart = 0, this.pendingBuffer = 0, this.atCursorPos = !0, this.openStart = -1, this.openEnd = -1, this.text = '', this.textOff = 0, this.cursor = e.iter(), this.skip = t; }

    posCovered() { if (this.content.length == 0) return !this.breakAtStart && this.doc.lineAt(this.pos).from != this.pos; const e = this.content[this.content.length - 1]; return !e.breakAfter && !(e instanceof ut && e.type == _.WidgetBefore); }

    getLine() { return this.curLine || (this.content.push(this.curLine = new pe()), this.atCursorPos = !0), this.curLine; }

    flushBuffer(e) { this.pendingBuffer && (this.curLine.append(Hn(new Pt(-1), e), e.length), this.pendingBuffer = 0); }

    addBlockWidget(e) { this.flushBuffer([]), this.curLine = null, this.content.push(e); }

    finish(e) { e ? this.pendingBuffer = 0 : this.flushBuffer([]), this.posCovered() || this.getLine(); }

    buildText(e, t, n) { for (;e > 0;) { if (this.textOff == this.text.length) { const { value: r, lineBreak: o, done: l } = this.cursor.next(this.skip); if (this.skip = 0, l) throw new Error('Ran out of text content when drawing inline views'); if (o) { this.posCovered() || this.getLine(), this.content.length ? this.content[this.content.length - 1].breakAfter = 1 : this.breakAtStart = 1, this.flushBuffer([]), this.curLine = null, e--; continue; } else this.text = r, this.textOff = 0; } const s = Math.min(this.text.length - this.textOff, e, 512); this.flushBuffer(t.slice(0, n)), this.getLine().append(Hn(new nt(this.text.slice(this.textOff, this.textOff + s)), t), n), this.atCursorPos = !0, this.textOff += s, e -= s, n = 0; } }

    span(e, t, n, s) { this.buildText(t - e, n, s), this.pos = t, this.openStart < 0 && (this.openStart = s); }

    point(e, t, n, s, r, o) { if (this.disallowBlockEffectsFor[o] && n instanceof dt) { if (n.block) throw new RangeError('Block decorations may not be specified via plugins'); if (t > this.doc.lineAt(this.pos).to) throw new RangeError('Decorations that replace line breaks may not be specified via plugins'); } const l = t - e; if (n instanceof dt) if (n.block) { const { type: a } = n; a == _.WidgetAfter && !this.posCovered() && this.getLine(), this.addBlockWidget(new ut(n.widget || new Yn('div'), l, a)); } else { const a = tt.create(n.widget || new Yn('span'), l, n.startSide); const h = this.atCursorPos && !a.isEditable && r <= s.length && (e < t || n.startSide > 0); const c = !a.isEditable && (e < t || n.startSide <= 0); const f = this.getLine(); this.pendingBuffer == 2 && !h && (this.pendingBuffer = 0), this.flushBuffer(s), h && (f.append(Hn(new Pt(1), s), r), r = s.length + Math.max(0, r - s.length)), f.append(Hn(a, s), r), this.atCursorPos = c, this.pendingBuffer = c ? e < t ? 1 : 2 : 0; } else this.doc.lineAt(this.pos).from == this.pos && this.getLine().addLineDeco(n); l && (this.textOff + l <= this.text.length ? this.textOff += l : (this.skip += l - (this.text.length - this.textOff), this.text = '', this.textOff = 0), this.pos = t), this.openStart < 0 && (this.openStart = r); }

    static build(e, t, n, s, r) { const o = new rn(e, t, n, r); return o.openEnd = I.spans(s, t, n, o), o.openStart < 0 && (o.openStart = o.openEnd), o.finish(o.openEnd), o; }
  }; function Hn(i, e) { for (const t of e)i = new Fe(t, [i], i.length); return i; } var Yn = class extends Ae {
    constructor(e) { super(), this.tag = e; }

    eq(e) { return e.tag == this.tag; }

    toDOM() { return document.createElement(this.tag); }

    updateDOM(e) { return e.nodeName.toLowerCase() == this.tag; }
  }; const Dd = []; const wh = v.define(); const kh = v.define(); const vh = v.define(); const Oh = v.define(); const _r = v.define(); const Sh = v.define(); const Ch = v.define({ combine: i => i.some(e => e) }); var mi = class {
    constructor(e, t = 'nearest', n = 'nearest', s = 5, r = 5) { this.range = e, this.y = t, this.x = n, this.yMargin = s, this.xMargin = r; }

    map(e) { return e.empty ? this : new mi(this.range.map(e), this.y, this.x, this.yMargin, this.xMargin); }
  }; const Ma = M.define({ map: (i, e) => i.map(e) }); function ge(i, e, t) { const n = i.facet(Oh); n.length ? n[0](e) : window.onerror ? window.onerror(String(e), t, void 0, void 0, e) : t ? console.error(`${t}:`, e) : console.error(e); } const hn = v.define({ combine: i => (i.length ? i[0] : !0) }); let Ld = 0; const ji = v.define(); var q = class {
    constructor(e, t, n, s) { this.id = e, this.create = t, this.domEventHandlers = n, this.extension = s(this); }

    static define(e, t) { const { eventHandlers: n, provide: s, decorations: r } = t || {}; return new q(Ld++, e, n, (o) => { const l = [ji.of(o)]; return r && l.push(on.of((a) => { const h = a.plugin(o); return h ? r(h) : A.none; })), s && l.push(s(o)), l; }); }

    static fromClass(e, t) { return q.define(n => new e(n), t); }
  }; const Ji = class {
    constructor(e) { this.spec = e, this.mustUpdate = null, this.value = null; }

    update(e) { if (this.value) { if (this.mustUpdate) { const t = this.mustUpdate; if (this.mustUpdate = null, this.value.update) try { this.value.update(t); } catch (n) { if (ge(t.state, n, 'CodeMirror plugin crashed'), this.value.destroy) try { this.value.destroy(); } catch {} this.deactivate(); } } } else if (this.spec) try { this.value = this.spec.create(e); } catch (t) { ge(e.state, t, 'CodeMirror plugin crashed'), this.deactivate(); } return this; }

    destroy(e) { let t; if (!((t = this.value) === null || t === void 0) && t.destroy) try { this.value.destroy(); } catch (n) { ge(e.state, n, 'CodeMirror plugin crashed'); } }

    deactivate() { this.spec = this.value = null; }
  }; const Ah = v.define(); const Th = v.define(); var on = v.define(); const Ph = v.define(); const Mh = v.define(); const Gi = v.define(); var Ge = class {
    constructor(e, t, n, s) { this.fromA = e, this.toA = t, this.fromB = n, this.toB = s; }

    join(e) { return new Ge(Math.min(this.fromA, e.fromA), Math.max(this.toA, e.toA), Math.min(this.fromB, e.fromB), Math.max(this.toB, e.toB)); }

    addToSet(e) { let t = e.length; let n = this; for (;t > 0; t--) { const s = e[t - 1]; if (!(s.fromA > n.toA)) { if (s.toA < n.fromA) break; n = n.join(s), e.splice(t - 1, 1); } } return e.splice(t, 0, n), e; }

    static extendWithRanges(e, t) { if (t.length == 0) return e; const n = []; for (let s = 0, r = 0, o = 0, l = 0; ;s++) { const a = s == e.length ? null : e[s]; const h = o - l; const c = a ? a.fromB : 1e9; for (;r < t.length && t[r] < c;) { const f = t[r]; const u = t[r + 1]; const d = Math.max(l, f); const p = Math.min(c, u); if (d <= p && new Ge(d + h, p + h, d, p).addToSet(n), u > c) break; r += 2; } if (!a) return n; new Ge(a.fromA, a.toA, a.fromB, a.toB).addToSet(n), o = a.toA, l = a.toB; } }
  }; const es = class {
    constructor(e, t, n = Dd) { this.view = e, this.state = t, this.transactions = n, this.flags = 0, this.startState = e.state, this.changes = ie.empty(this.startState.doc.length); for (const o of n) this.changes = this.changes.compose(o.changes); const s = []; this.changes.iterChangedRanges((o, l, a, h) => s.push(new Ge(o, l, a, h))), this.changedRanges = s; const r = e.hasFocus; r != e.inputState.notifiedFocused && (e.inputState.notifiedFocused = r, this.flags |= 1); }

    get viewportChanged() { return (this.flags & 4) > 0; }

    get heightChanged() { return (this.flags & 2) > 0; }

    get geometryChanged() { return this.docChanged || (this.flags & 10) > 0; }

    get focusChanged() { return (this.flags & 1) > 0; }

    get docChanged() { return !this.changes.empty; }

    get selectionSet() { return this.transactions.some(e => e.selection); }

    get empty() { return this.flags == 0 && this.transactions.length == 0; }
  }; var G = (function (i) { return i[i.LTR = 0] = 'LTR', i[i.RTL = 1] = 'RTL', i; }(G || (G = {}))); const jr = G.LTR; const Rd = G.RTL; function Eh(i) { const e = []; for (let t = 0; t < i.length; t++)e.push(1 << +i[t]); return e; } const Bd = Eh('88888888888888888888888888888888888666888888787833333333337888888000000000000000000000000008888880000000000000000000000000088888888888888888888888888888888888887866668888088888663380888308888800000000000000000000000800000000000000000000000000000008'); const Nd = Eh('4444448826627288999999999992222222222222222222222222222222222222222222222229999999999999999999994444444444644222822222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222999999949999999229989999223333333333'); const Gr = Object.create(null); const et = []; for (const i of ['()', '[]', '{}']) { const e = i.charCodeAt(0); const t = i.charCodeAt(1); Gr[e] = t, Gr[t] = -e; } function $d(i) { return i <= 247 ? Bd[i] : i >= 1424 && i <= 1524 ? 2 : i >= 1536 && i <= 1785 ? Nd[i - 1536] : i >= 1774 && i <= 2220 ? 4 : i >= 8192 && i <= 8203 || i == 8204 ? 256 : 1; } const Id = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/; const Tt = class {
    constructor(e, t, n) { this.from = e, this.to = t, this.level = n; }

    get dir() { return this.level % 2 ? Rd : jr; }

    side(e, t) { return this.dir == t == e ? this.to : this.from; }

    static find(e, t, n, s) { let r = -1; for (let o = 0; o < e.length; o++) { const l = e[o]; if (l.from <= t && l.to >= t) { if (l.level == n) return o; (r < 0 || (s != 0 ? s < 0 ? l.from < t : l.to > t : e[r].level > l.level)) && (r = o); } } if (r < 0) throw new RangeError('Index out of range'); return r; }
  }; const ee = []; function Fd(i, e) { const t = i.length; const n = e == jr ? 1 : 2; const s = e == jr ? 2 : 1; if (!i || n == 1 && !Id.test(i)) return Dh(t); for (let o = 0, l = n, a = n; o < t; o++) { let h = $d(i.charCodeAt(o)); h == 512 ? h = l : h == 8 && a == 4 && (h = 16), ee[o] = h == 4 ? 2 : h, h & 7 && (a = h), l = h; } for (let o = 0, l = n, a = n; o < t; o++) { let h = ee[o]; if (h == 128)o < t - 1 && l == ee[o + 1] && l & 24 ? h = ee[o] = l : ee[o] = 256; else if (h == 64) { let c = o + 1; for (;c < t && ee[c] == 64;)c++; const f = o && l == 8 || c < t && ee[c] == 8 ? a == 1 ? 1 : 8 : 256; for (let u = o; u < c; u++)ee[u] = f; o = c - 1; } else h == 8 && a == 1 && (ee[o] = 1); l = h, h & 7 && (a = h); } for (let o = 0, l = 0, a = 0, h, c, f; o < t; o++) if (c = Gr[h = i.charCodeAt(o)]) if (c < 0) { for (let u = l - 3; u >= 0; u -= 3) if (et[u + 1] == -c) { const d = et[u + 2]; const p = d & 2 ? n : d & 4 ? d & 1 ? s : n : 0; p && (ee[o] = ee[et[u]] = p), l = u; break; } } else { if (et.length == 189) break; et[l++] = o, et[l++] = h, et[l++] = a; } else if ((f = ee[o]) == 2 || f == 1) { const u = f == n; a = u ? 0 : 1; for (let d = l - 3; d >= 0; d -= 3) { const p = et[d + 2]; if (p & 2) break; if (u)et[d + 2] |= 2; else { if (p & 4) break; et[d + 2] |= 4; } } } for (let o = 0; o < t; o++) if (ee[o] == 256) { let l = o + 1; for (;l < t && ee[l] == 256;)l++; const a = (o ? ee[o - 1] : n) == 1; const h = (l < t ? ee[l] : n) == 1; const c = a == h ? a ? 1 : 2 : n; for (let f = o; f < l; f++)ee[f] = c; o = l - 1; } const r = []; if (n == 1) for (let o = 0; o < t;) { const l = o; const a = ee[o++] != 1; for (;o < t && a == (ee[o] != 1);)o++; if (a) for (let h = o; h > l;) { const c = h; const f = ee[--h] != 2; for (;h > l && f == (ee[h - 1] != 2);)h--; r.push(new Tt(h, c, f ? 2 : 1)); } else r.push(new Tt(l, o, 0)); } else for (let o = 0; o < t;) { const l = o; const a = ee[o++] == 2; for (;o < t && a == (ee[o] == 2);)o++; r.push(new Tt(l, o, a ? 1 : 2)); } return r; } function Dh(i) { return [new Tt(0, i, 0)]; } let Lh = ''; function zd(i, e, t, n, s) { let r; let o = n.head - i.from; let l = -1; if (o == 0) { if (!s || !i.length) return null; e[0].level != t && (o = e[0].side(!1, t), l = 0); } else if (o == i.length) { if (s) return null; const u = e[e.length - 1]; u.level != t && (o = u.side(!0, t), l = e.length - 1); }l < 0 && (l = Tt.find(e, o, (r = n.bidiLevel) !== null && r !== void 0 ? r : -1, n.assoc)); let a = e[l]; o == a.side(s, t) && (a = e[l += s ? 1 : -1], o = a.side(!s, t)); const h = s == (a.dir == t); const c = ve(i.text, o, h); if (Lh = i.text.slice(Math.min(o, c), Math.max(o, c)), c != a.side(s, t)) return m.cursor(c + i.from, h ? -1 : 1, a.level); const f = l == (s ? e.length - 1 : 0) ? null : e[l + (s ? 1 : -1)]; return !f && a.level != t ? m.cursor(s ? i.to : i.from, s ? -1 : 1, t) : f && f.level < a.level ? m.cursor(f.side(!s, t) + i.from, s ? 1 : -1, f.level) : m.cursor(c + i.from, s ? -1 : 1, a.level); } const At = '\uFFFF'; const ts = class {
    constructor(e, t) { this.points = e, this.text = '', this.lineSeparator = t.facet($.lineSeparator); }

    append(e) { this.text += e; }

    lineBreak() { this.text += At; }

    readRange(e, t) { if (!e) return this; const n = e.parentNode; for (let s = e; ;) { this.findPointBefore(n, s), this.readNode(s); const r = s.nextSibling; if (r == t) break; const o = K.get(s); const l = K.get(r); (o && l ? o.breakAfter : (o ? o.breakAfter : Ea(s)) || Ea(r) && (s.nodeName != 'BR' || s.cmIgnore)) && this.lineBreak(), s = r; } return this.findPointBefore(n, t), this; }

    readTextNode(e) { const t = e.nodeValue; for (const n of this.points)n.node == e && (n.pos = this.text.length + Math.min(n.offset, t.length)); for (let n = 0, s = this.lineSeparator ? null : /\r\n?|\n/g; ;) { let r = -1; let o = 1; let l; if (this.lineSeparator ? (r = t.indexOf(this.lineSeparator, n), o = this.lineSeparator.length) : (l = s.exec(t)) && (r = l.index, o = l[0].length), this.append(t.slice(n, r < 0 ? t.length : r)), r < 0) break; if (this.lineBreak(), o > 1) for (const a of this.points)a.node == e && a.pos > this.text.length && (a.pos -= o - 1); n = r + o; } }

    readNode(e) { if (e.cmIgnore) return; const t = K.get(e); const n = t && t.overrideDOMText; if (n != null) { this.findPointInside(e, n.length); for (let s = n.iter(); !s.next().done;)s.lineBreak ? this.lineBreak() : this.append(s.value); } else e.nodeType == 3 ? this.readTextNode(e) : e.nodeName == 'BR' ? e.nextSibling && this.lineBreak() : e.nodeType == 1 && this.readRange(e.firstChild, null); }

    findPointBefore(e, t) { for (const n of this.points)n.node == e && e.childNodes[n.offset] == t && (n.pos = this.text.length); }

    findPointInside(e, t) { for (const n of this.points)(e.nodeType == 3 ? n.node == e : e.contains(n.node)) && (n.pos = this.text.length + Math.min(t, n.offset)); }
  }; function Ea(i) { return i.nodeType == 1 && /^(DIV|P|LI|UL|OL|BLOCKQUOTE|DD|DT|H\d|SECTION|PRE)$/.test(i.nodeName); } const is = class {constructor(e, t) { this.node = e, this.offset = t, this.pos = -1; }}; const ns = class extends K {
    constructor(e) { super(), this.view = e, this.compositionDeco = A.none, this.decorations = [], this.dynamicDecorationMap = [], this.minWidth = 0, this.minWidthFrom = 0, this.minWidthTo = 0, this.impreciseAnchor = null, this.impreciseHead = null, this.forceSelection = !1, this.lastUpdate = Date.now(), this.setDOM(e.contentDOM), this.children = [new pe()], this.children[0].setParent(this), this.updateDeco(), this.updateInner([new Ge(0, 0, 0, e.state.doc.length)], 0); }

    get root() { return this.view.root; }

    get editorView() { return this.view; }

    get length() { return this.view.state.doc.length; }

    update(e) { let t = e.changedRanges; this.minWidth > 0 && t.length && (t.every(({ fromA: o, toA: l }) => l < this.minWidthFrom || o > this.minWidthTo) ? (this.minWidthFrom = e.changes.mapPos(this.minWidthFrom, 1), this.minWidthTo = e.changes.mapPos(this.minWidthTo, 1)) : this.minWidth = this.minWidthFrom = this.minWidthTo = 0), this.view.inputState.composing < 0 ? this.compositionDeco = A.none : (e.transactions.length || this.dirty) && (this.compositionDeco = Wd(this.view, e.changes)), (E.ie || E.chrome) && !this.compositionDeco.size && e && e.state.doc.lines != e.startState.doc.lines && (this.forceSelection = !0); const n = this.decorations; const s = this.updateDeco(); const r = qd(n, s, e.changes); return t = Ge.extendWithRanges(t, r), this.dirty == 0 && t.length == 0 ? !1 : (this.updateInner(t, e.startState.doc.length), e.transactions.length && (this.lastUpdate = Date.now()), !0); }

    updateInner(e, t) { this.view.viewState.mustMeasureContent = !0, this.updateChildren(e, t); const { observer: n } = this.view; n.ignore(() => { this.dom.style.height = `${this.view.viewState.contentHeight}px`, this.dom.style.minWidth = this.minWidth ? `${this.minWidth}px` : ''; const r = E.chrome || E.ios ? { node: n.selectionRange.focusNode, written: !1 } : void 0; this.sync(r), this.dirty = 0, r && (r.written || n.selectionRange.focusNode != r.node) && (this.forceSelection = !0), this.dom.style.height = ''; }); const s = []; if (this.view.viewport.from || this.view.viewport.to < this.view.state.doc.length) for (const r of this.children)r instanceof ut && r.widget instanceof ss && s.push(r.dom); n.updateGaps(s); }

    updateChildren(e, t) {
      const n = this.childCursor(t); for (let s = e.length - 1; ;s--) {
        const r = s >= 0 ? e[s] : null; if (!r) break; const {
          fromA: o, toA: l, fromB: a, toB: h,
        } = r; const {
          content: c, breakAtStart: f, openStart: u, openEnd: d,
        } = rn.build(this.view.state.doc, a, h, this.decorations, this.dynamicDecorationMap); const { i: p, off: g } = n.findPos(l, 1); const { i: b, off: y } = n.findPos(o, -1); fh(this, b, y, p, g, c, f, u, d);
      }
    }

    updateSelection(e = !1, t = !1) { if (e && this.view.observer.readSelectionRange(), !(t || this.mayControlSelection()) || E.ios && this.view.inputState.rapidCompositionStart) return; let n = this.forceSelection; this.forceSelection = !1; const s = this.view.state.selection.main; let r = this.domAtPos(s.anchor); let o = s.empty ? r : this.domAtPos(s.head); if (E.gecko && s.empty && Vd(r)) { const a = document.createTextNode(''); this.view.observer.ignore(() => r.node.insertBefore(a, r.node.childNodes[r.offset] || null)), r = o = new ce(a, 0), n = !0; } const l = this.view.observer.selectionRange; (n || !l.focusNode || !Qn(r.node, r.offset, l.anchorNode, l.anchorOffset) || !Qn(o.node, o.offset, l.focusNode, l.focusOffset)) && (this.view.observer.ignore(() => { E.android && E.chrome && this.dom.contains(l.focusNode) && Ud(l.focusNode, this.dom) && (this.dom.blur(), this.dom.focus({ preventScroll: !0 })); const a = Zn(this.root); if (s.empty) { if (E.gecko) { const h = Hd(r.node, r.offset); if (h && h != 3) { const c = Bh(r.node, r.offset, h == 1 ? 1 : -1); c && (r = new ce(c, h == 1 ? 0 : c.nodeValue.length)); } }a.collapse(r.node, r.offset), s.bidiLevel != null && l.cursorBidiLevel != null && (l.cursorBidiLevel = s.bidiLevel); } else if (a.extend)a.collapse(r.node, r.offset), a.extend(o.node, o.offset); else { const h = document.createRange(); s.anchor > s.head && ([r, o] = [o, r]), h.setEnd(o.node, o.offset), h.setStart(r.node, r.offset), a.removeAllRanges(), a.addRange(h); } }), this.view.observer.setSelectionRange(r, o)), this.impreciseAnchor = r.precise ? null : new ce(l.anchorNode, l.anchorOffset), this.impreciseHead = o.precise ? null : new ce(l.focusNode, l.focusOffset); }

    enforceCursorAssoc() { if (this.compositionDeco.size) return; const e = this.view.state.selection.main; const t = Zn(this.root); if (!e.empty || !e.assoc || !t.modify) return; const n = pe.find(this, e.head); if (!n) return; const s = n.posAtStart; if (e.head == s || e.head == s + n.length) return; const r = this.coordsAt(e.head, -1); const o = this.coordsAt(e.head, 1); if (!r || !o || r.bottom > o.top) return; const l = this.domAtPos(e.head + e.assoc); t.collapse(l.node, l.offset), t.modify('move', e.assoc < 0 ? 'forward' : 'backward', 'lineboundary'); }

    mayControlSelection() { return this.view.state.facet(hn) ? this.root.activeElement == this.dom : Br(this.dom, this.view.observer.selectionRange); }

    nearest(e) { for (let t = e; t;) { const n = K.get(t); if (n && n.rootView == this) return n; t = t.parentNode; } return null; }

    posFromDOM(e, t) { const n = this.nearest(e); if (!n) throw new RangeError('Trying to find position for a DOM position outside of the document'); return n.localPosFromDOM(e, t) + n.posAtStart; }

    domAtPos(e) { let { i: t, off: n } = this.childCursor().findPos(e, -1); for (;t < this.children.length - 1;) { const s = this.children[t]; if (n < s.length || s instanceof pe) break; t++, n = 0; } return this.children[t].domAtPos(n); }

    coordsAt(e, t) { for (let n = this.length, s = this.children.length - 1; ;s--) { const r = this.children[s]; const o = n - r.breakAfter - r.length; if (e > o || e == o && r.type != _.WidgetBefore && r.type != _.WidgetAfter && (!s || t == 2 || this.children[s - 1].breakAfter || this.children[s - 1].type == _.WidgetBefore && t > -2)) return r.coordsAt(e - o, t); n = o; } }

    measureVisibleLineHeights(e) { const t = []; const { from: n, to: s } = e; const r = this.view.contentDOM.clientWidth; const o = r > Math.max(this.view.scrollDOM.clientWidth, this.minWidth) + 1; let l = -1; const a = this.view.textDirection == G.LTR; for (let h = 0, c = 0; c < this.children.length; c++) { const f = this.children[c]; const u = h + f.length; if (u > s) break; if (h >= n) { const d = f.dom.getBoundingClientRect(); if (t.push(d.height), o) { const p = f.dom.lastChild; const g = p ? nn(p) : []; if (g.length) { const b = g[g.length - 1]; const y = a ? b.right - d.left : d.right - b.left; y > l && (l = y, this.minWidth = r, this.minWidthFrom = h, this.minWidthTo = u); } } }h = u + f.breakAfter; } return t; }

    textDirectionAt(e) { const { i: t } = this.childPos(e, 1); return getComputedStyle(this.children[t].dom).direction == 'rtl' ? G.RTL : G.LTR; }

    measureTextSize() { for (const s of this.children) if (s instanceof pe) { const r = s.measureTextSize(); if (r) return r; } const e = document.createElement('div'); let t; let n; return e.className = 'cm-line', e.textContent = 'abc def ghi jkl mno pqr stu', this.view.observer.ignore(() => { this.dom.appendChild(e); const s = nn(e.firstChild)[0]; t = e.getBoundingClientRect().height, n = s ? s.width / 27 : 7, e.remove(); }), { lineHeight: t, charWidth: n }; }

    childCursor(e = this.length) { let t = this.children.length; return t && (e -= this.children[--t].length), new Kn(this.children, e, t); }

    computeBlockGapDeco() {
      const e = []; const t = this.view.viewState; for (let n = 0, s = 0; ;s++) {
        const r = s == t.viewports.length ? null : t.viewports[s]; const o = r ? r.from - 1 : this.length; if (o > n) {
          const l = t.lineBlockAt(o).bottom - t.lineBlockAt(n).top; e.push(A.replace({
            widget: new ss(l), block: !0, inclusive: !0, isBlockGap: !0,
          }).range(n, o));
        } if (!r) break; n = r.to + 1;
      } return A.set(e);
    }

    updateDeco() { const e = this.view.state.facet(on).map((t, n) => ((this.dynamicDecorationMap[n] = typeof t === 'function') ? t(this.view) : t)); for (let t = e.length; t < e.length + 3; t++) this.dynamicDecorationMap[t] = !1; return this.decorations = [...e, this.compositionDeco, this.computeBlockGapDeco(), this.view.viewState.lineGapDeco]; }

    scrollIntoView(e) {
      const { range: t } = e; let n = this.coordsAt(t.head, t.empty ? t.assoc : t.head > t.anchor ? -1 : 1); let s; if (!n) return; !t.empty && (s = this.coordsAt(t.anchor, t.anchor > t.head ? -1 : 1)) && (n = {
        left: Math.min(n.left, s.left), top: Math.min(n.top, s.top), right: Math.max(n.right, s.right), bottom: Math.max(n.bottom, s.bottom),
      }); let r = 0; let o = 0; let l = 0; let a = 0; for (const c of this.view.state.facet(Mh).map(f => f(this.view))) {
        if (c) {
          const {
            left: f, right: u, top: d, bottom: p,
          } = c; f != null && (r = Math.max(r, f)), u != null && (o = Math.max(o, u)), d != null && (l = Math.max(l, d)), p != null && (a = Math.max(a, p));
        }
      } const h = {
        left: n.left - r, top: n.top - l, right: n.right + o, bottom: n.bottom + a,
      }; Ad(this.view.scrollDOM, h, t.head < t.anchor ? -1 : 1, e.x, e.y, e.xMargin, e.yMargin, this.view.textDirection == G.LTR);
    }
  }; function Vd(i) { return i.node.nodeType == 1 && i.node.firstChild && (i.offset == 0 || i.node.childNodes[i.offset - 1].contentEditable == 'false') && (i.offset == i.node.childNodes.length || i.node.childNodes[i.offset].contentEditable == 'false'); } var ss = class extends Ae {
    constructor(e) { super(), this.height = e; }

    toDOM() { const e = document.createElement('div'); return this.updateDOM(e), e; }

    eq(e) { return e.height == this.height; }

    updateDOM(e) { return e.style.height = `${this.height}px`, !0; }

    get estimatedHeight() { return this.height; }
  }; function Rh(i) {
    const e = i.observer.selectionRange; const t = e.focusNode && Bh(e.focusNode, e.focusOffset, 0); if (!t) return null; let n = i.docView.nearest(t); if (!n) return null; if (n instanceof pe) {
      let s = t; for (;s.parentNode != n.dom;)s = s.parentNode; let r = s.previousSibling; for (;r && !K.get(r);)r = r.previousSibling; const o = r ? K.get(r).posAtEnd : n.posAtStart; return {
        from: o, to: o, node: s, text: t,
      };
    } for (;;) { const { parent: r } = n; if (!r) return null; if (r instanceof pe) break; n = r; } const s = n.posAtStart; return {
      from: s, to: s + n.length, node: n.dom, text: t,
    };
  } function Wd(i, e) {
    const t = Rh(i); if (!t) return A.none; const {
      from: n, to: s, node: r, text: o,
    } = t; let l = e.mapPos(n, 1); let a = Math.max(l, e.mapPos(s, -1)); const { state: h } = i; const c = r.nodeType == 3 ? r.nodeValue : new ts([], h).readRange(r.firstChild, null).text; if (a - l < c.length) if (h.doc.sliceString(l, Math.min(h.doc.length, l + c.length), At) == c)a = l + c.length; else if (h.doc.sliceString(Math.max(0, a - c.length), a, At) == c)l = a - c.length; else return A.none; else if (h.doc.sliceString(l, a, At) != c) return A.none; let f = K.get(r); return f instanceof Jn ? f = f.widget.topView : f && (f.parent = null), A.set(A.replace({ widget: new Zr(r, o, f) }).range(l, a));
  } var Zr = class extends Ae {
    constructor(e, t, n) { super(), this.top = e, this.text = t, this.topView = n; }

    eq(e) { return this.top == e.top && this.text == e.text; }

    toDOM() { return this.top; }

    ignoreEvent() { return !1; }

    get customView() { return Jn; }
  }; function Bh(i, e, t) { for (;;) { if (i.nodeType == 3) return i; if (i.nodeType == 1 && e > 0 && t <= 0)i = i.childNodes[e - 1], e = Xn(i); else if (i.nodeType == 1 && e < i.childNodes.length && t >= 0)i = i.childNodes[e], e = 0; else return null; } } function Hd(i, e) { return i.nodeType != 1 ? 0 : (e && i.childNodes[e - 1].contentEditable == 'false' ? 1 : 0) | (e < i.childNodes.length && i.childNodes[e].contentEditable == 'false' ? 2 : 0); } const Qr = class {
    constructor() { this.changes = []; }

    compareRange(e, t) { Ur(e, t, this.changes); }

    comparePoint(e, t) { Ur(e, t, this.changes); }
  }; function qd(i, e, t) { const n = new Qr(); return I.compare(i, e, t, n), n.changes; } function Ud(i, e) { for (let t = i; t && t != e; t = t.assignedSlot || t.parentNode) if (t.nodeType == 1 && t.contentEditable == 'false') return !0; return !1; } function _d(i, e, t = 1) { const n = i.charCategorizer(e); const s = i.doc.lineAt(e); const r = e - s.from; if (s.length == 0) return m.cursor(e); r == 0 ? t = 1 : r == s.length && (t = -1); let o = r; let l = r; t < 0 ? o = ve(s.text, r, !1) : l = ve(s.text, r); const a = n(s.text.slice(o, l)); for (;o > 0;) { const h = ve(s.text, o, !1); if (n(s.text.slice(h, o)) != a) break; o = h; } for (;l < s.length;) { const h = ve(s.text, l); if (n(s.text.slice(l, h)) != a) break; l = h; } return m.range(o + s.from, l + s.from); } function jd(i, e) { return e.left > i ? e.left - i : Math.max(0, i - e.right); } function Gd(i, e) { return e.top > i ? e.top - i : Math.max(0, i - e.bottom); } function Ar(i, e) { return i.top < e.bottom - 1 && i.bottom > e.top + 1; } function Da(i, e) {
    return e < i.top ? {
      top: e, left: i.left, right: i.right, bottom: i.bottom,
    } : i;
  } function La(i, e) {
    return e > i.bottom ? {
      top: i.top, left: i.left, right: i.right, bottom: e,
    } : i;
  } function Xr(i, e, t) { let n; let s; let r; let o; let l; let a; let h; let c; for (let d = i.firstChild; d; d = d.nextSibling) { const p = nn(d); for (let g = 0; g < p.length; g++) { let b = p[g]; s && Ar(s, b) && (b = Da(La(b, s.bottom), s.top)); const y = jd(e, b); const S = Gd(t, b); if (y == 0 && S == 0) return d.nodeType == 3 ? Ra(d, e, t) : Xr(d, e, t); (!n || o > S || o == S && r > y) && (n = d, s = b, r = y, o = S), y == 0 ? t > b.bottom && (!h || h.bottom < b.bottom) ? (l = d, h = b) : t < b.top && (!c || c.top > b.top) && (a = d, c = b) : h && Ar(h, b) ? h = La(h, b.bottom) : c && Ar(c, b) && (c = Da(c, b.top)); } } if (h && h.bottom >= t ? (n = l, s = h) : c && c.top <= t && (n = a, s = c), !n) return { node: i, offset: 0 }; const f = Math.max(s.left, Math.min(s.right, e)); if (n.nodeType == 3) return Ra(n, f, t); if (!r && n.contentEditable == 'true') return Xr(n, f, t); const u = Array.prototype.indexOf.call(i.childNodes, n) + (e >= (s.left + s.right) / 2 ? 1 : 0); return { node: i, offset: u }; } function Ra(i, e, t) { const n = i.nodeValue.length; let s = -1; let r = 1e9; let o = 0; for (let l = 0; l < n; l++) { const a = sn(i, l, l + 1).getClientRects(); for (let h = 0; h < a.length; h++) { const c = a[h]; if (c.top == c.bottom) continue; o || (o = e - c.left); const f = (c.top > t ? c.top - t : t - c.bottom) - 1; if (c.left - 1 <= e && c.right + 1 >= e && f < r) { const u = e >= (c.left + c.right) / 2; let d = u; if ((E.chrome || E.gecko) && sn(i, l).getBoundingClientRect().left == c.right && (d = !u), f <= 0) return { node: i, offset: l + (d ? 1 : 0) }; s = l + (d ? 1 : 0), r = f; } } } return { node: i, offset: s > -1 ? s : o > 0 ? i.nodeValue.length : 0 }; } function Nh(i, { x: e, y: t }, n, s = -1) { let r; const o = i.contentDOM.getBoundingClientRect(); const l = o.top + i.viewState.paddingTop; let a; const { docHeight: h } = i.viewState; let c = t - l; if (c < 0) return 0; if (c > h) return i.state.doc.length; for (let y = i.defaultLineHeight / 2, S = !1; a = i.elementAtHeight(c), a.type != _.Text;) for (;c = s > 0 ? a.bottom + y : a.top - y, !(c >= 0 && c <= h);) { if (S) return n ? null : 0; S = !0, s = -s; }t = l + c; const f = a.from; if (f < i.viewport.from) return i.viewport.from == 0 ? 0 : n ? null : Ba(i, o, a, e, t); if (f > i.viewport.to) return i.viewport.to == i.state.doc.length ? i.state.doc.length : n ? null : Ba(i, o, a, e, t); const u = i.dom.ownerDocument; const d = i.root.elementFromPoint ? i.root : u; let p = d.elementFromPoint(e, t); p && !i.contentDOM.contains(p) && (p = null), p || (e = Math.max(o.left + 1, Math.min(o.right - 1, e)), p = d.elementFromPoint(e, t), p && !i.contentDOM.contains(p) && (p = null)); let g; let b = -1; if (p && ((r = i.docView.nearest(p)) === null || r === void 0 ? void 0 : r.isEditable) != !1) { if (u.caretPositionFromPoint) { const y = u.caretPositionFromPoint(e, t); y && ({ offsetNode: g, offset: b } = y); } else if (u.caretRangeFromPoint) { const y = u.caretRangeFromPoint(e, t); y && ({ startContainer: g, startOffset: b } = y, E.safari && Zd(g, b, e) && (g = void 0)); } } if (!g || !i.docView.dom.contains(g)) { const y = pe.find(i.docView, f); if (!y) return c > a.top + a.height / 2 ? a.to : a.from; ({ node: g, offset: b } = Xr(y.dom, e, t)); } return i.docView.posFromDOM(g, b); } function Ba(i, e, t, n, s) { let r = Math.round((n - e.left) * i.defaultCharacterWidth); i.lineWrapping && t.height > i.defaultLineHeight * 1.5 && (r += Math.floor((s - t.top) / i.defaultLineHeight) * i.viewState.heightOracle.lineLength); const o = i.state.sliceDoc(t.from, t.to); return t.from + Fn(o, r, i.state.tabSize); } function Zd(i, e, t) { let n; if (i.nodeType != 3 || e != (n = i.nodeValue.length)) return !1; for (let s = i.nextSibling; s; s = s.nextSibling) if (s.nodeType != 1 || s.nodeName != 'BR') return !1; return sn(i, n - 1, n).getBoundingClientRect().left > t; } function Qd(i, e, t, n) { const s = i.state.doc.lineAt(e.head); const r = !n || !i.lineWrapping ? null : i.coordsAtPos(e.assoc < 0 && e.head > s.from ? e.head - 1 : e.head); if (r) { const a = i.dom.getBoundingClientRect(); const h = i.textDirectionAt(s.from); const c = i.posAtCoords({ x: t == (h == G.LTR) ? a.right - 1 : a.left + 1, y: (r.top + r.bottom) / 2 }); if (c != null) return m.cursor(c, t ? -1 : 1); } const o = pe.find(i.docView, e.head); const l = o ? t ? o.posAtEnd : o.posAtStart : t ? s.to : s.from; return m.cursor(l, t ? -1 : 1); } function Na(i, e, t, n) {
    let s = i.state.doc.lineAt(e.head); let r = i.bidiSpans(s); const o = i.textDirectionAt(s.from); for (let l = e, a = null; ;) {
      let h = zd(s, r, o, l, t); let c = Lh; if (!h) {
        if (s.number == (t ? i.state.doc.lines : 1)) return l; c = `
`, s = i.state.doc.line(s.number + (t ? 1 : -1)), r = i.bidiSpans(s), h = m.cursor(t ? s.from : s.to);
      } if (a) { if (!a(c)) return l; } else { if (!n) return h; a = n(c); }l = h;
    }
  } function Xd(i, e, t) { const n = i.state.charCategorizer(e); let s = n(t); return (r) => { const o = n(r); return s == le.Space && (s = o), s == o; }; } function Kd(i, e, t, n) { const s = e.head; const r = t ? 1 : -1; if (s == (t ? i.state.doc.length : 0)) return m.cursor(s, e.assoc); let o = e.goalColumn; let l; const a = i.contentDOM.getBoundingClientRect(); const h = i.coordsAtPos(s); const c = i.documentTop; if (h)o == null && (o = h.left - a.left), l = r < 0 ? h.top : h.bottom; else { const d = i.viewState.lineBlockAt(s); o == null && (o = Math.min(a.right - a.left, i.defaultCharacterWidth * (s - d.from))), l = (r < 0 ? d.top : d.bottom) + c; } const f = a.left + o; const u = n ?? i.defaultLineHeight >> 1; for (let d = 0; ;d += 10) { const p = l + (u + d) * r; const g = Nh(i, { x: f, y: p }, !1, r); if (p < a.top || p > a.bottom || (r < 0 ? g < s : g > s)) return m.cursor(g, e.assoc, void 0, o); } } function Tr(i, e, t) { const n = i.state.facet(Ph).map(s => s(i)); for (;;) { let s = !1; for (const r of n)r.between(t.from - 1, t.from + 1, (o, l, a) => { t.from > o && t.from < l && (t = e.from > t.from ? m.cursor(o, 1) : m.cursor(l, -1), s = !0); }); if (!s) return t; } } const Kr = class {
    constructor(e) { this.lastKeyCode = 0, this.lastKeyTime = 0, this.pendingIOSKey = void 0, this.lastSelectionOrigin = null, this.lastSelectionTime = 0, this.lastEscPress = 0, this.lastContextMenu = 0, this.scrollHandlers = [], this.registeredEvents = [], this.customHandlers = [], this.composing = -1, this.compositionFirstChange = null, this.compositionEndedAt = 0, this.rapidCompositionStart = !1, this.mouseSelection = null; for (const t in ue) { const n = ue[t]; e.contentDOM.addEventListener(t, (s) => { !$a(e, s) || this.ignoreDuringComposition(s) || t == 'keydown' && this.keydown(e, s) || (this.mustFlushObserver(s) && e.observer.forceFlush(), this.runCustomHandlers(t, e, s) ? s.preventDefault() : n(e, s)); }), this.registeredEvents.push(t); } this.notifiedFocused = e.hasFocus, E.safari && e.contentDOM.addEventListener('input', () => null); }

    setSelectionOrigin(e) { this.lastSelectionOrigin = e, this.lastSelectionTime = Date.now(); }

    ensureHandlers(e, t) { let n; let s; for (const r of t) if (s = (n = r.update(e).spec) === null || n === void 0 ? void 0 : n.domEventHandlers) { this.customHandlers.push({ plugin: r.value, handlers: s }); for (const o in s) this.registeredEvents.indexOf(o) < 0 && o != 'scroll' && (this.registeredEvents.push(o), e.contentDOM.addEventListener(o, (l) => { !$a(e, l) || this.runCustomHandlers(o, e, l) && l.preventDefault(); })); } }

    runCustomHandlers(e, t, n) { for (const s of this.customHandlers) { const r = s.handlers[e]; if (r) try { if (r.call(s.plugin, n, t) || n.defaultPrevented) return !0; } catch (o) { ge(t.state, o); } } return !1; }

    runScrollHandlers(e, t) { for (const n of this.customHandlers) { const s = n.handlers.scroll; if (s) try { s.call(n.plugin, t, e); } catch (r) { ge(e.state, r); } } }

    keydown(e, t) { if (this.lastKeyCode = t.keyCode, this.lastKeyTime = Date.now(), t.keyCode == 9 && Date.now() < this.lastEscPress + 2e3) return !0; if (E.android && E.chrome && !t.synthetic && (t.keyCode == 13 || t.keyCode == 8)) return e.observer.delayAndroidKey(t.key, t.keyCode), !0; let n; return E.ios && (n = $h.find(s => s.keyCode == t.keyCode)) && !(t.ctrlKey || t.altKey || t.metaKey) && !t.synthetic ? (this.pendingIOSKey = n, setTimeout(() => this.flushIOSKey(e), 250), !0) : !1; }

    flushIOSKey(e) { const t = this.pendingIOSKey; return t ? (this.pendingIOSKey = void 0, Ki(e.contentDOM, t.key, t.keyCode)) : !1; }

    ignoreDuringComposition(e) { return /^key/.test(e.type) ? this.composing > 0 ? !0 : E.safari && Date.now() - this.compositionEndedAt < 100 ? (this.compositionEndedAt = 0, !0) : !1 : !1; }

    mustFlushObserver(e) { return e.type == 'keydown' && e.keyCode != 229 || e.type == 'compositionend' && !E.ios; }

    startMouseSelection(e) { this.mouseSelection && this.mouseSelection.destroy(), this.mouseSelection = e; }

    update(e) { this.mouseSelection && this.mouseSelection.update(e), e.transactions.length && (this.lastKeyCode = this.lastSelectionTime = 0); }

    destroy() { this.mouseSelection && this.mouseSelection.destroy(); }
  }; var $h = [{ key: 'Backspace', keyCode: 8, inputType: 'deleteContentBackward' }, { key: 'Enter', keyCode: 13, inputType: 'insertParagraph' }, { key: 'Delete', keyCode: 46, inputType: 'deleteContentForward' }]; const Ih = [16, 17, 18, 20, 91, 92, 224, 225]; const Jr = class {
    constructor(e, t, n, s) { this.view = e, this.style = n, this.mustSelect = s, this.lastEvent = t; const r = e.contentDOM.ownerDocument; r.addEventListener('mousemove', this.move = this.move.bind(this)), r.addEventListener('mouseup', this.up = this.up.bind(this)), this.extend = t.shiftKey, this.multiple = e.state.facet($.allowMultipleSelections) && Jd(e, t), this.dragMove = Yd(e, t), this.dragging = ep(e, t) && ko(t) == 1 ? null : !1, this.dragging === !1 && (t.preventDefault(), this.select(t)); }

    move(e) { if (e.buttons == 0) return this.destroy(); this.dragging === !1 && this.select(this.lastEvent = e); }

    up(e) { this.dragging == null && this.select(this.lastEvent), this.dragging || e.preventDefault(), this.destroy(); }

    destroy() { const e = this.view.contentDOM.ownerDocument; e.removeEventListener('mousemove', this.move), e.removeEventListener('mouseup', this.up), this.view.inputState.mouseSelection = null; }

    select(e) { const t = this.style.get(e, this.extend, this.multiple); (this.mustSelect || !t.eq(this.view.state.selection) || t.main.assoc != this.view.state.selection.main.assoc) && this.view.dispatch({ selection: t, userEvent: 'select.pointer', scrollIntoView: !0 }), this.mustSelect = !1; }

    update(e) { e.docChanged && this.dragging && (this.dragging = this.dragging.map(e.changes)), this.style.update(e) && setTimeout(() => this.select(this.lastEvent), 20); }
  }; function Jd(i, e) { const t = i.state.facet(wh); return t.length ? t[0](e) : E.mac ? e.metaKey : e.ctrlKey; } function Yd(i, e) { const t = i.state.facet(kh); return t.length ? t[0](e) : E.mac ? !e.altKey : !e.ctrlKey; } function ep(i, e) { const { main: t } = i.state.selection; if (t.empty) return !1; const n = Zn(i.root); if (n.rangeCount == 0) return !0; const s = n.getRangeAt(0).getClientRects(); for (let r = 0; r < s.length; r++) { const o = s[r]; if (o.left <= e.clientX && o.right >= e.clientX && o.top <= e.clientY && o.bottom >= e.clientY) return !0; } return !1; } function $a(i, e) { if (!e.bubbles) return !0; if (e.defaultPrevented) return !1; for (let t = e.target, n; t != i.contentDOM; t = t.parentNode) if (!t || t.nodeType == 11 || (n = K.get(t)) && n.ignoreEvent(e)) return !1; return !0; } var ue = Object.create(null); const Fh = E.ie && E.ie_version < 15 || E.ios && E.webkit_version < 604; function tp(i) { const e = i.dom.parentNode; if (!e) return; const t = e.appendChild(document.createElement('textarea')); t.style.cssText = 'position: fixed; left: -10000px; top: 10px', t.focus(), setTimeout(() => { i.focus(), t.remove(), zh(i, t.value); }, 50); } function zh(i, e) { const { state: t } = i; let n; let s = 1; const r = t.toText(e); const o = r.lines == t.selection.ranges.length; if (Yr != null && t.selection.ranges.every(a => a.empty) && Yr == r.toString()) { let a = -1; n = t.changeByRange((h) => { const c = t.doc.lineAt(h.from); if (c.from == a) return { range: h }; a = c.from; const f = t.toText((o ? r.line(s++).text : e) + t.lineBreak); return { changes: { from: c.from, insert: f }, range: m.cursor(h.from + f.length) }; }); } else o ? n = t.changeByRange((a) => { const h = r.line(s++); return { changes: { from: a.from, to: a.to, insert: h.text }, range: m.cursor(a.from + h.length) }; }) : n = t.replaceSelection(r); i.dispatch(n, { userEvent: 'input.paste', scrollIntoView: !0 }); }ue.keydown = (i, e) => { i.inputState.setSelectionOrigin('select'), e.keyCode == 27 ? i.inputState.lastEscPress = Date.now() : Ih.indexOf(e.keyCode) < 0 && (i.inputState.lastEscPress = 0); }; let Vh = 0; ue.touchstart = (i, e) => { Vh = Date.now(), i.inputState.setSelectionOrigin('select.pointer'); }; ue.touchmove = (i) => { i.inputState.setSelectionOrigin('select.pointer'); }; ue.mousedown = (i, e) => { if (i.observer.flush(), Vh > Date.now() - 2e3 && ko(e) == 1) return; let t = null; for (const n of i.state.facet(vh)) if (t = n(i, e), t) break; if (!t && e.button == 0 && (t = sp(i, e)), t) { const n = i.root.activeElement != i.contentDOM; n && i.observer.ignore(() => hh(i.contentDOM)), i.inputState.startMouseSelection(new Jr(i, e, t, n)); } }; function Ia(i, e, t, n) { if (n == 1) return m.cursor(e, t); if (n == 2) return _d(i.state, e, t); { const s = pe.find(i.docView, e); const r = i.state.doc.lineAt(s ? s.posAtEnd : e); const o = s ? s.posAtStart : r.from; let l = s ? s.posAtEnd : r.to; return l < i.state.doc.length && l == r.to && l++, m.range(o, l); } } const Wh = (i, e) => i >= e.top && i <= e.bottom; const Fa = (i, e, t) => Wh(e, t) && i >= t.left && i <= t.right; function ip(i, e, t, n) { const s = pe.find(i.docView, e); if (!s) return 1; const r = e - s.posAtStart; if (r == 0) return 1; if (r == s.length) return -1; const o = s.coordsAt(r, -1); if (o && Fa(t, n, o)) return -1; const l = s.coordsAt(r, 1); return l && Fa(t, n, l) ? 1 : o && Wh(n, o) ? -1 : 1; } function za(i, e) { const t = i.posAtCoords({ x: e.clientX, y: e.clientY }, !1); return { pos: t, bias: ip(i, t, e.clientX, e.clientY) }; } const np = E.ie && E.ie_version <= 11; let Va = null; let Wa = 0; let Ha = 0; function ko(i) { if (!np) return i.detail; const e = Va; const t = Ha; return Va = i, Ha = Date.now(), Wa = !e || t > Date.now() - 400 && Math.abs(e.clientX - i.clientX) < 2 && Math.abs(e.clientY - i.clientY) < 2 ? (Wa + 1) % 3 : 1; } function sp(i, e) { const t = za(i, e); const n = ko(e); let s = i.state.selection; let r = t; let o = e; return { update(l) { l.docChanged && (t && (t.pos = l.changes.mapPos(t.pos)), s = s.map(l.changes), o = null); }, get(l, a, h) { let c; if (o && l.clientX == o.clientX && l.clientY == o.clientY ? c = r : (c = r = za(i, l), o = l), !c || !t) return s; let f = Ia(i, c.pos, c.bias, n); if (t.pos != c.pos && !a) { const u = Ia(i, t.pos, t.bias, n); const d = Math.min(u.from, f.from); const p = Math.max(u.to, f.to); f = d < f.from ? m.range(d, p) : m.range(p, d); } return a ? s.replaceRange(s.main.extend(f.from, f.to)) : h ? s.addRange(f) : m.create([f]); } }; }ue.dragstart = (i, e) => { const { selection: { main: t } } = i.state; const { mouseSelection: n } = i.inputState; n && (n.dragging = t), e.dataTransfer && (e.dataTransfer.setData('Text', i.state.sliceDoc(t.from, t.to)), e.dataTransfer.effectAllowed = 'copyMove'); }; function qa(i, e, t, n) { if (!t) return; const s = i.posAtCoords({ x: e.clientX, y: e.clientY }, !1); e.preventDefault(); const { mouseSelection: r } = i.inputState; const o = n && r && r.dragging && r.dragMove ? { from: r.dragging.from, to: r.dragging.to } : null; const l = { from: s, insert: t }; const a = i.state.changes(o ? [o, l] : l); i.focus(), i.dispatch({ changes: a, selection: { anchor: a.mapPos(s, -1), head: a.mapPos(s, 1) }, userEvent: o ? 'move.drop' : 'input.drop' }); }ue.drop = (i, e) => { if (!e.dataTransfer) return; if (i.state.readOnly) return e.preventDefault(); const t = e.dataTransfer.files; if (t && t.length) { e.preventDefault(); const n = Array(t.length); let s = 0; const r = () => { ++s == t.length && qa(i, e, n.filter(o => o != null).join(i.state.lineBreak), !1); }; for (let o = 0; o < t.length; o++) { const l = new FileReader(); l.onerror = r, l.onload = () => { /[\x00-\x08\x0e-\x1f]{2}/.test(l.result) || (n[o] = l.result), r(); }, l.readAsText(t[o]); } } else qa(i, e, e.dataTransfer.getData('Text'), !0); }; ue.paste = (i, e) => { if (i.state.readOnly) return e.preventDefault(); i.observer.flush(); const t = Fh ? null : e.clipboardData; t ? (zh(i, t.getData('text/plain')), e.preventDefault()) : tp(i); }; function rp(i, e) { const t = i.dom.parentNode; if (!t) return; const n = t.appendChild(document.createElement('textarea')); n.style.cssText = 'position: fixed; left: -10000px; top: 10px', n.value = e, n.focus(), n.selectionEnd = e.length, n.selectionStart = 0, setTimeout(() => { n.remove(), i.focus(); }, 50); } function op(i) { const e = []; const t = []; let n = !1; for (const s of i.selection.ranges)s.empty || (e.push(i.sliceDoc(s.from, s.to)), t.push(s)); if (!e.length) { let s = -1; for (const { from: r } of i.selection.ranges) { const o = i.doc.lineAt(r); o.number > s && (e.push(o.text), t.push({ from: o.from, to: Math.min(i.doc.length, o.to + 1) })), s = o.number; }n = !0; } return { text: e.join(i.lineBreak), ranges: t, linewise: n }; } var Yr = null; ue.copy = ue.cut = (i, e) => { const { text: t, ranges: n, linewise: s } = op(i.state); if (!t && !s) return; Yr = s ? t : null; const r = Fh ? null : e.clipboardData; r ? (e.preventDefault(), r.clearData(), r.setData('text/plain', t)) : rp(i, t), e.type == 'cut' && !i.state.readOnly && i.dispatch({ changes: n, scrollIntoView: !0, userEvent: 'delete.cut' }); }; ue.focus = ue.blur = (i) => { setTimeout(() => { i.hasFocus != i.inputState.notifiedFocused && i.update([]); }, 10); }; function Hh(i, e) { if (i.docView.compositionDeco.size) { i.inputState.rapidCompositionStart = e; try { i.update([]); } finally { i.inputState.rapidCompositionStart = !1; } } }ue.compositionstart = ue.compositionupdate = (i) => { i.inputState.compositionFirstChange == null && (i.inputState.compositionFirstChange = !0), i.inputState.composing < 0 && (i.inputState.composing = 0, i.docView.compositionDeco.size && (i.observer.flush(), Hh(i, !0))); }; ue.compositionend = (i) => { i.inputState.composing = -1, i.inputState.compositionEndedAt = Date.now(), i.inputState.compositionFirstChange = null, setTimeout(() => { i.inputState.composing < 0 && Hh(i, !1); }, 50); }; ue.contextmenu = (i) => { i.inputState.lastContextMenu = Date.now(); }; ue.beforeinput = (i, e) => { let t; let n; if (E.chrome && E.android && (n = $h.find(s => s.inputType == e.inputType)) && (i.observer.delayAndroidKey(n.key, n.keyCode), n.key == 'Backspace' || n.key == 'Delete')) { const s = ((t = window.visualViewport) === null || t === void 0 ? void 0 : t.height) || 0; setTimeout(() => { let r; (((r = window.visualViewport) === null || r === void 0 ? void 0 : r.height) || 0) > s + 10 && i.hasFocus && (i.contentDOM.blur(), i.focus()); }, 100); } }; const Ua = ['pre-wrap', 'normal', 'pre-line', 'break-spaces']; const eo = class {
    constructor() { this.doc = z.empty, this.lineWrapping = !1, this.heightSamples = {}, this.lineHeight = 14, this.charWidth = 7, this.lineLength = 30, this.heightChanged = !1; }

    heightForGap(e, t) { let n = this.doc.lineAt(t).number - this.doc.lineAt(e).number + 1; return this.lineWrapping && (n += Math.ceil((t - e - n * this.lineLength * 0.5) / this.lineLength)), this.lineHeight * n; }

    heightForLine(e) { return this.lineWrapping ? (1 + Math.max(0, Math.ceil((e - this.lineLength) / (this.lineLength - 5)))) * this.lineHeight : this.lineHeight; }

    setDoc(e) { return this.doc = e, this; }

    mustRefreshForWrapping(e) { return Ua.indexOf(e) > -1 != this.lineWrapping; }

    mustRefreshForHeights(e) { let t = !1; for (let n = 0; n < e.length; n++) { const s = e[n]; s < 0 ? n++ : this.heightSamples[Math.floor(s * 10)] || (t = !0, this.heightSamples[Math.floor(s * 10)] = !0); } return t; }

    refresh(e, t, n, s, r) { const o = Ua.indexOf(e) > -1; const l = Math.round(t) != Math.round(this.lineHeight) || this.lineWrapping != o; if (this.lineWrapping = o, this.lineHeight = t, this.charWidth = n, this.lineLength = s, l) { this.heightSamples = {}; for (let a = 0; a < r.length; a++) { const h = r[a]; h < 0 ? a++ : this.heightSamples[Math.floor(h * 10)] = !0; } } return l; }
  }; const to = class {
    constructor(e, t) { this.from = e, this.heights = t, this.index = 0; }

    get more() { return this.index < this.heights.length; }
  }; var it = class {
    constructor(e, t, n, s, r) { this.from = e, this.length = t, this.top = n, this.height = s, this.type = r; }

    get to() { return this.from + this.length; }

    get bottom() { return this.top + this.height; }

    join(e) { const t = (Array.isArray(this.type) ? this.type : [this]).concat(Array.isArray(e.type) ? e.type : [e]); return new it(this.from, this.length + e.length, this.top, this.height + e.height, t); }
  }; var j = (function (i) { return i[i.ByPos = 0] = 'ByPos', i[i.ByHeight = 1] = 'ByHeight', i[i.ByPosNoHeight = 2] = 'ByPosNoHeight', i; }(j || (j = {}))); const _n = 0.001; var be = class {
    constructor(e, t, n = 2) { this.length = e, this.height = t, this.flags = n; }

    get outdated() { return (this.flags & 2) > 0; }

    set outdated(e) { this.flags = (e ? 2 : 0) | this.flags & -3; }

    setHeight(e, t) { this.height != t && (Math.abs(this.height - t) > _n && (e.heightChanged = !0), this.height = t); }

    replace(e, t, n) { return be.of(n); }

    decomposeLeft(e, t) { t.push(this); }

    decomposeRight(e, t) { t.push(this); }

    applyChanges(e, t, n, s) {
      let r = this; for (let o = s.length - 1; o >= 0; o--) {
        let {
          fromA: l, toA: a, fromB: h, toB: c,
        } = s[o]; let f = r.lineAt(l, j.ByPosNoHeight, t, 0, 0); const u = f.to >= a ? f : r.lineAt(a, j.ByPosNoHeight, t, 0, 0); for (c += u.to - a, a = u.to; o > 0 && f.from <= s[o - 1].toA;)l = s[o - 1].fromA, h = s[o - 1].fromB, o--, l < f.from && (f = r.lineAt(l, j.ByPosNoHeight, t, 0, 0)); h += f.from - l, l = f.from; const d = ln.build(n, e, h, c); r = r.replace(l, a, d);
      } return r.updateHeight(n, 0);
    }

    static empty() { return new Oe(0, 0); }

    static of(e) { if (e.length == 1) return e[0]; let t = 0; let n = e.length; let s = 0; let r = 0; for (;;) if (t == n) if (s > r * 2) { const l = e[t - 1]; l.break ? e.splice(--t, 1, l.left, null, l.right) : e.splice(--t, 1, l.left, l.right), n += 1 + l.break, s -= l.size; } else if (r > s * 2) { const l = e[n]; l.break ? e.splice(n, 1, l.left, null, l.right) : e.splice(n, 1, l.left, l.right), n += 2 + l.break, r -= l.size; } else break; else if (s < r) { const l = e[t++]; l && (s += l.size); } else { const l = e[--n]; l && (r += l.size); } let o = 0; return e[t - 1] == null ? (o = 1, t--) : e[t] == null && (o = 1, n++), new io(be.of(e.slice(0, t)), o, be.of(e.slice(n))); }
  }; be.prototype.size = 1; const rs = class extends be {
    constructor(e, t, n) { super(e, t), this.type = n; }

    blockAt(e, t, n, s) { return new it(s, this.length, n, this.height, this.type); }

    lineAt(e, t, n, s, r) { return this.blockAt(0, n, s, r); }

    forEachLine(e, t, n, s, r, o) { e <= r + this.length && t >= r && o(this.blockAt(0, n, s, r)); }

    updateHeight(e, t = 0, n = !1, s) { return s && s.from <= t && s.more && this.setHeight(e, s.heights[s.index++]), this.outdated = !1, this; }

    toString() { return `block(${this.length})`; }
  }; var Oe = class extends rs {
    constructor(e, t) { super(e, t, _.Text), this.collapsed = 0, this.widgetHeight = 0; }

    replace(e, t, n) { let s = n[0]; return n.length == 1 && (s instanceof Oe || s instanceof he && s.flags & 4) && Math.abs(this.length - s.length) < 10 ? (s instanceof he ? s = new Oe(s.length, this.height) : s.height = this.height, this.outdated || (s.outdated = !1), s) : be.of(n); }

    updateHeight(e, t = 0, n = !1, s) { return s && s.from <= t && s.more ? this.setHeight(e, s.heights[s.index++]) : (n || this.outdated) && this.setHeight(e, Math.max(this.widgetHeight, e.heightForLine(this.length - this.collapsed))), this.outdated = !1, this; }

    toString() { return `line(${this.length}${this.collapsed ? -this.collapsed : ''}${this.widgetHeight ? `:${this.widgetHeight}` : ''})`; }
  }; var he = class extends be {
    constructor(e) { super(e, 0); }

    lines(e, t) { const n = e.lineAt(t).number; const s = e.lineAt(t + this.length).number; return { firstLine: n, lastLine: s, lineHeight: this.height / (s - n + 1) }; }

    blockAt(e, t, n, s) { const { firstLine: r, lastLine: o, lineHeight: l } = this.lines(t, s); const a = Math.max(0, Math.min(o - r, Math.floor((e - n) / l))); const { from: h, length: c } = t.line(r + a); return new it(h, c, n + l * a, l, _.Text); }

    lineAt(e, t, n, s, r) { if (t == j.ByHeight) return this.blockAt(e, n, s, r); if (t == j.ByPosNoHeight) { const { from: f, to: u } = n.lineAt(e); return new it(f, u - f, 0, 0, _.Text); } const { firstLine: o, lineHeight: l } = this.lines(n, r); const { from: a, length: h, number: c } = n.lineAt(e); return new it(a, h, s + l * (c - o), l, _.Text); }

    forEachLine(e, t, n, s, r, o) { const { firstLine: l, lineHeight: a } = this.lines(n, r); for (let h = Math.max(e, r), c = Math.min(r + this.length, t); h <= c;) { const f = n.lineAt(h); h == e && (s += a * (f.number - l)), o(new it(f.from, f.length, s, a, _.Text)), s += a, h = f.to + 1; } }

    replace(e, t, n) { const s = this.length - t; if (s > 0) { const r = n[n.length - 1]; r instanceof he ? n[n.length - 1] = new he(r.length + s) : n.push(null, new he(s - 1)); } if (e > 0) { const r = n[0]; r instanceof he ? n[0] = new he(e + r.length) : n.unshift(new he(e - 1), null); } return be.of(n); }

    decomposeLeft(e, t) { t.push(new he(e - 1), null); }

    decomposeRight(e, t) { t.push(null, new he(this.length - e - 1)); }

    updateHeight(e, t = 0, n = !1, s) { const r = t + this.length; if (s && s.from <= t + this.length && s.more) { const o = []; let l = Math.max(t, s.from); let a = -1; const h = e.heightChanged; for (s.from > t && o.push(new he(s.from - t - 1).updateHeight(e, t)); l <= r && s.more;) { const f = e.doc.lineAt(l).length; o.length && o.push(null); const u = s.heights[s.index++]; a == -1 ? a = u : Math.abs(u - a) >= _n && (a = -2); const d = new Oe(f, u); d.outdated = !1, o.push(d), l += f + 1; }l <= r && o.push(null, new he(r - l).updateHeight(e, l)); const c = be.of(o); return e.heightChanged = h || a < 0 || Math.abs(c.height - this.height) >= _n || Math.abs(a - this.lines(e.doc, t).lineHeight) >= _n, c; } else (n || this.outdated) && (this.setHeight(e, e.heightForGap(t, t + this.length)), this.outdated = !1); return this; }

    toString() { return `gap(${this.length})`; }
  }; var io = class extends be {
    constructor(e, t, n) { super(e.length + t + n.length, e.height + n.height, t | (e.outdated || n.outdated ? 2 : 0)), this.left = e, this.right = n, this.size = e.size + n.size; }

    get break() { return this.flags & 1; }

    blockAt(e, t, n, s) { const r = n + this.left.height; return e < r ? this.left.blockAt(e, t, n, s) : this.right.blockAt(e, t, r, s + this.left.length + this.break); }

    lineAt(e, t, n, s, r) { const o = s + this.left.height; const l = r + this.left.length + this.break; const a = t == j.ByHeight ? e < o : e < l; const h = a ? this.left.lineAt(e, t, n, s, r) : this.right.lineAt(e, t, n, o, l); if (this.break || (a ? h.to < l : h.from > l)) return h; const c = t == j.ByPosNoHeight ? j.ByPosNoHeight : j.ByPos; return a ? h.join(this.right.lineAt(l, c, n, o, l)) : this.left.lineAt(l, c, n, s, r).join(h); }

    forEachLine(e, t, n, s, r, o) { const l = s + this.left.height; const a = r + this.left.length + this.break; if (this.break)e < a && this.left.forEachLine(e, t, n, s, r, o), t >= a && this.right.forEachLine(e, t, n, l, a, o); else { const h = this.lineAt(a, j.ByPos, n, s, r); e < h.from && this.left.forEachLine(e, h.from - 1, n, s, r, o), h.to >= e && h.from <= t && o(h), t > h.to && this.right.forEachLine(h.to + 1, t, n, l, a, o); } }

    replace(e, t, n) { const s = this.left.length + this.break; if (t < s) return this.balanced(this.left.replace(e, t, n), this.right); if (e > this.left.length) return this.balanced(this.left, this.right.replace(e - s, t - s, n)); const r = []; e > 0 && this.decomposeLeft(e, r); const o = r.length; for (const l of n)r.push(l); if (e > 0 && _a(r, o - 1), t < this.length) { const l = r.length; this.decomposeRight(t, r), _a(r, l); } return be.of(r); }

    decomposeLeft(e, t) { let n = this.left.length; if (e <= n) return this.left.decomposeLeft(e, t); t.push(this.left), this.break && (n++, e >= n && t.push(null)), e > n && this.right.decomposeLeft(e - n, t); }

    decomposeRight(e, t) { const n = this.left.length; const s = n + this.break; if (e >= s) return this.right.decomposeRight(e - s, t); e < n && this.left.decomposeRight(e, t), this.break && e < s && t.push(null), t.push(this.right); }

    balanced(e, t) { return e.size > 2 * t.size || t.size > 2 * e.size ? be.of(this.break ? [e, null, t] : [e, t]) : (this.left = e, this.right = t, this.height = e.height + t.height, this.outdated = e.outdated || t.outdated, this.size = e.size + t.size, this.length = e.length + this.break + t.length, this); }

    updateHeight(e, t = 0, n = !1, s) { let { left: r, right: o } = this; const l = t + r.length + this.break; let a = null; return s && s.from <= t + r.length && s.more ? a = r = r.updateHeight(e, t, n, s) : r.updateHeight(e, t, n), s && s.from <= l + o.length && s.more ? a = o = o.updateHeight(e, l, n, s) : o.updateHeight(e, l, n), a ? this.balanced(r, o) : (this.height = this.left.height + this.right.height, this.outdated = !1, this); }

    toString() { return this.left + (this.break ? ' ' : '-') + this.right; }
  }; function _a(i, e) { let t; let n; i[e] == null && (t = i[e - 1]) instanceof he && (n = i[e + 1]) instanceof he && i.splice(e - 1, 3, new he(t.length + 1 + n.length)); } const lp = 5; var ln = class {
    constructor(e, t) { this.pos = e, this.oracle = t, this.nodes = [], this.lineStart = -1, this.lineEnd = -1, this.covering = null, this.writtenTo = e; }

    get isCovered() { return this.covering && this.nodes[this.nodes.length - 1] == this.covering; }

    span(e, t) { if (this.lineStart > -1) { const n = Math.min(t, this.lineEnd); const s = this.nodes[this.nodes.length - 1]; s instanceof Oe ? s.length += n - this.pos : (n > this.pos || !this.isCovered) && this.nodes.push(new Oe(n - this.pos, -1)), this.writtenTo = n, t > n && (this.nodes.push(null), this.writtenTo++, this.lineStart = -1); } this.pos = t; }

    point(e, t, n) { if (e < t || n.heightRelevant) { let s = n.widget ? n.widget.estimatedHeight : 0; s < 0 && (s = this.oracle.lineHeight); const r = t - e; n.block ? this.addBlock(new rs(r, s, n.type)) : (r || s >= lp) && this.addLineDeco(s, r); } else t > e && this.span(e, t); this.lineEnd > -1 && this.lineEnd < this.pos && (this.lineEnd = this.oracle.doc.lineAt(this.pos).to); }

    enterLine() { if (this.lineStart > -1) return; const { from: e, to: t } = this.oracle.doc.lineAt(this.pos); this.lineStart = e, this.lineEnd = t, this.writtenTo < e && ((this.writtenTo < e - 1 || this.nodes[this.nodes.length - 1] == null) && this.nodes.push(this.blankContent(this.writtenTo, e - 1)), this.nodes.push(null)), this.pos > e && this.nodes.push(new Oe(this.pos - e, -1)), this.writtenTo = this.pos; }

    blankContent(e, t) { const n = new he(t - e); return this.oracle.doc.lineAt(e).to == t && (n.flags |= 4), n; }

    ensureLine() { this.enterLine(); const e = this.nodes.length ? this.nodes[this.nodes.length - 1] : null; if (e instanceof Oe) return e; const t = new Oe(0, -1); return this.nodes.push(t), t; }

    addBlock(e) { this.enterLine(), e.type == _.WidgetAfter && !this.isCovered && this.ensureLine(), this.nodes.push(e), this.writtenTo = this.pos += e.length, e.type != _.WidgetBefore && (this.covering = e); }

    addLineDeco(e, t) { const n = this.ensureLine(); n.length += t, n.collapsed += t, n.widgetHeight = Math.max(n.widgetHeight, e), this.writtenTo = this.pos += t; }

    finish(e) { const t = this.nodes.length == 0 ? null : this.nodes[this.nodes.length - 1]; this.lineStart > -1 && !(t instanceof Oe) && !this.isCovered ? this.nodes.push(new Oe(0, -1)) : (this.writtenTo < this.pos || t == null) && this.nodes.push(this.blankContent(this.writtenTo, this.pos)); let n = e; for (const s of this.nodes)s instanceof Oe && s.updateHeight(this.oracle, n), n += s ? s.length : 1; return this.nodes; }

    static build(e, t, n, s) { const r = new ln(n, e); return I.spans(t, n, s, r, 0), r.finish(n); }
  }; function ap(i, e, t) { const n = new no(); return I.compare(i, e, t, n, 0), n.changes; } var no = class {
    constructor() { this.changes = []; }

    compareRange() {}

    comparePoint(e, t, n, s) { (e < t || n && n.heightRelevant || s && s.heightRelevant) && Ur(e, t, this.changes, 5); }
  }; function hp(i, e) {
    const t = i.getBoundingClientRect(); let n = Math.max(0, t.left); let s = Math.min(innerWidth, t.right); let r = Math.max(0, t.top); let o = Math.min(innerHeight, t.bottom); const l = i.ownerDocument.body; for (let a = i.parentNode; a && a != l;) if (a.nodeType == 1) { const h = a; const c = window.getComputedStyle(h); if ((h.scrollHeight > h.clientHeight || h.scrollWidth > h.clientWidth) && c.overflow != 'visible') { const f = h.getBoundingClientRect(); n = Math.max(n, f.left), s = Math.min(s, f.right), r = Math.max(r, f.top), o = Math.min(o, f.bottom); }a = c.position == 'absolute' || c.position == 'fixed' ? h.offsetParent : h.parentNode; } else if (a.nodeType == 11)a = a.host; else break; return {
      left: n - t.left, right: Math.max(n, s) - t.left, top: r - (t.top + e), bottom: Math.max(r, o) - (t.top + e),
    };
  } function cp(i, e) {
    const t = i.getBoundingClientRect(); return {
      left: 0, right: t.right - t.left, top: e, bottom: t.bottom - (t.top + e),
    };
  } const Yi = class {
    constructor(e, t, n) { this.from = e, this.to = t, this.size = n; }

    static same(e, t) { if (e.length != t.length) return !1; for (let n = 0; n < e.length; n++) { const s = e[n]; const r = t[n]; if (s.from != r.from || s.to != r.to || s.size != r.size) return !1; } return !0; }

    draw(e) { return A.replace({ widget: new so(this.size, e) }).range(this.from, this.to); }
  }; var so = class extends Ae {
    constructor(e, t) { super(), this.size = e, this.vertical = t; }

    eq(e) { return e.size == this.size && e.vertical == this.vertical; }

    toDOM() { const e = document.createElement('div'); return this.vertical ? e.style.height = `${this.size}px` : (e.style.width = `${this.size}px`, e.style.height = '2px', e.style.display = 'inline-block'), e; }

    get estimatedHeight() { return this.vertical ? this.size : -1; }
  }; const os = class {
    constructor(e) {
      this.state = e, this.pixelViewport = {
        left: 0, right: window.innerWidth, top: 0, bottom: 0,
      }, this.inView = !0, this.paddingTop = 0, this.paddingBottom = 0, this.contentDOMWidth = 0, this.contentDOMHeight = 0, this.editorHeight = 0, this.editorWidth = 0, this.heightOracle = new eo(), this.scaler = Za, this.scrollTarget = null, this.printing = !1, this.mustMeasureContent = !0, this.defaultTextDirection = G.RTL, this.visibleRanges = [], this.mustEnforceCursorAssoc = !1, this.stateDeco = e.facet(on).filter(t => typeof t !== 'function'), this.heightMap = be.empty().applyChanges(this.stateDeco, z.empty, this.heightOracle.setDoc(e.doc), [new Ge(0, 0, 0, e.doc.length)]), this.viewport = this.getViewport(0, null), this.updateViewportLines(), this.updateForViewport(), this.lineGaps = this.ensureLineGaps([]), this.lineGapDeco = A.set(this.lineGaps.map(t => t.draw(!1))), this.computeVisibleRanges();
    }

    updateForViewport() { const e = [this.viewport]; const { main: t } = this.state.selection; for (let n = 0; n <= 1; n++) { const s = n ? t.head : t.anchor; if (!e.some(({ from: r, to: o }) => s >= r && s <= o)) { const { from: r, to: o } = this.lineBlockAt(s); e.push(new ci(r, o)); } } this.viewports = e.sort((n, s) => n.from - s.from), this.scaler = this.heightMap.height <= 7e6 ? Za : new ro(this.heightOracle.doc, this.heightMap, this.viewports); }

    updateViewportLines() { this.viewportLines = [], this.heightMap.forEachLine(this.viewport.from, this.viewport.to, this.state.doc, 0, 0, (e) => { this.viewportLines.push(this.scaler.scale == 1 ? e : Zi(e, this.scaler)); }); }

    update(e, t = null) { this.state = e.state; const n = this.stateDeco; this.stateDeco = this.state.facet(on).filter(h => typeof h !== 'function'); const s = e.changedRanges; const r = Ge.extendWithRanges(s, ap(n, this.stateDeco, e ? e.changes : ie.empty(this.state.doc.length))); const o = this.heightMap.height; this.heightMap = this.heightMap.applyChanges(this.stateDeco, e.startState.doc, this.heightOracle.setDoc(this.state.doc), r), this.heightMap.height != o && (e.flags |= 2); let l = r.length ? this.mapViewport(this.viewport, e.changes) : this.viewport; (t && (t.range.head < l.from || t.range.head > l.to) || !this.viewportIsAppropriate(l)) && (l = this.getViewport(0, t)); const a = !e.changes.empty || e.flags & 2 || l.from != this.viewport.from || l.to != this.viewport.to; this.viewport = l, this.updateForViewport(), a && this.updateViewportLines(), (this.lineGaps.length || this.viewport.to - this.viewport.from > 4e3) && this.updateLineGaps(this.ensureLineGaps(this.mapLineGaps(this.lineGaps, e.changes))), e.flags |= this.computeVisibleRanges(), t && (this.scrollTarget = t), !this.mustEnforceCursorAssoc && e.selectionSet && e.view.lineWrapping && e.state.selection.main.empty && e.state.selection.main.assoc && (this.mustEnforceCursorAssoc = !0); }

    measure(e) { const t = e.contentDOM; const n = window.getComputedStyle(t); const s = this.heightOracle; const r = n.whiteSpace; this.defaultTextDirection = n.direction == 'rtl' ? G.RTL : G.LTR; let o = this.heightOracle.mustRefreshForWrapping(r); let l = o || this.mustMeasureContent || this.contentDOMHeight != t.clientHeight; let a = 0; let h = 0; if (this.editorWidth != e.scrollDOM.clientWidth && (s.lineWrapping && (l = !0), this.editorWidth = e.scrollDOM.clientWidth, a |= 8), l) { this.mustMeasureContent = !1, this.contentDOMHeight = t.clientHeight; const b = parseInt(n.paddingTop) || 0; const y = parseInt(n.paddingBottom) || 0; (this.paddingTop != b || this.paddingBottom != y) && (a |= 8, this.paddingTop = b, this.paddingBottom = y); } const c = (this.printing ? cp : hp)(t, this.paddingTop); const f = c.top - this.pixelViewport.top; const u = c.bottom - this.pixelViewport.bottom; this.pixelViewport = c; const d = this.pixelViewport.bottom > this.pixelViewport.top && this.pixelViewport.right > this.pixelViewport.left; if (d != this.inView && (this.inView = d, d && (l = !0)), !this.inView) return 0; const p = t.clientWidth; if ((this.contentDOMWidth != p || this.editorHeight != e.scrollDOM.clientHeight) && (this.contentDOMWidth = p, this.editorHeight = e.scrollDOM.clientHeight, a |= 8), l) { const b = e.docView.measureVisibleLineHeights(this.viewport); if (s.mustRefreshForHeights(b) && (o = !0), o || s.lineWrapping && Math.abs(p - this.contentDOMWidth) > s.charWidth) { const { lineHeight: y, charWidth: S } = e.docView.measureTextSize(); o = s.refresh(r, y, S, p / S, b), o && (e.docView.minWidth = 0, a |= 8); }f > 0 && u > 0 ? h = Math.max(f, u) : f < 0 && u < 0 && (h = Math.min(f, u)), s.heightChanged = !1; for (const y of this.viewports) { const S = y.from == this.viewport.from ? b : e.docView.measureVisibleLineHeights(y); this.heightMap = this.heightMap.updateHeight(s, 0, o, new to(y.from, S)); }s.heightChanged && (a |= 2); } const g = !this.viewportIsAppropriate(this.viewport, h) || this.scrollTarget && (this.scrollTarget.range.head < this.viewport.from || this.scrollTarget.range.head > this.viewport.to); return g && (this.viewport = this.getViewport(h, this.scrollTarget)), this.updateForViewport(), (a & 2 || g) && this.updateViewportLines(), (this.lineGaps.length || this.viewport.to - this.viewport.from > 4e3) && this.updateLineGaps(this.ensureLineGaps(o ? [] : this.lineGaps)), a |= this.computeVisibleRanges(), this.mustEnforceCursorAssoc && (this.mustEnforceCursorAssoc = !1, e.docView.enforceCursorAssoc()), a; }

    get visibleTop() { return this.scaler.fromDOM(this.pixelViewport.top); }

    get visibleBottom() { return this.scaler.fromDOM(this.pixelViewport.bottom); }

    getViewport(e, t) { const n = 0.5 - Math.max(-0.5, Math.min(0.5, e / 1e3 / 2)); const s = this.heightMap; const r = this.state.doc; const { visibleTop: o, visibleBottom: l } = this; let a = new ci(s.lineAt(o - n * 1e3, j.ByHeight, r, 0, 0).from, s.lineAt(l + (1 - n) * 1e3, j.ByHeight, r, 0, 0).to); if (t) { const { head: h } = t.range; if (h < a.from || h > a.to) { const c = Math.min(this.editorHeight, this.pixelViewport.bottom - this.pixelViewport.top); const f = s.lineAt(h, j.ByPos, r, 0, 0); let u; t.y == 'center' ? u = (f.top + f.bottom) / 2 - c / 2 : t.y == 'start' || t.y == 'nearest' && h < a.from ? u = f.top : u = f.bottom - c, a = new ci(s.lineAt(u - 1e3 / 2, j.ByHeight, r, 0, 0).from, s.lineAt(u + c + 1e3 / 2, j.ByHeight, r, 0, 0).to); } } return a; }

    mapViewport(e, t) { const n = t.mapPos(e.from, -1); const s = t.mapPos(e.to, 1); return new ci(this.heightMap.lineAt(n, j.ByPos, this.state.doc, 0, 0).from, this.heightMap.lineAt(s, j.ByPos, this.state.doc, 0, 0).to); }

    viewportIsAppropriate({ from: e, to: t }, n = 0) { if (!this.inView) return !0; const { top: s } = this.heightMap.lineAt(e, j.ByPos, this.state.doc, 0, 0); const { bottom: r } = this.heightMap.lineAt(t, j.ByPos, this.state.doc, 0, 0); const { visibleTop: o, visibleBottom: l } = this; return (e == 0 || s <= o - Math.max(10, Math.min(-n, 250))) && (t == this.state.doc.length || r >= l + Math.max(10, Math.min(n, 250))) && s > o - 2 * 1e3 && r < l + 2 * 1e3; }

    mapLineGaps(e, t) { if (!e.length || t.empty) return e; const n = []; for (const s of e)t.touchesRange(s.from, s.to) || n.push(new Yi(t.mapPos(s.from), t.mapPos(s.to), s.size)); return n; }

    ensureLineGaps(e) { const t = []; if (this.defaultTextDirection != G.LTR) return t; for (const n of this.viewportLines) { if (n.length < 4e3) continue; const s = fp(n.from, n.to, this.stateDeco); if (s.total < 4e3) continue; let r; let o; if (this.heightOracle.lineWrapping) { const h = 2e3 / this.heightOracle.lineLength * this.heightOracle.lineHeight; r = qn(s, (this.visibleTop - n.top - h) / n.height), o = qn(s, (this.visibleBottom - n.top + h) / n.height); } else { const h = s.total * this.heightOracle.charWidth; const c = 2e3 * this.heightOracle.charWidth; r = qn(s, (this.pixelViewport.left - c) / h), o = qn(s, (this.pixelViewport.right + c) / h); } const l = []; r > n.from && l.push({ from: n.from, to: r }), o < n.to && l.push({ from: o, to: n.to }); const a = this.state.selection.main; a.from >= n.from && a.from <= n.to && Ga(l, a.from - 10, a.from + 10), !a.empty && a.to >= n.from && a.to <= n.to && Ga(l, a.to - 10, a.to + 10); for (const { from: h, to: c } of l)c - h > 1e3 && t.push(up(e, f => f.from >= n.from && f.to <= n.to && Math.abs(f.from - h) < 1e3 && Math.abs(f.to - c) < 1e3) || new Yi(h, c, this.gapSize(n, h, c, s))); } return t; }

    gapSize(e, t, n, s) { const r = ja(s, n) - ja(s, t); return this.heightOracle.lineWrapping ? e.height * r : s.total * this.heightOracle.charWidth * r; }

    updateLineGaps(e) { Yi.same(e, this.lineGaps) || (this.lineGaps = e, this.lineGapDeco = A.set(e.map(t => t.draw(this.heightOracle.lineWrapping)))); }

    computeVisibleRanges() { let e = this.stateDeco; this.lineGaps.length && (e = e.concat(this.lineGapDeco)); const t = []; I.spans(e, this.viewport.from, this.viewport.to, { span(s, r) { t.push({ from: s, to: r }); }, point() {} }, 20); const n = t.length != this.visibleRanges.length || this.visibleRanges.some((s, r) => s.from != t[r].from || s.to != t[r].to); return this.visibleRanges = t, n ? 4 : 0; }

    lineBlockAt(e) { return e >= this.viewport.from && e <= this.viewport.to && this.viewportLines.find(t => t.from <= e && t.to >= e) || Zi(this.heightMap.lineAt(e, j.ByPos, this.state.doc, 0, 0), this.scaler); }

    lineBlockAtHeight(e) { return Zi(this.heightMap.lineAt(this.scaler.fromDOM(e), j.ByHeight, this.state.doc, 0, 0), this.scaler); }

    elementAtHeight(e) { return Zi(this.heightMap.blockAt(this.scaler.fromDOM(e), this.state.doc, 0, 0), this.scaler); }

    get docHeight() { return this.scaler.toDOM(this.heightMap.height); }

    get contentHeight() { return this.docHeight + this.paddingTop + this.paddingBottom; }
  }; var ci = class {constructor(e, t) { this.from = e, this.to = t; }}; function fp(i, e, t) { const n = []; let s = i; let r = 0; return I.spans(t, i, e, { span() {}, point(o, l) { o > s && (n.push({ from: s, to: o }), r += o - s), s = l; } }, 20), s < e && (n.push({ from: s, to: e }), r += e - s), { total: r, ranges: n }; } function qn({ total: i, ranges: e }, t) { if (t <= 0) return e[0].from; if (t >= 1) return e[e.length - 1].to; let n = Math.floor(i * t); for (let s = 0; ;s++) { const { from: r, to: o } = e[s]; const l = o - r; if (n <= l) return r + n; n -= l; } } function ja(i, e) { let t = 0; for (const { from: n, to: s } of i.ranges) { if (e <= s) { t += e - n; break; }t += s - n; } return t / i.total; } function Ga(i, e, t) { for (let n = 0; n < i.length; n++) { const s = i[n]; if (s.from < t && s.to > e) { const r = []; s.from < e && r.push({ from: s.from, to: e }), s.to > t && r.push({ from: t, to: s.to }), i.splice(n, 1, ...r), n += r.length - 1; } } } function up(i, e) { for (const t of i) if (e(t)) return t; } var Za = { toDOM(i) { return i; }, fromDOM(i) { return i; }, scale: 1 }; var ro = class {
    constructor(e, t, n) {
      let s = 0; let r = 0; let o = 0; this.viewports = n.map(({ from: l, to: a }) => {
        const h = t.lineAt(l, j.ByPos, e, 0, 0).top; const c = t.lineAt(a, j.ByPos, e, 0, 0).bottom; return s += c - h, {
          from: l, to: a, top: h, bottom: c, domTop: 0, domBottom: 0,
        };
      }), this.scale = (7e6 - s) / (t.height - s); for (const l of this.viewports)l.domTop = o + (l.top - r) * this.scale, o = l.domBottom = l.domTop + (l.bottom - l.top), r = l.bottom;
    }

    toDOM(e) { for (let t = 0, n = 0, s = 0; ;t++) { const r = t < this.viewports.length ? this.viewports[t] : null; if (!r || e < r.top) return s + (e - n) * this.scale; if (e <= r.bottom) return r.domTop + (e - r.top); n = r.bottom, s = r.domBottom; } }

    fromDOM(e) { for (let t = 0, n = 0, s = 0; ;t++) { const r = t < this.viewports.length ? this.viewports[t] : null; if (!r || e < r.domTop) return n + (e - s) / this.scale; if (e <= r.domBottom) return r.top + (e - r.domTop); n = r.bottom, s = r.domBottom; } }
  }; function Zi(i, e) { if (e.scale == 1) return i; const t = e.toDOM(i.top); const n = e.toDOM(i.bottom); return new it(i.from, i.length, t, n - t, Array.isArray(i.type) ? i.type.map(s => Zi(s, e)) : i.type); } const Un = v.define({ combine: i => i.join(' ') }); const oo = v.define({ combine: i => i.indexOf(!0) > -1 }); const lo = Ie.newName(); const qh = Ie.newName(); const Uh = Ie.newName(); const _h = { '&light': `.${qh}`, '&dark': `.${Uh}` }; function ao(i, e, t) { return new Ie(e, { finish(n) { return /&/.test(n) ? n.replace(/&\w*/, (s) => { if (s == '&') return i; if (!t || !t[s]) throw new RangeError(`Unsupported selector: ${s}`); return t[s]; }) : `${i} ${n}`; } }); } const dp = ao(`.${lo}`, {
    '&.cm-editor': {
      position: 'relative !important', boxSizing: 'border-box', '&.cm-focused': { outline: '1px dotted #212121' }, display: 'flex !important', flexDirection: 'column',
    },
    '.cm-scroller': {
      display: 'flex !important', alignItems: 'flex-start !important', fontFamily: 'monospace', lineHeight: 1.4, height: '100%', overflowX: 'auto', position: 'relative', zIndex: 0,
    },
    '.cm-content': {
      margin: 0, flexGrow: 2, minHeight: '100%', display: 'block', whiteSpace: 'pre', wordWrap: 'normal', boxSizing: 'border-box', padding: '4px 0', outline: 'none', '&[contenteditable=true]': { WebkitUserModify: 'read-write-plaintext-only' },
    },
    '.cm-lineWrapping': {
      whiteSpace_fallback: 'pre-wrap', whiteSpace: 'break-spaces', wordBreak: 'break-word', overflowWrap: 'anywhere',
    },
    '&light .cm-content': { caretColor: 'black' },
    '&dark .cm-content': { caretColor: 'white' },
    '.cm-line': { display: 'block', padding: '0 2px 0 4px' },
    '.cm-selectionLayer': { zIndex: -1, contain: 'size style' },
    '.cm-selectionBackground': { position: 'absolute' },
    '&light .cm-selectionBackground': { background: '#d9d9d9' },
    '&dark .cm-selectionBackground': { background: '#222' },
    '&light.cm-focused .cm-selectionBackground': { background: '#d7d4f0' },
    '&dark.cm-focused .cm-selectionBackground': { background: '#233' },
    '.cm-cursorLayer': { zIndex: 100, contain: 'size style', pointerEvents: 'none' },
    '&.cm-focused .cm-cursorLayer': { animation: 'steps(1) cm-blink 1.2s infinite' },
    '@keyframes cm-blink': { '0%': {}, '50%': { visibility: 'hidden' }, '100%': {} },
    '@keyframes cm-blink2': { '0%': {}, '50%': { visibility: 'hidden' }, '100%': {} },
    '.cm-cursor, .cm-dropCursor': {
      position: 'absolute', borderLeft: '1.2px solid black', marginLeft: '-0.6px', pointerEvents: 'none',
    },
    '.cm-cursor': { display: 'none' },
    '&dark .cm-cursor': { borderLeftColor: '#444' },
    '&.cm-focused .cm-cursor': { display: 'block' },
    '&light .cm-activeLine': { backgroundColor: '#f3f9ff' },
    '&dark .cm-activeLine': { backgroundColor: '#223039' },
    '&light .cm-specialChar': { color: 'red' },
    '&dark .cm-specialChar': { color: '#f78' },
    '.cm-gutters': {
      display: 'flex', height: '100%', boxSizing: 'border-box', left: 0, zIndex: 200,
    },
    '&light .cm-gutters': { backgroundColor: '#f5f5f5', color: '#6c6c6c', borderRight: '1px solid #ddd' },
    '&dark .cm-gutters': { backgroundColor: '#333338', color: '#ccc' },
    '.cm-gutter': {
      display: 'flex !important', flexDirection: 'column', flexShrink: 0, boxSizing: 'border-box', minHeight: '100%', overflow: 'hidden',
    },
    '.cm-gutterElement': { boxSizing: 'border-box' },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 3px 0 5px', minWidth: '20px', textAlign: 'right', whiteSpace: 'nowrap',
    },
    '&light .cm-activeLineGutter': { backgroundColor: '#e2f2ff' },
    '&dark .cm-activeLineGutter': { backgroundColor: '#222227' },
    '.cm-panels': {
      boxSizing: 'border-box', position: 'sticky', left: 0, right: 0,
    },
    '&light .cm-panels': { backgroundColor: '#f5f5f5', color: 'black' },
    '&light .cm-panels-top': { borderBottom: '1px solid #ddd' },
    '&light .cm-panels-bottom': { borderTop: '1px solid #ddd' },
    '&dark .cm-panels': { backgroundColor: '#333338', color: 'white' },
    '.cm-tab': { display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' },
    '.cm-widgetBuffer': { verticalAlign: 'text-top', height: '1em', display: 'inline' },
    '.cm-placeholder': { color: '#888', display: 'inline-block', verticalAlign: 'top' },
    '.cm-button': {
      verticalAlign: 'middle', color: 'inherit', fontSize: '70%', padding: '.2em 1em', borderRadius: '1px',
    },
    '&light .cm-button': { backgroundImage: 'linear-gradient(#eff1f5, #d9d9df)', border: '1px solid #888', '&:active': { backgroundImage: 'linear-gradient(#b4b4b4, #d0d3d6)' } },
    '&dark .cm-button': { backgroundImage: 'linear-gradient(#393939, #111)', border: '1px solid #888', '&:active': { backgroundImage: 'linear-gradient(#111, #333)' } },
    '.cm-textfield': {
      verticalAlign: 'middle', color: 'inherit', fontSize: '70%', border: '1px solid silver', padding: '.2em .5em',
    },
    '&light .cm-textfield': { backgroundColor: 'white' },
    '&dark .cm-textfield': { border: '1px solid #555', backgroundColor: 'inherit' },
  }, _h); const pp = {
    childList: !0, characterData: !0, subtree: !0, attributes: !0, characterDataOldValue: !0,
  }; const Pr = E.ie && E.ie_version <= 11; const ho = class {
    constructor(e, t, n) { this.view = e, this.onChange = t, this.onScrollChanged = n, this.active = !1, this.selectionRange = new $r(), this.selectionChanged = !1, this.delayedFlush = -1, this.resizeTimeout = -1, this.queue = [], this.delayedAndroidKey = null, this.scrollTargets = [], this.intersection = null, this.resize = null, this.intersecting = !1, this.gapIntersection = null, this.gaps = [], this.parentCheck = -1, this.dom = e.contentDOM, this.observer = new MutationObserver((s) => { for (const r of s) this.queue.push(r); (E.ie && E.ie_version <= 11 || E.ios && e.composing) && s.some(r => r.type == 'childList' && r.removedNodes.length || r.type == 'characterData' && r.oldValue.length > r.target.nodeValue.length) ? this.flushSoon() : this.flush(); }), Pr && (this.onCharData = (s) => { this.queue.push({ target: s.target, type: 'characterData', oldValue: s.prevValue }), this.flushSoon(); }), this.onSelectionChange = this.onSelectionChange.bind(this), window.addEventListener('resize', this.onResize = this.onResize.bind(this)), typeof ResizeObserver === 'function' && (this.resize = new ResizeObserver(() => { this.view.docView.lastUpdate < Date.now() - 75 && this.onResize(); }), this.resize.observe(e.scrollDOM)), window.addEventListener('beforeprint', this.onPrint = this.onPrint.bind(this)), this.start(), window.addEventListener('scroll', this.onScroll = this.onScroll.bind(this)), typeof IntersectionObserver === 'function' && (this.intersection = new IntersectionObserver((s) => { this.parentCheck < 0 && (this.parentCheck = setTimeout(this.listenForScroll.bind(this), 1e3)), s.length > 0 && s[s.length - 1].intersectionRatio > 0 != this.intersecting && (this.intersecting = !this.intersecting, this.intersecting != this.view.inView && this.onScrollChanged(document.createEvent('Event'))); }, {}), this.intersection.observe(this.dom), this.gapIntersection = new IntersectionObserver((s) => { s.length > 0 && s[s.length - 1].intersectionRatio > 0 && this.onScrollChanged(document.createEvent('Event')); }, {})), this.listenForScroll(), this.readSelectionRange(), this.dom.ownerDocument.addEventListener('selectionchange', this.onSelectionChange); }

    onScroll(e) { this.intersecting && this.flush(!1), this.onScrollChanged(e); }

    onResize() { this.resizeTimeout < 0 && (this.resizeTimeout = setTimeout(() => { this.resizeTimeout = -1, this.view.requestMeasure(); }, 50)); }

    onPrint() { this.view.viewState.printing = !0, this.view.measure(), setTimeout(() => { this.view.viewState.printing = !1, this.view.requestMeasure(); }, 500); }

    updateGaps(e) { if (this.gapIntersection && (e.length != this.gaps.length || this.gaps.some((t, n) => t != e[n]))) { this.gapIntersection.disconnect(); for (const t of e) this.gapIntersection.observe(t); this.gaps = e; } }

    onSelectionChange(e) { if (!this.readSelectionRange() || this.delayedAndroidKey) return; const { view: t } = this; const n = this.selectionRange; if (t.state.facet(hn) ? t.root.activeElement != this.dom : !Br(t.dom, n)) return; const s = n.anchorNode && t.docView.nearest(n.anchorNode); s && s.ignoreEvent(e) || ((E.ie && E.ie_version <= 11 || E.android && E.chrome) && !t.state.selection.main.empty && n.focusNode && Qn(n.focusNode, n.focusOffset, n.anchorNode, n.anchorOffset) ? this.flushSoon() : this.flush(!1)); }

    readSelectionRange() { const { root: e } = this.view; const t = Zn(e); const n = E.safari && e.nodeType == 11 && Sd() == this.view.contentDOM && mp(this.view) || t; return this.selectionRange.eq(n) ? !1 : (this.selectionRange.setRange(n), this.selectionChanged = !0); }

    setSelectionRange(e, t) { this.selectionRange.set(e.node, e.offset, t.node, t.offset), this.selectionChanged = !1; }

    listenForScroll() { this.parentCheck = -1; let e = 0; let t = null; for (let n = this.dom; n;) if (n.nodeType == 1)!t && e < this.scrollTargets.length && this.scrollTargets[e] == n ? e++ : t || (t = this.scrollTargets.slice(0, e)), t && t.push(n), n = n.assignedSlot || n.parentNode; else if (n.nodeType == 11)n = n.host; else break; if (e < this.scrollTargets.length && !t && (t = this.scrollTargets.slice(0, e)), t) { for (const n of this.scrollTargets)n.removeEventListener('scroll', this.onScroll); for (const n of this.scrollTargets = t)n.addEventListener('scroll', this.onScroll); } }

    ignore(e) { if (!this.active) return e(); try { return this.stop(), e(); } finally { this.start(), this.clear(); } }

    start() { this.active || (this.observer.observe(this.dom, pp), Pr && this.dom.addEventListener('DOMCharacterDataModified', this.onCharData), this.active = !0); }

    stop() { !this.active || (this.active = !1, this.observer.disconnect(), Pr && this.dom.removeEventListener('DOMCharacterDataModified', this.onCharData)); }

    clear() { this.processRecords(), this.queue.length = 0, this.selectionChanged = !1; }

    delayAndroidKey(e, t) { this.delayedAndroidKey || requestAnimationFrame(() => { const n = this.delayedAndroidKey; this.delayedAndroidKey = null; const s = this.view.state; Ki(this.view.contentDOM, n.key, n.keyCode) ? this.processRecords() : this.flush(), this.view.state == s && this.view.update([]); }), (!this.delayedAndroidKey || e == 'Enter') && (this.delayedAndroidKey = { key: e, keyCode: t }); }

    flushSoon() { this.delayedFlush < 0 && (this.delayedFlush = window.setTimeout(() => { this.delayedFlush = -1, this.flush(); }, 20)); }

    forceFlush() { this.delayedFlush >= 0 && (window.clearTimeout(this.delayedFlush), this.delayedFlush = -1, this.flush()); }

    processRecords() { const e = this.queue; for (const r of this.observer.takeRecords())e.push(r); e.length && (this.queue = []); let t = -1; let n = -1; let s = !1; for (const r of e) { const o = this.readMutation(r); !o || (o.typeOver && (s = !0), t == -1 ? { from: t, to: n } = o : (t = Math.min(o.from, t), n = Math.max(o.to, n))); } return { from: t, to: n, typeOver: s }; }

    flush(e = !0) { if (this.delayedFlush >= 0 || this.delayedAndroidKey) return; e && this.readSelectionRange(); const { from: t, to: n, typeOver: s } = this.processRecords(); const r = this.selectionChanged && Br(this.dom, this.selectionRange); if (t < 0 && !r) return; this.selectionChanged = !1; const o = this.view.state; this.onChange(t, n, s), this.view.state == o && this.view.update([]); }

    readMutation(e) { const t = this.view.docView.nearest(e.target); if (!t || t.ignoreMutation(e)) return null; if (t.markDirty(e.type == 'attributes'), e.type == 'attributes' && (t.dirty |= 4), e.type == 'childList') { const n = Qa(t, e.previousSibling || e.target.previousSibling, -1); const s = Qa(t, e.nextSibling || e.target.nextSibling, 1); return { from: n ? t.posAfter(n) : t.posAtStart, to: s ? t.posBefore(s) : t.posAtEnd, typeOver: !1 }; } return e.type == 'characterData' ? { from: t.posAtStart, to: t.posAtEnd, typeOver: e.target.nodeValue == e.oldValue } : null; }

    destroy() { let e; let t; let n; this.stop(), (e = this.intersection) === null || e === void 0 || e.disconnect(), (t = this.gapIntersection) === null || t === void 0 || t.disconnect(), (n = this.resize) === null || n === void 0 || n.disconnect(); for (const s of this.scrollTargets)s.removeEventListener('scroll', this.onScroll); window.removeEventListener('scroll', this.onScroll), window.removeEventListener('resize', this.onResize), window.removeEventListener('beforeprint', this.onPrint), this.dom.ownerDocument.removeEventListener('selectionchange', this.onSelectionChange), clearTimeout(this.parentCheck), clearTimeout(this.resizeTimeout); }
  }; function Qa(i, e, t) { for (;e;) { const n = K.get(e); if (n && n.parent == i) return n; const s = e.parentNode; e = s != i.dom ? s : t > 0 ? e.nextSibling : e.previousSibling; } return null; } function mp(i) {
    let e = null; function t(a) { a.preventDefault(), a.stopImmediatePropagation(), e = a.getTargetRanges()[0]; } if (i.contentDOM.addEventListener('beforeinput', t, !0), document.execCommand('indent'), i.contentDOM.removeEventListener('beforeinput', t, !0), !e) return null; let n = e.startContainer; let s = e.startOffset; let r = e.endContainer; let o = e.endOffset; const l = i.docView.domAtPos(i.state.selection.main.anchor); return Qn(l.node, l.offset, r, o) && ([n, s, r, o] = [r, o, n, s]), {
      anchorNode: n, anchorOffset: s, focusNode: r, focusOffset: o,
    };
  } function gp(i, e, t, n) { let s; let r; const o = i.state.selection.main; if (e > -1) { const l = i.docView.domBoundsAround(e, t, 0); if (!l || i.state.readOnly) return; const { from: a, to: h } = l; const c = i.docView.impreciseHead || i.docView.impreciseAnchor ? [] : yp(i); const f = new ts(c, i.state); f.readRange(l.startDOM, l.endDOM); let u = o.from; let d = null; (i.inputState.lastKeyCode === 8 && i.inputState.lastKeyTime > Date.now() - 100 || E.android && f.text.length < h - a) && (u = o.to, d = 'end'); const p = bp(i.state.doc.sliceString(a, h, At), f.text, u - a, d); p && (E.chrome && i.inputState.lastKeyCode == 13 && p.toB == p.from + 2 && f.text.slice(p.from, p.toB) == At + At && p.toB--, s = { from: a + p.from, to: a + p.toA, insert: z.of(f.text.slice(p.from, p.toB).split(At)) }), r = xp(c, a); } else if (i.hasFocus || !i.state.facet(hn)) { const l = i.observer.selectionRange; const { impreciseHead: a, impreciseAnchor: h } = i.docView; const c = a && a.node == l.focusNode && a.offset == l.focusOffset || !di(i.contentDOM, l.focusNode) ? i.state.selection.main.head : i.docView.posFromDOM(l.focusNode, l.focusOffset); const f = h && h.node == l.anchorNode && h.offset == l.anchorOffset || !di(i.contentDOM, l.anchorNode) ? i.state.selection.main.anchor : i.docView.posFromDOM(l.anchorNode, l.anchorOffset); (c != o.head || f != o.anchor) && (r = m.single(f, c)); } if (!(!s && !r)) { if (!s && n && !o.empty && r && r.main.empty ? s = { from: o.from, to: o.to, insert: i.state.doc.slice(o.from, o.to) } : s && s.from >= o.from && s.to <= o.to && (s.from != o.from || s.to != o.to) && o.to - o.from - (s.to - s.from) <= 4 && (s = { from: o.from, to: o.to, insert: i.state.doc.slice(o.from, s.from).append(s.insert).append(i.state.doc.slice(s.to, o.to)) }), s) { const l = i.state; if (E.ios && i.inputState.flushIOSKey(i) || E.android && (s.from == o.from && s.to == o.to && s.insert.length == 1 && s.insert.lines == 2 && Ki(i.contentDOM, 'Enter', 13) || s.from == o.from - 1 && s.to == o.to && s.insert.length == 0 && Ki(i.contentDOM, 'Backspace', 8) || s.from == o.from && s.to == o.to + 1 && s.insert.length == 0 && Ki(i.contentDOM, 'Delete', 46))) return; const a = s.insert.toString(); if (i.state.facet(Sh).some(f => f(i, s.from, s.to, a))) return; i.inputState.composing >= 0 && i.inputState.composing++; let h; if (s.from >= o.from && s.to <= o.to && s.to - s.from >= (o.to - o.from) / 3 && (!r || r.main.empty && r.main.from == s.from + s.insert.length) && i.inputState.composing < 0) { const f = o.from < s.from ? l.sliceDoc(o.from, s.from) : ''; const u = o.to > s.to ? l.sliceDoc(s.to, o.to) : ''; h = l.replaceSelection(i.state.toText(f + s.insert.sliceString(0, void 0, i.state.lineBreak) + u)); } else { const f = l.changes(s); const u = r && !l.selection.main.eq(r.main) && r.main.to <= f.newLength ? r.main : void 0; if (l.selection.ranges.length > 1 && i.inputState.composing >= 0 && s.to <= o.to && s.to >= o.to - 10) { const d = i.state.sliceDoc(s.from, s.to); const p = Rh(i) || i.state.doc.lineAt(o.head); const g = o.to - s.to; const b = o.to - o.from; h = l.changeByRange((y) => { if (y.from == o.from && y.to == o.to) return { changes: f, range: u || y.map(f) }; const S = y.to - g; const P = S - d.length; if (y.to - y.from != b || i.state.sliceDoc(P, S) != d || p && y.to >= p.from && y.from <= p.to) return { range: y }; const k = l.changes({ from: P, to: S, insert: s.insert }); const C = y.to - o.to; return { changes: k, range: u ? m.range(Math.max(0, u.anchor + C), Math.max(0, u.head + C)) : y.map(k) }; }); } else h = { changes: f, selection: u && l.selection.replaceRange(u) }; } let c = 'input.type'; i.composing && (c += '.compose', i.inputState.compositionFirstChange && (c += '.start', i.inputState.compositionFirstChange = !1)), i.dispatch(h, { scrollIntoView: !0, userEvent: c }); } else if (r && !r.main.eq(o)) { let l = !1; let a = 'select'; i.inputState.lastSelectionTime > Date.now() - 50 && (i.inputState.lastSelectionOrigin == 'select' && (l = !0), a = i.inputState.lastSelectionOrigin), i.dispatch({ selection: r, scrollIntoView: l, userEvent: a }); } } } function bp(i, e, t, n) { const s = Math.min(i.length, e.length); let r = 0; for (;r < s && i.charCodeAt(r) == e.charCodeAt(r);)r++; if (r == s && i.length == e.length) return null; let o = i.length; let l = e.length; for (;o > 0 && l > 0 && i.charCodeAt(o - 1) == e.charCodeAt(l - 1);)o--, l--; if (n == 'end') { const a = Math.max(0, r - Math.min(o, l)); t -= o + a - r; } return o < r && i.length < e.length ? (r -= t <= r && t >= o ? r - t : 0, l = r + (l - o), o = r) : l < r && (r -= t <= r && t >= l ? r - t : 0, o = r + (o - l), l = r), { from: r, toA: o, toB: l }; } function yp(i) {
    const e = []; if (i.root.activeElement != i.contentDOM) return e; const {
      anchorNode: t, anchorOffset: n, focusNode: s, focusOffset: r,
    } = i.observer.selectionRange; return t && (e.push(new is(t, n)), (s != t || r != n) && e.push(new is(s, r))), e;
  } function xp(i, e) { if (i.length == 0) return null; const t = i[0].pos; const n = i.length == 2 ? i[1].pos : t; return t > -1 && n > -1 ? m.single(t + e, n + e) : null; } var O = class {
    constructor(e = {}) { this.plugins = [], this.pluginMap = new Map(), this.editorAttrs = {}, this.contentAttrs = {}, this.bidiCache = [], this.destroyed = !1, this.updateState = 2, this.measureScheduled = -1, this.measureRequests = [], this.contentDOM = document.createElement('div'), this.scrollDOM = document.createElement('div'), this.scrollDOM.tabIndex = -1, this.scrollDOM.className = 'cm-scroller', this.scrollDOM.appendChild(this.contentDOM), this.announceDOM = document.createElement('div'), this.announceDOM.style.cssText = 'position: absolute; top: -10000px', this.announceDOM.setAttribute('aria-live', 'polite'), this.dom = document.createElement('div'), this.dom.appendChild(this.announceDOM), this.dom.appendChild(this.scrollDOM), this._dispatch = e.dispatch || (t => this.update([t])), this.dispatch = this.dispatch.bind(this), this.root = e.root || Td(e.parent) || document, this.viewState = new os(e.state || $.create()), this.plugins = this.state.facet(ji).map(t => new Ji(t)); for (const t of this.plugins)t.update(this); this.observer = new ho(this, (t, n, s) => { gp(this, t, n, s); }, (t) => { this.inputState.runScrollHandlers(this, t), this.observer.intersecting && this.measure(); }), this.inputState = new Kr(this), this.inputState.ensureHandlers(this, this.plugins), this.docView = new ns(this), this.mountStyles(), this.updateAttrs(), this.updateState = 0, this.requestMeasure(), e.parent && e.parent.appendChild(this.dom); }

    get state() { return this.viewState.state; }

    get viewport() { return this.viewState.viewport; }

    get visibleRanges() { return this.viewState.visibleRanges; }

    get inView() { return this.viewState.inView; }

    get composing() { return this.inputState.composing > 0; }

    get compositionStarted() { return this.inputState.composing >= 0; }

    dispatch(...e) { this._dispatch(e.length == 1 && e[0] instanceof ne ? e[0] : this.state.update(...e)); }

    update(e) { if (this.updateState != 0) throw new Error('Calls to EditorView.update are not allowed while an update is in progress'); let t = !1; let n; let s = this.state; for (const o of e) { if (o.startState != s) throw new RangeError("Trying to update state with a transaction that doesn't start from the previous state."); s = o.state; } if (this.destroyed) { this.viewState.state = s; return; } if (s.facet($.phrases) != this.state.facet($.phrases)) return this.setState(s); n = new es(this, s, e); let r = this.viewState.scrollTarget; try { this.updateState = 2; for (const o of e) { if (r && (r = r.map(o.changes)), o.scrollIntoView) { const { main: l } = o.state.selection; r = new mi(l.empty ? l : m.cursor(l.head, l.head > l.anchor ? -1 : 1)); } for (const l of o.effects)l.is(Ma) && (r = l.value); } this.viewState.update(n, r), this.bidiCache = gi.update(this.bidiCache, n.changes), n.empty || (this.updatePlugins(n), this.inputState.update(n)), t = this.docView.update(n), this.state.facet(Gi) != this.styleModules && this.mountStyles(), this.updateAttrs(), this.showAnnouncements(e), this.docView.updateSelection(t, e.some(o => o.isUserEvent('select.pointer'))); } finally { this.updateState = 0; } if (n.startState.facet(Un) != n.state.facet(Un) && (this.viewState.mustMeasureContent = !0), (t || r || this.viewState.mustEnforceCursorAssoc || this.viewState.mustMeasureContent) && this.requestMeasure(), !n.empty) for (const o of this.state.facet(_r))o(n); }

    setState(e) { if (this.updateState != 0) throw new Error('Calls to EditorView.setState are not allowed while an update is in progress'); if (this.destroyed) { this.viewState.state = e; return; } this.updateState = 2; const t = this.hasFocus; try { for (const n of this.plugins)n.destroy(this); this.viewState = new os(e), this.plugins = e.facet(ji).map(n => new Ji(n)), this.pluginMap.clear(); for (const n of this.plugins)n.update(this); this.docView = new ns(this), this.inputState.ensureHandlers(this, this.plugins), this.mountStyles(), this.updateAttrs(), this.bidiCache = []; } finally { this.updateState = 0; }t && this.focus(), this.requestMeasure(); }

    updatePlugins(e) { const t = e.startState.facet(ji); const n = e.state.facet(ji); if (t != n) { const s = []; for (const r of n) { const o = t.indexOf(r); if (o < 0)s.push(new Ji(r)); else { const l = this.plugins[o]; l.mustUpdate = e, s.push(l); } } for (const r of this.plugins)r.mustUpdate != e && r.destroy(this); this.plugins = s, this.pluginMap.clear(), this.inputState.ensureHandlers(this, this.plugins); } else for (const s of this.plugins)s.mustUpdate = e; for (let s = 0; s < this.plugins.length; s++) this.plugins[s].update(this); }

    measure(e = !0) { if (this.destroyed) return; this.measureScheduled > -1 && cancelAnimationFrame(this.measureScheduled), this.measureScheduled = 0, e && this.observer.flush(); let t = null; try { for (let n = 0; ;n++) { this.updateState = 1; const s = this.viewport; const r = this.viewState.measure(this); if (!r && !this.measureRequests.length && this.viewState.scrollTarget == null) break; if (n > 5) { console.warn(this.measureRequests.length ? 'Measure loop restarted more than 5 times' : 'Viewport failed to stabilize'); break; } let o = []; r & 4 || ([this.measureRequests, o] = [o, this.measureRequests]); const l = o.map((f) => { try { return f.read(this); } catch (u) { return ge(this.state, u), Xa; } }); const a = new es(this, this.state); let h = !1; let c = !1; a.flags |= r, t ? t.flags |= r : t = a, this.updateState = 2, a.empty || (this.updatePlugins(a), this.inputState.update(a), this.updateAttrs(), h = this.docView.update(a)); for (let f = 0; f < o.length; f++) if (l[f] != Xa) try { const u = o[f]; u.write && u.write(l[f], this); } catch (u) { ge(this.state, u); } if (this.viewState.scrollTarget && (this.docView.scrollIntoView(this.viewState.scrollTarget), this.viewState.scrollTarget = null, c = !0), h && this.docView.updateSelection(!0), this.viewport.from == s.from && this.viewport.to == s.to && !c && this.measureRequests.length == 0) break; } } finally { this.updateState = 0, this.measureScheduled = -1; } if (t && !t.empty) for (const n of this.state.facet(_r))n(t); }

    get themeClasses() { return `${lo} ${this.state.facet(oo) ? Uh : qh} ${this.state.facet(Un)}`; }

    updateAttrs() {
      const e = Ka(this, Ah, { class: `cm-editor${this.hasFocus ? ' cm-focused ' : ' '}${this.themeClasses}` }); const t = {
        spellcheck: 'false', autocorrect: 'off', autocapitalize: 'off', translate: 'no', contenteditable: this.state.facet(hn) ? 'true' : 'false', class: 'cm-content', style: `${E.tabSize}: ${this.state.tabSize}`, role: 'textbox', 'aria-multiline': 'true',
      }; this.state.readOnly && (t['aria-readonly'] = 'true'), Ka(this, Th, t), this.observer.ignore(() => { qr(this.contentDOM, this.contentAttrs, t), qr(this.dom, this.editorAttrs, e); }), this.editorAttrs = e, this.contentAttrs = t;
    }

    showAnnouncements(e) { let t = !0; for (const n of e) for (const s of n.effects) if (s.is(O.announce)) { t && (this.announceDOM.textContent = ''), t = !1; const r = this.announceDOM.appendChild(document.createElement('div')); r.textContent = s.value; } }

    mountStyles() { this.styleModules = this.state.facet(Gi), Ie.mount(this.root, this.styleModules.concat(dp).reverse()); }

    readMeasured() { if (this.updateState == 2) throw new Error("Reading the editor layout isn't allowed during an update"); this.updateState == 0 && this.measureScheduled > -1 && this.measure(!1); }

    requestMeasure(e) { if (this.measureScheduled < 0 && (this.measureScheduled = requestAnimationFrame(() => this.measure())), e) { if (e.key != null) { for (let t = 0; t < this.measureRequests.length; t++) if (this.measureRequests[t].key === e.key) { this.measureRequests[t] = e; return; } } this.measureRequests.push(e); } }

    plugin(e) { let t = this.pluginMap.get(e); return (t === void 0 || t && t.spec != e) && this.pluginMap.set(e, t = this.plugins.find(n => n.spec == e) || null), t && t.update(this).value; }

    get documentTop() { return this.contentDOM.getBoundingClientRect().top + this.viewState.paddingTop; }

    get documentPadding() { return { top: this.viewState.paddingTop, bottom: this.viewState.paddingBottom }; }

    elementAtHeight(e) { return this.readMeasured(), this.viewState.elementAtHeight(e); }

    lineBlockAtHeight(e) { return this.readMeasured(), this.viewState.lineBlockAtHeight(e); }

    get viewportLineBlocks() { return this.viewState.viewportLines; }

    lineBlockAt(e) { return this.viewState.lineBlockAt(e); }

    get contentHeight() { return this.viewState.contentHeight; }

    moveByChar(e, t, n) { return Tr(this, e, Na(this, e, t, n)); }

    moveByGroup(e, t) { return Tr(this, e, Na(this, e, t, n => Xd(this, e.head, n))); }

    moveToLineBoundary(e, t, n = !0) { return Qd(this, e, t, n); }

    moveVertically(e, t, n) { return Tr(this, e, Kd(this, e, t, n)); }

    domAtPos(e) { return this.docView.domAtPos(e); }

    posAtDOM(e, t = 0) { return this.docView.posFromDOM(e, t); }

    posAtCoords(e, t = !0) { return this.readMeasured(), Nh(this, e, t); }

    coordsAtPos(e, t = 1) { this.readMeasured(); const n = this.docView.coordsAt(e, t); if (!n || n.left == n.right) return n; const s = this.state.doc.lineAt(e); const r = this.bidiSpans(s); const o = r[Tt.find(r, e - s.from, -1, t)]; return us(n, o.dir == G.LTR == t > 0); }

    get defaultCharacterWidth() { return this.viewState.heightOracle.charWidth; }

    get defaultLineHeight() { return this.viewState.heightOracle.lineHeight; }

    get textDirection() { return this.viewState.defaultTextDirection; }

    textDirectionAt(e) { return !this.state.facet(Ch) || e < this.viewport.from || e > this.viewport.to ? this.textDirection : (this.readMeasured(), this.docView.textDirectionAt(e)); }

    get lineWrapping() { return this.viewState.heightOracle.lineWrapping; }

    bidiSpans(e) { if (e.length > wp) return Dh(e.length); const t = this.textDirectionAt(e.from); for (const s of this.bidiCache) if (s.from == e.from && s.dir == t) return s.order; const n = Fd(e.text, t); return this.bidiCache.push(new gi(e.from, e.to, t, n)), n; }

    get hasFocus() { let e; return (document.hasFocus() || E.safari && ((e = this.inputState) === null || e === void 0 ? void 0 : e.lastContextMenu) > Date.now() - 3e4) && this.root.activeElement == this.contentDOM; }

    focus() { this.observer.ignore(() => { hh(this.contentDOM), this.docView.updateSelection(); }); }

    destroy() { for (const e of this.plugins)e.destroy(this); this.plugins = [], this.inputState.destroy(), this.dom.remove(), this.observer.destroy(), this.measureScheduled > -1 && cancelAnimationFrame(this.measureScheduled), this.destroyed = !0; }

    static scrollIntoView(e, t = {}) { return Ma.of(new mi(typeof e === 'number' ? m.cursor(e) : e, t.y, t.x, t.yMargin, t.xMargin)); }

    static domEventHandlers(e) { return q.define(() => ({}), { eventHandlers: e }); }

    static theme(e, t) { const n = Ie.newName(); const s = [Un.of(n), Gi.of(ao(`.${n}`, e))]; return t && t.dark && s.push(oo.of(!0)), s; }

    static baseTheme(e) { return Ye.lowest(Gi.of(ao(`.${lo}`, e, _h))); }
  }; O.styleModule = Gi; O.inputHandler = Sh; O.perLineTextDirection = Ch; O.exceptionSink = Oh; O.updateListener = _r; O.editable = hn; O.mouseSelectionStyle = vh; O.dragMovesSelection = kh; O.clickAddsSelectionRange = wh; O.decorations = on; O.atomicRanges = Ph; O.scrollMargins = Mh; O.darkTheme = oo; O.contentAttributes = Th; O.editorAttributes = Ah; O.lineWrapping = O.contentAttributes.of({ class: 'cm-lineWrapping' }); O.announce = M.define(); var wp = 4096; var Xa = {}; var gi = class {
    constructor(e, t, n, s) { this.from = e, this.to = t, this.dir = n, this.order = s; }

    static update(e, t) { if (t.empty) return e; const n = []; const s = e.length ? e[e.length - 1].dir : G.LTR; for (let r = Math.max(0, e.length - 10); r < e.length; r++) { const o = e[r]; o.dir == s && !t.touchesRange(o.from, o.to) && n.push(new gi(t.mapPos(o.from, 1), t.mapPos(o.to, -1), o.dir, o.order)); } return n; }
  }; function Ka(i, e, t) { for (let n = i.state.facet(e), s = n.length - 1; s >= 0; s--) { const r = n[s]; const o = typeof r === 'function' ? r(i) : r; o && Hr(o, t); } return t; } const kp = E.mac ? 'mac' : E.windows ? 'win' : E.linux ? 'linux' : 'key'; function vp(i, e) { const t = i.split(/-(?!$)/); let n = t[t.length - 1]; n == 'Space' && (n = ' '); let s; let r; let o; let l; for (let a = 0; a < t.length - 1; ++a) { const h = t[a]; if (/^(cmd|meta|m)$/i.test(h))l = !0; else if (/^a(lt)?$/i.test(h))s = !0; else if (/^(c|ctrl|control)$/i.test(h))r = !0; else if (/^s(hift)?$/i.test(h))o = !0; else if (/^mod$/i.test(h))e == 'mac' ? l = !0 : r = !0; else throw new Error(`Unrecognized modifier name: ${h}`); } return s && (n = `Alt-${n}`), r && (n = `Ctrl-${n}`), l && (n = `Meta-${n}`), o && (n = `Shift-${n}`), n; } function Mr(i, e, t) { return e.altKey && (i = `Alt-${i}`), e.ctrlKey && (i = `Ctrl-${i}`), e.metaKey && (i = `Meta-${i}`), t !== !1 && e.shiftKey && (i = `Shift-${i}`), i; } const Op = O.domEventHandlers({ keydown(i, e) { return Zh(jh(e.state), i, e, 'editor'); } }); const Pe = v.define({ enables: Op }); const Ja = new WeakMap(); function jh(i) { const e = i.facet(Pe); let t = Ja.get(e); return t || Ja.set(e, t = Cp(e.reduce((n, s) => n.concat(s), []))), t; } function Gh(i, e, t) { return Zh(jh(i.state), e, i, t); } let Ct = null; const Sp = 4e3; function Cp(i, e = kp) { const t = Object.create(null); const n = Object.create(null); const s = (o, l) => { const a = n[o]; if (a == null)n[o] = l; else if (a != l) throw new Error(`Key binding ${o} is used both as a regular binding and as a multi-stroke prefix`); }; const r = (o, l, a, h) => { const c = t[o] || (t[o] = Object.create(null)); const f = l.split(/ (?!$)/).map(p => vp(p, e)); for (let p = 1; p < f.length; p++) { const g = f.slice(0, p).join(' '); s(g, !0), c[g] || (c[g] = { preventDefault: !0, commands: [(b) => { const y = Ct = { view: b, prefix: g, scope: o }; return setTimeout(() => { Ct == y && (Ct = null); }, Sp), !0; }] }); } const u = f.join(' '); s(u, !1); const d = c[u] || (c[u] = { preventDefault: !1, commands: [] }); d.commands.push(a), h && (d.preventDefault = !0); }; for (const o of i) { const l = o[e] || o.key; if (l) for (const a of o.scope ? o.scope.split(' ') : ['editor'])r(a, l, o.run, o.preventDefault), o.shift && r(a, `Shift-${l}`, o.shift, o.preventDefault); } return t; } function Zh(i, e, t, n) { const s = va(e); const r = s.length == 1 && s != ' '; let o = ''; let l = !1; Ct && Ct.view == t && Ct.scope == n && (o = `${Ct.prefix} `, (l = Ih.indexOf(e.keyCode) < 0) && (Ct = null)); const a = (f) => { if (f) { for (const u of f.commands) if (u(t)) return !0; f.preventDefault && (l = !0); } return !1; }; const h = i[n]; let c; if (h) { if (a(h[o + Mr(s, e, !r)])) return !0; if (r && (e.shiftKey || e.altKey || e.metaKey) && (c = ft[e.keyCode]) && c != s) { if (a(h[o + Mr(c, e, !0)])) return !0; } else if (r && e.shiftKey && a(h[o + Mr(s, e, !0)])) return !0; } return l; } const Qh = !E.ios; const Qi = v.define({ combine(i) { return me(i, { cursorBlinkRate: 1200, drawRangeCursor: !0 }, { cursorBlinkRate: (e, t) => Math.min(e, t), drawRangeCursor: (e, t) => e || t }); } }); function Xh(i = {}) { return [Qi.of(i), Ap, Tp]; } const ls = class {
    constructor(e, t, n, s, r) { this.left = e, this.top = t, this.width = n, this.height = s, this.className = r; }

    draw() { const e = document.createElement('div'); return e.className = this.className, this.adjust(e), e; }

    adjust(e) { e.style.left = `${this.left}px`, e.style.top = `${this.top}px`, this.width >= 0 && (e.style.width = `${this.width}px`), e.style.height = `${this.height}px`; }

    eq(e) { return this.left == e.left && this.top == e.top && this.width == e.width && this.height == e.height && this.className == e.className; }
  }; var Ap = q.fromClass(class {
    constructor(i) { this.view = i, this.rangePieces = [], this.cursors = [], this.measureReq = { read: this.readPos.bind(this), write: this.drawSel.bind(this) }, this.selectionLayer = i.scrollDOM.appendChild(document.createElement('div')), this.selectionLayer.className = 'cm-selectionLayer', this.selectionLayer.setAttribute('aria-hidden', 'true'), this.cursorLayer = i.scrollDOM.appendChild(document.createElement('div')), this.cursorLayer.className = 'cm-cursorLayer', this.cursorLayer.setAttribute('aria-hidden', 'true'), i.requestMeasure(this.measureReq), this.setBlinkRate(); }

    setBlinkRate() { this.cursorLayer.style.animationDuration = `${this.view.state.facet(Qi).cursorBlinkRate}ms`; }

    update(i) { const e = i.startState.facet(Qi) != i.state.facet(Qi); (e || i.selectionSet || i.geometryChanged || i.viewportChanged) && this.view.requestMeasure(this.measureReq), i.transactions.some(t => t.scrollIntoView) && (this.cursorLayer.style.animationName = this.cursorLayer.style.animationName == 'cm-blink' ? 'cm-blink2' : 'cm-blink'), e && this.setBlinkRate(); }

    readPos() { const { state: i } = this.view; const e = i.facet(Qi); const t = i.selection.ranges.map(s => (s.empty ? [] : Pp(this.view, s))).reduce((s, r) => s.concat(r)); const n = []; for (const s of i.selection.ranges) { const r = s == i.selection.main; if (s.empty ? !r || Qh : e.drawRangeCursor) { const o = Mp(this.view, s, r); o && n.push(o); } } return { rangePieces: t, cursors: n }; }

    drawSel({ rangePieces: i, cursors: e }) { if (i.length != this.rangePieces.length || i.some((t, n) => !t.eq(this.rangePieces[n]))) { this.selectionLayer.textContent = ''; for (const t of i) this.selectionLayer.appendChild(t.draw()); this.rangePieces = i; } if (e.length != this.cursors.length || e.some((t, n) => !t.eq(this.cursors[n]))) { const t = this.cursorLayer.children; if (t.length !== e.length) { this.cursorLayer.textContent = ''; for (const n of e) this.cursorLayer.appendChild(n.draw()); } else e.forEach((n, s) => n.adjust(t[s])); this.cursors = e; } }

    destroy() { this.selectionLayer.remove(), this.cursorLayer.remove(); }
  }); const Kh = { '.cm-line': { '& ::selection': { backgroundColor: 'transparent !important' }, '&::selection': { backgroundColor: 'transparent !important' } } }; Qh && (Kh['.cm-line'].caretColor = 'transparent !important'); var Tp = Ye.highest(O.theme(Kh)); function Jh(i) { const e = i.scrollDOM.getBoundingClientRect(); return { left: (i.textDirection == G.LTR ? e.left : e.right - i.scrollDOM.clientWidth) - i.scrollDOM.scrollLeft, top: e.top - i.scrollDOM.scrollTop }; } function Ya(i, e, t) { const n = m.cursor(e); return { from: Math.max(t.from, i.moveToLineBoundary(n, !1, !0).from), to: Math.min(t.to, i.moveToLineBoundary(n, !0, !0).from), type: _.Text }; } function eh(i, e) { const t = i.lineBlockAt(e); if (Array.isArray(t.type)) { for (const n of t.type) if (n.to > e || n.to == e && (n.to == t.to || n.type == _.Text)) return n; } return t; } function Pp(i, e) { if (e.to <= i.viewport.from || e.from >= i.viewport.to) return []; const t = Math.max(e.from, i.viewport.from); const n = Math.min(e.to, i.viewport.to); const s = i.textDirection == G.LTR; const r = i.contentDOM; const o = r.getBoundingClientRect(); const l = Jh(i); const a = window.getComputedStyle(r.firstChild); const h = o.left + parseInt(a.paddingLeft) + Math.min(0, parseInt(a.textIndent)); const c = o.right - parseInt(a.paddingRight); const f = eh(i, t); const u = eh(i, n); let d = f.type == _.Text ? f : null; let p = u.type == _.Text ? u : null; if (i.lineWrapping && (d && (d = Ya(i, t, d)), p && (p = Ya(i, n, p))), d && p && d.from == p.from) return b(y(e.from, e.to, d)); { const P = d ? y(e.from, null, d) : S(f, !1); const k = p ? y(null, e.to, p) : S(u, !0); const C = []; return (d || f).to < (p || u).from - 1 ? C.push(g(h, P.bottom, c, k.top)) : P.bottom < k.top && i.elementAtHeight((P.bottom + k.top) / 2).type == _.Text && (P.bottom = k.top = (P.bottom + k.top) / 2), b(P).concat(C).concat(b(k)); } function g(P, k, C, T) { return new ls(P - l.left, k - l.top - 0.01, C - P, T - k + 0.01, 'cm-selectionBackground'); } function b({ top: P, bottom: k, horizontal: C }) { const T = []; for (let D = 0; D < C.length; D += 2)T.push(g(C[D], P, C[D + 1], k)); return T; } function y(P, k, C) { let T = 1e9; let D = -1e9; const Z = []; function F(Q, te, we, L, N) { const X = i.coordsAtPos(Q, Q == C.to ? -2 : 2); const re = i.coordsAtPos(we, we == C.from ? 2 : -2); T = Math.min(X.top, re.top, T), D = Math.max(X.bottom, re.bottom, D), N == G.LTR ? Z.push(s && te ? h : X.left, s && L ? c : re.right) : Z.push(!s && L ? h : re.left, !s && te ? c : X.right); } const B = P ?? C.from; const W = k ?? C.to; for (const Q of i.visibleRanges) if (Q.to > B && Q.from < W) for (let te = Math.max(Q.from, B), we = Math.min(Q.to, W); ;) { const L = i.state.doc.lineAt(te); for (const N of i.bidiSpans(L)) { const X = N.from + L.from; const re = N.to + L.from; if (X >= we) break; re > te && F(Math.max(X, te), P == null && X <= B, Math.min(re, we), k == null && re >= W, N.dir); } if (te = L.to + 1, te >= we) break; } return Z.length == 0 && F(B, P == null, W, k == null, i.textDirection), { top: T, bottom: D, horizontal: Z }; } function S(P, k) { const C = o.top + (k ? P.top : P.bottom); return { top: C, bottom: C, horizontal: [] }; } } function Mp(i, e, t) { const n = i.coordsAtPos(e.head, e.assoc || 1); if (!n) return null; const s = Jh(i); return new ls(n.left - s.left, n.top - s.top, -1, n.bottom - n.top, t ? 'cm-cursor cm-cursor-primary' : 'cm-cursor cm-cursor-secondary'); } const Yh = M.define({ map(i, e) { return i == null ? null : e.mapPos(i); } }); const Xi = V.define({ create() { return null; }, update(i, e) { return i != null && (i = e.changes.mapPos(i)), e.effects.reduce((t, n) => (n.is(Yh) ? n.value : t), i); } }); const Ep = q.fromClass(class {
    constructor(i) { this.view = i, this.cursor = null, this.measureReq = { read: this.readPos.bind(this), write: this.drawCursor.bind(this) }; }

    update(i) { let e; const t = i.state.field(Xi); t == null ? this.cursor != null && ((e = this.cursor) === null || e === void 0 || e.remove(), this.cursor = null) : (this.cursor || (this.cursor = this.view.scrollDOM.appendChild(document.createElement('div')), this.cursor.className = 'cm-dropCursor'), (i.startState.field(Xi) != t || i.docChanged || i.geometryChanged) && this.view.requestMeasure(this.measureReq)); }

    readPos() { const i = this.view.state.field(Xi); const e = i != null && this.view.coordsAtPos(i); if (!e) return null; const t = this.view.scrollDOM.getBoundingClientRect(); return { left: e.left - t.left + this.view.scrollDOM.scrollLeft, top: e.top - t.top + this.view.scrollDOM.scrollTop, height: e.bottom - e.top }; }

    drawCursor(i) { this.cursor && (i ? (this.cursor.style.left = `${i.left}px`, this.cursor.style.top = `${i.top}px`, this.cursor.style.height = `${i.height}px`) : this.cursor.style.left = '-100000px'); }

    destroy() { this.cursor && this.cursor.remove(); }

    setDropPos(i) { this.view.state.field(Xi) != i && this.view.dispatch({ effects: Yh.of(i) }); }
  }, {
    eventHandlers: {
      dragover(i) { this.setDropPos(this.view.posAtCoords({ x: i.clientX, y: i.clientY })); }, dragleave(i) { (i.target == this.view.contentDOM || !this.view.contentDOM.contains(i.relatedTarget)) && this.setDropPos(null); }, dragend() { this.setDropPos(null); }, drop() { this.setDropPos(null); },
    },
  }); function ec() { return [Xi, Ep]; } function th(i, e, t, n, s) { e.lastIndex = 0; for (let r = i.iterRange(t, n), o = t, l; !r.next().done; o += r.value.length) if (!r.lineBreak) for (;l = e.exec(r.value);)s(o + l.index, o + l.index + l[0].length, l); } function Dp(i, e) { const t = i.visibleRanges; if (t.length == 1 && t[0].from == i.viewport.from && t[0].to == i.viewport.to) return t; const n = []; for (let { from: s, to: r } of t)s = Math.max(i.state.doc.lineAt(s).from, s - e), r = Math.min(i.state.doc.lineAt(r).to, r + e), n.length && n[n.length - 1].to >= s ? n[n.length - 1].to = r : n.push({ from: s, to: r }); return n; } const co = class {
    constructor(e) {
      const {
        regexp: t, decoration: n, boundary: s, maxLength: r = 1e3,
      } = e; if (!t.global) throw new RangeError("The regular expression given to MatchDecorator should have its 'g' flag set"); this.regexp = t, this.getDeco = typeof n === 'function' ? n : () => n, this.boundary = s, this.maxLength = r;
    }

    createDeco(e) { const t = new Ee(); for (const { from: n, to: s } of Dp(e, this.maxLength))th(e.state.doc, this.regexp, n, s, (r, o, l) => t.add(r, o, this.getDeco(l, e, r))); return t.finish(); }

    updateDeco(e, t) { let n = 1e9; let s = -1; return e.docChanged && e.changes.iterChanges((r, o, l, a) => { a > e.view.viewport.from && l < e.view.viewport.to && (n = Math.min(l, n), s = Math.max(a, s)); }), e.viewportChanged || s - n > 1e3 ? this.createDeco(e.view) : s > -1 ? this.updateRange(e.view, t.map(e.changes), n, s) : t; }

    updateRange(e, t, n, s) {
      for (const r of e.visibleRanges) {
        let o = Math.max(r.from, n); let l = Math.min(r.to, s); if (l > o) {
          const a = e.state.doc.lineAt(o); const h = a.to < l ? e.state.doc.lineAt(l) : a; let c = Math.max(r.from, a.from); let f = Math.min(r.to, h.to); if (this.boundary) { for (;o > a.from; o--) if (this.boundary.test(a.text[o - 1 - a.from])) { c = o; break; } for (;l < h.to; l++) if (this.boundary.test(h.text[l - h.from])) { f = l; break; } } const u = []; let d; if (a == h) for (this.regexp.lastIndex = c - a.from; (d = this.regexp.exec(a.text)) && d.index < f - a.from;) { const p = d.index + a.from; u.push(this.getDeco(d, e, p).range(p, p + d[0].length)); } else th(e.state.doc, this.regexp, c, f, (p, g, b) => u.push(this.getDeco(b, e, p).range(p, g))); t = t.update({
            filterFrom: c, filterTo: f, filter: (p, g) => p < c || g > f, add: u,
          });
        }
      } return t;
    }
  }; const fo = /x/.unicode != null ? 'gu' : 'g'; const Lp = new RegExp(`[\0-\b
-\x7F-\x9F\xAD\u061C\u200B\u200E\u200F\u2028\u2029\u202D\u202E\uFEFF\uFFF9-\uFFFC]`, fo); const Rp = {
    0: 'null', 7: 'bell', 8: 'backspace', 10: 'newline', 11: 'vertical tab', 13: 'carriage return', 27: 'escape', 8203: 'zero width space', 8204: 'zero width non-joiner', 8205: 'zero width joiner', 8206: 'left-to-right mark', 8207: 'right-to-left mark', 8232: 'line separator', 8237: 'left-to-right override', 8238: 'right-to-left override', 8233: 'paragraph separator', 65279: 'zero width no-break space', 65532: 'object replacement',
  }; let Er = null; function Bp() { let i; if (Er == null && typeof document < 'u' && document.body) { const e = document.body.style; Er = ((i = e.tabSize) !== null && i !== void 0 ? i : e.MozTabSize) != null; } return Er || !1; } const jn = v.define({ combine(i) { const e = me(i, { render: null, specialChars: Lp, addSpecialChars: null }); return (e.replaceTabs = !Bp()) && (e.specialChars = new RegExp(`	|${e.specialChars.source}`, fo)), e.addSpecialChars && (e.specialChars = new RegExp(`${e.specialChars.source}|${e.addSpecialChars.source}`, fo)), e; } }); function tc(i = {}) { return [jn.of(i), Np()]; } let ih = null; function Np() {
    return ih || (ih = q.fromClass(class {
      constructor(i) { this.view = i, this.decorations = A.none, this.decorationCache = Object.create(null), this.decorator = this.makeDecorator(i.state.facet(jn)), this.decorations = this.decorator.createDeco(i); }

      makeDecorator(i) { return new co({ regexp: i.specialChars, decoration: (e, t, n) => { const { doc: s } = t.state; const r = ae(e[0], 0); if (r == 9) { const o = s.lineAt(n); const l = t.state.tabSize; const a = St(o.text, l, n - o.from); return A.replace({ widget: new po((l - a % l) * this.view.defaultCharacterWidth) }); } return this.decorationCache[r] || (this.decorationCache[r] = A.replace({ widget: new uo(i, r) })); }, boundary: i.replaceTabs ? void 0 : /[^]/ }); }

      update(i) { const e = i.state.facet(jn); i.startState.facet(jn) != e ? (this.decorator = this.makeDecorator(e), this.decorations = this.decorator.createDeco(i.view)) : this.decorations = this.decorator.updateDeco(i, this.decorations); }
    }, { decorations: i => i.decorations }));
  } const $p = '\u2022'; function Ip(i) { return i >= 32 ? $p : i == 10 ? '\u2424' : String.fromCharCode(9216 + i); } var uo = class extends Ae {
    constructor(e, t) { super(), this.options = e, this.code = t; }

    eq(e) { return e.code == this.code; }

    toDOM(e) { const t = Ip(this.code); const n = `${e.state.phrase('Control character')} ${Rp[this.code] || `0x${this.code.toString(16)}`}`; const s = this.options.render && this.options.render(this.code, n, t); if (s) return s; const r = document.createElement('span'); return r.textContent = t, r.title = n, r.setAttribute('aria-label', n), r.className = 'cm-specialChar', r; }

    ignoreEvent() { return !1; }
  }; var po = class extends Ae {
    constructor(e) { super(), this.width = e; }

    eq(e) { return e.width == this.width; }

    toDOM() { const e = document.createElement('span'); return e.textContent = '	', e.className = 'cm-tab', e.style.width = `${this.width}px`, e; }

    ignoreEvent() { return !1; }
  }; function ic() { return zp; } const Fp = A.line({ class: 'cm-activeLine' }); var zp = q.fromClass(class {
    constructor(i) { this.decorations = this.getDeco(i); }

    update(i) { (i.docChanged || i.selectionSet) && (this.decorations = this.getDeco(i.view)); }

    getDeco(i) { let e = -1; const t = []; for (const n of i.state.selection.ranges) { if (!n.empty) return A.none; const s = i.lineBlockAt(n.head); s.from > e && (t.push(Fp.range(s.from)), e = s.from); } return A.set(t); }
  }, { decorations: i => i.decorations }); const mo = 2e3; function Vp(i, e, t) { const n = Math.min(e.line, t.line); const s = Math.max(e.line, t.line); const r = []; if (e.off > mo || t.off > mo || e.col < 0 || t.col < 0) { const o = Math.min(e.off, t.off); const l = Math.max(e.off, t.off); for (let a = n; a <= s; a++) { const h = i.doc.line(a); h.length <= l && r.push(m.range(h.from + o, h.to + l)); } } else { const o = Math.min(e.col, t.col); const l = Math.max(e.col, t.col); for (let a = n; a <= s; a++) { const h = i.doc.line(a); const c = Fn(h.text, o, i.tabSize, !0); if (c > -1) { const f = Fn(h.text, l, i.tabSize); r.push(m.range(h.from + c, h.from + f)); } } } return r; } function Wp(i, e) { const t = i.coordsAtPos(i.viewport.from); return t ? Math.round(Math.abs((t.left - e) / i.defaultCharacterWidth)) : -1; } function nh(i, e) { const t = i.posAtCoords({ x: e.clientX, y: e.clientY }, !1); const n = i.state.doc.lineAt(t); const s = t - n.from; const r = s > mo ? -1 : s == n.length ? Wp(i, e.clientX) : St(n.text, i.state.tabSize, t - n.from); return { line: n.number, col: r, off: s }; } function Hp(i, e) { let t = nh(i, e); let n = i.state.selection; return t ? { update(s) { if (s.docChanged) { const r = s.changes.mapPos(s.startState.doc.line(t.line).from); const o = s.state.doc.lineAt(r); t = { line: o.number, col: t.col, off: Math.min(t.off, o.length) }, n = n.map(s.changes); } }, get(s, r, o) { const l = nh(i, s); if (!l) return n; const a = Vp(i.state, t, l); return a.length ? o ? m.create(a.concat(n.ranges)) : m.create(a) : n; } } : null; } function nc(i) { const e = i?.eventFilter || (t => t.altKey && t.button == 0); return O.mouseSelectionStyle.of((t, n) => (e(n) ? Hp(t, n) : null)); } const qp = {
    Alt: [18, i => i.altKey], Control: [17, i => i.ctrlKey], Shift: [16, i => i.shiftKey], Meta: [91, i => i.metaKey],
  }; const Up = { style: 'cursor: crosshair' }; function sc(i = {}) {
    const [e, t] = qp[i.key || 'Alt']; const n = q.fromClass(class {
      constructor(s) { this.view = s, this.isDown = !1; }

      set(s) { this.isDown != s && (this.isDown = s, this.view.update([])); }
    }, { eventHandlers: { keydown(s) { this.set(s.keyCode == e || t(s)); }, keyup(s) { (s.keyCode == e || !t(s)) && this.set(!1); } } }); return [n, O.contentAttributes.of((s) => { let r; return !((r = s.plugin(n)) === null || r === void 0) && r.isDown ? Up : null; })];
  } const Dr = '-10000px'; const as = class {
    constructor(e, t, n) { this.facet = t, this.createTooltipView = n, this.input = e.state.facet(t), this.tooltips = this.input.filter(s => s), this.tooltipViews = this.tooltips.map(n); }

    update(e) { const t = e.state.facet(this.facet); const n = t.filter(r => r); if (t === this.input) { for (const r of this.tooltipViews)r.update && r.update(e); return !1; } const s = []; for (let r = 0; r < n.length; r++) { const o = n[r]; let l = -1; if (o) { for (let a = 0; a < this.tooltips.length; a++) { const h = this.tooltips[a]; h && h.create == o.create && (l = a); } if (l < 0)s[r] = this.createTooltipView(o); else { const a = s[r] = this.tooltipViews[l]; a.update && a.update(e); } } } for (const r of this.tooltipViews)s.indexOf(r) < 0 && r.dom.remove(); return this.input = t, this.tooltips = n, this.tooltipViews = s, !0; }
  }; function _p() {
    return {
      top: 0, left: 0, bottom: innerHeight, right: innerWidth,
    };
  } const Lr = v.define({ combine: (i) => { let e; let t; let n; return { position: E.ios ? 'absolute' : ((e = i.find(s => s.position)) === null || e === void 0 ? void 0 : e.position) || 'fixed', parent: ((t = i.find(s => s.parent)) === null || t === void 0 ? void 0 : t.parent) || null, tooltipSpace: ((n = i.find(s => s.tooltipSpace)) === null || n === void 0 ? void 0 : n.tooltipSpace) || _p }; } }); const rc = q.fromClass(class {
    constructor(i) { let e; this.view = i, this.inView = !0, this.lastTransaction = 0, this.measureTimeout = -1; const t = i.state.facet(Lr); this.position = t.position, this.parent = t.parent, this.classes = i.themeClasses, this.createContainer(), this.measureReq = { read: this.readMeasure.bind(this), write: this.writeMeasure.bind(this), key: this }, this.manager = new as(i, bi, n => this.createTooltip(n)), this.intersectionObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver((n) => { Date.now() > this.lastTransaction - 50 && n.length > 0 && n[n.length - 1].intersectionRatio < 1 && this.measureSoon(); }, { threshold: [1] }) : null, this.observeIntersection(), (e = i.dom.ownerDocument.defaultView) === null || e === void 0 || e.addEventListener('resize', this.measureSoon = this.measureSoon.bind(this)), this.maybeMeasure(); }

    createContainer() { this.parent ? (this.container = document.createElement('div'), this.container.style.position = 'relative', this.container.className = this.view.themeClasses, this.parent.appendChild(this.container)) : this.container = this.view.dom; }

    observeIntersection() { if (this.intersectionObserver) { this.intersectionObserver.disconnect(); for (const i of this.manager.tooltipViews) this.intersectionObserver.observe(i.dom); } }

    measureSoon() { this.measureTimeout < 0 && (this.measureTimeout = setTimeout(() => { this.measureTimeout = -1, this.maybeMeasure(); }, 50)); }

    update(i) { i.transactions.length && (this.lastTransaction = Date.now()); const e = this.manager.update(i); e && this.observeIntersection(); let t = e || i.geometryChanged; const n = i.state.facet(Lr); if (n.position != this.position) { this.position = n.position; for (const s of this.manager.tooltipViews)s.dom.style.position = this.position; t = !0; } if (n.parent != this.parent) { this.parent && this.container.remove(), this.parent = n.parent, this.createContainer(); for (const s of this.manager.tooltipViews) this.container.appendChild(s.dom); t = !0; } else this.parent && this.view.themeClasses != this.classes && (this.classes = this.container.className = this.view.themeClasses); t && this.maybeMeasure(); }

    createTooltip(i) { const e = i.create(this.view); if (e.dom.classList.add('cm-tooltip'), i.arrow && !e.dom.querySelector('.cm-tooltip > .cm-tooltip-arrow')) { const t = document.createElement('div'); t.className = 'cm-tooltip-arrow', e.dom.appendChild(t); } return e.dom.style.position = this.position, e.dom.style.top = Dr, this.container.appendChild(e.dom), e.mount && e.mount(this.view), e; }

    destroy() { let i; let e; (i = this.view.dom.ownerDocument.defaultView) === null || i === void 0 || i.removeEventListener('resize', this.measureSoon); for (const { dom: t } of this.manager.tooltipViews)t.remove(); (e = this.intersectionObserver) === null || e === void 0 || e.disconnect(), clearTimeout(this.measureTimeout); }

    readMeasure() {
      const i = this.view.dom.getBoundingClientRect(); return {
        editor: i, parent: this.parent ? this.container.getBoundingClientRect() : i, pos: this.manager.tooltips.map((e, t) => { const n = this.manager.tooltipViews[t]; return n.getCoords ? n.getCoords(e.pos) : this.view.coordsAtPos(e.pos); }), size: this.manager.tooltipViews.map(({ dom: e }) => e.getBoundingClientRect()), space: this.view.state.facet(Lr).tooltipSpace(this.view),
      };
    }

    writeMeasure(i) {
      const { editor: e, space: t } = i; const n = []; for (let s = 0; s < this.manager.tooltips.length; s++) {
        const r = this.manager.tooltips[s]; const o = this.manager.tooltipViews[s]; const { dom: l } = o; const a = i.pos[s]; const h = i.size[s]; if (!a || a.bottom <= Math.max(e.top, t.top) || a.top >= Math.min(e.bottom, t.bottom) || a.right < Math.max(e.left, t.left) - 0.1 || a.left > Math.min(e.right, t.right) + 0.1) { l.style.top = Dr; continue; } const c = r.arrow ? o.dom.querySelector('.cm-tooltip-arrow') : null; const f = c ? 7 : 0; const u = h.right - h.left; const d = h.bottom - h.top; const p = o.offset || Gp; const g = this.view.textDirection == G.LTR; const b = h.width > t.right - t.left ? g ? t.left : t.right - h.width : g ? Math.min(a.left - (c ? 14 : 0) + p.x, t.right - u) : Math.max(t.left, a.left - u + (c ? 14 : 0) - p.x); let y = !!r.above; !r.strictSide && (y ? a.top - (h.bottom - h.top) - p.y < t.top : a.bottom + (h.bottom - h.top) + p.y > t.bottom) && y == t.bottom - a.bottom > a.top - t.top && (y = !y); let S = y ? a.top - d - f - p.y : a.bottom + f + p.y; const P = b + u; if (o.overlap !== !0) for (const k of n)k.left < P && k.right > b && k.top < S + d && k.bottom > S && (S = y ? k.top - d - 2 - f : k.bottom + f + 2); this.position == 'absolute' ? (l.style.top = `${S - i.parent.top}px`, l.style.left = `${b - i.parent.left}px`) : (l.style.top = `${S}px`, l.style.left = `${b}px`), c && (c.style.left = `${a.left + (g ? p.x : -p.x) - (b + 14 - 7)}px`), o.overlap !== !0 && n.push({
          left: b, top: S, right: P, bottom: S + d,
        }), l.classList.toggle('cm-tooltip-above', y), l.classList.toggle('cm-tooltip-below', !y), o.positioned && o.positioned();
      }
    }

    maybeMeasure() { if (this.manager.tooltips.length && (this.view.inView && this.view.requestMeasure(this.measureReq), this.inView != this.view.inView && (this.inView = this.view.inView, !this.inView))) for (const i of this.manager.tooltipViews)i.dom.style.top = Dr; }
  }, { eventHandlers: { scroll() { this.maybeMeasure(); } } }); const jp = O.baseTheme({
    '.cm-tooltip': { zIndex: 100 },
    '&light .cm-tooltip': { border: '1px solid #bbb', backgroundColor: '#f5f5f5' },
    '&light .cm-tooltip-section:not(:first-child)': { borderTop: '1px solid #bbb' },
    '&dark .cm-tooltip': { backgroundColor: '#333338', color: 'white' },
    '.cm-tooltip-arrow': {
      height: `${7}px`,
      width: `${7 * 2}px`,
      position: 'absolute',
      zIndex: -1,
      overflow: 'hidden',
      '&:before, &:after': {
        content: "''", position: 'absolute', width: 0, height: 0, borderLeft: `${7}px solid transparent`, borderRight: `${7}px solid transparent`,
      },
      '.cm-tooltip-above &': { bottom: `-${7}px`, '&:before': { borderTop: `${7}px solid #bbb` }, '&:after': { borderTop: `${7}px solid #f5f5f5`, bottom: '1px' } },
      '.cm-tooltip-below &': { top: `-${7}px`, '&:before': { borderBottom: `${7}px solid #bbb` }, '&:after': { borderBottom: `${7}px solid #f5f5f5`, top: '1px' } },
    },
    '&dark .cm-tooltip .cm-tooltip-arrow': { '&:before': { borderTopColor: '#333338', borderBottomColor: '#333338' }, '&:after': { borderTopColor: 'transparent', borderBottomColor: 'transparent' } },
  }); var Gp = { x: 0, y: 0 }; var bi = v.define({ enables: [rc, jp] }); const hs = v.define(); var an = class {
    constructor(e) { this.view = e, this.mounted = !1, this.dom = document.createElement('div'), this.dom.classList.add('cm-tooltip-hover'), this.manager = new as(e, hs, t => this.createHostedView(t)); }

    static create(e) { return new an(e); }

    createHostedView(e) { const t = e.create(this.view); return t.dom.classList.add('cm-tooltip-section'), this.dom.appendChild(t.dom), this.mounted && t.mount && t.mount(this.view), t; }

    mount(e) { for (const t of this.manager.tooltipViews)t.mount && t.mount(e); this.mounted = !0; }

    positioned() { for (const e of this.manager.tooltipViews)e.positioned && e.positioned(); }

    update(e) { this.manager.update(e); }
  }; const Zp = bi.compute([hs], (i) => {
    const e = i.facet(hs).filter(t => t); return e.length === 0 ? null : {
      pos: Math.min(...e.map(t => t.pos)), end: Math.max(...e.filter(t => t.end != null).map(t => t.end)), create: an.create, above: e[0].above, arrow: e.some(t => t.arrow),
    };
  }); const go = class {
    constructor(e, t, n, s, r) {
      this.view = e, this.source = t, this.field = n, this.setHover = s, this.hoverTime = r, this.hoverTimeout = -1, this.restartTimeout = -1, this.pending = null, this.lastMove = {
        x: 0, y: 0, target: e.dom, time: 0,
      }, this.checkHover = this.checkHover.bind(this), e.dom.addEventListener('mouseleave', this.mouseleave = this.mouseleave.bind(this)), e.dom.addEventListener('mousemove', this.mousemove = this.mousemove.bind(this));
    }

    update() { this.pending && (this.pending = null, clearTimeout(this.restartTimeout), this.restartTimeout = setTimeout(() => this.startHover(), 20)); }

    get active() { return this.view.state.field(this.field); }

    checkHover() { if (this.hoverTimeout = -1, this.active) return; const e = Date.now() - this.lastMove.time; e < this.hoverTime ? this.hoverTimeout = setTimeout(this.checkHover, this.hoverTime - e) : this.startHover(); }

    startHover() { let e; clearTimeout(this.restartTimeout); const { lastMove: t } = this; const n = this.view.contentDOM.contains(t.target) ? this.view.posAtCoords(t) : null; if (n == null) return; const s = this.view.coordsAtPos(n); if (s == null || t.y < s.top || t.y > s.bottom || t.x < s.left - this.view.defaultCharacterWidth || t.x > s.right + this.view.defaultCharacterWidth) return; const r = this.view.bidiSpans(this.view.state.doc.lineAt(n)).find(a => a.from <= n && a.to >= n); const o = r && r.dir == G.RTL ? -1 : 1; const l = this.source(this.view, n, t.x < s.left ? -o : o); if (!((e = l) === null || e === void 0) && e.then) { const a = this.pending = { pos: n }; l.then((h) => { this.pending == a && (this.pending = null, h && this.view.dispatch({ effects: this.setHover.of(h) })); }, h => ge(this.view.state, h, 'hover tooltip')); } else l && this.view.dispatch({ effects: this.setHover.of(l) }); }

    mousemove(e) {
      let t; this.lastMove = {
        x: e.clientX, y: e.clientY, target: e.target, time: Date.now(),
      }, this.hoverTimeout < 0 && (this.hoverTimeout = setTimeout(this.checkHover, this.hoverTime)); const n = this.active; if (n && !Qp(this.lastMove.target) || this.pending) { const { pos: s } = n || this.pending; const r = (t = n?.end) !== null && t !== void 0 ? t : s; (s == r ? this.view.posAtCoords(this.lastMove) != s : !Xp(this.view, s, r, e.clientX, e.clientY, 6)) && (this.view.dispatch({ effects: this.setHover.of(null) }), this.pending = null); }
    }

    mouseleave() { clearTimeout(this.hoverTimeout), this.hoverTimeout = -1, this.active && this.view.dispatch({ effects: this.setHover.of(null) }); }

    destroy() { clearTimeout(this.hoverTimeout), this.view.dom.removeEventListener('mouseleave', this.mouseleave), this.view.dom.removeEventListener('mousemove', this.mousemove); }
  }; function Qp(i) { for (let e = i; e; e = e.parentNode) if (e.nodeType == 1 && e.classList.contains('cm-tooltip')) return !0; return !1; } function Xp(i, e, t, n, s, r) { const o = document.createRange(); const l = i.domAtPos(e); const a = i.domAtPos(t); o.setEnd(a.node, a.offset), o.setStart(l.node, l.offset); const h = o.getClientRects(); o.detach(); for (let c = 0; c < h.length; c++) { const f = h[c]; if (Math.max(f.top - s, s - f.bottom, f.left - n, n - f.right) <= r) return !0; } return !1; } function oc(i, e = {}) { const t = M.define(); const n = V.define({ create() { return null; }, update(s, r) { if (s && (e.hideOnChange && (r.docChanged || r.selection) || e.hideOn && e.hideOn(r, s))) return null; if (s && r.docChanged) { const o = r.changes.mapPos(s.pos, -1, oe.TrackDel); if (o == null) return null; const l = Object.assign(Object.create(null), s); l.pos = o, s.end != null && (l.end = r.changes.mapPos(s.end)), s = l; } for (const o of r.effects)o.is(t) && (s = o.value), o.is(Kp) && (s = null); return s; }, provide: s => hs.from(s) }); return [n, q.define(s => new go(s, i, n, t, e.hoverTime || 300)), Zp]; } function lc(i, e) { const t = i.plugin(rc); if (!t) return null; const n = t.manager.tooltips.indexOf(e); return n < 0 ? null : t.manager.tooltipViews[n]; } var Kp = M.define(); const sh = v.define({ combine(i) { let e; let t; for (const n of i)e = e || n.topContainer, t = t || n.bottomContainer; return { topContainer: e, bottomContainer: t }; } }); function jt(i, e) { const t = i.plugin(ac); const n = t ? t.specs.indexOf(e) : -1; return n > -1 ? t.panels[n] : null; } var ac = q.fromClass(class {
    constructor(i) { this.input = i.state.facet(pt), this.specs = this.input.filter(t => t), this.panels = this.specs.map(t => t(i)); const e = i.state.facet(sh); this.top = new fi(i, !0, e.topContainer), this.bottom = new fi(i, !1, e.bottomContainer), this.top.sync(this.panels.filter(t => t.top)), this.bottom.sync(this.panels.filter(t => !t.top)); for (const t of this.panels)t.dom.classList.add('cm-panel'), t.mount && t.mount(); }

    update(i) { const e = i.state.facet(sh); this.top.container != e.topContainer && (this.top.sync([]), this.top = new fi(i.view, !0, e.topContainer)), this.bottom.container != e.bottomContainer && (this.bottom.sync([]), this.bottom = new fi(i.view, !1, e.bottomContainer)), this.top.syncClasses(), this.bottom.syncClasses(); const t = i.state.facet(pt); if (t != this.input) { const n = t.filter(a => a); const s = []; const r = []; const o = []; const l = []; for (const a of n) { const h = this.specs.indexOf(a); let c; h < 0 ? (c = a(i.view), l.push(c)) : (c = this.panels[h], c.update && c.update(i)), s.push(c), (c.top ? r : o).push(c); } this.specs = n, this.panels = s, this.top.sync(r), this.bottom.sync(o); for (const a of l)a.dom.classList.add('cm-panel'), a.mount && a.mount(); } else for (const n of this.panels)n.update && n.update(i); }

    destroy() { this.top.sync([]), this.bottom.sync([]); }
  }, { provide: i => O.scrollMargins.of((e) => { const t = e.plugin(i); return t && { top: t.top.scrollMargin(), bottom: t.bottom.scrollMargin() }; }) }); var fi = class {
    constructor(e, t, n) { this.view = e, this.top = t, this.container = n, this.dom = void 0, this.classes = '', this.panels = [], this.syncClasses(); }

    sync(e) { for (const t of this.panels)t.destroy && e.indexOf(t) < 0 && t.destroy(); this.panels = e, this.syncDOM(); }

    syncDOM() { if (this.panels.length == 0) { this.dom && (this.dom.remove(), this.dom = void 0); return; } if (!this.dom) { this.dom = document.createElement('div'), this.dom.className = this.top ? 'cm-panels cm-panels-top' : 'cm-panels cm-panels-bottom', this.dom.style[this.top ? 'top' : 'bottom'] = '0'; const t = this.container || this.view.dom; t.insertBefore(this.dom, this.top ? t.firstChild : null); } let e = this.dom.firstChild; for (const t of this.panels) if (t.dom.parentNode == this.dom) { for (;e != t.dom;)e = rh(e); e = e.nextSibling; } else this.dom.insertBefore(t.dom, e); for (;e;)e = rh(e); }

    scrollMargin() { return !this.dom || this.container ? 0 : Math.max(0, this.top ? this.dom.getBoundingClientRect().bottom - Math.max(0, this.view.scrollDOM.getBoundingClientRect().top) : Math.min(innerHeight, this.view.scrollDOM.getBoundingClientRect().bottom) - this.dom.getBoundingClientRect().top); }

    syncClasses() { if (!(!this.container || this.classes == this.view.themeClasses)) { for (const e of this.classes.split(' '))e && this.container.classList.remove(e); for (const e of (this.classes = this.view.themeClasses).split(' '))e && this.container.classList.add(e); } }
  }; function rh(i) { const e = i.nextSibling; return i.remove(), e; } var pt = v.define({ enables: ac }); const Te = class extends je {
    compare(e) { return this == e || this.constructor == e.constructor && this.eq(e); }

    eq(e) { return !1; }

    destroy(e) {}
  }; Te.prototype.elementClass = ''; Te.prototype.toDOM = void 0; Te.prototype.mapMode = oe.TrackBefore; Te.prototype.startSide = Te.prototype.endSide = -1; Te.prototype.point = !0; const Gn = v.define(); const Jp = {
    class: '', renderEmptyElements: !1, elementStyle: '', markers: () => I.empty, lineMarker: () => null, lineMarkerChange: null, initialSpacer: null, updateSpacer: null, domEventHandlers: {},
  }; const en = v.define(); function ps(i) { return [hc(), en.of({ ...Jp, ...i })]; } const bo = v.define({ combine: i => i.some(e => e) }); function hc(i) { const e = [Yp]; return i && i.fixed === !1 && e.push(bo.of(!0)), e; } var Yp = q.fromClass(class {
    constructor(i) { this.view = i, this.prevViewport = i.viewport, this.dom = document.createElement('div'), this.dom.className = 'cm-gutters', this.dom.setAttribute('aria-hidden', 'true'), this.dom.style.minHeight = `${this.view.contentHeight}px`, this.gutters = i.state.facet(en).map(e => new cs(i, e)); for (const e of this.gutters) this.dom.appendChild(e.dom); this.fixed = !i.state.facet(bo), this.fixed && (this.dom.style.position = 'sticky'), this.syncGutters(!1), i.scrollDOM.insertBefore(this.dom, i.contentDOM); }

    update(i) { if (this.updateGutters(i)) { const e = this.prevViewport; const t = i.view.viewport; const n = Math.min(e.to, t.to) - Math.max(e.from, t.from); this.syncGutters(n < (t.to - t.from) * 0.8); }i.geometryChanged && (this.dom.style.minHeight = `${this.view.contentHeight}px`), this.view.state.facet(bo) != !this.fixed && (this.fixed = !this.fixed, this.dom.style.position = this.fixed ? 'sticky' : ''), this.prevViewport = i.view.viewport; }

    syncGutters(i) { const e = this.dom.nextSibling; i && this.dom.remove(); const t = I.iter(this.view.state.facet(Gn), this.view.viewport.from); let n = []; const s = this.gutters.map(r => new yo(r, this.view.viewport, -this.view.documentPadding.top)); for (const r of this.view.viewportLineBlocks) { let o; if (Array.isArray(r.type)) { for (const l of r.type) if (l.type == _.Text) { o = l; break; } } else o = r.type == _.Text ? r : void 0; if (o) { n.length && (n = []), cc(t, n, r.from); for (const l of s)l.line(this.view, o, n); } } for (const r of s)r.finish(); i && this.view.scrollDOM.insertBefore(this.dom, e); }

    updateGutters(i) { const e = i.startState.facet(en); const t = i.state.facet(en); let n = i.docChanged || i.heightChanged || i.viewportChanged || !I.eq(i.startState.facet(Gn), i.state.facet(Gn), i.view.viewport.from, i.view.viewport.to); if (e == t) for (const s of this.gutters)s.update(i) && (n = !0); else { n = !0; const s = []; for (const r of t) { const o = e.indexOf(r); o < 0 ? s.push(new cs(this.view, r)) : (this.gutters[o].update(i), s.push(this.gutters[o])); } for (const r of this.gutters)r.dom.remove(), s.indexOf(r) < 0 && r.destroy(); for (const r of s) this.dom.appendChild(r.dom); this.gutters = s; } return n; }

    destroy() { for (const i of this.gutters)i.destroy(); this.dom.remove(); }
  }, { provide: i => O.scrollMargins.of((e) => { const t = e.plugin(i); return !t || t.gutters.length == 0 || !t.fixed ? null : e.textDirection == G.LTR ? { left: t.dom.offsetWidth } : { right: t.dom.offsetWidth }; }) }); function oh(i) { return Array.isArray(i) ? i : [i]; } function cc(i, e, t) { for (;i.value && i.from <= t;)i.from == t && e.push(i.value), i.next(); } var yo = class {
    constructor(e, t, n) { this.gutter = e, this.height = n, this.localMarkers = [], this.i = 0, this.cursor = I.iter(e.markers, t.from); }

    line(e, t, n) { this.localMarkers.length && (this.localMarkers = []), cc(this.cursor, this.localMarkers, t.from); const s = n.length ? this.localMarkers.concat(n) : this.localMarkers; const r = this.gutter.config.lineMarker(e, t, s); r && s.unshift(r); const o = this.gutter; if (s.length == 0 && !o.config.renderEmptyElements) return; const l = t.top - this.height; if (this.i == o.elements.length) { const a = new fs(e, t.height, l, s); o.elements.push(a), o.dom.appendChild(a.dom); } else o.elements[this.i].update(e, t.height, l, s); this.height = t.bottom, this.i++; }

    finish() { const e = this.gutter; for (;e.elements.length > this.i;) { const t = e.elements.pop(); e.dom.removeChild(t.dom), t.destroy(); } }
  }; var cs = class {
    constructor(e, t) { this.view = e, this.config = t, this.elements = [], this.spacer = null, this.dom = document.createElement('div'), this.dom.className = `cm-gutter${this.config.class ? ` ${this.config.class}` : ''}`; for (const n in t.domEventHandlers) this.dom.addEventListener(n, (s) => { const r = e.lineBlockAtHeight(s.clientY - e.documentTop); t.domEventHandlers[n](e, r, s) && s.preventDefault(); }); this.markers = oh(t.markers(e)), t.initialSpacer && (this.spacer = new fs(e, 0, 0, [t.initialSpacer(e)]), this.dom.appendChild(this.spacer.dom), this.spacer.dom.style.cssText += 'visibility: hidden; pointer-events: none'); }

    update(e) { const t = this.markers; if (this.markers = oh(this.config.markers(e.view)), this.spacer && this.config.updateSpacer) { const s = this.config.updateSpacer(this.spacer.markers[0], e); s != this.spacer.markers[0] && this.spacer.update(e.view, 0, 0, [s]); } const n = e.view.viewport; return !I.eq(this.markers, t, n.from, n.to) || (this.config.lineMarkerChange ? this.config.lineMarkerChange(e) : !1); }

    destroy() { for (const e of this.elements)e.destroy(); }
  }; var fs = class {
    constructor(e, t, n, s) { this.height = -1, this.above = 0, this.markers = [], this.dom = document.createElement('div'), this.update(e, t, n, s); }

    update(e, t, n, s) { this.height != t && (this.dom.style.height = `${this.height = t}px`), this.above != n && (this.dom.style.marginTop = (this.above = n) ? `${n}px` : ''), em(this.markers, s) || this.setMarkers(e, s); }

    setMarkers(e, t) { let n = 'cm-gutterElement'; let s = this.dom.firstChild; for (let r = 0, o = 0; ;) { let l = o; const a = r < t.length ? t[r++] : null; let h = !1; if (a) { const c = a.elementClass; c && (n += ` ${c}`); for (let f = o; f < this.markers.length; f++) if (this.markers[f].compare(a)) { l = f, h = !0; break; } } else l = this.markers.length; for (;o < l;) { const c = this.markers[o++]; if (c.toDOM) { c.destroy(s); const f = s.nextSibling; s.remove(), s = f; } } if (!a) break; a.toDOM && (h ? s = s.nextSibling : this.dom.insertBefore(a.toDOM(e), s)), h && o++; } this.dom.className = n, this.markers = t; }

    destroy() { this.setMarkers(null, []); }
  }; function em(i, e) { if (i.length != e.length) return !1; for (let t = 0; t < i.length; t++) if (!i[t].compare(e[t])) return !1; return !0; } const tm = v.define(); const ui = v.define({ combine(i) { return me(i, { formatNumber: String, domEventHandlers: {} }, { domEventHandlers(e, t) { const n = { ...e }; for (const s in t) { const r = n[s]; const o = t[s]; n[s] = r ? (l, a, h) => r(l, a, h) || o(l, a, h) : o; } return n; } }); } }); const tn = class extends Te {
    constructor(e) { super(), this.number = e; }

    eq(e) { return this.number == e.number; }

    toDOM() { return document.createTextNode(this.number); }
  }; function Rr(i, e) { return i.state.facet(ui).formatNumber(e, i.state); } const im = en.compute([ui], i => ({
    class: 'cm-lineNumbers', renderEmptyElements: !1, markers(e) { return e.state.facet(tm); }, lineMarker(e, t, n) { return n.some(s => s.toDOM) ? null : new tn(Rr(e, e.state.doc.lineAt(t.from).number)); }, lineMarkerChange: e => e.startState.facet(ui) != e.state.facet(ui), initialSpacer(e) { return new tn(Rr(e, lh(e.state.doc.lines))); }, updateSpacer(e, t) { const n = Rr(t.view, lh(t.view.state.doc.lines)); return n == e.number ? e : new tn(n); }, domEventHandlers: i.facet(ui).domEventHandlers,
  })); function fc(i = {}) { return [ui.of(i), hc(), im]; } function lh(i) { let e = 9; for (;e < i;)e = e * 10 + 9; return e; } const nm = new class extends Te {constructor() { super(...arguments), this.elementClass = 'cm-activeLineGutter'; }}(); const
    sm = Gn.compute(['selection'], (i) => { const e = []; let t = -1; for (const n of i.selection.ranges) if (n.empty) { const s = i.doc.lineAt(n.head).from; s > t && (t = s, e.push(nm.range(s))); } return I.of(e); }); function uc() { return sm; } let rm = 0; const cn = class {constructor(e, t) { this.from = e, this.to = t; }}; const R = class {
    constructor(e = {}) { this.id = rm++, this.perNode = !!e.perNode, this.deserialize = e.deserialize || (() => { throw new Error("This node type doesn't define a deserialize function"); }); }

    add(e) { if (this.perNode) throw new RangeError("Can't add per-node props to node types"); return typeof e !== 'function' && (e = de.match(e)), (t) => { const n = e(t); return n === void 0 ? null : [this, n]; }; }
  }; R.closedBy = new R({ deserialize: i => i.split(' ') }); R.openedBy = new R({ deserialize: i => i.split(' ') }); R.group = new R({ deserialize: i => i.split(' ') }); R.contextHash = new R({ perNode: !0 }); R.lookAhead = new R({ perNode: !0 }); R.mounted = new R({ perNode: !0 }); const om = Object.create(null); var de = class {
    constructor(e, t, n, s = 0) { this.name = e, this.props = t, this.id = n, this.flags = s; }

    static define(e) { const t = e.props && e.props.length ? Object.create(null) : om; const n = (e.top ? 1 : 0) | (e.skipped ? 2 : 0) | (e.error ? 4 : 0) | (e.name == null ? 8 : 0); const s = new de(e.name || '', t, e.id, n); if (e.props) { for (let r of e.props) if (Array.isArray(r) || (r = r(s)), r) { if (r[0].perNode) throw new RangeError("Can't store a per-node prop on a node type"); t[r[0].id] = r[1]; } } return s; }

    prop(e) { return this.props[e.id]; }

    get isTop() { return (this.flags & 1) > 0; }

    get isSkipped() { return (this.flags & 2) > 0; }

    get isError() { return (this.flags & 4) > 0; }

    get isAnonymous() { return (this.flags & 8) > 0; }

    is(e) { if (typeof e === 'string') { if (this.name == e) return !0; const t = this.prop(R.group); return t ? t.indexOf(e) > -1 : !1; } return this.id == e; }

    static match(e) { const t = Object.create(null); for (const n in e) for (const s of n.split(' '))t[s] = e[n]; return (n) => { for (let s = n.prop(R.group), r = -1; r < (s ? s.length : 0); r++) { const o = t[r < 0 ? n.name : s[r]]; if (o) return o; } }; }
  }; de.none = new de('', Object.create(null), 0, 8); var Gt = class {
    constructor(e) { this.types = e; for (let t = 0; t < e.length; t++) if (e[t].id != t) throw new RangeError('Node type ids should correspond to array positions when creating a node set'); }

    extend(...e) { const t = []; for (const n of this.types) { let s = null; for (const r of e) { const o = r(n); o && (s || (s = { ...n.props }), s[o[0].id] = o[1]); }t.push(s ? new de(n.name, s, n.id, n.flags) : n); } return new Gt(t); }
  }; const ms = new WeakMap(); const dc = new WeakMap(); let fe; (function (i) { i[i.ExcludeBuffers = 1] = 'ExcludeBuffers', i[i.IncludeAnonymous = 2] = 'IncludeAnonymous', i[i.IgnoreMounts = 4] = 'IgnoreMounts', i[i.IgnoreOverlays = 8] = 'IgnoreOverlays'; }(fe || (fe = {}))); var J = class {
    constructor(e, t, n, s, r) { if (this.type = e, this.children = t, this.positions = n, this.length = s, this.props = null, r && r.length) { this.props = Object.create(null); for (const [o, l] of r) this.props[typeof o === 'number' ? o : o.id] = l; } }

    toString() { const e = this.prop(R.mounted); if (e && !e.overlay) return e.tree.toString(); let t = ''; for (const n of this.children) { const s = n.toString(); s && (t && (t += ','), t += s); } return this.type.name ? (/\W/.test(this.type.name) && !this.type.isError ? JSON.stringify(this.type.name) : this.type.name) + (t.length ? `(${t})` : '') : t; }

    cursor(e = 0) { return new xi(this.topNode, e); }

    cursorAt(e, t = 0, n = 0) { const s = ms.get(this) || this.topNode; const r = new xi(s); return r.moveTo(e, t), ms.set(this, r._tree), r; }

    get topNode() { return new Ze(this, 0, 0, null); }

    resolve(e, t = 0) { const n = yi(ms.get(this) || this.topNode, e, t, !1); return ms.set(this, n), n; }

    resolveInner(e, t = 0) { const n = yi(dc.get(this) || this.topNode, e, t, !0); return dc.set(this, n), n; }

    iterate(e) {
      const {
        enter: t, leave: n, from: s = 0, to: r = this.length,
      } = e; for (let o = this.cursor((e.mode || 0) | fe.IncludeAnonymous); ;) { let l = !1; if (o.from <= r && o.to >= s && (o.type.isAnonymous || t(o) !== !1)) { if (o.firstChild()) continue; l = !0; } for (;l && n && !o.type.isAnonymous && n(o), !o.nextSibling();) { if (!o.parent()) return; l = !0; } }
    }

    prop(e) { return e.perNode ? this.props ? this.props[e.id] : void 0 : this.type.prop(e); }

    get propValues() { const e = []; if (this.props) for (const t in this.props)e.push([+t, this.props[t]]); return e; }

    balance(e = {}) { return this.children.length <= 8 ? this : Co(de.none, this.children, this.positions, 0, this.children.length, 0, this.length, (t, n, s) => new J(this.type, t, n, s, this.propValues), e.makeTree || ((t, n, s) => new J(de.none, t, n, s))); }

    static build(e) { return lm(e); }
  }; J.empty = new J(de.none, [], [], 0); var fn = class {
    constructor(e, t) { this.buffer = e, this.index = t; }

    get id() { return this.buffer[this.index - 4]; }

    get start() { return this.buffer[this.index - 3]; }

    get end() { return this.buffer[this.index - 2]; }

    get size() { return this.buffer[this.index - 1]; }

    get pos() { return this.index; }

    next() { this.index -= 4; }

    fork() { return new fn(this.buffer, this.index); }
  }; var mt = class {
    constructor(e, t, n) { this.buffer = e, this.length = t, this.set = n; }

    get type() { return de.none; }

    toString() { const e = []; for (let t = 0; t < this.buffer.length;)e.push(this.childString(t)), t = this.buffer[t + 3]; return e.join(','); }

    childString(e) { const t = this.buffer[e]; const n = this.buffer[e + 3]; const s = this.set.types[t]; let r = s.name; if (/\W/.test(r) && !s.isError && (r = JSON.stringify(r)), e += 4, n == e) return r; const o = []; for (;e < n;)o.push(this.childString(e)), e = this.buffer[e + 3]; return `${r}(${o.join(',')})`; }

    findChild(e, t, n, s, r) { const { buffer: o } = this; let l = -1; for (let a = e; a != t && !(mc(r, s, o[a + 1], o[a + 2]) && (l = a, n > 0)); a = o[a + 3]);return l; }

    slice(e, t, n, s) { const r = this.buffer; const o = new Uint16Array(t - e); for (let l = e, a = 0; l < t;)o[a++] = r[l++], o[a++] = r[l++] - n, o[a++] = r[l++] - n, o[a++] = r[l++] - e; return new mt(o, s - n, this.set); }
  }; function mc(i, e, t, n) { switch (i) { case -2: return t < e; case -1: return n >= e && t < e; case 0: return t < e && n > e; case 1: return t <= e && n > e; case 2: return n > e; case 4: return !0; } } function gc(i, e) { let t = i.childBefore(e); for (;t;) { const n = t.lastChild; if (!n || n.to != t.to) break; n.type.isError && n.from == n.to ? (i = t, t = n.prevSibling) : t = n; } return i; } function yi(i, e, t, n) { for (var s; i.from == i.to || (t < 1 ? i.from >= e : i.from > e) || (t > -1 ? i.to <= e : i.to < e);) { const o = !n && i instanceof Ze && i.index < 0 ? null : i.parent; if (!o) return i; i = o; } const r = n ? 0 : fe.IgnoreOverlays; if (n) for (let o = i, l = o.parent; l; o = l, l = o.parent)o instanceof Ze && o.index < 0 && ((s = l.enter(e, t, r)) === null || s === void 0 ? void 0 : s.from) != o.from && (i = l); for (;;) { const o = i.enter(e, t, r); if (!o) return i; i = o; } } var Ze = class {
    constructor(e, t, n, s) { this._tree = e, this.from = t, this.index = n, this._parent = s; }

    get type() { return this._tree.type; }

    get name() { return this._tree.type.name; }

    get to() { return this.from + this._tree.length; }

    nextChild(e, t, n, s, r = 0) { for (let o = this; ;) { for (let { children: l, positions: a } = o._tree, h = t > 0 ? l.length : -1; e != h; e += t) { const c = l[e]; const f = a[e] + o.from; if (mc(s, n, f, f + c.length)) { if (c instanceof mt) { if (r & fe.ExcludeBuffers) continue; const u = c.findChild(0, c.buffer.length, t, n - f, s); if (u > -1) return new st(new vo(o, c, e, f), null, u); } else if (r & fe.IncludeAnonymous || !c.type.isAnonymous || So(c)) { let u; if (!(r & fe.IgnoreMounts) && c.props && (u = c.prop(R.mounted)) && !u.overlay) return new Ze(u.tree, f, e, o); const d = new Ze(c, f, e, o); return r & fe.IncludeAnonymous || !d.type.isAnonymous ? d : d.nextChild(t < 0 ? c.children.length - 1 : 0, t, n, s); } } } if (r & fe.IncludeAnonymous || !o.type.isAnonymous || (o.index >= 0 ? e = o.index + t : e = t < 0 ? -1 : o._parent._tree.children.length, o = o._parent, !o)) return null; } }

    get firstChild() { return this.nextChild(0, 1, 0, 4); }

    get lastChild() { return this.nextChild(this._tree.children.length - 1, -1, 0, 4); }

    childAfter(e) { return this.nextChild(0, 1, e, 2); }

    childBefore(e) { return this.nextChild(this._tree.children.length - 1, -1, e, -2); }

    enter(e, t, n = 0) { let s; if (!(n & fe.IgnoreOverlays) && (s = this._tree.prop(R.mounted)) && s.overlay) { const r = e - this.from; for (const { from: o, to: l } of s.overlay) if ((t > 0 ? o <= r : o < r) && (t < 0 ? l >= r : l > r)) return new Ze(s.tree, s.overlay[0].from + this.from, -1, this); } return this.nextChild(0, 1, e, t, n); }

    nextSignificantParent() { let e = this; for (;e.type.isAnonymous && e._parent;)e = e._parent; return e; }

    get parent() { return this._parent ? this._parent.nextSignificantParent() : null; }

    get nextSibling() { return this._parent && this.index >= 0 ? this._parent.nextChild(this.index + 1, 1, 0, 4) : null; }

    get prevSibling() { return this._parent && this.index >= 0 ? this._parent.nextChild(this.index - 1, -1, 0, 4) : null; }

    cursor(e = 0) { return new xi(this, e); }

    get tree() { return this._tree; }

    toTree() { return this._tree; }

    resolve(e, t = 0) { return yi(this, e, t, !1); }

    resolveInner(e, t = 0) { return yi(this, e, t, !0); }

    enterUnfinishedNodesBefore(e) { return gc(this, e); }

    getChild(e, t = null, n = null) { const s = bs(this, e, t, n); return s.length ? s[0] : null; }

    getChildren(e, t = null, n = null) { return bs(this, e, t, n); }

    toString() { return this._tree.toString(); }

    get node() { return this; }

    matchContext(e) { return ys(this, e); }
  }; function bs(i, e, t, n) { const s = i.cursor(); const r = []; if (!s.firstChild()) return r; if (t != null) { for (;!s.type.is(t);) if (!s.nextSibling()) return r; } for (;;) { if (n != null && s.type.is(n)) return r; if (s.type.is(e) && r.push(s.node), !s.nextSibling()) return n == null ? r : []; } } function ys(i, e, t = e.length - 1) { for (let n = i.parent; t >= 0; n = n.parent) { if (!n) return !1; if (!n.type.isAnonymous) { if (e[t] && e[t] != n.name) return !1; t--; } } return !0; } var vo = class {constructor(e, t, n, s) { this.parent = e, this.buffer = t, this.index = n, this.start = s; }}; var st = class {
    constructor(e, t, n) { this.context = e, this._parent = t, this.index = n, this.type = e.buffer.set.types[e.buffer.buffer[n]]; }

    get name() { return this.type.name; }

    get from() { return this.context.start + this.context.buffer.buffer[this.index + 1]; }

    get to() { return this.context.start + this.context.buffer.buffer[this.index + 2]; }

    child(e, t, n) { const { buffer: s } = this.context; const r = s.findChild(this.index + 4, s.buffer[this.index + 3], e, t - this.context.start, n); return r < 0 ? null : new st(this.context, this, r); }

    get firstChild() { return this.child(1, 0, 4); }

    get lastChild() { return this.child(-1, 0, 4); }

    childAfter(e) { return this.child(1, e, 2); }

    childBefore(e) { return this.child(-1, e, -2); }

    enter(e, t, n = 0) { if (n & fe.ExcludeBuffers) return null; const { buffer: s } = this.context; const r = s.findChild(this.index + 4, s.buffer[this.index + 3], t > 0 ? 1 : -1, e - this.context.start, t); return r < 0 ? null : new st(this.context, this, r); }

    get parent() { return this._parent || this.context.parent.nextSignificantParent(); }

    externalSibling(e) { return this._parent ? null : this.context.parent.nextChild(this.context.index + e, e, 0, 4); }

    get nextSibling() { const { buffer: e } = this.context; const t = e.buffer[this.index + 3]; return t < (this._parent ? e.buffer[this._parent.index + 3] : e.buffer.length) ? new st(this.context, this._parent, t) : this.externalSibling(1); }

    get prevSibling() { const { buffer: e } = this.context; const t = this._parent ? this._parent.index + 4 : 0; return this.index == t ? this.externalSibling(-1) : new st(this.context, this._parent, e.findChild(t, this.index, -1, 0, 4)); }

    cursor(e = 0) { return new xi(this, e); }

    get tree() { return null; }

    toTree() { const e = []; const t = []; const { buffer: n } = this.context; const s = this.index + 4; const r = n.buffer[this.index + 3]; if (r > s) { const o = n.buffer[this.index + 1]; const l = n.buffer[this.index + 2]; e.push(n.slice(s, r, o, l)), t.push(0); } return new J(this.type, e, t, this.to - this.from); }

    resolve(e, t = 0) { return yi(this, e, t, !1); }

    resolveInner(e, t = 0) { return yi(this, e, t, !0); }

    enterUnfinishedNodesBefore(e) { return gc(this, e); }

    toString() { return this.context.buffer.childString(this.index); }

    getChild(e, t = null, n = null) { const s = bs(this, e, t, n); return s.length ? s[0] : null; }

    getChildren(e, t = null, n = null) { return bs(this, e, t, n); }

    get node() { return this; }

    matchContext(e) { return ys(this, e); }
  }; var xi = class {
    constructor(e, t = 0) { if (this.mode = t, this.buffer = null, this.stack = [], this.index = 0, this.bufferNode = null, e instanceof Ze) this.yieldNode(e); else { this._tree = e.context.parent, this.buffer = e.context; for (let n = e._parent; n; n = n._parent) this.stack.unshift(n.index); this.bufferNode = e, this.yieldBuf(e.index); } }

    get name() { return this.type.name; }

    yieldNode(e) { return e ? (this._tree = e, this.type = e.type, this.from = e.from, this.to = e.to, !0) : !1; }

    yieldBuf(e, t) { this.index = e; const { start: n, buffer: s } = this.buffer; return this.type = t || s.set.types[s.buffer[e]], this.from = n + s.buffer[e + 1], this.to = n + s.buffer[e + 2], !0; }

    yield(e) { return e ? e instanceof Ze ? (this.buffer = null, this.yieldNode(e)) : (this.buffer = e.context, this.yieldBuf(e.index, e.type)) : !1; }

    toString() { return this.buffer ? this.buffer.buffer.childString(this.index) : this._tree.toString(); }

    enterChild(e, t, n) { if (!this.buffer) return this.yield(this._tree.nextChild(e < 0 ? this._tree._tree.children.length - 1 : 0, e, t, n, this.mode)); const { buffer: s } = this.buffer; const r = s.findChild(this.index + 4, s.buffer[this.index + 3], e, t - this.buffer.start, n); return r < 0 ? !1 : (this.stack.push(this.index), this.yieldBuf(r)); }

    firstChild() { return this.enterChild(1, 0, 4); }

    lastChild() { return this.enterChild(-1, 0, 4); }

    childAfter(e) { return this.enterChild(1, e, 2); }

    childBefore(e) { return this.enterChild(-1, e, -2); }

    enter(e, t, n = this.mode) { return this.buffer ? n & fe.ExcludeBuffers ? !1 : this.enterChild(1, e, t) : this.yield(this._tree.enter(e, t, n)); }

    parent() { if (!this.buffer) return this.yieldNode(this.mode & fe.IncludeAnonymous ? this._tree._parent : this._tree.parent); if (this.stack.length) return this.yieldBuf(this.stack.pop()); const e = this.mode & fe.IncludeAnonymous ? this.buffer.parent : this.buffer.parent.nextSignificantParent(); return this.buffer = null, this.yieldNode(e); }

    sibling(e) { if (!this.buffer) return this._tree._parent ? this.yield(this._tree.index < 0 ? null : this._tree._parent.nextChild(this._tree.index + e, e, 0, 4, this.mode)) : !1; const { buffer: t } = this.buffer; const n = this.stack.length - 1; if (e < 0) { const s = n < 0 ? 0 : this.stack[n] + 4; if (this.index != s) return this.yieldBuf(t.findChild(s, this.index, -1, 0, 4)); } else { const s = t.buffer[this.index + 3]; if (s < (n < 0 ? t.buffer.length : t.buffer[this.stack[n] + 3])) return this.yieldBuf(s); } return n < 0 ? this.yield(this.buffer.parent.nextChild(this.buffer.index + e, e, 0, 4, this.mode)) : !1; }

    nextSibling() { return this.sibling(1); }

    prevSibling() { return this.sibling(-1); }

    atLastNode(e) { let t; let n; const { buffer: s } = this; if (s) { if (e > 0) { if (this.index < s.buffer.buffer.length) return !1; } else for (let r = 0; r < this.index; r++) if (s.buffer.buffer[r + 3] < this.index) return !1; ({ index: t, parent: n } = s); } else ({ index: t, _parent: n } = this._tree); for (;n; { index: t, _parent: n } = n) if (t > -1) for (let r = t + e, o = e < 0 ? -1 : n._tree.children.length; r != o; r += e) { const l = n._tree.children[r]; if (this.mode & fe.IncludeAnonymous || l instanceof mt || !l.type.isAnonymous || So(l)) return !1; } return !0; }

    move(e, t) { if (t && this.enterChild(e, 0, 4)) return !0; for (;;) { if (this.sibling(e)) return !0; if (this.atLastNode(e) || !this.parent()) return !1; } }

    next(e = !0) { return this.move(1, e); }

    prev(e = !0) { return this.move(-1, e); }

    moveTo(e, t = 0) { for (;(this.from == this.to || (t < 1 ? this.from >= e : this.from > e) || (t > -1 ? this.to <= e : this.to < e)) && this.parent(););for (;this.enterChild(1, e, t););return this; }

    get node() { if (!this.buffer) return this._tree; const e = this.bufferNode; let t = null; let n = 0; if (e && e.context == this.buffer) { e:for (let s = this.index, r = this.stack.length; r >= 0;) { for (let o = e; o; o = o._parent) if (o.index == s) { if (s == this.index) return o; t = o, n = r + 1; break e; }s = this.stack[--r]; } } for (let s = n; s < this.stack.length; s++)t = new st(this.buffer, t, this.stack[s]); return this.bufferNode = new st(this.buffer, t, this.index); }

    get tree() { return this.buffer ? null : this._tree._tree; }

    iterate(e, t) { for (let n = 0; ;) { let s = !1; if (this.type.isAnonymous || e(this) !== !1) { if (this.firstChild()) { n++; continue; } this.type.isAnonymous || (s = !0); } for (;s && t && t(this), s = this.type.isAnonymous, !this.nextSibling();) { if (!n) return; this.parent(), n--, s = !0; } } }

    matchContext(e) { if (!this.buffer) return ys(this.node, e); const { buffer: t } = this.buffer; const { types: n } = t.set; for (let s = e.length - 1, r = this.stack.length - 1; s >= 0; r--) { if (r < 0) return ys(this.node, e, s); const o = n[t.buffer[this.stack[r]]]; if (!o.isAnonymous) { if (e[s] && e[s] != o.name) return !1; s--; } } return !0; }
  }; function So(i) { return i.children.some(e => e instanceof mt || !e.type.isAnonymous || So(e)); } function lm(i) {
    let e; const {
      buffer: t, nodeSet: n, maxBufferLength: s = 1024, reused: r = [], minRepeatType: o = n.types.length,
    } = i; const l = Array.isArray(t) ? new fn(t, t.length) : t; const a = n.types; let h = 0; let c = 0; function f(k, C, T, D, Z) {
      const {
        id: F, start: B, end: W, size: Q,
      } = l; const te = c; for (;Q < 0;) if (l.next(), Q == -1) { const re = r[F]; T.push(re), D.push(B - k); return; } else if (Q == -3) { h = F; return; } else if (Q == -4) { c = F; return; } else throw new RangeError(`Unrecognized record size: ${Q}`); const we = a[F]; let L; let N; let X = B - k; if (W - B <= s && (N = g(l.pos - C, Z))) { const re = new Uint16Array(N.size - N.skip); const Me = l.pos - N.size; let Ue = re.length; for (;l.pos > Me;)Ue = b(N.start, re, Ue); L = new mt(re, W - N.start, n), X = N.start - k; } else { const re = l.pos - Q; l.next(); const Me = []; const Ue = []; const Je = F >= o ? F : -1; let Se = 0; let _e = W; for (;l.pos > re;)Je >= 0 && l.id == Je && l.size >= 0 ? (l.end <= _e - s && (d(Me, Ue, B, Se, l.end, _e, Je, te), Se = Me.length, _e = l.end), l.next()) : f(B, re, Me, Ue, Je); if (Je >= 0 && Se > 0 && Se < Me.length && d(Me, Ue, B, Se, B, _e, Je, te), Me.reverse(), Ue.reverse(), Je > -1 && Se > 0) { const Ul = u(we); L = Co(we, Me, Ue, 0, Me.length, 0, W - B, Ul, Ul); } else L = p(we, Me, Ue, W - B, te - W); }T.push(L), D.push(X);
    } function u(k) { return (C, T, D) => { let Z = 0; const F = C.length - 1; let B; let W; if (F >= 0 && (B = C[F]) instanceof J) { if (!F && B.type == k && B.length == D) return B; (W = B.prop(R.lookAhead)) && (Z = T[F] + B.length + W); } return p(k, C, T, D, Z); }; } function d(k, C, T, D, Z, F, B, W) { const Q = []; const te = []; for (;k.length > D;)Q.push(k.pop()), te.push(C.pop() + T - Z); k.push(p(n.types[B], Q, te, F - Z, W - F)), C.push(Z - T); } function p(k, C, T, D, Z = 0, F) { if (h) { const B = [R.contextHash, h]; F = F ? [B].concat(F) : [B]; } if (Z > 25) { const B = [R.lookAhead, Z]; F = F ? [B].concat(F) : [B]; } return new J(k, C, T, D, F); } function g(k, C) { const T = l.fork(); let D = 0; let Z = 0; let F = 0; const B = T.end - s; const W = { size: 0, start: 0, skip: 0 }; e:for (let Q = T.pos - k; T.pos > Q;) { const te = T.size; if (T.id == C && te >= 0) { W.size = D, W.start = Z, W.skip = F, F += 4, D += 4, T.next(); continue; } const we = T.pos - te; if (te < 0 || we < Q || T.start < B) break; let L = T.id >= o ? 4 : 0; const N = T.start; for (T.next(); T.pos > we;) { if (T.size < 0) if (T.size == -3)L += 4; else break e; else T.id >= o && (L += 4); T.next(); }Z = N, D += te, F += L; } return (C < 0 || D == k) && (W.size = D, W.start = Z, W.skip = F), W.size > 4 ? W : void 0; } function b(k, C, T) {
      const {
        id: D, start: Z, end: F, size: B,
      } = l; if (l.next(), B >= 0 && D < o) { const W = T; if (B > 4) { const Q = l.pos - (B - 4); for (;l.pos > Q;)T = b(k, C, T); }C[--T] = W, C[--T] = F - k, C[--T] = Z - k, C[--T] = D; } else B == -3 ? h = D : B == -4 && (c = D); return T;
    } const y = []; const S = []; for (;l.pos > 0;)f(i.start || 0, i.bufferStart || 0, y, S, -1); const P = (e = i.length) !== null && e !== void 0 ? e : y.length ? S[0] + y[0].length : 0; return new J(a[i.topID], y.reverse(), S.reverse(), P);
  } const pc = new WeakMap(); function gs(i, e) { if (!i.isAnonymous || e instanceof mt || e.type != i) return 1; let t = pc.get(e); if (t == null) { t = 1; for (const n of e.children) { if (n.type != i || !(n instanceof J)) { t = 1; break; }t += gs(i, n); }pc.set(e, t); } return t; } function Co(i, e, t, n, s, r, o, l, a) { let h = 0; for (let p = n; p < s; p++)h += gs(i, e[p]); const c = Math.ceil(h * 1.5 / 8); const f = []; const u = []; function d(p, g, b, y, S) { for (let P = b; P < y;) { const k = P; const C = g[P]; let T = gs(i, p[P]); for (P++; P < y; P++) { const D = gs(i, p[P]); if (T + D >= c) break; T += D; } if (P == k + 1) { if (T > c) { const D = p[k]; d(D.children, D.positions, 0, D.children.length, g[k] + S); continue; }f.push(p[k]); } else { const D = g[P - 1] + p[P - 1].length - C; f.push(Co(i, p, g, k, P, C, D, null, a)); }u.push(C + S - r); } } return d(e, t, n, s, 0), (l || a)(f, u, o); } var rt = class {
    constructor(e, t, n, s, r = !1, o = !1) { this.from = e, this.to = t, this.tree = n, this.offset = s, this.open = (r ? 1 : 0) | (o ? 2 : 0); }

    get openStart() { return (this.open & 1) > 0; }

    get openEnd() { return (this.open & 2) > 0; }

    static addTree(e, t = [], n = !1) { const s = [new rt(0, e.length, e, 0, !1, n)]; for (const r of t)r.to > e.length && s.push(r); return s; }

    static applyChanges(e, t, n = 128) { if (!t.length) return e; const s = []; let r = 1; let o = e.length ? e[0] : null; for (let l = 0, a = 0, h = 0; ;l++) { const c = l < t.length ? t[l] : null; const f = c ? c.fromA : 1e9; if (f - a >= n) for (;o && o.from < f;) { let u = o; if (a >= u.from || f <= u.to || h) { const d = Math.max(u.from, a) - h; const p = Math.min(u.to, f) - h; u = d >= p ? null : new rt(d, p, u.tree, u.offset + h, l > 0, !!c); } if (u && s.push(u), o.to > f) break; o = r < e.length ? e[r++] : null; } if (!c) break; a = c.toA, h = c.toA - c.toB; } return s; }
  }; const wi = class {
    startParse(e, t, n) { return typeof e === 'string' && (e = new Oo(e)), n = n ? n.length ? n.map(s => new cn(s.from, s.to)) : [new cn(0, 0)] : [new cn(0, e.length)], this.createParse(e, t || [], n); }

    parse(e, t, n) { const s = this.startParse(e, t, n); for (;;) { const r = s.advance(); if (r) return r; } }
  }; var Oo = class {
    constructor(e) { this.string = e; }

    get length() { return this.string.length; }

    chunk(e) { return this.string.slice(e); }

    get lineChunks() { return !1; }

    read(e, t) { return this.string.slice(e, t); }
  }; const xy = new R({ perNode: !0 }); let am = 0; var ze = class {
    constructor(e, t, n) { this.set = e, this.base = t, this.modified = n, this.id = am++; }

    static define(e) { if (e?.base) throw new Error('Can not derive from a modified tag'); const t = new ze([], null, []); if (t.set.push(t), e) for (const n of e.set)t.set.push(n); return t; }

    static defineModifier() { const e = new ki(); return t => (t.modified.indexOf(e) > -1 ? t : ki.get(t.base || t, t.modified.concat(e).sort((n, s) => n.id - s.id))); }
  }; let hm = 0; var ki = class {
    constructor() { this.instances = [], this.id = hm++; }

    static get(e, t) { if (!t.length) return e; const n = t[0].instances.find(l => l.base == e && cm(t, l.modified)); if (n) return n; const s = []; const r = new ze(s, e, t); for (const l of t)l.instances.push(r); const o = xc(t); for (const l of e.set) for (const a of o)s.push(ki.get(l, a)); return r; }
  }; function cm(i, e) { return i.length == e.length && i.every((t, n) => t == e[n]); } function xc(i) { const e = [i]; for (let t = 0; t < i.length; t++) for (const n of xc(i.slice(0, t).concat(i.slice(t + 1))))e.push(n); return e; } function vi(i) { const e = Object.create(null); for (const t in i) { let n = i[t]; Array.isArray(n) || (n = [n]); for (const s of t.split(' ')) if (s) { const r = []; let o = 2; let l = s; for (let f = 0; ;) { if (l == '...' && f > 0 && f + 3 == s.length) { o = 1; break; } const u = /^"(?:[^"\\]|\\.)*?"|[^\/!]+/.exec(l); if (!u) throw new RangeError(`Invalid path: ${s}`); if (r.push(u[0] == '*' ? '' : u[0][0] == '"' ? JSON.parse(u[0]) : u[0]), f += u[0].length, f == s.length) break; const d = s[f++]; if (f == s.length && d == '!') { o = 0; break; } if (d != '/') throw new RangeError(`Invalid path: ${s}`); l = s.slice(f); } const a = r.length - 1; const h = r[a]; if (!h) throw new RangeError(`Invalid path: ${s}`); const c = new To(n, o, a > 0 ? r.slice(0, a) : null); e[h] = c.sort(e[h]); } } return wc.add(e); } var wc = new R(); var
    To = class {
      constructor(e, t, n, s) { this.tags = e, this.mode = t, this.context = n, this.next = s; }

      sort(e) { return !e || e.depth < this.depth ? (this.next = e, this) : (e.next = this.sort(e.next), e); }

      get depth() { return this.context ? this.context.length : 0; }
    }; function Eo(i, e) { const t = Object.create(null); for (const r of i) if (!Array.isArray(r.tag))t[r.tag.id] = r.class; else for (const o of r.tag)t[o.id] = r.class; const { scope: n, all: s = null } = e || {}; return { style: (r) => { let o = s; for (const l of r) for (const a of l.set) { const h = t[a.id]; if (h) { o = o ? `${o} ${h}` : h; break; } } return o; }, scope: n }; } function fm(i, e) { let t = null; for (const n of i) { const s = n.style(e); s && (t = t ? `${t} ${s}` : s); } return t; } function kc(i, e, t, n = 0, s = i.length) { const r = new Po(n, Array.isArray(e) ? e : [e], t); r.highlightRange(i.cursor(), n, s, '', r.highlighters), r.flush(s); } var Po = class {
    constructor(e, t, n) { this.at = e, this.highlighters = t, this.span = n, this.class = ''; }

    startSpan(e, t) { t != this.class && (this.flush(e), e > this.at && (this.at = e), this.class = t); }

    flush(e) { e > this.at && this.class && this.span(this.at, e, this.class); }

    highlightRange(e, t, n, s, r) { const { type: o, from: l, to: a } = e; if (l >= n || a <= t) return; o.isTop && (r = this.highlighters.filter(d => !d.scope || d.scope(o))); let h = s; let c = o.prop(wc); let f = !1; for (;c;) { if (!c.context || e.matchContext(c.context)) { const d = fm(r, c.tags); d && (h && (h += ' '), h += d, c.mode == 1 ? s += (s ? ' ' : '') + d : c.mode == 0 && (f = !0)); break; }c = c.next; } if (this.startSpan(e.from, h), f) return; const u = e.tree && e.tree.prop(R.mounted); if (u && u.overlay) { const d = e.node.enter(u.overlay[0].from + l, 1); const p = this.highlighters.filter(b => !b.scope || b.scope(u.tree.type)); const g = e.firstChild(); for (let b = 0, y = l; ;b++) { const S = b < u.overlay.length ? u.overlay[b] : null; const P = S ? S.from + l : a; const k = Math.max(t, y); const C = Math.min(n, P); if (k < C && g) for (;e.from < C && (this.highlightRange(e, k, C, s, r), this.startSpan(Math.min(n, e.to), h), !(e.to >= P || !e.nextSibling())););if (!S || P > n) break; y = S.to + l, y > t && (this.highlightRange(d.cursor(), Math.max(t, S.from + l), Math.min(n, y), s, p), this.startSpan(y, h)); }g && e.parent(); } else if (e.firstChild()) { do if (!(e.to <= t)) { if (e.from >= n) break; this.highlightRange(e, t, n, s, r), this.startSpan(Math.min(n, e.to), h); } while (e.nextSibling()); e.parent(); } }
  }; const w = ze.define; const xs = w(); const Mt = w(); const bc = w(Mt); const yc = w(Mt); const Et = w(); const ws = w(Et); const Ao = w(Et); const at = w(); const Zt = w(at); const ot = w(); const lt = w(); const Mo = w(); const un = w(Mo); const ks = w(); const x = {
    comment: xs, lineComment: w(xs), blockComment: w(xs), docComment: w(xs), name: Mt, variableName: w(Mt), typeName: bc, tagName: w(bc), propertyName: yc, attributeName: w(yc), className: w(Mt), labelName: w(Mt), namespace: w(Mt), macroName: w(Mt), literal: Et, string: ws, docString: w(ws), character: w(ws), attributeValue: w(ws), number: Ao, integer: w(Ao), float: w(Ao), bool: w(Et), regexp: w(Et), escape: w(Et), color: w(Et), url: w(Et), keyword: ot, self: w(ot), null: w(ot), atom: w(ot), unit: w(ot), modifier: w(ot), operatorKeyword: w(ot), controlKeyword: w(ot), definitionKeyword: w(ot), moduleKeyword: w(ot), operator: lt, derefOperator: w(lt), arithmeticOperator: w(lt), logicOperator: w(lt), bitwiseOperator: w(lt), compareOperator: w(lt), updateOperator: w(lt), definitionOperator: w(lt), typeOperator: w(lt), controlOperator: w(lt), punctuation: Mo, separator: w(Mo), bracket: un, angleBracket: w(un), squareBracket: w(un), paren: w(un), brace: w(un), content: at, heading: Zt, heading1: w(Zt), heading2: w(Zt), heading3: w(Zt), heading4: w(Zt), heading5: w(Zt), heading6: w(Zt), contentSeparator: w(at), list: w(at), quote: w(at), emphasis: w(at), strong: w(at), link: w(at), monospace: w(at), strikethrough: w(at), inserted: w(), deleted: w(), changed: w(), invalid: w(), meta: ks, documentMeta: w(ks), annotation: w(ks), processingInstruction: w(ks), definition: ze.defineModifier(), constant: ze.defineModifier(), function: ze.defineModifier(), standard: ze.defineModifier(), local: ze.defineModifier(), special: ze.defineModifier(),
  }; const vy = Eo([{ tag: x.link, class: 'tok-link' }, { tag: x.heading, class: 'tok-heading' }, { tag: x.emphasis, class: 'tok-emphasis' }, { tag: x.strong, class: 'tok-strong' }, { tag: x.keyword, class: 'tok-keyword' }, { tag: x.atom, class: 'tok-atom' }, { tag: x.bool, class: 'tok-bool' }, { tag: x.url, class: 'tok-url' }, { tag: x.labelName, class: 'tok-labelName' }, { tag: x.inserted, class: 'tok-inserted' }, { tag: x.deleted, class: 'tok-deleted' }, { tag: x.literal, class: 'tok-literal' }, { tag: x.string, class: 'tok-string' }, { tag: x.number, class: 'tok-number' }, { tag: [x.regexp, x.escape, x.special(x.string)], class: 'tok-string2' }, { tag: x.variableName, class: 'tok-variableName' }, { tag: x.local(x.variableName), class: 'tok-variableName tok-local' }, { tag: x.definition(x.variableName), class: 'tok-variableName tok-definition' }, { tag: x.special(x.variableName), class: 'tok-variableName2' }, { tag: x.definition(x.propertyName), class: 'tok-propertyName tok-definition' }, { tag: x.typeName, class: 'tok-typeName' }, { tag: x.namespace, class: 'tok-namespace' }, { tag: x.className, class: 'tok-className' }, { tag: x.macroName, class: 'tok-macroName' }, { tag: x.propertyName, class: 'tok-propertyName' }, { tag: x.operator, class: 'tok-operator' }, { tag: x.comment, class: 'tok-comment' }, { tag: x.meta, class: 'tok-meta' }, { tag: x.invalid, class: 'tok-invalid' }, { tag: x.punctuation, class: 'tok-punctuation' }]); let Do; const mn = new R(); function um(i) { return v.define({ combine: i ? e => e.concat(i) : void 0 }); } const Le = class {
    constructor(e, t, n = []) { this.data = e, $.prototype.hasOwnProperty('tree') || Object.defineProperty($.prototype, 'tree', { get() { return H(this); } }), this.parser = t, this.extension = [Lt.of(this), $.languageData.of((s, r, o) => s.facet(vc(s, r, o)))].concat(n); }

    isActiveAt(e, t, n = -1) { return vc(e, t, n) == this.data; }

    findRegions(e) { const t = e.facet(Lt); if (t?.data == this.data) return [{ from: 0, to: e.doc.length }]; if (!t || !t.allowsNesting) return []; const n = []; const s = (r, o) => { if (r.prop(mn) == this.data) { n.push({ from: o, to: o + r.length }); return; } const l = r.prop(R.mounted); if (l) { if (l.tree.prop(mn) == this.data) { if (l.overlay) for (const a of l.overlay)n.push({ from: a.from + o, to: a.to + o }); else n.push({ from: o, to: o + r.length }); return; } if (l.overlay) { const a = n.length; if (s(l.tree, l.overlay[0].from + o), n.length > a) return; } } for (let a = 0; a < r.children.length; a++) { const h = r.children[a]; h instanceof J && s(h, r.positions[a] + o); } }; return s(H(e), 0), n; }

    get allowsNesting() { return !0; }
  }; Le.setState = M.define(); function vc(i, e, t) { const n = i.facet(Lt); if (!n) return null; let s = n.data; if (n.allowsNesting) for (let r = H(i).topNode; r; r = r.enter(e, t, fe.ExcludeBuffers))s = r.type.prop(mn) || s; return s; } var gt = class extends Le {
    constructor(e, t) { super(e, t), this.parser = t; }

    static define(e) { const t = um(e.languageData); return new gt(t, e.parser.configure({ props: [mn.add(n => (n.isTop ? t : void 0))] })); }

    configure(e) { return new gt(this.data, this.parser.configure(e)); }

    get allowsNesting() { return this.parser.hasWrappers(); }
  }; function H(i) { const e = i.field(Le.state, !1); return e ? e.tree : J.empty; } const No = class {
    constructor(e, t = e.length) { this.doc = e, this.length = t, this.cursorPos = 0, this.string = '', this.cursor = e.iter(); }

    syncTo(e) { return this.string = this.cursor.next(e - this.cursorPos).value, this.cursorPos = e + this.string.length, this.cursorPos - this.string.length; }

    chunk(e) { return this.syncTo(e), this.string; }

    get lineChunks() { return !0; }

    read(e, t) { const n = this.cursorPos - this.string.length; return e < n || t >= this.cursorPos ? this.doc.sliceString(e, t) : this.string.slice(e - n, t - n); }
  }; let dn = null; var gn = class {
    constructor(e, t, n = [], s, r, o, l, a) { this.parser = e, this.state = t, this.fragments = n, this.tree = s, this.treeLen = r, this.viewport = o, this.skipped = l, this.scheduleOn = a, this.parse = null, this.tempSkipped = []; }

    startParse() { return this.parser.startParse(new No(this.state.doc), this.fragments); }

    work(e, t) { return t != null && t >= this.state.doc.length && (t = void 0), this.tree != J.empty && this.isDone(t ?? this.state.doc.length) ? (this.takeTree(), !0) : this.withContext(() => { let n; if (typeof e === 'number') { const s = Date.now() + e; e = () => Date.now() > s; } for (this.parse || (this.parse = this.startParse()), t != null && (this.parse.stoppedAt == null || this.parse.stoppedAt > t) && t < this.state.doc.length && this.parse.stopAt(t); ;) { const s = this.parse.advance(); if (s) if (this.fragments = this.withoutTempSkipped(rt.addTree(s, this.fragments, this.parse.stoppedAt != null)), this.treeLen = (n = this.parse.stoppedAt) !== null && n !== void 0 ? n : this.state.doc.length, this.tree = s, this.parse = null, this.treeLen < (t ?? this.state.doc.length)) this.parse = this.startParse(); else return !0; if (e()) return !1; } }); }

    takeTree() { let e; let t; this.parse && (e = this.parse.parsedPos) >= this.treeLen && ((this.parse.stoppedAt == null || this.parse.stoppedAt > e) && this.parse.stopAt(e), this.withContext(() => { for (;!(t = this.parse.advance());); }), this.treeLen = e, this.tree = t, this.fragments = this.withoutTempSkipped(rt.addTree(this.tree, this.fragments, !0)), this.parse = null); }

    withContext(e) { const t = dn; dn = this; try { return e(); } finally { dn = t; } }

    withoutTempSkipped(e) { for (let t; t = this.tempSkipped.pop();)e = Oc(e, t.from, t.to); return e; }

    changes(e, t) {
      let {
        fragments: n, tree: s, treeLen: r, viewport: o, skipped: l,
      } = this; if (this.takeTree(), !e.empty) {
        const a = []; if (e.iterChangedRanges((h, c, f, u) => a.push({
          fromA: h, toA: c, fromB: f, toB: u,
        })), n = rt.applyChanges(n, a), s = J.empty, r = 0, o = { from: e.mapPos(o.from, -1), to: e.mapPos(o.to, 1) }, this.skipped.length) { l = []; for (const h of this.skipped) { const c = e.mapPos(h.from, 1); const f = e.mapPos(h.to, -1); c < f && l.push({ from: c, to: f }); } }
      } return new gn(this.parser, t, n, s, r, o, l, this.scheduleOn);
    }

    updateViewport(e) { if (this.viewport.from == e.from && this.viewport.to == e.to) return !1; this.viewport = e; const t = this.skipped.length; for (let n = 0; n < this.skipped.length; n++) { const { from: s, to: r } = this.skipped[n]; s < e.to && r > e.from && (this.fragments = Oc(this.fragments, s, r), this.skipped.splice(n--, 1)); } return this.skipped.length >= t ? !1 : (this.reset(), !0); }

    reset() { this.parse && (this.takeTree(), this.parse = null); }

    skipUntilInView(e, t) { this.skipped.push({ from: e, to: t }); }

    static getSkippingParser(e) {
      return new class extends wi {
        createParse(t, n, s) {
          const r = s[0].from; const o = s[s.length - 1].to; return {
            parsedPos: r, advance() { const a = dn; if (a) { for (const h of s)a.tempSkipped.push(h); e && (a.scheduleOn = a.scheduleOn ? Promise.all([a.scheduleOn, e]) : e); } return this.parsedPos = o, new J(de.none, [], [], o - r); }, stoppedAt: null, stopAt() {},
          };
        }
      }();
    }

    isDone(e) { e = Math.min(e, this.state.doc.length); const t = this.fragments; return this.treeLen >= e && t.length && t[0].from == 0 && t[0].to >= e; }

    static get() { return dn; }
  }; function Oc(i, e, t) {
    return rt.applyChanges(i, [{
      fromA: e, toA: t, fromB: e, toB: t,
    }]);
  } var Dt = class {
    constructor(e) { this.context = e, this.tree = e.tree; }

    apply(e) { if (!e.docChanged && this.tree == this.context.tree) return this; const t = this.context.changes(e.changes, e.state); const n = this.context.treeLen == e.startState.doc.length ? void 0 : Math.max(e.changes.mapPos(this.context.treeLen), t.viewport.to); return t.work(20, n) || t.takeTree(), new Dt(t); }

    static init(e) { const t = Math.min(3e3, e.doc.length); const n = new gn(e.facet(Lt).parser, e, [], J.empty, 0, { from: 0, to: t }, [], null); return n.work(20, t) || n.takeTree(), new Dt(n); }
  }; Le.state = V.define({ create: Dt.init, update(i, e) { for (const t of e.effects) if (t.is(Le.setState)) return t.value; return e.startState.facet(Lt) != e.state.facet(Lt) ? Dt.init(e.state) : i.apply(e); } }); let Ac = (i) => { const e = setTimeout(() => i(), 500); return () => clearTimeout(e); }; typeof requestIdleCallback < 'u' && (Ac = (i) => { let e = -1; const t = setTimeout(() => { e = requestIdleCallback(i, { timeout: 500 - 100 }); }, 100); return () => (e < 0 ? clearTimeout(t) : cancelIdleCallback(e)); }); const Lo = typeof navigator < 'u' && ((Do = navigator.scheduling) === null || Do === void 0 ? void 0 : Do.isInputPending) ? () => navigator.scheduling.isInputPending() : null; const dm = q.fromClass(class {
    constructor(e) { this.view = e, this.working = null, this.workScheduled = 0, this.chunkEnd = -1, this.chunkBudget = -1, this.work = this.work.bind(this), this.scheduleWork(); }

    update(e) { const t = this.view.state.field(Le.state).context; (t.updateViewport(e.view.viewport) || this.view.viewport.to > t.treeLen) && this.scheduleWork(), e.docChanged && (this.view.hasFocus && (this.chunkBudget += 50), this.scheduleWork()), this.checkAsyncSchedule(t); }

    scheduleWork() { if (this.working) return; const { state: e } = this.view; const t = e.field(Le.state); (t.tree != t.context.tree || !t.context.isDone(e.doc.length)) && (this.working = Ac(this.work)); }

    work(e) { this.working = null; const t = Date.now(); if (this.chunkEnd < t && (this.chunkEnd < 0 || this.view.hasFocus) && (this.chunkEnd = t + 3e4, this.chunkBudget = 3e3), this.chunkBudget <= 0) return; const { state: n, viewport: { to: s } } = this.view; const r = n.field(Le.state); if (r.tree == r.context.tree && r.context.isDone(s + 1e5)) return; const o = Date.now() + Math.min(this.chunkBudget, 100, e && !Lo ? Math.max(25, e.timeRemaining() - 5) : 1e9); const l = r.context.treeLen < s && n.doc.length > s + 1e3; const a = r.context.work(() => Lo && Lo() || Date.now() > o, s + (l ? 0 : 1e5)); this.chunkBudget -= Date.now() - t, (a || this.chunkBudget <= 0) && (r.context.takeTree(), this.view.dispatch({ effects: Le.setState.of(new Dt(r.context)) })), this.chunkBudget > 0 && !(a && !l) && this.scheduleWork(), this.checkAsyncSchedule(r.context); }

    checkAsyncSchedule(e) { e.scheduleOn && (this.workScheduled++, e.scheduleOn.then(() => this.scheduleWork()).catch(t => ge(this.view.state, t)).then(() => this.workScheduled--), e.scheduleOn = null); }

    destroy() { this.working && this.working(); }

    isWorking() { return !!(this.working || this.workScheduled > 0); }
  }, { eventHandlers: { focus() { this.scheduleWork(); } } }); var Lt = v.define({ combine(i) { return i.length ? i[0] : null; }, enables: [Le.state, dm] }); const Oi = class {constructor(e, t = []) { this.language = e, this.support = t, this.extension = [e, t]; }}; const pm = v.define(); const Ci = v.define({ combine: (i) => { if (!i.length) return '  '; if (!/^(?: +|\t+)$/.test(i[0])) throw new Error(`Invalid indent unit: ${JSON.stringify(i[0])}`); return i[0]; } }); function bn(i) { const e = i.facet(Ci); return e.charCodeAt(0) == 9 ? i.tabSize * e.length : e.length; } function Ai(i, e) { let t = ''; const n = i.tabSize; if (i.facet(Ci).charCodeAt(0) == 9) for (;e >= n;)t += '	', e -= n; for (let s = 0; s < e; s++)t += ' '; return t; } function Ss(i, e) { i instanceof $ && (i = new Qt(i)); for (const n of i.state.facet(pm)) { const s = n(i, e); if (s != null) return s; } const t = H(i.state); return t ? mm(i, t, e) : null; } var Qt = class {
    constructor(e, t = {}) { this.state = e, this.options = t, this.unit = bn(e); }

    lineAt(e, t = 1) { const n = this.state.doc.lineAt(e); const { simulateBreak: s, simulateDoubleBreak: r } = this.options; return s != null && s >= n.from && s <= n.to ? r && s == e ? { text: '', from: e } : (t < 0 ? s < e : s <= e) ? { text: n.text.slice(s - n.from), from: s } : { text: n.text.slice(0, s - n.from), from: n.from } : n; }

    textAfterPos(e, t = 1) { if (this.options.simulateDoubleBreak && e == this.options.simulateBreak) return ''; const { text: n, from: s } = this.lineAt(e, t); return n.slice(e - s, Math.min(n.length, e + 100 - s)); }

    column(e, t = 1) { const { text: n, from: s } = this.lineAt(e, t); let r = this.countColumn(n, e - s); const o = this.options.overrideIndentation ? this.options.overrideIndentation(s) : -1; return o > -1 && (r += o - this.countColumn(n, n.search(/\S|$/))), r; }

    countColumn(e, t = e.length) { return St(e, this.state.tabSize, t); }

    lineIndent(e, t = 1) { const { text: n, from: s } = this.lineAt(e, t); const r = this.options.overrideIndentation; if (r) { const o = r(s); if (o > -1) return o; } return this.countColumn(n, n.search(/\S|$/)); }

    get simulatedBreak() { return this.options.simulateBreak || null; }
  }; const Vo = new R(); function mm(i, e, t) { return Tc(e.resolveInner(t).enterUnfinishedNodesBefore(t), t, i); } function gm(i) { return i.pos == i.options.simulateBreak && i.options.simulateDoubleBreak; } function bm(i) { const e = i.type.prop(Vo); if (e) return e; const t = i.firstChild; let n; if (t && (n = t.type.prop(R.closedBy))) { const s = i.lastChild; const r = s && n.indexOf(s.name) > -1; return o => km(o, !0, 1, void 0, r && !gm(o) ? s.from : void 0); } return i.parent == null ? ym : null; } function Tc(i, e, t) { for (;i; i = i.parent) { const n = bm(i); if (n) return n(new $o(t, e, i)); } return null; } function ym() { return 0; } var $o = class extends Qt {
    constructor(e, t, n) { super(e.state, e.options), this.base = e, this.pos = t, this.node = n; }

    get textAfter() { return this.textAfterPos(this.pos); }

    get baseIndent() { let e = this.state.doc.lineAt(this.node.from); for (;;) { let t = this.node.resolve(e.from); for (;t.parent && t.parent.from == t.from;)t = t.parent; if (xm(t, this.node)) break; e = this.state.doc.lineAt(t.from); } return this.lineIndent(e.from); }

    continue() { const e = this.node.parent; return e ? Tc(e, this.pos, this.base) : 0; }
  }; function xm(i, e) { for (let t = e; t; t = t.parent) if (i == t) return !0; return !1; } function wm(i) { const e = i.node; const t = e.childAfter(e.from); const n = e.lastChild; if (!t) return null; const s = i.options.simulateBreak; const r = i.state.doc.lineAt(t.from); const o = s == null || s <= r.from ? r.to : Math.min(r.to, s); for (let l = t.to; ;) { const a = e.childAfter(l); if (!a || a == n) return null; if (!a.type.isSkipped) return a.from < o ? t : null; l = a.to; } } function km(i, e, t, n, s) { const r = i.textAfter; const o = r.match(/^\s*/)[0].length; const l = n && r.slice(o, o + n.length) == n || s == i.pos + o; const a = e ? wm(i) : null; return a ? l ? i.column(a.from) : i.column(a.to) : i.baseIndent + (l ? 0 : i.unit * t); } const vm = 200; function Pc() { return $.transactionFilter.of((i) => { if (!i.docChanged || !i.isUserEvent('input.type') && !i.isUserEvent('input.complete')) return i; const e = i.startState.languageDataAt('indentOnInput', i.startState.selection.main.head); if (!e.length) return i; const t = i.newDoc; const { head: n } = i.newSelection.main; const s = t.lineAt(n); if (n > s.from + vm) return i; const r = t.sliceString(s.from, n); if (!e.some(h => h.test(r))) return i; const { state: o } = i; let l = -1; const a = []; for (const { head: h } of o.selection.ranges) { const c = o.doc.lineAt(h); if (c.from == l) continue; l = c.from; const f = Ss(o, c.from); if (f == null) continue; const u = /^\s*/.exec(c.text)[0]; const d = Ai(o, f); u != d && a.push({ from: c.from, to: c.from + u.length, insert: d }); } return a.length ? [i, { changes: a, sequential: !0 }] : i; }); } const Om = v.define(); const Wo = new R(); function Sm(i, e, t) { const n = H(i); if (n.length < t) return null; const s = n.resolveInner(t); let r = null; for (let o = s; o; o = o.parent) { if (o.to <= t || o.from > t) continue; if (r && o.from < e) break; const l = o.type.prop(Wo); if (l && (o.to < n.length - 50 || n.length == i.doc.length || !Cm(o))) { const a = l(o, i); a && a.from <= t && a.from >= e && a.to > t && (r = a); } } return r; } function Cm(i) { const e = i.lastChild; return e && e.to == i.to && e.type.isError; } function vs(i, e, t) { for (const n of i.facet(Om)) { const s = n(i, e, t); if (s) return s; } return Sm(i, e, t); } function Mc(i, e) { const t = e.mapPos(i.from, 1); const n = e.mapPos(i.to, -1); return t >= n ? void 0 : { from: t, to: n }; } const Cs = M.define({ map: Mc }); const yn = M.define({ map: Mc }); function Ec(i) { const e = []; for (const { head: t } of i.state.selection.ranges)e.some(n => n.from <= t && n.to >= t) || e.push(i.lineBlockAt(t)); return e; } const Xt = V.define({ create() { return A.none; }, update(i, e) { i = i.map(e.changes); for (const t of e.effects)t.is(Cs) && !Am(i, t.value.from, t.value.to) ? i = i.update({ add: [Lm.range(t.value.from, t.value.to)] }) : t.is(yn) && (i = i.update({ filter: (n, s) => t.value.from != n || t.value.to != s, filterFrom: t.value.from, filterTo: t.value.to })); if (e.selection) { let t = !1; const { head: n } = e.selection.main; i.between(n, n, (s, r) => { s < n && r > n && (t = !0); }), t && (i = i.update({ filterFrom: n, filterTo: n, filter: (s, r) => r <= n || s >= n })); } return i; }, provide: i => O.decorations.from(i) }); function Os(i, e, t) { let n; let s = null; return (n = i.field(Xt, !1)) === null || n === void 0 || n.between(e, t, (r, o) => { (!s || s.from > r) && (s = { from: r, to: o }); }), s; } function Am(i, e, t) { let n = !1; return i.between(e, e, (s, r) => { s == e && r == t && (n = !0); }), n; } function Dc(i, e) { return i.field(Xt, !1) ? e : e.concat(M.appendConfig.of(Nc())); } const Tm = (i) => { for (const e of Ec(i)) { const t = vs(i.state, e.from, e.to); if (t) return i.dispatch({ effects: Dc(i.state, [Cs.of(t), Lc(i, t)]) }), !0; } return !1; }; const Pm = (i) => { if (!i.state.field(Xt, !1)) return !1; const e = []; for (const t of Ec(i)) { const n = Os(i.state, t.from, t.to); n && e.push(yn.of(n), Lc(i, n, !1)); } return e.length && i.dispatch({ effects: e }), e.length > 0; }; function Lc(i, e, t = !0) { const n = i.state.doc.lineAt(e.from).number; const s = i.state.doc.lineAt(e.to).number; return O.announce.of(`${i.state.phrase(t ? 'Folded lines' : 'Unfolded lines')} ${n} ${i.state.phrase('to')} ${s}.`); } const Mm = (i) => { const { state: e } = i; const t = []; for (let n = 0; n < e.doc.length;) { const s = i.lineBlockAt(n); const r = vs(e, s.from, s.to); r && t.push(Cs.of(r)), n = (r ? i.lineBlockAt(r.to) : s).to + 1; } return t.length && i.dispatch({ effects: Dc(i.state, t) }), !!t.length; }; const Em = (i) => { const e = i.state.field(Xt, !1); if (!e || !e.size) return !1; const t = []; return e.between(0, i.state.doc.length, (n, s) => { t.push(yn.of({ from: n, to: s })); }), i.dispatch({ effects: t }), !0; }; const Rc = [{ key: 'Ctrl-Shift-[', mac: 'Cmd-Alt-[', run: Tm }, { key: 'Ctrl-Shift-]', mac: 'Cmd-Alt-]', run: Pm }, { key: 'Ctrl-Alt-[', run: Mm }, { key: 'Ctrl-Alt-]', run: Em }]; const Dm = { placeholderDOM: null, placeholderText: '\u2026' }; const Bc = v.define({ combine(i) { return me(i, Dm); } }); function Nc(i) { const e = [Xt, Bm]; return i && e.push(Bc.of(i)), e; } var Lm = A.replace({ widget: new class extends Ae {toDOM(i) { const { state: e } = i; const t = e.facet(Bc); const n = (r) => { const o = i.lineBlockAt(i.posAtDOM(r.target)); const l = Os(i.state, o.from, o.to); l && i.dispatch({ effects: yn.of(l) }), r.preventDefault(); }; if (t.placeholderDOM) return t.placeholderDOM(i, n); const s = document.createElement('span'); return s.textContent = t.placeholderText, s.setAttribute('aria-label', e.phrase('folded code')), s.title = e.phrase('unfold'), s.className = 'cm-foldPlaceholder', s.onclick = n, s; }}() }); const Rm = {
    openText: '\u2304', closedText: '\u203A', markerDOM: null, domEventHandlers: {},
  }; const pn = class extends Te {
    constructor(e, t) { super(), this.config = e, this.open = t; }

    eq(e) { return this.config == e.config && this.open == e.open; }

    toDOM(e) { if (this.config.markerDOM) return this.config.markerDOM(this.open); const t = document.createElement('span'); return t.textContent = this.open ? this.config.openText : this.config.closedText, t.title = e.state.phrase(this.open ? 'Fold line' : 'Unfold line'), t; }
  }; function $c(i = {}) {
    const e = { ...Rm, ...i }; const t = new pn(e, !0); const n = new pn(e, !1); const s = q.fromClass(class {
      constructor(o) { this.from = o.viewport.from, this.markers = this.buildMarkers(o); }

      update(o) { (o.docChanged || o.viewportChanged || o.startState.facet(Lt) != o.state.facet(Lt) || o.startState.field(Xt, !1) != o.state.field(Xt, !1) || H(o.startState) != H(o.state)) && (this.markers = this.buildMarkers(o.view)); }

      buildMarkers(o) { const l = new Ee(); for (const a of o.viewportLineBlocks) { const h = Os(o.state, a.from, a.to) ? n : vs(o.state, a.from, a.to) ? t : null; h && l.add(a.from, a.from, h); } return l.finish(); }
    }); const { domEventHandlers: r } = e; return [s, ps({
      class: 'cm-foldGutter', markers(o) { let l; return ((l = o.plugin(s)) === null || l === void 0 ? void 0 : l.markers) || I.empty; }, initialSpacer() { return new pn(e, !1); }, domEventHandlers: { ...r, click: (o, l, a) => { if (r.click && r.click(o, l, a)) return !0; const h = Os(o.state, l.from, l.to); if (h) return o.dispatch({ effects: yn.of(h) }), !0; const c = vs(o.state, l.from, l.to); return c ? (o.dispatch({ effects: Cs.of(c) }), !0) : !1; } },
    }), Nc()];
  } var Bm = O.baseTheme({
    '.cm-foldPlaceholder': {
      backgroundColor: '#eee', border: '1px solid #ddd', color: '#888', borderRadius: '.2em', margin: '0 1px', padding: '0 1px', cursor: 'pointer',
    },
    '.cm-foldGutter span': { padding: '0 1px', cursor: 'pointer' },
  }); var Si = class {
    constructor(e, t) { let n; function s(o) { const l = Ie.newName(); return (n || (n = Object.create(null)))[`.${l}`] = o, l; } const r = t.scope; this.scope = r instanceof Le ? o => o.prop(mn) == r.data : r ? o => o == r : void 0, this.style = Eo(e.map(o => ({ tag: o.tag, class: o.class || s({ ...o, tag: null }) })), { all: typeof t.all === 'string' ? t.all : t.all ? s(t.all) : void 0 }).style, this.module = n ? new Ie(n) : null, this.themeType = t.themeType; }

    static define(e, t) { return new Si(e, t || {}); }
  }; const Io = v.define(); const Ic = v.define({ combine(i) { return i.length ? [i[0]] : null; } }); function Ro(i) { const e = i.facet(Io); return e.length ? e : i.facet(Ic); } function Fc(i, e) { const t = [Nm]; let n; return i instanceof Si && (i.module && t.push(O.styleModule.of(i.module)), n = i.themeType), e?.fallback ? t.push(Ic.of(i)) : n ? t.push(Io.computeN([O.darkTheme], s => (s.facet(O.darkTheme) == (n == 'dark') ? [i] : []))) : t.push(Io.of(i)), t; } const Fo = class {
    constructor(e) { this.markCache = Object.create(null), this.tree = H(e.state), this.decorations = this.buildDeco(e, Ro(e.state)); }

    update(e) { const t = H(e.state); const n = Ro(e.state); const s = n != Ro(e.startState); t.length < e.view.viewport.to && !s && t.type == this.tree.type ? this.decorations = this.decorations.map(e.changes) : (t != this.tree || e.viewportChanged || s) && (this.tree = t, this.decorations = this.buildDeco(e.view, n)); }

    buildDeco(e, t) { if (!t || !this.tree.length) return A.none; const n = new Ee(); for (const { from: s, to: r } of e.visibleRanges)kc(this.tree, t, (o, l, a) => { n.add(o, l, this.markCache[a] || (this.markCache[a] = A.mark({ class: a }))); }, s, r); return n.finish(); }
  }; var Nm = Ye.high(q.fromClass(Fo, { decorations: i => i.decorations })); const zc = Si.define([{ tag: x.meta, color: '#7a757a' }, { tag: x.link, textDecoration: 'underline' }, { tag: x.heading, textDecoration: 'underline', fontWeight: 'bold' }, { tag: x.emphasis, fontStyle: 'italic' }, { tag: x.strong, fontWeight: 'bold' }, { tag: x.strikethrough, textDecoration: 'line-through' }, { tag: x.keyword, color: '#708' }, { tag: [x.atom, x.bool, x.url, x.contentSeparator, x.labelName], color: '#219' }, { tag: [x.literal, x.inserted], color: '#164' }, { tag: [x.string, x.deleted], color: '#a11' }, { tag: [x.regexp, x.escape, x.special(x.string)], color: '#e40' }, { tag: x.definition(x.variableName), color: '#00f' }, { tag: x.local(x.variableName), color: '#30a' }, { tag: [x.typeName, x.namespace], color: '#085' }, { tag: x.className, color: '#167' }, { tag: [x.special(x.variableName), x.macroName], color: '#256' }, { tag: x.definition(x.propertyName), color: '#00c' }, { tag: x.comment, color: '#940' }, { tag: x.invalid, color: '#f00' }]); const $m = O.baseTheme({ '&.cm-focused .cm-matchingBracket': { backgroundColor: '#328c8252' }, '&.cm-focused .cm-nonmatchingBracket': { backgroundColor: '#bb555544' } }); const Vc = 1e4; const Wc = '()[]{}'; const Hc = v.define({
    combine(i) {
      return me(i, {
        afterCursor: !0, brackets: Wc, maxScanDistance: Vc, renderMatch: zm,
      });
    },
  }); const Im = A.mark({ class: 'cm-matchingBracket' }); const Fm = A.mark({ class: 'cm-nonmatchingBracket' }); function zm(i) { const e = []; const t = i.matched ? Im : Fm; return e.push(t.range(i.start.from, i.start.to)), i.end && e.push(t.range(i.end.from, i.end.to)), e; } const Vm = V.define({ create() { return A.none; }, update(i, e) { if (!e.docChanged && !e.selection) return i; let t = []; const n = e.state.facet(Hc); for (const s of e.state.selection.ranges) { if (!s.empty) continue; const r = Qe(e.state, s.head, -1, n) || s.head > 0 && Qe(e.state, s.head - 1, 1, n) || n.afterCursor && (Qe(e.state, s.head, 1, n) || s.head < e.state.doc.length && Qe(e.state, s.head + 1, -1, n)); r && (t = t.concat(n.renderMatch(r, e.state))); } return A.set(t, !0); }, provide: i => O.decorations.from(i) }); const Wm = [Vm, $m]; function qc(i = {}) { return [Hc.of(i), Wm]; } function zo(i, e, t) { const n = i.prop(e < 0 ? R.openedBy : R.closedBy); if (n) return n; if (i.name.length == 1) { const s = t.indexOf(i.name); if (s > -1 && s % 2 == (e < 0 ? 1 : 0)) return [t[s + e]]; } return null; } function Qe(i, e, t, n = {}) { const s = n.maxScanDistance || Vc; const r = n.brackets || Wc; const o = H(i); const l = o.resolveInner(e, t); for (let a = l; a; a = a.parent) { const h = zo(a.type, t, r); if (h && a.from < a.to) return Hm(i, e, t, a, h, r); } return qm(i, e, t, o, l.type, s, r); } function Hm(i, e, t, n, s, r) { const o = n.parent; const l = { from: n.from, to: n.to }; let a = 0; const h = o?.cursor(); if (h && (t < 0 ? h.childBefore(n.from) : h.childAfter(n.to))) do if (t < 0 ? h.to <= n.from : h.from >= n.to) { if (a == 0 && s.indexOf(h.type.name) > -1 && h.from < h.to) return { start: l, end: { from: h.from, to: h.to }, matched: !0 }; if (zo(h.type, t, r))a++; else if (zo(h.type, -t, r) && (a--, a == 0)) return { start: l, end: h.from == h.to ? void 0 : { from: h.from, to: h.to }, matched: !1 }; } while (t < 0 ? h.prevSibling() : h.nextSibling()); return { start: l, matched: !1 }; } function qm(i, e, t, n, s, r, o) { const l = t < 0 ? i.sliceDoc(e - 1, e) : i.sliceDoc(e, e + 1); const a = o.indexOf(l); if (a < 0 || a % 2 == 0 != t > 0) return null; const h = { from: t < 0 ? e - 1 : e, to: t > 0 ? e + 1 : e }; const c = i.doc.iterRange(e, t > 0 ? i.doc.length : 0); let f = 0; for (let u = 0; !c.next().done && u <= r;) { const d = c.value; t < 0 && (u += d.length); const p = e + u * t; for (let g = t > 0 ? 0 : d.length - 1, b = t > 0 ? d.length : -1; g != b; g += t) { const y = o.indexOf(d[g]); if (!(y < 0 || n.resolve(p + g, 1).type != s)) if (y % 2 == 0 == t > 0)f++; else { if (f == 1) return { start: h, end: { from: p + g, to: p + g + 1 }, matched: y >> 1 == a >> 1 }; f--; } }t > 0 && (u += d.length); } return c.done ? { start: h, matched: !1 } : null; } const Um = Object.create(null); const Sc = [de.none]; const Cc = []; const _m = Object.create(null); for (const [i, e] of [['variable', 'variableName'], ['variable-2', 'variableName.special'], ['string-2', 'string.special'], ['def', 'variableName.definition'], ['tag', 'typeName'], ['attribute', 'propertyName'], ['type', 'typeName'], ['builtin', 'variableName.standard'], ['qualifier', 'modifier'], ['error', 'invalid'], ['header', 'heading'], ['property', 'propertyName']])_m[i] = jm(Um, e); function Bo(i, e) { Cc.indexOf(i) > -1 || (Cc.push(i), console.warn(e)); } function jm(i, e) { let t = null; for (const r of e.split('.')) { const o = i[r] || x[r]; o ? typeof o === 'function' ? t ? t = o(t) : Bo(r, `Modifier ${r} used at start of tag`) : t ? Bo(r, `Tag ${r} used as modifier`) : t = o : Bo(r, `Unknown highlighting tag ${r}`); } if (!t) return 0; const n = e.replace(/ /g, '_'); const s = de.define({ id: Sc.length, name: n, props: [vi({ [n]: t })] }); return Sc.push(s), s.id; } const Gm = (i) => { const e = Go(i.state); return e.line ? Zm(i) : e.block ? Xm(i) : !1; }; function jo(i, e) { return ({ state: t, dispatch: n }) => { if (t.readOnly) return !1; const s = i(e, t); return s ? (n(t.update(s)), !0) : !1; }; } var Zm = jo(Ym, 0); const Qm = jo(tf, 0); var Xm = jo((i, e) => tf(i, e, Jm(e)), 0); function Go(i, e = i.selection.main.head) { const t = i.languageDataAt('commentTokens', e); return t.length ? t[0] : {}; } const xn = 50; function Km(i, { open: e, close: t }, n, s) { const r = i.sliceDoc(n - xn, n); const o = i.sliceDoc(s, s + xn); const l = /\s*$/.exec(r)[0].length; const a = /^\s*/.exec(o)[0].length; const h = r.length - l; if (r.slice(h - e.length, h) == e && o.slice(a, a + t.length) == t) return { open: { pos: n - l, margin: l && 1 }, close: { pos: s + a, margin: a && 1 } }; let c; let f; s - n <= 2 * xn ? c = f = i.sliceDoc(n, s) : (c = i.sliceDoc(n, n + xn), f = i.sliceDoc(s - xn, s)); const u = /^\s*/.exec(c)[0].length; const d = /\s*$/.exec(f)[0].length; const p = f.length - d - t.length; return c.slice(u, u + e.length) == e && f.slice(p, p + t.length) == t ? { open: { pos: n + u + e.length, margin: /\s/.test(c.charAt(u + e.length)) ? 1 : 0 }, close: { pos: s - d - t.length, margin: /\s/.test(f.charAt(p - 1)) ? 1 : 0 } } : null; } function Jm(i) { const e = []; for (const t of i.selection.ranges) { const n = i.doc.lineAt(t.from); const s = t.to <= n.to ? n : i.doc.lineAt(t.to); const r = e.length - 1; r >= 0 && e[r].to > n.from ? e[r].to = s.to : e.push({ from: n.from, to: s.to }); } return e; } function tf(i, e, t = e.selection.ranges) { const n = t.map(r => Go(e, r.from).block); if (!n.every(r => r)) return null; const s = t.map((r, o) => Km(e, n[o], r.from, r.to)); if (i != 2 && !s.every(r => r)) return { changes: e.changes(t.map((r, o) => (s[o] ? [] : [{ from: r.from, insert: `${n[o].open} ` }, { from: r.to, insert: ` ${n[o].close}` }]))) }; if (i != 1 && s.some(r => r)) { const r = []; for (let o = 0, l; o < s.length; o++) if (l = s[o]) { const a = n[o]; const { open: h, close: c } = l; r.push({ from: h.pos - a.open.length, to: h.pos + h.margin }, { from: c.pos - c.margin, to: c.pos + a.close.length }); } return { changes: r }; } return null; } function Ym(i, e, t = e.selection.ranges) {
    const n = []; let s = -1; for (const { from: r, to: o } of t) {
      const l = n.length; let a = 1e9; for (let h = r; h <= o;) {
        const c = e.doc.lineAt(h); if (c.from > s && (r == o || o > c.from)) {
          s = c.from; const f = Go(e, h).line; if (!f) continue; const u = /^\s*/.exec(c.text)[0].length; const d = u == c.length; const p = c.text.slice(u, u + f.length) == f ? u : -1; u < c.text.length && u < a && (a = u), n.push({
            line: c, comment: p, token: f, indent: u, empty: d, single: !1,
          });
        }h = c.to + 1;
      } if (a < 1e9) for (let h = l; h < n.length; h++)n[h].indent < n[h].line.text.length && (n[h].indent = a); n.length == l + 1 && (n[l].single = !0);
    } if (i != 2 && n.some(r => r.comment < 0 && (!r.empty || r.single))) {
      const r = []; for (const {
        line: l, token: a, indent: h, empty: c, single: f,
      } of n)(f || !c) && r.push({ from: l.from + h, insert: `${a} ` }); const o = e.changes(r); return { changes: o, selection: e.selection.map(o, 1) };
    } if (i != 1 && n.some(r => r.comment >= 0)) { const r = []; for (const { line: o, comment: l, token: a } of n) if (l >= 0) { const h = o.from + l; let c = h + a.length; o.text[c - o.from] == ' ' && c++, r.push({ from: h, to: c }); } return { changes: r }; } return null;
  } const qo = $e.define(); const eg = $e.define(); const tg = v.define(); const nf = v.define({ combine(i) { return me(i, { minDepth: 100, newGroupDelay: 500 }, { minDepth: Math.max, newGroupDelay: Math.min }); } }); function ig(i) { let e = 0; return i.iterChangedRanges((t, n) => e = n), e; } const sf = V.define({
    create() { return We.empty; }, update(i, e) { const t = e.state.facet(nf); const n = e.annotation(qo); if (n) { const a = e.docChanged ? m.single(ig(e.changes)) : void 0; const h = ye.fromTransaction(e, a); const c = n.side; let f = c == 0 ? i.undone : i.done; return h ? f = As(f, f.length, t.minDepth, h) : f = hf(f, e.startState.selection), new We(c == 0 ? n.rest : f, c == 0 ? f : n.rest); } const s = e.annotation(eg); if ((s == 'full' || s == 'before') && (i = i.isolate()), e.annotation(ne.addToHistory) === !1) return e.changes.empty ? i : i.addMapping(e.changes.desc); const r = ye.fromTransaction(e); const o = e.annotation(ne.time); const l = e.annotation(ne.userEvent); return r ? i = i.addChanges(r, o, l, t.newGroupDelay, t.minDepth) : e.selection && (i = i.addSelection(e.startState.selection, o, l, t.newGroupDelay)), (s == 'full' || s == 'after') && (i = i.isolate()), i; }, toJSON(i) { return { done: i.done.map(e => e.toJSON()), undone: i.undone.map(e => e.toJSON()) }; }, fromJSON(i) { return new We(i.done.map(ye.fromJSON), i.undone.map(ye.fromJSON)); },
  }); function rf(i = {}) { return [sf, nf.of(i), O.domEventHandlers({ beforeinput(e, t) { const n = e.inputType == 'historyUndo' ? of : e.inputType == 'historyRedo' ? lf : null; return n ? (e.preventDefault(), n(t)) : !1; } })]; } function Ts(i, e) { return function ({ state: t, dispatch: n }) { if (!e && t.readOnly) return !1; const s = t.field(sf, !1); if (!s) return !1; const r = s.pop(i, t, e); return r ? (n(r), !0) : !1; }; } var of = Ts(0, !1); var lf = Ts(1, !1); const ng = Ts(0, !0); const sg = Ts(1, !0); var ye = class {
    constructor(e, t, n, s, r) { this.changes = e, this.effects = t, this.mapped = n, this.startSelection = s, this.selectionsAfter = r; }

    setSelAfter(e) { return new ye(this.changes, this.effects, this.mapped, this.startSelection, e); }

    toJSON() {
      let e; let t; let n; return {
        changes: (e = this.changes) === null || e === void 0 ? void 0 : e.toJSON(), mapped: (t = this.mapped) === null || t === void 0 ? void 0 : t.toJSON(), startSelection: (n = this.startSelection) === null || n === void 0 ? void 0 : n.toJSON(), selectionsAfter: this.selectionsAfter.map(s => s.toJSON()),
      };
    }

    static fromJSON(e) { return new ye(e.changes && ie.fromJSON(e.changes), [], e.mapped && Ne.fromJSON(e.mapped), e.startSelection && m.fromJSON(e.startSelection), e.selectionsAfter.map(m.fromJSON)); }

    static fromTransaction(e, t) { let n = Ve; for (const s of e.startState.facet(tg)) { const r = s(e); r.length && (n = n.concat(r)); } return !n.length && e.changes.empty ? null : new ye(e.changes.invert(e.startState.doc), n, void 0, t || e.startState.selection, Ve); }

    static selection(e) { return new ye(void 0, Ve, void 0, void 0, e); }
  }; function As(i, e, t, n) { const s = e + 1 > t + 20 ? e - t - 1 : 0; const r = i.slice(s, e); return r.push(n), r; } function rg(i, e) { const t = []; let n = !1; return i.iterChangedRanges((s, r) => t.push(s, r)), e.iterChangedRanges((s, r, o, l) => { for (let a = 0; a < t.length;) { const h = t[a++]; const c = t[a++]; l >= h && o <= c && (n = !0); } }), n; } function og(i, e) { return i.ranges.length == e.ranges.length && i.ranges.filter((t, n) => t.empty != e.ranges[n].empty).length === 0; } function af(i, e) { return i.length ? e.length ? i.concat(e) : i : e; } var Ve = []; const lg = 200; function hf(i, e) { if (i.length) { const t = i[i.length - 1]; const n = t.selectionsAfter.slice(Math.max(0, t.selectionsAfter.length - lg)); return n.length && n[n.length - 1].eq(e) ? i : (n.push(e), As(i, i.length - 1, 1e9, t.setSelAfter(n))); } return [ye.selection([e])]; } function ag(i) { const e = i[i.length - 1]; const t = i.slice(); return t[i.length - 1] = e.setSelAfter(e.selectionsAfter.slice(0, e.selectionsAfter.length - 1)), t; } function Ho(i, e) { if (!i.length) return i; let t = i.length; let n = Ve; for (;t;) { const s = hg(i[t - 1], e, n); if (s.changes && !s.changes.empty || s.effects.length) { const r = i.slice(0, t); return r[t - 1] = s, r; } e = s.mapped, t--, n = s.selectionsAfter; } return n.length ? [ye.selection(n)] : Ve; } function hg(i, e, t) { const n = af(i.selectionsAfter.length ? i.selectionsAfter.map(l => l.map(e)) : Ve, t); if (!i.changes) return ye.selection(n); const s = i.changes.map(e); const r = e.mapDesc(i.changes, !0); const o = i.mapped ? i.mapped.composeDesc(r) : r; return new ye(s, M.mapEffects(i.effects, e), o, i.startSelection.map(r), n); } const cg = /^(input\.type|delete)($|\.)/; var We = class {
    constructor(e, t, n = 0, s = void 0) { this.done = e, this.undone = t, this.prevTime = n, this.prevUserEvent = s; }

    isolate() { return this.prevTime ? new We(this.done, this.undone) : this; }

    addChanges(e, t, n, s, r) { let o = this.done; const l = o[o.length - 1]; return l && l.changes && !l.changes.empty && e.changes && (!n || cg.test(n)) && (!l.selectionsAfter.length && t - this.prevTime < s && rg(l.changes, e.changes) || n == 'input.type.compose') ? o = As(o, o.length - 1, r, new ye(e.changes.compose(l.changes), af(e.effects, l.effects), l.mapped, l.startSelection, Ve)) : o = As(o, o.length, r, e), new We(o, Ve, t, n); }

    addSelection(e, t, n, s) { const r = this.done.length ? this.done[this.done.length - 1].selectionsAfter : Ve; return r.length > 0 && t - this.prevTime < s && n == this.prevUserEvent && n && /^select($|\.)/.test(n) && og(r[r.length - 1], e) ? this : new We(hf(this.done, e), this.undone, t, n); }

    addMapping(e) { return new We(Ho(this.done, e), Ho(this.undone, e), this.prevTime, this.prevUserEvent); }

    pop(e, t, n) {
      const s = e == 0 ? this.done : this.undone; if (s.length == 0) return null; const r = s[s.length - 1]; if (n && r.selectionsAfter.length) {
        return t.update({
          selection: r.selectionsAfter[r.selectionsAfter.length - 1], annotations: qo.of({ side: e, rest: ag(s) }), userEvent: e == 0 ? 'select.undo' : 'select.redo', scrollIntoView: !0,
        });
      } if (r.changes) {
        let o = s.length == 1 ? Ve : s.slice(0, s.length - 1); return r.mapped && (o = Ho(o, r.mapped)), t.update({
          changes: r.changes, selection: r.startSelection, effects: r.effects, annotations: qo.of({ side: e, rest: o }), filter: !1, userEvent: e == 0 ? 'undo' : 'redo', scrollIntoView: !0,
        });
      } return null;
    }
  }; We.empty = new We(Ve, Ve); const cf = [{ key: 'Mod-z', run: of, preventDefault: !0 }, {
    key: 'Mod-y', mac: 'Mod-Shift-z', run: lf, preventDefault: !0,
  }, { key: 'Mod-u', run: ng, preventDefault: !0 }, {
    key: 'Alt-u', mac: 'Mod-Shift-u', run: sg, preventDefault: !0,
  }]; function Ti(i, e) { return m.create(i.ranges.map(e), i.mainIndex); } function ht(i, e) { return i.update({ selection: e, scrollIntoView: !0, userEvent: 'select' }); } function bt({ state: i, dispatch: e }, t) { const n = Ti(i.selection, t); return n.eq(i.selection) ? !1 : (e(ht(i, n)), !0); } function Ps(i, e) { return m.cursor(e ? i.to : i.from); } function ff(i, e) { return bt(i, t => (t.empty ? i.moveByChar(t, e) : Ps(t, e))); } function He(i) { return i.textDirectionAt(i.state.selection.main.head) == G.LTR; } const uf = i => ff(i, !He(i)); const df = i => ff(i, He(i)); function pf(i, e) { return bt(i, t => (t.empty ? i.moveByGroup(t, e) : Ps(t, e))); } const fg = i => pf(i, !He(i)); const ug = i => pf(i, He(i)); function dg(i, e, t) { if (e.type.prop(t)) return !0; const n = e.to - e.from; return n && (n > 2 || /[^\s,.;:]/.test(i.sliceDoc(e.from, e.to))) || e.firstChild; } function Ms(i, e, t) { let n = H(i).resolveInner(e.head); const s = t ? R.closedBy : R.openedBy; for (let a = e.head; ;) { const h = t ? n.childAfter(a) : n.childBefore(a); if (!h) break; dg(i, h, s) ? n = h : a = t ? h.to : h.from; } const r = n.type.prop(s); let o; let l; return r && (o = t ? Qe(i, n.from, 1) : Qe(i, n.to, -1)) && o.matched ? l = t ? o.end.to : o.end.from : l = t ? n.to : n.from, m.cursor(l, t ? -1 : 1); } const pg = i => bt(i, e => Ms(i.state, e, !He(i))); const mg = i => bt(i, e => Ms(i.state, e, He(i))); function mf(i, e) { return bt(i, (t) => { if (!t.empty) return Ps(t, e); const n = i.moveVertically(t, e); return n.head != t.head ? n : i.moveToLineBoundary(t, e); }); } const gf = i => mf(i, !1); const bf = i => mf(i, !0); function yf(i, e) { const { state: t } = i; const n = Ti(t.selection, l => (l.empty ? i.moveVertically(l, e, Math.min(i.dom.clientHeight, innerHeight)) : Ps(l, e))); if (n.eq(t.selection)) return !1; const s = i.coordsAtPos(t.selection.main.head); const r = i.scrollDOM.getBoundingClientRect(); let o; return s && s.top > r.top && s.bottom < r.bottom && s.top - r.top <= i.scrollDOM.scrollHeight - i.scrollDOM.scrollTop - i.scrollDOM.clientHeight && (o = O.scrollIntoView(n.main.head, { y: 'start', yMargin: s.top - r.top })), i.dispatch(ht(t, n), { effects: o }), !0; } const Uc = i => yf(i, !1); const Uo = i => yf(i, !0); function Es(i, e, t) { const n = i.lineBlockAt(e.head); let s = i.moveToLineBoundary(e, t); if (s.head == e.head && s.head != (t ? n.to : n.from) && (s = i.moveToLineBoundary(e, t, !1)), !t && s.head == n.from && n.length) { const r = /^\s*/.exec(i.state.sliceDoc(n.from, Math.min(n.from + 100, n.to)))[0].length; r && e.head != n.from + r && (s = m.cursor(n.from + r)); } return s; } const _c = i => bt(i, e => Es(i, e, !0)); const jc = i => bt(i, e => Es(i, e, !1)); const gg = i => bt(i, e => m.cursor(i.lineBlockAt(e.head).from, 1)); const bg = i => bt(i, e => m.cursor(i.lineBlockAt(e.head).to, -1)); function yg(i, e, t) { let n = !1; const s = Ti(i.selection, (r) => { const o = Qe(i, r.head, -1) || Qe(i, r.head, 1) || r.head > 0 && Qe(i, r.head - 1, 1) || r.head < i.doc.length && Qe(i, r.head + 1, -1); if (!o || !o.end) return r; n = !0; const l = o.start.from == r.head ? o.end.to : o.end.from; return t ? m.range(r.anchor, l) : m.cursor(l); }); return n ? (e(ht(i, s)), !0) : !1; } const xg = ({ state: i, dispatch: e }) => yg(i, e, !1); function ct(i, e) { const t = Ti(i.state.selection, (n) => { const s = e(n); return m.range(n.anchor, s.head, s.goalColumn); }); return t.eq(i.state.selection) ? !1 : (i.dispatch(ht(i.state, t)), !0); } function xf(i, e) { return ct(i, t => i.moveByChar(t, e)); } const wf = i => xf(i, !He(i)); const kf = i => xf(i, He(i)); function vf(i, e) { return ct(i, t => i.moveByGroup(t, e)); } const wg = i => vf(i, !He(i)); const kg = i => vf(i, He(i)); const vg = i => ct(i, e => Ms(i.state, e, !He(i))); const Og = i => ct(i, e => Ms(i.state, e, He(i))); function Of(i, e) { return ct(i, t => i.moveVertically(t, e)); } const Sf = i => Of(i, !1); const Cf = i => Of(i, !0); function Af(i, e) { return ct(i, t => i.moveVertically(t, e, Math.min(i.dom.clientHeight, innerHeight))); } const Gc = i => Af(i, !1); const Zc = i => Af(i, !0); const Qc = i => ct(i, e => Es(i, e, !0)); const Xc = i => ct(i, e => Es(i, e, !1)); const Sg = i => ct(i, e => m.cursor(i.lineBlockAt(e.head).from)); const Cg = i => ct(i, e => m.cursor(i.lineBlockAt(e.head).to)); const Kc = ({ state: i, dispatch: e }) => (e(ht(i, { anchor: 0 })), !0); const Jc = ({ state: i, dispatch: e }) => (e(ht(i, { anchor: i.doc.length })), !0); const Yc = ({ state: i, dispatch: e }) => (e(ht(i, { anchor: i.selection.main.anchor, head: 0 })), !0); const ef = ({ state: i, dispatch: e }) => (e(ht(i, { anchor: i.selection.main.anchor, head: i.doc.length })), !0); const Ag = ({ state: i, dispatch: e }) => (e(i.update({ selection: { anchor: 0, head: i.doc.length }, userEvent: 'select' })), !0); const Tg = ({ state: i, dispatch: e }) => { const t = Rs(i).map(({ from: n, to: s }) => m.range(n, Math.min(s + 1, i.doc.length))); return e(i.update({ selection: m.create(t), userEvent: 'select' })), !0; }; const Pg = ({ state: i, dispatch: e }) => { const t = Ti(i.selection, (n) => { let s; let r = H(i).resolveInner(n.head, 1); for (;!(r.from < n.from && r.to >= n.to || r.to > n.to && r.from <= n.from || !(!((s = r.parent) === null || s === void 0) && s.parent));)r = r.parent; return m.range(r.to, r.from); }); return e(ht(i, t)), !0; }; const Mg = ({ state: i, dispatch: e }) => { const t = i.selection; let n = null; return t.ranges.length > 1 ? n = m.create([t.main]) : t.main.empty || (n = m.create([m.cursor(t.main.head)])), n ? (e(ht(i, n)), !0) : !1; }; function Ds({ state: i, dispatch: e }, t) { if (i.readOnly) return !1; let n = 'delete.selection'; const s = i.changeByRange((r) => { let { from: o, to: l } = r; if (o == l) { const a = t(o); a < o ? n = 'delete.backward' : a > o && (n = 'delete.forward'), o = Math.min(o, a), l = Math.max(l, a); } return o == l ? { range: r } : { changes: { from: o, to: l }, range: m.cursor(o) }; }); return s.changes.empty ? !1 : (e(i.update(s, { scrollIntoView: !0, userEvent: n })), !0); } function Ls(i, e, t) { if (i instanceof O) for (const n of i.state.facet(O.atomicRanges).map(s => s(i)))n.between(e, e, (s, r) => { s < e && r > e && (e = t ? r : s); }); return e; } const Tf = (i, e) => Ds(i, (t) => { const { state: n } = i; const s = n.doc.lineAt(t); let r; let o; if (!e && t > s.from && t < s.from + 200 && !/[^ \t]/.test(r = s.text.slice(0, t - s.from))) { if (r[r.length - 1] == '	') return t - 1; const l = St(r, n.tabSize); const a = l % bn(n) || bn(n); for (let h = 0; h < a && r[r.length - 1 - h] == ' '; h++)t--; o = t; } else o = ve(s.text, t - s.from, e, e) + s.from, o == t && s.number != (e ? n.doc.lines : 1) && (o += e ? 1 : -1); return Ls(i, o, e); }); const _o = i => Tf(i, !1); const Pf = i => Tf(i, !0); const Mf = (i, e) => Ds(i, (t) => { let n = t; const { state: s } = i; const r = s.doc.lineAt(n); const o = s.charCategorizer(n); for (let l = null; ;) { if (n == (e ? r.to : r.from)) { n == t && r.number != (e ? s.doc.lines : 1) && (n += e ? 1 : -1); break; } const a = ve(r.text, n - r.from, e) + r.from; const h = r.text.slice(Math.min(n, a) - r.from, Math.max(n, a) - r.from); const c = o(h); if (l != null && c != l) break; (h != ' ' || n != t) && (l = c), n = a; } return Ls(i, n, e); }); const Ef = i => Mf(i, !1); const Eg = i => Mf(i, !0); const Df = i => Ds(i, (e) => { const t = i.lineBlockAt(e).to; return Ls(i, e < t ? t : Math.min(i.state.doc.length, e + 1), !0); }); const Dg = i => Ds(i, (e) => { const t = i.lineBlockAt(e).from; return Ls(i, e > t ? t : Math.max(0, e - 1), !1); }); const Lg = ({ state: i, dispatch: e }) => { if (i.readOnly) return !1; const t = i.changeByRange(n => ({ changes: { from: n.from, to: n.to, insert: z.of(['', '']) }, range: m.cursor(n.from) })); return e(i.update(t, { scrollIntoView: !0, userEvent: 'input' })), !0; }; const Rg = ({ state: i, dispatch: e }) => { if (i.readOnly) return !1; const t = i.changeByRange((n) => { if (!n.empty || n.from == 0 || n.from == i.doc.length) return { range: n }; const s = n.from; const r = i.doc.lineAt(s); const o = s == r.from ? s - 1 : ve(r.text, s - r.from, !1) + r.from; const l = s == r.to ? s + 1 : ve(r.text, s - r.from, !0) + r.from; return { changes: { from: o, to: l, insert: i.doc.slice(s, l).append(i.doc.slice(o, s)) }, range: m.cursor(l) }; }); return t.changes.empty ? !1 : (e(i.update(t, { scrollIntoView: !0, userEvent: 'move.character' })), !0); }; function Rs(i) { const e = []; let t = -1; for (const n of i.selection.ranges) { const s = i.doc.lineAt(n.from); let r = i.doc.lineAt(n.to); if (!n.empty && n.to == r.from && (r = i.doc.lineAt(n.to - 1)), t >= s.number) { const o = e[e.length - 1]; o.to = r.to, o.ranges.push(n); } else e.push({ from: s.from, to: r.to, ranges: [n] }); t = r.number + 1; } return e; } function Lf(i, e, t) {
    if (i.readOnly) return !1; const n = []; const s = []; for (const r of Rs(i)) { if (t ? r.to == i.doc.length : r.from == 0) continue; const o = i.doc.lineAt(t ? r.to + 1 : r.from - 1); const l = o.length + 1; if (t) { n.push({ from: r.to, to: o.to }, { from: r.from, insert: o.text + i.lineBreak }); for (const a of r.ranges)s.push(m.range(Math.min(i.doc.length, a.anchor + l), Math.min(i.doc.length, a.head + l))); } else { n.push({ from: o.from, to: r.from }, { from: r.to, insert: i.lineBreak + o.text }); for (const a of r.ranges)s.push(m.range(a.anchor - l, a.head - l)); } } return n.length ? (e(i.update({
      changes: n, scrollIntoView: !0, selection: m.create(s, i.selection.mainIndex), userEvent: 'move.line',
    })), !0) : !1;
  } const Bg = ({ state: i, dispatch: e }) => Lf(i, e, !1); const Ng = ({ state: i, dispatch: e }) => Lf(i, e, !0); function Rf(i, e, t) { if (i.readOnly) return !1; const n = []; for (const s of Rs(i))t ? n.push({ from: s.from, insert: i.doc.slice(s.from, s.to) + i.lineBreak }) : n.push({ from: s.to, insert: i.lineBreak + i.doc.slice(s.from, s.to) }); return e(i.update({ changes: n, scrollIntoView: !0, userEvent: 'input.copyline' })), !0; } const $g = ({ state: i, dispatch: e }) => Rf(i, e, !1); const Ig = ({ state: i, dispatch: e }) => Rf(i, e, !0); const Fg = (i) => {
    if (i.state.readOnly) return !1; const { state: e } = i; const t = e.changes(Rs(e).map(({ from: s, to: r }) => (s > 0 ? s-- : r < e.doc.length && r++, { from: s, to: r }))); const n = Ti(e.selection, s => i.moveVertically(s, !0)).map(t); return i.dispatch({
      changes: t, selection: n, scrollIntoView: !0, userEvent: 'delete.line',
    }), !0;
  }; function zg(i, e) { if (/\(\)|\[\]|\{\}/.test(i.sliceDoc(e - 1, e + 1))) return { from: e, to: e }; const t = H(i).resolveInner(e); const n = t.childBefore(e); const s = t.childAfter(e); let r; return n && s && n.to <= e && s.from >= e && (r = n.type.prop(R.closedBy)) && r.indexOf(s.name) > -1 && i.doc.lineAt(n.to).from == i.doc.lineAt(s.from).from ? { from: n.to, to: s.from } : null; } const Vg = Bf(!1); const Wg = Bf(!0); function Bf(i) { return ({ state: e, dispatch: t }) => { if (e.readOnly) return !1; const n = e.changeByRange((s) => { let { from: r, to: o } = s; const l = e.doc.lineAt(r); const a = !i && r == o && zg(e, r); i && (r = o = (o <= l.to ? l : e.doc.lineAt(o)).to); const h = new Qt(e, { simulateBreak: r, simulateDoubleBreak: !!a }); let c = Ss(h, r); for (c == null && (c = /^\s*/.exec(e.doc.lineAt(r).text)[0].length); o < l.to && /\s/.test(l.text[o - l.from]);)o++; a ? { from: r, to: o } = a : r > l.from && r < l.from + 100 && !/\S/.test(l.text.slice(0, r)) && (r = l.from); const f = ['', Ai(e, c)]; return a && f.push(Ai(e, h.lineIndent(l.from, -1))), { changes: { from: r, to: o, insert: z.of(f) }, range: m.cursor(r + 1 + f[1].length) }; }); return t(e.update(n, { scrollIntoView: !0, userEvent: 'input' })), !0; }; } function Zo(i, e) { let t = -1; return i.changeByRange((n) => { const s = []; for (let o = n.from; o <= n.to;) { const l = i.doc.lineAt(o); l.number > t && (n.empty || n.to > l.from) && (e(l, s, n), t = l.number), o = l.to + 1; } const r = i.changes(s); return { changes: s, range: m.range(r.mapPos(n.anchor, 1), r.mapPos(n.head, 1)) }; }); } const Hg = ({ state: i, dispatch: e }) => { if (i.readOnly) return !1; const t = Object.create(null); const n = new Qt(i, { overrideIndentation: (r) => { const o = t[r]; return o ?? -1; } }); const s = Zo(i, (r, o, l) => { let a = Ss(n, r.from); if (a == null) return; /\S/.test(r.text) || (a = 0); const h = /^\s*/.exec(r.text)[0]; const c = Ai(i, a); (h != c || l.from < r.from + h.length) && (t[r.from] = a, o.push({ from: r.from, to: r.from + h.length, insert: c })); }); return s.changes.empty || e(i.update(s, { userEvent: 'indent' })), !0; }; const Nf = ({ state: i, dispatch: e }) => (i.readOnly ? !1 : (e(i.update(Zo(i, (t, n) => { n.push({ from: t.from, insert: i.facet(Ci) }); }), { userEvent: 'input.indent' })), !0)); const $f = ({ state: i, dispatch: e }) => (i.readOnly ? !1 : (e(i.update(Zo(i, (t, n) => { const s = /^\s*/.exec(t.text)[0]; if (!s) return; const r = St(s, i.tabSize); let o = 0; const l = Ai(i, Math.max(0, r - bn(i))); for (;o < s.length && o < l.length && s.charCodeAt(o) == l.charCodeAt(o);)o++; n.push({ from: t.from + o, to: t.from + s.length, insert: l.slice(o) }); }), { userEvent: 'delete.dedent' })), !0)); const qg = [{
    key: 'Ctrl-b', run: uf, shift: wf, preventDefault: !0,
  }, { key: 'Ctrl-f', run: df, shift: kf }, { key: 'Ctrl-p', run: gf, shift: Sf }, { key: 'Ctrl-n', run: bf, shift: Cf }, { key: 'Ctrl-a', run: gg, shift: Sg }, { key: 'Ctrl-e', run: bg, shift: Cg }, { key: 'Ctrl-d', run: Pf }, { key: 'Ctrl-h', run: _o }, { key: 'Ctrl-k', run: Df }, { key: 'Ctrl-Alt-h', run: Ef }, { key: 'Ctrl-o', run: Lg }, { key: 'Ctrl-t', run: Rg }, { key: 'Ctrl-v', run: Uo }]; const Ug = [{
    key: 'ArrowLeft', run: uf, shift: wf, preventDefault: !0,
  }, {
    key: 'Mod-ArrowLeft', mac: 'Alt-ArrowLeft', run: fg, shift: wg,
  }, { mac: 'Cmd-ArrowLeft', run: jc, shift: Xc }, {
    key: 'ArrowRight', run: df, shift: kf, preventDefault: !0,
  }, {
    key: 'Mod-ArrowRight', mac: 'Alt-ArrowRight', run: ug, shift: kg,
  }, { mac: 'Cmd-ArrowRight', run: _c, shift: Qc }, {
    key: 'ArrowUp', run: gf, shift: Sf, preventDefault: !0,
  }, { mac: 'Cmd-ArrowUp', run: Kc, shift: Yc }, { mac: 'Ctrl-ArrowUp', run: Uc, shift: Gc }, {
    key: 'ArrowDown', run: bf, shift: Cf, preventDefault: !0,
  }, { mac: 'Cmd-ArrowDown', run: Jc, shift: ef }, { mac: 'Ctrl-ArrowDown', run: Uo, shift: Zc }, { key: 'PageUp', run: Uc, shift: Gc }, { key: 'PageDown', run: Uo, shift: Zc }, {
    key: 'Home', run: jc, shift: Xc, preventDefault: !0,
  }, { key: 'Mod-Home', run: Kc, shift: Yc }, {
    key: 'End', run: _c, shift: Qc, preventDefault: !0,
  }, { key: 'Mod-End', run: Jc, shift: ef }, { key: 'Enter', run: Vg }, { key: 'Mod-a', run: Ag }, { key: 'Backspace', run: _o, shift: _o }, { key: 'Delete', run: Pf }, { key: 'Mod-Backspace', mac: 'Alt-Backspace', run: Ef }, { key: 'Mod-Delete', mac: 'Alt-Delete', run: Eg }, { mac: 'Mod-Backspace', run: Dg }, { mac: 'Mod-Delete', run: Df }].concat(qg.map(i => ({ mac: i.key, run: i.run, shift: i.shift }))); const If = [{
    key: 'Alt-ArrowLeft', mac: 'Ctrl-ArrowLeft', run: pg, shift: vg,
  }, {
    key: 'Alt-ArrowRight', mac: 'Ctrl-ArrowRight', run: mg, shift: Og,
  }, { key: 'Alt-ArrowUp', run: Bg }, { key: 'Shift-Alt-ArrowUp', run: $g }, { key: 'Alt-ArrowDown', run: Ng }, { key: 'Shift-Alt-ArrowDown', run: Ig }, { key: 'Escape', run: Mg }, { key: 'Mod-Enter', run: Wg }, { key: 'Alt-l', mac: 'Ctrl-l', run: Tg }, { key: 'Mod-i', run: Pg, preventDefault: !0 }, { key: 'Mod-[', run: $f }, { key: 'Mod-]', run: Nf }, { key: 'Mod-Alt-\\', run: Hg }, { key: 'Shift-Mod-k', run: Fg }, { key: 'Shift-Mod-\\', run: xg }, { key: 'Mod-/', run: Gm }, { key: 'Alt-A', run: Qm }].concat(Ug); const Ff = { key: 'Tab', run: Nf, shift: $f }; function U() { let i = arguments[0]; typeof i === 'string' && (i = document.createElement(i)); let e = 1; const t = arguments[1]; if (t && typeof t === 'object' && t.nodeType == null && !Array.isArray(t)) { for (const n in t) if (Object.prototype.hasOwnProperty.call(t, n)) { const s = t[n]; typeof s === 'string' ? i.setAttribute(n, s) : s != null && (i[n] = s); }e++; } for (;e < arguments.length; e++)zf(i, arguments[e]); return i; } function zf(i, e) { if (typeof e === 'string')i.appendChild(document.createTextNode(e)); else if (e != null) if (e.nodeType != null)i.appendChild(e); else if (Array.isArray(e)) for (let t = 0; t < e.length; t++)zf(i, e[t]); else throw new RangeError(`Unsupported child node: ${e}`); } const Vf = typeof String.prototype.normalize === 'function' ? i => i.normalize('NFKD') : i => i; const Nt = class {
    constructor(e, t, n = 0, s = e.length, r) { this.value = { from: 0, to: 0 }, this.done = !1, this.matches = [], this.buffer = '', this.bufferPos = 0, this.iter = e.iterRange(n, s), this.bufferStart = n, this.normalize = r ? o => r(Vf(o)) : Vf, this.query = this.normalize(t); }

    peek() { if (this.bufferPos == this.buffer.length) { if (this.bufferStart += this.buffer.length, this.iter.next(), this.iter.done) return -1; this.bufferPos = 0, this.buffer = this.iter.value; } return ae(this.buffer, this.bufferPos); }

    next() { for (;this.matches.length;) this.matches.pop(); return this.nextOverlapping(); }

    nextOverlapping() { for (;;) { const e = this.peek(); if (e < 0) return this.done = !0, this; const t = _i(e); const n = this.bufferStart + this.bufferPos; this.bufferPos += Ce(e); const s = this.normalize(t); for (let r = 0, o = n; ;r++) { const l = s.charCodeAt(r); const a = this.match(l, o); if (a) return this.value = a, this; if (r == s.length - 1) break; o == n && r < t.length && t.charCodeAt(r) == l && o++; } } }

    match(e, t) { let n = null; for (let s = 0; s < this.matches.length; s += 2) { const r = this.matches[s]; let o = !1; this.query.charCodeAt(r) == e && (r == this.query.length - 1 ? n = { from: this.matches[s + 1], to: t + 1 } : (this.matches[s]++, o = !0)), o || (this.matches.splice(s, 2), s -= 2); } return this.query.charCodeAt(0) == e && (this.query.length == 1 ? n = { from: t, to: t + 1 } : this.matches.push(1, t)), n; }
  }; typeof Symbol < 'u' && (Nt.prototype[Symbol.iterator] = function () { return this; }); const Uf = { from: -1, to: -1, match: /.*/.exec('') }; const tl = `gm${/x/.unicode == null ? '' : 'u'}`; const $s = class {
    constructor(e, t, n, s = 0, r = e.length) { if (this.to = r, this.curLine = '', this.done = !1, this.value = Uf, /\\[sWDnr]|\n|\r|\[\^/.test(t)) return new Is(e, t, n, s, r); this.re = new RegExp(t, tl + (n?.ignoreCase ? 'i' : '')), this.iter = e.iter(); const o = e.lineAt(s); this.curLineStart = o.from, this.matchPos = s, this.getLine(this.curLineStart); }

    getLine(e) { this.iter.next(e), this.iter.lineBreak ? this.curLine = '' : (this.curLine = this.iter.value, this.curLineStart + this.curLine.length > this.to && (this.curLine = this.curLine.slice(0, this.to - this.curLineStart)), this.iter.next()); }

    nextLine() { this.curLineStart = this.curLineStart + this.curLine.length + 1, this.curLineStart > this.to ? this.curLine = '' : this.getLine(0); }

    next() { for (let e = this.matchPos - this.curLineStart; ;) { this.re.lastIndex = e; const t = this.matchPos <= this.to && this.re.exec(this.curLine); if (t) { const n = this.curLineStart + t.index; const s = n + t[0].length; if (this.matchPos = s + (n == s ? 1 : 0), n == this.curLine.length && this.nextLine(), n < s || n > this.value.to) return this.value = { from: n, to: s, match: t }, this; e = this.matchPos - this.curLineStart; } else if (this.curLineStart + this.curLine.length < this.to) this.nextLine(), e = 0; else return this.done = !0, this; } }
  }; const Qo = new WeakMap(); var Rt = class {
    constructor(e, t) { this.from = e, this.text = t; }

    get to() { return this.from + this.text.length; }

    static get(e, t, n) { const s = Qo.get(e); if (!s || s.from >= n || s.to <= t) { const l = new Rt(t, e.sliceString(t, n)); return Qo.set(e, l), l; } if (s.from == t && s.to == n) return s; let { text: r, from: o } = s; return o > t && (r = e.sliceString(t, o) + r, o = t), s.to < n && (r += e.sliceString(s.to, n)), Qo.set(e, new Rt(o, r)), new Rt(t, r.slice(t - o, n - o)); }
  }; var Is = class {
    constructor(e, t, n, s, r) { this.text = e, this.to = r, this.done = !1, this.value = Uf, this.matchPos = s, this.re = new RegExp(t, tl + (n?.ignoreCase ? 'i' : '')), this.flat = Rt.get(e, s, this.chunkEnd(s + 5e3)); }

    chunkEnd(e) { return e >= this.to ? this.to : this.text.lineAt(e).to; }

    next() { for (;;) { const e = this.re.lastIndex = this.matchPos - this.flat.from; let t = this.re.exec(this.flat.text); if (t && !t[0] && t.index == e && (this.re.lastIndex = e + 1, t = this.re.exec(this.flat.text)), t && this.flat.to < this.to && t.index + t[0].length > this.flat.text.length - 10 && (t = null), t) { const n = this.flat.from + t.index; const s = n + t[0].length; return this.value = { from: n, to: s, match: t }, this.matchPos = s + (n == s ? 1 : 0), this; } if (this.flat.to == this.to) return this.done = !0, this; this.flat = Rt.get(this.text, this.flat.from, this.chunkEnd(this.flat.from + this.flat.text.length * 2)); } }
  }; typeof Symbol < 'u' && ($s.prototype[Symbol.iterator] = Is.prototype[Symbol.iterator] = function () { return this; }); function _g(i) { try { return new RegExp(i, tl), !0; } catch { return !1; } } function Xo(i) { const e = U('input', { class: 'cm-textfield', name: 'line' }); const t = U('form', { class: 'cm-gotoLine', onkeydown: (s) => { s.keyCode == 27 ? (s.preventDefault(), i.dispatch({ effects: Fs.of(!1) }), i.focus()) : s.keyCode == 13 && (s.preventDefault(), n()); }, onsubmit: (s) => { s.preventDefault(), n(); } }, U('label', i.state.phrase('Go to line'), ': ', e), ' ', U('button', { class: 'cm-button', type: 'submit' }, i.state.phrase('go'))); function n() { const s = /^([+-])?(\d+)?(:\d+)?(%)?$/.exec(e.value); if (!s) return; const { state: r } = i; const o = r.doc.lineAt(r.selection.main.head); const [, l, a, h, c] = s; const f = h ? +h.slice(1) : 0; let u = a ? +a : o.number; if (a && c) { let p = u / 100; l && (p = p * (l == '-' ? -1 : 1) + o.number / r.doc.lines), u = Math.round(r.doc.lines * p); } else a && l && (u = u * (l == '-' ? -1 : 1) + o.number); const d = r.doc.line(Math.max(1, Math.min(r.doc.lines, u))); i.dispatch({ effects: Fs.of(!1), selection: m.cursor(d.from + Math.max(0, Math.min(f, d.length))), scrollIntoView: !0 }), i.focus(); } return { dom: t }; } var Fs = M.define(); const Wf = V.define({ create() { return !0; }, update(i, e) { for (const t of e.effects)t.is(Fs) && (i = t.value); return i; }, provide: i => pt.from(i, e => (e ? Xo : null)) }); const jg = (i) => { let e = jt(i, Xo); if (!e) { const t = [Fs.of(!0)]; i.state.field(Wf, !1) == null && t.push(M.appendConfig.of([Wf, Gg])), i.dispatch({ effects: t }), e = jt(i, Xo); } return e && e.dom.querySelector('input').focus(), !0; }; var Gg = O.baseTheme({ '.cm-panel.cm-gotoLine': { padding: '2px 6px 4px', '& label': { fontSize: '80%' } } }); const Zg = {
    highlightWordAroundCursor: !1, minSelectionLength: 1, maxMatches: 100, wholeWords: !1,
  }; const _f = v.define({ combine(i) { return me(i, Zg, { highlightWordAroundCursor: (e, t) => e || t, minSelectionLength: Math.min, maxMatches: Math.min }); } }); function jf(i) { const e = [Yg, Jg]; return i && e.push(_f.of(i)), e; } const Qg = A.mark({ class: 'cm-selectionMatch' }); const Xg = A.mark({ class: 'cm-selectionMatch cm-selectionMatch-main' }); function Hf(i, e, t, n) { return (t == 0 || i(e.sliceDoc(t - 1, t)) != le.Word) && (n == e.doc.length || i(e.sliceDoc(n, n + 1)) != le.Word); } function Kg(i, e, t, n) { return i(e.sliceDoc(t, t + 1)) == le.Word && i(e.sliceDoc(n - 1, n)) == le.Word; } var Jg = q.fromClass(class {
    constructor(i) { this.decorations = this.getDeco(i); }

    update(i) { (i.selectionSet || i.docChanged || i.viewportChanged) && (this.decorations = this.getDeco(i.view)); }

    getDeco(i) { const e = i.state.facet(_f); const { state: t } = i; const n = t.selection; if (n.ranges.length > 1) return A.none; const s = n.main; let r; let o = null; if (s.empty) { if (!e.highlightWordAroundCursor) return A.none; const a = t.wordAt(s.head); if (!a) return A.none; o = t.charCategorizer(s.head), r = t.sliceDoc(a.from, a.to); } else { const a = s.to - s.from; if (a < e.minSelectionLength || a > 200) return A.none; if (e.wholeWords) { if (r = t.sliceDoc(s.from, s.to), o = t.charCategorizer(s.head), !(Hf(o, t, s.from, s.to) && Kg(o, t, s.from, s.to))) return A.none; } else if (r = t.sliceDoc(s.from, s.to).trim(), !r) return A.none; } const l = []; for (const a of i.visibleRanges) { const h = new Nt(t.doc, r, a.from, a.to); for (;!h.next().done;) { const { from: c, to: f } = h.value; if ((!o || Hf(o, t, c, f)) && (s.empty && c <= s.from && f >= s.to ? l.push(Xg.range(c, f)) : (c >= s.to || f <= s.from) && l.push(Qg.range(c, f)), l.length > e.maxMatches)) return A.none; } } return A.set(l); }
  }, { decorations: i => i.decorations }); var Yg = O.baseTheme({ '.cm-selectionMatch': { backgroundColor: '#99ff7780' }, '.cm-searchMatch .cm-selectionMatch': { backgroundColor: 'transparent' } }); const e0 = ({ state: i, dispatch: e }) => { const { selection: t } = i; const n = m.create(t.ranges.map(s => i.wordAt(s.head) || m.cursor(s.head)), t.mainIndex); return n.eq(t) ? !1 : (e(i.update({ selection: n })), !0); }; function t0(i, e) { const { main: t, ranges: n } = i.selection; const s = i.wordAt(t.head); const r = s && s.from == t.from && s.to == t.to; for (let o = !1, l = new Nt(i.doc, e, n[n.length - 1].to); ;) if (l.next(), l.done) { if (o) return null; l = new Nt(i.doc, e, 0, Math.max(0, n[n.length - 1].from - 1)), o = !0; } else { if (o && n.some(a => a.from == l.value.from)) continue; if (r) { const a = i.wordAt(l.value.from); if (!a || a.from != l.value.from || a.to != l.value.to) continue; } return l.value; } } const i0 = ({ state: i, dispatch: e }) => { const { ranges: t } = i.selection; if (t.some(r => r.from === r.to)) return e0({ state: i, dispatch: e }); const n = i.sliceDoc(t[0].from, t[0].to); if (i.selection.ranges.some(r => i.sliceDoc(r.from, r.to) != n)) return !1; const s = t0(i, n); return s ? (e(i.update({ selection: i.selection.addRange(m.range(s.from, s.to), !1), effects: O.scrollIntoView(s.to) })), !0) : !1; }; const il = v.define({ combine(i) { let e; return { top: i.reduce((t, n) => t ?? n.top, void 0) || !1, caseSensitive: i.reduce((t, n) => t ?? n.caseSensitive, void 0) || !1, createPanel: ((e = i.find(t => t.createPanel)) === null || e === void 0 ? void 0 : e.createPanel) || (t => new el(t)) }; } }); const zs = class {
    constructor(e) {
      this.search = e.search, this.caseSensitive = !!e.caseSensitive, this.regexp = !!e.regexp, this.replace = e.replace || '', this.valid = !!this.search && (!this.regexp || _g(this.search)), this.unquoted = e.literal ? this.search : this.search.replace(/\\([nrt\\])/g, (t, n) => (n == 'n' ? `
` : n == 'r' ? '\r' : n == 't' ? '	' : '\\'));
    }

    eq(e) { return this.search == e.search && this.replace == e.replace && this.caseSensitive == e.caseSensitive && this.regexp == e.regexp; }

    create() { return this.regexp ? new Jo(this) : new Ko(this); }

    getCursor(e, t = 0, n = e.length) { return this.regexp ? Mi(this, e, t, n) : Pi(this, e, t, n); }
  }; const Vs = class {constructor(e) { this.spec = e; }}; function Pi(i, e, t, n) { return new Nt(e, i.unquoted, t, n, i.caseSensitive ? void 0 : s => s.toLowerCase()); } var Ko = class extends Vs {
    constructor(e) { super(e); }

    nextMatch(e, t, n) { let s = Pi(this.spec, e, n, e.length).nextOverlapping(); return s.done && (s = Pi(this.spec, e, 0, t).nextOverlapping()), s.done ? null : s.value; }

    prevMatchInRange(e, t, n) { for (let s = n; ;) { const r = Math.max(t, s - 1e4 - this.spec.unquoted.length); const o = Pi(this.spec, e, r, s); let l = null; for (;!o.nextOverlapping().done;)l = o.value; if (l) return l; if (r == t) return null; s -= 1e4; } }

    prevMatch(e, t, n) { return this.prevMatchInRange(e, 0, t) || this.prevMatchInRange(e, n, e.length); }

    getReplacement(e) { return this.spec.replace; }

    matchAll(e, t) { const n = Pi(this.spec, e, 0, e.length); const s = []; for (;!n.next().done;) { if (s.length >= t) return null; s.push(n.value); } return s; }

    highlight(e, t, n, s) { const r = Pi(this.spec, e, Math.max(0, t - this.spec.unquoted.length), Math.min(n + this.spec.unquoted.length, e.length)); for (;!r.next().done;)s(r.value.from, r.value.to); }
  }; function Mi(i, e, t, n) { return new $s(e, i.search, i.caseSensitive ? void 0 : { ignoreCase: !0 }, t, n); } var Jo = class extends Vs {
    nextMatch(e, t, n) { let s = Mi(this.spec, e, n, e.length).next(); return s.done && (s = Mi(this.spec, e, 0, t).next()), s.done ? null : s.value; }

    prevMatchInRange(e, t, n) { for (let s = 1; ;s++) { const r = Math.max(t, n - s * 1e4); const o = Mi(this.spec, e, r, n); let l = null; for (;!o.next().done;)l = o.value; if (l && (r == t || l.from > r + 10)) return l; if (r == t) return null; } }

    prevMatch(e, t, n) { return this.prevMatchInRange(e, 0, t) || this.prevMatchInRange(e, n, e.length); }

    getReplacement(e) { return this.spec.replace.replace(/\$([$&\d+])/g, (t, n) => (n == '$' ? '$' : n == '&' ? e.match[0] : n != '0' && +n < e.match.length ? e.match[n] : t)); }

    matchAll(e, t) { const n = Mi(this.spec, e, 0, e.length); const s = []; for (;!n.next().done;) { if (s.length >= t) return null; s.push(n.value); } return s; }

    highlight(e, t, n, s) { const r = Mi(this.spec, e, Math.max(0, t - 250), Math.min(n + 250, e.length)); for (;!r.next().done;)s(r.value.from, r.value.to); }
  }; const kn = M.define(); const nl = M.define(); const Bt = V.define({ create(i) { return new wn(Yo(i).create(), null); }, update(i, e) { for (const t of e.effects)t.is(kn) ? i = new wn(t.value.create(), i.panel) : t.is(nl) && (i = new wn(i.query, t.value ? sl : null)); return i; }, provide: i => pt.from(i, e => e.panel) }); var wn = class {constructor(e, t) { this.query = e, this.panel = t; }}; const n0 = A.mark({ class: 'cm-searchMatch' }); const s0 = A.mark({ class: 'cm-searchMatch cm-searchMatch-selected' }); const r0 = q.fromClass(class {
    constructor(i) { this.view = i, this.decorations = this.highlight(i.state.field(Bt)); }

    update(i) { const e = i.state.field(Bt); (e != i.startState.field(Bt) || i.docChanged || i.selectionSet || i.viewportChanged) && (this.decorations = this.highlight(e)); }

    highlight({ query: i, panel: e }) { if (!e || !i.spec.valid) return A.none; const { view: t } = this; const n = new Ee(); for (let s = 0, r = t.visibleRanges, o = r.length; s < o; s++) { let { from: l, to: a } = r[s]; for (;s < o - 1 && a > r[s + 1].from - 2 * 250;)a = r[++s].to; i.highlight(t.state.doc, l, a, (h, c) => { const f = t.state.selection.ranges.some(u => u.from == h && u.to == c); n.add(h, c, f ? s0 : n0); }); } return n.finish(); }
  }, { decorations: i => i.decorations }); function vn(i) { return (e) => { const t = e.state.field(Bt, !1); return t && t.query.spec.valid ? i(e, t) : Gf(e); }; } const Ws = vn((i, { query: e }) => {
    const { from: t, to: n } = i.state.selection.main; const s = e.nextMatch(i.state.doc, t, n); return !s || s.from == t && s.to == n ? !1 : (i.dispatch({
      selection: { anchor: s.from, head: s.to }, scrollIntoView: !0, effects: rl(i, s), userEvent: 'select.search',
    }), !0);
  }); const Hs = vn((i, { query: e }) => {
    const { state: t } = i; const { from: n, to: s } = t.selection.main; const r = e.prevMatch(t.doc, n, s); return r ? (i.dispatch({
      selection: { anchor: r.from, head: r.to }, scrollIntoView: !0, effects: rl(i, r), userEvent: 'select.search',
    }), !0) : !1;
  }); const o0 = vn((i, { query: e }) => { const t = e.matchAll(i.state.doc, 1e3); return !t || !t.length ? !1 : (i.dispatch({ selection: m.create(t.map(n => m.range(n.from, n.to))), userEvent: 'select.search.matches' }), !0); }); const l0 = ({ state: i, dispatch: e }) => { const t = i.selection; if (t.ranges.length > 1 || t.main.empty) return !1; const { from: n, to: s } = t.main; const r = []; let o = 0; for (let l = new Nt(i.doc, i.sliceDoc(n, s)); !l.next().done;) { if (r.length > 1e3) return !1; l.value.from == n && (o = r.length), r.push(m.range(l.value.from, l.value.to)); } return e(i.update({ selection: m.create(r, o), userEvent: 'select.search.matches' })), !0; }; const qf = vn((i, { query: e }) => {
    const { state: t } = i; const { from: n, to: s } = t.selection.main; if (t.readOnly) return !1; let r = e.nextMatch(t.doc, n, n); if (!r) return !1; const o = []; let l; let a; if (r.from == n && r.to == s && (a = t.toText(e.getReplacement(r)), o.push({ from: r.from, to: r.to, insert: a }), r = e.nextMatch(t.doc, r.from, r.to)), r) { const h = o.length == 0 || o[0].from >= r.to ? 0 : r.to - r.from - a.length; l = { anchor: r.from - h, head: r.to - h }; } return i.dispatch({
      changes: o, selection: l, scrollIntoView: !!l, effects: r ? rl(i, r) : void 0, userEvent: 'input.replace',
    }), !0;
  }); const a0 = vn((i, { query: e }) => { if (i.state.readOnly) return !1; const t = e.matchAll(i.state.doc, 1e9).map((n) => { const { from: s, to: r } = n; return { from: s, to: r, insert: e.getReplacement(n) }; }); return t.length ? (i.dispatch({ changes: t, userEvent: 'input.replace.all' }), !0) : !1; }); function sl(i) { return i.state.facet(il).createPanel(i); } function Yo(i, e) { let t; const n = i.selection.main; const s = n.empty || n.to > n.from + 100 ? '' : i.sliceDoc(n.from, n.to); const r = (t = e?.caseSensitive) !== null && t !== void 0 ? t : i.facet(il).caseSensitive; return e && !s ? e : new zs({ search: s.replace(/\n/g, '\\n'), caseSensitive: r }); } var Gf = (i) => { const e = i.state.field(Bt, !1); if (e && e.panel) { const t = jt(i, sl); if (!t) return !1; const n = t.dom.querySelector('[name=search]'); if (n != i.root.activeElement) { const s = Yo(i.state, e.query.spec); s.valid && i.dispatch({ effects: kn.of(s) }), n.focus(), n.select(); } } else i.dispatch({ effects: [nl.of(!0), e ? kn.of(Yo(i.state, e.query.spec)) : M.appendConfig.of(c0)] }); return !0; }; const Zf = (i) => { const e = i.state.field(Bt, !1); if (!e || !e.panel) return !1; const t = jt(i, sl); return t && t.dom.contains(i.root.activeElement) && i.focus(), i.dispatch({ effects: nl.of(!1) }), !0; }; const Qf = [{ key: 'Mod-f', run: Gf, scope: 'editor search-panel' }, {
    key: 'F3', run: Ws, shift: Hs, scope: 'editor search-panel', preventDefault: !0,
  }, {
    key: 'Mod-g', run: Ws, shift: Hs, scope: 'editor search-panel', preventDefault: !0,
  }, { key: 'Escape', run: Zf, scope: 'editor search-panel' }, { key: 'Mod-Shift-l', run: l0 }, { key: 'Alt-g', run: jg }, { key: 'Mod-d', run: i0, preventDefault: !0 }]; var el = class {
    constructor(e) {
      this.view = e; const t = this.query = e.state.field(Bt).query.spec; this.commit = this.commit.bind(this), this.searchField = U('input', {
        value: t.search, placeholder: qe(e, 'Find'), 'aria-label': qe(e, 'Find'), class: 'cm-textfield', name: 'search', onchange: this.commit, onkeyup: this.commit,
      }), this.replaceField = U('input', {
        value: t.replace, placeholder: qe(e, 'Replace'), 'aria-label': qe(e, 'Replace'), class: 'cm-textfield', name: 'replace', onchange: this.commit, onkeyup: this.commit,
      }), this.caseField = U('input', {
        type: 'checkbox', name: 'case', checked: t.caseSensitive, onchange: this.commit,
      }), this.reField = U('input', {
        type: 'checkbox', name: 're', checked: t.regexp, onchange: this.commit,
      }); function n(s, r, o) {
        return U('button', {
          class: 'cm-button', name: s, onclick: r, type: 'button',
        }, o);
      } this.dom = U('div', { onkeydown: s => this.keydown(s), class: 'cm-search' }, [this.searchField, n('next', () => Ws(e), [qe(e, 'next')]), n('prev', () => Hs(e), [qe(e, 'previous')]), n('select', () => o0(e), [qe(e, 'all')]), U('label', null, [this.caseField, qe(e, 'match case')]), U('label', null, [this.reField, qe(e, 'regexp')]), ...e.state.readOnly ? [] : [U('br'), this.replaceField, n('replace', () => qf(e), [qe(e, 'replace')]), n('replaceAll', () => a0(e), [qe(e, 'replace all')]), U('button', {
        name: 'close', onclick: () => Zf(e), 'aria-label': qe(e, 'close'), type: 'button',
      }, ['\xD7'])]]);
    }

    commit() {
      const e = new zs({
        search: this.searchField.value, caseSensitive: this.caseField.checked, regexp: this.reField.checked, replace: this.replaceField.value,
      }); e.eq(this.query) || (this.query = e, this.view.dispatch({ effects: kn.of(e) }));
    }

    keydown(e) { Gh(this.view, e, 'search-panel') ? e.preventDefault() : e.keyCode == 13 && e.target == this.searchField ? (e.preventDefault(), (e.shiftKey ? Hs : Ws)(this.view)) : e.keyCode == 13 && e.target == this.replaceField && (e.preventDefault(), qf(this.view)); }

    update(e) { for (const t of e.transactions) for (const n of t.effects)n.is(kn) && !n.value.eq(this.query) && this.setQuery(n.value); }

    setQuery(e) { this.query = e, this.searchField.value = e.search, this.replaceField.value = e.replace, this.caseField.checked = e.caseSensitive, this.reField.checked = e.regexp; }

    mount() { this.searchField.select(); }

    get pos() { return 80; }

    get top() { return this.view.state.facet(il).top; }
  }; function qe(i, e) { return i.state.phrase(e); } const Bs = 30; const Ns = /[\s\.,:;?!]/; function rl(i, { from: e, to: t }) { const n = i.state.doc.lineAt(e).from; const s = i.state.doc.lineAt(t).to; const r = Math.max(n, e - Bs); const o = Math.min(s, t + Bs); let l = i.state.sliceDoc(r, o); if (r != n) { for (let a = 0; a < Bs; a++) if (!Ns.test(l[a + 1]) && Ns.test(l[a])) { l = l.slice(a); break; } } if (o != s) { for (let a = l.length - 1; a > l.length - Bs; a--) if (!Ns.test(l[a - 1]) && Ns.test(l[a])) { l = l.slice(0, a); break; } } return O.announce.of(`${i.state.phrase('current match')}. ${l} ${i.state.phrase('on line')} ${i.state.doc.lineAt(e).number}`); } const h0 = O.baseTheme({
    '.cm-panel.cm-search': {
      padding: '2px 6px 4px',
      position: 'relative',
      '& [name=close]': {
        position: 'absolute', top: '0', right: '4px', backgroundColor: 'inherit', border: 'none', font: 'inherit', padding: 0, margin: 0,
      },
      '& input, & button, & label': { margin: '.2em .6em .2em 0' },
      '& input[type=checkbox]': { marginRight: '.2em' },
      '& label': { fontSize: '80%', whiteSpace: 'pre' },
    },
    '&light .cm-searchMatch': { backgroundColor: '#ffff0054' },
    '&dark .cm-searchMatch': { backgroundColor: '#00ffff8a' },
    '&light .cm-searchMatch-selected': { backgroundColor: '#ff6a0054' },
    '&dark .cm-searchMatch-selected': { backgroundColor: '#ff00ff8a' },
  }); var c0 = [Bt, Ye.lowest(r0), h0]; const Us = class {
    constructor(e, t, n) { this.state = e, this.pos = t, this.explicit = n, this.abortListeners = []; }

    tokenBefore(e) {
      let t = H(this.state).resolveInner(this.pos, -1); for (;t && e.indexOf(t.name) < 0;)t = t.parent; return t ? {
        from: t.from, to: this.pos, text: this.state.sliceDoc(t.from, this.pos), type: t.type,
      } : null;
    }

    matchBefore(e) { const t = this.state.doc.lineAt(this.pos); const n = Math.max(t.from, this.pos - 250); const s = t.text.slice(n - t.from, this.pos - t.from); const r = s.search(su(e, !1)); return r < 0 ? null : { from: n + r, to: this.pos, text: s.slice(r) }; }

    get aborted() { return this.abortListeners == null; }

    addEventListener(e, t) { e == 'abort' && this.abortListeners && this.abortListeners.push(t); }
  }; function Xf(i) { let e = Object.keys(i).join(''); const t = /\w/.test(e); return t && (e = e.replace(/\w/g, '')), `[${t ? '\\w' : ''}${e.replace(/[^\w\s]/g, '\\$&')}]`; } function f0(i) { const e = Object.create(null); const t = Object.create(null); for (const { label: s } of i) { e[s[0]] = !0; for (let r = 1; r < s.length; r++)t[s[r]] = !0; } const n = `${Xf(e) + Xf(t)}*$`; return [new RegExp(`^${n}`), new RegExp(n)]; } function u0(i) { const e = i.map(s => (typeof s === 'string' ? { label: s } : s)); const [t, n] = e.every(s => /^\w+$/.test(s.label)) ? [/\w*$/, /\w+$/] : f0(e); return (s) => { const r = s.matchBefore(n); return r || s.explicit ? { from: r ? r.from : s.pos, options: e, validFor: t } : null; }; } const _s = class {constructor(e, t, n) { this.completion = e, this.source = t, this.match = n; }}; function $t(i) { return i.selection.main.head; } function su(i, e) { let t; const { source: n } = i; const s = e && n[0] != '^'; const r = n[n.length - 1] != '$'; return !s && !r ? i : new RegExp(`${s ? '^' : ''}(?:${n})${r ? '$' : ''}`, (t = i.flags) !== null && t !== void 0 ? t : i.ignoreCase ? 'i' : ''); } const d0 = $e.define(); function ru(i, e) { const t = e.completion.apply || e.completion.label; const n = e.source; typeof t === 'string' ? i.dispatch(i.state.changeByRange((s) => { if (s == i.state.selection.main) return { changes: { from: n.from, to: n.to, insert: t }, range: m.cursor(n.from + t.length) }; const r = n.to - n.from; return !s.empty || r && i.state.sliceDoc(s.from - r, s.from) != i.state.sliceDoc(n.from, n.to) ? { range: s } : { changes: { from: s.from - r, to: s.from, insert: t }, range: m.cursor(s.from - r + t.length) }; }), { userEvent: 'input.complete', annotations: d0.of(e.completion) }) : t(i, e.completion, n.from, n.to); } const Kf = new WeakMap(); function p0(i) { if (!Array.isArray(i)) return i; let e = Kf.get(i); return e || Kf.set(i, e = u0(i)), e; } const ll = class {
    constructor(e) { this.pattern = e, this.chars = [], this.folded = [], this.any = [], this.precise = [], this.byWord = []; for (let t = 0; t < e.length;) { const n = ae(e, t); const s = Ce(n); this.chars.push(n); const r = e.slice(t, t + s); const o = r.toUpperCase(); this.folded.push(ae(o == r ? r.toLowerCase() : o, 0)), t += s; } this.astral = e.length != this.chars.length; }

    match(e) {
      if (this.pattern.length == 0) return [0]; if (e.length < this.pattern.length) return null; const {
        chars: t, folded: n, any: s, precise: r, byWord: o,
      } = this; if (t.length == 1) { const S = ae(e, 0); return S == t[0] ? [0, 0, Ce(S)] : S == n[0] ? [-200, 0, Ce(S)] : null; } const l = e.indexOf(this.pattern); if (l == 0) return [0, 0, this.pattern.length]; const a = t.length; let h = 0; if (l < 0) { for (let S = 0, P = Math.min(e.length, 200); S < P && h < a;) { const k = ae(e, S); (k == t[h] || k == n[h]) && (s[h++] = S), S += Ce(k); } if (h < a) return null; } let c = 0; let f = 0; let u = !1; let d = 0; let p = -1; let g = -1; const b = /[a-z]/.test(e); let y = !0; for (let S = 0, P = Math.min(e.length, 200), k = 0; S < P && f < a;) { const C = ae(e, S); l < 0 && (c < a && C == t[c] && (r[c++] = S), d < a && (C == t[d] || C == n[d] ? (d == 0 && (p = S), g = S + 1, d++) : d = 0)); let T; const D = C < 255 ? C >= 48 && C <= 57 || C >= 97 && C <= 122 ? 2 : C >= 65 && C <= 90 ? 1 : 0 : (T = _i(C)) != T.toLowerCase() ? 1 : T != T.toUpperCase() ? 2 : 0; (!S || D == 1 && b || k == 0 && D != 0) && (t[f] == C || n[f] == C && (u = !0) ? o[f++] = S : o.length && (y = !1)), k = D, S += Ce(C); } return f == a && o[0] == 0 && y ? this.result(-100 + (u ? -200 : 0), o, e) : d == a && p == 0 ? [-200 - e.length, 0, g] : l > -1 ? [-700 - e.length, l, l + this.pattern.length] : d == a ? [-200 + -700 - e.length, p, g] : f == a ? this.result(-100 + (u ? -200 : 0) + -700 + (y ? 0 : -1100), o, e) : t.length == 2 ? null : this.result((s[0] ? -700 : 0) + -200 + -1100, s, e);
    }

    result(e, t, n) { const s = [e - n.length]; let r = 1; for (const o of t) { const l = o + (this.astral ? Ce(ae(n, o)) : 1); r > 1 && s[r - 1] == o ? s[r - 1] = l : (s[r++] = o, s[r++] = l); } return s; }
  }; const ei = v.define({
    combine(i) {
      return me(i, {
        activateOnTyping: !0, override: null, maxRenderedOptions: 100, defaultKeymap: !0, optionClass: () => '', aboveCursor: !1, icons: !0, addToOptions: [],
      }, {
        defaultKeymap: (e, t) => e && t, icons: (e, t) => e && t, optionClass: (e, t) => n => m0(e(n), t(n)), addToOptions: (e, t) => e.concat(t),
      });
    },
  }); function m0(i, e) { return i ? e ? `${i} ${e}` : i : e; } function g0(i) { const e = i.addToOptions.slice(); return i.icons && e.push({ render(t) { const n = document.createElement('div'); return n.classList.add('cm-completionIcon'), t.type && n.classList.add(...t.type.split(/\s+/g).map(s => `cm-completionIcon-${s}`)), n.setAttribute('aria-hidden', 'true'), n; }, position: 20 }), e.push({ render(t, n, s) { const r = document.createElement('span'); r.className = 'cm-completionLabel'; const { label: o } = t; let l = 0; for (let a = 1; a < s.length;) { const h = s[a++]; const c = s[a++]; h > l && r.appendChild(document.createTextNode(o.slice(l, h))); const f = r.appendChild(document.createElement('span')); f.appendChild(document.createTextNode(o.slice(h, c))), f.className = 'cm-completionMatchedText', l = c; } return l < o.length && r.appendChild(document.createTextNode(o.slice(l))), r; }, position: 50 }, { render(t) { if (!t.detail) return null; const n = document.createElement('span'); return n.className = 'cm-completionDetail', n.textContent = t.detail, n; }, position: 80 }), e.sort((t, n) => t.position - n.position).map(t => t.render); } function Jf(i, e, t) { if (i <= t) return { from: 0, to: i }; if (e <= i >> 1) { const s = Math.floor(e / t); return { from: s * t, to: (s + 1) * t }; } const n = Math.floor((i - e) / t); return { from: i - (n + 1) * t, to: i - n * t }; } const al = class {
    constructor(e, t) { this.view = e, this.stateField = t, this.info = null, this.placeInfo = { read: () => this.measureInfo(), write: l => this.positionInfo(l), key: this }; const n = e.state.field(t); const { options: s, selected: r } = n.open; const o = e.state.facet(ei); this.optionContent = g0(o), this.optionClass = o.optionClass, this.range = Jf(s.length, r, o.maxRenderedOptions), this.dom = document.createElement('div'), this.dom.className = 'cm-tooltip-autocomplete', this.dom.addEventListener('mousedown', (l) => { for (let a = l.target, h; a && a != this.dom; a = a.parentNode) if (a.nodeName == 'LI' && (h = /-(\d+)$/.exec(a.id)) && +h[1] < s.length) { ru(e, s[+h[1]]), l.preventDefault(); return; } }), this.list = this.dom.appendChild(this.createListBox(s, n.id, this.range)), this.list.addEventListener('scroll', () => { this.info && this.view.requestMeasure(this.placeInfo); }); }

    mount() { this.updateSel(); }

    update(e) { e.state.field(this.stateField) != e.startState.field(this.stateField) && this.updateSel(); }

    positioned() { this.info && this.view.requestMeasure(this.placeInfo); }

    updateSel() { const e = this.view.state.field(this.stateField); const t = e.open; if ((t.selected < this.range.from || t.selected >= this.range.to) && (this.range = Jf(t.options.length, t.selected, this.view.state.facet(ei).maxRenderedOptions), this.list.remove(), this.list = this.dom.appendChild(this.createListBox(t.options, e.id, this.range)), this.list.addEventListener('scroll', () => { this.info && this.view.requestMeasure(this.placeInfo); })), this.updateSelectedOption(t.selected)) { this.info && (this.info.remove(), this.info = null); const { completion: n } = t.options[t.selected]; const { info: s } = n; if (!s) return; const r = typeof s === 'string' ? document.createTextNode(s) : s(n); if (!r) return; 'then' in r ? r.then((o) => { o && this.view.state.field(this.stateField, !1) == e && this.addInfoPane(o); }).catch(o => ge(this.view.state, o, 'completion info')) : this.addInfoPane(r); } }

    addInfoPane(e) { const t = this.info = document.createElement('div'); t.className = 'cm-tooltip cm-completionInfo', t.appendChild(e), this.dom.appendChild(t), this.view.requestMeasure(this.placeInfo); }

    updateSelectedOption(e) { let t = null; for (let n = this.list.firstChild, s = this.range.from; n; n = n.nextSibling, s++)s == e ? n.hasAttribute('aria-selected') || (n.setAttribute('aria-selected', 'true'), t = n) : n.hasAttribute('aria-selected') && n.removeAttribute('aria-selected'); return t && y0(this.list, t), t; }

    measureInfo() { const e = this.dom.querySelector('[aria-selected]'); if (!e || !this.info) return null; const t = this.dom.getBoundingClientRect(); const n = this.info.getBoundingClientRect(); const s = e.getBoundingClientRect(); if (s.top > Math.min(innerHeight, t.bottom) - 10 || s.bottom < Math.max(0, t.top) + 10) return null; const r = Math.max(0, Math.min(s.top, innerHeight - n.height)) - t.top; let o = this.view.textDirection == G.RTL; const l = t.left; const a = innerWidth - t.right; return o && l < Math.min(n.width, a) ? o = !1 : !o && a < Math.min(n.width, l) && (o = !0), { top: r, left: o }; }

    positionInfo(e) { this.info && (this.info.style.top = `${e ? e.top : -1e6}px`, e && (this.info.classList.toggle('cm-completionInfo-left', e.left), this.info.classList.toggle('cm-completionInfo-right', !e.left))); }

    createListBox(e, t, n) { const s = document.createElement('ul'); s.id = t, s.setAttribute('role', 'listbox'), s.setAttribute('aria-expanded', 'true'); for (let r = n.from; r < n.to; r++) { const { completion: o, match: l } = e[r]; const a = s.appendChild(document.createElement('li')); a.id = `${t}-${r}`, a.setAttribute('role', 'option'); const h = this.optionClass(o); h && (a.className = h); for (const c of this.optionContent) { const f = c(o, this.view.state, l); f && a.appendChild(f); } } return n.from && s.classList.add('cm-completionListIncompleteTop'), n.to < e.length && s.classList.add('cm-completionListIncompleteBottom'), s; }
  }; function b0(i) { return e => new al(e, i); } function y0(i, e) { const t = i.getBoundingClientRect(); const n = e.getBoundingClientRect(); n.top < t.top ? i.scrollTop -= t.top - n.top : n.bottom > t.bottom && (i.scrollTop += n.bottom - t.bottom); } function Yf(i) { return (i.boost || 0) * 100 + (i.apply ? 10 : 0) + (i.info ? 5 : 0) + (i.type ? 1 : 0); } function x0(i, e) { const t = []; let n = 0; for (const o of i) if (o.hasResult()) if (o.result.filter === !1) for (const l of o.result.options)t.push(new _s(l, o, [1e9 - n++])); else { const l = new ll(e.sliceDoc(o.from, o.to)); let a; for (const h of o.result.options)(a = l.match(h.label)) && (h.boost != null && (a[0] += h.boost), t.push(new _s(h, o, a))); } const s = []; let r = null; for (const o of t.sort(O0))!r || r.label != o.completion.label || r.detail != o.completion.detail || r.type != null && o.completion.type != null && r.type != o.completion.type || r.apply != o.completion.apply ? s.push(o) : Yf(o.completion) > Yf(r) && (s[s.length - 1] = o), r = o.completion; return s; } var Jt = class {
    constructor(e, t, n, s, r) { this.options = e, this.attrs = t, this.tooltip = n, this.timestamp = s, this.selected = r; }

    setSelected(e, t) { return e == this.selected || e >= this.options.length ? this : new Jt(this.options, eu(t, e), this.tooltip, this.timestamp, e); }

    static build(e, t, n, s, r) { const o = x0(e, t); if (!o.length) return null; let l = 0; if (s && s.selected) { const a = s.options[s.selected].completion; for (let h = 0; h < o.length; h++) if (o[h].completion == a) { l = h; break; } } return new Jt(o, eu(n, l), { pos: e.reduce((a, h) => (h.hasResult() ? Math.min(a, h.from) : a), 1e8), create: b0(Xe), above: r.aboveCursor }, s ? s.timestamp : Date.now(), l); }

    map(e) { return new Jt(this.options, this.attrs, ({ ...this.tooltip, pos: e.mapPos(this.tooltip.pos) }), this.timestamp, this.selected); }
  }; var Ei = class {
    constructor(e, t, n) { this.active = e, this.id = t, this.open = n; }

    static start() { return new Ei(v0, `cm-ac-${Math.floor(Math.random() * 2e6).toString(36)}`, null); }

    update(e) { const { state: t } = e; const n = t.facet(ei); let r = (n.override || t.languageDataAt('autocomplete', $t(t)).map(p0)).map(l => (this.active.find(h => h.source == l) || new xe(l, this.active.some(h => h.state != 0) ? 1 : 0)).update(e, n)); r.length == this.active.length && r.every((l, a) => l == this.active[a]) && (r = this.active); let o = e.selection || r.some(l => l.hasResult() && e.changes.touchesRange(l.from, l.to)) || !w0(r, this.active) ? Jt.build(r, t, this.id, this.open, n) : this.open && e.docChanged ? this.open.map(e.changes) : this.open; !o && r.every(l => l.state != 1) && r.some(l => l.hasResult()) && (r = r.map(l => (l.hasResult() ? new xe(l.source, 0) : l))); for (const l of e.effects)l.is(lu) && (o = o && o.setSelected(l.value, this.id)); return r == this.active && o == this.open ? this : new Ei(r, this.id, o); }

    get tooltip() { return this.open ? this.open.tooltip : null; }

    get attrs() { return this.open ? this.open.attrs : k0; }
  }; function w0(i, e) { if (i == e) return !0; for (let t = 0, n = 0; ;) { for (;t < i.length && !i[t].hasResult;)t++; for (;n < e.length && !e[n].hasResult;)n++; const s = t == i.length; const r = n == e.length; if (s || r) return s == r; if (i[t++].result != e[n++].result) return !1; } } var k0 = { 'aria-autocomplete': 'list' }; function eu(i, e) {
    return {
      'aria-autocomplete': 'list', 'aria-haspopup': 'listbox', 'aria-activedescendant': `${i}-${e}`, 'aria-controls': i,
    };
  } var v0 = []; function O0(i, e) { const t = e.match[0] - i.match[0]; return t || i.completion.label.localeCompare(e.completion.label); } function hl(i) { return i.isUserEvent('input.type') ? 'input' : i.isUserEvent('delete.backward') ? 'delete' : null; } var xe = class {
    constructor(e, t, n = -1) { this.source = e, this.state = t, this.explicitPos = n; }

    hasResult() { return !1; }

    update(e, t) { const n = hl(e); let s = this; n ? s = s.handleUserEvent(e, n, t) : e.docChanged ? s = s.handleChange(e) : e.selection && s.state != 0 && (s = new xe(s.source, 0)); for (const r of e.effects) if (r.is(ul))s = new xe(s.source, 1, r.value ? $t(e.state) : -1); else if (r.is(dl))s = new xe(s.source, 0); else if (r.is(ou)) for (const o of r.value)o.source == s.source && (s = o); return s; }

    handleUserEvent(e, t, n) { return t == 'delete' || !n.activateOnTyping ? this.map(e.changes) : new xe(this.source, 1); }

    handleChange(e) { return e.changes.touchesRange($t(e.startState)) ? new xe(this.source, 0) : this.map(e.changes); }

    map(e) { return e.empty || this.explicitPos < 0 ? this : new xe(this.source, this.state, e.mapPos(this.explicitPos)); }
  }; var Yt = class extends xe {
    constructor(e, t, n, s, r) { super(e, 2, t), this.result = n, this.from = s, this.to = r; }

    hasResult() { return !0; }

    handleUserEvent(e, t, n) { let s; const r = e.changes.mapPos(this.from); const o = e.changes.mapPos(this.to, 1); const l = $t(e.state); if ((this.explicitPos < 0 ? l <= r : l < this.from) || l > o || t == 'delete' && $t(e.startState) == this.from) return new xe(this.source, t == 'input' && n.activateOnTyping ? 1 : 0); const a = this.explicitPos < 0 ? -1 : e.changes.mapPos(this.explicitPos); let h; return S0(this.result.validFor, e.state, r, o) ? new Yt(this.source, a, this.result, r, o) : this.result.update && (h = this.result.update(this.result, r, o, new Us(e.state, l, a >= 0))) ? new Yt(this.source, a, h, h.from, (s = h.to) !== null && s !== void 0 ? s : $t(e.state)) : new xe(this.source, 1, a); }

    handleChange(e) { return e.changes.touchesRange(this.from, this.to) ? new xe(this.source, 0) : this.map(e.changes); }

    map(e) { return e.empty ? this : new Yt(this.source, this.explicitPos < 0 ? -1 : e.mapPos(this.explicitPos), this.result, e.mapPos(this.from), e.mapPos(this.to, 1)); }
  }; function S0(i, e, t, n) { if (!i) return !1; const s = e.sliceDoc(t, n); return typeof i === 'function' ? i(s, t, n, e) : su(i, !0).test(s); } var ul = M.define(); var dl = M.define(); var ou = M.define({ map(i, e) { return i.map(t => t.map(e)); } }); var lu = M.define(); var Xe = V.define({ create() { return Ei.start(); }, update(i, e) { return i.update(e); }, provide: i => [bi.from(i, e => e.tooltip), O.contentAttributes.from(i, e => e.attrs)] }); const au = 75; function qs(i, e = 'option') { return (t) => { const n = t.state.field(Xe, !1); if (!n || !n.open || Date.now() - n.open.timestamp < au) return !1; let s = 1; let r; e == 'page' && (r = lc(t, n.open.tooltip)) && (s = Math.max(2, Math.floor(r.dom.offsetHeight / r.dom.querySelector('li').offsetHeight) - 1)); let o = n.open.selected + s * (i ? 1 : -1); const { length: l } = n.open.options; return o < 0 ? o = e == 'page' ? 0 : l - 1 : o >= l && (o = e == 'page' ? l - 1 : 0), t.dispatch({ effects: lu.of(o) }), !0; }; } const C0 = (i) => { const e = i.state.field(Xe, !1); return i.state.readOnly || !e || !e.open || Date.now() - e.open.timestamp < au ? !1 : (ru(i, e.open.options[e.open.selected]), !0); }; const A0 = i => (i.state.field(Xe, !1) ? (i.dispatch({ effects: ul.of(!0) }), !0) : !1); const T0 = (i) => { const e = i.state.field(Xe, !1); return !e || !e.active.some(t => t.state != 0) ? !1 : (i.dispatch({ effects: dl.of(null) }), !0); }; const cl = class {constructor(e, t) { this.active = e, this.context = t, this.time = Date.now(), this.updates = [], this.done = void 0; }}; const tu = 50; const P0 = 50; const M0 = 1e3; const E0 = q.fromClass(class {
    constructor(i) { this.view = i, this.debounceUpdate = -1, this.running = [], this.debounceAccept = -1, this.composing = 0; for (const e of i.state.field(Xe).active)e.state == 1 && this.startQuery(e); }

    update(i) { const e = i.state.field(Xe); if (!i.selectionSet && !i.docChanged && i.startState.field(Xe) == e) return; const t = i.transactions.some(n => (n.selection || n.docChanged) && !hl(n)); for (let n = 0; n < this.running.length; n++) { const s = this.running[n]; if (t || s.updates.length + i.transactions.length > P0 && Date.now() - s.time > M0) { for (const r of s.context.abortListeners) try { r(); } catch (o) { ge(this.view.state, o); }s.context.abortListeners = null, this.running.splice(n--, 1); } else s.updates.push(...i.transactions); } if (this.debounceUpdate > -1 && clearTimeout(this.debounceUpdate), this.debounceUpdate = e.active.some(n => n.state == 1 && !this.running.some(s => s.active.source == n.source)) ? setTimeout(() => this.startUpdate(), tu) : -1, this.composing != 0) for (const n of i.transactions)hl(n) == 'input' ? this.composing = 2 : this.composing == 2 && n.selection && (this.composing = 3); }

    startUpdate() { this.debounceUpdate = -1; const { state: i } = this.view; const e = i.field(Xe); for (const t of e.active)t.state == 1 && !this.running.some(n => n.active.source == t.source) && this.startQuery(t); }

    startQuery(i) { const { state: e } = this.view; const t = $t(e); const n = new Us(e, t, i.explicitPos == t); const s = new cl(i, n); this.running.push(s), Promise.resolve(i.source(n)).then((r) => { s.context.aborted || (s.done = r || null, this.scheduleAccept()); }, (r) => { this.view.dispatch({ effects: dl.of(null) }), ge(this.view.state, r); }); }

    scheduleAccept() { this.running.every(i => i.done !== void 0) ? this.accept() : this.debounceAccept < 0 && (this.debounceAccept = setTimeout(() => this.accept(), tu)); }

    accept() { let i; this.debounceAccept > -1 && clearTimeout(this.debounceAccept), this.debounceAccept = -1; const e = []; const t = this.view.state.facet(ei); for (let n = 0; n < this.running.length; n++) { const s = this.running[n]; if (s.done === void 0) continue; if (this.running.splice(n--, 1), s.done) { let o = new Yt(s.active.source, s.active.explicitPos, s.done, s.done.from, (i = s.done.to) !== null && i !== void 0 ? i : $t(s.updates.length ? s.updates[0].startState : this.view.state)); for (const l of s.updates)o = o.update(l, t); if (o.hasResult()) { e.push(o); continue; } } const r = this.view.state.field(Xe).active.find(o => o.source == s.active.source); if (r && r.state == 1) if (s.done == null) { let o = new xe(s.active.source, 0); for (const l of s.updates)o = o.update(l, t); o.state != 1 && e.push(o); } else this.startQuery(r); }e.length && this.view.dispatch({ effects: ou.of(e) }); }
  }, { eventHandlers: { compositionstart() { this.composing = 1; }, compositionend() { this.composing == 3 && setTimeout(() => this.view.dispatch({ effects: ul.of(!1) }), 20), this.composing = 0; } } }); const hu = O.baseTheme({
    '.cm-tooltip.cm-tooltip-autocomplete': {
      '& > ul': {
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        overflow: 'hidden auto',
        maxWidth_fallback: '700px',
        maxWidth: 'min(700px, 95vw)',
        minWidth: '250px',
        maxHeight: '10em',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        '& > li': {
          overflowX: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', padding: '1px 3px', lineHeight: 1.2,
        },
      },
    },
    '&light .cm-tooltip-autocomplete ul li[aria-selected]': { background: '#17c', color: 'white' },
    '&dark .cm-tooltip-autocomplete ul li[aria-selected]': { background: '#347', color: 'white' },
    '.cm-completionListIncompleteTop:before, .cm-completionListIncompleteBottom:after': {
      content: '"\xB7\xB7\xB7"', opacity: 0.5, display: 'block', textAlign: 'center',
    },
    '.cm-tooltip.cm-completionInfo': {
      position: 'absolute', padding: '3px 9px', width: 'max-content', maxWidth: '300px',
    },
    '.cm-completionInfo.cm-completionInfo-left': { right: '100%' },
    '.cm-completionInfo.cm-completionInfo-right': { left: '100%' },
    '&light .cm-snippetField': { backgroundColor: '#00000022' },
    '&dark .cm-snippetField': { backgroundColor: '#ffffff22' },
    '.cm-snippetFieldPosition': {
      verticalAlign: 'text-top', width: 0, height: '1.15em', margin: '0 -0.7px -.7em', borderLeft: '1.4px dotted #888',
    },
    '.cm-completionMatchedText': { textDecoration: 'underline' },
    '.cm-completionDetail': { marginLeft: '0.5em', fontStyle: 'italic' },
    '.cm-completionIcon': {
      fontSize: '90%', width: '.8em', display: 'inline-block', textAlign: 'center', paddingRight: '.6em', opacity: '0.6',
    },
    '.cm-completionIcon-function, .cm-completionIcon-method': { '&:after': { content: "'\u0192'" } },
    '.cm-completionIcon-class': { '&:after': { content: "'\u25CB'" } },
    '.cm-completionIcon-interface': { '&:after': { content: "'\u25CC'" } },
    '.cm-completionIcon-variable': { '&:after': { content: "'\u{1D465}'" } },
    '.cm-completionIcon-constant': { '&:after': { content: "'\u{1D436}'" } },
    '.cm-completionIcon-type': { '&:after': { content: "'\u{1D461}'" } },
    '.cm-completionIcon-enum': { '&:after': { content: "'\u222A'" } },
    '.cm-completionIcon-property': { '&:after': { content: "'\u25A1'" } },
    '.cm-completionIcon-keyword': { '&:after': { content: "'\u{1F511}\uFE0E'" } },
    '.cm-completionIcon-namespace': { '&:after': { content: "'\u25A2'" } },
    '.cm-completionIcon-text': { '&:after': { content: "'abc'", fontSize: '50%', verticalAlign: 'middle' } },
  }); const fl = class {constructor(e, t, n, s) { this.field = e, this.line = t, this.from = n, this.to = s; }}; var On = class {
    constructor(e, t, n) { this.field = e, this.from = t, this.to = n; }

    map(e) { const t = e.mapPos(this.from, -1, oe.TrackDel); const n = e.mapPos(this.to, 1, oe.TrackDel); return t == null || n == null ? null : new On(this.field, t, n); }
  }; var Sn = class {
    constructor(e, t) { this.lines = e, this.fieldPositions = t; }

    instantiate(e, t) { const n = []; const s = [t]; const r = e.doc.lineAt(t); const o = /^\s*/.exec(r.text)[0]; for (let a of this.lines) { if (n.length) { let h = o; const c = /^\t*/.exec(a)[0].length; for (let f = 0; f < c; f++)h += e.facet(Ci); s.push(t + h.length - c), a = h + a.slice(c); }n.push(a), t += a.length + 1; } const l = this.fieldPositions.map(a => new On(a.field, s[a.line] + a.from, s[a.line] + a.to)); return { text: n, ranges: l }; }

    static parse(e) { const t = []; const n = []; const s = []; let r; for (let o of e.split(/\r\n?|\n/)) { for (;r = /[#$]\{(?:(\d+)(?::([^}]*))?|([^}]*))\}/.exec(o);) { const l = r[1] ? +r[1] : null; const a = r[2] || r[3] || ''; let h = -1; for (let c = 0; c < t.length; c++)(l != null ? t[c].seq == l : a ? t[c].name == a : !1) && (h = c); if (h < 0) { let c = 0; for (;c < t.length && (l == null || t[c].seq != null && t[c].seq < l);)c++; t.splice(c, 0, { seq: l, name: a }), h = c; for (const f of s)f.field >= h && f.field++; }s.push(new fl(h, n.length, r.index, r.index + a.length)), o = o.slice(0, r.index) + a + o.slice(r.index + r[0].length); }n.push(o); } return new Sn(n, s); }
  }; const D0 = A.widget({
    widget: new class extends Ae {
      toDOM() { const i = document.createElement('span'); return i.className = 'cm-snippetFieldPosition', i; }

      ignoreEvent() { return !1; }
    }(),
  }); const L0 = A.mark({ class: 'cm-snippetField' }); var It = class {
    constructor(e, t) { this.ranges = e, this.active = t, this.deco = A.set(e.map(n => (n.from == n.to ? D0 : L0).range(n.from, n.to))); }

    map(e) { const t = []; for (const n of this.ranges) { const s = n.map(e); if (!s) return null; t.push(s); } return new It(t, this.active); }

    selectionInsideField(e) { return e.ranges.every(t => this.ranges.some(n => n.field == this.active && n.from <= t.from && n.to >= t.to)); }
  }; const An = M.define({ map(i, e) { return i && i.map(e); } }); const R0 = M.define(); const Cn = V.define({ create() { return null; }, update(i, e) { for (const t of e.effects) { if (t.is(An)) return t.value; if (t.is(R0) && i) return new It(i.ranges, t.value); } return i && e.docChanged && (i = i.map(e.changes)), i && e.selection && !i.selectionInsideField(e.selection) && (i = null), i; }, provide: i => O.decorations.from(i, e => (e ? e.deco : A.none)) }); function pl(i, e) { return m.create(i.filter(t => t.field == e).map(t => m.range(t.from, t.to))); } function cu(i) { const e = Sn.parse(i); return (t, n, s, r) => { const { text: o, ranges: l } = e.instantiate(t.state, s); const a = { changes: { from: s, to: r, insert: z.of(o) } }; if (l.length && (a.selection = pl(l, 0)), l.length > 1) { const h = new It(l, 0); const c = a.effects = [An.of(h)]; t.state.field(Cn, !1) === void 0 && c.push(M.appendConfig.of([Cn, F0, z0, hu])); }t.dispatch(t.state.update(a)); }; } function fu(i) { return ({ state: e, dispatch: t }) => { const n = e.field(Cn, !1); if (!n || i < 0 && n.active == 0) return !1; const s = n.active + i; const r = i > 0 && !n.ranges.some(o => o.field == s + i); return t(e.update({ selection: pl(n.ranges, s), effects: An.of(r ? null : new It(n.ranges, s)) })), !0; }; } const B0 = ({ state: i, dispatch: e }) => (i.field(Cn, !1) ? (e(i.update({ effects: An.of(null) })), !0) : !1); const N0 = fu(1); const $0 = fu(-1); const I0 = [{ key: 'Tab', run: N0, shift: $0 }, { key: 'Escape', run: B0 }]; const iu = v.define({ combine(i) { return i.length ? i[0] : I0; } }); var F0 = Ye.highest(Pe.compute([iu], i => i.facet(iu))); var z0 = O.domEventHandlers({ mousedown(i, e) { const t = e.state.field(Cn, !1); let n; if (!t || (n = e.posAtCoords({ x: i.clientX, y: i.clientY })) == null) return !1; const s = t.ranges.find(r => r.from <= n && r.to >= n); return !s || s.field == t.active ? !1 : (e.dispatch({ selection: pl(t.ranges, s.field), effects: An.of(t.ranges.some(r => r.field > s.field) ? new It(t.ranges, s.field) : null) }), !0); } }); const js = { brackets: ['(', '[', '{', "'", '"'], before: ')]}:;>' }; const Kt = M.define({ map(i, e) { const t = e.mapPos(i, -1, oe.TrackAfter); return t ?? void 0; } }); const ml = M.define({ map(i, e) { return e.mapPos(i); } }); const gl = new class extends je {}(); gl.startSide = 1; gl.endSide = -1; const uu = V.define({ create() { return I.empty; }, update(i, e) { if (e.selection) { const t = e.state.doc.lineAt(e.selection.main.head).from; const n = e.startState.doc.lineAt(e.startState.selection.main.head).from; t != e.changes.mapPos(n, -1) && (i = I.empty); }i = i.map(e.changes); for (const t of e.effects)t.is(Kt) ? i = i.update({ add: [gl.range(t.value, t.value + 1)] }) : t.is(ml) && (i = i.update({ filter: n => n != t.value })); return i; } }); function du() { return [W0, uu]; } const ol = '()[]{}<>'; function pu(i) { for (let e = 0; e < ol.length; e += 2) if (ol.charCodeAt(e) == i) return ol.charAt(e + 1); return _i(i < 128 ? i : i + 1); } function mu(i, e) { return i.languageDataAt('closeBrackets', e)[0] || js; } const V0 = typeof navigator === 'object' && /Android\b/.test(navigator.userAgent); var W0 = O.inputHandler.of((i, e, t, n) => { if ((V0 ? i.composing : i.compositionStarted) || i.state.readOnly) return !1; const s = i.state.selection.main; if (n.length > 2 || n.length == 2 && Ce(ae(n, 0)) == 1 || e != s.from || t != s.to) return !1; const r = q0(i.state, n); return r ? (i.dispatch(r), !0) : !1; }); const H0 = ({ state: i, dispatch: e }) => { if (i.readOnly) return !1; const n = mu(i, i.selection.main.head).brackets || js.brackets; let s = null; const r = i.changeByRange((o) => { if (o.empty) { const l = U0(i.doc, o.head); for (const a of n) if (a == l && Gs(i.doc, o.head) == pu(ae(a, 0))) return { changes: { from: o.head - a.length, to: o.head + a.length }, range: m.cursor(o.head - a.length), userEvent: 'delete.backward' }; } return { range: s = o }; }); return s || e(i.update(r, { scrollIntoView: !0 })), !s; }; const gu = [{ key: 'Backspace', run: H0 }]; function q0(i, e) { const t = mu(i, i.selection.main.head); const n = t.brackets || js.brackets; for (const s of n) { const r = pu(ae(s, 0)); if (e == s) return r == s ? G0(i, s, n.indexOf(s + s + s) > -1) : _0(i, s, r, t.before || js.before); if (e == r && bu(i, i.selection.main.from)) return j0(i, s, r); } return null; } function bu(i, e) { let t = !1; return i.field(uu).between(0, i.doc.length, (n) => { n == e && (t = !0); }), t; } function Gs(i, e) { const t = i.sliceString(e, e + 2); return t.slice(0, Ce(ae(t, 0))); } function U0(i, e) { const t = i.sliceString(e - 2, e); return Ce(ae(t, 0)) == t.length ? t : t.slice(1); } function _0(i, e, t, n) { let s = null; const r = i.changeByRange((o) => { if (!o.empty) return { changes: [{ insert: e, from: o.from }, { insert: t, from: o.to }], effects: Kt.of(o.to + e.length), range: m.range(o.anchor + e.length, o.head + e.length) }; const l = Gs(i.doc, o.head); return !l || /\s/.test(l) || n.indexOf(l) > -1 ? { changes: { insert: e + t, from: o.head }, effects: Kt.of(o.head + e.length), range: m.cursor(o.head + e.length) } : { range: s = o }; }); return s ? null : i.update(r, { scrollIntoView: !0, userEvent: 'input.type' }); } function j0(i, e, t) { let n = null; const s = i.selection.ranges.map(r => (r.empty && Gs(i.doc, r.head) == t ? m.cursor(r.head + t.length) : n = r)); return n ? null : i.update({ selection: m.create(s, i.selection.mainIndex), scrollIntoView: !0, effects: i.selection.ranges.map(({ from: r }) => ml.of(r)) }); } function G0(i, e, t) { let n = null; const s = i.changeByRange((r) => { if (!r.empty) return { changes: [{ insert: e, from: r.from }, { insert: e, from: r.to }], effects: Kt.of(r.to + e.length), range: m.range(r.anchor + e.length, r.head + e.length) }; const o = r.head; const l = Gs(i.doc, o); if (l == e) { if (nu(i, o)) return { changes: { insert: e + e, from: o }, effects: Kt.of(o + e.length), range: m.cursor(o + e.length) }; if (bu(i, o)) { const a = t && i.sliceDoc(o, o + e.length * 3) == e + e + e; return { range: m.cursor(o + e.length * (a ? 3 : 1)), effects: ml.of(o) }; } } else { if (t && i.sliceDoc(o - 2 * e.length, o) == e + e && nu(i, o - 2 * e.length)) return { changes: { insert: e + e + e + e, from: o }, effects: Kt.of(o + e.length), range: m.cursor(o + e.length) }; if (i.charCategorizer(o)(l) != le.Word) { const a = i.sliceDoc(o - 1, o); if (a != e && i.charCategorizer(o)(a) != le.Word && !Z0(i, o, e)) return { changes: { insert: e + e, from: o }, effects: Kt.of(o + e.length), range: m.cursor(o + e.length) }; } } return { range: n = r }; }); return n ? null : i.update(s, { scrollIntoView: !0, userEvent: 'input.type' }); } function nu(i, e) { const t = H(i).resolveInner(e + 1); return t.parent && t.from == e; } function Z0(i, e, t) { let n = H(i).resolveInner(e, -1); for (let s = 0; s < 5; s++) { if (i.sliceDoc(n.from, n.from + t.length) == t) return !0; const r = n.to == e && n.parent; if (!r) break; n = r; } return !1; } function yu(i = {}) { return [Xe, ei.of(i), E0, Q0, hu]; } const bl = [{ key: 'Ctrl-Space', run: A0 }, { key: 'Escape', run: T0 }, { key: 'ArrowDown', run: qs(!0) }, { key: 'ArrowUp', run: qs(!1) }, { key: 'PageDown', run: qs(!0, 'page') }, { key: 'PageUp', run: qs(!1, 'page') }, { key: 'Enter', run: C0 }]; var Q0 = Ye.highest(Pe.computeN([ei], i => (i.facet(ei).defaultKeymap ? [bl] : []))); const xl = class {constructor(e, t, n) { this.from = e, this.to = t, this.diagnostic = n; }}; var yt = class {
    constructor(e, t, n) { this.diagnostics = e, this.panel = t, this.selected = n; }

    static init(e, t, n) { let s = e; const r = n.facet(ti).markerFilter; r && (s = r(s)); const o = A.set(s.map(l => (l.from == l.to || l.from == l.to - 1 && n.doc.lineAt(l.from).to == l.from ? A.widget({ widget: new wl(l), diagnostic: l }).range(l.from) : A.mark({ attributes: { class: `cm-lintRange cm-lintRange-${l.severity}` }, diagnostic: l }).range(l.from, l.to))), !0); return new yt(o, t, Di(o)); }
  }; function Di(i, e = null, t = 0) { let n = null; return i.between(t, 1e9, (s, r, { spec: o }) => { if (!(e && o.diagnostic != e)) return n = new xl(s, r, o.diagnostic), !1; }), n; } function wu(i, e) { return !!(i.effects.some(t => t.is(Xs)) || i.changes.touchesRange(e.pos)); } function ku(i, e) { return i.field(Re, !1) ? e : e.concat(M.appendConfig.of([Re, O.decorations.compute([Re], (t) => { const { selected: n, panel: s } = t.field(Re); return !n || !s || n.from == n.to ? A.none : A.set([K0.range(n.from, n.to)]); }), oc(J0, { hideOn: wu }), ib])); } function X0(i, e) { return { effects: ku(i, [Xs.of(e)]) }; } var Xs = M.define(); const vl = M.define(); const vu = M.define(); var Re = V.define({ create() { return new yt(A.none, null, null); }, update(i, e) { if (e.docChanged) { const t = i.diagnostics.map(e.changes); let n = null; if (i.selected) { const s = e.changes.mapPos(i.selected.from, 1); n = Di(t, i.selected.diagnostic, s) || Di(t, null, s); }i = new yt(t, i.panel, n); } for (const t of e.effects)t.is(Xs) ? i = yt.init(t.value, i.panel, e.state) : t.is(vl) ? i = new yt(i.diagnostics, t.value ? Li.open : null, i.selected) : t.is(vu) && (i = new yt(i.diagnostics, i.panel, t.value)); return i; }, provide: i => [pt.from(i, e => e.panel), O.decorations.from(i, e => e.diagnostics)] }); var K0 = A.mark({ class: 'cm-lintRange cm-lintRange-active' }); function J0(i, e, t) {
    const { diagnostics: n } = i.state.field(Re); let s = []; let r = 2e8; let o = 0; n.between(e - (t < 0 ? 1 : 0), e + (t > 0 ? 1 : 0), (a, h, { spec: c }) => { e >= a && e <= h && (a == h || (e > a || t > 0) && (e < h || t < 0)) && (s.push(c.diagnostic), r = Math.min(a, r), o = Math.max(h, o)); }); const l = i.state.facet(ti).tooltipFilter; return l && (s = l(s)), s.length ? {
      pos: r, end: o, above: i.state.doc.lineAt(r).to < o, create() { return { dom: Ou(i, s) }; },
    } : null;
  } function Ou(i, e) { return U('ul', { class: 'cm-tooltip-lint' }, e.map(t => Au(i, t, !1))); } const Y0 = (i) => { const e = i.state.field(Re, !1); (!e || !e.panel) && i.dispatch({ effects: ku(i.state, [vl.of(!0)]) }); const t = jt(i, Li.open); return t && t.dom.querySelector('.cm-panel-lint ul').focus(), !0; }; const xu = (i) => { const e = i.state.field(Re, !1); return !e || !e.panel ? !1 : (i.dispatch({ effects: vl.of(!1) }), !0); }; const eb = (i) => { const e = i.state.field(Re, !1); if (!e) return !1; const t = i.state.selection.main; let n = e.diagnostics.iter(t.to + 1); return !n.value && (n = e.diagnostics.iter(0), !n.value || n.from == t.from && n.to == t.to) ? !1 : (i.dispatch({ selection: { anchor: n.from, head: n.to }, scrollIntoView: !0 }), !0); }; const Su = [{ key: 'Mod-Shift-m', run: Y0 }, { key: 'F8', run: eb }]; const tb = q.fromClass(class {
    constructor(i) { this.view = i, this.timeout = -1, this.set = !0; const { delay: e } = i.state.facet(ti); this.lintTime = Date.now() + e, this.run = this.run.bind(this), this.timeout = setTimeout(this.run, e); }

    run() { const i = Date.now(); if (i < this.lintTime - 10)setTimeout(this.run, this.lintTime - i); else { this.set = !1; const { state: e } = this.view; const { sources: t } = e.facet(ti); Promise.all(t.map(n => Promise.resolve(n(this.view)))).then((n) => { const s = n.reduce((r, o) => r.concat(o)); this.view.state.doc == e.doc && this.view.dispatch(X0(this.view.state, s)); }, (n) => { ge(this.view.state, n); }); } }

    update(i) { const e = i.state.facet(ti); (i.docChanged || e != i.startState.facet(ti)) && (this.lintTime = Date.now() + e.delay, this.set || (this.set = !0, this.timeout = setTimeout(this.run, e.delay))); }

    force() { this.set && (this.lintTime = Date.now(), this.run()); }

    destroy() { clearTimeout(this.timeout); }
  }); var ti = v.define({ combine(i) { return { sources: i.map(e => e.source), ...me(i.map(e => e.config), { delay: 750, markerFilter: null, tooltipFilter: null }) }; }, enables: tb }); function Ks(i, e = {}) { return ti.of({ source: i, config: e }); } function Cu(i) { const e = []; if (i)e:for (const { name: t } of i) { for (let n = 0; n < t.length; n++) { const s = t[n]; if (/[a-zA-Z]/.test(s) && !e.some(r => r.toLowerCase() == s.toLowerCase())) { e.push(s); continue e; } }e.push(''); } return e; } function Au(i, e, t) {
    let n; const s = t ? Cu(e.actions) : []; return U('li', { class: `cm-diagnostic cm-diagnostic-${e.severity}` }, U('span', { class: 'cm-diagnosticText' }, e.message), (n = e.actions) === null || n === void 0 ? void 0 : n.map((r, o) => {
      const l = (f) => { f.preventDefault(); const u = Di(i.state.field(Re).diagnostics, e); u && r.apply(i, u.from, u.to); }; const { name: a } = r; const h = s[o] ? a.indexOf(s[o]) : -1; const c = h < 0 ? a : [a.slice(0, h), U('u', a.slice(h, h + 1)), a.slice(h + 1)]; return U('button', {
        type: 'button', class: 'cm-diagnosticAction', onclick: l, onmousedown: l, 'aria-label': ` Action: ${a}${h < 0 ? '' : ` (access key "${s[o]})"`}.`,
      }, c);
    }), e.source && U('div', { class: 'cm-diagnosticSource' }, e.source));
  } var wl = class extends Ae {
    constructor(e) { super(), this.diagnostic = e; }

    eq(e) { return e.diagnostic == this.diagnostic; }

    toDOM() { return U('span', { class: `cm-lintPoint cm-lintPoint-${this.diagnostic.severity}` }); }
  }; const Qs = class {constructor(e, t) { this.diagnostic = t, this.id = `item_${Math.floor(Math.random() * 4294967295).toString(16)}`, this.dom = Au(e, t, !0), this.dom.id = this.id, this.dom.setAttribute('role', 'option'); }}; var Li = class {
    constructor(e) {
      this.view = e, this.items = []; const t = (s) => { if (s.keyCode == 27)xu(this.view), this.view.focus(); else if (s.keyCode == 38 || s.keyCode == 33) this.moveSelection((this.selectedIndex - 1 + this.items.length) % this.items.length); else if (s.keyCode == 40 || s.keyCode == 34) this.moveSelection((this.selectedIndex + 1) % this.items.length); else if (s.keyCode == 36) this.moveSelection(0); else if (s.keyCode == 35) this.moveSelection(this.items.length - 1); else if (s.keyCode == 13) this.view.focus(); else if (s.keyCode >= 65 && s.keyCode <= 90 && this.selectedIndex >= 0) { const { diagnostic: r } = this.items[this.selectedIndex]; const o = Cu(r.actions); for (let l = 0; l < o.length; l++) if (o[l].toUpperCase().charCodeAt(0) == s.keyCode) { const a = Di(this.view.state.field(Re).diagnostics, r); a && r.actions[l].apply(e, a.from, a.to); } } else return; s.preventDefault(); }; const n = (s) => { for (let r = 0; r < this.items.length; r++) this.items[r].dom.contains(s.target) && this.moveSelection(r); }; this.list = U('ul', {
        tabIndex: 0, role: 'listbox', 'aria-label': this.view.state.phrase('Diagnostics'), onkeydown: t, onclick: n,
      }), this.dom = U('div', { class: 'cm-panel-lint' }, this.list, U('button', {
        type: 'button', name: 'close', 'aria-label': this.view.state.phrase('close'), onclick: () => xu(this.view),
      }, '\xD7')), this.update();
    }

    get selectedIndex() { const e = this.view.state.field(Re).selected; if (!e) return -1; for (let t = 0; t < this.items.length; t++) if (this.items[t].diagnostic == e.diagnostic) return t; return -1; }

    update() {
      const { diagnostics: e, selected: t } = this.view.state.field(Re); let n = 0; let s = !1; let r = null; for (e.between(0, this.view.state.doc.length, (o, l, { spec: a }) => { let h = -1; let c; for (let f = n; f < this.items.length; f++) if (this.items[f].diagnostic == a.diagnostic) { h = f; break; }h < 0 ? (c = new Qs(this.view, a.diagnostic), this.items.splice(n, 0, c), s = !0) : (c = this.items[h], h > n && (this.items.splice(n, h - n), s = !0)), t && c.diagnostic == t.diagnostic ? c.dom.hasAttribute('aria-selected') || (c.dom.setAttribute('aria-selected', 'true'), r = c) : c.dom.hasAttribute('aria-selected') && c.dom.removeAttribute('aria-selected'), n++; }); n < this.items.length && !(this.items.length == 1 && this.items[0].diagnostic.from < 0);)s = !0, this.items.pop(); this.items.length == 0 && (this.items.push(new Qs(this.view, {
        from: -1, to: -1, severity: 'info', message: this.view.state.phrase('No diagnostics'),
      })), s = !0), r ? (this.list.setAttribute('aria-activedescendant', r.id), this.view.requestMeasure({ key: this, read: () => ({ sel: r.dom.getBoundingClientRect(), panel: this.list.getBoundingClientRect() }), write: ({ sel: o, panel: l }) => { o.top < l.top ? this.list.scrollTop -= l.top - o.top : o.bottom > l.bottom && (this.list.scrollTop += o.bottom - l.bottom); } })) : this.selectedIndex < 0 && this.list.removeAttribute('aria-activedescendant'), s && this.sync();
    }

    sync() { let e = this.list.firstChild; function t() { const n = e; e = n.nextSibling, n.remove(); } for (const n of this.items) if (n.dom.parentNode == this.list) { for (;e != n.dom;)t(); e = n.dom.nextSibling; } else this.list.insertBefore(n.dom, e); for (;e;)t(); }

    moveSelection(e) { if (this.selectedIndex < 0) return; const t = this.view.state.field(Re); const n = Di(t.diagnostics, this.items[e].diagnostic); !n || this.view.dispatch({ selection: { anchor: n.from, head: n.to }, scrollIntoView: !0, effects: vu.of(n) }); }

    static open(e) { return new Li(e); }
  }; function Zs(i, e = 'viewBox="0 0 40 40"') { return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" ${e}>${encodeURIComponent(i)}</svg>')`; } function yl(i) { return Zs(`<path d="m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0" stroke="${i}" fill="none" stroke-width=".7"/>`, 'width="6" height="3"'); } var ib = O.baseTheme({
    '.cm-diagnostic': {
      padding: '3px 6px 3px 8px', marginLeft: '-1px', display: 'block', whiteSpace: 'pre-wrap',
    },
    '.cm-diagnostic-error': { borderLeft: '5px solid #d11' },
    '.cm-diagnostic-warning': { borderLeft: '5px solid orange' },
    '.cm-diagnostic-info': { borderLeft: '5px solid #999' },
    '.cm-diagnosticAction': {
      font: 'inherit', border: 'none', padding: '2px 4px', backgroundColor: '#444', color: 'white', borderRadius: '3px', marginLeft: '8px',
    },
    '.cm-diagnosticSource': { fontSize: '70%', opacity: 0.7 },
    '.cm-lintRange': { backgroundPosition: 'left bottom', backgroundRepeat: 'repeat-x', paddingBottom: '0.7px' },
    '.cm-lintRange-error': { backgroundImage: yl('#d11') },
    '.cm-lintRange-warning': { backgroundImage: yl('orange') },
    '.cm-lintRange-info': { backgroundImage: yl('#999') },
    '.cm-lintRange-active': { backgroundColor: '#ffdd9980' },
    '.cm-tooltip-lint': { padding: 0, margin: 0 },
    '.cm-lintPoint': {
      position: 'relative',
      '&:after': {
        content: '""', position: 'absolute', bottom: 0, left: '-2px', borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderBottom: '4px solid #d11',
      },
    },
    '.cm-lintPoint-warning': { '&:after': { borderBottomColor: 'orange' } },
    '.cm-lintPoint-info': { '&:after': { borderBottomColor: '#999' } },
    '.cm-panel.cm-panel-lint': {
      position: 'relative',
      '& ul': {
        maxHeight: '100px',
        overflowY: 'auto',
        '& [aria-selected]': { backgroundColor: '#ddd', '& u': { textDecoration: 'underline' } },
        '&:focus [aria-selected]': {
          background_fallback: '#bdf', backgroundColor: 'Highlight', color_fallback: 'white', color: 'HighlightText',
        },
        '& u': { textDecoration: 'none' },
        padding: 0,
        margin: 0,
      },
      '& [name=close]': {
        position: 'absolute', top: '0', right: '2px', background: 'inherit', border: 'none', font: 'inherit', padding: 0, margin: 0,
      },
    },
  }); const kl = class extends Te {
    constructor(e) { super(), this.diagnostics = e, this.severity = e.reduce((t, n) => { const s = n.severity; return s == 'error' || s == 'warning' && t == 'info' ? s : t; }, 'info'); }

    toDOM(e) { const t = document.createElement('div'); t.className = `cm-lint-marker cm-lint-marker-${this.severity}`; let n = this.diagnostics; const s = e.state.facet(Js).tooltipFilter; return s && (n = s(n)), n.length && (t.onmouseover = () => sb(e, t, n)), t; }
  }; function nb(i, e) { const t = (n) => { const s = e.getBoundingClientRect(); if (!(n.clientX > s.left - 10 && n.clientX < s.right + 10 && n.clientY > s.top - 10 && n.clientY < s.bottom + 10)) { for (let r = n.target; r; r = r.parentNode) if (r.nodeType == 1 && r.classList.contains('cm-tooltip-lint')) return; window.removeEventListener('mousemove', t), i.state.field(Pu) && i.dispatch({ effects: Ol.of(null) }); } }; window.addEventListener('mousemove', t); } function sb(i, e, t) { function n() { const o = i.elementAtHeight(e.getBoundingClientRect().top + 5 - i.documentTop); i.coordsAtPos(o.from) && i.dispatch({ effects: Ol.of({ pos: o.from, above: !1, create() { return { dom: Ou(i, t), getCoords: () => e.getBoundingClientRect() }; } }) }), e.onmouseout = e.onmousemove = null, nb(i, e); } const { hoverTime: s } = i.state.facet(Js); let r = setTimeout(n, s); e.onmouseout = () => { clearTimeout(r), e.onmouseout = e.onmousemove = null; }, e.onmousemove = () => { clearTimeout(r), r = setTimeout(n, s); }; } function rb(i, e) { const t = Object.create(null); for (const s of e) { const r = i.lineAt(s.from); (t[r.from] || (t[r.from] = [])).push(s); } const n = []; for (const s in t)n.push(new kl(t[s]).range(+s)); return I.of(n, !0); } const ob = ps({ class: 'cm-gutter-lint', markers: i => i.state.field(Tu) }); var Tu = V.define({ create() { return I.empty; }, update(i, e) { i = i.map(e.changes); const t = e.state.facet(Js).markerFilter; for (const n of e.effects) if (n.is(Xs)) { let s = n.value; t && (s = t(s || [])), i = rb(e.state.doc, s.slice(0)); } return i; } }); var Ol = M.define(); var Pu = V.define({ create() { return null; }, update(i, e) { return i && e.docChanged && (i = wu(e, i) ? null : ({ ...i, pos: e.changes.mapPos(i.pos) })), e.effects.reduce((t, n) => (n.is(Ol) ? n.value : t), i); }, provide: i => bi.from(i) }); const lb = O.baseTheme({
    '.cm-gutter-lint': { width: '1.4em', '& .cm-gutterElement': { padding: '.2em' } }, '.cm-lint-marker': { width: '1em', height: '1em' }, '.cm-lint-marker-info': { content: Zs('<path fill="#aaf" stroke="#77e" stroke-width="6" stroke-linejoin="round" d="M5 5L35 5L35 35L5 35Z"/>') }, '.cm-lint-marker-warning': { content: Zs('<path fill="#fe8" stroke="#fd7" stroke-width="6" stroke-linejoin="round" d="M20 6L37 35L3 35Z"/>') }, '.cm-lint-marker-error:before': { content: Zs('<circle cx="20" cy="20" r="15" fill="#f87" stroke="#f43" stroke-width="6"/>') },
  }); var Js = v.define({ combine(i) { return me(i, { hoverTime: 300, markerFilter: null, tooltipFilter: null }); } }); function Ri(i = {}) { return [Js.of(i), Tu, ob, lb, Pu]; } const Mu = [fc(), uc(), tc(), rf(), $c(), Xh(), ec(), $.allowMultipleSelections.of(!0), Pc(), Fc(zc, { fallback: !0 }), qc(), du(), yu(), nc(), sc(), ic(), jf(), Pe.of([...gu, ...If, ...Qf, ...cf, ...Rc, ...bl, ...Su])]; var $i = class {
    constructor(e, t, n, s, r, o, l, a, h, c = 0, f) { this.p = e, this.stack = t, this.state = n, this.reducePos = s, this.pos = r, this.score = o, this.buffer = l, this.bufferBase = a, this.curContext = h, this.lookAhead = c, this.parent = f; }

    toString() { return `[${this.stack.filter((e, t) => t % 3 == 0).concat(this.state)}]@${this.pos}${this.score ? `!${this.score}` : ''}`; }

    static start(e, t, n = 0) { const s = e.parser.context; return new $i(e, [], t, n, n, 0, [], 0, s ? new er(s, s.start) : null, 0, null); }

    get context() { return this.curContext ? this.curContext.context : null; }

    pushState(e, t) { this.stack.push(this.state, t, this.bufferBase + this.buffer.length), this.state = e; }

    reduce(e) { const t = e >> 19; const n = e & 65535; const { parser: s } = this.p; const r = s.dynamicPrecedence(n); if (r && (this.score += r), t == 0) { this.pushState(s.getGoto(this.state, n, !0), this.reducePos), n < s.minRepeatTerm && this.storeNode(n, this.reducePos, this.reducePos, 4, !0), this.reduceContext(n, this.reducePos); return; } const o = this.stack.length - (t - 1) * 3 - (e & 262144 ? 6 : 0); const l = this.stack[o - 2]; const a = this.stack[o - 1]; const h = this.bufferBase + this.buffer.length - a; if (n < s.minRepeatTerm || e & 131072) { const c = s.stateFlag(this.state, 1) ? this.pos : this.reducePos; this.storeNode(n, l, c, h + 4, !0); } if (e & 262144) this.state = this.stack[o]; else { const c = this.stack[o - 3]; this.state = s.getGoto(c, n, !0); } for (;this.stack.length > o;) this.stack.pop(); this.reduceContext(n, l); }

    storeNode(e, t, n, s = 4, r = !1) { if (e == 0 && (!this.stack.length || this.stack[this.stack.length - 1] < this.buffer.length + this.bufferBase)) { let o = this; let l = this.buffer.length; if (l == 0 && o.parent && (l = o.bufferBase - o.parent.bufferBase, o = o.parent), l > 0 && o.buffer[l - 4] == 0 && o.buffer[l - 1] > -1) { if (t == n) return; if (o.buffer[l - 2] >= t) { o.buffer[l - 2] = n; return; } } } if (!r || this.pos == n) this.buffer.push(e, t, n, s); else { let o = this.buffer.length; if (o > 0 && this.buffer[o - 4] != 0) for (;o > 0 && this.buffer[o - 2] > n;) this.buffer[o] = this.buffer[o - 4], this.buffer[o + 1] = this.buffer[o - 3], this.buffer[o + 2] = this.buffer[o - 2], this.buffer[o + 3] = this.buffer[o - 1], o -= 4, s > 4 && (s -= 4); this.buffer[o] = e, this.buffer[o + 1] = t, this.buffer[o + 2] = n, this.buffer[o + 3] = s; } }

    shift(e, t, n) { const s = this.pos; if (e & 131072) this.pushState(e & 65535, this.pos); else if ((e & 262144) == 0) { const r = e; const { parser: o } = this.p; (n > this.pos || t <= o.maxNode) && (this.pos = n, o.stateFlag(r, 1) || (this.reducePos = n)), this.pushState(r, s), this.shiftContext(t, s), t <= o.maxNode && this.buffer.push(t, s, n, 4); } else this.pos = n, this.shiftContext(t, s), t <= this.p.parser.maxNode && this.buffer.push(t, s, n, 4); }

    apply(e, t, n) { e & 65536 ? this.reduce(e) : this.shift(e, t, n); }

    useNode(e, t) { let n = this.p.reused.length - 1; (n < 0 || this.p.reused[n] != e) && (this.p.reused.push(e), n++); const s = this.pos; this.reducePos = this.pos = s + e.length, this.pushState(t, s), this.buffer.push(n, s, this.reducePos, -1), this.curContext && this.updateContext(this.curContext.tracker.reuse(this.curContext.context, e, this, this.p.stream.reset(this.pos - e.length))); }

    split() { let e = this; let t = e.buffer.length; for (;t > 0 && e.buffer[t - 2] > e.reducePos;)t -= 4; const n = e.buffer.slice(t); const s = e.bufferBase + t; for (;e && s == e.bufferBase;)e = e.parent; return new $i(this.p, this.stack.slice(), this.state, this.reducePos, this.pos, this.score, n, s, this.curContext, this.lookAhead, e); }

    recoverByDelete(e, t) { const n = e <= this.p.parser.maxNode; n && this.storeNode(e, this.pos, t, 4), this.storeNode(0, this.pos, t, n ? 8 : 4), this.pos = this.reducePos = t, this.score -= 190; }

    canShift(e) { for (let t = new Al(this); ;) { const n = this.p.parser.stateSlot(t.state, 4) || this.p.parser.hasAction(t.state, e); if ((n & 65536) == 0) return !0; if (n == 0) return !1; t.reduce(n); } }

    recoverByInsert(e) { if (this.stack.length >= 300) return []; let t = this.p.parser.nextStates(this.state); if (t.length > 4 << 1 || this.stack.length >= 120) { const s = []; for (let r = 0, o; r < t.length; r += 2)(o = t[r + 1]) != this.state && this.p.parser.hasAction(o, e) && s.push(t[r], o); if (this.stack.length < 120) for (let r = 0; s.length < 4 << 1 && r < t.length; r += 2) { const o = t[r + 1]; s.some((l, a) => a & 1 && l == o) || s.push(t[r], o); }t = s; } const n = []; for (let s = 0; s < t.length && n.length < 4; s += 2) { const r = t[s + 1]; if (r == this.state) continue; const o = this.split(); o.pushState(r, this.pos), o.storeNode(0, o.pos, o.pos, 4, !0), o.shiftContext(t[s], this.pos), o.score -= 200, n.push(o); } return n; }

    forceReduce() { const e = this.p.parser.stateSlot(this.state, 5); if ((e & 65536) == 0) return !1; const { parser: t } = this.p; if (!t.validAction(this.state, e)) { const n = e >> 19; const s = e & 65535; const r = this.stack.length - n * 3; if (r < 0 || t.getGoto(this.stack[r], s, !1) < 0) return !1; this.storeNode(0, this.reducePos, this.reducePos, 4, !0), this.score -= 100; } return this.reduce(e), !0; }

    forceAll() { for (;!this.p.parser.stateFlag(this.state, 2);) if (!this.forceReduce()) { this.storeNode(0, this.pos, this.pos, 4, !0); break; } return this; }

    get deadEnd() { if (this.stack.length != 3) return !1; const { parser: e } = this.p; return e.data[e.stateSlot(this.state, 1)] == 65535 && !e.stateSlot(this.state, 4); }

    restart() { this.state = this.stack[0], this.stack.length = 0; }

    sameState(e) { if (this.state != e.state || this.stack.length != e.stack.length) return !1; for (let t = 0; t < this.stack.length; t += 3) if (this.stack[t] != e.stack[t]) return !1; return !0; }

    get parser() { return this.p.parser; }

    dialectEnabled(e) { return this.p.parser.dialect.flags[e]; }

    shiftContext(e, t) { this.curContext && this.updateContext(this.curContext.tracker.shift(this.curContext.context, e, this, this.p.stream.reset(t))); }

    reduceContext(e, t) { this.curContext && this.updateContext(this.curContext.tracker.reduce(this.curContext.context, e, this, this.p.stream.reset(t))); }

    emitContext() { const e = this.buffer.length - 1; (e < 0 || this.buffer[e] != -3) && this.buffer.push(this.curContext.hash, this.reducePos, this.reducePos, -3); }

    emitLookAhead() { const e = this.buffer.length - 1; (e < 0 || this.buffer[e] != -4) && this.buffer.push(this.lookAhead, this.reducePos, this.reducePos, -4); }

    updateContext(e) { if (e != this.curContext.context) { const t = new er(this.curContext.tracker, e); t.hash != this.curContext.hash && this.emitContext(), this.curContext = t; } }

    setLookAhead(e) { e > this.lookAhead && (this.emitLookAhead(), this.lookAhead = e); }

    close() { this.curContext && this.curContext.tracker.strict && this.emitContext(), this.lookAhead > 0 && this.emitLookAhead(); }
  }; var er = class {constructor(e, t) { this.tracker = e, this.context = t, this.hash = e.strict ? e.hash(t) : 0; }}; let Eu; (function (i) { i[i.Insert = 200] = 'Insert', i[i.Delete = 190] = 'Delete', i[i.Reduce = 100] = 'Reduce', i[i.MaxNext = 4] = 'MaxNext', i[i.MaxInsertStackDepth = 300] = 'MaxInsertStackDepth', i[i.DampenInsertStackDepth = 120] = 'DampenInsertStackDepth'; }(Eu || (Eu = {}))); var Al = class {
    constructor(e) { this.start = e, this.state = e.state, this.stack = e.stack, this.base = this.stack.length; }

    reduce(e) { const t = e & 65535; const n = e >> 19; n == 0 ? (this.stack == this.start.stack && (this.stack = this.stack.slice()), this.stack.push(this.state, 0, 0), this.base += 3) : this.base -= (n - 1) * 3; const s = this.start.p.parser.getGoto(this.stack[this.base - 3], t, !0); this.state = s; }
  }; var Ii = class {
    constructor(e, t, n) { this.stack = e, this.pos = t, this.index = n, this.buffer = e.buffer, this.index == 0 && this.maybeNext(); }

    static create(e, t = e.bufferBase + e.buffer.length) { return new Ii(e, t, t - e.bufferBase); }

    maybeNext() { const e = this.stack.parent; e != null && (this.index = this.stack.bufferBase - e.bufferBase, this.stack = e, this.buffer = e.buffer); }

    get id() { return this.buffer[this.index - 4]; }

    get start() { return this.buffer[this.index - 3]; }

    get end() { return this.buffer[this.index - 2]; }

    get size() { return this.buffer[this.index - 1]; }

    next() { this.index -= 4, this.pos -= 4, this.index == 0 && this.maybeNext(); }

    fork() { return new Ii(this.stack, this.pos, this.index); }
  }; const Bi = class {constructor() { this.start = -1, this.value = -1, this.end = -1, this.extended = -1, this.lookAhead = 0, this.mask = 0, this.context = 0; }}; const Du = new Bi(); const Tl = class {
    constructor(e, t) { this.input = e, this.ranges = t, this.chunk = '', this.chunkOff = 0, this.chunk2 = '', this.chunk2Pos = 0, this.next = -1, this.token = Du, this.rangeIndex = 0, this.pos = this.chunkPos = t[0].from, this.range = t[0], this.end = t[t.length - 1].to, this.readNext(); }

    resolveOffset(e, t) { let n = this.range; let s = this.rangeIndex; let r = this.pos + e; for (;r < n.from;) { if (!s) return null; const o = this.ranges[--s]; r -= n.from - o.to, n = o; } for (;t < 0 ? r > n.to : r >= n.to;) { if (s == this.ranges.length - 1) return null; const o = this.ranges[++s]; r += o.from - n.to, n = o; } return r; }

    peek(e) { const t = this.chunkOff + e; let n; let s; if (t >= 0 && t < this.chunk.length)n = this.pos + e, s = this.chunk.charCodeAt(t); else { const r = this.resolveOffset(e, 1); if (r == null) return -1; if (n = r, n >= this.chunk2Pos && n < this.chunk2Pos + this.chunk2.length)s = this.chunk2.charCodeAt(n - this.chunk2Pos); else { let o = this.rangeIndex; let l = this.range; for (;l.to <= n;)l = this.ranges[++o]; this.chunk2 = this.input.chunk(this.chunk2Pos = n), n + this.chunk2.length > l.to && (this.chunk2 = this.chunk2.slice(0, l.to - n)), s = this.chunk2.charCodeAt(0); } } return n >= this.token.lookAhead && (this.token.lookAhead = n + 1), s; }

    acceptToken(e, t = 0) { const n = t ? this.resolveOffset(t, -1) : this.pos; if (n == null || n < this.token.start) throw new RangeError('Token end out of bounds'); this.token.value = e, this.token.end = n; }

    getChunk() { if (this.pos >= this.chunk2Pos && this.pos < this.chunk2Pos + this.chunk2.length) { const { chunk: e, chunkPos: t } = this; this.chunk = this.chunk2, this.chunkPos = this.chunk2Pos, this.chunk2 = e, this.chunk2Pos = t, this.chunkOff = this.pos - this.chunkPos; } else { this.chunk2 = this.chunk, this.chunk2Pos = this.chunkPos; const e = this.input.chunk(this.pos); const t = this.pos + e.length; this.chunk = t > this.range.to ? e.slice(0, this.range.to - this.pos) : e, this.chunkPos = this.pos, this.chunkOff = 0; } }

    readNext() { return this.chunkOff >= this.chunk.length && (this.getChunk(), this.chunkOff == this.chunk.length) ? this.next = -1 : this.next = this.chunk.charCodeAt(this.chunkOff); }

    advance(e = 1) { for (this.chunkOff += e; this.pos + e >= this.range.to;) { if (this.rangeIndex == this.ranges.length - 1) return this.setDone(); e -= this.range.to - this.pos, this.range = this.ranges[++this.rangeIndex], this.pos = this.range.from; } return this.pos += e, this.pos >= this.token.lookAhead && (this.token.lookAhead = this.pos + 1), this.readNext(); }

    setDone() { return this.pos = this.chunkPos = this.end, this.range = this.ranges[this.rangeIndex = this.ranges.length - 1], this.chunk = '', this.next = -1; }

    reset(e, t) { if (t ? (this.token = t, t.start = e, t.lookAhead = e + 1, t.value = t.extended = -1) : this.token = Du, this.pos != e) { if (this.pos = e, e == this.end) return this.setDone(), this; for (;e < this.range.from;) this.range = this.ranges[--this.rangeIndex]; for (;e >= this.range.to;) this.range = this.ranges[++this.rangeIndex]; e >= this.chunkPos && e < this.chunkPos + this.chunk.length ? this.chunkOff = e - this.chunkPos : (this.chunk = '', this.chunkOff = 0), this.readNext(); } return this; }

    read(e, t) { if (e >= this.chunkPos && t <= this.chunkPos + this.chunk.length) return this.chunk.slice(e - this.chunkPos, t - this.chunkPos); if (e >= this.chunk2Pos && t <= this.chunk2Pos + this.chunk2.length) return this.chunk2.slice(e - this.chunk2Pos, t - this.chunk2Pos); if (e >= this.range.from && t <= this.range.to) return this.input.read(e, t); let n = ''; for (const s of this.ranges) { if (s.from >= t) break; s.to > e && (n += this.input.read(Math.max(s.from, e), Math.min(s.to, t))); } return n; }
  }; const Ni = class {
    constructor(e, t) { this.data = e, this.id = t; }

    token(e, t) { hb(this.data, e, t, this.id); }
  }; Ni.prototype.contextual = Ni.prototype.fallback = Ni.prototype.extend = !1; const Ft = class {constructor(e, t = {}) { this.token = e, this.contextual = !!t.contextual, this.fallback = !!t.fallback, this.extend = !!t.extend; }}; function hb(i, e, t, n) { let s = 0; const r = 1 << n; const { parser: o } = t.p; const { dialect: l } = o; e:for (;(r & i[s]) != 0;) { const a = i[s + 1]; for (let h = s + 3; h < a; h += 2) if ((i[h + 1] & r) > 0) { const c = i[h]; if (l.allows(c) && (e.token.value == -1 || e.token.value == c || o.overrides(c, e.token.value))) { e.acceptToken(c); break; } } for (let h = e.next, c = 0, f = i[s + 2]; c < f;) { const u = c + f >> 1; const d = a + u + (u << 1); const p = i[d]; const g = i[d + 1]; if (h < p)f = u; else if (h >= g)c = u + 1; else { s = i[d + 2], e.advance(); continue e; } } break; } } function Ys(i, e = Uint16Array) { if (typeof i !== 'string') return i; let t = null; for (let n = 0, s = 0; n < i.length;) { let r = 0; for (;;) { let o = i.charCodeAt(n++); let l = !1; if (o == 126) { r = 65535; break; }o >= 92 && o--, o >= 34 && o--; let a = o - 32; if (a >= 46 && (a -= 46, l = !0), r += a, l) break; r *= 46; }t ? t[s++] = r : t = new e(r); } return t; } const Ke = typeof process < 'u' && /\bparse\b/.test(process.env.LOG); let Sl = null; let Lu; (function (i) { i[i.Margin = 25] = 'Margin'; }(Lu || (Lu = {}))); function Ru(i, e, t) { const n = i.cursor(fe.IncludeAnonymous); for (n.moveTo(e); ;) if (!(t < 0 ? n.childBefore(e) : n.childAfter(e))) for (;;) { if ((t < 0 ? n.to < e : n.from > e) && !n.type.isError) return t < 0 ? Math.max(0, Math.min(n.to - 1, e - 25)) : Math.min(i.length, Math.max(n.from + 1, e + 25)); if (t < 0 ? n.prevSibling() : n.nextSibling()) break; if (!n.parent()) return t < 0 ? 0 : i.length; } } const Pl = class {
    constructor(e, t) { this.fragments = e, this.nodeSet = t, this.i = 0, this.fragment = null, this.safeFrom = -1, this.safeTo = -1, this.trees = [], this.start = [], this.index = [], this.nextFragment(); }

    nextFragment() { const e = this.fragment = this.i == this.fragments.length ? null : this.fragments[this.i++]; if (e) { for (this.safeFrom = e.openStart ? Ru(e.tree, e.from + e.offset, 1) - e.offset : e.from, this.safeTo = e.openEnd ? Ru(e.tree, e.to + e.offset, -1) - e.offset : e.to; this.trees.length;) this.trees.pop(), this.start.pop(), this.index.pop(); this.trees.push(e.tree), this.start.push(-e.offset), this.index.push(0), this.nextStart = this.safeFrom; } else this.nextStart = 1e9; }

    nodeAt(e) { if (e < this.nextStart) return null; for (;this.fragment && this.safeTo <= e;) this.nextFragment(); if (!this.fragment) return null; for (;;) { const t = this.trees.length - 1; if (t < 0) return this.nextFragment(), null; const n = this.trees[t]; const s = this.index[t]; if (s == n.children.length) { this.trees.pop(), this.start.pop(), this.index.pop(); continue; } const r = n.children[s]; const o = this.start[t] + n.positions[s]; if (o > e) return this.nextStart = o, null; if (r instanceof J) { if (o == e) { if (o < this.safeFrom) return null; const l = o + r.length; if (l <= this.safeTo) { const a = r.prop(R.lookAhead); if (!a || l + a < this.fragment.to) return r; } } this.index[t]++, o + r.length >= Math.max(this.safeFrom, e) && (this.trees.push(r), this.start.push(o), this.index.push(0)); } else this.index[t]++, this.nextStart = o + r.length; } }
  }; const Ml = class {
    constructor(e, t) { this.stream = t, this.tokens = [], this.mainToken = null, this.actions = [], this.tokens = e.tokenizers.map(n => new Bi()); }

    getActions(e) { let t = 0; let n = null; const { parser: s } = e.p; const { tokenizers: r } = s; const o = s.stateSlot(e.state, 3); const l = e.curContext ? e.curContext.hash : 0; let a = 0; for (let h = 0; h < r.length; h++) { if ((1 << h & o) == 0) continue; const c = r[h]; const f = this.tokens[h]; if (!(n && !c.fallback) && ((c.contextual || f.start != e.pos || f.mask != o || f.context != l) && (this.updateCachedToken(f, c, e), f.mask = o, f.context = l), f.lookAhead > f.end + 25 && (a = Math.max(f.lookAhead, a)), f.value != 0)) { const u = t; if (f.extended > -1 && (t = this.addActions(e, f.extended, f.end, t)), t = this.addActions(e, f.value, f.end, t), !c.extend && (n = f, t > u)) break; } } for (;this.actions.length > t;) this.actions.pop(); return a && e.setLookAhead(a), !n && e.pos == this.stream.end && (n = new Bi(), n.value = e.p.parser.eofTerm, n.start = n.end = e.pos, t = this.addActions(e, n.value, n.end, t)), this.mainToken = n, this.actions; }

    getMainToken(e) {
      if (this.mainToken) return this.mainToken; const t = new Bi(); const
        { pos: n, p: s } = e; return t.start = n, t.end = Math.min(n + 1, s.stream.end), t.value = n == s.stream.end ? s.parser.eofTerm : 0, t;
    }

    updateCachedToken(e, t, n) { if (t.token(this.stream.reset(n.pos, e), n), e.value > -1) { const { parser: s } = n.p; for (let r = 0; r < s.specialized.length; r++) if (s.specialized[r] == e.value) { const o = s.specializers[r](this.stream.read(e.start, e.end), n); if (o >= 0 && n.p.parser.dialect.allows(o >> 1)) { (o & 1) == 0 ? e.value = o >> 1 : e.extended = o >> 1; break; } } } else e.value = 0, e.end = Math.min(n.p.stream.end, n.pos + 1); }

    putAction(e, t, n, s) { for (let r = 0; r < s; r += 3) if (this.actions[r] == e) return s; return this.actions[s++] = e, this.actions[s++] = t, this.actions[s++] = n, s; }

    addActions(e, t, n, s) { const { state: r } = e; const { parser: o } = e.p; const { data: l } = o; for (let a = 0; a < 2; a++) for (let h = o.stateSlot(r, a ? 2 : 1); ;h += 3) { if (l[h] == 65535) if (l[h + 1] == 1)h = xt(l, h + 2); else { s == 0 && l[h + 1] == 2 && (s = this.putAction(xt(l, h + 2), t, n, s)); break; }l[h] == t && (s = this.putAction(xt(l, h + 1), t, n, s)); } return s; }
  }; let Bu; (function (i) { i[i.Distance = 5] = 'Distance', i[i.MaxRemainingPerStep = 3] = 'MaxRemainingPerStep', i[i.MinBufferLengthPrune = 500] = 'MinBufferLengthPrune', i[i.ForceReduceLimit = 10] = 'ForceReduceLimit', i[i.CutDepth = 15e3] = 'CutDepth', i[i.CutTo = 9e3] = 'CutTo'; }(Bu || (Bu = {}))); const El = class {
    constructor(e, t, n, s) { this.parser = e, this.input = t, this.ranges = s, this.recovering = 0, this.nextStackID = 9812, this.minStackPos = 0, this.reused = [], this.stoppedAt = null, this.stream = new Tl(t, s), this.tokens = new Ml(e, this.stream), this.topTerm = e.top[1]; const { from: r } = s[0]; this.stacks = [$i.start(this, e.top[0], r)], this.fragments = n.length && this.stream.end - r > e.bufferLength * 4 ? new Pl(n, e.nodeSet) : null; }

    get parsedPos() { return this.minStackPos; }

    advance() { const e = this.stacks; const t = this.minStackPos; const n = this.stacks = []; let s; let r; for (let o = 0; o < e.length; o++) { const l = e[o]; for (;;) { if (this.tokens.mainToken = null, l.pos > t)n.push(l); else { if (this.advanceStack(l, n, e)) continue; { s || (s = [], r = []), s.push(l); const a = this.tokens.getMainToken(l); r.push(a.value, a.end); } } break; } } if (!n.length) { const o = s && cb(s); if (o) return this.stackToTree(o); if (this.parser.strict) throw Ke && s && console.log(`Stuck with token ${this.tokens.mainToken ? this.parser.getName(this.tokens.mainToken.value) : 'none'}`), new SyntaxError(`No parse at ${t}`); this.recovering || (this.recovering = 5); } if (this.recovering && s) { const o = this.stoppedAt != null && s[0].pos > this.stoppedAt ? s[0] : this.runRecovery(s, r, n); if (o) return this.stackToTree(o.forceAll()); } if (this.recovering) { const o = this.recovering == 1 ? 1 : this.recovering * 3; if (n.length > o) for (n.sort((l, a) => a.score - l.score); n.length > o;)n.pop(); n.some(l => l.reducePos > t) && this.recovering--; } else if (n.length > 1) { e:for (let o = 0; o < n.length - 1; o++) { const l = n[o]; for (let a = o + 1; a < n.length; a++) { const h = n[a]; if (l.sameState(h) || l.buffer.length > 500 && h.buffer.length > 500) if ((l.score - h.score || l.buffer.length - h.buffer.length) > 0)n.splice(a--, 1); else { n.splice(o--, 1); continue e; } } } } this.minStackPos = n[0].pos; for (let o = 1; o < n.length; o++)n[o].pos < this.minStackPos && (this.minStackPos = n[o].pos); return null; }

    stopAt(e) { if (this.stoppedAt != null && this.stoppedAt < e) throw new RangeError("Can't move stoppedAt forward"); this.stoppedAt = e; }

    advanceStack(e, t, n) { const s = e.pos; const { parser: r } = this; const o = Ke ? `${this.stackID(e)} -> ` : ''; if (this.stoppedAt != null && s > this.stoppedAt) return e.forceReduce() ? e : null; if (this.fragments) { const h = e.curContext && e.curContext.tracker.strict; const c = h ? e.curContext.hash : 0; for (let f = this.fragments.nodeAt(s); f;) { const u = this.parser.nodeSet.types[f.type.id] == f.type ? r.getGoto(e.state, f.type.id) : -1; if (u > -1 && f.length && (!h || (f.prop(R.contextHash) || 0) == c)) return e.useNode(f, u), Ke && console.log(`${o + this.stackID(e)} (via reuse of ${r.getName(f.type.id)})`), !0; if (!(f instanceof J) || f.children.length == 0 || f.positions[0] > 0) break; const d = f.children[0]; if (d instanceof J && f.positions[0] == 0)f = d; else break; } } const l = r.stateSlot(e.state, 4); if (l > 0) return e.reduce(l), Ke && console.log(`${o + this.stackID(e)} (via always-reduce ${r.getName(l & 65535)})`), !0; if (e.stack.length >= 15e3) for (;e.stack.length > 9e3 && e.forceReduce(););const a = this.tokens.getActions(e); for (let h = 0; h < a.length;) { const c = a[h++]; const f = a[h++]; const u = a[h++]; const d = h == a.length || !n; const p = d ? e : e.split(); if (p.apply(c, f, u), Ke && console.log(`${o + this.stackID(p)} (via ${(c & 65536) == 0 ? 'shift' : `reduce of ${r.getName(c & 65535)}`} for ${r.getName(f)} @ ${s}${p == e ? '' : ', split'})`), d) return !0; p.pos > s ? t.push(p) : n.push(p); } return !1; }

    advanceFully(e, t) { const n = e.pos; for (;;) { if (!this.advanceStack(e, null, null)) return !1; if (e.pos > n) return Nu(e, t), !0; } }

    runRecovery(e, t, n) { let s = null; let r = !1; for (let o = 0; o < e.length; o++) { const l = e[o]; let a = t[o << 1]; let h = t[(o << 1) + 1]; const c = Ke ? `${this.stackID(l)} -> ` : ''; if (l.deadEnd && (r || (r = !0, l.restart(), Ke && console.log(`${c + this.stackID(l)} (restarted)`), this.advanceFully(l, n)))) continue; const f = l.split(); let u = c; for (let d = 0; f.forceReduce() && d < 10 && (Ke && console.log(`${u + this.stackID(f)} (via force-reduce)`), !this.advanceFully(f, n)); d++)Ke && (u = `${this.stackID(f)} -> `); for (const d of l.recoverByInsert(a))Ke && console.log(`${c + this.stackID(d)} (via recover-insert)`), this.advanceFully(d, n); this.stream.end > l.pos ? (h == l.pos && (h++, a = 0), l.recoverByDelete(a, h), Ke && console.log(`${c + this.stackID(l)} (via recover-delete ${this.parser.getName(a)})`), Nu(l, n)) : (!s || s.score < l.score) && (s = l); } return s; }

    stackToTree(e) {
      return e.close(), J.build({
        buffer: Ii.create(e), nodeSet: this.parser.nodeSet, topID: this.topTerm, maxBufferLength: this.parser.bufferLength, reused: this.reused, start: this.ranges[0].from, length: e.pos - this.ranges[0].from, minRepeatType: this.parser.minRepeatTerm,
      });
    }

    stackID(e) { let t = (Sl || (Sl = new WeakMap())).get(e); return t || Sl.set(e, t = String.fromCodePoint(this.nextStackID++)), t + e; }
  }; function Nu(i, e) { for (let t = 0; t < e.length; t++) { const n = e[t]; if (n.pos == i.pos && n.sameState(i)) { e[t].score < i.score && (e[t] = i); return; } }e.push(i); } const Dl = class {
    constructor(e, t, n) { this.source = e, this.flags = t, this.disabled = n; }

    allows(e) { return !this.disabled || this.disabled[e] == 0; }
  }; const Cl = i => i; const tr = class {constructor(e) { this.start = e.start, this.shift = e.shift || Cl, this.reduce = e.reduce || Cl, this.reuse = e.reuse || Cl, this.hash = e.hash || (() => 0), this.strict = e.strict !== !1; }}; var wt = class extends wi {
    constructor(e) {
      if (super(), this.wrappers = [], e.version != 14) throw new RangeError(`Parser version (${e.version}) doesn't match runtime version (${14})`); const t = e.nodeNames.split(' '); this.minRepeatTerm = t.length; for (let l = 0; l < e.repeatNodeCount; l++)t.push(''); const n = Object.keys(e.topRules).map(l => e.topRules[l][1]); const s = []; for (let l = 0; l < t.length; l++)s.push([]); function r(l, a, h) { s[l].push([a, a.deserialize(String(h))]); } if (e.nodeProps) for (const l of e.nodeProps) { let a = l[0]; typeof a === 'string' && (a = R[a]); for (let h = 1; h < l.length;) { const c = l[h++]; if (c >= 0)r(c, a, l[h++]); else { const f = l[h + -c]; for (let u = -c; u > 0; u--)r(l[h++], a, f); h++; } } } this.nodeSet = new Gt(t.map((l, a) => de.define({
        name: a >= this.minRepeatTerm ? void 0 : l, id: a, props: s[a], top: n.indexOf(a) > -1, error: a == 0, skipped: e.skippedNodes && e.skippedNodes.indexOf(a) > -1,
      }))), e.propSources && (this.nodeSet = this.nodeSet.extend(...e.propSources)), this.strict = !1, this.bufferLength = 1024; const o = Ys(e.tokenData); if (this.context = e.context, this.specialized = new Uint16Array(e.specialized ? e.specialized.length : 0), this.specializers = [], e.specialized) for (let l = 0; l < e.specialized.length; l++) this.specialized[l] = e.specialized[l].term, this.specializers[l] = e.specialized[l].get; this.states = Ys(e.states, Uint32Array), this.data = Ys(e.stateData), this.goto = Ys(e.goto), this.maxTerm = e.maxTerm, this.tokenizers = e.tokenizers.map(l => (typeof l === 'number' ? new Ni(o, l) : l)), this.topRules = e.topRules, this.dialects = e.dialects || {}, this.dynamicPrecedences = e.dynamicPrecedences || null, this.tokenPrecTable = e.tokenPrec, this.termNames = e.termNames || null, this.maxNode = this.nodeSet.types.length - 1, this.dialect = this.parseDialect(), this.top = this.topRules[Object.keys(this.topRules)[0]];
    }

    createParse(e, t, n) { let s = new El(this, e, t, n); for (const r of this.wrappers)s = r(s, e, t, n); return s; }

    getGoto(e, t, n = !1) { const s = this.goto; if (t >= s[0]) return -1; for (let r = s[t + 1]; ;) { const o = s[r++]; const l = o & 1; const a = s[r++]; if (l && n) return a; for (let h = r + (o >> 1); r < h; r++) if (s[r] == e) return a; if (l) return -1; } }

    hasAction(e, t) { const n = this.data; for (let s = 0; s < 2; s++) for (let r = this.stateSlot(e, s ? 2 : 1), o; ;r += 3) { if ((o = n[r]) == 65535) if (n[r + 1] == 1)o = n[r = xt(n, r + 2)]; else { if (n[r + 1] == 2) return xt(n, r + 2); break; } if (o == t || o == 0) return xt(n, r + 1); } return 0; }

    stateSlot(e, t) { return this.states[e * 6 + t]; }

    stateFlag(e, t) { return (this.stateSlot(e, 0) & t) > 0; }

    validAction(e, t) { if (t == this.stateSlot(e, 4)) return !0; for (let n = this.stateSlot(e, 1); ;n += 3) { if (this.data[n] == 65535) if (this.data[n + 1] == 1)n = xt(this.data, n + 2); else return !1; if (t == xt(this.data, n + 1)) return !0; } }

    nextStates(e) { const t = []; for (let n = this.stateSlot(e, 1); ;n += 3) { if (this.data[n] == 65535) if (this.data[n + 1] == 1)n = xt(this.data, n + 2); else break; if ((this.data[n + 2] & 1) == 0) { const s = this.data[n + 1]; t.some((r, o) => o & 1 && r == s) || t.push(this.data[n], s); } } return t; }

    overrides(e, t) { const n = $u(this.data, this.tokenPrecTable, t); return n < 0 || $u(this.data, this.tokenPrecTable, e) < n; }

    configure(e) { const t = Object.assign(Object.create(wt.prototype), this); if (e.props && (t.nodeSet = this.nodeSet.extend(...e.props)), e.top) { const n = this.topRules[e.top]; if (!n) throw new RangeError(`Invalid top rule name ${e.top}`); t.top = n; } return e.tokenizers && (t.tokenizers = this.tokenizers.map((n) => { const s = e.tokenizers.find(r => r.from == n); return s ? s.to : n; })), e.contextTracker && (t.context = e.contextTracker), e.dialect && (t.dialect = this.parseDialect(e.dialect)), e.strict != null && (t.strict = e.strict), e.wrap && (t.wrappers = t.wrappers.concat(e.wrap)), e.bufferLength != null && (t.bufferLength = e.bufferLength), t; }

    hasWrappers() { return this.wrappers.length > 0; }

    getName(e) { return this.termNames ? this.termNames[e] : String(e <= this.maxNode && this.nodeSet.types[e].name || e); }

    get eofTerm() { return this.maxNode + 1; }

    get topNode() { return this.nodeSet.types[this.top[1]]; }

    dynamicPrecedence(e) { const t = this.dynamicPrecedences; return t == null ? 0 : t[e] || 0; }

    parseDialect(e) { const t = Object.keys(this.dialects); const n = t.map(() => !1); if (e) for (const r of e.split(' ')) { const o = t.indexOf(r); o >= 0 && (n[o] = !0); } let s = null; for (let r = 0; r < t.length; r++) if (!n[r]) for (let o = this.dialects[t[r]], l; (l = this.data[o++]) != 65535;)(s || (s = new Uint8Array(this.maxTerm + 1)))[l] = 1; return new Dl(e, n, s); }

    static deserialize(e) { return new wt(e); }
  }; function xt(i, e) { return i[e] | i[e + 1] << 16; } function $u(i, e, t) { for (let n = e, s; (s = i[n]) != 65535; n++) if (s == t) return n - e; return -1; } function cb(i) { let e = null; for (const t of i) { const n = t.p.stoppedAt; (t.pos == t.p.stream.end || n != null && t.pos > n) && t.p.parser.stateFlag(t.state, 2) && (!e || e.score < t.score) && (e = t); } return e; } const Ll = 1; const fb = 2; const ub = 3; const db = 4; const pb = 5; const mb = 35; const gb = 36; const bb = 37; const yb = 11; const xb = 13; function wb(i) { return i == 45 || i == 46 || i == 58 || i >= 65 && i <= 90 || i == 95 || i >= 97 && i <= 122 || i >= 161; } function kb(i) { return i == 9 || i == 10 || i == 13 || i == 32; } let Iu = null; let Fu = null; let zu = 0; function Rl(i, e) { const t = i.pos + e; if (Fu == i && zu == t) return Iu; for (;kb(i.peek(e));)e++; let n = ''; for (;;) { const s = i.peek(e); if (!wb(s)) break; n += String.fromCharCode(s), e++; } return Fu = i, zu = t, Iu = n || null; } function Vu(i, e) { this.name = i, this.parent = e, this.hash = e ? e.hash : 0; for (let t = 0; t < i.length; t++) this.hash += (this.hash << 4) + i.charCodeAt(t) + (i.charCodeAt(t) << 8); } const vb = new tr({
    start: null, shift(i, e, t, n) { return e == Ll ? new Vu(Rl(n, 1) || '', i) : i; }, reduce(i, e) { return e == yb && i ? i.parent : i; }, reuse(i, e, t, n) { const s = e.type.id; return s == Ll || s == xb ? new Vu(Rl(n, 1) || '', i) : i; }, hash(i) { return i ? i.hash : 0; }, strict: !1,
  }); const Ob = new Ft((i, e) => { if (i.next == 60) { if (i.advance(), i.next == 47) { i.advance(); const t = Rl(i, 0); if (!t) return i.acceptToken(pb); if (e.context && t == e.context.name) return i.acceptToken(fb); for (let n = e.context; n; n = n.parent) if (n.name == t) return i.acceptToken(ub, -2); i.acceptToken(db); } else if (i.next != 33 && i.next != 63) return i.acceptToken(Ll); } }, { contextual: !0 }); function Bl(i, e) { return new Ft((t) => { for (let n = 0, s = 0; ;s++) { if (t.next < 0) { s && t.acceptToken(i); break; } if (t.next == e.charCodeAt(n)) { if (n++, n == e.length) { s > e.length && t.acceptToken(i, 1 - e.length); break; } } else n = 0; t.advance(); } }); } const Sb = Bl(mb, '-->'); const Cb = Bl(gb, '?>'); const Ab = Bl(bb, ']]>'); const Tb = vi({
    Text: x.content, 'StartTag StartCloseTag EndTag SelfCloseEndTag': x.angleBracket, TagName: x.tagName, 'MismatchedCloseTag/Tagname': [x.tagName, x.invalid], AttributeName: x.attributeName, AttributeValue: x.attributeValue, Is: x.definitionOperator, 'EntityReference CharacterReference': x.character, Comment: x.blockComment, ProcessingInst: x.processingInstruction, DoctypeDecl: x.documentMeta, Cdata: x.special(x.string),
  }); const Wu = wt.deserialize({
    version: 14, states: ",SOQOaOOOrOxO'#CfOzOpO'#CiO!tOaO'#CgOOOP'#Cg'#CgO!{OrO'#CrO#TOtO'#CsO#]OpO'#CtOOOP'#DS'#DSOOOP'#Cv'#CvQQOaOOOOOW'#Cw'#CwO#eOxO,59QOOOP,59Q,59QOOOO'#Cx'#CxO#mOpO,59TO#uO!bO,59TOOOP'#C{'#C{O$TOaO,59RO$[OpO'#CoOOOP,59R,59ROOOQ'#C|'#C|O$dOrO,59^OOOP,59^,59^OOOS'#C}'#C}O$lOtO,59_OOOP,59_,59_O$tOpO,59`O$|OpO,59`OOOP-E6t-E6tOOOW-E6u-E6uOOOP1G.l1G.lOOOO-E6v-E6vO%UO!bO1G.oO%UO!bO1G.oO%dOpO'#CkO%lO!bO'#CyO%zO!bO1G.oOOOP1G.o1G.oOOOP1G.w1G.wOOOP-E6y-E6yOOOP1G.m1G.mO&VOpO,59ZO&_OpO,59ZOOOQ-E6z-E6zOOOP1G.x1G.xOOOS-E6{-E6{OOOP1G.y1G.yO&gOpO1G.zO&gOpO1G.zOOOP1G.z1G.zO&oO!bO7+$ZO&}O!bO7+$ZOOOP7+$Z7+$ZOOOP7+$c7+$cO'YOpO,59VO'bOpO,59VO'jO!bO,59eOOOO-E6w-E6wO'xOpO1G.uO'xOpO1G.uOOOP1G.u1G.uO(QOpO7+$fOOOP7+$f7+$fO(YO!bO<<GuOOOP<<Gu<<GuOOOP<<G}<<G}O'bOpO1G.qO'bOpO1G.qO(eO#tO'#CnOOOO1G.q1G.qO(sOpO7+$aOOOP7+$a7+$aOOOP<<HQ<<HQOOOPAN=aAN=aOOOPAN=iAN=iO'bOpO7+$]OOOO7+$]7+$]OOOO'#Cz'#CzO({O#tO,59YOOOO,59Y,59YOOOP<<G{<<G{OOOO<<Gw<<GwOOOO-E6x-E6xOOOO1G.t1G.t", stateData: ')Z~OPQOSVOTWOVWOWWOXWOiXOxPO}TO!PUO~OuZOw]O~O^`Oy^O~OPQOQcOSVOTWOVWOWWOXWOxPO}TO!PUO~ORdO~P!SOseO|gO~OthO!OjO~O^lOy^O~OuZOwoO~O^qOy^O~O[vO`sOdwOy^O~ORyO~P!SO^{Oy^O~OseO|}O~OthO!O!PO~O^!QOy^O~O[!SOy^O~O[!VO`sOd!WOy^O~Oa!YOy^O~Oy^O[mX`mXdmX~O[!VO`sOd!WO~O^!]Oy^O~O[!_Oy^O~O[!aOy^O~O[!cO`sOd!dOy^O~O[!cO`sOd!dO~Oa!eOy^O~Oy^Oz!gO~Oy^O[ma`madma~O[!jOy^O~O[!kOy^O~O[!lO`sOd!mO~OW!pOX!pOz!rO{!pO~O[!sOy^O~OW!pOX!pOz!vO{!pO~O', goto: '%[wPPPPPPPPPPxxP!OP!UPP!_!iP!oxxxP!u!{#R$Z$j$p$v$|PPPP%SXWORYbXRORYb_t`qru!T!U!bQ!h!YS!o!e!fR!t!nQdRRybXSORYbQYORmYQ[PRn[Q_QQkVjp_krz!R!T!X!Z!^!`!f!i!nQr`QzcQ!RlQ!TqQ!XsQ!ZtQ!^{Q!`!QQ!f!YQ!i!]R!n!eQu`S!UqrU![u!U!bR!b!TQ!q!gR!u!qQbRRxbQfTR|fQiUR!OiSXOYTaRb', nodeNames: '\u26A0 StartTag StartCloseTag MissingCloseTag StartCloseTag StartCloseTag Document Text EntityReference CharacterReference Cdata Element EndTag OpenTag TagName Attribute AttributeName Is AttributeValue CloseTag SelfCloseEndTag SelfClosingTag Comment ProcessingInst MismatchedCloseTag DoctypeDecl', maxTerm: 47, context: vb, nodeProps: [['closedBy', 1, 'SelfCloseEndTag EndTag', 13, 'CloseTag MissingCloseTag'], ['openedBy', 12, 'StartTag StartCloseTag', 19, 'OpenTag', 20, 'StartTag']], propSources: [Tb], skippedNodes: [0], repeatNodeCount: 8, tokenData: "Az~R!WOX$kXY%rYZ%rZ]$k]^%r^p$kpq%rqr$krs&tsv$kvw'Uw}$k}!O(q!O!P$k!P!Q*n!Q![$k![!]+z!]!^$k!^!_/s!_!`=i!`!a>U!a!b>q!b!c$k!c!}+z!}#P$k#P#Q?}#Q#R$k#R#S+z#S#T$k#T#o+z#o%W$k%W%o+z%o%p$k%p&a+z&a&b$k&b1p+z1p4U$k4U4d+z4d4e$k4e$IS+z$IS$I`$k$I`$Ib+z$Ib$Kh$k$Kh%#t+z%#t&/x$k&/x&Et+z&Et&FV$k&FV;'S+z;'S;:j/S;:j?&r$k?&r?Ah+z?Ah?BY$k?BY?Mn+z?Mn~$kX$rUVP{WOr$krs%Usv$kw!^$k!^!_%d!_~$kP%ZRVPOv%Uw!^%U!_~%UW%iR{WOr%dsv%dw~%d_%{]VP{WyUOX$kXY%rYZ%rZ]$k]^%r^p$kpq%rqr$krs%Usv$kw!^$k!^!_%d!_~$kZ&{RzYVPOv%Uw!^%U!_~%U~'XTOp'hqs'hst(Pt!]'h!^~'h~'kTOp'hqs'ht!]'h!]!^'z!^~'h~(POW~~(SROp(]q!](]!^~(]~(`SOp(]q!](]!]!^(l!^~(]~(qOX~Z(xWVP{WOr$krs%Usv$kw}$k}!O)b!O!^$k!^!_%d!_~$kZ)iWVP{WOr$krs%Usv$kw!^$k!^!_%d!_!`$k!`!a*R!a~$kZ*[U|QVP{WOr$krs%Usv$kw!^$k!^!_%d!_~$k]*uWVP{WOr$krs%Usv$kw!^$k!^!_%d!_!`$k!`!a+_!a~$k]+hUdSVP{WOr$krs%Usv$kw!^$k!^!_%d!_~$k_,V}`S^QVP{WOr$krs%Usv$kw}$k}!O+z!O!P+z!P!Q$k!Q![+z![!]+z!]!^$k!^!_%d!_!c$k!c!}+z!}#R$k#R#S+z#S#T$k#T#o+z#o$}$k$}%O+z%O%W$k%W%o+z%o%p$k%p&a+z&a&b$k&b1p+z1p4U+z4U4d+z4d4e$k4e$IS+z$IS$I`$k$I`$Ib+z$Ib$Je$k$Je$Jg+z$Jg$Kh$k$Kh%#t+z%#t&/x$k&/x&Et+z&Et&FV$k&FV;'S+z;'S;:j/S;:j?&r$k?&r?Ah+z?Ah?BY$k?BY?Mn+z?Mn~$k_/ZWVP{WOr$krs%Usv$kw!^$k!^!_%d!_;=`$k;=`<%l+z<%l~$kX/xU{WOq%dqr0[sv%dw!a%d!a!b=X!b~%dX0aZ{WOr%dsv%dw}%d}!O1S!O!f%d!f!g1x!g!}%d!}#O5s#O#W%d#W#X:k#X~%dX1XT{WOr%dsv%dw}%d}!O1h!O~%dX1oR}P{WOr%dsv%dw~%dX1}T{WOr%dsv%dw!q%d!q!r2^!r~%dX2cT{WOr%dsv%dw!e%d!e!f2r!f~%dX2wT{WOr%dsv%dw!v%d!v!w3W!w~%dX3]T{WOr%dsv%dw!{%d!{!|3l!|~%dX3qT{WOr%dsv%dw!r%d!r!s4Q!s~%dX4VT{WOr%dsv%dw!g%d!g!h4f!h~%dX4kV{WOr4frs5Qsv4fvw5Qw!`4f!`!a5c!a~4fP5TRO!`5Q!`!a5^!a~5QP5cOiPX5jRiP{WOr%dsv%dw~%dX5xV{WOr%dsv%dw!e%d!e!f6_!f#V%d#V#W8w#W~%dX6dT{WOr%dsv%dw!f%d!f!g6s!g~%dX6xT{WOr%dsv%dw!c%d!c!d7X!d~%dX7^T{WOr%dsv%dw!v%d!v!w7m!w~%dX7rT{WOr%dsv%dw!c%d!c!d8R!d~%dX8WT{WOr%dsv%dw!}%d!}#O8g#O~%dX8nR{WxPOr%dsv%dw~%dX8|T{WOr%dsv%dw#W%d#W#X9]#X~%dX9bT{WOr%dsv%dw#T%d#T#U9q#U~%dX9vT{WOr%dsv%dw#h%d#h#i:V#i~%dX:[T{WOr%dsv%dw#T%d#T#U8R#U~%dX:pT{WOr%dsv%dw#c%d#c#d;P#d~%dX;UT{WOr%dsv%dw#V%d#V#W;e#W~%dX;jT{WOr%dsv%dw#h%d#h#i;y#i~%dX<OT{WOr%dsv%dw#m%d#m#n<_#n~%dX<dT{WOr%dsv%dw#d%d#d#e<s#e~%dX<xT{WOr%dsv%dw#X%d#X#Y4f#Y~%dX=`R!PP{WOr%dsv%dw~%dZ=rUaQVP{WOr$krs%Usv$kw!^$k!^!_%d!_~$k_>_U[UVP{WOr$krs%Usv$kw!^$k!^!_%d!_~$kZ>xWVP{WOr$krs%Usv$kw!^$k!^!_%d!_!`$k!`!a?b!a~$kZ?kU!OQVP{WOr$krs%Usv$kw!^$k!^!_%d!_~$kZ@UWVP{WOr$krs%Usv$kw!^$k!^!_%d!_#P$k#P#Q@n#Q~$kZ@uWVP{WOr$krs%Usv$kw!^$k!^!_%d!_!`$k!`!aA_!a~$kZAhUwQVP{WOr$krs%Usv$kw!^$k!^!_%d!_~$k", tokenizers: [Ob, Sb, Cb, Ab, 0, 1, 2, 3], topRules: { Document: [0, 6] }, tokenPrec: 0,
  }); function ir(i, e) { const t = e && e.getChild('TagName'); return t ? i.sliceString(t.from, t.to) : ''; } function Nl(i, e) { const t = e && e.firstChild; return !t || t.name != 'OpenTag' ? '' : ir(i, t); } function Pb(i, e, t) { const n = e && e.getChildren('Attribute').find(r => r.from <= t && r.to >= t); const s = n && n.getChild('AttributeName'); return s ? i.sliceString(s.from, s.to) : ''; } function $l(i) { for (let e = i && i.parent; e; e = e.parent) if (e.name == 'Element') return e; return null; } function Mb(i, e) { let t; let n = H(i).resolveInner(e, -1); let s = null; for (let r = n; !s && r.parent; r = r.parent)(r.name == 'OpenTag' || r.name == 'CloseTag' || r.name == 'SelfClosingTag' || r.name == 'MismatchedCloseTag') && (s = r); if (s && (s.to > e || s.lastChild.type.isError)) { const r = s.parent; if (n.name == 'TagName') return s.name == 'CloseTag' || s.name == 'MismatchedCloseTag' ? { type: 'closeTag', from: n.from, context: r } : { type: 'openTag', from: n.from, context: $l(r) }; if (n.name == 'AttributeName') return { type: 'attrName', from: n.from, context: s }; if (n.name == 'AttributeValue') return { type: 'attrValue', from: n.from, context: s }; const o = n == s || n.name == 'Attribute' ? n.childBefore(e) : n; return o?.name == 'StartTag' ? { type: 'openTag', from: e, context: $l(r) } : o?.name == 'StartCloseTag' && o.to <= e ? { type: 'closeTag', from: e, context: r } : o?.name == 'Is' ? { type: 'attrValue', from: e, context: s } : o ? { type: 'attrName', from: e, context: s } : null; } else if (n.name == 'StartCloseTag') return { type: 'closeTag', from: e, context: n.parent }; for (;n.parent && n.to == e && !(!((t = n.lastChild) === null || t === void 0) && t.type.isError);)n = n.parent; return n.name == 'Element' || n.name == 'Text' || n.name == 'Document' ? { type: 'tag', from: e, context: n.name == 'Element' ? n : $l(n) } : null; } const Fl = class {constructor(e, t, n) { this.attrs = t, this.attrValues = n, this.children = [], this.name = e.name, this.completion = { type: 'type', ...e.completion || {}, label: this.name }, this.openCompletion = { ...this.completion, label: `<${this.name}` }, this.closeCompletion = { ...this.completion, label: `</${this.name}>`, boost: 2 }, this.closeNameCompletion = { ...this.completion, label: `${this.name}>` }, this.text = e.textContent ? e.textContent.map(s => ({ label: s, type: 'text' })) : []; }}; const Il = /^[:\-\.\w\u00b7-\uffff]*$/; function Hu(i) { return { type: 'property', ...i.completion || {}, label: i.name }; } function qu(i) { return typeof i === 'string' ? { label: `"${i}"`, type: 'constant' } : /^"/.test(i.label) ? i : ({ ...i, label: `"${i.label}"` }); } function Eb(i, e) {
    const t = []; const n = []; const s = Object.create(null); for (const a of e) { const h = Hu(a); t.push(h), a.global && n.push(h), a.values && (s[a.name] = a.values.map(qu)); } const r = []; let o = []; const l = Object.create(null); for (const a of i) { let h = n; let c = s; a.attributes && (h = h.concat(a.attributes.map(u => (typeof u === 'string' ? t.find(d => d.label == u) || { label: u, type: 'property' } : (u.values && (c == s && (c = Object.create(c)), c[u.name] = u.values.map(qu)), Hu(u)))))); const f = new Fl(a, h, c); l[f.name] = f, r.push(f), a.top && o.push(f); }o.length || (o = r); for (let a = 0; a < r.length; a++) { const h = i[a]; const c = r[a]; if (h.children) for (const f of h.children)l[f] && c.children.push(l[f]); else c.children = r; } return (a) => {
      let h; const { doc: c } = a.state; const f = Mb(a.state, a.pos); if (!f || f.type == 'tag' && !a.explicit) return null; const { type: u, from: d, context: p } = f; if (u == 'openTag') { let g = o; const b = Nl(c, p); if (b) { const y = l[b]; g = y?.children || r; } return { from: d, options: g.map(y => y.completion), validFor: Il }; } if (u == 'closeTag') {
        const g = Nl(c, p); return g ? {
          from: d, to: a.pos + (c.sliceString(a.pos, a.pos + 1) == '>' ? 1 : 0), options: [((h = l[g]) === null || h === void 0 ? void 0 : h.closeNameCompletion) || { label: `${g}>`, type: 'type' }], validFor: Il,
        } : null;
      } if (u == 'attrName') { const g = l[ir(c, p)]; return { from: d, options: g?.attrs || n, validFor: Il }; } if (u == 'attrValue') {
        const g = Pb(c, p, d); if (!g) return null; const b = l[ir(c, p)]; const y = (b?.attrValues || s)[g]; return !y || !y.length ? null : {
          from: d, to: a.pos + (c.sliceString(a.pos, a.pos + 1) == '"' ? 1 : 0), options: y, validFor: /^"[^"]*"?$/,
        };
      } if (u == 'tag') { const g = Nl(c, p); const b = l[g]; const y = []; const S = p && p.lastChild; g && (!S || S.name != 'CloseTag' || ir(c, S) != g) && y.push(b ? b.closeCompletion : { label: `</${g}>`, type: 'type', boost: 2 }); let P = y.concat((b?.children || (p ? r : o)).map(k => k.openCompletion)); if (p && b?.text.length) { const k = p.firstChild; k.to > a.pos - 20 && !/\S/.test(a.state.sliceDoc(k.to, a.pos)) && (P = P.concat(b.text)); } return { from: d, options: P, validFor: /^<\/?[:\-\.\w\u00b7-\uffff]*$/ }; } return null;
    };
  } const Uu = gt.define({ parser: Wu.configure({ props: [Vo.add({ Element(i) { const e = /^\s*<\//.test(i.textAfter); return i.lineIndent(i.node.from) + (e ? 0 : i.unit); }, 'OpenTag CloseTag SelfClosingTag': function (i) { return i.column(i.node.from) + i.unit; } }), Wo.add({ Element(i) { const e = i.firstChild; const t = i.lastChild; return !e || e.name != 'OpenTag' ? null : { from: e.to, to: t.name == 'CloseTag' ? t.from : i.to }; } })] }), languageData: { commentTokens: { block: { open: '<!--', close: '-->' } }, indentOnInput: /^\s*<\/$/ } }); function _u(i = {}) { return new Oi(Uu, Uu.data.of({ autocomplete: Eb(i.elements || [], i.attributes || []) })); } var nr = (r => (r.xml = 'xml', r.leiden_plus = 'leiden_plus', r.edcs = 'edcs', r.phi = 'phi', r.default = 'default', r))(nr || {}); const kt = (i, e) => t => (t.dispatch(t.state.changeByRange(n => ({ changes: [{ from: n.from, insert: i }, { from: n.to, insert: e }], range: m.range(n.from + i.length, n.to + i.length) }))), !0); const ju = i => e => (e.dispatch(e.state.changeByRange(t => ({ changes: [{ from: t.from, insert: i }], range: m.range(t.from, t.from) }))), !0); const Fi = i => e => (i = i.replace(/\$\|([^|]+)\|/g, '${$1}'), e.state.selection.ranges.forEach((t) => { const n = e.state.doc.slice(t.from, t.to); cu(i.replace(/\${_}/, `\${${n.toString()}}`))(e, { label: '' }, t.from, t.to); }), !0); const zt = class {
    constructor(e) { this.editor = e; }

    getConfig() {
      const e = this; const t = q.fromClass(class {
        update(s) {
          if (s.docChanged) {
            const r = H(s.state); const o = s.state.doc.toJSON(); const l = e.onUpdate(r, o.join(`
`)); try { const a = e.serialize(); a && (e.editor._value = a, e.editor.emitUpdateEvent(l)); } catch (a) {}
          }
        }
      }); const n = this.getExtensions(this.editor); return { extensions: [Mu, O.lineWrapping, Pe.of([Ff]), ...n, t] };
    }

    getCommands() { return {}; }

    onUpdate(e, t) { return t; }
  }; const zl = M.define(); const Gu = V.define({ create: () => !1, update(i, e) { for (const t of e.effects)t.is(zl) && (i = t.value); return i; }, provide: i => pt.from(i, e => (e ? Db : null)) }); function Db(i) { const e = document.createElement('div'); e.className = 'cm-input-panel'; const t = document.createElement('input'); return t.type = 'text', t.placeholder = 'Name of element (enter to confirm, esc to abort)', t.addEventListener('keyup', (n) => { switch (n.key) { case 'Enter': n.preventDefault(); const s = t.value; s !== '' && (kt(`<${s}>`, `</${s}>`)(i), i.focus()); case 'Esc': case 'Escape': i.dispatch({ effects: zl.of(!1) }); } }), e.appendChild(t), { top: !1, dom: e, mount: () => t.focus() }; } const Lb = O.baseTheme({ '.cm-input-panel': { padding: '5px 10px', fontFamily: 'monospace' }, '.cm-input-panel input': { width: '100%' } }); function Zu() { return [Gu, Lb]; } const Rb = i => (i.dispatch({ effects: zl.of(!i.state.field(Gu)) }), !0); const Bb = i => (i.dispatch(i.state.changeByRange((e) => { const t = H(i.state).resolveInner(e.from); let n = null; for (let s = t; !n && s.parent; s = s.parent)s.name == 'Element' && (n = s); return n ? { selection: m.range(n.from, n.to), range: m.range(n.from, n.to) } : { range: e }; })), !0); const Nb = i => (i.dispatch(i.state.changeByRange((e) => { const t = H(i.state).resolveInner(e.from); let n = null; for (let s = t; !n && s.parent; s = s.parent)s.name == 'Element' && (n = s); if (n) { const s = n.firstChild; const r = n.lastChild; if (s && r) return s.name === 'SelfClosingTag' ? { range: m.range(s.from, s.from), changes: [{ from: s.from, to: s.to, insert: '' }] } : { range: m.range(s.from, r.from - (s.to - s.from)), changes: [{ from: s.from, to: s.to, insert: '' }, { from: r.from, to: r.to, insert: '' }] }; } return { range: e }; })), !0); const Tn = {
    selectElement: Bb, removeEnclosing: Nb, encloseWith: Rb, snippet: { create: i => Fi(i) },
  }; const $b = (i, e) => e.type.name === 'AttributeName' && i.state.sliceDoc(e.from, e.to) === 'xmlns'; const Ib = (i, e) => e.type.name === 'Comment' && /\<\!\-\- Error\:([^ ])* \-\-\>/.test(i.state.sliceDoc(e.from, e.to)); const Fb = 300; const Qu = i => i.filter(e => e.severity !== 'info'); const zb = i => ({ name: 'Fix', apply: (e, t, n) => { const s = e.state.update({ changes: { from: t, to: n, insert: i } }); e.dispatch(s); } }); const Vb = (i, e) => (t) => {
    function n(a) { i.valid = a, i.dispatchEvent(new CustomEvent(a ? 'valid' : 'invalid', { detail: s, composed: !0, bubbles: !0 })); } let s = []; if (t.state.doc.length === 0) return n(!0), s; const r = H(t.state); let o = !1; const l = []; return r.iterate({
      enter: (a) => {
        if (a.type.isError && s.push({
          message: 'Syntax error', severity: 'error', from: a.from, to: a.to,
        }), a.type.name === 'StartTag')a.nextSibling(), l.push(t.state.sliceDoc(a.from, a.to)); else if (a.type.name === 'StartCloseTag') {
          a.nextSibling(); const h = t.state.sliceDoc(a.from, a.to); const c = l.pop(); h !== c && s.push({
            message: `Expected closing tag for ${c}`, severity: 'error', from: a.from, to: a.to,
          });
        } else if (a.type.name === 'SelfCloseEndTag')l.pop(); else if ($b(t, a)) {
          o = !0, a.nextSibling(), a.nextSibling(); const h = t.state.sliceDoc(a.from + 1, a.to - 1); e && h !== e && s.push({
            message: 'Wrong Namespace', severity: 'error', from: a.from + 1, to: a.to - 1, actions: [zb(e)],
          });
        } else {
          Ib(t, a) && s.push({
            message: 'Syntax error in source input', severity: 'warning', from: a.from, to: a.to,
          });
        }
      },
      leave: (a) => {
        a.type.name === 'Document' && e && !o && s.push({
          message: 'Missing TEI namespace', severity: 'error', from: a.from, to: a.to,
        }), a.type.isError && s.push({
          message: 'Syntax error in input', severity: 'error', from: a.from, to: a.to,
        });
      },
    }), n(s.length === 0), s;
  }; const Wb = [{ key: 'Ctrl-Shift-s', mac: 'Cmd-Shift-s', run: Tn.selectElement }, { key: 'Ctrl-Shift-x', mac: 'Cmd-Shift-x', run: Tn.removeEnclosing }, { key: 'Ctrl-Shift-e', mac: 'Cmd-Shift-e', run: Tn.encloseWith }]; const zi = class extends zt {
    constructor(t, n = null, s = !1, r = !1) { super(t); this.namespace = n, this.checkNamespace = s, this.unwrap = r; }

    getDefaultExtensions() { return [Zu(), Pe.of(Wb), Ks(Vb(this.editor, this.checkNamespace ? this.namespace : null), { delay: Fb, markerFilter: Qu }), Ri({ markerFilter: Qu })]; }

    getExtensions() { return this.getDefaultExtensions().concat(_u()); }

    getCommands() { return Tn; }

    loadSchema(t) { return Ql(this, null, function* () { return yield fetch(t).then(s => s.json()); }); }

    serialize() {
      let o; const t = new DOMParser(); const n = this.unwrap ? `<R xmlns="${this.namespace || ''}">${this.editor.content}</R>` : this.editor.content; const
        s = t.parseFromString(n, 'application/xml'); return s.getElementsByTagName('parsererror').length ? null : this.unwrap ? (o = s.firstElementChild) == null ? void 0 : o.childNodes : s.firstElementChild;
    }

    setFromValue(t) { if (!(t && (t instanceof Element || t instanceof NodeList))) return ''; const n = new XMLSerializer(); if (t instanceof NodeList) { const s = []; for (let r = 0; r < t.length; r++)s.push(n.serializeToString(t[r])); return s.join(''); } return n.serializeToString(t); }
  }; const Xu = '() <>?=.0123456789[]\u301A\u301B'; const Ku = new Ft((i) => { let e = ''; for (;!(i.next < 0);) { if (i.next === 46 && e === 'lost') { i.advance(), i.acceptToken(31); return; } const t = String.fromCharCode(i.next); if (Xu.indexOf(t) > -1 || i.peek(1) === 803) break; e += t, i.advance(); }e.length > 0 && i.acceptToken(30); }); const Ju = new Ft((i) => { let e = 0; for (;!(i.next < 0 || Xu.indexOf(String.fromCharCode(i.next)) > -1);) if (i.peek(1) === 803)e++, i.advance(2); else break; e > 0 && i.acceptToken(1); }); const sr = wt.deserialize({
    version: 14, states: "(QOQOVOOOQOVO'#C_OQOVO'#C`OQOVO'#CaO!eOWO'#CbO!pOVO'#ClO#wOVO'#CmOOOR'#Co'#CoO$ROSO'#CpO!pOVO'#CqOOOR'#DX'#DXOOOR'#Cr'#CrO$WOSO'#CtO!pOVO'#CvOOOR'#Ch'#ChOOOR'#C|'#C|OOOR'#Cw'#CwQQOVOOO$`OVO,58yO$gOVO,58zO$nOVO,58{OQOVO,58|OQOVO,59OOQOVO,59QOOOR'#Cx'#CxO$uOVO,59WO$|OVO,59XOOOR,59X,59XO%WOSO,59XO%]OSO,59[O%bOVO,59]O%lOSO,59`O%qOVO,59bOOOR-E6u-E6uOOOR1G.e1G.eOOOR1G.f1G.fOOOR1G.g1G.gO%xOVO1G.hO&POVO1G.jO&WOVO1G.lOOOR-E6v-E6vOOOR1G.r1G.rOOOR1G.s1G.sO&_OSO1G.sOOOR1G.v1G.vOOOR1G.w1G.wO&dOSO1G.wOOOR1G.z1G.zOOOR1G.|1G.|OOOR7+$S7+$SOOOR7+$U7+$UOOOR7+$W7+$WOOOR7+$_7+$_OOOR7+$c7+$c", stateData: '&n~OP^O]^O^^O_^OgZOi^OnZOo[OqPOsQOuROvSOwTOyUO|VO}WO!PXO!QZO!RZO!SZO!U]O~OVeOXfOZgO~OP^O]^O^^O_^OgZOi^OnZOo[OwTOyUO|VO}WO!PXO!QZO!RZO!SZO!U]O~OblOzkO~P!pO_mO~O_oOgoO~OrrO~PQOtsO~PQOttO~PQOxyO~P!pOb{OzzO~P!pOzzO~O!O|O~Ob!OO!O}O~P!pO!T!PO~O!V!QO~P!pOt!RO~PQOt!SO~PQOt!TO~PQOz!UO~O!O!VO~OZ^_Z~', goto: '%_|PPP}}}}P}P}P!_PPP!y!yP#c#c#c!yP!yP!y#{$kPPP$}PPPPPPPPPP!ym_OPQRabcdefguvwl_OPQRabcdefguvwahTUX]ijnp}^OPQRTUX]abcdefgijnpuvw}YOPQRTUX]abcdefgijnpuvwQaOQbPQcQQdR^qabcduvwQueQvfRwgQiTQjUQnXQp]Xxijnpm`OPQRabcdefguvw', nodeNames: '\u26A0 Unclear Document Div Recto Verso Part PartId Fragment FragmentNum Column ColumnNum Inline LineBreakWrapped LineBreak Number Abbrev Supplied CertLow GapUnknown Gap SuppliedLost Text QuestionMark LostLines Illegible Erasure', maxTerm: 53, skippedNodes: [0], repeatNodeCount: 2, tokenData: "+y~Rapq!Wxy!]yz!p!O!P!u!Q![#v!^!_'v!_!`(y!`!a)f!a!b)k!c!}'^!}#O)p#P#Q*]#T#`'^#`#a*b#a#o'^&Fp&Fq+o&Fq&Fr+t~!]O!R~~!bPw~!a!b!e~!hPyz!k~!pOb~~!uOx~~!zQ!Q~!Q![#Q!a!b#n~#VQi~!Q![#Q#`#a#]~#`P#]#^#c~#fP#b#c#i~#nOi~~#sPi~#`#a#]~#{S_P!O!P$X!Q![#v!c!}'^#T#o'^~$^T^Ppq$m}!O$r#V#W%P#Y#Z%t#d#e&uP$rO^P~$wP]~pq$z~%PO]~Q%SP#c#d%VQ%YP#`#a%]Q%`P#i#j%cQ%fP#a#b%iQ%lP#b#c%oQ%tOZQ~%wP#f#g%z~%}P#T#U&Q~&TP#Z#[&W~&ZP#a#b&^~&aP#X#Y&d~&gP#b#c&j~&mP#h#i&p~&uOX~Q&xP#T#U&{Q'OP#f#g'RQ'UP#h#i'XQ'^OVQQ'aS!O!P'm!Q!['^!c!}'^#T#o'^Q'pQ#V#W%P#d#e&u~'{Qy~!_!`(R!f!g(W~(WOq~~(ZP!_!`(^~(aP!O!P(d~(iQv~#f#g(o#j#k(t~(tOs~~(yOu~~)OQ!S~!`!a)U!f!g)Z~)ZOr~~)^P!`!a)a~)fOt~~)kOz~~)pOg~~)uP!P~!O!P)x~)}P}~!a!b*Q~*TP#P#Q*W~*]O|~~*bO!O~R*eU!O!P'm!Q!['^!c!}'^#T#]'^#]#^*w#^#o'^R*zU!O!P'm!Q!['^!c!}'^#T#b'^#b#c+^#c#o'^R+cS!TP!O!P'm!Q!['^!c!}'^#T#o'^~+tO!U~~+yO!V~", tokenizers: [Ku, Ju, 0, 1], topRules: { Document: [0, 2] }, tokenPrec: 255,
  }); const _b = ['Recto', 'Verso', 'Fragment', 'Part', 'Div']; function Yu(i, e = sr.parse(i)) {
    function t(a) { return i.substring(a.from, a.to); } const n = []; const s = []; let r = !1; let o = 'ab'; let l; return e.iterate({
      enter: (a) => {
        if (a.type.isError) { s.push(`<!-- Error:${t(a)} -->`); return; } const h = a.name; switch (h) {
          case 'Document': let c = 0; if (a.firstChild()) do c++, _b.includes(a.type.name) && (o = 'div'), r = r || a.type.name === 'Inline'; while (a.nextSibling()); r = c > 1 || r, r && s.push(`<${o}>
`), a.parent(); break; case 'Text': case 'Number': s.push(t(a)); break; case 'LineBreak': a.firstChild(), l = /^([0-9]+)\..*$/.exec(t(a)), s.push(`<lb n="${l ? l[1] : ''}"/>`); break; case 'LineBreakWrapped': a.firstChild(), l = /^([0-9]+)\..*$/.exec(t(a)), s.push(`<lb n="${l ? l[1] : ''}" break="no"/>`); break; case 'Div': s.push('<ab>'); break; case 'Recto': case 'Verso': s.push('<div n="r" type="textpart">'); break; case 'Fragment': a.firstChild(), l = /^([0-9]+)\..*$/.exec(t(a)), s.push(`<div n="${l ? l[1] : ''}" subtype="fragment" type="textpart">`); break; case 'Part': a.firstChild(), l = /^([a-zA-Z0-9]+)\..*$/.exec(t(a)), s.push(`<div n="${l ? l[1] : ''}" subtype="part" type="textpart">`); break; case 'Column': a.firstChild(), l = /^([a-zA-Z0-9]+)\..*$/.exec(t(a)), s.push(`<div n="${l ? l[1] : ''}" subtype="column" type="textpart">`); break; case 'Unclear': const f = t(a); let u = ''; for (let d = 0; d < f.length; d++) { const p = f.codePointAt(d); p && p !== 803 && (u += String.fromCodePoint(p)); } return s.push(`<unclear>${u}</unclear>`), !1; case 'Gap': return a.next(!0), s.push(`<gap reason="lost" quantity="${t(a)}" unit="character"/>`), !1; case 'GapUnknown': return s.push('<gap reason="lost" extent="unknown" unit="character"/>'), !1; case 'Illegible': return l = /^\.([0-9?]+)(lin)?$/.exec(t(a)), l && (l[2] === 'lin' ? s.push(`<gap reason="illegible" quantity="${l ? l[1] : ''}" unit="line"/>`) : l[1] === '?' ? s.push('<gap reason="illegible" extent="unkown" unit="character"/>') : s.push(`<gap reason="illegible" quantity="${l ? l[1] : ''}" unit="character"/>`)), !1; case 'Erasure': s.push('<del rend="erasure">'); break; case 'LostLines': return l = /^lost\.([0-9?]+)lin$/.exec(t(a)), l && (l[1] === '?' ? s.push('<gap reason="lost" extent="unknown" unit="line"/>') : s.push(`<gap reason="lost" quantity="${l ? l[1] : ''}" unit="line"/>`)), !1; case 'Abbrev': n.length > 0 ? (a.lastChild(), l = t(a), l.length > 0 && l.charAt(l.length - 1) === '?' ? s.push('<ex cert="low">') : s.push('<ex>'), a.parent()) : s.push('<expan>'), n.push('expan'); break; case 'Supplied': a.lastChild(), a.name === 'CertLow' ? s.push('<supplied reason="omitted" cert="low">') : s.push('<supplied reason="omitted">'), a.parent(); break; case 'SuppliedLost': a.lastChild(), a.name === 'CertLow' ? s.push('<supplied reason="lost" cert="low">') : s.push('<supplied reason="lost">'), a.parent(); break; case 'CertLow': return !1; case 'QuestionMark': return n.length < 2 && s.push('?'), !1; case 'Inline': break; default: s.push(`<${h}>`); break;
        }
      },
      leave: (a) => {
        switch (a.name) {
          case 'Document': r && s.push(`
</${o}>`); break; case 'Abbrev': if (n.length > 1) { const h = s[s.length - 1]; h.endsWith('?') && (s[s.length - 1] = h.substring(0, h.length - 2)), s.push('</ex>'); } else s.push('</expan>'); n.pop(); break; case 'Div': s.push('</ab>'); break; case 'Recto': case 'Verso': case 'Fragment': case 'Part': case 'Column': s.push(`</div>
`); break; case 'Supplied': case 'SuppliedLost': s.push('</supplied>'); break; case 'Erasure': s.push('</del>'); break;
        }
      },
    }), e.type.name === 'Inline' && s.push('</ab>'), s.join('');
  } const jb = gt.define({
    parser: sr.configure({
      props: [vi({
        Number: x.number, 'LineBreak LineBreakWrapped': x.contentSeparator, 'Illegible GapUnknown Gap SuppliedLost Supplied Unclear': x.comment, 'Div Recto Verso Part Fragment': x.keyword, '( )': x.paren,
      })],
    }),
    languageData: { closeBrackets: { brackets: ['(', '[', '{', '<'] } },
  }); function ed() { return new Oi(jb); } function ii(i, e) { for (let t = 0; t < i.childNodes.length; t++)rr(i.childNodes[t], e); } function rr(i, e) {
    if (i) {
      switch (i.nodeType) {
        case Node.DOCUMENT_NODE: case Node.DOCUMENT_FRAGMENT_NODE: rr(i.firstElementChild, e); break; case Node.ELEMENT_NODE: const t = i; let n; switch (t.localName) {
          case 'ab': e.push('<='), ii(t, e), e.push('=>'); break; case 'abbr': ii(t, e); break; case 'del': e.push('\u301A'), ii(t, e), e.push('\u301B'); break; case 'div': n = t.getAttribute('n'), e.push(`<D=.${n}.column`), ii(t, e), e.push('=D>'); break; case 'expan': case 'ex': const s = t.getAttribute('cert'); e.push('('), ii(t, e), s === 'low' && e.push('?'), e.push(')'); break; case 'gap': Gb(t, e); break; case 'lb': n = t.getAttribute('n'), e.length > 0 && !/\n+$/.test(e[e.length - 1]) && e.push(`
`), e.push(`${n}. `); break; case 'supplied': Zb(t, e); break;
        } break; case Node.TEXT_NODE: e.push(i.nodeValue || ''); break;
      }
    }
  } function Gb(i, e) { const t = i.getAttribute('unit'); const n = i.getAttribute('quantity'); const s = i.getAttribute('reason'); if (s) switch (s) { case 'lost': switch (t) { case 'character': n ? e.push(`[.${n}]`) : e.push('[.?]'); break; case 'line': n ? e.push(`lost.${n}lin`) : e.push('lost.?lin'); break; } break; case 'illegible': switch (t) { case 'character': n ? e.push(`.${n}`) : e.push('.?'); break; case 'line': n && e.push(`.${n}lin`); break; } break; } } function Zb(i, e) { const t = i.getAttribute('reason'); if (t) { const n = i.getAttribute('cert'); switch (t) { case 'omitted': e.push('<'), ii(i, e), n && n === 'low' && e.push('(?)'), e.push('>'); break; case 'lost': default: e.push('['), ii(i, e), n && n === 'low' && e.push('(?)'), e.push(']'); break; } } } function Pn(i) { if (!(i instanceof Element)) return ''; const e = []; const t = i.querySelectorAll('cb'); if (t.length > 0) for (let n = 0; n <= t.length; n++) { const s = document.createRange(); n === 0 ? s.setStart(i, 0) : s.setStartAfter(t[n - 1]), n === t.length ? i.lastChild && s.setEndAfter(i.lastChild) : s.setEndBefore(t[n]), console.log(s); const r = document.createElement('div'); r.setAttribute('type', 'textpart'), r.setAttribute('subtype', 'column'), r.setAttribute('n', (n + 1).toString()), s.surroundContents(r), console.log('column: %o', r), rr(r, e); } else rr(i, e); return e.join(''); } const Qb = i => (e) => {
    function t(r) { i.valid = r, i.dispatchEvent(new CustomEvent(r ? 'valid' : 'invalid', { detail: n, composed: !0, bubbles: !0 })); } let n = []; return H(e.state).iterate({
      enter: (r) => {
        r.type.isError && n.push({
          message: 'Syntaxfehler', severity: 'error', from: r.from, to: r.to,
        });
      },
    }), t(n.length === 0), n;
  }; const Xb = i => (i.dispatch(i.state.changeByRange((e) => { const t = i.state.doc.slice(e.from, e.to).toString(); let n = ''; for (let s = 0; s < t.length; s++)s + 1 < t.length && t.charCodeAt(s + 1) === 803 ? (n += t.charAt(s), s++) : n += `${t.charAt(s)}\u0323`; return { changes: [{ from: e.from, to: e.to, insert: n }], range: m.range(e.from, e.from + n.length) }; })), !0); const vt = {
    expan: Fi('(${_}(${}))'),
    div: kt(`<=
`, `
=>`),
    fragment: Fi('<D=.${1:1}.fragment<=\n${2}\n=>=D>'),
    part: Fi('<D=.${1:A}.part<=\n${2}\n=>=D>'),
    recto: kt(`<D=.r<=
`, `
=>=D>`),
    verso: kt(`<D=.v<=
`, `
=>=D>`),
    erasure: kt('\u301A', '\u301B'),
    unclear: Xb,
  }; const Kb = [{ key: 'Ctrl-Shift-e', mac: 'Cmd-Shift-e', run: vt.expan }, { key: 'Ctrl-Shift-a', mac: 'Cmd-Shift-a', run: vt.div }, { key: 'Ctrl-Shift-f', mac: 'Cmd-Shift-f', run: vt.fragment }, { key: 'Ctrl-Shift-p', mac: 'Cmd-Shift-p', run: vt.part }, { key: 'Ctrl-Shift-r', mac: 'Cmd-Shift-r', run: vt.recto }, { key: 'Ctrl-Shift-v', mac: 'Cmd-Shift-v', run: vt.verso }, { key: 'Ctrl-Shift-d', mac: 'Cmd-Shift-d', run: vt.erasure }, { key: 'Ctrl-Shift-u', mac: 'Cmd-Shift-u', run: vt.unclear }]; const or = class extends zt {
    getExtensions() { return [ed(), Ks(Qb(this.editor)), Pe.of(Kb), Ri()]; }

    getCommands() { return vt; }

    onUpdate(e, t) { return Yu(t, e); }

    serialize() { return this.editor.content; }

    setFromValue(e) { if (!e) return ''; if (e instanceof NodeList) { const t = []; return e.forEach(n => t.push(Pn(n))), t.join(''); } if (e instanceof Element) return Pn(e); if (typeof e !== 'string') throw new Error('cannot set value'); return e; }
  }; function Vl(i, e) {
    const t = 'newText'; if (i = i.toString().replace(/\t+/g, ''), i = i.replace(/\r/g, ''), i.toString().length - i.toString().lastIndexOf(' ') == 1 && (i = i.toString().substring(0, i.toString().lastIndexOf(' '))), t === 'newText') {
      i = `<lb n="${1 .toString()}"/>${i}`; const L = /(\-|-?|\=?)\s?\n/g; let N = 1 - 1; if (i = i.replace(L, (Je, Se) => (Se === '-' || Se === '=' ? `
<lb n="${N++ + 2}" break="no"/>` : `
<lb n="${N++ + 2}"/>`)), i = i.replace(/(\<lb n=\"[0-9]*\"\/\>)\[(\s?—\s?){3,50}\]\n(\<lb n=\"[0-9]*\"\/\>)/g, `$1<gap reason="illegible" quantity="1" unit="line"/>
$3`), e == 'edcs') {
        N = 0, i = i.replace(/(\s)?(\/\/)(?!\>)(\s)?/g, (Se) => {
          if (Se[0] === '/') var _e = ' break="no"'; else var _e = ''; return `
<cb n="${N++ + 2}"${_e}/>`;
        }); const Je = /(\s)?(\/{1})(?!\>)(\s)?/g; N = 0, i = i.replace(Je, (Se) => {
          if (Se[0] === '/') var _e = ' break="no"'; else var _e = ''; return console.log(`BreakNo = ${_e}`), console.log(`Match 0= ${Se[0]}`), `
<lb n="${N++ + 2}"${_e}/>`;
        });
      }e == 'phi' && (i = i.replace(/#⁷/g, '<gap reason="illegible" quantity="1" unit="character"/>'), i = i.replace(/#⁷#⁷#⁷/g, '<gap reason="illegible" quantity="3" unit="character"/>'), i = i.replace(/#⁵⁶/g, '<g type="interpunct">\u25B4</g>')); const X = /\n<lb n=\'([0-9])\'\/>\1\s/g; const re = `
<lb n="$1"/>`;i = i.replace(X, re); const Me = /(\"[0-9]{1,3}\"\/>)([0-9]{1,3})/g; const Ue = '$1'; i = i.replace(Me, Ue);
    } const s = /\<([^\x00-\x7F]*[aA-zZ]*)(?!\=)(?!\/)\>/g; const r = '<supplied reason="omitted">$1</supplied>'; i = i.replace(s, r); const o = /⟨([^\x00-\x7F]*[aA-zZ]*)(?!\=)(?!\/)⟩/g; const l = '<supplied reason="omitted">$1</supplied>'; if (i = i.replace(o, l), e == 'edcs') { const L = /\<([^\x00-\x7F]*[aA-zZ]*)(\=)([^\x00-\x7F]*[aA-zZ]*)(?!\/)\>/g; const N = '<choice><corr>$1</corr><sic>$3</sic></choice>'; i = i.replace(L, N), i = i.replace(/\[6\]/g, '<gap reason="lost" quantity="1" unit="line"/>'), i = i.replace(/\[3\]/g, '<gap reason="lost" extent="unknown" unit="character"/>'), i = i.replace(/\[3\s([^\x00-\x7F]*[aA-zZ]*)\]/g, '<gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">$1</supplied>'), i = i.replace(/\[3\s/g, '<gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">'), i = i.replace(/\s3\s/g, ' - - - '), i = i.replace(/\s3\]/g, ' - - -]'), i = i.replace(/a\(\)/g, '<abbr>a</abbr>'); }i = i.replace(/\(\!\)/g, '<note>!</note>'), i = i.replace(/\(sic\)/g, '<note>sic</note>'); let a = /\[(\–|\-)\s?(\–|\-)\s?(\–|\-)\]/g; i = i.replace(a, (L, N) => '<gap reason="lost" extent="unknown" unit="character"/>'), a = /\[(?:(?:\s?\.\s?){1,99})([1-9][0-9]*)(?:(?:\s?\.\s?){1,99})\]/g, i = i.replace(a, (L, N) => `<gap reason="lost" quantity="${N}" unit="character"/>`), a = /\[(?:(?:\s?\.\s?){1,99})([1-9][0-9]*)(?:(?:\s?\.\s?){1,99})\s/g, i = i.replace(a, (L, N) => { const X = L.length - 2; return `<gap reason="lost" quantity="${N}" unit="character"/><supplied reason="lost">`; }), a = /\s(?:(?:\s?\.\s?){1,99})([1-9][0-9]*)(?:(?:\s?\.\s?){1,99})\]/g, i = i.replace(a, (L, N) => { const X = L.length - 2; return `</supplied><gap reason="lost" quantity="${N}" unit="character"/>`; }), a = /\s(?:(?:\s?\.\s?){1,99})([1-9][0-9]*)(?:(?:\s?\.\s?){1,99})\s/g, i = i.replace(a, (L, N) => { const X = L.length - 2; return `</supplied><gap reason="lost" quantity="${N}" unit="character"/><supplied reason="lost">`; }), a = /\[((\.){1,99})\]/g, i = i.replace(a, (L, N) => { const X = L.length - 2; return `<gap reason="lost" quantity="${X}" unit="character"/>`; }), a = /\[((\.){1,99})\s/g, i = i.replace(a, (L, N) => { const X = L.length - 2; return `<gap reason="lost" quantity="${X}" unit="character"/><supplied reason="lost">`; }), a = /\s((\.){1,99})\]/g, i = i.replace(a, (L, N) => { const X = L.length - 2; return `</supplied><gap reason="lost" quantity="${X}" unit="character"/>`; }), a = /\s((\.){1,99})\s/g, i = i.replace(a, (L, N) => { const X = L.length - 2; return `</supplied><gap reason="lost" quantity="${X}" unit="character"/><supplied reason="lost">`; }), i = i.replace(/\[(-|–|\.\s?){1,20}ca\.(\s?)([1-9][0-9]*)((-)([1-9][0-9]*))(\s?)(-|–|\.\s?){1,20}\]/g, '<gap reason="lost" atLeast="$3" atMost="$6" unit="character"/>'), i = i.replace(/\[(-|–|\.\s?){1,20}ca\.(\s?)([1-9][0-9]*)(\s?)(-|–|\.\s?){1,20}\]/g, '<gap reason="lost" quantity="$3" unit="character" precision="low"/>'), i = i.replace(/\[(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:(?:-)([1-9][0-9]*))(?:\s?)(?:[\.․]){1,20}(?:\s?)\]/g, '<gap reason="lost" atLeast="$1" atMost="$2" unit="character"/>'), i = i.replace(/\[(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:\s?)(?:[\.․]){1,20}(?:\s?)\]/g, '<gap reason="lost" quantity="$1" unit="character" precision="low"/>'), i = i.replace(/\[(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:(?:-)([1-9][0-9]*))(?:\s?)(?:[\.․]){1,20}(?:\s)/g, '<gap reason="lost" atLeast="$1" atMost="$2" unit="character"/><supplied reason="lost">'), i = i.replace(/\[(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:\s?)(?:[\.․]){1,20}(?:\s)/g, '<gap reason="lost" quantity="$1" unit="character" precision="low"/><supplied reason="lost">'), i = i.replace(/\s(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:(?:-)([1-9][0-9]*))(?:\s?)(?:[\.․]){1,20}(?:\s?)\]/g, '</supplied><gap reason="lost" atLeast="$1" atMost="$2" unit="character"/>'), i = i.replace(/\s(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:\s?)(?:[\.․]){1,20}(?:\s?)\]/g, '</supplied><gap reason="lost" quantity="$1" unit="character" precision="low"/>'), i = i.replace(/\s(?:[\.․]){2,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:(?:-)([1-9][0-9]*))(?:\s?)(?:[\.․]){1,20}(?:\s)/g, '</supplied><gap reason="lost" atLeast="$1" atMost="$2" unit="character"/><supplied reason="lost">'), i = i.replace(/\s(?:[\.․]){2,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:\s?)(?:[\.․]){1,20}(?:\s)/g, '</supplied><gap reason="lost" quantity="$1" unit="character" precision="low"/><supplied reason="lost">'), i = i.replace(/(?:\s|\n)\(([^\x00-\x7F]*[aA-zZ]*)\)/g, ' <expan><ex>$1</ex></expan>'), i = i.replace(/\[{2}/g, '\u27E6'), i = i.replace(/\]{2}/g, '\u27E7'), i = i.replace(/\[([^\x00-\x7F]*[aA-zZ]*[^\]])\]([^\x00-\x7F]*[aA-zZ]*[^\]])\(([^\x00-\x7F]*?[aA-zZ]*?)\)/g, '<expan><abbr><supplied reason="lost">$1</supplied>$2</abbr><ex>$3</ex></expan>'), i = i.replace(/(〚|⟦|\[\[)([^\x00-\x7F]*[aA-zZ]*[^\]])(〛|⟧|]])([^\x00-\x7F]*[aA-zZ]*[^\]])\(([^\x00-\x7F]*?[aA-zZ]*?)\)/g, '<expan><abbr><supplied reason="lost">$1</supplied>$2</abbr><ex>$3</ex></expan>'), i = i.replace(/\[(\w*?\s?)(?:(?:(?:\-|\–|\—)\s?){1,20})(\w*?)\](?![^\x00-\x7F]*?[aA-zZ]*?\()/g, '<supplied reason="lost">$1</supplied><gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">$2</supplied>'), i = i.replace(/<supplied reason=\"lost\"><\/supplied>/g, ''), i = i.replace(/(?:⟦|〚)(.*?\s?)(?:(?:(?:\-|\–|\—)\s?){1,20})(.*?)(?:⟧|〛)(?![^\x00-\x7F]*?[aA-zZ]*?\()/g, '<del rend="erasure">$1</del><gap reason="lost" extent="unknown" unit="character"/><del rend="erasure">$2</del>'), i = i.replace(/(?:\s)\[(.*?)\](?:\n)/g, ` <supplied reason="lost">$1</supplied>
`), i = i.replace(/(?:\s)\[(.*)\](?:\s)/g, ' <supplied reason="lost">$1</supplied> '), i = i.replace(/(?:\s)(?:⟦|〚)(.*?)(?:⟧|〛)(?:\n)/g, ` <del rend="erasure">$1</del>
`), i = i.replace(/(?:\s)(?:⟦|〚)(.*?)(?:⟧|〛)(?:\s)/g, ' <del256 rend="erasure">$1</del> '), a = /([^\x00-\x7F]*[aA-zZ]*)\[([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)(\])/g; let h = '<expan><abbr>$1<supplied reason="lost">$2</supplied></abbr><ex>$3</ex></expan>'; i = i.replace(a, h), a = /([^\x00-\x7F]*[aA-zZ]*)(?:⟦|〚)([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)(?:⟧|〛)/g, h = '<expan><abbr>$1<del rend="erasure">$2</del></abbr><ex>$3</ex></expan>', i = i.replace(a, h), i = i.replace(/([^\x00-\x7F]*?[aA-zZ]*?[^>])?\[([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\)(.*?[^\-\–\—])\](?![^\x00-\x7F]*?[aA-zZ]*\()/g, '<expan><abbr>$1<supplied reason="lost">$2</supplied></abbr><ex>$3</ex></expan> <supplied reason="lost">$4</supplied>'), i = i.replace(/([^\x00-\x7F]*?[aA-zZ]*?[^\s][^>])?(?:\s?)(?:⟦|〚)([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\)(.*?[^\-\–\—])(?:⟧|〛)(?![^\x00-\x7F]*?[aA-zZ]*\()/g, '<expan><abbr>$1<del rend="erasure">$2</del></abbr><ex>$3</ex></expan> <del rend="erasure">$4</del>'), i = i.replace(/([^\x00-\x7F]*?[aA-zZ]+)\[([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\)(.*?[^\-\–\—])([^\x00-\x7F]*?[aA-zZ]*?)\](?:([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\))/g, '<expan><abbr>$1<supplied reason="lost">$2</supplied></abbr><ex>$3</ex></expan> <supplied reason="lost">$4</supplied><expan><abbr><supplied reason="lost">$5</supplied>$6</abbr><ex>$7</ex></expan>'), i = i.replace(/([^\x00-\x7F]*?[aA-zZ]*?)(?:⟦|〚)([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\)(.*?[^\-\–\—])([^\x00-\x7F]*?[aA-zZ]*?)(?:⟧|〛)(?:([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\))/g, '<expan><abbr>$1<del rend="erasure">$2</del></abbr><ex>$3</ex></expan> <del rend="erasure">$4</del><expan><abbr><del rend="erasure">$5</del>$6</abbr><ex>$7</ex></expan>'), i = i.replace(/<supplied reason="lost"> (?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:(?:-)([1-9][0-9]*))(?:\s?)(?:[\.․]){1,20} <\/supplied>/g, '<gap reason="lost" atLeast="$1" atMost="$2" unit="character"/>'), i = i.replace(/<supplied reason=\"lost\">(<gap reason=\"lost\" atLeast=\"[0-9]*\" atMost=\"[0-9]\" unit="character"\/>)<\/supplied>/g, '$1'), i = i.replace(/\[(.[^\[\-\–\—]*)\](?![^\x00-\x7F]*[aA-zZ]*\()/g, '<supplied reason="lost">$1</supplied>'), i = i.replace(/(?:⟦|〚)(.[^\[]*)\](?![^\x00-\x7F]*[aA-zZ]*\()/g, '<del rend="erasure">$1</supplied>'), i = i.replace(/(?:\s)\[((.[^\.<])*)\s/g, ' <supplied reason="lost"><expan><abbr>$1</abbr><ex>$2</ex></expan></supplied>'), i = i.replace(/(?!([^\x00-\x7F]*[aA-zZ]*))(\s)([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)\]/g, '$1<supplied reason="lost"><expan><abbr>$2</abbr><ex>$3</ex></expan></supplied>'), i = i.replace(/(\s)([^\x00-\x7F]*?[aA-zZ]*?)\]([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*[aA-zZ]*)\)/g, '$1</supplied><expan><abbr><supplied reason="lost">$2</supplied>$3</abbr><ex>$4</ex></expan>'), i = i.replace(/(\s)([^\x00-\x7F]+[aA-zZ]+)\[([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)/g, ' <expan><abbr>$2<supplied reason="lost">$3</supplied></abbr><ex>$4</ex></expan> <supplied reason="lost">'), i = i.replace(/\[([^\x00-\x7F]*[aA-zZ]*)\(\?\)((\s?(\-|\–|\—)\s?){1,20})\]/g, '<supplied reason="lost" cert="low">$1</supplied><gap reason="lost" extent="unknown" unit="character"/>'), i = i.replace(/\[([^\x00-\x7F]*[aA-zZ]*)((\s?(\-|\–|\—)\s?){1,20})\]/g, '<supplied reason="lost">$1</supplied><gap reason="lost" extent="unknown" unit="character"/>'), a = /([^\x00-\x7F]*[aA-zZ]*)\[([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)(\s)?([^\x00-\x7F]*[aA-zZ]*)?(\s)?(\])/g, h = '<expan><abbr>$1<supplied reason="lost">$2</supplied></abbr><ex>$3</ex></expan><supplied reason="lost">$4$5</supplied>', i = i.replace(a, h), a = /(〚|⟦|\[\[)([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)([^\x00-\x7F]*[aA-zZ]*)?(〛|⟧|]])/g, h = '<del rend="erasure"><expan><abbr>$2</abbr><ex>$3</ex></expan>$4</del>', i = i.replace(a, h), a = /\[([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)(])/g, h = '<supplied reason="lost"><expan><abbr>$1</abbr><ex>$2</ex></expan></supplied>', i = i.replace(a, h), a = /([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\?\)/g; const c = '<expan><abbr>$1</abbr><ex cert="low">$2</ex></expan>'; i = i.replace(a, c), a = /([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)([^\x00-\x7F]*[aA-zZ]*)*\(([^\x00-\x7F]*[aA-zZ]*)\)/g, h = '<expan><abbr>$1</abbr><ex>$2</ex><abbr>$3</abbr><ex>$4</ex></expan>', i = i.replace(a, h), a = /([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)([^\x00-\x7F]*[aA-zZ]*)*/g, h = '<expan><abbr>$1</abbr><ex>$2</ex>$3</expan>', i = i.replace(a, h), i = i.replace('</expan><expan><abbr>', '<abbr>'), i = i.replace(`
[------]`, '<gap unit="line" />'), i = i.replace(/(-){6}/g, '<gap unit="line" />'), i = i.replace(/\[(—\s?)*\]/g, '<gap reason="lost" extent="unknown" unit="character"/>'), i = i.replace(/\[---\]/g, '<gap reason="lost" extent="unknown" unit="character"/>'), i = i.replace(/\[— — —ca\.([1-9][0-9]*)((-)([1-9][0-9]*))?— — —\]/g, '<gap reason="lost" quantity="$1" unit="character" precision="low"/>'), i = i.replace(/\[— — — —ca\.([1-9][0-9]*)((-)([1-9][0-9]*))?— — — —\]/g, '<gap reason="lost" quantity="$1" unit="character" precision="low"/>'), i = i.replace(/\[(-|–\s?){1,20}ca\.(\s?)([1-9][0-9]*)?(\s?)(-|–\s?){1,20}\]/g, '<gap reason="lost" quantity="$3" unit="character" precision="low"/>'), i = i.replace(/\------\?/g, '<gap reason="lost" extent="unknown" unit="line"><certainty match=".." locus="name"/></gap>'), i = i.replace(/\[\------\?\]/g, '<gap reason="lost" extent="unknown" unit="line"><certainty match=".." locus="name"/></gap>'), i = i.replace(/\[\---\?\]/g, '<gap reason="lost" extent="unknown" unit="line"><certainty match=".." locus="name"/></gap>'), i = i.replace(/\[(-|–|\—\s?){1,20}([^\x00-\x7F]*[aA-zZ]*)\]/g, '<gap reason="lost" extent="unknown" unit="character"/>'), i = i.replace(/\[(-|–|\—\s?){1,20}([^\x00-\x7F]*[aA-zZ]*)\]/g, '<gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">$2</supplied>'), i = i.replace(/(?:⟦|〚)(-|–|\—\s?){1,20}([^\x00-\x7F]*[aA-zZ]*)(?:⟧|〛)/g, '<gap reason="lost" extent="unknown" unit="character"/><del rend="erasure">$2</supplied>'), i = i.replace(/\[(?!([\-\–\—]))(((?!([\-\–\—\[\]]))[^\x00-\x7F]*[aA-zZ]*(\s?)){1,10})(([\-\—\–])\s?){1,20}\]/g, '<supplied reason="lost">$2</supplied><gap reason="lost" extent="unknown" unit="character"/>'), i = i.replace(/(([\-\—\–])\s?){1,20}\]/g, '<gap reason="lost" extent="unknown" unit="character"/>'), i = i.replace(/<expan><abbr>\[/g, '<supplied reason="lost"><expan><abbr>'), i = i.replace(/<\/expan> <\/supplied></g, '</expan></supplied> <'), i = i.replace(/<supplied reason=\"lost\"><expan><abbr>([^\x00-\x7F]*?[aA-zZ]*?)\]/g, '<expan><abbr><supplied reason="lost">$1</supplied>'), i = i.replace(/<expan><abbr><\/abbr><ex>/g, '<expan><ex>'); const f = /\[/g; const u = '<supplied reason="lost">'; i = i.replace(f, u); const d = /\]/g; const p = '</supplied>'; i = i.replace(d, p), i = i.replace(/<\/ex><\/supplied><\/expan>/g, '</ex></expan></supplied>'), i = i.replace(/((\s?(\-|\—|\–)\s?){1,20})<\/supplied>/g, '</supplied><gap reason="lost" extent="unknown" unit="character"/>'), i = i.replace(/((\s?(\-|\—|\–)\s?){1,20})<\/supplied>/g, '</supplied><gap reason="lost" extent="unknown" unit="character"/>'), i = i.replace(/<supplied reason=\"lost\">((\s?(\-|\—|\–)\s?){1,20})/g, '<gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">'), i = i.replace(/<supplied reason=\"lost\"><\/supplied><gap reason=\"lost\" extent=\"unknown\" unit=\"character\"\/><supplied reason=\"lost\"><\/supplied>/g, '</supplied><gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">'), i = i.replace(/<supplied reason=\"lost\"> <\/supplied>/g, ''), i = i.replace(/<del rend=\"erasure\">\s?<\/del>/g, ''), i = i.replace(/<\/supplied>\s?<\/supplied>/g, '</supplied>'), i = i.replace(/\/><\/supplied><gap/g, '/><gap'), i = i.replace(/\[(?!([\-\–\—]))((?:\s?(?:(?!(?:[\-\–\—\[\]]))[^\x00-\x7F]*[aA-zZ](?!\s)*)){1,10})(?:(?:\s?[\-\—\–])\s?){1,20}((?:(?!([\-\–\—\[\]]))[^\x00-\x7F]*[aA-zZ]*))\]/g, '<supplied reason="lost">$2</supplied><gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">$3</supplied>'), i = i.replace(/(\s?([\-\—\–])\s?){1,20}/g, '</supplied><gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">'), i = i.replace(/\[(.[^\[]*)(\s)([^\x00-\x7F]*[aA-zZ]*)\]([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)/g, '<supplied reason="lost">$1</supplied><expan><abbr><supplied reason="lost">$3</supplied>$4</abbr><ex>$5</ex></expan>'); const g = /([+])+/g; i = i.replace(g, L => (console.log(`Ici match:${L.length}`), `<gap reason="illegible" quantity="${L.length}" unit="character"/>`)); const b = /\[(․{1,20})\]/g; i = i.replace(b, (L) => { console.log(`Ici match:${L.length}`); const N = L.length - 2; return `<gap reason="illegible" quantity="${N}" unit="character"/>`; }), i = i.replace(/<supplied reason=\"lost\"> <gap/g, ' <gap'); const y = /(hed\.)̣/gi; const S = '<g type="hedera">\u2766</g>'; i = i.replace(y, S); const P = /vac\./gi; const k = '<space extent="unknown" unit="character"/>'; i = i.replace(P, k); const C = /\{([^\x00-\x7F]*[aA-zZ]*)\}/g; const T = '<surplus>$1</surplus>'; i = i.replace(C, T), a = /(〚)(([^\x00-\x7F]*[aA-zZ]*)([\s\,\.]([^\x00-\x7F]*[aA-zZ]*))*)(〛)/gm, h = '<del rend="erasure">$2</del>', i = i.replace(a, h), a = /(⟦)(([^\x00-\x7F]*[aA-zZ]*)([\s\,\.]([^\x00-\x7F]*[aA-zZ]*))*)(⟧)/gm, h = '<del rend="erasure">$2</del>', i = i.replace(a, h), a = /(\[){2}(([^\x00-\x7F]*[aA-zZ]*)([\s\,\.]([^\x00-\x7F]*[aA-zZ]*))*)(\]){2}/gm, h = '<del rend="erasure">$2</del>', i = i.replace(a, h); const D = /(\[)(([^\x00-\x7F]*[aA-zZ]*)([\s\,\.]([^\x00-\x7F]*[aA-zZ]*))*)(\])/gm; const Z = '<supplied reason="lost">$2</supplied>'; i = i.replace(D, Z), a = new RegExp('a', 'u'); const F = /(\[)([^\x00-\x7F]*[aA-zZ]*\s?[^\x00-\x7F]*[aA-zZ]*)(---)?(\])/g; const B = '<supplied reason="lost">$2</supplied><gap reason="lost" />'; i = i.replace(F, B); const W = /([^\x00-\x7F]?[aA-zZ]?)̣/g; const Q = '<unclear>$1</unclear>'; i = i.replace(W, Q); const te = /(\<\/unclear\>\<unclear\>)/g; const we = ''; return i = i.replace(te, we), i = i.replace(/(<gap reason=\"lost\" atLeast=\"[0-9]*\" atMost=\"[0-9]\" unit=\"character\"\/>)<expan><abbr>((?:[^\x00-\x7F]*?[aA-zZ]*?)*)<\/supplied>/g, '$1<expan><abbr><supplied reason="lost">$2</supplied>'), i = i.replace(/(<gap reason=\"lost\" atLeast=\"[0-9]*\" atMost=\"[0-9]\" unit=\"character\"\/>)<\/supplied>/g, '$1'), i = i.replace(/(<gap reason=\"lost\" atLeast=\"[0-9]*\" atMost=\"[0-9]\" unit=\"character\"\/>)<expan><abbr>((?:[^\x00-\x7F]*?[aA-zZ]*?)*)<\/supplied>/g, '$1<expan><abbr><supplied reason="lost">$2</supplied>'), i = i.replace(/(<gap reason=\"lost\" quantity=\"[0-9]*\" unit=\"character\" precision=\"low\"\/>)<\/supplied>/g, '$1'), i = i.replace(/(\/\>)\s(\<lb n=\"[0-9]*\"\/\>)/g, `$1
$2`), i = i.replace(/unit=\"line\"\/>\s(\w)/g, 'unit="line"/>$1'), i = i.replace(/ ?∙ ?/g, ' <g type="interpunct">\u25B4</g> '), i = i.replace(/ ?𐆖 ?/g, ' <g type="denarius"/> '), i = i.replace(/❦/g, ' <g type="hedera">\u2766</g> '), i = i.replace(/\s\s/g, ' '), i = i.replace(/ {2,99}/g, ''), i;
  } function Jb(i, e) {
    const n = `<ab>${Vl(i, e)}
</ab>`; const r = new DOMParser().parseFromString(n, 'application/xml'); return r.firstElementChild ? Pn(r.firstElementChild) : '';
  } const Yb = (i, e) => (t) => {
    const n = t.state.doc.toJSON(); const s = Jb(n.join(`
`), e); return i.content = s, i.mode = 'leiden_plus', !0;
  }; const Wl = { erasure: kt('[[', ']]'), gap: ju('[---]') }; const ey = [{ key: 'Ctrl-Shift-d', mac: 'Cmd-Shift-d', run: Wl.erasure }, { key: 'Ctrl-Shift-l', mac: 'Cmd-Shift-l', run: Wl.gap }]; const lr = class extends zt {
    constructor(t, n) { super(t); this._sourceType = n; }

    getExtensions() { return [Pe.of(ey), Ri()]; }

    getCommands() { return Zl(Gl({}, Wl), { convert: Yb(this.editor, this._sourceType) }); }

    onUpdate(t, n) {
      return `<ab>
${Vl(n, this._sourceType)}
</ab>`;
    }

    serialize() { return this.editor.content; }

    setFromValue(t) { if (!t) return ''; if (typeof t !== 'string') throw new Error('cannot set value'); return t; }
  }; const Mn = class extends HTMLElement {
    constructor() { super(); this._mode = 'xml'; this.attachShadow({ mode: 'open' }); }

    connectedCallback() { let r; let o; let l; let a; const t = document.createElement('style'); t.innerHTML = this.styles(), (r = this.shadowRoot) == null || r.appendChild(t); const n = document.createElement('slot'); n.name = 'toolbar', (o = this.shadowRoot) == null || o.appendChild(n); const s = document.createElement('div'); s.id = 'editor', (l = this.shadowRoot) == null || l.appendChild(s), this.registerToolbar((a = this.shadowRoot) == null ? void 0 : a.querySelector('[name=toolbar]')), this.namespace = this.getAttribute('namespace'), this.mode = this.initModes() || this.getAttribute('mode') || 'xml', this.addEventListener('blur', (h) => { const c = h.relatedTarget; if (c) { let f = c.parentNode; for (;f;) { if (f === this) { h.preventDefault(), h.stopPropagation(); return; }f = f.parentNode; } } }); }

    focus() { this._editor && this._editor.focus(); }

    set mode(t) { let o; let l; let a; const n = (o = this.shadowRoot) == null ? void 0 : o.getElementById('editor'); if (!n) return; this._editor && this._editor.destroy(), this._mode = nr[t], console.log(`<jinn-codemirror> mode: ${this.mode}`), this.activateToolbar((l = this.shadowRoot) == null ? void 0 : l.querySelector('[name=toolbar]')), this.configure(); const s = this.querySelector('[name=modes]'); s && s instanceof HTMLSelectElement && (s.value = this._mode); const r = (a = this._config) == null ? void 0 : a.getConfig(); this._editor = new O({ state: $.create(r), parent: n }), this._config && (this.content = this._config.setFromValue(this._value)); }

    configure() { switch (this._mode) { case 'default': case 'edcs': case 'phi': this._config = new lr(this, this._mode); break; case 'leiden_plus': this._config = new or(this); break; default: this._config = new zi(this, this.namespace); break; } }

    get mode() { return this._mode; }

    set valid(t) { this.setAttribute('valid', t.toString()); }

    get valid() { return Boolean(this.hasAttribute('valid')); }

    set content(t) { if (!this._editor) { console.log('no editor'); return; } this._editor.dispatch({ changes: { from: 0, to: this._editor.state.doc.length, insert: t } }); }

    get content() { let t; return ((t = this._editor) == null ? void 0 : t.state.doc.toString()) || ''; }

    set value(t) { let s; this.setValue(t) && this._editor && this._config && (this.content = (s = this._config) == null ? void 0 : s.setFromValue(this._value)); }

    get value() { return this.getValue(); }

    setValue(t) { if (!this._config) return !1; const n = this._config.setFromValue(t); return this._value === n ? !1 : (this._value = t, !0); }

    getValue() { return this._value ? this._value : null; }

    emitUpdateEvent(t) { this.dispatchEvent(new CustomEvent('update', { detail: { content: t }, composed: !0, bubbles: !0 })); }

    initModes() { const t = this.querySelector('[name=modes]'); return t && t instanceof HTMLSelectElement ? (t.addEventListener('change', () => { this.mode = t.value; }), t.value) : null; }

    registerToolbar(t) { t == null || t.assignedElements().forEach((n) => { n.querySelectorAll('slot').forEach(s => this.registerToolbar(s)), n.querySelectorAll('[data-command]').forEach((s) => { const r = s.dataset.command; s.addEventListener('click', () => { let a; let h; if (!this._config) return; const l = this._config.getCommands()[r]; if (l) if (l instanceof Function)l(this._editor), l.name !== 'encloseWithCommand' && ((a = this._editor) == null || a.focus()); else { const c = s.dataset.params; const f = l.create; if (c) { let u; try { u = JSON.parse(c); } catch (d) { u = [c]; }Array.isArray(u) && u.length === f.length ? f.apply(null, u)(this._editor) : console.error('<jinn-codemirror> Expected %d arguments for command %s', f.length, r); } else console.error('<jinn-codemirror> No arguments specified for command %s', r); (h = this._editor) == null || h.focus(); } }); }); }); }

    activateToolbar(t) { t == null || t.assignedElements().forEach((n) => { n.querySelectorAll('slot').forEach(s => this.activateToolbar(s)), n.querySelectorAll('[data-command]').forEach((s) => { const r = s; !r.dataset.mode || r.dataset.mode === this._mode ? r.style.display = 'inline' : r.style.display = 'none'; }); }); }

    styles() {
      return `
            :host > div, .cm-editor {
                height: 100%;
                width: 100%;
                background-color: var(--jinn-codemirror-background-color, #fff);
            }
        `;
    }
  }; window.customElements.define('jinn-codemirror', Mn); const Hl = class extends Mn {
    constructor() { super(...arguments); this.unwrap = !1; }

    connectedCallback() { this.unwrap = this.hasAttribute('unwrap'), super.connectedCallback(); const t = this.getAttribute('wrapper'); if (t) { const s = new DOMParser().parseFromString(t, 'application/xml'); s.getElementsByTagName('parsererror').length ? console.error('<jinn-xml-editor> Invalid XML for wrapper attribute: %s', new XMLSerializer().serializeToString(s)) : this.setValue(s.firstElementChild); } }

    configure() { const t = this.hasAttribute('check-namespace'); this._config = new zi(this, this.namespace, t, this.unwrap); }

    emitUpdateEvent(t) { if (!this.unwrap) return super.emitUpdateEvent(t); this.updateValue(), super.emitUpdateEvent(this._wrapper); }

    updateValue() { let t; let n; if (!this._wrapper) return console.log('no wrapper !!!'), null; if (this._wrapper.replaceChildren(), !this._value)console.log('xml editor value is empty'); else if (this._value instanceof NodeList) for (let s = 0; s < this._value.length; s++) { const r = this._wrapper.ownerDocument.importNode(this._value[s], !0); (t = this._wrapper) == null || t.appendChild(r); } else if (this._value instanceof Node)(n = this._wrapper) == null || n.appendChild(this._value); else throw console.error('<xml-editor> Value is not a node'), new Error('value is not a node'); }

    setValue(t) { let n; let s; if (!this.unwrap) return super.setValue(t); if (((n = this._config) == null ? void 0 : n.setFromValue(this._wrapper)) === ((s = this._config) == null ? void 0 : s.setFromValue(t))) return !1; if (t || (this._wrapper = null), !(t instanceof Element)) throw new Error('Value is not a node'); return this._wrapper = t, this._value = t.childNodes, !0; }

    getValue() { if (!this.unwrap) return super.getValue(); if (!this._wrapper) return null; if (!(this._wrapper instanceof Element)) throw new Error('Value is not a node'); return this.updateValue(), this._wrapper; }
  }; customElements.get('jinn-xml-editor') || window.customElements.define('jinn-xml-editor', Hl); const ty = `
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
    [slot=toolbar] {
        display: flex;
    }
    .hidden {
        display: none;
    }
    #close-leiden {
        margin-left: .75rem;
        font-weight: bold;
    }`; const ql = class extends HTMLElement {
    constructor() { super(); this.xmlEditor = null, this.valid = !0, this.unwrap = !1, this.schema = null, this.attachShadow({ mode: 'open' }); }

    set value(t) { this.xmlEditor.value = t; }

    get value() { return this.xmlEditor.value; }

    connectedCallback() {
      let r; let o; let l; let a; this.unwrap = this.hasAttribute('unwrap'), this.schema = this.getAttribute('schema'), this.shadowRoot.innerHTML = `
            <style>
                ${ty}
            </style>
            <jinn-codemirror id="leiden-editor" class="hidden">
                <div slot="toolbar">
                    <select name="modes">
                        <option value="edcs" selected>EDCS/EDH</option>
                        <option value="default">Petrae</option>
                        <option value="leiden_plus">Leiden+</option>
                    </select>
                    <slot name="leiden-toolbar"></slot>
                    <button part="button" id="close-leiden">Close</button>
                </div>
            </jinn-codemirror>
            <jinn-xml-editor id="xml-editor" ${this.unwrap ? 'unwrap' : ''} schema="${this.schema}">
                <div slot="toolbar">
                    <button part="button" id="import" title="Import from Leiden markup">Leiden Editor</button>
                    <slot name="xml-toolbar"></slot>
                </div>
            </jinn-xml-editor>
        `, this.xmlEditor = (r = this.shadowRoot) == null ? void 0 : r.querySelector('#xml-editor'); const t = (o = this.shadowRoot) == null ? void 0 : o.querySelector('#leiden-editor'); const n = (l = this.shadowRoot) == null ? void 0 : l.querySelector('#import'); const s = (a = this.shadowRoot) == null ? void 0 : a.querySelector('#close-leiden'); if (!(this.xmlEditor && t && n && s)) throw new Error('One or more components were not initialized'); t.addEventListener('update', (h) => { h.stopPropagation(), this.xmlEditor.content = h.detail.content; }), n.addEventListener('click', () => { let c; if (t.classList.contains('hidden')) { if (this.xmlEditor.content.length > 0) { t.mode = 'leiden_plus'; const f = (c = this.xmlEditor) == null ? void 0 : c.value; this.unwrap && f instanceof Element ? t.value = f.childNodes : t.value = f; }t.classList.remove('hidden'), t.focus(), n.classList.add('hidden'); } else t.classList.add('hidden'), n.classList.remove('hidden'), this.xmlEditor.focus(); }), s.addEventListener('click', () => { n.classList.remove('hidden'), t.classList.add('hidden'), this.xmlEditor.focus(); }), this.xmlEditor.addEventListener('invalid', (h) => { h.stopPropagation(), this.valid = !1, this.setAttribute('valid', this.valid.toString()), this.dispatchEvent(new CustomEvent('invalid', { detail: h.detail, composed: !0, bubbles: !0 })); }), this.xmlEditor.addEventListener('valid', (h) => { h.stopPropagation(), this.valid = !0, this.setAttribute('valid', this.valid.toString()), this.dispatchEvent(new CustomEvent('valid', { detail: h.detail, composed: !0, bubbles: !0 })); });
    }
  }; customElements.get('jinn-epidoc-editor') || window.customElements.define('jinn-epidoc-editor', ql);
})();
// # sourceMappingURL=jinn-codemirror-bundle.js.map
