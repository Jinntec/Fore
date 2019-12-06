package org.exist.fore.model.constraints;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.exist.fore.Initializer;
import org.exist.fore.XFormsElement;
import org.exist.fore.XFormsException;
import org.exist.fore.model.Model;
import org.exist.fore.util.DOMUtil;
import org.w3c.dom.Element;

/**
 * represents a single constraint of a bind
 */
public class ConstraintElement extends XFormsElement implements Constraint {
    private static final Log LOGGER = LogFactory.getLog(ConstraintElement.class);

    private boolean valid=true;

    public ConstraintElement(Element element, Model model){
        super(element, model);
    }

    @Override
    public void init() throws XFormsException {
//        Initializer.initializeUIElements(this.element);
    }

    @Override
    public void dispose() throws XFormsException {
        //To change body of implemented methods use File | Settings | File Templates.
    }

    @Override
    protected Log getLogger() {
        return LOGGER;
    }

    public void setInvalid(){
        this.valid=false;
        this.element.setAttributeNS(null,"initial","true");
    }

    public boolean isValid(){
        return this.valid;
    }

    public String getXPathExpr(){
        return this.element.getAttribute("value");
    }

    public String getAlert(){
        Element e = (Element) DOMUtil.getFirstChildByTagName(this.element, "alert");
        if(e != null){
            return DOMUtil.getElementValue(e);
        }
        return null;
    }
}

