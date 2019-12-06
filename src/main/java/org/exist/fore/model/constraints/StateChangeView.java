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

/**
 * State Change viewport to model items. Provides access to changes of a model
 * item's properties.
 *
 * @author Ulrich Nicolas Liss&eacute;
 * @version $Id: StateChangeView.java 2090 2006-03-16 09:37:00Z joernt $
 */
public interface StateChangeView {

    /**
     * Returns the valid change state of a model item.
     *
     * @return the valid change state of a model item.
     */
    boolean hasValidChanged();

    /**
     * Returns the readonly change state of a model item.
     *
     * @return the readonly change state of a model item.
     */
    boolean hasReadonlyChanged();

    /**
     * Returns the required change state of a model item.
     *
     * @return the required change state of a model item.
     */
    boolean hasRequiredChanged();

    /**
     * Returns the enabled change state of a model item.
     *
     * @return the enabled change state of a model item.
     */
    boolean hasEnabledChanged();

    /**
     * Returns the value change state of a model item.
     *
     * @return the value change state of a model item.
     */
    boolean hasValueChanged();
        
    boolean hasCustomMIPChanged(String key);

    /**
     * Resets all state changes so that no changes are reported.
     */
    void reset();

}
