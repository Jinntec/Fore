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


    static refreshChildren(children){
        children.forEach(element => {

            //todo: later - check for AVTs
            if(!element.nodeName.toLowerCase().startsWith('xf-')) return;
            if(element.nodeName.toLowerCase() === 'xf-repeatitem') return;

            if (typeof element.refresh === 'function') {
                element.refresh();
            }

        });

    }

}