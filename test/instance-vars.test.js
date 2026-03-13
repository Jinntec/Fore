/* eslint-disable no-unused-expressions */
import {html, oneEvent, fixtureSync, expect} from '@open-wc/testing';

import '../src/fx-fore.js';
import '../src/fx-model.js';
import '../src/fx-instance.js';
import '../src/ui/fx-output.js';
import { evaluateXPath, evaluateXPathToString } from '../src/xpath-evaluation.js';

describe('instance vars (JSON) Tests', () => {
    it('$default resolves to first instance in doc order (even when it has an explicit id)', async () => {
        const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <!-- first instance has explicit id="def" but must still be the default instance -->
                    <fx-instance id="def" type="json">
                        { "ui": { "query": "Outer" } }
                    </fx-instance>

                    <fx-instance id="other" type="json">
                        { "ui": { "query": "Other" } }
                    </fx-instance>
                </fx-model>

                <span id="s-default">{$default?ui?query}</span>
                <span id="s-def">{$def?ui?query}</span>
                <span id="s-other">{$other?ui?query}</span>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');

        expect(el.querySelector('#s-default').textContent.trim()).to.equal('Outer');
        expect(el.querySelector('#s-def').textContent.trim()).to.equal('Outer');
        expect(el.querySelector('#s-other').textContent.trim()).to.equal('Other');
    });

    it('repeat star-predicate filtering can use $default?… in functions', async () => {
        const el = await fixtureSync(html`
            <fx-fore>
                <fx-model>
                    <fx-instance type="json">
                        {
                        "ui": { "query": "arr" },
                        "movies": [
                        { "title": "Blade Runner" },
                        { "title": "Arrival" },
                        { "title": "Alien" }
                        ]
                        }
                    </fx-instance>
                </fx-model>

                <fx-repeat
                        id="movies"
                        ref="?movies?*[contains(lower-case(?title), lower-case($default?ui?query))]"
                >
                    <template>
                        <div class="row"><span class="title">{?title}</span></div>
                    </template>
                </fx-repeat>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');

        const titles = Array.from(el.querySelectorAll('fx-repeat#movies fx-repeatitem .title')).map(n =>
            n.textContent.trim(),
        );

        expect(titles).to.deep.equal(['Arrival']);
    });

    it('nested fore can read outer shared default instance via $default', async () => {
        const el = await fixtureSync(html`
            <fx-fore id="outer">
                <fx-model>
                    <fx-instance shared>
                        <data>
                            <name>John</name>
                        </data>
                    </fx-instance>

                    <fx-instance id="notshared">
                        <data>
                            <foo/>
                        </data>
                    </fx-instance>
                </fx-model>

                <fx-output id="outer-name" ref="$default/name"></fx-output>

                <fx-fore id="inner">
                    <fx-model></fx-model>
                    <fx-output id="inner-name" ref="$default/name"></fx-output>
                </fx-fore>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');
        await oneEvent(el.querySelector('#inner'), 'refresh-done');

        expect(el.querySelector('#outer-name').value).to.equal('John');
        expect(el.querySelector('#inner-name').value).to.equal('John');
    });

    it('nested fore uses its own $default when it has a local default instance', async () => {
        const el = await fixtureSync(html`
            <fx-fore id="todo">
                <fx-model>
                    <fx-instance id="todos" shared>
                        <data>
                            <todos>
                                <todo>Fix this!</todo>
                                <todo>Write tests</todo>
                            </todos>
                        </data>
                    </fx-instance>
                </fx-model>

                <fx-fore id="child-a">
                    <fx-model>
                        <fx-instance>
                            <data>
                                <message>You can do it!</message>
                            </data>
                        </fx-instance>
                    </fx-model>

                    <fx-output id="msg" ref="$default/message"></fx-output>
                    <fx-output id="count" value="count(instance('todos')/todos/todo)"></fx-output>
                </fx-fore>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');
        await oneEvent(el.querySelector('#child-a'), 'refresh-done');

        expect(el.querySelector('#msg').value).to.equal('You can do it!');
        expect(el.querySelector('#count').value).to.equal('2');
    });

    it('shared $default fallback uses the nearest ancestor fore with a shared default', async () => {
        const el = await fixtureSync(html`
            <fx-fore id="outer">
                <fx-model>
                    <fx-instance shared>
                        <data><name>OUTER</name></data>
                    </fx-instance>
                </fx-model>

                <fx-fore id="middle">
                    <fx-model>
                        <fx-instance shared>
                            <data><name>MIDDLE</name></data>
                        </fx-instance>
                    </fx-model>

                    <fx-fore id="inner">
                        <fx-model></fx-model>
                        <fx-output id="inner-name" ref="$default/name"></fx-output>
                    </fx-fore>
                </fx-fore>
            </fx-fore>
        `);

        // Initial refresh of outer
        await oneEvent(el, 'refresh-done');

        // Force nested fores to run their own refresh pipeline
        el.querySelector('#middle').dispatchEvent(new CustomEvent('refresh', { bubbles: true }));
        el.querySelector('#inner').dispatchEvent(new CustomEvent('refresh', { bubbles: true }));

        // Wait for outer to finish the forced refresh cycle
        await oneEvent(el, 'refresh-done');

        expect(el.querySelector('#inner-name').value).to.equal('MIDDLE');
    });

    it('local $default in a nested fore blocks fallback to parent shared default (JSON)', async () => {
        const el = await fixtureSync(html`
            <fx-fore id="outer">
                <fx-model>
                    <fx-instance type="json">
                        { "ui": { "query": "outer" } }
                    </fx-instance>
                </fx-model>

                <fx-output id="outer-q" ref="$default?ui?query"></fx-output>

                <fx-fore id="inner">
                    <fx-model>
                        <fx-instance type="json">
                            { "ui": { "query": "inner" } }
                        </fx-instance>
                    </fx-model>

                    <fx-output id="inner-q" ref="$default?ui?query"></fx-output>
                </fx-fore>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');

        el.querySelector('#inner').dispatchEvent(new CustomEvent('refresh', { bubbles: true }));
        await oneEvent(el, 'refresh-done');

        expect(el.querySelector('#outer-q').value).to.equal('outer');
        expect(el.querySelector('#inner-q').value).to.equal('inner');
    });

    it('mixed XML + JSON: $default JSON works and filtering works; shared XML instance works in outer', async function () {
        this.timeout(5000);

        const el = await fixtureSync(html`
            <fx-fore id="outer">
                <fx-model>
                    <!-- JSON must be FIRST so it is the default instance -->
                    <fx-instance type="json">
                        {
                        "ui": { "query": "arr" },
                        "movies": [
                        { "title": "Blade Runner" },
                        { "title": "Arrival" },
                        { "title": "Alien" }
                        ]
                        }
                    </fx-instance>

                    <!-- XML shared instance remains accessible by id -->
                    <fx-instance id="todos" shared>
                        <data>
                            <todos>
                                <todo>Fix this!</todo>
                                <todo>Write tests</todo>
                            </todos>
                        </data>
                    </fx-instance>
                </fx-model>

                <fx-fore id="inner">
                    <fx-model></fx-model>
                    <fx-repeat
                            id="movies"
                            ref="?movies?*[contains(lower-case(?title), lower-case($default?ui?query))]"
                    >
                        <template><span class="t">{?title}</span></template>
                    </fx-repeat>
                </fx-fore>
            </fx-fore>
        `);

        await oneEvent(el, 'refresh-done');

        // --- XML shared instance assertion (DOM-level, stable) ---
        const todosInst = el.querySelector('fx-instance#todos');
        const doc = todosInst.getInstanceData();
        const todos = Array.from(doc.querySelectorAll('todos > todo')).map(n => n.textContent.trim());
        expect(todos).to.deep.equal(['Fix this!', 'Write tests']);

        // --- JSON assertions via evaluator (NO template processing / NO fx-output) ---
        const jsonInst = el.querySelector('fx-instance[type="json"]');
        const jsonCtx = jsonInst.getDefaultContext(); // JSONNode root

        const q = evaluateXPathToString('$default?ui?query', jsonCtx, el);
        expect(q).to.equal('arr');

        // Evaluate the same filter expression the repeat uses, directly.
        // This returns JSONNode items; we assert that the only match is "Arrival".
        const filtered = evaluateXPath(
            "?movies?*[contains(lower-case(?title), lower-case($default?ui?query))]",
            jsonCtx,
            el,
        );

        expect(filtered).to.have.length(1);

        const title = evaluateXPathToString('?title', filtered[0], el);
        expect(title).to.equal('Arrival');
    });
});