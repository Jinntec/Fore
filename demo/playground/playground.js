import { evaluateXPath } from '../../src/xpath-evaluation.js';
import { FxFore } from '../../src/fx-fore.js';
import { generateForm, formatXmlIndented } from './playground-functions.js';

const DEFAULT_MARKUP = `<fx-fore>
<fx-model>
  <fx-instance id="default"></fx-instance>
  <fx-bind ref="computed" calculate="string-length(../value)"></fx-bind>
</fx-model>
<fx-group>
  <fx-control ref="value">
    <label>Some text</label>
  </fx-control>
  <p>Length is: <fx-output ref="computed"></fx-output></p>
</fx-group>
</fx-fore>`;

const DEFAULT_INSTANCE_XML = `<data>
  <value>Hello Fore</value>
  <computed></computed>
</data>`;

const qs = id => document.getElementById(id);

const markupEditor = qs('pg-markup-editor');
const instanceEditor = qs('pg-instance-editor');
const previewEl = qs('pg-preview');
const xpathResultEl = qs('pg-xpath-result');
const demoSelect = document.querySelector('#pg-demo-control select');
const xpathInput = document.querySelector('#pg-xpath-control textarea');
const instanceSelect = document.querySelector('#pg-instance-select-control select');

// The playground's own toolbar/console/log is a real Fore app (see index.html); this is
// its model, not the dynamically (re)mounted preview instance below. The chrome's own
// instances (state/instances-list/log) are the source of truth for instanceType and
// selectedInstanceId - no parallel JS copy of that state is kept.
const chromeFore = qs('pg-chrome');
const chromeModel = () => chromeFore.getModel();
const commitChrome = () => {
  chromeModel().updateModel();
  chromeFore.refresh(true);
};
function getState(nodeName) {
  return chromeModel().getInstance('state').getInstanceData().querySelector(nodeName).textContent;
}
function setState(nodeName, text) {
  chromeModel().getInstance('state').getInstanceData().querySelector(nodeName).textContent = text;
}
function getInstanceType() {
  return getState('instance-type') === 'json' ? 'json' : 'xml';
}
function getSelectedInstanceId() {
  return getState('selected-instance-id') || 'default';
}

let currentFore = null;
let mountTimer = null;
let suppressUpdateCount = 0;
let justMounted = false;

function suppressNextUpdates(n) {
  suppressUpdateCount += n;
}

function setStatus(message, level) {
  setState('status', message || '');
  const out = document.querySelector('fx-output[ref="instance(\'state\')/status"]');
  if (level) out.setAttribute('data-level', level);
  else out.removeAttribute('data-level');
  commitChrome();
}

function debounceMount() {
  if (suppressUpdateCount > 0) {
    suppressUpdateCount -= 1;
    return;
  }
  clearTimeout(mountTimer);
  mountTimer = setTimeout(mount, 400);
}

function onMarkupUpdate() {
  refreshInstanceOptions();
  debounceMount();
}

function onInstanceUpdate() {
  debounceMount();
}

function getMarkupText() {
  return markupEditor.content ?? '';
}

function getInstanceText() {
  return instanceEditor.content ?? '';
}

function setMarkupText(text) {
  markupEditor.content = text;
}

function setInstanceText(text) {
  instanceEditor.content = text;
}

function setInstanceType(type) {
  instanceEditor.setAttribute('mode', type === 'json' ? 'default' : 'xml');
  setState('instance-type', type);
  commitChrome();
}

function parseFragment(markupText) {
  const template = document.createElement('template');
  template.innerHTML = markupText;
  return template.content;
}

function fragmentToText(frag) {
  const div = document.createElement('div');
  div.appendChild(frag.cloneNode(true));
  return div.innerHTML.trim();
}

/**
 * A demo's first <fx-instance> is implicitly "default" per Fore convention even without an
 * explicit @id; later unlabeled ones get a synthetic id so every instance is addressable.
 */
function instanceIdFor(el, index) {
  return el.getAttribute('id') || (index === 0 ? 'default' : `instance-${index + 1}`);
}

