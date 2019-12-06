/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.model.constraints;

import org.exist.fore.XFormsException;
import org.exist.fore.model.Instance;
import org.exist.fore.xpath.BetterFormXPathContext;
import org.exist.fore.xpath.XPathCache;
import org.exist.fore.xpath.XPathUtil;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.w3c.dom.Node;

import java.util.*;


/**
 * Superclass for Dependency Checking.
 * <p/>
 *
 * @author This code is based on the ideas of Mikko Honkala from the X-Smiles project.
 *         Although it has been heavily refactored and rewritten to meet our needs.
 * @version $Id: DependencyGraph.java 3253 2008-07-08 09:26:40Z lasse $
 */
public class DependencyGraph {
    /**
     * Logger
     */
    private static Log LOGGER = LogFactory.getLog(DependencyGraph.class);

    /**
     * holds all vertices for a model
     */
    protected Vector vertices;

    /**
     * Creates a new DependencyGraph object.
     */
    public DependencyGraph() {
        this.vertices = new Vector();
    }

    /**
     * returns a Vertex of given type that is attached to a given instanceNode
     *
     * @param instanceNode the instance data node to check for Vertex
     * @param property     the wanted Model Item Property
     * @return returns the matching Vertex object or null if not found
     */
    public Vertex getVertex(Node instanceNode, short property, String key) {
        Enumeration enumeration = vertices.elements();

        while (enumeration.hasMoreElements()) {
            Vertex v = (Vertex) enumeration.nextElement();
            boolean equalNodes = v.instanceNode == instanceNode;
            boolean equalTypes = v.getVertexType() == property;

            if (equalNodes && equalTypes) {
            	if (v.getVertexType() == Vertex.CUSTOM_VERTEX && !((CustomVertex) v).getPrefix().equals(key)) {
            	 	// No identical 'key' for custom vertex so continue loop
            	} else {
            		return v;
            	}
            }
        }

        return null;
    }

    /**
     * determines which nodes are referenced by given xpath expression and returns them as nodes.
     *
     * @param xpath - the xpath expression under examination
     * @return a list with nodes referenced in given xpath
     */
    public Vector getXPathRefNodes(BetterFormXPathContext relativeContext, String xpath, Set references) throws XFormsException {
        if(references == null) return null;

        Vector refNodes = new Vector();
        Iterator pathes = references.iterator();

        while (pathes.hasNext()) {
            String refPath = pathes.next().toString();

            List resultSet = XPathCache.getInstance().evaluate(relativeContext, refPath);

            for (int i = 0; i < resultSet.size(); ++i) {
                Node node = (Node) XPathUtil.getAsNode(resultSet, i + 1);
                ModelItem modelItem = null;
                if (node != null) {
                    modelItem = (ModelItem) node.getUserData("");
                }

                if (modelItem == null && node != null) {
                    modelItem = Instance.createModelItem(node);
                }

                if (modelItem != null) {
                    // add *existing* reference node
                    refNodes.add(modelItem.getNode());
                }
            }
        }

        return refNodes;
    }

    /**
     * constructs edges for dependency graph.
     *
     * @param from connecting Vertex
     * @param to   connected Vertex
     */
    public void addEdge(Vertex from, Vertex to) {
        from.addDep(to);

        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("addEdge: from " + from + " to " + to);
        }
    }

    /**
     * adds a new vertex to the graph.
     * If the vertex v already exists in graph:
     * - if v.bind == null, then update v.bind = bind
     * This is called by MainDependencyGraph.addBind()
     */
    public Vertex addVertex(BetterFormXPathContext relativeContext, Node instanceNode, String xpathExpression, short property, String customMIP) {
    	// CustomMIP is 'null' in case of 'normal' vertices
        Vertex v = this.getVertex(instanceNode, property, customMIP);
        
        if (v != null) {
            String s = v.toString();
            v.wasAlreadyInGraph = true;

            // set value of pre-built vertex. vertices are pre-built when
            // they are referenced before their bind is processed
            if (v.relativeContext == null) {
                v.relativeContext = relativeContext;
                v.xpathExpression = xpathExpression;
            }
            
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug("addVertex: found vertex " + s + ", changed to " + v);
            }
            
            if(customMIP != null) {
            	if (LOGGER.isDebugEnabled()) {
                    LOGGER.debug("         : customMIP " + customMIP);
                }
            }


            return v;
        }

        switch (property) {
            case Vertex.CALCULATE_VERTEX:
                v = new CalculateVertex(relativeContext, instanceNode, xpathExpression);

                break;

            case Vertex.RELEVANT_VERTEX:
                v = new RelevantVertex(relativeContext, instanceNode, xpathExpression);

                break;

            case Vertex.READONLY_VERTEX:
                v = new ReadonlyVertex(relativeContext, instanceNode, xpathExpression);

                break;

            case Vertex.CONSTRAINT_VERTEX:
                v = new ConstraintVertex(relativeContext, instanceNode, xpathExpression);

                break;

            case Vertex.REQUIRED_VERTEX:
                v = new RequiredVertex(relativeContext, instanceNode, xpathExpression);

                break;
                
/*
            case Vertex.CUSTOM_VERTEX:
                v = new CustomVertex(relativeContext, instanceNode, xpathExpression, customMIP);

                break;
*/
        }

        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("created vertex for Node " + v);
        }

        vertices.addElement(v);

        return v;
    }

    /**
     * adds a Vertex to the pool hold by this object. Will add no duplicates to the collection.
     *
     * @param v the Vertex to add
     */
    private void addVertex(Vertex v) {
        if (!vertices.contains(v)) {
            vertices.addElement(v);
        }
    }

    /**
     * print the list of vertices
     */
/*
    public void printGraph() {
        Enumeration enumeration = vertices.elements();

        while (enumeration.hasMoreElements()) {
            Vertex v = (Vertex) enumeration.nextElement();

            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug("Next vertex:");
            }

            v.print(0);
        }
    }
*/

    /**
     * recalculates this graph.
     *
     * @throws XFormsException
     */
    public void recalculate() throws XFormsException {
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("recalculate: starting ...");
        }

        // remove non zero vertices
        this.removeNonZeroVertices();

        while (this.vertices.size() > 0) {
            // remove a vertex v from Z
            Vertex v = (Vertex) this.vertices.firstElement();
            this.removeVertex(v);
            v.compute();

            Enumeration enumeration = v.depList.elements();

            while (enumeration.hasMoreElements()) {
                Vertex w = (Vertex) enumeration.nextElement();
                w.inDegree--;

                if (w.inDegree == 0) {
                    this.addVertex(w);
                }
            }
        }

        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("recalculate: finished");
        }
    }

    private void removeNonZeroVertices() {
        Vector nonzeros = new Vector();
        Enumeration enumeration = vertices.elements();

        while (enumeration.hasMoreElements()) {
            Vertex v = (Vertex) enumeration.nextElement();

            if (v.inDegree > 0) {
                nonzeros.addElement(v);
            }
        }

        enumeration = nonzeros.elements();

        while (enumeration.hasMoreElements()) {
            Vertex v = (Vertex) enumeration.nextElement();
            this.removeVertex(v);
        }
    }

    /**
     * removes a Vertex from the collection.
     *
     * @param v the Vertex to remove
     */
    protected void removeVertex(Vertex v) {
        this.vertices.removeElement(v);
    }
}
