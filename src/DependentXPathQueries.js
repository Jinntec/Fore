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
  setParentDependencies(deps) {
    this._parentDependencies = deps;
  }
}
