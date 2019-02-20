xquery version "3.1";

module namespace compile="http://existsolutions.com/exform/compile";

import module namespace xqgen="http://www.tei-c.org/tei-simple/xquery/xqgen";

declare function compile:init-instances($model as element(fore-model)) {
    <map>
    {
        for $instance in $model/fore-instance
        let $data := serialize($instance/*)
        return
            <entry key='"{$instance/@id}"' value="{$data}"/>
    }
    </map>
};

declare function compile:validate($bind as element(fore-bind)) {
    if ($bind/@required) then
        <item>runtime:require({$bind/@required/string()}, {$bind/@ref/string()}, "required", {serialize($bind)})</item>
    else
        (),
    if ($bind/@type) then
        <item>runtime:assert(every $v in {$bind/@ref/string()} satisfies $v castable as {$bind/@type/string()}, "type", {serialize($bind)})</item>
    else
        (),
    (: Recursively check sub-bindings :)
    if ($bind/fore-bind) then
        let $subBindings := for $child in $bind/fore-bind return compile:validate($child)
        return
            (: Adjust context to correspond to current @ref :)
            <item>{$bind/@ref/string()} <bang/> <sequence>{$subBindings}</sequence></item>
    else
        ()
};

declare function compile:main($model as element(fore-model)) {
    let $code :=
        <xquery>
            <declare-namespace prefix="output" uri="http://www.w3.org/2010/xslt-xquery-serialization"/>
            <import-module prefix="runtime" uri="http://existsolutions.com/exform/runtime" at="runtime.xql"/>
            
            <declare-option option="output:method" value="json"/>
            <declare-option option="output:media-type" value="application/json"/>
            
            <let var="instances">
                <expr>
                { compile:init-instances($model) }
                </expr>
                <return>
                    <var>instances?default</var>
                    <bang/>
                    <array>
                    {
                        for $bind in $model/fore-bind
                        return
                            compile:validate($bind)
                    }
                    </array>
                </return>
            </let>
        </xquery>
    return
        xqgen:generate($code, 0)
};