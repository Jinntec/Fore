xquery version "3.0";

declare namespace json = "http://www.json.org";
declare namespace control = "http://exist-db.org/apps/dashboard/controller";
declare namespace output = "http://exquery.org/ns/rest/annotation/output";
declare namespace rest = "http://exquery.org/ns/restxq";


declare variable $exist:path external;
declare variable $exist:resource external;
declare variable $exist:controller external;
declare variable $exist:prefix external;
declare variable $exist:root external;


if ($exist:path eq '') then
    <dispatch xmlns="http://exist.sourceforge.net/NS/exist">
        <redirect url="{request:get-uri()}/"/>
    </dispatch>
else if ($exist:path = "/") then
(: forward root path to index.html :)
    <dispatch xmlns="http://exist.sourceforge.net/NS/exist">
        <redirect url="index.html"/>
    </dispatch>

else if (ends-with($exist:path, ".json")) then
    <dispatch xmlns="http://exist.sourceforge.net/NS/exist">
        <cache-control cache="yes"/>
    </dispatch>
else if (starts-with($exist:path, "/src/demo/")) then
    <dispatch xmlns="http://exist.sourceforge.net/NS/exist">
    {
        let $path := "/db/apps/fore" || $exist:path
        let $log := util:log('info', 'controller path ' || $path)
        return
        if(doc-available($path)) then
            <forward url="{$exist:controller}/modules/load-form.xql" method="get">
                <add-parameter name="path" value="{$path}"/>
            </forward>
        else
            <forward url="{$exist:controller}/form-not-found.html" method="get">
                <add-parameter name="path" value="{$path}"/>
            </forward>
    }
    </dispatch>

else if (starts-with($exist:path, "/init")) then
    <dispatch xmlns="http://exist.sourceforge.net/NS/exist">
        <forward url="{$exist:controller}/modules/init.xql" method="get">
            <add-parameter name="path" value="{$exist:path}"/>
        </forward>
    </dispatch>


else if (ends-with($exist:path, ".html")) then
    <dispatch xmlns="http://exist.sourceforge.net/NS/exist">
        <cache-control cache="yes"/>
    </dispatch>

else
    <dispatch xmlns="http://exist.sourceforge.net/NS/exist">
        <cache-control cache="yes"/>
    </dispatch>
