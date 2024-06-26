import ForeElementMixin from '../ForeElementMixin.js';
import { withDraggability } from '../withDraggability.js';

class FxDroptarget extends withDraggability(ForeElementMixin) {}

if (!customElements.get('fx-droptarget')) {
  window.customElements.define('fx-droptarget', FxDroptarget);
}
