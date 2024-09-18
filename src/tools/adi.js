import {
  addClass,
  removeClass,
  isEmptyTextNode,
  containsOnlyText,
  newElement,
  drawOptions,
  pauseEvent,
  drawAttrRow,
} from './helpers.js';

import { Fore } from '../fore.js';

function isAttributeShown(name, sourceNode) {
  if (name === 'style') return false;
  return true;
  // return name === 'id' || name === 'ref' || name === 'event';
}

class ADI {
  constructor(rootElement, instance) {
    this.sourceNodeByInspectorNodeLookup = new Map();

    this.uiView = null;
    this.menuView = null;
    this.domView = null;
    this.attrView = null;
    this.optsView = null;
    /**
     * The current active element. Note this is the element in the DOM view
     */
    this.activeElement = null;
    this.vertResizing = false;
    this.horizResizing = false;
    this.pathScrolling = null;
    this.elemLookup = false;
    this.styleBackup = '';
    this.xPos = 0;
    this.delegatedEvents = [];

    this.options = {
      align: 'right', // NOTE: left is not supported in this version
      split: 50,
      minSplit: 30,
      visible: true,
      saving: false,
      transparent: true,
      omitEmptyText: true,
      makeVisible: true,
      foldText: true,
      nodeTypes: [Node.ELEMENT_NODE, Node.TEXT_NODE, Node.COMMENT_NODE, Node.DOCUMENT_NODE],
    };

    if (instance === '#document') {
      this.instanceId = '#document';
      this.document = window.document;
      this.isInstanceViewer = false;
    } else {
      this.instanceId = instance.id;
      if (!instance || instance.localName !== 'fx-instance') {
        console.error('No instance found!');
      }
      this.document = instance.getInstanceData();
      this.isInstanceViewer = true;
      this.options.foldText = false;
    }
    this.drawUI(rootElement);
    this.registerEvents();

    // We're updating here, but we're doing that again later, when the UI is read (the 'ready' event fires)
    this.drawDOM(this.document, this.domView.querySelector('.adi-tree-view'), true);
    document.addEventListener('execute-action', e => this.processExecuteAction);
  }

  // Returns selected element or null
  getSelected() {
    if (!this.activeElement) {
      return null;
    }

    let elem = document;

    elem = this.sourceNodeByInspectorNodeLookup.get(this.activeElement);
    /*
        document.dispatchEvent(
            new CustomEvent('path-touched', {
                composed: true,
                bubbles: true,
                detail: {path: elem.modelItem.path},
            }),
        );
*/

    return elem;
  }

  // Loads user defined options stored in HTML5 storage (if available)
  loadOptions() {
    let userOptions = {};

    userOptions = JSON.parse(window.localStorage.getItem('ADI.options')) || {};

    // merge with defaults
    for (const opt of Object.keys(userOptions)) {
      this.options[opt] = userOptions[opt];
    }
  }

  // Saves user defined options into the HTML5 storage (if available)
  saveOptions() {
    if (this.options.saving) {
      window.localStorage.setItem('ADI.options', JSON.stringify(this.options));
    }
  }

  // Checks if a node has some child nodes and if at least on of them is of a supported type
  hasRequiredNodes(node) {
    if (typeof node !== 'object') {
      throw new Error(
        `hasRequiredNodes: Expected argument node of type object, ${typeof node} given.`,
      );
    }

    if (node.hasChildNodes()) {
      for (let i = 0, len = node.childNodes.length; i < len; i += 1) {
        const child = node.childNodes[i];
        if (this.options.nodeTypes.includes(child.nodeType)) {
          return true;
        }
      }
    }

    return false;
  }

