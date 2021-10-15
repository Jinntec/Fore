{
  console.log('editor.js');

  document.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  document.addEventListener('drop', function(e) {
    console.log('drop', e);
    // e.preventDefault();
    // Get the id of the target and add the moved element to the target's DOM
    const elementName = e.dataTransfer.getData('text/plain');
    console.log('drop element', elementName);
    const droppedElement = e.dataTransfer.getData('text/html');
    console.log('dropped element', droppedElement);

    if (
      elementName === 'fx-instance' ||
      elementName === 'fx-bind' ||
      elementName === 'fx-submission'
    ) {
      const currentInsertPoint = document.querySelector('main fx-model');
      const newElem = document.createElement(elementName);
      newElem.setAttribute('data-name', elementName);
      newElem.textContent = elementName;

      // const model = document.querySelector('fx-model');
      currentInsertPoint.appendChild(newElem);
      newElem.setAttribute('draggable', 'true');
      newElem.addEventListener('dragstart', ev => {
        ev.dataTransfer.setData('text/plain', ev.target.innerText);
        ev.dataTransfer.setData('text/html', ev.target.outerHTML);
      });
      newElem.addEventListener('drop', ev => {
        console.log('dropped on instance', ev.target);
        const elementName = e.dataTransfer.getData('text/plain');
        console.log('drop element', elementName);
        const droppedElement = e.dataTransfer.getData('text/html');
        console.log('dropped element', droppedElement);

        const newElem = document.createElement(elementName);
        newElem.setAttribute('data-name', elementName);
        newElem.textContent = elementName;

        // const model = document.querySelector('fx-model');
        ev.target.appendChild(newElem);
      });

      /*
                            const clone = droppedElement.cloneNode();
                            currentInsertPoint.appendChild(clone);
                */
      return;
    }
    const currentInsertPoint = document.querySelector('[current]');
    const newElem = document.createElement(elementName);
    newElem.setAttribute('data-name', elementName);
    newElem.textContent = elementName;
    currentInsertPoint.appendChild(newElem);

    // const link = e.dataTransfer.getData("application/x-bookmark");
    // const iconsrc = e.dataTransfer.getData("application/x-icon");
  });

  (function() {
    console.log('inited page.....');
    const draggables = document.querySelectorAll('.element-name');
    Array.from(draggables).forEach(element => {
      element.addEventListener('dragstart', ev => {
        console.log('_handleDragStart', ev);
        console.log('_handleDragStart target', ev.target);
        console.log('_handleDragStart target', ev.target.innerText);
        ev.dataTransfer.setData('text/plain', ev.target.innerText);
        ev.dataTransfer.setData('text/html', ev.target.outerHTML);
      });
    });
  })();
}
