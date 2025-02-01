import { parseScript, evaluateXPath, evaluateXPathToNodes } from 'fontoXPath';
import * as slimdom from 'slimdom';

export class XPathDependencyExtractor {
    extractDependencies(ref) {
        if (!ref) return [];

        console.log(`Parsing XPath: "${ref}"`);

        let astElement;
        try {
            // parseScript returns an Element
            const parseContext = new slimdom.Document();
            astElement = parseScript(
                ref,
                { language: evaluateXPath.XPATH_3_1_LANGUAGE },
                parseContext
            );
        } catch (err) {
            console.warn(`parseScript() error for "${ref}":`, err);
            return [];
        }

        if (!astElement) {
            console.warn(`No AST returned for "${ref}"`);
            return [];
        }

        // Wrap it in a Document
        const astDoc = new slimdom.Document();
        astDoc.appendChild(astElement);

        // Optional: Log the AST
        // console.log('AST:', new slimdom.XMLSerializer().serializeToString(astDoc));

        // Look for <xqx:equalOp> as that's how your predicate is represented
        const equalOps = evaluateXPathToNodes(
            '//*[local-name()="equalOp"]',
            astDoc
        );
        if (!equalOps.length) {
            console.log('No <xqx:equalOp> found, so no predicate-based dependencies.');
            return [];
        }

        // Extract from <firstOperand> and <secondOperand>
        const dependencyNodes = evaluateXPathToNodes(
            '//*[local-name()="equalOp"]/*[local-name()="firstOperand"] | ' +
            '//*[local-name()="equalOp"]/*[local-name()="secondOperand"]',
            astDoc
        );

        const dependencies = dependencyNodes.map((node) => node.textContent.trim());
        console.log(`Extracted dependencies for "${ref}":`, dependencies);

        return dependencies;
    }
}
