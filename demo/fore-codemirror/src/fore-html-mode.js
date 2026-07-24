import { html } from '@codemirror/lang-html';
import { syntaxTree } from '@codemirror/language';
import { linter, lintGutter } from '@codemirror/lint';
import schema from './fore-schema.json';
import structure from './fore-structure.json';

// Plain HTML global attributes that are always valid regardless of the schema,
// so they don't get flagged as "unknown" on fx-* elements.
const HTML_GLOBAL_ATTRS = new Set(['id', 'class', 'style', 'title', 'slot', 'part', 'lang', 'dir', 'hidden']);

function isKnownAttribute(tagName, attrName) {
  if (HTML_GLOBAL_ATTRS.has(attrName) || attrName.startsWith('data-') || attrName.startsWith('aria-')) return true;
  if (schema.extraGlobalAttributes && attrName in schema.extraGlobalAttributes) return true;
  const tag = schema.extraTags[tagName];
  return !!(tag && tag.attrs && attrName in tag.attrs);
}

/** Tag names of every ancestor Element enclosing `tagNode`, immediate parent first. */
function ancestorTagNames(openOrSelfClosingNode, state) {
  const names = [];
  let cur = openOrSelfClosingNode.parent; // parent of OpenTag/SelfClosingTag is its Element
  while (cur) {
    if (cur.type.name === 'Element') {
      const tag = cur.getChild('OpenTag') || cur.getChild('SelfClosingTag');
      const nameNode = tag && tag.getChild('TagName');
      if (nameNode) names.push(state.sliceDoc(nameNode.from, nameNode.to));
    }
    cur = cur.parent;
  }
  return names;
}

/** Structural nesting checks grounded in Fore's actual runtime behavior (see
 *  fore-structure.json) - e.g. <fx-bind> only does anything when found (however
 *  deeply nested inside other <fx-bind>s) under <fx-model>; UI elements like
 *  <fx-control>/<fx-group> placed inside <fx-model> render but are inert
 *  (fx-model sets `inert` on itself, which cascades) rather than erroring, but
 *  that's exactly the kind of silent breakage worth flagging here. */
function structuralDiagnostics(tagName, tagNode, ancestors) {
  const diagnostics = [];

  const requiredAncestors = structure.requiresAncestor[tagName];
  if (requiredAncestors && !requiredAncestors.some((a) => ancestors.includes(a))) {
    diagnostics.push({
      from: tagNode.from,
      to: tagNode.to,
      severity: 'error',
      message: `<${tagName}> only works inside ${requiredAncestors.map((a) => `<${a}>`).join(' or ')}`,
    });
  }

  const requiredParent = structure.requiresDirectParent[tagName];
  if (requiredParent && !requiredParent.includes(ancestors[0])) {
    diagnostics.push({
      from: tagNode.from,
      to: tagNode.to,
      severity: 'error',
      message: `<${tagName}> must be a direct child of ${requiredParent.map((a) => `<${a}>`).join(' or ')}`,
    });
  }

  const disallowed = structure.disallowedAncestor[tagName];
  if (disallowed) {
    const hit = disallowed.find((a) => ancestors.includes(a));
    if (hit) {
      diagnostics.push({
        from: tagNode.from,
        to: tagNode.to,
        severity: 'error',
        message: `<${tagName}> is not allowed inside <${hit}> (would render but stay inert/non-functional)`,
      });
    }
  }

  return diagnostics;
}

/** Flags unknown fx-* tag names, unknown attributes on known fx-* tags, and
 *  fx-* elements used in a structurally wrong position (see fore-structure.json).
 *  Plain (non fx-*) HTML tags/attributes are always left alone. */
const foreLinter = (view) => {
  const diagnostics = [];
  const tree = syntaxTree(view.state);

  tree.iterate({
    enter: (node) => {
      if (node.type.name !== 'OpenTag' && node.type.name !== 'SelfClosingTag') return;

      const tagNode = node.node.getChild('TagName');
      if (!tagNode) return;
      const tagName = view.state.sliceDoc(tagNode.from, tagNode.to);
      if (!tagName.startsWith('fx-')) return;

      if (!(tagName in schema.extraTags)) {
        diagnostics.push({
          from: tagNode.from,
          to: tagNode.to,
          severity: 'error',
          message: `Unknown Fore element <${tagName}>`,
        });
        return;
      }

      const ancestors = ancestorTagNames(node.node, view.state);
      diagnostics.push(...structuralDiagnostics(tagName, tagNode, ancestors));

      node.node.getChildren('Attribute').forEach((attr) => {
        const nameNode = attr.getChild('AttributeName');
        if (!nameNode) return;
        const attrName = view.state.sliceDoc(nameNode.from, nameNode.to);
        if (!isKnownAttribute(tagName, attrName)) {
          diagnostics.push({
            from: nameNode.from,
            to: nameNode.to,
            severity: 'warning',
            message: `Unknown attribute "${attrName}" on <${tagName}>`,
          });
        }
      });
    },
  });

  return diagnostics;
};

/** CodeMirror language support for Fore markup: plain HTML extended with
 *  knowledge of Fore's fx-* elements/attributes (see fore-schema.json, generated
 *  from the fore-skills reference doc by scripts/build-schema.mjs), plus a linter
 *  flagging unknown fx-* tags/attributes. XPath content inside attribute values
 *  (ref, calculate, constraint, ...) is not validated - out of scope for now. */
export function foreHtml() {
  return [
    html({
      selfClosingTags: false,
      extraTags: schema.extraTags,
      extraGlobalAttributes: schema.extraGlobalAttributes,
    }),
    linter(foreLinter, { delay: 300 }),
    lintGutter(),
  ];
}
