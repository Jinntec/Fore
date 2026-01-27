// lib.js

export function theanswer() {
    return 42;
}
theanswer.signature = 'theanswer() as xs:integer';

export function hello(message) {
    return 'Hello ' + message;
}
hello.signature = 'hello($message as xs:string) as xs:string';

// XPath functionObject (goes through your existing registerFunction code path)
export const helloXPath = {
    signature: "helloXPath($who as xs:string) as xs:string",
    type: "text/xpath",
    functionBody: "concat('Hello - ', $who)"
};

// Named export is the default convention for fx-functionlib
export const functions = [theanswer, hello, helloXPath];