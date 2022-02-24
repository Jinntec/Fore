## fx-fore

### Description

`fx-fore` element is the root element for all other Fore elements.

It provides a scope for the processing, starts the processsing and 
refreshes the user interface. 

It further provices global messaging via toast messages and a modal dialog. 

### Attributes

| Name | Description |
|------|-------------|
| refresh-on-view | experimental: marker attribute to only refresh the UI in the current viewport |
| src | relative Url pointing to Html file containing an `fx-fore` element. This will be extracted from document and replaces the current `fx-fore` element. |

### Events

| Name | Description |
|------|-------------|
| compute-exception | dispatched in case the dependency graph is cirular |
| refresh-done | dispatched after a refresh() run |
| ready | dispatched after Fore has fully been initialized |
| error | dispatches error when template expression fails to evaluate |


 
### Examples


All Demo files
