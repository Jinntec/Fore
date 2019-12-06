/*
 * Copyright (c) 2012. betterFORM Project - http://www.betterform.de
 * Licensed under the terms of BSD License
 */

package org.exist.fore.xpath;

import net.sf.saxon.functions.registry.ConstructorFunctionLibrary;
import net.sf.saxon.functions.registry.XPath31FunctionSet;
import org.exist.fore.XFormsException;
import net.sf.saxon.sxpath.XPathDynamicContext;
import net.sf.saxon.sxpath.XPathEvaluator;
import net.sf.saxon.sxpath.XPathExpression;
import net.sf.saxon.Configuration;
import net.sf.saxon.dom.DOMNodeWrapper;
import net.sf.saxon.expr.LastPositionFinder;
import net.sf.saxon.functions.FunctionLibraryList;
import net.sf.saxon.om.FocusTrackingIterator;
import net.sf.saxon.om.Item;
import net.sf.saxon.om.NodeInfo;
import net.sf.saxon.om.SequenceIterator;
import net.sf.saxon.sxpath.IndependentContext;
import net.sf.saxon.trans.XPathException;
import net.sf.saxon.tree.iter.LookaheadIterator;
import net.sf.saxon.xpath.XPathFunctionLibrary;
import org.exist.fore.model.Model;
import org.w3c.dom.Node;

import java.util.*;

/**
 * A XPath cache that caches the XPath expressions.
 *
 * @author Nick Van den Bleeken
 * @version $Id$
 */
public class XPathCache {
	
    private static final Configuration kCONFIG = new Configuration();

	private static final FunctionLibraryList fgXFormsFunctionLibrary;

    private static final XPathCache fgXPathCache = new XPathCache();



    static {
        fgXFormsFunctionLibrary = new FunctionLibraryList();
        fgXFormsFunctionLibrary.addFunctionLibrary(XPath31FunctionSet.getInstance());
        fgXFormsFunctionLibrary.addFunctionLibrary(new ConstructorFunctionLibrary(XPathCache.kCONFIG));
        fgXFormsFunctionLibrary.addFunctionLibrary(XFormsFunctionLibrary.getInstance());
//        fgXFormsFunctionLibrary.addFunctionLibrary(new BetterFormFunctionLibrary());
//        fgXFormsFunctionLibrary.addFunctionLibrary(new XPathFunctionLibrary());

//        fgXFormsFunctionLibrary.addFunctionLibrary(new JavaExtensionLibrary(XPathCache.kCONFIG));

    }
    public static XPathCache getInstance() {
        return fgXPathCache;
    }

    private XPathCache() {
    }

    public static FunctionLibraryList getFgXFormsFunctionLibrary() {
        return fgXFormsFunctionLibrary;
    }

    public String evaluateAsString(List nodeset, int position, String xpathString, Map prefixMapping, XPathFunctionContext functionContext)
        throws XFormsException {
        return XPathUtil.getAsString(evaluate(nodeset, position, xpathString, prefixMapping, functionContext), 1);
    }

    public String evaluateAsString(BetterFormXPathContext context, String xpathString)
        throws XFormsException {
        return XPathUtil.getAsString(evaluate(context.getNodeset(), context.getPosition(), xpathString, context.getPrefixMapping(), context.getXPathFunctionContext()), 1);
    }

    public Boolean evaluateAsBoolean(BetterFormXPathContext context, String xpathString)
        throws XFormsException {
        return XPathUtil.getAsBoolean(evaluate(context.getNodeset(), context.getPosition(), xpathString, context.getPrefixMapping(), context.getXPathFunctionContext()), 1);
    }

    public Boolean evaluateAsBoolean(List nodeset, int position, String xpathString, Map prefixMapping, XPathFunctionContext functionContext)
        throws XFormsException {
        return XPathUtil.getAsBoolean(evaluate(nodeset, position, xpathString, prefixMapping, functionContext), 1);
    }
    
    public double evaluateAsDouble(List nodeset, int position, String xpathString, Map prefixMapping, XPathFunctionContext functionContext)
	    throws XFormsException {
	    return XPathUtil.getAsDouble(evaluate(nodeset, position, xpathString, prefixMapping, functionContext), 1);
	}
	
	public double evaluateAsDouble(BetterFormXPathContext context, String xpathString)
	    throws XFormsException {
	    return XPathUtil.getAsDouble(evaluate(context.getNodeset(), context.getPosition(), xpathString, context.getPrefixMapping(), context.getXPathFunctionContext()), 1);
	}



    public List evaluate(BetterFormXPathContext context, String xpathString)
        throws XFormsException {
        return evaluate(context.getNodeset(), context.getPosition(), xpathString, context.getPrefixMapping(), context.getXPathFunctionContext());
    }

    public List evaluate(NodeInfo contextNode, String xpathString, Map prefixMapping, XPathFunctionContext functionContext)
        throws XFormsException {
        return evaluate(Collections.singletonList(contextNode), 1, xpathString, prefixMapping, functionContext);
    }


    public Node evaluateAsSingleNode(List nodeset, int position, String xpath, Map prefixes, XPathFunctionContext functionContext) throws XFormsException {
        NodeInfo node = (NodeInfo) XPathCache.getInstance().evaluate(nodeset,1, xpath,prefixes,functionContext).get(0);
            return (Node) ((DOMNodeWrapper)node).getUnderlyingNode();
        }

