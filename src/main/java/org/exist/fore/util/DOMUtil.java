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

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.w3c.dom.*;
import org.w3c.dom.traversal.NodeFilter;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMResult;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.*;
import java.util.ArrayList;
import java.util.List;

/**
 * some DOM utility methods.
 *
 * @author joern turner
 * @author vrg
 * @author Ronald van Kuijk
 * @version $Id: DOMUtil.java 3476 2008-08-18 21:53:47Z joern $
 */
public class DOMUtil {
	
	private static Log LOGGER = LogFactory.getLog(DOMUtil.class);


/*
    public static Node getFragment(URI uri, InputStream xmlStream) throws XFormsException {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setValidating(false);
        Document document = null;
        try {
            document = parseInputStream(xmlStream, true, false);
        } catch (ParserConfigurationException e) {
            throw new XFormsException(e);
        } catch (SAXException e) {
            throw new XFormsException(e);
        } catch (IOException e) {
            throw new XFormsException(e);
        }

        if (uri.getFragment() != null) {
            String fragment = uri.getFragment();
            if(fragment.indexOf("?") != -1){
                fragment = fragment.substring(0,fragment.indexOf("?"));
            }
            return getById(document,fragment);
        }

        return document;
    }
*/


/*
    public static Node getById(Document in, String fragmentId) throws XFormsException {
        Node node = XPathUtil.evaluateAsSingleNode(in, "//*[@id eq '" + fragmentId + "']");
        return node;
    }
*/

    /**
     * __UNDOCUMENTED__
     *
     * @param start __UNDOCUMENTED__
     * @param name  __UNDOCUMENTED__
     * @return __UNDOCUMENTED__
     */
    public static Element getChildElement(Node start, String name) {
        //        NodeList nl=start.getChildNodes();
        NodeList nl = null;

        if (start.getNodeType() == Node.DOCUMENT_NODE) {
            nl = ((Document) start).getDocumentElement().getChildNodes();
        } else {
            nl = start.getChildNodes();
        }

        int len = nl.getLength();
        Node n = null;

        for (int i = 0; i < len; i++) {
            n = nl.item(i);

            if (n.getNodeType() == Node.ELEMENT_NODE) {
                if (n.getNodeName().equals(name)) {
                    return (Element) n;
                }
            }
        }

        return null;
    }

    /**
     * returns the xpath from the start-element up to the document-root
     *
     * @return - returns the xpath from-element up to the document-root.
     * The start element is included.
     */

    //    public static String getPath(Node start) {
    //        String path=null;
    //
    //        if(start.getNodeType()==Node.ELEMENT_NODE || start.getNodeType()==Node.ATTRIBUTE_NODE) {
    //
    ////            path=start.getNodeName();
    //
    //            Node n=start;
    //            while(n.getParentNode()!=null) {
    //                path=n.getNodeName() + "/" + path;
    //            }
    //
    //        }
    //        return path;
    //    }

    /**
     * returns a java.util.List of Elements which are children of the start Element.
     */
    public static List getChildElements(Node start) {
        List l = new ArrayList();
        NodeList nl = start.getChildNodes();
        int len = nl.getLength();
        Node n = null;

        for (int i = 0; i < len; i++) {
            n = nl.item(i);

            if (n.getNodeType() == Node.ELEMENT_NODE) {
                l.add(n);
            }
        }

        return l;
    }

    /**
     * returns a java.util.List of Elements which are children of the start Element.
     */
    public static List getChildElementsByTagName(Node start, String tagName) {
        List l = new ArrayList();
        NodeList nl = start.getChildNodes();
        int len = nl.getLength();
        Node n = null;

        for (int i = 0; i < len; i++) {
            n = nl.item(i);

            if (n.getNodeType() == Node.ELEMENT_NODE && n.getNodeName().equalsIgnoreCase(tagName)) {
                l.add(n);
            }
        }

        return l;
    }

    /**
     * returns an element's position in the given NodeList
     *
     * @param refNode the element to get the index for
     * @param list    the NodeList to search
     * @return the position starting with 1, or -1 if refNode was null
     */
    public static int getCurrentListPosition(Node refNode, NodeList list) {
        if (refNode == null) {
            return -1;
        }

        int counter = 1;

        for (int n = 0; n < list.getLength(); n++, counter++) {
            if (list.item(n) == refNode) {
                return counter;
            }
        }

        return -1;
    }

