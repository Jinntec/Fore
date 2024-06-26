import { AbstractAction } from './abstract-action.js';
import { Fore } from '../fore.js';
import { resolveId } from '../xpath-evaluation.js';

/**
 * `fx-append` appends an entry to a repeat.
 *
 *
 *
 * @deprecated - will be replaced with `fx-insert`
 * @fires index-changed - fired after new item is appended
 * @customElement
 */
// class FxAppend extends FxAction {
class FxAppend extends AbstractAction {
  static get properties() {
    return {
      ...AbstractAction.properties,
      ref: {
        type: String,
      },
      /**
       * the repeat this action is appending to.
       */
      repeat: {
        type: String,
      },
      clear: {
        type: String,
      },
    };
  }

  constructor() {
    super();
    this.repeat = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.ref = this.getAttribute('ref');
    this.repeat = this.getAttribute('repeat');
    // this.repeated = this.closest('fx-repeatitem');
  }

  /**
   * appends a instance of the repeat template to the existing ones.
   *
   * The data structure to insert into the instance data is determined by the 'ref' attributes
   * found in the template of the repeat. This is similar to lazy instance creation.
   *
   * Note: This is a significant difference to XForms which takes the instance nodes as template to insert but
   * has the problem of empty nodesets not being able to insert an entry without using a separate instance
   * holding the template.
   *
   * As a consequence the item that are appended are not propagated with values but empty. However usually
   * that's what the user wants and not the other way round (duplicating the last data items). If the XForms
   * behavior should be needed for some reason later on, it can be added easier by a providing an 'duplicate' action.
   *
   */
  async perform() {
    super.perform();

    this._dataFromTemplate();
    /*
        const instData = new XMLSerializer().serializeToString(
            this.getModel()
                .getDefaultInstance()
                .getInstanceData(),
        );
*/
    // console.log('modified instance ', this.getModel().getDefaultInstance().getInstanceData());

    this.needsUpdate = true;
  }

  actionPerformed() {
    super.actionPerformed();
    // const repeat = document.getElementById(this.repeat);
    // repeat.setIndex(repeat.nodeset.length);
    this._dispatch();
  }

  /**
   * creates a data-template from repeat template and appends it to inscope context instance.
   *
   * @private
   */
  _dataFromTemplate() {
    const inscope = this.getInScopeContext();
    const parentForm = this.getOwnerForm();
    const repeat = parentForm.querySelector(`#${this.repeat}`);
    // console.log('_dataFromTemplate repeat', repeat);
    // console.log('_dataFromTemplate repeat ref', repeat.ref);

    const templ = repeat.shadowRoot.querySelector('template');
    // console.log('_dataFromTemplate ', templ);
    // console.log('_dataFromTemplate content', templ.content);

    // iterate template for refs
    // todo: will fail for pathes with predicates - need to be filtered before
    // const rootNode = document.createElement(repeat.ref);

    // const rootNode = document.createElement(repeat.ref);
    // const rootNode = inscope.ownerDocument.createElement(repeat.ref);
    const rootNode = inscope.ownerDocument.createElement(repeat.ref);

    // const data = this._dataFromRefs(rootNode, templ.content)
    const data = this._generateInstance(templ.content, rootNode);
    // console.log('_dataFromTemplate DATA', data);
    inscope.appendChild(data);
    // console.log('appended new item ', data);
    // return data;
  }

  /**
   * dispatches set-index event to target repeat
   *
   * The target repeat is a child of the same repeat-item as the append action.
   */
  _dispatch() {
    const targetRepeat = resolveId(this.repeat, this);
    Fore.dispatch(targetRepeat, 'index-changed', { index: targetRepeat.nodeset.length });
  }

  /**
   * clear all text nodes and attribute values to get a 'clean' template.
   * @param n
   * @private
   *
   *
   */
  _clear(n) {
    let node = n.firstChild;
    const attrs = n.attributes;
    for (let i = 0; i < attrs.length; i += 1) {
      // n.setAttribute(attrs[i].name,'');
      attrs[i].value = '';
    }
    while (node) {
      if (node.nodeType === 1 && node.hasAttributes()) {
        node.textContent = '';
      }
      this._clear(node);
      node = node.nextSibling;
    }
  }

  _generateInstance(start, parent) {
    if (start.nodeType === 1 && start.hasAttribute('ref')) {
      const ref = start.getAttribute('ref');

      let generated;
      if (ref === '.') {
        // node.appendChild(document.createElement(repeatRef));
      } else if (ref.startsWith('@')) {
        parent.setAttribute(ref.substring(1), '');
      } else {
        generated = document.createElement(ref);
        parent.appendChild(generated);
        if (start.children.length === 0) {
          generated.textContent = start.textContent;
        }
      }
    }

    if (start.hasChildNodes()) {
      const list = start.children;
      for (let i = 0; i < list.length; i += 1) {
        this._generateInstance(list[i], parent);
      }
    }
    return parent;
  }

  getInstanceId() {
    if (this.ref.startsWith('instance(')) {
      return 'not implemented';
    }
    return 'default';
  }

  /*
    _fadeIn (el, display) {
      // eslint-disable-next-line no-param-reassign
      el.style.opacity = 0;
      // eslint-disable-next-line no-param-reassign
      el.style.display = display || 'block';

      (function fade() {
        // let val = parseFloat(el.style.opacity);
        let val = parseFloat(el.style.opacity);
        val += 0.1;
        if (!(val > 1)) {
          // eslint-disable-next-line no-param-reassign
          el.style.opacity = val;
          requestAnimationFrame(fade);
        }
      })();
    }
  */
}

if (!customElements.get('fx-append')) {
  window.customElements.define('fx-append', FxAppend);
}
