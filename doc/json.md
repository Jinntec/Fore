# JSON format description

This document describes the exchange format for binding between client and server.

The `xf-bind` elements are provided in an JSON format that matches the structure 
of the bindings. These will be consumed by the client and serves as the datamodel
of the client.

## bind objects

Essentially the datamodel is made of bind objects. You can think of a 'bind object' as
an instanciation of a bind to a concrete node in the associated XML or JSON data.

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
    "bind":"b-greeting",
    "required":true,
    "value":"hello"
    },
    {
    "bind":"b-audience",
    "value":"world"
    }
]
```

alternative:

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
state of the bound node (see `required` in above example).
* a `bind` is identified by the bind id given by the corresponding `xf-bind` element
 ('b-greeting' and 'b-audience').
 
 
## simple nested bindings

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
    <xf-bind id='b-item' set="item"></xf-bind>
</xf-model>
```

In this case the bind targets 3 nodes in the bound instance. For each occurrence
a 'bind object' is created that reflects the state of the node with respect
to the binding properties (readonly, required, relevant, valid, type, value).

The resulting JSON:
```
[
    {
    "bind": "b-item",
    "set": [
        {"value": "item1"},
        {"value": "item2"},
        {"value": "item3"}
    ]
]
```


alternatively:

```
[
    {
        "bind": {
            "id":"b-item",
            "values": [
                "item1",
                "item2",
                "item3"
            ]
        }
    }
]
```

The `set` property will contain an array of bind objects. 

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

    <xf-bind id="todo" set="task">
        <xf-bind id="text" ref="./text()" required="true()"></xf-bind>
        <xf-bind id="state" ref="@complete" type="xs:boolean"> </xf-bind>
        <xf-bind id="due" ref="@due"> </xf-bind>
    </xf-bind>
</xf-model>
```

This results in slight changes in the resulting JSON:

```
[
  {
    "bind": "todo",
    "relevant": true,
    "set": [
      [
        {
          "bind": "text",
          "required": true,
          "value": "Pick up Milk"
        },
        {
          "bind": "state",
          "type": "boolean",
          "value": false
        },
        {
          "bind": "due",
          "value": "2019-02-04"
        }
      ],
      [
        {
          "bind": "text",
          "required": true,
          "value": "Make tutorial part 1"
        },
        {
          "bind": "state",
          "type": "boolean",
          "value": true
        },
        {
          "bind": "due",
          "value": "2019-01-04"
        }
      ]
    ]
  }
]

```

Here the set is not just an array but an array of arrays as we need to distinguish
'the rows in our table'.

## complex example

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
                  {
                    "id": "b-serial",
                    "type": "xs:integer"
                  },
                  {
                    "id": "b-origin"
                  }
                ]
              },
              {
                "id": "price",
                "type": "xs:double"
              }
            ],
            [
              {
                "id": "b-info",
                "bind": [
                  {
                    "id": "b-serial",
                    "type": "xs:integer"
                  },
                  {
                    "id": "b-origin"
                  }
                ]
              },
              {
                "id": "price",
                "type": "xs:double"
              }
            ]
          ]
        }
      ]
    }
  }
]
```
