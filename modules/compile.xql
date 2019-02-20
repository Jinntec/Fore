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
        ``[runtime:assert(`{$bind/@required/string()}` and exists(`{$bind/@ref/string()}`), "required", `{serialize($bind)}`)]``
    else
        (),
    if ($bind/@type) then
        ``[runtime:assert(every $v in `{$bind/@ref/string()}` satisfies $v castable as `{$bind/@type}`, "type", `{serialize($bind)}`)]``
    else
        (),
    (: Recursively check sub-bindings :)
    if ($bind/fore-bind) then
        let $subBindings := string-join(for $child in $bind/fore-bind return compile:validate($child), ", ")
        return
            (: Adjust context to correspond to current @ref :)
            ``[`{$bind/@ref/string()}` ! ( `{$subBindings}` )]``
    else
        ()
};

declare function compile:main($model as element(fore-model)) {
    let $code :=
        <xquery>
            <declare-namespace prefix="output" uri="http://www.w3.org/2010/xslt-xquery-serialization"/>
            <import-module prefix="runtime" uri="http://existsolutions.com/exform/runtime" at="runtime.xql"/>
            
            <code>
declare option output:method "json";
declare option output:media-type "application/json";

</code>
            
            <let var="instances">
                <expr>
                { compile:init-instances($model) }
                </expr>
                <return>
                    <var>instances?default</var>
                    <bang/> array {{
                    {
                        string-join(
                            for $bind in $model/fore-bind
                            return
                                compile:validate($bind),
                            ',&#10;'
                        )
                    }
                    }}
                </return>
            </let>
        </xquery>
    return
        xqgen:generate($code, 0)
};