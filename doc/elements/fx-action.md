## fx-action

### Description

`fx-action` is a container action element that can take other actions
as children and defer their update cycle to the end of the action block.

This is useful when you e.g. want to set several values at once without the cost of 
each action to be recalculated, revalidated and refreshed.

### Script Actions

It is possible to call JavaScript from an `fx-action` by using the `src` attribute. For an example
see [script actions](../demo/script-actions.html) or the source of this file (doc/reference.html).

### Attributes

| Name | Description |
|------|-------------|
| delay | delay before action is executed in milliseconds. |
| event | the event name this action is listening to |
| if | boolean XPath expression. Action is only executed if this returns true. |
| src | optional attribute to point to a JavaScript file containing a single function to be called. |
| target | id reference to element this action attaches to |
| while | boolean XPath expression. Action is only executed if `ìf` and `while` return true. |


### Examples

* [Actions](../demo/actions.html)
* [the 'delay' attribute](../demo/delay.html)
* [Events](../demo/events.html)
* [Custom Events](../demo/events2.html)
* [Submission Demo](../demo/submission1.html)
* [Submission Chaining](../demo/submission3.html)