xquery version "3.1";

module namespace fore="http://exist-db.org/apps/fore";

import module namespace functx = "http://www.functx.com";


(: iterate and evaluate all 'calculate' attributes on bind elements :)
declare function fore:recalculate($model as xs:string, $instances as map(*), $token as xs:string){
(:declare function fore:recalculate($model as element(), $instances as map(*), $token as xs:string){:)

    let $sessionModel := doc($model)/*
(:    let $result := update value $sessionModel//data[1]/@count with 'bar':)

    let $changes := array{
        if(exists($sessionModel/xf-bind/@calculate)) then

                for $bind in $sessionModel/xf-bind
                    let $log := util:log('info', 'bind ' || $bind/@id)
                    let $log := util:log('info', 'bind calc ' || $bind/@calculate)
                    let $log := util:log('info', 'model ' || $model)

                    return if(exists($bind/@calculate)) then(
                        let $n := util:eval-inline($instances?default,$bind/@ref)
(:                        let $n := util:eval-inline($sessionModel//xf-instance[1]/*[1],$bind/@ref/string()):)
                        let $val := util:eval-inline($n,$bind/@calculate)
                        let $log := util:log('info', 'val ' || $val)
(:                        let $log := util:log('info', 'node ' || serialize($n)):)

                        let $result := util:eval('update value $sessionModel//xf-instance[1]/*[1]/' || $bind/@ref/string() || ' with $val')

                        let $log := util:log('info', 'node ' || functx:node-kind($n))
                        return
                            map{
                                "bind":$bind/@id/string(),
                                "ref":$bind/@ref/string(),
                                "value":xs:string($val),
                                "node":$n
                            }
                    ) else ()
        else ()
    }
    return $changes


(:    count($instances?default//task):)

(:    util:eval-inline($instances?default,"count(.//task)"):)
(:    util:eval-inline($instances?default,$model/xf-bind[@id='b-count']/@calculate):)

};


declare function fore:revalidate($model as element()){
    ()
};

