xquery version "3.1";

import module namespace runtime = "http://existsolutions.com/fore/runtime" at "runtime.xql";
import module namespace fore = "http://exist-db.org/apps/fore" at "fore.xqm";

(:
declare namespace output="http://www.w3.org/2010/xslt-xquery-serialization";
declare option output:method "json";
declare option output:media-type "application/json";
 :)

let $hasModel := session:get-attribute('fore.model')
let $model := if($hasModel) then session:get-attribute('fore.model')
              else
                <xf-model id="record">
                    <xf-instance>
                        <data count="1">
                            <factor></factor>
                            <task complete="false" due="2019-02-04">Pick up Milk</task>
                            <task complete="true" due="2019-01-04">Make tutorial part 1</task>
                        </data>
                    </xf-instance>

                    <xf-instance id="second">
                        <data><anotherfoo/></data>
                    </xf-instance>

                    <xf-bind id="b-count" ref="@count" calculate="count(.//task)+2"></xf-bind>
                    <xf-bind id="b-factor" ref="factor" calculate="@count * 2"></xf-bind>
<!--
                    <xf-bind id="b-todo" set="task">
                        <xf-bind id="b-task" ref="./text()" required="true()"></xf-bind>
                        <xf-bind id="b-state" ref="@complete" type="xs:boolean"></xf-bind>
                        <xf-bind id="b-due" ref="@due" type="xs:date"></xf-bind>
                    </xf-bind>
    -->
                </xf-model>

let $instances :=
    if($hasModel) then session:get-attribute('fore.instances')
    else
        map:merge(
        for $instance in $model/xf-instance
            let $data := $instance/*
            let $key := if(exists($instance/@id)) then $instance/@id else 'default'
            let $log := util:log('info','######## ' || $data)
            return
                map:entry($key, $data)
)

let $log := util:log('info', 'instances ' || serialize($instances) )
let $changes := fore:recalculate($model, $instances)



return $changes