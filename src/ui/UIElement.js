import ForeElementMixin from '../ForeElementMixin';
import { Fore } from '../fore';

export class UIElement extends ForeElementMixin {
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this.ondemand = this.hasAttribute('on-demand') ? true : false;
    this.wasOnDemandInitially = this.ondemand;
    if (this.ondemand) {
      this.addEventListener('show-control', () => {
        this.removeAttribute('on-demand');
      });
      this.addTrashIcon();
    }
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
    // Only show icon if explicitly marked by control-menu

    if (!this.closest('[show-icon]')) return;

    // const wrapper = this.shadowRoot.querySelector('.wrapper');
    // if (!wrapper || wrapper.querySelector('.trash')) return;
    const trash = this.querySelector('.trash');
    if (trash) return;
    const icon = document.createElement('span');
    icon.innerHTML = '&#128465;'; // trash icon
    icon.classList.add('trash');
    icon.setAttribute('title', 'Hide this control');
    icon.setAttribute('part', 'trash');
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
    debugger;
    const icon = this.querySelector('.trash');
    if (icon) icon.remove();
  }
}
if (!customElements.get('ui-element')) {
  customElements.define('ui-element', UIElement);
}