  // Creates a starting markup for a new DOM tree view node
  newTreeNode(sourceNode) {
    if (typeof sourceNode !== 'object') {
      throw new Error(
        `newTreeNode: Expected argument node of type object, ${typeof sourceNode} given.`,
      );
    }

    const withChildren = this.hasRequiredNodes(sourceNode);
    let omit = false;
    let adiNode = sourceNode.nodeName.startsWith('FX-')
      ? `adi-node ${sourceNode.nodeName.toLowerCase()}`
      : '';
    if (sourceNode.nodeName.startsWith('FX-')) {
      adiNode = `adi-node ${sourceNode.nodeName.toLowerCase()}`;
      adiNode += Fore.isActionElement(sourceNode.nodeName) ? ' action' : '';
    }
    const elem = newElement('li', {
      class: adiNode,
    });

    // do not show ADI DOM nodes in the DOM view
    if (sourceNode === this.uiView) {
      return null;
    }

    // generate UI for elements with children
    if (withChildren) {
      elem.appendChild(newElement('span', { class: 'adi-trigger' }));
    }

    // we can omit empty text nodes if allowed in options
    if (this.options.omitEmptyText && sourceNode.nodeType === Node.TEXT_NODE) {
      omit = isEmptyTextNode(sourceNode);
    }

    if (!omit) {
      const tagStart = newElement('span');

      this.sourceNodeByInspectorNodeLookup.set(tagStart, sourceNode);
      this.sourceNodeByInspectorNodeLookup.set(sourceNode, tagStart);

      let tagEnd = null;

      if (containsOnlyText(sourceNode)) {
        if (sourceNode.nodeType === Node.COMMENT_NODE) {
          addClass(tagStart, 'adi-comment-node');
          if (typeof tagStart.innerText === 'string') {
            tagStart.innerText = `<!-- ${sourceNode.textContent} -->`;
          }
        } else {
          addClass(tagStart, 'adi-text-node');
          tagStart.textContent = sourceNode.textContent;
        }
      } else {
        addClass(tagStart, 'adi-normal-node');
        if (sourceNode.nodeType !== Node.DOCUMENT_NODE) {
          // tagStart.textContent = '<' + node.nodeName.toLowerCase() + '>';

          /*
                    let attrString = `<${sourceNode.nodeName.toLowerCase()} `;
                    if(sourceNode.attributes){
                        Array.from(sourceNode.attributes).forEach(attr => {
                            attrString += `${attr.nodeName}="${attr.nodeValue}" `;
                        });
                        console.log('ATTRSTRING',attrString);
                    }
                    if (sourceNode.nodeName === 'FX-BIND') {
                        tagStart.textContent = `<${sourceNode.nodeName.toLowerCase()} ref="${sourceNode.getAttribute('ref')}">`;
                    } else if (sourceNode.nodeName === 'FX-INSERT') {
                        tagStart.textContent = `<${sourceNode.nodeName.toLowerCase()} ref="${sourceNode.getAttribute('ref')}">`;
                    } else if (sourceNode.nodeName === 'FX-INSTANCE') {
                        tagStart.textContent = `<${sourceNode.nodeName.toLowerCase()} id="${sourceNode.id}">`;
                    } else if (sourceNode.nodeName === 'FX-CONTROL') {
                        tagStart.textContent = `<${sourceNode.nodeName.toLowerCase()} ref="${sourceNode.getAttribute('ref')}">`;
                    } else if (sourceNode.nodeName === 'FX-SEND') {
                        tagStart.textContent = `<${sourceNode.nodeName.toLowerCase()} submission="${sourceNode.getAttribute('submission')}">`;
                    } else if (sourceNode.nodeName === 'FX-SETVALUE') {
                        tagStart.textContent = `<${sourceNode.nodeName.toLowerCase()} ref="${sourceNode.getAttribute('ref')}">`;
                    } else if (sourceNode.nodeName === 'FX-SUBMISSION') {
                        tagStart.textContent = `<${sourceNode.nodeName.toLowerCase()} id="${sourceNode.getAttribute('id')}">`;
                    } else {
*/
          const attrString = Array.from(sourceNode.attributes)
            .filter(attr =>
              this.isInstanceViewer ? true : isAttributeShown(attr.name, sourceNode),
            )
            .map(attr => `${attr.name}="${attr.value}"`)
            .join(' ');
          tagStart.textContent = `<${sourceNode.nodeName.toLowerCase()}${
            attrString ? ` ${attrString}` : ''
          }>`;
          // }

          if (withChildren) {
            tagEnd = newElement('span');
            addClass(tagEnd, 'adi-end-node');
            tagEnd.textContent = `</${sourceNode.nodeName.toLowerCase()}>`;
          }
        } else {
          tagStart.textContent = sourceNode.nodeName.toLowerCase();
        }
      }

      elem.appendChild(tagStart);
      /*
                      const icon = document.createElement('span');
                      icon.textContent = 'x';
                      icon.classList.add(('icon'))
                      const icon2 = document.createElement('span');
                      icon2.textContent = '<-';
                      icon2.classList.add(('icon'))
                      elem.appendChild(icon);
                      elem.appendChild(icon2);
      */
      if (sourceNode.nodeName.startsWith('FX-')) {
        tagStart.classList.add('fore-node');
        tagStart.classList.add(sourceNode.nodeName.toLowerCase());
      }

      if (tagEnd) {
        elem.appendChild(tagEnd);

        if (sourceNode.nodeName.startsWith('FX-')) {
          tagEnd.classList.add('fore-node');
        }
      }

      return elem;
    }
    return null;
  }

