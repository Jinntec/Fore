// Automated regression gate for the "foundation" ARIA work (see ACCESSIBILITY.md).
// Deliberately scoped to pages not already known-flaky (see demo-with-issues.md), that actually
// load Fore and a model (controls/ui.html has neither - see ACCESSIBILITY.md), and that don't
// depend on the out-of-scope P1/backlog widget-pattern work (e.g. fx-dialog's focus trap).
const pages = ['controls/email.html', 'controls/fx-output.html', 'controls/fx-repeat.html'];

pages.forEach(page => {
  describe(`a11y: ${page}`, () => {
    beforeEach(() => {
      cy.visit(page);
      cy.injectAxe();
    });

    it('has no detectable a11y violations', () => {
      cy.checkA11y(undefined, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      });
    });
  });
});
