## fx-model

### Description

The model contains data instances, bindings, submissions and custom 
functions.

While there's only one `fx-model` per `fx-fore` element it may have
any number of `fx-instance`, `fx-bind`, `fx-submission` and `fx-function` elements.

The model is resposible for keeping the model data up-to-date and consistent with regard to the rules
the bindings apply. Whenever changes in the UI or by an action occur, the model will update appropriately and 
recalculate and revalidate the bound instance data.

### Attributes

No Attributes

### Events

| Name | Description | 
|------|-------------|
| model-construct | dispatched when starting to initialize the model | 
| model-construct-done | dispatched when model has initialized. Instance have been loaded and first model update has taken place. | 
| rebuild-done | dispatched when model has run `rebuild`.  details: `maingraph` - the mainGraph | 
| | `maingraph` - the mainGraph | 
| recalculate-done | dispatched when model has run `recalculate` | 
| | `subgraph` - the subgraph for changed nodes |
| | `computes` - the number of computes |
### Examples

* [Recalculation](../demo/graph/subgraph.html)
* all examples