/** Lists every <fx-instance> found in markup text (bare content or full <fx-fore>...</fx-fore>). */
function listInstancesFromMarkup(markupText) {
  const frag = parseFragment(markupText);
  const model = frag.querySelector('fx-model');
  if (!model) return [];
  return Array.from(model.querySelectorAll('fx-instance')).map((el, i) => ({
    id: instanceIdFor(el, i),
    type: el.getAttribute('type') === 'json' ? 'json' : 'xml',
  }));
}

/** Finds the <fx-instance> element matching a given id within an already-parsed fragment. */
function findInstanceElement(frag, targetId) {
  const model = frag.querySelector('fx-model');
  if (!model) return null;
  const els = Array.from(model.querySelectorAll('fx-instance'));
  const idx = els.findIndex((el, i) => instanceIdFor(el, i) === targetId);
  return idx >= 0 ? els[idx] : null;
}

/**
 * Rebuilds the chrome's instances-list Fore instance from the current markup (the picker
 * <select> and its show/hide-when-single-instance relevance are declarative Fore bindings
 * in index.html - this just supplies the data that markup parsing can't itself produce).
 * If the previously selected id no longer exists (structure changed), falls back to the
 * first instance's id without touching the Instance Data pane's content - that only
 * happens via the deliberate switchSelectedInstance() below.
 */
function refreshInstanceOptions() {
  const list = listInstancesFromMarkup(getMarkupText());

  const listRoot = chromeModel().getInstance('instances-list').getInstanceData().querySelector('instances');
  listRoot.textContent = '';
  list.forEach(({ id }) => {
    const el = listRoot.ownerDocument.createElement('instance');
    el.setAttribute('id', id);
    listRoot.appendChild(el);
  });

  if (!list.some(({ id }) => id === getSelectedInstanceId())) {
    setState('selected-instance-id', list[0]?.id || 'default');
  }
  commitChrome();
}

/**
 * Switches which instance the Instance Data pane mirrors: commits the pane's current text
 * back into the markup for the instance being left (so edits aren't lost), then loads the
 * newly selected instance's markup-embedded content into the pane.
 */
function switchSelectedInstance(newId) {
  const oldId = getSelectedInstanceId();
  if (newId === oldId) return;

  let markupText = getMarkupText();
  const oldFrag = parseFragment(markupText);
  const oldEl = findInstanceElement(oldFrag, oldId);
  if (oldEl) {
    if (getInstanceType() === 'json') {
      oldEl.setAttribute('type', 'json');
      oldEl.textContent = getInstanceText();
    } else {
      oldEl.removeAttribute('type');
      oldEl.innerHTML = getInstanceText();
    }
    markupText = fragmentToText(oldFrag);
    suppressNextUpdates(1);
    setMarkupText(markupText);
  }

  const newFrag = parseFragment(markupText);
  const newEl = findInstanceElement(newFrag, newId);
  const newType = newEl && newEl.getAttribute('type') === 'json' ? 'json' : 'xml';
  const newText = newEl ? (newType === 'json' ? newEl.textContent.trim() : newEl.innerHTML.trim()) : '';

  setState('selected-instance-id', newId);
  setInstanceType(newType);
  suppressNextUpdates(1);
  setInstanceText(newText);
  mount();
}

/**
 * Builds the attributes + child DOM to drop into a fresh <fx-fore>: parses the markup
 * pane (a full <fx-fore>...</fx-fore>, or bare inner content for backward compatibility),
 * injects the instance-pane text into the first src-less <fx-instance> found (creating one
 * + a wrapping <fx-model> if the markup doesn't have one), and registers the playground's
 * generate-form() extension function via <fx-functionlib>. Carries over any attributes on
 * the markup's own <fx-fore> tag (e.g. create-nodes, xmlns:* namespace declarations).
 */
