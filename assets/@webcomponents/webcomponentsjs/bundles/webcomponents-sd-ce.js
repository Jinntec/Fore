/// BareSpecifier=@webcomponents/webcomponentsjs/bundles/webcomponents-sd-ce
/**
@license @nocompile
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
(function () {
  /*
  Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
  This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
  The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
  The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
  Code distributed by Google as part of the polymer project is also
  subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
  */
  'use strict';
  var n,
      p = "undefined" != typeof window && window === this ? this : "undefined" != typeof global && null != global ? global : this,
      aa = "function" == typeof Object.defineProperties ? Object.defineProperty : function (a, b, c) {
    a != Array.prototype && a != Object.prototype && (a[b] = c.value);
  };function ba() {
    ba = function () {};p.Symbol || (p.Symbol = ca);
  }var ca = function () {
    var a = 0;return function (b) {
      return "jscomp_symbol_" + (b || "") + a++;
    };
  }();
  function da() {
    ba();var a = p.Symbol.iterator;a || (a = p.Symbol.iterator = p.Symbol("iterator"));"function" != typeof Array.prototype[a] && aa(Array.prototype, a, { configurable: !0, writable: !0, value: function () {
        return ea(this);
      } });da = function () {};
  }function ea(a) {
    var b = 0;return fa(function () {
      return b < a.length ? { done: !1, value: a[b++] } : { done: !0 };
    });
  }function fa(a) {
    da();a = { next: a };a[p.Symbol.iterator] = function () {
      return this;
    };return a;
  }function ha(a) {
    da();ba();da();var b = a[Symbol.iterator];return b ? b.call(a) : ea(a);
  }
  function ia(a) {
    for (var b, c = []; !(b = a.next()).done;) c.push(b.value);return c;
  }function ja() {}ja.prototype.toJSON = function () {
    return {};
  };function q(a) {
    a.__shady || (a.__shady = new ja());return a.__shady;
  }function r(a) {
    return a && a.__shady;
    }
    var t = window.ShadyDOM || {};
    t.ra = !(!Element.prototype.attachShadow || !Node.prototype.getRootNode);
    var ma = Object.getOwnPropertyDescriptor(Node.prototype, "firstChild");
    t.j = !!(ma && ma.configurable && ma.get);
    t.V = t.force || !t.ra;
    t.v = t.noPatch || !1;
    t.ba = t.preferPerformance;
    var na = navigator.userAgent.match("Trident");
    t.ga = na;
    function u(a) {
        return (a = r(a)) && void 0 !== a.firstChild;
  }function v(a) {
    return "ShadyRoot" === a.la;
  }function oa(a) {
    return (a = (a = r(a)) && a.root) && pa(a);
  }
  var w = Element.prototype,
      qa = w.matches || w.matchesSelector || w.mozMatchesSelector || w.msMatchesSelector || w.oMatchesSelector || w.webkitMatchesSelector,
      ra = document.createTextNode(""),
      sa = 0,
      ta = [];new MutationObserver(function () {
    for (; ta.length;) try {
      ta.shift()();
    } catch (a) {
      throw ra.textContent = sa++, a;
    }
  }).observe(ra, { characterData: !0 });function ua(a) {
    ta.push(a);ra.textContent = sa++;
  }var va = !!document.contains;function wa(a, b) {
    for (; b;) {
      if (b == a) return !0;b = b.__shady_parentNode;
    }return !1;
  }
  function xa(a) {
    for (var b = a.length - 1; 0 <= b; b--) {
      var c = a[b],
          d = c.getAttribute("id") || c.getAttribute("name");d && "length" !== d && isNaN(d) && (a[d] = c);
    }a.item = function (b) {
      return a[b];
    };a.namedItem = function (b) {
      if ("length" !== b && isNaN(b) && a[b]) return a[b];for (var c = ha(a), d = c.next(); !d.done; d = c.next()) if (d = d.value, (d.getAttribute("id") || d.getAttribute("name")) == b) return d;return null;
    };return a;
  }function ya(a) {
    var b = [];for (a = a.__shady_native_firstChild; a; a = a.__shady_native_nextSibling) b.push(a);return b;
  }
  function za(a) {
    var b = [];for (a = a.__shady_firstChild; a; a = a.__shady_nextSibling) b.push(a);return b;
  }function x(a, b, c, d) {
    c = void 0 === c ? "" : c;for (var e in b) {
      var f = b[e];if (!(d && 0 <= d.indexOf(e))) {
        f.configurable = !0;var g = c + e;if (f.value) a[g] = f.value;else try {
          Object.defineProperty(a, g, f);
        } catch (h) {}
      }
    }
  }function y(a) {
    var b = {};Object.getOwnPropertyNames(a).forEach(function (c) {
      b[c] = Object.getOwnPropertyDescriptor(a, c);
    });return b;
    }
    var Aa = [],
        Ba;function Ca(a) {
    Ba || (Ba = !0, ua(Da));Aa.push(a);
  }function Da() {
    Ba = !1;for (var a = !!Aa.length; Aa.length;) Aa.shift()();return a;
  }Da.list = Aa;function Ea() {
    this.a = !1;this.addedNodes = [];this.removedNodes = [];this.L = new Set();
  }function Fa(a) {
    a.a || (a.a = !0, ua(function () {
      a.flush();
    }));
  }Ea.prototype.flush = function () {
    if (this.a) {
      this.a = !1;var a = this.takeRecords();a.length && this.L.forEach(function (b) {
        b(a);
      });
    }
  };Ea.prototype.takeRecords = function () {
    if (this.addedNodes.length || this.removedNodes.length) {
      var a = [{ addedNodes: this.addedNodes, removedNodes: this.removedNodes }];this.addedNodes = [];this.removedNodes = [];return a;
    }return [];
  };
  function Ga(a, b) {
    var c = q(a);c.G || (c.G = new Ea());c.G.L.add(b);var d = c.G;return { ka: b, B: d, ma: a, takeRecords: function () {
        return d.takeRecords();
      } };
  }function Ha(a) {
    var b = a && a.B;b && (b.L.delete(a.ka), b.L.size || (q(a.ma).G = null));
  }
  function Ia(a, b) {
    var c = b.getRootNode();return a.map(function (a) {
      var b = c === a.target.getRootNode();if (b && a.addedNodes) {
        if (b = Array.from(a.addedNodes).filter(function (a) {
          return c === a.getRootNode();
        }), b.length) return a = Object.create(a), Object.defineProperty(a, "addedNodes", { value: b, configurable: !0 }), a;
      } else if (b) return a;
    }).filter(function (a) {
      return a;
    });
  }
    var Ja = /[&\u00A0"]/g,
        Ka = /[&\u00A0<>]/g;function La(a) {
    switch (a) {case "&":
        return "&amp;";case "<":
        return "&lt;";case ">":
        return "&gt;";case '"':
        return "&quot;";case "\u00a0":
        return "&nbsp;";}
  }function Ma(a) {
    for (var b = {}, c = 0; c < a.length; c++) b[a[c]] = !0;return b;
  }var Na = Ma("area base br col command embed hr img input keygen link meta param source track wbr".split(" ")),
      Oa = Ma("style script xmp iframe noembed noframes plaintext noscript".split(" "));
  function Pa(a, b) {
    "template" === a.localName && (a = a.content);for (var c = "", d = b ? b(a) : a.childNodes, e = 0, f = d.length, g = void 0; e < f && (g = d[e]); e++) {
      a: {
        var h = g;var k = a,
            l = b;switch (h.nodeType) {case Node.ELEMENT_NODE:
            k = h.localName;for (var m = "<" + k, B = h.attributes, ka = 0, la; la = B[ka]; ka++) m += " " + la.name + '="' + la.value.replace(Ja, La) + '"';m += ">";h = Na[k] ? m : m + Pa(h, l) + "</" + k + ">";break a;case Node.TEXT_NODE:
            h = h.data;h = k && Oa[k.localName] ? h : h.replace(Ka, La);break a;case Node.COMMENT_NODE:
            h = "\x3c!--" + h.data + "--\x3e";break a;default:
            throw window.console.error(h), Error("not implemented");}
      }c += h;
    }return c;
  }
    var Qa = t.j,
        Ra = { querySelector: function (a) {
      return this.__shady_native_querySelector(a);
    }, querySelectorAll: function (a) {
      return this.__shady_native_querySelectorAll(a);
    } },
      Sa = {};function Ta(a) {
    Sa[a] = function (b) {
      return b["__shady_native_" + a];
    };
  }function Ua(a, b) {
    x(a, b, "__shady_native_");for (var c in b) Ta(c);
  }function z(a, b) {
    b = void 0 === b ? [] : b;for (var c = 0; c < b.length; c++) {
      var d = b[c],
          e = Object.getOwnPropertyDescriptor(a, d);e && (Object.defineProperty(a, "__shady_native_" + d, e), e.value ? Ra[d] || (Ra[d] = e.value) : Ta(d));
    }
  }
  var A = document.createTreeWalker(document, NodeFilter.SHOW_ALL, null, !1),
      C = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT, null, !1),
      Wa = document.implementation.createHTMLDocument("inert");function Xa(a) {
    for (var b; b = a.__shady_native_firstChild;) a.__shady_native_removeChild(b);
  }var Ya = ["firstElementChild", "lastElementChild", "children", "childElementCount"],
      Za = ["querySelector", "querySelectorAll"];
  function $a() {
    var a = ["dispatchEvent", "addEventListener", "removeEventListener"];window.EventTarget ? z(window.EventTarget.prototype, a) : (z(Node.prototype, a), z(Window.prototype, a));Qa ? z(Node.prototype, "parentNode firstChild lastChild previousSibling nextSibling childNodes parentElement textContent".split(" ")) : Ua(Node.prototype, { parentNode: { get: function () {
          A.currentNode = this;return A.parentNode();
        } }, firstChild: { get: function () {
          A.currentNode = this;return A.firstChild();
        } }, lastChild: { get: function () {
          A.currentNode = this;return A.lastChild();
        } }, previousSibling: { get: function () {
          A.currentNode = this;return A.previousSibling();
        } }, nextSibling: { get: function () {
          A.currentNode = this;return A.nextSibling();
        } }, childNodes: { get: function () {
          var a = [];A.currentNode = this;for (var c = A.firstChild(); c;) a.push(c), c = A.nextSibling();return a;
        } }, parentElement: { get: function () {
          C.currentNode = this;return C.parentNode();
        } }, textContent: { get: function () {
          switch (this.nodeType) {case Node.ELEMENT_NODE:case Node.DOCUMENT_FRAGMENT_NODE:
              for (var a = document.createTreeWalker(this, NodeFilter.SHOW_TEXT, null, !1), c = "", d; d = a.nextNode();) c += d.nodeValue;return c;default:
              return this.nodeValue;}
        }, set: function (a) {
          if ("undefined" === typeof a || null === a) a = "";switch (this.nodeType) {case Node.ELEMENT_NODE:case Node.DOCUMENT_FRAGMENT_NODE:
              Xa(this);(0 < a.length || this.nodeType === Node.ELEMENT_NODE) && this.__shady_native_insertBefore(document.createTextNode(a), void 0);break;default:
              this.nodeValue = a;}
        } } });z(Node.prototype, "appendChild insertBefore removeChild replaceChild cloneNode contains".split(" "));
    z(HTMLElement.prototype, ["parentElement", "contains"]);a = { firstElementChild: { get: function () {
          C.currentNode = this;return C.firstChild();
        } }, lastElementChild: { get: function () {
          C.currentNode = this;return C.lastChild();
        } }, children: { get: function () {
          var a = [];C.currentNode = this;for (var c = C.firstChild(); c;) a.push(c), c = C.nextSibling();return xa(a);
        } }, childElementCount: { get: function () {
          return this.children ? this.children.length : 0;
        } } };Qa ? (z(Element.prototype, Ya), z(Element.prototype, ["previousElementSibling", "nextElementSibling", "innerHTML", "className"]), z(HTMLElement.prototype, ["children", "innerHTML", "className"])) : (Ua(Element.prototype, a), Ua(Element.prototype, { previousElementSibling: { get: function () {
          C.currentNode = this;return C.previousSibling();
        } }, nextElementSibling: { get: function () {
          C.currentNode = this;return C.nextSibling();
        } }, innerHTML: { get: function () {
          return Pa(this, ya);
        }, set: function (a) {
          var b = "template" === this.localName ? this.content : this;Xa(b);var d = this.localName || "div";d = this.namespaceURI && this.namespaceURI !== Wa.namespaceURI ? Wa.createElementNS(this.namespaceURI, d) : Wa.createElement(d);d.innerHTML = a;for (a = "template" === this.localName ? d.content : d; d = a.__shady_native_firstChild;) b.__shady_native_insertBefore(d, void 0);
        } }, className: { get: function () {
          return this.getAttribute("class") || "";
        }, set: function (a) {
          this.setAttribute("class", a);
        } } }));z(Element.prototype, "setAttribute getAttribute hasAttribute removeAttribute focus blur".split(" "));z(Element.prototype, Za);z(HTMLElement.prototype, ["focus", "blur"]);window.HTMLTemplateElement && z(window.HTMLTemplateElement.prototype, ["innerHTML"]);Qa ? z(DocumentFragment.prototype, Ya) : Ua(DocumentFragment.prototype, a);z(DocumentFragment.prototype, Za);Qa ? (z(Document.prototype, Ya), z(Document.prototype, ["activeElement"])) : Ua(Document.prototype, a);z(Document.prototype, ["importNode", "getElementById"]);z(Document.prototype, Za);
  }
    var ab = y({
            get childNodes() {
                return this.__shady_childNodes;
    }, get firstChild() {
      return this.__shady_firstChild;
    }, get lastChild() {
      return this.__shady_lastChild;
    }, get childElementCount() {
      return this.__shady_childElementCount;
    }, get children() {
      return this.__shady_children;
    }, get firstElementChild() {
      return this.__shady_firstElementChild;
    }, get lastElementChild() {
      return this.__shady_lastElementChild;
    }, get shadowRoot() {
      return this.__shady_shadowRoot;
    } }),
      bb = y({ get textContent() {
      return this.__shady_textContent;
    }, set textContent(a) {
      this.__shady_textContent = a;
    }, get innerHTML() {
      return this.__shady_innerHTML;
    }, set innerHTML(a) {
      return this.__shady_innerHTML = a;
    } }),
      cb = y({ get parentElement() {
      return this.__shady_parentElement;
    }, get parentNode() {
      return this.__shady_parentNode;
    }, get nextSibling() {
      return this.__shady_nextSibling;
    }, get previousSibling() {
      return this.__shady_previousSibling;
    }, get nextElementSibling() {
      return this.__shady_nextElementSibling;
    }, get previousElementSibling() {
      return this.__shady_previousElementSibling;
    }, get className() {
      return this.__shady_className;
    },
    set className(a) {
      return this.__shady_className = a;
    } }),
      db;for (db in ab) ab[db].enumerable = !1;for (var eb in bb) bb[eb].enumerable = !1;for (var fb in cb) cb[fb].enumerable = !1;var gb = t.j || t.v,
      hb = gb ? function () {} : function (a) {
    var b = q(a);b.ia || (b.ia = !0, x(a, cb));
  },
      ib = gb ? function () {} : function (a) {
    var b = q(a);b.ha || (b.ha = !0, x(a, ab), window.customElements && !t.v || x(a, bb));
  };var jb = "__eventWrappers" + Date.now(),
      kb = function () {
    var a = Object.getOwnPropertyDescriptor(Event.prototype, "composed");return a ? function (b) {
      return a.get.call(b);
    } : null;
  }(),
      lb = function () {
    function a() {}var b = !1,
        c = { get capture() {
        b = !0;
      } };window.addEventListener("test", a, c);window.removeEventListener("test", a, c);return b;
  }();function mb(a) {
    if (a && "object" === typeof a) {
      var b = !!a.capture;var c = !!a.once;var d = !!a.passive;var e = a.A;
    } else b = !!a, d = c = !1;return { ca: e, capture: b, once: c, passive: d, aa: lb ? a : b };
  }
  var nb = { blur: !0, focus: !0, focusin: !0, focusout: !0, click: !0, dblclick: !0, mousedown: !0, mouseenter: !0, mouseleave: !0, mousemove: !0, mouseout: !0, mouseover: !0, mouseup: !0, wheel: !0, beforeinput: !0, input: !0, keydown: !0, keyup: !0, compositionstart: !0, compositionupdate: !0, compositionend: !0, touchstart: !0, touchend: !0, touchmove: !0, touchcancel: !0, pointerover: !0, pointerenter: !0, pointerdown: !0, pointermove: !0, pointerup: !0, pointercancel: !0, pointerout: !0, pointerleave: !0, gotpointercapture: !0, lostpointercapture: !0, dragstart: !0,
    drag: !0, dragenter: !0, dragleave: !0, dragover: !0, drop: !0, dragend: !0, DOMActivate: !0, DOMFocusIn: !0, DOMFocusOut: !0, keypress: !0 },
      ob = { DOMAttrModified: !0, DOMAttributeNameChanged: !0, DOMCharacterDataModified: !0, DOMElementNameChanged: !0, DOMNodeInserted: !0, DOMNodeInsertedIntoDocument: !0, DOMNodeRemoved: !0, DOMNodeRemovedFromDocument: !0, DOMSubtreeModified: !0 };function pb(a) {
    return a instanceof Node ? a.__shady_getRootNode() : a;
  }
  function qb(a, b) {
    var c = [],
        d = a;for (a = pb(a); d;) c.push(d), d.__shady_assignedSlot ? d = d.__shady_assignedSlot : d.nodeType === Node.DOCUMENT_FRAGMENT_NODE && d.host && (b || d !== a) ? d = d.host : d = d.__shady_parentNode;c[c.length - 1] === document && c.push(window);return c;
  }function rb(a) {
    a.__composedPath || (a.__composedPath = qb(a.target, !0));return a.__composedPath;
  }function sb(a, b) {
    if (!v) return a;a = qb(a, !0);for (var c = 0, d, e = void 0, f, g = void 0; c < b.length; c++) if (d = b[c], f = pb(d), f !== e && (g = a.indexOf(f), e = f), !v(f) || -1 < g) return d;
  }
  function tb(a) {
    function b(b, d) {
      b = new a(b, d);b.__composed = d && !!d.composed;return b;
    }b.__proto__ = a;b.prototype = a.prototype;return b;
  }var ub = { focus: !0, blur: !0 };function vb(a) {
    return a.__target !== a.target || a.__relatedTarget !== a.relatedTarget;
  }function wb(a, b, c) {
    if (c = b.__handlers && b.__handlers[a.type] && b.__handlers[a.type][c]) for (var d = 0, e; (e = c[d]) && (!vb(a) || a.target !== a.relatedTarget) && (e.call(b, a), !a.__immediatePropagationStopped); d++);
  }
  function xb(a) {
    var b = a.composedPath();Object.defineProperty(a, "currentTarget", { get: function () {
        return d;
      }, configurable: !0 });for (var c = b.length - 1; 0 <= c; c--) {
      var d = b[c];wb(a, d, "capture");if (a.S) return;
    }Object.defineProperty(a, "eventPhase", { get: function () {
        return Event.AT_TARGET;
      } });var e;for (c = 0; c < b.length; c++) {
      d = b[c];var f = r(d);f = f && f.root;if (0 === c || f && f === e) if (wb(a, d, "bubble"), d !== window && (e = d.__shady_getRootNode()), a.S) break;
    }
  }
  function yb(a, b, c, d, e, f) {
    for (var g = 0; g < a.length; g++) {
      var h = a[g],
          k = h.type,
          l = h.capture,
          m = h.once,
          B = h.passive;if (b === h.node && c === k && d === l && e === m && f === B) return g;
    }return -1;
  }
  function zb(a, b, c) {
    var d = mb(c),
        e = d.capture,
        f = d.once,
        g = d.passive,
        h = d.ca;d = d.aa;if (b) {
      var k = typeof b;if ("function" === k || "object" === k) if ("object" !== k || b.handleEvent && "function" === typeof b.handleEvent) {
        if (ob[a]) return this.__shady_native_addEventListener(a, b, d);var l = h || this;if (h = b[jb]) {
          if (-1 < yb(h, l, a, e, f, g)) return;
        } else b[jb] = [];h = function (d) {
          f && this.__shady_removeEventListener(a, b, c);d.__target || Ab(d);if (l !== this) {
            var e = Object.getOwnPropertyDescriptor(d, "currentTarget");Object.defineProperty(d, "currentTarget", { get: function () {
                return l;
              }, configurable: !0 });
          }d.__previousCurrentTarget = d.currentTarget;if (!v(l) && "slot" !== l.localName || -1 != d.composedPath().indexOf(l)) if (d.composed || -1 < d.composedPath().indexOf(l)) if (vb(d) && d.target === d.relatedTarget) d.eventPhase === Event.BUBBLING_PHASE && d.stopImmediatePropagation();else if (d.eventPhase === Event.CAPTURING_PHASE || d.bubbles || d.target === l || l instanceof Window) {
            var g = "function" === k ? b.call(l, d) : b.handleEvent && b.handleEvent(d);l !== this && (e ? (Object.defineProperty(d, "currentTarget", e), e = null) : delete d.currentTarget);return g;
          }
        };b[jb].push({ node: l, type: a, capture: e, once: f, passive: g, Fa: h });ub[a] ? (this.__handlers = this.__handlers || {}, this.__handlers[a] = this.__handlers[a] || { capture: [], bubble: [] }, this.__handlers[a][e ? "capture" : "bubble"].push(h)) : this.__shady_native_addEventListener(a, h, d);
      }
    }
  }
  function Bb(a, b, c) {
    if (b) {
      var d = mb(c);c = d.capture;var e = d.once,
          f = d.passive,
          g = d.ca;d = d.aa;if (ob[a]) return this.__shady_native_removeEventListener(a, b, d);var h = g || this;g = void 0;var k = null;try {
        k = b[jb];
      } catch (l) {}k && (e = yb(k, h, a, c, e, f), -1 < e && (g = k.splice(e, 1)[0].Fa, k.length || (b[jb] = void 0)));this.__shady_native_removeEventListener(a, g || b, d);g && ub[a] && this.__handlers && this.__handlers[a] && (a = this.__handlers[a][c ? "capture" : "bubble"], b = a.indexOf(g), -1 < b && a.splice(b, 1));
    }
  }
  function Cb() {
    for (var a in ub) window.__shady_native_addEventListener(a, function (a) {
      a.__target || (Ab(a), xb(a));
    }, !0);
  }
  var Db = y({ get composed() {
      void 0 === this.__composed && (kb ? this.__composed = "focusin" === this.type || "focusout" === this.type || kb(this) : !1 !== this.isTrusted && (this.__composed = nb[this.type]));return this.__composed || !1;
    }, composedPath: function () {
      this.__composedPath || (this.__composedPath = qb(this.__target, this.composed));return this.__composedPath;
    }, get target() {
      return sb(this.currentTarget || this.__previousCurrentTarget, this.composedPath());
    }, get relatedTarget() {
      if (!this.__relatedTarget) return null;this.__relatedTargetComposedPath || (this.__relatedTargetComposedPath = qb(this.__relatedTarget, !0));return sb(this.currentTarget || this.__previousCurrentTarget, this.__relatedTargetComposedPath);
    }, stopPropagation: function () {
      Event.prototype.stopPropagation.call(this);this.S = !0;
    }, stopImmediatePropagation: function () {
      Event.prototype.stopImmediatePropagation.call(this);this.S = this.__immediatePropagationStopped = !0;
    } });
  function Ab(a) {
    a.__target = a.target;a.__relatedTarget = a.relatedTarget;if (t.j) {
      var b = Object.getPrototypeOf(a);if (!Object.hasOwnProperty(b, "__shady_patchedProto")) {
        var c = Object.create(b);c.__shady_sourceProto = b;x(c, Db);b.__shady_patchedProto = c;
      }a.__proto__ = b.__shady_patchedProto;
    } else x(a, Db);
  }var Eb = tb(Event),
      Fb = tb(CustomEvent),
      Gb = tb(MouseEvent);
  function Hb() {
    if (!kb && Object.getOwnPropertyDescriptor(Event.prototype, "isTrusted")) {
      var a = function () {
        var a = new MouseEvent("click", { bubbles: !0, cancelable: !0, composed: !0 });this.__shady_dispatchEvent(a);
      };Element.prototype.click ? Element.prototype.click = a : HTMLElement.prototype.click && (HTMLElement.prototype.click = a);
    }
  }var Ib = Object.getOwnPropertyNames(Document.prototype).filter(function (a) {
    return "on" === a.substring(0, 2);
  });function Jb(a, b) {
    return { index: a, H: [], K: b };
  }
  function Kb(a, b, c, d) {
    var e = 0,
        f = 0,
        g = 0,
        h = 0,
        k = Math.min(b - e, d - f);if (0 == e && 0 == f) a: {
      for (g = 0; g < k; g++) if (a[g] !== c[g]) break a;g = k;
    }if (b == a.length && d == c.length) {
      h = a.length;for (var l = c.length, m = 0; m < k - g && Lb(a[--h], c[--l]);) m++;h = m;
    }e += g;f += g;b -= h;d -= h;if (0 == b - e && 0 == d - f) return [];if (e == b) {
      for (b = Jb(e, 0); f < d;) b.H.push(c[f++]);return [b];
    }if (f == d) return [Jb(e, b - e)];k = e;g = f;d = d - g + 1;h = b - k + 1;b = Array(d);for (l = 0; l < d; l++) b[l] = Array(h), b[l][0] = l;for (l = 0; l < h; l++) b[0][l] = l;for (l = 1; l < d; l++) for (m = 1; m < h; m++) if (a[k + m - 1] === c[g + l - 1]) b[l][m] = b[l - 1][m - 1];else {
      var B = b[l - 1][m] + 1,
          ka = b[l][m - 1] + 1;b[l][m] = B < ka ? B : ka;
    }k = b.length - 1;g = b[0].length - 1;d = b[k][g];for (a = []; 0 < k || 0 < g;) 0 == k ? (a.push(2), g--) : 0 == g ? (a.push(3), k--) : (h = b[k - 1][g - 1], l = b[k - 1][g], m = b[k][g - 1], B = l < m ? l < h ? l : h : m < h ? m : h, B == h ? (h == d ? a.push(0) : (a.push(1), d = h), k--, g--) : B == l ? (a.push(3), k--, d = l) : (a.push(2), g--, d = m));a.reverse();b = void 0;k = [];for (g = 0; g < a.length; g++) switch (a[g]) {case 0:
        b && (k.push(b), b = void 0);e++;f++;break;case 1:
        b || (b = Jb(e, 0));b.K++;e++;b.H.push(c[f]);f++;break;case 2:
        b || (b = Jb(e, 0));b.K++;e++;break;case 3:
        b || (b = Jb(e, 0)), b.H.push(c[f]), f++;}b && k.push(b);return k;
  }function Lb(a, b) {
    return a === b;
    }
    function Mb(a, b, c, d) {
        hb(a);d = d || null;var e = q(a),
        f = d ? q(d) : null;e.previousSibling = d ? f.previousSibling : b.__shady_lastChild;if (f = r(e.previousSibling)) f.nextSibling = a;if (f = r(e.nextSibling = d)) f.previousSibling = a;e.parentNode = b;d ? d === c.firstChild && (c.firstChild = a) : (c.lastChild = a, c.firstChild || (c.firstChild = a));c.childNodes = null;
  }
  function Nb(a, b, c) {
    ib(b);var d = q(b);void 0 !== d.firstChild && (d.childNodes = null);if (a.nodeType === Node.DOCUMENT_FRAGMENT_NODE) for (a = a.__shady_native_firstChild; a; a = a.__shady_native_nextSibling) Mb(a, b, d, c);else Mb(a, b, d, c);
  }
  function Ob(a, b) {
    var c = q(a);b = q(b);a === b.firstChild && (b.firstChild = c.nextSibling);a === b.lastChild && (b.lastChild = c.previousSibling);a = c.previousSibling;var d = c.nextSibling;a && (q(a).nextSibling = d);d && (q(d).previousSibling = a);c.parentNode = c.previousSibling = c.nextSibling = void 0;void 0 !== b.childNodes && (b.childNodes = null);
  }
  function Pb(a, b) {
    var c = q(a);if (b || void 0 === c.firstChild) {
      c.childNodes = null;var d = c.firstChild = a.__shady_native_firstChild;c.lastChild = a.__shady_native_lastChild;ib(a);c = d;for (d = void 0; c; c = c.__shady_native_nextSibling) {
        var e = q(c);e.parentNode = b || a;e.nextSibling = c.__shady_native_nextSibling;e.previousSibling = d || null;d = c;hb(c);
      }
    }
  }
    var Qb = null;
    function D() {
        Qb || (Qb = window.ShadyCSS && window.ShadyCSS.ScopingShim);return Qb || null;
  }function Rb(a, b) {
    var c = D();c && c.unscopeNode(a, b);
  }function Sb(a, b) {
    var c = D();if (!c) return !0;if (a.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      c = !0;for (a = a.__shady_firstChild; a; a = a.__shady_nextSibling) c = c && Sb(a, b);return c;
    }return a.nodeType !== Node.ELEMENT_NODE ? !0 : c.currentScopeForNode(a) === b;
  }function Tb(a) {
    if (a.nodeType !== Node.ELEMENT_NODE) return "";var b = D();return b ? b.currentScopeForNode(a) : "";
  }
  function Ub(a, b) {
    if (a) for (a.nodeType === Node.ELEMENT_NODE && b(a), a = a.__shady_firstChild; a; a = a.__shady_nextSibling) a.nodeType === Node.ELEMENT_NODE && Ub(a, b);
  }
    var Vb = window.document,
        Wb = t.ba,
      Xb = Object.getOwnPropertyDescriptor(Node.prototype, "isConnected"),
      Yb = Xb && Xb.get;function Zb(a) {
    for (var b; b = a.__shady_firstChild;) a.__shady_removeChild(b);
  }function $b(a) {
    var b = r(a);if (b && void 0 !== b.N) for (b = a.__shady_firstChild; b; b = b.__shady_nextSibling) $b(b);if (a = r(a)) a.N = void 0;
  }function ac(a) {
    var b = a;a && "slot" === a.localName && (b = (b = (b = r(a)) && b.D) && b.length ? b[0] : ac(a.__shady_nextSibling));return b;
  }
  function bc(a, b, c) {
    if (a = (a = r(a)) && a.G) b && a.addedNodes.push(b), c && a.removedNodes.push(c), Fa(a);
  }
  var ec = y({ get parentNode() {
      var a = r(this);a = a && a.parentNode;return void 0 !== a ? a : this.__shady_native_parentNode;
    }, get firstChild() {
      var a = r(this);a = a && a.firstChild;return void 0 !== a ? a : this.__shady_native_firstChild;
    }, get lastChild() {
      var a = r(this);a = a && a.lastChild;return void 0 !== a ? a : this.__shady_native_lastChild;
    }, get nextSibling() {
      var a = r(this);a = a && a.nextSibling;return void 0 !== a ? a : this.__shady_native_nextSibling;
    }, get previousSibling() {
      var a = r(this);a = a && a.previousSibling;return void 0 !== a ? a : this.__shady_native_previousSibling;
    },
    get childNodes() {
      if (u(this)) {
        var a = r(this);if (!a.childNodes) {
          a.childNodes = [];for (var b = this.__shady_firstChild; b; b = b.__shady_nextSibling) a.childNodes.push(b);
        }var c = a.childNodes;
      } else c = this.__shady_native_childNodes;c.item = function (a) {
        return c[a];
      };return c;
    }, get parentElement() {
      var a = r(this);(a = a && a.parentNode) && a.nodeType !== Node.ELEMENT_NODE && (a = null);return void 0 !== a ? a : this.__shady_native_parentElement;
    }, get isConnected() {
      if (Yb && Yb.call(this)) return !0;if (this.nodeType == Node.DOCUMENT_FRAGMENT_NODE) return !1;
      var a = this.ownerDocument;if (va) {
        if (a.__shady_native_contains(this)) return !0;
      } else if (a.documentElement && a.documentElement.__shady_native_contains(this)) return !0;for (a = this; a && !(a instanceof Document);) a = a.__shady_parentNode || (v(a) ? a.host : void 0);return !!(a && a instanceof Document);
    }, get textContent() {
      if (u(this)) {
        for (var a = [], b = this.__shady_firstChild; b; b = b.__shady_nextSibling) b.nodeType !== Node.COMMENT_NODE && a.push(b.__shady_textContent);return a.join("");
      }return this.__shady_native_textContent;
    }, set textContent(a) {
      if ("undefined" === typeof a || null === a) a = "";switch (this.nodeType) {case Node.ELEMENT_NODE:case Node.DOCUMENT_FRAGMENT_NODE:
          if (!u(this) && t.j) {
            var b = this.__shady_firstChild;(b != this.__shady_lastChild || b && b.nodeType != Node.TEXT_NODE) && Zb(this);this.__shady_native_textContent = a;
          } else Zb(this), (0 < a.length || this.nodeType === Node.ELEMENT_NODE) && this.__shady_insertBefore(document.createTextNode(a));break;default:
          this.nodeValue = a;}
    }, insertBefore: function (a, b) {
      if (this.ownerDocument !== Vb && a.ownerDocument !== Vb) return this.__shady_native_insertBefore(a, b), a;if (a === this) throw Error("Failed to execute 'appendChild' on 'Node': The new child element contains the parent.");if (b) {
        var c = r(b);c = c && c.parentNode;if (void 0 !== c && c !== this || void 0 === c && b.__shady_native_parentNode !== this) throw Error("Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.");
      }if (b === a) return a;var d = [],
          e = (c = E(this)) ? c.host.localName : Tb(this),
          f = a.__shady_parentNode;if (f) {
        var g = Tb(a);var h = !!c || !E(a) || Wb && void 0 !== this.__noInsertionPoint;f.__shady_removeChild(a, h);
      }f = !0;var k = (!Wb || void 0 === a.__noInsertionPoint && void 0 === this.__noInsertionPoint) && !Sb(a, e),
          l = c && !a.__noInsertionPoint && (!Wb || a.nodeType === Node.DOCUMENT_FRAGMENT_NODE);if (l || k) k && (g = g || Tb(a)), Ub(a, function (a) {
        l && "slot" === a.localName && d.push(a);if (k) {
          var b = g;D() && (b && Rb(a, b), (b = D()) && b.scopeNode(a, e));
        }
      });d.length && (cc(c), c.c.push.apply(c.c, d instanceof Array ? d : ia(ha(d))), F(c));u(this) && (Nb(a, this, b), c = r(this), oa(this) ? (F(c.root), f = !1) : c.root && (f = !1));
      f ? (c = v(this) ? this.host : this, b ? (b = ac(b), c.__shady_native_insertBefore(a, b)) : c.__shady_native_appendChild(a)) : a.ownerDocument !== this.ownerDocument && this.ownerDocument.adoptNode(a);bc(this, a);return a;
    }, appendChild: function (a) {
      if (this != a || !v(a)) return this.__shady_insertBefore(a);
    }, removeChild: function (a, b) {
      b = void 0 === b ? !1 : b;if (this.ownerDocument !== Vb) return this.__shady_native_removeChild(a);if (a.__shady_parentNode !== this) throw Error("The node to be removed is not a child of this node: " + a);var c = E(a),
          d = c && dc(c, a),
          e = r(this);if (u(this) && (Ob(a, this), oa(this))) {
        F(e.root);var f = !0;
      }if (D() && !b && c && a.nodeType !== Node.TEXT_NODE) {
        var g = Tb(a);Ub(a, function (a) {
          Rb(a, g);
        });
      }$b(a);c && ((b = this && "slot" === this.localName) && (f = !0), (d || b) && F(c));f || (f = v(this) ? this.host : this, (!e.root && "slot" !== a.localName || f === a.__shady_native_parentNode) && f.__shady_native_removeChild(a));bc(this, null, a);return a;
    }, replaceChild: function (a, b) {
      this.__shady_insertBefore(a, b);this.__shady_removeChild(b);return a;
    }, cloneNode: function (a) {
      if ("template" == this.localName) return this.__shady_native_cloneNode(a);var b = this.__shady_native_cloneNode(!1);if (a && b.nodeType !== Node.ATTRIBUTE_NODE) {
        a = this.__shady_firstChild;for (var c; a; a = a.__shady_nextSibling) c = a.__shady_cloneNode(!0), b.__shady_appendChild(c);
      }return b;
    }, getRootNode: function (a) {
      if (this && this.nodeType) {
        var b = q(this),
            c = b.N;void 0 === c && (v(this) ? (c = this, b.N = c) : (c = (c = this.__shady_parentNode) ? c.__shady_getRootNode(a) : this, document.documentElement.__shady_native_contains(this) && (b.N = c)));return c;
      }
    }, contains: function (a) {
      return wa(this, a);
    } });function fc(a, b, c) {
    var d = [];gc(a, b, c, d);return d;
  }function gc(a, b, c, d) {
    for (a = a.__shady_firstChild; a; a = a.__shady_nextSibling) {
      var e;if (e = a.nodeType === Node.ELEMENT_NODE) {
        e = a;var f = b,
            g = c,
            h = d,
            k = f(e);k && h.push(e);g && g(k) ? e = k : (gc(e, f, g, h), e = void 0);
      }if (e) break;
    }
  }
  var G = y({ get firstElementChild() {
      var a = r(this);if (a && void 0 !== a.firstChild) {
        for (a = this.__shady_firstChild; a && a.nodeType !== Node.ELEMENT_NODE;) a = a.__shady_nextSibling;return a;
      }return this.__shady_native_firstElementChild;
    }, get lastElementChild() {
      var a = r(this);if (a && void 0 !== a.lastChild) {
        for (a = this.__shady_lastChild; a && a.nodeType !== Node.ELEMENT_NODE;) a = a.__shady_previousSibling;return a;
      }return this.__shady_native_lastElementChild;
    }, get children() {
      return u(this) ? xa(Array.prototype.filter.call(za(this), function (a) {
        return a.nodeType === Node.ELEMENT_NODE;
      })) : this.__shady_native_children;
    }, get childElementCount() {
      var a = this.__shady_children;return a ? a.length : 0;
    } }),
      hc = y({ querySelector: function (a) {
      return fc(this, function (b) {
        return qa.call(b, a);
      }, function (a) {
        return !!a;
      })[0] || null;
    }, querySelectorAll: function (a, b) {
      if (b) {
        b = Array.prototype.slice.call(this.__shady_native_querySelectorAll(a));var c = this.__shady_getRootNode();return b.filter(function (a) {
          return a.__shady_getRootNode() == c;
        });
      }return fc(this, function (b) {
        return qa.call(b, a);
      });
    } }),
      ic = t.ba && !t.v ? Object.assign({}, G) : G;Object.assign(G, hc);var jc = y({ getElementById: function (a) {
      return "" === a ? null : fc(this, function (b) {
        return b.id == a;
      }, function (a) {
        return !!a;
      })[0] || null;
    } });var kc = y({ get activeElement() {
      var a = t.j ? document.__shady_native_activeElement : document.activeElement;if (!a || !a.nodeType) return null;var b = !!v(this);if (!(this === document || b && this.host !== a && this.host.__shady_native_contains(a))) return null;for (b = E(a); b && b !== this;) a = b.host, b = E(a);return this === document ? b ? null : a : b === this ? a : null;
    } });var lc = document.implementation.createHTMLDocument("inert"),
      mc = y({ get innerHTML() {
      return u(this) ? Pa("template" === this.localName ? this.content : this, za) : this.__shady_native_innerHTML;
    }, set innerHTML(a) {
      if ("template" === this.localName) this.__shady_native_innerHTML = a;else {
        Zb(this);var b = this.localName || "div";b = this.namespaceURI && this.namespaceURI !== lc.namespaceURI ? lc.createElementNS(this.namespaceURI, b) : lc.createElement(b);for (t.j ? b.__shady_native_innerHTML = a : b.innerHTML = a; a = b.__shady_firstChild;) this.__shady_insertBefore(a);
      }
    } });var nc = y({ addEventListener: function (a, b, c) {
      "object" !== typeof c && (c = { capture: !!c });c.A = c.A || this;this.host.__shady_addEventListener(a, b, c);
    }, removeEventListener: function (a, b, c) {
      "object" !== typeof c && (c = { capture: !!c });c.A = c.A || this;this.host.__shady_removeEventListener(a, b, c);
    } });function oc(a, b) {
    x(a, nc, b);x(a, kc, b);x(a, mc, b);x(a, G, b);t.v && !b ? (x(a, ec, b), x(a, jc, b)) : t.j || (x(a, cb), x(a, ab), x(a, bb));
    }
    var pc = {},
        H = t.deferConnectionCallbacks && "loading" === document.readyState,
      qc;function rc(a) {
    var b = [];do b.unshift(a); while (a = a.__shady_parentNode);return b;
  }function sc(a, b, c) {
    if (a !== pc) throw new TypeError("Illegal constructor");this.a = null;tc(this, b, c);
  }
  function tc(a, b, c) {
    a.la = "ShadyRoot";a.host = b;a.mode = c && c.mode;Pb(a.host);b = q(a.host);b.root = a;b.xa = "closed" !== a.mode ? a : null;b = q(a);b.firstChild = b.lastChild = b.parentNode = b.nextSibling = b.previousSibling = null;if (t.preferPerformance) for (; b = a.host.__shady_native_firstChild;) a.host.__shady_native_removeChild(b);else F(a);
  }function F(a) {
    a.C || (a.C = !0, Ca(function () {
      return uc(a);
    }));
  }
  function uc(a) {
    var b;if (b = a.C) {
      for (var c; a;) a: {
        a.C && (c = a), b = a;a = b.host.__shady_getRootNode();if (v(a) && (b = r(b.host)) && 0 < b.J) break a;a = void 0;
      }b = c;
    }(c = b) && c._renderSelf();
  }
  sc.prototype._renderSelf = function () {
    var a = H;H = !0;this.C = !1;if (this.a) {
      vc(this);for (var b = 0, c; b < this.a.length; b++) {
        c = this.a[b];var d = r(c),
            e = d.assignedNodes;d.assignedNodes = [];d.D = [];if (d.Z = e) for (d = 0; d < e.length; d++) {
          var f = r(e[d]);f.T = f.assignedSlot;f.assignedSlot === c && (f.assignedSlot = null);
        }
      }for (b = this.host.__shady_firstChild; b; b = b.__shady_nextSibling) wc(this, b);for (b = 0; b < this.a.length; b++) {
        c = this.a[b];e = r(c);if (!e.assignedNodes.length) for (d = c.__shady_firstChild; d; d = d.__shady_nextSibling) wc(this, d, c);
        (d = (d = r(c.__shady_parentNode)) && d.root) && (pa(d) || d.C) && d._renderSelf();xc(this, e.D, e.assignedNodes);if (d = e.Z) {
          for (f = 0; f < d.length; f++) r(d[f]).T = null;e.Z = null;d.length > e.assignedNodes.length && (e.U = !0);
        }e.U && (e.U = !1, yc(this, c));
      }c = this.a;b = [];for (e = 0; e < c.length; e++) d = c[e].__shady_parentNode, (f = r(d)) && f.root || !(0 > b.indexOf(d)) || b.push(d);for (c = 0; c < b.length; c++) {
        f = b[c];e = f === this ? this.host : f;d = [];for (f = f.__shady_firstChild; f; f = f.__shady_nextSibling) if ("slot" == f.localName) for (var g = r(f).D, h = 0; h < g.length; h++) d.push(g[h]);else d.push(f);f = ya(e);g = Kb(d, d.length, f, f.length);for (var k = h = 0, l = void 0; h < g.length && (l = g[h]); h++) {
          for (var m = 0, B = void 0; m < l.H.length && (B = l.H[m]); m++) B.__shady_native_parentNode === e && e.__shady_native_removeChild(B), f.splice(l.index + k, 1);k -= l.K;
        }k = 0;for (l = void 0; k < g.length && (l = g[k]); k++) for (h = f[l.index], m = l.index; m < l.index + l.K; m++) B = d[m], e.__shady_native_insertBefore(B, h), f.splice(m, 0, B);
      }
    }if (!t.preferPerformance && !this.Y) for (b = this.host.__shady_firstChild; b; b = b.__shady_nextSibling) c = r(b), b.__shady_native_parentNode !== this.host || "slot" !== b.localName && c.assignedSlot || this.host.__shady_native_removeChild(b);this.Y = !0;H = a;qc && qc();
  };function wc(a, b, c) {
    var d = q(b),
        e = d.T;d.T = null;c || (c = (a = a.b[b.__shady_slot || "__catchall"]) && a[0]);c ? (q(c).assignedNodes.push(b), d.assignedSlot = c) : d.assignedSlot = void 0;e !== d.assignedSlot && d.assignedSlot && (q(d.assignedSlot).U = !0);
  }function xc(a, b, c) {
    for (var d = 0, e = void 0; d < c.length && (e = c[d]); d++) if ("slot" == e.localName) {
      var f = r(e).assignedNodes;f && f.length && xc(a, b, f);
    } else b.push(c[d]);
  }
  function yc(a, b) {
    b.__shady_native_dispatchEvent(new Event("slotchange"));b = r(b);b.assignedSlot && yc(a, b.assignedSlot);
  }function cc(a) {
    a.c = a.c || [];a.a = a.a || [];a.b = a.b || {};
  }function vc(a) {
    if (a.c && a.c.length) {
      for (var b = a.c, c, d = 0; d < b.length; d++) {
        var e = b[d];Pb(e);var f = e.__shady_parentNode;Pb(f);f = r(f);f.J = (f.J || 0) + 1;f = zc(e);a.b[f] ? (c = c || {}, c[f] = !0, a.b[f].push(e)) : a.b[f] = [e];a.a.push(e);
      }if (c) for (var g in c) a.b[g] = Ac(a.b[g]);a.c = [];
    }
  }
  function zc(a) {
    var b = a.name || a.getAttribute("name") || "__catchall";return a.ja = b;
  }function Ac(a) {
    return a.sort(function (a, c) {
      a = rc(a);for (var b = rc(c), e = 0; e < a.length; e++) {
        c = a[e];var f = b[e];if (c !== f) return a = za(c.__shady_parentNode), a.indexOf(c) - a.indexOf(f);
      }
    });
  }
  function dc(a, b) {
    if (a.a) {
      vc(a);var c = a.b,
          d;for (d in c) for (var e = c[d], f = 0; f < e.length; f++) {
        var g = e[f];if (wa(b, g)) {
          e.splice(f, 1);var h = a.a.indexOf(g);0 <= h && (a.a.splice(h, 1), (h = r(g.__shady_parentNode)) && h.J && h.J--);f--;g = r(g);if (h = g.D) for (var k = 0; k < h.length; k++) {
            var l = h[k],
                m = l.__shady_native_parentNode;m && m.__shady_native_removeChild(l);
          }g.D = [];g.assignedNodes = [];h = !0;
        }
      }return h;
    }
  }function pa(a) {
    vc(a);return !(!a.a || !a.a.length);
  }
  (function (a) {
    a.__proto__ = DocumentFragment.prototype;oc(a, "__shady_");oc(a);Object.defineProperties(a, { nodeType: { value: Node.DOCUMENT_FRAGMENT_NODE, configurable: !0 }, nodeName: { value: "#document-fragment", configurable: !0 }, nodeValue: { value: null, configurable: !0 } });["localName", "namespaceURI", "prefix"].forEach(function (b) {
      Object.defineProperty(a, b, { value: void 0, configurable: !0 });
    });["ownerDocument", "baseURI", "isConnected"].forEach(function (b) {
      Object.defineProperty(a, b, { get: function () {
          return this.host[b];
        },
        configurable: !0 });
    });
  })(sc.prototype);
  if (window.customElements && t.V && !t.preferPerformance) {
    var Bc = new Map();qc = function () {
      var a = [];Bc.forEach(function (b, c) {
        a.push([c, b]);
      });Bc.clear();for (var b = 0; b < a.length; b++) {
        var c = a[b][0];a[b][1] ? c.__shadydom_connectedCallback() : c.__shadydom_disconnectedCallback();
      }
    };H && document.addEventListener("readystatechange", function () {
      H = !1;qc();
    }, { once: !0 });var Cc = function (a, b, c) {
      var d = 0,
          e = "__isConnected" + d++;if (b || c) a.prototype.connectedCallback = a.prototype.__shadydom_connectedCallback = function () {
        H ? Bc.set(this, !0) : this[e] || (this[e] = !0, b && b.call(this));
      }, a.prototype.disconnectedCallback = a.prototype.__shadydom_disconnectedCallback = function () {
        H ? this.isConnected || Bc.set(this, !1) : this[e] && (this[e] = !1, c && c.call(this));
      };return a;
    },
        Dc = window.customElements.define,
        define = function (a, b) {
      var c = b.prototype.connectedCallback,
          d = b.prototype.disconnectedCallback;Dc.call(window.customElements, a, Cc(b, c, d));b.prototype.connectedCallback = c;b.prototype.disconnectedCallback = d;
    };window.customElements.define = define;Object.defineProperty(window.CustomElementRegistry.prototype, "define", { value: define, configurable: !0 });
  }function E(a) {
    a = a.__shady_getRootNode();if (v(a)) return a;
    }
    function I(a) {
        this.node = a;
  }n = I.prototype;n.addEventListener = function (a, b, c) {
    return this.node.__shady_addEventListener(a, b, c);
  };n.removeEventListener = function (a, b, c) {
    return this.node.__shady_removeEventListener(a, b, c);
  };n.appendChild = function (a) {
    return this.node.__shady_appendChild(a);
  };n.insertBefore = function (a, b) {
    return this.node.__shady_insertBefore(a, b);
  };n.removeChild = function (a) {
    return this.node.__shady_removeChild(a);
  };n.replaceChild = function (a, b) {
    return this.node.__shady_replaceChild(a, b);
  };
  n.cloneNode = function (a) {
    return this.node.__shady_cloneNode(a);
  };n.getRootNode = function (a) {
    return this.node.__shady_getRootNode(a);
  };n.contains = function (a) {
    return this.node.__shady_contains(a);
  };n.dispatchEvent = function (a) {
    return this.node.__shady_dispatchEvent(a);
  };n.setAttribute = function (a, b) {
    this.node.__shady_setAttribute(a, b);
  };n.getAttribute = function (a) {
    return this.node.__shady_native_getAttribute(a);
  };n.removeAttribute = function (a) {
    this.node.__shady_removeAttribute(a);
  };n.attachShadow = function (a) {
    return this.node.__shady_attachShadow(a);
  };
  n.focus = function () {
    this.node.__shady_native_focus();
  };n.blur = function () {
    this.node.__shady_blur();
  };n.importNode = function (a, b) {
    if (this.node.nodeType === Node.DOCUMENT_NODE) return this.node.__shady_importNode(a, b);
  };n.getElementById = function (a) {
    if (this.node.nodeType === Node.DOCUMENT_NODE) return this.node.__shady_getElementById(a);
  };n.querySelector = function (a) {
    return this.node.__shady_querySelector(a);
  };n.querySelectorAll = function (a, b) {
    return this.node.__shady_querySelectorAll(a, b);
  };
  n.assignedNodes = function (a) {
    if ("slot" === this.node.localName) return this.node.__shady_assignedNodes(a);
  };
  p.Object.defineProperties(I.prototype, { activeElement: { configurable: !0, enumerable: !0, get: function () {
        if (v(this.node) || this.node.nodeType === Node.DOCUMENT_NODE) return this.node.__shady_activeElement;
      } }, _activeElement: { configurable: !0, enumerable: !0, get: function () {
        return this.activeElement;
      } }, host: { configurable: !0, enumerable: !0, get: function () {
        if (v(this.node)) return this.node.host;
      } }, parentNode: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_parentNode;
      } }, firstChild: { configurable: !0, enumerable: !0,
      get: function () {
        return this.node.__shady_firstChild;
      } }, lastChild: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_lastChild;
      } }, nextSibling: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_nextSibling;
      } }, previousSibling: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_previousSibling;
      } }, childNodes: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_childNodes;
      } }, parentElement: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_parentElement;
      } },
    firstElementChild: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_firstElementChild;
      } }, lastElementChild: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_lastElementChild;
      } }, nextElementSibling: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_nextElementSibling;
      } }, previousElementSibling: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_previousElementSibling;
      } }, children: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_children;
      } },
    childElementCount: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_childElementCount;
      } }, shadowRoot: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_shadowRoot;
      } }, assignedSlot: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_assignedSlot;
      } }, isConnected: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_isConnected;
      } }, innerHTML: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_innerHTML;
      }, set: function (a) {
        this.node.__shady_innerHTML = a;
      } }, textContent: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_textContent;
      }, set: function (a) {
        this.node.__shady_textContent = a;
      } }, slot: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_slot;
      }, set: function (a) {
        this.node.__shady_slot = a;
      } }, className: { configurable: !0, enumerable: !0, get: function () {
        return this.node.__shady_className;
      }, set: function (a) {
        return this.node.__shady_className = a;
      } } });
  Ib.forEach(function (a) {
    Object.defineProperty(I.prototype, a, { get: function () {
        return this.node["__shady_" + a];
      }, set: function (b) {
        this.node["__shady_" + a] = b;
      }, configurable: !0 });
  });var Ec = new WeakMap();function Fc(a) {
    if (v(a) || a instanceof I) return a;var b = Ec.get(a);b || (b = new I(a), Ec.set(a, b));return b;
    }
    var Gc = y({
        dispatchEvent: function (a) {
            Da();return this.__shady_native_dispatchEvent(a);
    }, addEventListener: zb, removeEventListener: Bb });var Hc = y({ get assignedSlot() {
      var a = this.__shady_parentNode;(a = a && a.__shady_shadowRoot) && uc(a);return (a = r(this)) && a.assignedSlot || null;
    } });var Ic = window.document;function Jc(a, b) {
    if ("slot" === b) a = a.__shady_parentNode, oa(a) && F(r(a).root);else if ("slot" === a.localName && "name" === b && (b = E(a))) {
      if (b.a) {
        vc(b);var c = a.ja,
            d = zc(a);if (d !== c) {
          c = b.b[c];var e = c.indexOf(a);0 <= e && c.splice(e, 1);c = b.b[d] || (b.b[d] = []);c.push(a);1 < c.length && (b.b[d] = Ac(c));
        }
      }F(b);
    }
  }
  var Kc = y({ get previousElementSibling() {
      var a = r(this);if (a && void 0 !== a.previousSibling) {
        for (a = this.__shady_previousSibling; a && a.nodeType !== Node.ELEMENT_NODE;) a = a.__shady_previousSibling;return a;
      }return this.__shady_native_previousElementSibling;
    }, get nextElementSibling() {
      var a = r(this);if (a && void 0 !== a.nextSibling) {
        for (a = this.__shady_nextSibling; a && a.nodeType !== Node.ELEMENT_NODE;) a = a.__shady_nextSibling;return a;
      }return this.__shady_native_nextElementSibling;
    }, get slot() {
      return this.getAttribute("slot");
    },
    set slot(a) {
      this.__shady_setAttribute("slot", a);
    }, get shadowRoot() {
      var a = r(this);return a && a.xa || null;
    }, get className() {
      return this.getAttribute("class") || "";
    }, set className(a) {
      this.__shady_setAttribute("class", a);
    }, setAttribute: function (a, b) {
      if (this.ownerDocument !== Ic) this.__shady_native_setAttribute(a, b);else {
        var c;(c = D()) && "class" === a ? (c.setElementClass(this, b), c = !0) : c = !1;c || (this.__shady_native_setAttribute(a, b), Jc(this, a));
      }
    }, removeAttribute: function (a) {
      this.__shady_native_removeAttribute(a);Jc(this, a);
    }, attachShadow: function (a) {
      if (!this) throw Error("Must provide a host.");if (!a) throw Error("Not enough arguments.");if (a.shadyUpgradeFragment && !t.ga) {
        var b = a.shadyUpgradeFragment;b.__proto__ = ShadowRoot.prototype;tc(b, this, a);Pb(b, b);a = b.__noInsertionPoint ? null : b.querySelectorAll("slot");b.__noInsertionPoint = void 0;if (a && a.length) {
          var c = b;cc(c);c.c.push.apply(c.c, a instanceof Array ? a : ia(ha(a)));F(b);
        }b.host.__shady_native_appendChild(b);
      } else b = new sc(pc, this, a);return b;
    } });var Lc = y({ blur: function () {
      var a = r(this);(a = (a = a && a.root) && a.activeElement) ? a.__shady_blur() : this.__shady_native_blur();
    } });Ib.forEach(function (a) {
    Lc[a] = { set: function (b) {
        var c = q(this),
            d = a.substring(2);c.w || (c.w = {});c.w[a] && this.removeEventListener(d, c.w[a]);this.__shady_addEventListener(d, b);c.w[a] = b;
      }, get: function () {
        var b = r(this);return b && b.w && b.w[a];
      }, configurable: !0 };
  });var Mc = y({ assignedNodes: function (a) {
      if ("slot" === this.localName) {
        var b = this.__shady_getRootNode();b && v(b) && uc(b);return (b = r(this)) ? (a && a.flatten ? b.D : b.assignedNodes) || [] : [];
      }
    }, addEventListener: function (a, b, c) {
      if ("slot" !== this.localName || "slotchange" === a) zb.call(this, a, b, c);else {
        "object" !== typeof c && (c = { capture: !!c });var d = this.__shady_parentNode;if (!d) throw Error("ShadyDOM cannot attach event to slot unless it has a `parentNode`");c.A = this;d.__shady_addEventListener(a, b, c);
      }
    }, removeEventListener: function (a, b, c) {
      if ("slot" !== this.localName || "slotchange" === a) Bb.call(this, a, b, c);else {
        "object" !== typeof c && (c = { capture: !!c });var d = this.__shady_parentNode;if (!d) throw Error("ShadyDOM cannot attach event to slot unless it has a `parentNode`");c.A = this;d.__shady_removeEventListener(a, b, c);
      }
    } });var Nc = window.document,
      Oc = y({ importNode: function (a, b) {
      if (a.ownerDocument !== Nc || "template" === a.localName) return this.__shady_native_importNode(a, b);var c = this.__shady_native_importNode(a, !1);if (b) for (a = a.__shady_firstChild; a; a = a.__shady_nextSibling) b = this.__shady_importNode(a, !0), c.__shady_appendChild(b);return c;
    } });var Pc = y({ addEventListener: zb.bind(window), removeEventListener: Bb.bind(window) });var J = {};Object.getOwnPropertyDescriptor(HTMLElement.prototype, "parentElement") && (J.parentElement = ec.parentElement);Object.getOwnPropertyDescriptor(HTMLElement.prototype, "contains") && (J.contains = ec.contains);Object.getOwnPropertyDescriptor(HTMLElement.prototype, "children") && (J.children = G.children);Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHTML") && (J.innerHTML = mc.innerHTML);Object.getOwnPropertyDescriptor(HTMLElement.prototype, "className") && (J.className = Kc.className);
  var Qc = { EventTarget: [Gc], Node: [ec, window.EventTarget ? null : Gc], Text: [Hc], Element: [Kc, G, Hc, !t.j || "innerHTML" in Element.prototype ? mc : null, window.HTMLSlotElement ? null : Mc], HTMLElement: [Lc, J], HTMLSlotElement: [Mc], DocumentFragment: [ic, jc], Document: [Oc, ic, jc, kc], Window: [Pc] },
      Rc = t.j ? null : ["innerHTML", "textContent"];function Sc(a) {
    var b = a ? null : Rc,
        c = {},
        d;for (d in Qc) c.P = window[d] && window[d].prototype, Qc[d].forEach(function (c) {
      return function (d) {
        return c.P && d && x(c.P, d, a, b);
      };
    }(c)), c = { P: c.P };
    }
    if (t.V) {
        var ShadyDOM = { inUse: t.V, patch: function (a) {
        ib(a);hb(a);return a;
      }, isShadyRoot: v, enqueue: Ca, flush: Da, flushInitial: function (a) {
        !a.Y && a.C && uc(a);
      }, settings: t, filterMutations: Ia, observeChildren: Ga, unobserveChildren: Ha, deferConnectionCallbacks: t.deferConnectionCallbacks, preferPerformance: t.preferPerformance, handlesDynamicScoping: !0, wrap: t.v ? Fc : function (a) {
        return a;
      }, Wrapper: I, composedPath: rb, noPatch: t.v, nativeMethods: Ra, nativeTree: Sa };window.ShadyDOM = ShadyDOM;$a();Sc("__shady_");Object.defineProperty(document, "_activeElement", kc.activeElement);x(Window.prototype, Pc, "__shady_");t.v || (Sc(), Hb());Cb();window.Event = Eb;window.CustomEvent = Fb;window.MouseEvent = Gb;window.ShadowRoot = sc;
    } /*
     Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
     This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
     The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
     The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
     Code distributed by Google as part of the polymer project is also
     subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
     */
  var Tc = new Set("annotation-xml color-profile font-face font-face-src font-face-uri font-face-format font-face-name missing-glyph".split(" "));function Uc(a) {
    var b = Tc.has(a);a = /^[a-z][.0-9_a-z]*-[\-.0-9_a-z]*$/.test(a);return !b && a;
  }function K(a) {
    var b = a.isConnected;if (void 0 !== b) return b;for (; a && !(a.__CE_isImportDocument || a instanceof Document);) a = a.parentNode || (window.ShadowRoot && a instanceof ShadowRoot ? a.host : void 0);return !(!a || !(a.__CE_isImportDocument || a instanceof Document));
  }
  function Vc(a, b) {
    for (; b && b !== a && !b.nextSibling;) b = b.parentNode;return b && b !== a ? b.nextSibling : null;
  }
  function L(a, b, c) {
    c = void 0 === c ? new Set() : c;for (var d = a; d;) {
      if (d.nodeType === Node.ELEMENT_NODE) {
        var e = d;b(e);var f = e.localName;if ("link" === f && "import" === e.getAttribute("rel")) {
          d = e.import;if (d instanceof Node && !c.has(d)) for (c.add(d), d = d.firstChild; d; d = d.nextSibling) L(d, b, c);d = Vc(a, e);continue;
        } else if ("template" === f) {
          d = Vc(a, e);continue;
        }if (e = e.__CE_shadowRoot) for (e = e.firstChild; e; e = e.nextSibling) L(e, b, c);
      }d = d.firstChild ? d.firstChild : Vc(a, d);
    }
  }function M(a, b, c) {
    a[b] = c;
    }
    function Wc() {
        this.a = new Map();this.i = new Map();this.c = [];this.f = [];this.b = !1;
  }function Xc(a, b, c) {
    a.a.set(b, c);a.i.set(c.constructorFunction, c);
  }function Yc(a, b) {
    a.b = !0;a.c.push(b);
  }function Zc(a, b) {
    a.b = !0;a.f.push(b);
  }function $c(a, b) {
    a.b && L(b, function (b) {
      return ad(a, b);
    });
  }function ad(a, b) {
    if (a.b && !b.__CE_patched) {
      b.__CE_patched = !0;for (var c = 0; c < a.c.length; c++) a.c[c](b);for (c = 0; c < a.f.length; c++) a.f[c](b);
    }
  }
  function N(a, b) {
    var c = [];L(b, function (a) {
      return c.push(a);
    });for (b = 0; b < c.length; b++) {
      var d = c[b];1 === d.__CE_state ? a.connectedCallback(d) : bd(a, d);
    }
  }function O(a, b) {
    var c = [];L(b, function (a) {
      return c.push(a);
    });for (b = 0; b < c.length; b++) {
      var d = c[b];1 === d.__CE_state && a.disconnectedCallback(d);
    }
  }
  function P(a, b, c) {
    c = void 0 === c ? {} : c;var d = c.Ea || new Set(),
        e = c.R || function (b) {
      return bd(a, b);
    },
        f = [];L(b, function (b) {
      if ("link" === b.localName && "import" === b.getAttribute("rel")) {
        var c = b.import;c instanceof Node && (c.__CE_isImportDocument = !0, c.__CE_hasRegistry = !0);c && "complete" === c.readyState ? c.__CE_documentLoadHandled = !0 : b.addEventListener("load", function () {
          var c = b.import;if (!c.__CE_documentLoadHandled) {
            c.__CE_documentLoadHandled = !0;var f = new Set(d);f.delete(c);P(a, c, { Ea: f, R: e });
          }
        });
      } else f.push(b);
    }, d);if (a.b) for (b = 0; b < f.length; b++) ad(a, f[b]);for (b = 0; b < f.length; b++) e(f[b]);
  }
  function bd(a, b) {
    if (void 0 === b.__CE_state) {
      var c = b.ownerDocument;if (c.defaultView || c.__CE_isImportDocument && c.__CE_hasRegistry) if (c = a.a.get(b.localName)) {
        c.constructionStack.push(b);var d = c.constructorFunction;try {
          try {
            if (new d() !== b) throw Error("The custom element constructor did not produce the element being upgraded.");
          } finally {
            c.constructionStack.pop();
          }
        } catch (g) {
          throw b.__CE_state = 2, g;
        }b.__CE_state = 1;b.__CE_definition = c;if (c.attributeChangedCallback) for (c = c.observedAttributes, d = 0; d < c.length; d++) {
          var e = c[d],
              f = b.getAttribute(e);null !== f && a.attributeChangedCallback(b, e, null, f, null);
        }K(b) && a.connectedCallback(b);
      }
    }
  }Wc.prototype.connectedCallback = function (a) {
    var b = a.__CE_definition;b.connectedCallback && b.connectedCallback.call(a);
  };Wc.prototype.disconnectedCallback = function (a) {
    var b = a.__CE_definition;b.disconnectedCallback && b.disconnectedCallback.call(a);
  };
  Wc.prototype.attributeChangedCallback = function (a, b, c, d, e) {
    var f = a.__CE_definition;f.attributeChangedCallback && -1 < f.observedAttributes.indexOf(b) && f.attributeChangedCallback.call(a, b, c, d, e);
  };function cd(a) {
    var b = document;this.b = a;this.a = b;this.B = void 0;P(this.b, this.a);"loading" === this.a.readyState && (this.B = new MutationObserver(this.c.bind(this)), this.B.observe(this.a, { childList: !0, subtree: !0 }));
  }function dd(a) {
    a.B && a.B.disconnect();
  }cd.prototype.c = function (a) {
    var b = this.a.readyState;"interactive" !== b && "complete" !== b || dd(this);for (b = 0; b < a.length; b++) for (var c = a[b].addedNodes, d = 0; d < c.length; d++) P(this.b, c[d]);
  };function ed() {
    var a = this;this.b = this.a = void 0;this.c = new Promise(function (b) {
      a.b = b;a.a && b(a.a);
    });
  }function fd(a) {
    if (a.a) throw Error("Already resolved.");a.a = void 0;a.b && a.b(void 0);
    }
    function Q(a) {
        this.c = !1;this.a = a;this.F = new Map();this.f = function (a) {
      return a();
    };this.b = !1;this.i = [];this.ta = new cd(a);
  }n = Q.prototype;
  n.ea = function (a, b) {
    var c = this;if (!(b instanceof Function)) throw new TypeError("Custom element constructors must be functions.");if (!Uc(a)) throw new SyntaxError("The element name '" + a + "' is not valid.");if (this.a.a.get(a)) throw Error("A custom element with name '" + a + "' has already been defined.");if (this.c) throw Error("A custom element is already being defined.");this.c = !0;try {
      var d = function (a) {
        var b = e[a];if (void 0 !== b && !(b instanceof Function)) throw Error("The '" + a + "' callback must be a function.");
        return b;
      },
          e = b.prototype;if (!(e instanceof Object)) throw new TypeError("The custom element constructor's prototype is not an object.");var f = d("connectedCallback");var g = d("disconnectedCallback");var h = d("adoptedCallback");var k = d("attributeChangedCallback");var l = b.observedAttributes || [];
    } catch (m) {
      return;
    } finally {
      this.c = !1;
    }b = { localName: a, constructorFunction: b, connectedCallback: f, disconnectedCallback: g, adoptedCallback: h, attributeChangedCallback: k, observedAttributes: l, constructionStack: [] };Xc(this.a, a, b);this.i.push(b);this.b || (this.b = !0, this.f(function () {
      return gd(c);
    }));
  };n.R = function (a) {
    P(this.a, a);
  };
  function gd(a) {
    if (!1 !== a.b) {
      a.b = !1;for (var b = a.i, c = [], d = new Map(), e = 0; e < b.length; e++) d.set(b[e].localName, []);P(a.a, document, { R: function (b) {
          if (void 0 === b.__CE_state) {
            var e = b.localName,
                f = d.get(e);f ? f.push(b) : a.a.a.get(e) && c.push(b);
          }
        } });for (e = 0; e < c.length; e++) bd(a.a, c[e]);for (; 0 < b.length;) {
        var f = b.shift();e = f.localName;f = d.get(f.localName);for (var g = 0; g < f.length; g++) bd(a.a, f[g]);(e = a.F.get(e)) && fd(e);
      }
    }
  }n.get = function (a) {
    if (a = this.a.a.get(a)) return a.constructorFunction;
  };
  n.fa = function (a) {
    if (!Uc(a)) return Promise.reject(new SyntaxError("'" + a + "' is not a valid custom element name."));var b = this.F.get(a);if (b) return b.c;b = new ed();this.F.set(a, b);this.a.a.get(a) && !this.i.some(function (b) {
      return b.localName === a;
    }) && fd(b);return b.c;
  };n.va = function (a) {
    dd(this.ta);var b = this.f;this.f = function (c) {
      return a(function () {
        return b(c);
      });
    };
  };window.CustomElementRegistry = Q;Q.prototype.define = Q.prototype.ea;Q.prototype.upgrade = Q.prototype.R;Q.prototype.get = Q.prototype.get;
  Q.prototype.whenDefined = Q.prototype.fa;Q.prototype.polyfillWrapFlushCallback = Q.prototype.va;var hd = window.Document.prototype.createElement,
      id = window.Document.prototype.createElementNS,
      jd = window.Document.prototype.importNode,
      kd = window.Document.prototype.prepend,
      ld = window.Document.prototype.append,
      md = window.DocumentFragment.prototype.prepend,
      nd = window.DocumentFragment.prototype.append,
      od = window.Node.prototype.cloneNode,
      pd = window.Node.prototype.appendChild,
      qd = window.Node.prototype.insertBefore,
      rd = window.Node.prototype.removeChild,
      sd = window.Node.prototype.replaceChild,
      td = Object.getOwnPropertyDescriptor(window.Node.prototype, "textContent"),
      ud = window.Element.prototype.attachShadow,
      vd = Object.getOwnPropertyDescriptor(window.Element.prototype, "innerHTML"),
      wd = window.Element.prototype.getAttribute,
      xd = window.Element.prototype.setAttribute,
      yd = window.Element.prototype.removeAttribute,
      zd = window.Element.prototype.getAttributeNS,
      Ad = window.Element.prototype.setAttributeNS,
      Bd = window.Element.prototype.removeAttributeNS,
      Cd = window.Element.prototype.insertAdjacentElement,
      Dd = window.Element.prototype.insertAdjacentHTML,
      Ed = window.Element.prototype.prepend,
      Fd = window.Element.prototype.append,
      Gd = window.Element.prototype.before,
      Hd = window.Element.prototype.after,
      Id = window.Element.prototype.replaceWith,
      Jd = window.Element.prototype.remove,
      Kd = window.HTMLElement,
      Ld = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, "innerHTML"),
      Md = window.HTMLElement.prototype.insertAdjacentElement,
      Nd = window.HTMLElement.prototype.insertAdjacentHTML;var Od = new function () {}();function Pd() {
    var a = Qd;window.HTMLElement = function () {
      function b() {
        var b = this.constructor,
            d = a.i.get(b);if (!d) throw Error("The custom element being constructed was not registered with `customElements`.");var e = d.constructionStack;if (0 === e.length) return e = hd.call(document, d.localName), Object.setPrototypeOf(e, b.prototype), e.__CE_state = 1, e.__CE_definition = d, ad(a, e), e;d = e.length - 1;var f = e[d];if (f === Od) throw Error("The HTMLElement constructor was either called reentrantly for this constructor or called multiple times.");
        e[d] = Od;Object.setPrototypeOf(f, b.prototype);ad(a, f);return f;
      }b.prototype = Kd.prototype;Object.defineProperty(b.prototype, "constructor", { writable: !0, configurable: !0, enumerable: !1, value: b });return b;
    }();
    }
    function Rd(a, b, c) {
        function d(b) {
      return function (c) {
        for (var d = [], e = 0; e < arguments.length; ++e) d[e] = arguments[e];e = [];for (var f = [], l = 0; l < d.length; l++) {
          var m = d[l];m instanceof Element && K(m) && f.push(m);if (m instanceof DocumentFragment) for (m = m.firstChild; m; m = m.nextSibling) e.push(m);else e.push(m);
        }b.apply(this, d);for (d = 0; d < f.length; d++) O(a, f[d]);if (K(this)) for (d = 0; d < e.length; d++) f = e[d], f instanceof Element && N(a, f);
      };
    }void 0 !== c.O && (b.prepend = d(c.O));void 0 !== c.append && (b.append = d(c.append));
    }
    function Sd() {
        var a = Qd;M(Document.prototype, "createElement", function (b) {
      if (this.__CE_hasRegistry) {
        var c = a.a.get(b);if (c) return new c.constructorFunction();
      }b = hd.call(this, b);ad(a, b);return b;
    });M(Document.prototype, "importNode", function (b, c) {
      b = jd.call(this, b, !!c);this.__CE_hasRegistry ? P(a, b) : $c(a, b);return b;
    });M(Document.prototype, "createElementNS", function (b, c) {
      if (this.__CE_hasRegistry && (null === b || "http://www.w3.org/1999/xhtml" === b)) {
        var d = a.a.get(c);if (d) return new d.constructorFunction();
      }b = id.call(this, b, c);ad(a, b);return b;
    });Rd(a, Document.prototype, { O: kd, append: ld });
    }
    function Td() {
        function a(a, d) {
      Object.defineProperty(a, "textContent", { enumerable: d.enumerable, configurable: !0, get: d.get, set: function (a) {
          if (this.nodeType === Node.TEXT_NODE) d.set.call(this, a);else {
            var c = void 0;if (this.firstChild) {
              var e = this.childNodes,
                  h = e.length;if (0 < h && K(this)) {
                c = Array(h);for (var k = 0; k < h; k++) c[k] = e[k];
              }
            }d.set.call(this, a);if (c) for (a = 0; a < c.length; a++) O(b, c[a]);
          }
        } });
    }var b = Qd;M(Node.prototype, "insertBefore", function (a, d) {
      if (a instanceof DocumentFragment) {
        var c = Array.prototype.slice.apply(a.childNodes);
        a = qd.call(this, a, d);if (K(this)) for (d = 0; d < c.length; d++) N(b, c[d]);return a;
      }c = K(a);d = qd.call(this, a, d);c && O(b, a);K(this) && N(b, a);return d;
    });M(Node.prototype, "appendChild", function (a) {
      if (a instanceof DocumentFragment) {
        var c = Array.prototype.slice.apply(a.childNodes);a = pd.call(this, a);if (K(this)) for (var e = 0; e < c.length; e++) N(b, c[e]);return a;
      }c = K(a);e = pd.call(this, a);c && O(b, a);K(this) && N(b, a);return e;
    });M(Node.prototype, "cloneNode", function (a) {
      a = od.call(this, !!a);this.ownerDocument.__CE_hasRegistry ? P(b, a) : $c(b, a);return a;
    });M(Node.prototype, "removeChild", function (a) {
      var c = K(a),
          e = rd.call(this, a);c && O(b, a);return e;
    });M(Node.prototype, "replaceChild", function (a, d) {
      if (a instanceof DocumentFragment) {
        var c = Array.prototype.slice.apply(a.childNodes);a = sd.call(this, a, d);if (K(this)) for (O(b, d), d = 0; d < c.length; d++) N(b, c[d]);return a;
      }c = K(a);var f = sd.call(this, a, d),
          g = K(this);g && O(b, d);c && O(b, a);g && N(b, a);return f;
    });td && td.get ? a(Node.prototype, td) : Yc(b, function (b) {
      a(b, { enumerable: !0, configurable: !0, get: function () {
          for (var a = [], b = 0; b < this.childNodes.length; b++) {
            var c = this.childNodes[b];c.nodeType !== Node.COMMENT_NODE && a.push(c.textContent);
          }return a.join("");
        }, set: function (a) {
          for (; this.firstChild;) rd.call(this, this.firstChild);null != a && "" !== a && pd.call(this, document.createTextNode(a));
        } });
    });
    }
    function Ud(a) {
        function b(b) {
      return function (c) {
        for (var d = [], e = 0; e < arguments.length; ++e) d[e] = arguments[e];e = [];for (var h = [], k = 0; k < d.length; k++) {
          var l = d[k];l instanceof Element && K(l) && h.push(l);if (l instanceof DocumentFragment) for (l = l.firstChild; l; l = l.nextSibling) e.push(l);else e.push(l);
        }b.apply(this, d);for (d = 0; d < h.length; d++) O(a, h[d]);if (K(this)) for (d = 0; d < e.length; d++) h = e[d], h instanceof Element && N(a, h);
      };
    }var c = Element.prototype;void 0 !== Gd && (c.before = b(Gd));void 0 !== Gd && (c.after = b(Hd));void 0 !== Id && M(c, "replaceWith", function (b) {
      for (var c = [], d = 0; d < arguments.length; ++d) c[d] = arguments[d];d = [];for (var g = [], h = 0; h < c.length; h++) {
        var k = c[h];k instanceof Element && K(k) && g.push(k);if (k instanceof DocumentFragment) for (k = k.firstChild; k; k = k.nextSibling) d.push(k);else d.push(k);
      }h = K(this);Id.apply(this, c);for (c = 0; c < g.length; c++) O(a, g[c]);if (h) for (O(a, this), c = 0; c < d.length; c++) g = d[c], g instanceof Element && N(a, g);
    });void 0 !== Jd && M(c, "remove", function () {
      var b = K(this);Jd.call(this);b && O(a, this);
    });
    }
    function Vd() {
        function a(a, b) {
      Object.defineProperty(a, "innerHTML", { enumerable: b.enumerable, configurable: !0, get: b.get, set: function (a) {
          var c = this,
              e = void 0;K(this) && (e = [], L(this, function (a) {
            a !== c && e.push(a);
          }));b.set.call(this, a);if (e) for (var f = 0; f < e.length; f++) {
            var g = e[f];1 === g.__CE_state && d.disconnectedCallback(g);
          }this.ownerDocument.__CE_hasRegistry ? P(d, this) : $c(d, this);return a;
        } });
    }function b(a, b) {
      M(a, "insertAdjacentElement", function (a, c) {
        var e = K(c);a = b.call(this, a, c);e && O(d, c);K(a) && N(d, c);return a;
      });
    }
    function c(a, b) {
      function c(a, b) {
        for (var c = []; a !== b; a = a.nextSibling) c.push(a);for (b = 0; b < c.length; b++) P(d, c[b]);
      }M(a, "insertAdjacentHTML", function (a, d) {
        a = a.toLowerCase();if ("beforebegin" === a) {
          var e = this.previousSibling;b.call(this, a, d);c(e || this.parentNode.firstChild, this);
        } else if ("afterbegin" === a) e = this.firstChild, b.call(this, a, d), c(this.firstChild, e);else if ("beforeend" === a) e = this.lastChild, b.call(this, a, d), c(e || this.firstChild, null);else if ("afterend" === a) e = this.nextSibling, b.call(this, a, d), c(this.nextSibling, e);else throw new SyntaxError("The value provided (" + String(a) + ") is not one of 'beforebegin', 'afterbegin', 'beforeend', or 'afterend'.");
      });
    }var d = Qd;ud && M(Element.prototype, "attachShadow", function (a) {
      a = ud.call(this, a);var b = d;if (b.b && !a.__CE_patched) {
        a.__CE_patched = !0;for (var c = 0; c < b.c.length; c++) b.c[c](a);
      }return this.__CE_shadowRoot = a;
    });vd && vd.get ? a(Element.prototype, vd) : Ld && Ld.get ? a(HTMLElement.prototype, Ld) : Zc(d, function (b) {
      a(b, { enumerable: !0, configurable: !0, get: function () {
          return od.call(this, !0).innerHTML;
        }, set: function (a) {
          var b = "template" === this.localName,
              c = b ? this.content : this,
              d = id.call(document, this.namespaceURI, this.localName);for (d.innerHTML = a; 0 < c.childNodes.length;) rd.call(c, c.childNodes[0]);for (a = b ? d.content : d; 0 < a.childNodes.length;) pd.call(c, a.childNodes[0]);
        } });
    });M(Element.prototype, "setAttribute", function (a, b) {
      if (1 !== this.__CE_state) return xd.call(this, a, b);var c = wd.call(this, a);xd.call(this, a, b);b = wd.call(this, a);d.attributeChangedCallback(this, a, c, b, null);
    });M(Element.prototype, "setAttributeNS", function (a, b, c) {
      if (1 !== this.__CE_state) return Ad.call(this, a, b, c);var e = zd.call(this, a, b);Ad.call(this, a, b, c);c = zd.call(this, a, b);d.attributeChangedCallback(this, b, e, c, a);
    });M(Element.prototype, "removeAttribute", function (a) {
      if (1 !== this.__CE_state) return yd.call(this, a);var b = wd.call(this, a);yd.call(this, a);null !== b && d.attributeChangedCallback(this, a, b, null, null);
    });M(Element.prototype, "removeAttributeNS", function (a, b) {
      if (1 !== this.__CE_state) return Bd.call(this, a, b);var c = zd.call(this, a, b);Bd.call(this, a, b);var e = zd.call(this, a, b);c !== e && d.attributeChangedCallback(this, b, c, e, a);
    });Md ? b(HTMLElement.prototype, Md) : Cd ? b(Element.prototype, Cd) : console.warn("Custom Elements: `Element#insertAdjacentElement` was not patched.");Nd ? c(HTMLElement.prototype, Nd) : Dd ? c(Element.prototype, Dd) : console.warn("Custom Elements: `Element#insertAdjacentHTML` was not patched.");Rd(d, Element.prototype, { O: Ed, append: Fd });Ud(d);
    }
    var Wd = window.customElements;
    if (!Wd || Wd.forcePolyfill || "function" != typeof Wd.define || "function" != typeof Wd.get) {
        var Qd = new Wc();Pd();Sd();Rd(Qd, DocumentFragment.prototype, { O: md, append: nd });Td();Vd();document.__CE_hasRegistry = !0;var customElements = new Q(Qd);Object.defineProperty(window, "customElements", { configurable: !0, enumerable: !0, value: customElements });
    } /*
     Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
     The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
     The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
     Code distributed by Google as part of the polymer project is also
     subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
     */
  function Xd() {
    this.end = this.start = 0;this.rules = this.parent = this.previous = null;this.cssText = this.parsedCssText = "";this.atRule = !1;this.type = 0;this.parsedSelector = this.selector = this.keyframesName = "";
  }
  function Yd(a) {
    a = a.replace(Zd, "").replace($d, "");var b = ae,
        c = a,
        d = new Xd();d.start = 0;d.end = c.length;for (var e = d, f = 0, g = c.length; f < g; f++) if ("{" === c[f]) {
      e.rules || (e.rules = []);var h = e,
          k = h.rules[h.rules.length - 1] || null;e = new Xd();e.start = f + 1;e.parent = h;e.previous = k;h.rules.push(e);
    } else "}" === c[f] && (e.end = f + 1, e = e.parent || d);return b(d, a);
  }
  function ae(a, b) {
    var c = b.substring(a.start, a.end - 1);a.parsedCssText = a.cssText = c.trim();a.parent && (c = b.substring(a.previous ? a.previous.end : a.parent.start, a.start - 1), c = be(c), c = c.replace(ce, " "), c = c.substring(c.lastIndexOf(";") + 1), c = a.parsedSelector = a.selector = c.trim(), a.atRule = 0 === c.indexOf("@"), a.atRule ? 0 === c.indexOf("@media") ? a.type = de : c.match(ee) && (a.type = fe, a.keyframesName = a.selector.split(ce).pop()) : a.type = 0 === c.indexOf("--") ? ge : he);if (c = a.rules) for (var d = 0, e = c.length, f = void 0; d < e && (f = c[d]); d++) ae(f, b);return a;
  }function be(a) {
    return a.replace(/\\([0-9a-f]{1,6})\s/gi, function (a, c) {
      a = c;for (c = 6 - a.length; c--;) a = "0" + a;return "\\" + a;
    });
  }
  function ie(a, b, c) {
    c = void 0 === c ? "" : c;var d = "";if (a.cssText || a.rules) {
      var e = a.rules,
          f;if (f = e) f = e[0], f = !(f && f.selector && 0 === f.selector.indexOf("--"));if (f) {
        f = 0;for (var g = e.length, h = void 0; f < g && (h = e[f]); f++) d = ie(h, b, d);
      } else b ? b = a.cssText : (b = a.cssText, b = b.replace(je, "").replace(ke, ""), b = b.replace(le, "").replace(me, "")), (d = b.trim()) && (d = "  " + d + "\n");
    }d && (a.selector && (c += a.selector + " {\n"), c += d, a.selector && (c += "}\n\n"));return c;
  }
  var he = 1,
      fe = 7,
      de = 4,
      ge = 1E3,
      Zd = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//gim,
      $d = /@import[^;]*;/gim,
      je = /(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?(?:[;\n]|$)/gim,
      ke = /(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?{[^}]*?}(?:[;\n]|$)?/gim,
      le = /@apply\s*\(?[^);]*\)?\s*(?:[;\n]|$)?/gim,
      me = /[^;:]*?:[^;]*?var\([^;]*\)(?:[;\n]|$)?/gim,
      ee = /^@[^\s]*keyframes/,
      ce = /\s+/g;var R = !(window.ShadyDOM && window.ShadyDOM.inUse),
      ne;function oe(a) {
    ne = a && a.shimcssproperties ? !1 : R || !(navigator.userAgent.match(/AppleWebKit\/601|Edge\/15/) || !window.CSS || !CSS.supports || !CSS.supports("box-shadow", "0 0 0 var(--foo)"));
  }var pe;window.ShadyCSS && void 0 !== window.ShadyCSS.cssBuild && (pe = window.ShadyCSS.cssBuild);var qe = !(!window.ShadyCSS || !window.ShadyCSS.disableRuntime);
  window.ShadyCSS && void 0 !== window.ShadyCSS.nativeCss ? ne = window.ShadyCSS.nativeCss : window.ShadyCSS ? (oe(window.ShadyCSS), window.ShadyCSS = void 0) : oe(window.WebComponents && window.WebComponents.flags);var S = ne,
      re = pe;var se = /(?:^|[;\s{]\s*)(--[\w-]*?)\s*:\s*(?:((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};{])+)|\{([^}]*)\}(?:(?=[;\s}])|$))/gi,
      te = /(?:^|\W+)@apply\s*\(?([^);\n]*)\)?/gi,
      ue = /(--[\w-]+)\s*([:,;)]|$)/gi,
      ve = /(animation\s*:)|(animation-name\s*:)/,
      we = /@media\s(.*)/,
      xe = /\{[^}]*\}/g;var ye = new Set();function ze(a, b) {
    if (!a) return "";"string" === typeof a && (a = Yd(a));b && Ae(a, b);return ie(a, S);
  }function Be(a) {
    !a.__cssRules && a.textContent && (a.__cssRules = Yd(a.textContent));return a.__cssRules || null;
  }function Ce(a) {
    return !!a.parent && a.parent.type === fe;
  }function Ae(a, b, c, d) {
    if (a) {
      var e = !1,
          f = a.type;if (d && f === de) {
        var g = a.selector.match(we);g && (window.matchMedia(g[1]).matches || (e = !0));
      }f === he ? b(a) : c && f === fe ? c(a) : f === ge && (e = !0);if ((a = a.rules) && !e) for (e = 0, f = a.length, g = void 0; e < f && (g = a[e]); e++) Ae(g, b, c, d);
    }
  }
  function De(a, b, c, d) {
    var e = document.createElement("style");b && e.setAttribute("scope", b);e.textContent = a;Ee(e, c, d);return e;
  }var T = null;function Fe(a) {
    a = document.createComment(" Shady DOM styles for " + a + " ");var b = document.head;b.insertBefore(a, (T ? T.nextSibling : null) || b.firstChild);return T = a;
  }function Ee(a, b, c) {
    b = b || document.head;b.insertBefore(a, c && c.nextSibling || b.firstChild);T ? a.compareDocumentPosition(T) === Node.DOCUMENT_POSITION_PRECEDING && (T = a) : T = a;
  }
  function Ge(a, b) {
    for (var c = 0, d = a.length; b < d; b++) if ("(" === a[b]) c++;else if (")" === a[b] && 0 === --c) return b;return -1;
  }function He(a, b) {
    var c = a.indexOf("var(");if (-1 === c) return b(a, "", "", "");var d = Ge(a, c + 3),
        e = a.substring(c + 4, d);c = a.substring(0, c);a = He(a.substring(d + 1), b);d = e.indexOf(",");return -1 === d ? b(c, e.trim(), "", a) : b(c, e.substring(0, d).trim(), e.substring(d + 1).trim(), a);
  }function Ie(a, b) {
    R ? a.setAttribute("class", b) : window.ShadyDOM.nativeMethods.setAttribute.call(a, "class", b);
  }
  var Je = window.ShadyDOM && window.ShadyDOM.wrap || function (a) {
    return a;
  };function U(a) {
    var b = a.localName,
        c = "";b ? -1 < b.indexOf("-") || (c = b, b = a.getAttribute && a.getAttribute("is") || "") : (b = a.is, c = a.extends);return { is: b, I: c };
  }function Ke(a) {
    for (var b = [], c = "", d = 0; 0 <= d && d < a.length; d++) if ("(" === a[d]) {
      var e = Ge(a, d);c += a.slice(d, e + 1);d = e;
    } else "," === a[d] ? (b.push(c), c = "") : c += a[d];c && b.push(c);return b;
  }
  function Le(a) {
    if (void 0 !== re) return re;if (void 0 === a.__cssBuild) {
      var b = a.getAttribute("css-build");if (b) a.__cssBuild = b;else {
        a: {
          b = "template" === a.localName ? a.content.firstChild : a.firstChild;if (b instanceof Comment && (b = b.textContent.trim().split(":"), "css-build" === b[0])) {
            b = b[1];break a;
          }b = "";
        }if ("" !== b) {
          var c = "template" === a.localName ? a.content.firstChild : a.firstChild;c.parentNode.removeChild(c);
        }a.__cssBuild = b;
      }
    }return a.__cssBuild || "";
  }
  function Me(a) {
    a = void 0 === a ? "" : a;return "" !== a && S ? R ? "shadow" === a : "shady" === a : !1;
  }
    function Ne() {
    }
    function Oe(a, b) {
        Pe(V, a, function (a) {
      W(a, b || "");
    });
  }function Pe(a, b, c) {
    b.nodeType === Node.ELEMENT_NODE && c(b);var d;"template" === b.localName ? d = (b.content || b._content || b).childNodes : d = b.children || b.childNodes;if (d) for (b = 0; b < d.length; b++) Pe(a, d[b], c);
  }
  function W(a, b, c) {
    if (b) if (a.classList) c ? (a.classList.remove("style-scope"), a.classList.remove(b)) : (a.classList.add("style-scope"), a.classList.add(b));else if (a.getAttribute) {
      var d = a.getAttribute("class");c ? d && (b = d.replace("style-scope", "").replace(b, ""), Ie(a, b)) : Ie(a, (d ? d + " " : "") + "style-scope " + b);
    }
  }function Qe(a, b, c) {
    Pe(V, a, function (a) {
      W(a, b, !0);W(a, c);
    });
  }function Re(a, b) {
    Pe(V, a, function (a) {
      W(a, b || "", !0);
    });
  }
  function Se(a, b, c, d, e) {
    var f = V;e = void 0 === e ? "" : e;"" === e && (R || "shady" === (void 0 === d ? "" : d) ? e = ze(b, c) : (a = U(a), e = Te(f, b, a.is, a.I, c) + "\n\n"));return e.trim();
  }function Te(a, b, c, d, e) {
    var f = Ue(c, d);c = c ? "." + c : "";return ze(b, function (b) {
      b.c || (b.selector = b.h = Ve(a, b, a.b, c, f), b.c = !0);e && e(b, c, f);
    });
  }function Ue(a, b) {
    return b ? "[is=" + a + "]" : a;
  }
  function Ve(a, b, c, d, e) {
    var f = Ke(b.selector);if (!Ce(b)) {
      b = 0;for (var g = f.length, h = void 0; b < g && (h = f[b]); b++) f[b] = c.call(a, h, d, e);
    }return f.filter(function (a) {
      return !!a;
    }).join(",");
  }function We(a) {
    return a.replace(Xe, function (a, c, d) {
      -1 < d.indexOf("+") ? d = d.replace(/\+/g, "___") : -1 < d.indexOf("___") && (d = d.replace(/___/g, "+"));return ":" + c + "(" + d + ")";
    });
  }
  function Ye(a) {
    for (var b = [], c; c = a.match(Ze);) {
      var d = c.index,
          e = Ge(a, d);if (-1 === e) throw Error(c.input + " selector missing ')'");c = a.slice(d, e + 1);a = a.replace(c, "\ue000");b.push(c);
    }return { X: a, matches: b };
  }function $e(a, b) {
    var c = a.split("\ue000");return b.reduce(function (a, b, f) {
      return a + b + c[f + 1];
    }, c[0]);
  }
  Ne.prototype.b = function (a, b, c) {
    var d = !1;a = a.trim();var e = Xe.test(a);e && (a = a.replace(Xe, function (a, b, c) {
      return ":" + b + "(" + c.replace(/\s/g, "") + ")";
    }), a = We(a));var f = Ze.test(a);if (f) {
      var g = Ye(a);a = g.X;g = g.matches;
    }a = a.replace(af, ":host $1");a = a.replace(bf, function (a, e, f) {
      d || (a = cf(f, e, b, c), d = d || a.stop, e = a.oa, f = a.value);return e + f;
    });f && (a = $e(a, g));e && (a = We(a));return a = a.replace(df, function (a, b, c, d) {
      return '[dir="' + c + '"] ' + b + d + ", " + b + '[dir="' + c + '"]' + d;
    });
  };
  function cf(a, b, c, d) {
    var e = a.indexOf("::slotted");0 <= a.indexOf(":host") ? a = ef(a, d) : 0 !== e && (a = c ? ff(a, c) : a);c = !1;0 <= e && (b = "", c = !0);if (c) {
      var f = !0;c && (a = a.replace(gf, function (a, b) {
        return " > " + b;
      }));
    }return { value: a, oa: b, stop: f };
  }function ff(a, b) {
    a = a.split(/(\[.+?\])/);for (var c = [], d = 0; d < a.length; d++) if (1 === d % 2) c.push(a[d]);else {
      var e = a[d];if ("" !== e || d !== a.length - 1) e = e.split(":"), e[0] += b, c.push(e.join(":"));
    }return c.join("");
  }
  function ef(a, b) {
    var c = a.match(hf);return (c = c && c[2].trim() || "") ? c[0].match(jf) ? a.replace(hf, function (a, c, f) {
      return b + f;
    }) : c.split(jf)[0] === b ? c : "should_not_match" : a.replace(":host", b);
  }function kf(a) {
    ":root" === a.selector && (a.selector = "html");
  }Ne.prototype.c = function (a) {
    return a.match(":host") ? "" : a.match("::slotted") ? this.b(a, ":not(.style-scope)") : ff(a.trim(), ":not(.style-scope)");
  };p.Object.defineProperties(Ne.prototype, { a: { configurable: !0, enumerable: !0, get: function () {
        return "style-scope";
      } } });
  var Xe = /:(nth[-\w]+)\(([^)]+)\)/,
      bf = /(^|[\s>+~]+)((?:\[.+?\]|[^\s>+~=[])+)/g,
      jf = /[[.:#*]/,
      af = /^(::slotted)/,
      hf = /(:host)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))/,
      gf = /(?:::slotted)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))/,
      df = /(.*):dir\((?:(ltr|rtl))\)(.*)/,
      Ze = /:(?:matches|any|-(?:webkit|moz)-any)/,
      V = new Ne();function lf(a, b, c, d, e) {
    this.u = a || null;this.b = b || null;this.W = c || [];this.l = null;this.cssBuild = e || "";this.I = d || "";this.a = this.m = this.s = null;
  }function X(a) {
    return a ? a.__styleInfo : null;
  }function mf(a, b) {
    return a.__styleInfo = b;
  }lf.prototype.c = function () {
    return this.u;
  };lf.prototype._getStyleRules = lf.prototype.c;function nf(a) {
    var b = this.matches || this.matchesSelector || this.mozMatchesSelector || this.msMatchesSelector || this.oMatchesSelector || this.webkitMatchesSelector;return b && b.call(this, a);
  }var of = navigator.userAgent.match("Trident");function pf() {}function qf(a) {
    var b = {},
        c = [],
        d = 0;Ae(a, function (a) {
      rf(a);a.index = d++;a = a.g.cssText;for (var c; c = ue.exec(a);) {
        var e = c[1];":" !== c[2] && (b[e] = !0);
      }
    }, function (a) {
      c.push(a);
    });a.b = c;a = [];for (var e in b) a.push(e);return a;
  }
  function rf(a) {
    if (!a.g) {
      var b = {},
          c = {};sf(a, c) && (b.o = c, a.rules = null);b.cssText = a.parsedCssText.replace(xe, "").replace(se, "");a.g = b;
    }
  }function sf(a, b) {
    var c = a.g;if (c) {
      if (c.o) return Object.assign(b, c.o), !0;
    } else {
      c = a.parsedCssText;for (var d; a = se.exec(c);) {
        d = (a[2] || a[3]).trim();if ("inherit" !== d || "unset" !== d) b[a[1].trim()] = d;d = !0;
      }return d;
    }
  }
  function tf(a, b, c) {
    b && (b = 0 <= b.indexOf(";") ? uf(a, b, c) : He(b, function (b, e, f, g) {
      if (!e) return b + g;(e = tf(a, c[e], c)) && "initial" !== e ? "apply-shim-inherit" === e && (e = "inherit") : e = tf(a, c[f] || f, c) || f;return b + (e || "") + g;
    }));return b && b.trim() || "";
  }
  function uf(a, b, c) {
    b = b.split(";");for (var d = 0, e, f; d < b.length; d++) if (e = b[d]) {
      te.lastIndex = 0;if (f = te.exec(e)) e = tf(a, c[f[1]], c);else if (f = e.indexOf(":"), -1 !== f) {
        var g = e.substring(f);g = g.trim();g = tf(a, g, c) || g;e = e.substring(0, f) + g;
      }b[d] = e && e.lastIndexOf(";") === e.length - 1 ? e.slice(0, -1) : e || "";
    }return b.join(";");
  }
  function vf(a, b) {
    var c = {},
        d = [];Ae(a, function (a) {
      a.g || rf(a);var e = a.h || a.parsedSelector;b && a.g.o && e && nf.call(b, e) && (sf(a, c), a = a.index, e = parseInt(a / 32, 10), d[e] = (d[e] || 0) | 1 << a % 32);
    }, null, !0);return { o: c, key: d };
  }
  function wf(a, b, c, d) {
    b.g || rf(b);if (b.g.o) {
      var e = U(a);a = e.is;e = e.I;e = a ? Ue(a, e) : "html";var f = b.parsedSelector,
          g = ":host > *" === f || "html" === f,
          h = 0 === f.indexOf(":host") && !g;"shady" === c && (g = f === e + " > *." + e || -1 !== f.indexOf("html"), h = !g && 0 === f.indexOf(e));if (g || h) c = e, h && (b.h || (b.h = Ve(V, b, V.b, a ? "." + a : "", e)), c = b.h || e), d({ X: c, ua: h, Ga: g });
    }
  }function xf(a, b, c) {
    var d = {},
        e = {};Ae(b, function (b) {
      wf(a, b, c, function (c) {
        nf.call(a._element || a, c.X) && (c.ua ? sf(b, d) : sf(b, e));
      });
    }, null, !0);return { ya: e, sa: d };
  }
  function yf(a, b, c, d) {
    var e = U(b),
        f = Ue(e.is, e.I),
        g = new RegExp("(?:^|[^.#[:])" + (b.extends ? "\\" + f.slice(0, -1) + "\\]" : f) + "($|[.:[\\s>+~])"),
        h = X(b);e = h.u;h = h.cssBuild;var k = zf(e, d);return Se(b, e, function (b) {
      var e = "";b.g || rf(b);b.g.cssText && (e = uf(a, b.g.cssText, c));b.cssText = e;if (!R && !Ce(b) && b.cssText) {
        var h = e = b.cssText;null == b.$ && (b.$ = ve.test(e));if (b.$) if (null == b.M) {
          b.M = [];for (var l in k) h = k[l], h = h(e), e !== h && (e = h, b.M.push(l));
        } else {
          for (l = 0; l < b.M.length; ++l) h = k[b.M[l]], e = h(e);h = e;
        }b.cssText = h;b.h = b.h || b.selector;
        e = "." + d;l = Ke(b.h);h = 0;for (var la = l.length, Va = void 0; h < la && (Va = l[h]); h++) l[h] = Va.match(g) ? Va.replace(f, e) : e + " " + Va;b.selector = l.join(",");
      }
    }, h);
  }function zf(a, b) {
    a = a.b;var c = {};if (!R && a) for (var d = 0, e = a[d]; d < a.length; e = a[++d]) {
      var f = e,
          g = b;f.f = new RegExp("\\b" + f.keyframesName + "(?!\\B|-)", "g");f.a = f.keyframesName + "-" + g;f.h = f.h || f.selector;f.selector = f.h.replace(f.keyframesName, f.a);c[e.keyframesName] = Af(e);
    }return c;
  }function Af(a) {
    return function (b) {
      return b.replace(a.f, a.a);
    };
  }
  function Bf(a, b) {
    var c = Cf,
        d = Be(a);a.textContent = ze(d, function (a) {
      var d = a.cssText = a.parsedCssText;a.g && a.g.cssText && (d = d.replace(je, "").replace(ke, ""), a.cssText = uf(c, d, b));
    });
  }p.Object.defineProperties(pf.prototype, { a: { configurable: !0, enumerable: !0, get: function () {
        return "x-scope";
      } } });var Cf = new pf();var Df = {},
      Ef = window.customElements;if (Ef && !R && !qe) {
    var Ff = Ef.define;Ef.define = function (a, b, c) {
      Df[a] || (Df[a] = Fe(a));Ff.call(Ef, a, b, c);
    };
    }
    function Gf() {
        this.cache = {};
  }Gf.prototype.store = function (a, b, c, d) {
    var e = this.cache[a] || [];e.push({ o: b, styleElement: c, m: d });100 < e.length && e.shift();this.cache[a] = e;
  };function Hf() {}var If = new RegExp(V.a + "\\s*([^\\s]*)");function Jf(a) {
    return (a = (a.classList && a.classList.value ? a.classList.value : a.getAttribute("class") || "").match(If)) ? a[1] : "";
  }function Kf(a) {
    var b = Je(a).getRootNode();return b === a || b === a.ownerDocument ? "" : (a = b.host) ? U(a).is : "";
  }
  function Lf(a) {
    for (var b = 0; b < a.length; b++) {
      var c = a[b];if (c.target !== document.documentElement && c.target !== document.head) for (var d = 0; d < c.addedNodes.length; d++) {
        var e = c.addedNodes[d];if (e.nodeType === Node.ELEMENT_NODE) {
          var f = e.getRootNode(),
              g = Jf(e);if (g && f === e.ownerDocument && ("style" !== e.localName && "template" !== e.localName || "" === Le(e))) Re(e, g);else if (f instanceof ShadowRoot) for (f = Kf(e), f !== g && Qe(e, g, f), e = window.ShadyDOM.nativeMethods.querySelectorAll.call(e, ":not(." + V.a + ")"), g = 0; g < e.length; g++) {
            f = e[g];
            var h = Kf(f);h && W(f, h);
          }
        }
      }
    }
  }
  if (!(R || window.ShadyDOM && window.ShadyDOM.handlesDynamicScoping)) {
    var Mf = new MutationObserver(Lf),
        Nf = function (a) {
      Mf.observe(a, { childList: !0, subtree: !0 });
    };if (window.customElements && !window.customElements.polyfillWrapFlushCallback) Nf(document);else {
      var Of = function () {
        Nf(document.body);
      };window.HTMLImports ? window.HTMLImports.whenReady(Of) : requestAnimationFrame(function () {
        if ("loading" === document.readyState) {
          var a = function () {
            Of();document.removeEventListener("readystatechange", a);
          };document.addEventListener("readystatechange", a);
        } else Of();
      });
    }Hf = function () {
      Lf(Mf.takeRecords());
    };
  }var Pf = Hf;var Qf = {};var Rf = Promise.resolve();function Sf(a) {
    if (a = Qf[a]) a._applyShimCurrentVersion = a._applyShimCurrentVersion || 0, a._applyShimValidatingVersion = a._applyShimValidatingVersion || 0, a._applyShimNextVersion = (a._applyShimNextVersion || 0) + 1;
  }function Tf(a) {
    return a._applyShimCurrentVersion === a._applyShimNextVersion;
  }function Uf(a) {
    a._applyShimValidatingVersion = a._applyShimNextVersion;a._validating || (a._validating = !0, Rf.then(function () {
      a._applyShimCurrentVersion = a._applyShimNextVersion;a._validating = !1;
    }));
    }
    var Vf = {},
        Wf = new Gf();function Y() {
    this.F = {};this.c = document.documentElement;var a = new Xd();a.rules = [];this.f = mf(this.c, new lf(a));this.i = !1;this.b = this.a = null;
  }n = Y.prototype;n.flush = function () {
    Pf();
  };n.qa = function (a) {
    return Be(a);
  };n.Ca = function (a) {
    return ze(a);
  };n.prepareTemplate = function (a, b, c) {
    this.prepareTemplateDom(a, b);this.prepareTemplateStyles(a, b, c);
  };
  n.prepareTemplateStyles = function (a, b, c) {
    if (!a._prepared && !qe) {
      R || Df[b] || (Df[b] = Fe(b));a._prepared = !0;a.name = b;a.extends = c;Qf[b] = a;var d = Le(a),
          e = Me(d);c = { is: b, extends: c };for (var f = [], g = a.content.querySelectorAll("style"), h = 0; h < g.length; h++) {
        var k = g[h];if (k.hasAttribute("shady-unscoped")) {
          if (!R) {
            var l = k.textContent;ye.has(l) || (ye.add(l), l = k.cloneNode(!0), document.head.appendChild(l));k.parentNode.removeChild(k);
          }
        } else f.push(k.textContent), k.parentNode.removeChild(k);
      }f = f.join("").trim() + (Vf[b] || "");
      Xf(this);if (!e) {
        if (g = !d) g = te.test(f) || se.test(f), te.lastIndex = 0, se.lastIndex = 0;h = Yd(f);g && S && this.a && this.a.transformRules(h, b);a._styleAst = h;
      }g = [];S || (g = qf(a._styleAst));if (!g.length || S) h = R ? a.content : null, b = Df[b] || null, d = Se(c, a._styleAst, null, d, e ? f : ""), d = d.length ? De(d, c.is, h, b) : null, a._style = d;a.a = g;
    }
  };n.wa = function (a, b) {
    Vf[b] = a.join(" ");
  };n.prepareTemplateDom = function (a, b) {
    if (!qe) {
      var c = Le(a);R || "shady" === c || a._domPrepared || (a._domPrepared = !0, Oe(a.content, b));
    }
  };
  function Yf(a) {
    var b = U(a),
        c = b.is;b = b.I;var d = Df[c] || null,
        e = Qf[c];if (e) {
      c = e._styleAst;var f = e.a;e = Le(e);b = new lf(c, d, f, b, e);mf(a, b);return b;
    }
  }function Zf(a) {
    !a.b && window.ShadyCSS && window.ShadyCSS.CustomStyleInterface && (a.b = window.ShadyCSS.CustomStyleInterface, a.b.transformCallback = function (b) {
      a.da(b);
    }, a.b.validateCallback = function () {
      requestAnimationFrame(function () {
        (a.b.enqueued || a.i) && a.flushCustomStyles();
      });
    });
  }
  function Xf(a) {
    !a.a && window.ShadyCSS && window.ShadyCSS.ApplyShim && (a.a = window.ShadyCSS.ApplyShim, a.a.invalidCallback = Sf);Zf(a);
  }
  n.flushCustomStyles = function () {
    if (!qe && (Xf(this), this.b)) {
      var a = this.b.processStyles();if (this.b.enqueued && !Me(this.f.cssBuild)) {
        if (S) {
          if (!this.f.cssBuild) for (var b = 0; b < a.length; b++) {
            var c = this.b.getStyleForCustomStyle(a[b]);if (c && S && this.a) {
              var d = Be(c);Xf(this);this.a.transformRules(d);c.textContent = ze(d);
            }
          }
        } else {
          $f(this, this.c, this.f);for (b = 0; b < a.length; b++) (c = this.b.getStyleForCustomStyle(a[b])) && Bf(c, this.f.s);this.i && this.styleDocument();
        }this.b.enqueued = !1;
      }
    }
  };
  n.styleElement = function (a, b) {
    if (qe) {
      if (b) {
        X(a) || mf(a, new lf(null));var c = X(a);c.l = c.l || {};Object.assign(c.l, b);ag(this, a, c);
      }
    } else if (c = X(a) || Yf(a)) if (a !== this.c && (this.i = !0), b && (c.l = c.l || {}, Object.assign(c.l, b)), S) ag(this, a, c);else if (this.flush(), $f(this, a, c), c.W && c.W.length) {
      b = U(a).is;var d;a: {
        if (d = Wf.cache[b]) for (var e = d.length - 1; 0 <= e; e--) {
          var f = d[e];b: {
            var g = c.W;for (var h = 0; h < g.length; h++) {
              var k = g[h];if (f.o[k] !== c.s[k]) {
                g = !1;break b;
              }
            }g = !0;
          }if (g) {
            d = f;break a;
          }
        }d = void 0;
      }g = d ? d.styleElement : null;e = c.m;(f = d && d.m) || (f = this.F[b] = (this.F[b] || 0) + 1, f = b + "-" + f);c.m = f;f = c.m;h = Cf;h = g ? g.textContent || "" : yf(h, a, c.s, f);k = X(a);var l = k.a;l && !R && l !== g && (l._useCount--, 0 >= l._useCount && l.parentNode && l.parentNode.removeChild(l));R ? k.a ? (k.a.textContent = h, g = k.a) : h && (g = De(h, f, a.shadowRoot, k.b)) : g ? g.parentNode || (of && -1 < h.indexOf("@media") && (g.textContent = h), Ee(g, null, k.b)) : h && (g = De(h, f, null, k.b));g && (g._useCount = g._useCount || 0, k.a != g && g._useCount++, k.a = g);f = g;R || (g = c.m, k = h = a.getAttribute("class") || "", e && (k = h.replace(new RegExp("\\s*x-scope\\s*" + e + "\\s*", "g"), " ")), k += (k ? " " : "") + "x-scope " + g, h !== k && Ie(a, k));d || Wf.store(b, c.s, f, c.m);
    }
  };
  function ag(a, b, c) {
    var d = U(b).is;if (c.l) {
      var e = c.l,
          f;for (f in e) null === f ? b.style.removeProperty(f) : b.style.setProperty(f, e[f]);
    }e = Qf[d];if (!(!e && b !== a.c || e && "" !== Le(e)) && e && e._style && !Tf(e)) {
      if (Tf(e) || e._applyShimValidatingVersion !== e._applyShimNextVersion) Xf(a), a.a && a.a.transformRules(e._styleAst, d), e._style.textContent = Se(b, c.u), Uf(e);R && (a = b.shadowRoot) && (a = a.querySelector("style")) && (a.textContent = Se(b, c.u));c.u = e._styleAst;
    }
  }
  function bg(a, b) {
    return (b = Je(b).getRootNode().host) ? X(b) || Yf(b) ? b : bg(a, b) : a.c;
  }function $f(a, b, c) {
    var d = bg(a, b),
        e = X(d),
        f = e.s;d === a.c || f || ($f(a, d, e), f = e.s);a = Object.create(f || null);d = xf(b, c.u, c.cssBuild);b = vf(e.u, b).o;Object.assign(a, d.sa, b, d.ya);b = c.l;for (var g in b) if ((e = b[g]) || 0 === e) a[g] = e;g = Cf;b = Object.getOwnPropertyNames(a);for (e = 0; e < b.length; e++) d = b[e], a[d] = tf(g, a[d], a);c.s = a;
  }n.styleDocument = function (a) {
    this.styleSubtree(this.c, a);
  };
  n.styleSubtree = function (a, b) {
    var c = Je(a),
        d = c.shadowRoot;(d || a === this.c) && this.styleElement(a, b);if (a = d && (d.children || d.childNodes)) for (c = 0; c < a.length; c++) this.styleSubtree(a[c]);else if (c = c.children || c.childNodes) for (a = 0; a < c.length; a++) this.styleSubtree(c[a]);
  };
  n.da = function (a) {
    var b = this,
        c = Le(a);c !== this.f.cssBuild && (this.f.cssBuild = c);if (!Me(c)) {
      var d = Be(a);Ae(d, function (a) {
        if (R) kf(a);else {
          var d = V;a.selector = a.parsedSelector;kf(a);a.selector = a.h = Ve(d, a, d.c, void 0, void 0);
        }S && "" === c && (Xf(b), b.a && b.a.transformRule(a));
      });S ? a.textContent = ze(d) : this.f.u.rules.push(d);
    }
  };n.getComputedStyleValue = function (a, b) {
    var c;S || (c = (X(a) || X(bg(this, a))).s[b]);return (c = c || window.getComputedStyle(a).getPropertyValue(b)) ? c.trim() : "";
  };
  n.Ba = function (a, b) {
    var c = Je(a).getRootNode();b = b ? b.split(/\s/) : [];c = c.host && c.host.localName;if (!c) {
      var d = a.getAttribute("class");if (d) {
        d = d.split(/\s/);for (var e = 0; e < d.length; e++) if (d[e] === V.a) {
          c = d[e + 1];break;
        }
      }
    }c && b.push(V.a, c);S || (c = X(a)) && c.m && b.push(Cf.a, c.m);Ie(a, b.join(" "));
  };n.na = function (a) {
    return X(a);
  };n.Aa = function (a, b) {
    W(a, b);
  };n.Da = function (a, b) {
    W(a, b, !0);
  };n.za = function (a) {
    return Kf(a);
  };n.pa = function (a) {
    return Jf(a);
  };Y.prototype.flush = Y.prototype.flush;Y.prototype.prepareTemplate = Y.prototype.prepareTemplate;
  Y.prototype.styleElement = Y.prototype.styleElement;Y.prototype.styleDocument = Y.prototype.styleDocument;Y.prototype.styleSubtree = Y.prototype.styleSubtree;Y.prototype.getComputedStyleValue = Y.prototype.getComputedStyleValue;Y.prototype.setElementClass = Y.prototype.Ba;Y.prototype._styleInfoForNode = Y.prototype.na;Y.prototype.transformCustomStyleForDocument = Y.prototype.da;Y.prototype.getStyleAst = Y.prototype.qa;Y.prototype.styleAstToString = Y.prototype.Ca;Y.prototype.flushCustomStyles = Y.prototype.flushCustomStyles;
  Y.prototype.scopeNode = Y.prototype.Aa;Y.prototype.unscopeNode = Y.prototype.Da;Y.prototype.scopeForNode = Y.prototype.za;Y.prototype.currentScopeForNode = Y.prototype.pa;Y.prototype.prepareAdoptedCssText = Y.prototype.wa;Object.defineProperties(Y.prototype, { nativeShadow: { get: function () {
        return R;
      } }, nativeCss: { get: function () {
        return S;
      } } });var Z = new Y(),
      cg,
      dg;window.ShadyCSS && (cg = window.ShadyCSS.ApplyShim, dg = window.ShadyCSS.CustomStyleInterface);
  window.ShadyCSS = { ScopingShim: Z, prepareTemplate: function (a, b, c) {
      Z.flushCustomStyles();Z.prepareTemplate(a, b, c);
    }, prepareTemplateDom: function (a, b) {
      Z.prepareTemplateDom(a, b);
    }, prepareTemplateStyles: function (a, b, c) {
      Z.flushCustomStyles();Z.prepareTemplateStyles(a, b, c);
    }, styleSubtree: function (a, b) {
      Z.flushCustomStyles();Z.styleSubtree(a, b);
    }, styleElement: function (a) {
      Z.flushCustomStyles();Z.styleElement(a);
    }, styleDocument: function (a) {
      Z.flushCustomStyles();Z.styleDocument(a);
    }, flushCustomStyles: function () {
      Z.flushCustomStyles();
    },
    getComputedStyleValue: function (a, b) {
      return Z.getComputedStyleValue(a, b);
    }, nativeCss: S, nativeShadow: R, cssBuild: re, disableRuntime: qe };cg && (window.ShadyCSS.ApplyShim = cg);dg && (window.ShadyCSS.CustomStyleInterface = dg);
}).call(this);

//# sourceMappingURL=webcomponents-sd-ce.js.map