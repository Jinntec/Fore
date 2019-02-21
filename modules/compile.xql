xquery version "3.1";

module namespace compile="http://existsolutions.com/fore/compile";

import module namespace xqgen="http://www.tei-c.org/tei-simple/xquery/xqgen";

declare function compile:init-instances($model as element(xf-model)) {
    <map>
    {
        for $instance in $model/xf-instance
        let $data := serialize($instance/*)
        return
            <entry key='"{$instance/@id}"' value="{$data}"/>
    }
    </map>
};

(:~
 : If a binding has nested bindings, return code which: 1) sets the current binding
 : ref as context, and 2) calls the given function to generate code on the nested binding.
 :)
declare function compile:process-nested-binds($bind as element(xf-bind), $func as function(*)) {
    if ($bind/xf-bind) then
        let $subBindings := for $child in $bind/xf-bind return $func($child)
        return
            (: Adjust context to correspond to current @ref :)
            <item>{$bind/@ref/string()} <bang/> <sequence>{$subBindings}</sequence></item>
    else
        ()
};

(:~
 : Generate code to validate instance nodes based on a specified binding element.
 :)
declare function compile:validate($bind as element(xf-bind)) {
    if ($bind/@required) then
        <item>runtime:require({$bind/@required/string()}, {$bind/@ref/string()}, "required", {serialize($bind)})</item>
    else
        (),
    if ($bind/@type) then
        <item>runtime:for-each({$bind/@ref/string()}, function($v) {{ $v castable as {$bind/@type/string()} }}, "type", {serialize($bind)})</item>
    else
        (),
    if ($bind/@constraint) then
        <item>runtime:for-each({$bind/@ref/string()}, function($v) {{ $v ! boolean({$bind/@constraint/string()}) }}, "constraint", {serialize($bind)})</item>
    else
        (),
    (: Recursively check sub-bindings :)
    compile:process-nested-binds($bind, compile:validate#1)
};

(:~
 : Generate code to prepare a change set, which can later be applied to the instances.
 : For each binding with a @calculate attribute, return a map with two keys:
 : "target" is the target node for the change in the instance, "value" is the value to set.
 :)
declare function compile:get-change-set($bind as element(xf-bind)) {
    if ($bind/@calculate) then
        <item>
            {$bind/@ref/string()}
            <bang/>
            <map>
                <entry key="'target'" value="."/>
                <entry key="'value'" value="{$bind/@calculate}"/>
            </map>
        </item>
    else
        (),
        (: Recursively check sub-bindings :)
        compile:process-nested-binds($bind, compile:get-change-set#1)
};


declare function compile:main($model as element(xf-model), $debug as xs:boolean?) {
    let $code :=
        <xquery>
            <declare-namespace prefix="output" uri="http://www.w3.org/2010/xslt-xquery-serialization"/>
            <import-module prefix="runtime" uri="http://existsolutions.com/fore/runtime" at="runtime.xql"/>
            {
                if ($debug) then
                    <import-module prefix="console" uri="http://exist-db.org/xquery/console" at="java:org.exist.console.xquery.ConsoleModule"/>
                else
                    ()
            }
            <declare-option option="output:method" value="json"/>
            <declare-option option="output:media-type" value="application/json"/>
            
            <let var="instances">
                <expr>
                { compile:init-instances($model) }
                </expr>
                <let var="changes">
                    <expr>
                        <var>instances?default</var>
                        <bang/>
                        <array>{ for $bind in $model/xf-bind return compile:get-change-set($bind) }</array>
                    </expr>
                </let>
                <let var="instances">
                    <expr>runtime:recalculate($instances, $changes)</expr>
                    <return>
                        <sequence>
                            <item>
                                <var>instances?default</var>
                                <bang/>
                                <array>
                                {
                                    for $bind in $model/xf-bind
                                    return
                                        compile:validate($bind)
                                }
                                </array>
                            </item>
                            {
                                if ($debug) then
                                    <item>console:log($instances)</item>
                                else
                                    ()
                            }
                        </sequence>
                    </return>
                </let>
            </let>
        </xquery>
    return
        xqgen:generate($code, 0)
};