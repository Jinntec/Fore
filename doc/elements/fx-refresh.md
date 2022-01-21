## fx-refresh

### Description

Triggers immediate refresh.

### Attributes

No Attributes

### Action Attributes

| Name | Description |
|------|-------------|
| delay | delay before action is executed in milliseconds. |
| event | the event name this action is listening to |
| ifExpr | boolean XPath expression. Action is only executed if this returns true. |
| target | id reference to element this action attaches to |
| whileExpr | boolean XPath expression. Action is only executed if `ìfExpr` and `whileExpr` return true. |

### Examples

* [the delay attribute](../demo/delay.html)
* [Randomizer](../demo/randomizer.html)
* [the while attribute](../demo/while.html)
