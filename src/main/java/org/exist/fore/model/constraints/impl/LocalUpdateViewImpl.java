/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.model.constraints.impl;

import org.exist.fore.model.constraints.LocalUpdateView;

import java.util.HashMap;
import java.util.Map;

/**
 * Local Update viewport implementation.
 *
 * @author Ulrich Nicolas Liss&eacute;
 * @version $Id: LocalUpdateViewImpl.java 2090 2006-03-16 09:37:00Z joernt $
 */
public class LocalUpdateViewImpl implements LocalUpdateView {

    private boolean datatypeValid;
    private boolean localReadonly;
    private boolean localRequired;
    private boolean localRelevant;
    private boolean constraintValid;
    private Map<String, String> customMIPValues;

    /**
     * Creates a new local update viewport implementation.
     */
    public LocalUpdateViewImpl() {
        // default settings
        this.datatypeValid = true;
        this.localReadonly = false;
        this.localRequired = false;
        this.localRelevant = true;
        this.constraintValid = true;
        this.customMIPValues = new HashMap<String, String>();
    }

    // implementation of 'de.betterform.xml.xforms.model.bind.LocalUpdateView'

    /**
     * Returns the local <code>datatype valid</code> state of a model item.
     *
     * @return the local <code>datatype valid</code> state of a model item.
     */
    public boolean isDatatypeValid() {
        return this.datatypeValid;
    }

    /**
     * Sets the datatype valid state of a model item.
     *
     * @param datatypeValid the local <code>datatype valid</code> state of a
     * model item.
     */
    public void setDatatypeValid(boolean datatypeValid) {
        this.datatypeValid = datatypeValid;
    }

    /**
     * Returns the local <code>readonly</code> state of a model item.
     *
     * @return the local <code>readonly</code> state of a model item.
     */
    public boolean isLocalReadonly() {
        return this.localReadonly;
    }

    /**
     * Sets the local <code>readonly</code> state of a model item.
     *
     * @param localReadonly the local <code>readonly</code> state of a model
     * item.
     */
    public void setLocalReadonly(boolean localReadonly) {
        this.localReadonly = localReadonly;
    }

    /**
     * Returns the <code>required</code> state state of a model item.
     *
     * @return the <code>required</code> state state of a model item.
     */
    public boolean isLocalRequired() {
        return this.localRequired;
    }

    /**
     * Sets the <code>required</code> state state of a model item.
     *
     * @param localRequired the <code>required</code> state state of a model
     * item.
     */
    public void setLocalRequired(boolean localRequired) {
        this.localRequired = localRequired;
    }

    /**
     * Returns the <code>relevant</code> state state of a model item.
     *
     * @return the <code>relevant</code> state state of a model item.
     */
    public boolean isLocalRelevant() {
        return this.localRelevant;
    }

    /**
     * Sets the <code>relevant</code> state state of a model item.
     *
     * @param localRelevant the <code>relevant</code> state state of a model
     * item.
     */
    public void setLocalRelevant(boolean localRelevant) {
        this.localRelevant = localRelevant;
    }

    /**
     * Returns the local <code>constraint valid</code> state of a model item.
     *
     * @return the local <code>constraint valid</code> state of a model item.
     */
    public boolean isConstraintValid() {
        return this.constraintValid;
    }

    /**
     * Sets the constraint valid state of a model item.
     *
     * @param constraintValid the local <code>constraint valid</code> state of a
     * model item.
     */
    public void setConstraintValid(boolean constraintValid) {
        this.constraintValid = constraintValid;
    }

	public Map<String, String> getCustomMIPValues() {
		return this.customMIPValues;
	}
	
	public void setCustomMIPValues(Map<String, String> customMIPValues) {
		this.customMIPValues = customMIPValues;
	}

}
