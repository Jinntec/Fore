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

import org.exist.fore.model.constraints.Constraint;

import java.util.List;

/**
 * Refresh Viewport to model items. Provides access to changes of a model
 * item's properties.
 *
 */
public interface RefreshView {

    void setValueChangedMarker();
    void setReadonlyMarker();
    void setReadWriteMarker();
    void setEnabledMarker();
    void setDisabledMarker();
    void setOptionalMarker();
    void setRequiredMarker();
    void setValidMarker();
    void setInvalidMarker();
    void setInvalids(List<Constraint> invalids);
    List<Constraint> getInvalids();

    void reset();

    boolean isValueChangedMarked();
    boolean isValidMarked();
    boolean isInvalidMarked();
    boolean isReadonlyMarked();
    boolean isReadwriteMarked();
    boolean isRequiredMarked();
    boolean isOptionalMarked();
    boolean isEnabledMarked();
    boolean isDisabledMarked();
}
