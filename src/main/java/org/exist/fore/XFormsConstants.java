/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore;


/**
 * XForms Constants used throughout the betterForm Framework.
 *
 * @version $Id: XFormsConstants.java 3474 2008-08-15 22:29:43Z joern $
 */
public interface XFormsConstants {
    String ACCESSKEY_ATTRIBUTE = "accesskey";

    // actions
    String ACTION = "action";
    String IF_CONDITION = "if";
    String WHILE_ATTRIBUTE = "while";
    String ORIGIN_ATTRIBUTE = "origin";    

    // submission attributes
    String ACTION_ATTRIBUTE = "action";
    String ALERT = "alert";
    String APPEARANCE_ATTRIBUTE = "appearance";
    String AT_ATTRIBUTE = "at";
    String BIND = "bind";
    String BIND_ATTRIBUTE = "bind";
    String BUBBLES_ATTRIBUTE = "bubbles";
    String CALCULATE_ATTRIBUTE = "calculate";
    String CANCELABLE_ATTRIBUTE = "cancelable";
    String CASE = "case";
    String CASE_ATTRIBUTE = "case";
    String CDATA_SECTION_ELEMENTS_ATTRIBUTE = "cdata-section-elements";

    // common selection elements
    String CHOICES = "choices";
    String CONSTRAINT_ATTRIBUTE = "constraint";
    String CONTROL_ATTRIBUTE = "control";
    String COPY = "copy";
    String DELETE = "delete";
    String DISPATCH = "dispatch";
    String ENCODING_ATTRIBUTE = "encoding";
    String END_ATTRIBUTE = "end";

    // Extension element name
    String EXTENSION = "extension";

    // MustUnderstand attribute name
    String MUST_UNDERSTAND_ATTRIBUTE = "mustUnderstand";

    // additional elements
    String FILENAME = "filename";

    // ui
    String GROUP = "group";
    String HELP = "help";
    String HINT = "hint";
    String INCLUDENAMESPACEPREFIXES_ATTRIBUTE = "includenamespaceprefixes";
    String INCREMENTAL_ATTRIBUTE = "incremental";
    String INDENT_ATTRIBUTE = "indent";
    String INDEX_ATTRIBUTE = "index";

    // form controls
    String INPUT = "input";
    String INSERT = "insert";
    String INSTANCE = "instance";
    String ITEM = "item";
    String ITEMSET = "itemset";
    String LABEL = "label";
    String LEVEL_ATTRIBUTE = "level";
    String LOAD = "load";
    String UNLOAD = "unload";
    String MAXOCCURS_ATTRIBUTE = "maxoccurs";
    String MEDIATYPE = "mediatype";
    String MEDIATYPE_ATTRIBUTE = "mediatype";
    String MESSAGE = "message";
    String METHOD_ATTRIBUTE = "method";
    String MINOCCURS_ATTRIBUTE = "minoccurs";

    // core elements
    String MODEL = "model";
    String MODEL_ATTRIBUTE = "model";
    String FUNCTIONS = "functions";

    // action attributes
    String NAME_ATTRIBUTE = "name";

