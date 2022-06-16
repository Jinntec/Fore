## fx-message

### Description

Display a message to the user.

### Attributes

| Name | Description | default |
|------|-------------| ------ |
| level | 'modal', 'modeless' or 'ephemeral' | ephemeral |
| | 'modal' - modal dialog window | |
| | 'sticky' - sticky popup message  | |
| | 'ephemeral' - auto-closing popup message  | default |
| value | XPath expression which resolves to message | |

### Action Attributes

| Name | Description |
|------|-------------|
| delay | delay before action is executed in milliseconds. |
| event | the event name this action is listening to |
| if | boolean XPath expression. Action is only executed if this returns true. |
| target | id reference to element this action attaches to |
| while | boolean XPath expression. Action is only executed if `ìf` and `while` return true. |


### Examples

* [fx-message](../demo/fx-message.html)
* [actions](../demo/actions.html)
* [Binding](../demo/binding.html)
* [the delay attribute](../demo/delay.html)
* [fx-control](../demo/fx-control.html)
* [Hello World](../demo/hello-fonto.html)
* [the if attribute](../demo/if.html)
* [instances](../demo/instances.html)
* [lazy modelItem creation during UI init](../demo/lazy.html)
* [the while attribute](../demo/while.html)
