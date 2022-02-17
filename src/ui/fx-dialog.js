
export class FxDialog extends HTMLElement {
  static get styles() {
    return `
      :host {
        display: none;
        height: auto;
        font-size: 0.8em;
        font-weight: 400;
        font-style: italic;
      }
      .show{
        display:block;
      }
    `;
  }

  static get properties() {
    return {
      id: String
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback(){
    this.render();
    this.id = this.getAttribute('id');

    // const dialog = document.getElementById(this.id);

    const closeBtn = this.shadowRoot.querySelector('.close');
    if(closeBtn){
      closeBtn.addEventListener('click', (e) => {
        document.getElementById(this.id).classList.remove('show');
      });
    }
  }

  render() {
    return `
      <style>
          ${FxDialog.styles}
      </style>
      <div id="modalMessage" class="overlay">
          <div class="popup">
             <h2></h2>
              <a class="close" href="#"  onclick="event.target.parentNode.parentNode.classList.remove('show')" autofocus>&times;</a>
              <div id="messageContent">
                    <slot></slot>
              </div>
          </div>
      </div>

    `;
  }


}
customElements.define('fx-dialog', FxDialog);
