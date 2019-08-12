xquery version "3.1";

import module namespace runtime="http://existsolutions.com/fore/runtime" at "runtime.xql";

declare namespace output="http://www.w3.org/2010/xslt-xquery-serialization";
declare option output:method "json";
declare option output:media-type "application/json";


let $form := session:get-attribute('form')
let $log := util:log('info', 'form ' || serialize($form))

let $instances :=
    map {
        "default": <data>
                       <task complete="false" due="2019-02-04">Pick up Milk</task>
                   </data>
    }

let $changes := array{
    map {
        "path":"b-todo:1/b-task:1",
        "value":"foobar"
    }
}

return runtime:update($changes,$instances)
