package org.exist.fore.model.constraints;

/**
 * Constraint is mainly a value object to represent 'constraint' MIPs at runtime.
 */
public interface Constraint {
    void setInvalid();

    boolean isValid();

    String getXPathExpr();

    String getAlert();
}
