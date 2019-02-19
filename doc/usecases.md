# Use cases

There are forms and there are forms - a close look at what is needed avoids mis-orientation
about what is needed. 

That said it's worthwhile pointing out the differences.

## use case 1: simple data gathering

Simplest case of form processing is the use case where a few data are gathered for submission
to an endpoint. A large variety of applications just needs that and do not require a lot
of validation, datatyping or other fanciness. 

These type of forms can be done with plain HTML or by using e.g. <iron-form> from Polymer. You
can have simple validations like required, even simple typing etc. and be just fine. The effort
to implement such a form along with some simple validation on the server will not be much
different from using a dedicated form processing facility.

Ideally it should be easy to upgrade to Fore when things get more complicated as first perceived.

> amendment: my experiments with forms in Polymer have shown a bit different picture. Actually it can
> get quite complicated quickly. When using custom elements as form components you have to make sure they
> play by the rules by e.g. implementing a validate() function. Furthermore you have to take care of validation
> on the server which quickly gets messy in plain XQuery (Schematron might be better here). As a consequence it can be said that a generic form solution
> gets attractive even earlier. 

## use case 2: datatyping and cross-dependencies

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

## use case 3: XML editing

When it comes to edit even more complex XML documents you are usually confronted with the following requirements:

* typically you have to orchestrate a set of instances to construct your final data
* you have to juggle with several XML documents for i18n or other files you need to reference 
* you may want some control with regard to datatypes
* you may want to enforce some rules under which you consider your document valid after editing
* you need to chain submissions to allow complex manipulation of different sources at once

