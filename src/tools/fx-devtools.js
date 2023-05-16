import './fx-action-log.js';
import './fx-dom-inspector.js';
import './fx-json-instance.js';
// import './fx-minimap.js';

export class FxDevtools extends HTMLElement {

    static get properties() {
        return {
            fore:{
                type:Object,
                description:"The fx-fore element the devtools are attached to"
            },
            instances:{
                type:Array,
                description:"Instances of selected Fore element"
            },
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
        this.defaultHeight = '40vh';

		this.buttonByInstanceId = new Map();

        window.addEventListener("DOMContentLoaded", (event) => {
            console.log("DOM fully loaded and parsed");
            this.fore = document.querySelector('fx-fore');
            this.fore.addEventListener('model-construct-done', () => {
                this.instances = [...this.fore.getModel().instances];
                console.log('instances',this.instances);
                const header = this.shadowRoot.querySelector('.instances header');
                header.textContent = 'Data ';
                this.instances.forEach(instance => {
                    const btn = document.createElement('button');
                    btn.setAttribute('type','button');
                    btn.textContent = instance.id;
                    header.appendChild(btn);
					this.buttonByInstanceId.set(instance.id, btn);
                    btn.addEventListener('click', () => this.selectInstance(instance.id));
                });
                this.selectInstance(this.instances[0].id);
            });
        });

		window.document.addEventListener('log-active-element', (e) => {
			const target = e ? e.detail?.target || e.target : window.event.srcElement;


			const instance = this.instances.find(
				instance => {
					if (instance.type !== 'xml') {
						// TODO: handle JSON instances!
						return false;
					}
					return instance.instanceData.contains(target)
				});
            // const instance = this._getInstanceForTarget(target);

			if (instance) {
				this.selectInstance(instance.id);
			}
		});
    }

    _getInstanceForTarget(node){
        this.instances.forEach(instance => {
            if(instance.type === 'xml' && instance.instanceData.contains(node)){
                return instance;
            }
            if(instance.type === 'json'){
                return instance;
            }
        });
    }

	selectInstance (instanceId) {
		const button = this.buttonByInstanceId.get(instanceId);
		if (!button) {
			return;
		}
		if (button.classList.contains('selected-btn')) {
			return;
		}

		const selectedBtn = this.shadowRoot.querySelector('.selected-btn');
        if(selectedBtn){
            selectedBtn.classList.remove('selected-btn');
        }

        button.classList.add('selected-btn');

        const instancePanel = this.shadowRoot.querySelector('.instance-panel');
        instancePanel.innerHTML = "";

        this.instances = [...this.fore.querySelectorAll('fx-instance')];
        const instance = Array.from(this.instances).find(inst => inst.id === instanceId);
        console.log('wanted instance', instance);

        const panelContent = this._renderInstancePanel(instance);
        console.log('panelContent', panelContent);
        // instancePanel.innerHTML = panelContent;
        instancePanel.append(panelContent);
	}

    connectedCallback() {
        this.render();
        // document.body.style.height = document.body.scrollHeight + 320 + 'px';
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
          height:var(--fx-devtools-height);
          font-style:inherit;
          font-family: 'Verdana' , 'Sans';
          font-size:1em;
          max-width:100vw;
          height:3em;
        }
        :host(.open){
            height:40vh;
        }
        
        fx-action-log{
            height:100%;
        }
        fx-dom-inspector{
            max-height:100%;
            height:100%;
            position:relative;
        }
        body {
        }
        details{
            height:100%;
            background:#ebf6ff;
        }
        .dom{
            width:45%;
            border-left:1px solid #999;
            position:relative
        }
        .dom fx-minimap{
            position:absolute;
            right:0;
            top:0;
            width:5rem;
            height:6rem;
        }
        header{
            padding:0.5rem;
            border-bottom:2px solid #ddd;
            font-size:1rem;
        }
        header button{
            margin:0 0.5em;
            border:thin solid #999;
            padding:0 0.5em;
            cursor:pointer;
        }
        header button:hover{
            background:white;
        }
        
        header button.selected-btn{
            background:steelblue;
            color:white;
        }
        .instances{
            width:35%;
            border-left:1px solid #999;
        }
        .instance-panel{
            height:100%;
            overflow:auto;
        }
        .panels{
            display:grid;
            grid-template-columns:20% 50% 30%;
            height:100%;
            width:100%;
            max-height:100%;
            border-top:thin solid #ddd;
        }
        .panels > section {
            min-height:20rem;
/*
            background:#efefef;
*/
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
            height:100%;
            display:block;
            padding:0;
            background:rgba(255,255,255,0.95);
            width:100%;
        }
        .optionsBtn{
            font-size:2rem;
            display:none;
        }
        details[open] .optionsBtn{
            display:inline;
        }
        .resizer{
            width:100vw;
            height:6px;
            background:rgba(215,220,235,0.3);
            cursor: ns-resize;
            position:absolute;
            top:0;
            
        }
        summary{
            height:3rem;
            padding:0 1em;
            border-bottom:2px solid #ddd;
            display:flex;
            justify-content:space-between;
            align-items:center;
            color:rgba(0,0,0,0.7);
            background: rgba(235, 255, 255, 0.2);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            
            color:white;
            font-weight:300;
                      background: rgb(119,119,119);
          background: linear-gradient(90deg, rgba(0,85,159,0.75) 0%, rgba(56,154,252,0.5) 50%, rgba(255,255,255,0.1) 100%);

        }
        summary button{
            padding:0;
            border:0;
            background:transparent;
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
        console.log('render instances',this.instances);

        const html = `
        <section class="wrapper">
            <slot></slot>
            <details class="fx-devtools" open>
                <div class="resizer"></div>
                <summary>Fore Glass <button class="optionsBtn" id="optionsTrigger">&#9881;</button></summary>
                <section class="panels">
                    <section class="log">
                        <fx-action-log selector="${this.selector}"></fx-action-log>
                    </section>
                    <section class="dom">
                        <fx-dom-inspector>
                            <header slot="header">Document</header>
                        </fx-dom-inspector>
                    </section>
                    <section class="instances">
                        <header></header>
                        <div class="instance-panel">
                        </div>
                    </section>
                    <section id="options">
                        <fx-log-settings></fx-log-settings>
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

        // resizing handler
        this.resizer = this.shadowRoot.querySelector('.resizer');
        this.resizer.addEventListener('mousedown', this._startResize.bind(this));
        document.addEventListener('mousemove', this._resizePanel.bind(this));
        document.addEventListener('mouseup', this._stopResize.bind(this));

        // setup handler for option button on the right of the panel
        const optionsTrigger = this.shadowRoot.querySelector('#optionsTrigger');
        optionsTrigger.addEventListener('click', () => {
            const tr = this.shadowRoot.querySelector('#options');
            tr.classList.toggle('open');
            tr.classList.contains('open')? optionsTrigger.style.background = 'lightsteelblue': optionsTrigger.style.background = 'transparent';
        });

        // opening/closing the devtools
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
                this.style.height= this.lastHeight ? this.lastHeight: '40vh';
            }
        });

        this.classList.add('open');

        document.addEventListener('value-changed', e =>{
            console.log('value-changed hitting glass', e.target);
        })

    }

    _handleOpen(ev){
        console.log('that works')
        document.body.style.height = '';
    }

    _renderInstancePanel(instance){
        if(instance.type === 'xml'){
            const domInpector = document.createElement('fx-dom-inspector');
            domInpector.setAttribute('instance', instance.id);
            return domInpector;

            /*
                        return
                            `<fx-dom-inspector instance="${instance.id}"> </fx-dom-inspector>`
            */
        } if(instance.type === 'json'){
            const jsonInspector = document.createElement('fx-json-instance');
            jsonInspector.setAttribute('instance', instance.id);
            const span = document.createElement('span');
            span.setAttribute('slot','header');
            jsonInspector.append(span);
            return jsonInspector;
/*
            return `
                <fx-json-instance instance="${instance.id}">
                    <span slot="header"></span>
                </fx-json-instance>
            `
*/
        }
    }
}

if (!customElements.get('fx-devtools')) {
    customElements.define('fx-devtools', FxDevtools);
}
