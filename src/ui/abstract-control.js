import '../fx-model.js';
import { ModelItem } from '../modelitem.js';
import { Fore } from '../fore.js';
import getInScopeContext from '../getInScopeContext.js';
import { evaluateXPathToFirstNode } from '../xpath-evaluation.js';
import { UIElement } from './UIElement.js';

function isDifferent(oldNodeValue, oldControlValue, newControlValue) {
  if (oldNodeValue === null) {
    return false;
  }
  /*
  if the oldControlValue is null we know the widget is used for the first time and is not considered
  a value change.
  */
  if (oldControlValue === null) return false;

  if (newControlValue && oldControlValue && newControlValue.nodeType && oldControlValue.nodeType) {
    return newControlValue.outerHTML !== oldControlValue.outerHTML;
  }

  if (oldControlValue === newControlValue) {
    return false;
  }

  return true;
}

/**
 * `AbstractControl` -
 * is a general base class for control elements.
 *
 */
const NATIVE_FORM_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']);

export default class AbstractControl extends UIElement {
  constructor() {
    super();
    this.value = null;
    this.display = this.style.display;
    this.required = false;
    this.readonly = false;
    this.widget = null;
    this.visited = false;
    this.force = false;
    this.ondemand = false;
    // this.attachShadow({ mode: 'open' });
  }

  // eslint-disable-next-line class-methods-use-this
  getWidget() {
    throw new Error('You have to implement the method getWidget!');
  }

  /**
   * Native form elements (input/select/textarea/button) already expose required/readonly/disabled
   * to assistive tech via their native attributes - mirroring those into aria-* would be redundant
   * ARIA. Non-native widgets (custom elements used as `.widget`) have no such native mapping, so
   * they need the explicit aria-* attributes.
   */
  // eslint-disable-next-line class-methods-use-this
  _isNativeFormWidget(widget) {
    return !!widget && NATIVE_FORM_TAGS.has(widget.tagName);
  }

