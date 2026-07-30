describe('playground/index.html', () => {
  beforeEach(() => {
    Cypress.config('defaultCommandTimeout', 10000);
    cy.visit('playground/index.html');
    cy.get('#pg-chrome.fx-ready');
  });

  function setEditorContent(editorSelector: string, text: string) {
    cy.get(editorSelector).then($el => {
      ($el[0] as any).content = text;
    });
  }

  // fx-output renders its computed value inside its own shadow root (a `<span id="value">`,
  // not slotted light-DOM content), so it's invisible to plain `contain.text` assertions -
  // same shadow-piercing pattern already used in fx-update-orphans-control.cy.ts.
  function shouldShowComputedValue(expected: string) {
    cy.get('#pg-preview fx-output[ref="computed"]').should($el => {
      const span = ($el[0] as any).shadowRoot?.getElementById('value');
      expect(span?.textContent?.trim()).to.equal(expected);
    });
  }

  it('loads and renders a working default preview', () => {
    cy.get('#pg-preview fx-fore.fx-ready').should('exist');
    cy.get('#pg-preview').should('contain.text', 'Some text');
    shouldShowComputedValue('10');
  });

  it('updates the preview after editing the markup and clicking refresh', () => {
    const markup = `<fx-fore>
<fx-model>
  <fx-instance id="default"></fx-instance>
  <fx-bind ref="computed" calculate="string-length(../value)"></fx-bind>
</fx-model>
<fx-group>
  <fx-control ref="value">
    <label>Playground smoke label</label>
  </fx-control>
  <p>Length is: <fx-output ref="computed"></fx-output></p>
</fx-group>
</fx-fore>`;

    setEditorContent('#pg-markup-editor', markup);
    cy.get('#pg-refresh-btn').click();

    cy.get('#pg-preview').should('contain.text', 'Playground smoke label');
    cy.get('#pg-preview').should('not.contain.text', 'Some text');
  });

  it('updates the preview after editing the instance data and clicking refresh', () => {
    const instance = `<data>
  <value>Cypress</value>
  <computed></computed>
</data>`;

    setEditorContent('#pg-instance-editor', instance);
    cy.get('#pg-refresh-btn').click();

    shouldShowComputedValue('7');
  });

  it('picks up markup pasted directly into the editor (not just set via the content API)', () => {
    const markup = `<fx-fore>
<fx-model>
  <fx-instance id="default"></fx-instance>
  <fx-bind ref="computed" calculate="string-length(../value)"></fx-bind>
</fx-model>
<fx-group>
  <fx-control ref="value">
    <label>Pasted label</label>
  </fx-control>
  <p>Length is: <fx-output ref="computed"></fx-output></p>
</fx-group>
</fx-fore>`;

    // Exercises the real paste path (a native ClipboardEvent into CodeMirror 6's contenteditable
    // surface), not the `content` property setter the other tests use - that setter dispatches a
    // CM6 transaction directly and skips the browser's own paste handling entirely.
    cy.get('#pg-markup-editor')
      .should($el => {
        expect(($el[0] as any).shadowRoot.querySelector('.cm-content')).to.exist;
      })
      .then($el => {
        const cmContent = ($el[0] as any).shadowRoot.querySelector('.cm-content') as HTMLElement;
        cmContent.focus();
        document.execCommand('selectAll');

        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', markup);
        cmContent.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true, cancelable: true }),
        );
      });

    cy.get('#pg-markup-editor').should($el => {
      expect(($el[0] as any).content).to.contain('Pasted label');
    });

    // Click refresh rather than waiting on fore-codemirror's internal debounce: keeps this
    // deterministic, matching the other editing tests.
    cy.get('#pg-refresh-btn').click();
    cy.get('#pg-preview').should('contain.text', 'Pasted label');
  });
});
