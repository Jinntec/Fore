/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

/**
 * Template expressions are only evaluated again when something they read has changed
 * (see template-dependency-tracker.js). These tests check both halves: nothing stale, and nothing needless.
 */
describe('template expression dependencies', () => {
  const setup = async markup => {
    const fore = await fixtureSync(markup);
    await oneEvent(fore, 'ready');
    // counts the evaluations that are tracked, i.e. the ones that were not skipped
    const tracker = fore._templateTracker;
    const original = tracker.createFacade.bind(tracker);
    fore.evaluations = 0;
    tracker.createFacade = () => {
      fore.evaluations += 1;
      return original();
    };
    return fore;
  };

  const click = async (fore, selector) => {
    fore.querySelector(selector).click();
    await oneEvent(fore, 'refresh-done');
  };

  const instance = (fore, id = 'default') => fore.getModel().getInstance(id).getDefaultContext();

  it('evaluates again when a node it reads changes', async () => {
    const fore = await setup(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html"
            ><data><a>one</a><b>x</b></data></fx-instance
          >
        </fx-model>
        <fx-trigger id="t"
          ><button>go</button><fx-setvalue ref="a" value="'two'"></fx-setvalue
        ></fx-trigger>
        <p id="out">{a}</p>
      </fx-fore>
    `);
    expect(fore.querySelector('#out').textContent).to.equal('one');
    await click(fore, '#t button');
    expect(fore.querySelector('#out').textContent).to.equal('two');
  });

  it('does not evaluate again when an unrelated node changes', async () => {
    const fore = await setup(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html"
            ><data><a>one</a><b>x</b></data></fx-instance
          >
        </fx-model>
        <fx-trigger id="t"
          ><button>go</button><fx-setvalue ref="b" value="'y'"></fx-setvalue
        ></fx-trigger>
        <p id="a">{a}</p>
        <p id="b">{b}</p>
      </fx-fore>
    `);
    await click(fore, '#t button');
    expect(fore.querySelector('#b').textContent).to.equal('y');
    // only {b} was evaluated
    expect(fore.evaluations).to.equal(1);
  });

  it('notices an added child (count)', async () => {
    const fore = await setup(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html"
            ><data><item>1</item><item>2</item></data></fx-instance
          >
        </fx-model>
        <p id="out">{count(item)}</p>
      </fx-fore>
    `);
    expect(fore.querySelector('#out').textContent).to.equal('2');
    const data = instance(fore);
    data.appendChild(data.lastElementChild.cloneNode(true));
    await fore.refresh();
    expect(fore.querySelector('#out').textContent).to.equal('3');
  });

  it('notices a changed order', async () => {
    const fore = await setup(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html"
            ><data><item>1</item><item>2</item></data></fx-instance
          >
        </fx-model>
        <fx-trigger id="t"><button>go</button></fx-trigger>
        <p id="out">{item[1]}</p>
      </fx-fore>
    `);
    expect(fore.querySelector('#out').textContent).to.equal('1');
    const data = instance(fore);
    data.insertBefore(data.lastElementChild, data.firstElementChild);
    await fore.refresh();
    expect(fore.querySelector('#out').textContent).to.equal('2');
  });

  it('notices an attribute that did not exist yet', async () => {
    const fore = await setup(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html"
            ><data><a>x</a></data></fx-instance
          >
        </fx-model>
        <p id="out">{a/@mark}</p>
      </fx-fore>
    `);
    expect(fore.querySelector('#out').textContent).to.equal('');
    instance(fore).querySelector('a').setAttribute('mark', 'yes');
    await fore.refresh();
    expect(fore.querySelector('#out').textContent).to.equal('yes');
  });

  it('notices text edited in place', async () => {
    const fore = await setup(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html"
            ><data><a>x</a></data></fx-instance
          >
        </fx-model>
        <p id="out">{a}</p>
      </fx-fore>
    `);
    instance(fore).querySelector('a').firstChild.data = 'changed';
    await fore.refresh();
    expect(fore.querySelector('#out').textContent).to.equal('changed');
  });

  it('follows a replaced instance', async () => {
    const fore = await setup(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html"
            ><data><a>old</a></data></fx-instance
          >
        </fx-model>
        <p id="out">{a}</p>
      </fx-fore>
    `);
    const inst = fore.getModel().getInstance('default');
    const replacement = inst.instanceData.cloneNode(true);
    replacement.querySelector('a').firstChild.data = 'new';
    inst.instanceData = replacement;
    await fore.refresh(true);
    expect(fore.querySelector('#out').textContent).to.equal('new');
  });

  it('always evaluates expressions that use variables', async () => {
    const fore = await setup(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html"
            ><data><a>one</a></data></fx-instance
          >
        </fx-model>
        <p id="out">{$default/a}</p>
      </fx-fore>
    `);
    const before = fore.evaluations;
    await fore.refresh();
    // volatile: never goes through the tracked path, so it is never skipped either
    expect(fore.evaluations).to.equal(before);
    expect(fore.querySelector('#out').textContent).to.equal('one');
  });
});
