xquery version "3.1";
import module namespace functx = "http://www.functx.com";

(:
 : Copyright (C) 2019 Joern Turner
 :)


(:~
 :
 : resolve a client-side Fore binding path into an XPath that can be evaluated on
 : the instances.
 :
 : A binding path looks like this: 'a/b' or if repeated 'a:2/b' where 'a' and 'b'
 : are ids of existing 'xf-bind' elements. For bindings that refer to repeated data
 : the index is given behind the ':'. This syntax was chosen to not confuse
 : clients-side ids with XPath location pathes.
 :
 : Following specifics apply:
 : - bind elements with a ref will never produce a positional predicate in the resulting XPath
 :   as they are single-node bindings.
 : - absolute instances pathes (starting with '$instances') will return without further processing
 :   of the client path.
 : - dot references are swallowed
 :
 : Pathes are processed from right to left to detect absolute references (starting with '$instances')
 : and stop further processing.
 :
 :)
declare function local:resolveBinding($model as element(), $path as xs:string){
    let $steps := tokenize($path,'/')
    let $step := $steps[count($steps)]
    let $bindId := if(contains($step,':')) then substring-before($step,':') else $step
    let $bindElem := $model//*[./@id = $bindId]
    return
        if(exists($bindElem)) then(
            let $reference := ($bindElem/@ref/string(),$bindElem/@set/string())
            let $rightString := functx:substring-before-last($path,'/')
            return
                if(starts-with($reference,'$instances')) then $reference
                else if(exists($bindElem/@set)) then
                    $bindElem/@set/string() || '[' || substring-after($step,':') || ']'
                else if($bindElem/@ref/string() = '.') then
                    local:resolveBinding($model, $rightString)
                else if(starts-with($bindElem/@ref/string(),"./")) then
                    local:resolveBinding($model, $rightString) || "/" || substring($bindElem/@ref/string(),3)
                else if(string-length($rightString) != 0) then(
                    (: ### if we got some string left recursively call it :)
                    local:resolveBinding($model, $rightString) || "/" || $reference
                )
                else
                    $bindElem/@ref/string()

        ) else "INVALID"

};


let $model :=
                <xf-model>
                    <xf-bind id="todo" set="task">
                        <xf-bind id="task" ref=".">
                            <xf-bind id="type" ref="@type"></xf-bind>
                        </xf-bind>
                        <xf-bind id="b" ref="../@foo"></xf-bind>
                    </xf-bind>
                    <xf-bind id="abs" ref="$instances?foo//street">
                        <xf-bind id="inner" ref="@number"></xf-bind>
                    </xf-bind>
                </xf-model>

(:let $path := 'todo:1/task':)
(:let $path := 'todo:1/abs':)
(:let $path := 'todo:1/b':)
(:let $path := 'todo:1/task/type':)
let $path := 'abs/inner'

return local:resolveBinding($model,$path)


