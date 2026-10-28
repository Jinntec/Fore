// Loaded via <fx-functionlib src="resources/scripts/normalize-columns.js"> in codelist-editor.html.
// See the fx-functionlib call site there for why this exists (sparse optional genericode columns).
export const normalizeColumns = {
  signature: 'normalize-columns($doc as node()) as item()*',
  type: 'text/xquery',
  functionBody: `
    let $root := if ($doc instance of document-node()) then $doc/* else $doc
    return
      element SimpleCodeList {
        for $row in $root/SimpleCodeList/Row
        return
          element Row {
            $row/@*,
            $row/Value,
            for $col in $root/ColumnSet/Column[not(@Id = $row/Value/@ColumnRef)]
            return element Value { attribute ColumnRef { $col/@Id }, element SimpleValue {} }
          }
      }
  `,
};

// Named export is the convention fx-functionlib looks for.
export const functions = [normalizeColumns];
