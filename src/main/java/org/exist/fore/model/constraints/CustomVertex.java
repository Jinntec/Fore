/*
 * Copyright (c) 2011. betterForm Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.model.constraints;

import org.exist.fore.XFormsException;
import org.exist.fore.xpath.BetterFormXPathContext;
import org.exist.fore.xpath.XPathCache;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.w3c.dom.Node;

/**
 * The <code>constraint</code> vertex implementation used in the recalculation
 * sequence algorithm.
 * 
 * @author This code is based on the ideas of Mikko Honkala from the X-Smiles
 *         project. Although it has been heavily refactored and rewritten to
 *         meet our needs.
 * @author rvkuijk
 */
public class CustomVertex extends Vertex {
	private static Log LOGGER = LogFactory.getLog(CustomVertex.class);
	
	protected String prefix;

	public String getPrefix() {
		return prefix;
	}

	public void setPrefix(String prefix) {
		this.prefix = prefix;
	}

	/**
	 * Creates a new ConstraintVertex object.
	 * 
	 * @param relativeContext
	 *            the parent xpath context
	 * @param instanceNode
	 *            the instance item this constraint is attached to
	 * @param xpathExpression
	 *            the xpath expression from the bind Element
	 */
	public CustomVertex(BetterFormXPathContext relativeContext,
			Node instanceNode, String xpathExpression, String prefix) {
		super(relativeContext, instanceNode, xpathExpression);
		this.prefix = prefix;
	}

	/**
	 * returns the type of Vertex
	 * 
	 * @return the type of Vertex
	 */
	public short getVertexType() {
		return CUSTOM_VERTEX;
	}

	/**
	 * evaluates xpath expression in context of its parent context
	 * (relativeContext).
	 * 
	 * @throws XFormsException
	 */
	public void compute() throws XFormsException {

		String result = XPathCache.getInstance().evaluateAsString(relativeContext,
				"string(" + this.xpathExpression + ")");

		ModelItem modelItem = (ModelItem) this.instanceNode.getUserData("modelItem");
		modelItem.getLocalUpdateView().getCustomMIPValues().put(prefix, result);	

//		if (result) {
//			modelItem.getRefreshView().setDifferentMarker();
//		} else {
//			modelItem.getRefreshView().setIdenticalMarker();
//		}

		if (LOGGER.isDebugEnabled()) {
			LOGGER.debug("evaluated expression '" + this.xpathExpression
					+ "' to '" + result + "'");
		}
	}

	/**
	 * overwrites object toString().
	 * 
	 * @return Vertex info as String
	 */
	public String toString() {
		return super.toString() + " - diff(" + this.xpathExpression + ")";
	}
}

// end of class
