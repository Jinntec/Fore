import AbstractControl from './abstract-control.js';
import ForeElementMixin from '../ForeElementMixin';
import { Fore } from '../fore';

export class UIElement extends ForeElementMixin {
  constructor() {
    super();
  }

  connectedCallback() {
    this.ondemand = this.hasAttribute('on-demand') ? true : false;
    if (this.ondemand) {
      this.style.display = 'none';
      this.addTrashIcon();
    }
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
    const icon = this.querySelector('.trash');
    if (icon) icon.remove();
  }
}
if (!customElements.get('ui-element')) {
  customElements.define('ui-element', UIElement);
}
