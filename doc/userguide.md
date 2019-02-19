# User Guide

* author: joern turner
* date: Feb. 2019 
* applies to: Fore 1.0

## Birds-eye view

Fore (like XForms) is a model-driven form processing facility especially
for eXist-db. It's important to note that it's not a pure client-side approach
to form handling but follows the half-object pattern where processing is
distributed between client and server. 

The most important rationale behind this is security - form processing should
never just rely on client-side validation as the data could be compromised in transition
or even directly within the browser. For a stable solution we therefore need a server-side
validation that should ultimately assert the correctness of data to be submitted.

Furthermore the heavy lifting of XPath execution cannot be done within
the browser as these simply lack a XPath 2 (not to speak of XQuery) implementation.

However it's a definitive goal of Fore to support offline capabilities. 

Fore will deliver XForms-like capabilities by processing the model on the server which will in turn pass on
the results to the client in a defined JSON format. The client may then operate on this structure and eventually
pass it back to update the model on server. 

The server-side validation will finally decide if given data can be submitted or not.

Advantages of this architecture:

* strong separation between model and UI
* the policies a model defines (its bindings) it not exposed to the client
* a client might still operate decoupled from the server 
* 2 level validation either on client and on server  

## An Example

This example is taken from the original XForms specification but adapted to Fore syntax to allow easy comparison.

The model defines WHAT the form does. The UI binding this model implements the visual representation of the form.

The following example model shows a very simple payment form.

```
<fore-model>
  <fore-instance>
    <ecommerce>
      <method/>
      <number/>
      <expiry/>
    </ecommerce>
  </fore-instance>
  <fore-submission action="module/handleSubmit()" method="post" id="submit"></fore-submission>
  <fore-bind id="method" ref="method"></fore-bind>
  <fore-bind id="number" ref="number"></fore-bind>
  <fore-bind id="expiry" ref="expiry"></fore-bind>
  
</fore-model>

```

This model collects some values for 'method', 'number' and 'expiry' and allows to submit them to a URL denoted by the
`action` attribute. 

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
is an idref to a `fore-bind` element in the model.

 > Why is there no support for the XForms `ref` attribute? In XForms you can use `ref` attribute as a second way to bind to the 
 model. Refs use XPath statements to link to an instance node. However in Fore we want to keep XPath out of the UI
 as its kind of a foreigner in HTML. Fore is also designed with security in mind - a `ref` already reveals quite some
 detail about the structure of our data which we probably don't want to expose. By using `bind` instead we can strongly
 separate the model from the UI.
 
Some things worth pointing out:

* we're using native HTML controls in the example above. This approach might be limited
for more advanced use cases where you want more specific behavior than these controls allow.
* alternatively we could have used one of the 'fore-*' controls that knows about the specifics
of binding themselves and will provide automatic update in a more sophisticated way.

### submitting data

If the user triggers the submit the instance would be send as follows:

```
<ecommerce>
  <method>cc</method>
  <number>1235467789012345</number>
  <expiry>2001-08</expiry>
</ecommerce>
```

### constraining values

To make sure the incoming data are correct we can use bindings to set constraints.

```
<fore-bind id="method" ref="method" required="true()"></fore-bind>
<fore-bind id="number" ref="number" 
                       relevant="../method = 'cc'" 
                       required="true()" 
                       type="my:ccnumber"><fore-bind>
<fore-bind id="expiry" ref="expiry"
                       relevant="../method = 'cc'
                       required="true()"
                       type="xs:gYearMonth"></fore-bind>
                       
                      
```

If we add these bindings the we can make sure that 'number' and 'expiry' are
correct if the method happens to be 'cc'. The `relevant` property will switch 
validation on or off for that item. If relevant becomes false the required property
will have no effect. Relevance will be described in more detail in the remainder of this
document.


## Document structure

A form in Fore is represented by a set of elements that follow the [HTML Custom Elements](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements)
 specification. That essentially means that they have a '-' character in their name and thereby become part of the documents' DOM.
 
The element names will map to the respective elements in the [XForms specification](https://www.w3.org/TR/xforms20/)
whereever applicable. Differences to the XForms specification are listed and discussed in [Differences to XForms](differences.md).


Fore defines the following model elements:

Fore element | XForms equivalent 
-------------|------------------- 
fore-model | model 
fore-instance | instance 
fore-bind | bind 
fore-submission | submission

 > XForms defines some more that will be implemented step-by-step in Fore as the need arises. 

`fore-model` is the outermost element containing the others.

## The model

The model is the heart of a form. It holds an arbitrary amount of `fore-instance`, `fore-bind` and `fore-submission' 
elements each of which are described in more detail below.

Together those elements make up the 'contract' of a form. The contract defines under which conditions data are considered 
valid for submission and how they are submitted. Actions that might be triggered within the model itself or by user
interaction provide the dynamics to support data editing workflows and a user-friendly behavior. 

The model can be used standalone for server-side validation or in combination with a UI.

### model on duty

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

## fore-instance

A `fore-instance` represents a piece of XML with a single root node. It is an error attempting to load
a nodeset as an instance.  

A model might have as many instances as necessary. Each except the first in document order needs to have an id
to address it.

Example:
```
<fore-instance id="myInstance">
    <data>
        <foo/>
    </data>
</fore-instance>
```

To address a certain instance in Fore you use:

```
$instances?myInstance
```

`$instances` is an internal map that is created by the model at init time. 

### inline instance data

The simplest way to load instance data is to put them inline. 

Example:
```
<fore-instance>
    <data>
        <hello>World</hello>
    </data>
</fore-instance>
```

### loading via `src` attribute




### fore-bind

### fore-submission



## Server-side validation

## Binding the UI

## Using protocols for loading and submission

## The `relevant` property and its effects