function assembleForeContent(markupText, instanceText, instanceType, targetInstanceId) {
  const template = document.createElement('template');
  template.innerHTML = markupText;
  const frag = template.content;

  let attributes = [];
  let container = frag;
  const outerFore =
    frag.children.length === 1 && frag.firstElementChild.tagName === 'FX-FORE'
      ? frag.firstElementChild
      : null;
  if (outerFore) {
    attributes = Array.from(outerFore.attributes).map(a => [a.name, a.value]);
    container = document.createDocumentFragment();
    while (outerFore.firstChild) container.appendChild(outerFore.firstChild);
  }

  let model = container.querySelector('fx-model');
  if (!model) {
    model = document.createElement('fx-model');
    container.prepend(model);
  }

  if (!model.querySelector('fx-functionlib')) {
    const lib = document.createElement('fx-functionlib');
    lib.setAttribute('src', './playground-functions.js');
    lib.setAttribute('type', 'module');
    model.prepend(lib);
  }

  const instanceEls = Array.from(model.querySelectorAll('fx-instance'));
  let instanceEl =
    instanceEls.find((el, i) => instanceIdFor(el, i) === targetInstanceId) || instanceEls[0] || null;
  if (!instanceEl && instanceText.trim()) {
    instanceEl = document.createElement('fx-instance');
    instanceEl.setAttribute('id', targetInstanceId || 'default');
    model.appendChild(instanceEl);
  }

  if (instanceEl) {
    // A src starting with "#" is a runtime sentinel Fore itself special-cases (e.g.
    // "#querystring" - see fx-instance.js - populates the instance from the page's own URL
    // query string). It isn't a fetchable path, so leave it completely alone rather than
    // overwriting it with the (empty) instance-pane text - the pane has nothing meaningful
    // to show for data that's synthesized at runtime.
    const existingSrc = instanceEl.getAttribute('src');
    if (!existingSrc || !existingSrc.startsWith('#')) {
      instanceEl.removeAttribute('src');
      if (instanceType === 'json') {
        instanceEl.setAttribute('type', 'json');
        instanceEl.textContent = instanceText;
      } else {
        instanceEl.removeAttribute('type');
        instanceEl.innerHTML = instanceText;
      }
    }
  }

  return { attributes, fragment: container };
}

/**
 * Mirrors the live preview's selected instance back into the Instance Data pane. Needed
 * because the preview can mutate its own data independently of the pane - e.g. an
 * fx-setvalue/fx-insert action firing from a trigger inside the preview - and that's the
 * only direction the pane didn't already track (edits made IN the pane already flow to the
 * preview via debounceMount). Skipped for the first refresh-done right after mount() since
 * that cycle just reflects what the pane already contains verbatim.
 */
function syncInstanceEditorFromPreview(fore) {
  const model = typeof fore.getModel === 'function' ? fore.getModel() : null;
  const inst =
    model && typeof model.getInstance === 'function' ? model.getInstance(getSelectedInstanceId()) : null;
  if (!inst) return;

  let text;
  try {
    if (inst.getAttribute('type') === 'json') {
      text = JSON.stringify(inst.instanceData, undefined, 2);
    } else {
      const data = inst.getInstanceData();
      if (!data) return;
      const keepDeclaration = getInstanceText().trim().startsWith('<?xml');
      text = formatXmlIndented(data, { keepDeclaration });
    }
  } catch {
    return;
  }

  if (!text || text.trim() === getInstanceText().trim()) return;
  suppressNextUpdates(1);
  setInstanceText(text);
}

function wireForeEvents(fore) {
  fore.addEventListener('rebuild-done', () => logEvent('rebuild-done'));
  fore.addEventListener('recalculate-done', () => logEvent('recalculate-done'));
  fore.addEventListener('refresh-done', () => {
    logEvent('refresh-done');
    logCycleTimings(fore);
    if (justMounted) {
      justMounted = false;
    } else {
      syncInstanceEditorFromPreview(fore);
    }
  });
  fore.addEventListener('error', e => {
    setStatus(e.detail?.message || 'Fore reported an error', 'error');
  });
}

function logEvent(text) {
  const log = chromeModel().getInstance('log').getInstanceData().querySelector('log');
  const entry = log.ownerDocument.createElement('entry');
  const textEl = log.ownerDocument.createElement('text');
  const t = new Date().toLocaleTimeString();
  textEl.textContent = `[${t}] ${text}`;
  entry.appendChild(textEl);
  log.appendChild(entry);
  trimLog(log);
  commitChrome();
  const wrap = document.querySelector('.pg-eventlog');
  if (wrap) wrap.scrollTop = wrap.scrollHeight;
}

