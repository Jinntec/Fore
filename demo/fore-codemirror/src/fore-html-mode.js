import { html } from '@codemirror/lang-html';
import { syntaxTree } from '@codemirror/language';
import { linter, lintGutter } from '@codemirror/lint';
import foreTreeData from '../../../src/fore-tree.json' with { type: 'json' };

const { macros, tree, exceptions } = foreTreeData;

// Attributes shared across most fx-* elements (ForeElementMixin's ref/context/value,
// AbstractAction's event/if/while/iterate/delay/target/phase/propagate/default-action) -
// kept global rather than repeated on all ~29 action-element entries in fore-tree.json.
const GLOBAL_ATTRS = {
  ref: null,
  context: null,
  value: null,
  event: null,
  if: null,
  while: null,
  iterate: null,
  delay: null,
  target: null,
  phase: ['capture', 'default'],
  propagate: ['stop', 'continue'],
  'default-action': ['cancel', 'perform'],
};

// Plain HTML global attributes that are always valid regardless of the schema,
// so they don't get flagged as "unknown" on fx-* elements.
const HTML_GLOBAL_ATTRS = new Set(['id', 'class', 'style', 'title', 'slot', 'part', 'lang', 'dir', 'hidden']);

/** { tagName: { attrs } } shape @codemirror/lang-html's html() expects, derived from
 *  fore-tree.json's per-tag 'attrs' (already in the right null|string[] value shape). */
function extraTagsFromTree() {
  const extraTags = {};
  for (const [tagName, def] of Object.entries(tree)) {
    if (!tagName.startsWith('fx-')) continue; // skip the 'template' node - it's plain HTML
    extraTags[tagName] = { attrs: def.attrs || {} };
  }
  return extraTags;
}

const EXTRA_TAGS = extraTagsFromTree();

function isKnownAttribute(tagName, attrName) {
  if (HTML_GLOBAL_ATTRS.has(attrName) || attrName.startsWith('data-') || attrName.startsWith('aria-')) return true;
  if (attrName in GLOBAL_ATTRS) return true;
  const def = tree[tagName];
  return !!(def && def.attrs && attrName in def.attrs);
}

/** Tag names of every ancestor Element enclosing `tagNode`, immediate parent first
 *  (includes plain HTML tags like <div> or <template>, not just fx-* ones). */
