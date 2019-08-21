# client-server exchange format

This document describes the JSON structure that is used to sync client and
server state.

## Syncing data items between client and server

Main problem with a distributed architecture is the syncing of identities between server
and client. When a data item (aka node) changes on either side the change needs
to be propagated to the other side. 

eXist-db uses node ids internally to identify nodes. However these change when
data are mutated and therefore are not the ideal candidates for this information
exchange. 

Instead the client exclusively works on bind ids. It actually does not know about
the structure of the data on the server. To avoid complex mapping procedures with generated ids
Fore completely relies on the bind ids for exchanging state changes.

To avoid confusion Fore uses a simple syntax that is different from XPath. Remember - the
client does not know about XPath in any way and it's domain shouldn't be 
polluted with foreign semantics. 

The structure of a "binding path" is extremely simple:

```
[BINDID | BINDID:INDEX]
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


## Client sending updates

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



