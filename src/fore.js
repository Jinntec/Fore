export class Fore{

    static updateChildren(children){
        children.forEach(element => {

            //todo: later - check for AVTs
            if(!element.nodeName.toLowerCase().startsWith('xf-')) return;
            // if(element.nodeName.toLowerCase() === 'xf-repeat') return;

            if (typeof element.refresh === 'function') {
                element.refresh();
            }

        });

    }

}