/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
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
 * The <code>relevant</code> vertex implementation used in the recalculation
 * sequence algorithm.
 *
 * @author This code is based on the ideas of Mikko Honkala from the X-Smiles
 *         project. Although it has been heavily refactored and rewritten to
 *         meet our needs.
 * @version $Id: RelevantVertex.java 3253 2008-07-08 09:26:40Z lasse $
 */
public class RelevantVertex extends Vertex {
    private static Log LOGGER = LogFactory.getLog(RelevantVertex.class);

    /**
     * Creates a new RelevantVertex object.
     *
     * @param relativeContext the parent xpath context
     * @param instanceNode the instance item this constraint is attached to
     * @param xpathExpression the xpath expression from the bind Element
     */
    public RelevantVertex(BetterFormXPathContext relativeContext, Node instanceNode, String xpathExpression) {
        super(relativeContext, instanceNode, xpathExpression);
    }

    /**
     * returns the type of Vertex.
     *
     * @return the type of Vertex
     */
    public short getVertexType() {
        return RELEVANT_VERTEX;
    }

    /**
     * evaluates xpath expression in context of its parent context
     * (relativeContext).
     * @throws XFormsException 
     */
    public void compute() throws XFormsException {
        boolean result = XPathCache.getInstance().evaluateAsBoolean(relativeContext, "boolean(" + this.xpathExpression + ")");
        ModelItem modelItem = (ModelItem) this.instanceNode.getUserData("modelItem");
        modelItem.getLocalUpdateView().setLocalRelevant(result);
        if(result){
            modelItem.getRefreshView().setEnabledMarker();
        }else{
            modelItem.getRefreshView().setDisabledMarker();
        }

        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("evaluated expression '" + this.xpathExpression + "' to '" + result + "'");
        }
    }

    /**
     * overwrites object toString().
     *
     * @return Vertex info as String
     */
    public String toString() {
        return super.toString() + " - relevant(" + this.xpathExpression + ")";
    }
}

// end of class
