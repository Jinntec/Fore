/* eslint-disable no-unused-expressions */
import {
  html,
  oneEvent,
  fixtureSync,
  expect,
} from '@open-wc/testing';

import '../index.js';

describe('template expressions', () => {
  it('detects template expressions', async () => {
    const el = await fixtureSync(html`
      <fx-form>
        <fx-model>
          <fx-instance>
            <data>
              <greeting>Hello Universe</greeting>
            </data>
          </fx-instance>
        </fx-model>

        <div class="static {greeting}">Greeting: {greeting} another {greeting}</div>
        <fx-input ref="greeting" label="greeting"></fx-input>
      </fx-form>
    `);

    await oneEvent(el, 'refresh-done');
    expect(el.storedTemplateExpressions).to.exist;
    expect(el.storedTemplateExpressions.length).to.equal(2);
    expect(el.storedTemplateExpressions[0].expr).to.equal('static {greeting}');
    expect(el.storedTemplateExpressions[1].expr).to.equal(
      'Greeting: {greeting} another {greeting}',
    );

    const theDiv = el.querySelector('.static');
    expect(theDiv).to.be.equal(el.storedTemplateExpressions[0].parent);

    expect(theDiv.getAttribute('class')).to.equal('static Hello Universe');
    expect(theDiv.textContent).to.equal('Greeting: Hello Universe another Hello Universe');
  });
});
