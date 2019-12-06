/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.model.bind;

import net.sf.saxon.dom.DOMNodeWrapper;
import org.apache.commons.lang3.text.WordUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.exist.fore.*;
import org.exist.fore.model.Instance;
import org.exist.fore.model.Model;
import org.exist.fore.model.constraints.ElementItem;
import org.exist.fore.model.constraints.NodeItem;
import org.exist.fore.model.constraints.ConstraintAttribute;
import org.exist.fore.model.constraints.ConstraintElement;
import org.exist.fore.model.constraints.DeclarationView;
import org.exist.fore.model.constraints.ModelItem;
import org.exist.fore.util.DOMUtil;
import org.exist.fore.xpath.*;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.util.*;


/**
 * Implementation of XForms Model Bind Element.
 *
 * @version $Id: Bind.java 3479 2008-08-19 10:44:53Z joern $
 */
public class Bind extends XFormsElement {

    private static Log LOGGER = LogFactory.getLog(Bind.class);

    private String locationPath;
    private String instanceId = "default";

    private String type;
    private String readonly;
    private String required;
    private String relevant;
    private String calculate;
    private String constraint;
    private List constraints;
    private String p3ptype;
    private Map<String, String> customMIPs;

    //    private XPathReferenceFinder referenceFinder;
    private Set readonlyReferences;
    private Set requiredReferences;
    private Set relevantReferences;
    private Set calculateReferences;
    private Set constraintReferences;
    private HashMap<String, Set> customMIPReferences;

    protected List nodeset;

    private static final short TYPE = 0;
    private static final short READONLY = 1;
    private static final short REQUIRED = 2;
    private static final short RELEVANT = 3;
    private static final short CONSTRAINT = 4;
    private static final short CALCULATE = 5;

    private static final String COMBINE_NOT_SUPPORTED = null;
    private static final String COMBINE_ALL = "and";
    private static final String COMBINE_ONE = "or";

    private static final String TYPE_COMBINE = COMBINE_ALL;
    private static final String CONSTRAINT_COMBINE = COMBINE_ALL;
    private static final String RELEVANT_COMBINE = COMBINE_ALL;

    private static final String REQUIRED_COMBINE = COMBINE_ONE;
    private static final String READONLY_COMBINE = COMBINE_ONE;

    protected final Map prefixMapping;
    private BindFunctionReferenceFinderImpl referenceFinder;

    private List modelItems;

    /**
     * Creates a new Bind object.
     *
     * @param element the DOM Element annotated by this object
     * @param model   the parent Model object
     */
    public Bind(Element element, Model model) {
        super(element, model);
        this.constraints = new ArrayList();
        // register with model
        getModel().addBindElement(this);
        this.modelItems = new ArrayList();
        this.prefixMapping = NamespaceResolver.getAllNamespaces(this.element);

    }

    /**
     * Performs element init.
     *
     * @throws XFormsException if any error occurred during init.
     */
    public void init() throws XFormsException {
        if (this.element.hasAttribute("id")) {
            this.id = this.element.getAttribute("id");
        }else{
            throw new XFormsException("required bind id is missing on element " + this.toString());
        }
        //todo: see constructor
        model.addBind(this);

        this.updateXPathContext(); //init this.nodeset

        // determine instance id this bind is belonging to
        String bindingExpression = getBindingExpression();
        // bindingExpression starts with 'instance' function
        if (bindingExpression != null && bindingExpression.startsWith("instance(")) {
            this.instanceId = XPathParseUtil.getInstanceParameter(bindingExpression);
        }


        initializeBinding();

        this.createModelItems();



//        initializeModelItems();
        Initializer.initializeBindElements(getModel(), getElement(), this.referenceFinder);
    }

