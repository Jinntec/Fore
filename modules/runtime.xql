xquery version "3.1";

module namespace runtime="http://existsolutions.com/exform/runtime";

declare function runtime:assert($expr as xs:boolean?, $message as xs:string, $bind as element()) {
    if (not($expr)) then
        map {
            "error": $message,
            "binding": $bind
        }
    else
        ()
};