## fx-send

### Description

Triggers a submission. Submission with given id must exist otherwise
error is thrown.

### Attributes

| Name | Description | 
|------|-------------| 
| ***submission*** | required idref to `fx-submission` element. |

### Action Attributes

| Name | Description |
|------|-------------|
| delay | delay before action is executed in milliseconds. |
| event | the event name this action is listening to |
| ifExpr | boolean XPath expression. Action is only executed if this returns true. |
| target | id reference to element this action attaches to |
| whileExpr | boolean XPath expression. Action is only executed if `ìfExpr` and `whileExpr` return true. |


### Examples

* [auth](../demo/auth.html)
* [Submission Relevance Processing](../demo/submission-relevance.html)
* [Submission serialization](../demo/submission-serialize.html)
* [Submission Demo](../demo/submission1.html)
* [Submission Demo 2](../demo/submission2.html)
* [Submission serialization](../demo/submission3.html)
* [Submission Chaining](../demo/submission4.html)
* [submit with ref](../demo/targetref.html)
