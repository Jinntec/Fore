package org.exist.xquery.functions.fore;

import org.exist.dom.QName;
import org.exist.http.servlets.SessionWrapper;
import org.exist.xquery.*;
import org.exist.xquery.functions.session.SessionModule;
import org.exist.xquery.value.*;

public class Process extends Function
{
//	private static final Logger logger = LogManager.getLogger(GetAttribute.class);

    public final static FunctionSignature signature =
            new FunctionSignature(
                    new QName( "process", ForeModule.NAMESPACE_URI, ForeModule.PREFIX ),
                    "processes a list of changes against a Fore model instance",
                    new SequenceType[] {
                            new FunctionParameterSequenceType( "token", Type.STRING, Cardinality.EXACTLY_ONE, "The token for model" )
                    },
                    new FunctionReturnSequenceType( Type.ITEM, Cardinality.ZERO_OR_MORE, "the attribute value" ) );

    public Process( XQueryContext context )
    {
        super( context, signature );
    }

    /* (non-Javadoc)
     * @see org.exist.xquery.Expression#eval(org.exist.dom.persistent.DocumentSet, org.exist.xquery.value.Sequence, org.exist.xquery.value.Item)
     */
    public Sequence eval(Sequence contextSequence, Item contextItem ) throws XPathException {

        final ForeModule myModule = (ForeModule) context.getModule(ForeModule.NAMESPACE_URI);

        // session object is read from global variable $session
        final Variable var = myModule.resolveVariable(ForeModule.FORE_VAR);


        // todo .....
        return null;
    }
}