  // Renders the DOM Tree view
  drawDOM(root, elem, isRoot) {
    if (typeof root !== 'object') {
      throw new Error(`drawDOM: Expected argument root of type object, ${typeof root} given.`);
    }

    let newNode = null;
    let isOpen = true;

    const adiNode = elem.nodeName.startsWith('FX-')
      ? `adi-node ${node.nodeName.toLowerCase()}`
      : '';

    if (isRoot && this.options.nodeTypes.indexOf(root.nodeType) !== -1) {
      elem.innerHTML = '';
      newNode = this.newTreeNode(root);

      if (this.hasRequiredNodes(root)) {
        newNode.appendChild(newElement('ul', { 'data-open': true, class: adiNode }));

        addClass(newNode.querySelector('.adi-trigger'), 'opened');
      }

      elem.appendChild(newNode);
      elem = elem.querySelector('ul');
    }

    // recursive DOM traversal
    for (let i = 0, len = root.childNodes.length; i < len; i += 1) {
      const node = root.childNodes[i];
      const withChildren = this.hasRequiredNodes(node);

      if (this.options.nodeTypes.indexOf(node.nodeType) !== -1) {
        newNode = this.newTreeNode(node);

        if (newNode) {
          if (withChildren) {
            if (this.options.foldText) {
              isOpen = !containsOnlyText(node, true);
            } else {
              isOpen = true;
            }

            if (node.nodeName === 'HEAD') isOpen = false;
            if (node.nodeName === 'SELECT') isOpen = false;
            if (node.nodeName === 'FX-INSTANCE') isOpen = false;
            /*
                        if(this.options.closedElements.includes(node.nodeName.toLowerCase())){
                            isOpen = false;
                        }
*/

            if (node.nodeType === Node.DOCUMENT_NODE) {
              newNode.appendChild(newElement('ul', { 'data-open': isOpen, class: adiNode }));
            } else {
              newNode.insertBefore(
                newElement('ul', { 'data-open': isOpen, class: adiNode }),
                newNode.lastChild,
              );
            }

            addClass(newNode.querySelector('.adi-trigger'), isOpen ? 'opened' : 'closed');
          }

          elem.appendChild(newNode);

          if (this.getSelected() === node) {
            const span = newNode.querySelector('span.adi-normal-node');
            span?.classList?.add('adi-active-node');
            this.activeElement = span;
            newNode.scrollIntoView({ block: 'nearest', behavior: 'instant' });
          }

          if (withChildren) {
            this.drawDOM(node, newNode.querySelector('ul'), false);
          }
        }
      }
    }
  }

  // Show/hide the options view
  toggleOptions() {
    if (this.optsView.className.indexOf('adi-hidden') !== -1) {
      removeClass(this.optsView, 'adi-hidden');
    } else {
      addClass(this.optsView, 'adi-hidden');
      this.attrView.querySelector('.adi-content').innerHTML = '';
      this.refreshUI();
      this.drawDOM(document, this.domView.querySelector('.adi-tree-view'), true);
      if (this.options.saving) {
        this.saveOptions();
      } else {
        window.localStorage.removeItem('ADI.options');
      }
    }
  }