    /**
     * returns an element's position in the list of its siblings.
     *
     * @param refNode the element to get the index for
     * @return the position starting with 1, or -1 if refNode was null
     */
    public static int getCurrentPosition(Node refNode) {
        if (refNode == null) {
            return -1;
        }

        int counter = 0;
        Node current = refNode;

        while (current != null) {
            if (current.getNodeType() == Node.ELEMENT_NODE) {
                counter++;
            }

            current = current.getPreviousSibling();
        }

        return counter;
    }

    public static int getCurrentNodesetPosition(Node refNode) {
        if (refNode == null) {
            return -1;
        }

        int counter = 0;
        Node current = refNode;
        String nodeName = refNode.getNodeName();
        while (current != null) {

            if (current.getNodeType() == Node.ELEMENT_NODE && nodeName.equals(current.getNodeName())) {
                counter++;
            }

            current = current.getPreviousSibling();
        }

        return counter;
    }

    /**
     * equivalent to the XPath expression './/tagName[@attrName='attrValue']'
     */
    public static Element getElementByAttributeValue(Node start, String tagName, String attrName,
                                                     String attrValue) {
        NodeList nl = ((Element) start).getElementsByTagName(tagName);
        int l = nl.getLength();

        if (l == 0) {
            return null;
        }

        Element e = null;
        String compareValue = null;

        for (int i = 0; i < l; i++) {
            e = (Element) nl.item(i);

            if (e.getNodeType() == Node.ELEMENT_NODE) {
                compareValue = e.getAttribute(attrName);

                if (compareValue.equals(attrValue)) {
                    return e;
                }
            }
        }

        return null;
    }

    /**
     * equivalent to the XPath expression './/tnuri:tagName[@anuri:attrName='attrValue']'
     */
    public static Element getElementByAttributeValueNS(Node start, String tnuri, String tagName,
                                                       String anuri, String attrName, String attrValue) {
        NodeList nl = ((Element) start).getElementsByTagNameNS(tnuri, tagName);

        if (nl != null) {
            int l = nl.getLength();

            if (l == 0) {
                return null;
            }

            Element e = null;
            String compareValue = null;

            for (int i = 0; i < l; i++) {
                e = (Element) nl.item(i);

                if (e.getNodeType() == Node.ELEMENT_NODE) {
                    compareValue = e.getAttributeNS(anuri, attrName);

                    if (compareValue.equals(attrValue)) {
                        return e;
                    }
                }
            }
        }

        return null;
    }

    /**
     * returns the first child of the contextnode which has the specified tagname regardless of the depth in the tree.
     *
     * @param contextNode where to start the search
     * @param tag         the name of the wanted child
     * @return the first child found under the contextnode
     */
    public static Node getFirstChildByTagName(Node contextNode, String tag) {
        Node n = null;

        if (contextNode.getNodeType() == Node.DOCUMENT_NODE) {
            n = ((Document) contextNode).getDocumentElement();

            if (!n.getNodeName().equals(tag)) {
                n = null;
            }
        } else {
            NodeList nodes = ((Element) contextNode).getElementsByTagName(tag);

            if (nodes != null) {
                n = nodes.item(0);
            }
        }

        return n;
    }

    /**
     * returns the first child of the contextnode which has the specified tagname and namespace uri regardless of the
     * depth in the tree.
     *
     * @param contextNode where to start the search
     * @param nsuri       the namespace uri
     * @param tag         the local name part of the wanted child
     * @return the first child found under the contextnode
     * todo: should return Element instead of Node
     */
    public static Node getFirstChildByTagNameNS(Node contextNode, String nsuri, String tag) {
        Node n = null;

        if (contextNode.getNodeType() == Node.DOCUMENT_NODE) {
            n = ((Document) contextNode).getDocumentElement();

            if (!(n.getNamespaceURI().equals(nsuri) && n.getNodeName().equals(tag))) {
                n = null;
            }
        } else {
            NodeList nodes = ((Element) contextNode).getElementsByTagNameNS(nsuri, tag);

            if (nodes != null) {
                n = nodes.item(0);
            }
        }

        return n;
    }

