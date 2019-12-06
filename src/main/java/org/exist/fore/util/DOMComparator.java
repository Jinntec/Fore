/*
 * eXist Open Source Native XML Database
 * Copyright (C) 2001-2019 The eXist Project
 * http://exist-db.org
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

package org.exist.fore.util;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.util.Iterator;
import java.util.List;

/**
 * The DOM Comparator provides a set of comparison methods to check wether
 * two arbitrary DOM nodes may be considered equal. This may be helpful in
 * testing as well as in editing environments.
 * <P>
 * The comparison behaviour is controllable according to whitespace and
 * namespaces. By default, the comparator ignores any whitespace outside
 * element content and is aware of namespaces.
 * <P>
 * <EM>NOTE:</EM> It is strongly recommended to normalize the nodes to be
 * compared <I>before</I> comparison by calling the <CODE>Node.normalize()</CODE>.
 * Since that method may affect changes in the DOM tree, the comparator won't
 * do this to be non-intrusive.
 *
 * @author Ulrich Nicolas Liss&eacute;
 * @author Lars Windauer
 * @version $Id: DOMComparator.java 2009-11-18 18:19:36Z lars $
 */
public class DOMComparator {
    private static final String XMLNS_NS = "http://www.w3.org/2000/xmlns/";


    /**
     * Feature <CODE>ignore-comments</CODE>.
     */
    private boolean ignoreComments = false;

    /**
     * Feature <CODE>ignore-namespace-declarations</CODE>.
     */
    private boolean ignoreNamespaceDeclarations = false;

    /**
     * Feature <CODE>ignore-whitespace</CODE>.
     */
    private boolean ignoreWhitespace = true;

    /**
     * Feature <CODE>namespace-aware</CODE>.
     */
    private boolean namespaceAware = true;

    /**
     * The error handler.
     */
    private ErrorHandler errorHandler = new DefaultErrorHandler();

    /**
     * Constructs an empty DOM Comparator.
     */
    public DOMComparator() {
    }

    // Behaviour control.

    /**
     * Sets the state of comment ignoring.
     *
     * @param state the state of comment ignoring.
     */
    public void setIgnoreComments(boolean state) {
        this.ignoreComments = state;
    }

    /**
     * Sets the state of namespace declaration ignoring.
     *
     * @param state the state of namespace declaration ignoring.
     */
    public void setIgnoreNamespaceDeclarations(boolean state) {
        this.ignoreNamespaceDeclarations = state;
    }

    /**
     * Sets the state of whitespace ignoring.
     *
     * @param state the state of whitespace ignoring.
     */
    public void setIgnoreWhitespace(boolean state) {
        this.ignoreWhitespace = state;
    }

    /**
     * Sets the state of namespace awareness.
     *
     * @param state the state of namespace awareness.
     */
    public void setNamespaceAware(boolean state) {
        this.namespaceAware = state;
    }

    /**
     * Sets the error handler.
     *
     * @param errorHandler the error handler.
     */
    public void setErrorHandler(ErrorHandler errorHandler) {
		this.errorHandler = errorHandler;

		// Ensure error handler
		if (this.errorHandler == null) {
			this.errorHandler = new DefaultErrorHandler();
		}
	}

    // Generic DOM comparison methods.

