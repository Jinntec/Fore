
package org.exist.fore.xpath;

import net.sf.saxon.functions.FunctionLibraryList;
import net.sf.saxon.functions.registry.XPath31FunctionSet;
import net.sf.saxon.s9api.Processor;

import java.util.List;

public class XPathProcessor{

    private static final XPathProcessor INSTANCE = new XPathProcessor();
    private static final FunctionLibraryList functionLibraryList = new FunctionLibraryList();
    private static final Processor processor = new Processor(false);

    private XPathProcessor(){
        init();
    }

    private void init() {
        functionLibraryList.addFunctionLibrary(XPath31FunctionSet.getInstance());

    }

    public XPathProcessor getInstance(){
        return this.INSTANCE;
    }


    public List evaluate(){

        return null;
    }

}