xquery version "3.1";

(:~
 : module for Fore-specific functions to be used within forms.
 :)
module namespace xf = "http://existsolutions.com/fore/functions";


declare function xf:bind($model as element(*), $idref as xs:string) {

    let $result :=  if(exists($model//xf-bind[@id=$idref]))
                    then $model//xf-bind[@id=$idref]
                    else <xf-bind-error>Id: {$idref} does not exist</xf-bind-error>
    return $result
};




