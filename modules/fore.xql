xquery version "3.1";

import module namespace compile="http://existsolutions.com/fore/compile" at "compile.xql";

declare namespace output="http://www.w3.org/2010/xslt-xquery-serialization";
declare option output:method "json";
declare option output:media-type "application/json";

declare function local:processForm (){
    (: todo  :)
    return
};

(:let $path := session:get-attribute('path'):)
let $path := '/db/apps/fore/src/demo/todo.html'
let $log := util:log('info', 'path ' || $path)

return
    (: ###
        forms do not need to have instances at all. In that case an empty array is returned to the client.
    ### :)
    if(exists(doc($path)//xf-instance)) then
        let $model := doc($path)//xf-model
        let $code := compile:main($model, true())
        return
            $code
(:            util:eval($code):)
    else array {()}

