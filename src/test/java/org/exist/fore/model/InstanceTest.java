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
import org.exist.fore.model.constraints.ModelItem;
import org.exist.fore.util.DOMUtil;
import org.junit.Before;
import org.junit.Test;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;

import java.util.Iterator;
import java.util.List;

import static org.junit.Assert.*;

public class InstanceTest extends TestCase {
    private Document doc;
    private Model model;

    @Before
    public void setUp() throws Exception {
        String path = getClass().getResource("simple.html").getPath();
        String fileURI = "file://" + path.substring(0, path.lastIndexOf("simple.html"));

        doc = DOMUtil.parseXmlFile(path,true,false);

        model = new Model(this.doc.getDocumentElement());
        model.init();
    }

/*
    public void createModelItem() {
    }
*/

    public void testGetInitialInstance() {
        Document initial = this.model.getDefaultInstance().getInitialInstance();
        assertTrue(initial instanceof Document);
        assertNotNull(initial.getDocumentElement().getElementsByTagName("greeting"));
    }


    @Test
    public void testGetInstanceDocument() {
        assertTrue(this.model.getDefaultInstance() instanceof Instance);
        assertTrue(this.model.getDefaultInstance().getInstanceDocument() instanceof Document);
    }

    public void testGetDefaultInstance(){
        assertNotNull(this.model.getDefaultInstance());
        assertTrue(this.model.getDefaultInstance() instanceof Instance);
        assertEquals("default",this.model.getDefaultInstance().getId());
    }

    public void testStoredObjects(){
        Element root = this.model.getDefaultInstance().getInstanceDocument().getDocumentElement();
        assertNotNull(root.getUserData("model"));
        assertTrue(root.getUserData("model") instanceof Model);

        assertNotNull(root.getUserData("instance"));
        assertTrue(root.getUserData("instance") instanceof Instance);
    }

    public void testGetModelItem() throws XFormsException {
        Instance i = model.getDefaultInstance();

        Iterator iterator = i.iterateModelItems();
        if (iterator != null) {
            ModelItem modelItem;
            while (iterator.hasNext()) {
                modelItem = (ModelItem) iterator.next();

                assertNotNull(modelItem);
            }
        }
    }

    public void testGetInstanceNodeset() {
        List l = this.model.getDefaultInstance().getInstanceNodeset();
        DOMNodeWrapper wrapper = (DOMNodeWrapper) l.get(0);
        Node n = (Node) wrapper.getUnderlyingNode();
        assertNotNull(l);
        assertEquals("data",n.getNodeName());
    }
}