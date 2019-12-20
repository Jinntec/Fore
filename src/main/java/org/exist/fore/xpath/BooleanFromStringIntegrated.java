/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.xpath;

import net.sf.saxon.expr.XPathContext;
import net.sf.saxon.lib.ExtensionFunctionCall;
import net.sf.saxon.lib.ExtensionFunctionDefinition;
import net.sf.saxon.om.Item;
import net.sf.saxon.om.NodeInfo;
import net.sf.saxon.om.Sequence;
import net.sf.saxon.om.StructuredQName;
import net.sf.saxon.trans.XPathException;
import net.sf.saxon.value.BooleanValue;
import net.sf.saxon.value.SequenceType;

/**
 * Implementation of the 7.7.1 The boolean-from-string() Function
 * <p/>
 * Function boolean-from-string returns true if the required parameter
 * string is "true" or "1", or false if parameter string is "false", or "0".
 * This is useful when referencing a Schema xsd:boolean datatype in an XPath
 * expression. If the parameter string matches none of the above strings,
 * according to a case-insensitive comparison, the return value is "false". 
 *
 * @author Nick Van den Bleeken
 * @version $Id$
 */
public class BooleanFromStringIntegrated extends ExtensionFunctionDefinition {

	private static final StructuredQName qName =
			new StructuredQName("", NamespaceConstants.XFORMS_NS, "boolean-from-string");

	/**
	 * Get the function name, as a QName
	 *
	 * @return the QName of the function
	 */

	public StructuredQName getFunctionQName() {
		return qName;
	}

	/**
	 * Get the minimum number of arguments required by the function
	 *
	 * @return the minimum number of arguments that must be supplied in a call to this function
	 */

	public int getMinimumNumberOfArguments() {
		return 1;
	}

	/**
	 * Get the maximum number of arguments allowed by the function
	 *
	 * @return the maximum number of arguments that may be supplied in a call to this function
	 */

	public int getMaximumNumberOfArguments() {
		return 1;
	}

	/**
	 * Get the required types for the arguments of this function, counting from zero
	 *
	 * @return the required types of the argument, as defined by the function signature. Normally
	 *         this should be an array of size {@link #getMaximumNumberOfArguments()}; however for functions
	 *         that allow a variable number of arguments, the array can be smaller than this, with the last
	 *         entry in the array providing the required type for all the remaining arguments.
	 */

	public SequenceType[] getArgumentTypes() {
		return new SequenceType[]{};
	}

	/**
	 * Get the type of the result of the function
	 *
	 * @param suppliedArgumentTypes the static types of the arguments to the function.
	 *                              This is provided so that a more precise result type can be returned in the common
	 *                              case where the type of the result depends on the type of the first argument. The value
	 *                              will be null if the function call has no arguments.
	 * @return the return type of the function, as defined by its function signature
	 */

	public SequenceType getResultType(SequenceType[] suppliedArgumentTypes) {
		return SequenceType.SINGLE_BOOLEAN;
	}

	/**
	 * Create a call on this function. This method is called by the compiler when it identifies
	 * a function call that calls this function.
	 */

	/*@NotNull*/
	public ExtensionFunctionCall makeCallExpression() {
//		return new IsIdRef.IsIdRefCall();
		return new BooleanFromStringIntegrated.BooleanFromStringCall();
	}

	private static class BooleanFromStringCall extends ExtensionFunctionCall {

		/**
		 * Evaluate this function call at run-time
		 *
		 * @param context   The XPath dynamic evaluation context
		 * @param arguments The values of the arguments to the function call. Each argument value (which is in general
		 *                  a sequence) is supplied in the form of an iterator over the items in the sequence. If required, the
		 *                  supplied sequence can be materialized by calling, for example, <code>new SequenceExtent(arguments[i])</code>.
		 *                  If the argument is always a singleton, then the single item may be obtained by calling
		 *                  <code>arguments[i].next()</code>. The implementation is not obliged to read all the items in each
		 *                  <code>SequenceIterator</code> if they are not required to compute the result; but if any SequenceIterator is not read
		 *                  to completion, it is good practice to call its close() method.
		 * @return an iterator over the results of the function. If the result is a single item, it can be
		 *         returned in the form of a {@link net.sf.saxon.tree.iter.SingletonIterator}. If the result is an empty sequence,
		 *         the method should return <code>EmptyIterator.getInstance()</code>
		 * @throws net.sf.saxon.trans.XPathException
		 *          if a dynamic error occurs during evaluation of the function. The Saxon run-time
		 *          code will add information about the error location.
		 */

		public BooleanValue call(XPathContext context, Sequence[] arguments) throws XPathException {
			Item contextItem = context.getContextItem();
			return BooleanValue.get(contextItem instanceof NodeInfo);
		}

		/**
		 * Get the effective boolean value of the expression. This returns false if the value
		 * is the empty sequence, a zero-length string, a number equal to zero, or the boolean
		 * false. Otherwise it returns true.
		 *
		 * @param context The context in which the expression is to be evaluated
		 * @return the effective boolean value
		 * @throws net.sf.saxon.trans.XPathException
		 *          if any dynamic error occurs evaluating the
		 *          expression
		 */

		public boolean effectiveBooleanValue(XPathContext context, Sequence[] arguments) throws XPathException {
			Item contextItem = context.getContextItem();
			return contextItem instanceof NodeInfo;
		}


	}

}

