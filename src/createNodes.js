import { createNamespaceResolver } from './xpath-evaluation.js';

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
   * @type {string[]}
   */
  const steps = [];
  let scratch = '';
  let isInPredicate = false;
  for (const char of xpath.split('')) {
    if (char === '[') {
      isInPredicate = true;
      scratch += char;
    } else if (char === ']') {
      scratch += char;
      isInPredicate = false;
    } else if (isInPredicate) {
      // Just add to the scratch
      scratch += char;
    } else if (char === '/') {
      // Consume this path step
      if (scratch) {
        steps.push(scratch);
      }
      scratch = '';
    } else {
      scratch += char;
    }
  }

  if (scratch) {
    // Flush it
    steps.push(scratch);
  }

  return steps;
}

/**
 * @param {string} step - The step to parse
 */
function parseStep(step) {
  const trimmed = step.trim();
  const nameMatch = trimmed.match(/^([^[]+)/);
  const token = nameMatch ? nameMatch[1].trim() : trimmed;
  const predicates = [];

  const predicateRegex = /\[\s*@([^\]\s=]+)\s*=\s*(['"])(.*?)\2\s*\]/g;
  for (let match = predicateRegex.exec(trimmed); match; match = predicateRegex.exec(trimmed)) {
    predicates.push({ name: match[1], value: match[3] });
  }
  return { token, predicates };
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
      const attrToken = raw.slice(1);
      if (attrToken.startsWith('*:')) {
        return { isAttribute: true, namespaceURI: null, localName: attrToken.substring(2) };
      }
      if (attrToken.includes(':')) {
        const [prefix, localName] = attrToken.split(':');
        return {
          isAttribute: true,
          namespaceURI: prefix === '*' ? null : namespaceResolver(prefix) || null,
          localName,
        };
      }
      return { isAttribute: true, namespaceURI: null, localName: attrToken };
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

  const steps = splitSteps(xpath)
    .map(step => step.trim())
    .filter(step => step && step !== '.');

  if (!steps.length) return null;

  let subtreeRoot = null;
  let current = null;

  for (const rawStep of steps) {
    const { token, predicates } = parseStep(rawStep);
    if (!token || token === '.') {
      continue;
    }

    const parsed = parseName(token);

    if (!isValidName(parsed.localName)) {
      // This did not result in a valid name. Stop.
      console.warn(
        `Creating node for the XPath ${xpath} failed because the part ${parsed.localName} is not a valid Name.`,
      );
      return null;
    }

    if (parsed.isAttribute) {
      if (!current) {
        const attr = ownerDoc.createAttribute(parsed.localName);
        return attr;
      }
      current.setAttribute(parsed.localName, '');
      continue;
    }

    const element = parsed.namespaceURI
      ? ownerDoc.createElementNS(parsed.namespaceURI, parsed.localName)
      : ownerDoc.createElement(parsed.localName);

    for (const predicate of predicates) {
      const attrName = predicate.name.includes(':') ? predicate.name.split(':')[1] : predicate.name;
      element.setAttribute(attrName, predicate.value);
    }

    if (!subtreeRoot) {
      subtreeRoot = element;
    } else {
      current.appendChild(element);
    }
    current = element;
  }

  return subtreeRoot;
}
