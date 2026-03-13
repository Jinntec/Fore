export default class DependentXPathQueries {
  constructor() {
    /**
     * @type {Set<string>}
     */
    this._xpaths = new Set();

    this._parentDependencies = null;
  }

  /**
   * Returns true if this Fore element should be refreshed if a result of an index function changes
   *
   * @returns {boolean}
   */
  isInvalidatedByIndexFunction() {
    for (const xpath of this._xpaths) {
      // TODO: this can be done a lot better with parsing / checking for function references
      if (xpath.includes('index(')) {
        return true;
      }
    }

    // We can also depend on the index functioxn if it was used in our ancestry
    return !!this._parentDependencies?.isInvalidatedByIndexFunction();
  }

  /**
   * Detects whether there are XPaths that may be affected by child list changes to nodes with the given local names
   *
   * It does this pessimistically, assuming that any descendant axis can be affected by these changes
   *
   * @param {string[]} affectedLocalNames
   */
  isInvalidatedByChildlistChanges(affectedLocalNames) {
    // Scan for any XPath part that may jump over a node without checking what the type is. Can also
    // be done dynamically, by listening for the `bucket` parameter of all the dom accessors
    const flaggedConstructs = [
      '//',
      'ancestor',
      'descendant',
      'element(',
      '*',
      '..',
      'following',
      'preceding',
    ];
    for (const xpath of this._xpaths) {
      if (flaggedConstructs.some(c => xpath.includes(c))) {
        return true;
      }
      if (affectedLocalNames.some(n => xpath.includes(n))) {
        return true;
      }
    }
    // We can also depend on these elements if it was used in our ancestry
    return !!this._parentDependencies?.isInvalidatedByChildlistChanges(affectedLocalNames);
  }

  /**
   * Add an XPath to the dependencies
   *
   * @param {string} xpath the XPath to add
   */
  /**
   * Add an XPath to the dependencies
   *
   * @param {string} xpath the XPath to add
   */
  addXPath(xpath) {
    const expr = String(xpath ?? '');
    if (!expr) return;

    // Always keep the original expression
    this._xpaths.add(expr);

    // --- NEW: extract implicit JSON lookup deps hidden behind variables ---
    //
    // Examples:
    //   contains(., $default?ui?query)  -> adds ?ui?query
    //   $foo.?ui?query                 -> adds ?ui?query
    //
    // We only add lookup tails that start with ? or .? and then a key.
    // This is intentionally conservative and string-based.
    const varLookupRe =
      /\$[A-Za-z_][\w.-]*\s*(\.\?)?(\?[\w$.-]+(?:\[[^\]]+\])?)(\?[\w$.-]+(?:\[[^\]]+\])?)*(\?\*)?/g;

    // We want the full tail beginning at the first '?' (ignore optional '.')
    // so: ".?ui?query" => "?ui?query"
    let m;
    while ((m = varLookupRe.exec(expr)) !== null) {
      const fullMatch = m[0] || '';
      const qpos = fullMatch.indexOf('?');
      if (qpos === -1) continue;

      const tail = fullMatch.slice(qpos); // e.g. "?ui?query"
      // Only record meaningful deps (ignore just "?*")
      if (tail === '?*') continue;

      this._xpaths.add(tail);
    }
  }

  /**
   * Reset the dependencies on refresh
   *
   */
  resetDependencies() {
    this._xpaths.clear();
  }

  /**
   * @param {DependentXPathQueries} deps
   */
  setParentDependencies(deps) {
    this._parentDependencies = deps;
  }
}
