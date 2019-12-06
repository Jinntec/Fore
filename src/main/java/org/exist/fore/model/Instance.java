/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.model;

import net.sf.saxon.trans.XPathException;
import org.apache.commons.logging.Log;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.exist.fore.XFormsElement;
import org.exist.fore.model.constraints.ElementItem;
import org.exist.fore.model.constraints.NodeItem;
import org.exist.fore.util.DOMUtil;
import org.exist.fore.XFormsException;
import org.exist.fore.model.constraints.ModelItem;
import org.exist.fore.xpath.BetterFormXPathContext;
import org.exist.fore.xpath.XPathCache;
import org.exist.fore.xpath.XPathFunctionContext;
import org.exist.fore.xpath.XPathUtil;
import org.w3c.dom.*;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.util.*;

/**
 * Implementation of XForms instance Element.
 *
 * @version $Id: Instance.java 3510 2008-08-31 14:39:56Z lars $
 */
public class Instance extends XFormsElement {
    private final static Logger LOGGER = LogManager.getLogger(Model.class);
    private final Element element;
    private final Model model;
    private Document instanceDocument = null;
    private Element initialInstance = null;
    private BetterFormXPathContext xPathContext = null;



    /**
     * Creates a new Instance object.
     *
     * @param element the DOM Element of this instance
     * @param model   the owning Model of this instance
     */
    public Instance(Element element, Model model) {
        super(element,model);
        this.element = element;
        this.model = model;
    }

    /**
     * Performs element init.
     *
     */
    public void init() throws XFormsException {
        if (LOGGER.isTraceEnabled()) {
            LOGGER.trace(this + " init");
        }

        // load initial instance
        this.initialInstance = createInitialInstance();
        // create instance document
        this.instanceDocument = createInstanceDocument();

        if(this.element.getAttribute("id").equals("")){
            this.element.setAttribute("id","default");
        }

        storeUserObjects();

        initXPathContext();
    }

    @Override
    public void dispose() throws XFormsException {

    }

    private void initXPathContext() {
//        this.xPathContext = new BetterFormXPathContext(getInstanceNodeset(),1,getPrefixMapping(),xpathFunctionContext);
        this.xPathContext = new BetterFormXPathContext(getInstanceNodeset(),1,null,xpathFunctionContext);
    }


    public static ModelItem createModelItem(Node node) {
        String id = Model.generateModelItemId();
        ModelItem modelItem;
        if (node.getNodeType() == Node.ELEMENT_NODE) {
            modelItem = new ElementItem(id);
        }
        else {
            modelItem = new NodeItem(id);
        }
        modelItem.setNode(node);

        Node parentNode;
        if (node.getNodeType() == Node.ATTRIBUTE_NODE) {
            parentNode = ((Attr) node).getOwnerElement();
        }
        else {
            parentNode = node.getParentNode();
        }
        if (parentNode != null) {
            ModelItem parentItem = (ModelItem) parentNode.getUserData("");
            if (parentItem == null) {
                parentItem = createModelItem(parentNode);
            }

            modelItem.setParent(parentItem);
        }

        node.setUserData("", modelItem,null);
        return modelItem;
    }

    // lifecycle methods


    private void storeUserObjects() {
        if(instanceDocument.getDocumentElement() != null){
            instanceDocument.getDocumentElement().setUserData("model",this.model,null);
            instanceDocument.getDocumentElement().setUserData("instance",this,null);
        }
    }

    private Element createInitialInstance() {
        Element child = DOMUtil.getFirstChildElement(this.element);
        if(child != null){
            return child;
        }
        return null;
    }

    /**
     * Returns the instance document.
     *
     * @return the instance document.
     */
    public Document getInstanceDocument() {
        return this.instanceDocument;
    }

