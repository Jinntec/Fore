## fx-insert

### Description

Action to insert node(s) into instance data.

### General Binding Attributes
| Name | Description |
|------|-------------|
| ***ref*** | XPath pointing to node(s) the bind is attaching to |

### Attributes

| Name | Description | Default |
|------|-------------| --------|
| at | index position in nodeset where to insert new node(s) | 0 |
| position | with regard to 'at' can be either 'before' or 'after' | after |
| origin | XPath pointing to nodes to be inserted into referenced nodeset |
| keepValues | marker attribute. When present will keep text-values of origin nodes |

### Events

| Name | Description |
|------|-------------|
| insert | dispatched when nodes have been inserted |
| | detail[insertedNodes] - the inserted nodes |
| | detail[position] - the position of the insert in the nodeset | 
### Examples

* [Insert into inhomogenious nodeset](../demo/insert-inhomogenious.html)
* [insert action](../demo/insert.html)
* [insert action 2](../demo/insert2.html)
* [TEI header editor sample](../demo/simple-tei-header.html)
* [todo](../demo/todo2.html)
* [the while attribute](../demo/while.html)
