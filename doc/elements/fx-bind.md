## fx-bind

### Description

`fx-bind` element attaches constraints and calculations to instance nodes.

### Attributes

| Name | Description |
|------|-------------|
|ref | XPath pointing to node(s) the bind is attaching to |
| calculate | XPath expression to be calculated. Result will become value of node(s) referenced by `ref` |
| constraint | boolean XPath expression to determine validity of node(s) |
| readonly | boolean XPath expression to determine readonly/readwrite state |
| relevant | boolean XPath expression to determine relevant/non-relevant state |
| required | boolean XPath expression to determine required/optional state |
| type | datatype |

### Examples

* [nested Binding](../demo/binding-nested.html)
* [Binding](../demo/binding.html)
* [Hello](../demo/body.html)
* [Simple Calculate](../demo/calc-order.html)
* [todo](../demo/nested-todo.html)
* [Recalculate](../demo/recalculate.html)
* [Revalidation](../demo/revalidate.html)
* [Submission Relevance Processing](../demo/submission-relevance.html)
