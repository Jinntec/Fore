/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.model.constraints;


import net.sf.saxon.trans.XPathException;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.xerces.impl.dv.InvalidDatatypeValueException;
import org.apache.xerces.impl.dv.ValidatedInfo;
import org.apache.xerces.impl.dv.XSSimpleType;
import org.apache.xerces.impl.dv.xs.XSSimpleTypeDecl;
import org.apache.xerces.impl.validation.ValidationState;
import org.apache.xerces.impl.xs.XSComplexTypeDecl;
import org.apache.xerces.util.NamespaceSupport;
import org.apache.xerces.xs.XSConstants;
import org.exist.fore.XFormsException;
import org.exist.fore.model.Instance;
import org.exist.fore.model.Model;
import org.exist.fore.util.DOMUtil;
import org.exist.fore.xpath.NamespaceConstants;
import org.exist.fore.xpath.NamespaceResolver;
import org.exist.fore.xpath.XPathFunctionContext;
import org.w3c.dom.Node;

import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;


/**
 * Validates instance data items.
 *
 * @author Ulrich Nicolas Liss&eacute;
 * @version $Id: Validator.java 3508 2008-08-31 10:03:03Z lars $
 */
public class Validator {

    private static Log LOGGER = LogFactory.getLog(Validator.class);

    private static String TYPE_STRING = "string";
    private static String TYPE_NS_STRING = NamespaceResolver.expand(NamespaceConstants.XFORMS_NS, Validator.TYPE_STRING);

    //XML Schema datatypes that are not supported -> 5.1 XML Schema Built-in Datatypes
    private static String TYPE_DURATION = "duration";
    private static String TYPE_NS_DURATION = NamespaceResolver.expand(NamespaceConstants.XMLSCHEMA_NS, Validator.TYPE_DURATION);
    private static String TYPE_ENTITY = "ENTITY";
    private static String TYPE_NS_ENTITY = NamespaceResolver.expand(NamespaceConstants.XMLSCHEMA_NS, Validator.TYPE_ENTITY);
    private static String TYPE_ENTITIES = "ENTITIES";
    private static String TYPE_NS_ENTITIES = NamespaceResolver.expand(NamespaceConstants.XMLSCHEMA_NS, Validator.TYPE_ENTITIES);
    private static String TYPE_NOTATION = "NOTATION";
    private static String TYPE_NS_NOTATION = NamespaceResolver.expand(NamespaceConstants.XMLSCHEMA_NS, Validator.TYPE_NOTATION);

    private Model model;
    private Map datatypes;
    private ValidatorMode mode;

    /**
     * Creates a new Validator.
     */
    public Validator() {
        // set validator mode
        this.mode = new OptimizedValidatorMode();
    }

    /**
     * Returns the Model of this Validator.
     *
     * @return the Model of this Validator.
     */
    public Model getModel() {
        return this.model;
    }

    /**
     * Sets the Model of this Validator.
     *
     * @param model the Model of this Validator.
     */
    public void setModel(Model model) {
        this.model = model;
    }

    /**
     * Returns the Schema Datatype definitions of this Validator.
     *
     * @return the Schema Datatype definitions of this Validator.
     */
    public Map getDatatypes() {
        return this.datatypes;
    }

    /**
     * Sets the Schema Datatype definitions of this Validator.
     *
     * @param datatypes the Schema Datatype definitions of this Validator.
     */
    public void setDatatypes(Map datatypes) {
        this.datatypes = datatypes;
    }

    /**
     * Checks wether the specified Schema Datatype definition is known by this
     * Validator.
     *
     * @param name the name of the Schema Datatype definition.
     * @return <code>true</code> if the specified Schema Datatype definition is
     *         known, otherwise <code>false</code>.
     */
    public boolean isKnown(String name) {
        if (this.datatypes == null) {
            return false;
        }

        String expandedName = NamespaceResolver.getExpandedName(this.model.getElement(), name);
        return this.datatypes.get(expandedName) != null;
    }

