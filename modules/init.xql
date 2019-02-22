xquery version "3.1";


let $token := request:get-parameter('token','')

return <data>{$token}</data>