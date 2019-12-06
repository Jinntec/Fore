/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.xpath;

/**
 * Common namespace URIs and prefixes.
 *
 * @author Ulrich Nicolas Liss&eacute;
 * @version $Id: NamespaceConstants.java 3253 2008-07-08 09:26:40Z lasse $
 */
public interface NamespaceConstants {

    /**
     * The betterForm namespace (will be declared automatically).
     */
    String BETTERFORM_NS = "http://betterform.sourceforge.net/xforms";

    /**
     * The betterForm namespace prefix.
     */
    String BETTERFORM_PREFIX = "bf";

    /**
     * The XForms namespace.
     */
    String XFORMS_NS = "http://www.w3.org/2002/xforms";

    /**
     * The XForms namespace prefix.
     */
    String XFORMS_PREFIX = "xf";

    /**
     * The XHTML namespace (default namespace for generated and transformed
     * documents).
     */
    String XHTML_NS = "http://www.w3.org/1999/xhtml";

    /**
     * The XHTML namespace prefix.
     */
    String XHTML_PREFIX = "xhtml";

    /**
     * The XML namespace.
     */
    String XML_NS = "http://www.w3.org/XML/1998/namespace";

    /**
     * The XML namespace prefix.
     */
    String XML_PREFIX = "xml";

    /**
     * The XMLNS namespace.
     */
    String XMLNS_NS = "http://www.w3.org/2000/xmlns/";

    /**
     * The XMLNS namespace prefix.
     */
    String XMLNS_PREFIX = "xmlns";

    /**
     * The XML Events namespace.
     */
    String XMLEVENTS_NS = "http://www.w3.org/2001/xml-events";

    /**
     * The XML Events namespace prefix.
     */
    String XMLEVENTS_PREFIX = "ev";

    /**
     * The XML Schema namespace.
     */
    String XMLSCHEMA_NS = "http://www.w3.org/2001/XMLSchema";

    /**
     * The XML Schema namespace prefix.
     */
    String XMLSCHEMA_PREFIX = "xs";

    /**
     * The XML Schema Instance namespace.
     */
    String XMLSCHEMA_INSTANCE_NS = "http://www.w3.org/2001/XMLSchema-instance";

    /**
     * The XML Schema Instance namespace prefix.
     */
    String XMLSCHEMA_INSTANCE_PREFIX = "xsi";
    
}
