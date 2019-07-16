xquery version "3.1";

module namespace runtime="http://existsolutions.com/fore/runtime";


declare function runtime:output($refs as node()*, $relevant as xs:boolean?, $bind as element()) {
(:    let $log := util:log('info', 'runtime output refs ' || $refs):)
    let $log := util:log('info', 'runtime output bind ' || $bind/@id)
    let $log := util:log('info', 'runtime output set ' || $bind/@set)

    let $result :=
        if($bind/@set) then
            map{
                "bind": map{
                    "id":$bind/@id,
                    "sequence":true,
                    "nodeid":util:node-id($refs[1]),
                    "bind":array{
                        for $ref at $parentIndex in $refs
                        return
                            array{
                                if(exists($bind/xf-bind)) then
                                    (: evalueate instance data :)
                                    (: for $vorkommen at $index in $eval(instance) -> array {  :)
                                    for $child at $index in $bind/xf-bind
                                        let $childref := ($child/@ref/string(), $child/@set/string())

                                        let $log := util:log('info', 'index: ' || $index)
        (:                                let $log := util:log('info', 'child: ' || $child/@id):)
        (:                                let $log := util:log('info', 'child object ref: ' || $childref):)

                                        let $result := util:eval-inline($refs[$parentIndex], $childref)
                                        let $log := util:log('info', 'result: ' || $result)

                                        return
                                            map {
                                                "id": $child/@id/string(),
                                                "type": $child/@type/string(),
                                                "value": $result
                                            }


                                else ()
                            }

                    }
                }
            }
        else (
            for $ref at $index in $refs
            return
            map {
                "bind": map{
                "valid": true(),
                "id": ($bind/@id)[1],
                "value": $ref/string(),
                "relevant": $relevant,
                "nodeid":util:node-id($ref)
                }
            }
        )
    return $result

(:
    for $ref at $index in $refs
    return
            map {
                "bind": map{
                "valid": true(),
                "id": ($bind/@id)[1],
                "value": $ref/string(),
                "relevant": $relevant,
                "nodeid":util:node-id($ref)
                }
            }
             :)
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
                    "bind":map{
                        "valid": false(),
                        "alert": $message,
                        "index": $idx,
                        "id": ($bind/@id, $bind/@ref)[1],
                        "required": $require,
                        "value": $v/string()
                    }
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
        let $alert :=   if($message = 'constraint' and exists($bind/@alert)) then
                            data($bind/@alert)
                        else 'constraint'

        let $result-map := map:new((
                    if(exists($bind/@type) and $bind/@type != 'xs:string')
                        then ( map {"type": $bind/@type})
                        else (),
                    map {
                        "bind": map{
                            "valid": false(),
                            "alert": $alert,
                            "index": $idx,
                            "id": ($bind/@id, $bind/@ref)[1]
                        }
                    }))
        return
            try {
                if ($check($ref)) then
                    ()
                else
                    $result-map
            } catch * {
                map:new((
                        $result-map,
                        map {
                            "detail": $err:description,
                            "value": $ref/string()
                        }
                    ))
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

