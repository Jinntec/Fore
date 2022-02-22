export class FxDialog extends HTMLElement {

    static get properties() {
        return {
            id: String
        };
    }

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    connectedCallback() {
        const style = `
          :host {
            display: none;
            height: 100vh;
            width:100vw;
            position:fixed;
            left:0;
            top:0;
            right:0;
            bottom:0;
          }
        `;

        this.shadowRoot.innerHTML = this.render(style);
        this.id = this.getAttribute('id');

        // const dialog = document.getElementById(this.id);

        const closeBtn = this.querySelector('.close-dialog');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                document.getElementById(this.id).classList.remove('show');
            });
        }

        this.focus();
    }

    render(styles) {
        return `
      <style>
          ${styles}
      </style>
      <slot></slot>
    `;
    }

    open(){
        window.addEventListener('keyup', (e) => {
            if (e.key === "Escape") {
                this.hide();
            }
        },{once:true});

        this.classList.add('show');
    }

    hide(){
        this.classList.remove('show');
    }

}

customElements.define('fx-dialog', FxDialog);