	/**
     * Compares two nodes for equality.
     * <P>
     * Two nodes are considered to be equal if either both nodes
     * are <CODE>null</CODE> or
     * <UL>
     * <LI>both nodes are not <CODE>null</CODE>, and
     * <LI>both node's types are equal, and
     * <LI>both node's names are equal, and
     * <LI>both node's values are equal, and
     * <LI>both node's attributes are equal, and
     * <LI>both node's children are equal.
     * </UL>
     *
     * @param left  one node.
     * @param right another node.
     * @return <CODE>true</CODE> if both nodes are considered to be
     *         equal, otherwise <CODE>false</CODE>.
     */
    public boolean compare(Node left, Node right) {
        // Compare object references.
        if (left == right) {
            return true;
        }

        // Compare object references.
        if ((left == null) || (right == null)) {
            this.errorHandler.handleError("a node is null", null, left, right);
            return false;
        }

        // Compare node types.
        if (left.getNodeType() != right.getNodeType()) {
            this.errorHandler.handleError("different node types", left.getNodeType() + " vs. " + right.getNodeType(), left, right);
            return false;
        }

        if (this.namespaceAware &&
                ((left.getNodeType() == Node.ATTRIBUTE_NODE) || (left.getNodeType() == Node.ELEMENT_NODE))) {
            // Compare node URIs.
            if (!compare(left.getNamespaceURI(), right.getNamespaceURI())) {
                this.errorHandler.handleError("different namespaces", left.getNamespaceURI() + " vs. " + right.getNamespaceURI(), left, right);
                return false;
            }

            // It is insufficient to compare the local parts only, since
            // parsers handle this issue differently: While no URI is
            // given, a parser may choose to return no local part ...
            if (left.getNamespaceURI() != null) {
                // Compare node locals.
                if (!compare(left.getLocalName(), right.getLocalName())) {
                    this.errorHandler.handleError("different local names", left.getLocalName() + " vs. " + right.getLocalName(), left, right);
                    return false;
                }
            } else {
                // Compare node names.
                if (!compare(left.getNodeName(), right.getNodeName())) {
                    this.errorHandler.handleError("different node names", left.getNodeName() + " vs. " + right.getNodeName(), left, right);
                    return false;
                }
            }
        } else {
            // Compare node names.
            if (!compare(left.getNodeName(), right.getNodeName())) {
                this.errorHandler.handleError("different node names", left.getNodeName() + " vs. " + right.getNodeName(), left, right);
                return false;
            }
        }

        // Compare node values.
        if (!compare(left.getNodeValue(), right.getNodeValue())) {
            this.errorHandler.handleError("different node values", left.getNodeValue() + " vs. " + right.getNodeValue(), left, right);
            return false;
        }

        // Compare node attributes.
        if (!compare(left.getAttributes(), right.getAttributes())) {
            this.errorHandler.handleError("different node attributes", null, left, right);
            return false;
        }

        // Compare node children.
        if (!compare(left.getChildNodes(), right.getChildNodes())) {
            this.errorHandler.handleError("different node children", null, left, right);
            return false;
        }

        // All checks passed successfully.
        return true;
    }

    // Helper and concenience methods.

    /**
     * Compares two node lists for equality.
     * <P>
     * Two node lists are considered to be equal if either both node lists
     * are <CODE>null</CODE> or
     * <UL>
     * <LI>both node lists are not <CODE>null</CODE>, and
     * <LI>both node list's lengths are equal, and
     * <LI>both node list's items are equal, and
     * <LI>both node list's items appear in the same order.
     * </UL>
     *
     * @param left  one node list.
     * @param right another node list.
     * @return <CODE>true</CODE> if both node lists are considered to be
     *         equal, otherwise <CODE>false</CODE>.
     */
    protected boolean compare(NodeList left, NodeList right) {
        // Compare object references.
        if (left == right) {
            return true;
        }

        // Compare object references.
        if ((left == null) || (right == null)) {
            return false;
        }

        // Compare list lengths.
        if ((!this.ignoreComments) && (!this.ignoreWhitespace) && (left.getLength() != right.getLength())) {
            return false;
        }

        // Get next list items.
        int leftIndex = getNextIndex(left, 0);
        int rightIndex = getNextIndex(right, 0);

        while ((leftIndex < left.getLength()) || (rightIndex < right.getLength())) {
            // Compare list items.
            if (!compare(left.item(leftIndex), right.item(rightIndex))) {
                return false;
            }

            // Get next list items.
            leftIndex = getNextIndex(left, leftIndex + 1);
            rightIndex = getNextIndex(right, rightIndex + 1);
        }

        // All checks passed successfully.
        return true;
    }

