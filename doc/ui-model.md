# UI data model

As XML and XPath (not to speak of XQuery) do not well on the client an exchange
data model is needed to represent the state of the server-side data on the client.

As natural for UI apps nowadays the data model will be represented in JSON format.


This example shows the JSON structure for the form [two-instances.html](../elements/demo/two-instances.html)

```

[ {
  "value" : "foo",
  "valid" : true,
  "bind" : "param1",
  "relevant" : true
}, {
  "value" : "bar",
  "valid" : true,
  "bind" : "param2",
  "relevant" : true
}, {
  "value" : "5.0",
  "valid" : true,
  "bind" : "param3",
  "relevant" : true
}, {
  "value" : [ "item1", "item2", "item3" ],
  "valid" : true,
  "bind" : "item",
  "relevant" : true
}, {
  "value" : "3",
  "valid" : true,
  "bind" : "@count",
  "relevant" : true
}, {
  "value" : [ "22.50", "34.50", "13.25" ],
  "valid" : true,
  "bind" : "products/price",
  "relevant" : true
}, {
  "alert" : "constraint",
  "value" : "70.25",
  "index" : 1,
  "type" : null,
  "valid" : false,
  "bind" : "total"
} ]
```

## Properties

This table describes the single properties that may be present for
every data node.


Name | Purpose | default
----- | ------ | -------
alert | signal an validation error to the user | none
bind | id or ref? | none
message | send a message to the user | none  
readonly | whether a node is readonly or readwrite | false
required | whether a node is required or optional | false
relevant | whether a node is relevant or not | true
type | the datatype of a node | string
valid | whether a node is valid or invalid | true
value | textvalue or array of values | empty string



 


