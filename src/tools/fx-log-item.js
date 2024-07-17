export class FxLogItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.eventName = '';
    this.shortName = '';
    this.shortInfo = '';
    this.shortPath = '';
    this.xpath = '';
  }

  connectedCallback() {
    const style = `
      :host {
        height: auto;
        font-size: 0.8em;
        font-weight: 400;

      }

      a,a:link,a:visited{
        color:black;
      }
      a{
        position:relative;
      }
      a[alt]:hover::after {
        content:attr(alt);
        position:absolute; 
        left:0;
        top:1em;
        border.thin solid;
        padding:0.5em;
        background:white;
        z-index:1;
        min-width:5em;
        border:thin solid;
        white-space:nowrap;
        overflow-wrap:break-word;
      }

     .info{
        padding:0 0.5em;
        margin:0.1rem 0;
        background:white;
        position:relative;
        border:1px solid #ddd;
        border-radius:1em;       
        box-shadow: 1px 1px 5px 0px rgba(79, 136, 183, 0.8);
      }
      :host(.action) .info{
        border-radius:0;
        border-color:steelblue;
      }

      .info label{
        grid-area:left;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .info a{
        grid-area:right;
        justify-self:end;
      }
      .info:hover{
        outline:3px solid lightblue;       
        transition:height 0.4s;
      }

       summary{
        padding:1em;
        display:flex;
        flex-wrap:wrap;
        padding:0.5em 0;
        cursor:pointer;
        gap:0.25em;
      }
/*
      .log-name{
        font-size:1.2em;
      }
      .log-name, .short-info{
        width:10em;
      }
*/
      .event-name{
        width:12em;
        text-align:right;
        }
      .short-info{
        flex:3;
        overflow:hidden;
        white-space:nowrap;
        text-overflow:ellipsis;
      }
    `;

    this.eventName = this.getAttribute('event-name');
    this.shortName = this.getAttribute('short-name');
    this.shortInfo = this.hasAttribute('short-info') ? this.getAttribute('short-info') : '';
    this.xpath = this.getAttribute('xpath');

    const cut = this.xpath.substring(this.xpath.indexOf('/fx-fore'), this.xpath.length);
    const xpathCut = `/${cut}`;
    const shortPath = xpathCut.replaceAll('fx-', '');

    const html = `
       <details class="info send">
              <summary>
                <span class="log-name"><a href="#" title="${shortPath}" data-path="${this.xpath}">${this.shortName}</a></span>
                <span class="short-info">${this.shortInfo}</span>
                <span class="event-name">${this.eventName}</span>                    
              </summary>
            <slot></slot>
        </details>
    `;

    this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
        ${html}
    `;
  }
}
if (!customElements.get('fx-log-item')) {
  customElements.define('fx-log-item', FxLogItem);
}
