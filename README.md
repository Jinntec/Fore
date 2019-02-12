# eXForm - forms for eXist-db

## what's here

This repository serves the development of a new form framework for eXist-db. The actual code is in Java
but the discussion of form markup, milestones and technical details will take place in this repo and its issue tracker.


## Motivation

The motivation to implement a new form framework mostly comes from the need to find a long-term replacement
for betterFORM / XForms. Due to betterFORM being dependent on a specific Saxon version it has become a burden
for maintainence in eXist-db which likes to moves on to newer Saxon versions. Porting the relevant code portions
from one Saxon version to the other is always a huge effort which we want to get rid of.

The idea is to use eXist-db's internal XPath engine to replace Saxon.

## Use cases

There are forms and there are forms - a close look at what is needed avoids mis-orientation
about what is needed. 

That said it's worthwhile pointing out the differences.

### type 1: simple data gathering

Simplest case of form processing is the use case where a few data are gathered for submission
to an endpoint. A large variety of applications just needs that and do not require a lot
of validation, datatyping or other fanciness. 

These type of forms can be done with plain HTML or by using e.g. <iron-form> from Polymer. You
can have simple validations like required, even simple typing etc. and be just fine. The effort
to implement such a form along with some simple validation on the server will not be much
different from using a dedicated form processing facility.

Ideally it should be easy to upgrade to 'exform' when things get more complicated as first perceived.

> amendment: my experiments with forms in Polymer have shown a bit different picture. Actually it can
> get quite complicated quickly. When using custom elements as form components you have to make sure they
> play by the rules by e.g. implementing a validate() function. Furthermore you have to take care of validation
> on the server which quickly gets messy in plain XQuery (Schematron might be better here). As a consequence it can be said that a generic form solution
> gets attractive even earlier. 

### type 2: datatyping and cross-dependencies

While plain HTML can provide simple datatyping it has no facility to handle advanced validation nor can it replace
a server-side validation.

XForms offers:
* datatype support (XSD simple types and extensions of those)
* boolean `readonly` XPath expression
* boolean `required` XPath expression
* boolean `constraint` XPath expression
* boolean `relevant` XPath expression
 
`constraint` expressions are the most powerful ones by allowing to validate cross-dependencies between nodes

While still possible to implement most of this by-hand for a given use case these type of forms will already
profit from a forms framework.

### type 3: XML editing

When it comes to edit even more complex XML documents you are usually confronted with the following requirements:

* you have to juggle with several XML documents for i18n or other files you need to reference 
* you may want some control with regard to datatypes
* you may want to enforce some rules under which you consider your document valid after editing
* you need to chain submissions to allow complex manipulation of different sources at once


## exforms - what should it look like?

### birds' eye view

While re-implementing a full XForms implementation is neither sensible nor can be done within a reasonable timeframe and
budget, a broken-down version makes a lot of sense. Some aspects of XForms can be dropped or replaced without much overall
functional loss. During our meetup on 29th/30th Jan 2019 we decided to go for a new forms solution. However we also agreed to use a migration
path to the full solution by breaking the project in pieces.

The new approach to XForms is meant to be extremely pragmatic - we'll certainly take freedom in syntax while keeping the good
ideas. We'd like to start with a XQuery-driven approach that gives us the XForms model abilities to validate and 'route' data
along with a fine-grained error messaging. 

Second step would be implementation of the UI part as Web Components. Though data-binding the UI should be possible even for
plain HTML controls the use of Web Components would certainly offer a whole lot more power. 


## Requirements

general:
* MUST provide server-side validation
* SHOULD support offline editing
* SHALL support server push
* MUST be easy to author (declarative)

for instances:
* MUST provide an implementation of an XForms instance
* MUST support multiple instances (XML documents)
* SHOULD support JSON 
* MAY support CSV

