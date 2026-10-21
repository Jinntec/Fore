export const CROSS_ORIGIN_REPORT_HINT =
  'If you have a legitimate use case for cross-origin content, please file an issue at ' +
  'https://github.com/Jinntec/Fore with your usecase.';

/**
 * Whether `url` (resolved against the current document) points to the origin of the page.
 *
 * Content fetched from the same origin is trusted; content from any other origin must not be
 * injected into the page, as it could carry markup that runs script in our origin.
 * `localStore:` URLs never leave the browser and count as same-origin.
 *
 * @param {string} url absolute or relative URL
 * @returns {boolean}
 */
export function isSameOrigin(url) {
  const str = String(url ?? '');
  if (str.startsWith('localStore:')) return true;
  try {
    return new URL(str, document.baseURI).origin === window.location.origin;
  } catch (e) {
    return false;
  }
}

/**
 * Whether `url` may be assigned to `window.location` or passed to `window.open`.
 *
 * Only `http:` and `https:` (and relative URLs, which resolve to one of those) are allowed.
 * Schemes like `javascript:` or `data:` would run script when navigated to.
 *
 * @param {string} url absolute or relative URL
 * @returns {boolean}
 */
export function isSafeNavigationUrl(url) {
  try {
    const { protocol } = new URL(String(url ?? ''), document.baseURI);
    return protocol === 'http:' || protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Logs the console warning for a navigation that was blocked because of its URL scheme.
 *
 * @param {Element} element the element that refused to navigate
 * @param {string} url the offending URL
 */
export function warnUnsafeNavigationBlocked(element, url) {
  console.warn(
    `<${element.localName}> blocked navigation to '${url}': only http(s) URLs are allowed.`,
  );
}

/**
 * Logs the console warning for content that was blocked because it comes from another origin.
 *
 * @param {Element} element the element that refused the content
 * @param {string} url the offending URL
 */
export function warnCrossOriginBlocked(element, url) {
  console.warn(
    `<${element?.localName ?? 'fore'}> blocked content from '${url}': it is not same-origin ` +
      `(${window.location.origin}) and untrusted content must not be injected into the page. ` +
      CROSS_ORIGIN_REPORT_HINT,
  );
}
