package org.exist.fore.xpath;

import net.sf.saxon.functions.IntegratedFunctionLibrary;

public class ForeFunctionLibrary extends IntegratedFunctionLibrary {

    private static ForeFunctionLibrary THE_INSTANCE = new ForeFunctionLibrary();

    public static ForeFunctionLibrary getInstance() {
        return THE_INSTANCE;
    }

    private ForeFunctionLibrary(){
        init();
    }

    private void init(){
        registerFunction(new BooleanFromStringIntegrated());
    }

}
