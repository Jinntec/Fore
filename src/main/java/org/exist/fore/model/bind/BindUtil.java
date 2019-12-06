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

package org.exist.fore.model.bind;

import org.exist.fore.model.Model;
import org.exist.fore.xpath.XPathParseUtil;
import org.w3c.dom.Element;

import java.util.Collections;
import java.util.List;

public class BindUtil {

    /**
     * evaluates the 'in scope evaluation context' and returns a List of NodeInfo objects representing the
     * bound nodes. If no binding element is found on the ancestor axis the default instance for this model
     * is returned.
     * <p/>
     *
     * @return a List of NodeInfo objects representing the bound nodes of this XFormsElement
     */
    public static List evalInScopeContext(Model model, Element bind) {
        final List resultNodeset;
        //todo: error here - parentBind is no bind element
//        Element parentBind = (Element) bind.getParentNode();
        Element parentBind = getParentBind(bind);
        if(parentBind != null){
//            resultNodeset = (List) parentBind.getUserData("boundNodes");
            Bind b = (Bind) parentBind.getUserData("xf-bind");
            resultNodeset = (List) b.getNodeset();
//            resultNodeset = (List) parentBind.;
        }else if( BindUtil.hasAbsoluteBinding(bind)){
            String instanceId = XPathParseUtil.getInstanceParameter(BindUtil.getBindExpr(bind));
            resultNodeset = model.getInstance(instanceId).getInstanceNodeset();
        }else if(model.getDefaultInstance() != null){
            resultNodeset = model.getDefaultInstance().getInstanceNodeset();
        }else {
            resultNodeset = Collections.EMPTY_LIST;
        }

        return resultNodeset;
    }

    private static Element getParentBind(Element element){
        Element parent = (Element) element.getParentNode();

        if(parent != null && parent.getNodeName().equalsIgnoreCase("xf-bind")){
            return parent;
        }
        return null;
    }

    public static boolean hasAbsoluteBinding(Element bind){
        String binding = getBindExpr(bind);
        return binding.startsWith("instance(");
    }

    public static String getBindExpr(Element bind) {
        return bind.getAttribute("ref") + bind.getAttribute("set");
    }

}
