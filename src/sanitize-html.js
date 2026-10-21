import DOMPurify from 'dompurify';

/**
 * Replaces the content of `element` with `html` after sanitizing it against XSS with DOMPurify.
 *
 * DOMPurify's default configuration keeps benign markup (elements, `class`/`style` attributes,
 * images, links, ...) intact and strips scripts, event handlers and `javascript:` URLs, so
 * rendering stays the same as before except that XSS vectors are removed.
 *
 * DOMPurify is used on all browsers so the output is identical everywhere. The browser-native
 * Sanitizer API (`Element.setHTML`) is deliberately not used: its default configuration is a
 * restrictive baseline that also strips `class`/`style` attributes and elements like `<img>`,
 * which would visibly change the rendered output on Chrome/Firefox.
 *
 * @param {Element} element the element whose content is replaced
 * @param {string} html untrusted markup
 */
export function setSanitizedHtml(element, html) {
  element.innerHTML = DOMPurify.sanitize(html);
}
