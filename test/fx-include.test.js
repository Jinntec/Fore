import { expect, fixture, html, oneEvent } from '@open-wc/testing';

import { Fore } from '../src/fore.js';
import '../src/ui/fx-include.js';

function oneForeError(target) {
    return new Promise(resolve => {
        target.addEventListener(
            'error',
            event => {
                event.stopPropagation();
                resolve(event);
            },
            { once: true },
        );
    });
}
describe('fx-include', () => {
    it('includes content from a local template when the configured event occurs', async () => {
        const el = await fixture(html`
            <div>
                <button id="load" type="button">Load</button>

                <fx-include event="click" target="#load">
                    <template>
                        <section class="included">
                            <p>Included content</p>
                        </section>
                    </template>
                </fx-include>
            </div>
        `);

        const button = el.querySelector('#load');
        const include = el.querySelector('fx-include');

        expect(include.querySelector('.included')).to.equal(null);

        const done = oneEvent(include, 'include-done');
        button.click();
        await done;

        expect(include.querySelector('.included')).to.exist;
        expect(include.querySelector('.included').textContent).to.contain('Included content');
    });

    it('includes only once by default', async () => {
        const el = await fixture(html`
            <div>
                <button id="load" type="button">Load</button>

                <fx-include event="click" target="#load">
                    <template>
                        <section class="included">
                            <p>Included once by default</p>
                        </section>
                    </template>
                </fx-include>
            </div>
        `);

        const button = el.querySelector('#load');
        const include = el.querySelector('fx-include');

        let done = oneEvent(include, 'include-done');
        button.click();
        await done;

        const firstIncluded = include.querySelector('.included');

        expect(firstIncluded).to.exist;
        expect(include.querySelectorAll('.included').length).to.equal(1);

        button.click();

        await new Promise(resolve => setTimeout(resolve, 20));

        expect(include.querySelectorAll('.included').length).to.equal(1);
        expect(include.querySelector('.included')).to.equal(firstIncluded);
    });

    it('clears previously included content before reloading when reload is present', async () => {
        const el = await fixture(html`
            <div>
                <button id="load" type="button">Load</button>

                <fx-include event="click" target="#load" reload>
                    <template>
                        <section class="included">
                            <p>Included content</p>
                        </section>
                    </template>
                </fx-include>
            </div>
        `);

        const button = el.querySelector('#load');
        const include = el.querySelector('fx-include');

        let done = oneEvent(include, 'include-done');
        button.click();
        await done;

        const firstIncluded = include.querySelector('.included');

        expect(firstIncluded).to.exist;
        expect(include.querySelectorAll('.included').length).to.equal(1);

        done = oneEvent(include, 'include-done');
        button.click();
        await done;

        const secondIncluded = include.querySelector('.included');

        expect(include.querySelectorAll('.included').length).to.equal(1);
        expect(secondIncluded).to.exist;
        expect(secondIncluded).not.to.equal(firstIncluded);
    });

    it('replaces the fx-include element when replace is present', async () => {
        const el = await fixture(html`
            <div>
                <button id="load" type="button">Load</button>

                <fx-include event="click" target="#load" replace>
                    <template>
                        <section class="replacement">
                            <p>Replacement content</p>
                        </section>
                    </template>
                </fx-include>
            </div>
        `);

        const button = el.querySelector('#load');
        const include = el.querySelector('fx-include');

        const done = oneEvent(el, 'include-done');

        button.click();
        await done;

        expect(el.querySelector('fx-include')).to.equal(null);
        expect(el.querySelector('.replacement')).to.exist;
        expect(include.isConnected).to.equal(false);
    });

    it('supports immediate inclusion', async () => {
        const el = await fixture(html`
            <fx-include immediate>
                <template>
                    <section class="included">
                        <p>Immediate content</p>
                    </section>
                </template>
            </fx-include>
        `);

        await new Promise(resolve => setTimeout(resolve, 20));

        expect(el.querySelector('.included')).to.exist;
        expect(el.querySelector('.included').textContent).to.contain('Immediate content');
    });

    it('loads external content from src and applies selector', async () => {
        const originalLoadHtml = Fore.loadHtml;

        try {
            Fore.loadHtml = async () => `
        <html>
          <body>
            <section id="wanted" class="external">
              External include
            </section>

            <section id="ignored">
              Ignored include
            </section>
          </body>
        </html>
      `;

            const el = await fixture(html`
        <div>
          <button id="load" type="button">Load</button>

          <fx-include
            event="click"
            target="#load"
            src="fragment.html"
            selector="#wanted">
          </fx-include>
        </div>
      `);

            const button = el.querySelector('#load');
            const include = el.querySelector('fx-include');

            const done = oneEvent(include, 'include-done');

            button.click();
            await done;

            expect(include.querySelector('.external')).to.exist;
            expect(include.textContent).to.contain('External include');
            expect(include.textContent).not.to.contain('Ignored include');
        } finally {
            Fore.loadHtml = originalLoadHtml;
        }
    });

    it('loads the first template from external src when no selector is present', async () => {
        const originalLoadHtml = Fore.loadHtml;

        try {
            Fore.loadHtml = async () => `
        <html>
          <body>
            <template>
              <section class="external-template">
                External template content
              </section>
            </template>
          </body>
        </html>
      `;

            const el = await fixture(html`
        <div>
          <button id="load" type="button">Load</button>

          <fx-include
            event="click"
            target="#load"
            src="fragment.html">
          </fx-include>
        </div>
      `);

            const button = el.querySelector('#load');
            const include = el.querySelector('fx-include');

            const done = oneEvent(include, 'include-done');

            button.click();
            await done;

            expect(include.querySelector('.external-template')).to.exist;
            expect(include.textContent).to.contain('External template content');
        } finally {
            Fore.loadHtml = originalLoadHtml;
        }
    });

    it('loads the body content from external src when no selector and no template are present', async () => {
        const originalLoadHtml = Fore.loadHtml;

        try {
            Fore.loadHtml = async () => `
        <html>
          <body>
            <section class="external-body">
              External body content
            </section>
          </body>
        </html>
      `;

            const el = await fixture(html`
        <div>
          <button id="load" type="button">Load</button>

          <fx-include
            event="click"
            target="#load"
            src="fragment.html">
          </fx-include>
        </div>
      `);

            const button = el.querySelector('#load');
            const include = el.querySelector('fx-include');

            const done = oneEvent(include, 'include-done');

            button.click();
            await done;

            expect(include.querySelector('.external-body')).to.exist;
            expect(include.textContent).to.contain('External body content');
        } finally {
            Fore.loadHtml = originalLoadHtml;
        }
    });

    it('dispatches an error when no template and no src are available', async () => {
        const el = await fixture(html`
            <fx-include event="click"></fx-include>
        `);

        const error = oneForeError(el);

        el.click();

        const event = await error;

        expect(event.detail.message).to.contain('no src and no direct template child');
    });

    it('dispatches an error when selector is not found in external src', async () => {
        const originalLoadHtml = Fore.loadHtml;

        try {
            Fore.loadHtml = async () => `
      <html>
        <body>
          <section id="other">Other content</section>
        </body>
      </html>
    `;

            const el = await fixture(html`
                <div>
                    <button id="load" type="button">Load</button>

                    <fx-include
                            event="click"
                            target="#load"
                            src="fragment.html"
                            selector="#missing">
                    </fx-include>
                </div>
            `);

            const button = el.querySelector('#load');
            const include = el.querySelector('fx-include');

            const error = oneForeError(include);

            button.click();

            const event = await error;

            expect(event.detail.message).to.contain("selector '#missing' not found");
        } finally {
            Fore.loadHtml = originalLoadHtml;
        }
    });
});