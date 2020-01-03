package org.exist.xquery.functions.fore;

/*
 *  eXist Open Source Native XML Database
 *  Copyright (C) 2001-2013 The eXist-db Project
 *  http://exist-db.org
 *
 *  This program is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Lesser General Public License
 *  as published by the Free Software Foundation; either version 2
 *  of the License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with this program; if not, write to the Free Software
 *  Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
 *
 *  $Id$
 */

import org.exist.dom.QName;
import org.exist.xquery.AbstractInternalModule;
import org.exist.xquery.FunctionDef;
import org.exist.xquery.XPathException;

import java.util.Arrays;
import java.util.List;
import java.util.Map;


/**
 * Module function definitions for Fore module.
 *
 * @author Joern Turner
 */
public class ForeModule extends AbstractInternalModule {

    public final static String NAMESPACE_URI = "http://exist-db.org/xquery/fore";

    public final static String PREFIX = "fore";
    public final static String INCLUSION_DATE = "2020-01-03";
    public final static String RELEASED_IN_VERSION = "pre eXist-6.0";

    public static final QName FORE_VAR = new QName("session", NAMESPACE_URI, PREFIX);


    public final static FunctionDef[] functions = {
    };

    static {
        Arrays.sort(functions, new FunctionComparator());
    }

    public final static QName EXCEPTION_QNAME = new QName("exception", org.exist.xquery.functions.util.UtilModule.NAMESPACE_URI, org.exist.xquery.functions.util.UtilModule.PREFIX);

    public final static QName EXCEPTION_MESSAGE_QNAME = new QName("exception-message", org.exist.xquery.functions.util.UtilModule.NAMESPACE_URI, org.exist.xquery.functions.util.UtilModule.PREFIX);

    public final static QName ERROR_CODE_QNAME = new QName("error-code", org.exist.xquery.functions.util.UtilModule.NAMESPACE_URI, org.exist.xquery.functions.util.UtilModule.PREFIX);

    public ForeModule(final Map<String, List<? extends Object>> parameters) throws XPathException {
        super(functions, parameters, true);
        declareVariable(EXCEPTION_QNAME, null);
        declareVariable(EXCEPTION_MESSAGE_QNAME, null);
        declareVariable(ERROR_CODE_QNAME, null);

    }

    @Override
    public String getDescription() {
        return "A module for 'Fore' extension functions.";
    }

    @Override
    public String getNamespaceURI() {
        return NAMESPACE_URI;
    }

    @Override
    public String getDefaultPrefix() {
        return PREFIX;
    }

    @Override
    public String getReleaseVersion(){
        return RELEASED_IN_VERSION;
    }

}
