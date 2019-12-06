/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.model.constraints;


/**
 * Provides finer control over model item validation.
 *
 * @author Ulrich Nicolas Liss&eacute;
 * @version $Id: ValidatorMode.java 2100 2006-03-28 16:36:43Z unl $
 */
public interface ValidatorMode {

    /**
     * Decide wether a particular model item has to be validated.
     *
     * @param modelItem the model item to be validated.
     * @return <code>true</true> if the model item has to be validated,
     * <cdoe>false</code> otherwise.
     */
    boolean performValidation(ModelItem modelItem);

    /**
     * Decide wether validation has to be continued after a particular model
     * item has been validated.
     *
     * @param modelItem the model item which has been validated.
     * @return <code>true</true> if validation has to be continued,
     * <cdoe>false</code> otherwise.
     */
    boolean continueValidation(ModelItem modelItem);

}
