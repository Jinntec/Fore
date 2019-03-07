# JSON format description

author: joern turner
date: 06.03.2019

This document describes the exchange format for binding between client and server.

The `xf-bind` elements are provided in an JSON format that matches the structure 
of the bindings. This will be consumed by the client and serves as the datamodel
of the client.

## bind properties

A bind may have additional properties that attach certain facets to bound nodes. With
the exception of the `type` property these are the result of evaluation of a boolean XPath
expression.

The following properties exist:

Property | Meaning | default
-------- | ------- | -------
readonly | bound node is readonly or readwrite | false
required | bound node is required or optional | false
relevant | bound node is relevant or not | true
valid | bound node is valid or invalid | true
type | datatype | string



## bind objects

Essentially the datamodel is made of bind objects. You can think of a 'bind object' as
an instanciation of a bind for a concrete node in the associated XML or JSON data.

Example:

```
<xf-model>
    <xf-instance>
        <data>
            <greeting>hello</greeting>
            <audience>world</audience>
        </data>
    </xf-instance>
    
    <xf-bind id="b-greeting" ref="greeting" requred="true()"></xf-bind>
    <xf-bind id="b-audience" ref="audience"><xf-bind> 
</xf-model>
```


The resulting JSON will look like this:

```
[
    {
        "bind":{
            "id":"b-greeting",
            "required":true,
            "value":"hello"
        }
    },
    {
        "bind": {
            "id":"b-audience",
            "value":"world"
        }
    }
]
```


There a few things worth pointing out:

* the JSON returned is always an array of bind objects
* bind objects contain a varying amount of properties that reflect the evaluated
state of the bound node (see `required` in above example). Properties will only be present
if they have a non-default value to minimize the needed bandwidth
* a `bind` is identified by the bind id given by the corresponding `xf-bind` element
 ('b-greeting' and 'b-audience').
* each `xf-bind` MUST have an id


## nested bindings

Binds can be nested where child bindings inherit the context from its parents e.g. in 
this example the bind of `b-type` will evaluate to `address/@type`.


```
<xf-model>
    <xf-instance>
        <data>
            <address type="postal">
                <street>Kielganstr.</street>
            </address>
        </data>
    </xf-instance>
    <xf-bind id="b-address">
        <xf-bind id="b-type" ref="@type"></xf-bind>
        <xf-bind id="b-street" ref="street"></xf-bind>
    </xf-bind>
</xf-model>

``` 


The JSON structure reflects the structure of the bindings like this:

```
[
    {
        "bind":{
            "id":"b-address",
            "bind": [
                {
                    "id": "b-type"
                    "value": "postal"
                },
                {
                    "id":"b-street"
                    "value": "Kielganstr."
                }
            ]
        }
    }
]
```
 
 
## simple repeat bindings

The concept of a 'bind object' becomes more clear when dealing with bindings
that resolve to multiple targets.

Example:

```
<xf-model>
    <xf-instance>
        <data>
            <item>item1</item>
            <item>item2</item>
            <item>item3</item>
        <data>
    </xf-instance>
    <xf-bind id='b-item' set="item" required="preceding-sibling::node()[1] = 'item1'"></xf-bind>
</xf-model>
```


In this case the bind targets 3 nodes in the bound instance. For each occurrence
a 'bind object' is created that reflects the state of the node with respect
to the binding properties (readonly, required, relevant, valid, type, value).

The resulting JSON:
```
[
  {
    "bind": {
      "id": "b-item",
      "bind": [
        {
          "value": "item1",
          "required": false
        },
        {
          "value": "item2",
          "required": true
        },
        {
          "value": "item3",
          "required": false
        }
      ]
    }
  }
]
```



 > In XForms there used to be a `nodeset` attribute on bind elements to bind to nodesets.
 This was deprecated and changed to the use of the `ref` attribute in all places. However
 as Fore is designed as a compiler it is significantly easier to process the bindings if 
 we can rely on static analysis of the bind elements. Therefore we use the `set` attribute
 instead of `ref` to explicitly mark the fact that multiple nodes are referred. As we intend
 to also bind to JSON instances we use the more generic term 'set' instead of 'nodeset'. 


## complex nested bindings

If a set contains more than a single bind we have a complex binding. Think of multi-column
table rows. 

Example:

