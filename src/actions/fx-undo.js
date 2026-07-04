import { Fore } from '../fore.js';
import { AbstractAction } from './abstract-action.js';

/**
 * `fx-undo`
 * restores the instance data of the model to the state before the last undoable
 * action chain. Fires `undo-done` with `{canUndo, canRedo}` when a step was undone.
 *
 * @customElement
 * @demo demo/undo-redo.html
 */
export class FxUndo extends AbstractAction {
  async perform() {
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
    this.needsUpdate = undoManager.undo();
  }

  actionPerformed() {
    if (this.needsUpdate) {
      const model = this.getModel();
      model.updateModel();
      this.getOwnerForm().refresh(true);
      Fore.dispatch(this, 'undo-done', {
        canUndo: model.canUndo(),
        canRedo: model.canRedo(),
      });
    }
    this.dispatchActionPerformed();
  }
}

if (!customElements.get('fx-undo')) {
  window.customElements.define('fx-undo', FxUndo);
}
