/**
 * UndoManager - snapshot-based undo/redo for the instance data of one model.
 *
 * Off by default - a no-op until enabled (see the `undo` attribute on `<fx-model>` in
 * fx-model.js), so forms that don't use it pay no cloning cost on every mutation.
 *
 * One instance lives on each `fx-model` as `model.undoManager`. Snapshots are captured
 * around each outermost action chain (see `AbstractAction.execute()` / `_finalizePerform()`):
 * `beginCapture()` clones the current instance data before the chain runs, and either
 * `commit()` or `commitCoalesced()` pushes that clone onto the undo stack once the chain has
 * actually mutated something. Chains that end without a mutation are dropped via `discard()`.
 *
 * A snapshot holds one entry per snapshotable instance (`type` 'xml' or 'json'), keyed by
 * the `fx-instance` element itself. Keying by element (instead of id) also covers instances
 * without an explicit id, which are not addressable through `model.getInstance()`.
 *
 * Two commit paths, deliberately different:
 * - `commit()` - action-driven mutations (fx-setvalue, fx-insert, fx-delete, fx-reset,
 *   fx-upload, drag-and-drop...). Each action chain is already a complete, deliberate
 *   operation, so it always becomes its own undo step - clicking a "+1" button three times
 *   undoes in three steps, not one.
 * - `commitCoalesced()` - direct widget edits (typing into fx-control) while the widget is
 *   genuinely focused. Merges into the currently open session until something closes it
 *   (blur, or the explicit `<fx-commit-history>` action) - bounded by focus, not by a timer,
 *   so it behaves the same whether typing takes one second or one minute.
 */
export class UndoManager {
  /**
   * @param {import('./fx-model.js').FxModel} model the model whose instances are managed
   */
  constructor(model) {
    this.model = model;
    /** master switch - set from the `undo` attribute on `<fx-model>`, off by default */
    this.enabled = false;
    this.maxDepth = 50;
    this.undoStack = [];
    this.redoStack = [];
    this.pendingSnapshot = null;
    /**
     * While true, the next commit()/commitCoalesced()/discard() is swallowed without
     * touching the stacks. Set by fx-undo/fx-redo so restoring a snapshot does not record
     * itself as a new step.
     */
    this.suspended = false;
    /**
     * The currently open widget-edit coalescing session, if any: `{ key }`. Only one widget
     * can be focused at a time, so a single slot is sufficient.
     */
    this.openSession = null;
  }

  /**
   * Captures the current state of all instances. Called at the start of an outermost
   * action chain. Unconditionally overwrites any stale pending snapshot - the `delay`
   * path in `AbstractAction.execute()` can bail out without ever finalizing.
   * No-op (no cloning) unless `enabled`.
   */
  beginCapture() {
    if (!this.enabled) return;
    this.pendingSnapshot = this._snapshot();
  }

  /**
   * Turns the pending snapshot into its own, always-distinct undo step. Called at the end
   * of an outermost action chain that mutated instance data - never coalesces, since an
   * action chain is already a complete, deliberate operation.
   *
   * @param {*} touchedNode best-effort identification of the node the chain touched, used
   *        only for the outside-scope diagnostic below, not for merging
   */
  commit(touchedNode) {
    if (!this.enabled) {
      this.suspended = false;
      this.pendingSnapshot = null;
      return;
    }
    if (this.suspended) {
      this.suspended = false;
      this.pendingSnapshot = null;
      return;
    }
    if (!this.pendingSnapshot) return;

    this._warnIfOutsideScope(touchedNode);

    // a discrete, action-driven commit finalizes any in-progress widget-edit session too
    // (belt-and-suspenders alongside fx-control's own blur handler)
    this.openSession = null;

    this.undoStack.push(this.pendingSnapshot);
    while (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }

    this.redoStack = [];
    this.pendingSnapshot = null;
  }

  /**
   * Turns the pending snapshot into an undo step, merging into the currently open session
   * if `sessionKey` matches it. Used only for direct widget edits while the widget is
   * genuinely focused (see fx-control.js) - the session stands in for "the user is still
   * editing this field," bounded by focus/blur rather than a fixed time window.
   *
   * @param {*} sessionKey identifies the node being edited; commits with the same key while
   *        the session is open merge into the same undo step
   */
  commitCoalesced(sessionKey) {
    if (!this.enabled) {
      this.suspended = false;
      this.pendingSnapshot = null;
      return;
    }
    if (this.suspended) {
      this.suspended = false;
      this.pendingSnapshot = null;
      return;
    }
    if (!this.pendingSnapshot) return;

    this._warnIfOutsideScope(sessionKey);

    if (this.openSession && this.openSession.key === sessionKey) {
      // merging into the open session - its earlier snapshot already covers this edit
      this.redoStack = [];
      this.pendingSnapshot = null;
      return;
    }

    this.undoStack.push(this.pendingSnapshot);
    while (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }

    this.redoStack = [];
    this.pendingSnapshot = null;
    this.openSession = { key: sessionKey };
  }