```
<xf-model id="record">
    <xf-instance>
        <data>
            <task complete="false" due="2019-02-04">Pick up Milk</task>
            <task complete="true" due="2019-01-04">Make tutorial part 1</task>
        </data>
    </xf-instance>

    <xf-bind id="b-todo" set="task">
        <xf-bind id="b-task" ref="./text()" required="true()"></xf-bind>
        <xf-bind id="b-state" ref="@complete" type="xs:boolean"> </xf-bind>
        <xf-bind id="b-due" ref="@due"> </xf-bind>
    </xf-bind>
</xf-model>
```

This results in slight changes in the resulting JSON:

```
[
  {
    "bind": {
      "id": "b-todo",
      "bind": [
        [
          {
            "id": "b-task",
            "required": true,
            "value":"Pick up Milk"
          },
          {
            "id": "b-state",
            "type": "boolean",
            "value": false
          },
          {
            "id": "b-due",
            "type": "date"
          }
        ],
        [
          {
            "id": "b-task",
            "required": true,
            "value":"Make tutorial part"
          },
          {
            "id": "b-state",
            "type": "boolean",
            "value": true
          },
          {
            "id": "b-due",
            "type": "date"
          }
        ]
      ]
    }
  }
]

```


Here the set is not just an array but an array of arrays as we need to distinguish
'the rows in our table'.

## complex nested repeat example

This example shows the use of nested sets.

```
<xf-model id="products">
    <xf-instance>
        <cart total="">
            <products>
                <product>
                    <info>
                        <serial>123</serial>
                        <origin>China</origin>
                    </info>
                    <price>22.50</price>
                </product>
                <product>
                    <info>
                        <serial>456</serial>
                        <origin>China</origin>
                    </info>
                    <price>34.50</price>
                </product>
                <product>
                    <info>
                        <serial>678</serial>
                        <origin>Bangladesh</origin>
                    </info>
                    <price>13.25</price>
                </product>
            </products>
        </cart>
    </xf-instance>
    
    <xf-bind id="b-cart" ref="$instances?default/cart">
        <xf-bind id="b-total" ref="@total" calculate="sum(../products/price)" constraint=". = 70.20" alert="total must sum up to 70.20"></xf-bind>
        <xf-bind id="b-products" set="products/product">
            <xf-bind id="b-info" set="info">
                <xf-bind id="b-serial" ref="serial" type="xs:integer"></xf-bind>
                <xf-bind id="b-origin" ref="origin"></xf-bind>
            </xf-bind>
            <xf-bind id="price" ref="price" type="xs:double"></xf-bind>
        </xf-bind>
    </xf-bind>
</xf-model>

```

```
[
    {
        "bind": {
            "id": "b-cart",
            "bind": [
                {
                    "id": "b-total",
                    "valid": false,
                    "alert": "total must sum up to 70.20"
                },
                {
                    "id": "b-products",
                    "bind": [
                        [
                            {
                                "id": "b-info",
                                "bind": [
                                    [
                                        {
                                            "id": "b-serial",
                                            "type": "xs:integer",
                                            "value":123
                                        },
                                        {
                                            "id": "b-origin",
                                            "value": "China"
                                        }
                                    ]
                                ]
                            },
                            {
                                "id": "price",
                                "type": "xs:double",
                                "value":22.50
                            }
                        ],
                        [
                            {
                                "id": "b-info",
                                "bind": [
                                    [
                                        {
                                            "id": "b-serial",
                                            "type": "xs:integer",
                                            "value":456
                                        },
                                        {
                                            "id": "b-origin",
                                            "value": "China"
                                        }
                                    ]
                                ]
                            },
                            {
                                "id": "price",
                                "type": "xs:double",
                                "value": 34.50
                            }
                        ],
                        [
                            {
                                "id": "b-info",
                                "bind": [
                                    [
                                        {
                                            "id": "b-serial",
                                            "type": "xs:integer",
                                            "value":678
                                        },
                                        {
                                            "id": "b-origin",
                                            "value": "Bangladesh"
                                        }
                                    ]
                                ]
                            },
                            {
                                "id": "price",
                                "type": "xs:double",
                                "value": 13.25
                            }
                        ]
                    ]
                }
            ]
        }
    }
]
```

## Mapping of datatypes

In `xf-bind` elements the XSD Simple Types are used. This can be either the predefined as 
well as extended ones. Obviously those datatypes cannot be supported by a browser natively.

In order to allow at least basic type-checking the XSD types must be mapped to the
datatypes available in the browser.

tbd: Mapping table