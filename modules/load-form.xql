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
                        $child/@*,
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
                        $child/@*,
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
            $child/@*,
            attribute{'token'}{$token},
            for $subchild in $child/*
                return
                local:filter-model($subchild,$token)
        }
    else if ($child instance of element()) then
       local:copy($child,$token)
    else $child
};



(: ######################################################################

    Entry point for form processing which happens in two steps:
    Step 1:

    the form is loaded which means that it the contents of the form file will be returned but filtering out
    the <xf-model> part. This is done to prevent the client from seeing the model at all.

    Furthermore a token will be generated and placed upon <xf-form> element. This will be used as a session token.

    Step 2:
    the client will request local URL '/init' (or 'exist/apps/fore/init' when used from outside) to compile form and returns
    initial state as JSON representation of the bind elements.

    Swallows the 'xf-model' by default. Can be changed in data/config.xml//developer-mode. If set to 'true'
    the model will be output to client for reference. This doesn't help much at the moment but can be used
    as a hook to plugin debugging later.


 ###################################################################### :)

let $path := request:get-parameter('path','')
let $doc := doc($path)
let $token := util:uuid()
let $session := session:set-attribute('token',$token)
(:let $session := session:set-attribute('doc',$doc):)
let $session := session:set-attribute('path',$path)

let $log := util:log('info', 'token ' || session:get-attribute('token'))

return
    if(data($config:developer-mode) eq 'true') then
        local:copy($doc/*,$token)
    else
        local:filter-model($doc/*,$token)

