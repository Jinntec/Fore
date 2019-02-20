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
                    "binding": $bind
                }
    else
        ()
};


declare function runtime:assert($expr as xs:boolean?, $message as xs:string, $bind as element()) {
    if (not($expr)) then
        map {
            "error": $message,
            "binding": $bind
        }
    else
        ()
};