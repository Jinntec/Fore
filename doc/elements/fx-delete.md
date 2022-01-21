## fx-delete

### Description

Deletes a node from a nodeset.

### Action Attributes

| Name | Description |
|------|-------------|
| delay | delay before action is executed in milliseconds. |
| event | the event name this action is listening to |
| ifExpr | boolean XPath expression. Action is only executed if this returns true. |
| target | id reference to element this action attaches to |
| whileExpr | boolean XPath expression. Action is only executed if `ìfExpr` and `whileExpr` return true. |

### fx-delete Attributes

| Name | Description |
|------|-------------|
| repeatId | id reference to `fx-repeat` to delete from. If not present `fx-delete` will use next repeatitem in ancestor tree. |


### Examples

* [todo](../demo/todo.html)
* [nested todo](../demo/nested-todo.html)
* [TEI header editor sample](../demo/simple-tei-header.html)
