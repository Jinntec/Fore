declare namespace output='http://www.w3.org/2010/xslt-xquery-serialization';

import module namespace runtime="http://existsolutions.com/fore/runtime" at "runtime.xql";

import module namespace console="http://exist-db.org/xquery/console" at "java:org.exist.console.xquery.ConsoleModule";

declare option output:method"json";

declare option output:media-type"application/json";

let $instances := 
    map {
        "default": <data>
                        <body>
                            <hand direction="left">
                                <finger index="3">middle</finger>
                            </hand>
                        </body>
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

                )

            return
                            if (exists($invalid)) then
                    $invalid
                else
runtime:output(body, true(), <xf-bind id="b-body" ref="body">
                    <xf-bind id="b-hand" ref="hand">
                        <xf-bind id="b-direction" ref="@direction"/>
                        <xf-bind id="b-finger" ref="finger"/>
                    </xf-bind>
                </xf-bind>)
        }
,
        console:log($instances)
    )