
/**
 * @public
 */
export declare type Attr = Node & {
    localName: string;
    name: string;
    namespaceURI: string | null;
    nodeName: string;
    prefix: string | null;
    value: string;
};

/**
 * @public
 */
export declare type CDATASection = CharacterData;

/**
 * @public
 */
export declare type CharacterData = Node & {
    data: string;
};

/**
 * @public
 */
export declare type Comment = CharacterData;

/**
 * Compare the specificity of two XPath expressions. This function will return -1 if the second XPath is more specific, 1 if the first one is more specific and 0 if they are equal in specificity.
 *
 * @public
 *
 * @example
 * compareSpecificity('self::a', 'self::a[\@b]') === -1;
 * compareSpecificity('self::a', 'self::a and child::b') === -1;
 * compareSpecificity('self::*', 'self::a') === 1;
 * compareSpecificity('self::a', 'self::a') === 0;
 *
 * @param xpathStringA - The first XPath to compare
 * @param xpathStringB - The XPath to compare to
 *
 * @returns Either 1, 0, or -1
 */
export declare function compareSpecificity(xpathStringA: string, xpathStringB: string): -1 | 0 | 1;

/**
 * @public
 */
export declare type Document = Node & {
    implementation: {
        createDocument(namespaceURI: null, qualifiedNameStr: null, documentType: null): Document;
    };
    createAttributeNS(namespaceURI: string, name: string): Attr;
    createCDATASection(contents: string): CDATASection;
    createComment(data: string): Comment;
    createElementNS(namespaceURI: string, qualifiedName: string): Element;
    createProcessingInstruction(target: string, data: string): ProcessingInstruction;
    createTextNode(data: string): Text;
};

/**
 * @public
 */
export declare const domFacade: IDomFacade;

/**
 * @public
 */
export declare type Element = Node & {
    localName: string;
    namespaceURI: string | null;
    nodeName: string;
    prefix: string | null;
};

/**
 * Evaluates an XPath on the given contextItem. Returns the string result as if the XPath is wrapped in string(...).
 *
 * @public
 *
 * @param updateScript - The update script to execute. Supports XPath 3.1.
 * @param contextItem  - The node from which to run the XPath.
 * @param domFacade    - The domFacade (or DomFacade like interface) for retrieving relations.
 * @param variables    - Extra variables (name to value). Values can be number, string, boolean, nodes or object literals and arrays.
 * @param options      - Extra options for evaluating this XPath.
 *
 * @returns The query result and pending update list.
 */
export declare function evaluateUpdatingExpression(updateScript: string, contextItem?: any | null, domFacade?: IDomFacade | null, variables?: {
    [s: string]: any;
} | null, options?: UpdatingOptions | null): Promise<{
    pendingUpdateList: object[];
    xdmValue: any[];
}>;

/**
 * Evaluates an update script to a pending update list. See
 * [XQUF](https://www.w3.org/TR/xquery-update-30/) for more information on XQuery Update Facility.
 *
 * @public
 *
 * @param updateScript - The update script to execute. Supports XPath 3.1.
 * @param contextItem  - The node from which to run the XPath.
 * @param domFacade    - The domFacade (or DomFacade like interface) for retrieving relations.
 * @param variables    - Extra variables (name to value). Values can be number, string, boolean, nodes or object literals and arrays.
 * @param options      - Extra options for evaluating this XPath.
 *
 * @returns The query result and pending update list.
 */
export declare function evaluateUpdatingExpressionSync<TNode extends Node, TReturnType extends keyof IReturnTypes<TNode>>(updateScript: string, contextItem?: any | null, domFacade?: IDomFacade | null, variables?: {
    [s: string]: any;
} | null, options?: UpdatingOptions | null): {
    pendingUpdateList: object[];
    xdmValue: IReturnTypes<TNode>[TReturnType];
};

/**
 * @public
 */
