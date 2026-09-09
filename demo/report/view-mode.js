// Forces any not-yet-expanded lazy section to load once view mode activates.
// Setting details.open = true fires the native 'toggle' event, which is what
// an unopened section's <fx-include event="toggle"> is listening for - so a
// lazily-loaded section (fragment="true" in the source ForeUIDefinition)
// doesn't stay collapsed-and-empty just because it was never clicked.
function openAllDetails() {
    document.querySelectorAll('details:not([open])').forEach(d => { d.open = true; });
}

document.addEventListener('DOMContentLoaded', () => {
    const outer = document.getElementById('outer');
    if (!outer) return;

    const syncFromOuter = () => {
        if (outer.classList.contains('view-mode')) openAllDetails();
    };

    syncFromOuter();
    new MutationObserver(syncFromOuter).observe(outer, { attributes: true, attributeFilter: ['class'] });
});