    /**
     * Initializes the binding context.
     *
     * @throws XFormsException if any error occured during binding context init.
     */
    protected void initializeBinding() throws XFormsException {
        // resolve location path and instance id
/*
        this.locationPath = this.container.getBindingResolver().resolve(this);
        this.instanceId = this.model.computeInstanceId(this.locationPath);
        if (this.instanceId == null) {
            throw new XFormsBindingException("wrong instance id", this.target, this.locationPath);
        }

        // get type attributes
        //todo:support combination
*/

        try {
            this.type = getMIP(TYPE);


            // get model item attributes and analyze path structure
            this.readonly = getMIP(READONLY);
            if (this.readonly != null) {
                this.readonlyReferences = this.referenceFinder.getReferences(this.readonly, getPrefixMapping(), this.model);
            }

            this.required = getMIP(REQUIRED);
            if (this.required != null) {
                this.requiredReferences = this.referenceFinder.getReferences(this.required, getPrefixMapping(), this.model);
            }

            this.relevant = getMIP(RELEVANT);
            if (this.relevant != null) {
                this.relevantReferences = this.referenceFinder.getReferences(this.relevant, getPrefixMapping(), this.model);
            }

            this.calculate = getMIP(CALCULATE);
            if (this.calculate != null) {
                this.calculateReferences = this.referenceFinder.getReferences(this.calculate, getPrefixMapping(), this.model);
            }


            registerConstraints();

            this.constraint = getMIP(CONSTRAINT);
            if (this.constraint != null) {
                this.constraintReferences = this.referenceFinder.getReferences(this.constraint, getPrefixMapping(), this.model);
            }



/*
            this.customMIPs = getCustomMIPAttributes();
            if (!this.customMIPs.isEmpty()) {
                this.customMIPReferences = new HashMap<String, Set>();
                for (String key : this.customMIPs.keySet()) {
                    this.customMIPReferences.put(key, this.referenceFinder.getReferences(this.customMIPs.get(key), getPrefixMapping(), this.model));
                }
            }
*/

//            this.updateXPathContext();
        }
        catch(XFormsComputeException e) {
            throw e;
        }
    }

    private void createModelItems() throws XFormsException {
        for (int i = 0; i < this.nodeset.size(); i++) {
            Node node = (Node) ((DOMNodeWrapper)this.nodeset.get(i)).getUnderlyingNode();

            ModelItem item = this.createModelItem(node);
            this.modelItems.add(item);
            node.setUserData("modelItem",item,null);
            this.initializeModelItemProperties(item);
        }
    }

    public static ModelItem createModelItem(Node node){
        String id = Model.generateModelItemId();
        ModelItem modelItem;
        if (node.getNodeType() == Node.ELEMENT_NODE) {
            modelItem = new ElementItem(id);
        }
        else {
            modelItem = new NodeItem(id);
        }
        modelItem.setNode(node);
        return modelItem;
    }

    /**
     *
     * @return the nodeset the Bind is referring to via its binding attribute
     */
    public List getNodeset() {
        return this.nodeset;
    }


    /**
     * Returns the <code>type</code> attribute.
     *
     * @return the <code>type</code> attribute.
     */
    public String getDatatype() {
        return this.type;
    }

    /**
     * Returns the <code>readonly</code> attribute.
     *
     * @return the <code>readonly</code> attribute.
     */
    public String getReadonly() {
        return this.readonly;
    }

    /**
     * Returns the <code>required</code> attribute.
     *
     * @return the <code>required</code> attribute.
     */
    public String getRequired() {
        return this.required;
    }

    /**
     * Returns the <code>relevant</code> attribute.
     *
     * @return the <code>relevant</code> attribute.
     */
    public String getRelevant() {
        return this.relevant;
    }

    /**
     * Returns the <code>calculate</code> attribute.
     *
     * @return the <code>calculate</code> attribute.
     */
    public String getCalculate() {
        return this.calculate;
    }

    /**
     * Returns the <code>constraint</code> attribute.
     *
     * @return the <code>constraint</code> attribute.
     */
    public String getConstraint() {
        return this.constraint;
    }

    public List getConstraints(){
        return this.constraints;
    }

    public Map<String,String> getCustomMIPs() {
        return this.customMIPs;
    }

    /**
     * Returns the <code>p3ptype</code> attribute.
     *
     * @return the <code>p3ptype</code> attribute.
     * @deprecated deprecated without replacement
     */
    public String getP3PType() {
        return this.p3ptype;
    }

