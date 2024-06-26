import { FxOutput } from '../src/ui/fx-output';

export class ForeCorner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.href = '';
  }

  connectedCallback() {
    const style = `
          :host {
            display: block;
            max-width:100%;
          }
          .logo-corner {
            transform: rotate(-74deg);
            position: fixed;
            z-index:100;
            right: -2.5rem;
            top: -2.9rem;
            width: 6rem;
            height: 5rem;
            /* background: ghostwhite; */
            border: thin solid lightsteelblue;
            background: rgba(255, 255, 255, 0.3);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(4.3px);
            -webkit-backdrop-filter: blur(4.3px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-top-left-radius: 0.2rem;
            border:2px solid white;
        }
        .logo-corner:hover{
            // background: ghostwhite;
            box-shadow: 0 6px 40px rgba(0, 0, 0, 0.7);
        }
        
        .logo-corner .logo {
            width: 3rem;
            position: absolute;
            top: 1.25rem;
            left: -0.4rem;
            transform: rotate(75deg);
        }
        
        `;

    this.href = this.getAttribute('href');
    const outputHtml = `
            <a href="${this.href}">
                <div class="logo-corner">
                    <img class="logo fore" src="/doc/light-blue1.png">
                </div>
            </a>
        `;

    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${outputHtml}
        `;
  }
}
if (!customElements.get('fore-corner')) {
  customElements.define('fore-corner', ForeCorner);
}
