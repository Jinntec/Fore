import { foreElementMixin } from '../ForeElementMixin.js';

/**
 * `fx-action`
 * a button triggering Fore actions
 *
 * @customElement
 * @demo demo/index.html
 */
export class FxAction extends foreElementMixin(HTMLElement) {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();

    this.needsRebuild = false;
    this.needsRecalculate = false;
    this.needsRevalidate = false;
    this.needsRefresh = false;
  }

  connectedCallback() {
    this.style.display = 'none';

    if (this.hasAttribute('event')) {
      this.event = this.getAttribute('event');
    } else {
      this.event = 'activate';
    }

    this.target = this.getAttribute('target');
    if (this.target) {
      this.targetElement = document.getElementById(this.target);
      this.targetElement.addEventListener(this.event, () => this.execute());
    } else {
      this.targetElement = this.parentNode;
      this.targetElement.addEventListener(this.event, e => this.execute(e));
      // console.log('adding listener for ', this.event , ` to `, this);
    }
  }

  execute(e) {
    if (this.isBound()) {
      this.evalInContext();
    }
  }

  actionPerformed() {
    const model = this.getModel();
    if (this.needsRebuild) {
      model.rebuild();
    }
    if (this.needsRecalculate) {
      model.recalculate();
    }
    if (this.needsRevalidate) {
      model.revalidate();
    }
    if (this.needsRefresh) {
      model.parentNode.refresh();
    }
  }

  dispatchActionPerformed() {
    this.dispatchEvent(
      new CustomEvent('action-performed', { composed: true, bubbles: true, detail: {} }),
    );
  }
}

window.customElements.define('fx-action', FxAction);
