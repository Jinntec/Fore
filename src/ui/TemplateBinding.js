/**
 * Handles template-bound expressions (e.g., {value} in text nodes or attributes)
 */
export class TemplateBinding {
    constructor(expression, node) {
        this.expression = expression; // The original XPath expression
        this.node = node; // The DOM node to update
    }

    refresh() {

        //todo todo todo
        console.log(`Refreshing template expression: ${this.expression} for`, this.node);

        // 🔥 Implement proper evaluation logic (Assuming evaluateXPath exists)
        const newValue = evaluateXPath(this.expression, this.node);

        if (this.node.nodeType === Node.ATTRIBUTE_NODE) {
            this.node.value = newValue;
        } else {
            this.node.textContent = newValue;
        }
    }
}