  /**
   * Appends `id` to the widget's aria-describedby without clobbering any existing references
   * (e.g. a hint that already contributed its id).
   */
  _addDescribedBy(id) {
    if (!id) return;
    const widget = this.getWidget?.() || this.widget;
    if (!widget) return;
    const existing = (widget.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (!existing.includes(id)) {
      widget.setAttribute('aria-describedby', [...existing, id].join(' '));
    }
  }

  /**
   * (re)apply all modelItem state properties to this control. model -> UI
   */
  async refresh(force) {
    if (force) this.force = true;

    // Save the old value of this control. this may be the stringified version, contrast to the node in `nodeset`
    const oldValue = this.value;

    // if (this.ondemand && !this.value) return;
    // console.log('### AbstractControl.refresh on : ', this);

    // if(this.repeated) return
    if (this.isNotBound()) return;

    // await this.updateComplete;
    // await this.getWidget();

    this.evalInContext();
    this.oldVal = this.nodeset ? this.nodeset : null;
    // console.log('oldVal',this.oldVal);

    // todo this if should be removed - see above
    if (this.isBound()) {
      // this.control = this.querySelector('#control');

      if (!this.nodeset) {
        const create = this.closest('[create]');
        if (create) {
          // ### check if parent element exists
          let attrName;
          let parentPath;
          let parentNode;

          if (this.ref.includes('/')) {
            parentPath = this.ref.substring(0, this.ref.indexOf('/'));
            const inscope = getInScopeContext(this.parentNode, this.ref);
            parentNode = evaluateXPathToFirstNode(parentPath, inscope, this);

            if (parentNode && parentNode.nodeType === Node.ELEMENT_NODE) {
              if (this.ref.includes('@')) {
                attrName = this.ref.substring(this.ref.indexOf('/') + 2);
                parentNode.setAttribute(attrName, '');
              } else {
                Fore.dispatch(this, 'warn', {
                  message: '"create" is not implemented for elements',
                });
              }
            }
          } else {
            const inscope = getInScopeContext(this, this.ref);

            if (this.ref.includes('@')) {
              attrName = this.ref.substring(this.ref.indexOf('@') + 1);
              inscope.setAttribute(attrName, '');
            } else {
              Fore.dispatch(this, 'warn', { message: '"create" is not implemented for elements' });
              // inscope = getInScopeContext(this.parentNode, this.ref);
            }
          }
        } else {
          // ### this actually makes the control nonrelevant
          // todo: we should call a template function here to allow detachment of event-listeners and resetting eventual state
          // this.style.display = 'none';
          // A previous refresh() may have left 'relevant' set (this branch returns before
          // reaching handleRelevant(), the only other place that clears it) - without this,
          // a control whose ref just stopped matching keeps both attributes at once, and
          // which one wins the CSS cascade becomes stylesheet-order-dependent.
          this.removeAttribute('relevant');
          this.setAttribute('nonrelevant', '');
          this._reflectRelevantInert(false);
        }
        return;
      }

      this.modelItem = this.getModelItem();
      // console.log('refresh modelItem', this.modelItem);

      if (this.modelItem instanceof ModelItem) {
        // console.log('### XfAbstractControl.refresh modelItem : ', this.modelItem);

        this.attachObserver();
        if (this.hasAttribute('as') && this.getAttribute('as') === 'node') {
          // console.log('as', this.nodeset);
          // this.modelItem.value = this.nodeset;
          this.modelItem.node = this.nodeset;
          this.value = this.modelItem.node;
        } else {
          this.value = this.modelItem.value;
        }
        // console.log('newVal',this.value);

        // console.log('value of widget',this.value);

        /*
         * todo: find out on which foreign modelitems we might be dependant on when no binds are used.
         *
         * e.g. filter expr on 'ref' 'instance('countries')//country[@continent = instance('default')/continent]'
         *
         * the country node is dependant on instance('default')/continent here (foreign node).
         *
         * possible approach:
         * - pipe ref expression through DependencyNotifyingDomFacade to get referred nodes.
         * - lookup modelItems of referred nodes
         * - add ourselves to boundControls of foreign modelItem -> this control will then get refreshed when the foreign modelItem is changed.
         */

        // const touched = FxBind.getReferencesForRef(this.ref,Array.from(this.nodeset));
        // console.log('touched',touched);

        /*
        this is another case that highlights the fact that an init() function might make sense in general.
         */
        /*
        if (!this.modelItem.boundControls.includes(this)) {
          this.modelItem.boundControls.push(this);
        }
*/

        // console.log('>>>>>>>> abstract refresh ', this.control);
        // this.control[this.valueProp] = this.value;
        await this.updateWidgetValue();
        this.handleModelItemProperties();

        // if(!this.closest('fx-fore').ready) return; // state change event do not fire during init phase (initial refresh)
        if (this.getOwnerForm().initialRun) {
          Fore.dispatch(this, 'init', {});
        }
        if (!this.getOwnerForm().ready) return; // state change event do not fire during init phase (initial refresh)
        // if oldVal is null we haven't received a concrete value yet

        if (!(this.localName === 'fx-control' || this.localName === 'fx-upload')) return;
        if (isDifferent(this.oldVal, oldValue, this.value)) {
          const model = this.getModel();
          Fore.dispatch(this, 'value-changed', {
            path: this.modelItem.path,
            value: this.modelItem.value,
            oldvalue: oldValue,
            instanceId: this.modelItem.instanceId,
            foreId: this.getOwnerForm().id,
          });
        }
      }
    }
  }

  refreshFromModelItem(modelItem) {}

  /**
   *
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line class-methods-use-this
  async updateWidgetValue() {
    throw new Error('You have to implement the method updateWidgetValue!');
  }

  handleModelItemProperties() {
    // console.log('handleModelItemProperties',this.modelItem);
    this.handleRequired();
    this.handleReadonly();
    if (this.getOwnerForm().ready) {
      this.handleValid();
    }
    this.handleRelevant();
    // Relevance.handleRelevance(this);
    // todo: handleType()
  }

  _getForm() {
    return this.getModel().parentNode;
  }

  _dispatchEvent(event) {
    if (this.getOwnerForm().ready) {
      Fore.dispatch(this, event, {});
    }
  }

  // eslint-disable-next-line class-methods-use-this
  handleRequired() {
    // console.log('mip required', this.modelItem.required);
    this.widget = this.getWidget();
    const wasRequired = this.isRequired();

    if (!this.modelItem.required) {
      this.widget.removeAttribute('required');
      this.removeAttribute('required');
      if (!this._isNativeFormWidget(this.widget)) {
        this.widget.removeAttribute('aria-required');
      }
      if (wasRequired !== this.modelItem.required) {
        this._dispatchEvent('optional');
      }
      return;
    }

    // ### modelItem is required
    if (this.visited || this.force) {
      if (this.modelItem.value === '') {
        this.classList.add('isEmpty');
        this._toggleValid(false);
      } else {
        this.classList.remove('isEmpty');
        this._toggleValid(true);
      }
    }
    this.widget.setAttribute('required', '');
    this.setAttribute('required', '');
    if (!this._isNativeFormWidget(this.widget)) {
      this.widget.setAttribute('aria-required', 'true');
    }
    if (wasRequired !== this.modelItem.required) {
      this._dispatchEvent('required');
    }

    /*
    if (this.isRequired() !== this.modelItem.required) {
      this._updateRequired();
    }
*/
  }