    /**
     * gets the first child of a node which is an element. This avoids the whitespace problems when using
     * org.w3c.dom.node.getFirstChild(). Whitespace-nodes may also appear as children, but normally are not what you're
     * looking for.
     */
    public static Element getFirstChildElement(Node start) {
        Node n = null;
        NodeList nl = start.getChildNodes();
        int len = nl.getLength();

        if (len == 0) {
            return null;
        }

        for (int i = 0; i < len; i++) {
            n = nl.item(i);

            if (n.getNodeType() == Node.ELEMENT_NODE) {
                return ((Element) n);
            }
        }

        return null;
    }

    /**
     * __UNDOCUMENTED__
     *
     * @param start __UNDOCUMENTED__
     * @return __UNDOCUMENTED__
     */
    public static Element getLastChildElement(Node start) {
        NodeList children = start.getChildNodes();

        if (children != null) {
            int len = children.getLength();
            Node n = null;

            for (int i = len - 1; i >= 0; i--) {
                n = children.item(i);

                if (n.getNodeType() == Node.ELEMENT_NODE) {
                    return ((Element) n);
                }
            }
        }

        return null;
    }

    /**
     * Returns the next sibling element of the specified node.
     * <p/>
     * If there is no such element, this method returns <code>null</code>.
     *
     * @param node the node to process.
     * @return the next sibling element of the specified node.
     */
    public static Element getNextSiblingElement(Node node) {
        Node sibling = node.getNextSibling();

        if ((sibling == null) || (sibling.getNodeType() == Node.ELEMENT_NODE)) {
            return (Element) sibling;
        }

        return getNextSiblingElement(sibling);
    }

    /**
     * __UNDOCUMENTED__
     *
     * @param nodeToCompare __UNDOCUMENTED__
     * @param nsuri         __UNDOCUMENTED__
     * @param tagName       __UNDOCUMENTED__
     * @return __UNDOCUMENTED__
     */
    public static boolean isNodeInNS(Node nodeToCompare, String nsuri, String tagName) {
        String ntcnsuri = nodeToCompare.getNamespaceURI();

        if ((ntcnsuri != null) && (ntcnsuri.length() > 0)) {
            return (tagName.equals(nodeToCompare.getLocalName()) && ntcnsuri.equals(nsuri));
        } else {
            return (tagName.equals(nodeToCompare.getNodeName()));
        }
    }

    /**
     * Returns the previous sibling element of the specified node.
     * <p/>
     * If there is no such element, this method returns <code>null</code>.
     *
     * @param node the node to process.
     * @return the previous sibling element of the specified node.
     */
    public static Element getPreviousSiblingElement(Node node) {
        Node sibling = node.getPreviousSibling();

        if ((sibling == null) || (sibling.getNodeType() == Node.ELEMENT_NODE)) {
            return (Element) sibling;
        }

        return getPreviousSiblingElement(sibling);
    }

    /**
     * gets the first child of a node which is a text or cdata node.
     */
    public static Node getTextNode(Node start) {
        Node n = null;

        start.normalize();

        NodeList nl;
        if (start.getNodeType() == Node.DOCUMENT_NODE) {
            nl = ((Document) start).getDocumentElement().getChildNodes();
        } else {
            nl = start.getChildNodes();
        }

        int len = nl.getLength();

        if (len == 0) {
            return null;
        }

        for (int i = 0; i < len; i++) {
            n = nl.item(i);

            if (n.getNodeType() == Node.TEXT_NODE) {
                return n;
            } else if (n.getNodeType() == Node.CDATA_SECTION_NODE) {
                return n;
            }
        }

        return null;
    }

    /**
     * returns the Text-Node child of Node 'start' as String. If no TextNode exists, an empty string is returned.
     */
    public static String getTextNodeAsString(Node start) {
        Node txt = getTextNode(start);

        if (txt != null) {
            return txt.getNodeValue();
        }

        return "";
    }

