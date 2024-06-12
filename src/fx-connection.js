import ForeElementMixin from "./ForeElementMixin.js";
import {Fore} from "./fore.js";
import {FxModel} from "./fx-model.js";

class FxConnection extends ForeElementMixin {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._url = '';
        this._socket = null;
        this._heartbeatInterval = FxConnection._defaultHeartbeatInterval;
        this._heartbeatTimer = null;
        this._messageFormat = FxConnection._defaultMessageFormat;
        this._onMessage = this._onMessage.bind(this);
    }
    _render() {
        const style = `
            :host {
                display: none;
            }
        `;

        const html = `
            <slot></slot>
${
this._messageFormat === 'xml' ?
`<fx-replace id="replace" ref="."></fx-replace>` :
`<fx-setvalue id="setvalue" ref="."></fx-setvalue>`
}
        `
        this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${html}
        `;
    }


    static get observedAttributes() {
        return ['url', 'heartbeat', 'message-format'];
    }

    connectedCallback() {
        if (this.hasAttribute('url')) {
            this._url = this.getAttribute('url');
        }
        if (this.hasAttribute('heartbeat')) {
            this._heartbeatInterval = parseInt(this.getAttribute('heartbeat'));
            this._setupHeartbeat();
        }
        if (this.hasAttribute('message-format')) {
            this._messageFormat = this.getAttribute('message-format');
        }

	        this._render();

        this.getOwnerForm().addEventListener('model-construct-done', e => {
            console.log('Fore model ready');
            this._connect();

	    this.evalInContext();
        });
    }

    disconnectedCallback() {
        this._disconnect();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'url':
                this._url = newValue;
                this._connect();
                break;
            case 'heartbeat':
                this._heartbeatInterval = parseInt(newValue);
                this._setupHeartbeat();
                break;
            case 'messageformat':
                this._messageFormat = newValue;
                break;
            default:
                // Do nothing for other attributes
                break;
        }
    }


    send(data) {
        this.evalInContext();
        data = this.nodeset;
        if (this._socket && this._socket.readyState === WebSocket.OPEN) {
            let message;
            switch (this._messageFormat) {
                case 'json':
                    message = JSON.stringify(data);
                    break;
                case 'xml':
                    message = new XMLSerializer().serializeToString(data);
                    break;
                case 'text':
                    message = data.textContent;
                    break;
                default:
                    throw new Error(`Unsupported message format: ${this._messageFormat}`);
            }
            this._sendMessage(message);
        } else {
            throw new Error('WebSocket is not connected');
        }
    }

    _connect() {
        this._disconnect();
        if (this._url) {
            this._socket = new WebSocket(this._url);
            this._socket.addEventListener('open', this._onOpen.bind(this));
            this._socket.addEventListener('message', this._onMessage);
            this._socket.addEventListener('close', this._onClose.bind(this));
        }
    }

    _disconnect() {
        if (this._socket) {
            this._socket.removeEventListener('open', this._onOpen.bind(this));
            this._socket.removeEventListener('message', (event) => this._onMessage(event));
            this._socket.removeEventListener('close', this._onClose.bind(this));
            this._socket.close();
            this._socket = null;
        }
        if (this._heartbeatTimer) {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }
    }

    _onOpen(event) {
        this.dispatchEvent(new CustomEvent('open', { detail: event }));
    }

    _onMessage(event) {
        let message;
        switch (this._messageFormat) {
            case 'json':
                message = JSON.parse(event.data);
                break;
            case 'xml':
                const parser = new DOMParser();
            message = parser.parseFromString(event.data, 'application/xml');
	    this.getModelItem().value = message;
	    FxModel.dataChanged = true;
	    this.getModel().changed.push(this.modelItem);
	    this.getModel().updateModel();
	    this.getOwnerForm().refresh(true);
                break;
            case 'text':
                message = event.data;
                break;
            default:
                throw new Error(`Unsupported message format: ${this._messageFormat}`);
        }
        console.log('dispatching channel-message', message);

        Fore.dispatch(this,'channel-message', {"message": message});
    }

    _onClose(event) {
        this.dispatchEvent(new CustomEvent('close', { detail: event }));
    }

    _setupHeartbeat() {
        if (this._heartbeatInterval > 0) {
            if (this._heartbeatTimer) {
                clearInterval(this._heartbeatTimer);
            }
            this._heartbeatTimer = setInterval(() => {
                this._sendMessage('');
            }, this._heartbeatInterval);
        } else {
            if (this._heartbeatTimer) {
                clearInterval(this._heartbeatTimer);
                this._heartbeatTimer = null;
            }
        }
    }

    _sendMessage(message) {
        if (this._socket && this._socket.readyState === WebSocket.OPEN) {
            this._socket.send(message);
        }
    }
    static get _defaultHeartbeatInterval() {
        return 0;
    }

    static get _defaultMessageFormat() {
        return 'json';
    }

    get url() {
        return this._url;
    }

    set url(value) {
        this.setAttribute('url', value);
    }

    get heartbeat() {
        return this._heartbeatInterval;
    }

    set heartbeat(value) {
        this.setAttribute('heartbeat', value);
    }

    get messageformat() {
        return this._messageFormat;
    }

    set messageformat(value) {
        this.setAttribute('messageformat', value);
    }


}

if (!customElements.get('fx-connection')) {
    customElements.define('fx-connection', FxConnection);
}