    /**
     * Returns the set of all node names referenced by the <code>readonly</code> expression.
     *
     * @return the set of all node names referenced by the <code>readonly</code> expression.
     */
    public Set getReadonlyReferences() {
        return this.readonlyReferences;
    }

    /**
     * Returns the set of all node names referenced by the <code>required</code> expression.
     *
     * @return the set of all node names referenced by the <code>required</code> expression.
     */
    public Set getRequiredReferences() {
        return this.requiredReferences;
    }

    /**
     * Returns the set of all node names referenced by the <code>relevant</code> expression.
     *
     * @return the set of all node names referenced by the <code>relevant</code> expression.
     */
    public Set getRelevantReferences() {
        return this.relevantReferences;
    }

    /**
     * Returns the set of all node names referenced by the <code>calculate</code> expression.
     *
     * @return the set of all node names referenced by the <code>calculate</code> expression.
     */
    public Set getCalculateReferences() {
        return this.calculateReferences;
    }
    /**
     * Returns the set of all node names referenced by the <code>constraint</code> expression.
     *
     * @return the set of all node names referenced by the <code>constraint</code> expression.
     */
    public Set getConstraintReferences() {
        return this.constraintReferences;
    }

    public Set getCustomMIPReferences(String customMIP) {
        return this.customMIPReferences.get(customMIP);
    }

    public Map<String, Set> getCustomMIPsReferences() {
        return this.customMIPReferences;
    }



    /**
     * Initializes all bound model items.
     *
     * @throws XFormsException if any error occured during model item init.
     */
    protected void initializeModelItems() throws XFormsException {
        String bindingExpression = getBindingExpression();
        Instance instance;

        // bindingExpression starts with 'instance' function
        if (bindingExpression != null && bindingExpression.startsWith("instance(")) {
            this.instanceId = XPathParseUtil.getInstanceParameter(bindingExpression);
        }
        // else - even if there's no binding expression at all the default instance is always the default ;)
        instance = getModel().getInstance(instanceId);


        List nodeset = this.nodeset;
        if (nodeset != null && nodeset.size() > 0) {
            /*
            * iterateModelItems lazily creates ModelItem object on the fly but they are not yet initialized.
            * This happens later during recalculation.
            */
            Iterator iterator = instance.iterateModelItems(nodeset, false);
            if (iterator != null) {
                ModelItem modelItem;
                while (iterator.hasNext()) {
                    modelItem = (ModelItem) iterator.next();
                    if (LOGGER.isDebugEnabled()) {
                        LOGGER.debug(this + " init: model item for " + DOMUtil.getCanonicalPath((Node) modelItem.getNode()));
                    }

                    // 4.2.1 - 4.b applying model item properties to each node
                    initializeModelItemProperties(modelItem);


                }
            }
        }
    }

    public List<ModelItem> getModelItems(){
        return this.modelItems;

/*
        Instance inst = this.model.getInstance(this.instanceId);

        List result = new ArrayList();
        Iterator iterator = inst.iterateModelItems(nodeset, false);
        if (iterator != null) {
            ModelItem modelItem;
            while (iterator.hasNext()) {
                modelItem = (ModelItem) iterator.next();
                result.add(modelItem);
            }
        }
        return result;
*/
    }

