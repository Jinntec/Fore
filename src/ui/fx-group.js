import { Fore } from '../fore.js';
// import XfAbstractControl from "./fx-abstract-control";
import { FxContainer } from './fx-container.js';

/**
 * `fx-group`
 * a container allowing to switch between fx-case elements
 *
 *
 *  * todo: implement
 * @customElement
 */
class FxGroup extends FxContainer {
  static get properties() {
    return {
      ...super.properties,
      collapse: {
        type: Boolean,
        reflect: true,
      },
    };
  }
  /*
            init(model){
                super.init(model);
                console.log(this, this.modelItem);

                // this.initializeChildren(this);
            }
        */

  constructor() {
    super();
    this.collapse = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'group');

    if (this.hasAttribute('on-demand')) {
      this.style.display = 'none';
      this._addTrashIcon();
    }
  }

  render() {
    return `
      <slot></slot>
    `;
  }

  /**
   * overwrites Abstract Control.
   *
   * Groups only reacts to 'relevant' property.
   */
  handleModelItemProperties() {
    this.handleRelevant();
  }

  initializeChildren(node) {
    const children = Array.from(node.children);
    // console.log('_initializeChildren ', children);

    children.forEach(child => {
      // console.log('child ', child);

      if (Fore.isUiElement(child.nodeName)) {
        child.init(this.model);
      } else if (child.children.length !== 0) {
        const grantChildren = Array.from(child.children);
        grantChildren.forEach(grantChild => {
          this.initializeChildren(grantChild);
        });
      }
    });
    /*
                if(Fore.isUiElement(node.nodeName)){
                    const childElements = children.filter( action => Fore.isUiElement(action.nodeName));
                    console.log('children ', childElements);
                    console.group('init children');
                    if(childElements.length > 0){
                        childElements.forEach( child => {
                            console.log('action ', child);
                            child.init(this.model);
                        });
                    }
                }else if(node){
                    this._initializeChildren(node);
                }
        */

    console.groupEnd();
  }

  async refresh(force) {
    super.refresh(force);
    // Make the maybe filtered refresh an unconditional forced refresh: This fx-group changes the
    // context item
    Fore.refreshChildren(this, !!force);
  }

  // todo: this code should go
  /**
   * activates a control that uses 'on-demand' attribute
   */
  activate() {
    console.log('fx-group.activate() called');
    this.removeAttribute('on-demand');
    this.style.display = '';
    if (this.isBound()) {
      this.refresh(true);
    }
    Fore.dispatch(this, 'show-group', {});
  }

  _addTrashIcon() {
    // Only show icon if explicitly marked by control-menu

    if (!this.closest('[show-icon]')) return;

    // const wrapper = this.shadowRoot.querySelector('.wrapper');
    // if (!wrapper || wrapper.querySelector('.trash')) return;
    const trash = this.shadowRoot.querySelector('.trash');
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
}

if (!customElements.get('fx-group')) {
  window.customElements.define('fx-group', FxGroup);
}