    /**
     * returns the initial instance
     * @return the initial instance
     */
    public Document getInitialInstance(){
        if(this.initialInstance != null){
            Document doc =DOMUtil.newDocument(true,false);
            doc.appendChild(doc.importNode(this.initialInstance,true));
            return doc;
        }else{
            return null;
        }
    }
    /**
     * Returns a new created instance document.
     * <p/>
     * If this instance has an original instance, it will be imported into this
     * new document. Otherwise the new document is left empty.
     *
     * @return a new created instance document.
     * @throws org.exist.fore.XFormsException
     */
    private Document createInstanceDocument() throws XFormsException {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(false);
            factory.setValidating(false);
            Document document = factory.newDocumentBuilder().newDocument();

            if (this.initialInstance != null) {
                Node imported = document.importNode(this.initialInstance.cloneNode(true), true);
                document.appendChild(imported);
            }

            return document;
        } catch (ParserConfigurationException e) {
            throw new XFormsException(e);
        } catch (DOMException e) {
            throw new XFormsException(e);
        }
    }


    public String getId() {
        return this.element.getAttribute("id");
    }

    public ModelItem getModelItem(Node node) {
        String id = Model.generateModelItemId();
        ModelItem modelItem;
        if (node.getNodeType() == Node.ELEMENT_NODE) {
            modelItem = new ElementItem(id);
        }
        else {
            modelItem = new NodeItem(id);
        }
        modelItem.setNode(node);

        Node parentNode;
        if (node.getNodeType() == Node.ATTRIBUTE_NODE) {
            parentNode = ((Attr) node).getOwnerElement();
        }
        else {
            parentNode = node.getParentNode();
        }
        if (parentNode != null) {
            ModelItem parentItem = (ModelItem) parentNode.getUserData("");
            if (parentItem == null) {
                parentItem = createModelItem(parentNode);
            }

            modelItem.setParent(parentItem);
        }

        node.setUserData("", modelItem,null);
        return modelItem;

    }

    public BetterFormXPathContext getRootContext() {
        return null;
    }

    public List getInstanceNodeset() {
        String baseURI = model.getBaseURI();
        return XPathUtil.getRootContext(this.instanceDocument,baseURI);
    }

    /**
     * Returns an iterator over all existing model items.
     *
     * @return an iterator over all existing model items.
     * @throws XFormsException
     */
    public Iterator iterateModelItems() throws XFormsException {
        return iterateModelItems(getInstanceNodeset(), 1, "/", Collections.EMPTY_MAP, null, true);
    }

    /**
     * Returns an iterator over the specified model items.
     *
     * @param path the path selecting a set of model items.
     * @param deep include attributes and children or not.
     * @return an iterator over the specified model items.
     * @throws XPathException
     */
    public Iterator iterateModelItems(List nodeset, int position, String path, Map prefixMapping, XPathFunctionContext functionContext, boolean deep) throws XFormsException {
        final List xpathResult = XPathCache.getInstance().evaluate(nodeset, position, path, prefixMapping, functionContext);

        return iterateModelItems(xpathResult, deep);
    }

    /**
     * Returns an iterator over the specified model items.
     *
     * @param nodeset from which the model items should be retrieved
     */
    public Iterator iterateModelItems(List nodeset, boolean deep) {
        // create list, fill and iterate it
        // todo: optimize with live iterator

        final List list = new ArrayList();

        for (int i = 0; i < nodeset.size(); ++i) {
            Node node =  XPathUtil.getAsNode(nodeset, i + 1);
            listModelItems(list, node, deep);
        }

        return list.iterator();
    }

    private void listModelItems(List list, Node node, boolean deep) {
        ModelItem modelItem = (ModelItem) node.getUserData("");
        if (modelItem == null) {
            modelItem = createModelItem(node);
        }
        list.add(modelItem);

        if (deep) {
            NamedNodeMap attributes = node.getAttributes();
            for (int index = 0; attributes != null && index < attributes.getLength(); index++) {
                listModelItems(list, attributes.item(index), deep);
            }
            if(node.getNodeType() !=  Node.ATTRIBUTE_NODE){
                NodeList children = node.getChildNodes();
                for (int index = 0; index < children.getLength(); index++) {
                    listModelItems(list, children.item(index), deep);
                }
            }
        }
    }

    public Model getModel(){
        return this.model;
    }

    @Override
    protected Log getLogger() {
        return null;
    }

}

// end of class
