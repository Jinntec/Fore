# Requirements

general:
* MUST provide server-side validation
* MUST be easy to author (declarative)
* SHOULD support offline editing
* MAY support server push

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

