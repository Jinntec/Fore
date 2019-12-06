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
 * The <code>readonly</code> vertex implementation used in the recalculation
 * sequence algorithm.
 *
 * @author This code is based on the ideas of Mikko Honkala from the X-Smiles
 *         project. Although it has been heavily refactored and rewritten to
 *         meet our needs.
 * @version $Id: ReadonlyVertex.java 3253 2008-07-08 09:26:40Z lasse $
 */
public class ReadonlyVertex extends Vertex {
    private static Log LOGGER = LogFactory.getLog(ReadonlyVertex.class);

    /**
     * Creates a new ReadonlyVertex object.
     *
     * @param relativeContext the parent xpath context
     * @param instanceNode the instance item this constraint is attached to
     * @param xpathExpression the xpath expression from the bind Element
     */
    public ReadonlyVertex(BetterFormXPathContext relativeContext, Node instanceNode, String xpathExpression) {
        super(relativeContext, instanceNode, xpathExpression);
    }

    /**
     * returns the type of Vertex
     *
     * @return the type of Vertex
     */
    public short getVertexType() {
        return READONLY_VERTEX;
    }

    /**
     * evaluates xpath expression in context of its parent context
     * (relativeContext).
     * @throws XFormsException 
     */
    public void compute() throws XFormsException {
        boolean result = XPathCache.getInstance().evaluateAsBoolean(relativeContext, "boolean(" + this.xpathExpression + ")");
        ModelItem modelItem = (ModelItem) this.instanceNode.getUserData("modelItem");
        modelItem.getLocalUpdateView().setLocalReadonly(result);

        if(result){
            modelItem.getRefreshView().setReadonlyMarker();
        }else{
            modelItem.getRefreshView().setReadWriteMarker();
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
        return super.toString() + " - readonly(" + this.xpathExpression + ")";
    }
}

// end of class