  // Renders the UI
  drawUI(rootElement) {
    this.uiView = newElement('div', {
      id: 'adi-wrapper',
      class: this.options.transparent ? 'transparent' : '',
    });
    this.domView = newElement('div', { id: 'adi-dom-view' });
    const domViewContent = newElement('div', { class: 'adi-content', id: 'detailsView' });
    // this.attrView.appendChild(newElement('fx-fore', {src: './lab/inspector-view.html'}));

    // const horizSplit = newElement('div', {id: 'adi-horiz-split'});
    const domTree = newElement('ul', { class: 'adi-tree-view' });
    const domPathWrap = newElement('div', { class: 'adi-path-wrap' });
    const domPathScrollLeft = newElement('span', { class: 'adi-path-left' });
    const domPathScrollRight = newElement('span', { class: 'adi-path-right' });
    this.menuView = newElement('div', { id: 'adi-panel' });
    const naviButtons = newElement('div', { class: 'adi-menu-wrap' });
    const naviConfig = newElement('a', { class: 'adi-menu-config', title: 'Settings' });
    const naviLookup = newElement('a', { class: 'adi-menu-lookup', title: 'Lookup tool' });

    // this.horizSplit = horizSplit;

    this.optsView = drawOptions();

    // put UI together
    domViewContent.appendChild(domTree);
    this.domView.appendChild(this.menuView);
    this.domView.appendChild(domViewContent);

    domPathWrap.appendChild(domPathScrollLeft);
    domPathWrap.appendChild(domPathScrollRight);
    naviButtons.appendChild(naviLookup);
    naviButtons.appendChild(naviConfig);
    this.menuView.appendChild(domPathWrap);
    this.menuView.appendChild(naviButtons);
    // this.uiView.appendChild(this.menuView);
    this.uiView.appendChild(this.optsView);
    this.uiView.appendChild(this.domView);
    if (!this.isInstanceViewer) {
      this.attrView = newElement('div', { id: 'adi-attr-view' });
      const attrViewContent = newElement('div', { class: 'adi-content' });
      this.attrView.appendChild(attrViewContent);
      this.uiView.appendChild(this.attrView);
    }

    // this.uiView.appendChild(horizSplit);
    // wrapper.appendChild(naviWrap);

    // cache UI object and append to the DOM

    rootElement.appendChild(this.uiView);
    // document.querySelector('#inspector').appendChild(wrapper);

    this.refreshUI(true);
  }

  // Refreshes the global UI
  refreshUI(refreshOpts) {
    if (this.uiView === null) {
      return;
    }

    // load options if requested (e.g. before the first UI refresh)
    if (refreshOpts) {
      this.loadOptions();
    }

    // Options view refresh
    if (refreshOpts) {
      this.optsView.querySelector('[data-opt="transparent"]').checked = this.options.transparent;
      this.optsView.querySelector('[data-opt="saving"]').checked = this.options.saving;
      this.optsView.querySelector('[data-opt="omitEmptyText"]').checked =
        this.options.omitEmptyText;
      this.optsView.querySelector('[data-opt="makeVisible"]').checked = this.options.makeVisible;
      this.optsView.querySelector('[data-opt="foldText"]').checked = this.options.foldText;
      this.optsView.querySelector('[data-opt="nodeTypes-3"]').checked =
        this.options.nodeTypes.indexOf(3) !== -1;
      this.optsView.querySelector('[data-opt="nodeTypes-8"]').checked =
        this.options.nodeTypes.indexOf(8) !== -1;
      // this.optsView.querySelector('[data-opt="nodeTypes-1"]').checked = this.options.nodeTypes.indexOf(1) !== -1;
      // this.optsView.querySelector('[data-opt="nodeTypes-9"]').checked = this.options.nodeTypes.indexOf(9) !== -1;
    }

    // UI appearance refresh
    this.uiView.className = this.options.transparent ? 'transparent' : '';
    // this.uiView.style.display = this.options.visible ? 'grid' : 'none';
    // this.domView.style.height = `${this.options.split}%`;
    // this.attrView.style.height = `${100 - this.options.split}%`;
    this.domView.querySelector('.adi-content').style.height = `${this.domView.clientHeight}px`;
    if (!this.isInstanceViewer) {
      this.attrView.querySelector('.adi-content').style.height = `${
        this.attrView.clientHeight - this.menuView.clientHeight
      }px`;
    }

    addClass(this.uiView, this.options.align);
  }

  // UI visibility toggle handler
  toggleVisibilityUI() {
    if (this.uiView === null) {
      return;
    }

    this.uiView.style.display = this.options.visible ? 'none' : 'block';
    this.options.visible = !this.options.visible;
    this.saveOptions();
  }

