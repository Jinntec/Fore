/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore;


import org.exist.fore.model.Model;
import org.exist.fore.model.bind.Bind;
import org.exist.fore.xpath.BindFunctionReferenceFinderImpl;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.w3c.dom.events.EventTarget;


/**
 * Initializer holds some static methods that help with recursive initialization and updating of XFormsElement
 * instances.
 *
 * @author Ulrich Nicolas Liss&eacute;

 * @version $Id: Initializer.java 3477 2008-08-19 09:26:47Z joern $
 */
public class Initializer {
    /**
     * Avoids instantiation.
     */
    private Initializer() {
    }


    /**
     * Initializes all bind children of the specified element.
     *
     * @param model   the current context model.
     * @param element the element to start with.
     * @param bindFunctionReferenceFinder
     * @throws XFormsException if any error occurred during init.
     */
    public static void initializeBindElements(Model model, Element element, BindFunctionReferenceFinderImpl bindFunctionReferenceFinder) throws XFormsException {
        NodeList childNodes = element.getChildNodes();

        for (int index = 0; index < childNodes.getLength(); index++) {
            Node node = childNodes.item(index);

            if (node.getNodeType() == Node.ELEMENT_NODE) {
                Element elementImpl = (Element) node;

                if (elementImpl.getLocalName().equals("xf-bind")) {
                    Bind bindElement = new Bind(elementImpl, model);
                    bindElement.setReferenceFinder(bindFunctionReferenceFinder);
                    bindElement.init();
                }
            }
        }
    }

}

//end of class
