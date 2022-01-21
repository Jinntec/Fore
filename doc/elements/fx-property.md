## fx-property

### Description

Can only be used as child of `fx-dispatch` to specify event parameters.

This is just a custom element - not a full web component. Processing of properties takes
place in `fx-dispatch` element.

### Attributes

| Name | Description | 
|------|-------------| 
| name | name of the property to set |
| expr | XPath expression to use as value of property. Can even pass nodes via the event |
| value | a string value |

### Examples

* [dispatch with properties](../demo/event-test.html)
* [fx-dispatch action](../demo/fx-dispatch.html)
