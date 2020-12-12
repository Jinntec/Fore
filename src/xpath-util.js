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

    static isSelfReference(ref) {
        return ref === '.' || ref === './text()' || ref === 'text()' || ref === '' || ref === null;
    }

    //todo: this will need more work to look upward for instance() expr.
    static getInstanceId(ref){
        if(ref.startsWith('instance(')){
            let result = ref.substring(ref.indexOf('(') + 1);
            return result.substring(1, result.indexOf(')') -1);
        }
    }

}
