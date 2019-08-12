declare namespace output='http://www.w3.org/2010/xslt-xquery-serialization';

import module namespace runtime="http://existsolutions.com/fore/runtime" at "runtime.xql";

import module namespace console="http://exist-db.org/xquery/console" at "java:org.exist.console.xquery.ConsoleModule";

declare option output:method"json";

declare option output:media-type"application/json";

let $instances :=
    map {
        "default": <data>
            <param1>foo</param1>
            <param2>bar</param2>
            <param3>5.0</param3>
        </data>,
        "second": <data count="">
            <item>item1</item>
            <item>item2</item>
            <item>item3</item>
        </data>,
        "third": <data>
            <total/>
            <products>
                <price>22.50</price>
                <price>34.50</price>
                <price>13.25</price>
            </products>
        </data>
    }

let $changes :=
$instances?default !     array {
        (

        )

    }

let $instances :=
    runtime:recalculate($instances, $changes)
return
    (
$instances?default !         array {
            let $invalid :=
                (
                    runtime:require(true(), param1, "required", <xf-bind ref="param1" required="true()"/>)
                )

            return
                            if (exists($invalid)) then
                    $invalid
                else
runtime:output(param1, true(), <xf-bind ref="param1" required="true()"/>,1,''),
            let $invalid :=
                (
                    runtime:for-each(param2, function($v) { $v castable as xs:string}, "type", <xf-bind ref="param2" type="xs:string" constraint="../param3 &gt; 2"/>),
                    runtime:for-each(param2, function($v) { $v ! boolean(../param3 > 2) }, "constraint", <xf-bind ref="param2" type="xs:string" constraint="../param3 &gt; 2"/>)
                )

            return
                            if (exists($invalid)) then
                    $invalid
                else
runtime:output(param2, true(), <xf-bind ref="param2" type="xs:string" constraint="../param3 &gt; 2"/>,1,''),
            let $invalid :=
                (
                    runtime:require(true(), param3, "required", <xf-bind ref="param3" type="xs:decimal" required="true()"/>),
                    runtime:for-each(param3, function($v) { $v castable as xs:decimal}, "type", <xf-bind ref="param3" type="xs:decimal" required="true()"/>)
                )

            return
                            if (exists($invalid)) then
                    $invalid
                else
runtime:output(param3, true(), <xf-bind ref="param3" type="xs:decimal" required="true()"/>,1,'')
        }
,
        console:log($instances)
    )