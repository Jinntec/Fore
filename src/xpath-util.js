/**
 * Checks wether the specified path expression is an absolute path.
 *
 * @param path the path expression.
 * @return <code>true</code> if specified path expression is an absolute
 * path, otherwise <code>false</code>.
 */

export class XPathUtil {

    static isAbsolutePath(path) {
        return path != null && (path.startsWith("/") || path.startsWith('instance('));
    }

}
