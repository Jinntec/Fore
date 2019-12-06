/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.xpath;

import org.exist.fore.model.Model;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * This class resolves the namespace information used by a given host document.
 * It contains utility methods for resolving both namespace uris and prefixes as
 * well as for resolving all namespaces in scope.
 *
 * @author Joern Turner
 * @author Ulrich Nicolas Liss&eacute;
 * @version $Id: NamespaceResolver.java 3253 2008-07-08 09:26:40Z lasse $
 */
public class NamespaceResolver {

    /**
     * Attaches the namespace prefix mapping table to all descendants of the specified argument
     *
     * @param root
     */
    @SuppressWarnings("unchecked")
    public static void init(Element root) {
        if (((Element) root).getUserData(NamespaceResolver.class.getName()) != null) {
            return;
        }

        init(root, Collections.EMPTY_MAP);
    }


    /**
     * Returns a map of all namespace declarations in scope for the specified
     * context element.
     * <p/>
     * Note init should be called on an ancestor before calling this method
     *
     * @param context the context element.
     * @return a map of all namespace declarations in scope for the specified
     *         context element.
     */
    @SuppressWarnings("unchecked")
    public static Map getAllNamespaces(Element context) {
        Object nsPrefixMapping = ((Element) context).getUserData(NamespaceResolver.class.getName());
        if (nsPrefixMapping == null) {
            Map<String, String> parentNsPrefixMap = null;
            for (Node n = context.getParentNode(); n != null && parentNsPrefixMap == null; n = n.getParentNode()) {
                parentNsPrefixMap = (Map<String, String>) ((Node) n).getUserData(NamespaceResolver.class.getName());
            }
            return setPrefixMappingUserData(context, parentNsPrefixMap);
        }
        return (Map) nsPrefixMapping;
    }

    /**
     * Returns the namespace uri for the specified namespace prefix.
     * <p/>
     * When the specified prefix is <code>null</code> or empty, this method
     * returns the default namespace uri, if any. If the prefix is not bound to
     * a namespace uri, <code>null</code> is returned.
     *
     * @param context the context element.
     * @param prefix  the namespace prefix.
     * @return the namespace uri for the specified namespace prefix.
     */
    public static String getNamespaceURI(Element context, String prefix) {
        NamedNodeMap attrs = context.getAttributes();
        for (int c = 0; c < attrs.getLength(); c++) {
            Node attr = attrs.item(c);

            if (NamespaceConstants.XMLNS_NS.equals(attr.getNamespaceURI())) {
                // check for default namespace declaration
                if (attr.getPrefix() == null && (prefix == null || prefix.length() == 0)) {
                    return attr.getNodeValue();
                }
                // check for prefixed namespace declaration
                if (NamespaceConstants.XMLNS_PREFIX.equals(attr.getPrefix()) && attr.getLocalName().equals(prefix)) {
                    return attr.getNodeValue();
                }
            }
        }

        Node n = context.getParentNode();
        if (n != null && n.getNodeType() == Node.ELEMENT_NODE) {
            return NamespaceResolver.getNamespaceURI((Element) n, prefix);
        }

        return null;
    }

    /**
     * Returns the namespace prefix for the specified namespace uri.
     * <p/>
     * When the specified namespace uri matches the default namespace uri, an
     * empty prefix is returned. If no prefix is not bound to the specified
     * namespace uri, <code>null</code> is returned.
     *
     * @param context the context element.
     * @param uri     the namespace uri.
     * @return the namespace prefix for the specified namespace uri.
     */
    public static String getPrefix(Element context, String uri) {
        if (uri.equals(context.getNamespaceURI())) {
            return context.getPrefix();
        }
        NamedNodeMap attrs = context.getAttributes();
        for (int c = 0; c < attrs.getLength(); c++) {
            Node attr = attrs.item(c);

            if (NamespaceConstants.XMLNS_NS.equals(attr.getNamespaceURI())) {
                // check for default namespace declaration
                if (attr.getPrefix() == null && attr.getNodeValue().equals(uri)) {
                    return "";
                }
                // check for prefixed namespace declaration
                if (NamespaceConstants.XMLNS_PREFIX.equals(attr.getPrefix()) && attr.getNodeValue().equals(uri)) {
                    return attr.getLocalName();
                }
            }
        }

        Node n = context.getParentNode();
        if (n != null && n.getNodeType() == Node.ELEMENT_NODE) {
            return NamespaceResolver.getPrefix((Element) n, uri);
        }

        return null;
    }

