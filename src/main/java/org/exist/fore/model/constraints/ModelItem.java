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

import org.exist.fore.model.Model;

/**
 * Model Item.
 *
 * @author Ulrich Nicolas Liss&eacute;
 * @version $Id: ModelItem.java 3253 2008-07-08 09:26:40Z lasse $
 */
public interface ModelItem {

    /**
     * Returns the id of this model item.
     *
     * @return the id of this model item.
     */
    String getId();

    /**
     * Returns the node of this model item.
     *
     * @return the node of this model item.
     * todo: see setNode
     */
    Object getNode();

    /**
     * Sets the node of this model item.
     *
     * @param node the node of this model item.
     *
     * todo: should maybe named 'setElement' if we only need it for that purpose
     */
    void setNode(Object node);

    /**
     * Returns the parent of this model item.
     *
     * @return the parent of this model item.
     */
    ModelItem getParent();

    /**
     * Sets the parent of this model item.
     *
     * @param parent the parent of this model item.
     */
    void setParent(ModelItem parent);

    /**
     * Returns the computed <code>readonly</code> state.
     * <p/>
     * A model item is readonly when its readonly property evaluates to
     * <code>true</code> <i>or</i> its parent item is readonly.
     *
     * @return the computed <code>readonly</code> state.
     */
    boolean isReadonly();

    /**
     * Returns the computed <code>required</code> state.
     * <p/>
     * A model item is required when its required property evaluates to
     * <code>true</code>.
     *
     * @return the computed <code>required</code> state.
     */
    boolean isRequired();

    /**
     * Returns the computed <code>enabled</code> state.
     * <p/>
     * A model item is enabled when its relevant property evaluates to
     * <code>true</code> <i>and</i> its parent item is enabled.
     *
     * @return the computed <code>enabled</code> state.
     */
    boolean isRelevant();

    /**
     * Returns the computed <code>valid</code> state.
     * <p/>
     * A model item is valid when its constraint property evaluates to
     * <code>true</code> <i>and</i> the type property is satisfied.
     *
     * @return the computed <code>valid</code> state.
     */
    boolean isValid();

    /**
     * Returns the value of this model item.
     *
     * @return the value of this model item.
     */
    String getValue();

    /**
     * Returns the declaration view of this model item.
     *
     * @return the declaration view of this model item.
     */
    DeclarationView getDeclarationView();

    /**
     * Returns the local update view of this model item.
     *
     * @return the local update view of this model item.
     */
    LocalUpdateView getLocalUpdateView();

    /**
     * Returns the state change view of this model item.
     *
     * @return the state change view of this model item.
     */
    StateChangeView getStateChangeView();

    RefreshView getRefreshView();

    /**
     * Checks wether this model item is nillable.
     * <p/>
     * A model item is considered nillable if it is an element and has a
     * <code>xsi:nil</code> attribute with the value <code>true</code>.
     *
     * @return <code>true</code> if this model item is nillable, otherwise
     * <code>false</code>.
     */
    boolean isXSINillable();

    /**
     * Returns the additional schema type declaration of this model item.
     * <p/>
     * A model item has an additional schema type declaration if it is an
     * element and has a <code>xsi:type</code> attribute.
     *
     * @return the additional schema type declaration of this model item or
     * <code>null</code> if there is no such type declaration.
     */
    String getXSIType();

    // todo: file upload fixes, the following methods are needed for form-data serialization ...
    void setFilename(String filename);

    String getFilename();

    void setMediatype(String mediatype);

    String getMediatype();

    /**
     * Sets the value of this model item.
     *
     * @param value the value of this model item.
     */
    boolean setValue(String value);

    
    public Model getModel();

    public String toString();

}
