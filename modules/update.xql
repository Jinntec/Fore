xquery version "3.1";

import module namespace runtime="http://existsolutions.com/fore/runtime" at "runtime.xql";

declare namespace output="http://www.w3.org/2010/xslt-xquery-serialization";
declare option output:method "json";
declare option output:media-type "application/json";


let $form := session:get-attribute('form')
let $log := util:log('info', 'form ' || serialize($form))

(: todo: get updates from post request :)
let $updates := parse-json('
[
  {
    "action": "setvalue",
    "value": "Pick up Milkasd",
    "path": "b-todo:1/b-task"
  },
  {
    "action": "setvalue",
    "value": "2019-03-22",
    "path": "b-todo:1/b-due"
  },
  {
    "action": "setvalue",
    "value": "false",
    "path": "b-todo:1/b-state"
  },
  {
    "action": "setvalue",
    "value": "Make tutorial part1",
    "path": "b-todo:2/b-task"
  },
  {
    "action": "setvalue",
    "value": "true",
    "path": "b-todo:2/b-state"
  },
  {
    "action": "setvalue",
    "value": "2019-04-11",
    "path": "b-todo:2/b-due"
  },
  {
    "action": "append",
    "bind": "b-todo",
    "index": 3,
    "modelItem": [
      {
        "id": "b-task",
        "value": ""
      },
      {
        "id": "b-due",
        "value": ""
      },
      {
        "id": "b-state",
        "value": ""
      }
    ],
    "path": "b-todo:3"
  }
]')

return array:for-each($updates, function($update){
    let $action := $update?action
    return
    switch($action)
        case 'setvalue'
            return concat('setvalue',':', $update?path, '=', $update?value)
        case 'append'
            return 'append'
        case 'delete'
            return 'delete'
        default return ()
})