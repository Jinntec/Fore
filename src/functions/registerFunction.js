import { createTypedValueFactory, registerCustomXPathFunction } from 'fontoxpath';
import { evaluateXPath, globallyDeclaredFunctionLocalNames } from '../xpath-evaluation.js';

// FontoXPath custom functions are registered globally. If multiple <fx-functionlib> (or multiple
// <fx-fore> instances) register the same function name+arity, later registrations would overwrite
// earlier ones across the whole page. We enforce "first wins".
const _registeredFunctionKeys = new Set();

function _makeFunctionKey(functionIdentifier, arity) {
  if (typeof functionIdentifier === 'string') {
    return `str:${functionIdentifier}#${arity}`;
  }
  return `{${functionIdentifier.namespaceURI}}${functionIdentifier.localName}#${arity}`;
}

function _ensureGlobalUnprefixedName(localName) {
  // Keep this list unique to avoid unbounded growth across tests
  if (!globallyDeclaredFunctionLocalNames.includes(localName)) {
    globallyDeclaredFunctionLocalNames.push(localName);
  }
}

/**
 * @param functionObject {{signature: string, type: string|null, functionBody: string, implementation?: Function}}
 * @param formElement {HTMLElement} The form element connected to this function. Used to determine inscope context
 * @returns {undefined}
 */
export default function registerFunction(functionObject, formElement) {
  if (functionObject.signature === null) {
    console.error('signature is a required attribute');
  }

  const type = functionObject.type ?? 'text/xpath';

  // Parse the signature to something useful
  // Signature is of the form `my:sumproduct($p as xs:decimal*, $q as xs:decimal*) as xs:decimal` or local:something($a as item()*) as item()*
  const signatureParseResult = functionObject.signature.match(
    /(?:(?<prefix>[a-zA-Z_\-][a-zA-Z0-9_\-]*):)?(?<localName>[a-zA-Z_\-][a-zA-Z0-9_\-]*\s*)\((?<params>(?:[^()]*|\([^()]*\))*)\)\s*(?:as\s+(?<returnType>.*))?/,
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

  const paramParts = params
    ? params
        .split(',')
        .map(param => param.trim())
        .filter(Boolean)
        .map(param => {
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

  const arity = paramParts.length;

  // -------------------------------------------------
  // FIRST-WINS GUARD (name + arity) WITH NAME EXPORT
  // -------------------------------------------------
  const key = _makeFunctionKey(functionIdentifier, arity);

  if (_registeredFunctionKeys.has(key)) {
    // If this registration is unprefixed, we must still make it callable without prefix.
    // This fixes the unit test case where local:hello-world() was registered earlier and
    // hello-world() should resolve to that implementation.
    if (!prefix) {
      _ensureGlobalUnprefixedName(localName);
    }
    return;
  }

  _registeredFunctionKeys.add(key);

  // Make the function available globally w/o a prefix.
  if (!prefix) {
    _ensureGlobalUnprefixedName(localName);
  }

  switch (type) {
    case 'text/javascript': {
      // If a real JS function is provided (module libs), register it directly.
      if (typeof functionObject.implementation === 'function') {
        const impl = functionObject.implementation;
        registerCustomXPathFunction(
          functionIdentifier,
          paramParts.map(paramPart => paramPart.variableType),
          returnType || 'item()*',
          (domFacade, ...values) =>
            impl.apply(formElement.getInScopeContext(), [...values, formElement.getOwnerForm()]),
        );
        break;
      }

      // Existing behavior: compile from functionBody
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
