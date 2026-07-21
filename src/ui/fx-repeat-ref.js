import { Fore } from '../fore.js';

/**
 * `<fx-repeat-ref>`
 *
 * Placeholder used inside an `<fx-repeat>`'s `<template>` to recurse into a
 * node's own matching descendants (XSLT `apply-templates` style), so
 * arbitrary-depth self-similar data (trees, org charts, threaded comments,
 * nested categories, outline structures) can be rendered with one template
 * instead of a hand-written, depth-capped chain of nested `<fx-repeat>`s.
 *
 * On connect, replaces itself with a synthesized `<fx-repeat>` that reuses
 * the nearest ancestor repeat's `ref` (or an explicit `ref` override on this
 * element) and a clone of that ancestor's own `<template>` - including this
 * same placeholder, so recursion continues one level deeper each time a
 * materialized item's node has matching children. It terminates naturally:
 * a leaf node's synthesized repeat evaluates its `ref` against zero children,
 * materializes zero items, and so never clones a further `<fx-repeat-ref>`.
 *
 * The new repeat is built via `new (customElements.get('fx-repeat'))()`, not
 * `document.createElement('fx-repeat')`: this element connects as part of the
 * browser's custom-element-reaction processing for the repeat-item subtree
 * that was just inserted (`FxRepeat._materializeRepeatItem`'s `insertBefore`),
 * and `document.createElement()` reentrant to that same reaction batch was
 * verified to throw (`NotSupportedError: The result must not have
 * attributes`) - a real platform restriction on `createElement`'s own
 * postcondition check, not a design choice. Direct construction via `new`
 * sidesteps it (verified empirically) and keeps the replacement synchronous,
 * so it completes before `_materializeRepeatItem` returns.
 *
 * Because nothing else discovers and initializes an element created after
 * the form's initial load, we explicitly call `newRepeat.refresh(true)`
 * ourselves once it's connected - `refresh()` self-initializes on first call
 * (`if (!this.inited) this.init();`, see `fx-repeat.js`), so this alone is
 * enough to bring the synthesized repeat fully to life, including
 * materializing its own items and (recursively) any `<fx-repeat-ref>` inside.
 *
 * No `id` is assigned to the synthesized repeat: there is no single "the"
 * nested repeat at a given depth (one exists per parent node), so `index()`
 * cannot target it - by design, only the author's own root `id` is
 * meaningful there. Use context-relative actions (e.g. `fx-insertchild
 * parent="."`) rather than `repeat="id"` targeting inside a recursive
 * template.
 */
export class FxRepeatRef extends HTMLElement {
  connectedCallback() {
    if (this._synthesized) return;

    const ancestorRepeat = this.closest('fx-repeat');
    if (!ancestorRepeat) {
      this._dispatchError('fx-repeat-ref: no ancestor <fx-repeat> found');
      return;
    }

    // Guaranteed set by the time any repeat-item (and thus this element) can
    // ever connect - the ancestor's own init()/_initTemplate() always runs
    // before it materializes its first item.
    if (!ancestorRepeat.template) {
      this._dispatchError('fx-repeat-ref: ancestor <fx-repeat> has no template yet');
      return;
    }

    const ref = this.getAttribute('ref') || ancestorRepeat.ref;
    const FxRepeatCtor = customElements.get('fx-repeat');

    // cloneNode(true) on a <template> also deep-clones its .content (per the
    // HTML spec), and carries over the template's own attributes (drop-scope,
    // draggable, drop-target) unchanged - so those propagate to the next
    // recursion level for free, with no manual re-wiring needed here.
    const clonedTemplate = ancestorRepeat.template.cloneNode(true);

    const newRepeat = new FxRepeatCtor();
    newRepeat.setAttribute('ref', ref);
    newRepeat.appendChild(clonedTemplate);

    this._synthesized = true;
    this.replaceWith(newRepeat);
    newRepeat.refresh(true);
  }

  _dispatchError(message) {
    Fore.dispatch(this, 'error', { level: 'Error', message });
  }
}

if (!customElements.get('fx-repeat-ref')) {
  customElements.define('fx-repeat-ref', FxRepeatRef);
}
