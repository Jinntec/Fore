/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.model.constraints;

import org.exist.fore.util.DOMUtil;
import org.exist.fore.XFormsException;
import org.exist.fore.model.Instance;
import org.exist.fore.xpath.NamespaceResolver;
import org.exist.fore.xpath.XPathCache;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.w3c.dom.*;

/**
 * Selects relevant instance data for submission.
 *
 * @author Ulrich Nicolas Liss&eacute;
 * @version $Id: RelevanceSelector.java 3253 2008-07-08 09:26:40Z lasse $
 */
public class RelevanceSelector {

    private static Log LOGGER = LogFactory.getLog(RelevanceSelector.class);

    /**
     * Returns a document containing only the relevant model items of the
     * specified instance data.
     *
     * @param instance the instance data.
     * @return a document containing only the relevant model items of the
     *         specified instance data.
     */
    public static Document selectRelevant(Instance instance) throws XFormsException {
        return selectRelevant(instance, "/");
    }

    /**
     * Returns a document containing only the relevant model items of the
     * specified instance data.
     *
     * @param instance the instance.
     * @param path the path denoting an instance subtree.
     * @return a document containing only the relevant model items of the
     *         specified instance data.
     */
    public static Document selectRelevant(Instance instance, String path) throws XFormsException {
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("select relevant: processing " + path);
        }

        Document relevantDocument = DOMUtil.newDocument(true, false);
        Node instanceRoot = instance.getInstanceDocument().getDocumentElement();
        Node instanceNode = XPathCache.getInstance().evaluateAsSingleNode(instance.getRootContext(), path);

        if (instanceNode.getNodeType() == Node.DOCUMENT_NODE) {
            if (isEnabled(instanceRoot)) {
                // process document tree
                addElement(relevantDocument, instanceRoot);
            }
        }

        if (instanceNode.getNodeType() == Node.ELEMENT_NODE) {
            if (isEnabled(instanceNode)) {
                // process element subtree
                addElement(relevantDocument, instanceNode);

                // apply namespaces
                NamespaceResolver.applyNamespaces((Element) instanceNode, relevantDocument.getDocumentElement());
            }
        }
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("RelevantSelector result document....");
            DOMUtil.prettyPrintDOM(relevantDocument);
        }

        return relevantDocument;
    }

    private static void addElement(Document relevantDocument, Node instanceNode) {
        Element relevantElement;

        if (instanceNode.getNamespaceURI() == null) {
            relevantElement = relevantDocument.createElement(instanceNode.getNodeName());
        }
        else {
            relevantElement = relevantDocument.createElementNS(instanceNode.getNamespaceURI(),
                    instanceNode.getNodeName());
        }

        relevantDocument.appendChild(relevantElement);
        addAttributes(relevantElement, instanceNode);
        addChildren(relevantElement, instanceNode);
    }

    private static void addElement(Element relevantParent, Node instanceNode) {
        Document relevantDocument = relevantParent.getOwnerDocument();
        Element relevantElement;

        if (instanceNode.getNamespaceURI() == null) {
            relevantElement = relevantDocument.createElement(instanceNode.getNodeName());
        }
        else {
            relevantElement = relevantDocument.createElementNS(instanceNode.getNamespaceURI(),
                    instanceNode.getNodeName());
        }

        // needed in instance serializer ...
        relevantElement.setUserData("",instanceNode.getUserData(""),null);

        relevantParent.appendChild(relevantElement);
        addAttributes(relevantElement, instanceNode);
        addChildren(relevantElement, instanceNode);
    }

    private static void addAttributes(Element relevantElement, Node instanceNode) {
        NamedNodeMap instanceAttributes = instanceNode.getAttributes();

        for (int index = 0; index < instanceAttributes.getLength(); index++) {
            Node instanceAttr = (Node) instanceAttributes.item(index);

            if (isEnabled(instanceAttr)) {
                if (instanceAttr.getNamespaceURI() == null) {
                    relevantElement.setAttribute(instanceAttr.getNodeName(),
                            instanceAttr.getNodeValue());
                }
                else {
                    relevantElement.setAttributeNS(instanceAttr.getNamespaceURI(),
                            instanceAttr.getNodeName(),
                            instanceAttr.getNodeValue());
                }
            }
        }
    }

    private static void addChildren(Element relevantElement, Node instanceNode) {
        Document ownerDocument = relevantElement.getOwnerDocument();
        NodeList instanceChildren = instanceNode.getChildNodes();

        for (int index = 0; index < instanceChildren.getLength(); index++) {
            Node instanceChild = (Node) instanceChildren.item(index);

            if (isEnabled(instanceChild)) {
                switch (instanceChild.getNodeType()) {
                    case Node.TEXT_NODE:
                        /* rather not, otherwise we cannot follow specs when
                         * serializing to multipart/form-data for example
                         *
                        // denormalize text for better whitespace handling during serialization
                        List list = DOMWhitespace.denormalizeText(instanceChild.getNodeValue());
                        for (int item = 0; item < list.size(); item++) {
                            relevantElement.appendChild(ownerDocument.createTextNode(list.get(item).toString()));
                        }
			            */
                        relevantElement.appendChild(ownerDocument.createTextNode(instanceChild.getNodeValue()));
                        break;
                    case Node.CDATA_SECTION_NODE:
                        relevantElement.appendChild(ownerDocument.createCDATASection(instanceChild.getNodeValue()));
                        break;
                    case Node.ELEMENT_NODE:
                        addElement(relevantElement, instanceChild);
                        break;
                    default:
                        // ignore
                        break;
                }
            }
        }
    }

    private static boolean isEnabled(Node nodeImpl) {
        ModelItem item = (ModelItem) nodeImpl.getUserData("");
        return item == null || item.isRelevant();
    }

}
