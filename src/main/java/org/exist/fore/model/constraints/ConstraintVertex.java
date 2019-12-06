/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.model.constraints;

import org.exist.fore.util.DOMUtil;
import org.exist.fore.XFormsException;
import org.exist.fore.xpath.BetterFormXPathContext;
import org.exist.fore.xpath.XPathCache;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.w3c.dom.Node;

import java.util.ArrayList;
import java.util.List;

/**
 * The <code>constraint</code> vertex implementation used in the recalculation
 * sequence algorithm.
 *
 * @author This code is based on the ideas of Mikko Honkala from the X-Smiles
 *         project. Although it has been heavily refactored and rewritten to
 *         meet our needs.
 * @version $Id: ConstraintVertex.java 3253 2008-07-08 09:26:40Z lasse $
 */
public class ConstraintVertex extends Vertex {
    private static Log LOGGER = LogFactory.getLog(ConstraintVertex.class);

    /**
     * Creates a new ConstraintVertex object.
     *
     * @param relativeContext the parent xpath context
     * @param instanceNode the instance item this constraint is attached to
     * @param xpathExpression the xpath expression from the bind Element
     */
    public ConstraintVertex(BetterFormXPathContext relativeContext, Node instanceNode, String xpathExpression) {
        super(relativeContext, instanceNode, xpathExpression);
    }

    /**
     * returns the type of Vertex
     *
     * @return the type of Vertex
     */
    public short getVertexType() {
        return CONSTRAINT_VERTEX;
    }

    /**
     * evaluates xpath expression in context of its parent context
     * (relativeContext).
     * @throws XFormsException 
     */
    public void compute() throws XFormsException {

        ModelItem modelItem = (ModelItem) this.instanceNode.getUserData("modelItem");
        DeclarationView declarationView = modelItem.getDeclarationView();

        boolean finalResult=true;
        String expr=null;
        boolean evaluates=true;
        List <Constraint> failed=new ArrayList();
        List <Constraint> constraints = declarationView.getConstraints();
        for (int i = 0; i < constraints.size(); i++) {
            Constraint c =  constraints.get(i);
            expr = c.getXPathExpr();
            if(LOGGER.isDebugEnabled()){
                LOGGER.debug("computing constraint for: " + expr);
            }
            evaluates= XPathCache.getInstance().evaluateAsBoolean(relativeContext, "boolean(" + expr + ")");
            if(LOGGER.isDebugEnabled()){
                LOGGER.debug("computed:" + evaluates);
            }
            if(!evaluates){
                c.setInvalid();
                failed.add(c);  //store failed Constraint for later usage during refresh to build alerts
            }
        }

        if(failed.size() != 0){
            finalResult = false; //if any of the Constraints failed the final result is 'false' (ALL constraints must be true)
        }

//        boolean result = XPathCache.getInstance().evaluateAsBoolean(relativeContext, "boolean(" + this.xpathExpression + ")");
        modelItem.getLocalUpdateView().setConstraintValid(finalResult);

        if(finalResult){
            modelItem.getRefreshView().setValidMarker();
        }else{
            modelItem.getRefreshView().setInvalidMarker();
            modelItem.getRefreshView().setInvalids(failed);
        }

        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("evaluated expression '" + this.xpathExpression + "' for XPath:" + DOMUtil.getCanonicalPath((Node) modelItem.getNode()) + " with value '" + modelItem.getNode() + "' to '" + finalResult + "'");
        }
    }

    /**
     * overwrites object toString().
     *
     * @return Vertex info as String
     */
    public String toString() {
        return super.toString() + " - constraint(" + this.xpathExpression + ")";
    }
}

// end of class