export declare type EvaluateXPath = {
    /**
     * Evaluates an XPath on the given contextItem.
     *
     * If the return type is ANY_TYPE, the returned value depends on the result of the XPath:
     *  * If the XPath evaluates to the empty sequence, an empty array is returned.
     *  * If the XPath evaluates to a singleton node, that node is returned.
     *  * If the XPath evaluates to a singleton value, that value is atomized and returned.
     *  * If the XPath evaluates to a sequence of nodes, those nodes are returned.
     *  * Else, the sequence is atomized and returned.
     *
     * @public
     *
     * @param  selector    - The selector to execute. Supports XPath 3.1.
     * @param  contextItem - The node from which to run the XPath.
     * @param  domFacade   - The domFacade (or DomFacade like interface) for retrieving relations.
     * @param  variables   - Extra variables (name to value). Values can be number, string, boolean, nodes or object literals and arrays.
     * @param  returnType  - One of the return types, indicates the expected type of the XPath query.
     * @param  options     - Extra options for evaluating this XPath
     *
     * @returns The result of executing this XPath
     */
    <TNode extends Node, TReturnType extends keyof IReturnTypes<TNode>>(selector: string, contextItem?: any | null, domFacade?: IDomFacade | null, variables?: {
        [s: string]: any;
    } | null, returnType?: TReturnType, options?: Options | null): IReturnTypes<TNode>[TReturnType];
    /**
     * Returns the result of the query, can be anything depending on the
     * query. Note that the return type is determined dynamically, not
     * statically: XPaths returning empty sequences will return empty
     * arrays and not null, like one might expect.
     */
    ANY_TYPE: ReturnType_2.ANY;
    ARRAY_TYPE: ReturnType_2.ARRAY;
    ASYNC_ITERATOR_TYPE: ReturnType_2.ASYNC_ITERATOR;
    /**
     * Resolves to true or false, uses the effective boolean value to
     * determine the result. count(1) resolves to true, count(())
     * resolves to false
     */
    BOOLEAN_TYPE: ReturnType_2.BOOLEAN;
    /**
     * Resolves to the first node.NODES_TYPE would have resolved to.
     */
    FIRST_NODE_TYPE: ReturnType_2.FIRST_NODE;
    /**
     * Resolve to an object, as a map
     */
    MAP_TYPE: ReturnType_2.MAP;
    /**
     * Resolve to all nodes the XPath resolves to. Returns nodes in the
     * order the XPath would. Meaning (//a, //b) resolves to all A nodes,
     * followed by all B nodes. //*[self::a or self::b] resolves to A and
     * B nodes in document order.
     */
    NODES_TYPE: ReturnType_2.NODES;
    /**
     * Resolve to a number, like count((1,2,3)) resolves to 3.
     */
    NUMBER_TYPE: ReturnType_2.NUMBER;
    /**

     * Resolve to an array of numbers
     */
    NUMBERS_TYPE: ReturnType_2.NUMBERS;
    /**
     * Resolve to a string, like //someElement[1] resolves to the text
     * content of the first someElement
     */
    STRING_TYPE: ReturnType_2.STRING;
    /**
     * Resolve to an array of strings
     */
    STRINGS_TYPE: ReturnType_2.STRINGS;
    /**
     * Can be used to signal an XPath program should executed
     */
    XPATH_3_1_LANGUAGE: Language.XPATH_3_1_LANGUAGE;
    /**
     * Can be used to signal an XQuery program should be executed instead
     * of an XPath
     */
    XQUERY_3_1_LANGUAGE: Language.XQUERY_3_1_LANGUAGE;
    /**
     * Can be used to signal Update facility can be used.
     *
     * To catch pending updates, use {@link evaluateUpdatingExpression}
     */
    XQUERY_UPDATE_3_1_LANGUAGE: Language.XQUERY_UPDATE_3_1_LANGUAGE;
};

export declare const evaluateXPath: EvaluateXPath;

/**
 * Evaluates an XPath on the given contextNode. Returns the result as an array, if the result is an XPath array.
 *
 * @public
 *
 * @param  selector    - The selector to execute. Supports XPath 3.1.
 * @param  contextItem - The node from which to run the XPath.
 * @param  domFacade   - The domFacade (or DomFacade like interface) for retrieving relations.
 * @param  variables   - Extra variables (name to value). Values can be number, string, boolean, nodes or object literals and arrays.
 * @param  options     - Extra options for evaluating this XPath.
 *
 * @returns The array result, as a JavaScript array with atomized values.
 */
export declare function evaluateXPathToArray(selector: string, contextItem?: any | null, domFacade?: IDomFacade | null, variables?: {
    [s: string]: any;
} | null, options?: Options | null): any[];

