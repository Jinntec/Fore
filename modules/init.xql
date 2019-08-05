xquery version "3.1";

import module namespace compile="http://existsolutions.com/fore/compile" at "compile.xql";

declare namespace output="http://www.w3.org/2010/xslt-xquery-serialization";
declare option output:method "json";
declare option output:media-type "application/json";

declare function local:processForm (){
    (: todo  :)
    return
};

let $path := session:get-attribute('path')
(:let $path := '/db/apps/fore/src/demo/07_select-autocomplete.html':)
(:let $path := '/db/apps/fore/src/demo/todo.html':)
(:let $path := '/db/apps/fore/src/demo/todoWithLabels.html':)
(:let $path := '/db/apps/fore/src/demo/todo3level.html':)
(:let $path := '/db/apps/fore/src/demo/body.html':)
let $log := util:log('info', 'path ' || $path)
let $token := session:get-attribute('token')
let $log := util:log('info', 'init token ' || $token)

let $form := session:get-attribute($token)
let $log := util:log('info', 'init form ' || serialize($form))

let $code := if($form) then (
                let $log := util:log('info', '##### form path: ' || $path)
                return $form
             )
             else (
                let $log := util:log('info', '##### compiling form: ' || $path)
                let $model := doc($path)//xf-model
                (: todo: initial compiled form should be cached and re-used :)
                let $compiled := compile:main($model, true())
                let $form := session:set-attribute($token,$compiled)
                return
                    $compiled
             )

return util:eval($code)
