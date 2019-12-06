/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.model.constraints.impl;

import org.exist.fore.util.DOMUtil;
import org.exist.fore.model.Model;
import org.exist.fore.model.constraints.ModelItem;
import org.exist.fore.model.constraints.Constraint;
import org.exist.fore.model.constraints.RefreshView;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.w3c.dom.Node;

import java.util.ArrayList;
import java.util.List;

/**
 * Refresh viewport implementation.
 *
 * @version $Id: StateChangeViewImpl.java 3083 2008-01-21 11:29:21Z joern $
 */
public class RefreshViewImpl implements RefreshView {
    private static final Log LOGGER = LogFactory.getLog(RefreshView.class);

    private ModelItem modelItem;

    private boolean valueChangedMarker;
    private boolean validMarker;
    private boolean invalidMarker;
    private boolean readwriteMarker;
    private boolean readonlyMarker;
    private boolean optionalMarker;
    private boolean requiredMarker;
    private boolean enabledMarker;
    private boolean disabledMarker;

    private List invalids;

    /**
     * marks events for dispatch during xforms-refresh processing
     *
     * @param modelItem the owner model item.
     */
    public RefreshViewImpl(ModelItem modelItem) {
        this.modelItem = modelItem;
        this.invalids = new ArrayList(5);
    }


    public void setValueChangedMarker() {
        this.valueChangedMarker = true;
        Model model = this.modelItem.getModel();
        if(model != null){
            this.modelItem.getModel().addRefreshItem(this);
        }
    }

    public void setReadonlyMarker() {
        this.readwriteMarker = false;
        this.readonlyMarker = true;
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("readonly MIP marked for dispatching for " + DOMUtil.getCanonicalPath((Node) this.modelItem.getNode()));
        }

    }

    public void setReadWriteMarker() {
        this.readonlyMarker = false;
        this.readwriteMarker = true;
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("readwrite MIP marked for dispatching for " + DOMUtil.getCanonicalPath((Node) this.modelItem.getNode()));
        }

    }

    public void setEnabledMarker() {
        this.disabledMarker = false;
        this.enabledMarker = true;
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("enabled MIP marked for dispatching for " + DOMUtil.getCanonicalPath((Node) this.modelItem.getNode()));
        }
    }

    public void setDisabledMarker() {
        this.enabledMarker = false;
        this.disabledMarker = true;
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("disabled MIP marked for dispatching for " + DOMUtil.getCanonicalPath((Node) this.modelItem.getNode()));
        }
    }

    public void setOptionalMarker() {
        this.requiredMarker = false;
        this.optionalMarker = true;
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("optional MIP marked for dispatching for " + DOMUtil.getCanonicalPath((Node) this.modelItem.getNode()));
        }
    }

    public void setRequiredMarker() {
        this.optionalMarker = false;
        this.requiredMarker = true;
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("required MIP marked for dispatching for " + DOMUtil.getCanonicalPath((Node) this.modelItem.getNode()));
        }
    }

    public void setValidMarker() {
        this.invalidMarker = false;
        this.validMarker = true;
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("valid MIP marked for dispatching for " + DOMUtil.getCanonicalPath((Node) this.modelItem.getNode()));
        }
    }

    public void setInvalidMarker() {
        this.validMarker = false;
        this.invalidMarker = true;
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("invalid MIP marked for dispatching for " + DOMUtil.getCanonicalPath((Node) this.modelItem.getNode()));
        }
    }

    public List <Constraint> getInvalids() {
        return this.invalids;
    }

    public void setInvalids(List <Constraint> invalids) {
        this.invalids = invalids;
    }

    /**
     * Resets all state changes so that no changes are reported.
     */
    public void reset() {
        this.valueChangedMarker = false;
        this.invalidMarker = false;
        this.validMarker = false;
        this.readwriteMarker = false;
        this.readonlyMarker = false;
        this.optionalMarker = false;
        this.requiredMarker = false;
        this.enabledMarker = false;
        this.disabledMarker = false;
    }

    public boolean isValueChangedMarked() {
        return this.valueChangedMarker;
    }

    public boolean isValidMarked() {
        return this.validMarker == true ? true : false;
    }

    public boolean isInvalidMarked() {
        return this.invalidMarker == true ? true : false;
    }

    public boolean isReadonlyMarked() {
        if (inheritsReadWriteMip() && this.modelItem.getParent() != null) {
            if (this.modelItem.getParent().getRefreshView().isReadonlyMarked()) {
                this.readonlyMarker = true;
                addParentRefreshViewToModel();
            } else {
                this.readonlyMarker = false;
            }
            return this.readonlyMarker;
        }

        return this.readonlyMarker == true ? true : false;
    }

    public boolean isReadwriteMarked() {
        if (inheritsReadWriteMip() && this.modelItem.getParent() != null) {
            if (this.modelItem.getParent().getRefreshView().isReadwriteMarked()) {
                this.readwriteMarker = true;
                addParentRefreshViewToModel();
            } else {
                this.readwriteMarker = false;
            }
            return this.readwriteMarker;
        }
        return this.readwriteMarker ? true : false;
    }

    public boolean isRequiredMarked() {
        return this.requiredMarker ? true : false;
    }

    public boolean isOptionalMarked() {
        return this.optionalMarker ? true : false;
    }

    private boolean inheritsReadWriteMip() {
        if (!this.readwriteMarker && !this.readonlyMarker) {
            return true;
        } else {
            return false;
        }
    }

    private boolean inheritsRelevantMip() {
        if (!this.enabledMarker && !this.disabledMarker) {
            return true;
        } else {
            return false;
        }
    }

    public boolean isEnabledMarked() {
        if (inheritsRelevantMip() && this.modelItem.getParent() != null) {
            if (this.modelItem.getParent().getRefreshView().isEnabledMarked()) {
                this.enabledMarker = true;
                addParentRefreshViewToModel();
            } else {
                this.enabledMarker = false;
            }
            return this.enabledMarker;
        }

        return this.enabledMarker ? true : false;
    }

    public boolean isDisabledMarked() {
        if (inheritsRelevantMip() && this.modelItem.getParent() != null) {
            if (this.modelItem.getParent().getRefreshView().isDisabledMarked()) {
                this.disabledMarker = true;
                addParentRefreshViewToModel();
            } else {
                this.disabledMarker = false;
            }
            return this.disabledMarker;
        }
        return this.disabledMarker ? true : false;
    }

    @Override
    public String toString() {
        return this.modelItem.toString(); 
    }

    private void addParentRefreshViewToModel() {
        Model model = this.modelItem.getModel();
        if(model != null) {
            model.addRefreshItem(this.modelItem.getParent().getRefreshView());
        }
    }

}
