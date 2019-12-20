package org.exist.fore.xpath;

import net.sf.saxon.expr.XPathContext;
import net.sf.saxon.expr.parser.ExpressionVisitor;
import net.sf.saxon.expr.parser.RetainedStaticContext;
import net.sf.saxon.functions.SystemFunction;
import net.sf.saxon.functions.registry.BuiltInFunctionSet;
import net.sf.saxon.om.*;
import net.sf.saxon.trans.XPathException;
import net.sf.saxon.tree.iter.ListIterator;
import net.sf.saxon.type.BuiltInAtomicType;
import net.sf.saxon.type.Type;
import net.sf.saxon.value.BooleanValue;
import net.sf.saxon.value.StringValue;
import org.exist.fore.model.Model;

import java.util.Collections;
import java.util.Optional;

import static net.sf.saxon.type.BuiltInAtomicType.*;

public class ForeFunctionSet extends BuiltInFunctionSet {

    private static ForeFunctionSet THE_INSTANCE = new ForeFunctionSet();

    public static ForeFunctionSet getInstance() {
        return THE_INSTANCE;
    }

    private ForeFunctionSet() {
        init();
    }

    private void init() {
        register("boolean-from-string", 1, BooleanFromString.class, BuiltInAtomicType.BOOLEAN, ONE, CORE, 0)
                .arg(0, STRING, ONE, null);

        register("instance", 1, Instance.class, Type.ITEM_TYPE, ONE, CORE, CITEM)
                .arg(0, BuiltInAtomicType.STRING, ONE, null);

    }

//    @Override
/*
    public String getNamespace() {
        return NamespaceConstants.XFORMS_NS;
    }
*/

    @Override
    public String getConventionalPrefix() {
        return "xf";
    }

    public static class BooleanFromString extends SystemFunction {

        @Override
        public Sequence<?> call(XPathContext xPathContext, Sequence[] arguments) throws XPathException {
            final String value = arguments[0].head().getStringValue();
            return toBoolean(value);
        }

        private BooleanValue toBoolean(final String bool) {
            if ("1".equals(bool) || "true".equalsIgnoreCase(bool)) {
                return BooleanValue.TRUE;
            } else {
                return BooleanValue.FALSE;
            }
        }

    }


    public static class Instance extends SystemFunction {

        /**
         * Ask whether the result of the function depends on the context item
         * @return true if the function depends on the context item
         */


        @Override
        public Sequence<?> call(XPathContext xPathContext, Sequence[] arguments) throws XPathException {
            final Optional<String> instanceId;
            if (arguments.length == 1) {
                instanceId = Optional.ofNullable(arguments[0].head().getStringValue());
            } else {
                instanceId = Optional.empty();
            }
            return SequenceTool.toLazySequence(instance(xPathContext, instanceId));

        }

        private SequenceIterator instance(final XPathContext context, final Optional<String> instanceId) {

            RetainedStaticContext rs = getRetainedStaticContext();
//            Object o = context.getContextItem();

            final XPathFunctionContext functionContext = getFunctionContext(context);

            if (functionContext != null) {
                final Model model = functionContext.getXFormsElement().getModel();
                final org.exist.fore.model.Instance instance;
                if(instanceId.isPresent()) {
                    instance = model.getInstance(instanceId.get());
                } else {
                    instance = model.getDefaultInstance();
                }

                if (instance != null) {
                    return new ListIterator(instance.getInstanceNodeset());
                }
            }

            return new ListIterator(Collections.EMPTY_LIST);
        }

        private XPathFunctionContext getFunctionContext(XPathContext context){
            XPathFunctionContext functionContext = (XPathFunctionContext) context.getController().getUserData("fnContext",
                    XPathFunctionContext.class.toString());

            return functionContext;
        }

        public boolean dependsOnContextItem() {
            return true;
        }


    }
}