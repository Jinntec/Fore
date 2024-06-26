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
    Fore.refreshChildren(this, force);
  }
}

if (!customElements.get('fx-group')) {
  window.customElements.define('fx-group', FxGroup);
}
