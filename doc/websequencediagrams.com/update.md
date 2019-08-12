@startuml
Title:Fore update sequence


user->update.xql:'/update'
note right of update.xql:get $instances from session
note right of update.xql:get $changes from request
update.xql->runtime: update ($instances, $changes)
runtime-->user:status updates as json
note right of runtime:[nodeid:1.3.2, value:'foo', valid:false...]
@enduml