    /**
     * Returns the node value of the element's first child if there is any,
     * otherwise <code>null</code>.
     *
     * @param element the element.
     * @return the element's value.
     */
    public static String getElementValue(Element element) {
        Node child = element.getFirstChild();
        if (child != null) {
            return child.getNodeValue();
        }

        return null;
    }

    /**
     * Appends the specified value as a text node to the element. If the
     * value is <code>null</code>, the element's first child node will be
     * removed.
     *
     * @param element the element.
     * @param value   the element's value.
     */
    public static void setElementValue(Element element, String value) {
        Node child = element.getFirstChild();

        if (value != null) {
            if (child == null) {
                child = element.getOwnerDocument().createTextNode("");
                element.appendChild(child);
            }

            child.setNodeValue(value);
        } else {
            if (child != null) {
                element.removeChild(child);
            }
        }
    }

    /**
     * copies all attributes from one Element to another
     *
     * @param from   - the Element which the source attributes
     * @param to     - the target Element for the Attributes
     * @param filter - a NodeFilter to apply during copy
     */
    public static void copyAttributes(Element from, Element to, NodeFilter filter) {
        if ((from != null) && (to != null)) {
            NamedNodeMap map = from.getAttributes();

            /* if filter is null use our own default filter, which accepts
               everything (this saves us from always check if filter is
               null */
            if (filter == null) {
                filter = new NodeFilter() {
                    public short acceptNode(Node n) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                };
            }

            if (map != null) {
                int len = map.getLength();

                for (int i = 0; i < len; i++) {
                    Node attr = map.item(i);

                    if (attr.getNodeType() == Node.ATTRIBUTE_NODE) {
                        if (filter.acceptNode(attr) == NodeFilter.FILTER_ACCEPT) {
                            to.setAttributeNS(attr.getNamespaceURI(), attr.getNodeName(), attr.getNodeValue());
                        }
                    }
                }
            }
        }
    }

    // return the count of child elements

    public static int countChildElements(Node node) {
        NodeList nl = node.getChildNodes();
        int count = 0;

        for (int n = 0; n < nl.getLength(); n++) {
            if (nl.item(n).getNodeType() == Node.ELEMENT_NODE) {
                count++;
            }
        }

        return count;
    }

    /**
     * find the first child in a parent for a tagname part (only one the child level)
     *
     * @param parent  the parent to search the child in
     * @param tagName the local name part of the child node
     * @return the found child casted to Element or null if no such child was found.
     */
    public static Element findFirstChild(Node parent, String tagName) {
        if (tagName == null) {
            return null;
        }

        NodeList children = parent.getChildNodes();

        if (children != null) {
            int len = children.getLength();
            Node n = null;

            for (int i = 0; i < len; i++) {
                n = children.item(i);

                //System.out.println("child="+n.getNodeName());
                if ((n.getNodeType() == Node.ELEMENT_NODE) && tagName.equals(n.getNodeName())) {
                    return ((Element) n);
                }
            }
        }

        return null;
    }

    /**
     * find the first child in a parent for a namespace uri and local name part (equals "/tagName[1]" in xpath)
     *
     * @param parent  the parent to search the child in
     * @param nsuri   the namespace uri of the child node
     * @param tagName the local name part of the child node
     * @return the found child casted to Element or null if no such child was found.
     * todo: change name to 'findFirstChildElementNS'
     */
    public static Element findFirstChildNS(Node parent, String nsuri, String tagName) {
        if (tagName == null) {
            return null;
        }

        NodeList children = parent.getChildNodes();

        if (children != null) {
            int len = children.getLength();
            Node n = null;

            for (int i = 0; i < len; i++) {
                n = children.item(i);

                if ((n.getNodeType() == Node.ELEMENT_NODE) && isNodeInNS(n, nsuri, tagName)) {
                    return ((Element) n);
                }
            }
        }

        return null;
    }

