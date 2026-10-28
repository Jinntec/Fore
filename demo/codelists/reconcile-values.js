// Loaded via <fx-functionlib src="resources/scripts/reconcile-values.js"> in codelist-editor.html.
// Merges a previously-saved custom codelist's edited values into a freshly re-fetched
// original, matched by key. map:merge/map:get give an O(rows + customsource-rows) lookup --
// a per-cell fx-setvalue re-scanning customsource per cell hung the browser on large lists.
export const reconcileValues = {
  signature: 'reconcile-values($codelist as node(), $customsource as node()) as item()*',
  type: 'text/xquery',
  functionBody: `
    let $root := if ($codelist instance of document-node()) then $codelist/* else $codelist
    let $srcRoot := if ($customsource instance of document-node()) then $customsource/* else $customsource
    let $keyRef := $root/ColumnSet/Key[1]/ColumnRef/@Ref
    let $srcByKey := map:merge(
      (
        for $r in $srcRoot/SimpleCodeList/Row
        return map:entry(string($r/Value[@ColumnRef = $keyRef]/SimpleValue), $r)
      ),
      map { "duplicates": "use-last" }
    )
    return element SimpleCodeList {
      for $row in $root/SimpleCodeList/Row
      let $srcRow := map:get($srcByKey, string($row/Value[@ColumnRef = $keyRef]/SimpleValue))
      return element Row {
        $row/@*,
        for $v in $row/Value
        let $colRef := $v/@ColumnRef
        let $srcValue := $srcRow/Value[@ColumnRef = $colRef]/SimpleValue
        return element Value {
          attribute ColumnRef { $colRef },
          element SimpleValue { if (exists($srcValue)) then string($srcValue) else string($v/SimpleValue) }
        }
      }
    }
  `,
};

// Named export is the convention fx-functionlib looks for.
export const functions = [reconcileValues];
