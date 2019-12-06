/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.model;


//import com.fasterxml.jackson.core.JsonFactory;
//import com.fasterxml.jackson.core.JsonGenerator;

import net.sf.saxon.Configuration;
import net.sf.saxon.dom.DOMNodeWrapper;
import org.apache.commons.logging.Log;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.xerces.dom.DOMInputImpl;
import org.apache.xerces.xs.*;
import org.exist.fore.Initializer;
import org.exist.fore.XFormsComputeException;
import org.exist.fore.XFormsElement;
import org.exist.fore.XFormsException;
import org.exist.fore.model.bind.Bind;
import org.exist.fore.model.constraints.*;
import org.exist.fore.util.DOMUtil;
import org.exist.fore.xpath.BindFunctionReferenceFinderImpl;
import org.exist.fore.xpath.NamespaceConstants;
import org.exist.fore.xpath.NamespaceResolver;
import org.w3c.dom.*;
import org.w3c.dom.bootstrap.DOMImplementationRegistry;
import org.w3c.dom.ls.LSInput;
import org.w3c.dom.ls.LSResourceResolver;

import java.io.IOException;
import java.io.InputStream;
import java.io.Reader;
import java.util.*;


/**
 * @author Joern Turner
 */
public class Model extends XFormsElement {
    private final static Logger LOGGER = LogManager.getLogger(Model.class);
    private final Element element;
    private List instances;
    private List modelBindings;
    private List refreshedItems;
    private String baseURI;
    private Validator validator;
    private boolean ready = false;
    public Map<String, Bind> binds;
    private final Configuration fConfiguration = new Configuration();
    private MainDependencyGraph mainGraph;
    private static int modelItemCounter = 0;
    private Vector changed = new Vector();

    private List schemas;
    private static XSModel defaultSchema = null;
    private String updates;
//    private JsonFac#tory jsonFactory;
//    private JsonGenerator jsonGenerator;
//    private StringWriter jsonWriter;

    public String getBaseURI() {
        return baseURI;
    }

    public void setBaseURI(String baseURI) {
        this.baseURI = baseURI;
    }

    /**
     * Creates a new Model object.
     *
     * @param element the DOM Element representing this Model
     */
    public Model(Element element) {
        super(element);
        this.element = element;
    }

    /**
     * Performs element init.
     */
    public void init() throws XFormsException {

//        this.updateSequencer = new UpdateSequencer(this);
        // load schemas
//        this.schemas = new ArrayList();
//        loadDefaultSchema(this.schemas);

        // The default schema is shared between all models of all forms, and isn't thread safe, so we need synchronization here.
        // We cache the default model bcz. it takes quite some time to construct it.
/*
        synchronized (Model.class) {
            // set datatypes for validation
            getValidator().setDatatypes(getNamedDatatypes(this.schemas));
        }
*/


        // build instances
        this.instances = new ArrayList();

        // todo: move to static method in initializer
        List<Element> instanceElements = getAllInstanceElements();
        int count = instanceElements.size();

        if (count > 0) {
            for (int index = 0; index < count; index++) {
                Element xformsInstance = instanceElements.get(index);
                Instance instance = new Instance(xformsInstance, this);
                instance.init();
                this.instances.add(instance);
            }
        }

        // initialize binds and submissions (actions should be initialized already)

        Initializer.initializeBindElements(this, this.element, new BindFunctionReferenceFinderImpl());
//        Initializer.initializeActionElements(this, this.element);
//        Initializer.initializeSubmissionElements(this, this.element);

        rebuild();
        recalculate();
        revalidate();
        try {
            refresh();
        } catch (IOException e) {
            throw new XFormsException("refresh failed due to IOException",e);
        }
        this.ready = true;
    }

    @Override
    public void dispose() throws XFormsException {

    }


    /**
     * Generates a model item id.
     *
     * @return a model item id.
     */
    public static String generateModelItemId() {
        // todo: build external id service
        return String.valueOf(++modelItemCounter);
    }

    public boolean isReady() {
        return this.ready;
    }

