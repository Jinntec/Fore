/**
 * simple module which turns a string into a template literal and substitutes all occurrences of map keys in the string. Syntax
 * conforms to JavaScript template literals e.g. `${key}` where 'key' is a key in the map.
 *
 * credits go to https://stackoverflow.com/questions/29182244/convert-a-string-to-a-template-string (Daniel)
 */

function parseTpl(template, map, fallback) {
  return template.replace(/\$\{[^}]+\}/g, match =>
    match
      .slice(2, -1)
      .trim()
      .split('.')
      .reduce((searchObject, key) => searchObject[key] || fallback || match, map),
  );
}
export { parseTpl };
