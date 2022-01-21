## fx-confirm

### Description

Displays simple confirmation dialog. Action will only execute if confirmation returns true.
### Attributes

| Name | Description |
|------|-------------|
| message | Message to display for confirmation. |

### Action Attributes

| Name | Description |
|------|-------------|
| delay | delay before action is executed in milliseconds. |
| event | the event name this action is listening to |
| ifExpr | boolean XPath expression. Action is only executed if this returns true. |
| target | id reference to element this action attaches to |
| whileExpr | boolean XPath expression. Action is only executed if `ìfExpr` and `whileExpr` return true. |


### Examples

* [Project Task planner](../demo/project.html)
