/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.xpath;


import org.exist.fore.XFormsElement;

/**
 * @author Nick Van den Bleeken
 * @version $Id$
 */
public class XPathFunctionContext {
	
	private final XFormsElement element;
	
	
	
	/**
	 * Constructs an XPathFunctionContext.
	 * 
	 * @param element the XFormsElement that is the evaluation context of this function
	 */
	public XPathFunctionContext(XFormsElement element) {
		this.element = element;
	}


	
	/**
	 * Returns the <code>XFormsElement</code> associated with this XPath function context. 
	 * 
	 * @return the <code>XFormsElement</code> associated with this XPath function context. Can be <code>null</code>. 
	 */
	public XFormsElement getXFormsElement()
	{
		return element;
	}
}
