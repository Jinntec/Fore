import XfAbstractControl from './abstract-control.js';

/**
 * This class finds and lists all elements with an 'on-demand' attribute and offers them
 * in a popup list for activation. 'on-demand' is not a state like 'relevant' but just
 * shows/hides controls on demand. The controls still behave as usual otherwise.
 *
 * Implements the ARIA "menu button" pattern: the slotted trigger gets `aria-haspopup`/
 * `aria-expanded`/`aria-controls`, the popup gets `role="menu"` with `role="menuitem"`
 * entries, and Up/Down/Home/End move a roving tabindex across the open menu.
 */
export class FxControlMenu extends XfAbstractControl {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.selectExpr = this.getAttribute('select');
    this.triggerButton = null;

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
      <div class="menu" part="menu" role="menu"></div>
    `;

    this.menuEl = this.shadowRoot.querySelector('.menu');
    this.menuEl.addEventListener('keydown', e => this._handleMenuKeydown(e));

    // Slotted button click
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', () => {
      const nodes = slot.assignedNodes({ flatten: true });
      const button = nodes.find(
        node => node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BUTTON',
      );
      if (button && button !== this.triggerButton) {
        this.triggerButton = button;
        button.setAttribute('aria-haspopup', 'true');
        button.setAttribute('aria-expanded', 'false');
        button.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          this.updateMenu();
          if (this.menuEl.classList.contains('visible')) {
            this._closeMenu();
          } else {
            this._openMenu();
          }
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
        this._closeMenu();
      }
    });

    // Close on Escape, returning focus to the trigger
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.menuEl.classList.contains('visible')) {
        this._closeMenu({ restoreFocus: true });
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

  _getScopedContainer() {
    const repeatItem = this.closest('fx-repeatitem');
    if (repeatItem) return repeatItem;

    if (this.selectExpr) {
      return document.querySelector(this.selectExpr);
    }

    return null;
  }

  /**
   * Opens the popup, reflects `aria-expanded` on the trigger, and moves focus to the
   * first menu item (ARIA "menu button" pattern).
   */
  _openMenu() {
    this.menuEl.classList.add('visible');
    this.triggerButton?.setAttribute('aria-expanded', 'true');
    this.menuEl.querySelector('a')?.focus();
  }

  /**
   * Closes the popup and reflects `aria-expanded` on the trigger. Focus is only restored
   * to the trigger for dismissal paths (Escape, outside click) - not on item selection,
   * where `el.activate()` already moves focus to the newly revealed control.
   */
  _closeMenu({ restoreFocus = false } = {}) {
    this.menuEl.classList.remove('visible');
    this.triggerButton?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) {
      this.triggerButton?.focus();
    }
  }

  /**
   * Roving-tabindex arrow-key navigation between menu items (Up/Down/Home/End), following
   * the WAI-ARIA menu pattern.
   */
  _handleMenuKeydown(e) {
    const items = Array.from(this.menuEl.querySelectorAll('a'));
    if (items.length === 0) return;
    const idx = items.indexOf(e.target);
    if (idx === -1) return;

    let newIdx;
    switch (e.key) {
      case 'ArrowDown':
        newIdx = (idx + 1) % items.length;
        break;
      case 'ArrowUp':
        newIdx = (idx - 1 + items.length) % items.length;
        break;
      case 'Home':
        newIdx = 0;
        break;
      case 'End':
        newIdx = items.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    items.forEach((item, i) => item.setAttribute('tabindex', i === newIdx ? '0' : '-1'));
    items[newIdx].focus();
  }

  updateMenu() {
    const container = this._getScopedContainer();
    if (!container) return;

    const targets = [];
    // ✅ Include container itself if it has on-demand
    if (container.hasAttribute('on-demand')) {
      targets.push(container);
    }

    // ✅ Also include any descendant [on-demand] controls if not within repeat
    if (container.nodeName !== 'FX-REPEAT') {
      const innerTargets = Array.from(container.querySelectorAll('[on-demand]'));
      targets.push(...innerTargets);
    }

    this._currentTargets = targets;
    this.menuEl.innerHTML = '';

    // Find the button to disable if needed
    const slot = this.shadowRoot.querySelector('slot');
    const assignedNodes = slot.assignedNodes({ flatten: true });
    const button = assignedNodes.find(
      node => node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BUTTON',
    );

    if (button) {
      button.disabled = targets.length === 0;
    }

    if (targets.length === 0) {
      this._closeMenu();
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
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');

      item.addEventListener('click', e => {
        e.preventDefault();
        if (typeof el.activate === 'function') {
          el.activate();
        }

        this._closeMenu();

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
