import ForeElementMixin from '../ForeElementMixin.js';
import { Fore } from '../fore.js';

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
    // Only show icon if explicitly marked by control-menu

    if (!this.closest('[show-icon]')) return;

    // const wrapper = this.shadowRoot.querySelector('.wrapper');
    // if (!wrapper || wrapper.querySelector('.trash')) return;
    const trash = this.querySelector('.trash');
    if (trash) return;
    const icon = document.createElement('span');
    // icon.innerHTML = '&#128465;'; // trash icon
    icon.innerHTML = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round"
       stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.94 17.94C16.13 19.12 14.13 20 12 20C7 20 2.73 15.88 1 12C1.6 10.66 2.43 9.47 3.46 8.48M10.58 10.58C10.21 11.01 10 11.5 10 12C10 13.11 10.89 14 12 14C12.5 14 12.99 13.79 13.42 13.42M6.53 6.53C7.87 5.54 9.39 5 12 5C17 5 21.27 9.12 23 12C22.4 13.34 21.57 14.53 20.54 15.52M1 1L23 23"/>
  </svg>
`;

    icon.classList.add('trash');
    icon.setAttribute('title', 'Hide');
    // icon.setAttribute('part', 'trash');
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
