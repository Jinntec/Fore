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
import org.exist.fore.XFormsException;
import org.exist.fore.util.DOMComparator;
import org.exist.fore.util.DOMUtil;
import org.junit.Before;
import org.junit.Test;
import org.w3c.dom.Document;
import org.xml.sax.SAXException;

import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;
import java.util.List;

public class ModelTest extends TestCase {
    private Document doc;
//    private Model model;

    @Before
    public void setUp() throws Exception {
/*        String path = getClass().getResource("simple.html").getPath();
        String fileURI = "file://" + path.substring(0, path.lastIndexOf("simple.html"));

        doc = DOMUtil.parseXmlFile(path,true,false);
//        DOMUtil.prettyPrintDOM(doc);

        model = new Model(this.doc.getDocumentElement());
        model.init();*/
    }

    /*

    @After
    public void tearDown() throws Exception {
    }
*/

    @Test
    public void testInit() throws IOException, SAXException, ParserConfigurationException, XFormsException {
        String path = getClass().getResource("simple.html").getPath();
        String fileURI = "file://" + path.substring(0, path.lastIndexOf("simple.html"));
        doc = DOMUtil.parseXmlFile(path,true,false);
        Model model = new Model(this.doc.getDocumentElement());
        model.init();

        assertNotNull(model);
        assertEquals(model.getElement().getLocalName(),"xf-model");

        List instances = model.getInstances();
        assertNotNull(instances);
        assertEquals(model.getInstances().size(),1);
        assertNotNull(model.getInstanceDocument("default"));
        assertEquals(model.getModelBindings().size(),1);
        assertEquals(model.getModelBindings().size(),1);
    }

    public void testInitBroken() throws IOException, SAXException, ParserConfigurationException {
        String path = getClass().getResource("simple-duplicate-id.html").getPath();
        String fileURI = "file://" + path.substring(0, path.lastIndexOf("simple-duplicate-id.html"));
        doc = DOMUtil.parseXmlFile(path,true,false);
        Model model = new Model(this.doc.getDocumentElement());

        try {
            model.init();
        }catch (XFormsException e){
            assertTrue(e instanceof XFormsException);
        }

    }

    public void testNoBindId() throws IOException, SAXException, ParserConfigurationException {
        String path = getClass().getResource("simpleNoId.html").getPath();
        String fileURI = "file://" + path.substring(0, path.lastIndexOf("simpleNoId.html"));
        doc = DOMUtil.parseXmlFile(path,true,false);
        Model model = new Model(this.doc.getDocumentElement());
        try{
            model.init();
        }catch (XFormsException e){
            assertTrue(e instanceof XFormsException);
        }


    }

    public void testGetDefaultInstance() throws IOException, SAXException, ParserConfigurationException, XFormsException {
        String path = getClass().getResource("simple.html").getPath();
        String fileURI = "file://" + path.substring(0, path.lastIndexOf("simple.html"));
        doc = DOMUtil.parseXmlFile(path,true,false);
        Model model = new Model(this.doc.getDocumentElement());
        model.init();

        assertNotNull(model.getDefaultInstance());
        assertEquals("default", model.getDefaultInstance().getId());
    }

    public void testGetInstance() throws IOException, SAXException, ParserConfigurationException, XFormsException {
        String path = getClass().getResource("simple.html").getPath();
        String fileURI = "file://" + path.substring(0, path.lastIndexOf("simple.html"));
        doc = DOMUtil.parseXmlFile(path,true,false);
        Model model = new Model(this.doc.getDocumentElement());
        model.init();

        assertNotNull(model.getInstance("default"));
        assertEquals("default", model.getInstance("default").getId());
        assertNotNull(model.getInstance(""));
        assertNull(model.getInstance("foo"));
    }

/*
    public void testLookupBind() {
        assertNotNull("b-greeting",this.model.binds);
        String id = this.model.lookupBind("b-greeting").getId();
        assertEquals("b-greeting",id);
    }
*/

    protected DOMComparator getComparator() {
        DOMComparator comparator = new DOMComparator();
        comparator.setIgnoreNamespaceDeclarations(true);
        comparator.setIgnoreWhitespace(true);
        comparator.setIgnoreComments(true);
        comparator.setErrorHandler(new DOMComparator.SystemErrorHandler());

        return comparator;
    }

}