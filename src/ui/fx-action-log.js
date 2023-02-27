
export class FxActionLog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.listenTo = [];
    this.listeners = [];
  }

  connectedCallback() {
    const style = `
      :host {
        display:block;
        margin-top:1rem;
        position:relative;
      }
      .buttons button{
        margin-right:0.5rem;
      }
      .event-name{
        width:14rem;
        display:inline-block;
      }
      #filter{
        padding:1rem;
        display:flex;
      }
      label{
        margin-right:0.5rem;
        border:thin solid #efefef;
        white-space:nowrap;
        width:12rem;
        display:inline-block;
      }
    `;

    if(localStorage.getItem('fx-action-log-filters')){
      this.listenTo = JSON.parse(localStorage.getItem('fx-action-log-filters'));
    }else {
      this._defaultSettings();
    }


    const html = `
      <details open>
        <summary>Action Log <span class="buttons"><button id="del"">del</a></button></span></summary>
        <details id="filter" open>
            <summary>filter <button id="reset">reset filters</button></summary>
            <div class="boxes"></div>
        </details>
        <div id="log"></div>
      </details>
    `;

    this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
        ${html}
    `;
    const fore = this.parentNode;
    if(!fore || fore.nodeName !== 'FX-FORE'){
      console.error('Fore not found. fx-fore element must be a direct parent of fx-action-log');
    }
    const log = this.shadowRoot.querySelector('#log');
    fore.classList.add('action-log');

    this.listenTo.forEach(eventName => {
      if(eventName.show){
        fore.addEventListener(eventName.name, e => {
          this._log(e,log);
        });
      }
    })

    const boxes = this.shadowRoot.querySelector('.boxes');

    this.listenTo.forEach(item =>{
      const lbl = document.createElement('label');
      lbl.innerText = item.name;
      const cbx = document.createElement('input');
      cbx.setAttribute('type', 'checkbox');
      cbx.setAttribute('name', item.name);
      if(item.show){
        cbx.setAttribute('checked','');
      }
      lbl.append(cbx);
      cbx.addEventListener('click', e =>{
        console.log('filter box ticked', e)
        if(!e.target.checked){
          //remove event listener
          const fore = document.querySelector('fx-fore');
          fore.removeEventListener(item.name,this._log);
          // e.preventDefault();
          // e.stopPropagation();
        }
        const t = this.listenTo.find(evt => evt.name === item.name);
        e.target.checked ? t.show=true:t.show=false
        // console.log('filter', this.listenTo);
        localStorage.setItem('fx-action-log-filters', JSON.stringify(this.listenTo));
      })
      boxes.appendChild(lbl);
    });

    //buttons
    const del = this.shadowRoot.querySelector('#del');
    del.addEventListener('click', e => {
      this.shadowRoot.querySelector('#log').innerHTML = '';
    })
    const reset = this.shadowRoot.querySelector('#reset');
    reset.addEventListener('click', e => {
      this._defaultSettings();
      localStorage.removeItem('fx-action-log-filters');
      window.location.reload();
    });



  }

  _defaultSettings(){
    this.listenTo=[
      {name:"action-performed",show:true},
      {name:"deleted",show:true},
      {name:"dialog-shown",show:true},
      {name:"dialog-hidden",show:true},
      {name:"error",show:true},
      {name:"init",show:false},
      {name:"invalid",show:true},
      {name:"index-changed",show:true},
      {name:"item-created",show:false},
      {name:"loaded",show:true},
      {name:"model-construct",show:true},
      {name:"model-construct-done",show:true},
      {name:"nonrelevant",show:true},
      {name:"optional",show:true},
      {name:"path-mutated", show:true},
      {name:"refresh-done", show:true},
      {name:"readonly",show:true},
      {name:"readwrite",show:true},
      {name:"rebuild-done",show:true},
      {name:"required",show:true},
      {name:"ready",show:true},
      {name:"reload",show:true},
      {name:"select",show:true},
      {name:"deselect",show:true},
      {name:"submit",show:true},
      {name:"submit-error",show:true},
      {name:"submit-done",show:true},
      {name:"valid",show:false},
      {name:"value-changed",show:true}
    ]
  }

  _log(e, log) {
    e.preventDefault();
    e.stopPropagation();

    const row = document.createElement('div');
    row.classList.add('log-row');
    const logRow = this._logDetails(e);
    row.innerHTML = logRow;

    log.append(row);

    // const parser = new DOMParser();
    // const logElements =  parser.parseFromString(logRow, 'text/html')
    // const logRowTarget = logElements.querySelector('.target');
    const logRowTarget = row.querySelector('.target');
    const targetElement = e.target;
    logRowTarget.addEventListener('click', e => {
      const alreadyLogged = document.querySelectorAll('.fx-action-log-debug');
      alreadyLogged.forEach(logged => {
        logged.classList.remove('fx-action-log-debug')
      });

      targetElement.dispatchEvent(
          new CustomEvent('log-action', {
            composed: false,
            bubbles: true,
            cancelable:true,
            detail: { target:targetElement },
          }),
      );


      targetElement.classList.add('fx-action-log-debug');
      targetElement.setAttribute('data-name', targetElement.nodeName)
      this._highlight(targetElement);

    });
    // log.append(logElements);
  }

  _logDetails(e){
    return `
<!--      <div class="log-row">-->
        <span class="event-name">
          <label></label>
          <span>${e.type}</span>
        </span>
        -->
        <a href="#>"<span class="target">
          <label></label>
          <span class="targetNode">${e.target.nodeName}</span>
        </span></a>
<!--      </div>-->
    `;
  }

  _highlight(element) {
    let defaultBG = element.style.backgroundColor;
    let defaultTransition = element.style.transition;

    element.style.transition = "background 1s";
    element.style.backgroundColor = "#FDFF47";

    setTimeout(function()
    {
      element.style.backgroundColor = defaultBG;
      setTimeout(function() {
        element.style.transition = defaultTransition;
      }, 400);
    }, 400);
  }

}
if (!customElements.get('fx-action-log')) {
  customElements.define('fx-action-log', FxActionLog);
}
