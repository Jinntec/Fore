const slots = this.shadowRoot.querySelectorAll('slot');
slots[0].addEventListener('slotchange', e => {
    console.log('slotchange ', e);
    console.log('slotchange ', slots[0].assignedElements());
    const elements = slots[0].assignedElements();
    elements.forEach(element => {
        if(element.nodeName.toLocaleUpperCase() === 'XF-MODEL'){
            // element._modelConstruct();
            console.log('model ', element);
            if(!element.inited){
                element._modelConstruct();
            }
        }
    });
});
