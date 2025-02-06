import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../index.js'; // Load Fore framework components
import { DependencyTracker } from "../src/DependencyTracker.js";

describe('DependencyTracker with Real Components', () => {
    let tracker;

    beforeEach(() => {
        tracker = DependencyTracker.getInstance();
        tracker.controlBindings.clear();
        tracker.pendingUpdates.clear();
        tracker.nonRelevantControls.clear();
    });

    it('Updates bound control when data changes', async () => {
        const el = await fixture(html`
          <fx-fore>
            <fx-model>
              <fx-instance>
                <data>
                  <item>foobar</item>
                </data>
              </fx-instance>
            </fx-model>
            <fx-control id="control1" ref="item">
              <label slot="label">Test Input</label>
            </fx-control>
          </fx-fore>
        `);
        await oneEvent(el, 'ready');

        const control = el.querySelector('#control1');
        const input = control.widget;

        expect(control).to.exist;
        expect(input).to.exist;
        expect(control.modelItem.value).to.equal('foobar');
        expect(input.value).to.equal('foobar');

        // Simulate data change
        control.modelItem.value = 'new-value';
        tracker.notifyChange("item");
        tracker.processUpdates();

        expect(input.value).to.equal('new-value');
    });
});
