/* eslint-disable no-unused-expressions */
import { html, fixtureSync, expect, oneEvent } from '@open-wc/testing';

import '../index.js';

describe('submissionn tests', () => {
  it.skip('replaces the default instance with empty response', async () => {
    const el = await fixtureSync(html`
      <fx-form>
        <fx-model>
          <fx-instance>
            <data>
              <greeting>Hello World!</greeting>
              <prop></prop>
              <class>dynamic</class>
            </data>
          </fx-instance>
          <fx-submission
            id="submission"
            url="/base/test/answer.xml"
            method="POST"
            replace="instance"
            instance="default"
          >
          </fx-submission>
        </fx-model>
        <fx-trigger>
          <fx-send submission="submission"></fx-send>
        </fx-trigger>
      </fx-form>
    `);

    await oneEvent(el, 'refresh-done');
    const trigger = el.querySelector('fx-trigger');
    trigger.performActions();
  });
});
