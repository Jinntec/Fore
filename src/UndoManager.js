/**
 * UndoManager - snapshot-based undo/redo for the instance data of one model.
 *
 * Off by default - a no-op until enabled (see the `undo` attribute on `<fx-model>` in
 * fx-model.js), so forms that don't use it pay no cloning cost on every mutation.
 *
 * One instance lives on each `fx-model` as `model.undoManager`. Snapshots are captured
 * around each outermost action chain (see `AbstractAction.execute()` / `_finalizePerform()`):
 * `beginCapture()` clones the current instance data before the chain runs and `commit()`
 * pushes that clone onto the undo stack once the chain has actually mutated something.
 * Chains that end without a mutation are dropped via `discard()`.
 *
 * A snapshot holds one entry per snapshotable instance (`type` 'xml' or 'json'), keyed by
 * the `fx-instance` element itself. Keying by element (instead of id) also covers instances
 * without an explicit id, which are not addressable through `model.getInstance()`.
 *
 * Rapid successive commits with the same coalesce key (e.g. keystrokes into one field) are
 * merged into a single undo step, like text editors group typing.
 */
/** time window in ms within which same-key commits are merged into one undo step */
const COALESCE_WINDOW_MS = 1000;

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
     * While true, the next commit()/discard() is swallowed without touching the stacks.
     * Set by fx-undo/fx-redo so restoring a snapshot does not record itself as a new step.
     */
    this.suspended = false;
    this.lastCommit = null;
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
   * Turns the pending snapshot into an undo step. Called at the end of an outermost
   * action chain that mutated instance data.
   *
   * @param {*} coalesceKey identifies the node (or ref) the chain touched; commits with
   *        the same key within COALESCE_WINDOW_MS merge into the previous undo step
   */
  commit(coalesceKey) {
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

    const now = Date.now();
    const coalesce =
      coalesceKey !== null &&
      coalesceKey !== undefined &&
      this.lastCommit &&
      this.lastCommit.key === coalesceKey &&
      now - this.lastCommit.timestamp < COALESCE_WINDOW_MS;

    this._warnIfOutsideScope(coalesceKey);

    if (!coalesce) {
      this.undoStack.push(this.pendingSnapshot);
      while (this.undoStack.length > this.maxDepth) {
        this.undoStack.shift();
      }
    }
    // the top-of-stack entry already holds the state before the first coalesced edit

    this.redoStack = [];
    this.lastCommit = { key: coalesceKey, timestamp: now };
    this.pendingSnapshot = null;
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
   * coalesce keys are skipped rather than risk a false positive.
   */
  _warnIfOutsideScope(coalesceKey) {
    if (this._warnedOutsideScope) return;
    if (!coalesceKey || !coalesceKey.ownerDocument) return;
    const owningDoc = coalesceKey.ownerDocument;
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
    this.lastCommit = null;
  }

  _shift(from, to) {
    if (from.length === 0) return false;
    to.push(this._snapshot());
    // popped entry is exclusively owned now - safe to hand its data to the instances directly
    this._restore(from.pop());
    // never coalesce across an undo/redo boundary
    this.lastCommit = null;
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
