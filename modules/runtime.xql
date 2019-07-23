xquery version "3.1";

module namespace runtime="http://existsolutions.com/fore/runtime";


declare function runtime:get-value($refs as node()*){
    if ($refs instance of attribute()) then $refs
    else if($refs instance of element()) then $refs/text()
    else $refs
};

declare function runtime:output($refs as node()*, $relevant as xs:boolean?, $bind as element(),$index as xs:integer) {

    let $log := util:log('info','$bind ' || serialize($bind))
    let $log := util:log('info','>>>>>> $index ' || $index)

    let $out := if(starts-with($bind/@ref,'@')) then '@@@ ' || $bind/@ref
                else serialize($refs)

    let $log := util:log('info','$refs ' || $out)

    (:  #########
        handle following cases:
        - bind has a 'set' attribute
        - bind has a 'ref' attribute
    :)

    (: #####
        handle binds with a 'set' attribute meaning they are referring to a nodeset and need to be output as an array of arrays
        for the repeated items they are representing.
    ##### :)
    let $result := if ($bind/@set) then (
            map{
                "bind": map{
                    "id":$bind/@id,
                    "sequence":true(),
                    "nodeid":util:node-id($refs[$index]),
                    "bind":array{
                        (: ### create right amount of array entries for the set ### :)
                        for $ref at $parentIndex in $refs
                        return
                            array{
                                if(exists($bind/xf-bind)) then
                                    for $child at $index in $bind/xf-bind
                                        let $childref := ($child/@ref/string(), $child/@set/string())
                                        let $result := util:eval-inline($refs[$parentIndex], $childref)
                                        return
                                            if($result) then
                                                runtime:output($result,$relevant,$child,$parentIndex)
                                            else ()

                                else ()
                            }

                    }
                }
            }
        )
        (: #####
            handle binds that are part of a list of binds. If the parent bind has more than one child we need to output
            an array of bind objects.
        ##### :)
        else if(count($bind/../xf-bind) > 1) then
            let $log := util:log('info', 'zzzzzzzzzzzzz')
            return
                runtime:output-list($refs, $relevant,$bind, $index)

        (: #####
            handle binds that have a 'ref' attribute. Output a full bind object.
        ##### :)
        else if ($bind/@ref) then (

            let $value := runtime:get-value($refs)
            return
            map {
                "bind": map:merge((
                    if($value) then
                        map{
                            "value":$value
                        }
                    else(),
                    if($relevant and $relevant != true()) then
                        map{
                            "relevant":$relevant
                        }
                    else(),
                    map{
                            "id": $bind/@id,
                            "nodeid":util:node-id($refs)
                    },
                    if(exists($bind/xf-bind)) then (

                        if (count($bind/xf-bind) = 1) then (
                            let $childref := $bind/xf-bind/@ref/string()
                            let $result := util:eval-inline($refs, $childref)
                            return
                                runtime:output($result,$relevant,$bind/xf-bind,$index)
                        ) else (
                            map{
                                "bind":array {
                                for $child at $index in $bind/xf-bind
                                    let $childref := ($child/@ref/string(), $child/@set/string())
                                    let $result := util:eval-inline($refs, $childref)
                                    return
                                        runtime:output-list($result,$relevant,$child,$index)
                                }
                            }
                        )
                    ) else ()

                ))
            }
        )
        else ()

    return $result

};

declare function runtime:output-list($refs as node()*, $relevant as xs:boolean?, $bind as element(),$index as xs:integer?) {
    let $log := util:log('info','output-list $ref name: ' || node-name($refs))

    let $value := runtime:get-value($refs)

    let $log := util:log('info','output-list refs: ' || $refs)
    let $log := util:log('info','output-list value: ' || $value)


    return
    map:merge((
        if($value) then
            map{
                "value":$value
            }
        else(),
        if($relevant and $relevant != true()) then
            map{
                "relevant":$relevant
            }
        else(),
        map{
            "id": $bind/@id,
            "nodeid":util:node-id($refs)
        },
        if($bind/xf-bind) then
            for $child at $index in $bind/xf-bind
                let $childref := ($child/@ref/string(), $child/@set/string())
                let $result := util:eval-inline($refs, $childref)
                return
                    runtime:output($result,$relevant,$child,$index)
        else ()
    ))

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

        let $result-map := map:merge((
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
                map:merge((
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

