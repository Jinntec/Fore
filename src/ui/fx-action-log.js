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
        position:relative;
        max-width:40em;
        border:thin solid #efefef;
        background:white;
        font-family: Verdana, Sans;
      }
      a{
        position:relative;
      }
      a[alt]:hover::after {
        content:attr(alt);
        position:absolute; 
        left:0;
        top:1em;
        border.thin solid;
        padding:0.5em;
        background:white;
        z-index:1;
        min-width:5em;
        border:thin solid;
        white-space:nowrap;
        overflow-wrap:break-word;
      }
      
      
      .boxes{
        column-width:10em;
      }
      
      .boxes label{
        width:10em;
      }
      .buttons button{
        margin-right:0.5rem;
      }
      button{
        float:right;
      }
      button#del{
        border:none;
        background:transparent;
        width:2.25rem;
        height:2.25rem;
        cursor:pointer;
      }
      .info{
        padding:0.5em;
        margin:0.1rem 0;
        background:#f5f5f5;
        position:relative;
        display:grid;
        grid-gap:0.5em;
        grid-template-areas: "left right"
                    "bottom .";
        grid-template-columns: 50% 50%;

      }
      .info label{
        grid-area:left;
      }
      .info a{
        grid-area:right;
      }
      .info .details{
        height:0;
        opacity:0;
       
      }
      
      .info:hover{
        outline:3px solid lightblue;       
      }

      .info:hover .details{
        grid-area:bottom;
        display:grid;
        grid-template-columns:50% 50%;
        transition: all .6s;
        opacity:1;   
        height:auto;  
      }

      ol{
        background: #efefef;
        padding: 0.5em 1.5em;
        border-left:3px solid;
      }
      li .info{
        margin:0.25em 0;
      }
      .action.info{
        background: white;
        border: 1px black solid;
        border-collapse: collapse;
      }
      
      .event-name{
        width:14rem;
        display:inline-block;
      }
      #filter{
        padding:1rem;
        display:flex;
        margin-bottom:1rem;
        border:thin solid #efefef;
      }
      label{
        margin-right:0.5rem;
        white-space:nowrap;
        display:inline-block;
      }
      .log-row{
        margin:0;
        padding:0;
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
       summary{
        padding:1em;
      }
    `;

    if(localStorage.getItem('fx-action-log-filters')){
      this.listenTo = JSON.parse(localStorage.getItem('fx-action-log-filters'));
    }else {
      this._defaultSettings();
    }


    const html = `
      <details open class="outer-details">
        <summary>Action Log <span class="buttons"><button id="del"">
        <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"></path></g></svg></a></button></span></summary>
        <details id="filter">
            <summary>show events <button id="reset">reset to default</button></summary>
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

    /*
    build the list of checkboxes for the filtering settings
     */
    this.listenTo.forEach(item =>{
      const lbl = document.createElement('label');
      lbl.setAttribute('title',item.description);
      lbl.setAttribute('for',item.name);
      lbl.innerText = item.name;


      const cbx = document.createElement('input');
      cbx.setAttribute('type', 'checkbox');
      cbx.setAttribute('name', item.name);
      cbx.setAttribute('id',item.name);
      if(item.show){
        cbx.setAttribute('checked','');
      }
      boxes.append(cbx);
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
    this.listenTo = [
      {name: "action-performed", show: false, description: 'fired after an action has been performed'},
      {name: "click", show: false, description: ''},
      {name: "deleted", show: false, description: 'fired after a delete action has been executed'},
      {name: "dialog-shown", show: false, description: 'fired when a dialog has been shown'},
      {name: "dialog-hidden", show: false, description: ''},
      {name: "error", show: false, description: ''},
      {name: "execute-action", show: true, description: ''},
      {name: "init", show: false, description: ''},
      {name: "invalid", show: false, description: ''},
      {name: "index-changed", show: false, description: ''},
      {name: "instance-loaded", show: false, description: ''},
      {name: "item-created", show: false, description: ''},
      {name: "loaded", show: false, description: ''},
      {name: "model-construct", show: false, description: ''},
      {name: "model-construct-done", show: false, description: ''},
      {name: "nonrelevant", show: false, description: ''},
      {name: "optional", show: false, description: ''},
      {name: "path-mutated", show: false, description: ''},
      {name: "refresh-done", show: false, description: ''},
      {name: "readonly", show: false, description: ''},
      {name: "readwrite", show: false, description: ''},
      {name: "rebuild-done", show: false, description: ''},
      {name: "required", show: false, description: ''},
      {name: "ready", show: false, description: ''},
      {name: "recalculate-done", show: false, description: ''},
      {name: "relevant", show: false, description: ''},
      {name: "reload", show: false, description: ''},
      {name: "select", show: false, description: ''},
      {name: "deselect", show: false, description: ''},
      {name: "submit", show: false, description: ''},
      {name: "submit-error", show: false, description: ''},
      {name: "submit-done", show: false, description: ''},
      {name: "valid", show: false, description: ''},
      {name: "value-changed", show: false, description: ''},
      {name: "outermost-action-start", show: false, description: ''},
      {name: "outermost-action-end", show: false, description: ''}
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
    const cut = path.substring(path.indexOf('/fx-fore'), path.length);;
    const xpath = "/" + cut;
    const short = cut.replaceAll('fx-','');

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
            const submission = document.querySelector('#'  + e.detail.action.getAttribute('submission'));

            return `
              <div class="info action">
                  <label class="action-name">${stripped}</label>
                  <a href="#" class="event-name" alt="${short}" data-path="${xpath}">${e.detail.event}</a>
                  <div class="details">
                    ${Array.from(submission.attributes).map((item) => {
                      return `
                        <span class="attr-name">${item.nodeName}</span>
                        <span class="attr-value">${item.nodeValue}</span>
                      `;
                    }).join('')}                 
                  </div>
              </div>
            `;
            break;
          case 'FX-SETVALUE':
/*
            if(event.target.nodeName === "FX-CONTROL"){
              const control = event.target;
              return `
              <div class="info control">
                  <label class="control-name">CONTROL ${control.getAttribute('ref')} - '${control.value}'</label>
                  <a href="#" class="event-name" alt="${short}" data-path="${xpath}">${e.detail.event}</a>
              </div>
            `;
            }else{
*/
              return `
              <div class="info action">
                  <label class="action-name">${stripped} ${e.detail.action.getAttribute('ref')} - '${e.detail.value}'</label>
                  <a href="#" class="event-name" alt="${short}" data-path="${xpath}">${e.detail.event}</a>
                  <div class="details">
                  </div>
              </div>
            `;
            // }
            break;
          default:
            return `
              <div class="info action">
                  <label class="action-name">${stripped}</label>
                  <a href="#" class="event-name" alt="${short}" data-path="${xpath}">${e.detail.event}</a>
                  <div class="details">
                  </div>
              </div>
            `;
        }
        break;
      default:
        return `
        <div class="info event"
            <label class="event-name">${e.type}</label>
            <a href="#" class="event-target" alt="${short} "data-path"${xpath}">${e.target.nodeName.toLowerCase()}</a>
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
