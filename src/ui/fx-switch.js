import { Fore } from '../fore.js';
import { FxContainer } from './fx-container.js';

/**
 * `fx-switch`
 * a container allowing to switch between fx-case elements
 *
 * @customElement
 */
class FxSwitch extends FxContainer {
  /*
      constructor() {
        super();
        // this.attachShadow({ mode: 'open' });
      }
    */

  constructor() {
    super();
    this.formerCase = {};
    this.selectedCase = null;
    this.cases = null;
    this.visitedResetted = false;
    this.tabTriggers = [];
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    // Opt-in ARIA tabs pattern (role="tablist"/"tab"/"tabpanel", aria-selected, arrow-key
    // navigation). Requires `fx-trigger` tab controls (each with an `fx-toggle` child targeting
    // a sibling `fx-case`) to be direct children, so a valid tablist can be assembled - see
    // ACCESSIBILITY.md. Plain fx-switch usage (bound switches, wizards, accordions built from
    // interleaved trigger/case pairs) is unaffected.
    this.tabsMode = this.getAttribute('appearance') === 'tabs';

    const style = `
       :host ::slotted(fx-case.selected-case){
        display: block;
    }
    `;
    const html = this.tabsMode
      ? `<div part="tablist" role="tablist"><slot name="tab"></slot></div>
         <slot></slot>`
      : `<slot></slot>`;
    this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
        ${html}
    `;
    this.cases = [];
    this.formerCase = null;
    this.selectedCase = null;
    this.tabTriggers = [];

    if (this.tabsMode) {
      this.addEventListener('keydown', e => this._handleTabKeydown(e));
    }
  }

  async refresh(force) {
    super.refresh(force);
    console.log('🔄 fx-switch refresh', force);
    if (this.cases.length === 0) {
      this.cases = Array.from(this.querySelectorAll(':scope > fx-case'));
    }

    if (this.isBound()) {
      this._handleBoundSwitch();
    }
    if (!this.selectedCase) {
      this.selectedCase = this.cases[0]; // first is always default
      this.toggle(this.selectedCase);
    }

    if (this.tabsMode) {
      this._setupTabs();
    }

    Fore.refreshChildren(this.selectedCase, force);
  }

  /**
   * Discovers direct-child `fx-trigger`/`fx-toggle` pairs that target this switch's cases and
   * wires them up as an ARIA tab strip. Runs discovery once (mirroring the `this.cases` caching
   * above); subsequent calls just re-sync the selected state.
   */
  _setupTabs() {
    if (this.tabTriggers.length > 0) {
      this._syncTabSelection();
      return;
    }

    const triggers = Array.from(this.querySelectorAll(':scope > fx-trigger'));
    this.tabTriggers = triggers
      .map(trigger => {
        const toggle = trigger.querySelector(':scope > fx-toggle[case]');
        if (!toggle) return null;
        const targetCase = this.cases.find(c => c.id === toggle.getAttribute('case'));
        if (!targetCase) return null;
        const widget = (trigger.getWidget && trigger.getWidget()) || trigger.firstElementChild;
        if (!widget) return null;
        return { trigger, targetCase, widget };
      })
      .filter(Boolean);

    if (this.tabTriggers.length === 0) return;

    this.tabTriggers.forEach(({ trigger, targetCase, widget }) => {
      trigger.setAttribute('slot', 'tab');
      targetCase.id = targetCase.id || `fx-case-${Fore.createUUID()}`;
      widget.id = widget.id || `fx-tab-${Fore.createUUID()}`;
      widget.setAttribute('role', 'tab');
      widget.setAttribute('aria-controls', targetCase.id);

      targetCase.setAttribute('role', 'tabpanel');
      targetCase.setAttribute('aria-labelledby', widget.id);
      if (!targetCase.hasAttribute('tabindex')) {
        targetCase.setAttribute('tabindex', '0');
      }
    });

    this._syncTabSelection();
  }

  /**
   * Reflects the current `selectedCase` onto the tab strip: `aria-selected` plus a roving
   * tabindex (selected tab is the only one reachable by Tab; arrow keys move between the rest).
   */
  _syncTabSelection() {
    this.tabTriggers.forEach(({ targetCase, widget }) => {
      const selected = targetCase === this.selectedCase;
      widget.setAttribute('aria-selected', String(selected));
      widget.setAttribute('tabindex', selected ? '0' : '-1');
    });
  }

  /**
   * Arrow-key navigation between tabs (Left/Right/Up/Down/Home/End), following the ARIA
   * authoring practices "automatic activation" model - moving focus also selects the case.
   */
  async _handleTabKeydown(e) {
    const { tabTriggers } = this;
    if (tabTriggers.length === 0) return;

    const idx = tabTriggers.findIndex(({ widget }) => widget === e.target);
    if (idx === -1) return;

    let newIdx;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        newIdx = (idx + 1) % tabTriggers.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        newIdx = (idx - 1 + tabTriggers.length) % tabTriggers.length;
        break;
      case 'Home':
        newIdx = 0;
        break;
      case 'End':
        newIdx = tabTriggers.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    const { trigger, widget } = tabTriggers[newIdx];
    await trigger.performActions();
    widget.focus();
  }

  _dispatchEvents() {
    if (this.selectedCase === this.formerCase) return;
    if (this.formerCase && this.formerCase !== this.selectedCase) {
      Fore.dispatch(this.formerCase, 'deselect', {});
    }
    if (this.selectedCase.classList.contains('selected-case')) {
      Fore.dispatch(this.selectedCase, 'select', {});
    }
  }

  _resetVisited() {
    if (this.visitedResetted) return;

    const visited = this.selectedCase.querySelectorAll('.visited');
    Array.from(visited).forEach(v => {
      v.classList.remove('visited');
    });
    this.visitedResetted = true;
  }

  /**
   * handles switches being bound. If modelItem value matches the 'name' attribute that case will be toggled.
   * @private
   */
  _handleBoundSwitch() {
    Array.from(this.cases).forEach(caseElem => {
      const name = caseElem.getAttribute('name');
      if (name === this.modelItem?.value) {
        this.toggle(caseElem);
      }
    });

    this.attachObserver();
  }

  /**
   * Replace an old case with a new case element.
   *
   * @param {import('./fx-case.js').FxCase} oldCase
   * @param {import('./fx-case.js').FxCase} newCase
   */
  async replaceCase(oldCase, newCase) {
    this.cases.splice(this.cases.indexOf(oldCase), 1, newCase);

    if (oldCase === this.selectedCase) {
      this.selectedCase = newCase;
      this.formerCase = newCase;
      newCase.classList.add('selected-case');
      newCase.classList.remove('deselected-case');
      newCase.inert = false;
      // Tell the owner form we might have new template expressions here
      this.getOwnerForm().scanForNewTemplateExpressionsNextRefresh();
    } else {
      newCase.classList.add('deselected-case');
      newCase.classList.remove('selected-case');
      newCase.inert = true;
    }
  }

  /**
   * Activates a fx-case element by switching CSS classes.
   * Dispatches 'select' and 'deselect' events as appropriate.
   *
   * @param {import('./fx-case.js').FxCase} caseElement the fx-case element to activate
   */
  toggle(caseElement) {
    this.selectedCase = caseElement;
    Array.from(this.cases).forEach(c => {
      if (c === this.selectedCase) {
        c.classList.remove('deselected-case');
        c.classList.add('selected-case');
        c.inert = false;
      } else {
        c.classList.remove('selected-case');
        c.classList.add('deselected-case');
        c.inert = true;
        this._resetVisited();
      }
    });

    if (this.selectedCase !== caseElement) {
      this.selectedCase = caseElement;
    }
    this._dispatchEvents();
    this.formerCase = this.selectedCase;

    if (this.tabsMode) {
      this._syncTabSelection();
    }

    // Tell the owner form we might have new template expressions here
    this.getOwnerForm().scanForNewTemplateExpressionsNextRefresh();
    this.getOwnerForm().getModel().updateModel();
  }
}

if (!customElements.get('fx-switch')) {
  window.customElements.define('fx-switch', FxSwitch);
}