/**
 * Evaluates an XPath on the given contextNode. Returns the result as an async iterator
 *
 * @public
 *
 * @param  selector    - The selector to execute. Supports XPath 3.1.
 * @param  contextItem - The node from which to run the XPath.
 * @param  domFacade   - The domFacade (or DomFacade like interface) for retrieving relations.
 * @param  variables   - Extra variables (name to value). Values can be number, string, boolean, nodes or object literals and arrays.
 * @param  options     - Extra options for evaluating this XPath.
 *
 * @returns An async iterator to the return values.
 */
export declare function evaluateXPathToAsyncIterator(selector: string, contextItem?: any | null, domFacade?: IDomFacade | null, variables?: {
    [s: string]: any;
} | null, options?: Options | null): AsyncIterableIterator<any>;

/**
 * Evaluates an XPath on the given contextNode.
 *
 * @public
 *
 * @param  selector    - The selector to execute. Supports XPath 3.1.
 * @param  contextItem - The node from which to run the XPath.
 * @param  domFacade   - The domFacade (or DomFacade like interface) for retrieving relations.
 * @param  variables   - Extra variables (name to value). Values can be number, string, boolean, nodes or object literals and arrays.
 * @param  options     - Extra options for evaluating this XPath.
 *
 * @returns A boolean result
 */
export declare function evaluateXPathToBoolean(selector: string, contextItem?: any | null, domFacade?: IDomFacade | null, variables?: {
    [s: string]: any;
} | null, options?: Options | null): boolean;

/**
 * Evaluates an XPath on the given contextNode. Returns the first node result.
 *
 * @public
 *
 * @param  selector    - The selector to execute. Supports XPath 3.1.
 * @param  contextItem - The node from which to run the XPath.
 * @param  domFacade   - The domFacade (or DomFacade like interface) for retrieving relations.
 * @param  variables   - Extra variables (name to value). Values can be number, string, boolean, nodes or object literals and arrays.
 * @param  options     - Extra options for evaluating this XPath.
 *
 * @returns The first matching node, in the order defined by the XPath.
 */
export declare function evaluateXPathToFirstNode<T extends Node>(selector: string, contextItem?: any | null, domFacade?: IDomFacade | null, variables?: {
    [s: string]: any;
} | null, options?: Options | null): T | null;

/**
 * Evaluates an XPath on the given contextNode. Returns the result as a map, if the result is an XPath map.
 *
 * @public
 *
 * @param  selector    - The selector to execute. Supports XPath 3.1.
 * @param  contextItem - The node from which to run the XPath.
 * @param  domFacade   - The domFacade (or DomFacade like interface) for retrieving relations.
 * @param  variables   - Extra variables (name to value). Values can be number, string, boolean, nodes or object literals and arrays.
 * @param  options     - Extra options for evaluating this XPath.
 *
 * @returns The map result, as an object. Because of JavaScript
 * constraints, key 1 and '1' are the same. The values in this map are
 * the JavaScript simple types. See evaluateXPath for more details in
 * mapping types.
 */
export declare function evaluateXPathToMap(selector: string, contextItem?: any | null, domFacade?: IDomFacade | null, variables?: {
    [s: string]: any;
} | null, options?: Options | null): {
    [s: string]: any;
};

/**
 * Evaluates an XPath on the given contextNode. Returns the first node result.
 * Returns result in the order defined in the XPath. The path operator ('/'), the union operator ('union' and '|') will sort.
 * This implies (//A, //B) resolves to all A nodes, followed by all B nodes, both in document order, but not merged.
 * However: (//A | //B) resolves to all A and B nodes in document order.
 *
 * @public
 *
 * @param  selector    - The selector to execute. Supports XPath 3.1.
 * @param  contextItem - The node from which to run the XPath.
 * @param  domFacade   - The domFacade (or DomFacade like interface) for retrieving relations.
 * @param  variables   - Extra variables (name to value). Values can be number, string, boolean, nodes or object literals and arrays.
 * @param  options     - Extra options for evaluating this XPath.
 *
 * @returns All matching Nodes, in the order defined by the XPath.
 */
export declare function evaluateXPathToNodes<T extends Node>(selector: string, contextItem?: any | null, domFacade?: IDomFacade | null, variables?: {
    [s: string]: any;
} | null, options?: Options | null): T[];

