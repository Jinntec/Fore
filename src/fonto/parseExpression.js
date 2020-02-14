import { parse, SyntaxError } from './xPathParser';
const astParseResultCache = Object.create(null);
function storeParseResultInCache(input, language, ast) {
    astParseResultCache[`${language}~${input}`] = ast;
}
function getParseResultFromCache(input, language) {
    return astParseResultCache[`${language}~${input}`] || null;
}
/**
 * Parse an XPath string to a selector.
 *
 * @param  xPathString         The string to parse
 * @param  compilationOptions  Whether the compiler should parse XQuery
 */
export default function parseExpression(xPathString, compilationOptions) {
    const language = compilationOptions.allowXQuery ? 'XQuery' : 'XPath';
    const cached = compilationOptions.debug ? null : getParseResultFromCache(xPathString, language);
    try {
        let ast;
        if (cached) {
            ast = cached;
        }
        else {
            ast = parse(xPathString, {
                ['xquery']: !!compilationOptions.allowXQuery,
                ['outputDebugInfo']: !!compilationOptions.debug
            });
            if (!compilationOptions.debug) {
                storeParseResultInCache(xPathString, language, ast);
            }
        }
        return ast;
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(`XPST0003: Unable to parse: "${xPathString}".\n${error.message}\n${xPathString.slice(0, error['location']['start']['offset']) +
            '[Error is around here]' +
            xPathString.slice(error['location']['start']['offset'])}`);
        }
        throw error;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VFeHByZXNzaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3BhcnNpbmcvcGFyc2VFeHByZXNzaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRW5ELE1BQU0sbUJBQW1CLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUVoRCxTQUFTLHVCQUF1QixDQUFDLEtBQWEsRUFBRSxRQUFnQixFQUFFLEdBQVE7SUFDekUsbUJBQW1CLENBQUMsR0FBRyxRQUFRLElBQUksS0FBSyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDbkQsQ0FBQztBQUVELFNBQVMsdUJBQXVCLENBQUMsS0FBYSxFQUFFLFFBQWdCO0lBQy9ELE9BQU8sbUJBQW1CLENBQUMsR0FBRyxRQUFRLElBQUksS0FBSyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUM7QUFDNUQsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxDQUFDLE9BQU8sVUFBVSxlQUFlLENBQ3RDLFdBQW1CLEVBQ25CLGtCQUE4RDtJQUU5RCxNQUFNLFFBQVEsR0FBRyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO0lBQ3JFLE1BQU0sTUFBTSxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFaEcsSUFBSTtRQUNILElBQUksR0FBUyxDQUFDO1FBQ2QsSUFBSSxNQUFNLEVBQUU7WUFDWCxHQUFHLEdBQUcsTUFBTSxDQUFDO1NBQ2I7YUFBTTtZQUNOLEdBQUcsR0FBRyxLQUFLLENBQUMsV0FBVyxFQUFFO2dCQUN4QixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXO2dCQUM1QyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLEtBQUs7YUFDL0MsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRTtnQkFDOUIsdUJBQXVCLENBQUMsV0FBVyxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQzthQUNwRDtTQUNEO1FBQ0QsT0FBTyxHQUFHLENBQUM7S0FDWDtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2YsSUFBSSxLQUFLLFlBQVksV0FBVyxFQUFFO1lBQ2pDLE1BQU0sSUFBSSxLQUFLLENBQ2QsK0JBQStCLFdBQVcsT0FDekMsS0FBSyxDQUFDLE9BQ1AsS0FBSyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzlELHdCQUF3QjtnQkFDeEIsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUMxRCxDQUFDO1NBQ0Y7UUFDRCxNQUFNLEtBQUssQ0FBQztLQUNaO0FBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElBU1QgfSBmcm9tICcuL2FzdEhlbHBlcic7XG5pbXBvcnQgeyBwYXJzZSwgU3ludGF4RXJyb3IgfSBmcm9tICcuL3hQYXRoUGFyc2VyJztcblxuY29uc3QgYXN0UGFyc2VSZXN1bHRDYWNoZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbmZ1bmN0aW9uIHN0b3JlUGFyc2VSZXN1bHRJbkNhY2hlKGlucHV0OiBzdHJpbmcsIGxhbmd1YWdlOiBzdHJpbmcsIGFzdDogYW55KSB7XG5cdGFzdFBhcnNlUmVzdWx0Q2FjaGVbYCR7bGFuZ3VhZ2V9fiR7aW5wdXR9YF0gPSBhc3Q7XG59XG5cbmZ1bmN0aW9uIGdldFBhcnNlUmVzdWx0RnJvbUNhY2hlKGlucHV0OiBzdHJpbmcsIGxhbmd1YWdlOiBzdHJpbmcpIHtcblx0cmV0dXJuIGFzdFBhcnNlUmVzdWx0Q2FjaGVbYCR7bGFuZ3VhZ2V9fiR7aW5wdXR9YF0gfHwgbnVsbDtcbn1cblxuLyoqXG4gKiBQYXJzZSBhbiBYUGF0aCBzdHJpbmcgdG8gYSBzZWxlY3Rvci5cbiAqXG4gKiBAcGFyYW0gIHhQYXRoU3RyaW5nICAgICAgICAgVGhlIHN0cmluZyB0byBwYXJzZVxuICogQHBhcmFtICBjb21waWxhdGlvbk9wdGlvbnMgIFdoZXRoZXIgdGhlIGNvbXBpbGVyIHNob3VsZCBwYXJzZSBYUXVlcnlcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcGFyc2VFeHByZXNzaW9uKFxuXHR4UGF0aFN0cmluZzogc3RyaW5nLFxuXHRjb21waWxhdGlvbk9wdGlvbnM6IHsgYWxsb3dYUXVlcnk/OiBib29sZWFuOyBkZWJ1Zz86IGJvb2xlYW4gfVxuKTogSUFTVCB7XG5cdGNvbnN0IGxhbmd1YWdlID0gY29tcGlsYXRpb25PcHRpb25zLmFsbG93WFF1ZXJ5ID8gJ1hRdWVyeScgOiAnWFBhdGgnO1xuXHRjb25zdCBjYWNoZWQgPSBjb21waWxhdGlvbk9wdGlvbnMuZGVidWcgPyBudWxsIDogZ2V0UGFyc2VSZXN1bHRGcm9tQ2FjaGUoeFBhdGhTdHJpbmcsIGxhbmd1YWdlKTtcblxuXHR0cnkge1xuXHRcdGxldCBhc3Q6IElBU1Q7XG5cdFx0aWYgKGNhY2hlZCkge1xuXHRcdFx0YXN0ID0gY2FjaGVkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRhc3QgPSBwYXJzZSh4UGF0aFN0cmluZywge1xuXHRcdFx0XHRbJ3hxdWVyeSddOiAhIWNvbXBpbGF0aW9uT3B0aW9ucy5hbGxvd1hRdWVyeSxcblx0XHRcdFx0WydvdXRwdXREZWJ1Z0luZm8nXTogISFjb21waWxhdGlvbk9wdGlvbnMuZGVidWdcblx0XHRcdH0pO1xuXHRcdFx0aWYgKCFjb21waWxhdGlvbk9wdGlvbnMuZGVidWcpIHtcblx0XHRcdFx0c3RvcmVQYXJzZVJlc3VsdEluQ2FjaGUoeFBhdGhTdHJpbmcsIGxhbmd1YWdlLCBhc3QpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gYXN0O1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdGlmIChlcnJvciBpbnN0YW5jZW9mIFN5bnRheEVycm9yKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdGBYUFNUMDAwMzogVW5hYmxlIHRvIHBhcnNlOiBcIiR7eFBhdGhTdHJpbmd9XCIuXFxuJHtcblx0XHRcdFx0XHRlcnJvci5tZXNzYWdlXG5cdFx0XHRcdH1cXG4ke3hQYXRoU3RyaW5nLnNsaWNlKDAsIGVycm9yWydsb2NhdGlvbiddWydzdGFydCddWydvZmZzZXQnXSkgK1xuXHRcdFx0XHRcdCdbRXJyb3IgaXMgYXJvdW5kIGhlcmVdJyArXG5cdFx0XHRcdFx0eFBhdGhTdHJpbmcuc2xpY2UoZXJyb3JbJ2xvY2F0aW9uJ11bJ3N0YXJ0J11bJ29mZnNldCddKX1gXG5cdFx0XHQpO1xuXHRcdH1cblx0XHR0aHJvdyBlcnJvcjtcblx0fVxufVxuIl19