/* Usage:

// Create or load your XML document
const xmlString = `
  <root>
    <item id="1">Initial Value</item>
  </root>
`;
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(xmlString, "application/xml");
const rootNode = xmlDoc.querySelector("root");

// Create an instance of the DataObserver
const xmlObserver = new DataObserver(200);

// Define a callback to process mutations
const handleXMLMutations = (mutationsList) => {
  console.log("XML Mutations:", mutationsList);
};

// Attach the observer to the XML root node
xmlObserver.observe(rootNode, handleXMLMutations);

// Modify the XML document to trigger mutations
setTimeout(() => {
  const newItem = xmlDoc.createElement("item");
  newItem.textContent = "Newly Added Item";
  rootNode.appendChild(newItem); // This triggers a mutation
}, 1000);

For JSON:
// Create a JSON object
const jsonObject = {
  name: "John Doe",
  age: 30,
  hobbies: ["reading", "coding"],
};

// Create an instance of the DataObserver
const jsonObserver = new DataObserver(200);

// Define a callback to process changes
const handleJSONChanges = (changesList) => {
  console.log("JSON Changes:", changesList);
};

// Attach the observer to the JSON object
jsonObserver.observe(jsonObject, handleJSONChanges);

// Modify the JSON object to trigger changes
setTimeout(() => {
  jsonObject.name = "Jane Doe"; // This triggers a mutation
  jsonObject.age = 31; // Another mutation
  delete jsonObject.hobbies; // This triggers a delete mutation
}, 1000);

*/
export class DataObserver {
    constructor(debounceTime = 0) {
        this.observer = null; // Placeholder for MutationObserver (for XML)
        this.debounceTime = debounceTime; // Time in milliseconds for optional debouncing
        this.mutationsQueue = []; // To batch process mutations
        this.debounceTimer = null; // Timer for debouncing
        this.jsonProxy = null; // Proxy for JSON observation
    }

    /**
     * Attaches an observer to the given rootNode (DOM Node or JSON object)
     * @param {Node|Object} rootNode - The XML DOM node or JSON object to observe
     * @param {Function} callback - Function to process batch mutations
     */
    observe(rootNode, callback) {
        if (rootNode instanceof Node) {
            // Handle XML Node
            this.observeXML(rootNode, callback);
        } else if (typeof rootNode === 'object' && rootNode !== null) {
            // Handle JSON Object
            this.observeJSON(rootNode, callback);
        } else {
            throw new Error(
                'Invalid rootNode. Must be a DOM Node or a JSON object.',
            );
        }
    }

    /**
     * Observes changes in an XML DOM node
     * @param {Node} xmlNode - The XML DOM node to observe
     * @param {Function} callback - Function to process batch mutations
     */
    observeXML(xmlNode, callback) {
        // Initialize a new MutationObserver
        this.observer = new MutationObserver((mutationsList) => {
            this.mutationsQueue.push(...mutationsList);

            if (this.debounceTime > 0) {
                clearTimeout(this.debounceTimer); // Clear previous timer
                this.debounceTimer = setTimeout(() => {
                    this.processMutations(callback);
                }, this.debounceTime);
            } else {
                this.processMutations(callback);
            }
        });

        // Start observing the XML node
        this.observer.observe(xmlNode, {
            characterData: true,
            childList: true,
            subtree: true,
        });
    }

    /**
     * Observes changes in a JSON object using a proxy
     * @param {Object} jsonObject - The JSON object to observe
     * @param {Function} callback - Function to process changes
     */
    observeJSON(jsonObject, callback) {
        const handler = {
            set: (target, key, value) => {
                this.mutationsQueue.push({
                    type: 'update',
                    target,
                    key,
                    value,
                });

                if (this.debounceTime > 0) {
                    clearTimeout(this.debounceTimer); // Clear previous timer
                    this.debounceTimer = setTimeout(() => {
                        this.processMutations(callback);
                    }, this.debounceTime);
                } else {
                    this.processMutations(callback);
                }

                // Perform the actual update
                target[key] = value;
                return true;
            },

            deleteProperty: (target, key) => {
                this.mutationsQueue.push({ type: 'delete', target, key });

                if (this.debounceTime > 0) {
                    clearTimeout(this.debounceTimer); // Clear previous timer
                    this.debounceTimer = setTimeout(() => {
                        this.processMutations(callback);
                    }, this.debounceTime);
                } else {
                    this.processMutations(callback);
                }

                // Perform the actual delete
                return delete target[key];
            },
        };

        this.jsonProxy = new Proxy(jsonObject, handler);
    }

    /**
     * Processes the mutations batch and clears the queue
     * @param {Function} callback - Function to handle the batch of mutations
     */
    processMutations(callback) {
        if (this.mutationsQueue.length > 0) {
            callback(this.mutationsQueue); // Pass the batch to the callback
            this.mutationsQueue = []; // Clear the queue
        }
    }

    /**
     * Disconnects the observer and clears any pending debounce timer
     */
    disconnect() {
        if (this.observer) {
            this.observer.disconnect(); // Disconnect the MutationObserver
            this.observer = null;
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer); // Clear any pending debounce timer
        }
        this.mutationsQueue = []; // Clear the mutation queue
        this.jsonProxy = null; // Clear JSON proxy reference
    }
}
