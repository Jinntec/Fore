import XfAbstractControl from './abstract-control.js';

/**
 * This class finds and lists all elements with an 'on-demand' attribute and offers them
 * in a popup list for activation. 'on-demand' is not a state like 'relevant' but just
 * shows/hides controls on demand. The controls still behave as usual otherwise.
 *
 *
 */
export class FxControlMenu extends XfAbstractControl {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.selectExpr = this.getAttribute('select');

    const style = `
      :host {
        display: inline-block;
        position: relative;
      }

      .menu {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 10;
        background: white;
        border: 1px solid #ccc;
        padding: 0.5em;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        min-width: 10em;
        white-space:nowrap;
      }

      .menu.visible {
        display: block;
      }

      .menu a {
        display: block;
        padding: 0.25em 0.5em;
        text-decoration: none;
        color: black;
        cursor: pointer;
      }

      .menu a:hover {
        background-color: #eee;
      }
    `;

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <slot></slot>
      <div class="menu" part="menu"></div>
    `;

    this.menuEl = this.shadowRoot.querySelector('.menu');

    // Slotted button click
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', () => {
      const nodes = slot.assignedNodes({ flatten: true });
      const button = nodes.find(
        node => node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BUTTON',
      );
      if (button) {
        button.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          this.updateMenu();
          this.menuEl.classList.toggle('visible');
        });
      }
    });

    // Update menu on custom event
    document.addEventListener('update-control-menu', () => {
      this.updateMenu();
    });

    // Close on outside click
    document.addEventListener('click', e => {
      const inside = this.contains(e.target) || this.shadowRoot.contains(e.target);
      if (!inside) {
        this.menuEl.classList.remove('visible');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.menuEl.classList.remove('visible');
      }
    });

    if (this.getAttribute('mode') === 'hide-on-empty') {
      this.getOwnerForm().addEventListener('ready', () => {
        const container = document.querySelector(this.selectExpr);
        if (!container) return;

        const widgets = container.querySelectorAll('.widget');
        widgets.forEach(widget => {
          const value = widget.value?.trim();
          const control = widget.closest('fx-control');
          if (control && (value === '' || value == null)) {
            control.setAttribute('on-demand', 'true');
          }
        });

        // After marking empty controls, update the menu
        this.updateMenu();
      });
    }

    const container = document.querySelector(this.selectExpr);
    container?.addEventListener('show-control', event => {
      this.updateMenu();
    });

    this.updateMenu();
  }

  updateMenu() {
    const container = document.querySelector(this.selectExpr);
    if (!container) return;

    let targets = [];

    if (container.hasAttribute('on-demand')) {
      if (container.nodeName === 'FX-REPEAT') {
        // If it's an <fx-repeat> with on-demand, use only the container
        targets = [container];
      } else {
        // If it's not <fx-repeat>, include container and inner [on-demand] targets
        targets = [container, ...container.querySelectorAll('[on-demand]')];
      }
    } else {
      // If container is not on-demand, only look for inner [on-demand]
      targets = Array.from(container.querySelectorAll('[on-demand]'));
    }
    this._currentTargets = targets;
    this.menuEl.innerHTML = ''; // Clear menu

    // Find the slotted button
    const slot = this.shadowRoot.querySelector('slot');
    const assignedNodes = slot.assignedNodes({ flatten: true });
    const button = assignedNodes.find(
      node => node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BUTTON',
    );

    if (button) {
      button.disabled = targets.length === 0;
    }

    if (targets.length === 0) {
      this.menuEl.classList.remove('visible');
      return;
    }

    targets.forEach((el, index) => {
      let label = el.getAttribute('aria-label');
      if (!label) {
        label = el.querySelector('label')?.textContent.trim() || `Item ${index + 1}`;
      }
      if (!label) {
        console.warn(
          'no label found - cannot create menu entry for ',
          el,
          ' - please add aria-label or label element to control',
        );
      }
      const item = document.createElement('a');
      item.href = '#';
      item.textContent = label;

      item.addEventListener('click', e => {
        e.preventDefault();
        if (typeof el.activate === 'function') {
          el.activate();
        }

        this.menuEl.classList.remove('visible');

        // Wait one frame to let DOM updates (like on-demand removal) take effect
        requestAnimationFrame(() => {
          this.updateMenu();
        });
      });

      this.menuEl.appendChild(item);
    });
  }
}

if (!customElements.get('fx-control-menu')) {
  customElements.define('fx-control-menu', FxControlMenu);
}