    public Node evaluateAsSingleNode(BetterFormXPathContext context,String xpath) throws XFormsException {

        List nodeList =  XPathCache.getInstance().evaluate(context, xpath);
        if(nodeList != null && nodeList.size() >= 1){
            NodeInfo node = (NodeInfo)nodeList.get(0);
            return (Node) ((DOMNodeWrapper)node).getUnderlyingNode();
         }else {
            return null;
        }
    }
    /**
     *
     */
    public List evaluate(List nodeset, int position, String xpathString, Map prefixMapping, XPathFunctionContext functionContext)
        throws XFormsException {
        if (nodeset != null && nodeset.size() < position) {
            return Collections.EMPTY_LIST;
        }


        try {
            final XPathExpression exp = getXPathExpression(xpathString, prefixMapping, XPathCache.kCONFIG);
            final XPathDynamicContext context = exp.createDynamicContext((Item) nodeset.get(position - 1));
            FocusTrackingIterator nodesetIt = new FocusTrackingIterator(new ListSequenceIterator(nodeset, position));
            nodesetIt.next();
            context.getXPathContextObject().setCurrentIterator(nodesetIt);
            // todo: ??? really needed ?

            context.getXPathContextObject().getController().setUserData(Model.class.toString(), XPathFunctionContext.class.toString(), functionContext);

            SequenceIterator it = exp.iterate(context);

            int nrOfEntries;
            if ((it.getProperties() & SequenceIterator.LAST_POSITION_FINDER) != 0) {
                nrOfEntries = ((LastPositionFinder) it).getLength();
            } else {
                nrOfEntries = -1;
            }

            if (nrOfEntries == 1) {
                return Collections.singletonList(it.next());
            }

            final List result = new ArrayList(nrOfEntries > 0 ? nrOfEntries : 20);
            for (Object item = it.next(); item != null; item = it.next()) {
                result.add(item);
            }

            return result;

        } catch (XPathException e) {
        	if (e.getCause() instanceof XFormsException) {
        		throw (XFormsException)e.getCause();
        	}
            throw new XFormsException(e.getMessage(), e);
        }

    }

    /**
     * @param xpathString
     * @param prefixMapping
     * @return
     * @throws XPathException
     */
    public XPathExpression getXPathExpression(String xpathString, Map prefixMapping, Configuration configuration) throws XPathException {
        XPathEvaluator xpe = new XPathEvaluator(configuration);

        //IndependentContext independentContext = (IndependentContext) xpe.getStaticContext();
        IndependentContext independentContext = (IndependentContext) xpe.getStaticContext();
//        independentContext.setDefaultFunctionNamespace("http://www.w3.org/2005/xpath-functions");
//        independentContext.setDefaultFunctionNamespace("");
        independentContext.setBackwardsCompatibilityMode(true);

        // XXX set base URI

        if(prefixMapping != null) {
            for (Iterator it = prefixMapping.entrySet().iterator(); it.hasNext(); ) {
                Map.Entry entry = (Map.Entry) it.next();
                independentContext.declareNamespace((String) entry.getKey(), (String) entry.getValue());
            }
        }
        //independentContext.declareNamespace("bffn","java:de.betterform.xml.xforms.xpath.BetterFormXPathFunctions");
        // XXX declare variable

        independentContext.setFunctionLibrary(fgXFormsFunctionLibrary);
        xpe.setStaticContext(independentContext);

        XPathExpression exp = xpe.createExpression(xpathString);

        return exp;
    }

    /**
     * @param prefixMapping
     * @return
     */
    private IndependentContext createIndependentContext(Map prefixMapping) {
        final IndependentContext independentContext = new IndependentContext();
        independentContext.setDefaultFunctionNamespace(NamespaceConstants.XFORMS_NS);
        independentContext.setBackwardsCompatibilityMode(true);

        // XXX set base URI

        for (Iterator it = prefixMapping.entrySet().iterator(); it .hasNext();) {
            Map.Entry entry = (Map.Entry) it.next();
            independentContext.declareNamespace((String) entry.getKey(), (String) entry.getValue());
        }

        // XXX declare variable

        independentContext.setFunctionLibrary(fgXFormsFunctionLibrary);
        return independentContext;
    }

    private static class ListSequenceIterator implements SequenceIterator, Cloneable, LastPositionFinder, LookaheadIterator {

        private List nodeset;
        private int position;

        
        /**
         * 
         * @param nodeset
         * @param position 1 based
         */
        public ListSequenceIterator(List nodeset, int position) {
            this.nodeset = nodeset;
            this.position = position - 1;
        }

        public Item current() {
            if (position != -1) {
                return (NodeInfo) nodeset.get(position - 1);
            }

            return null;
        }

        public SequenceIterator getAnother() {
            return new ListSequenceIterator(nodeset, position);
        }

        public Item next() {
            if (position < nodeset.size()) {
                position++;
            } else {
                position = -1;
            }
            return current();
        }

        public int position() {
            return position;
        }

        public void close() {
            this.close();
        }

        /**
         * Get properties of this iterator, as a bit-significant integer.
         *
         * @return the properties of this iterator. This will be some combination of
         *         properties such as {@link #GROUNDED}, {@link #LAST_POSITION_FINDER},
         *         and {@link #LOOKAHEAD}. It is always
         *         acceptable to return the value zero, indicating that there are no known special properties.
         *         It is acceptable for the properties of the iterator to change depending on its state.
         */

        public int getProperties() {
            return LAST_POSITION_FINDER | LOOKAHEAD;
        }

        //@Override
        public int getLength() throws XPathException {
			return nodeset.size();
		}

        //@Override
		public boolean hasNext() {
			return position <= nodeset.size();
		}
		
    }
}
