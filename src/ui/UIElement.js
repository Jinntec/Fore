import ForeElementMixin from '../ForeElementMixin.js';
import { Fore } from '../fore.js';
import { resolveId } from '../xpath-evaluation.js';

export class UIElement extends ForeElementMixin {
  /** Accessible name of the button hiding an on-demand element. `{label}` is the element's name. */
  static hideLabel = 'Hide {label}';

  /** Status announced after an on-demand element was hidden. `{label}` is the element's name. */
  static hiddenMessage = '{label} hidden';

  constructor() {
    super();

    this._removeEventListeners = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.ondemand = this.hasAttribute('on-demand');
    this.wasOnDemandInitially = this.ondemand;

    if (this.ondemand) {
      this.addEventListener('show-control', () => {
        this.removeAttribute('on-demand');
      });
      this.addTrashIcon();
    }

    const ref = this.getAttribute('ref');
    // TODO: make this smarter, handling multiple index functions etc
    if (ref && ref.includes('index(')) {
      const repeatId = ref.match(/index\(['"](?<repeatId>[^'"]*)['"]\)/)?.groups?.repeatId;
      if (repeatId) {
        /**
         * @type {import('./fx-repeat.js').FxRepeat}
         */
        const repeat = resolveId(repeatId, this, 'fx-repeat');
        const onRepeatItemChanged = () => {
          this.getOwnerForm().addToBatchedNotifications(this);
        };
        repeat.addEventListener('item-changed', onRepeatItemChanged);
        this._removeEventListeners.push(() =>
          repeat.removeEventListener('item-changed', onRepeatItemChanged),
        );
      }
    }
  }

  disconnectedCallback() {
    if (this.modelItem && typeof this.modelItem.removeObserver === 'function') {
      this.modelItem.removeObserver(this);
    }

    this._refTrackedModelItems.forEach(modelItems => {
      modelItems.forEach(mi => mi.removeObserver(this));
    });
    this._refTrackedModelItems.clear();

    for (const removeEventListener of this._removeEventListeners) {
      removeEventListener();
    }
  }
  /*
  evalInContext() {
    this.dependencies.resetDependencies();
    const model = this.getModel();
    if (!model) return;

    const touchedNodes = new Set();
    const domFacade = new DependencyNotifyingDomFacade(node => touchedNodes.add(node));

    const context = this.getInScopeContext();
    const result = evaluateXPath(this.ref, context, this, domFacade);
    this.nodeset = Array.isArray(result) ? result : [result];

    touchedNodes.forEach(node => {
      const mi = model.getModelItem(node);
      if (mi) {
        mi.addObserver(this);
        console.log(`[UIElement] Dynamically observing ${mi.path} due to XPath dependency`);
      }
    });

    // Manually evaluate predicate parts to ensure detection
    const predicateRegex = /\[(.*?)\]/g;
    let match;
    while ((match = predicateRegex.exec(this.ref)) !== null) {
      const predicate = match[1];
      try {
        const predicateContext = model.getDefaultInstance().getDefaultContext();
        const predDomFacade = new DependencyNotifyingDomFacade(n => touchedNodes.add(n));
        evaluateXPathToBoolean(predicate, predicateContext, this, predDomFacade);

        touchedNodes.forEach(node => {
          const mi = model.getModelItem(node);
          if (mi) {
            mi.addObserver(this);
            console.log(`[UIElement] Observing ${mi.path} (from predicate: ${predicate})`);
          }
        });
      } catch (e) {
        console.warn('Predicate evaluation failed for dependency tracking:', predicate, e);
      }
    }
  }
*/

  /**
   * Mirrors relevant/nonrelevant into the `inert` primitive so a nonrelevant control is
   * unreachable by keyboard/AT even if CSS visibility rules ever change. CSS already hides
   * nonrelevant elements (display:none), so this is a semantic backstop, not the primary mechanism.
   */
  _reflectRelevantInert(enabled) {
    this.inert = !enabled;
  }

  attachObserver() {
    const modelItem = this.getModelItem();
    if (!modelItem || typeof modelItem.addObserver !== 'function') return;

    if (!modelItem.observers) {
      modelItem.observers = new Set();
    }
    if (modelItem.observers.has(this)) {
      // console.log(`[UIElement] Observer already registered for ref="${this.ref}"`);
      return;
    }
    modelItem.addObserver(this);
    // console.log(`[UIElement] attaching observer for ref="${this.ref}"`, this);

    // if (typeof this.update === 'function') {
    //   this.update(modelItem);
    // }
  }

  /**
   * Called by ModelItem when it changes
   * @param {import('../modelitem.js').ModelItem} modelItem - The ModelItem that changed
   */