function logCycleTimings(fore) {
  const model = typeof fore.getModel === 'function' ? fore.getModel() : null;
  const cycle = model?.debugInfo?.lastCycle;
  if (!cycle) return;
  logEvent(
    `  rebuild ${cycle.rebuildMs.toFixed(1)}ms · recalculate ${cycle.recalculateMs.toFixed(1)}ms · ` +
      `revalidate ${cycle.revalidateMs.toFixed(1)}ms · total ${cycle.totalMs.toFixed(1)}ms`,
  );
}

function trimLog(log) {
  while (log.children.length > 200) {
    log.removeChild(log.firstElementChild);
  }
}

function showPreviewError(err) {
  previewEl.innerHTML = '';
  const pre = document.createElement('pre');
  pre.className = 'pg-error';
  pre.textContent = String(err?.message || err);
  previewEl.appendChild(pre);
  setStatus('Failed to render preview', 'error');
}

function mount() {
  if (!customElements.get('fx-fore')) {
    customElements.whenDefined('fx-fore').then(mount);
    return;
  }
  // Built via parser construction (innerHTML), not document.createElement('fx-fore'):
  // programmatically constructing this tag directly can leave the browser's custom-element
  // registry in a state where later instances silently fail to upgrade (observed as a
  // "must not have attributes" exception followed by inert <fx-fore> elements).
  const wrapper = document.createElement('div');
  wrapper.innerHTML = '<fx-fore></fx-fore>';
  const fore = wrapper.firstElementChild;
  try {
    const { attributes, fragment } = assembleForeContent(
      getMarkupText(),
      getInstanceText(),
      getInstanceType(),
      getSelectedInstanceId(),
    );
    attributes.forEach(([name, value]) => fore.setAttribute(name, value));
    fore.appendChild(fragment);
  } catch (e) {
    showPreviewError(e);
    return;
  }
  justMounted = true;
  wireForeEvents(fore);
  previewEl.replaceChildren(fore);
  currentFore = fore;
  setStatus('', null);
}

function extractForeElement(doc) {
  const direct = doc.querySelector('fx-fore');
  if (direct) return direct;
  const templates = Array.from(doc.querySelectorAll('template'));
  for (const t of templates) {
    const found = t.content.querySelector('fx-fore');
    if (found) return found;
  }
  return null;
}

/**
 * Splits a demo's <fx-fore> into markup + the target instance's inline text/src, same as
 * before - but also rewrites every OTHER <fx-instance src="..."> to an absolute URL first.
 * Once this markup is remounted inside the playground's own page, a relative src would
 * otherwise resolve against demo/playground/ instead of the demo's real directory and 404
 * (confirmed with demo/codelists/codelist-editor.html, which has a second src-bearing
 * instance beside the one this function inlines into the pane). A src starting with "#" is
 * left untouched throughout - it's a runtime sentinel Fore special-cases itself (e.g.
 * "#querystring" in fx-instance.js populates from the page's own URL query string), not a
 * fetchable path; rewriting it into a real URL broke that demo's model entirely (white
 * screen) since Fore's check is a literal string match.
 */
function splitForeMarkup(foreEl, demoUrl) {
  const clone = foreEl.cloneNode(true);

  Array.from(clone.querySelectorAll('fx-instance[src]')).forEach(el => {
    const src = el.getAttribute('src');
    if (src && !src.startsWith('#')) el.setAttribute('src', new URL(src, demoUrl).href);
  });

  const instanceEl = clone.querySelector('fx-instance');
  let instanceText = '';
  let instanceType = 'xml';
  let instanceSrc = null;

  if (instanceEl) {
    instanceType = instanceEl.getAttribute('type') === 'json' ? 'json' : 'xml';
    const src = instanceEl.getAttribute('src');
    if (src && src.startsWith('#')) {
      // Leave the sentinel src (and the element) exactly as authored - nothing to
      // pre-fetch, and the pane has no meaningful static text to show for it.
    } else {
      instanceSrc = src;
      if (!instanceSrc) {
        instanceText =
          instanceType === 'json' ? instanceEl.textContent.trim() : instanceEl.innerHTML.trim();
      }
      instanceEl.removeAttribute('src');
      instanceEl.textContent = '';
    }
  }

  return { markup: clone.outerHTML.trim(), instanceText, instanceType, instanceSrc };
}

