import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

describe('undo/redo', () => {
  const instanceValue = (el, selector, instanceId = 'default') =>
    el
      .querySelector('fx-model')
      .getInstance(instanceId)
      .instanceData.querySelector(selector).textContent;

  const undoManagerOf = el => el.querySelector('fx-model').undoManager;

  describe('action-driven mutations', () => {
    let el;
    beforeEach(async () => {
      el = await fixtureSync(html`
        <fx-fore>
          <fx-model undo>
            <fx-instance>
              <data>
                <value>A</value>
                <other>x</other>
              </data>
            </fx-instance>
          </fx-model>
          <fx-control ref="value"></fx-control>
          <fx-trigger id="set-b"><button></button><fx-setvalue ref="value">B</fx-setvalue></fx-trigger>
          <fx-trigger id="set-c"><button></button><fx-setvalue ref="value">C</fx-setvalue></fx-trigger>
          <fx-trigger id="set-d"><button></button><fx-setvalue ref="value">D</fx-setvalue></fx-trigger>
          <fx-trigger id="set-other"><button></button><fx-setvalue ref="other">y</fx-setvalue></fx-trigger>
          <fx-trigger id="undo"><button></button><fx-undo></fx-undo></fx-trigger>
          <fx-trigger id="redo"><button></button><fx-redo></fx-redo></fx-trigger>
        </fx-fore>
      `);
      await oneEvent(el, 'refresh-done');
    });

    it('undoes and redoes a setvalue action', async () => {
      const um = undoManagerOf(el);
      expect(um.canUndo()).to.be.false;

      await el.querySelector('#set-b').performActions();
      expect(instanceValue(el, 'value')).to.equal('B');
      expect(um.canUndo()).to.be.true;

      const undoDone = oneEvent(el, 'undo-done');
      await el.querySelector('#undo').performActions();
      await undoDone;
      expect(instanceValue(el, 'value')).to.equal('A');
      expect(um.canUndo()).to.be.false;
      expect(um.canRedo()).to.be.true;

      const redoDone = oneEvent(el, 'redo-done');
      await el.querySelector('#redo').performActions();
      await redoDone;
      expect(instanceValue(el, 'value')).to.equal('B');
      expect(um.canRedo()).to.be.false;
    });

    it('preserves originalInstance across undo so reset still restores load-time data', async () => {
      await el.querySelector('#set-b').performActions();
      const undoDone = oneEvent(el, 'undo-done');
      await el.querySelector('#undo').performActions();
      await undoDone;

      const instance = el.querySelector('fx-instance');
      expect(instance.originalInstance.querySelector('value').textContent).to.equal('A');
    });

    it('coalesces rapid successive edits of the same node into one undo step', async () => {
      const um = undoManagerOf(el);
      await el.querySelector('#set-b').performActions();
      await el.querySelector('#set-c').performActions();
      expect(um.undoStack.length).to.equal(1);

      // past the coalescing window a new entry is created
      um.lastCommit = null;
      await el.querySelector('#set-d').performActions();
      expect(um.undoStack.length).to.equal(2);
    });

    it('does not coalesce edits of different nodes', async () => {
      const um = undoManagerOf(el);
      await el.querySelector('#set-b').performActions();
      await el.querySelector('#set-other').performActions();
      expect(um.undoStack.length).to.equal(2);
    });

    it('caps the undo stack at undo-depth, evicting oldest entries', async () => {
      const um = undoManagerOf(el);
      um.maxDepth = 2;

      await el.querySelector('#set-b').performActions();
      um.lastCommit = null;
      await el.querySelector('#set-c').performActions();
      um.lastCommit = null;
      await el.querySelector('#set-d').performActions();
      expect(um.undoStack.length).to.equal(2);

      um.undo();
      expect(instanceValue(el, 'value')).to.equal('C');
      um.undo();
      expect(instanceValue(el, 'value')).to.equal('B');
      // the oldest step (back to 'A') was evicted
      expect(um.canUndo()).to.be.false;
    });

    it('invalidates the redo stack on a new mutation', async () => {
      const um = undoManagerOf(el);
      await el.querySelector('#set-b').performActions();
      const undoDone = oneEvent(el, 'undo-done');
      await el.querySelector('#undo').performActions();
      await undoDone;
      expect(um.canRedo()).to.be.true;

      await el.querySelector('#set-c').performActions();
      expect(um.canRedo()).to.be.false;
    });

    it('does not record undo/redo actions as undo steps themselves', async () => {
      const um = undoManagerOf(el);
      await el.querySelector('#set-b').performActions();
      expect(um.undoStack.length).to.equal(1);

      const undoDone = oneEvent(el, 'undo-done');
      await el.querySelector('#undo').performActions();
      await undoDone;
      expect(um.undoStack.length).to.equal(0);
      expect(um.suspended).to.be.false;
    });

    it('redo snapshots do not alias the live instance document', async () => {
      const um = undoManagerOf(el);
      await el.querySelector('#set-b').performActions();
      const undoDone = oneEvent(el, 'undo-done');
      await el.querySelector('#undo').performActions();
      await undoDone;

      // mutate the live document behind the manager's back
      el
        .querySelector('fx-model')
        .getInstance('default')
        .instanceData.querySelector('value').textContent = 'tampered';

      um.redo();
      // redo restores the stored snapshot, unaffected by the tampering
      expect(instanceValue(el, 'value')).to.equal('B');
    });
  });

  describe('self-removing actions', () => {
    it('records an undo step for a delete triggered from inside the deleted repeat item', async () => {
      const el = await fixtureSync(html`
        <fx-fore>
          <fx-model undo>
            <fx-instance>
              <data>
                <task>one</task>
                <task>two</task>
              </data>
            </fx-instance>
          </fx-model>
          <fx-repeat ref="task">
            <template>
              <fx-trigger><button></button><fx-delete ref="."></fx-delete></fx-trigger>
            </template>
          </fx-repeat>
          <fx-trigger id="undo"><button></button><fx-undo></fx-undo></fx-trigger>
        </fx-fore>
      `);
      await oneEvent(el, 'refresh-done');
      const um = undoManagerOf(el);

      // the action element removes itself from the document as a side effect of the
      // delete - the outermost handler self-heals, but the commit must still happen
      el.querySelector('fx-repeat fx-trigger button').click();
      await new Promise(resolve => {
        setTimeout(resolve, 50);
      });
      const tasks = () =>
        Array.from(
          el.querySelector('fx-model').getInstance('default').instanceData.querySelectorAll('task'),
        ).map(t => t.textContent);
      expect(tasks()).to.deep.equal(['two']);
      expect(um.undoStack.length).to.equal(1);

      const undoDone = oneEvent(el, 'undo-done');
      await el.querySelector('#undo').performActions();
      await undoDone;
      expect(tasks()).to.deep.equal(['one', 'two']);
    });
  });

  describe('multiple instances', () => {
    it('restores the mutated instance and leaves the other untouched', async () => {
      const el = await fixtureSync(html`
        <fx-fore>
          <fx-model undo>
            <fx-instance>
              <data><value>A</value></data>
            </fx-instance>
            <fx-instance id="second">
              <data><item>one</item></data>
            </fx-instance>
          </fx-model>
          <fx-trigger id="set"
            ><button></button><fx-setvalue ref="instance('second')/item">two</fx-setvalue></fx-trigger
          >
          <fx-trigger id="undo"><button></button><fx-undo></fx-undo></fx-trigger>
        </fx-fore>
      `);
      await oneEvent(el, 'refresh-done');

      await el.querySelector('#set').performActions();
      expect(instanceValue(el, 'item', 'second')).to.equal('two');
      expect(instanceValue(el, 'value')).to.equal('A');

      const undoDone = oneEvent(el, 'undo-done');
      await el.querySelector('#undo').performActions();
      await undoDone;
      expect(instanceValue(el, 'item', 'second')).to.equal('one');
      expect(instanceValue(el, 'value')).to.equal('A');
    });
  });

  describe('nested fx-fore with a shared instance', () => {
    // mirrors demo/shared-instances.html: a nested fx-fore whose own <fx-model> declares
    // no <fx-instance> of its own and operates entirely on data shared by the ancestor
    const buildSharedFixture = async () =>
      fixtureSync(html`
        <fx-fore id="outer">
          <fx-model undo>
            <fx-instance id="todos" shared>
              <data>
                <todo>one</todo>
                <todo>two</todo>
              </data>
            </fx-instance>
          </fx-model>

          <fx-fore id="inner">
            <fx-model undo></fx-model>
            <fx-repeat ref="instance('todos')/todo">
              <template><fx-control ref="."></fx-control></template>
            </fx-repeat>
            <fx-trigger id="insert"
              ><button></button><fx-insert ref="instance('todos')/todo"></fx-insert
            ></fx-trigger>
            <fx-trigger id="inner-undo"><button></button><fx-undo></fx-undo></fx-trigger>
          </fx-fore>
        </fx-fore>
      `);

    const todos = el =>
      Array.from(
        el.querySelector('#outer > fx-model').getInstance('todos').instanceData.querySelectorAll('todo'),
      ).map(t => t.textContent);

    it('records the mutation on the ancestor that owns the shared instance, not on the empty nested model', async () => {
      const el = await buildSharedFixture();
      await oneEvent(el, 'refresh-done');

      const outerModel = el.querySelector('#outer > fx-model');
      const innerModel = el.querySelector('#inner > fx-model');
      expect(innerModel.instances.length).to.equal(0);
      expect(innerModel.getEffectiveUndoManager()).to.equal(outerModel.undoManager);

      await el.querySelector('#inner #insert').performActions();
      expect(todos(el)).to.deep.equal(['one', 'two', '']);

      // the mutation is attributed to the outer model - not silently dropped, and not
      // recorded as a bogus empty snapshot on the inner (instance-less) model
      expect(outerModel.undoManager.undoStack.length).to.equal(1);
      expect(innerModel.undoManager.undoStack.length).to.equal(0);
    });

    it('undo triggered from inside the nested fore reverts the shared data', async () => {
      const el = await buildSharedFixture();
      await oneEvent(el, 'refresh-done');

      await el.querySelector('#inner #insert').performActions();
      expect(todos(el)).to.deep.equal(['one', 'two', '']);

      await el.querySelector('#inner #inner-undo').performActions();
      expect(todos(el)).to.deep.equal(['one', 'two']);
    });

    it('mirrors demo/undo-redo.html\'s counter section: self-referential increment does not hang and undoes correctly', async () => {
      const el = await fixtureSync(html`
        <fx-fore id="shared-outer">
          <fx-model undo>
            <fx-instance id="counters" shared>
              <data><count>0</count></data>
            </fx-instance>
          </fx-model>
          <fx-output id="outer-count" ref="instance('counters')/count"></fx-output>

          <fx-fore id="shared-inner">
            <!-- no fx-instance here on purpose: this fore only ever touches the outer's
                 shared instance, which is exactly the case getEffectiveUndoManager() handles -->
            <fx-model undo></fx-model>
            <fx-trigger id="increment"
              ><button></button><fx-setvalue
                ref="instance('counters')/count"
                value="instance('counters')/count + 1"
              ></fx-setvalue
            ></fx-trigger>
            <fx-trigger id="undo-shared"><button></button><fx-undo></fx-undo></fx-trigger>
            <fx-trigger id="redo-shared"><button></button><fx-redo></fx-redo></fx-trigger>
            <fx-output id="inner-count" ref="instance('counters')/count"></fx-output>
          </fx-fore>
        </fx-fore>
      `);
      await oneEvent(el, 'refresh-done');
      const outerModel = el.querySelector('#shared-outer > fx-model');
      const count = () =>
        outerModel.getInstance('counters').instanceData.querySelector('count').textContent;

      // NOTE: this only asserts the underlying instance data, not el.querySelector('#inner-count')
      // .textContent - a nested fore with no <fx-instance> of its own never runs its own
      // rebuild(), so its UI does not reliably refresh after actions targeting the shared
      // instance (independent of undo/redo). See doc/shared-instance-refresh-investigation.md.
      await el.querySelector('#increment').performActions();
      // two rapid edits of the same node coalesce into one undo step (by design)
      outerModel.undoManager.lastCommit = null;
      await el.querySelector('#increment').performActions();
      expect(count()).to.equal('2');
      expect(outerModel.undoManager.undoStack.length).to.equal(2);

      await el.querySelector('#undo-shared').performActions();
      expect(count()).to.equal('1');

      await el.querySelector('#redo-shared').performActions();
      expect(count()).to.equal('2');
    });
  });

  describe('widget edits through fx-control', () => {
    it('records direct control edits as undo steps', async () => {
      const el = await fixtureSync(html`
        <fx-fore>
          <fx-model undo>
            <fx-instance>
              <data><value>A</value></data>
            </fx-instance>
          </fx-model>
          <fx-control ref="value"></fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'refresh-done');
      const model = el.querySelector('fx-model');
      const control = el.querySelector('fx-control');

      control.setValue('B');
      expect(instanceValue(el, 'value')).to.equal('B');
      expect(model.canUndo()).to.be.true;

      expect(model.undo()).to.be.true;
      expect(instanceValue(el, 'value')).to.equal('A');
      expect(model.canRedo()).to.be.true;
    });

    it('does not record an undo step when the value is unchanged', async () => {
      const el = await fixtureSync(html`
        <fx-fore>
          <fx-model undo>
            <fx-instance>
              <data><value>A</value></data>
            </fx-instance>
          </fx-model>
          <fx-control ref="value"></fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'refresh-done');
      const model = el.querySelector('fx-model');

      el.querySelector('fx-control').setValue('A');
      expect(model.canUndo()).to.be.false;
    });
  });

  describe('keyboard shortcuts', () => {
    it('handles ctrl+z / ctrl+shift+z when keyboard-shortcuts is set', async () => {
      const el = await fixtureSync(html`
        <fx-fore keyboard-shortcuts>
          <fx-model undo>
            <fx-instance>
              <data><value>A</value></data>
            </fx-instance>
          </fx-model>
          <fx-trigger id="set"><button></button><fx-setvalue ref="value">B</fx-setvalue></fx-trigger>
        </fx-fore>
      `);
      await oneEvent(el, 'refresh-done');

      await el.querySelector('#set').performActions();
      expect(instanceValue(el, 'value')).to.equal('B');

      const undoDone = oneEvent(el, 'undo-done');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
      await undoDone;
      expect(instanceValue(el, 'value')).to.equal('A');

      const redoDone = oneEvent(el, 'redo-done');
      el.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true }),
      );
      await redoDone;
      expect(instanceValue(el, 'value')).to.equal('B');
    });
  });

  describe('keyboard undo with pending widget edit', () => {
    it('commits in-progress typing first, so undo reverts the typing and redo survives', async () => {
      const el = await fixtureSync(html`
        <fx-fore keyboard-shortcuts>
          <fx-model undo>
            <fx-instance>
              <data><value>A</value></data>
            </fx-instance>
          </fx-model>
          <fx-control ref="value"></fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'refresh-done');
      const model = el.querySelector('fx-model');
      const um = model.undoManager;

      // simulate typing without blur: widget holds new text, model still has old value
      const input = el.querySelector('fx-control input');
      input.focus();
      input.value = 'typed';
      expect(instanceValue(el, 'value')).to.equal('A');

      const undoDone = oneEvent(el, 'undo-done');
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }),
      );
      await undoDone;

      // the pending edit was committed and then undone - not skipped over
      expect(instanceValue(el, 'value')).to.equal('A');
      expect(um.canRedo()).to.be.true;

      const redoDone = oneEvent(el, 'redo-done');
      el.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true }),
      );
      await redoDone;
      expect(instanceValue(el, 'value')).to.equal('typed');
    });
  });

  describe('undo-depth attribute', () => {
    it('is read into the UndoManager on model construction', async () => {
      const el = await fixtureSync(html`
        <fx-fore>
          <fx-model undo undo-depth="7">
            <fx-instance>
              <data><value>A</value></data>
            </fx-instance>
          </fx-model>
        </fx-fore>
      `);
      await oneEvent(el, 'refresh-done');
      expect(undoManagerOf(el).maxDepth).to.equal(7);
    });
  });

  describe('opt-in: disabled by default', () => {
    it('records no undo steps and never clones instance data without the `undo` attribute', async () => {
      const el = await fixtureSync(html`
        <fx-fore>
          <fx-model>
            <fx-instance>
              <data><value>A</value></data>
            </fx-instance>
          </fx-model>
          <fx-control ref="value"></fx-control>
          <fx-trigger id="set"><button></button><fx-setvalue ref="value">B</fx-setvalue></fx-trigger>
        </fx-fore>
      `);
      await oneEvent(el, 'refresh-done');
      const model = el.querySelector('fx-model');
      const um = model.undoManager;
      expect(um.enabled).to.be.false;

      await el.querySelector('#set').performActions();
      el.querySelector('fx-control').setValue('C');

      expect(um.undoStack.length).to.equal(0);
      expect(model.canUndo()).to.be.false;
      expect(model.undo()).to.be.false;
    });

    it('`undo-depth` alone does not enable tracking - the `undo` attribute is the explicit switch', async () => {
      const el = await fixtureSync(html`
        <fx-fore>
          <fx-model undo-depth="5">
            <fx-instance>
              <data><value>A</value></data>
            </fx-instance>
          </fx-model>
          <fx-control ref="value"></fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'refresh-done');
      const model = el.querySelector('fx-model');
      expect(model.undoManager.enabled).to.be.false;
      expect(model.undoManager.maxDepth).to.equal(5);

      el.querySelector('fx-control').setValue('B');
      expect(model.canUndo()).to.be.false;
    });

    it('a `keyboard-shortcuts` form without `undo` on the model does not error on ctrl+z', async () => {
      const el = await fixtureSync(html`
        <fx-fore keyboard-shortcuts>
          <fx-model>
            <fx-instance>
              <data><value>A</value></data>
            </fx-instance>
          </fx-model>
          <fx-control ref="value"></fx-control>
        </fx-fore>
      `);
      await oneEvent(el, 'refresh-done');

      el.querySelector('fx-control').setValue('B');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
      await new Promise(resolve => {
        setTimeout(resolve, 50);
      });
      // no undo happened - value change is untracked, but nothing throws either
      expect(instanceValue(el, 'value')).to.equal('B');
    });
  });
});
