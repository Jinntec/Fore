import { XPathUtil } from '../xpath-util';
import './fx-log-item.js';
import { FxLogSettings } from './fx-log-settings.js';

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
        width:100%;
        border:thin solid #efefef;
        background:transparent;
        font-family: Verdana, Sans;
        margin:0;
        padding:0.25rem;
      }
      a,a:link,a:visited{
        color:black;
      }
      a{
        position:relative;
      }
      a[alt]:hover::after {
        content:attr(alt);
        position:absolute; 
        left:0;
        bottom:-0.5em;
        border:thin solid;
        padding:0.5em;
        background:white;
        z-index:1;
        min-width:5em;
        border:thin solid;
        max-width:90%;
      }
     .details{
        padding:0.25em 0;
      }

      .key{
        width:20%;
        display:inline-block;
        min-width:5rem;
        border-bottom:1px solid #ddd;
        background:#efefef;
        vertical-align:top;
      }
      .value{
        display:inline-block;
        width:60%;
        
      }
      
      .buttons{
        position:absolute;
        top:0;
        right:0;
      }
      .buttons button{
        padding:0;
      }
      button{
        float:right;
      }
      button{
        border:none;
        background:transparent;
        width:2.25rem;
        height:2.25rem;
        cursor:pointer;
      }
      button#reset{
        padding:0;
        height:1rem;
      }
     .info{
        padding:0 0.5em;
        margin:0.1rem 0;
        background:white;
        position:relative;
        display:grid;
        grid-template-areas: "left right"
                    "bottom .";
        grid-template-columns: 75% 25%;
      }
      .info a{
        grid-area:right;
        justify-self:end;
      }
      .details > section{
        display:flex;
        flex-wrap:wrap;
        padding:0.5em 0;
      }
      fx-log-item{
      }
      header{
        padding:0.5rem;
        margin:0;
        border-bottom:2px solid #ddd;
      }
      
      .info:hover{
        outline:3px solid lightblue;       
        transition:height 0.4s;
      }

      ol{
        background: #efefef;
        padding: 0.5em 0 0 2em;
        border-left:3px solid red;
      }
     
      .event-name{
        display:inline-block;
      }
      #log{
        margin-bottom:10em;
        margin-right:2em;
      }
      .log-row{
        margin:0;
        padding:0;
        position:relative;
        font-size:0.8em;
        border-left:4px solid transparent;
        padding-left:5px;
        width:calc(100% - 2em);
        margin-bottom:0.25em;
      }
      .log-row summary{
        display:flex;
        flex-wrap:wrap;
        padding:0.5em 0;
        cursor:pointer;
      }
      .log-row summary > span {
        width:calc(90% div 3);
      }

      .log-name{
        position:relative;
      }
      .short-info{
        flex:3;
        overflow:hidden;
        white-space:nowrap;
        text-overflow:ellipsis;
      }
      .log-row.no-detail summary{
        position:relative;
      }
      .log-row.no-detail summary{
        list-style:none;
        padding-left:1rem;
      }
      .log-row.no-detail summary::-webkit-details-marker {
        display: none;
      }
      .log-row.nested{
        margin-left:1em;
      }
      .nested .event-name{
        display:none;
      }
      
      .setvalue .value{
        background:lightyellow;
      }
       summary{
        padding:1em;
        border-bottom:2px solid #ddd;
      }
      .outer-details{
        height:100%;
        overflow:auto;
        margin-top:2rem;
        background:rgba(250, 250, 250, 0.9);
      }
      
      .outer-details > header{
        position:absolute;
        top:-1px;
        width:calc(100% - 2rem);
        border-bottom:2px solid #ddd;
        font-size:1rem;
        height:1rem;
     }
      .outer-details > summary{
        font-size:1em;
      }
      ul{
        list-style:none;
        padding:0;
        margin:0.1em 0;
        border-left:3px solid steelblue;
        padding:0.1em 0;
      }
      ul .log-row{
        padding-left:3px;
        width:calc(100% - 1em);
      }
    `;

    if (localStorage.getItem('fx-action-log-filters')) {
      this.listenTo = JSON.parse(localStorage.getItem('fx-action-log-filters'));
    } else {
      this.listenTo = FxLogSettings.defaultSettings();
    }

    if (localStorage.getItem('fx-log-settings')) {
      this.listenTo = JSON.parse(localStorage.getItem('fx-log-settings'));
    } else {
      this.listenTo = FxLogSettings.defaultSettings();
    }

    const html = `
      <section open class="outer-details">
        <header>Log 
            <span class="buttons">
                <button id="del"" title="empty log - Ctrl+d">
                    <svg viewBox="0 0 24 24" style="width:24px;height:24px;" preserveAspectRatio="xMidYMid meet" focusable="true"><g><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"></path></g></svg></a>
                </button>
            </span>
        </header>
        <div id="log"></div>
      </section>
    `;

    this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
        ${html}
    `;

    const fore = window.document.querySelector('fx-fore');
    if (!fore) {
      console.error('fx-fore element not found in this page.');
    }
    const log = this.shadowRoot.querySelector('#log');
    // fore.classList.add('action-log');

    this.listenTo.forEach(eventName => {
      if (eventName.show) {
        document.addEventListener(eventName.name, e => {
          this._log(e, log);
        });
      }
    });

    // const boxes = this.shadowRoot.querySelector('.boxes');

    /*
        build the list of checkboxes for the filtering settings
         */
    /*
                this.listenTo.forEach(item => {
                    const wrapper = document.createElement('span');
                    boxes.append(wrapper);

                    const lbl = document.createElement('label');
                    lbl.setAttribute('title', item.description);
                    lbl.setAttribute('for', item.name);
                    lbl.innerText = item.name;

                    const cbx = document.createElement('input');
                    cbx.setAttribute('type', 'checkbox');
                    cbx.setAttribute('name', item.name);
                    cbx.setAttribute('id', item.name);
                    if (item.show) {
                        cbx.setAttribute('checked', '');
                    }
                    wrapper.append(cbx);
                    wrapper.append(lbl);

                    cbx.addEventListener('click', e => {
                        console.log('filter box ticked', e);
                        if (!e.target.checked) {
                            // remove event listener
                            const fore = document.querySelector('fx-fore');
                            fore.removeEventListener(item.name, this._log);
                            // e.preventDefault();
                            // e.stopPropagation();
                        }
                        const t = this.listenTo.find(evt => evt.name === item.name);
                        e.target.checked ? t.show = true : t.show = false;
                        // console.log('filter', this.listenTo);
                        localStorage.setItem('fx-action-log-filters', JSON.stringify(this.listenTo));
                    })
                    // boxes.appendChild(lbl);
                });
        */

    document.addEventListener(
      'outermost-action-start',
      e => {
        this.outermost = true;
      },
      { capture: true },
    );
    document.addEventListener(
      'outermost-action-end',
      e => {
        this.outermost = false;
        this.outermostAppender = null;
      },
      { capture: true },
    );

    // buttons
    const del = this.shadowRoot.querySelector('#del');
    del.addEventListener('click', e => {
      this.shadowRoot.querySelector('#log').innerHTML = '';
    });
    document.addEventListener('keydown', event => {
      if (event.ctrlKey && event.key === 'd') {
        this.shadowRoot.querySelector('#log').innerHTML = '';
      }
    });
  }

  _defaultSettings() {
    this.listenTo = [
      {
        name: 'action-performed',
        show: false,
        description: 'fires after an action has been performed',
      },
      { name: 'click', show: false, description: '' },
      {
        name: 'deleted',
        show: false,
        description: 'fires after a delete action has been executed',
      },
      { name: 'deselect', show: false, description: 'fires when fx-case is deselected' },
      { name: 'dialog-hidden', show: false, description: 'fires after fx-dialog has been hidden' },
      { name: 'dialog-shown', show: false, description: 'fired when a dialog has been shown' },
      { name: 'error', show: false, description: 'fires after an error occurred' },
      { name: 'execute-action', show: true, description: 'fires when an action executes' },
      { name: 'init', show: false, description: 'fires when a control initializes' },
      { name: 'index-changed', show: false, description: 'fires when the repeat index changes' },
      { name: 'insert', show: false, description: 'fires when an fx-insert is executed' },
      {
        name: 'instance-loaded',
        show: false,
        description: 'fires after an fx-instance has been loaded',
      },
      { name: 'invalid', show: false, description: 'fires after a control became invalid' },
      { name: 'item-changed', show: false, description: 'fires when a repeat item was changed' },
      { name: 'item-created', show: false, description: 'fires when a repeat item was created' },
      { name: 'loaded', show: false, description: 'fires after a fx-load has loaded' },
      { name: 'model-construct', show: false, description: 'fires when a model gets constructed' },
      {
        name: 'model-construct-done',
        show: false,
        description: 'fires after model initialization',
      },
      {
        name: 'nonrelevant',
        show: false,
        description: 'fires after an fx-control became nonrelevant',
      },
      { name: 'optional', show: false, description: 'fires after an fx-control became optional' },
      {
        name: 'outermost-action-end',
        show: false,
        description: 'fires when an outermost action block is finished',
      },
      {
        name: 'outermost-action-start',
        show: false,
        description: 'fires when an outermost action block is started',
      },
      {
        name: 'path-mutated',
        show: false,
        description: 'fires when a path in a repeat has been mutated',
      },
      { name: 'readonly', show: false, description: 'fires after an fx-control became readonly' },
      { name: 'readwrite', show: false, description: 'fires after an fx-control became readwrite' },
      {
        name: 'ready',
        show: false,
        description: 'fires after a fx-fore page has been completely initialized',
      },
      { name: 'rebuild-done', show: false, description: 'fires after a rebuild has taken place' },
      {
        name: 'recalculate-done',
        show: false,
        description: 'fires after a recalculate has taken place',
      },
      { name: 'refresh-done', show: false, description: 'fires after a refresh has been done' },
      {
        name: 'relevant',
        show: false,
        description: 'fires after a fx-control has become relevant',
      },
      { name: 'reload', show: false, description: 'fires when a fx-reload action executes' },
      {
        name: 'required',
        show: false,
        description: 'fires after an fx-control has become required',
      },
      {
        name: 'return',
        show: false,
        description: 'fired by embedded Fore controls to return their bound value',
      },
      { name: 'select', show: false, description: 'fires when an fx-case has been selected' },
      { name: 'submit', show: false, description: 'fires before a submission takes place' },
      {
        name: 'submit-done',
        show: false,
        description: 'fires after a submission has successfully been executed',
      },
      {
        name: 'submit-error',
        show: false,
        description: 'fires when a submission returned an error',
      },
      { name: 'valid', show: false, description: 'fires after a fx-control has become valid' },
      {
        name: 'value-changed',
        show: false,
        description: 'fires after a fx-control has changed its value',
      },
    ];
  }

  _log(e, log) {
    const elementName = e.target.nodeName;
    if (elementName === 'FX-ACTION-LOG') return;
    // e.preventDefault();
    // e.stopPropagation();

    const row = document.createElement('div');
    row.classList.add('log-row');
    const logRow = this._logDetails(e);
    if (
      e.detail &&
      Object.keys(e.detail).length === 0 &&
      Object.getPrototypeOf(e.detail) === Object.prototype
    ) {
      row.classList.add('no-detail');
    }

    row.innerHTML = logRow;
    if (this.outermost) {
      /*
            outermost-action-start and outermost-action-end are use as marker events only to start/end a list.
            They don't have aditional information to log.
             */
      if (e.type === 'outermost-action-start') return; // we don't want this event to actualy log something
      if (!this.outermostAppender) {
        this.outermostAppender = document.createElement('ul');
        log.append(this.outermostAppender);
      }
      const li = document.createElement('li');
      // li.innerHTML = logRow;
      li.append(row);
      this.outermostAppender.append(li);
    } else {
      log.append(row);
    }

    if (this.parentPath && elementName !== 'FX-ACTION') {
      row.classList.add('nested');
    }

    const targetElement = e.target;
    row.addEventListener('click', ev => {
      // console.log('clicked inspect item', targetElement);
      // console.log('clicked inspect item', ev.target.getAttribute('xpath'));

      this._highlight(targetElement);
    });

    const logRowTarget = row.querySelector('.event-target');
    if (!logRowTarget) return;

    logRowTarget.addEventListener('click', e => {
      const alreadyLogged = document.querySelectorAll('.fx-action-log-debug');
      alreadyLogged.forEach(logged => {
        logged.classList.remove('fx-action-log-debug');
      });

      targetElement.dispatchEvent(
        new CustomEvent('log-action', {
          composed: false,
          bubbles: true,
          cancelable: true,
          detail: { target: targetElement },
        }),
      );

      targetElement.classList.add('fx-action-log-debug');
      targetElement.setAttribute('data-name', targetElement.nodeName);
      this._highlight(targetElement);
    });
    // log.append(logElements);
  }

  /**
   * logs all configured events.
   * Special treatment is given to action-execute event to log out all actions that
   * are triggered.
   *
   * @param e the event to log
   * @returns {string}
   * @private
   */
  _logDetails(e) {
    const eventType = e.type;
    const path = XPathUtil.getDocPath(e.target);
    // console.log('>>>> _logDetails', path);
    const cut = path.substring(path.indexOf('/fx-fore'), path.length);
    const xpath = `/${cut}`;
    const short = cut.replaceAll('fx-', '');

    if (this.parentPath && !xpath.startsWith(this.parentPath)) {
      this.parentPath = null;
    }
    switch (eventType) {
      case 'deleted':
        const { deletedNodes } = e.detail;
        const s = new XMLSerializer();
        let serialized = '';
        deletedNodes.forEach(node => {
          serialized += s.serializeToString(node);
        });

        return `
                <fx-log-item event-name="${eventType}"
                             xpath="${xpath}"
                             short-info="${e.detail.ref}"
                             short-name="${e.target.nodeName.toLowerCase()}">
                    <section class="details">
                        <header>Details</header>
                        <section>
                            <span class="key">Deleted Nodes</span>
                            <textarea class="value" rows="5">${serialized.trim()}</textarea>
                        </section>
                    </section>
                </fx-log-item>
                `;
        break;
      case 'outermost-action-start':
        return 'start';
        break;
      case 'outermost-action-end':
        return '';
        break;
      case 'execute-action':
        // ##### here actions will be handled
        const actionElement = e.detail.action;
        return this._renderAction(actionElement, xpath, short, e);
        break;
      default:
        return `
                <fx-log-item event-name="${eventType}"
                             xpath="${xpath}"
                             short-name="${e.target.nodeName.toLowerCase()}">
                             
                    <section class="details">
                      ${this._listEventDetails(e)}
                    </section>
                </fx-log-item>
            `;
    }

    // }
  }

  _renderAction(actionElement, xpath, short, e) {
    const stripped = actionElement.nodeName.split('-')[1];
    let eventName;
    switch (actionElement.nodeName) {
      case 'FX-ACTION':
        this.parentPath = xpath;
        eventName = e.target.currentEvent
          ? e.target.currentEvent.type
          : e.detail.event
            ? e.detail.event
            : '';

        return `
                <fx-log-item event-name="${eventName}"
                             xpath="${xpath}"
                             short-name="ACTION"
                              data-path="${e.detail.path}" 
                              class="action">
                    <section class="details">
                      <header>Attributes</header>
                      <section>
                      ${Array.from(actionElement.attributes)
                        .map(
                          item => `
                        <span class="key">${item.nodeName}</span>
                        <span class="value">${item.nodeValue}</span>
                      `,
                        )
                        .join('')}                 
                      </section>
                    </section>
                </fx-log-item>  
            `;
      // break;
      case 'FX-MESSAGE':
        const message = e.detail.action.messageTextContent;
        return `
                    <fx-log-item event-name="${e.detail.event}"
                                 xpath="${xpath}"
                                 short-name="MESSAGE"
                                 short-info="${message}" class="action">
                        <section class="details">
                            <span>${message}</span>
                        </section>
                    </fx-log-item>
                `;
      // break;
      case 'FX-SEND':
        const submission = document.querySelector(`#${e.detail.action.getAttribute('submission')}`);
        const event = e.detail.event ? e.detail.event : '';
        return `
                <fx-log-item short-name="SEND"
                             short-info="${submission.getAttribute('id')}"
                             event-name="${event}"
                             xpath="${xpath}" class="action"
                             data-path="${e.detail.path}" >
                        <section class="details">
                          <header>Submission</header>
                          <section class="attributes">
                          ${Array.from(submission.attributes)
                            .map(
                              item => `
                            <span class="key">${item.nodeName}</span>
                            <span class="value">${item.nodeValue}</span>
                          `,
                            )
                            .join('')}                 
                          </section>  
                        </section>
               </fx-log-item>
                `;
      // break;
      case 'FX-SETVALUE':
        const instPath = XPathUtil.getPath(e.target.nodeset);
        const listensOn =
          e.target.nodeName === 'FX-CONTROL'
            ? e.target.updateEvent
            : e.detail.event
              ? e.detail.event
              : '';
        return `
                <fx-log-item short-name="SETVALUE"
                             short-info="${instPath}"
                             event-name="${listensOn}"
                             xpath="${xpath}"
                             data-path="${e.detail.path}" class="action">
                      <section class="details">
                          <span class="key">value</span>
                          <span class="value">${e.detail.value}</span>
                      </section>
                </fx-log-item>
                `;
      // break;
      default:
        eventName = e.target.currentEvent
          ? e.target.currentEvent.type
          : e.detail.event
            ? e.detail.event
            : '';
        return `
                    <fx-log-item event-name="${eventName}" 
                                short-name="${e.target.nodeName}"
                                xpath="${xpath}"
                                data-path="${e.detail.path}" 
                                class="action">
                          <section class="details">
                          </section>
                    </fx-log-item>
                    `;
    }
  }

  _listEventDetails(e) {
    if (
      e.detail &&
      Object.keys(e.detail).length === 0 &&
      Object.getPrototypeOf(e.detail) === Object.prototype
    ) {
      return '';
    }
    return `${Object.keys(e.detail).map(item => `<span>${item}</span>`)}`;
  }

  _listAttributes(e) {
    // console.log('_listAttributes', e)
    return '';
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

    element.style.transition = 'background 1s';
    element.style.backgroundColor = '#FFA500';

    setTimeout(() => {
      element.style.backgroundColor = defaultBG;
      setTimeout(() => {
        element.style.transition = defaultTransition;
      }, 400);
    }, 400);

    window.document.dispatchEvent(
      new CustomEvent('log-active-element', { detail: { target: element } }),
    );
  }
}

if (!customElements.get('fx-action-log')) {
  customElements.define('fx-action-log', FxActionLog);
}
