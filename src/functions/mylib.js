export function myfunc(node) {
  // simple: true if node is present
  return !!node;
}
myfunc.signature = 'myfunc($node as item()?) as xs:boolean';

export function hasText(s) {
  return s != null && String(s).trim() !== '';
}
hasText.signature = 'hasText($s as xs:string?) as xs:boolean';

// Named export is the default convention for fx-functionlib
export const functions = [myfunc, hasText];