    public void rebuild() throws XFormsException {

        if (this.modelBindings != null && this.modelBindings.size() > 0) {
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug(this + " rebuild: creating main dependency graph for " +
                        this.modelBindings.size() + " bind(s)");
            }

            this.mainGraph = new MainDependencyGraph();

            for (int index = 0; index < this.modelBindings.size(); index++) {
                Bind bind = (Bind) this.modelBindings.get(index);
                try {
                    bind.updateXPathContext();
                } catch (XFormsException e) {
                    throw new XFormsComputeException(e.getMessage(), bind.getElement(), bind);

                }
                this.mainGraph.buildBindGraph(bind, this);
            }

            this.changed = (Vector) this.mainGraph.getVertices().clone();
        }
    }


    /**
     * 7.3.3 The recalculate() Method
     * <p/>
     * This method signals the XForms Processor to perform a full recalculation
     * of this XForms Model. This method takes no parameters and raises no
     * exceptions.
     * <p/>
     * Creates and recalculates a SubDependencyGraph.
     */
    public void recalculate() throws XFormsException {
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug(" #################### RECALCULATE ####################");
            LOGGER.debug(this);
        }

/*
            if (this.updateSequencer.sequence(RECALCULATE)) {
                return;
            }
*/

        if (this.changed != null && this.changed.size() > 0) {
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug(this + " recalculate: creating sub dependency graph for " +
                        this.changed.size() + " node(s)");
            }

            SubGraph subGraph = new SubGraph();
            subGraph.constructSubDependencyGraph(this.changed);
            subGraph.recalculate();
            this.changed.clear();
        }

//            this.updateSequencer.perform();
    }

    /**
     * 7.3.4 The revalidate() Method
     * <p/>
     * This method signals the XForms Processor to perform a full revalidation
     * of this XForms Model. This method takes no parameters and raises no
     * exceptions.
     * <p/>
     * Revalidates all instances of this model.
     */
    public void revalidate() throws XFormsException {
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug(" #################### REVALIDATE ####################");
            LOGGER.debug(this);
        }

/*
            if (this.updateSequencer.sequence(REVALIDATE)) {
                return;
            }
*/

        if (this.instances != null && this.instances.size() > 0) {
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug(this + " revalidate: revalidating " + this.instances.size() +
                        " instance(s)");
            }

            for (int index = 0; index < this.instances.size(); index++) {
                getValidator().validate((Instance) this.instances.get(index));
            }
        }

//            this.updateSequencer.perform();
    }

    /**
     * 7.3.5 The refresh() Method
     * <p/>
     * This method signals the XForms Processor to perform a full refresh of
     * form controls bound to instance nodes within this XForms Model. This
     * method takes no parameters and raises no exceptions.
     */
    public void refresh() throws XFormsException, IOException {
        this.updates = ""; //clear

        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug(" #################### START REFRESH Model ####################");
            LOGGER.debug(this);
        }
//            if (this.updateSequencer.sequence(REFRESH)) {
//                return;
//            }


//        NodeList nl = this.element.getElementsByTagName("xf-bind");
        List list = DOMUtil.getChildElementsByTagName(this.element, "xf-bind");


//        this.jsonGenerator.writeStartArray();// outer array


//        JsonArrayBuilder ja = Json.createArrayBuilder();

        StringBuilder sb = new StringBuilder();
        sb.append("["); // outer array
        for (int i = 0; i < list.size(); i++) {


//            Element bind = (Element) list.get(i);
            Element e = (Element) list.get(i);
            if (e.getNodeName().equalsIgnoreCase("xf-bind")) {

                String bindId = e.getAttribute("id");
                Bind b = (Bind) e.getUserData("xf-bind");

                if (b.getNodeset().size() != 0) {
                    Node n = (Node) ((DOMNodeWrapper) b.getNodeset().get(0)).getUnderlyingNode();
//                    ModelItem m = (ModelItem) n.getUserData("modelItem");

                    writeJson(b, sb, false, 0, false);
                    if (i < (list.size() - 1)) {
                        sb.append(",");
                    }
                } else {
                    // it's an error if there's nothing bound
                    throw new XFormsException("bind '" + b.getId() + "' does not refer to anything. Wrong binding expression: '" + b.getBindingExpression() + "'");
                }


//                writeBinding(b);
//                JsonObject jo = writeBindObject(b);
//                ja.add(jo);
            }

        }

        sb.append("]");//outer array end