/** Rewrites every real selector in a parsed stylesheet's rule list to be scoped under
 *  `prefix`, recursing into @media/@supports (which nest plain style rules) while leaving
 *  rule types with no real selector (@keyframes steps, @font-face, ...) untouched. */
function scopeCssRules(rules, prefix, out) {
  Array.from(rules).forEach(rule => {
    if (rule.type === CSSRule.STYLE_RULE) {
      rule.selectorText = rule.selectorText
        .split(',')
        .map(s => `${prefix} ${s.trim()}`)
        .join(', ');
      out.push(rule.cssText);
    } else if (rule.type === CSSRule.IMPORT_RULE) {
      // Skip: @import targets (shared base stylesheets/fonts) are almost certainly already
      // loaded by the playground's own page, and @import is only valid as the very first
      // rule(s) in a stylesheet - which no longer holds once concatenated after a demo's
      // own inline <style> text - so it wouldn't round-trip cleanly anyway.
    } else if (rule.cssRules) {
      const inner = [];
      scopeCssRules(rule.cssRules, prefix, inner);
      out.push(`${rule.cssText.slice(0, rule.cssText.indexOf('{') + 1)}\n${inner.join('\n')}\n}`);
    } else {
      out.push(rule.cssText);
    }
  });
}

/**
 * Demo CSS is authored assuming it owns the whole page, but the playground mounts the live
 * preview inside its own chrome - so a demo's stylesheet has to be scoped to #pg-preview
 * before use. Without this, a demo defining the common `[unresolved]{display:none}` idiom
 * (paired with `<body unresolved="unresolved">`, used throughout demo/) would match the
 * whole document rather than just its own markup and blank out the entire playground page -
 * confirmed with demo/query-instance.html. Parses the CSS via a detached <style> element
 * (so real CSSOM rule objects are available to rewrite) rather than regexing the text.
 */
function scopeCss(cssText) {
  const probe = document.createElement('style');
  probe.textContent = cssText;
  document.head.appendChild(probe);
  try {
    if (!probe.sheet) return cssText;
    const out = [];
    scopeCssRules(probe.sheet.cssRules, '#pg-preview', out);
    return out.join('\n');
  } catch {
    return cssText;
  } finally {
    probe.remove();
  }
}

/**
 * Loads a stylesheet the same way a real <link rel="stylesheet"> would (so Vite's dev
 * server serves genuine CSS rather than the JS-wrapped module it returns for a plain
 * fetch() of a .css URL - confirmed a raw fetch() here produces a bogus "import {}" rule
 * from the leading `import { createHotContext } from ...` of that wrapper), reads its
 * parsed CSSOM rules, then removes it. `media="not all"` keeps it from ever actually
 * being applied to the page even for the brief moment it's attached - we only want the
 * parsed rules to re-emit (scoped) ourselves.
 */
function loadStylesheetRules(href) {
  return new Promise(resolve => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.media = 'not all';
    const finish = () => {
      let rules = [];
      try {
        rules = Array.from(link.sheet?.cssRules || []);
      } catch {
        rules = [];
      }
      link.remove();
      resolve(rules);
    };
    link.addEventListener('load', finish);
    link.addEventListener('error', () => {
      link.remove();
      resolve([]);
    });
    link.href = href;
    document.head.appendChild(link);
  });
}

/** Carries over a demo's own <style> text plus its <link rel="stylesheet"> hrefs - hrefs
 *  are resolved to absolute URLs against the demo's own directory first since they're
 *  being loaded from the playground's page, not the demo's. */
async function applyDemoStyles(doc, demoUrl) {
  const inlineCss = Array.from(doc.querySelectorAll('style'))
    .map(s => s.textContent)
    .join('\n');

  const linkHrefs = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
    .map(link => link.getAttribute('href'))
    .filter(Boolean)
    .map(href => new URL(href, demoUrl).href);

  const linkedRuleSets = await Promise.all(linkHrefs.map(loadStylesheetRules));
  const linkedOut = [];
  linkedRuleSets.forEach(rules => scopeCssRules(rules, '#pg-preview', linkedOut));

  qs('pg-demo-style').textContent = `${scopeCss(inlineCss)}\n${linkedOut.join('\n')}`;
}

