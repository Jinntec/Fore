import {foreElementMixin} from '../ForeElementMixin.js';
import {evaluateXPathToBoolean, resolveId} from '../xpath-evaluation.js';
import getInScopeContext from '../getInScopeContext.js';
import {Fore} from '../fore.js';
import {FxFore} from '../fx-fore.js';
import {XPathUtil} from '../xpath-util.js';

async function wait(howLong) {
    return new Promise(resolve => setTimeout(() => resolve(), howLong));
}

/**
 * Superclass for all action elements. Provides basic wiring of events to targets as well as
 * handle conditionals and loops of actions.
 *
 * @fires action-performed - is dispatched after each execution of an action.
 * @customElement
 * @demo demo/index.html
 */
export class AbstractAction extends foreElementMixin(HTMLElement) {
    static dataChanged = false;

    static get properties() {
        return {
            ...super.properties,
            /**
             * can be either 'cancel' or 'perform' (default)
             */
            defaultAction: {
                type: String
            },
            /**
             * delay before executing action in milliseconds
             */
            delay: {
                type: Number,
            },
            /**
             * detail - event detail object
             */
            detail: {
                type: Object,
            },
            /**
             * event to listen for
             */
            event: {
                type: Object,
            },
            handler: {
                type: Object,
            },
            /**
             * boolean XPath expression. If true the action will be executed.
             */
            ifExpr: {
                type: String,
            },
            /**
             * whether nor not an action needs to run the update cycle
             */
            needsUpdate: {
                type: Boolean,
            },
            /**
             * The observer if given is the element on which an event is triggered. It must be an ancestor of the target
             * element of an event.
             */
            observer: {
                type: Object,
            },
            /**
             * can be either 'capture' or 'default' (default)
             */
            phase: {
                type: String,
            },
            /**
             * can be either 'stop' or 'continue' (default)
             */
            propagate: {
                type: String,
            },
            /**
             * id of target element to attach listener to
             */
            target: {
                type: String,
            },
            /**
             * boolean XPath expression. If true loop will be executed. If an ifExpr is present this also needs to be true
             * to actually run the action.
             */
            whileExpr: {
                type: String,
            },
        };
    }

    constructor() {
        super();
        this.detail = {};
        this.needsUpdate = false;
    }

    connectedCallback() {
        this.style.display = 'none';
        this.propagate = this.hasAttribute('propagate') ? this.getAttribute('propagate') : 'continue';
        this.repeatContext = undefined;

        if (this.hasAttribute('event')) {
            this.event = this.getAttribute('event');
        }
        if (this.hasAttribute('defaultAction')) {
            this.defaultAction = this.getAttribute('defaultAction');
        } else {
            this.defaultAction = 'perform';
        }
        if (this.hasAttribute('phase')) {
            this.phase = this.getAttribute('phase');
        } else {
            this.phase = 'default';
        }

        /*
            this.addEventListener('click', e => {
              e.preventDefault();
              e.stopPropagation();
            });
        */

        this.ifExpr = this.hasAttribute('if') ? this.getAttribute('if') : null;
        this.whileExpr = this.hasAttribute('while') ? this.getAttribute('while') : null;
        this.delay = this.hasAttribute('delay') ? Number(this.getAttribute('delay')) : 0;

        this._addUpdateListener();

    }

    _addUpdateListener() {
        this.target = this.getAttribute('target');
        if (this.target) {
            if (this.target === '#window') {
                window.addEventListener(this.event, e => this.execute(e), {capture: this.phase === 'capture'});
            } else if (this.target === '#document') {
                document.addEventListener(this.event, e => this.execute(e), {capture: this.phase === 'capture'});
            } else {
                this.targetElement = resolveId(this.target, this);
                if (!this.targetElement) return; //does not or does not yet exist
                this?.targetElement.addEventListener(this.event, e => this.execute(e), {capture: this.phase === 'capture'});
            }
        } else {
            this.targetElement = this.parentNode;
            this.targetElement.addEventListener(this.event, e => this.execute(e), {capture: this.phase === 'capture'});
            // console.log('adding listener for ', this.event , ` to `, this);
        }
    }

