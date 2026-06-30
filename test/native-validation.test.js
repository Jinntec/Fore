/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';
import '../index.js';

/**
 * Tests for native browser constraint validation integration.
 *
 * Fore reads widget.validity.valid at the end of fx-model.revalidate() and stores
 * the result in ModelItem.nativeValid. AbstractControl.handleValid() ANDs nativeValid
 * into its overall validity check so that native HTML attributes (min, max, pattern,
 * type) participate in the Fore validation lifecycle without any fx-bind constraint.
 *
 * Note on async: model.updateModel() runs revalidate() synchronously, so ModelItem
 * assertions can be made immediately after. AbstractControl assertions (e.g. [invalid]
 * attributes) require the refresh phase — call el.refresh() and await 'refresh-done'.
 */
describe('native browser validation', () => {
  // ── ModelItem ────────────────────────────────────────────────────────────
  describe('ModelItem', () => {
    it('initialises nativeValid to true', async () => {
      const el = fixtureSync(html`
        <fx-fore>
          <fx-model id="m">
            <fx-instance><data><age>30</age></data></fx-instance>
            <fx-bind ref="age"></fx-bind>
          </fx-model>
          <fx-control ref="age">
            <input class="widget" type="number" min="0" max="120">
          </fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'ready');
      const model = el.querySelector('#m');
      expect(model.modelItems[0].nativeValid).to.be.true;
    });
  });

  // ── revalidate() sets nativeValid ─────────────────────────────────────────
  // revalidate() is synchronous — nativeValid is readable immediately after
  // model.updateModel() without awaiting a refresh cycle.
  describe('revalidate() — nativeValid (synchronous)', () => {
    it('sets nativeValid=false when widget value exceeds max', async () => {
      const el = fixtureSync(html`
        <fx-fore>
          <fx-model id="m">
            <fx-instance><data><age></age></data></fx-instance>
            <fx-bind ref="age"></fx-bind>
          </fx-model>
          <fx-control id="ctrl" ref="age">
            <input class="widget" type="number" min="0" max="120" placeholder="0-120">
          </fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'ready');
      const model = el.querySelector('#m');
      const widget = el.querySelector('#ctrl').getWidget();

      widget.value = '200';
      model.updateModel();

      expect(model.modelItems[0].nativeValid).to.be.false;
    });

    it('sets nativeValid=false when widget value is below min', async () => {
      const el = fixtureSync(html`
        <fx-fore>
          <fx-model id="m">
            <fx-instance><data><age></age></data></fx-instance>
            <fx-bind ref="age"></fx-bind>
          </fx-model>
          <fx-control id="ctrl" ref="age">
            <input class="widget" type="number" min="0" max="120" placeholder="0-120">
          </fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'ready');
      const model = el.querySelector('#m');
      const widget = el.querySelector('#ctrl').getWidget();

      widget.value = '-1';
      model.updateModel();

      expect(model.modelItems[0].nativeValid).to.be.false;
    });

    it('restores nativeValid=true when widget value enters valid range', async () => {
      const el = fixtureSync(html`
        <fx-fore>
          <fx-model id="m">
            <fx-instance><data><age></age></data></fx-instance>
            <fx-bind ref="age"></fx-bind>
          </fx-model>
          <fx-control id="ctrl" ref="age">
            <input class="widget" type="number" min="0" max="120" placeholder="0-120">
          </fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'ready');
      const model = el.querySelector('#m');
      const widget = el.querySelector('#ctrl').getWidget();

      widget.value = '200';
      model.updateModel();
      expect(model.modelItems[0].nativeValid).to.be.false;

      widget.value = '25';
      model.updateModel();
      expect(model.modelItems[0].nativeValid).to.be.true;
    });

    it('sets nativeValid=false for type=email mismatch', async () => {
      const el = fixtureSync(html`
        <fx-fore>
          <fx-model id="m">
            <fx-instance><data><email></email></data></fx-instance>
            <fx-bind ref="email"></fx-bind>
          </fx-model>
          <fx-control id="ctrl" ref="email">
            <input class="widget" type="email" placeholder="you@example.com">
          </fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'ready');
      const model = el.querySelector('#m');
      const widget = el.querySelector('#ctrl').getWidget();

      widget.value = 'notanemail';
      model.updateModel();

      expect(model.modelItems[0].nativeValid).to.be.false;
    });

    it('sets nativeValid=false for pattern mismatch', async () => {
      // NOTE: avoid {n} quantifier syntax — Fore's template-expression engine
      // treats {...} in attributes as XPath and rewrites them.
      const el = fixtureSync(html`
        <fx-fore>
          <fx-model id="m">
            <fx-instance><data><zip></zip></data></fx-instance>
            <fx-bind ref="zip"></fx-bind>
          </fx-model>
          <fx-control id="ctrl" ref="zip">
            <input class="widget" type="text" pattern="[0-9][0-9][0-9][0-9][0-9]" placeholder="12345">
          </fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'ready');
      const model = el.querySelector('#m');
      const widget = el.querySelector('#ctrl').getWidget();

      widget.value = 'abc';
      model.updateModel();
      expect(model.modelItems[0].nativeValid).to.be.false;

      widget.value = '12345';
      model.updateModel();
      expect(model.modelItems[0].nativeValid).to.be.true;
    });

    it('leaves nativeValid=true when no native constraints are set', async () => {
      const el = fixtureSync(html`
        <fx-fore>
          <fx-model id="m">
            <fx-instance><data><note>hello</note></data></fx-instance>
            <fx-bind ref="note"></fx-bind>
          </fx-model>
          <fx-control id="ctrl" ref="note">
            <input class="widget" type="text">
          </fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'ready');
      const model = el.querySelector('#m');
      expect(model.modelItems[0].nativeValid).to.be.true;
    });
  });

  // ── fx-control attribute reflection ──────────────────────────────────────
  // handleValid() runs during refresh() — call el.refresh() and await 'refresh-done'
  // to observe [invalid]/[valid] attribute changes.
  describe('fx-control attribute reflection (requires refresh phase)', () => {
    it('gains [invalid] when native validation fails', async () => {
      const el = fixtureSync(html`
        <fx-fore>
          <fx-model id="m">
            <fx-instance><data><age></age></data></fx-instance>
            <fx-bind ref="age"></fx-bind>
          </fx-model>
          <fx-control id="ctrl" ref="age">
            <input class="widget" type="number" min="0" max="120" placeholder="0-120">
          </fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'ready');
      const ctrl = el.querySelector('#ctrl');
      const widget = ctrl.getWidget();

      widget.value = '200';
      el.querySelector('#m').updateModel();

      const done = oneEvent(el, 'refresh-done');
      el.refresh();
      await done;

      expect(ctrl.hasAttribute('invalid')).to.be.true;
    });

    it('loses [invalid] when native validation passes', async () => {
      const el = fixtureSync(html`
        <fx-fore>
          <fx-model id="m">
            <fx-instance><data><age></age></data></fx-instance>
            <fx-bind ref="age"></fx-bind>
          </fx-model>
          <fx-control id="ctrl" ref="age">
            <input class="widget" type="number" min="0" max="120" placeholder="0-120">
          </fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'ready');
      const model = el.querySelector('#m');
      const ctrl = el.querySelector('#ctrl');
      const widget = ctrl.getWidget();

      // Make invalid and refresh
      widget.value = '200';
      model.updateModel();
      let done = oneEvent(el, 'refresh-done');
      el.refresh();
      await done;
      expect(ctrl.hasAttribute('invalid')).to.be.true;

      // Correct the value and refresh
      widget.value = '30';
      model.updateModel();
      done = oneEvent(el, 'refresh-done');
      el.refresh();
      await done;
      expect(ctrl.hasAttribute('invalid')).to.be.false;
    });

    it('coexists with fx-bind constraint — both must pass for [valid]', async () => {
      const el = fixtureSync(html`
        <fx-fore>
          <fx-model id="m">
            <fx-instance><data><age></age></data></fx-instance>
            <fx-bind ref="age" constraint="string-length(.) &gt; 0"></fx-bind>
          </fx-model>
          <fx-control id="ctrl" ref="age">
            <input class="widget" type="number" min="0" max="120" placeholder="0-120">
          </fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'ready');
      const model = el.querySelector('#m');
      const ctrl = el.querySelector('#ctrl');
      const widget = ctrl.getWidget();

      // Helper: update both the XML node (like fx-setvalue) and the widget (like user typing),
      // then run the full model + UI cycle.
      const setAndRefresh = async val => {
        model.modelItems[0].value = val; // write to XML node (fx-setvalue responsibility)
        widget.value = val;              // widget reflects the typed value
        model.updateModel();
        const done = oneEvent(el, 'refresh-done');
        el.refresh();
        return done;
      };

      // Empty: native passes (empty non-required = valid), XPath constraint fails
      await setAndRefresh('');
      expect(ctrl.hasAttribute('invalid')).to.be.true;

      // Out-of-range: native fails (200 > max 120), XPath constraint passes (has a value)
      await setAndRefresh('200');
      expect(ctrl.hasAttribute('invalid')).to.be.true;

      // Both valid: in range AND non-empty
      await setAndRefresh('30');
      expect(ctrl.hasAttribute('invalid')).to.be.false;
    });
  });
});