function clearDemoStyles() {
  qs('pg-demo-style').textContent = '';
}

/** Demos can depend on <script> tags outside their own <fx-fore> (extra custom elements,
 *  inline event wiring) - see demo/codelists/codelist-editor.html's fx-action.js/fx-lens.js
 *  imports and its trailing inline <script>. We deliberately don't try to load/execute
 *  these (that starts to mean running arbitrary demo-authored code in our own page) - just
 *  tell the user via the Update Cycle Log so missing interactivity isn't a silent mystery. */
function reportExternalScripts(doc, foreEl) {
  const scripts = Array.from(doc.querySelectorAll('script')).filter(s => !foreEl.contains(s));
  if (!scripts.length) return;
  const names = scripts.map(s => s.getAttribute('src') || '(inline script)').join(', ');
  logEvent(`Note: demo depends on script(s) not loaded here: ${names}`);
}

async function loadDemo(path) {
  try {
    setStatus('Loading demo…', null);
    const demoUrl = new URL(path, window.location.href);
    const res = await fetch(demoUrl);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const foreEl = extractForeElement(doc);
    if (!foreEl) throw new Error('No <fx-fore> element found in this demo.');

    reportExternalScripts(doc, foreEl);
    const { markup, instanceText, instanceType, instanceSrc } = splitForeMarkup(foreEl, demoUrl);
    let finalInstanceText = instanceText;

    if (instanceSrc) {
      const dataUrl = new URL(instanceSrc, demoUrl);
      const dataRes = await fetch(dataUrl);
      if (dataRes.ok) {
        finalInstanceText = (await dataRes.text()).trim();
      }
    }

    await applyDemoStyles(doc, demoUrl);
    setInstanceType(instanceType);
    suppressNextUpdates(2);
    setMarkupText(markup);
    setInstanceText(finalInstanceText);
    refreshInstanceOptions();
    mount();
    setStatus('Demo loaded.', 'ok');
  } catch (e) {
    setStatus(`Could not load demo: ${e.message}`, 'error');
  }
}

function resetToDefault() {
  clearDemoStyles();
  demoSelect.value = '';
  setState('selected-demo', '');
  setInstanceType('xml');
  suppressNextUpdates(2);
  setMarkupText(DEFAULT_MARKUP);
  setInstanceText(DEFAULT_INSTANCE_XML);
  refreshInstanceOptions();
  mount();
}

function runGenerateForm() {
  const text = getInstanceText().trim();
  if (!text) {
    setStatus('Enter some instance data first.', 'error');
    return;
  }
  let root;
  try {
    if (getInstanceType() === 'json') {
      root = JSON.parse(text);
    } else {
      const doc = new DOMParser().parseFromString(text, 'application/xml');
      const errorNode = doc.querySelector('parsererror');
      if (errorNode) throw new Error(errorNode.textContent.trim());
      root = doc.documentElement;
    }
  } catch (e) {
    setStatus(`Could not parse instance data: ${e.message}`, 'error');
    return;
  }

  const controls = generateForm(root);
  const typeAttr = getInstanceType() === 'json' ? ' type="json"' : '';
  suppressNextUpdates(1);
  setMarkupText(
    `<fx-fore>\n<fx-model>\n  <fx-instance id="default"${typeAttr}></fx-instance>\n</fx-model>\n<fx-group>\n${controls}\n</fx-group>\n</fx-fore>`,
  );
  refreshInstanceOptions();
  mount();
  setStatus('Form generated from data.', 'ok');
}