//        System.out.println(sb.toString());

//        this.updateSequencer.perform();

        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug(this + " #################### END REFRESH Model ####################");
        }

        this.updates = sb.toString();
    }

    private String escapeJsonString(String raw) {
        String escaped = raw;
        escaped = escaped.replace("\\", "\\\\");
        escaped = escaped.replace("\"", "\\\"");
        escaped = escaped.replace("\b", "\\b");
        escaped = escaped.replace("\f", "\\f");
        escaped = escaped.replace("\n", "\\n");
        escaped = escaped.replace("\r", "\\r");
        escaped = escaped.replace("\t", "\\t");
        // TODO: escape other non-printing characters using uXXXX notation
        return escaped;
    }

    private void writeJson(Bind bind, StringBuilder builder, boolean isArray, int index, boolean repeated) throws XFormsException {

        if (bind.getElement().hasAttribute("ref")) {

            if (isArray) {
                builder.append("{");
            } else {
                builder.append("{\"bind\":{");
            }
            builder.append("\"id\":\"");
            builder.append(bind.getId());
            builder.append("\"");

            ModelItem m = null;
            if (repeated) {
                m = bind.getModelItems().get(index); //there can be just one for a single node bind
            } else {
                m = bind.getModelItems().get(0); //there can be just one for a single node bind
            }
            RefreshView rv = m.getRefreshView();

            if (rv.isEnabledMarked()) {
                builder.append(",");
                builder.append("\"relevant\":");
                builder.append("true");
            }
            if (rv.isDisabledMarked()) {
                builder.append(",");
                builder.append("\"relevant\":");
                builder.append("false");
            }
            if (rv.isReadwriteMarked()) {
                builder.append(",");
                builder.append("\"readonly\":");
                builder.append("false");
            }
            if (rv.isReadonlyMarked()) {
                builder.append(",");
                builder.append("\"readonly\":");
                builder.append("true");
            }
            if (rv.isOptionalMarked()) {
                builder.append(",");
                builder.append("\"required\":");
                builder.append("false");
            }
            if (rv.isRequiredMarked()) {
                builder.append(",");
                builder.append("\"required\":");
                builder.append("true");
            }
            if (rv.isInvalidMarked()) {
                builder.append(",");
                builder.append("\"valid\":");
                builder.append("false");
            }

            if (rv.isValidMarked()) {
                builder.append(",");
                builder.append("\"valid\":");
                builder.append("true");
            }
            if (m.getValue().length() != 0 && DOMUtil.getChildElement(bind.getElement(), "xf-bind") == null) {

//                this.jsonGenerator.writeStringField("value", m.getValue());
                builder.append(",");
                builder.append("\"value\":");
                builder.append("\"");
                builder.append(escapeJsonString(m.getValue()));
                builder.append("\"");
            }
            processChildBindings(bind, builder);

            if (isArray) {
                builder.append("}");
            } else {
                builder.append("}}");
            }


        } else if (bind.getElement().hasAttribute("set")) {
            // ##### set binding #####

            builder.append("\"id\":\"");
            builder.append(bind.getId());
            builder.append("\"");
            builder.append(",");
            builder.append("\"sequence\": true");
            builder.append(",");
            builder.append("\"bind\": [");

            List modelItems = bind.getModelItems();
            for (int i = 0; i < modelItems.size(); i++) {
                ModelItem m = (ModelItem) modelItems.get(i);

                builder.append("["); // inner array of repeat (repeatitem)

                List childBindings = DOMUtil.getChildElementsByTagName(bind.getElement(), "xf-bind");
                for (int j = 0; j < childBindings.size(); j++) {
                    Node n = (Node) childBindings.get(j);

                    Bind b = (Bind) n.getUserData("xf-bind");
                    writeJson(b, builder, true, i, true);
                    if (j < (childBindings.size() - 1)) {
                        builder.append(",");
                    }
                }

                //todo: process children

                builder.append("]"); // end repeat-item

                if (i < (modelItems.size() - 1)) {
                    builder.append(",");
                }


            }


            builder.append("]");

        } else {
            throw new XFormsException("Bind has no binding expression - one of 'ref' or 'bind' are necessary");
        }


    }

    private void processChildBindings(Bind bind, StringBuilder builder) throws XFormsException {
        // ### check for children
        List childBindings = DOMUtil.getChildElementsByTagName(bind.getElement(), "xf-bind");
        if (childBindings.size() > 1) {
            builder.append(",\"bind\":[");

            for (int i = 0; i < childBindings.size(); i++) {
                Node n = (Node) childBindings.get(i);

                Bind b = (Bind) n.getUserData("xf-bind");
                writeJson(b, builder, true, i, false);
                if (i < (childBindings.size() - 1)) {
                    builder.append(",");
                }
            }

            builder.append("]");
        } else if (childBindings.size() == 1) {
            builder.append(",\"bind\":{");

            Node n = (Node) childBindings.get(0);
            Bind b = (Bind) n.getUserData("xf-bind");
            writeJson(b, builder, false, 0, false);
            builder.append("}");
        }
    }


    public String getUpdates() {
        return this.updates;
    }

    /**
     * returns the default instance of this model. this is always the first in
     * document order regardless of its id-attribute.
     *
     * @return the default instance of this model
     */
    public Instance getDefaultInstance() {
        if (this.instances != null && this.instances.size() > 0) {
            return (Instance) this.instances.get(0);
        }

        return null;
    }

    /**
     * returns the instance-object for given id.
     *
     * @param id the identifier for instance
     * @return the instance-object for given id.
     */
    public Instance getInstance(String id) {
        if (this.instances == null) {
            return null;
        }
        if ((id == null) || "".equals(id)) {
            return getDefaultInstance();
        }

        for (int index = 0; index < this.instances.size(); index++) {
            Instance instance = (Instance) this.instances.get(index);
            String cid = instance.getId();
            if (id.equals(instance.getId())) {
                return instance;
            }
        }

        return null;
    }

    public List getInstances() {
        return this.instances;
    }


    /**
     * returns this Model object
     *
     * @return this Model object
     */
    public Model getModel() {
        return this;
    }

    @Override
    protected Log getLogger() {
        return null;
    }

    /**
     * 7.3.1 The getInstanceDocument() Method.
     * <p/>
     * This method returns a DOM Document that corresponds to the instance data
     * associated with the <code>instance</code> element containing an
     * <code>ID</code> matching the <code>instance-id</code> parameter. If there
     * is no matching instance data, a <code>DOMException</code> is thrown.
     *
     * @param instanceID the instance id.
     * @return the corresponding DOM document.
     * @throws DOMException if there is no matching instance data.
     */
    public Document getInstanceDocument(String instanceID) throws DOMException {
        Instance instance = getInstance(instanceID);
        if (instance == null) {
            throw new DOMException(DOMException.NOT_FOUND_ERR, instanceID);
        }

        return instance.getInstanceDocument();
    }

    public Element getElement() {
        return this.element;
    }

    public void addRefreshItem(RefreshView changed) {
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("add refreshView " + changed.toString());
        }
        this.refreshedItems.add(changed);
    }


    /**
     * adds a Bind object to this Model
     *
     * @param bind the Bind object to add
     */
    public void addBindElement(Bind bind) {
        if (this.modelBindings == null) {
            this.modelBindings = new ArrayList();
        }

        this.modelBindings.add(bind);
    }

    // todo: either this of the method above must be removed
    public void addBind(Bind bind) throws XFormsException {
        if (this.binds == null) {
            this.binds = new HashMap();
        }
        if (this.binds.containsKey(bind.getId())) {
            throw new XFormsException("BINDING-EXCEPTION: duplicate id for bind " + bind.toString());
        }
        this.binds.put(bind.getId(), bind);
    }

    public Bind getBind(String id) {
        Document doc = this.element.getOwnerDocument();
        //slightly more inefficient than getElementById but avoids declaring 'id' type
        Element e = DOMUtil.getElementByAttributeValue(this.element, "xf-bind", "id", id);
        Bind b = (Bind) e.getUserData("xf-bind");
        return b;
    }


    public Bind lookupBind(String id) {
        return this.binds.get(id);
    }


    public Configuration getConfiguration() {
        return fConfiguration;
    }


    /**
     * @return
     */
    private List<Element> getAllInstanceElements() {
        List<Element> result = new ArrayList<Element>();
        for (Node it = this.element.getFirstChild(); it != null; it = it.getNextSibling()) {
            if (it.getNodeType() != Node.ELEMENT_NODE) {
                continue;
            }

            Element el = (Element) it;
            if ("xf-instance".equals(el.getLocalName())) {
                result.add(el);
            }
        }
        return result;
    }


    public List getModelBindings() {
        return modelBindings;
    }

    /**
     * Returns the validator.
     *
     * @return the validator.
     */
    public Validator getValidator() {
        if (this.validator == null) {
            this.validator = new Validator();
            this.validator.setModel(this);
        }

        return this.validator;
    }

    private void loadDefaultSchema(List list) throws XFormsException {
        try {
            synchronized (Model.class) {
                if (this.defaultSchema == null) {
                    // todo: still a hack
                    InputStream stream = Model.class.getResourceAsStream("XFormsDatatypes11.xsd");
                    this.defaultSchema = loadSchema(stream);
                }

                if (this.defaultSchema == null) {
                    throw new NullPointerException("resource not found");
                }
                list.add(this.defaultSchema);
            }
        } catch (Exception e) {
            throw new XFormsException("LINK-EXCEPTION: could not load default schema");
        }
    }

    private XSModel loadSchema(InputStream stream) throws IllegalAccessException, ClassNotFoundException, InstantiationException {
        LSInput input = new DOMInputImpl();
        input.setByteStream(stream);

        return getSchemaLoader().load(input);
    }

    private XSLoader getSchemaLoader() throws IllegalAccessException,
            InstantiationException, ClassNotFoundException {
        // System.setProperty(DOMImplementationRegistry.PROPERTY,
        // "org.apache.xerces.dom.DOMXSImplementationSourceImpl");
        DOMImplementationRegistry registry = DOMImplementationRegistry.newInstance();
        XSImplementation implementation = (XSImplementation) registry.getDOMImplementation("XS-Loader");
        XSLoader loader = implementation.createXSLoader(null);

        DOMConfiguration cfg = loader.getConfig();

        cfg.setParameter("resource-resolver", new LSResourceResolver() {
            public LSInput resolveResource(String type,
                                           String namespaceURI,
                                           String publicId,
                                           String systemId,
                                           String baseURI) {
                LSInput input = new LSInput() {
                    String systemId;

                    public void setSystemId(String systemId) {
                        this.systemId = systemId;
                    }

                    public void setStringData(String s) {
                    }

                    String publicId;

                    public void setPublicId(String publicId) {
                        this.publicId = publicId;
                    }

                    public void setEncoding(String s) {
                    }

                    public void setCharacterStream(Reader reader) {
                    }

                    public void setCertifiedText(boolean flag) {
                    }

                    public void setByteStream(InputStream inputstream) {
                    }

                    String baseURI;

                    public void setBaseURI(String baseURI) {
                        if (baseURI == null || "".equals(baseURI)) {
                            baseURI = getBaseURI();
                        }
                        this.baseURI = baseURI;
                    }

                    public String getSystemId() {
                        return this.systemId;
                    }

                    public String getStringData() {
                        return null;
                    }

                    public String getPublicId() {
                        return this.publicId;
                    }

                    public String getEncoding() {
                        return null;
                    }

                    public Reader getCharacterStream() {
                        return null;
                    }

                    public boolean getCertifiedText() {
                        return false;
                    }

                    public InputStream getByteStream() {
                        if (LOGGER.isTraceEnabled()) {
                            LOGGER.trace("Schema resource\n\t\t publicId '" + publicId + "'\n\t\t systemId '" + systemId + "' requested");
                        }
                        String pathToSchema = null;
                        if ("http://www.w3.org/MarkUp/SCHEMA/xml-events-attribs-1.xsd".equals(systemId)) {
                            pathToSchema = "schema/xml-events-attribs-1.xsd";
                        } else if ("http://www.w3.org/2001/XMLSchema.xsd".equals(systemId)) {
                            pathToSchema = "schema/XMLSchema.xsd";
                        } else if ("-//W3C//DTD XMLSCHEMA 200102//EN".equals(publicId)) {
                            pathToSchema = "schema/XMLSchema.dtd";
                        } else if ("datatypes".equals(publicId)) {
                            pathToSchema = "schema/datatypes.dtd";
                        } else if ("http://www.w3.org/2001/xml.xsd".equals(systemId)) {
                            pathToSchema = "schema/xml.xsd";
                        }


                        // LOAD WELL KNOWN SCHEMA
                        if (pathToSchema != null) {
                            if (LOGGER.isTraceEnabled()) {
                                LOGGER.trace("loading Schema '" + pathToSchema + "'\n\n");
                            }
                            return Thread.currentThread().getContextClassLoader().getResourceAsStream(pathToSchema);
                        }
                        // LOAD SCHEMA THAT IS NOT(!) YET KNWON TO THE XFORMS PROCESSOR
/*
                        else if (systemId != null && !"".equals(systemId)) {
                            URI schemaURI = new URI(baseURI);
                            schemaURI = schemaURI.resolve(systemId);

                            // ConnectorFactory.getFactory()
                            if (LOGGER.isDebugEnabled()) {
                                LOGGER.debug("loading schema resource '" + schemaURI.toString() + "'\n\n");
                            }
                            return ConnectorFactory.getFactory().getHTTPResourceAsStream(schemaURI);

                        }
*/
                        else {
                            LOGGER.error("resource not known '" + systemId + "'\n\n");
                            return null;
                        }

                    }

                    public String getBaseURI() {
                        return this.baseURI;
                    }
                };
                input.setSystemId(systemId);
                input.setBaseURI(baseURI);
                input.setPublicId(publicId);
                return input;
            }
        });
        // END: Patch
        return loader;
    }

    public Map getNamedDatatypes(List schemas) {
        Map datatypes = new HashMap();

        // iterate schemas
        Iterator schemaIterator = schemas.iterator();
        while (schemaIterator.hasNext()) {
            XSModel schema = (XSModel) schemaIterator.next();
            XSNamedMap definitions = schema.getComponents(XSConstants.TYPE_DEFINITION);

            for (int index = 0; index < definitions.getLength(); index++) {
                XSTypeDefinition type = (XSTypeDefinition) definitions.item(index);

                // process named simple types being supported by XForms
                if (type.getTypeCategory() == XSTypeDefinition.SIMPLE_TYPE &&
                        !type.getAnonymous() &&
                        getValidator().isSupported(type.getName())) {
                    String name = type.getName();

                    // extract local name
                    int separator = name.indexOf(':');
                    String localName = separator > -1 ? name.substring(separator + 1) : name;

                    // build expanded name
                    String namespaceURI = type.getNamespace();
                    String expandedName = NamespaceResolver.expand(namespaceURI, localName);

                    if (NamespaceConstants.XFORMS_NS.equals(namespaceURI) ||
                            NamespaceConstants.XMLSCHEMA_NS.equals(namespaceURI)) {
                        // register default xforms and schema datatypes without namespace for convenience
                        datatypes.put(localName, type);
                    }

                    // register uniquely named type
                    datatypes.put(expandedName, type);
                }
            }
        }

        return datatypes;
    }

}

// end of class
