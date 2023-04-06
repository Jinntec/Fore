export function addClass(element, strClass) {
  element.classList.add(strClass);
}

export function removeClass(element, strClass) {
  element.classList.remove(strClass);
}

// Checks whether the text node is not empty or contains only the EOL
export function isEmptyTextNode(node) {
  if (typeof node !== 'object') {
    throw new Error(
      `isEmptyTextNode: Expected argument node of type object, ${typeof node} given.`,
    );
  }

  return /^\s*$/.test(node.textContent);
}

// Checks whether the node or its children contains only text information
export function containsOnlyText(node, checkChildren) {
  if (typeof node !== 'object') {
    throw new Error(
      `containsOnlyText: Expected argument node of type object, ${typeof node} given.`,
    );
  }

  checkChildren = checkChildren || false;

  let result = false;
  let nodeTmp = null;

  // does the node contain only text nodes?
  if (checkChildren) {
    for (let i = 0, len = node.childNodes.length; i < len; i += 1) {
      nodeTmp = node.childNodes[i];
      result =
        nodeTmp.nodeType === Node.TEXT_NODE ||
        nodeTmp.nodeType === Node.COMMENT_NODE ||
        nodeTmp.nodeType === Node.CDATA_SECTION_NODE;

      if (!result) {
        break;
      }
    }
  } else {
    // check the node type if it doesn't have any children
    result =
      node.nodeType === Node.TEXT_NODE ||
      node.nodeType === Node.COMMENT_NODE ||
      node.nodeType === Node.CDATA_SECTION_NODE;
  }

  return result;
}

// Create element wrapper -- allows to set attributes using the config object.
export function newElement(elem, attrs) {
  const el = document.createElement(elem);

  attrs = attrs || {};
  for (const attr of Object.keys(attrs)) {
    el.setAttribute(attr, attrs[attr]);
  }

  return el;
}

 // Helper function for options view
export function drawOptionRow(optionCode, optionText) {
  const row = newElement('span', { class: 'adi-opt' });
  row.innerHTML = `<label><input type="checkbox" data-opt="${optionCode}">${optionText}</label>`;

  return row;
}

// Returns CSS and JS paths to the element
// Result is an object with two letiables (cssPath, jsPath) where cssPath is a string
// which holds the css path starting from the HTML element, and jsPath is an array which
// contains indexes for childNodes arrays (starting at document object).
//
// Inspired by the selector function from Rochester Oliveira's jQuery plugin
// http://rockingcode.com/tutorial/element-dom-tree-jquery-plugin-firebug-like-functionality/
export function getElemPaths(elem) {
  if (typeof elem !== 'object') {
    throw new Error(`getElemPaths: Expected argument elem of type object, ${typeof elem} given.`);
  }

  let css = '';
  let js = '';
  let parent = '';
  let i;
  let len;

  while (elem !== document) {
    parent = elem.parentNode;

    // javascript selector
    for (i = 0, len = parent.childNodes.length; i < len; i += 1) {
      if (parent.childNodes[i] === elem) {
        js = `${i},${js}`;
        break;
      }
    }

    // CSS selector
    let cssTmp = elem.nodeName;

    if (elem.id) {
      cssTmp += `#${elem.id}`;
    }

    if (elem.className) {
      // use classList if available
      const classList = elem.classList || elem.className.split(' ');

      for (i = 0, len = classList.length; i < len; i += 1) {
        cssTmp += `.${classList[i]}`;
      }
    }

    css = `${cssTmp} ${css}`;
    elem = elem.parentNode;
  }

  js = js.slice(0, -1).split(',');

  return {
    cssPath: css.toLowerCase(),
    jsPath: js,
  };
}

// Renders the options panel
export function drawOptions() {
  const ui = newElement('div', { id: 'adi-opts-view', class: 'adi-hidden' });
  const head1 = newElement('span', { class: 'adi-opt-heading' });
  const head2 = newElement('span', { class: 'adi-opt-heading' });
  const close = newElement('span', { class: 'adi-opt-close' });

  head1.textContent = 'General options';
  head2.textContent = 'Observed nodes';

  ui.appendChild(head1);
  ui.appendChild(drawOptionRow('saving', 'Enable saving of settings'));
  ui.appendChild(drawOptionRow('makeVisible', 'Scroll to the active element in DOM View'));
  ui.appendChild(drawOptionRow('omitEmptyText', 'Hide empty text nodes'));
  ui.appendChild(drawOptionRow('foldText', 'Fold the text nodes'));
  ui.appendChild(drawOptionRow('transparent', 'Enable transparent background'));
  ui.appendChild(head2);
  ui.appendChild(drawOptionRow('nodeTypes-3', 'Text node'));
  ui.appendChild(drawOptionRow('nodeTypes-8', 'Comment node'));
  // ui.appendChild(drawOptionRow('nodeTypes-1', 'Element node'));
  // ui.appendChild(drawOptionRow('nodeTypes-9', 'Document node'));
  ui.appendChild(close);

  return ui;
}

// Stops event propagation and also prevents the default behavior.
export function pauseEvent(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (e.preventDefault) {
    e.preventDefault();
  }

  e.cancelBubble = true;
  e.returnValue = false;

  return false;
}
// Helper function for attributes view
export function drawAttrRow(attrName, attrValue) {
  const row = newElement('span', { class: 'adi-attr' });
  switch (attrName.toLowerCase()) {
    case 'defaultaction':
      row.innerHTML = `<label>${attrName}: <select data-attr="${attrName}" value="${attrValue}"><option>perform</option><option>cancel</option></label>`;
      break;
    case 'delay':
      row.innerHTML = `<label>${attrName}: <input type="number" data-attr="${attrName}" value="${attrValue}"></label>`;
      break;
    default:
      row.innerHTML = `<label>${attrName}: <input type="text" data-attr="${attrName}" value="${attrValue}"></label>`;
  }
  return row;
}
