```plantuml
title Fore interaction sequence

user->+controller: request form doc 
note right of controller: add session param 'path'
controller->+loadForm: foward
note right of loadForm: create token
note right of loadForm
    return filtered form doc
    (excl. fx-model)
end note
loadForm-->-controller:
controller-->-user:


user->+init: fx-fore is loaded and calls init(token)
init->*compile: not present in session?
note right of compile: compile form
compile-->init: return xquery code for form
destroy compile
note right of init
- run generated recalculations
- run generated validations
- calculate states for relevant, readonly, required and valid
- return all of the above in a JSON structure that reflects
the structure of the bindings and their corresponding instance nodes
end note
init-->-user:return JSON

user->+update:
note right of update
- lookup compiled form
- applyChanges(json)
end note
update-->-user:

```