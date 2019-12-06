package org.exist.fore;

import org.exist.fore.model.bind.Bind;
import org.exist.fore.util.DOMUtil;
import org.w3c.dom.Element;
import org.w3c.dom.Node;

/**
 * Signals an <code>xforms-compute-exception</code> error indication.
 *
 * @author Joern Turner, Ulrich Nicolas Liss&eacute;
 * @version $Id: XFormsComputeException.java 2090 2006-03-16 09:37:00Z joernt $
 */
public class XFormsComputeException extends XFormsException {
    private static final String COMPUTE_EXCEPTION= "compute-exception";

    /**
     * Creates a new <code>xforms-compute-exception</code> error indication.
     *
     * @param message the error message.
     * @param target  the event target.
     * @param bind    the bind element
     */
    public XFormsComputeException(String message, Element target, Bind bind) {
        this(message, null, target, bind);
    }

    /**
     * Creates a new <code>xforms-compute-exception</code> error indication.
     *
     * @param message the error message.
     * @param cause   the root cause.
     * @param target  the target element
     * @param bind    the Bind causing this exception information.
     */
    public XFormsComputeException(String message, Exception cause, Element target, Bind bind) {
        super(COMPUTE_EXCEPTION + message  + " :: " + DOMUtil.getCanonicalPath((Node) target), cause, bind.getId() );
        this.id = COMPUTE_EXCEPTION;
    }

    /**
     * Specifies wether this error indication is fatal or non-fatal.
     *
     * @return <code>true</code>.
     */
    public boolean isFatal() {
        return true;
    }
}

//end of class