/**
 * Evaluates an XPath on the given contextNode. Returns the numeric result.
 *
 * @public
 *
 * @param  selector    - The selector to execute. Supports XPath 3.1.
 * @param  contextItem - The node from which to run the XPath.
 * @param  domFacade   - The domFacade (or DomFacade like interface) for retrieving relations.
 * @param  variables   - Extra variables (name to value). Values can be number, string, boolean, nodes or object literals and arrays.
 * @param  options     - Extra options for evaluating this XPath.
 *
 * @returns The numerical result.
 */
export declare function evaluateXPathToNumber(selector: string, contextItem?: any | null, domFacade?: IDomFacade | null, variables?: {
    [s: string]: any;
} | null, options?: Options | null): number;

/**
 * Evaluates an XPath on the given contextNode. Returns the numeric result.
 *
 * @public
 *
 * @param  selector    - The selector to execute. Supports XPath 3.1.
 * @param  contextItem - The node from which to run the XPath.
 * @param  domFacade   - The domFacade (or DomFacade like interface) for retrieving relations.
 * @param  variables   - Extra variables (name to value). Values can be number, string, boolean, nodes or object literals and arrays.
 * @param  options     - Extra options for evaluating this XPath.
 *
 * @returns The numerical results.
 */
export declare function evaluateXPathToNumbers(selector: string, contextItem?: any | null, domFacade?: IDomFacade | null, variables?: {
    [s: string]: any;
} | null, options?: Options | null): number[];

/**
 * Evaluates an XPath on the given contextNode. Returns the string result as if the XPath is wrapped in string(...).
 *
 * @public
 *
 * @param  selector    - The selector to execute. Supports XPath 3.1.
 * @param  contextItem - The node from which to run the XPath.
 * @param  domFacade   - The domFacade (or DomFacade like interface) for retrieving relations.
 * @param  variables   - Extra variables (name to value). Values can be number, string, boolean, nodes or object literals and arrays.
 * @param  options     - Extra options for evaluating this XPath.
 *
 * @returns The string result.
 */
export declare function evaluateXPathToString(selector: string, contextItem?: any | null, domFacade?: IDomFacade | null, variables?: {
    [s: string]: any;
} | null, options?: Options | null): string;

/**
 * Evaluates an XPath on the given contextNode. Returns the string result as if the XPath is wrapped in string(...).
 *
 * @public
 *
 * @param  selector    - The selector to execute. Supports XPath 3.1.
 * @param  contextItem - The node from which to run the XPath.
 * @param  domFacade   - The domFacade (or DomFacade like interface) for retrieving relations.
 * @param  variables   - Extra variables (name to value). Values can be number, string, boolean, nodes or object literals and arrays.
 * @param  options     - Extra options for evaluating this XPath.
 *
 * @returns The string result.
 */
export declare function evaluateXPathToStrings(selector: string, contextItem?: any | null, domFacade?: IDomFacade | null, variables?: {
    [s: string]: any;
} | null, options?: Options | null): string[];

/**
 * @public
 *
 * @param  pendingUpdateList - The updateScript to execute.
 * @param  domFacade         - The domFacade (or DomFacade like interface) for retrieving relations.
 * @param  nodesFactory      - The nodesFactory for creating nodes.
 * @param  documentWriter    - The documentWriter for writing changes.
 */
export declare function executePendingUpdateList(pendingUpdateList: object[], domFacade?: IDomFacade, nodesFactory?: INodesFactory, documentWriter?: IDocumentWriter): void;

/**
 * @public
 * @param xpathString - The XPath for which a bucket should be retrieved
 */
export declare function getBucketForSelector(xpathString: string): string;

/**
 * Get the buckets that apply to a given node.
 *
 * Buckets can be used to pre-filter XPath expressions to exclude those that will never match the given node.
 *
 * The bucket for a selector can be retrieved using {@link getBucketForSelector}.
 *
 * @public
 *
 * @param node - The node which buckets should be retrieved
 */
export declare function getBucketsForNode(node: Node): string[];

/**
 * @public
 */
