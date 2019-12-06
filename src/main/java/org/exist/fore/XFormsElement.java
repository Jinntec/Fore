/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore;

import org.exist.fore.util.DOMUtil;
import org.apache.commons.logging.Log;
import org.exist.fore.model.Model;
import org.exist.fore.xpath.XPathFunctionContext;
import org.w3c.dom.Element;


/**
 * Superclass for all XForms elements. This includes either all elements from
 * the XForms namespace and all bound elements which may be from foreign
 * namespaces but wear XForms binding attributes. Custom elements also extend
 * this class.
 *
 * @author Joern Turner
 * @author Ulrich Nicolas Liss&eacute;
 * @version $Id: XFormsElement.java 3483 2008-08-20 10:16:24Z joern $
 */
public abstract class XFormsElement {

    protected final XPathFunctionContext xpathFunctionContext;

    /**
     * the annotated DOM Element
     */
    protected Element element = null;

    /**
     * the Model object of this XFormsElement
     */
    protected Model model = null;

    /**
     * the id of this Element
     */
    protected String id;

    /**
     * the original id of this Element (when repeated)
     */
//    protected String originalId;

    /**
     * the xforms prefix used in this Document
     */
//    protected String xformsPrefix = null;
//    protected final Map prefixMapping;



    /**
     * Creates a new XFormsElement object.
     *
     * @param element the DOM Element annotated by this object
     */
    public XFormsElement(Element element) {
        this.element = element;

        xpathFunctionContext = new XPathFunctionContext(this);
        String name = element.getNodeName();
        element.setUserData(name, this,null);

    }

    /**
     * Creates a new XFormsElement object.
     *
     * @param element the DOM Element annotated by this object
     * @param model   the Model object of this XFormsElement
     */
    public XFormsElement(Element element, Model model) {
        this(element);
        this.model = model;
    }

    // lifecycle methods

    /**
     * Performs element init.
     *
     * @throws XFormsException if any error occurred during init.
     */
    public abstract void init() throws XFormsException;

    /**
     * Performs element disposal.
     *
     * @throws XFormsException if any error occurred during disposal.
     */
    public abstract void dispose() throws XFormsException;


    /**
     * evaluates the 'in scope evaluation context' and returns a List of NodeInfo objects representing the
     * bound nodes. If no binding element is found on the ancestor axis the default instance for this model
     * is returned.
     * <p/>
     * Why is it here and not further down the hierarchy? It can be convenient to have an in-scope context always e.g.
     * to support AVTs on any XForms element. In this case it would be intuitive for the author to get the same
     * XPath evaluation behavior (taking scope into account) as always in XForms.
     *
     * @return a List of NodeInfo objects representing the bound nodes of this XFormsElement
     * @throws XFormsException
     */
/*
    public static List evalInScopeContext(Element bind) throws XFormsException {
        final List resultNodeset;
//        final Binding parentBoundElement = getEnclosingBind(this, false);

        Element parent = (Element) bind.getParentNode();


        if (parentBoundElement != null) {
            resultNodeset = parentBoundElement.getNodeset();
        } else if (this instanceof BindingElement && XPathUtil.isAbsolutePath(((BindingElement)this).getLocationPath())){
            BindingElement binding = (BindingElement) this;
            resultNodeset = this.model.getInstance(binding.getInstanceId()).getInstanceNodeset();
        } else if(this.model.getDefaultInstance() != null){
            resultNodeset = this.model.getDefaultInstance().getInstanceNodeset();
        }  else {
            resultNodeset = Collections.EMPTY_LIST;
        }

        if (resultNodeset == null) {
            if (parentBoundElement == null) {
                return null;
                // throw new XFormsException("Impossible case happened - go away quickly");
            } else {
                getLogger().info("Context ResultSet is null for element: " + DOMUtil.getCanonicalPath(((XFormsElement) parentBoundElement).getElement()));
                return Collections.EMPTY_LIST;
            }
        }

        final String contextExpression = getContextExpression();
        if (contextExpression == null || getXFormsAttribute(BIND_ATTRIBUTE) != null) {
            return resultNodeset;
        }

        final List contextResultNodeSet = XPathCache.getInstance().evaluate(resultNodeset, 1, contextExpression, getPrefixMapping(), xpathFunctionContext);
        if ((contextResultNodeSet == null) || (contextResultNodeSet.size() == 0)) return contextResultNodeSet;
        else return Collections.singletonList(contextResultNodeSet.get(0));
    }
*/

