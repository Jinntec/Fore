xquery version "3.1";

import module namespace compile="http://existsolutions.com/exform/compile" at "compile.xql";

let $model := doc("/db/apps/fore/demo/two-instances.html")//fore-model
let $code := compile:main($model)
return
(:    $code:)
    util:eval($code)