import '../ui/fx-action-log.js';
export class FxDevtools extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isResizing = false;
    this.lastY = 0;
  }

  connectedCallback() {
    window.addEventListener("DOMContentLoaded", (event) => {
        this.render();
        // document.body.style.height = document.body.scrollHeight + 320 + 'px';

        this.resizer = this.shadowRoot.querySelector('.resizer');
        this.resizer.addEventListener('mousedown', this._startResize.bind(this));

        document.addEventListener('mousemove', this._resizePanel.bind(this));
        document.addEventListener('mouseup', this._stopResize.bind(this));

        this.vertResize1 = this.shadowRoot.querySelector('.vertDevider');
        this.vertResize1.addEventListener('mousedown',this._startVertResize.bind(this));

    });
  }

  _startVertResize(event){
      this.isResizing=true;
      this.lastX = event.clientX;
  }
  _resizeVertical(event){
      if(!this.isResizing) return;
      console.log('resize' ,this)
      const delta = event.clientX - this.lastX;

      const mainPanel = this;
      mainPanel.style.width = `${mainPanel.offsetWidth - delta}px`;
      this.lastX = event.clientX;
  }

  _startResize(event){
      this.isResizing = true;
      this.lastY = event.clientY;
  }

  _resizePanel(event){


      if(!this.isResizing) return;

      console.log('lastX', this.lastX);
      console.log('lastY', this.lastY);

      if(this?.lastX && this.lastX !== event.clientX){
          const delta = event.clientY - this.lastY;

          const log = this.shadowRoot.querySelector('.log');

          log.style.width = `${log.offsetHeight - delta}px`;
          this.lastX = event.clientX;
      }else{
          console.log('resize' ,this)
          const delta = event.clientY - this.lastY;
          this.style.height = `${this.offsetHeight - delta}px`;
          this.lastY = event.clientY;
      }

  }

  _stopResize(event){
    this.isResizing = false;
    document.body.style.height = 'inherit'; //reset before calculating scrollheight
    document.body.style.width = 'inherit'; //reset before calculating scrollheight
    const newHeight = document.body.scrollHeight + this.offsetHeight;
    document.body.style.height = `${newHeight}px`;
  }

  render(){
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
          font-size:0.8em;
          max-width:80vw;
        }
        fx-action-log{
            height:100%;
        }
        fx-dom-inspector{
            max-height:100%;
            height:100%;
            overflow:auto;
        }
        body {
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
                <summary>Fore Devtools</summary>
                <section class="panels">
                    <section class="log">
                        <fx-action-log></fx-action-log>
                    </section>
                    <section class="dom">
                        <header>Document</header>
                        <fx-dom-inspector></fx-dom-inspector>
                    </section>
                    <section class="instances">
                        <header>Data</header>
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
}
if (!customElements.get('fx-devtools')) {
  customElements.define('fx-devtools', FxDevtools);
}
