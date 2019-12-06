/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.model.constraints;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

/**
 * Default validator mode for instance validation during
 * <code>xforms-revalidate</code> processing.
 *
 * @author Ulrich Nicolas Liss&eacute;
 * @version $Id: OptimizedValidatorMode.java 2873 2007-09-28 09:08:48Z lars $
 */
public class OptimizedValidatorMode implements ValidatorMode {
    private static Log LOGGER = LogFactory.getLog(OptimizedValidatorMode.class);

    // implementation of 'de.betterform.xml.xforms.model.constraints.ValidatorMode'

    /**
     * Decide wether a particular model item has to be validated.
     *
     * @param modelItem the model item to be validated.
     * @return <code>true</true> if the model item's value has changed,
     *         otherwise <code>false</code>.
     */
    public boolean performValidation(ModelItem modelItem) {
        if (!modelItem.getStateChangeView().hasValueChanged()) {
            if (LOGGER.isTraceEnabled()) {
                LOGGER.trace("validate: item " + modelItem.getNode() + " is unmodified: validation skipped");
            }

            // skip unmodified item for performance reasons
            return false;
        }

        return true;
    }

    /**
     * Decide wether validation has to be continued after a particular model
     * item has been validated.
     *
     * @param modelItem the model item which has been validated.
     * @return <code>true</true>.
     */
    public boolean continueValidation(ModelItem modelItem) {
        // always continue to validate each item
        return true;
    }

    /**
     * Returns a string representation of this object.
     *
     * @return a string representation of this object.
     */
    public String toString() {
        return "optimized";
    }

}
