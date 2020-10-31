import {evaluateUpdatingExpressionSync, executePendingUpdateList, registerXQueryModule} from 'fontoxpath';

const XFORMS_NAMESPACE_URI = 'http://www.w3.org/2002/xforms';

// These modules can use full XQuery 3.1 + XQuery update facility 3.0
registerXQueryModule(`
module namespace xf="${XFORMS_NAMESPACE_URI}";

declare %public function xf:boolean-from-string($str as xs:string) as xs:boolean {
	lower-case($str) = "true" or $str = "1"
};

declare %public function xf:false() as xs:boolean {
	fn:false()
};
declare %public function xf:true() as xs:boolean {
	fn:true()
};
declare %public function xf:count($arg as item()*) as xs:integer {
	fn:count($arg)
};

`);

// How to run XQUF:
/**
registerXQueryModule(`
module namespace my-custom-namespace = "my-custom-uri";
(:~
	Insert attribute somewhere
	~:)
declare %public %updating function my-custom-namespace:do-something ($ele as element()) as xs:boolean {
	if ($ele/@done) then false() else
	(insert node
	attribute done {"true"}
	into $ele, true())
};
`)
// At some point:
const contextNode = null;
const pendingUpdatesAndXdmValue = evaluateUpdatingExpressionSync('ns:do-something(.)', contextNode, null, null, {moduleImports: {'ns': 'my-custom-uri'}})

console.log(pendingUpdatesAndXdmValue.xdmValue); // this is true or false, see function

executePendingUpdateList(pendingUpdatesAndXdmValue.pendingUpdateList, null, null, null);
*/

export class Fore{


    static get ACTION_ELEMENTS(){
        return [
            'XF-DELETE',
            'XF-DISPATCH',
            'XF-INSERT',
            'XF-LOAD',
            'XF-MESSAGE',
            'XF-REBUILD',
            'XF-RECALCULATE',
            'XF-REFRESH',
            'XF-RENEW',
            'XF-REPLACE',
            'XF-RESET',
            'XF-RETAIN',
            'XF-RETURN',
            'XF-REVALIDATE',
            'XF-SEND',
            'XF-SETFOCUS',
            'XF-SETINDEX',
            'XF-SETVALUE',
            'XF-TOGGLE',
        ];
    }

	static get XFORMS_NAMESPACE_URI () {
		return XFORMS_NAMESPACE_URI
	}

    static isActionElement(elementName){
        const found = Fore.ACTION_ELEMENTS.includes(elementName);
        // console.log('isActionElement ', found);
        return Fore.ACTION_ELEMENTS.includes(elementName);
    }

    static get UI_ELEMENTS(){
        return [
            'XF-ALERT',
            'XF-BOUND',
            'XF-BUTTON',
            'XF-CONTROL',
            'XF-DIALOG',
            'XF-FILENAME',
            'XF-MEDIATYPE',
            'XF-GROUP',
            'XF-HINT',
            'XF-INPUT',
            'XF-ITEMSET',
            'XF-LABEL',
            'XF-OUTPUT',
            'XF-RANGE',
            'XF-REPEAT',
            'XF-REPEATITEM',
            'XF-SWITCH',
            'XF-SECRET',
            'XF-SELECT',
            'XF-SUBMIT',
            'XF-TEXTAREA',
            'XF-TRIGGER',
            'XF-UPLOAD'
        ];
    }


    static isUiElement(elementName){
        const found = Fore.UI_ELEMENTS.includes(elementName);
        if(found){
            // console.log('_isUiElement ', found);
        }
        return Fore.UI_ELEMENTS.includes(elementName);
    }



    static refreshChildren(startElement){
        const children = startElement.children;
        if(children){
            Array.from(children).forEach(element => {

                // todo: later - check for AVTs
                if (Fore.isUiElement(element.nodeName) && typeof element.refresh === 'function') {
                    element.refresh();
                }else{
                    if(element.nodeName !== 'XF-MODEL'){
                        Fore.refreshChildren(element);
                    }
                }

            });
        }
        // startElement.requestUpdat();
    }

}