  /**
   * Closes the open coalescing session, if any. Called from fx-control.js on blur (no key -
   * only one widget can be focused, so closing unconditionally is safe) and from the
   * explicit `<fx-commit-history>` action, so the next edit - even to a still-focused field -
   * starts a new undo step instead of merging into the current one.
   *
   * @param {*} [sessionKey] if given, only closes the session when it matches
   */
  endCoalescingSession(sessionKey) {
    if (!this.openSession) return;
    if (sessionKey === undefined || this.openSession.key === sessionKey) {
      this.openSession = null;
    }
  }

  /**
   * Best-effort, one-time diagnostic for the "mixed" case that `FxModel.getEffectiveUndoManager()`
   * does NOT handle: a model that owns some instances of its own but also mutates a shared
   * instance belonging to some other model. `getEffectiveUndoManager()` only redirects when a
   * model owns NO instances at all - a model with a mix keeps its own manager, so an edit to
   * an instance outside that model's own set is recorded in a snapshot that never actually
   * contained it, i.e. it looks tracked but silently isn't.
   *
   * Only checkable for XML DOM nodes (via `ownerDocument`); JSON lenses and string/ref
   * keys are skipped rather than risk a false positive.
   */
  _warnIfOutsideScope(touchedNode) {
    if (this._warnedOutsideScope) return;
    if (!touchedNode || !touchedNode.ownerDocument) return;
    const owningDoc = touchedNode.ownerDocument;
    const known = this.model.instances.some(
      instance => instance.type === 'xml' && instance.instanceData === owningDoc,
    );
    if (!known) {
      this._warnedOutsideScope = true;
      console.warn(
        "undo: an edit touched an instance outside this model's own scope (and outside " +
          'any ancestor delegation - see FxModel.getEffectiveUndoManager()) and may not be ' +
          'undoable. See doc/shared-instance-refresh-investigation.md.',
      );
    }
  }

  /**
   * Drops the pending snapshot. Called when an action chain ends without mutating anything.
   */
  discard() {
    this.suspended = false;
    this.pendingSnapshot = null;
  }

  /**
   * Restores the most recent undo snapshot. The state being left is pushed onto the redo
   * stack first.
   *
   * @returns {boolean} true if a snapshot was restored
   */
  undo() {
    if (!this.enabled) return false;
    return this._shift(this.undoStack, this.redoStack);
  }

  /**
   * Re-applies the most recently undone snapshot.
   *
   * @returns {boolean} true if a snapshot was restored
   */
  redo() {
    if (!this.enabled) return false;
    return this._shift(this.redoStack, this.undoStack);
  }

  canUndo() {
    return this.undoStack.length !== 0;
  }

  canRedo() {
    return this.redoStack.length !== 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.pendingSnapshot = null;
    this.suspended = false;
    this.openSession = null;
  }

  _shift(from, to) {
    if (from.length === 0) return false;
    to.push(this._snapshot());
    // popped entry is exclusively owned now - safe to hand its data to the instances directly
    this._restore(from.pop());
    // never coalesce across an undo/redo boundary
    this.openSession = null;
    return true;
  }

  /**
   * @returns {Array<{instance: import('./fx-instance.js').FxInstance, data: *}>}
   */
  _snapshot() {
    const entries = [];
    this.model.instances.forEach(instance => {
      const data = instance.instanceData;
      if (!data) return;
      if (instance.type === 'xml') {
        entries.push({ instance, data: data.cloneNode(true) });
      } else if (instance.type === 'json') {
        entries.push({ instance, data: structuredClone(data) });
      }
      // other types ('html', 'text') are not snapshotable
    });
    return entries;
  }

  _restore(entries) {
    entries.forEach(({ instance, data }) => {
      if (!this.model.instances.includes(instance)) return;
      // the instanceData setter routes through _setInitialData which would overwrite
      // originalInstance - keep it pointing at the load-time template so fx-reset
      // semantics survive undo/redo
      const original = instance.originalInstance;
      instance.instanceData = data;
      instance.originalInstance = original;
    });
  }
}
