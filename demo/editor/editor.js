{
  console.log('editor.js');

  const targetFore = document.getElementById('edited');
  const attributes = document.getElementById('attributes');
  // const targetModel = targetFore.querySelector('xf-model');
  const targetModel = document.getElementById('targetModel');
  targetModel.querySelector('fx-instance').addEventListener('click', e => {
    console.log('element selected', e.target);
    document.dispatchEvent(
      new CustomEvent('selectElement', {
        composed: true,
        bubbles: true,
        detail: { current: e.target },
      }),
    );

    /*
        document.dispatchEvent(new CustomEvent('error',
        composed: true,
        bubbles: true,
        { detail: {'current':e.target.innerText} }));
*/
  });

  document.addEventListener('dragover', function(e) {
    e.preventDefault();
    // console.log('dragover', e);
    e.dataTransfer.dropEffect = 'copy';
  });

  let currentDroppable = null;

  function onMouseMove(event) {
    moveAt(event.pageX, event.pageY);

    ball.hidden = true;
    let elemBelow = document.elementFromPoint(event.clientX, event.clientY);
    ball.hidden = false;

    // mousemove events may trigger out of the window (when the ball is dragged off-screen)
    // if clientX/clientY are out of the window, then elementFromPoint returns null
    if (!elemBelow) return;

    // potential droppables are labeled with the class "droppable" (can be other logic)
    let droppableBelow = elemBelow.closest('.droppable');

    if (currentDroppable != droppableBelow) {
      // we're flying in or out...
      // note: both values can be null
      //   currentDroppable=null if we were not over a droppable before this event (e.g over an empty space)
      //   droppableBelow=null if we're not over a droppable now, during this event

      if (currentDroppable) {
        // the logic to process "flying out" of the droppable (remove highlight)
        leaveDroppable(currentDroppable);
      }
      currentDroppable = droppableBelow;
      if (currentDroppable) {
        // the logic to process "flying in" of the droppable
        enterDroppable(currentDroppable);
      }
    }
  }
  targetModel.addEventListener('dragenter', function(e) {
    // if(event.target.innerText === 'FX-MODEL'){
    event.target.style.background = 'rgba(255,255,255,0.8)';
    // }
  });

  console.log('targetModel', targetModel);
  document.addEventListener('drop', function(e) {
    console.log('drop', e);
    // e.preventDefault();
    // Get the id of the target and add the moved element to the target's DOM
    const elementName = e.dataTransfer.getData('text/plain');
    console.log('drop element', elementName);
    const droppedElement = e.dataTransfer.getData('text/html');
    console.log('dropped element', droppedElement);

    const elements = document.getElementById('elements');
    const templateForElement = elements.instanceData.querySelector(`fx-${elementName}`);
    console.log('found template element', templateForElement);


    if (
      elementName === 'instance' ||
      elementName === 'bind' ||
      elementName === 'submission' ||
      elementName === 'function'
    ) {
      const realTarget = document.elementFromPoint(e.clientX, e.clientY);
      console.log('realTarget', realTarget);

      const currentInsertPoint = document.querySelector('main fx-model');
      const newElem = document.createElement('fx-' + elementName);
      // newElem.setAttribute('data-name', elementName);
      newElem.textContent = elementName;

      // const model = document.querySelector('fx-model');
      currentInsertPoint.appendChild(newElem);
      newElem.setAttribute('draggable', 'true');

      newElem.addEventListener('click', e => {
        console.log('element selected', e.target);
      });

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


        const newElem = document.createElement('fx-' + elementName);
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
    // const currentInsertPoint = document.querySelector('[current]');
    const currentInsertPoint = document.elementFromPoint(e.clientX, e.clientY);

    const newElem = templateForElement.cloneNode(true);
/*
    const newElem = document.createElement('fx-' + elementName);
    // newElem.setAttribute('data-name', elementName);
    newElem.textContent = elementName;
*/
    currentInsertPoint.appendChild(newElem);
    // currentDroppable.appendChild(newElem);

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
