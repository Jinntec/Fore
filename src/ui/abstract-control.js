import '../fx-model.js';
import { foreElementMixin } from '../ForeElementMixin.js';
import { ModelItem } from '../modelitem.js';

/**
 * `AbstractControl` -
 * is a general base class for control elements.
 *
 *
 * todo: remove LitElement dependency
 */
export default class AbstractControl extends foreElementMixin(HTMLElement) {
  static get properties() {
    return {
      ...super.properties,
      value: {
        type: String,
      },
      widget: {
        type: Object,
      },
    };
  }

  constructor() {
    super();
    this.value = '';
    this.display = this.style.display;
    this.required = false;
    this.readonly = false;
    this.widget = null;
    // this.attachShadow({ mode: 'open' });
  }

  getWidget(){
    throw new Error('You have to implement the method updateWidgetValue!');
  }

  /**
   * (re)apply all state properties to this control.
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

        // if(!this.closest('fx-form').ready) return; // state change event do not fire during init phase (initial refresh)
        // if(!this._getForm().ready) return; // state change event do not fire during init phase (initial refresh)
        if (currentVal !== this.value) {
          this.dispatchEvent(new CustomEvent('value-changed', {}));
        }
        // this.requestUpdate();
        this.handleModelItemProperties();
      }
    }
    // await this.updateComplete;
  }

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

  // eslint-disable-next-line class-methods-use-this
  handleRequired() {
    // console.log('mip required', this.modelItem.required);
    // const control = this.querySelector('#control');
    this.widget = this.getWidget();
    if (this.isRequired() !== this.modelItem.required) {
      if (this.modelItem.required) {
        this.widget.setAttribute('required', 'required');
        // this.shadowRoot.getElementById('widget').setAttribute('required','required');
        // this.widget.setAttribute('required','required');
        // this.required = true;
        // this.setAttribute('required','required');

        this.classList.toggle('required');
        this.dispatchEvent(new CustomEvent('required', {}));
      } else {
        this.widget.removeAttribute('required');
        this.required = false;
        // this.removeAttribute('required');
        this.classList.toggle('required');

        this.dispatchEvent(new CustomEvent('optional', {}));
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
        this.dispatchEvent(new CustomEvent('readonly', {}));
      }
      if (!this.modelItem.readonly) {
        this.widget.removeAttribute('readonly');
        // this.removeAttribute('readonly');
        this.classList.toggle('readonly');

        this.dispatchEvent(new CustomEvent('readwrite', {}));
      }
    }
  }

  // todo - there's a bug still in here somewhere - see binding.html and click set invalid button - will never trigger
  handleValid() {
    // console.log('mip valid', this.modelItem.required);

    const alert = this.querySelector('fx-alert');
    if (alert) {
      alert.style.display = 'none';
    }

    // if (this.isValid() !== this.modelItem.valid) {
    if (this.isValid() !== this.modelItem.constraint) {
      if (this.modelItem.constraint) {
        this.classList.remove('invalid');
        this.dispatchEvent(new CustomEvent('valid', {}));
      } else {
        this.classList.add('invalid');
        if (this.modelItem.alerts.length !== 0) {
          // const alert = this.querySelector('fx-alert');
          if (alert) {
            alert.style.display = 'block';
          } else {
            const { alerts } = this.modelItem;
            console.log('alerts from bind: ', alerts);
            alerts.forEach(modelAlert => {
              const newAlert = document.createElement('fx-alert');
              newAlert.innerHTML = modelAlert;
              this.appendChild(newAlert);
              newAlert.style.display = 'block';
            });
          }
        }

        this.dispatchEvent(new CustomEvent('invalid', {}));
      }
    }
  }

  handleRelevant() {
    // console.log('mip valid', this.modelItem.enabled);
    if (this.isEnabled() !== this.modelItem.relevant) {
      if (this.modelItem.relevant) {
        this.dispatchEvent(new CustomEvent('relevant', {}));
        this._fadeIn(this, this.display);
      } else {
        this.dispatchEvent(new CustomEvent('nonrelevant', {}));
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
    // const widget = this.getControl();
    const {widget} = this;
    // if (widget.valid) {
    if (widget.classList.contains('invalid')) {
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
      if (!((val += 0.1) > 1)) {
        el.style.opacity = val;
        requestAnimationFrame(fade);
      }
    })();
  }
}

window.customElements.define('fx-abstract-control', AbstractControl);
