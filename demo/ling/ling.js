// import "@polymer/paper-dialog";
// import "@polymer/paper-dialog-scrollable";
// import "@polymer/paper-button";

(function() {
  document.addEventListener('edit-morpheme', function(ev) {
    console.log('edit-morpheme');
    changeMorpheme(ev.detail.current, ev.target);
  });

  function prerootChanged(ev) {
    const currentValue = ev.target.value;
    ev.target.value = `foo`;
  }

  function changeMorpheme(current, target) {
    const dialog = document.getElementById('morpheme-dialog');
    dialog.querySelector('[name=query]').value = current;
    dialog.open();

    fetch('data/preroot.json', {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin',
    })
      .then(response => response.json())
      .then(json => {
        const results = dialog.querySelector('.results');
        results.innerHTML = '';
        json.forEach(entry => {
          const div = document.createElement('div');
          div.appendChild(document.createTextNode(`${entry.id}: ${entry.label}`));
          const btn = document.createElement('button');
          btn.innerHTML = 'Select';
          btn.addEventListener('click', ev => {
            console.log('current: %o', current);
            target.dispatchEvent(
              new CustomEvent('preroot-changed', {
                composed: true,
                bubbles: true,
                detail: { preroot: entry.id },
              }),
            );
          });
          div.appendChild(btn);

          results.appendChild(div);
        });
      });
  }
})();