function runXPathEval() {
  const expr = xpathInput.value.trim();
  if (!expr || !currentFore) return;

  let errorMessage = null;
  const onError = e => {
    errorMessage = e.detail?.message || 'XPath evaluation failed';
  };
  currentFore.addEventListener('error', onError, { once: true });

  const model = typeof currentFore.getModel === 'function' ? currentFore.getModel() : null;
  const inst =
    model && typeof model.getInstance === 'function'
      ? model.getInstance(getSelectedInstanceId())
      : null;
  const contextNode =
    inst && inst.getAttribute && inst.getAttribute('type') === 'json'
      ? inst.nodeset
      : inst?.getInstanceData?.() || currentFore.ownerDocument;

  const results = evaluateXPath(expr, contextNode, currentFore);
  currentFore.removeEventListener('error', onError);

  if (errorMessage) {
    xpathResultEl.textContent = errorMessage;
    return;
  }

  if (!results.length) {
    xpathResultEl.textContent = '(empty sequence)';
    return;
  }

  const serializer = new XMLSerializer();
  const lines = results.map(r => {
    if (r && typeof r.nodeType === 'number') return serializer.serializeToString(r);
    if (r && typeof r.getValue === 'function') return JSON.stringify(r.getValue());
    return String(r);
  });
  xpathResultEl.textContent = lines.join('\n');
}

function encodeState(obj) {
  const json = JSON.stringify(obj);
  return btoa(unescape(encodeURIComponent(json)));
}

function decodeState(str) {
  const json = decodeURIComponent(escape(atob(str)));
  return JSON.parse(json);
}

async function copyShareLink() {
  const payload = {
    m: getMarkupText(),
    i: getInstanceText(),
    t: getInstanceType(),
  };
  const url = `${window.location.origin}${window.location.pathname}#state=${encodeState(payload)}`;
  try {
    await navigator.clipboard.writeText(url);
    setStatus('Link copied to clipboard.', 'ok');
  } catch {
    window.prompt('Copy this link:', url);
  }
}

function loadFromHash() {
  const hash = window.location.hash;
  if (!hash.startsWith('#state=')) return false;
  try {
    const payload = decodeState(hash.slice('#state='.length));
    setInstanceType(payload.t === 'json' ? 'json' : 'xml');
    suppressNextUpdates(2);
    setMarkupText(payload.m || '');
    setInstanceText(payload.i || '');
    refreshInstanceOptions();
    return true;
  } catch (e) {
    setStatus(`Could not load shared link: ${e.message}`, 'error');
    return false;
  }
}

function initExpandToggle() {
  const btn = qs('pg-expand-toggle');
  const grid = document.querySelector('.pg-grid');
  btn.addEventListener('click', () => {
    const expanded = grid.classList.toggle('pg-expanded');
    btn.textContent = expanded ? '⤡ Collapse' : '⤢ Expand';
  });
}

/** Manual fallback for auto-refresh: mounts straight from the editors' current text,
 *  bypassing debounceMount() in case anything ever suppresses its trigger. */
function initRefreshButton() {
  const btn = qs('pg-refresh-btn');
  btn.addEventListener('click', () => {
    clearTimeout(mountTimer);
    refreshInstanceOptions();
    mount();
  });
}

async function init() {
  markupEditor.addEventListener('update', onMarkupUpdate);
  instanceEditor.addEventListener('update', onInstanceUpdate);

  document.querySelectorAll('input[name="pg-instance-type"]').forEach(radio => {
    radio.addEventListener('change', e => {
      setInstanceType(e.target.value);
      mount();
    });
  });

  demoSelect.addEventListener('change', () => {
    if (demoSelect.value) loadDemo(demoSelect.value);
  });

  instanceSelect.addEventListener('change', () => {
    switchSelectedInstance(instanceSelect.value);
  });

  document.addEventListener('pg-new', resetToDefault);
  document.addEventListener('pg-generate', runGenerateForm);
  document.addEventListener('pg-share', copyShareLink);
  document.addEventListener('pg-evaluate', runXPathEval);
  xpathInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runXPathEval();
    }
  });

  initExpandToggle();
  initRefreshButton();

  // The chrome's own <fx-fore> (toolbar/console/log) initializes asynchronously; setState/
  // setStatus/commitChrome below need its model to exist first.
  await FxFore.waitUntilReady(chromeFore);

  if (!loadFromHash()) {
    setInstanceType('xml');
    suppressNextUpdates(2);
    setMarkupText(DEFAULT_MARKUP);
    setInstanceText(DEFAULT_INSTANCE_XML);
    refreshInstanceOptions();
  }
  mount();
}

init();
