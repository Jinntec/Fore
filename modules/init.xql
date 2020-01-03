xquery version "3.1";

import module namespace compile="http://existsolutions.com/fore/compile" at "fore-compile.xql";
(:import module namespace fore="http://exist-db.org/apps/fore" at "fore.xqm";:)
import module namespace fore="http://exist-db.org/xquery/fore";

declare namespace output="http://www.w3.org/2010/xslt-xquery-serialization";
declare option output:method "json";
declare option output:media-type "application/json";

(:
    inits a form session.

:)

(:let $token := "abc":)
(:let $path := '/db/apps/fore/src/demo/07_select-autocomplete.html':)
(:let $path := '/db/apps/fore/src/demo/todo.html':)
(:let $path := '/db/apps/fore/src/demo/todoWithLabels.html':)
(:let $path := '/db/apps/fore/src/demo/todo3level.html':)
(:let $path := '/db/apps/fore/src/demo/body.html':)
(:let $path := '/db/apps/fore/src/demo/hello-world.html':)


(: ### will be set by load-form.xql ### :)
let $token := session:get-attribute('fore.token')
let $path := session:get-attribute('fore.path')

(:let $form := doc($path)//xf-model:)
let $form := session:get-attribute('fore.model')

let $state := fore:init($token, $form)
(:let $formSession := session:set-attribute($token,$foreModel):)

(:let $state := fore:process($foreModel):)


return $state

(:
let $instances := compile:init-instances($model)
let $code := compile:main($model,$instances, true())
:)


(:
let $formSession := session:set-attribute($token || '.code',$code)
let $formInstances := session:set-attribute($token || '.instances',$instances)
:)

(:return $instances:)
(:return util:eval($code):)
