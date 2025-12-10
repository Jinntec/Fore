class l extends HTMLElement {
  constructor() {
    super(), this.duration = 3e3, this.stickyDuration = 3e4;
  }
  static get observedAttributes() {
    return ["duration"];
  }
  attributeChangedCallback(t, a, i) {
    t === "duration" && (this.duration = parseInt(i) || 3e3);
  }
  connectedCallback() {
    this.render(), this.setupEventListeners();
  }
  render() {
    this.innerHTML = `
            <style>
                jinn-toast .jinn-toast-container {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    z-index: var(--jinn-toast-z-index, 1000);
                }

                jinn-toast .jinn-toast {
                    padding: 12px 24px;
                    margin: 8px 0;
                    border-radius: 4px;
                    color: var(--jinn-toast-color, #F0F0F0);
                    opacity: 0;
                    transform: translateY(20px);
                    transition: opacity 0.3s, transform 0.3s;
                    max-width: var(--jinn-toast-max-width, 30vw);
                    word-wrap: break-word;
                    pointer-events: none;
                    position: relative;
                }

                jinn-toast .jinn-toast p {
                    color: var(--jinn-toast-color, #F0F0F0);
                }

                jinn-toast .jinn-toast input {
                    width: min-content;
                }

                jinn-toast .jinn-toast.sticky {
                    pointer-events: auto;
                }

                jinn-toast .close-button {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    font-size: 16px;
                    line-height: 1;
                    padding: 4px;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }

                jinn-toast .close-button:hover {
                    opacity: 1;
                }

                jinn-toast .jinn-toast.show {
                    opacity: 1;
                    transform: translateY(0);
                }

                jinn-toast .jinn-toast.error {
                    background-color: var(--jinn-toast-error-color, #EE402E);
                }

                jinn-toast .jinn-toast.warn {
                    background-color: var(--jinn-toast-warn-color, #FF9500);
                    color: #000;
                }

                jinn-toast .jinn-toast.info {
                    background-color: var(--jinn-toast-info-color, #33790F);
                }
            </style>
            <div class="jinn-toast-container"></div>
        `;
  }
  setupEventListeners() {
    document.addEventListener("jinn-toast", (t) => {
      this.showToast(
        t.detail.message,
        t.detail.type || "info",
        t.detail.nohtml || !1,
        t.detail.sticky || !1
      );
    });
  }
  showToast(t, a, i = !1, e = !1) {
    const n = document.createElement("div");
    n.className = `jinn-toast ${a} ${e ? "sticky" : ""}`;
    const s = () => {
      n.classList.remove("show"), setTimeout(() => {
        r.removeChild(n);
      }, 300);
    };
    if (typeof t == "string")
      i ? n.textContent = t : n.innerHTML = t;
    else if (t instanceof Node)
      n.appendChild(t);
    else if (typeof t == "function") {
      const o = t(s);
      if (o instanceof Node)
        n.appendChild(o);
      else {
        console.warn("Function message did not return a valid Node.");
        return;
      }
    } else {
      console.warn("Invalid message type for toast. Expected string, Node, or function.");
      return;
    }
    if (e) {
      const o = document.createElement("button");
      o.className = "close-button", o.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                </svg>
            `, o.addEventListener("click", s), n.appendChild(o);
    }
    const r = this.querySelector(".jinn-toast-container");
    r.appendChild(n), n.offsetHeight, n.classList.add("show"), e || setTimeout(s, this.duration);
  }
}
customElements.get("jinn-toast") || customElements.define("jinn-toast", l);
export {
  l as JinnToast
};
//# sourceMappingURL=jinn-toast.es.js.map
