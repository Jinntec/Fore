import { createNamespaceResolver } from './xpath-evaluation.js';
/**
 * @typedef {{nameTest: string, predicates: string[]}} RawStep
 */

/*
 * Determine whether a string is a valid Name
 *
 * @param {string} name
 * @returns {boolean} whether the name is a valid one
 */
function isValidName(name) {
  const result = new window.DOMParser().parseFromString(`<${name}/>`, 'application/xml');
  return result.querySelector('parsererror') === null;
}

/**
 * @param {string} xpath - the xpath to tokenize to steps
 */
function splitSteps(xpath) {
  /**
   * @type {RawStep[]}
   */
  const steps = [];
  let nameTestScratch = '';
  let predicates = [];
  let predicateScratch = '';
  let predicateDepth = 0;

  for (const char of xpath.split('')) {
    if (char === '[') {
      predicateDepth += 1;
      if (predicateDepth > 1) {
        // Keep the `[` in nested predicates
        predicateScratch += char;
      }
      continue;
    }
    if (char === ']') {
      predicateDepth -= 1;
      if (predicateDepth < 1) {
        // Outer predicate closed. Write away scratch. Do not keep the ']'
        predicates.push(predicateScratch.trim());
        predicateScratch = '';
      } else {
        predicateScratch += char;
      }
      continue;
    }
    if (predicateDepth > 0) {
      // We are in a predicate. Just write away!
      predicateScratch += char;
      continue;
    }

    // Predicate is zero at this point. Check if we are in a nametest or if we just stopped one
    if (char === '/') {
      // Consume this path step
      if (nameTestScratch) {
        steps.push({
          nameTest: nameTestScratch.trim(),
          predicates,
        });
        nameTestScratch = '';
        predicates = [];
      }
      continue;
    }

    nameTestScratch += char;
  }

  if (nameTestScratch) {
    // Flush it
    steps.push({
      nameTest: nameTestScratch.trim(),
      predicates,
    });
  }

  return steps;
}

/**
 * @param {string} possibleAttributeTest
 */
