/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.model.constraints;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.exist.fore.xpath.BetterFormXPathContext;
import org.w3c.dom.Node;

import java.util.Iterator;
import java.util.List;

/**
 * Builds the pertinent subdependency graph.
 *
 *
 * @author This code is based on the ideas of Mikko Honkala from the X-Smiles project.
 *         Although it has been heavily refactored and rewritten to meet our needs.
 * @version $Id: SubGraph.java 3253 2008-07-08 09:26:40Z lasse $
 */
public class SubGraph extends DependencyGraph {

    private static Log LOGGER = LogFactory.getLog(SubGraph.class);

    /**
     * Creates a new SubGraph object.
     */
    public SubGraph() {
        super();
    }

    /**
     * Creates the Pertinent Dependency Subgraph.
     *
     * @param changedVertices the list of changed vertices
     */
    public void constructSubDependencyGraph(List changedVertices) {
        constructSubDependencyGraph(null, changedVertices);
    }

    /**
     * builds the pertinent subdependency graph
     *
     * @param clonedParent    - the other side of the edge
     * @param changedVertices - a list of changed vertices
     */
    private void constructSubDependencyGraph(Vertex clonedParent, List changedVertices) {
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("constructSubDependencyGraph: processing " + (clonedParent != null ? (clonedParent + " with ") : "") + changedVertices.size() + " changed vertices");
        }

        Vertex originalVertex;
        Vertex clonedVertex;
        int index;
        Iterator iterator = changedVertices.iterator();
        while (iterator.hasNext()) {
            originalVertex = (Vertex) iterator.next();
            index = this.vertices.indexOf(originalVertex);

            if (index < 0) {
                // not visited yet ...
            	if (originalVertex.getVertexType() == Vertex.CUSTOM_VERTEX) {
            		clonedVertex = createSubVertex(originalVertex.relativeContext, originalVertex.instanceNode, originalVertex.xpathExpression, originalVertex.getVertexType(), ((CustomVertex) originalVertex).getPrefix());	
            	} else {
            		clonedVertex = createSubVertex(originalVertex.relativeContext, originalVertex.instanceNode, originalVertex.xpathExpression, originalVertex.getVertexType(), null);
            	}
            	this.vertices.add(clonedVertex);

                if (clonedParent != null) {
                    clonedParent.addDep(clonedVertex);
                }

                if (originalVertex.depList != null) {
                    constructSubDependencyGraph(clonedVertex, originalVertex.depList);
                }
            } else {
                // ... already visited
                if (clonedParent != null) {
                    clonedParent.addDep((Vertex) this.vertices.elementAt(index));
                }
            }
        }
    }

    /**
     * create a new Vertex of the specified type.
     *
     * @param relativeContext - the evaluation context for the vertex
     * @param instanceNode    - the instanceNode associated with this vertex
     * @param expression      - a xpath expression to evaluate with the context
     * @param property        - the type of vertex
     * @return a new vertex of specified type
     */
    private Vertex createSubVertex(BetterFormXPathContext relativeContext, Node instanceNode, String expression,
                                   short property, String prefix) {
        Vertex v = null;

        switch (property) {
            case Vertex.CALCULATE_VERTEX:
                v = new CalculateVertex(relativeContext, instanceNode, expression);

                break;

            case Vertex.RELEVANT_VERTEX:
                v = new RelevantVertex(relativeContext, instanceNode, expression);

                break;

            case Vertex.READONLY_VERTEX:
                v = new ReadonlyVertex(relativeContext, instanceNode, expression);

                break;

            case Vertex.CONSTRAINT_VERTEX:
                v = new ConstraintVertex(relativeContext, instanceNode, expression);

                break;

            case Vertex.REQUIRED_VERTEX:
                v = new RequiredVertex(relativeContext, instanceNode, expression);

                break;
                
            case Vertex.CUSTOM_VERTEX:
                v = new CustomVertex(relativeContext, instanceNode, expression, prefix);

                break;
        }

        return v;
    }
}

//end of class