    /**
     * find the last child in a parent for a tagname part
     *
     * @param parent  the parent to search the child in
     * @param tagName the local name part of the child node
     * @return the found child casted to Element or null if no such child was found.
     */
    public static Element findLastChild(Node parent, String tagName) {
        if (tagName == null) {
            return null;
        }

        NodeList children = parent.getChildNodes();

        if (children != null) {
            int len = children.getLength();
            Node n = null;

            for (int i = len - 1; i >= 0; i--) {
                n = children.item(i);

                if ((n.getNodeType() == Node.ELEMENT_NODE) && tagName.equals(n.getNodeName())) {
                    return ((Element) n);
                }
            }
        }

        return null;
    }

    /**
     * find the last child in a parent for a namespace uri and local name part
     *
     * @param parent  the parent to search the child in
     * @param nsuri   the namespace uri of the child node
     * @param tagName the local name part of the child node
     * @return the found child casted to Element or null if no such child was found.
     */
    public static Element findLastChildNS(Node parent, String nsuri, String tagName) {
        if (tagName == null) {
            return null;
        }

        NodeList children = parent.getChildNodes();

        if (children != null) {
            int len = children.getLength();
            Node n = null;

            for (int i = len - 1; i >= 0; i--) {
                n = children.item(i);

                if ((n.getNodeType() == Node.ELEMENT_NODE) && isNodeInNS(n, nsuri, tagName)) {
                    return ((Element) n);
                }

                /*                    tagName.equals(n.getLocalName())) {
                   if (nsuri == n.getNamespaceURI())
                       return ((Element) n);
                   if (nsuri != null &&
                       nsuri.equals(n.getNamespaceURI()))
                       return ((Element) n);
                   }*/
            }
        }

        return null;
    }

    /**
     * find the nth child in a parent for a namespace uri and local name part (equals "/tagName[idx]" in xpath)
     *
     * @param contextNode the parent to search the child in
     * @param nsuri       the namespace uri of the child node
     * @param tag         the local name part of the child node
     * @param idx         the index to use (starting at one)
     * @return the found child casted to Element or null if no such child was found.
     */
    public static Node findNthChildNS(Node contextNode, String nsuri, String tag, int idx) {
        if (tag == null) {
            return null;
        }

        NodeList children = contextNode.getChildNodes();

        if (children != null) {
            int len = children.getLength();
            Node n = null;

            //            int childcount = 0; // to count the found childs
            //
            //            idx --;                 // since index starts at one
            int childcount = 1;

            for (int i = 0; i < len; i++) {
                n = children.item(i);

                if ((n.getNodeType() == Node.ELEMENT_NODE) && isNodeInNS(n, nsuri, tag)) {
                    if (childcount == idx) {
                        return ((Element) n);
                    } else if (childcount > idx) {
                        return null;
                    }

                    childcount++;
                }
            }
        }

        return null;
    }

    /**
     * __UNDOCUMENTED__
     *
     * @param start __UNDOCUMENTED__
     * @param name  __UNDOCUMENTED__
     * @return __UNDOCUMENTED__
     */
    public static boolean hasChild(Element start, String name) {
        NodeList nl = start.getChildNodes();
        int len = nl.getLength();

        Node n = null;

        for (int i = 0; i < len; i++) {
            n = nl.item(i);

            if (n.getNodeName().equals(name)) {
                return true;
            }
        }

        return false;
    }

    /**
     * just the same as hasNonWhitespaceChildren, but seen from a different perspective ;)
     *
     * @param element
     * @return true, if any Element nodes are found, otherwise false
     */
    public static boolean hasElementChildren(Element element) {
        return hasNonWhitespaceChildren(element);
    }

    /**
     * check, if the passed element node has non-whitespace children.
     *
     * @return true, if any Element nodes are found, otherwise false
     */
    public static boolean hasNonWhitespaceChildren(Element element) {
        if (element.hasChildNodes()) {
            NodeList children = element.getChildNodes();
            int len = children.getLength();
            Node n = null;

            for (int i = 0; i < len; i++) {
                n = children.item(i);

                if (n.getNodeType() == Node.ELEMENT_NODE) {
                    return true;
                }
            }

            return false;
        } else {
            return false;
        }
    }

    public static Node importAndAppendNode(Document document, Node toImport){
        if(toImport != null){
            Node imported = document.importNode(toImport,true);
//            Node root = document.getDocumentElement();
            return document.appendChild(imported);
        }
        return null;
    }