    /**
     * Compares two node maps for equality.
     * <P>
     * Two node lists are considered to be equal if either both node maps
     * are <CODE>null</CODE> or
     * <UL>
     * <LI>both node maps are not <CODE>null</CODE>, and
     * <LI>both node map's lengths are equal, and
     * <LI>both node map's items are equal with no respect to the order
     * of their appearance.
     * </UL>
     *
     * @param left  one node map.
     * @param right another node map.
     * @return <CODE>true</CODE> if both node maps are considered to be
     *         equal, otherwise <CODE>false</CODE>.
     */
    protected boolean compare(NamedNodeMap left, NamedNodeMap right) {
        // Compare object references.
        if (left == right) {
            return true;
        }

        // Compare object references.
        if ((left == null) || (right == null)) {
            return false;
        }

        // Compare map lengths.
        if (getRealLength(left) != getRealLength(right)) {
            return false;
        }

        if (this.namespaceAware) {
            // Get next map item.
            int index = getNextIndex(left, 0);

            // Initialize empty item.
            Node item = null;

            while (index < left.getLength()) {
                // Get item.
                item = left.item(index);

                // It is insufficient to compare the local parts only, since
                // parsers handle this issue differently: While no URI is
                // given, a parser may choose to return no local part ...
                if (item.getNamespaceURI() != null) {
                    // Compare map items with no respect to the order of their appearance.
                    if (!compare(item, right.getNamedItemNS(item.getNamespaceURI(), item.getLocalName()))) {
                        return false;
                    }
                } else {
                    // Compare map items with no respect to the order of their appearance.
                    if (!compare(item, right.getNamedItem(item.getNodeName()))) {
                        return false;
                    }
                }

                // Get next map item.
                index = getNextIndex(left, index + 1);
            }

            // All checks passed successfully.
            return true;
        }

        for (int index = 0; index < left.getLength(); index++) {
            // Compare map items with no respect to the order of their appearance.
            if (!compare(left.item(index), right.getNamedItem(left.item(index).getNodeName()))) {
                return false;
            }
        }

        // All checks passed successfully.
        return true;
    }

    /**
     * Compares two strings for equality.
     * <P>
     * Two strings are considered to be equal if either both strings
     * are <CODE>null</CODE> or both strings are not <CODE>null</CODE>,
     * and depending on the specified comparison method
     * <UL>
     * <LI>both string's object references of the VM internal string pool
     * are equal, or
     * <LI>both string's hash codes are equal, or
     * <LI>both strings are character-wise equal.
     * </UL>
     *
     * @param left  one string.
     * @param right another string.
     * @return <CODE>true</CODE> if both strings are considered to be
     *         equal, otherwise <CODE>false</CODE>.
     */
    protected final boolean compare(String left, String right) {
        // Compare object references.
        if (left == right) {
            return true;
        }

        // Compare object references.
        if ((left == null) || (right == null)) {
            return false;
        }

        // Compare character by character.
        return left.equals(right);
    }

    /**
     * Returns the index of the next item in the node list to compare.
     * <P>
     * The item choosen depends on the comment and whitespace ignoring.
     *
     * @param list  the node list.
     * @param start the start index.
     * @return the index of the next item in the node list to compare.
     */
    private int getNextIndex(NodeList list, int start) {
        if (this.ignoreComments && this.ignoreWhitespace) {
            // Skip whitespace and comment list items.
            return DOMWhitespace.skipWhitespaceAndComments(list, start);
        }

        if (this.ignoreWhitespace) {
            // Skip whitespace list items.
            return DOMWhitespace.skipWhitespace(list, start);
        }

        if (this.ignoreComments) {
            // Skip comment list items.
            return DOMWhitespace.skipComments(list, start);
        }

        return start;
    }

    /**
     * Returns the index of the next item in the node map to compare.
     * <P>
     * The item choosen depends on the namespace awareness and
     * namespace declaration ignoring.
     *
     * @param map   the node map.
     * @param start the start index.
     * @return the index of the next item in the node map to compare.
     */
    private int getNextIndex(NamedNodeMap map, int start) {
        if (this.namespaceAware && this.ignoreNamespaceDeclarations) {
            for (int index = start; index < map.getLength(); index++) {
                if (!XMLNS_NS.equals(map.item(index).getNamespaceURI())) {
                    // Deliver index.
                    return index;
                }
            }

            // Return original length.
            return map.getLength();
        }

        return start;
    }

