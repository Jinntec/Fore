/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.xpath;

import net.sf.saxon.expr.*;
import net.sf.saxon.expr.parser.RetainedStaticContext;
import net.sf.saxon.functions.FunctionLibrary;
import net.sf.saxon.functions.SystemFunction;
import net.sf.saxon.functions.registry.BuiltInFunctionSet;
import net.sf.saxon.lib.NamespaceConstant;
import net.sf.saxon.om.Sequence;
import net.sf.saxon.om.StructuredQName;
import net.sf.saxon.trans.SymbolicName;
import net.sf.saxon.trans.XPathException;
import net.sf.saxon.type.ItemType;
import net.sf.saxon.value.AtomicValue;
import net.sf.saxon.value.EmptySequence;
import net.sf.saxon.value.SequenceType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * This class heavily borrows from {@link net.sf.saxon.functions.registry.BuiltInFunctionSet}
 * in particular special attention needs to be paid to making
 * {@link XPathFunctionLibrary#bind} and {@link net.sf.saxon.functions.registry.BuiltInFunctionSet}
 * as similar as possible when updating to newer Saxon versions
 */
public abstract class XPathFunctionLibrary implements FunctionLibrary {
    protected static Sequence EMPTY = EmptySequence.getInstance();
    protected static Map<String, BuiltInFunctionSet.Entry> functionTable = new HashMap<String, BuiltInFunctionSet.Entry>(200);
    private static final long serialVersionUID = -6673788638743556161L;

    protected abstract String getFunctionNamespace();


    /**
     * Bind a function, given the URI and local parts of the function name,
     * and the list of expressions supplied as arguments. This method is called at compile
     * time.
     *
     * @param symbolicName the symbolic name of the function being called
     * @param staticArgs   May be null; if present, the length of the array must match the
     *                     value of arity. Contains the expressions supplied statically in arguments to the function call.
     *                     The intention is
     *                     that the static type of the arguments (obtainable via getItemType() and getCardinality()) may
     *                     be used as part of the binding algorithm. In some cases it may be possible for the function
     *                     to be pre-evaluated at compile time, for example if these expressions are all constant values.
     *                     <p>The conventions of the XPath language demand that the results of a function depend only on the
     *                     values of the expressions supplied as arguments, and not on the form of those expressions. For
     *                     example, the result of f(4) is expected to be the same as f(2+2). The actual expression is supplied
     *                     here to enable the binding mechanism to select the most efficient possible implementation (including
     *                     compile-time pre-evaluation where appropriate).</p>
     * @param env          The static context of the function call
     * @param reasons      If no matching function is found by the function library, it may add
     *                     a diagnostic explanation to this list explaining why none of the available
     *                     functions could be used.
     * @return An expression equivalent to a call on the specified function, if one is found;
     * null if no function was found matching the required name and arity.
     */
    @Override
    public Expression bind(SymbolicName.F symbolicName, Expression[] staticArgs, StaticContext env, List<String> reasons) {
        StructuredQName functionName = symbolicName.getComponentName();
        int arity = symbolicName.getArity();
        String localName = functionName.getLocalPart();
        if (functionName.hasURI(getNamespace()) && getFunctionDetails(localName, arity) != null) {
            RetainedStaticContext rsc = new RetainedStaticContext(env);
            try {
                SystemFunction fn = makeFunction(localName, arity);
                fn.setRetainedStaticContext(rsc);
                Expression f = fn.makeFunctionCall(staticArgs);
                f.setRetainedStaticContext(rsc);
                return f;
            } catch (XPathException e) {
                reasons.add(e.getMessage());
                return null;
            }
        } else {
            return null;
        }
    }

    /**
     * Locate the entry for a function with a given name and arity, if it exists
     * @param name the local part of the function name
     * @param arity the arity of the function. -1 considers all possibly arities and returns an arbitrary function
     *              if one exists with the right name.
     * @return the entry for the required function, or null if not found
     */

    public BuiltInFunctionSet.Entry getFunctionDetails(String name, int arity) {
        if (arity == -1) {
            for (int i=0; i<20; i++) {
                BuiltInFunctionSet.Entry found = getFunctionDetails(name, i);
                if (found != null) {
                    return found;
                }
            }
            return null;
        }
        String key = name + "#" + arity;
        BuiltInFunctionSet.Entry entry = functionTable.get(key);
        if (entry != null) {
            return entry;
        }
        // Try for a variable-arity function (concat only)
        if (name.equals("concat") && arity >= 2 && getNamespace().equals(NamespaceConstant.FN)) {
            key = "concat#-1";
            entry = functionTable.get(key);
            if (entry != null) {
                return entry;
            }
        }
//        for (BuiltInFunctionSet lib : importedFunctions) {
//            entry = lib.getFunctionDetails(name, arity);
//            if (entry != null) {
//                return entry;
//            }
//        }
        return null;
    }


    /**
     * Return the namespace URI for the functions local to this function set.
     * @return the namespace URI of the functions local to this function set.
     * Note that functions imported from another function set may have a different
     * namespace URI.
     */

    public String getNamespace() {
        return NamespaceConstant.FN;
    }

    /**
     * Register a system function in the table of function details.
     *
     * @param name                the function name
     * @param implementationClass the class used to implement the function
     * @param itemType            the item type of the result of the function
     * @param cardinality         the cardinality of the result of the function
     * @param applicability       the host languages (and versions thereof) in which this function is available
     * @param properties          bitwise properties of the function
     * @return the entry describing the function. The entry is incomplete, it does not yet contain information
     * about the function arguments.
     */

    /*@NotNull*/
    protected BuiltInFunctionSet.Entry register(String name,
                                                int arity,
                                                Class<? extends SystemFunction> implementationClass,
                                                ItemType itemType,
                                                int cardinality,
                                                int applicability,
                                                int properties) {
        BuiltInFunctionSet.Entry e = new BuiltInFunctionSet.Entry();
        e.name = new StructuredQName(getConventionalPrefix(), getNamespace(), name);
        e.arity = arity;
        e.implementationClass = implementationClass;
        e.itemType = itemType;
        e.cardinality = cardinality;
        e.applicability = applicability;
        e.properties = properties;
        if (e.arity == -1) {
            // special case for concat()
            e.argumentTypes = new SequenceType[1];
            e.resultIfEmpty = new AtomicValue[1];
            e.usage = new OperandUsage[1];
        } else {
            e.argumentTypes = new SequenceType[arity];
            e.resultIfEmpty = (Sequence<?>[])new Sequence[arity];
            e.usage = new OperandUsage[arity];
        }
        functionTable.put(name + "#" + arity, e);
        return e;
    }

    /**
     * Return a conventional prefix for use with this namespace, typically
     * the prefix used in the documentation of these functions.
     */

    public String getConventionalPrefix() {
        return "fn";
    }


    public SystemFunction makeFunction(String name, int arity) throws XPathException {
        BuiltInFunctionSet.Entry entry = getFunctionDetails(name, arity);
        if (entry == null) {
            String diagName = getNamespace().equals(NamespaceConstant.FN) ?
                    "System function " + name :
                    "Function Q{" + getNamespace() + "}" + name;
            if (getFunctionDetails(name, -1) == null) {
                XPathException err = new XPathException(diagName + "() does not exist or is not available in this environment");
                err.setErrorCode("XPST0017");
                err.setIsStaticError(true);
                throw err;
            } else {
                XPathException err = new XPathException(diagName + "() cannot be called with "
                        + pluralArguments(arity));
                err.setErrorCode("XPST0017");
                err.setIsStaticError(true);
                throw err;
            }
        }

        Class functionClass = entry.implementationClass;
        SystemFunction f;
        try {
            f = (SystemFunction) functionClass.newInstance();
        } catch (Exception err) {
            err.printStackTrace();
            throw new AssertionError("Failed to instantiate system function " + name + " - " + err.getMessage());
        }
        f.setDetails(entry);
        f.setArity(arity);
        return f;
    }

    /**
     * Test whether a function with a given name and arity is available
     * <p>This supports the function-available() function in XSLT.</p>
     *
     * @param symbolicName the qualified name of the function being called, together with its arity.
     *                     For legacy reasons, the arity may be set to -1 to mean any arity will do
     * @return true if a function of this name and arity is available for calling
     */
    @Override
    public boolean isAvailable(SymbolicName.F symbolicName) {
        StructuredQName qn = symbolicName.getComponentName();
        return qn.hasURI(getNamespace()) && getFunctionDetails(qn.getLocalPart(), symbolicName.getArity()) != null;
    }

    /**
     * Adapted from {@link net.sf.saxon.functions.SystemFunctionLibrary#isAvailable(SymbolicName)}
     * so that we can operate over several namespaces by calling `getFunctionNamespace`
     */
/*
    public boolean isAvailable(final SymbolicName functionName) {
        final String uri = functionName.getComponentName().getURI();
        if (uri.equals(getFunctionNamespace())) {
            final String local = functionName.getComponentName().getLocalPart();
            final StandardFunction.Entry entry = getFunction("{" + uri + "}" + local, functionName.getArity());
            return entry != null && (functionName.getArity() == -1 || (entry.minArguments <= functionName.getArity() && entry.maxArguments >= functionName.getArity()));
        } else {
            return false;
        }
    }
*/

    /**
     * Duplicated from {@link net.sf.saxon.functions.SystemFunctionLibrary(int, int, int, String)}
     */
    private int checkArgumentCount(int numArgs, int min, int max, String local) throws XPathException {
        if (min == max && numArgs != min) {
//            throw new StaticError("Function " + Err.wrap(local, Err.FUNCTION) + " must have " + min + pluralArguments(min));
            throw new XPathException("Function " + local + " must have " + min + pluralArguments(min));
        }
        if (numArgs < min) {
//            throw new StaticError("Function " + Err.wrap(local, Err.FUNCTION) + " must have at least " + min + pluralArguments(min));
            throw new XPathException("Function " + local + " must have at least " + min + pluralArguments(min));

        }
        if (numArgs > max) {
//            throw new StaticError("Function " + Err.wrap(local, Err.FUNCTION) + " must have no more than " + max + pluralArguments(max));
            throw new XPathException("Function " + local + " must have  no more than " + max + pluralArguments(max));
        }
        return numArgs;
    }

    /**
     * Duplicated from {@link net.sf.saxon.functions.SystemFunctionLibrary(int)}
     */
    private static String pluralArguments(int num) {
        if (num == 0) {
            return "zero arguments";
        }
        if (num == 1) {
            return "one argument";
        }
        return num + " arguments";
    }

    /**
     * Duplicated from {@link net.sf.saxon.functions.SystemFunctionLibrary#copy()}
     */
    public FunctionLibrary copy() {
        return this;
    }

    /**
     * Duplicated from {@link net.sf.saxon.functions.StandardFunction#getFunction(java.lang.String, int)}
     */
/*
    public static BuiltInFunctionSet.Entry getFunction(String name, int arity) {
        if (arity == -1) {
            for (int i = 0; i < 10; i++) {
                StandardFunction.Entry e = getFunction(name, i);
                if (e != null) {
                    return e;
                }
            }
            return null;
        }
        // try first for an entry of the form name#arity
        StandardFunction.Entry e = functionTable.get(name + '#' + arity);
        if (e != null) {
            return e;
        }
        // try for a generic entry
        return functionTable.get(name);
    }
*/
}
