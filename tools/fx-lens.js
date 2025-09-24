import './jinn-codemirror-bundle.js';

/**
 * lists out all live instances in html 'details' and 'summary' elements.
 *
 *
 */
export class FxLens extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.mode = 'xml';
    this.isResizing = false;
    this.lastX = 0;

    /**
     * we need to wait for DOM to be ready before taking action.
     */
    document.addEventListener('DOMContentLoaded', () => {
      this.fores = Array.from(document.querySelectorAll('fx-fore'));
      this.render();

      document.addEventListener('ready', ev => {
        const fores = Array.from(document.querySelectorAll('fx-fore'));
      });
      this.fores.forEach(fore => {
        fore.addEventListener('ready', () => {
          this.render();
        });

        fore.addEventListener('value-changed', ev => {
          // console.log('+++++++++++++++++++++++++++++++value-changed')
          this.update();
          const targetId = `${ev.detail.foreId}#${ev.detail.instanceId}`;
          const targetSummary = this.shadowRoot.querySelector(`summary[data-id="${targetId}"]`);
          // console.log('value-changed on ',`${ev.detail.foreId}#${ev.detail.instanceId}`);
          // this.flashEffect(targetSummary);
          ev.preventDefault();
        });
        fore.addEventListener('deleted', ev => {
          this.update();
          const targetId = `${ev.detail.foreId}#${ev.detail.instanceId}`;
          const targetSummary = this.shadowRoot.querySelector(`summary[data-id="${targetId}"]`);
          this.flashEffect(targetSummary);
        });
        fore.addEventListener('insert', ev => {
          // console.log('+++++++++++++++++++++++++++++++insert');
          this.update();
          const targetId = `${ev.detail.foreId}#${ev.detail.instanceId}`;
          const targetSummary = this.shadowRoot.querySelector(`summary[data-id="${targetId}"]`);
          this.flashEffect(targetSummary);
        });
        fore.addEventListener('index-changed', ev => {
          // console.log('+++++++++++++++++++++++++++++++index-changed');
          this.update();
          const targetId = `${ev.detail.foreId}#${ev.detail.instanceId}`;
          const targetSummary = this.shadowRoot.querySelector(`summary[data-id="${targetId}"]`);
          this.flashEffect(targetSummary);
        });
        fore.addEventListener('submit', ev => {
          // console.log('+++++++++++++++++++++++++++++++submit');
          this.update();
          const targetId = `${ev.detail.foreId}#${ev.detail.instanceId}`;
          const targetSummary = this.shadowRoot.querySelector(`summary[data-id="${targetId}"]`);
          this.flashEffect(targetSummary);
        });
        fore.addEventListener('submit-done', ev => {
          // console.log('+++++++++++++++++++++++++++++++submit-done');
          this.update();
          const targetId = `${ev.detail.foreId}#${ev.detail.instanceId}`;
          const targetSummary = this.shadowRoot.querySelector(`summary[data-id="${targetId}"]`);
          this.flashEffect(targetSummary);
        });
        fore.addEventListener('submit-error', ev => {
          // console.log('+++++++++++++++++++++++++++++++submit-error');
          this.update();
          const targetId = `${ev.detail.foreId}#${ev.detail.instanceId}`;
          const targetSummary = this.shadowRoot.querySelector(`summary[data-id="${targetId}"]`);
          this.flashEffect(targetSummary);
        });
      });
      this.lastWidth = this.offsetWidth;
    });
  }

  flashEffect(element) {
    // Add a glow effect
    if (!element) return;
    element.style.background = 'rgba(55,55,255,0.1)';

    // Remove the effect after 1 second
    setTimeout(() => {
      element.style.background = 'ghostwhite';
    }, 1000);
  }

  /**
   * render
   * @param style
   * @returns {Promise<void>}
   */
  // async render(style) {
  async render() {
    // console.log('render')
    this.shadowRoot.innerHTML = '';
    const style = `
          :host {
            position:fixed;
            display: block;
            width:var(--inspector-handle-width);
            top:0;
            right:0;
            bottom:0;
            height: 100vh;
            background: aliceblue;
            color: white;
            overflow: hidden;
            z-index:900;
            max-width:calc(100vw - var(--inspector-handle-width));
            min-width:var(--inspector-handle-width);
            box-shadow:-2px -2px 8px rgba(0,0,0,0.3);
          }
            
          :host:has(.handle:hover){
            box-shadow:-2px -2px 8px rgba(0,0,0,0.6);
          }
          jinn-codemirror{
            min-height:5rem;
          }
          :host([open]){
            width: 40vw;
          }
          details{
            margin:0;
            width:calc(100% - 17px);
            position:relative;
          }
          .main{
            padding-left:var(--inspector-handle-width);
            color:var(--inspector-color);
            overflow:scroll;
            height:100vh;
            background:ghostwhite);
            overflow:hidden;
            
          }
          .main > div{
            overflow:auto;
            height:100vh;
          }
          .handle{
            display:flex;
            justify-content:center;
            height:100%;
            width:var(--inspector-handle-width);
            background:var(--inspector-handle-bg);
            position:absolute;
            left:0;
            color:white;
            cursor:pointer;
            z-index:800;
          }
          .handle:hover{
            opacity:1;
          }
          .handle::before{
            content: 'Data Lens';
            white-space: nowrap;
            transform: rotate(-90deg);
            display: inline-block;
            position: absolute;
            left: -85px;
            width: 200px;
            top: 0px;
            z-index:801;
          }
          .handle a,
          .handle a:visited,
          .handle a:link{
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
          .fore-section summary{
            cursor:pointer;
            padding:1rem 0.5rem;
            background:papayawhip;
            font-size:1.2rem;
            transition: background 0.5s ease-in-out;
          }
          header{
            padding:0.5rem;
          }
          details.instance summary{
            font-size:1.2rem;
            background:ghostwhite;
            padding:0.5rem;
          }
          .resizer{
            width:0.25rem;
            background:blue;
            height:100vh;
            background:rgba(215,220,235,0.3);
            cursor: ew-resize;
            position:absolute;
            top:0;
            left:0;
            z-index:999;
          }
        `;

    const fores = Array.from(document.querySelectorAll('fx-fore'));
    const instances = Array.from(document.querySelectorAll('fx-instance'));
    const openPanels = JSON.parse(localStorage.getItem('lens-panels') || '[]');
    this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
          <details class="main" open>
              <div class="resizer"></div>  
              <summary class="handle"><a href="#" id="reset" title="reset panel state to defaults">&#x2715;</a></summary>
              <div>
                ${instances
                  .map((instance, index) => {
                    const foreId = instance.closest('fx-fore').id;
                    return `<details  id="d${index}" class="instance"><summary data-id="${foreId}#${instance.id}">${foreId}#${instance.id}</summary><jinn-codemirror id="${foreId}#${instance.id}" mode="${instance.type}"></jinn-codemirror></details>`;
                  })
                  .join('')}
              </div>
          </details>
        `;

    const lensWidth = localStorage.getItem('lens-width');
    if (lensWidth) {
      this.style.width = `${lensWidth}px`;
    }

    const main = this.shadowRoot.querySelector('.main');
    const opened = localStorage.getItem('lens-open');
    if (opened) {
      if (opened === 'true') {
        main.setAttribute('open', 'open');
      } else {
        main.removeAttribute('open');
        this.removeAttribute('open');
        this.removeAttribute('style');
      }
    } else {
      main.setAttribute('open', 'open');
    }

    for (let i = 0; i < instances.length; i++) {
      const editors = Array.from(this.shadowRoot.querySelectorAll('jinn-codemirror'));
      editors[i].value = instances[i].instanceData;
    }

    const handle = this.shadowRoot.querySelector('.handle');
    handle.addEventListener('click', e => {
      if (this.hasAttribute('open')) {
        this.removeAttribute('open');
        this.removeAttribute('style');
        localStorage.setItem('lens-open', 'false');
      } else {
        this.setAttribute('open', 'open');
        if (lensWidth) {
          this.style.width = `${lensWidth}px`;
        }
        localStorage.setItem('lens-open', 'true');
        this.render();
      }
    });

    const reset = this.shadowRoot.querySelector('.handle a');
    reset.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      localStorage.removeItem('lens-width');
      localStorage.removeItem('lens-open');
      localStorage.removeItem('lens-panels');
    });

    const sections = this.shadowRoot.querySelectorAll('summary');
    Array.from(sections).forEach(sec => {
      sec.addEventListener('click', ev => {
        const details = ev.target.parentNode;
        const { id } = details;
        const panes = JSON.parse(localStorage.getItem('lens-panels') || '[]');
        if (!details.hasAttribute('open')) {
          if (!panes.includes(id)) {
            panes.push(id);
            localStorage.setItem('lens-panels', JSON.stringify(panes));
          }
        } else if (panes.includes(id)) {
          const idx = panes.indexOf(id);
          panes.splice(idx, 1);
          localStorage.setItem('lens-panels', JSON.stringify(panes));
        }
      });
    });
    const detailSections = this.shadowRoot.querySelectorAll('details.instance');
    Array.from(detailSections).forEach(sect => {
      if (openPanels.includes(sect.id)) {
        sect.setAttribute('open', 'open');
      } else {
        sect.removeAttribute('open');
      }
    });

    // resizing handler
    this.resizer = this.shadowRoot.querySelector('.resizer');
    this.resizer.addEventListener('mousedown', event => {
      this.isResizing = true;
      this.lastX = event.clientX;
      this.lastWidth = this.offsetWidth;
    });

    document.addEventListener('mousemove', event => {
      event.preventDefault();
      event.stopPropagation();
      if (!this.isResizing) return;
      const delta = event.clientX - this.lastX;
      // console.log('_resizePanel',delta);
      this.style.width = `${this.lastWidth - delta}px`;
    });
    document.addEventListener('mouseup', event => {
      event.preventDefault();
      event.stopPropagation();
      this.isResizing = false;
      this.lastX = event.clientX;
      this.lastWidth = this.offsetWidth;
      if (this.hasAttribute('open')) {
        localStorage.setItem('lens-width', this.lastWidth);
      }
    });
  }

  update() {
    try {
      if (!this.shadowRoot) return;

      const instances = Array.from(document.querySelectorAll('fx-instance'));
      const editors = Array.from(this.shadowRoot.querySelectorAll('jinn-codemirror'));
      if (!instances.length || !editors.length) return;

      const editorsById = new Map(editors.map(ed => [ed.id || '', ed]));

      const isXmlNode = v =>
        v && typeof v === 'object' && (v.nodeType === 1 || v.nodeType === 9 || v.nodeType === 11); // Element, Document, DocFragment
      const xmlSer = new XMLSerializer();

      for (let i = 0; i < instances.length; i++) {
        try {
          const inst = instances[i];
          const foreId = inst.closest('fx-fore')?.id || '';
          const instId = inst.getAttribute('id') || 'default';
          const key = `${foreId}#${instId}`;

          const editor = editorsById.get(key) || editors[i];
          if (!editor) continue;

          const raw = inst.instanceData;
          let value = '';

          if (raw == null) {
            value = '';
          } else if (typeof raw === 'string') {
            value = raw;
          } else if (isXmlNode(raw)) {
            // Serialize XML Documents/Elements/Fragments
            value = xmlSer.serializeToString(raw);
          } else if (typeof raw === 'object') {
            // Pretty JSON for objects/arrays
            try {
              value = JSON.stringify(raw, null, 2);
            } catch {
              value = String(raw);
            }
          } else {
            value = String(raw);
          }

          editor.value = value;
        } catch (rowErr) {
          console.warn('[fx-lens] update(): skipped one instance due to error:', rowErr);
        }
      }
    } catch (err) {
      console.warn('[fx-lens] update(): failed, but safely ignored:', err);
    }
  }

  /*
  update() {
    const instances = Array.from(document.querySelectorAll('fx-instance'));
    const editors = Array.from(this.shadowRoot.querySelectorAll('jinn-codemirror'));

    for (let i = 0; i < instances.length; i++) {
      editors[i].value = instances[i].instanceData;
    }
  }
*/
}

if (!customElements.get('fx-lens')) {
  customElements.define('fx-lens', FxLens);
}