    /**
     * Initializes the DeclarationView for Bind object. Also picks up
     * all references the different mips have to other binds.
     *
     * @param item the model item.
     * @throws XFormsException if any error occured during model item properties init.
     */
    protected void initializeModelItemProperties(ModelItem item) throws XFormsException {
        DeclarationView declaration = item.getDeclarationView();

        LOGGER.warn("type checking still not working");

/*
        if (this.type != null) {
            if (declaration.getDatatype() != null) {
                throw new XFormsException("BINDING-EXCEPTION: property 'type' already present at model item", null, this.id);
            }

            if (!this.model.getValidator().isSupported(this.type)) {
                throw new XFormsException("BINDING-EXCEPTION: datatype '" + this.type + "' is not supported", null, this.id);
            }
            if (!this.model.getValidator().isKnown(this.type)) {
                throw new XFormsException("BINDING-EXCEPTION: datatype '" + this.type + "' is unknown", null, this.id);
            }

            declaration.setDatatype(this.type);
        }
*/

        if (this.readonly != null) {
            if (declaration.getReadonly() != null) {
                this.readonly = declaration.getReadonly() + " " + COMBINE_ONE + " " + this.readonly;
//                throw new XFormsBindingException("property 'readonly' already present at model item", this.target, this.id);
            }
            this.readonlyReferences = this.referenceFinder.getReferences(this.readonly, getPrefixMapping(), this.model);
            declaration.setReadonly(this.readonly);
        }

        if (this.required != null) {
            if (declaration.getRequired() != null) {
                this.required = declaration.getRequired() + " " + COMBINE_ONE + " " + this.required;
//                throw new XFormsBindingException("property 'required' already present at model item", this.target, this.id);
            }
            this.requiredReferences = this.referenceFinder.getReferences(this.required, getPrefixMapping(), this.model);
            declaration.setRequired(this.required);
        }

        if (this.relevant != null) {
            if (declaration.getRelevant() != null) {
                this.relevant = declaration.getRelevant() + " " + COMBINE_ONE + " " + this.relevant;
//                throw new XFormsBindingException("property 'relevant' already present at model item", this.target, this.id);
            }
            this.relevantReferences = this.referenceFinder.getReferences(this.relevant, getPrefixMapping(), this.model);
            declaration.setRelevant(this.relevant);
        }

        if (this.calculate != null) {
            if (declaration.getCalculate() != null) {
                throw new XFormsException("BINDING-EXCEPTION: property 'calculate' already present at model item", null, this.id);
            }

            declaration.setCalculate(this.calculate);
        }

        //should be: declaration.addConstraint(this.
//        if(this.constraints.size() != 0){
//
//        }
        if (this.constraint != null) {
            if (declaration.getConstraint() != null) {
                /* TODO ADAPT ME TO LIST ME*/
                this.constraint = declaration.getConstraint() + " " + COMBINE_ALL + " " + this.constraint;
            }

            /* TODO REMOVE ME*/
            declaration.setConstraint(this.constraint);
            declaration.setConstraints(this.constraints);
        }

        if (this.p3ptype != null) {
            if (declaration.getP3PType() != null) {
                throw new XFormsException("BINDING-EXCEPTION: property 'p3ptype' already present at model item", null, this.id);
            }

            declaration.setP3PType(this.p3ptype);
        }
//        this.modelItems.add(item);

        updateXPathContext();

    }


    /**
     * Updates the childEvaluationContext
     *
     * @throws XFormsException in case an XPathException happens during evaluation
     */
    public void updateXPathContext() throws XFormsException {

        List inscopeContext = BindUtil.evalInScopeContext(this.model, this.getElement());

        // if(LOGGER.isDebugEnabled()){
        // NodeWrapper info = (NodeWrapper) parentNodeset.get(0);
        // LOGGER.debug(this + " bound to Node:" + info.getUnderlyingNode());
        // LOGGER.debug("in scope xpath context for " + this + " = " +
        // BindingResolver.getExpressionPath(this,repeatItemId));
        // }

        final String relativeExpr = getBindingExpression();
        if (relativeExpr != null) {
            if (this.nodeset == null) {
                this.nodeset = new ArrayList();
            } else {
                // When rebuild is called we should clear the list before adding all the nodes again.
                this.nodeset.clear();
            }
            for (int i = 0; i < inscopeContext.size(); ++i) {
                this.nodeset.addAll(XPathCache.getInstance().evaluate(inscopeContext, i + 1, relativeExpr, getPrefixMapping(), xpathFunctionContext));
            }
        } else {
            this.nodeset = inscopeContext;
        }
    }





    /**
     * Returns the binding expression.
     *
     * @return the binding expression.
     */
    public String getBindingExpression() {
        if (this.element.hasAttribute("ref")) {
            return this.element.getAttribute("ref");
        }
        return this.element.getAttribute("set");
    }

