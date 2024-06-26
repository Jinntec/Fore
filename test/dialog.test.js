/* eslint-disable no-unused-expressions */
import {
  html, fixture, fixtureSync, expect, elementUpdated, oneEvent,
} from '@open-wc/testing';

import '../index.js';

describe('Dialog Tests', () => {
  it('Dialog is shown on fx-show action and dispatches dialog-shown event', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-trigger>
          <button>open dialog 1</button>
          <fx-show dialog="dialog1"></fx-show>
        </fx-trigger>
        <fx-dialog id="dialog1">
          <div class="dialog-content">
            <a class="close-dialog" href="#" autofocus>&times;</a>
            <h3>Here's some dialog content</h3>
            <p>....some more....</p>
            <fx-trigger class="action">
              <button>close</button>
              <fx-hide dialog="dialog1"></fx-hide>
            </fx-trigger>
          </div>
        </fx-dialog>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const dialog = document.getElementById('dialog1');
    expect(dialog).to.exist;

    let fired = false;
    dialog.addEventListener('dialog-shown', (e) => {
      fired = true;
    });

    const trigger = document.querySelector('fx-trigger');
    trigger.widget.click();

    // await oneEvent(dialog, 'dialog-shown');
    expect(dialog).to.be.visible;
    expect(dialog.classList.contains('show')).to.be.true;
    expect(fired).to.be.true;
  });

  it('Dialog is hidden on fx-show action and dispatches dialog-shown event', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-show dialog="dialog1" event="ready"></fx-show>
        
        <fx-trigger>
          <button>open dialog 1</button>
          <fx-hide dialog="dialog1"></fx-hide>
        </fx-trigger>
        <fx-dialog id="dialog1">
          <div class="dialog-content">
            <a class="close-dialog" href="#" autofocus>&times;</a>
            <h3>Here's some dialog content</h3>
            <p>....some more....</p>
            <fx-trigger class="action">
              <button>close</button>
              <fx-hide dialog="dialog1"></fx-hide>
            </fx-trigger>
          </div>
        </fx-dialog>
      </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    const dialog = document.getElementById('dialog1');
    expect(dialog).to.exist;

    let fired = false;
    dialog.addEventListener('dialog-hidden', (e) => {
      fired = true;
    });

    const trigger = document.querySelector('fx-trigger');
    trigger.widget.click();

    // await oneEvent(dialog, 'dialog-shown');
    console.log('####', dialog.style);
    expect(fired).to.be.true;
  });
});
