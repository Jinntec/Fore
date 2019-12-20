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

package org.exist.fore.model;

import junit.framework.TestCase;
import net.sf.saxon.dom.DOMNodeWrapper;
import org.exist.fore.XFormsException;
import org.exist.fore.model.bind.Bind;
import org.exist.fore.model.constraints.ModelItem;
import org.exist.fore.model.constraints.RefreshView;
import org.exist.fore.util.DOMUtil;
import org.junit.Before;
import org.junit.Test;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;

import java.util.Iterator;
import java.util.List;

public class InstanceFunctionTest extends TestCase {
    private Document doc;
    private Model model;

    @Before
    public void setUp() throws Exception {
        String path = getClass().getResource("two-instances.html").getPath();
        String fileURI = "file://" + path.substring(0, path.lastIndexOf("two-instances.html"));

        doc = DOMUtil.parseXmlFile(path,true,false);

        model = new Model(this.doc.getDocumentElement());
        model.init();
    }


    public void testInstanceFunction(){
        Bind b = model.getBind("b-greeting");
        List l = b.getModelItems();
        RefreshView rv = ((ModelItem)l.get(0)).getRefreshView();
        assertTrue(rv.isRequiredMarked());



    }
}