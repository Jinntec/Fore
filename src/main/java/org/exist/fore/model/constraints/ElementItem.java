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

import org.exist.fore.xpath.NamespaceConstants;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

/**
 * ModelItem implementation based on Xerces' ElementImpl.
 *
 * @author Ulrich Nicolas Liss&eacute;
 * @version $Id: XercesElementImpl.java 2354 2006-10-04 18:41:48Z unl $
 */
public class ElementItem extends NodeItem {

    private Element element;

    /**
     * Creates a new Xerces ElementImpl based ModelItem implementation.
     *
     * @param id the id of this model item.
     */
    public ElementItem(String id) {
        super(id);
    }

    /**
     * Returns the node of this model item.
     *
     * @return the node of this model item.
     */
    public Object getNode() {
        return this.element;
    }

    /**
     * Stes the node of this model item.
     *
     * @param node the node of this model item.
     */
    public void setNode(Object node) {
        this.element = (Element) node;
        this.node = (Node) node;
    }

    /**
     * Returns the value of this model item.
     *
     * @return the value of this model item.
     */
    public String getValue() {
        Node child;
        NodeList children = this.element.getChildNodes();
        for (int index = 0; index < children.getLength(); index++) {
            child = children.item(index);
            if (Node.TEXT_NODE == child.getNodeType() ||
                    Node.CDATA_SECTION_NODE == child.getNodeType()) {
                return child.getNodeValue();
            }
        }

        return "";
    }

    /**
     * Sets the value of this model item.
     *
     * @param value the value of this model item.
     */
    public boolean setValue(String value) {
        if (valueChanged(value)) {
            // check for @xsi:nil
            Node nil = this.element.getAttributeNodeNS(NamespaceConstants.XMLSCHEMA_INSTANCE_NS, "nil");
            if (nil != null) {
                nil.setNodeValue(String.valueOf(value == null || value.length() == 0));
            }

            Node child;
            NodeList children = this.element.getChildNodes();
            for (int index = 0; index < children.getLength(); index++) {
                child = children.item(index);
                if (Node.TEXT_NODE == child.getNodeType() ||
                        Node.CDATA_SECTION_NODE == child.getNodeType()) {
                    child.setNodeValue(value);
                    return true;
                }
            }

            this.element.insertBefore(this.element.getOwnerDocument().createTextNode(value), this.element.getFirstChild());
            return true;
        }else {
            return false;
        }
    }


    /**
     * Checks wether this model item is nillable.
     * <p/>
     * A model item is considered nillable if it is an element and has a
     * <code>xsi:nil</code> attribute with the value <code>true</code>.
     *
     * @return <code>true</code> if this model item is nillable, otherwise
     * <code>false</code>.
     */
    public boolean isXSINillable() {
        return this.element.getAttributeNS(NamespaceConstants.XMLSCHEMA_INSTANCE_NS, "nil").equals("true");
    }

    /**
     * Returns the additional schema type declaration of this model item.
     * <p/>
     * A model item has an additional schema type declaration if it is an
     * element and has a <code>xsi:type</code> attribute.
     *
     * @return the additional schema type declaration of this model item or
     * <code>null</code> if there is no such type declaration.
     */
    public String getXSIType() {
        return this.element.hasAttributeNS(NamespaceConstants.XMLSCHEMA_INSTANCE_NS, "type")
                ? this.element.getAttributeNS(NamespaceConstants.XMLSCHEMA_INSTANCE_NS, "type")
                : null;
    }

}
