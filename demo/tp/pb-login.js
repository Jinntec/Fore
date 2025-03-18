/**
 * a pb-login implemented with Fore.
 *
 * Note: this is mainly for demonstration purposes but should already work largely.
 *
 * It allows to patch its default rendering by passing markup along with a CSS matcher
 * which will replace the default rendering or parts thereof with the content of this element.
 *
 * It handles authorisation by calling a 'login' endpoint and pass urlencoded 'user' and 'password' fields.
 *
 * It uses a native HTML dialog element for the login by default.
 *
 * It's prepared for i18n by loading a certain lang file and resolving labels.
 *
 * @customElement
 *
 * todo: make this a base class and import pbMixin
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
                        </data>
                    </fx-instance>
                    <fx-bind ref="user" required="true()"></fx-bind>
                    <fx-instance id="vars">
                        <data>
                            <lang>en</lang>
                            <loggedin>false</loggedin>
                        </data>
                    </fx-instance>
                    <!-- this instance should be a shared one provided by some outer Fore and be re-used throughout its scope -->
                    <fx-instance id="lang" src="en.json" type="json"></fx-instance>
                    <fx-instance id="login" type="json">{}</fx-instance>

                    <!-- replace '#echo' with 'login' for real request -->
                    <fx-submission id="s-login"
                                   ref="instance('default')"
                                   method="post"
                                   url="login"
                                   replace="instance"
                                   instance="login"
                                   serialization="application/x-www-form-urlencoded">
            
                        <fx-action event="submit-error">
                            <fx-message>login failed</fx-message>
                            <fx-show dialog="login-dlg"></fx-show>
                        </fx-action>
            
                        <fx-action event="submit-done">
                            <fx-message>logged in</fx-message>
                            <fx-hide dialog="login-dlg"></fx-hide>
                        </fx-action>
                    </fx-submission>
                    
                </fx-model>
                <fx-var name="vars" value="instance('vars')"></fx-var>
                <fx-var name="_" value="instance('default')"></fx-var>
                <fx-var name="lang" value="instance('lang')"></fx-var>
            
                <fx-group id="UI">
                    <fx-group ref=".">
                        <fx-var name="login" value="$lang?login?login"></fx-var>
                        <fx-trigger ref="$vars/loggedin[.='false']" class="label" title="{if(!empty($_user) then $_user else '')}">
                            <a href="#">{$lang?login?login}</a>
                            <fx-show dialog="login-dlg"></fx-show>
                        </fx-trigger>
                        <fx-trigger ref="$vars/loggedin[.='true']" class="label" title="{if(!empty($_user) then $_user else '')}"><a href="#">logout</a></fx-trigger>
                    </fx-group>
            
                    <dialog id="login-dlg">
                        <fx-action event="dialog-shown">
                            <fx-message>shown</fx-message>
                            <fx-refresh force="true" ></fx-refresh>
                        </fx-action>
                        
                        <div class="dialog-content">
                            <fx-control ref="user">
                                <label>{$lang?login?user}</label>
                            </fx-control>
                            <fx-control ref="pass">
                                <label>{$lang?login?password}</label>
                                <input type="password">
                            </fx-control>
                            <fx-trigger>
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
