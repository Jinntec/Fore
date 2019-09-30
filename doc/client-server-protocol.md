# client-server protocol

This document describes the JSON structures that are used in client-server communication.


## Syncing data items between client and server

Main problem with a distributed architecture is the syncing of identities between server
and client. When a data item (aka node) changes on either side the change needs
to be propagated to the other side. 

eXist-db uses node ids internally to identify nodes. However these change when
data are mutated and therefore are not the ideal candidates for this information
exchange. 

Either client and server have their 'preferred' data formats. On the server we'd like to deal mainly
with XML while JSON is better suited on the client.


In Fore uses `<xf-bind>` ids to map between the client- and server-side data-model.
 
The involved structures are best described in context with their occurrence during the
lifecycle of a form session.

 
## INIT: the client-side data-model

After initial load of a form in the browser it will send an 'init' request to load the client-side data-model. 

The response from the server will contain a structural copy of the `<xf-bind>` elements represented in JSON.

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
* each `<xf-bind>` MUST have an id


The details of the JSON output is described in [JSON format description](json.md).


## UPDATE

When the user interacts with the form this will be recorded in a changes list that gets send  
to the server when appropriate.

###  Binding pathes

The client sends updates for changes in a flat JSON format that uses a 'binding path' to refer
to the target node(s).


To avoid confusion Fore uses a simple syntax that is different from XPath. Remember - the
client does not know about XPath in any way and it's domain shouldn't be 
polluted with foreign semantics. 

The structure of a "binding path" is extremely simple:

```
[BINDID | BINDID:INDEX] [/...]
```

For the simplest case there is just a bind id as path e.g.

```
foo
``` 
 
For the following `xf-bind` this would refer to an XML node 'bar':

```
<xf-bind id="foo" ref="bar"></xf-bind>
```

For repeated elements (`xf-bind` with a `set` attribute) the path will contain
the index of the target element devided by a ':' char e.g.

```
foo:3
```

Deeper pathes are build by separating steps with a `/` e.g.

```
foo:3/bar
``` 
which will correspond to the following bindings:

```
<xf-bind id="foo" set="foo">
    <xf-bind id="bar" ref="bar"></xf-bind>
</xf-bind>
```

When resolving the path it selects the bar element that is a child of the third
'foo' element in the default instance.


### updates

When client-side data change (usually through user-interaction) the following format
is used to send the data:


### Value changes

```
[
    {
        "action":"setvalue",
        "path":"foo/bar"
        "value":"newValue"
    }
]
```

sends an update request to update the nodes referred to by the bindings 'foo/bar'.

### Appending a repeat item

```
[
    {
        "action":"append",
        "path":"foo:3",
        "modelItem": [
            {
                "id":"task",
                "value":""
            },
            {
                "id":"due",
                "value":""
            },
            {
                "id":"status",
                "value":""
            }
        ]
    }
]
```

sends an update request to append an entry to the nodeset referred to by the binding
'foo'. Strictly speaking in this case the index would not be necessary but is provided anyway.

Possible actions are:
* setvalue
* append
* insert
* delete
* submit
* [dispatch]



### returning states resulting from updates

When the user sends a value that in turn changes the state of other bound nodes this requires to return these
state changes back to the client for processing. 

This can be either MIP changes (e.g. a node became relevant by a value update in another place), validation alerts or
messages. 

| At a later stage even other actions might get returned but is still subject of further consideration.

The JSON format for such update is the same as for changes coming in from the client (see above).

## submit

todo: write