  _updateRequired() {
    if (this.modelItem.required) {
      // if (this.getOwnerForm().ready){
      if (this.visited || this.force) {
        // if (this.visited ) {
        //   if (this.widget.value === '') {
        if (this.modelItem.value === '') {
          this.classList.add('isEmpty');
          this._toggleValid(false);
        } else {
          this.classList.remove('isEmpty');
          this._toggleValid(true);
        }
      }
      this.widget.setAttribute('required', '');
      this.setAttribute('required', '');
      this._dispatchEvent('required');
    } else {
      this.widget.removeAttribute('required');
      this.removeAttribute('required');
      this._dispatchEvent('optional');
    }
  }

  _toggleValid(valid) {
    // Used by required handling (and potentially other callers).
    // It must also fire validity events and sync aria-invalid.
    const wasInvalid = this.hasAttribute('invalid');

    if (valid) {
      this.removeAttribute('invalid');
      this.setAttribute('valid', '');
    } else {
      this.removeAttribute('valid');
      this.setAttribute('invalid', '');
    }
    this._syncAriaInvalid();

    const isInvalid = this.hasAttribute('invalid');
    // Only dispatch when the state actually changed
    if (wasInvalid !== isInvalid) {
      this._dispatchEvent(isInvalid ? 'invalid' : 'valid');
    }
  }

  _syncAriaInvalid() {
    // Keep widget aria-invalid in sync with the *control* state, regardless of
    // whether invalidity comes from constraint, required emptiness, etc.
    try {
      const w = this.getWidget?.() || this.widget;
      if (!w) return;
      w.setAttribute('aria-invalid', this.hasAttribute('invalid') ? 'true' : 'false');
    } catch (e) {
      // ignore: widget might not exist yet
    }
  }

  handleReadonly() {
    // console.log('mip readonly', this.modelItem.isReadonly);
    const effectiveReadonly = this.modelItem.readonly || this.isHostReadonly();
    if (this.isReadonly() !== effectiveReadonly) {
      if (effectiveReadonly) {
        this.widget.setAttribute('readonly', '');
        this.setAttribute('readonly', '');
        if (!this._isNativeFormWidget(this.widget)) {
          this.widget.setAttribute('aria-readonly', 'true');
        }
        this._dispatchEvent('readonly');
      } else {
        this.widget.removeAttribute('readonly');
        this.removeAttribute('readonly');
        if (!this._isNativeFormWidget(this.widget)) {
          this.widget.removeAttribute('aria-readonly');
        }
        this._dispatchEvent('readwrite');
      }
    }
  }

