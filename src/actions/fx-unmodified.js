import { AbstractAction } from './abstract-action.js';

/**
 * `fx-unmodified` Action to reset the 'modified' state of Fore. A Fore page is considered
 * modified when a 'value-changed' event has occurred. If the respective Fore element uses
 * `show-confirmation="true"` it will display a page exit confirmation in case the data
 * are modified. The `fx-unmodified` action allows to return to 'clean' state again avoiding
 * the dialog box after data have been saved and are considered unmodified again.
 *
 * Typically this action could be called on a `submit-done` event of a submission.
 *
 *
 * @customElement
 */
export default class FxUnmodified extends AbstractAction {
    constructor() {
        super();
    }

    async perform() {
        this.getOwnerForm().markAsClean();
    }
}

if (!customElements.get('fx-unmodified')) {
    window.customElements.define('fx-unmodified', FxUnmodified);
}
