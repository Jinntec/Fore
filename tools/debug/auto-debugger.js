/**
 * Auto-inject one <fx-debugger> when URL contains ?debug.
 *
 * Supported:
 *
 *   ?debug
 *     Attach to the first available <fx-fore>.
 *
 *   ?debug=myFore
 *     Attach to <fx-fore id="myFore">.
 *
 * URL-driven debugging always pre-gates the selected target.
 *
 * Notes:
 * - Plain pages have live <fx-fore> elements.
 * - demo-snippet pages may have <fx-fore> elements inside <template> first.
 * - This module injects only one debugger panel.
 */

const DEBUG_PARAM = 'debug';

autoInjectDebugger();


function resolveInitialDebugTarget(debugValue) {
  const liveTargets = getLiveForeElements();
  const templateTargets = getTemplateForeElements();

  if (debugValue && debugValue !== 'true') {
    return (
      liveTargets.find(target => target.id === debugValue) ||
      templateTargets.find(target => target.id === debugValue) ||
      null
    );
  }

  return liveTargets[0] || templateTargets[0] || null;
}

function getLiveForeElements() {
  return Array.from(document.querySelectorAll('fx-fore'));
}

function getTemplateForeElements() {
  return Array.from(document.querySelectorAll('template')).flatMap(template =>
    Array.from(template.content.querySelectorAll('fx-fore')),
  );
}

function ensureTargetId(target) {
  if (!target.id) {
    target.id = 'fx-fore-debug-1';
  }
}

function preGateFore(target) {
  const debugInitEvent = getDebugInitEvent(target);

  target.__debuggerManagedInitGate = true;
  target.__debuggerManagedInitEvent = debugInitEvent;

  if (!target.hasAttribute('init-on')) {
    target.setAttribute('init-on', debugInitEvent);
    target.setAttribute('init-on-target', 'document');
    return;
  }

  console.warn(
    `[Fore DevTools] <fx-fore id="${target.id}"> already has init-on="${target.getAttribute(
      'init-on',
    )}". Debugger will not override it.`,
  );
}

function isTemplateContained(target) {
  const root = target.getRootNode();
  return root instanceof DocumentFragment && root.host === undefined;
}

function observeForStampedTarget(targetId) {
  const existing = document.getElementById(targetId);

  if (existing?.localName === 'fx-fore') {
    injectDebugger(targetId);
    return;
  }

  const observer = new MutationObserver(() => {
    const target = document.getElementById(targetId);

    if (!target || target.localName !== 'fx-fore') {
      return;
    }

    observer.disconnect();
    injectDebugger(targetId);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

function injectDebugger(targetId) {
  const existing = document.querySelector('fx-debugger');

  if (existing) {
    existing.setAttribute('for', targetId);
    return;
  }

  const debuggerElement = document.createElement('fx-debugger');
  debuggerElement.setAttribute('for', targetId);
  debuggerElement.setAttribute('gate-init', '');

  document.body.insertBefore(debuggerElement, document.body.firstChild);
}

async function autoInjectDebugger() {
  const params = new URLSearchParams(window.location.search);

  if (!params.has(DEBUG_PARAM)) {
    return;
  }

  window.__FORE_DEBUG__ = true;

  const debugValue = params.get(DEBUG_PARAM);
  const target = resolveInitialDebugTarget(debugValue);

  if (!target) {
    console.warn('[Fore DevTools] No <fx-fore> found for ?debug.');
    return;
  }

  ensureTargetId(target);
  preGateFore(target);

  await import('./fx-debugger.js');

  if (isTemplateContained(target)) {
    observeForStampedTarget(target.id);
    return;
  }

  injectDebugger(target.id);
}


function getDebugInitEvent(target) {
  return `fx-debugger-ready-${target.id}`;
}
