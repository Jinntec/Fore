import './fx-action-log.js';

export class FxDevtools extends HTMLElement {

    static get properties() {
        return {
            selector: {
                type: String,
                description: "optional selector to attach to a certain fx-fore element with given id",
            }
        };
    }

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        Object.keys(this.constructor.properties).forEach((propertyName) => {
        	  const property = this.constructor.properties[propertyName];
        	  const attribute = property.attribute || propertyName;
        	  const value = this.getAttribute(attribute) || property.default;
        	  const typedValue = property.type(value);
        	  this[propertyName] = typedValue;
        });

        this.isResizing = false;
        this.lastY = 0;
        this.defaultHeight = '30vh';
    }

    connectedCallback() {
        // window.addEventListener("DOMContentLoaded", (event) => {

        this.render();
        // document.body.style.height = document.body.scrollHeight + 320 + 'px';

        this.resizer = this.shadowRoot.querySelector('.resizer');
        this.resizer.addEventListener('mousedown', this._startResize.bind(this));

        document.addEventListener('mousemove', this._resizePanel.bind(this));
        document.addEventListener('mouseup', this._stopResize.bind(this));


        const optionsTrigger = this.shadowRoot.querySelector('#optionsTrigger');
        optionsTrigger.addEventListener('click', () => {
            const tr = this.shadowRoot.querySelector('#options');
            tr.classList.toggle('open');
        });

        const caption = this.shadowRoot.querySelector('.fx-devtools');
        caption.addEventListener('click', ev => {
            if(ev.target.nodeName === 'DIV' && ev.target.classList.contains('resizer')) {
                return;
            }
            if(ev.target.parentNode.open){
               this.removeAttribute('open');
                this.lastHeight = this.style.height;
                this.style.height='3em';
            }else{
                this.setAttribute('open','');
                this.style.height= this.lastHeight ? this.lastHeight: '30vh';
            }
        });

        this.classList.add('open');
        // });
    }

    _startResize(event) {
        this.isResizing = true;
        this.lastY = event.clientY;
    }

    _resizePanel(event) {

        if (!this.isResizing) return;
        console.log('lastY', this.lastY);
        const delta = event.clientY - this.lastY;
        this.style.height = `${this.offsetHeight - delta}px`;
        this.lastHeight = this.style.height;
        this.lastY = event.clientY;

    }

    _stopResize(event) {
        event.preventDefault();
        event.stopPropagation();
        this.isResizing = false;
        document.body.style.height = 'inherit'; // reset before calculating scrollheight
        document.body.style.width = 'inherit'; // reset before calculating scrollheight
        const newHeight = document.body.scrollHeight + this.offsetHeight;
        document.body.style.height = `${newHeight}px`;
    }

    render() {
        const style = `
      @import '../../resources/fore.css';
      
        :host {
          display:block;
          position:fixed;
          bottom:0;
          left:0;
          width:100vw;
          background:#efefef;
          height:var(--fx-devtools-height);
          font-style:inherit;
          font-family: 'Verdana' , 'Sans';
          font-size:1em;
          max-width:100vw;
          height:3em;
        }
        :host(.open){
            height:30vh;
        }
        
        fx-action-log{
            height:100%;
        }
        fx-dom-inspector{
            max-height:100%;
            height:100%;
            overflow:auto;
            position:relative;
        }
        body {
        }
        button{
            border:none;
            padding:0;
            margin:0;
        }
        details{
            height:100%;
        }
        .dom{
            width:45%;
            border-left:1px solid #999;
        }
        header{
            background:#efefef;
            padding:0.5rem;
            border-bottom:2px solid #ddd;
            font-size:1rem;
            height:1rem;
        }
        .instances{
            width:35%;
            border-left:1px solid #999;
        }
        .panels{
            display:grid;
            grid-template-columns:20% 40% 40%;
            height:100%;
            width:100%;
            max-height:100%;
        }
        .panels > section {
            min-height:20rem;
            background:white;
            position:relative;
            display:inline-block;
            height:100%;
            width:auto;
        }
        #options{
            display:none;
        }
        #options.open{
            position:absolute;
            z-index:10;
            left:0;
            top:3em;
            width:100vw;
            height:100%;
            display:block;
        }
        .resizer{
            width:100vw;
            height:6px;
            background:#ddd;
            cursor: ns-resize;
            position:absolute;
            top:0;
        }
        summary{
            padding:0.5em;
            border-bottom:thin solid #ddd;
            display:flex;
            justify-content:space-between;
        }
        .wrapper{
            height:100%;
        }
        .vertDevider{
            background:#ddd;
            width:4px;
            height:100%;
            cursor: ew-resize;
        }
      `;

        const html = `
        <section class="wrapper">
            <slot></slot>
            <details class="fx-devtools" open>
                <div class="resizer"></div>
                <summary>Fore Devtools <button><img id="optionsTrigger" src="../../resources/images/settings.svg"></button></summary>
                <section class="panels">
                    <section class="log">
                        <fx-action-log selector="${this.selector}"></fx-action-log>
                    </section>
                    <section class="dom">
                        <header>Document</header>
                        <fx-dom-inspector></fx-dom-inspector>
                    </section>
                    <section class="instances">
<fx-dom-inspector instance="default"/>
                    </section>
                    <section id="options">
                        centralized options
                    </section>
                </section>
            </details>
        </section>
      `;

        this.shadowRoot.innerHTML = `
          <style>
              ${style}
          </style>
          ${html}
      `;

    }

    _handleOpen(ev){
        console.log('that works')
        document.body.style.height = '';
    }

}

if (!customElements.get('fx-devtools')) {
    customElements.define('fx-devtools', FxDevtools);
}
