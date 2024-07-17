import { createTypedValueFactory, registerCustomXPathFunction } from 'fontoxpath';
import { evaluateXPath, globallyDeclaredFunctionLocalNames } from '../xpath-evaluation';

/**
 * @param functionObject {{signature: string, type: string|null, functionBody: string}}
 * @param formElement {HTMLElement} The form element connected to this function. Used to determine inscope context
 * @returns {undefined}
 */
export default function (functionObject, formElement) {
  if (functionObject.signature === null) {
    console.error('signature is a required attribute');
  }

  const type = functionObject.type ?? 'text/xpath';

  // Parse the signature to something useful
  // Signature is of the form `my:sumproduct($p as xs:decimal*, $q as xs:decimal*) as xs:decimal` or local:something($a as item()*) as item()*
  const signatureParseResult = functionObject.signature.match(
    /(?:(?<prefix>[^:]*):)?(?<localName>[^(]+)\((?<params>(?:\(\)|[^)])*)\)(?: as (?<returnType>.*))?/,
  );

  if (!signatureParseResult) {
    throw new Error(`Function signature ${functionObject.signature} could not be parsed`);
  }

  const { prefix, localName, params, returnType } = signatureParseResult.groups;

  // TODO: lookup prefix
  const functionIdentifier =
    prefix === 'local' || !prefix
      ? { namespaceURI: 'http://www.w3.org/2005/xquery-local-functions', localName }
      : `${prefix}:${localName}`;

  // Make the function available globally w/o a prefix. See the functionNameResolver for for how
  // functionObject is picked up
  if (!prefix) {
    globallyDeclaredFunctionLocalNames.push(localName);
  }

  const paramParts = params
    ? params.split(',').map(param => {
        const match = param.match(/(?<variableName>\$[^\s]+)(?:\sas\s(?<varType>[^\s]+))/);
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
        functionObject.functionBody,
      );
      registerCustomXPathFunction(
        functionIdentifier,
        paramParts.map(paramPart => paramPart.variableType),
        returnType || 'item()*',
        (...args) =>
          fun.apply(formElement.getInScopeContext(), [...args, formElement.getOwnerForm()]),
      );
      break;
    }

    case 'text/xquf':
    case 'text/xquery':
    case 'text/xpath': {
      const typedValueFactories = paramParts.map(param =>
        createTypedValueFactory(param.variableType),
      );
      const language =
        type === 'text/xpath'
          ? 'XPath3.1'
          : type === 'text/xquery'
            ? 'XQuery3.1'
            : 'XQueryUpdate3.1';
      const fun = (domFacade, ...args) =>
        evaluateXPath(
          functionObject.functionBody,
          formElement.getInScopeContext(),
          formElement.getOwnerForm(),
          paramParts.reduce((variablesByName, paramPart, i) => {
            // Because we know the XPath type here (from the function declaration) we do not have to depend on the implicit typings
            variablesByName[paramPart.variableName.replace('$', '')] = typedValueFactories[i](
              args[i],
              domFacade,
            );
            return variablesByName;
          }, {}),
          { language },
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
