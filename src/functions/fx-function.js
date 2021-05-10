import { registerCustomXPathFunction } from 'fontoxpath';
import { evaluateXPath } from '../xpath-evaluation.js';

/**
 * Allows to extend a form with local custom functions.
 *
 * ` */
export class FxFunction extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.style.display = 'none';

    this.signature = this.hasAttribute('signature') ? this.getAttribute('signature') : null;
    if (this.signature === null) {
      console.error('signature is a required attribute');
    }
    this.type = this.hasAttribute('type') ? this.getAttribute('type') : null;
    this.shadowRoot.innerHTML = `<slot></slot>`;

    this.override = this.hasAttribute('override') ? this.getAttribute('override') : 'true';
    this.functionBody = this.innerText;

    const type = this.getAttribute('type') || 'text/xpath';

    // Parse the signature to something useful
    // Signature is of the form `my:sumproduct($p as xs:decimal*, $q as xs:decimal*) as xs:decimal`
    const signatureParseResult = this.signature.match(
      /(?:(?<prefix>[^:]*):)?(?<localName>[^(]+)\((?<params>[^)]*)\)(?: as (?<returnType>.*))?/,
    );

    if (!signatureParseResult) {
      throw new Error(`Function signature ${this.signature} could not be parsed`);
    }

    const { prefix, localName, params, returnType } = signatureParseResult.groups;

    // TODO: lookup prefix
    const namespaceURI = prefix || 'local';

    const paramParts = params
      ? params.split(',').map(param => {
          const match = param.match(/(?<variableName>\$[^\s]+)(?:\sas\s(?<varType>.+))/);
          if (!match) {
            throw new Error(`Param ${param} could not be parsed`);
          }
          const { variableName, varType } = match.groups;
          return {
            variableName,
            variableType: varType || 'item()*',
          };
        })
      : [];

    switch (type) {
      case 'text/javascript': {
        // eslint-disable-next-line no-new-func
        const fun = new Function(
          '_domFacade',
          ...paramParts.map(paramPart => paramPart.variableName),
          this.functionBody,
        );
        registerCustomXPathFunction(
          `${prefix ? `${prefix}:` : ''}${localName}`,
          paramParts.map(paramPart => paramPart.variableType),
          returnType || 'item()*',
          fun,
        );
        break;
      }

      case 'text/xpath': {
        const fun = (domFacade, ...args) =>
          evaluateXPath(
            this.functionBody,
            null,
            null,
            paramParts.reduce((variablesByName, paramPart, i) => {
              variablesByName[paramPart.variableName.replace('$', '')] = args[i];
              return variablesByName;
            }, {}),
          );
        registerCustomXPathFunction(
          `${prefix ? `${prefix}:` : ''}${localName}`,
          paramParts.map(paramPart => paramPart.variableType),
          returnType || 'item()*',
          fun,
        );
        break;
      }

      default:
        throw new Error(`Unexpected mimetype ${type} for function`);
    }
  }
}
customElements.define('fx-function', FxFunction);
