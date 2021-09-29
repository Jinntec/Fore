import '../fx-model.js';
import { foreElementMixin } from '../ForeElementMixin.js';
import { ModelItem } from '../modelitem.js';

/**
 * `AbstractControl` -
 * is a general base class for control elements.
 *
 */
export default class AbstractControl extends foreElementMixin(HTMLElement) {

  constructor() {
    super();
    this.value = '';
    this.display = this.style.display;
    this.required = false;
    this.readonly = false;
    this.widget = null;
    // this.attachShadow({ mode: 'open' });
  }

  // eslint-disable-next-line class-methods-use-this
  getWidget() {
    throw new Error('You have to implement the method updateWidgetValue!');
  }

  /**
   * (re)apply all modelItem state properties to this control. model -> UI
   */
  async refresh() {
    console.log('### AbstractControl.refresh on : ', this);

    const currentVal = this.value;

    // if(this.repeated) return ;
    if (this.isNotBound()) return;

    // await this.updateComplete;
    // await this.getWidget();
    this.evalInContext();

    if (this.isBound()) {
      // this.control = this.querySelector('#control');

      if (this.nodeset === null) {
        this.style.display = 'none';
        return;
      }

      this.modelItem = this.getModelItem();

      if (this.modelItem instanceof ModelItem) {
        // console.log('### XfAbstractControl.refresh modelItem : ', this.modelItem);

        this.value = this.modelItem.value;
        // console.log('>>>>>>>> abstract refresh ', this.control);
        // this.control[this.valueProp] = this.value;
        await this.updateWidgetValue();
        this.handleModelItemProperties();

        // if(!this.closest('fx-fore').ready) return; // state change event do not fire during init phase (initial refresh)
        if (!this.getOwnerForm().ready) return; // state change event do not fire during init phase (initial refresh)
        if (currentVal !== this.value) {
          // console.log('dispatching value-changed for ', this);
          // console.log('value-changed path ', this.modelItem.path);
          this.dispatch('value-changed', { path: this.modelItem.path });
        }
        // this.requestUpdate();
      }
    }
    // await this.updateComplete;
  }

  // eslint-disable-next-line class-methods-use-this
  async updateWidgetValue() {
    throw new Error('You have to implement the method updateWidgetValue!');
  }

  handleModelItemProperties() {
    this.handleRequired();
    this.handleReadonly();
    this.handleValid();
    this.handleRelevant();
  }

  _getForm() {
    return this.getModel().parentNode;
  }

  _dispatchEvent(event) {
    if (this.getOwnerForm().ready) {
      this.dispatch(event,{})
    }
  }

  // eslint-disable-next-line class-methods-use-this
  handleRequired() {
    // console.log('mip required', this.modelItem.required);
    // const control = this.querySelector('#control');
    this.widget = this.getWidget();
    if (this.isRequired() !== this.modelItem.required) {
      if (this.modelItem.required) {
        this.widget.setAttribute('required', 'required');
        this.classList.add('required');
        this._dispatchEvent('required');
      } else {
        this.widget.removeAttribute('required');
        this.required = false;
        // this.removeAttribute('required');
        this.classList.toggle('required');
        this._dispatchEvent('optional')
      }
    }
  }

  handleReadonly() {
    // console.log('mip readonly', this.modelItem.isReadonly);
    if (this.isReadonly() !== this.modelItem.readonly) {
      if (this.modelItem.readonly) {
        this.widget.setAttribute('readonly', 'readonly');
        // this.setAttribute('readonly','readonly');
        this.classList.toggle('readonly');
        this._dispatchEvent('readonly');
      }
      if (!this.modelItem.readonly) {
        this.widget.removeAttribute('readonly');
        // this.removeAttribute('readonly');
        this.classList.toggle('readonly');
        this._dispatchEvent('readwrite');
      }
    }
  }

  // todo - review alert handling altogether. There could be potentially multiple ones in model
  handleValid() {
    // console.log('mip valid', this.modelItem.required);
    const alert = this.querySelector('fx-alert');

    if (this.isValid() !== this.modelItem.constraint) {
      if (this.modelItem.constraint) {
        this.classList.remove('invalid');
        alert.style.display = 'none';
        this._dispatchEvent('valid');
      } else {
        // ### constraint is invalid - handle alerts
        this.classList.add('invalid');
        if (alert) {
          alert.style.display = 'block';
        }
        if (this.modelItem.alerts.length !== 0) {
          const { alerts } = this.modelItem;
          console.log('alerts from bind: ', alerts);

          const controlAlert = this.querySelector('fx-alert');
          if (!controlAlert) {
            alerts.forEach(modelAlert => {
              const newAlert = document.createElement('fx-alert');
              newAlert.innerHTML = modelAlert;
              this.appendChild(newAlert);
              newAlert.style.display = 'block';
            });
          }
        }

        // this.dispatchEvent(new CustomEvent('invalid', {}));
        this._dispatchEvent('invalid');
      }
    }
  }

  handleRelevant() {
    // console.log('mip valid', this.modelItem.enabled);
    if (this.isEnabled() !== this.modelItem.relevant) {
      if (this.modelItem.relevant) {
        this._dispatchEvent('relevant');
        this._fadeIn(this, this.display);
      } else {
        this._dispatchEvent('nonrelevant');
        this._fadeOut(this);
      }
    }
  }

  isRequired() {
    if (this.widget.hasAttribute('required')) {
      return true;
    }
    return false;
  }

  isValid() {
    if (this.classList.contains('invalid')) {
      return false;
    }
    return true;
  }

  isReadonly() {
    // const widget = this.querySelector('#widget');
    if (this.widget.hasAttribute('readonly')) {
      return true;
    }
    return false;
  }

  isEnabled() {
    // if(this.style.display === 'none' || this.classList.contains('non-relevant')){
    if (this.style.display === 'none') {
      return false;
    }
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  _fadeOut(el) {
    el.style.opacity = 1;

    (function fade() {
      // eslint-disable-next-line no-cond-assign
      if ((el.style.opacity -= 0.1) < 0) {
        el.style.display = 'none';
      } else {
        requestAnimationFrame(fade);
      }
    })();
  }

  // eslint-disable-next-line class-methods-use-this
  _fadeIn(el, display) {
    el.style.opacity = 0;
    el.style.display = display || 'block';

    (function fade() {
      let val = parseFloat(el.style.opacity);
      // eslint-disable-next-line no-cond-assign
      if (!((val += 0.1) > 1)) {
        el.style.opacity = val;
        requestAnimationFrame(fade);
      }
    })();
  }
}

window.customElements.define('fx-abstract-control', AbstractControl);
