import { registerCustomXPathFunction, createTypedValueFactory } from 'fontoxpath';
import { foreElementMixin } from '../ForeElementMixin.js';
import { evaluateXPath, globallyDeclaredFunctionLocalNames } from '../xpath-evaluation.js';

/**
 * Allows to extend a form with local custom functions.
 *
 * ` */
export class FxFunction extends foreElementMixin(HTMLElement) {
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
    // Signature is of the form `my:sumproduct($p as xs:decimal*, $q as xs:decimal*) as xs:decimal` or local:something($a as item()*) as item()*
    const signatureParseResult = this.signature.match(
      /(?:(?<prefix>[^:]*):)?(?<localName>[^(]+)\((?<params>(?:\(\)|[^)])*)\)(?: as (?<returnType>.*))?/,
    );

    if (!signatureParseResult) {
      throw new Error(`Function signature ${this.signature} could not be parsed`);
    }

    const { prefix, localName, params, returnType } = signatureParseResult.groups;

    // TODO: lookup prefix
    const functionIdentifier =
      prefix === 'local' || !prefix
        ? { namespaceURI: 'http://www.w3.org/2005/xquery-local-functions', localName }
        : `${prefix}:${localName}`;

    // Make the function available globally w/o a prefix. See the functionNameResolver for for how
    // this is picked up
    if (!prefix) {
      globallyDeclaredFunctionLocalNames.push(localName);
    }

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
          'form',
          this.functionBody,
        );
        registerCustomXPathFunction(
          functionIdentifier,
          paramParts.map(paramPart => paramPart.variableType),
          returnType || 'item()*',
          (...args) => fun.apply(this.getInScopeContext(), [...args, this.getOwnerForm()]),
        );
        break;
      }

      case 'text/xquf':
      case 'text/xquery':
      case 'text/xpath': {
        const typedValueFactories = paramParts.map(param => createTypedValueFactory(param.variableType));
        const language = type === 'text/xpath' ?
            'XPath3.1' : type === 'text/xquery' ?
            'XQuery3.1' : 'XQueryUpdate3.1';
        const fun = (domFacade, ...args) =>
          evaluateXPath(
            this.functionBody,
            this.getInScopeContext(),
            this.getOwnerForm(),
              paramParts.reduce((variablesByName, paramPart, i) => {
              // Because we know the XPath type here (from the function declaration) we do not have to depend on the implicit typings
				variablesByName[paramPart.variableName.replace('$', '')] = typedValueFactories[i](args[i]);
              return variablesByName;
            }, {}),
            {language}
          );
        registerCustomXPathFunction(
          functionIdentifier,
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
if (!customElements.get('fx-function')) {
  customElements.define('fx-function', FxFunction);
}
