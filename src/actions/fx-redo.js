import { Fore } from '../fore.js';
import { AbstractAction } from './abstract-action.js';

/**
 * `fx-redo`
 * re-applies the most recently undone action chain. Fires `redo-done` with
 * `{canUndo, canRedo}` when a step was redone.
 *
 * @customElement
 * @demo demo/undo-redo.html
 */
export class FxRedo extends AbstractAction {
  async perform() {
    // this element is a singleton reused across clicks - guard against a rapid
    // double-click re-entering perform() while the first click's redo is still applying
    if (this._busy) {
      this.needsUpdate = false;
      return;
    }
    this._busy = true;

    this.dispatchEvent(
      new CustomEvent('execute-action', {
        composed: true,
        bubbles: true,
        cancelable: true,
        detail: { action: this, event: this.event },
      }),
    );

    // commit any in-progress widget edit first (matters for non-click triggers
    // that don't move focus, e.g. custom keyboard bindings)
    this.getOwnerForm().flushPendingWidgetEdit?.();

    const undoManager = this.getModel().getEffectiveUndoManager();
    // restoring a snapshot must not record itself as a new undo step
    undoManager.suspended = true;
    this.needsUpdate = undoManager.redo();
  }

  actionPerformed() {
    if (this.needsUpdate) {
      const model = this.getModel();
      model.updateModel();
      this.getOwnerForm().refresh(true);
      Fore.dispatch(this, 'redo-done', {
        canUndo: model.canUndo(),
        canRedo: model.canRedo(),
      });
    }
    this._busy = false;
    this.dispatchActionPerformed();
  }
}

if (!customElements.get('fx-redo')) {
  window.customElements.define('fx-redo', FxRedo);
}
