# eXForm - forms for eXist-db

## what's here

This repository serves the development of a new form framework for eXist-db. The actual code is in Java
but the discussion of form markup, milestones and technical details will take place in this repo and its issue tracker.


## Motivation

The motivation to implement a new form framework mostly comes from the need to find a long-term replacement
for betterFORM. Due to betterFORM being dependent on a specific Saxon version it has become a burden
for maintainance in eXist-db which likes to moves on to newer Saxon versions. Porting the relevant code portions
from one Saxon version to the other is always a huge effort which we want to get rid of.

The idea is to use eXist-db's internal XPath engine to replace Saxon.

## Defining the goal

A first rough goal definition could be like this:

Take the best of XForms and betterFORM and port it to eXist-db while keeping it future-proof and extensible.

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

### type 2: datatyping and cross-dependencies

While plain HTML can provide simple datatyping it has no facility to handle advanced validation.

By advanced typing here the use of XSD datatypes including custom sub-types is meant. Furthermore there's no facility
to define cross-validation that involves more than the value a control is holding.

While still possible to implement most of this by-hand for a given use case these type of forms will already
profit from a forms framework.

### type 3: XML editing

When it comes to edit even more complex XML documents you are usually confronted with the following requirements:

* you have to juggle with several XML documents for i18n or other files you need to reference 
* you may want some control with regard to datatypes
* you may want to enforce some rules under which you consider your document valid after editing


## Migration path

As migrating the whole of XForms model to use the native facilities of eXist-db is a huge effort when considering the
the whole existing functionality we need a migration path that develops from the simple to the more complex cases.


... to be continued ...


## porting the XForms model to eXist-db

XForms is a MVC architecture and its power is mainly within the model. This is the part we'd like to be available
when we need stronger capabilities in XML editing. 

XForms also defined a set of UI controls which abstract from the concrete platform. While this is a nice idea
it also tends to complicate thing a lot for the developer. The additional abstraction always forcing thinking 'around the edge'.

In practice we do not have much use for supporting other output than HTML. Therefore a eXist-db form framework
should not deal with porting the original UI controls. Instead we would build upon HTML5 and especially Web Components
to represent the UI part of the forms and bind to XML nodes via <bind> elements. 

## exchanging nodes between client and server

 