    /**
     * Returns the enclosing binding element of the specified xforms element.
     *
     * @param xFormsElement the xforms element.
     * @param returnBind if true returns the bind that corresponds to the UI control instead of the UI control itself
     * @return the enclosing binding element of the specified xforms element or
     * <code>null</code> if there is no enclosing binding element.
     */

/*
    public Bind getEnclosingBind(XFormsElement xFormsElement, boolean returnBind){
        Bind enclosingBinding = null;
//        Container container = xFormsElement.getContainerObject();
        Model container = xFormsElement.getContainerObject();
        Node currentNode = xFormsElement.getElement();


        while (true) {
            Node parentNode = currentNode.getParentNode();

            if (parentNode == null) {
                break;
            }

            if (!(parentNode instanceof Element)) {
                break;
            }

            if !(parentNode instanceof Bind){
               break;
            }

            Element elementImpl = (Element) parentNode;
            Object o = elementImpl.getUserData("");

            if (BindingResolver.hasModelBinding(elementImpl)) {
                Binding binding = (Binding) o;

                if (binding.getModelId().equals(modelId)) {
                    String bindId = binding.getBindingId();
                    if (returnBind) {
                        enclosingBinding = (Binding) container.lookup(bindId);
                    }
                    else {
                        enclosingBinding = binding;
                    }
                    break;
                }
            }

            Binding enclosingUIBinding = getEnclosingUIBinding(elementImpl, o,modelId);
            if(enclosingUIBinding != null) {
                enclosingBinding = enclosingUIBinding;
                break;
            }
            currentNode = parentNode;
        }

        return enclosingBinding;
    }
*/


    /**
     * returns the Container object of this Element.
     *
     * @return Container object of this Element
     */
    public Model getContainerObject() {
        return (Model)this.element.getOwnerDocument().getDocumentElement().getUserData("");
    }

    /**
     * Returns the DOM element of this element.
     *
     * @return the DOM element of this element.
     */
    public Element getElement() {
        return this.element;
    }

    // member access methods

    /**
     * Returns the global id of this element.
     *
     * @return the global id of this element.
     */
    public String getId() {
        return this.id;
    }

    /**
     * Returns the context model of this element.
     *
     * @return the context model of this element.
     */
    public Model getModel() {
        return this.model;
    }

    /**
     * returns the parent XFormsElement object of the DOM parent Node if any or
     * null otherwise.
     *
     * @return the parent XFormsElement object of the DOM parent Node if any or
     *         null otherwise.
     */
/*
    public XFormsElement getParentObject() {
        return (XFormsElement) this.element.getParentNode().getUserData("");
    }
*/



    /**
     * @return the the XPathFunctionContext for this element.
     */
    public XPathFunctionContext getXPathFunctionContext() {
        return xpathFunctionContext;
    }


    // id handling



    // standard methods

    /**
     * Check wether this object and the specified object are equal.
     *
     * @param object the object in question.
     * @return <code>true</code> if this object and the specified object are
     *         equal, <code>false</code> otherwise.
     */
    public boolean equals(Object object) {
        if (object == null) {
            return false;
        }

        if (object == this) {
            return true;
        }

        if (!(object instanceof XFormsElement)) {
            return false;
        }

        return ((XFormsElement) object).getId().equals(getId());
    }

    /**
     * Returns a string representation of this object.
     *
     * @return a string representation of this object.
     */
    public String toString() {
        return DOMUtil.getCanonicalPath(getElement()) + "/@id[.='" + getId() + "']";
    }

    /**
     * Returns the logger object.
     *
     * @return the logger object.
     */
     protected abstract Log getLogger();





}

// end of class
