xquery version "3.1";

(:~
 :
 :)
module namespace config = "http://existsolutions.com/fore/config";


declare variable $config:app-root :=
let $rawPath := system:get-module-load-path()
let $modulePath :=
(: strip the xmldb: part :)
if (starts-with($rawPath, "xmldb:exist://")) then
    if (starts-with($rawPath, "xmldb:exist://embedded-eXist-server")) then
        substring($rawPath, 36)
    else
        substring($rawPath, 15)
else
    $rawPath
return
    substring-before($modulePath, "/modules")
;

declare variable $config:config := doc(concat($config:app-root, "/data/config.xml"));
declare variable $config:developer-mode := $config:config//developer-mode;