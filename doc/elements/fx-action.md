## fx-action

### Description

`fx-action` is a container action element that can take other actions
as children and defer their update cycle to the end of the action block.

This is useful when you e.g. want to set several values at once without the cost of 
each action to be recalculated, revalidated and refreshed.

### Attributes

| Name | Description |
|------|-------------|
| delay | delay before action is executed in milliseconds. |
| event | the event name this action is listening to |
| ifExpr | boolean XPath expression. Action is only executed if this returns true. |
| target | id reference to element this action attaches to |
| whileExpr | boolean XPath expression. Action is only executed if `ìfExpr` and `whileExpr` return true. |


### Examples

* [Actions](../demo/actions.html)
* [the 'delay' attribute](../demo/delay.html)
* [Events](../demo/events.html)
* [Custom Events](../demo/events2.html)
* [Submission Demo](../demo/submission1.html)
* [Submission Chaining](../demo/submission3.html)