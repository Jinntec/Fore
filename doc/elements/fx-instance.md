## fx-instance

### Description

Holds the data of the model. A `fx-model` may have as many `fx-instance` elements as
necessary.



### Attributes

| Name | Description | default |
|------|-------------|------- |
| id | id of the instance for addressing in refs | default |
| src | url to load instance from via http get | |
| type | 'xml' or 'json' or 'html' are supported by now | xml |
| xpath-default-namespace | namespace to be used with unprefixed XPathes | emtpy |


### Examples

* [Instances](../demo/03-instances.html)
* [Instance super powers](../demo/04-instances.html)
* [the fx-output element](../demo/controls/fx-output.html)
