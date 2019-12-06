/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.xpath;

import net.sf.saxon.expr.Expression;
import net.sf.saxon.expr.XPathContext;
import net.sf.saxon.functions.SystemFunction;
import net.sf.saxon.om.Item;
import net.sf.saxon.om.Sequence;
import net.sf.saxon.trans.XPathException;
import net.sf.saxon.value.BooleanValue;
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
public class BooleanFromString extends XFormsFunction
{
	private static final long serialVersionUID = -8152654592543207734L;

/*
	public BooleanFromString(SystemFunction target, Expression[] arguments) {
		super(target, arguments);
	}
*/

/*
	public BooleanFromString(SystemFunction target, Expression[] arguments) {
		super(target, arguments);
	}
*/


	/**
	 * Evaluate in a general context
	 */
/*
	public Item evaluateItem(XPathContext xpathContext) throws XPathException {
		final String value = arguments(0).evaluateAsString(xpathContext).toString();
        return toBoolean(value);
	}
*/

	public Sequence call(final XPathContext context,
						 final Sequence[] arguments) throws XPathException {
		final String value = arguments[0].head().getStringValue();
		return toBoolean(value);
	}

	private BooleanValue toBoolean(final String bool) {
		if("1".equals(bool) || "true".equalsIgnoreCase(bool)) {
			return BooleanValue.TRUE;
		} else {
			return BooleanValue.FALSE;
		}
	}
}
