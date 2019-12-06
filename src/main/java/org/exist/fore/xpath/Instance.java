/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.xpath;

import net.sf.saxon.expr.Expression;
import net.sf.saxon.expr.XPathContext;
import net.sf.saxon.expr.parser.ExpressionVisitor;
import net.sf.saxon.functions.SystemFunction;
import net.sf.saxon.om.Sequence;
import net.sf.saxon.om.SequenceIterator;
import net.sf.saxon.om.SequenceTool;
import net.sf.saxon.trans.XPathException;
import net.sf.saxon.tree.iter.ListIterator;
import org.exist.fore.model.Model;

import java.util.Collections;
import java.util.Optional;

public class Instance extends XFormsFunction
{
    private static final long serialVersionUID = -5302742873313974258L;

/*
	public Instance(SystemFunction target, Expression[] arguments) {
		super(target, arguments);
	}
*/

	/**
     * Pre-evaluate a function at compile time. Functions that do not allow
     * pre-evaluation, or that need access to context information, can override this method.
     * @param visitor an expression visitor
     * @return the result of the early evaluation, or the original expression, or potentially
     * a simplified expression
     */
/*
    public Expression preEvaluate(ExpressionVisitor visitor) throws XPathException {
		return this;
    }
*/

	/**
	 * Evaluate in a general context
	 */
/*
	public SequenceIterator iterate(final XPathContext xpathContext) throws XPathException {
		final Optional<String> instanceId;
		if (getArguments().length == 1) {
			final Expression instanceIDExpression = getArg(0);
			instanceId = Optional.ofNullable(
				instanceIDExpression.evaluateAsString(
					xpathContext).toString());
		} else {
			instanceId = Optional.empty();
		}
		return instance(xpathContext, instanceId);
	}
*/

	public Sequence call(final XPathContext context,
						 final Sequence[] arguments) throws XPathException {
		final Optional<String> instanceId;
		if(arguments.length == 1) {
			instanceId = Optional.ofNullable(arguments[0].head().getStringValue());
		} else {
			instanceId = Optional.empty();
		}
		return SequenceTool.toLazySequence(instance(context, instanceId));
	}

	private SequenceIterator instance(final XPathContext context, final Optional<String> instanceId) {
		final XPathFunctionContext functionContext = getFunctionContext(context);
		if (functionContext != null) {
			final Model model = functionContext.getXFormsElement().getModel();
			final org.exist.fore.model.Instance instance;
			if(instanceId.isPresent()) {
				instance = model.getInstance(instanceId.get());
			} else {
				instance = model.getDefaultInstance();
			}

			if (instance != null) {
				return new ListIterator(instance.getInstanceNodeset());
			}
		}

		return new ListIterator(Collections.EMPTY_LIST);
	}
}