function extractAttributeTest(possibleAttributeTest) {
  possibleAttributeTest = possibleAttributeTest.trim();
  if (!possibleAttributeTest.startsWith('@')) {
    return null;
  }
  const predicateRegex = /@(.*)\s*=\s*(['"])(.*)\2/g;
  const match = predicateRegex.exec(possibleAttributeTest);
  if (match) {
    // Yep, this has the form `@type="my-type"`
    return { name: match[1].trim(), value: match[3] };
  }

  // This is of the form `@attr`
  return { name: possibleAttributeTest.substring(1), value: null };
}

/**
 * @typedef {{form: 'attributes', found: {name: string, value: string}} | {form: 'nested-path', found: RawStep[]}} ParsedPredicate
 */

/**
 * @param {string} predicate - The clean predicate string, everything between the (outer) `[` and `]`
 *
 * @returns {ParsedPredicate}
 */
function parsePredicate(predicate) {
  const attributeTest = extractAttributeTest(predicate);
  if (attributeTest) {
    // Yep, this has the form `@type="my-type"`
    return {
      form: 'attributes',
      found: attributeTest,
    };
  }

  // No. Is this a path?
  const nestedPath = splitSteps(predicate);
  if (nestedPath) {
    return {
      form: 'nested-path',
      found: nestedPath,
    };
  }
  // Don't know.
  return null;
}

/**
 * Create a structure from an XPath
 *
 * @param {string} xpath - The XPath to create the structure for
 * @param {Element} baseElement -  The parent of the new element
 * @param {import('./fx-fore').FxFore} foreElement - The Fore element in which this is created. Used for namespace resolving
 */
export default function createNodes(xpath, baseElement, foreElement) {
  const baseNamespace = baseElement?.namespaceURI || null;
  const namespaceResolver = createNamespaceResolver(xpath, foreElement);

  const ownerDoc = baseElement.ownerDocument;

  /**
   * @param {string} token
   */
  const parseName = token => {
    const raw = token.trim();

    if (raw.startsWith('@')) {
      const { name, value } = extractAttributeTest(raw);

      if (name.startsWith('*:')) {
        return { isAttribute: true, namespaceURI: null, localName: name.substring(2) };
      }
      if (name.includes(':')) {
        const [prefix, localName] = name.split(':');
        return {
          isAttribute: true,
          namespaceURI: prefix === '*' ? null : namespaceResolver(prefix) || null,
          localName,
          value,
        };
      }
      return { isAttribute: true, namespaceURI: null, localName: name, value };
    }

    if (raw.startsWith('*:')) {
      return { isAttribute: false, namespaceURI: baseNamespace, localName: raw.substring(2) };
    }
    if (raw.includes(':')) {
      const [prefix, localName] = raw.split(':');
      return {
        isAttribute: false,
        namespaceURI: prefix === '*' ? baseNamespace : namespaceResolver(prefix) || baseNamespace,
        localName,
      };
    }
    return { isAttribute: false, namespaceURI: baseNamespace, localName: raw };
  };

  const steps = splitSteps(xpath).filter(step => step.nameTest !== '.');

  if (!steps.length) return null;

  /**
   * Process a single step
   *
   * @param {RawStep} rawStep
   * @param {Element} current
   * @param {boolean} isRoot - True if this is the 'root' expression, false if we are in a predicate already
   *
   * @returns {({action: 'continue', element: Element} | {action: 'abort'} | {action: 'return', attr: Attr})}
   */
  const processStep = (rawStep, current, isRoot) => {
    const { nameTest, predicates } = rawStep;
    if (!nameTest || nameTest === '.') {
      return {
        action: 'continue',
        element: current,
      };
    }

    const parsed = parseName(nameTest);

    if (!isValidName(parsed.localName)) {
      // This did not result in a valid name. Stop.
      console.warn(
        `Creating node for the XPath ${xpath} failed because the part ${parsed.localName} is not a valid Name.`,
      );
      return {
        action: 'abort',
      };
    }

    if (parsed.isAttribute) {
      if (!current) {
        const attr = ownerDoc.createAttribute(parsed.localName);
        attr.value = parsed.value;
        return {
          action: 'return',
          attr,
        };
      }
      if (isRoot && parsed.value !== null) {
        // Prevent a path shaped like `./@value="a"` to just set an attribute. This should only be done in predicates
        return {
          action: 'abort',
        };
      }
      current.setAttribute(parsed.localName, parsed.value ?? '');
      return {
        action: 'continue',
        element: current,
      };
    }

    /**
     * @type {Element}
     */
    const element = parsed.namespaceURI
      ? ownerDoc.createElementNS(parsed.namespaceURI, parsed.localName)
      : ownerDoc.createElement(parsed.localName);

    for (const predicate of predicates) {
      const parsedPredicate = parsePredicate(predicate);
      if (!parsedPredicate) {
        // This did not result in a valid name. Stop.
        console.warn(
          `Creating node for the XPath ${xpath} failed because the part ${predicates} could not be processed.`,
        );
        return {
          action: 'abort',
        };
      }
      if (parsedPredicate.form === 'attributes') {
        const attrName = parsedPredicate.found.name.includes(':')
          ? parsedPredicate.found.name.split(':')[1]
          : parsedPredicate.found.name;
        element.setAttribute(attrName, parsedPredicate.found.value);
      } else {
        const nestedPath = parsedPredicate.found;
        let subtree = element;
        for (const step of nestedPath) {
          const result = processStep(step, subtree, false);
          if (result.action === 'abort') {
            return result;
          }

          if (result.action === 'continue') {
            subtree = result.element;
          }
        }
      }
    }

    if (current) {
      current.appendChild(element);
    }
    current = element;
    return {
      action: 'continue',
      element,
    };
  };

  let current = null;

  let subtreeRoot = null;

  for (const rawStep of steps) {
    const result = processStep(rawStep, current, true);
    switch (result.action) {
      case 'abort':
        return null;
      case 'return':
        return subtreeRoot;
      case 'continue':
        if (!current) {
          // This is the absolute root now
          subtreeRoot = result.element;
        }
        current = result.element;
        break;

      default:
    }
  }

  return subtreeRoot;
}