  /**
   * A control embedded via `src` (a whole nested `fx-fore` used as widget) has its
   * own independent model, so it cannot see the readonly state of the outer
   * ModelItem it represents. When the outer control becomes readonly, it marks its
   * widget (the nested `fx-fore`) with a `readonly` attribute; nested controls pick
   * that up here by checking their nearest enclosing `fx-fore`.
   */
  isHostReadonly() {
    return !!this.closest('fx-fore')?.hasAttribute('readonly');
  }

  // todo - review alert handling altogether. There could be potentially multiple ones in model
  handleValid() {
    // console.log('mip valid', this.modelItem.required);

    // console.log('late modelItem', mi);
    const hasValue = this.modelItem.value !== '';
    const isRequired = this.modelItem.required;
    const isValidAccordingToRequired = isRequired ? hasValue : true;
    const nativeValid = this.modelItem.nativeValid !== false;
    const isValidNow = this.modelItem.constraint && isValidAccordingToRequired && nativeValid;

    if (this.isValid() !== isValidNow) {
      if (isValidNow) {
        // if (alert) alert.style.display = 'none';
        this._dispatchEvent('valid');
        this.setAttribute('valid', '');
        this.removeAttribute('invalid');
        // also reset other dependent CSS classes
        this.classList.remove('isEmpty');
      } else {
        this.setAttribute('invalid', '');
        this.removeAttribute('valid');
        // ### constraint is invalid - handle alerts
        /*
        if (alert) {
          alert.style.display = 'block';
        }
*/
        if (this.modelItem.alerts.length !== 0) {
          const controlAlert = this.querySelector('fx-alert');
          if (!controlAlert) {
            const { alerts } = this.modelItem;
            // console.log('alerts from bind: ', alerts);
            alerts.forEach(modelAlert => {
              const newAlert = document.createElement('fx-alert');
              // const newAlert = document.createElement('span');
              newAlert.id = newAlert.id || `fx-alert-${Fore.createUUID()}`;
              newAlert.innerHTML = modelAlert;
              this.appendChild(newAlert);
              this._addDescribedBy(newAlert.id);
              // newAlert.style.display = 'block';
            });
          } else {
            controlAlert.id = controlAlert.id || `fx-alert-${Fore.createUUID()}`;
            this._addDescribedBy(controlAlert.id);
          }
        }

        // this.dispatchEvent(new CustomEvent('invalid', {}));
        this._dispatchEvent('invalid');
      }
    }

    // Ensure aria-invalid matches the current control state even if
    // we didn't enter the state-change branch above.
    this._syncAriaInvalid();
  }

  handleRelevant() {
    // IMPORTANT: don't clear relevant/nonrelevant BEFORE comparing states.
    // Otherwise isEnabled() (based on attributes) always reads as "enabled"
    // and we can never detect a transition back to relevant.
    const item = this.modelItem.node;

    const wasEnabled = this.isEnabled();

    // Determine new enabled state
    let newEnabled = !!this.modelItem.relevant;

    // If a nodeset resolves to an empty array, treat the control as nonrelevant
    if (Array.isArray(item) && item.length === 0) {
      newEnabled = false;
    }

    // Apply attributes
    if (newEnabled) {
      this.setAttribute('relevant', '');
      this.removeAttribute('nonrelevant');
    } else {
      this.setAttribute('nonrelevant', '');
      this.removeAttribute('relevant');
    }
    this._reflectRelevantInert(newEnabled);

    // Dispatch only on actual change
    if (wasEnabled !== newEnabled) {
      this._dispatchEvent(newEnabled ? 'relevant' : 'nonrelevant');
    }
  }

  isRequired() {
    return this.hasAttribute('required');
  }

  isValid() {
    return !this.hasAttribute('invalid');
  }

  isReadonly() {
    // const widget = this.querySelector('#widget');
    return this.hasAttribute('readonly');
  }

  isEnabled() {
    return !this.hasAttribute('nonrelevant');
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
if (!customElements.get('fx-abstract-control')) {
  window.customElements.define('fx-abstract-control', AbstractControl);
}