  /*
  update(modelItem) {
    if (this.isBound()) {
      // console.log('[UIElement] update()', modelItem);
      // this.getOwnerForm().addToBatchedNotifications(modelItem);
      this.refresh();
    }
  }
*/

  update(_modelItem) {
    if (!this.isBound()) return;
    const fore = this.getOwnerForm();
    if (!fore) return;

    // Preserve legacy eager updates unless we're already in a refresh phase.
    if (fore.isRefreshPhase) {
      fore.addToBatchedNotifications(this);
    } else {
      this.refresh();
    }
  }
  // init() {
  //   throw new Error('You have to implement the method init!');
  // }

  async refresh(force) {}

  async refreshChildren(force) {
    await Fore.refreshChildren(this, force);
  }

  activate() {
    this.removeAttribute('on-demand');
    this.style.display = '';
    if (this.isBound()) {
      this.refresh(true);
    }
    Fore.dispatch(this, 'show-group', {});
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'on-demand') {
      this.ondemand = newValue !== null;
      if (!newValue && !this.wasOnDemandInitially) {
        this.removeTrashIcon();
      } else {
        this.wasOnDemandInitially = true;
        this.addTrashIcon();
      }
    }
  }

  static get observedAttributes() {
    return ['on-demand'];
  }

  /**
   * Name of this element for the on-demand menu and the hide button: the `aria-label`, else the
   * label of the control (`<label>` child or `label` attribute), else a descendant label.
   *
   * @returns {string} the name or an empty string
   */
  getOnDemandLabel() {
    return (
      this.getAttribute('aria-label') ||
      this.querySelector(':scope > label')?.textContent.trim() ||
      this.getAttribute('label') ||
      this.querySelector('label')?.textContent.trim() ||
      ''
    );
  }

  /**
   * Hides an on-demand element again: the reverse of `activate()`. A keyboard user would lose
   * focus when the focused element disappears, so focus is moved to the `fx-control-menu` trigger
   * (or else the nearest focusable element) and the removal is announced.
   */
  async hide() {
    const hadFocus = this.contains(document.activeElement);
    const label = this.getOnDemandLabel();
    this.setAttribute('on-demand', 'true');
    this.style.display = 'none';
    document.dispatchEvent(new CustomEvent('update-control-menu'));
    await Fore.dispatch(this, 'hide-control', {});
    if (hadFocus) this._focusAfterHide();
    Fore.announce(UIElement.hiddenMessage.replace('{label}', label).trim());
  }

  _focusAfterHide() {
    const menu = Array.from(document.querySelectorAll('fx-control-menu')).find(m => {
      const container = m._getScopedContainer?.();
      return container && (container === this || container.contains(this));
    });
    if (menu?.triggerButton && !menu.triggerButton.disabled) {
      menu.triggerButton.focus();
      return;
    }
    const focusables = Array.from(
      document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(el => !this.contains(el) && el.getClientRects().length > 0);
    const following = focusables.find(
      el => this.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    const preceding = focusables.filter(
      el => this.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING,
    );
    (following || preceding[preceding.length - 1])?.focus();
  }

  addTrashIcon() {
    if (!this.closest('[show-icon]')) return;
    const name = UIElement.hideLabel.replace('{label}', this.getOnDemandLabel()).trim();
    const existing = this.querySelector('.trash');
    if (existing) {
      existing.setAttribute('aria-label', name);
      return;
    }

    const icon = document.createElement('span');
    icon.innerHTML = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"
       stroke="currentColor" stroke-width="2" stroke-linecap="round"
       stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.94 17.94C16.13 19.12 14.13 20 12 20C7 20 2.73 15.88 1 12C1.6 10.66 2.43 9.47 3.46 8.48M10.58 10.58C10.21 11.01 10 11.5 10 12C10 13.11 10.89 14 12 14C12.5 14 12.99 13.79 13.42 13.42M6.53 6.53C7.87 5.54 9.39 5 12 5C17 5 21.27 9.12 23 12C22.4 13.34 21.57 14.53 20.54 15.52M1 1L23 23"/>
  </svg>
`;
    icon.classList.add('trash');
    // a named, keyboard operable button (the bare span was neither)
    icon.setAttribute('role', 'button');
    icon.setAttribute('tabindex', '0');
    icon.setAttribute('aria-label', name);
    icon.setAttribute('title', name);
    icon.style.cursor = 'pointer';
    icon.style.marginLeft = '0.5em';

    icon.addEventListener('click', e => {
      e.stopPropagation();
      this.hide();
    });
    icon.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      }
    });

    this.appendChild(icon);
  }

  removeTrashIcon() {
    const icon = this.querySelector('.trash');
    if (icon) icon.remove();
  }
}

if (!customElements.get('ui-element')) {
  customElements.define('ui-element', UIElement);
}
