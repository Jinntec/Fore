/**
 * Authoring integrity checks for Fore forms.
 *
 * Runs by default at startup. Add the `no-check` attribute to `<fx-fore>` to disable
 * (e.g. in production). The module is dynamically imported, so it is never loaded
 * when checks are disabled.
 *
 * Adding a new check: add a function `_check<Name>(fore, errors)` and call it in
 * `checkAuthoring()` below.
 */

const INSTANCE_RE = /instance\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const INDEX_RE = /index\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

// Attributes that may carry XPath expressions
const XPATH_ATTRS = [
  'ref', 'value', 'calculate', 'constraint', 'required', 'readonly',
  'relevant', 'bind', 'context', 'if', 'while', 'origin', 'iterate', 'at',
];

function _isDynamic(val) {
  return !val || val.includes('{');
}

function _byId(fore, id) {
  return fore.ownerDocument.getElementById(id) || fore.getRootNode().getElementById?.(id) || fore.querySelector(`#${id}`);
}

function _checkSendSubmissions(fore, errors) {
  const model = fore.querySelector(':scope > fx-model');
  fore.querySelectorAll('fx-send[submission]').forEach(el => {
    const id = el.getAttribute('submission');
    if (_isDynamic(id)) return;
    const target = model ? model.querySelector(`fx-submission#${id}`) : fore.querySelector(`fx-submission#${id}`);
    if (!target) {
      errors.push({ element: el, message: `<fx-send submission="${id}">: no <fx-submission id="${id}"> found` });
    }
  });
}

function _checkDispatchTargets(fore, errors) {
  fore.querySelectorAll('fx-dispatch[targetid]').forEach(el => {
    const id = el.getAttribute('targetid');
    if (_isDynamic(id)) return;
    if (!_byId(fore, id)) {
      errors.push({ element: el, message: `<fx-dispatch targetid="${id}">: no element with id="${id}" found` });
    }
  });
}

function _checkXPathInstanceRefs(fore, errors) {
  const allEls = Array.from(fore.querySelectorAll('*'));
  for (const el of allEls) {
    for (const attr of XPATH_ATTRS) {
      const val = el.getAttribute(attr);
      if (!val) continue;

      INSTANCE_RE.lastIndex = 0;
      let m;
      while ((m = INSTANCE_RE.exec(val)) !== null) {
        const id = m[1];
        if (!fore.querySelector(`fx-instance#${id}`)) {
          errors.push({
            element: el,
            message: `[${attr}="${val}"]: instance('${id}') — no <fx-instance id="${id}"> found`,
          });
        }
      }

      INDEX_RE.lastIndex = 0;
      while ((m = INDEX_RE.exec(val)) !== null) {
        const id = m[1];
        if (!fore.querySelector(`fx-repeat#${id}`)) {
          errors.push({
            element: el,
            message: `[${attr}="${val}"]: index('${id}') — no <fx-repeat id="${id}"> found`,
          });
        }
      }
    }
  }
}

function _checkCallActions(fore, errors) {
  fore.querySelectorAll('fx-call[action]').forEach(el => {
    const id = el.getAttribute('action');
    if (_isDynamic(id)) return;
    if (!_byId(fore, id)) {
      errors.push({ element: el, message: `<fx-call action="${id}">: no element with id="${id}" found` });
    }
  });
}

function _checkShowHideDialogs(fore, errors) {
  fore.querySelectorAll('fx-show[dialog], fx-hide[dialog]').forEach(el => {
    const id = el.getAttribute('dialog');
    if (_isDynamic(id)) return;
    if (!_byId(fore, id)) {
      errors.push({ element: el, message: `<${el.localName} dialog="${id}">: no element with id="${id}" found` });
    }
  });
}

function _checkLoadAttachTo(fore, errors) {
  fore.querySelectorAll('fx-load[attach-to]').forEach(el => {
    const val = el.getAttribute('attach-to');
    if (_isDynamic(val)) return;
    if (!val.startsWith('#')) return; // _blank, _self etc. are valid non-id targets
    const id = val.substring(1);
    if (!_byId(fore, id)) {
      errors.push({ element: el, message: `<fx-load attach-to="${val}">: no element with id="${id}" found` });
    }
  });
}

function _checkRefreshControl(fore, errors) {
  fore.querySelectorAll('fx-refresh[control]').forEach(el => {
    const id = el.getAttribute('control');
    if (_isDynamic(id)) return;
    if (!_byId(fore, id)) {
      errors.push({ element: el, message: `<fx-refresh control="${id}">: no element with id="${id}" found` });
    }
  });
}

function _checkResetInstance(fore, errors) {
  const model = fore.querySelector(':scope > fx-model');
  fore.querySelectorAll('fx-reset[instance]').forEach(el => {
    const id = el.getAttribute('instance');
    if (_isDynamic(id)) return;
    const target = model ? model.querySelector(`fx-instance#${id}`) : fore.querySelector(`fx-instance#${id}`);
    if (!target) {
      errors.push({ element: el, message: `<fx-reset instance="${id}">: no <fx-instance id="${id}"> found` });
    }
  });
}

function _checkSetfocusControl(fore, errors) {
  fore.querySelectorAll('fx-setfocus[control]').forEach(el => {
    const id = el.getAttribute('control');
    if (_isDynamic(id)) return;
    if (!_byId(fore, id)) {
      errors.push({ element: el, message: `<fx-setfocus control="${id}">: no element with id="${id}" found` });
    }
  });
}

function _checkToggleCase(fore, errors) {
  fore.querySelectorAll('fx-toggle[case]').forEach(el => {
    const id = el.getAttribute('case');
    if (_isDynamic(id)) return;
    if (!fore.querySelector(`fx-case#${id}`)) {
      errors.push({ element: el, message: `<fx-toggle case="${id}">: no <fx-case id="${id}"> found` });
    }
  });
}

/**
 * Run all authoring checks on a given `<fx-fore>` element.
 * Returns an array of `{ element, message }` error objects.
 *
 * @param {HTMLElement} fore
 * @returns {{ element: HTMLElement, message: string }[]}
 */
export function checkAuthoring(fore) {
  const errors = [];
  _checkSendSubmissions(fore, errors);
  _checkDispatchTargets(fore, errors);
  _checkXPathInstanceRefs(fore, errors);
  _checkCallActions(fore, errors);
  _checkShowHideDialogs(fore, errors);
  _checkLoadAttachTo(fore, errors);
  _checkRefreshControl(fore, errors);
  _checkResetInstance(fore, errors);
  _checkSetfocusControl(fore, errors);
  _checkToggleCase(fore, errors);
  return errors;
}
