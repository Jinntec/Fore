// Adds the `docs` block to src/fore-tree.json: tooltip-sized descriptions of every element and attribute, taken from the
// fore-skills element reference (itself generated from the Fore source, with hand-written notes).
//
//   node scripts/build-tree-docs.mjs [path/to/fore-skills/reference.md]      (default: ../fore-skills/reference.md)
//   npm run docs:tree
//
// scripts/tree-docs-extra.json adds what the reference lacks. Only `docs` is touched; the grammar itself (tree, attrGroups, ...) is not generated and stays hand-curated.
// Shape: docs = { shared: { attr: text }, tags: { 'fx-submission': { description: text, attrs: { url: text } } } }
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const treePath = resolve(root, 'src/fore-tree.json');
const referencePath = resolve(process.argv[2] ?? resolve(root, '../fore-skills/reference.md'));

if (!existsSync(referencePath)) {
  console.error(`element reference not found: ${referencePath}`);
  process.exit(1);
}

/** Markdown to the plain text of a tooltip. */
const plain = s =>
  s
    .replace(/\\\|/g, '|')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

/** Splits a table row on unescaped pipes. */
const cells = line =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map(c => c.trim());

const names = cell => [...cell.matchAll(/`([^`]+)`/g)].map(m => m[1].trim());

const docs = { shared: {}, tags: {} };

let tag = null; // current element section
let mode = null; // 'shared' | 'attrs' | null: which table we are in
let header = null;
let seenDescription = false;

for (const line of readFileSync(referencePath, 'utf8').split('\n')) {
  const h2 = line.match(/^## `<([a-z][a-z0-9-]*)[^>]*>`/);
  if (h2) {
    [, tag] = h2;
    docs.tags[tag] ??= { description: '', attrs: {} };
    mode = null;
    seenDescription = false;
  } else if (/^## /.test(line)) {
    tag = null;
    mode = null;
  } else if (/^### /.test(line)) {
    header = null;
    if (!tag && /^### Shared (action )?attributes/i.test(line)) mode = 'shared';
    else if (tag && /^### Attributes/i.test(line)) mode = 'attrs';
    else mode = null;
    if (tag && !/^### Attributes/i.test(line)) seenDescription = true;
  } else if (
    // the first paragraph of an element section describes the element
    tag &&
    !mode &&
    !seenDescription &&
    line.trim() &&
    !/^(\*\*Source\*\*|\||>)/.test(line)
  ) {
    docs.tags[tag].description = plain(line);
    seenDescription = true;
  } else if (mode && line.trim().startsWith('|')) {
    const row = cells(line);
    if (/^:?-+:?$/.test(row[0])) continue; // table separator
    if (!header) {
      header = row.map(c => c.toLowerCase());
      continue;
    }
    const description = plain(row[row.length - 1] ?? '');
    for (const key of names(row[0])) {
      if (mode === 'shared') docs.shared[key] ??= description;
      else docs.tags[tag].attrs[key] = description;
    }
  }
}

// hand-written additions win over the generated text
const extraPath = resolve(root, 'scripts/tree-docs-extra.json');
if (existsSync(extraPath)) {
  const extra = JSON.parse(readFileSync(extraPath, 'utf8'));
  Object.assign(docs.shared, extra.shared);
  for (const [name, entry] of Object.entries(extra.tags ?? {})) {
    docs.tags[name] ??= { description: '', attrs: {} };
    if (entry.description) docs.tags[name].description = entry.description;
    Object.assign(docs.tags[name].attrs, entry.attrs);
  }
}

const data = JSON.parse(readFileSync(treePath, 'utf8'));
data.docs = docs;

const sentence =
  " 'docs' holds a short description of every element and attribute for tooltips; it is generated from the fore-skills " +
  'element reference by scripts/build-tree-docs.mjs (npm run docs:tree) and is not grammar - nothing validates against it. ' +
  "Per element 'attrs' has the entries that element documents itself; 'shared' covers the attributes of the attrGroups.";
if (!data._comment.includes("'docs' holds")) data._comment = data._comment.trimEnd() + sentence;

writeFileSync(treePath, `${JSON.stringify(data, null, 2)}\n`);

// coverage of the grammar, so a stale reference shows up
let total = 0;
let covered = 0;
for (const [name, def] of Object.entries(data.tree)) {
  const all = {
    ...(def.inherits ?? []).reduce((a, g) => ({ ...a, ...data.attrGroups[g] }), {}),
    ...def.attrs,
  };
  for (const attr of Object.keys(all)) {
    total += 1;
    if (docs.tags[name]?.attrs[attr] || docs.shared[attr]) covered += 1;
  }
}
const described = Object.values(docs.tags).filter(t => t.description).length;
console.log(
  `docs: ${Object.keys(docs.tags).length} elements (${described} described), ${
    Object.keys(docs.shared).length
  } shared attributes; grammar attributes with a description: ${covered}/${total} (${Math.round(
    (100 * covered) / total,
  )}%)`,
);
