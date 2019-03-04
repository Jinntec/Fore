xquery version "3.1";

import module namespace compile="http://existsolutions.com/fore/compile" at "compile.xql";

declare namespace output="http://www.w3.org/2010/xslt-xquery-serialization";
declare option output:method "json";
declare option output:media-type "application/json";


let $token := request:get-parameter('token','')
let $path := "/db/apps" || request:get-parameter('url','/fore/demo/todo.html')

let $model := doc($path)//xf-model
let $code := compile:main($model, false())
(:let $session := session:set-attribute('fore.model',$code):)
return
(:    $path:)
(:    $code:)
    util:eval($code)

