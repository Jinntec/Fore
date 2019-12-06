/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.model.constraints.impl;

import org.exist.fore.model.constraints.DeclarationView;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Declaration viewport implementation.
 *
 * @author Ulrich Nicolas Liss&eacute;
 * @version $Id: DeclarationViewImpl.java 2090 2006-03-16 09:37:00Z joernt $
 */
public class DeclarationViewImpl implements DeclarationView {
    private static Log LOGGER = LogFactory.getLog(DeclarationView.class);

    private String datatype;
    private String readonly;
    private String required;
    private String relevant;
    private String calculate;
    private String constraint;
    private List constraints;
    private Map<String,String> customMIPs;
    private String p3ptype;

    /**
     * Creates a new declaration viewport implementation.
     */
    public DeclarationViewImpl() {
        this.constraints=new ArrayList();
    }

    // implementation of 'de.betterform.xml.xforms.model.bind.DeclarationView'

    /**
     * Returns the <code>type</code> declaration of a model item.
     *
     * @return the <code>type</code> declaration of a model item.
     */
    public String getDatatype() {
        return this.datatype;
    }

    /**
     * Sets the <code>type</code> declaration of a model item.
     *
     * @param datatype the <code>type</code> declaration of a model item.
     */
    public void setDatatype(String datatype) {
        if(LOGGER.isDebugEnabled()){
            LOGGER.debug("datatype set to: " + datatype);
        }
        this.datatype = datatype;
    }

    /**
     * Returns the <code>readonly</code> declaration of a model item.
     *
     * @return the <code>readonly</code> declaration of a model item.
     */
    public String getReadonly() {
        return this.readonly;
    }

    /**
     * Sets the <code>readonly</code> declaration of a model item.
     *
     * @param readonly the <code>readonly</code> declaration of a model item.
     */
    public void setReadonly(String readonly) {
        this.readonly = readonly;
    }

    /**
     * Returns the <code>required</code> declaration of a model item.
     *
     * @return the <code>required</code> declaration of a model item.
     */
    public String getRequired() {
        return this.required;
    }

    /**
     * Sets the <code>required</code> declaration of a model item.
     *
     * @param required the <code>required</code> declaration of a model item.
     */
    public void setRequired(String required) {
        this.required = required;
    }

    /**
     * Returns the <code>relevant</code> declaration of a model item.
     *
     * @return the <code>relevant</code> declaration of a model item.
     */
    public String getRelevant() {
        return this.relevant;
    }

    /**
     * Sets the <code>relevant</code> declaration of a model item.
     *
     * @param relevant the <code>relevant</code> declaration of a model item.
     */
    public void setRelevant(String relevant) {
        this.relevant = relevant;
    }

    /**
     * Returns the <code>calculate</code> declaration of a model item.
     *
     * @return the <code>calculate</code> declaration of a model item.
     */
    public String getCalculate() {
        return this.calculate;
    }

    /**
     * Sets the <code>calculate</code> declaration of a model item.
     *
     * @param calculate the <code>calculate</code> declaration of a model item.
     */
    public void setCalculate(String calculate) {
        this.calculate = calculate;
    }

    /**
     * Returns the <code>constraint</code> declaration of a model item.
     *
     * @return the <code>constraint</code> declaration of a model item.
     */
    @Deprecated
    public String getConstraint() {
        return this.constraint;
    }

    public List getConstraints() {
        return this.constraints;
    }

    /**
     * Sets the <code>constraint</code> declaration of a model item.
     *
     * @param constraint the <code>constraint</code> declaration of a model
     * item.
     */
    @Deprecated
    public void setConstraint(String constraint) {
        this.constraint = constraint;
    }

    public void setConstraints(List constraints) {
        this.constraints = constraints;
    }

    public void addConstraint(String constraint) {
        this.constraints.add(constraint);
    }

    /**
     * Returns the <code>p3ptype</code> declaration of a model item.
     *
     * @return the <code>p3ptype</code> declaration of a model item.
     */
    public String getP3PType() {
        return this.p3ptype;
    }

    /**
     * Sets the <code>p3ptype</code> declaration of a model item.
     *
     * @param p3ptype the <code>p3ptype</code> declaration of a model item.
     */
    public void setP3PType(String p3ptype) {
        this.p3ptype = p3ptype;
    }

    public Map<String, String> getCustomMIPs() {
        return this.customMIPs;
    }

    public void setCustomMIPs(Map<String, String>  customMIPs) {
        this.customMIPs = customMIPs;
    } 
      
}
