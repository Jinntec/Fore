xquery version "3.1";

import module namespace config = "http://existsolutions.com/fore/config" at 'config.xqm';

declare namespace output = "http://www.w3.org/2010/xslt-xquery-serialization";

declare option output:method "html5";
declare option output:media-type "text/html";

(:~
    filter xf-model elements from HTML document.
:)
declare function local:filter-model($element as element(), $token as xs:string) as element() {
    element {node-name($element)}
        {$element/@*,
            for $child in $element/node()[not(name(.) = 'xf-model')]
                return
                if(name($child) eq 'xf-form') then
                    element{'xf-form'}{
                        attribute{'token'}{$token},
                        for $subchild in $child/*
                        return local:filter-model($subchild,$token)
                 }
                else if ($child instance of element()) then
                    local:filter-model($child,$token)
                else $child
      }
};

declare function local:copy($element as element(), $token as xs:string) as element() {
    element {node-name($element)}
        {$element/@*,
            for $child in $element/node()
            return
                if(name($child) eq 'xf-form') then
                    element{'xf-form'}{
                        attribute{'token'}{$token},
                        for $subchild in $child/*
                            return
                            local:copy($subchild,$token)
                    }
                else if ($child instance of element()) then
                   local:copy($child,$token)
                else $child
      }
};

declare function local:handleChildren($node as node()){
    if(name($child) eq 'xf-form') then
        element{'xf-form'}{
            attribute{'token'}{$token},
            for $subchild in $child/*
                return
                local:filter-model($subchild,$token)
        }
    else if ($child instance of element()) then
       local:copy($child,$token)
    else $child
};



(:
    swallow the 'xf-model' by default. Can be changed in data/config.xml//developer-mode. If set to 'true'
    the model will be output to client for reference. This doesn't help much at the moment but can be used
    as a hook to plugin debugging later.
:)
(:let $doc := util:parse(util:binary-to-string(util:binary-doc("/db/apps/fore/demo/seed-form.html"))) :)


let $doc := doc("/db/apps/fore/demo/seed-form.html")
let $token := util:uuid()

(:return <data>{request:get-uri()}</data>:)
return
    if(data($config:developer-mode) eq 'true') then
        local:copy($doc/*,$token)
    else
        local:filter-model($doc/*,$token)

