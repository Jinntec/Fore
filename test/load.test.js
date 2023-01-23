/* eslint-disable no-unused-expressions */
import { html, fixture, fixtureSync, expect, elementUpdated, oneEvent } from '@open-wc/testing';

import '../index.js';
import {evaluateXPathToNodes} from "fontoxpath";

describe('load Tests', () => {
  it.skip('loads a snippet of HTML into local div', async () => {
    const el = await fixtureSync(html`
        <fx-fore>
            <fx-load event="ready" url="base/demo/load-snippet.html" attach-to="#thetarget"></fx-load>
            <div id="thetarget"></div>
        </fx-fore>
    `);

    await oneEvent(el, 'refresh-done');

    // hits the first button which is the delete button here
    const targetDiv = el.querySelector('#thetarget');
    expect(targetDiv).to.exist;
    console.log('target',targetDiv)



    await oneEvent(el, 'ready');
    const div = el.querySelector('.output');
    expect(div).to.exist;


  });

});
