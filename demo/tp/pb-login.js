/**
 * a simple component that wraps a Fore page and puts it into shadowDom.
 *
 * HTML link elements passed as children will be used to construct a CSSStyleSheet that is passed
 * to the shadowDOM.
 * @customElement
 */
export class PbLogin extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.content = this.firstElementChild;
        console.log('content', this.content);
        const html = `
            <fx-fore>
                <fx-model>
                    <fx-instance>
                        <data>
                            <user></user>
                            <pass></pass>
                            <loggedin>false</loggedin>
                        </data>
                    </fx-instance>
                    <fx-instance id="lang" src="en.json" type="json"></fx-instance>
                    <fx-var name="lang" value="instance('lang')"></fx-var>
                    <fx-submission id="s-login" url="#echo" method="post" replace="none">
                        <fx-action event="submit-done">
                            <fx-setvalue ref="loggedin">true</fx-setvalue>
                            <fx-hide dialog="login-dlg"></fx-hide>
                        </fx-action>
                    </fx-submission>
                </fx-model>
            
                <fx-group id="UI">
                    <fx-group ref=".">
                        <fx-var name="login" value="instance('lang')?login?login"></fx-var>
                        <fx-trigger ref="loggedin[.='false']" class="label" title="{if(!empty(user) then user else '')}">
                            <a href="#">{instance('lang')?login?login}</a>
                            <fx-show dialog="login-dlg"></fx-show>
                        </fx-trigger>
                        <fx-trigger ref="loggedin[.='true']" class="label" title="{if(!empty(user) then user else '')}"><a href="#">logout</a></fx-trigger>
                    </fx-group>
            
                    <dialog id="login-dlg">
                        <fx-action event="dialog-shown">
                        <fx-message>shown</fx-message>
                            <fx-refresh force="true" ></fx-refresh>
                        </fx-action>
                        
                        <div class="dialog-content">
                            <fx-control ref="user">
                                <label>{instance('lang')?login?user}</label>
                            </fx-control>
                            <fx-control ref="pass">
                                <label>{instance('lang')?login?password}</label>
                                <input type="password">
                            </fx-control>
                            <fx-trigger submission="s-login">
                                <button>Login</button>
                                <fx-send submission="s-login"></fx-send>
                            </fx-trigger>
                        </div>
                    </dialog>
                </fx-group>
            
            </fx-fore>
        `;

        this.replace = this.hasAttribute('replace')? this.getAttribute('replace'):null;

        this.innerHTML = `
            ${html}
        `;

        this.fore = this.querySelector('fx-fore');
        this.fore.addEventListener('ready', e => {
            this.model = this.fore.getModel();
            console.log('we are ready')
            if(this.replace){
                const target = this.querySelector(this.replace);
                console.log('target',target);
                console.log('content',this.content);

                if(target){
                    target.parentNode.replaceChild(this.content.cloneNode(true),target)
                }
                this.fore.getModel().updateModel();
                this.fore._updateTemplateExpressions();
                this.fore.refresh(true);

            }
        });

        /*
            <a href="#" @click="${this._show}" role="button" title="${this.user ? this.user : instance('lang')?login?login}">
                ${
            this.loggedIn ?
                html`<iron-icon icon="${this.logoutIcon}"></iron-icon> <span class="label">${translate(this.logoutLabel, { user: this.user })}</span>` :
                html`<iron-icon icon="${this.loginIcon}"></iron-icon> <span class="label">${translate(this.loginLabel)}</span>`
            }
            </a>
*/

    }
}

if (!customElements.get('PbLogin')) {
    customElements.define('pb-login', PbLogin);
}