    /**
     * Checks wether the specified Schema Datatype definition is supported by
     * this Validator.
     *
     * @param name the name of the Schema Datatype definition.
     * @return <code>true</code> if the specified Schema Datatype definition is
     *         supported, otherwise <code>false</code>.
     */
    public boolean isSupported(String name) {
        String expandedName = NamespaceResolver.getExpandedName(this.model.getElement(), name);

        return !(TYPE_DURATION.equals(expandedName) || TYPE_NS_DURATION.equals(expandedName) ||
                TYPE_ENTITY.equals(expandedName) || TYPE_NS_ENTITY.equals(expandedName) ||
                TYPE_ENTITIES.equals(expandedName) || TYPE_NS_ENTITIES.equals(expandedName) ||
                TYPE_NOTATION.equals(expandedName) || TYPE_NS_NOTATION.equals(expandedName));

    }

    /**
     * Checks wether the Schema Datatype definition specified by the
     * <code>restriction</code> parameter is derived by restriction from the
     * Schema Datatype definition specified by the <code>base</code> parameter.
     *
     * @param base the restriction of the base Schema Datatype definition.
     * @param restriction the restriction of the restricted Schema Datatype
     * definition.
     * @return <code>true</code> if both specified Schema Datatype definitions
     *         are known by this Validator and the second definition is derived
     *         by restriction from the first, otherwise <code>false</code>.
     */
    public boolean isRestricted(String base, String restriction) {
        if (this.datatypes == null) {
            return false;
        }

        String baseName = NamespaceResolver.getExpandedName(this.model.getElement(), base);
        XSSimpleType baseType = (XSSimpleType) this.datatypes.get(baseName);
        if (baseType == null) {
            return false;
        }

        String restrictionName = NamespaceResolver.getExpandedName(this.model.getElement(), restriction);
        Object restrictionType = this.datatypes.get(restrictionName);
        if (restrictionType == null) {
            return false;
        }

        if (restrictionType instanceof XSSimpleTypeDecl) {
            return ((XSSimpleTypeDecl) restrictionType).isDOMDerivedFrom(baseType.getNamespace(), baseType.getName(), XSConstants.DERIVATION_LIST);
        } else if (restrictionType instanceof XSComplexTypeDecl) {
            return ((XSComplexTypeDecl) restrictionType).isDOMDerivedFrom(baseType.getNamespace(), baseType.getName(), XSConstants.DERIVATION_LIST);
        }
        return ((XSSimpleType) restrictionType).derivedFromType(baseType, XSConstants.DERIVATION_RESTRICTION);
    }

    /**
     * Validates the specified instance data nodes.
     *
     * @param instance the instance to be validated.
     * @throws XPathException 
     */
    public void validate(Instance instance) throws XFormsException {
        // during init validate model items in default mode: no items are
        // ignored and nothing discontinues validation. once the model is ready,
        // model items are validated in optzimized mode which simply skips
        // all unmodified model items.
        validate(instance, instance.getInstanceNodeset(), 1, "/", Collections.EMPTY_MAP, null, this.model.isReady() ? this.mode : new DefaultValidatorMode());
    }

    /**
     * Validates the specified instance data node and its descendants.
     *
     * @param instance the instance to be validated.
     * @param path an xpath selecting an arbitrary subtree of the instance.
     * @param mode a validator mode steering the validation process.
     * @throws XPathException 
     */
    public void validate(Instance instance, List instanceNodeset, int position, String path, Map prefixMapping, XPathFunctionContext xpathFunctionContext, ValidatorMode mode) throws XFormsException {
        if (LOGGER.isDebugEnabled()) {
            //XXX fix logging
            LOGGER.debug("validate Instance '" + instance.getId() + "' in " + mode + " mode");
        }

        Iterator iterator = instance.iterateModelItems(instanceNodeset, position, path, prefixMapping, xpathFunctionContext, true);
        ModelItem modelItem;
        while (iterator.hasNext()) {
            modelItem = (ModelItem) iterator.next();

            if (mode.performValidation(modelItem)) {
                validate(modelItem);
            }

            if (!mode.continueValidation(modelItem)) {
                return;
            }
        }
    }

