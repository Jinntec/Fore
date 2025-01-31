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

    // We can also depend on the index function if it was used in our ancestry
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
  addXPath(xpath) {
    this._xpaths.add(xpath);
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
/*
  setParentDependencies(deps) {
    this._parentDependencies = deps;
  }
*/
}
