import {Fore} from "../fore.js";


/**
 * lists out all live instances in html 'details' and 'summary' elements.
 */
export class FxInspector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const style = `
          :host {
            position:fixed;
            display: block;
            width:var(--inspector-handle-width);
            background:var(--inspector-bg);
            top:0;
            right:0;
            bottom:0;
            height: 100vh;
            background: var(--inspector-bg);
            color: white;
            /*max-height: 33%;*/
            overflow: scroll;
            border-top:3px solid var(--paper-blue-500);
            transition:width 0.3s ease;
          }
          :host([open]){
            width: 30%;
          }
          details{
            margin:1rem;
          }
          .main{
            padding-left:var(--inspector-handle-width);
            color:var(--inspector-color);
            overflow:scroll;
          }
          pre{
            background:var(--inspector-pre-bg);
            color:var(--inspector-color);
            overflow:scroll;
            padding:0.2rem;
          }
          .handle{
            display:block;
            height:100vh;
            width:var(--inspector-handle-width);
            background:var(--inspector-handle-bg);
            opacity:0.7;
            position:absolute;
            left:0;
            color:white;
            cursor:pointer;
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
          }
          summary{
            cursor:pointer;
          }
        `;

        const fore = document.querySelector('fx-fore');
        const instances = Array.from(document.querySelectorAll('fx-instance'));

        // fore.addEventListener('ready', (e) => {
            this.render(style);
        // });
        fore.addEventListener('refresh-done', (e) => {
            this.update();
        });

    }

    update(){
        console.log('update');
        const pre = this.shadowRoot.querySelectorAll('pre');
        console.log('pre',pre);
        const fore = document.querySelector('fx-fore');

        Array.from(pre).forEach(pre => {
            console.log('pre',pre.getAttribute('id'));
            const inst = fore.getModel().getInstance(pre.getAttribute('id'));
            if(inst.type === 'xml'){
                pre.innerText = this.serializeDOM(inst.instanceData);
            }
            if(inst.type === 'json'){
                pre.innerText = JSON.stringify(inst.instanceData, undefined, 2)
            }
        });


    }
    render(style) {
        const instances = Array.from(document.querySelectorAll('fx-instance'));
        this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            <div class="main">
            <slot></slot>
            <span class="handle"></span>
                ${instances.map((instance, index) => `
                  <details open>
                      <summary>${instance.id}</summary>
                      <pre id="${instance.id}"></pre>
                  </details>
                `,
                )}
            </div>
        `;
/*
        this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            <div class="main">
            <slot></slot>
            <span class="handle"></span>
                ${instances.map((instance, index) => `
                  <details open>
                      <summary>${instance.id}</summary>
                      ${instance.type === 'xml' ?
                        `<pre>${this.serializeDOM(instance.instanceData)}</pre>` : ""}

                      ${instance.type === 'json' ?
                        `<pre>${JSON.stringify(instance.instanceData, undefined, 2)}</pre>` : ''}
                  </details>
                `,
                )}
            </div>
        `;
*/

        const handle = this.shadowRoot.querySelector('.handle');
        handle.addEventListener('click',(e)=>{
            console.log('toggling');
            const {target} = e;
            if(this.hasAttribute('open')){
                this.removeAttribute('open');
            }else{
                this.setAttribute('open','open');
            }
        });

    }


    serializeDOM(data){
        console.log('serializeDOM',data);
        const ser = new XMLSerializer().serializeToString(data);
        // console.log('ser', ser);
        return Fore.prettifyXml(ser);
        // return "<foo>bar</foo>";
        // return {log('${id}')}`;
        // return data;
    }

}

customElements.define('fx-inspector', FxInspector);
