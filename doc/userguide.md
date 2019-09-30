*** todo: needs update ***

# User Guide

* author: joern turner
* date: 27. Sept. 2019 
* applies to: Fore 1.0


## Birds-eye view

Fore (like XForms) is a model-driven form processing facility especially
for eXist-db. It's important to note that it's not a pure client-side approach
to form handling but follows the half-object pattern where processing is
distributed between client and server. 

The most important rationale behind this is security - form processing should
never just rely on client-side validation as the data could be compromised in transition
or even directly within the browser. For a stable solution we therefore need a server-side
validation that ultimately asserts the correctness of data to be submitted.

The primary goal of Fore is certainly to allow easier and safe editing of XML
data which are stored within eXist-db though other formats like JSON or CSV might
be supported also. 

The premier choice to address XML nodes is XPath which is used in Fore to 
attach constraints to nodes, execute calculations and handle the details
of submissions.
 
Fore will deliver XForms-like capabilities by processing the model on the server which will in turn pass on
the results to the client in a defined [JSON format](json.md). The client may then operate on this structure and eventually
pass changes back to update the model on server. (See [client-server exchange format](client-server-exchange.md).) 

The server-side validation will finally decide if given data can be submitted or not.

Advantages of this architecture:

* strong separation between model and UI
* the policies a model defines (its bindings) is not exposed to the client
* a client might still operate decoupled from the server 
* 2 level validation either on client and on server
* datatype support  

## Syntax - XML versus HTML

XForms is a namespaced XML language that is meant to be embedded into other XML languages.
In contrast to XForms Fore considers HTML as it's natural habitat and is part of it. Many years
of experience showed that we never needed something else than HTML as a host language.

Fore uses [HTML Custom Elements](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements)
 syntax. That means that all element names must have a `-` character in their name.
 
Whereever possible Fore will use the equivalent XForms name but there might be differences in detail e.g.
a prefixed `xf:model` will become `xf-model` in Fore.

