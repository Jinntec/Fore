xquery version "3.1";


declare namespace output="http://www.w3.org/2010/xslt-xquery-serialization";
declare option output:method "json";
declare option output:media-type "application/json";

(:


:)


let $model := session:get-attribute('fore.model'  )
let $data := parse-json(util:binary-to-string(request:get-data()))
(:let $json := parse-json($data):)

(: do whatever you want here :)


return $data?1
(:
return array:for-each($data, function($item){
    $item
})
:)

