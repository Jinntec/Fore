/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.xpath;

import net.sf.saxon.Controller;
import net.sf.saxon.dom.DOMNodeWrapper;
import net.sf.saxon.expr.Expression;
import net.sf.saxon.expr.FunctionCall;
import net.sf.saxon.expr.XPathContext;
import net.sf.saxon.expr.SystemFunctionCall;
import net.sf.saxon.functions.SystemFunction;
import net.sf.saxon.om.Item;
import net.sf.saxon.s9api.ExtensionFunction;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.exist.fore.XFormsElement;
import org.exist.fore.model.Model;
import org.w3c.dom.Element;
import org.w3c.dom.Node;

/**
 * This class is the base class for all the XForms functions. "XForms functions"
 * here means the XForms 1.0 functions.
 */

public abstract class XFormsFunction extends SystemFunction{
   private static final Log LOGGER = LogFactory.getLog(XFormsFunction.class);


    /**
     * @param xpathContext
     * @return
     */
    protected XPathFunctionContext getFunctionContext(XPathContext xpathContext) {
        XPathFunctionContext functionContext = (XPathFunctionContext) xpathContext.getController().getUserData(Model.class.toString(),
                XPathFunctionContext.class.toString());

//        XPathFunctionContext functionContext =  new XPathFunctionContext()
        return functionContext;
    }

//    /**
//     * Determine which aspects of the context the expression depends on. The result is
//     * a bitwise-or'ed value composed from constants such as XPathContext.VARIABLES and
//     * XPathContext.CURRENT_NODE
//     */
//
//     public int getIntrinsicDependencies() {
//         //int depend = StaticProperty.HAS_SIDE_EFFECTS;
//         return ( StaticProperty.DEPENDS_ON_CONTEXT_ITEM |
//                 StaticProperty.DEPENDS_ON_POSITION |
//                 StaticProperty.DEPENDS_ON_LAST );
//     }

/*
    protected Container getContainer(XPathContext xpathContext) {
        Item item = xpathContext.getContextItem();
        Node n = (Node) ((DOMNodeWrapper) item).getUnderlyingNode();
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("context node: " + n.getNodeName());
        }

        Element root = n.getOwnerDocument().getDocumentElement();
        Object container = root.getUserData("container");
        if (container instanceof Model) {
            return (Container) container;
        } else {
            return null;
        }
    }
*/
}
