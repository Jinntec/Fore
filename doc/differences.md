# Differences to XForms

XForms is the most powerful way to edit structured XML data. There's no other standard or even product that offers
comparable power.

However it is quite abstract and rigid in some places which either makes implementation and use harder than necessary.

As a consequence Fore will take freedom from the XForms specifications to provide ulitimate ease-of-use for users of
eXist-db while at the same time use all the facilities eXist-db brings to the table (namely XQuery 3.1 and direct access
to a powerful storage engine).

## What will change

Many years of experience with XForms project revealed some practical issues with 'pure XForms'. betterFORM as an implementation always tried to stick tightly with the specification and has gone through the sometimes painful consequences. To understand the decisions we now take for Fore some of these aspects need to be discussed.

### The XForms language

XForms is designed to be embedded within other XML languages. The embedding language is called the 'host language'. 
During more than 10 years of delivering XForms solutions we never had a single case where the host language was not
 HTML. Some users are distracted by the use of XML namespaces which is especially true for front-end developers that 
 nowadays usually deal with HTML5.

 > in Fore we will drop the use of namespaces and implement the markup in plain HTML

HTML5 introduced Custom Elements which will fit our needs perfectly. They allow to define our own extension elements that behave as first-class citizens in HTML.

Example:
`xf:model` becomes `fore-model`

As aforementioned we intend to take some freedom from the specs. We therefore use `fore-` as the prefix for our components instead of `xf-` to emphasize this fact. 

 > in Fore all XForms elements are translated to Custom Element syntax

### Binding language

XForms defines XPath 2 as the binding language. As eXist-db already provides XQuery 3.1 - which is a superset of XPath 2.0 -  we want to make use of this for maximum convenience.

 > in Fore XPath 2.0 will be replaced with XQuery 3.1
 
### The instance() function

XForms uses the `instance()` function to access the different instance data in a form. 

 > in Fore we'll use a map called `$instances` to access a specific instance e.g. `$instance?default` to access an 
 instance with id `default`.
 
### The action syntax

A non-change here but worth mentioning.

XForms defines a set of elements representing actions. Though they are imperative by nature Fore will continue to use
these actions but translated to our naming scheme. 

Allowing arbitrary inline XQuery code would open the door for issues and challenge the robustness of the processing model.
Therefore we decided to stay with a defined set of actions that are allowed in the respective places.

 > in Fore actions will still notated as elements.

### XML Events

XForms defines a set of XML events to be dispatched in certain situations or by user interaction. This is powerful eventing
mechanism that allows capture and bubble, cancelling events and the like. As we try to implement as much as possible in 
XQuery we'll have to drop events altogether as they are not present in the XQuery language.

The power of XML Events also in some cases turned out to rather cause problems than actually ease authoring. Due to the 
rather complex capture, at-target, bubble, default phases of an XML Event forms becomes much harder to understand and
maintain. Often when such complexity is introduced it is more a symptom of an overly complex design that should be 
simplified. 

Of course the purpose of these events needs to be kept and Fore will just trigger defined 'hooks' to mimik those.

E.g. instead of dispatching an `xforms-submit-done` we'll directly execute the corresponding `<fore-submit-done>` element.

 > Fore will not use events but 'hooks' to react to certain conditions.