    /**
     * Applies all namespace declarations in scope for the specified context
     * element to the specified candidate element.
     * <p/>
     * Any namespace declarations occurring on the candidate element are
     * preserved.
     *
     * @param context   the context element.
     * @param candidate the candidate element.
     */
    public static void applyNamespaces(Element context, Element candidate) {
        NamedNodeMap attrs = context.getAttributes();
        for (int c = 0; c < attrs.getLength(); c++) {
            Node attr = attrs.item(c);

            // check for namespace declarations unknown by candidate
            if (NamespaceConstants.XMLNS_NS.equals(attr.getNamespaceURI()) &&
                    !candidate.hasAttributeNS(NamespaceConstants.XMLNS_NS, attr.getLocalName())) {
                // copy namespace declaration
                candidate.setAttributeNS(NamespaceConstants.XMLNS_NS, attr.getNodeName(), attr.getNodeValue());
            }
        }

        Node n = context.getParentNode();
        if (n != null && n.getNodeType() == Node.ELEMENT_NODE) {
            NamespaceResolver.applyNamespaces((Element) n, candidate);
        }
    }

    /**
     * Returns an expanded name for the given qualified name.
     * <p/>
     * In contrast to a qualified name an expanded name is globally unique. See
     * http://www.jclark.com/xml/xmlns.htm for reference.
     *
     * @param context the context element.
     * @param name    the qualified name.
     * @return an expanded name for the given qualified name.
     */
    public static String getExpandedName(Element context, String name) {
        if(name == null) {
            return null;
        }
        int separator = name.indexOf(':');
        String prefix = separator > -1 ? name.substring(0, separator) : null;
        String localName = separator > -1 ? name.substring(separator + 1) : name;
        String namespaceURI = prefix != null ? NamespaceResolver.getNamespaceURI(context, prefix) : null;

        return NamespaceResolver.expand(namespaceURI, localName);
    }

    /**
     * Returns an expended name from the optional namespace uri and the given
     * local name.
     * <p/>
     * An expanded name is contructed in the following way: <code>'{' +
     * namespaceURI + '}' + localName</code>. If no namespace uri is specified,
     * the local name is returned.
     *
     * @param namespaceURI the namespace uri.
     * @param localName    the local name.
     * @return an expanded name.
     */
    public static String expand(String namespaceURI, String localName) {
        StringBuffer buffer = new StringBuffer();
        if (namespaceURI != null) {
            buffer.append('{');
            buffer.append(namespaceURI);
            buffer.append('}');
        }

        buffer.append(localName);
        return buffer.toString();
    }


    private static void init(Element context, Map<String, String> parentNsPrefixMap) {
        final Map<String, String> newParentNsPrefixMap = setPrefixMappingUserData(
                context, parentNsPrefixMap);
        for (Node it = context.getFirstChild(); it != null; it = it.getNextSibling()) {
            if (it.getNodeType() != Node.ELEMENT_NODE) {
                continue;
            }
            init((Element) it, newParentNsPrefixMap);
        }
    }


    /**
     * @param context
     * @param parentNsPrefixMap
     * @return
     */
    private static Map<String, String> setPrefixMappingUserData(
            Element context, Map<String, String> parentNsPrefixMap) {
        Map<String, String> nsPrefixMap = null;
        String prefix;
        Node attr;
        NamedNodeMap attrs = context.getAttributes();
        for (int c = 0; c < attrs.getLength(); c++) {
            attr = attrs.item(c);

            // check for overridden namespace declaration
            if (nsPrefixMap == null && parentNsPrefixMap != null) {
                nsPrefixMap = new HashMap<String, String>(parentNsPrefixMap);
            }

            String attrQName = attr.getNodeName();
            if(attr.getNodeName().startsWith("xmlns")){

                if (nsPrefixMap == null) {
                    nsPrefixMap = new HashMap<String, String>();
                }

                //check for default namespace
                if(attrQName.equals("xmlns") && attr.getNodeValue().equals("http://www.w3.org/1999/xhtml")){
                    nsPrefixMap.put("html",attr.getNodeValue());
                }else if(attrQName.equals("xmlns")){
                    nsPrefixMap.put("",attr.getNodeValue());
                }else{
                    String nsName = attr.getNodeName().substring(attrQName.indexOf(":")+1);
                    nsPrefixMap.put(nsName,attr.getNodeValue());
                }

            }
        }

        final Map<String, String> newParentNsPrefixMap;
        if (nsPrefixMap == null) {
            newParentNsPrefixMap = parentNsPrefixMap;
        } else {
            nsPrefixMap.put("xmlns", "http://www.w3.org/2000/xmlns/");
            nsPrefixMap.remove(""); // The default namespace of an XForms XPath expression is the no-namespace namespace
            newParentNsPrefixMap = Collections.unmodifiableMap(nsPrefixMap);
        }
        ((Element) context).setUserData(NamespaceResolver.class.getName(), newParentNsPrefixMap, null);
        return newParentNsPrefixMap;
    }
}

// end of class
