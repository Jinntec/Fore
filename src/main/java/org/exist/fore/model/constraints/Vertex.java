/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.model.constraints;

import org.exist.fore.util.DOMUtil;
import org.exist.fore.XFormsException;
import org.exist.fore.xpath.BetterFormXPathContext;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.w3c.dom.Node;

import java.util.Enumeration;
import java.util.Vector;


/**
 * A base class for vertices used in the recalculation sequence algorithm.
 *
 * @author This code is based on the ideas of Mikko Honkala from the X-Smiles project.
 *         Although it has been heavily refactored and rewritten to meet our needs.
 * @version $Id: Vertex.java 3253 2008-07-08 09:26:40Z lasse $
 */
public abstract class Vertex {
    private static Log LOGGER = LogFactory.getLog(Vertex.class);

    /**
     * constant for calculate Vertex
     */
    public static final short CALCULATE_VERTEX = 1;

    /**
     * constant for relevant Vertex
     */
    public static final short RELEVANT_VERTEX = 2;

    /**
     * constant for readonly Vertex
     */
    public static final short READONLY_VERTEX = 3;

    /**
     * constant for required Vertex
     */
    public static final short REQUIRED_VERTEX = 4;

    /**
     * constant for constraint Vertex
     */
    public static final short CONSTRAINT_VERTEX = 5;
    
    /**
     * constant for custom Vertex
     */
    public static final short CUSTOM_VERTEX = 6;

    //    protected Vertex index;

    /**
     * the parent XPathContext used for evaluation of this Vertex
     */
    protected BetterFormXPathContext relativeContext = null;

    /**
     * the instance node this Vertex is attached to
     */
    protected Node instanceNode = null;

    /**
     * the value of the Model Item Property
     */
    protected String xpathExpression = null;

    /**
     * list of referencees
     */
    protected Vector depList; //should be array?

    /**
     * flag used to avoid duplicates
     */
    protected boolean wasAlreadyInGraph = false;

    /**
     * is 0 if this Vertex is not dependent on any other, otherwise the count of Vertices this Vertex depends on.
     */
    protected int inDegree;

    /**
     * Creates a new Vertex object.
     *
     * @param relativeContext __UNDOCUMENTED__
     * @param instanceNode    __UNDOCUMENTED__
     * @param xpathExpression __UNDOCUMENTED__
     */
    public Vertex(BetterFormXPathContext relativeContext, Node instanceNode, String xpathExpression) {
        this.relativeContext = relativeContext;
        this.instanceNode = instanceNode;
        this.xpathExpression = xpathExpression;
        this.depList = new Vector();

        //        this.visited = false;
        this.inDegree = 0;

        //        this.index = null;
    }

    /**
     * to be overwritten by subclass to signal the Vertextype.
     *
     * @return a constant defining Vertex type
     */
    public abstract short getVertexType();

    public Node getInstanceNode(){
        return this.instanceNode;
    }

    /**
     * to be overwritten by subclass to evaluate the xpath expression in context
     * of its parent context (relativeContext).
     */
    public abstract void compute() throws XFormsException;

    /**
     * returns xpath expression for this Vertex.
     *
     * @return xpath expression for this Vertex
     */
    public String getXPathExpression() {
        return this.xpathExpression;
    }

    public void setXpathExpression(String expr){
        this.xpathExpression = expr;
    }
    /**
     * adds a dependent Vertex to the depList
     *
     * @param to the Vertex to add to the dependents
     */
    public void addDep(Vertex to) {
        // 1. A vertex will be added to a depList only once
        // 2. Vertex v is excluded from its own depList to allow self-references
        // to occur without causing a circular reference exception.
        if (this.depList.contains(to) || (this == to)) {
            return;
        }

        this.depList.addElement(to);
        to.inDegree++;
    }

    /**
     * returns true, if instanceNode and xpath expression are the same.
     *
     * @param object the Vertex object to compare
     * @return true, if instanceNode and xpath expression are the same.
     */
    public boolean equals(Object object) {
        if (object == null) {
            return false;
        }

        if (!(object instanceof Vertex)) {
            return false;
        }

        Vertex v = (Vertex) object;

        return this.instanceNode.equals(v.instanceNode) && this.xpathExpression.equals(v.xpathExpression) &&
                (getVertexType() == v.getVertexType());
    }

    /**
     * recursively prints some debug info.
     *
     * @param level the level of the graph to print
     */
    public void print(int level) {
        if(LOGGER.isDebugEnabled()){
            for (int i = 0; i < level; i++) {
                System.out.print("\t");
            }

            System.out.println(this.getClass().getName() + ": " + this.instanceNode.getNodeName() + " = '" +
                    this.instanceNode.getTextContent() + "' inDegree:" + inDegree);

            Enumeration enumeration = depList.elements();

            while (enumeration.hasMoreElements()) {
                Vertex v = (Vertex) enumeration.nextElement();
                v.print(level + 1);
            }
        }
    }

    @Override
    public String toString() {
        return DOMUtil.getCanonicalPath(this.instanceNode);
    }
}

//end of class


