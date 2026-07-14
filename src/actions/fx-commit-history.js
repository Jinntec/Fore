import { AbstractAction } from './abstract-action.js';

/**
 * `fx-commit-history`
 *
 * Closes the currently open undo-coalescing session (see `UndoManager.commitCoalesced()`),
 * so the next edit - even to a field that's still focused - starts a new undo step instead
 * of merging into the current one. Useful for forcing a checkpoint mid-edit, e.g. on Enter
 * in a textarea, without requiring the user to blur the field.
 *
 * Never creates an undo step of its own - it doesn't mutate data, only draws a boundary in
 * the history that's already there.
 *
 * @customElement
 * @demo demo/undo-redo.html
 */
export class FxCommitHistory extends AbstractAction {
  async perform() {
    this.getModel()?.getEffectiveUndoManager()?.endCoalescingSession();
    this.needsUpdate = false;
  }
}

if (!customElements.get('fx-commit-history')) {
  window.customElements.define('fx-commit-history', FxCommitHistory);
}
