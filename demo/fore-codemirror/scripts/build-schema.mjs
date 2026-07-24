#!/usr/bin/env node
// Converts the Fore element reference (maintained in the sibling fore-skills repo)
// into the {extraTags, extraGlobalAttributes} shape @codemirror/lang-html's html()
// expects. Run manually whenever reference.md changes - see README.md in this folder.
//
// Known simplification: attributes from the two "Shared ..." sections
// (ForeElementMixin's ref/context/value, and AbstractAction's event/if/while/...)
// are folded into extraGlobalAttributes rather than modeled per-tag. This means
// e.g. <fx-output> will also complete "if"/"while" even though only action
// elements actually use them - an unused suggestion, not a lint error, so the
// tradeoff is cheap and avoids modeling Fore's own inheritance chains here.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REFERENCE_MD =
  process.env.FORE_REFERENCE_MD || path.resolve(__dirname, '../../../../fore-skills/reference.md');
const OUT_FILE = path.resolve(__dirname, '../src/fore-schema.json');

if (!existsSync(REFERENCE_MD)) {
  console.error(
    `Could not find reference.md at ${REFERENCE_MD}.\n` +
      `Set FORE_REFERENCE_MD=/path/to/reference.md to point at your fore-skills checkout.`,
  );
  process.exit(1);
}

const text = readFileSync(REFERENCE_MD, 'utf8');
const lines = text.split('\n');

// Every ## / ### heading with its line index, used to find section boundaries.
const headings = [];
lines.forEach((line, i) => {
  const m = /^(#{2,3})\s+(.*)$/.exec(line);
  if (m) headings.push({ level: m[1].length, text: m[2].trim(), line: i });
});

/** Body text of the section starting at `startLine`, up to the next heading at `level` or shallower. */
function sectionBody(startLine, level) {
  const startIdx = headings.findIndex((h) => h.line === startLine);
  for (let i = startIdx + 1; i < headings.length; i++) {
    if (headings[i].level <= level) {
      return lines.slice(startLine + 1, headings[i].line).join('\n');
    }
  }
  return lines.slice(startLine + 1).join('\n');
}

/** Parses a Markdown pipe table into [{name, notes}], using the first cell as the
 *  attribute name and the last cell as the free-text notes/description. */
function parseAttributeTable(body) {
  const rows = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|'));
  if (rows.length < 2) return [];
  // rows[0] = header, rows[1] = --- separator, rest = data
  const dataRows = rows.slice(2);
  const result = [];
  for (const row of dataRows) {
    const cells = row
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (!cells.length) continue;
    const notes = cells[cells.length - 1] || '';
    const rawName = cells[0].replace(/`/g, '').trim();
    if (!rawName) continue;
    // Some cells list alternate names ("action-start / action-end") - register each.
    rawName.split('/').forEach((n) => {
      const name = n.trim();
      if (name) result.push({ name, notes });
    });
  }
  return result;
}

/** Notes text -> null (free-form, e.g. XPath) or a suggested-value list, based on
 *  whether the notes mention 2+ distinct single-quoted tokens (e.g. 'capture'/'default'). */
function enumValuesFrom(notes) {
  const found = new Set();
  const re = /'([\w-]+)'/g;
  let m;
  while ((m = re.exec(notes))) found.add(m[1]);
  return found.size >= 2 ? Array.from(found) : null;
}

function attrsToRecord(attrRows) {
  const attrs = {};
  attrRows.forEach(({ name, notes }) => {
    attrs[name] = enumValuesFrom(notes);
  });
  return attrs;
}

const level2Headings = headings.filter((h) => h.level === 2);

// --- Shared sections: fold into extraGlobalAttributes ---
const sharedHeading = level2Headings.find((h) => h.text.startsWith('Shared attributes and events'));
const extraGlobalAttributes = {};
if (sharedHeading) {
  const sharedHeadings = headings.filter(
    (h) => h.line > sharedHeading.line && h.level === 3 && h.text.match(/^Shared attributes$|^Shared action attributes/),
  );
  sharedHeadings.forEach((h) => {
    const rows = parseAttributeTable(sectionBody(h.line, 3));
    Object.assign(extraGlobalAttributes, attrsToRecord(rows));
  });
} else {
  console.warn('Warning: could not find "Shared attributes and events" section - extraGlobalAttributes will be incomplete.');
}

// --- Per-element sections: any level-2 heading whose text contains `<fx-...>` ---
const extraTags = {};
level2Headings.forEach((h, idx) => {
  const tagNames = Array.from(h.text.matchAll(/`<(fx-[\w-]+)>`/g)).map((m) => m[1]);
  if (!tagNames.length) return; // group header like "## Actions", not an element

  const sectionEndLine = idx + 1 < level2Headings.length ? level2Headings[idx + 1].line : lines.length;
  const attributesHeading = headings.find(
    (sub) => sub.line > h.line && sub.line < sectionEndLine && sub.level === 3 && sub.text === 'Attributes',
  );

  const attrs = attributesHeading ? attrsToRecord(parseAttributeTable(sectionBody(attributesHeading.line, 3))) : {};
  tagNames.forEach((tag) => {
    extraTags[tag] = { attrs };
  });
});

const tagCount = Object.keys(extraTags).length;
if (tagCount < 30) {
  console.warn(`Warning: only found ${tagCount} fx-* elements - reference.md's format may have changed.`);
}

const schema = { extraTags, extraGlobalAttributes };
writeFileSync(OUT_FILE, JSON.stringify(schema, null, 2) + '\n');
console.log(`Wrote ${OUT_FILE} - ${tagCount} elements, ${Object.keys(extraGlobalAttributes).length} shared attributes.`);
