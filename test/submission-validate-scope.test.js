import { html, oneEvent, fixtureSync, expect } from '@open-wc/testing';

import '../index.js';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function fixture() {
  return fixtureSync(html`
    <fx-fore>
      <fx-model>
        <fx-instance type="html">
          <data>
            <order><name>x</name></order>
            <note></note>
          </data>
        </fx-instance>
        <fx-instance id="other" type="html">
          <data><title></title></data>
        </fx-instance>
        <fx-bind ref="note" required="true()"></fx-bind>
        <fx-bind ref="instance('other')/title" required="true()"></fx-bind>
        <fx-bind ref="order/name" required="true()"></fx-bind>
        <fx-submission id="scoped" ref="order" url="#echo" method="post" replace="none"></fx-submission>
        <fx-submission id="noref" url="#echo" method="post" replace="none"></fx-submission>
        <fx-submission id="empty" ref="" url="#echo" method="post" replace="none"></fx-submission>
      </fx-model>
    </fx-fore>
  `);
}

async function submit(fore, id) {
  const events = [];
  const submission = fore.querySelector(`#${id}`);
  submission.addEventListener('submit-done', () => events.push('done'));
  submission.addEventListener('submit-error', () => events.push('error'));
  await submission.submit();
  await wait(200);
  return events;
}

describe('fx-submission validate scope', () => {
  it('is not blocked by an invalid node outside the submitted subtree', async () => {
    const fore = fixture();
    await oneEvent(fore, 'refresh-done');
    // `note` (same instance) and `other/title` (other instance) are required and empty
    expect(await submit(fore, 'scoped')).to.deep.equal(['done']);
  });

  it('is blocked by an invalid node inside the submitted subtree', async () => {
    const fore = fixture();
    await oneEvent(fore, 'refresh-done');
    fore.getModel().getDefaultInstance().getDefaultContext().querySelector('name').textContent = '';
    expect(await submit(fore, 'scoped')).to.deep.equal(['error']);
  });

  it('validates the whole default instance without ref, but not other instances', async () => {
    const fore = fixture();
    await oneEvent(fore, 'refresh-done');
    // `note` is invalid and part of the default instance
    expect(await submit(fore, 'noref')).to.deep.equal(['error']);

    fore.getModel().getDefaultInstance().getDefaultContext().querySelector('note').textContent = 'n';
    // `other/title` is still invalid, but belongs to another instance
    expect(await submit(fore, 'noref')).to.deep.equal(['done']);
  });

  it('treats ref="" like no ref', async () => {
    const fore = fixture();
    await oneEvent(fore, 'refresh-done');
    expect(await submit(fore, 'empty')).to.deep.equal(['error']);
  });

  it('validates the instance a ref points into, not the default instance', async () => {
    const fore = fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html"><data><note></note></data></fx-instance>
          <fx-instance id="other" type="html"><data><title></title></data></fx-instance>
          <fx-bind ref="instance('other')/title" required="true()"></fx-bind>
          <fx-submission id="other-ref" ref="instance('other')" url="#echo" method="post" replace="none"></fx-submission>
        </fx-model>
      </fx-fore>
    `);
    await oneEvent(fore, 'refresh-done');
    const other = fore.getModel().getInstance('other').getDefaultContext();
    expect(await submit(fore, 'other-ref')).to.deep.equal(['error']);

    other.querySelector('title').textContent = 't';
    expect(await submit(fore, 'other-ref')).to.deep.equal(['done']);
  });

  it('skips model items whose node is no DOM node instead of throwing', async () => {
    const fore = fixture();
    await oneEvent(fore, 'refresh-done');
    const model = fore.getModel();
    // e.g. the string-valued model items some expressions create
    model.modelItems.push({ node: 'just a string', bind: null });
    const scope = model.getDefaultInstance().getDefaultContext().querySelector('order');
    expect(() => model.revalidate(scope)).to.not.throw();
  });
});