    // ui attributes
    String CONTEXT_ATTRIBUTE = "context";
    String DELAY = "delay";
    String NAVINDEX_ATTRIBUTE = "navindex";
    String NODESET_ATTRIBUTE = "nodeset";
    String NUMBER_ATTRIBUTE = "number";
    String OMIT_XML_DECLARATION_ATTRIBUTE = "omit-xml-declaration";
    String OUTPUT = "output";
    String P3PTYPE_ATTRIBUTE = "p3ptype";
    String POSITION_ATTRIBUTE = "position";
    String RANGE = "range";
    String READONLY_ATTRIBUTE = "readonly";
    String REBUILD = "rebuild";
    String RECALCULATE = "recalculate";
    String REFRESH = "refresh";
    String REF_ATTRIBUTE = "ref";
    String RELEVANT_ATTRIBUTE = "relevant";
    String REPEAT = "repeat";
    String REPEAT_ATTRIBUTE = "repeat";
    String REPEAT_BIND_ATTRIBUTE = "repeat-bind";
    String REPEAT_MODEL_ATTRIBUTE = "repeat-model";
    String REPEAT_NODESET_ATTRIBUTE = "repeat-nodeset";
    String REPEAT_REF_ATTRIBUTE = "repeat-ref";
    String REPEAT_NUMBER_ATTRIBUTE = "repeat-number";
    String REPEAT_STARTINDEX_ATTRIBUTE = "repeat-startindex";
    String REPLACE_ATTRIBUTE = "replace";
    String REQUIRED_ATTRIBUTE = "required";
    String RESET = "reset";
    String RESOURCE_ATTRIBUTE = "resource";
    String REVALIDATE = "revalidate";
    String SECRET = "secret";
    String SELECT = "select";
    String SELECT1 = "select1";
    String SELECTED_ATTRIBUTE = "selected";
    String SELECTION_ATTRIBUTE = "selection";
    String SEND = "send";
    String SEPARATOR_ATTRIBUTE = "separator";
    String SERIALIZATION_ATTRIBUTE = "serialization";
    String SETFOCUS = "setfocus";
    String SETINDEX = "setindex";
    String SETVALUE = "setvalue";
    String SETVARIABLE = "setvariable";
    String SHOW_ATTRIBUTE = "show";

    // common attributes
    String SRC_ATTRIBUTE = "src";
    String STANDALONE_ATTRIBUTE = "standalone";
    String STARTINDEX_ATTRIBUTE = "startindex";
    String START_ATTRIBUTE = "start";
    String STEP_ATTRIBUTE = "step";
    String SUBMISSION = "submission";
    String SUBMISSION_ATTRIBUTE = "submission";
    String HEADER = "header";
    String COMBINE = "combine";
    String METHOD = "method";
    String RESOURCE = "resource";
    String NAME = "name";

    String SUBMIT = "submit";
    String SWITCH = "switch";
    String TARGET_ATTRIBUTE = "target"; //deprecated attrbute on submission
    String TARGETID_ATTRIBUTE = "targetid"; //used by dispatch action
    String TARGETREF_ATTRIBUTE = "targetref"; //used as replacement for "target" on submission
    String TEXTAREA = "textarea";
    String TOGGLE = "toggle";
    String TRIGGER = "trigger";

    // bind attributes
    String TYPE_ATTRIBUTE = "type";
    String UPLOAD = "upload";
    String VALUE = "value";
    String VALUE_ATTRIBUTE = "value";
    String VERSION_ATTRIBUTE = "version";

    String VALIDATE_ATTRIBUTE = "validate";
    String INSTANCE_ATTRIBUTE = "instance";
    
    // event properties
    String DELETE_NODES = "deleted-nodes";
    String DELETE_LOCATION = "delete-location";
    String ERROR_TYPE = "error-type";
    String SUBMISSION_BODY = "submission-body";
    String RESOURCE_URI = "resource-uri";
    String RESPONSE_STATUS_CODE = "response-status-code";
    String RESPONSE_HEADERS = "response-headers";
    String RESPONSE_REASON_PHRASE = "response-reason-phrase";
    String RESPONSE_BODY = "response-body";
    
    String SUBMISSION_IN_PROGRESS = "submission-in-progress";
    String NO_DATA = "no-data";
    String VALIDATION_ERROR = "validation-error";
    String PARSE_ERROR = "parse-error";
    String RESOURCE_ERROR = "resource-error";
    String TARGET_ERROR = "target-error";
    
    String INSERTED_NODES = "inserted-nodes";
    String ORIGIN_NODES = "origin-nodes";
    String INSERT_LOCATION_NODE = "insert-location-node";
    String POSITION = "position";

    // custom betterForm constants
    String VARIABLE_NAME = "varName";
    Object VARIABLE_VALUE = "varValue";
}

//end of interface