    /**
     * Validates the specified model item.
     *
     * @param modelItem the model item to be validated.
     */
    public void validate(ModelItem modelItem) {
        // obtain value to be checked
        String value = modelItem.getValue();

        // check for nillable type
        if (modelItem.isXSINillable() && (value == null || value.length() == 0)) {
            if (LOGGER.isTraceEnabled()) {
                String xsiPrefix = NamespaceResolver.getPrefix(this.model.getElement(), NamespaceConstants.XMLSCHEMA_INSTANCE_NS);
                LOGGER.trace("validate: item " + modelItem.getNode() + " with @" + xsiPrefix + ":nil='true' considered valid");
            }

            // item is considered valid regardless which type it has
            modelItem.getLocalUpdateView().setDatatypeValid(true);
            return;
        }

        // compute datatype validity
        boolean datatypeValid = true;

        // first check xsi:type ...
        String xsiType = expandName(modelItem.getXSIType());
        if (xsiType != null && !isDefaultType(xsiType) && isKnown(modelItem.getXSIType())) {
            // only check non-string datatypes
            datatypeValid = checkDatatype(xsiType, value);
        }

        // ... then check xf:type
        String xfType = expandName(modelItem.getDeclarationView().getDatatype());
        if (xfType != null && !isDefaultType(xfType)) {
            // only check non-string datatypes
            datatypeValid &= checkDatatype(xfType, value);
        }

        if (LOGGER.isTraceEnabled()) {
            LOGGER.trace("validate: " + DOMUtil.getCanonicalPath((Node) modelItem.getNode()) + " computed " + (datatypeValid ? "valid" : "INVALID"));
        }

        // set datatype validity
        modelItem.getLocalUpdateView().setDatatypeValid(datatypeValid);
    }

    private String expandName(String datatype) {
        return datatype != null ? NamespaceResolver.getExpandedName(this.model.getElement(), datatype) : null;
    }

    private boolean isDefaultType(String expandedName) {
        return TYPE_STRING.equals(expandedName) || TYPE_NS_STRING.equals(expandedName);
    }

    private boolean checkDatatype(String expandedName, String value) {
        XSSimpleType simpleType = (XSSimpleType) this.datatypes.get(expandedName);
        ValidatedInfo validatedInfo = new ValidatedInfo();
        ValidationState validationState = new ValidationState();
        validationState.setFacetChecking(true);
        validationState.setExtraChecking(false);
        validationState.setUsingNamespaces(true);

        if(LOGGER.isTraceEnabled()){
            LOGGER.trace("checking datatype - expandedName: " + expandedName);
        }
        // TODO: does not yet work with restricted QNames
        if(expandedName.endsWith("QName") && value.indexOf(":") != -1){
            NamespaceSupport support = new NamespaceSupport();
            support.pushContext();
            String nsPrefix = value.substring(0,value.indexOf(":")).intern();
            Map namespaces = NamespaceResolver.getAllNamespaces(this.model.getElement());
            String nsURI  = (String) namespaces.get(nsPrefix);

            if(nsPrefix != null && nsURI != null) {
                support.declarePrefix(nsPrefix, nsURI);
                validationState.setNamespaceSupport(support);
            }
        }

        //TODO: handle nullpointer see Testcase 8.1.4.b
        try {
            simpleType.validate(value.intern() , validationState, validatedInfo);
        }
        catch (InvalidDatatypeValueException e) {
            if(LOGGER.isTraceEnabled()){
                LOGGER.trace("value '" + value + "' of type " + expandedName + " is invalid - " + e.getMessage());
            }
            return false;
        }

        return true;
    }
}

// end of class