export declare interface IDocumentWriter {
    insertBefore(parent: Element | Document, newNode: Node, referenceNode: Node | null): void;
    removeAttributeNS(node: Element, namespace: string, name: string): void;
    removeChild(parent: Element | Document, child: Node): void;
    setAttributeNS(node: Element, namespace: string, name: string, value: string): void;
    setData(node: Node, data: string): void;
}

/**
 * The base interface of a dom facade
 *
 * @public
 */
export declare interface IDomFacade {
    /**
     * Get all attributes of this element.
     * The bucket can be used to narrow down which attributes should be retrieved.
     *
     * @param  node -
     * @param  bucket - The bucket that matches the attribute that will be used.
     */
    getAllAttributes(node: Element, bucket?: string | null): Attr[];
    /**
     * Get the value of specified attribute of this element.
     *
     * @param  node -
     * @param  attributeName -
     */
    getAttribute(node: Element, attributeName: string): string | null;
    /**
     * Get all child nodes of this element.
     * The bucket can be used to narrow down which child nodes should be retrieved.
     *
     * @param  node -
     * @param  bucket - The bucket that matches the attribute that will be used.
     */
    getChildNodes(node: Node, bucket?: string | null): Node[];
    /**
     * Get the data of this element.
     *
     * @param  node -
     */
    getData(node: Attr | CharacterData): string;
    /**
     * Get the first child of this element.
     * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
     *
     * @param  node -
     * @param  bucket - The bucket that matches the attribute that will be used.
     */
    getFirstChild(node: Node, bucket?: string | null): Node | null;
    /**
     * Get the last child of this element.
     * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
     *
     * @param  node -
     * @param  bucket - The bucket that matches the attribute that will be used.
     */
    getLastChild(node: Node, bucket?: string | null): Node | null;
    /**
     * Get the next sibling of this node
     * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
     *
     * @param  node -
     * @param  bucket - The bucket that matches the nextSibling that is requested.
     */
    getNextSibling(node: Node, bucket?: string | null): Node | null;
    /**
     * Get the parent of this element.
     * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
     *
     * @param  node -
     * @param  bucket - The bucket that matches the attribute that will be used.
     */
    getParentNode(node: Node, bucket?: string | null): Node | null;
    /**
     * Get the previous sibling of this element.
     * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
     *
     * @param  node -
     * @param  bucket - The bucket that matches the attribute that will be used.
     */
    getPreviousSibling(node: Node, bucket?: string | null): Node | null;
}

/**
 * Defines the factory methods used in XQuery. Basically equivalent to the Document interface, but
 * with the 'createDocument' factory method added.
 *
 * @public
 */
export declare interface INodesFactory extends ISimpleNodesFactory {
    createDocument(): Document;
}

/**
 * @public
 */
export declare interface IReturnTypes<T extends Node> {
    [ReturnType_2.ANY]: any;
    [ReturnType_2.NUMBER]: number;
    [ReturnType_2.STRING]: string;
    [ReturnType_2.BOOLEAN]: boolean;
    [ReturnType_2.NODES]: T[];
    [ReturnType_2.FIRST_NODE]: T | null;
    [ReturnType_2.STRINGS]: string[];
    [ReturnType_2.MAP]: {
        [s: string]: any;
    };
    [ReturnType_2.ARRAY]: any[];
    [ReturnType_2.NUMBERS]: number[];
    [ReturnType_2.ASYNC_ITERATOR]: AsyncIterableIterator<any>;
}

/**
 * Subset of the constructor methods present on Document. Can be used to create textnodes, elements,
 * attributes, CDataSecions, comments and processing instructions.
 *
 * @public
 */
export declare interface ISimpleNodesFactory {
    createAttributeNS(namespaceURI: string, name: string): Attr;
    createCDATASection(contents: string): CDATASection;
    createComment(contents: string): Comment;
    createElementNS(namespaceURI: string, name: string): Element;
    createProcessingInstruction(target: string, data: string): ProcessingInstruction;
    createTextNode(contents: string): Text;
}

/**
 * @public
 */
export declare enum Language {
    XPATH_3_1_LANGUAGE = "XPath3.1",
    XQUERY_3_1_LANGUAGE = "XQuery3.1",
    XQUERY_UPDATE_3_1_LANGUAGE = "XQueryUpdate3.1"
}

/**
 * @public
 */
export declare type Logger = {
    trace: (message: string) => void;
};

/**
 * @public
 */
export declare type Node = {
    nodeType: number;
};

