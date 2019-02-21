# Developer Guide


[tbd]


## Half-object pattern

In Fore the processing is devided into client and server parts. The server is responsible to execute
the model while the client (browser) deals with the rendering.

For maximum independence of the browser a flattened model of the server-side data will be passed to the
client for local mutation. Local changes are reported back to the server but can happen in a timely
decoupled way allowing offline use or long-term sessions with local storage of the data.

### Keeping the model on the server

The model of a form will not be passed to the browser. It will be swallowed when the user requests
a document.

Reasons for that are:

* Security: the policies of a form are in the model. Often it is undesirable to expose the exact criteria
used to validate as this may touch sensitive information. Furthermore the model reveals where data come 
from and go to. By hiding the model an attacker would have no information about these internal policies.
* The model uses sophisticated XPath and XQuery features to do its job. These cannot be made available
in browser which simply lack the respective technologies.
* Two-level validation: this is security again but also gives application much more stability by making
sure that data are always valid and consistent before they get submitted (processed further). The 
server-side validation will always 'have the last word' and there's no way to submit data bypassing
the model.





## Using the eXist-db XPath/XQuery engine 

The initial reason to develop something like Fore was to replace betterFORM (with its dependency on specific Saxon version). This at the same time offers
some interesting potential for a new solution. By using the eXist-db builtin XPath engine we can easily upgrade to 
future enhancements of XPath, use our own ways of supporting custom functions as well as allow full XQuery support in
various places (e.g. calculations and submissions). This certainly offers a whole new level of processing power.