function ancestorTagNames(openOrSelfClosingNode, state) {
  const names = [];
  // openOrSelfClosingNode.parent is the Element the tag itself opens (its own wrapping
  // node, per Lezer's HTML grammar - OpenTag is a child of the Element it belongs to), so
  // skip one more level up before collecting to avoid the tag counting as its own ancestor.
  let cur = openOrSelfClosingNode.parent ? openOrSelfClosingNode.parent.parent : null;
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

/** Nearest ancestor tag that fore-tree.json actually models (an fx-* tag or 'template'),
 *  skipping over plain HTML wrappers (<div>, <section>, ...) in between - so e.g.
 *  <fx-group><div><fx-output ref="x"/></div></fx-group> still validates fx-output against
 *  fx-group, rather than silently giving up once a styling <div> intervenes.
 *
 *  <template> is treated as a tracked anchor only when it's genuinely an <fx-repeat>'s own
 *  template (its next tracked ancestor is fx-repeat) - a page-level <template> wrapping
 *  arbitrary content (e.g. a whole demo's <fx-fore>, common for deferred/lazy rendering) is
 *  a completely different, unrelated use of the same generic HTML tag, so it's skipped
 *  through like any other untracked wrapper instead of being validated as repeat content. */
function nearestTrackedAncestor(ancestors) {
  for (let i = 0; i < ancestors.length; i++) {
    const tag = ancestors[i];
    if (!(tag in tree)) continue;
    if (tag === 'template') {
      const next = ancestors.slice(i + 1).find((a) => a in tree);
      if (next !== 'fx-repeat') continue;
    }
    return tag;
  }
  return null;
}

/** Expands a node's 'children' list (literal tags + macro references) into a flat Set of
 *  concrete tag names legal there. HTML-ELEMENTS is a wildcard marker, not enumerated -
 *  irrelevant here since only fx-* tags are ever checked against this set. */
function expandChildren(childRefs) {
  const tags = new Set();
  (childRefs || []).forEach((ref) => {
    if (ref === 'HTML-ELEMENTS') return;
    const macro = macros[ref];
    if (Array.isArray(macro)) macro.forEach((t) => tags.add(t));
    else tags.add(ref);
  });
  return tags;
}

/** Depth-first search of `elementNode`'s own subtree (itself included) for any descendant
 *  Element whose tag name is in `targetTags` - mirrors runtime code that locates a child via
 *  plain `querySelector('template')` rather than a stricter "direct child only" check. */
function hasDescendantTag(elementNode, targetTags, state) {
  const cursor = elementNode.cursor();
  let first = true;
  do {
    if (!first && cursor.type.name === 'Element') {
      const tag = cursor.node.getChild('OpenTag') || cursor.node.getChild('SelfClosingTag');
      const nameNode = tag && tag.getChild('TagName');
      if (nameNode && targetTags.includes(state.sliceDoc(nameNode.from, nameNode.to))) return true;
    }
    first = false;
  } while (cursor.next());
  return false;
}

/** Structural nesting + authorability checks, grounded in Fore's actual runtime behavior
 *  (see fore-tree.json). Containment is positional: a tag is valid wherever it's listed in
 *  its nearest tracked ancestor's 'children' - no separate allow/deny rule needed for most
 *  cases. The one exception left is fx-repeat-ref, which needs a literal ancestor *path*
 *  (template > fx-repeat), not just "somewhere under fx-repeat" - see 'exceptions'. */
function structuralDiagnostics(tagName, tagNode, ancestors) {
  const def = tree[tagName];
  const diagnostics = [];

  if (def.authorable === false) {
    diagnostics.push({
      from: tagNode.from,
      to: tagNode.to,
      severity: 'error',
      message: `<${tagName}> should not be written directly${def.note ? ` - ${def.note}` : ''}`,
    });
    return diagnostics; // no point layering containment checks on top of "don't write this at all"
  }

  const parentName = nearestTrackedAncestor(ancestors);
  if (parentName) {
    const allowed = expandChildren(tree[parentName].children);
    if (!allowed.has(tagName)) {
      diagnostics.push({
        from: tagNode.from,
        to: tagNode.to,
        severity: 'error',
        message: `<${tagName}> is not a valid child of <${parentName}>`,
      });
    }
  } else if (tagName !== 'fx-fore') {
    diagnostics.push({
      from: tagNode.from,
      to: tagNode.to,
      severity: 'error',
      message: `<${tagName}> is not valid at the top level`,
    });
  }

  const exception = exceptions[tagName];
  if (exception?.requiresAncestorPath) {
    const missing = exception.requiresAncestorPath.filter((a) => !ancestors.includes(a));
    if (missing.length) {
      diagnostics.push({
        from: tagNode.from,
        to: tagNode.to,
        severity: 'error',
        message: `<${tagName}> only works inside ${exception.requiresAncestorPath.map((a) => `<${a}>`).join(' inside ')} (missing ${missing.map((a) => `<${a}>`).join(', ')})`,
      });
    }
  }

  return diagnostics;
}

/** fx-repeat without a <template> has nothing to repeat - see fore-tree.json's
 *  'requiredChildren'. Looked up anywhere in the element's subtree, matching how
 *  repeat-base.js finds it via a plain querySelector('template') rather than requiring an
 *  immediate child. */
function requiredChildrenDiagnostics(tagName, tagNode, elementNode, state) {
  const required = tree[tagName]?.requiredChildren;
  if (!required || !elementNode || hasDescendantTag(elementNode, required, state)) return [];
  return [
    {
      from: tagNode.from,
      to: tagNode.to,
      severity: 'warning',
      message: `<${tagName}> should contain a ${required.map((r) => `<${r}>`).join(' or ')} - otherwise it has nothing to repeat`,
    },
  ];
}

/** Attributes an element is effectively useless or broken without - see fore-tree.json's
 *  'requiredAttrs'. Severity follows the evidence: 'error' where Fore's own code
 *  throws/dispatches an error event when the attribute is missing, 'warning' where it just
 *  silently no-ops or falls back to a default. */
function requiredAttrsDiagnostics(tagName, tagNode, attrNames) {
  const rule = tree[tagName]?.requiredAttrs;
  if (!rule) return [];
  const diagnostics = [];
  const severity = rule.severity === 'warning' ? 'warning' : 'error';

  if (rule.all) {
    const missing = rule.all.filter((a) => !attrNames.has(a));
    if (missing.length) {
      diagnostics.push({
        from: tagNode.from,
        to: tagNode.to,
        severity,
        message: `<${tagName}> is missing required attribute${missing.length > 1 ? 's' : ''} ${missing.map((a) => `"${a}"`).join(', ')}`,
      });
    }
  }
  if (rule.anyOf && !rule.anyOf.some((a) => attrNames.has(a))) {
    diagnostics.push({
      from: tagNode.from,
      to: tagNode.to,
      severity,
      message: `<${tagName}> needs at least one of: ${rule.anyOf.map((a) => `"${a}"`).join(', ')}`,
    });
  }
  return diagnostics;
}

/** Flags unknown fx-* tag names, unknown attributes on known fx-* tags, structurally wrong
 *  positions, missing required children/attributes, and tags that should never be authored
 *  directly (see fore-tree.json). Plain (non fx-*) HTML tags/attributes are always left alone. */
const foreLinter = (view) => {
  const diagnostics = [];
  const tree$ = syntaxTree(view.state);

  tree$.iterate({
    enter: (node) => {
      if (node.type.name !== 'OpenTag' && node.type.name !== 'SelfClosingTag') return;

      const tagNode = node.node.getChild('TagName');
      if (!tagNode) return;
      const tagName = view.state.sliceDoc(tagNode.from, tagNode.to);
      if (!tagName.startsWith('fx-')) return;

      if (!(tagName in tree)) {
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
      diagnostics.push(...requiredChildrenDiagnostics(tagName, tagNode, node.node.parent, view.state));

      const attrNodes = node.node.getChildren('Attribute');
      const attrNames = new Set();
      attrNodes.forEach((attr) => {
        const nameNode = attr.getChild('AttributeName');
        if (nameNode) attrNames.add(view.state.sliceDoc(nameNode.from, nameNode.to));
      });
      diagnostics.push(...requiredAttrsDiagnostics(tagName, tagNode, attrNames));

      attrNodes.forEach((attr) => {
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

/** CodeMirror language support for Fore markup: plain HTML extended with knowledge of
 *  Fore's fx-* elements/attributes (see fore-tree.json, hand-curated and grounded in Fore's
 *  source - see demo/fore-codemirror/README.md), plus a linter flagging unknown fx-* tags/
 *  attributes, wrong nesting, missing required children, and missing required attributes.
 *  XPath content inside attribute values (ref, calculate, constraint, ...) is not validated -
 *  out of scope for now. */
export { foreLinter };

export function foreHtml() {
  return [
    html({
      selfClosingTags: false,
      extraTags: EXTRA_TAGS,
      extraGlobalAttributes: GLOBAL_ATTRS,
    }),
    linter(foreLinter, { delay: 300 }),
    lintGutter(),
  ];
}
