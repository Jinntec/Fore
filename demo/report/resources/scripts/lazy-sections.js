function openForHash() {
    const id = location.hash.slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    if (target.tagName === 'DETAILS') {
        target.open = true;
    }
    for (let el = target.parentElement; el; el = el.parentElement) {
        if (el.tagName === 'DETAILS') el.open = true;
    }
    const headerHeight = document.querySelector('.app-bar')?.offsetHeight ?? 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
    window.scrollTo({ top, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', openForHash);
window.addEventListener('hashchange', openForHash);

function openAllDetails() {
    // Setting details.open = true fires the native 'toggle' event, which is
    // exactly what an unopened section's <fx-include event="toggle"> is
    // listening for (see generate.xsl div[@fragment='true'] template) - same
    // trick openForHash() above already relies on for hash-driven navigation.
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
