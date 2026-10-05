/**
 * Lazily load <fx-lens> when the URL contains ?lens (or ?inspect), or when the page
 * already contains a literal <fx-lens> element.
 *
 * Works independently of, and combinable with, ?debug (e.g. ?debug&lens).
 * fx-lens.js attaches and opens itself for the URL flags. Without a flag or element
 * nothing is imported, so pages pay no price.
 */

function domReady() {
  if (document.readyState !== 'loading') return Promise.resolve();
  return new Promise(resolve =>
    document.addEventListener('DOMContentLoaded', resolve, { once: true }),
  );
}

async function autoLoadLens() {
  const params = new URLSearchParams(window.location.search);
  const wanted = params.has('lens') || params.has('inspect');

  await domReady();

  if (wanted || document.querySelector('fx-lens')) {
    await import('../fx-lens.js');
  }
}

autoLoadLens();
