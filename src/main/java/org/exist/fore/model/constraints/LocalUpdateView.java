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

package org.exist.fore.model.constraints;

import java.util.Map;

/**
 * Local Update viewport to model items. Provides access to local values of a
 * model item's properties.
 *
 * @author Ulrich Nicolas Liss&eacute;
 * @version $Id: LocalUpdateView.java 2090 2006-03-16 09:37:00Z joernt $
 */
public interface LocalUpdateView {

    /**
     * Returns the local <code>datatype valid</code> state of a model item.
     *
     * @return the local <code>datatype valid</code> state of a model item.
     */
    boolean isDatatypeValid();

    /**
     * Sets the datatype valid state of a model item.
     *
     * @param datatypeValid the local <code>datatype valid</code> state of a
     * model item.
     */
    void setDatatypeValid(boolean datatypeValid);

    /**
     * Returns the local <code>readonly</code> state of a model item.
     *
     * @return the local <code>readonly</code> state of a model item.
     */
    boolean isLocalReadonly();

    /**
     * Sets the local <code>readonly</code> state of a model item.
     *
     * @param localReadonly the local <code>readonly</code> state of a model
     * item.
     */
    void setLocalReadonly(boolean localReadonly);

    /**
     * Returns the <code>required</code> state state of a model item.
     *
     * @return the <code>required</code> state state of a model item.
     */
    boolean isLocalRequired();

    /**
     * Sets the <code>required</code> state state of a model item.
     *
     * @param localRequired the <code>required</code> state state of a model
     * item.
     */
    void setLocalRequired(boolean localRequired);

    /**
     * Returns the <code>relevant</code> state state of a model item.
     *
     * @return the <code>relevant</code> state state of a model item.
     */
    boolean isLocalRelevant();

    /**
     * Sets the <code>relevant</code> state state of a model item.
     *
     * @param localRelevant the <code>relevant</code> state state of a model
     * item.
     */
    void setLocalRelevant(boolean localRelevant);

    /**
     * Returns the local <code>constraint valid</code> state of a model item.
     *
     * @return the local <code>constraint valid</code> state of a model item.
     */
    boolean isConstraintValid();

    /**
     * Sets the constraint valid state of a model item.
     *
     * @param constraintValid the local <code>constraint valid</code> state of a
     * model item.
     */
    void setConstraintValid(boolean constraintValid);
        
	public Map<String, String> getCustomMIPValues();
	
	public void setCustomMIPValues(Map<String, String> customMIPValues);
    

}