    public String getInstanceId() {
        return instanceId;
    }

    @Override
    public void dispose() throws XFormsException {
    }

    @Override
    protected Log getLogger() {
        return LOGGER;
    }


    public void setReferenceFinder(BindFunctionReferenceFinderImpl bindFunctionReferenceFinder) {
        this.referenceFinder = bindFunctionReferenceFinder;
    }


    private String getMIP(short MIPType){
        String s=null;
        switch (MIPType){
            case TYPE:
                return getValueForMip("type",null);
            case READONLY:
                return getValueForMip("readonly","or");
            case REQUIRED:
                return getValueForMip("required","or");
            case RELEVANT:
                return getValueForMip("relevant","or");
            case CALCULATE:
                return getValueForMip("calculate",null);
            case CONSTRAINT:
                return getValueForMip("constraint","and");
            default:
                return null;
        }
    }

    private String getValueForMip(String mip, String combine){
        Element e;
        int len = 0;
        NodeList nl = null;
        // calculate and type cannot be combined
        if(combine == null){
            String s = this.element.getAttribute(mip);
            if(s != null){
                return s;
            }
            if(LOGGER.isWarnEnabled()){
                if(this.element.getElementsByTagNameNS(NamespaceConstants.BETTERFORM_NS, mip).getLength() != 0){
                    LOGGER.warn("<bf:" + mip + "> is not supported. Use @" + mip + " on bind element instead");
                }
            }
        }else{
            StringBuffer buf = new StringBuffer("");
            //check for existence of standard xforms mip attribute
            String s = this.element.getAttribute(mip);
            if(s != null){
                buf.append(s);
            }

            nl = this.element.getElementsByTagNameNS(NamespaceConstants.BETTERFORM_NS, mip);
            len = nl.getLength();

            for (int i = 0;i<len;i++){
                e = (Element) nl.item(i);
                if(s != null){
                    buf.append(" ").append(combine).append(" ");
                }
//                buf.append(e.getAttribute(XFormsConstants.VALUE_ATTRIBUTE));
                buf.append(getMIPAttributeOrElement(e));
                if(i < len-1){
                    buf.append(" ").append(combine).append(" ");
                }
            }
            if(buf.length() != 0){
                return buf.toString();
            }
        }

        return null;
    }

    private String getMIPAttributeOrElement(Element e){
        String mipValue =  e.getAttribute(XFormsConstants.VALUE_ATTRIBUTE);
        if(mipValue != ""){
            //value attribute takes precedence if present
            return mipValue;
        }else{
            Element valueElem = DOMUtil.findFirstChildNS(e,NamespaceConstants.BETTERFORM_NS,"value");
            return DOMUtil.getElementValue(valueElem).trim();
        }
    }

    private void registerConstraints(){
        String s = this.element.getAttribute("constraint");
        if(s != null){
            this.constraints.add(new ConstraintAttribute(this.element));
        }
        NodeList nl = this.element.getElementsByTagNameNS(NamespaceConstants.BETTERFORM_NS, "constraint");
        int len = nl.getLength();
        Element e;
        String id;
        for (int i = 0;i<len;i++){
            e = (Element) nl.item(i);
//            id = this.container.generateId();
//            e.setAttribute("id",id);
            this.constraints.add(new ConstraintElement(e,this.model));
        }

    }



    public Map getPrefixMapping() {
//        return Collections.unmodifiableMap(prefixMapping);
        return this.prefixMapping;
    }

    /**
     * returns the list of all attributes that are not in 'known' namespaces and do not have the null (default?) namespace
     *
     *
     * @return the key-value-pair of the attributes
     */
    public Map<String, String> getCustomMIPAttributes() {

        HashMap<String, String> customMIPAttributes = new HashMap<String, String>();
        NamedNodeMap nnm = element.getAttributes();
        for (int i = 0; i < nnm.getLength(); i++) {
            Node attribute = nnm.item(i);
            customMIPAttributes.put(attribute.getPrefix() + WordUtils.capitalize(attribute.getLocalName()), attribute.getTextContent());
        }
        return customMIPAttributes;
    }

}

// end of class
