import ADI from './adi.js';

export class FxDomInspector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.instanceName = null;
    this.instance = null;
  }

  connectedCallback() {
    this.render();
    if (this.instance) {
      this.shadowRoot.querySelector('#focus-button').style = 'display: none';
    } else {
      this.setupFocusButton();
    }
  }

  setInstance(instance) {
    this.instance = instance;
  }

  disconnectedCallback() {
    this.adiInstance = null;
  }

  setupFocusButton() {
    let styleBackup = '';
    let focusedElement = null;
    const removeFocus = () => {
      if (styleBackup === '') {
        focusedElement.removeAttribute('style');
      } else {
        focusedElement.setAttribute('style', styleBackup);
      }
      focusedElement = null;
    };

    const onHover = event => {
      const { target } = event;
      if (event.type === 'mouseover') {
        styleBackup = target.getAttribute('style') || '';
        target.setAttribute('style', `outline: 2px solid blue; ${styleBackup}`);
        focusedElement = target;
        return;
      }
      if (focusedElement) {
        removeFocus();
      }
    };

    const focusButton = this.shadowRoot.querySelector('#focus-button');
    let isFocussing = false;
    const styleElement = window.document.head.appendChild(document.createElement('style'));
    const stopFocussing = () => {
      isFocussing = false;
      window.document.body.removeEventListener('click', listener);
      focusButton.classList.remove('selected-btn');
      styleElement.innerHTML = '';
      document.body.style.cursor = 'auto';

      window.document.body.removeEventListener('mouseover', onHover);
      window.document.body.removeEventListener('mouseout', onHover);
      if (focusedElement) {
        removeFocus();
      }
    };
    const listener = event => {
      stopFocussing();

      event.preventDefault();
      event.stopPropagation();
      if (event.target !== focusButton) {
        // Do not 'click on the focusbutton. It's a cancel.
        // console.log('done', event.target);
        window.document.dispatchEvent(
          new CustomEvent('log-active-element', { detail: { target: event.target } }),
        );
      }
    };
    const startFocussing = () => {
      isFocussing = true;
      focusButton.classList.add('selected-btn');
      document.body.style.cursor = 'crosshair';

      window.document.body.removeEventListener('click', listener);
      styleElement.innerHTML =
        'fx-fore::before { color:blue; content: "Sub fore!" } fx-fore {border: solid 1px blue}';
      window.document.body.addEventListener('click', listener);

      window.document.body.addEventListener('mouseover', onHover);
      window.document.body.addEventListener('mouseout', onHover);
    };
    window.document.addEventListener('keyup', event => {
      if (isFocussing && event.code === 'Escape') {
        stopFocussing();
        return;
      }
      if (!isFocussing && event.code === 'KeyI' && event.ctrlKey) {
        startFocussing();
      }
    });
    focusButton.addEventListener('click', clickEvent => {
      if (isFocussing) {
        stopFocussing();
      } else {
        startFocussing();
      }

      clickEvent.preventDefault();
      clickEvent.stopPropagation();
    });
  }

  render() {
    const style = `
      @import '../../resources/fore.css';
      
        :host {
          display:block;
          background:transparent;
        }
        body {
            -webkit-animation: bugfix infinite 1s;
            font-size:1rem;
        }
        
        @-webkit-keyframes bugfix {
            from {
                padding: 0
            }
            to {
                padding: 0
            }
        }
        .adi-content {
            position: relative;
            overflow: auto;
            box-sizing: border-box;
            -moz-box-sizing: border-box;
            height: 100% !important;
            padding:0;
            font-size:0.8em;
        }
        .adi-content header{
            padding:0.5rem;
            // background:rgba(255, 255, 255, 0.2);
            border-bottom:2px solid #ddd;
            border-collapse:collapse;
        }
        .adi-content > * {
            padding:0 0.25em;
        }
        
        #adi-wrapper {
            top: 0;
            font-family: "Segoe UI", Arial;
            font-size: 1.1rem;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            position:relative;
            height:calc(100% - 8rem);
            display:flex;
        }
        
        #adi-wrapper.left {
            left: 0
        }
        
        #adi-wrapper.right {
            right: 0
        }
        
        #adi-wrapper.transparent {
            background: rgba(250, 250, 250, 0.9)
        }
        
        #adi-panel {
            position:fixed;
            top:0;
            /*bottom: 0;*/
            right: 0;
            height: 24px;
            background: #d4d4d4;
            border-top: 1px solid #bbc5c9
        }
        
        #adi-panel .adi-path-wrap {
            position:absolute;
            bottom: 0;
            left: 0;
            width: 80%;
            height: 24px;
            padding: 0 13px 0 18px;
            line-height: 24px;
            overflow: hidden;
            box-sizing: border-box;
            -moz-box-sizing: border-box
        }
        
        #adi-panel .adi-path-wrap.adi-overflowing .adi-path-left, 
        #adi-panel .adi-path-wrap.adi-overflowing .adi-path-right {
            display: block
        }
        
        #adi-panel .adi-path {
            height: 24px;
            overflow: hidden;
            white-space: nowrap
        }
        
        #adi-panel .adi-path-left, #adi-panel .adi-path-right {
            display: none;
            position: absolute;
            top: 0;
            width: 8px;
            height: 24px;
            background-repeat: no-repeat;
            background-position: center center;
            opacity: .7
        }
        
        #adi-panel .adi-path-left:hover, #adi-panel .adi-path-right:hover {
            opacity: 1
        }
        
        #adi-panel .adi-path-left {
            left: 7px;
            background-image: url('img/left_shift.png')
        }
        
        #adi-panel .adi-path-right {
            position:absolute;
            right: 2px;
            background-image: url('/resources/scripts/dom-inspector/img/right_shift.png')
        }
        
        #adi-panel .adi-menu-wrap {
            bottom: 0;
            right: 24px;
            width: 50px;
            height: 24px
        }
        
        #adi-panel .adi-menu-lookup, #adi-panel .adi-menu-config {
            display: block;
            float: left;
            width: 24px;
            height: 24px;
            border-left: 1px solid #bbc5c9;
            background-position: center center;
            background-repeat: no-repeat;
            opacity: .7;
            border-radius: 0
        }
        
        #adi-panel .adi-menu-lookup:hover, #adi-panel .adi-menu-config:hover {
            background-color: #c5d9d8;
            opacity: 1
        }
        
        #adi-panel .adi-menu-lookup.adi-active, #adi-panel .adi-menu-config.adi-active {
            background-color: #fafafa;
            opacity: 1
        }
        
        #adi-panel .adi-menu-lookup {
            background-image: url('/resources/scripts/dom-inspector/img/lookup.png')
        }
        
        #adi-panel .adi-menu-config {
            background-image: url('/resources/scripts/dom-inspector/img/config.png')
        }
        
        
        
        #adi-vert-split {
            position: fixed;
            top: 0;
            width: 4px;
            height: 100%;
            cursor: e-resize;
            border-width: 0 1px 0 0;
            background: #bbc5c9;
            border-color: #768285;
            border-style: solid;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        
        #adi-vert-split:hover {
            background: #c5d9d8;
        }
        
        
        #adi-dom-view {
            border-right:2px solid #ddd;
            overflow:auto;
            flex-grow:3;
        }
        
        #adi-dom-view ul {
            margin: 0;
            padding: 0;
            list-style: none
        }
        
        #adi-dom-view ul[data-open=true] {
            display: block
        }
        
        #adi-dom-view ul[data-open=false] {
            display: none
        }
        
        #adi-dom-view ul ul {
            margin: 4px 0
        }
        
        #adi-dom-view ul li {
            padding-left: 1em;
            padding-bottom: 0.125em;
            margin: 0;
            padding-top: 0.125em;        
        }
        
        
        
        
        
        
        
        #adi-dom-view .adi-normal-node, 
        #adi-dom-view .adi-end-node {
            margin-right: 5px;
            padding: 0 6px 0px;
            background: #d2e8ff;
            border-radius: 8px;
            cursor: default;
            font-size:0.8rem;
        }
        #adi-dom-view .adi-text-node:after, #adi-dom-view .adi-comment-node:after {
            content: '"'
        }
        
        #adi-dom-view .adi-text-node:before, #adi-dom-view .adi-comment-node:before {
            content: '"'
        }
        
        #adi-dom-view .adi-comment-node {
            color: #999;
            font-style: italic
        }
        
        #adi-dom-view .adi-text-node, #adi-dom-view .adi-comment-node {
            display: block;
            padding: 3px 8px;
            color: #444;
            background: #fff;
            border-radius: 8px
        }
        
        #adi-dom-view .adi-normal-node:hover, 
        #adi-dom-view .adi-normal-node.hover, 
        #adi-dom-view .adi-end-node:hover, 
        #adi-dom-view .adi-end-node.hover {
            background: var(--paper-grey-700);
            color:white;
        }
        
       #adi-dom-view .adi-normal-node:hover ~ span,
       #adi-dom-view .adi-normal-node.hover ~ span,
       #adi-dom-view .adi-end-node:hover ~ span,
       #adi-dom-view .adi-end-node.hover ~ span {
            background: var(--paper-grey-700);
            color:white;
        }
        
        #adi-dom-view .adi-normal-node.adi-active-node, 
        #adi-dom-view .adi-end-node.adi-active-node {
            background: var(--paper-grey-700);
            color:white;
        }
        
        #adi-dom-view .adi-normal-node.adi-active-node ~ span,
        #adi-dom-view .adi-end-node.adi-active-node ~ span {
            background: var(--paper-grey-700);
            color:white;
        }
        
        
        
        
        
        
        #adi-dom-view .adi-trigger {
            display: inline-block;
            width: 10px;
            height: 10px;
            margin: 0 5px 0 -13px;
            opacity: .7
        }
        
        #adi-dom-view .adi-trigger.closed {
            // background: url('/resources/scripts/dom-inspector/img/node_closed.png') no-repeat;
        }   
        #adi-dom-view .adi-trigger.closed::before {
            content:'\\25B8';
        }
        
        #adi-dom-view .adi-trigger.opened {
            // background: url('/resources/scripts/dom-inspector/img/node_opened.png') no-repeat
        }
        #adi-dom-view .adi-trigger.opened::before{
            content:'\\25BE';
        }
        
        #adi-dom-view .adi-trigger:hover {
            opacity: 1
        }
        
        #adi-opts-view {
            position: relative;
            height: 100%;
            padding: 0 15px;
            background: #fff
        }
        
        #adi-opts-view.adi-hidden {
            display: none
        }
        
        #adi-opts-view .adi-opt-heading, #adi-opts-view .adi-opt {
            display: block;
            padding: 5px 0
        }
        
        #adi-opts-view .adi-opt-heading {
            padding: 20px 0 10px;
            font-size: 1rem;
        }
        
        #adi-opts-view .adi-opt-heading:first-child {
            padding-top: 10px
        }
        
        #adi-opts-view .adi-opt input {
            margin-right: 6px
        }
        
        #adi-opts-view .adi-opt-close {
            position: absolute;
            top: 5px;
            right: 28px;
            width: 16px;
            height: 16px;
            background: url('/resources/scripts/dom-inspector/img/options_close.png') no-repeat;
            opacity: .7;
        }
        
        #adi-opts-view .adi-opt-close:hover {
            opacity: 1;
        }
        
        #adi-attr-view {
            top: 0.5rem;
            border: 1px solid #ddd;
            overflow: auto;
            padding: 0.25em;
            height: calc(90% - 1em);
            min-width: 10rem;
            position: absolute;
            z-index: 10;
            right: 0.5rem;
            background:rgba(255,255,255,0.85);
        }
        #adi-attr-view > .adi-content{
            height:calc(100% - 5em);
            overflow:auto;
        }
        
        #adi-attr-view .adi-attr {
            display: block;
            padding: 0.25em;
        }
        
        #adi-attr-view hr {
            height: 1px;
            border: none
        }
        
        #adi-attr-view input[type=text] {
            width: calc(100% - 0.5em);
            margin-top: 3px;
            padding: 2px;
        }
        
        #adi-horiz-split {
            height: 4px;
            cursor: n-resize;
            border-width: 0 0 1px 0;
            background: #bbc5c9;
            border-color: #768285;
            border-style: solid;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        
        #adi-horiz-split:hover {
            background: #c5d9d8;
        }
        
        #adi-dom-view .fore-node{
            background: var(--paper-blue-700);
            font-size:1.1em;
             color:white;
        }
        #adi-dom-view .adi-normal-node.fore-node:hover {
            background: var(--paper-grey-700);
            color:white;
        }
        #adi-dom-view .adi-end-node.fore-node{
            background: var(--paper-blue-700);
            font-size:1em;
            color:white;
       }

        #adi-dom-view .adi-node .adi-active-node.fore-node,
        #adi-dom-view .adi-node.action .adi-active-node.fore-node,
        #adi-dom-view .adi-node.action .adi-active-node.fore-node ~ .adi-end-node
         {
            background: var(--paper-grey-700);
            color:white;
        }
        
        #adi-dom-view .adi-node.fx-fore{
            background:var(--paper-blue-grey-50); 
        }
        #adi-dom-view .adi-node.fx-model{
            background:var(--paper-blue-grey-100); 
            padding:0.25em 0;
        }       
               
        #adi-dom-view .adi-node.action .fore-node {
            background:var(--paper-blue-grey-100);
            color:black;
            font-family:monospace;
        }
                    
        .toggleView{
            /*width:20px;*/
            /*height: 20px;*/
        }
        input, select{
            display: block;
        }
        header{
            background:rgba(255, 255, 255, 0.2);
        }

        .selected-btn { color: orange }
      `;

    const html = `
        <slot name="header"></slot>
        <button id="focus-button">Focus</button>
        <slot></slot>
      `;

    this.shadowRoot.innerHTML = `
          <style>
              ${style}
          </style>
          ${html}
      `;
    const inst = this.hasAttribute('instance') ? this.getAttribute('instance') : '#document';
    this.adiInstance = new ADI(
      this.shadowRoot,
      this.hasAttribute('instance') ? this.instance : '#document',
    );
  }

  verticalResize(e) {
    if (!this.vertResizing) {
      return;
    }

    e = e || window.event;
    document.documentElement.style.cursor = 'e-resize';
    const nWidth = this.options.width + this.xPos - e.clientX;

    if (nWidth >= this.options.minWidth) {
      this.options.width = nWidth;
      this.xPos = e.clientX;
      this.refreshUI();
      this.saveOptions();
    }
  }
}

if (!customElements.get('fx-dom-inspector')) {
  customElements.define('fx-dom-inspector', FxDomInspector);
}
