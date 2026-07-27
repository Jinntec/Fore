// Extension functions for the Fore Playground, loaded via <fx-functionlib type="module">.
// Demonstrates Fore's custom-function mechanism (see demo/function-lib/) while also backing
// the playground's "Generate form from data" button.

function labelFor(name) {
  return String(name)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase());
}

function walkXmlChildren(el) {
  const children = Array.from(el.children || []);
  const order = [];
  const byName = new Map();
  children.forEach(c => {
    const n = c.tagName;
    if (!byName.has(n)) {
      byName.set(n, []);
      order.push(n);
    }
    byName.get(n).push(c);
  });

  return order.map(name => {
    const group = byName.get(name);
    if (group.length > 1) {
      const sample = group[0];
      const inner = sample.children.length
        ? walkXmlChildren(sample)
        : [`  <fx-control ref="."><label>${labelFor(name)}</label></fx-control>`];
      return `<fx-repeat ref="${name}">\n<template>\n${inner.join('\n')}\n</template>\n</fx-repeat>`;
    }
    const only = group[0];
    if (only.children.length) {
      return `<fx-group ref="${name}">\n${walkXmlChildren(only).join('\n')}\n</fx-group>`;
    }
    return `<fx-control ref="${name}"><label>${labelFor(name)}</label></fx-control>`;
  });
}

// Fore's JSON lens binds via chainable "?key" lookups (see demo/json/json-repeat-binding.html),
// not plain XPath steps - a bare "maker" step is invalid outside an XML node context. Leaves
// use the full "?a?b?c" chain from the current context; fx-repeat resets that chain to the
// array item, matching how the existing JSON demos bind inside a repeat template.
function jsonRef(path) {
  return path.map(key => `?${key}`).join('');
}

function walkJsonEntries(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];

  return Object.entries(value).flatMap(([key, val]) => {
    const childPath = [...path, key];
    if (Array.isArray(val)) {
      const sample = val[0];
      const inner =
        sample && typeof sample === 'object' && !Array.isArray(sample)
          ? walkJsonEntries(sample, [])
          : [`  <fx-control ref="."><label>${labelFor(key)}</label></fx-control>`];
      return [
        `<fx-repeat ref="${jsonRef(childPath)}">\n<template>\n${inner.join('\n')}\n</template>\n</fx-repeat>`,
      ];
    }
    if (val && typeof val === 'object') {
      return walkJsonEntries(val, childPath);
    }
    return [`<fx-control ref="${jsonRef(childPath)}"><label>${labelFor(key)}</label></fx-control>`];
  });
}

/**
 * Walks an XML or JSON instance root and emits a starter fx-repeat/fx-group/fx-control
 * tree - one control per leaf, grouped/repeated to match the data's shape. Accepts a DOM
 * node (XML), a fontoxpath JSON-lens node, or a plain JS value (used when called directly
 * as a JS function rather than through XPath).
 */
export function generateForm(node) {
  let root = node;
  if (root && typeof root === 'object' && root.__jsonlens__ === true) {
    root = typeof root.getValue === 'function' ? root.getValue() : root.value;
  }

  if (root && typeof root.nodeType === 'number') {
    const el = root.nodeType === 9 ? root.documentElement : root;
    return walkXmlChildren(el).join('\n');
  }

  return walkJsonEntries(root, []).join('\n');
}
generateForm.signature = 'generate-form($node as item()) as xs:string';

export const functions = [generateForm];

function escapeText(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return escapeText(str).replace(/"/g, '&quot;');
}

function serializeAttributes(el) {
  return Array.from(el.attributes)
    .map(a => ` ${a.name}="${escapeAttr(a.value)}"`)
    .join('');
}

// Serializes a node and all descendants with no added whitespace - used for elements whose
// content genuinely mixes text and child elements, where inserting line breaks would change
// what the content visually means.
function serializeInline(node) {
  if (node.nodeType === Node.TEXT_NODE) return escapeText(node.data);
  if (node.nodeType === Node.CDATA_SECTION_NODE) return `<![CDATA[${node.data}]]>`;
  if (node.nodeType === Node.COMMENT_NODE) return `<!--${node.data}-->`;
  if (node.nodeType === Node.ELEMENT_NODE) {
    const attrs = serializeAttributes(node);
    if (!node.childNodes.length) return `<${node.tagName}${attrs}/>`;
    const inner = Array.from(node.childNodes).map(serializeInline).join('');
    return `<${node.tagName}${attrs}>${inner}</${node.tagName}>`;
  }
  return '';
}

function hasMixedContent(el) {
  return Array.from(el.childNodes).some(
    n =>
      (n.nodeType === Node.TEXT_NODE && n.data.trim()) || n.nodeType === Node.CDATA_SECTION_NODE,
  );
}

function serializeBlock(node, depth, indentUnit) {
  if (node.nodeType === Node.COMMENT_NODE) return `${indentUnit.repeat(depth)}<!--${node.data}-->`;
  if (node.nodeType !== Node.ELEMENT_NODE) return null; // whitespace-only text between elements

  const pad = indentUnit.repeat(depth);
  const attrs = serializeAttributes(node);

  if (!node.childNodes.length) return `${pad}<${node.tagName}${attrs}/>`;
  if (hasMixedContent(node)) return `${pad}${serializeInline(node)}`;

  const childLines = Array.from(node.childNodes)
    .map(child => serializeBlock(child, depth + 1, indentUnit))
    .filter(line => line !== null);

  if (!childLines.length) return `${pad}<${node.tagName}${attrs}/>`;

  return `${pad}<${node.tagName}${attrs}>\n${childLines.join('\n')}\n${pad}</${node.tagName}>`;
}

/**
 * Tree-based XML indenter for the playground's live-preview -> Instance Data pane sync (see
 * syncInstanceEditorFromPreview in playground.js). Unlike an XSLT identity-transform-with-
 * indent (which unconditionally breaks every child onto its own line and always drops the
 * XML declaration), this only inserts line breaks between elements whose children are ALL
 * elements/comments - text-and-element "mixed content" is kept on one line verbatim - and
 * preserves the caller's choice of whether to re-emit a leading <?xml ...?> declaration.
 */
export function formatXmlIndented(node, { keepDeclaration = false, indent = '  ' } = {}) {
  const root = node.nodeType === Node.DOCUMENT_NODE ? node.documentElement : node;
  if (!root) return '';
  const body = serializeBlock(root, 0, indent) || '';
  return keepDeclaration ? `<?xml version="1.0" encoding="UTF-8"?>\n${body}` : body;
}