    /**
     * Returns the real length of the map to compare.
     * <P>
     * The returned length depends on the namespace awareness and
     * namespace declaration ignoring.
     *
     * @param map the node map.
     * @return the real length of the map to compare.
     */
    private int getRealLength(NamedNodeMap map) {
        if (this.namespaceAware && this.ignoreNamespaceDeclarations) {
            // Initialize difference.
            int difference = 0;

            for (int index = 0; index < map.getLength(); index++) {
                if (XMLNS_NS.equals(map.item(index).getNamespaceURI())) {
                    // Increment difference.
                    difference++;
                }
            }

            // Return computed length.
            return map.getLength() - difference;
        }

        // Return original length.
        return map.getLength();
    }

    public boolean compareSkeleton(Element skeleton, Element dataNode) {
        // Compare object references.
        if (skeleton == dataNode) {
            return true;
        }

        // Compare object references.
        if ((skeleton == null) || (dataNode == null)) {
            this.errorHandler.handleError("a node is null", null, skeleton, dataNode);
            return false;
        }

        // Compare node types.
        if (skeleton.getNodeType() != dataNode.getNodeType()) {
            this.errorHandler.handleError("different node types", skeleton.getNodeType() + " vs. " + dataNode.getNodeType(), skeleton, dataNode);
            return false;
        }

        if (this.namespaceAware && ((skeleton.getNodeType() == Node.ATTRIBUTE_NODE) || (skeleton.getNodeType() == Node.ELEMENT_NODE))) {
            // Compare node URIs.
            if (!compare(skeleton.getNamespaceURI(), dataNode.getNamespaceURI())) {
                this.errorHandler.handleError("different namespaces", skeleton.getNamespaceURI() + " vs. " + dataNode.getNamespaceURI(), skeleton, dataNode);
                return false;
            }

            // It is insufficient to compare the local parts only, since
            // parsers handle this issue differently: While no URI is
            // given, a parser may choose to return no local part ...
            if (skeleton.getNamespaceURI() != null) {
                // Compare node locals.
                if (!compare(skeleton.getLocalName(), dataNode.getLocalName())) {
                    this.errorHandler.handleError("different local names", skeleton.getLocalName() + " vs. " + dataNode.getLocalName(), skeleton, dataNode);
                    return false;
                }
            } else {
                // Compare node names.
                if (!compare(skeleton.getNodeName(), dataNode.getNodeName())) {
                    this.errorHandler.handleError("different node names", skeleton.getNodeName() + " vs. " + dataNode.getNodeName(), skeleton, dataNode);
                    return false;
                }
            }
        } else {
            // Compare node names.
            if (!compare(skeleton.getNodeName(), dataNode.getNodeName())) {
                this.errorHandler.handleError("different node names", skeleton.getNodeName() + " vs. " + dataNode.getNodeName(), skeleton, dataNode);
                return false;
            }
        }

        if(skeleton.hasChildNodes()) {
            List skeletonChilds = DOMUtil.getChildElements(skeleton);
            List dataChilds = DOMUtil.getChildElements(dataNode);
            Iterator dataChildsElements = dataChilds.iterator();
            for(Iterator skeletonChildsElements = skeletonChilds.iterator(); skeletonChildsElements.hasNext();)
            {
                Element skeletonChildElement = (Element)skeletonChildsElements.next();

                Element dataChildElement = (Element)dataChildsElements.next();
                if(!compareSkeleton(skeletonChildElement, dataChildElement) && !(skeletonChildElement.getNodeType() == Node.TEXT_NODE)){
                    return false;
                }
            }
        }
        // All checks passed successfully.
        return true;

    }

    // Static error handler interface

    public static interface ErrorHandler {
    	void handleError(String error, String detail, Node left, Node right);
    }

    public static class DefaultErrorHandler implements ErrorHandler {
        public void handleError(String error, String detail, Node left, Node right) {
            // NOP
        }
    }

    public static class SystemErrorHandler implements ErrorHandler {
        public void handleError(String error, String detail, Node left, Node right) {
            StringBuffer buffer = new StringBuffer();
            buffer.append(error);
            if (detail != null) {
                buffer.append(" [");
                buffer.append(detail);
                buffer.append("]");
            }
            buffer.append(": left='");
            buffer.append(left == null ? "#null" : left.getNodeName());
            buffer.append("' right='");
            buffer.append(right == null ? "#null" : right.getNodeName());
            buffer.append("'");

            System.err.println(buffer);
        }
    }

}
