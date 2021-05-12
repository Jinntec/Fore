import { AbstractAction } from './abstract-action.js';

/**
 * `fx-delete`
 * general class for bound elements
 *
 * @customElement
 * @demo demo/todo.html
 */
class FxDelete extends AbstractAction {
  constructor() {
    super();
    this.repeatId = '';
  }

  /**
   * deletes a
   */
  perform() {
    super.perform();
    console.log('##### fx-delete executing...');

    // this.ref = this.getAttribute('ref');
    // const inscope = this._inScopeContext();
    // this.nodeset = fx.evaluateXPathToNodes(this.ref, inscope, null, {});

    console.log('delete nodeset ', this.nodeset);

    // ### if there's no repeat the delete action is inside of a repeat template
    if (this.repeatId === '') {
      // find the index to delete
      const rItem = this.parentNode.closest('fx-repeatitem');
      const idx = Array.from(rItem.parentNode.children).indexOf(rItem) + 1;
      // console.log('>>> idx to delete ', idx);

      // ### get the model now as it'll be hard once we've deleted ourselves ;)
      this.model = this.getModel();
      const repeat = this.parentNode.closest('fx-repeat');

      // ### update the nodeset
      let nodeToDelete;
      if (Array.isArray(this.nodeset)) {
        nodeToDelete = this.nodeset[idx - 1];
      } else {
        nodeToDelete = this.nodeset;
      }
      const p = nodeToDelete.parentNode;
      p.removeChild(nodeToDelete);

      // ### remove the repeatitem
      rItem.parentNode.removeChild(rItem);

      // ### update the index (set 'repeat-index' attribute on repeatitem
      const { repeatSize } = repeat;
      if (idx === 1 || repeatSize === 1) {
        repeat.setIndex(1);
      } else if (idx > repeatSize) {
        repeat.setIndex(repeatSize);
      } else {
        repeat.setIndex(idx);
      }
    }

    // this.needsRebuild = true;
    // this.needsRecalculate = true;
    // this.needsRevalidate = true;
    // this.needsRefresh = true;

    this.needsUpdate = true;

    // this.actionPerformed();
  }
}

window.customElements.define('fx-delete', FxDelete);