    /**
     * This is a workaround for very strange behaviour of xerces-1.4.2 DOM importNode.
     */
    public static Node importNode(Document document, Node toImport) {
        if (toImport != null) {
            Node root = toImport.cloneNode(false); // no deep cloning!

            root = document.importNode(root, false);

            for (Node n = toImport.getFirstChild(); n != null; n = n.getNextSibling()) {
                root.appendChild(document.importNode(n, true));
            }

            return root;
        }

        return null;
    }

    /**
     * __UNDOCUMENTED__
     *
     * @param newChild __UNDOCUMENTED__
     * @param refChild __UNDOCUMENTED__
     * @throws DOMException __UNDOCUMENTED__
     */
    public static void insertAfter(Node newChild, Node refChild)
            throws DOMException {
        if (refChild == null) {
            throw new DOMException(DOMException.NOT_FOUND_ERR, "refChild == null");
        }

        Node nextSibling = refChild.getNextSibling();

        if (nextSibling == null) {
            refChild.getParentNode().appendChild(newChild);
        } else {
            refChild.getParentNode().insertBefore(newChild, nextSibling);
        }
    }

    /**
     * Moves a child the given index in a nodelist for a given number of steps.
     *
     * @param nodelist the nodelist to work on. if the nodelist is empty, nothing is done
     * @param index    index pointing to the child to move.  if the index is not in the list range nothing is done.
     * @param step     the amount of slots to move the child.  if step is negative the child is moved up (towards the list
     *                 start), if it is positive it is moved down (towards the list end). if the step is zero nothing is done.
     */
    public static void moveChild(NodeList nodelist, int index, int step) {
        if ((nodelist == null) || (nodelist.getLength() == 0)) {
            return;
        }

        if ((index >= nodelist.getLength()) || (index < 0)) {
            return;
        }

        if (step == 0) {
            return;
        }

        Node parent = nodelist.item(0).getParentNode();
        Node deletedElt = parent.removeChild(nodelist.item(index));

        if ((index + step) == (nodelist.getLength() - 1)) {
            parent.appendChild(deletedElt);
        } else {
            // SURE? it seems that after a removeChild the indices of the nodes
            // in the nodelist seem not to change.  Checking the DOM spec the
            // nodelist is live, but this seems not to be true for index changes
            // is this a bug, or correct?
            // Due to this behaviour the following seperation betweem step forward
            // and backward is necessary.
            if (step < 0) {
                parent.insertBefore(deletedElt, nodelist.item(index + step));
            } else {
                parent.insertBefore(deletedElt, nodelist.item(index + step + 1));
            }
        }
    }

    /**
     * Removes all children of the specified node.
     *
     * @param node the node.
     */
    public static void removeAllChildren(Node node) {
        Node child;
        while ((child = node.getFirstChild()) != null) {
            node.removeChild(child);
        }
    }

    /**
     * __UNDOCUMENTED__
     *
     * @param isNamespaceAware __UNDOCUMENTED__
     * @param isValidating     __UNDOCUMENTED__
     * @return __UNDOCUMENTED__
     */
    public static Document newDocument(boolean isNamespaceAware, boolean isValidating) {
        // !!! workaround to enable betterForm to run within WebLogic Server
        // Force JAXP to use xerces as the default JAXP parser doesn't work with BetterForm
        //
        //        String oldFactory = System.getProperty("javax.xml.parsers.DocumentBuilderFactory");
        //        System.setProperty("javax.xml.parsers.DocumentBuilderFactory","org.apache.xerces.jaxp.DocumentBuilderFactoryImpl");
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();

        // restore to original factory
        //
        //        System.setProperty("javax.xml.parsers.DocumentBuilderFactory",oldFactory);
        // !!! end workaround
        factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(isNamespaceAware);
        factory.setValidating(isValidating);

        try {
            // Create builder.
            DocumentBuilder builder = factory.newDocumentBuilder();

            return builder.newDocument();
        } catch (ParserConfigurationException pce) {
            System.err.println(pce.toString());
        }

        return null;
    }

