import { html, oneEvent, fixtureSync, expect } from '@open-wc/testing';

import '../index.js';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('sibling fx-send conditions', () => {
  it('are evaluated before the first fx-send of a run starts', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data>
              <flag>a</flag>
              <log></log>
            </data>
          </fx-instance>
          <fx-submission id="sa" ref="flag" url="#echo" method="post" replace="none"></fx-submission>
          <fx-submission id="sb" ref="flag" url="#echo" method="post" replace="none"></fx-submission>
        </fx-model>
        <fx-action event="submit-done" target="sa">
          <fx-setvalue ref="flag">b</fx-setvalue>
        </fx-action>
        <fx-action event="submit-done" target="sb">
          <fx-setvalue ref="log" value="concat(., 'B')"></fx-setvalue>
        </fx-action>
        <fx-trigger>
          <button>go</button>
          <fx-action>
            <fx-send if="flag = 'a'" submission="sa"></fx-send>
            <fx-send if="flag = 'b'" submission="sb"></fx-send>
          </fx-action>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');

    el.querySelector('button').click();
    await wait(500);

    const data = el.getModel().getDefaultInstance().getDefaultContext();
    expect(data.querySelector('flag').textContent).to.equal('b');
    // before: 'B' (sb fired as well because sa's submit-done had already set flag to 'b')
    expect(data.querySelector('log').textContent).to.equal('');
  });

  it('still evaluate other actions sequentially', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data>
              <flag>a</flag>
              <log></log>
            </data>
          </fx-instance>
          <fx-submission id="sb" ref="flag" url="#echo" method="post" replace="none"></fx-submission>
        </fx-model>
        <fx-trigger>
          <button>go</button>
          <fx-action>
            <fx-setvalue ref="flag">b</fx-setvalue>
            <fx-send if="flag = 'b'" submission="sb"></fx-send>
            <fx-setvalue if="flag = 'b'" ref="log">seen</fx-setvalue>
          </fx-action>
        </fx-trigger>
      </fx-fore>
    `);
    await oneEvent(el, 'ready');

    el.querySelector('button').click();
    await wait(500);

    const data = el.getModel().getDefaultInstance().getDefaultContext();
    expect(data.querySelector('log').textContent).to.equal('seen');
  });
});
