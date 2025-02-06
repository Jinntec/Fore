📌 Usage Examples for DependencyTracker API
Now that DependencyTracker fully supports both UI control bindings and template expressions, let's walk through how to use it effectively.

📌 1. Initializing DependencyTracker
Since DependencyTracker is a singleton, you don't need to instantiate it manually.
Just call:

javascript
Kopieren
Bearbeiten
const dependencyTracker = DependencyTracker.getInstance();
📌 2. Registering a UI Control Binding
When an fx-control binds to an XPath, it should register itself:

javascript
Kopieren
Bearbeiten
const control = document.querySelector('#myControl'); // Assume it's a UI control element
dependencyTracker.register("instance('default')/user/name", control);
🔹 Effect: This ensures the UI control will be notified whenever the data at instance('default')/user/name changes.

📌 3. Registering a Template Expression
If an HTML element contains a {} template expression, register it:

javascript
Kopieren
Bearbeiten
const textNode = document.createTextNode("Hello, {username}!");
const expression = "instance('default')/user/name";
dependencyTracker.registerTemplateBinding(expression, textNode);
🔹 Effect: Whenever instance('default')/user/name changes, the text node automatically updates.

📌 4. Detecting and Registering Template Expressions Automatically
Instead of manually registering template expressions, scan an entire DOM subtree for them:

javascript
Kopieren
Bearbeiten
dependencyTracker.detectTemplateExpressions(document);
🔹 Effect: This finds all {} expressions in text nodes and registers them.

📌 Example:

html
Kopieren
Bearbeiten
<div>Hello, {username}!</div>
<span>Your age: {instance('default')/user/age}</span>
🔹 detectTemplateExpressions(document) will automatically register these elements.

📌 5. Notifying When Data Changes
Whenever a data change happens, notify the DependencyTracker:

javascript
Kopieren
Bearbeiten
dependencyTracker.notifyChange("instance('default')/user/name");
🔹 Effect:

UI controls bound to this XPath will refresh.
Any {} template expressions using this XPath will update.
📌 Example Scenario:

javascript
Kopieren
Bearbeiten
document.querySelector('#updateButton').addEventListener('click', () => {
dependencyTracker.notifyChange("instance('default')/user/name");
});
📌 6. Handling Insertions & Deletions
📌 Notify When a Node is Inserted
javascript
Kopieren
Bearbeiten
dependencyTracker.notifyInsert("instance('default')/tasks/task[3]");
🔹 Effect:

This tells the tracker that a new task at position [3] was inserted.
Any fx-repeat elements will update accordingly.
📌 Notify When a Node is Deleted
javascript
Kopieren
Bearbeiten
dependencyTracker.notifyDelete("instance('default')/tasks/task[2]");
🔹 Effect:

The UI will reflect the deletion of task[2].
fx-repeat components will update efficiently.
📌 Example Scenario:

javascript
Kopieren
Bearbeiten
document.querySelector('#deleteTask').addEventListener('click', () => {
dependencyTracker.notifyDelete("instance('default')/tasks/task[2]");
});
📌 7. Processing Updates
If multiple changes happen, batch update to prevent redundant refreshes:

javascript
Kopieren
Bearbeiten
dependencyTracker.processUpdates();
🔹 Effect:

Ensures all affected UI controls and template expressions refresh at once.
Prevents multiple unnecessary re-renders.
📌 Example Scenario:

javascript
Kopieren
Bearbeiten
dependencyTracker.notifyChange("instance('default')/user/name");
dependencyTracker.notifyInsert("instance('default')/tasks/task[3]");
dependencyTracker.notifyDelete("instance('default')/tasks/task[2]");

dependencyTracker.processUpdates(); // Apply all at once
📌 8. Getting Deleted & Inserted Indexes for fx-repeat
📌 Get Deleted Indexes
javascript
Kopieren
Bearbeiten
const deletedIndexes = dependencyTracker.getDeletedIndexes("instance('default')/tasks");
console.log(deletedIndexes); // [2]
🔹 Effect: Retrieves the list of deleted indexes for a repeat structure.

📌 Get Inserted Indexes
javascript
Kopieren
Bearbeiten
const insertedIndexes = dependencyTracker.getInsertedIndexes("instance('default')/tasks");
console.log(insertedIndexes); // [3]
🔹 Effect: Retrieves inserted node positions for fx-repeat.

📌 9. Handling Index Changes for Repeats
If an index is shifted due to insertion or deletion, update the tracker:

javascript
Kopieren
Bearbeiten
dependencyTracker.updateRepeatIndex("instance('default')/tasks/task[2]", 3);
🔹 Effect: Ensures that controls tracking task[2] correctly re-bind to task[3].

🛠 Example Workflow in an Application
🚀 Updating a UI When a User's Name Changes
1️⃣ Markup:
html
Kopieren
Bearbeiten
<p>Hello, {instance('default')/user/name}!</p>
<input type="text" id="nameInput">
<button id="updateButton">Update Name</button>
2️⃣ JavaScript Logic:
javascript
Kopieren
Bearbeiten
// Initialize the DependencyTracker
const dependencyTracker = DependencyTracker.getInstance();

// Detect all template expressions in the DOM
dependencyTracker.detectTemplateExpressions(document);

// Simulate a user updating their name
document.querySelector('#updateButton').addEventListener('click', () => {
dependencyTracker.notifyChange("instance('default')/user/name");
dependencyTracker.processUpdates();
});
🔹 Effect:

The text {instance('default')/user/name} updates instantly when the button is clicked.
🎯 Final Summary
Function	Purpose
DependencyTracker.getInstance()	Get the singleton instance
register(xpath, control)	Register an XPath-bound UI control
registerTemplateBinding(expression, node)	Register a {} template expression
detectTemplateExpressions(root)	Scan for template expressions and register them
notifyChange(xpath)	Notify when a value changes
notifyInsert(xpath)	Notify when a node is inserted
notifyDelete(xpath)	Notify when a node is deleted
updateRepeatIndex(xpath, newIndex)	Update an index due to shifts
getDeletedIndexes(ref)	Get deleted node positions
getInsertedIndexes(ref)	Get inserted node positions
processUpdates()	Apply all pending updates
🚀 Now, Your UI Will Update Automatically!
With this setup: ✔ Controls and template expressions auto-update when data changes
✔ Efficient processing prevents redundant updates
✔ Supports complex bindings, insertions, deletions, and indexing

🔥 Now your UI is fully reactive! 