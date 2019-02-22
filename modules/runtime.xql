xquery version "3.1";

module namespace runtime="http://existsolutions.com/fore/runtime";

declare function runtime:output($refs as node()*, $relevant as xs:boolean?, $bind as element()) {
    map {
        "valid": true(),
        "bind": ($bind/@id, $bind/@ref)[1],
        "value": 
            if (count($refs) = 1) then 
                $refs/string() 
            else
                array { $refs/string() },
        "relevant": $relevant
    }
};

(:~
 : If a value is required, check for each node in the reference set if it does
 : exist and has content.
 :)
declare function runtime:require($require as xs:boolean, $refs as node()*, $message as xs:string, $bind as element()) {
    if ($require) then
        for $v at $idx in $refs
        let $valid := exists($v/node())
        return
            if ($valid) then
                ()
            else
                map {
                    "valid": false(),
                    "error": $message,
                    "index": $idx,
                    "bind": ($bind/@id, $bind/@ref)[1],
                    "required": $require,
                    "value": $v/string()
                }
    else
        ()
};

(:~
 : For each node in the reference set, call the supplied function and check if the effective boolean value
 : of its return sequence is true.
 :)
declare function runtime:for-each($refs as node()*, $check as function(*), $message as xs:string, $bind as element()) {
    for $ref at $idx in $refs
    return
        try {
            if ($check($ref)) then
                ()
            else
                map {
                    "valid": false(),
                    "error": $message,
                    "index": $idx,
                    "bind": ($bind/@id, $bind/@ref)[1],
                    "type": $bind/@type,
                    "value": $ref/string()
                }
        } catch * {
            map {
                "valid": false(),
                "error": $message,
                "detail": $err:description,
                "index": $idx,
                "bind": ($bind/@id, $bind/@ref)[1],
                "type": $bind/@type,
                "value": $ref/string()
            }
        }
};

(:~
 : Iterate through all instances and apply the specified changes. Return
 : a new map with the updated instances.
 :)
declare function runtime:recalculate($instances as map(*), $changes as array(*)) {
    map:merge(
        map:for-each($instances, function($key, $instance) {
            map {
                $key : runtime:update-recursive($changes, $instance)
            }
        })
    )
};

(:~
 : Recursively process the list of changes on a given instance. If the target of a change
 : is within the instance, apply the change and continue with the updated instance.
 :)
declare %private function runtime:update-recursive($changes as array(*), $instance as element()) {
    if (array:size($changes) = 0) then
        $instance
    else
        let $change := array:head($changes)
        let $newInstance :=
            (: Check if target node of change is within the instance :)
            if ($change?target/ancestor::* is $instance) then
                runtime:update-instance($instance, $change)
            else
                $instance
        return
            runtime:update-recursive(array:tail($changes), $newInstance)
};

(:~
 : Apply the given change to the instance by recursively copying the node tree.
 : A change may either target an element value or an attribute.
 :)
declare %private function runtime:update-instance($nodes as node()*, $change as map(*)) {
    for $node in $nodes
    return
        typeswitch($node)
            case element() return
                if ($node is $change?target) then
                    element { node-name($node) } {
                        runtime:update-attributes($node, $change),
                        $change?value
                    }
                else
                    element { node-name($node) } {
                        runtime:update-attributes($node, $change),
                        runtime:update-instance($node/node(), $change)
                    }
            default return
                $node
};

declare %private function runtime:update-attributes($node as element(), $change as map(*)) {
    for $attr in $node/@*
    return
        if ($attr is $change?target) then
            attribute { node-name($attr) } {
                $change?value
            }
        else
            $attr
};

