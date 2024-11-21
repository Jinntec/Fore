import './jinn-codemirror-bundle.js';

/**
 * lists out all live instances in html 'details' and 'summary' elements.
 */
export class FxLens extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    connectedCallback() {
        const style = `
          :host {
            position:absolute;
            display: block;
            width:var(--inspector-handle-width);
            top:0;
            right:0;
            bottom:0;
            height: 100%;
            background: aliceblue;
            color: white;
            /*max-height: 33%;*/
            overflow: scroll;
            // transition:width 0.3s ease;
            z-index:900;
            max-width:calc(100vw - var(--inspector-handle-width));
            min-width:var(--inspector-handle-width);
          }
          jinn-codemirror{
            min-height:5rem;
          }
          :host([open]){
            width: 40vw;
          }
          details{
            margin:0;
            width:100%;
            position:relative;
          }
          .main{
            padding-left:var(--inspector-handle-width);
            color:var(--inspector-color);
            overflow:scroll;
            height:100%;
            background:ghostwhite);
          }
          pre{
            background:var(--inspector-pre-bg);
            color:var(--inspector-color);
            overflow:scroll;
            padding:0.2rem;
          }
          .handle{
            display:block;
            height:100%;
            width:var(--inspector-handle-width);
            background:var(--inspector-handle-bg);
            opacity:0.7;
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
            content: 'Data Inspector';
            white-space: nowrap;
            transform: rotate(-90deg);
            display: inline-block;
            position: absolute;
            left: -85px;
            width: 200px;
            top: 40px;
            z-index:801;
          }
          .fore-section summary{
            cursor:pointer;
            padding:1rem 0.5rem;
            background:papayawhip;
            font-size:1.2rem;
            
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
            width:0.5rem;
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

        this.mode = 'xml';
        this.isResizing = false;
        this.lastX = 0;

        // this.fores = Array.from(document.querySelectorAll('fx-fore'));
        document.addEventListener('DOMContentLoaded', () => {
            this.fores = Array.from(document.querySelectorAll('fx-fore'));
            this.render(style);

            document.addEventListener('ready',(ev)=>{
                const fores = Array.from(document.querySelectorAll('fx-fore'));
            });
            this.fores.forEach(fore => {
                fore.addEventListener('ready', () => {
                    this.render(style);
                });
                fore.addEventListener('value-changed',(ev)=>{
                    // todo: update only the affected instance
                    this.update();
                });
            });
            this.lastWidth = this.offsetWidth;


        });

    }

    update() {
        const instances = Array.from(document.querySelectorAll('fx-instance'));
        const editors = Array.from(this.shadowRoot.querySelectorAll('jinn-codemirror'));

        for (let i = 0; i < instances.length; i++) {
            editors[i].value = instances[i].instanceData;
        }
        // document.addEventListener('refresh-done',() => this.update());
    }

    async render(style) {
        const fores = Array.from(document.querySelectorAll('fx-fore'));
        const instances = Array.from(document.querySelectorAll('fx-instance'));
        const openPanels = JSON.parse(localStorage.getItem('lens-panels') || '[]');
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
          <details class="main" open>
              <div class="resizer"></div>  
              <summary class="handle"></summary>
                ${instances.map((instance,index) => {
                    const foreId = instance.closest('fx-fore').id;
                    return `<details  id="d${index}" class="instance"><summary>${foreId}#${instance.id}</summary><jinn-codemirror mode="${instance.type}"></jinn-codemirror></details>`
                }).join('')}
          </details>
        `;

        const lensWidth = localStorage.getItem('lens-width');
        if(lensWidth){
            this.style.width = lensWidth;
        }else{
            localStorage.setItem('lens-width', '40vw');
        }

        const main = this.shadowRoot.querySelector('.main');
        const opened = localStorage.getItem('lens-open');
        if(opened){
            if(opened === 'true'){
                main.setAttribute('open','open');
            }else{
                main.removeAttribute('open');
                this.removeAttribute('open');
                this.removeAttribute('style');
            }
        }else{
            main.setAttribute('open','open');
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
                localStorage.setItem('lens-open','false');
            } else {
                this.setAttribute('open', 'open');
                if(lensWidth){
                    this.style.width = lensWidth;
                }
                localStorage.setItem('lens-open','true');
            }
        });

        const sections = this.shadowRoot.querySelectorAll('summary');
        Array.from(sections).forEach(sec => {
            sec.addEventListener('click', (ev) => {

                const details = ev.target.parentNode;
                const id = details.id;
                const panes = JSON.parse(localStorage.getItem('lens-panels') || '[]');
                if(!details.hasAttribute('open')){
                    if(!panes.includes(id)){
                        panes.push(id);
                        localStorage.setItem('lens-panels', JSON.stringify(panes));
                    }
                }else{
                    if(panes.includes(id)){
                        const idx = panes.indexOf(id);
                        panes.splice(idx,1);
                        localStorage.setItem('lens-panels',JSON.stringify(panes))
                    }
                }
            })
        });
        const detailSections = this.shadowRoot.querySelectorAll('details.instance');
        Array.from(detailSections).forEach(sect => {
            if(openPanels.includes(sect.id)){
                sect.setAttribute('open','open');
            }else{
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
/*
            event.preventDefault();
            event.stopPropagation();
*/

            if (!this.isResizing) return;
            const delta =  event.clientX - this.lastX;
            console.log('_resizePanel',delta);
            this.style.width = `${this.lastWidth - delta}px`;

        });
        document.addEventListener('mouseup', event => {
            event.preventDefault();
            event.stopPropagation();
            this.isResizing = false;
            this.lastX = event.clientX;
            this.lastWidth = this.style.width;
            localStorage.setItem('lens-width',this.lastWidth);
        });

    }

}

if (!customElements.get('fx-lens')) {
    customElements.define('fx-lens', FxLens);
}
