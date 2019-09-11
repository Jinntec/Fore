xquery version "3.1";

import module namespace fore = "http://exist-db.org/apps/fore" at "fore.xqm";

let $token := util:uuid()

let $model :=  <xf-model id="record">
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

                    <xf-bind id="b-count" ref="@count" calculate="count(../task) + 2"></xf-bind>
                    <xf-bind id="b-factor" ref="factor" calculate="../@count * 3"></xf-bind>
                    <xf-bind id="b-todo" set="task">
                        <xf-bind id="b-task" ref="./text()" required="true()"></xf-bind>
                        <xf-bind id="b-state" ref="@complete" type="xs:boolean"></xf-bind>
                        <xf-bind id="b-due" ref="@due" type="xs:date"></xf-bind>
                    </xf-bind>
                </xf-model>

let $sessionModel := xmldb:store("/db/apps/fore/data",$token,$model)

let $instances :=
    map:merge(
    for $instance at $idx in doc($sessionModel)//xf-instance
        let $data := $instance[1]/*[1]
        let $key := if(exists($instance/@id)) then $instance/@id else 'default'
        let $log := util:log('info','######## ' || $data)
        return
            map:entry($key, $data)
    )

(:let $result := update value doc($sessionModel)//data[1]/@count with "foo":)


let $changes := fore:recalculate($sessionModel, $instances,$token)

return $changes
(:return doc($sessionModel)/*:)
