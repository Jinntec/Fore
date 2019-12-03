/// BareSpecifier=@vaadin/vaadin-element-mixin/vaadin-element-mixin
import { idlePeriod } from '../../@polymer/polymer/lib/utils/async.js';
import { Debouncer } from '../../@polymer/polymer/lib/utils/debounce.js';
import { enqueueDebouncer } from '../../@polymer/polymer/lib/utils/flush.js';

import { usageStatistics } from '../vaadin-usage-statistics/vaadin-usage-statistics.js';
if (!window.Vaadin) {
  window['Vaadin'] = {};
}

/**
 * Array of Vaadin custom element classes that have been finalized.
 */
window['Vaadin'].registrations = window.Vaadin.registrations || [];

// Use the hack to prevent polymer-modulizer from converting to exports
window['Vaadin'].developmentModeCallback = window.Vaadin.developmentModeCallback || {};
window['Vaadin'].developmentModeCallback['vaadin-usage-statistics'] = function () {
  if (usageStatistics) {
    usageStatistics();
  }
};

let statsJob;

const registered = new Set();

/**
 * @polymerMixin
 */
export const ElementMixin = superClass => class VaadinElementMixin extends superClass {
  /** @protected */
  static finalize() {
    super.finalize();

    const { is } = this;

    // Registers a class prototype for telemetry purposes.
    if (is && !registered.has(is)) {
      window.Vaadin.registrations.push(this);
      registered.add(is);

      if (window.Vaadin.developmentModeCallback) {
        statsJob = Debouncer.debounce(statsJob, idlePeriod, () => {
          window.Vaadin.developmentModeCallback['vaadin-usage-statistics']();
        });
        enqueueDebouncer(statsJob);
      }
    }
  }
  constructor() {
    super();
    if (document.doctype === null) {
      console.warn('Vaadin components require the "standards mode" declaration. Please add <!DOCTYPE html> to the HTML document.');
    }
  }
};