/**
 * @public
 */
export declare type Options = {
    currentContext?: any;
    debug?: boolean;
    disableCache?: boolean;
    documentWriter?: IDocumentWriter;
    language?: Language;
    logger?: Logger;
    moduleImports?: {
        [s: string]: string;
    };
    namespaceResolver?: (s: string) => string | null;
    nodesFactory?: INodesFactory;
};

/**
 * Parse an XPath or XQuery script and output it as an XQueryX element. Refer to the [XQueryX
 * spec](https://www.w3.org/TR/xqueryx-31/) for more info.
 *
 * The precise generated XQueryX may change in the future when progress is made on supporting the
 * XQueryX test set provided with the [QT3 test suite](https://dev.w3.org/2011/QT3-test-suite/).
 *
 * @example
 * Parse "self::element" to an XQueryX element and access it
 * ```
 * const xqueryx = parseScript(
 *   'self::element',
 *   {
 *     language: evaluateXPath.XPATH_3_1_LANGUAGE
 *   },
 *   new slimdom.Document()
 * );
 *
 * // Get the nametest element
 * const nameTestElement = evaluateXPathToFirstNode(
 *   '//Q{http://www.w3.org/2005/XQueryX}nameTest',
 *   xqueryx)
 * ```
 *
 * @public
 *
 * @param script - The script to parse
 *
 * @param options - Additional options for parsing. Can be used to switch between parsing XPath or
 * XQuery update facility
 *
 * @param simpleNodesFactory - A NodesFactory will be used to create the DOM. This can be a
 * reference to the document in which the XQueryX will be created
 *
 * @param documentWriter - The documentWriter will be used to append children to the newly created
 * dom
 */
export declare function parseScript<TElement extends Element>(script: string, options: Options, simpleNodesFactory: ISimpleNodesFactory, documentWriter?: IDocumentWriter): TElement;

/**
 * Precompile an XPath selector asynchronously.
 *
 * @deprecated This code is deprecated. This is a no-op!
 *
 * @public
 *
 * @param   xPathString - The xPath which should be pre-compiled
 *
 * @returns  A promise which is resolved with the xpath string after compilation.
 */
export declare function precompileXPath(xPathString: string): Promise<string>;

/**
 * @public
 */
export declare type ProcessingInstruction = CharacterData & {
    nodeName: string;
    target: string;
};

/**
 * Add a custom test for use in xpath-serialized expressions.
 *
 * @public
 *
 * @param  name - The name of this custom function. The string overload is deprecated, please register functions using the object overload
 * @param  signature - The signature of the test, as array of strings (e.g. ['item()', 'node()?', 'xs:numeric'])
 * @param  returnType - The return type of the test, as sequence type (e.g. 'xs:boolean()')
 * @param  callback - The test itself, which gets the dynamicContext and arguments passed
 */
export declare function registerCustomXPathFunction(name: string | {
    localName: string;
    namespaceURI: string;
}, signature: string[], returnType: string, callback: (domFacade: {
    currentContext: any;
    domFacade: IDomFacade;
}, ...functionArgs: any[]) => any): void;

/**
 * Register an XQuery module
 * @public
 * @param   moduleString - The string contents of the module
 * @param   options - Additional compilation options
 * @returns  The namespace uri of the new module
 */
export declare function registerXQueryModule(moduleString: string, options?: {
    debug: boolean;
}): string;

/**
 * @public
 */
declare enum ReturnType_2 {
    ANY = 0,
    NUMBER = 1,
    STRING = 2,
    BOOLEAN = 3,
    NODES = 7,
    FIRST_NODE = 9,
    STRINGS = 10,
    MAP = 11,
    ARRAY = 12,
    NUMBERS = 13,
    ASYNC_ITERATOR = 99
}
export { ReturnType_2 as ReturnType }

/**
 * @public
 */
export declare type Text = CharacterData;

/**
 * @public
 */
export declare type UpdatingOptions = {
    debug?: boolean;
    disableCache?: boolean;
    documentWriter?: IDocumentWriter;
    logger?: Logger;
    moduleImports?: {
        [s: string]: string;
    };
    namespaceResolver?: (s: string) => string | null;
    nodesFactory?: INodesFactory;
    returnType?: ReturnType_2;
};

export { }
