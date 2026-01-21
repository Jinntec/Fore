// lib2.js

export function now() {
    return new Date().toISOString();
}
now.signature = 'now() as xs:string';

// conflicting definition (should be ignored if first registration wins)
export function theanswer() {
    return 13;
}
theanswer.signature = 'theanswer() as xs:integer';

export const functions = [now, theanswer];