  // Renders the attribute view
  drawAttrs(elem) {
    if (this.isInstanceViewer) {
      return;
    }
    const content = this.attrView.querySelector('.adi-content');
    // prepare attributes
    content.innerHTML = '';

    const header = document.createElement('header');
    header.innerText = 'Attributes';
    content.appendChild(header);

    // todo: hook element-def.json in here
    /*
        if (elem.nodeName.startsWith('FX-')) {
            console.log('got a fore element');
            const {properties} = elem.constructor;
            Object.keys(properties).forEach(propertyName => {

                const property = properties[propertyName];
                if (!property || property.hidden) {
                    return;
                }
                const row = content.appendChild(newElement('span', {class: 'adi-attr'}));

                switch (property.type) {
                    case 'referencedNode': {
                        row.innerHTML = `<label>${propertyName}: <button>${elem[propertyName]?.nodeName}</button></label>`;
                        const button = row.querySelector('button');
                        button.addEventListener(
                            'click', () => this.handleLookup({detail: {target: elem[propertyName]}})
                        );
                        break;
                    }
                    case Number: {
                        row.innerHTML = `<label>${propertyName}: <input type="number" data-attr="${propertyName}" value="${elem[propertyName]}"></label>`;
                        break;
                    }
                    case String: {
                        if (property.valueSpace) {
                            row.innerHTML = `<label>${propertyName}: <select data-attr="${propertyName}" value="${elem[propertyName]}">${property.valueSpace.map(value => `<option>${value}</option>`)}</label>`;
                            break;

                        }
                        row.innerHTML = `<label>${propertyName}: <input type="text" data-attr="${propertyName}" value="${elem[propertyName]}"></label>`;
                        break;
                    }
                    case Boolean: {
                        if (property.valueSpace) {
                            row.innerHTML = `<label>${propertyName}: <input type="checkbox" data-attr="${propertyName}" value="${elem[propertyName]}"></input></label>`;

                        }
                        break;
                    }
                    case Object: {
                        try {
                            row.innerHTML = `<label>${propertyName}: <code>${JSON.stringify(elem[propertyName])}</code></label>`;
                        } catch (err) {
                            row.innerHTML = `<label>${propertyName}: <code>Unserializable</code></label>`;
                        }
                        break;
                    }
                    case Map: {
                        try {
                            row.innerHTML = `<label>${propertyName}: <code>${JSON.stringify(elem[propertyName])}</code></label>`;
                        } catch (err) {
                            row.innerHTML = `<label>${propertyName}: <code>Unserializable</code></label>`;
                        }
                        break;
                    }
                    default: {
                        row.innerHTML = `<label>${propertyName}: Unknown type ${property.type}</label>`;
                    }
                }
            });
        } else {
*/
    [...elem.attributes].forEach(attr => {
      if (attr.name !== 'style') {
        content.appendChild(drawAttrRow(attr.name, attr.value));
      }
    });
    // }
  }

  // Handles attribute changes
  changeAttribute(e) {
    const target = e ? e.target : window.event.srcElement;
    const attr = target.getAttribute('data-attr');
    const val = target.value;
    const elem = this.getSelected();

    // remove attribute if the new value is empty
    if (val === '') {
      elem.removeAttribute(attr);
    } else {
      elem.setAttribute(attr, val);
    }
  }

  // Handles option changes
  changeOption(e) {
    const target = e ? e.target : window.event.srcElement;
    const data = target.getAttribute('data-opt');
    const val = target.checked;

    if (data.indexOf('nodeTypes') !== -1) {
      const type = parseInt(data.match(/\d+/)[0], 10);

      if (val) {
        this.options.nodeTypes.push(type);
      } else {
        this.options.nodeTypes.splice(this.options.nodeTypes.indexOf(type), 1);
      }
    } else {
      this.options[data] = val;
    }
  }

  // Key events processing
  processKey(e) {
    e = e || window.event;
    const code = e.keyCode || e.which;

    switch (code) {
      case 272: // ctrl + alt + d
        this.toggleVisibilityUI();
        break;
      default:
        break;
    }
  }

  // Vertical splitter resize handler
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

  // Horizontal splitter resize handler
  horizontalResize(e) {
    if (!this.horizResizing) {
      return;
    }

    e = e || window.event;
    document.documentElement.style.cursor = 'n-resize';
    const nSplit = Math.floor((e.clientY / this.uiView.clientHeight) * 100);

    if (nSplit >= this.options.minSplit && nSplit <= 100 - this.options.minSplit) {
      this.options.split = nSplit;
      this.refreshUI();
      this.saveOptions();
    }
  }

