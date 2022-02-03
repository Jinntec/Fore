## fx-control

### Description

`fx-control` binds a concrete control (like a native input element) to
a data node in the model with the help of a `ref` attribute.


### Attributes

| Name | Description | Default |
|------|-------------| -------- |
| context | XPath reference pointing to parent context | incopeContext |
| label | optional label | - |
| ***ref*** | XPath reference pointing to the bound node | - |
| updateEvent | optional event name when to trigger updating of bound node. | blur |
| | 'enter' can be used to catch enter key |
| valueProp | optional property name used to set the value of the widget (default:'value') | value |

### Events

| Name | Description |
|------|-------------|
| value-changed | dispatched during refresh after the value of the control has changed |
| optional | dispatched during refresh when node has become optional |
| required | dispatched during refresh when node has become required |
| readonly | dispatched during refresh when node has become readonly |
| readwrite | dispatched during refresh when node has become readwrite |
| valid | dispatched during refresh when node has become valid |
| invalid | dispatched during refresh when node has become invalid |
| relevant | dispatched during refresh when node has become relevant |
| nonrelevant | dispatched during refresh when node has become non-relevant |

### Examples
* [the fx-control element](../demo/fx-control.html)
* [Actions](../demo/actions.html)
* [Fore API Demo](../demo/actions.html)
* [Template Expressions](../demo/avt.html)
* [Country selector](../demo/selects.html)
* [Selects](../demo/selects2.html)
* [Trigger](../demo/trigger.html)


