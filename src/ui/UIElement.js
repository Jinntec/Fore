import ForeElementMixin from '../ForeElementMixin.js';
import { Fore } from '../fore.js';
import { evaluateXPath, evaluateXPathToBoolean } from '../xpath-evaluation';
import { DependencyNotifyingDomFacade } from '../DependencyNotifyingDomFacade';

export class UIElement extends ForeElementMixin {
  constructor() {
    super();
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
  }

  disconnectedCallback() {
    if (this.modelItem && typeof this.modelItem.removeObserver === 'function') {
      console.log(`[UIElement] Removing observer for ref="${this.ref}"`);
      this.modelItem.removeObserver(this);
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

  attachObserver() {
    const modelItem = this.getModelItem();
    if (!modelItem || typeof modelItem.addObserver !== 'function') return;

    if (!modelItem.observers) {
      modelItem.observers = new Set();
    }
    if (modelItem.observers.has(this)) {
      console.log(`[UIElement] Observer already registered for ref="${this.ref}"`);
      return;
    }
    modelItem.observers.add(this);
    modelItem.addObserver(this);
    console.log(`[UIElement] Adding observer for ref="${this.ref}"`);

    if (typeof this.update === 'function') {
      this.update(modelItem);
    }
  }

  update(modelItem) {
    console.log(`[UIElement] update() called for ref="${this.ref}" with value:`, modelItem?.value);
  }

  activate() {
    console.log('UIElement.activate() called');
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

  addTrashIcon() {
    if (!this.closest('[show-icon]')) return;
    const trash = this.querySelector('.trash');
    if (trash) return;

    const icon = document.createElement('span');
    icon.innerHTML = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round"
       stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.94 17.94C16.13 19.12 14.13 20 12 20C7 20 2.73 15.88 1 12C1.6 10.66 2.43 9.47 3.46 8.48M10.58 10.58C10.21 11.01 10 11.5 10 12C10 13.11 10.89 14 12 14C12.5 14 12.99 13.79 13.42 13.42M6.53 6.53C7.87 5.54 9.39 5 12 5C17 5 21.27 9.12 23 12C22.4 13.34 21.57 14.53 20.54 15.52M1 1L23 23"/>
  </svg>
`;
    icon.classList.add('trash');
    icon.setAttribute('title', 'Hide');
    icon.style.cursor = 'pointer';
    icon.style.marginLeft = '0.5em';

    icon.addEventListener('click', e => {
      e.stopPropagation();
      this.setAttribute('on-demand', 'true');
      this.style.display = 'none';
      document.dispatchEvent(new CustomEvent('update-control-menu'));
      Fore.dispatch(this, 'hide-control', {});
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
