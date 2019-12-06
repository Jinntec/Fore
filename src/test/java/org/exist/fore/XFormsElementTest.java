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

package org.exist.fore;

import junit.framework.TestCase;
import org.exist.fore.model.Model;
import org.exist.fore.util.DOMUtil;
import org.junit.Before;
import org.junit.Test;
import org.w3c.dom.Document;

public class XFormsElementTest extends TestCase {
    private Document doc;
    private Model model;

    @Before
    public void setUp() throws Exception {
        String path = getClass().getResource("model/simple.html").getPath();
        String fileURI = "file://" + path.substring(0, path.lastIndexOf("simple.html"));

        doc = DOMUtil.parseXmlFile(path,true,false);
//        DOMUtil.prettyPrintDOM(doc);

        model = new Model(this.doc.getDocumentElement());
        model.init();
    }

    @Test
    public void testInit() {
    }
}