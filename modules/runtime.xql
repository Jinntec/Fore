xquery version "3.1";

module namespace runtime="http://existsolutions.com/exform/runtime";

declare function runtime:require($require as xs:boolean, $refs as node()*, $message, $bind as element()) {
    if ($require) then
        for $v at $idx in $refs
        let $valid := exists($v/node())
        return
            if ($valid) then
                ()
            else
                map {
                    "error": $message,
                    "index": $idx,
                    "bind": ($bind/@id, $bind/@ref)[1],
                    "required": $require,
                    "value": $v/string()
                }
    else
        ()
};

declare function runtime:for-each($refs as node()*, $check as function(*), $message as xs:string, $bind as element()) {
    for $ref at $idx in $refs
    let $valid := $check($ref)
    return
        if ($valid) then
            ()
        else
            map {
                "error": $message,
                "index": $idx,
                "bind": ($bind/@id, $bind/@ref)[1],
                "value": $ref/string()
            }
};