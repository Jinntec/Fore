## fx-message

### Description

Display a message to the user.

### Attributes

| Name | Description | default |
|------|-------------| ------ |
| level | 'modal', 'modeless' or 'ephemeral' | ephemeral |
| | 'modal' - modal dialog window | |
| | 'modeless' - sticky popup message  | |
| | 'ephemeral' - auto-closing popup message  | |
| value | XPath expression which resolves to message | |

### Action Attributes

| Name | Description |
|------|-------------|
| delay | delay before action is executed in milliseconds. |
| event | the event name this action is listening to |
| ifExpr | boolean XPath expression. Action is only executed if this returns true. |
| target | id reference to element this action attaches to |
| whileExpr | boolean XPath expression. Action is only executed if `ìfExpr` and `whileExpr` return true. |


### Examples

* [actions](../demo/actions.html)
* [Binding](../demo/binding.html)
* [the delay attribute](../demo/delay.html)
* [fx-control](../demo/fx-control.html)
* [Hello World](../demo/hello-fonto.html)
* [the if attribute](../demo/if.html)
* [instances](../demo/instances.html)
* [lazy modelItem creation during UI init](../demo/lazy.html)
* [the while attribute](../demo/while.html)
