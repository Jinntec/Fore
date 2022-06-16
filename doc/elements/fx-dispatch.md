## fx-dispatch

### Description

Action to dispatch an event with optional parameters to specific targets.

To specify event properties the `fx-property` element is used.

`fx-dispatch` will use id resolution within `fx-repeat` elements to resolve
the id in scope of current occurence.

### Attributes
| Name | Description |
|------|-------------|
| name | name of event to dispatch |
| targetid | id reference of element to dispatch to |

### Inherited Action Attributes
| Name | Description |
|------|-------------|
| delay | delay before action is executed in milliseconds. |
| event | the event name this action is listening to |
| if | boolean XPath expression. Action is only executed if this returns true. |
| target | id reference to element this action attaches to |
| while | boolean XPath expression. Action is only executed if `ìf` and `while` return true. |


### Examples

* [dispatch with properties](../demo/event-test.html)
* [fx-dispatch action](../demo/fx-dispatch.html)
