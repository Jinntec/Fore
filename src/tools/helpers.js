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
      row.innerHTML = `<label>${attrName}: <input type="number" data-attr="${attrName}" value="${attrValue}" readonly="readonly"></label>`;
      break;
    default:
      row.innerHTML = `<label>${attrName}: <input type="text" data-attr="${attrName}" value="${attrValue}" readonly="readonly"></label>`;
  }
  return row;
}