    /**
     * __UNDOCUMENTED__
     *
     * @param in         __UNDOCUMENTED__
     * @param namespaces __UNDOCUMENTED__
     * @param validating __UNDOCUMENTED__
     * @return __UNDOCUMENTED__
     * @throws ParserConfigurationException __UNDOCUMENTED__
     * @throws SAXException                 __UNDOCUMENTED__
     * @throws IOException                  __UNDOCUMENTED__
     */
    public static Document parseInputStream(InputStream in, boolean namespaces, boolean validating)
            throws ParserConfigurationException, SAXException, IOException {
        DocumentBuilder builder = createDocumentBuilder(namespaces, validating);

        return builder.parse(in);
    }

    /**
     * parses a Xml-File on disk and returns the parsed DOM Document.
     *
     * @param fileName - must be an absolute file-path pointing to the file
     */
    public static Document parseXmlFile(String fileName, boolean namespaces, boolean validating)
            throws ParserConfigurationException, SAXException, IOException {
        return DOMUtil.parseXmlFile(new File(fileName), namespaces, validating);
    }

    /**
     * __UNDOCUMENTED__
     *
     * @param file       __UNDOCUMENTED__
     * @param namespaces __UNDOCUMENTED__
     * @param validating __UNDOCUMENTED__
     * @return __UNDOCUMENTED__
     * @throws ParserConfigurationException __UNDOCUMENTED__
     * @throws SAXException                 __UNDOCUMENTED__
     * @throws IOException                  __UNDOCUMENTED__
     */
    public static Document parseXmlFile(File file, boolean namespaces, boolean validating)
            throws ParserConfigurationException, SAXException, IOException {
        DocumentBuilder builder = createDocumentBuilder(namespaces, validating);

        return builder.parse(file);
    }

    /**
     * parses a DOM from a String
     *
     * @param input      the input String that must contain a complete and well-formed XML document
     * @param namespaces parser is namespace aware
     * @param validating parser is validating
     * @return the resulting DOM Document
     * @throws ParserConfigurationException in case of misconfiguration
     * @throws IOException                  in case the source couldn't be read
     * @throws SAXException                 if an parse error happens normally due to not-wellformed content
     */
    public static Document parseString(String input, boolean namespaces, boolean validating)
            throws ParserConfigurationException, IOException, SAXException {
        return createDocumentBuilder(true,false).parse(new InputSource(new StringReader(input)));
    }


