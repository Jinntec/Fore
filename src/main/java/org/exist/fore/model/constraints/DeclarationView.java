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

import java.util.List;
import java.util.Map;

/**
 * Declaration viewport to model items. Provides access to declarations of a
 * model item's properties. 
 *
 * @author Ulrich Nicolas Liss&eacute;
 * @version $Id: DeclarationView.java 2090 2006-03-16 09:37:00Z joernt $
 */
public interface DeclarationView {

    /**
     * Returns the <code>type</code> declaration of a model item.
     *
     * @return the <code>type</code> declaration of a model item.
     */
    String getDatatype();

    /**
     * Sets the <code>type</code> declaration of a model item.
     *
     * @param datatype the <code>type</code> declaration of a model item.
     */
    void setDatatype(String datatype);

    /**
     * Returns the <code>readonly</code> declaration of a model item.
     *
     * @return the <code>readonly</code> declaration of a model item.
     */
    String getReadonly();

    /**
     * Sets the <code>readonly</code> declaration of a model item.
     *
     * @param readonly the <code>readonly</code> declaration of a model item.
     */
    void setReadonly(String readonly);

    /**
     * Returns the <code>required</code> declaration of a model item.
     *
     * @return the <code>required</code> declaration of a model item.
     */
    String getRequired();

    /**
     * Sets the <code>required</code> declaration of a model item.
     *
     * @param required the <code>required</code> declaration of a model item.
     */
    void setRequired(String required);

    /**
     * Returns the <code>relevant</code> declaration of a model item.
     *
     * @return the <code>relevant</code> declaration of a model item.
     */
    String getRelevant();

    /**
     * Sets the <code>relevant</code> declaration of a model item.
     *
     * @param relevant the <code>relevant</code> declaration of a model item.
     */
    void setRelevant(String relevant);

    /**
     * Returns the <code>calculate</code> declaration of a model item.
     *
     * @return the <code>calculate</code> declaration of a model item.
     */
    String getCalculate();

    /**
     * Sets the <code>calculate</code> declaration of a model item.
     *
     * @param calculate the <code>calculate</code> declaration of a model item.
     */
    void setCalculate(String calculate);

    /**
     * Returns the <code>constraint</code> declaration of a model item.
     *
     * @return the <code>constraint</code> declaration of a model item.
     */
    @Deprecated
    String getConstraint();

    List getConstraints();

    /**
     * Sets the <code>constraint</code> declaration of a model item.
     *
     * @param constraint the <code>constraint</code> declaration of a model
     * item.
     */
    @Deprecated
    void setConstraint(String constraint);

    void addConstraint(String constraint);

    /**
     * Returns the <code>p3ptype</code> declaration of a model item.
     *
     * @return the <code>p3ptype</code> declaration of a model item.
     * @deprecated without replacement
     */
    String getP3PType();

    /**
     * Sets the <code>p3ptype</code> declaration of a model item.
     *
     * @param p3ptype the <code>p3ptype</code> declaration of a model item.
     * @deprecated without replacement
     */
    void setP3PType(String p3ptype);
        
    Map<String, String> getCustomMIPs();
    
    void setCustomMIPs(Map<String, String> customMIPs);

    void setConstraints(List constraints);
}
