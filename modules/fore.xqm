xquery version "3.1";

module namespace fore="http://exist-db.org/apps/fore";

import module namespace functx = "http://www.functx.com";


declare function fore:init-model($model as element(xf-model)){
    ()

    (: todo: call XQuery function fore:init()
        param: the model as element

        returns: JSON array of bindings plus potential action results
    :)

};

declare function fore:update-model($model as element(xf-model), $changes as array(*)){
    ()

    (: todo: call XQuery function fore:update()
        param: the model as element

        returns: JSON array of bindings plus potential action results
    :)

};








