import { foreElementMixin } from '../ForeElementMixin.js';
import { withDraggability } from '../withDraggability';

class FxDroptarget extends withDraggability(foreElementMixin(HTMLElement)) {
}

if (!customElements.get('fx-droptarget')) {
    window.customElements.define('fx-droptarget', FxDroptarget);
}
