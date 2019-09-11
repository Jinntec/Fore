xquery version "3.1";

module namespace modelValidator="http://exist-db.org/apps/modelData-validator";

declare function modelValidator:validate($model as element()){
    for $bind in $model//exf-bind
        let $ref := data($bind/@ref)
        
        let $contextNode := $model//salary
(:        let $contextNode := "$model" || $ref:)

        for $constraint in $bind/*
            return
            typeswitch($constraint)
                case element(exf-required) return
                    if(util:eval("string-length($modelData" || $ref || ") != 0")) then ()
                    else
                        $constraint/exf-alert
                case element(exf-constraint) return
                    (: todo: should only validate types when value exists :)
                    try{
                        util:eval("exists($contextNode" || "[" || $constraint/@expr || "])")
                    }catch *{
                        $constraint/exf-alert
                    }
                case element(exf-type) return
                    try{
                        if(xs:boolean(util:eval($constraint/@expr || '($contextNode)'))) then () else ()
                    }catch *{
                        $constraint/exf-alert
                    }
                default return ()
};
