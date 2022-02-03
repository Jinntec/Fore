/**
 * lists out all live instances in html 'details' and 'summary' elements.
 */
export class FxInspector extends HTMLElement {
  connectedCallback() {
    const style = `
          :host {
            display: block;
            width:100%;
            background:var(--inspector-bg);
          }
          pre{
            background:var(--inspector-pre-bg);
            color:var(--inspector-color);
            max-height:var(--inspector-instance-height,300px);
            overflow:scroll;
          }
        `;

    const instances = Array.from(document.querySelectorAll('fx-instance'));
    this.innerHTML = `
            <style>
                ${style}
            </style>
            <slot></slot>
            ${instances
              .map(
                (instance, index) => `
              <details ${index === 0 ? `open` : ''}>
                  <summary>${instance.id}</summary>
                  <pre>{log('${instance.id}')}</pre>
              </details>
            `,
              )
              .join('')}
        `;

    this.addEventListener('slotchange', e => {
      console.log('slotchange ', e);
    });
  }
}

customElements.define('fx-inspector', FxInspector);