  processExecuteAction(e) {
    this.refreshUI();
  }

  // Handles active element selection
  handleActive(e) {
    let target = e ? e.detail?.target || e.target : window.event.srcElement;
    const active = this.domView.querySelector('.adi-active-node');

    if (active) {
      removeClass(active, 'adi-active-node');
    }

    // clicked on normal-node or end-node?
    if (!target || target.nodeType === Node.DOCUMENT_NODE) return;
    if (target && target.classList && target.classList.contains('adi-end-node')) {
      target = target.parentNode.querySelector('.adi-normal-node');
    }

    this.activeElement = target;
    addClass(target, 'adi-active-node');

    /*
        e.target.dispatchEvent(
            new CustomEvent('handle-active', {
                composed: true,
                bubbles: true,
                detail: {active: this.activeElement, selected: this.getSelected()},
            }),
        );
*/

    // make it visible (scroll)
    if (this.options.makeVisible) {
      const wrap = this.domView.querySelector('.adi-content');
      wrap.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
    const selected = this.getSelected();
    this.drawAttrs(selected);

    if (selected && typeof selected.getModelItem === 'function' && selected.getModelItem()?.node) {
      let selectedElement = selected.modelItem.node;
      if (selectedElement?.nodeType === Node.ATTRIBUTE_NODE) {
        selectedElement = selectedElement.ownerElement;
      }
      window.document.dispatchEvent(
        new CustomEvent('log-active-element', { detail: { target: selectedElement } }),
      );
    }
    //	window.document.dispatchEvent(new CustomEvent('log-active-element', {detail: {target: selected}}));
  }

  // Highlights an element on page
  highlightElement(event) {
    // console.log('highlight',e);
    let sourceNode = event ? event.target : window.event.srcElement;

    if (sourceNode.classList.contains('adi-end-node')) {
      sourceNode = sourceNode.parentNode.querySelector('.adi-normal-node');
    }

    const inspectorNode = this.sourceNodeByInspectorNodeLookup.get(sourceNode);

    if (!inspectorNode || inspectorNode.ownerDocument !== window.document) {
      // Not in HTML: ignore
      return;
    }

    if (inspectorNode) {
      if (event.type === 'mouseover') {
        this.styleBackup = inspectorNode.getAttribute('style') || '';
        inspectorNode.setAttribute('style', `outline: 2px solid blue; ${this.styleBackup}`);
      } else if (this.styleBackup === '') {
        inspectorNode.removeAttribute('style');
      } else {
        inspectorNode.setAttribute('style', this.styleBackup);
      }
    }
  }

  // Handles element lookup on page
  handleLookup(e) {
    const target = e ? e.detail?.target || e.target : window.event.srcElement;

    if (!this.document.contains(target)) {
      // Targetted at somewhere else!!!
      return;
    }
    if (target.nodeType === Node.DOCUMENT_NODE) {
      // Targetted at the document node. Nothing to highlight
      return;
    }

    if (target.className.indexOf('adi-menu-lookup') !== -1) {
      // enable/disable interactive lookup
      if (this.elemLookup) {
        removeClass(target, 'adi-active');
        this.elemLookup = false;
        this.removeEvent(document.body, 'mouseover', this.handleLookup, true);
        this.removeEvent(document.body, 'mouseout', this.handleLookup, true);
        this.removeEvent(document.body, 'click', this.handleLookup, true);
        return;
      }
      addClass(target, 'adi-active');
      this.elemLookup = true;
      this.addEventDelegate(
        document.body,
        'mouseover',
        this.handleLookup,
        false,
        '*',
        true,
        'adi-wrapper',
      );
      this.addEventDelegate(
        document.body,
        'mouseout',
        this.handleLookup,
        false,
        '*',
        true,
        'adi-wrapper',
      );
      this.addEventDelegate(
        document.body,
        'click',
        this.handleLookup,
        false,
        '*',
        true,
        'adi-wrapper',
      );
      return;
    }
    // handle lookup events
    if (e.type === 'mouseover') {
      this.styleBackup = target.getAttribute('style') || '';
      target.setAttribute('style', `outline: 1px dashed red; ${this.styleBackup}`);
      return;
    }
    if (e.type === 'mouseout') {
      target.setAttribute('style', this.styleBackup);
      return;
    }
    this.elemLookup = false;
    removeClass(this.menuView.querySelector('.adi-menu-lookup'), 'adi-active');
    target.setAttribute('style', this.styleBackup);
    this.removeEvent(document.body, 'mouseover', this.handleLookup, true);
    this.removeEvent(document.body, 'mouseout', this.handleLookup, true);
    this.removeEvent(document.body, 'click', this.handleLookup, true);
    pauseEvent(e);

    // find corresponding node in the DOM view
    const active = this.sourceNodeByInspectorNodeLookup.get(target);

    // activate it
    if (!active) return;
    if (active) {
      active.click();
    }

    // open the whole path in DOM view
    if (!active.parentNode) return;
    let node = active.parentNode;
    let tmp;

    if (node.querySelector('ul')) {
      node.querySelector('ul').setAttribute('data-open', 'true');
    }
    while (node !== this.domView.querySelector('.adi-content')) {
      if (node.className.indexOf('adi-node') !== -1) {
        tmp = node.querySelector('.adi-trigger');
        if (tmp) {
          removeClass(tmp, 'closed');
          addClass(tmp, 'opened');
        }

        node = node.parentNode; // ul node
        node.setAttribute('data-open', 'true');
      }

      node = node.parentNode;
    }

    // make it visible (scroll)
    if (this.options.makeVisible) {
      active.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' });
    }
    target.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' });
  }

  // Simple cross-browser event handler that enables simple event delegation.
  // Note that the selector must be a string and no nesting is supported.
  // Selector is expected to be in one of formats listed below and works for all children
  // in the particular element.
  // Store parameter enables storing the reference to custom event handler.
  // Exclude parameter will exclude the particular element and all of its children, this works
  // only for id selectors.
  // Selector formats: tag name ("div"), class name (".my-class"), id ("#my-id") and any ("*").

  addEventDelegate(elem, evt, fn, capture, selector, store, exclude) {
    // custom event handler is registered
    const handler = e => {
      // check if target corresponds to the selector
      const target = e ? e.target : window.event.srcElement;
      const sel = selector.substr(1);
      let delegate = false;

      if (exclude) {
        let node = target;

        while (node !== document) {
          if (node.id === exclude) {
            return;
          }

          node = node.parentNode;
        }
      }

      // should the event be delegated?
      if (selector.indexOf('#') === 0) {
        // ID
        delegate = target.id === sel;
      } else if (selector.indexOf('.') === 0) {
        // class
        delegate = target.className.indexOf(sel) !== -1;
      } else if (selector === '*') {
        // any
        delegate = true;
      } else {
        // tag name
        delegate = target.nodeName.toLowerCase() === selector;
      }

      // delegate the event handling
      if (delegate) {
        fn(e);
      }
    };
    // save the reference
    if (store) {
      this.delegatedEvents.push({
        handle: handler,
        elem,
        fn,
        evt,
      });
    }

    elem.addEventListener(evt, handler, capture);
  }

  // Simple cross-browser event removing
  removeEvent(elem, evt, fn, wasDelegated) {
    if (typeof elem !== 'object') {
      throw new Error(`addEvent: Expected argument elem of type object, ${typeof elem} given.`);
    }

    // try to find stored delegated event
    let stored = null;
    if (wasDelegated) {
      for (let i = 0, len = this.delegatedEvents.length; i < len; i += 1) {
        stored = this.delegatedEvents[i];
        if (stored.elem === elem && stored.evt === evt && stored.fn === fn) {
          fn = stored.handle;
          this.delegatedEvents.splice(i, 1);
          break;
        }
      }
    }

    // elem.detachEvent(`on${evt}`, fn);
  }

  // Event registration
  registerEvents() {
    // events for splitters
    /*
                this.horizSplit.addEventListener(
                    'mousedown',
                    e => {
                        e = e || window.event;
                        pauseEvent(e);
                        this.horizResizing = true;
                    },
                    false,
                );
        */

    const redrawUi = () => {
      if (this.instanceId !== '#document') {
        const instance = window.document.querySelector(`#${this.instanceId}`);
        this.document = instance.getInstanceData();
      }
      this.drawDOM(this.document, this.domView.querySelector('.adi-tree-view'), true);
    };

    // Update UI when something with instances changed
    document.addEventListener('instance-loaded', redrawUi);
    // Update UI when some value changes
    document.addEventListener('value-changed', redrawUi);
    // Update UI when we're done loading and all repeats are done
    document.addEventListener('ready', redrawUi);

    document.addEventListener(
      'mouseup',
      () => {
        document.documentElement.style.cursor = 'default';
        this.vertResizing = false;
        this.horizResizing = false;
      },
      false,
    );

    document.addEventListener('mousemove', event => this.verticalResize(event), false);
    document.addEventListener('mousemove', event => this.horizontalResize(event), false);
    // window resize
    window.addEventListener('resize', event => this.refreshUI(event), false);

    // keypress events
    document.addEventListener('keypress', event => this.processKey(event), false);

    // fore action events
    document.addEventListener('log-active-element', event => this.handleLookup(event), false);

    // Dom view folding handler
    const handleFolding = e => {
      const target = e ? e.target : window.event.srcElement;
      const ul = target.parentNode.querySelector('ul');

      if (ul.getAttribute('data-open') === 'true') {
        removeClass(target, 'opened');
        addClass(target, 'closed');
        ul.setAttribute('data-open', 'false');
      } else {
        removeClass(target, 'closed');
        addClass(target, 'opened');
        ul.setAttribute('data-open', 'true');
      }
    };

    // dom tree view folding
    this.addEventDelegate(this.domView, 'click', handleFolding, false, '.adi-trigger');

    // active element
    this.addEventDelegate(
      this.domView,
      'click',
      event => this.handleActive(event),
      false,
      '.adi-normal-node',
    );
    this.addEventDelegate(
      this.domView,
      'click',
      event => this.handleActive(event),
      false,
      '.adi-end-node',
    );

    // matching tag highlighting
    this.addEventDelegate(
      this.domView,
      'mouseover',
      e => {
        const target = e ? e.target : window.event.srcElement;
        addClass(target.parentNode.querySelector('.adi-normal-node'), 'hover');
      },
      false,
      '.adi-end-node',
    );
    this.addEventDelegate(
      this.domView,
      'mouseout',
      e => {
        const target = e ? e.target : window.event.srcElement;
        removeClass(target.parentNode.querySelector('.adi-normal-node'), 'hover');
      },
      false,
      '.adi-end-node',
    );

    // page element highlighting
    this.addEventDelegate(
      this.domView,
      'mouseover',
      event => this.highlightElement(event),
      false,
      '.adi-end-node',
    );
    this.addEventDelegate(
      this.domView,
      'mouseover',
      event => this.highlightElement(event),
      false,
      '.adi-normal-node',
    );
    this.addEventDelegate(
      this.domView,
      'mouseout',
      event => this.highlightElement(event),
      false,
      '.adi-end-node',
    );
    this.addEventDelegate(
      this.domView,
      'mouseout',
      event => this.highlightElement(event),
      false,
      '.adi-normal-node',
    );

    // element lookup
    this.menuView
      .querySelector('.adi-menu-lookup')
      .addEventListener('click', event => this.handleLookup(event), false);

    document.addEventListener('handle-active', e => {
      if (e.detail.selected === this.getSelected()) {
        // We caused this. ignore
        return;
      }
      const { selected } = e.detail;
      const target = this.sourceNodeByInspectorNodeLookup.get(selected);
      // make it visible (scroll)
      if (this.options.makeVisible) {
        const wrap = this.domView.querySelector('.adi-content');
        if (target.offsetTop >= wrap.clientHeight || target.offsetTop <= wrap.scrollTop) {
          wrap.scrollTop = target.offsetTop - Math.floor(wrap.clientHeight / 2);
        }
      }

      this.drawAttrs(this.getSelected());
    });

    document.addEventListener('execute-action', e => this.processExecuteAction(event), {
      capture: true,
    });

    // options events
    this.addEventDelegate(
      this.optsView,
      'change',
      event => this.changeOption(event),
      false,
      'input',
    );
    this.addEventDelegate(
      this.optsView,
      'click',
      event => this.toggleOptions(event),
      false,
      '.adi-opt-close',
    );
    this.menuView
      .querySelector('.adi-menu-config')
      .addEventListener('click', event => this.toggleOptions(event), false);

    // attributes events
    if (!this.isInstanceViewer) {
      this.addEventDelegate(this.attrView, 'change', this.changeAttribute, false, 'input');
    }
  }
}

export default ADI;
