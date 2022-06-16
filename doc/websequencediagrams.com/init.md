@startuml
Title:Fore init sequence

actor Client
Client -> Server:request form by URL
activate Server
Server --> Client: form doc with token
note right 
 store token, path and model element 
 in session and return doc with
 model stripped
end note
deactivate Server


Client -> Server:/init(token) 
activate Server
Server -> Client: state as Json

note right
 init.xql
 - fore:init($model as element)
end note
 

deactivate Server

@enduml


