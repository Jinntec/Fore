import {XPathUtil} from "../xpath-util";

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
        max-width:40em;
      }
      .buttons button{
        margin-right:0.5rem;
      }
      .info{
        padding:0.25em;
      }
      ol{
        background: #efefef;
        padding: 0.5em 1.5em;
      }
      li .info{
        margin:0.25em 0;
      }
      .info{
        display:grid;
        grid-template-columns:repeat(2, 1fr);
        background:orange;
      }
      .action.info{
        background:lightblue;
      }
      
      .event-name{
        width:14rem;
        display:inline-block;
      }
/*
      .event-name::before{
        content:'triggered by';
        font-size:0.8em;
        text-decoration:italic;
      }
*/
      #filter{
        padding:1rem;
        display:flex;
      }
      label{
        margin-right:0.5rem;
        white-space:nowrap;
        display:inline-block;
      }
      .log-row{
        margin:0.25em 0;
        padding:0.5em;
        position:relative;
      }
      .log-row.empty-row summary{
        position:relative;
      }
      .log-row.empty-row summary{
        list-style:none;
        padding-left:1rem;
      }
      .log-row.empty-row summary::-webkit-details-marker {
        display: none;
      }
      .outermost{
        background:lightsteelblue;
      }
    `;

    if(localStorage.getItem('fx-action-log-filters')){
      this.listenTo = JSON.parse(localStorage.getItem('fx-action-log-filters'));
    }else {
      this._defaultSettings();
    }


    const html = `
      <details open>
        <summary>Event Log <span class="buttons"><button id="del"">del</a></button></span></summary>
        <details id="filter">
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

    const fore = window.document.querySelector('fx-fore');
    if(!fore){
      console.error('fx-fore element not found in this page.');
    }
    const log = this.shadowRoot.querySelector('#log');
    fore.classList.add('action-log');

    this.listenTo.forEach(eventName => {
      if(eventName.show){
        fore.addEventListener(eventName.name, e => {
          this._log(e,log);
        });
      }
    });

    const boxes = this.shadowRoot.querySelector('.boxes');

    this.listenTo.forEach(item =>{
      const lbl = document.createElement('label');
      lbl.setAttribute('title',item.description);
      lbl.innerText = item.name;
      const cbx = document.createElement('input');
      cbx.setAttribute('type', 'checkbox');
      cbx.setAttribute('name', item.name);
      if(item.show){
        cbx.setAttribute('checked','');
      }
      lbl.append(cbx);
      cbx.addEventListener('click', e =>{
        console.log('filter box ticked', e);
        if(!e.target.checked){
          //remove event listener
          const fore = document.querySelector('fx-fore');
          fore.removeEventListener(item.name,this._log);
          // e.preventDefault();
          // e.stopPropagation();
        }
        const t = this.listenTo.find(evt => evt.name === item.name);
        e.target.checked ? t.show=true:t.show=false;
        // console.log('filter', this.listenTo);
        localStorage.setItem('fx-action-log-filters', JSON.stringify(this.listenTo));
      })
      boxes.appendChild(lbl);
    });

        document.addEventListener('outermost-action-start', e => {
            this.outermost = true;
        },{capture:true});
        document.addEventListener('outermost-action-end', e => {
            this.outermost = false;
            this.outermostAppender = null;
        },{capture:true});

    //buttons
    const del = this.shadowRoot.querySelector('#del');
    del.addEventListener('click', e => {
      this.shadowRoot.querySelector('#log').innerHTML = '';
    });
    const reset = this.shadowRoot.querySelector('#reset');
    reset.addEventListener('click', e => {
      this._defaultSettings();
      localStorage.removeItem('fx-action-log-filters');
      window.location.reload();
    });



  }

  _defaultSettings(){
    this.listenTo=[
      {name:"action-performed",show:true,description:'fired after an action has been performed'},
      {name:"click",show:true,description:''},
      {name:"deleted",show:true,description:'fired after a delete action has been executed'},
      {name:"dialog-shown",show:true,description:'fired when a dialog has been shown'},
      {name:"dialog-hidden",show:true,description:''},
      {name:"error",show:true,description:''},
      {name: "execute-action", show: true, description: ''},
      {name:"init",show:false,description:''},
      {name:"invalid",show:true,description:''},
      {name:"index-changed",show:true,description:''},
      {name:"instance-loaded",show:true,description:''},
      {name:"item-created",show:false,description:''},
      {name:"loaded",show:true,description:''},
      {name:"model-construct",show:true,description:''},
      {name:"model-construct-done",show:true,description:''},
      {name:"nonrelevant",show:true,description:''},
      {name:"optional",show:false,description:''},
      {name:"path-mutated", show:true,description:''},
      {name:"refresh-done", show:true,description:''},
      {name:"readonly",show:true,description:''},
      {name:"readwrite",show:true,description:''},
      {name:"rebuild-done",show:true,description:''},
      {name:"required",show:true,description:''},
      {name:"ready",show:true,description:''},
      {name:"recalculate-done",show:true,description:''},
      {name:"relevant",show:false,description:''},
      {name:"reload",show:true,description:''},
      {name:"select",show:true,description:''},
      {name:"deselect",show:true,description:''},
      {name:"submit",show:true,description:''},
      {name:"submit-error",show:true,description:''},
      {name:"submit-done",show:true,description:''},
      {name:"valid",show:false,description:''},
            {name: "value-changed", show: true, description: ''},
            {name: "outermost-action-start", show: true, description: ''},
            {name: "outermost-action-end", show: true, description: ''}
        ];
  }

  _log(e, log) {
    if(e.target.nodeName === 'FX-ACTION-LOG') return;
    e.preventDefault();
    e.stopPropagation();




    const row = document.createElement('div');
    row.classList.add('log-row');
    const logRow = this._logDetails(e);
    if(e.detail &&
        Object.keys(e.detail).length === 0 &&
        Object.getPrototypeOf(e.detail) === Object.prototype){
      row.classList.add('empty-row');
    }

    row.innerHTML = logRow;

    if(this.outermost){
      /*
      outermost-action-start and outermost-action-end are use as marker events only to start/end a list.
      They don't have aditional information to log.
       */
      if(e.type === 'outermost-action-start') return; // we don't want this event to actualy log something
      if(!this.outermostAppender){
        this.outermostAppender = document.createElement('ol');
        log.append(this.outermostAppender);
      }
      const li = document.createElement('li');
      li.innerHTML = logRow;
      this.outermostAppender.append(li);
    }else{
      log.append(row);
    }
    const logRowTarget = row.querySelector('.event-target');
    if(!logRowTarget) return;

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
     const {type} = e;
     // console.log('>>>> event type', type)
    const path = XPathUtil.getPath(e.target);
    switch (type){
      case 'outermost-action-start':
        return `start`;
        break;
      case 'outermost-action-end':
        return ``;
        break;
      case 'execute-action':
        const stripped = e.detail.action.nodeName.split('-')[1];

        switch (e.detail.action.nodeName){
          case 'FX-SEND':
            return `
              <div class="info action"
                  <label class="action-name">${stripped} ${e.detail.action.getAttribute('submission')}</label>
                  <a href="#" class="event-name">${e.detail.event}</a>
              </div>
            `;
            break;
          default:
            return `
              <div class="info action">
                  <label class="action-name">${stripped}</label>
                  <a href="#" class="event-name">${e.detail.event}</a>
              </div>
            `;
        }
        break;
      default:
        return `
        <div class="info event"
            <label class="event-name">${e.type}</label>
            <a href="#" class="event-target" title="${path}">${e.target.nodeName.toLowerCase()}</a>
          ${this._listAttributes(e)}
        </div>
    `;

    }

    // }
  }

  _listAttributes(e){
    console.log('_listAttributes',e)
    return ``;
    // return `${e.detail.model.id}`;
/*
    if(e.detail &&
        Object.keys(e.detail).length === 0 &&
        Object.getPrototypeOf(e.detail) === Object.prototype){
      return ``;
    }else{
      return `${e.detail.map((item) => `<span>${item}</span>`)}`;
    }
*/
  }

  _highlight(element) {
        const defaultBG = element.style.backgroundColor;
        const defaultTransition = element.style.transition;

    element.style.transition = "background 1s";
    element.style.backgroundColor = "#FDFF47";

        setTimeout(() => {
      element.style.backgroundColor = defaultBG;
            setTimeout(() => {
        element.style.transition = defaultTransition;
      }, 400);
    }, 400);
  }

}
if (!customElements.get('fx-action-log')) {
  customElements.define('fx-action-log', FxActionLog);
}