People with an XML background must keep in mind that in HTML and Custom Elements there is no such
thing as an empty element (ending in `/>'). However Fore pages must be well-formed markup.

 > Remember to always write closing tags even if your element has no content e.g. `<my-element></my-element>` 
 instead of `<my-element/>`.

## An example

The model is a required part of a form. It constitutes the data (`<xf-instance>` elements),
their bindings and one or more `<xf-submission>` elements which will be explained
in this section.


The following example is taken from the original XForms specification but adapted to Fore syntax.

The model is designed for a purpose and defines the policies under which a given set of data
is considered valid. 

The following example model shows a very simple payment form.

```
<xf-model>
  <xf-instance>
    <ecommerce>
      <method/>
      <number/>
      <expiry/>
    </ecommerce>
  </xf-instance>
  <xf-submission action="module/handleSubmit()" method="post" id="submit"></xf-submission>
  <xf-bind id="method" ref="method"></xf-bind>
  <xf-bind id="number" ref="number"></xf-bind>
  <xf-bind id="expiry" ref="expiry"></xf-bind>
  
</xf-model>

```

This model collects some values for 'method', 'number' and 'expiry' and allows to submit them to a URL denoted by the
`action` attribute. However it does not constrain the data yet in any way meaning that this
form would always be valid when it comes to submission.

### xf-instance

In this example the instance data are:
```
    <ecommerce>
      <method/>
      <number/>
      <expiry/>
    </ecommerce>
```
The instance data is where we gather input data from users. It may be any structure
provided there's a root node.

| Note: an instance is considered it's own entity. Its evaluation context is
 the root node. Thus XPath expressions do not need to contain the rootnode. E.g. the above
bind uses 'ref="method"' instead of 'ecommerce/method'. 

If there are several instances all but the first will need an Id attribute to address them.

To address a certain instance (e.g. in a bind attribute) in Fore you use:

```
$instances?myInstance
```

An anonymous instance (if you have just one) will get the id 'default' assigned and
be accessible by `$instances?default`.

### xf-bind

Binds are where the magic happens. They allow us to apply a fine-grained 'contract' to
the instance data we've loaded. 

In our example all three fields (method, number and expiry) are needed to proceed with
credit card payment. We can't go on without them so let's enhance our bindings accordingly:

```
  <xf-bind id="method" ref="method" required="true()"></xf-bind>
  <xf-bind id="number" ref="number" required="true()"></xf-bind>
  <xf-bind id="expiry" ref="expiry" required="true()"></xf-bind>
```

By adding 'required="true()"' we added a constraint to each of the fields to be fulfilled before we can submit
the data. The expression given in 'required' is interpreted as an XPath which returns a 
Boolean value. 

'required' is just one of the facets we can attach to a bound instance data node. In XForms 
these facets are called 'Model Item Properties'.

#### further constraints

To show several facets at work consider this enhancement of the example:

```
<xf-bind id="method" ref="method" required="true()"></xf-bind>
<xf-bind id="number" ref="number" 
                       relevant="../method = 'cc'" 
                       required="true()" 
                       type="my:ccnumber"><xf-bind>
<xf-bind id="expiry" ref="expiry"
                       relevant="../method = 'cc'
                       required="true()"
                       type="xs:gYearMonth"></xf-bind>
                       
                      
```

If we add these bindings the we can make sure that 'number' and 'expiry' have
correct datatype if the method happens to be 'cc'. The `relevant` property will switch 
validation on or off for that item. If relevant becomes false for a bound node the required facet
will have no effect. Relevance will be described in more detail in the remainder of this
document.

### xf-submission

A valid instance for submission would look like this:
```
<payment>
   <amount>99.00</amount>
   <method>cc</method>
   <number>1235467789012345</number>
   <expiry>2025-12</expiry>
</payment>
```
All constraints were fulfilled and the data can be send along to the location specified
by the submission element.




## Document structure

A form in Fore is represented by a set of elements that follow the [HTML Custom Elements](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements)
 specification. That essentially means that they have a '-' character in their name and thereby become part of the documents' DOM.
 
The element names will map to the respective elements in the [XForms specification](https://www.w3.org/TR/xforms20/)
whereever applicable. Differences to the XForms specification are listed and discussed in [Differences to XForms](differences.md).


Fore defines the following model elements:

Fore element | XForms equivalent 
-------------|------------------- 
xf-model | model 
xf-instance | instance 
xf-bind | bind 
xf-submission | submission

 > XForms defines some more that will be implemented step-by-step in Fore as the need arises. 

`xf-model` is the outermost element containing the others.

### The model

The model is the heart of a form. It holds an arbitrary amount of `xf-instance`, `xf-bind` and `xf-submission` 
elements each of which are described in more detail below.

Together those elements make up the 'contract' of a form. The contract defines under which conditions data are considered 
valid for submission and how they are submitted. Actions that might be triggered within the model itself or by user
interaction provide the dynamics to support data editing workflows and a user-friendly behavior. 

The model can be used standalone for server-side validation or in combination with a UI.

#### model on duty

In XForms land the model establishes a kind of box which is the container for data and logic involved with a 
specific purpose. 

It's responsibilities are:

* loading instance data
* establishing an evaluation context
* evaluating the bind elements to determine the state of the bind properties (called Model Item Properties or MIP in XForms)
* calling defined event-handlers to signal readiness of model (xforms-ready event)
* triggering actions  

This is a shortened version of the reality in XForms but might be sufficient to get the picture.

 > IMPORTANT FACT: the model also establishes an execution context. As Fore is imminent to eXist-db our
 execution context is the database itself and we're using the XMLDB API to directly access data. In XForms this 
 context would usually default to 'http'. So, if not protocol is given Fore will default to XMLDB:

### xf-instance

A `xf-instance` represents a piece of XML with a single root node. It is an error attempting to load
a nodeset as an instance.  

A model might have as many instances as necessary. Each except the first in document order needs to have an id
to address it.

Example:
```
<xf-instance id="myInstance">
    <data>
        <foo/>
    </data>
</xf-instance>
```

To address a certain instance in Fore you use:

```
$instances?myInstance
```

An anonymous instance (if you have just one) will get the id 'default' assigned and
be accessible by `$instances?default`.

`$instances` is an internal map that is created by the model at init time. 

#### inline instance data

The simplest way to load instance data is to put them inline. 

Example:
```
<xf-model>
    <xf-instance>
        <data>
            <hello>World</hello>
        </data>
    </xf-instance>
</xf-model>
```

At init-time the Fore processor will create an appropriate entry in its `$instances` map. A `xf-instance` without
an explicit `id` will get the id 'default' assigned.


#### loading via `src` attribute

When data shall be loaded from an external source the `src` attribute can be used.

Example:
```
<xf-instance src="doc('data/mydata.xml')"></xf-instance>

```

As no URL scheme is given (such as e.g. 'http:') it will default to 'xmldb:' in Fore and be evaluated relative
to the location of the form. Here the form directory would need to have a 'data' subdir with a resource `mydata.xml`.

#### dynamic resolution of instances

To dynamically resolve a `src` attribute you can put your expression within curly brackets like so:

```
<xf-instance src="{$contextParams?param1}"></xf-instance>
``` 

 > `$contextParams` is a pre-defined map that will be passed into the model
 during initialization. It contains a set of standard environment variables such as URL, it's params, headers etc.
  and may also be used to pass in arbitrary application-specific parameters.


 > IMPORTANT: any expression not starting with `$contextParams` will fail to resolve. This is to prevent accessing
 nodes of other instance before they are actually defined. When the instance data resolution depends on values in other
 instances a `xf-submission` can be used.  
 
### JSON instances

A `xf-instance` can also contain some JSON data like this:

```
    <xf-instance>
        {
            "salary":210.00,
            "average"120.00
        }
    </xf-instance>
```  

As with XML instances of course you can also use `src` attribute to load JSON from
somwhere:
```
<xf-instance src=="{constructJSON()}"></xf-instance>
```
When binding you have to use the map notation instead of XPath in your `xf-bind` 
elements.

```
<xf-bind ref="?salary" ...></xf-bind>
```

todo: not sure about the correct syntax yet. Can you help @wolfgang @juri?

### xf-bind

The bindings are the power source of XForms. They allow to attach constraints to nodes, calculate and filter nodes and alert 
users in detail about validation issues. Arbitrary complex validation logic can be used to make sure that incoming
data play by the rules. The dense descriptive format greatly helps maintainance of that logic.

XForms defines the so-called 'Model Item Properties' or MIPs for short. You can imagine those
as facets being applied to a referenced node. 

#### attaching MIPs to nodes

To bind MIPs to a Node you use the `ref` attribute. Its value is typically a XPath 
locationpath expression that refers to one or more XML Nodes.

 > Fore will also support the use of JSON instances. The syntax for referring to JSON 
 data is still to be defined.
 
This or those nodes also set the evaluation context
 
#### Available Properties  

Name | Purpose | default
----- | ------ | -------
calculate | XPath/XQuery expression to calculate the value of a node 
readonly | Boolean XPath/XQuery expression determining whether a node is readonly or readwrite | false
required | Boolean XPath/XQuery expression determining whether a node is required or optional | false
relevant | Boolean XPath/XQuery expression determining whether a node is relevant or non-relevant | true
type | any XSD SimpleType | `xs:string`
constraint | Boolean XPath/XQuery expression determing whether a node is valid or invalid | true

Bind properties can be expressed either as attributes or elements like this:
```
<xf-bind id="method" ref="method" required="true()"></xf-bind>
```

or equivalently as element:

```
<xf-bind id="method" ref="method">
    <xf-required expr="true()"></xf-required>
</xf-bind>
```

The latter syntax then allows to attach a dedicated alert in case the user tries to 
submit the incomplete form.

```
<xf-bind id="method" ref="method">
    <xf-required expr="true()">
        <xf-alert>Please select a payment method</xf-alert>
    </xf-required>
</xf-bind>

```

This syntax is also applicable to `calculate`, `readonly`, `relevant` and `constraint` properties.

### Actions

There is a pre-defined set of actions in XForms that cover all basic
procedures.

Here's a subset of the list which will be considered by Fore:

name | purpose
----- | -----
action | a block of actions optionally identified by an id
setvalue | set the value of a bound node
insert | insert a Node or Nodeset into a given position
delete | delete a Node or Nodeset
trigger(1) | call a certain action block imperatively
recalculate | trigger a recalculate
revalidate | trigger revalidation
reset | reset all instances to their original state after loading
load | loads a resource
unload | unloads a resource previously loaded with `load`
submit(2) | trigger the referenced or default submission
message | show a message to the user 

(1) Fore does not support events. In original XForms this action is called
`dispatch`. Due to the common association with events it seems therefore
better to rename this action to `trigger`.

(2) In XForms the action is called 'send'. As `submit` feels more familiar
in the HTML world we've renamed it. 

 > why use a set of elements instead of an API for a imperative task? One
 argument to stay with the elements in Fore is to limit the actual allowed
 procedures. It would be all too easy to compromise the original purpose of
 a form or introduce great confusion by allowing full access to the XQuery
 context.
 
  

### xf-submission

Submissions serve different purposes at once:

* select the (subset of) data to be submitted either by selecting a subtree
and/or by applying relevance filtering (more on that later)
* validate before sending data along
* either replace the current data with response, end the current session or ignore
response
* trigger pre- and post hooks to react on the outcome of a submission
* might support arbitrary protocols for submission like e.g. 'xmldb:', 'http:', 'file:' etc. etc.
* can be used for loading data in highly dynamic applications

Consider this example to get an idea of the power of submissions:

```
    <xf-instance>
        <data>...some XML payload here ...</data>
    </xf-instance>
    
    <xf-instance id="conf">
        <data>
            <targeturl>my-instance</targeturl>
            <counter>1</counter>
        </data>
    </xf-instance>
    
    <xf-submission id="s-save"
                     resource="xmldb:doc({$instances?conf/targeturl}-{$instances?conf/count}.xml)"
                     method="put"
                     replace="none">
        <xf-submit>
            <xf-message level="info">Sending your data... Please hold on</xf-message>
        </xf-submit>
        <xf-submit-error>
            <xf-message level="error">storing record failed</xf-message>
        </xf-submit-error>
        <xf-submit-done>
            <xf-message level="info">Your data have been stored</xf-message>
            <!-- increment counter -->
            <xf-setvalue ref="$instances?conf/counter" value=". +1"><xf-setvalue>
        </xf-submit-done>
    </xf-submission>

```

The submission is usually triggered by an user action (hitting a button)
e.g. somewhere in your UI you have:

```
<xf-submit submission="s-save">Save</xf-submit>

```

This will send a request to the server to submit the form by executing the 
referenced `xf-submission` element. 

Submission will execute these steps:
1. pre-submission is triggered by executing `xf-submit` element
1. select the relevant data for submission. In the above example there is no
explicit `ref` attribute. Therefore the default instance (first in document order)
is used.
1. execute `recalculate` and `revalidate` to verify state
1. continue processing depending on validation state

Data are valid:
1. if data are valid the `resource` attribute is evaluated to determine
the target URL for the submission.
1. data are serialized and sent with the protocol given by `resource` 
('xmldb:' by default)
1. post submission hook `xf-submit-done` is triggered. In our example this
signals to the client to show an informal message and to increment the value
of the counter in the 'conf' instance to generate a new one for the next save.

Data are invalid:
1. the `xf-submit-error` hook is triggered which returns a message to
the client with the request to show an error message.

#### Chaining submissions

Chaining submissions is a powerful tool. It allows to submit several instances
from a form instead of just one. Furthermore you can react on the outcome
of one submission before firing the next. 


Example:
```
<xf-submission id="register" resource="data/myregistration.xml">
    <xf-submit-error>
        <xf-message level="error">user name is already taken</xf-message>
    </xf-submit-error>
    <xf-submit-done>
        <xf-submit id="confirm-account"
    </xf-submit-done>
<xf-submission>

<xf-submission id="confirm-account"
                 resource="mailto:{user}"
                 ref="account">
</xf-submission>
```

In this example the submision 'confirm-account' is only called in case the
'register' submission was sucessful.


## UI Components

Unlike XForms in Fore we use either native HTML controls or special Fore controls that are implemented as Web
Components. The latter offer more fine-grained control of the usability. In Fore the developer decides about the
specific control upfront - there's no mapping from an abstract control to a platform-specific.

In this case we use a HTML select control but of course could have choosen radio buttons for the same purpose.

```
<label for="methodCtrl">Payment Method</label>
<select bind="method" id="methodCtrl">
  <option value="cash">Cash</option>
  <option value="cc">Credit</option>
</select>

<label for="numberCtrl">Credit Card Number</label>
<input id="numberCtrl" bind="number">

<label for "expiryCtrl">Expiration Date</label>
<input id="expiryCtrl" bind="expiry">

<button type="submit" data-submission="submit">Submit</submit>

```

The controls are bound to the model by the XForms binding mechanism with the `bind` attribute. The value of a `bind`
is an idref to a `xf-bind` element in the model.

 > Why is there no support for the XForms `ref` attribute in the UI? In XForms you can use `ref` attribute as a second way to bind to the 
 model. Refs use XPath statements to link to an instance node. However in Fore we want to keep XPath out of the UI
 as its kind of a foreigner in HTML. Fore is also designed with security in mind - a `ref` already reveals quite some
 detail about the structure of our data which we probably don't want to expose. By using `bind` instead we can strongly
 separate the model from the UI.
 
Some things worth pointing out:

* we're using native HTML controls in the example above. This approach might be limited
for more advanced use cases where you want more specific behavior than these controls allow.
* alternatively we could have used one of the 'xf-*' controls that knows about the specifics
of binding themselves and will provide automatic update in a more sophisticated way.


## xf-input
## xf-textarea
## xf-checkbox

### UI container

### xf-group
### xf-repeat
### xf-switch


## Using protocols for loading and submission

## The `relevant` property and its effects

## Server-side validation

Beyond building complete forms with UI Fore can also be used just for validation
purposes.

To do this you have to import the Fore module into your XQuery with:

```
import module namespace modelValidator="http://exist-db.org/apps/fore" at "fore.xqm";
```