    /**
     * executes the action.
     *
     * Will first evaluate ifExpr and continue only if it evaluates to 'true'. The 'whileExpr' will be executed
     * considering the delay if present.
     *
     * After calling `perform' which actually implements the semantics of an concrete action
     * `actionPerformed` will make sure that update cycle is run if 'needsUpdate' is true.
     *
     * @param e
     */
    async execute(e) {
        // console.log('execute', this, e);
        // console.log('execute', this.event);


        /* todo: investigate This bit is breaking...
            if (e && e.target.nodeType !== Node.DOCUMENT_NODE && e.target.closest('fx-fore') !== this.closest('fx-fore')) {
              // Event originates from a sub-component. Ignore it!
              // No need to stop propagation. All other listeners will also ignore it from here
              return;
            }
        */
        if (this.propagate === 'stop') {
            console.log('event propagation stopped', e)
            e.stopPropagation();
        }
        if (this.defaultAction === 'cancel') {
            e.preventDefault();
        }

    let resolveThisEvent = () => {};
        if (e && e.listenerPromises) {
            e.listenerPromises.push(
                new Promise(resolve => {
                    resolveThisEvent = resolve;
                }),
            );
        }

        // console.log('executing', this);
        // console.log('executing e', e);
        // console.log('executing e phase', e.eventPhase);
        if (FxFore.outermostHandler === null) {
            console.time('outermostHandler');
            console.info(
                `%coutermost Action `,
                'background:#e65100; color:white; padding:0.3rem; display:inline-block; white-space: nowrap; border-radius:0.3rem;',
                this,
            );
            // console.log('starting outermost handler',this);
            FxFore.outermostHandler = this;
            this.dispatchEvent(new CustomEvent('outermost-action-start', {
                composed: true,
                bubbles: true,
                cancelable: true, detail: {cause: e?.type}
            }));
        }

        if (FxFore.outermostHandler !== this) {
            console.info(
                `%cAction `,
                'background:orange; color:white; padding:0.3rem; display:inline-block; white-space: nowrap; border-radius:0.3rem;',
                this,
            );
        }
        // console.log('>>> outermostHandler', FxFore.outermostHandler);

        if (e) {
            this.currentEvent = e;
        }
        this.needsUpdate = false;

        try {
            this.evalInContext();
        } catch (error) {
            console.warn('evaluation failed', error);
        }
        if (this.targetElement && this.targetElement.nodeset) {
            this.nodeset = this.targetElement.nodeset;
        }

        // First check if 'if' condition is true - otherwise exist right away
        if (this.ifExpr && !evaluateXPathToBoolean(this.ifExpr, getInScopeContext(this), this)) {
            this._finalizePerform(resolveThisEvent);
            return;
        }

        // console.log('performing action', this);

        if (this.whileExpr) {
            // While: while the condition is true, delay a bit and execute the action
            const loop = async () => {
                // Start by waiting
                await wait(this.delay || 0);

                if (!XPathUtil.contains(this.getOwnerForm(), this)) {
                    // We are no longer in the document. Stop working
                    return;
                }

                if (!evaluateXPathToBoolean(this.whileExpr, getInScopeContext(this), this)) {
                    // Done with iterating
                    return;
                }

                // Perform the action once
                this.perform();

                // Go for one more iteration
                if (this.delay) {
                    // If we have a delay, fire and forget this.
                    // Otherwise, if we have no delay, keep waiting for all iterations to be done.
                    // The while is then uninterruptable and immediate
                    loop();
                    return;
                }
                await loop();
            };

            // After loop is done call actionPerformed to update the model and UI
            await loop();
            this._finalizePerform(resolveThisEvent);

            return;
        }

        if (this.delay) {
            // Delay further execution until the delay is done
            await wait(this.delay);
            if (!XPathUtil.contains(this.getOwnerForm(), this)) {
                // We are no longer in the document. Stop working
                this.actionPerformed();
                resolveThisEvent();
                return;
            }
        }

        await this.perform();
        this._finalizePerform(resolveThisEvent);
    }

    _finalizePerform(resolveThisEvent) {
        this.currentEvent = null;
        this.actionPerformed();
        if (FxFore.outermostHandler === this) {
            FxFore.outermostHandler = null;
            console.info(
                `%coutermost Action done`,
                'background:#e65100; color:white; padding:0.3rem; display:inline-block; white-space: nowrap; border-radius:0.3rem;',
                this,
            );
            console.timeEnd('outermostHandler');
            this.dispatchEvent(new CustomEvent('outermost-action-end', {
                composed: true,
                bubbles: true,
                cancelable: true
            }));


        }
        resolveThisEvent();
    }

    /**
     * Template method to be implemented by each action that is called by execute() as part of
     * the processing.
     *
     * This function should not called on any action directly - call execute() instead to ensure proper execution of 'if' and 'while'
     */
    async perform() {
        this.dispatchEvent(
            new CustomEvent('execute-action', {
                composed: true,
                bubbles: true,
                cancelable: true,
                detail: {action: this, event: this.event},
            }),
        );

        // await Fore.dispatch(document, 'execute-action', {action:this, event:this.event});

        //todo: review - this evaluation seems redundant as we already evaluated in execute
        if (this.isBound() || this.nodeName === 'FX-ACTION') {
            this.evalInContext();
        }
    }

    /**
     * calls the update cycle if action signalled that update is needed.
     */
    actionPerformed() {
        const model = this.getModel();
        if (!model) {
            return;
        }
        if (!model.inited) {
            return;
        }
        if (
            FxFore.outermostHandler &&
            !XPathUtil.contains(FxFore.outermostHandler.ownerDocument, FxFore.outermostHandler)
        ) {
            // The old outermostHandler fell out of the document. An error has happened.
            // Just remove the old one and act like we are starting anew.
            console.warn('Unsetting outermost handler');
            FxFore.outermostHandler = null;
        }
        // console.log('actionPerformed action parentNode ', this.parentNode);
        if (
            this.needsUpdate &&
            (FxFore.outermostHandler === this || !FxFore.outermostHandler)
        ) {
            console.log('running update cycle for outermostHandler', this);
            model.recalculate();
            model.revalidate();
            model.parentNode.refresh(true);
            this.dispatchActionPerformed();
        } else if (this.needsUpdate) {
            console.log('Update delayed!');
            // We need an update, but the outermost action handler is not done yet. Make this clear!
            // console.log('running actionperformed on', this, ' to be updated by ', FxFore.outermostHandler);
            FxFore.outermostHandler.needsUpdate = true;
        }
        console.log('running actionperformed on', this, ' outermostHandler', FxFore.outermostHandler);
    }

    /**
     * dispatches action-performed event
     *
     * @event action-performed - whenever an action has been run
     */
    dispatchActionPerformed() {
        // console.log('action-performed ', this);
        Fore.dispatch(this, 'action-performed', {});
    }
}

if (!customElements.get('abstract-action')) {
    window.customElements.define('abstract-action', AbstractAction);
}
