         # ✅ JSON Support in Fore — Task List

## ✅ Already Done

- [x] `JSONNode` and `wrapJson()` implemented for JSON data wrapping
- [x] `JSONLens` class with `get`, `set`, `delete`, `insert`, `pathString`
- [x] `getPath()` supports JSON paths with instance IDs (`$myid/foo/bar`)
- [x] `fx-instance` wraps JSON data on load and on full replacement
- [x] Unit tests for `getPath`, `set`, `delete`, and `insert` on JSONNode
- [x] Core XPath evaluation functions support JSON nodes via `JSONDomFacade`

---

## 🟡 Still To Do

### 📌 1. Rework `<fx-insert>` for JSON

- [ ] Detect JSON context from `ref` or `context`
- [ ] Use `JSONNode.insert()` to modify JSON instance data
- [ ] Clone origin JSON data and clean if `keep-values` is not set
- [ ] Trigger proper `refresh` on `fx-repeat` or UI elements
- [ ] Ensure inserted node integrates with model binding

### 📌 2. `<fx-delete>` Support for JSON

- [ ] Detect JSON nodes in `ref`
- [ ] Call `.delete()` on `JSONNode`
- [ ] Dispatch correct `delete` or `data-changed` events

### 📌 3. `<fx-setvalue>` Support for JSON

- [ ] Update target JSON node via `set()`
- [ ] Trigger dependent calculations or UI updates

### 📌 4. `<fx-repeat>` Support for JSON

- [ ] Confirm `getInScopeContext()` resolves JSON lists properly
- [ ] Ensure `nodeset` binding supports array of `JSONNode`
- [ ] Allow index tracking for repeats over JSON arrays

### 📌 5. `<fx-bind>` and ModelItem Graph

- [ ] Ensure `fx-bind` supports `readonly`, `required`, `relevant` etc. on JSON
- [ ] Dependency graph updates from JSON nodes

### 📌 6. XPath Functions and Expressions

- [ ] Ensure functions like `index()`, `count()`, `instance()` behave with JSON
- [ ] Ensure lens-aware path resolution everywhere `getPath()` is used

### 📌 7. Submission / Replace Instance

- [ ] Ensure `replace="instance"` works for JSON and triggers wrap/refresh
- [ ] Roundtrip JSON through submission/load/update cycle

---

## 🧪 Optional but Valuable

- [ ] Add snapshot tests for JSON UIs (repeat, control, group)
- [ ] Add JSON repeat tests with nested arrays/objects
- [ ] Add JSON-focused playground demo (`fx-fore` + JSON)
