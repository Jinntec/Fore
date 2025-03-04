import { Binding } from './Binding.js';

export class RepeatBinding extends Binding {
    constructor(xpath, repeat) {
        super(xpath, 'repeat');

        /**
         * @type {import('../ui/fx-repeat.js').FxRepeat}
         */
        this.repeat = repeat;
    }

    update() {
        super.update();
        this.refresh();
    }

    refresh() {
        // console.log('control refreshing')
        if (this.repeat.isDestroyed) {
            console.log(
                `Cancelling update for  for ${this.xpath} that is already destroyed`,
            );
            return;
        }
        this.repeat.refresh();
    }
}