    /**
     * Serializes the specified node to stdout.
     *
     * @param node the node to serialize
     */
    public static void prettyPrintDOM(Node node) {
        try {
            System.out.println();
            prettyPrintDOM(node, System.out);
            System.out.println("\n");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    /**
     * Serializes the specified node to the given stream. Serialization is achieved by an identity transform.
     *
     * @param node   the node to serialize
     * @param stream the stream to serialize to.
     * @throws TransformerException if any error ccurred during the identity transform.
     */
    public static void prettyPrintDOM(Node node, OutputStream stream) throws TransformerException {
        Transformer transformer = TransformerFactory.newInstance().newTransformer();
        transformer.setOutputProperty(OutputKeys.INDENT, "yes");
        transformer.setOutputProperty(OutputKeys.METHOD, "xml");
        transformer.transform(new DOMSource(node), new StreamResult(stream));
    }


    /*
    * TODO: Lars: function looks wrong, Node output is not used at all, anyway: function is never called
    */
    public static void prettyPrintDOM(Node node, Node output) throws TransformerException {
        Transformer transformer = TransformerFactory.newInstance().newTransformer();
        transformer.setOutputProperty(OutputKeys.INDENT, "yes");
        transformer.setOutputProperty(OutputKeys.METHOD, "xml");
        transformer.transform(new DOMSource(node), new DOMResult(node));
    }

    public static void prettyPrintDOMAsHTML(Node node, OutputStream stream) throws TransformerException {
        Transformer transformer = TransformerFactory.newInstance().newTransformer();
        transformer.setOutputProperty(OutputKeys.INDENT, "yes");
        transformer.setOutputProperty(OutputKeys.METHOD, "html");
        transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
        transformer.transform(new DOMSource(node), new StreamResult(stream));
    }

    private static DocumentBuilder createDocumentBuilder(boolean namespaces, boolean validating)
            throws ParserConfigurationException {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(namespaces);
        factory.setValidating(validating);

        //        factory.setAttribute("http://xml.org/sax/features/namespace-prefixes)",new Boolean(true));
        DocumentBuilder builder = factory.newDocumentBuilder();

        return builder;
    }


    /**
     * returns a canonical XPath locationpath for a given Node. Each step in the path will contain the positional
     * predicate of the Element. Example '/root[1]/a[1]/b[2]/c[5]/@d'. This would point to<br/>
     * to Attribute named 'd'<br/>
     * on 5th Element 'c"<br/>
     * on 2nd Element 'b'<br/>
     * on first Element a<br/>
     * which is a child of the Document Element.
     *
     * @param node the Node where to start
     * @return canonical XPath locationPath for given Node or the empty string if node is null
     */
    public static String getCanonicalPath(Node node) {

        if (node == null) {
            return "";
        }

        if (node.getNodeType() == Node.DOCUMENT_NODE) {
            return "/";
        }

        //add ourselves
        String canonPath;
        String ns= node.getNamespaceURI();
        String nodeName1=node.getNodeName();
        String nodeName2=node.getLocalName();
        if(ns!=null && ns.equals("http://www.w3.org/1999/xhtml") && node.getNodeName().equals(node.getLocalName())){
            canonPath = "html:" + node.getNodeName();
        }else{
            canonPath = node.getNodeName();
        }
        if (node.getNodeType() == Node.ATTRIBUTE_NODE) {
            canonPath = "@" + canonPath;
        } else if (node.getNodeType() == Node.ELEMENT_NODE) {
            int position = DOMUtil.getCurrentNodesetPosition(node);
            //append position if we are an Element
            canonPath += "[" + position + "]";
        }

        //check for parent - if there's none we're root
        Node parent = null;
        if (node.getNodeType() == Node.ELEMENT_NODE || node.getNodeType() == Node.TEXT_NODE) {
            parent = node.getParentNode();
        } else if (node.getNodeType() == Node.ATTRIBUTE_NODE) {
            parent = ((Attr) node).getOwnerElement();
        }
        if(parent == null){
            parent = node.getOwnerDocument().getDocumentElement();
        }
        if (parent.getNodeType() == Node.DOCUMENT_NODE || parent.getNodeType() == Node.DOCUMENT_FRAGMENT_NODE) {
            canonPath = "/" + canonPath;
        } else {
            canonPath = DOMUtil.getCanonicalPath(parent) + "/" + canonPath;
        }


        return canonPath;
    }

    public static String serializeToString(org.w3c.dom.Document doc)    {
        try
        {
            DOMSource domSource = new DOMSource(doc);
            StringWriter writer = new StringWriter();
            StreamResult result = new StreamResult(writer);
            TransformerFactory tf = TransformerFactory.newInstance();
            Transformer transformer = tf.newTransformer();
            transformer.setOutputProperty(OutputKeys.INDENT, "yes");
            transformer.setOutputProperty(OutputKeys.METHOD, "xml");
            transformer.transform(domSource, result);
            writer.flush();
            return writer.toString();
        }
        catch(TransformerException ex)
        {
            ex.printStackTrace();
            return null;
        }
    }

    /**
     * creates a new non-namespaced, non-validating Document and creates a root node which is returned 
     * @return the newly created root node
     */
    public static Element createRootElement(String rootNodeName) {
        Document inputDoc = DOMUtil.newDocument(false, false);
        Element rootNode = inputDoc.createElement(rootNodeName);
        inputDoc.appendChild(rootNode);
        return rootNode;
    }

    /**
     * creates and appends an Element with given name to given parent and adds value as TextNode to new Element
     * @param parent the parent Element to append to
     * @param elementName the name of the Element to create
     * @param value the TextNode value of the newly created Element
     * 
     */
    public static void appendElement(Element parent,String elementName, String value) {
        Element e = parent.getOwnerDocument().createElement(elementName);
        DOMUtil.setElementValue(e, value);
        parent.appendChild(e);
    }

}

// end of class