for binds:
* MUST provide an implementation of an XForms bind
* MUST allow binding XML via XPath 2.x or up
* MUST allow for data-typing
* SHOULD allow full XSD datatpyes
* SHOULD support custom XSD types
* SHOULD allow definition of dependencies between data nodes
* MUST support alerts

for submissions:

* MUST provide an implementation of an XForms submission
* SHOULD use XML:DB API to access data
* SHOULD support submission chaining
* SHALL support http submissions
* MAY support other protocols


## Architecture (draft)

The following graphic shows the main building blocks 'model', 'UI' and 'actions'. These modules together make up
the MVC architecture of XForms.

![MVC architecture](doc/exform1.png)

The model represents the data and it's constraints. The UI binds to the model via the <bind> elements. Actions can be
fired by the UI or the model to change the state of the model which in turn will trigger the UI to update itself.


### distributing the parts

Server-side form processing has proved to be very stable and powerful in the past with betterFORM. It allows 
to validate the data on the server to assure the quality of the data and enforce the rules given by a form. It 
furthermore allows to keep business logic on the server not exposing it to the client.

That means that the model will be processed on the server which always has the last word when it comes to validation and submissions.
The client however will be implemented as Web Components that reflect the state of nodes in the browser.

### client- and server model 

The primary goal of the new forms solution is to edit XML data. However browser do not well with XML
natively. Furthermore JSON has made the race in the client-side world and the use of XML and XPath
has always had a nice-existence at best. This is not going to change.

XPath (and XQuery) are the powertools of XML but they are not (really) present in the browser. To circumvent
these problems and give each side what it deserves we need to introduce some mapping.

On the server we deal with data instances which each represent their own documents. On the client we'd like to 
consume some JSON data to render and update our UI. A plain XML to JSON conversion is possible but still leaves
us with the problem of resolving path expressions and map those from XPath to e.g. JSONPath. This involves some
complexity and potential for errors. 

A simpler mechanism would be to use the `bind` elements as intermediates:

a `bind` references one or more nodes by an XPath expression and on the other
hand allow a UI control to bind to it via id. 

e.g. 
```
<bind id="foo" ref="//aNode">

...

<input bind="foo">
```

Besides the value the bind also has access to the different facets of validation, error-messages etc.
By serializing the state of a bind we can feed the UI with the necessary bits. 

A JSON representation of a bind would look like this:
```
{
    "bind":"salary",
    "readonly":false,
    "required":true,
    "value":110,
    "datatype":"xs:string",
    "valid":true,
    "relevant":true
}
```




### mapping nodes between client and server

One of the central problems with a client-server form solution is the mapping of nodes. Every node in every instance
must have an identity that can be passed to the client for rendering the UI. When the nodes' value is changed by
some user interaction (editing a control) the identity is used to send update the server-side value.

In betterFORM this update mechanism relied on generated ids on the UI controls which very send back and forth to reflect
the state changes. While working this turned out to be a rather complex. When dropping the server-side UI this option
is gone and must be replaced. 

[discussion] Within eXist-db we can use the internal node id or the node number of eXist-db to get an identifier. 
However it must be further investigated how that can work for insertions and deletions of nodes which will trigger
a change of node ids for a given document. 

### using eXist-db XPath and XQuery engine 

The initial reason to develop something like exforms was to replace betterFORM (with its dependency on specific Saxon version). This at the same time offers
some interesting potential for a new solution. By using the eXist-db builtin XPath engine we can easily upgrade to 
future enhancements of XPath, use our own ways of supporting custom functions as well as allow full XQuery support in
various places (e.g. calculations and submissions). This certainly offers a whole new level of processing power.

### communication layer

[tbd]

Websockets, Service Workers and AJAX comes to mind. Not sure, if websockets are really much beneficial here as their
main selling point is pushing to *multiple* clients. It actually seems not to be made for one-to-one communication though 
it can be enforced.

Service Workers might play a role in pre-loading resources and maybe even data instances. However they are not for updating i guess.
In conjunction with AJAX this however should be fine. 



