## fx-submission

### Description

Send and receive data.


### Attributes
| Name | Description | Default |
|------|-------------| -------- |
| ***id*** | id of submission for referral |  |
| ***ref*** | XPath reference pointing to the bound node |  |
| instance | id of instance when `replace='instance'` |  |
| into | XPath expr where to insert response nodes into |  |
| method | http methods GET, POST, PUT, DELETE, url-encoded-post | GET  |
| nonrelevant | handling of non relevant nodes during serialization. Can be one of 'keep', 'empty' or 'remove' | remove  |
| replace | one of 'all', 'instance', 'target', 'redirect' or 'none' | all  |
|  | 'all' - response replaces the viewport |   |
|  | 'instance' - response replaces the instance given by the `instance` attribute or if not present the default instance |   |
|  | 'target' - response will be attached to element identified by `target`| |
|  | 'redirect' - use response as redirect url. | |
|  | 'none' - response will be ignored. | |
| serialization | 'none' or 'xml' at this point | xml |

### Events
| Name | Description | 
|------|-------------| 
| submit | dispatch before submission takes place |
| submit-error | dispatched if the request returned an error |
| submit-done | dispatched when submission was successfully completed |


### Examples

* [auth](../demo/auth.html)
* [submission relevance](../demo/submission-relevance.html)
* [submission serialization](../demo/submission-serialize.html)
* [submission serialization](../demo/submission-serialize.html)
* [submission demo](../demo/submission1.html)
* [submission demo2](../demo/submission2.html)
* [submission chaining](../demo/submission3.html)
* [submission chaining](../demo/submission4.html)
* [submission with targetref](../demo/targetref.html)
