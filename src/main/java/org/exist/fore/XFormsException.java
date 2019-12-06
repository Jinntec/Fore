package org.exist.fore;

/**
 *
 * @author Joern Turner
 */
public class XFormsException extends Exception {
    public static final String DEVIDER = " :: ";
    /**
     * The internal id of this exception, used for i18n.
     */
    protected String id = "xforms-exception";

    /**
     * Creates a new xforms exception.
     *
     * @param message the error message.
     */
    public XFormsException(String message) {
        super(message);
    }

    /**
     * Creates a new xforms exception.
     *
     * @param cause the root cause.
     */
    public XFormsException(Exception cause) {
        super(cause);
    }

    /**
     * Creates a new xforms exception.
     *
     * @param message the error message.
     * @param cause the root cause.
     */
    public XFormsException(String message, Exception cause) {
        super(message, cause);
    }

    /**
     * Creates a new xforms exception.
     * <p/>
     * Appends the <code>subid</code> to the ID of this XFormsException.
     *
     * @param message the error message.
     * @param cause the root cause.
     * @param subid the message subid.
     */
    public XFormsException(String message, Exception cause, String subid) {
        super(message, cause);
        this.id = this.id + "." + subid;
    }

    /**
     * Get the message id.
     *
     * @return the value of the message id property
     */
    public String getId() {
        return this.id;
    }

}

// end of class
