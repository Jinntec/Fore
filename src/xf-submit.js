import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';


/**
 * `xf-submit`
 *
 * send all local modelData updates and trigger submission on server.
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class XfSubmit extends PolymerElement {

    static get properties() {
        return {
            resource: {
                type: String
            },
            /**
             * one of 'GET', 'POST', 'PUT', 'DELETE - defaults to 'GET'
             */
            method:{
                type: String,
                value: "GET"
            },
            /**
             * optional attribute to determine the target instance for a replace='instance' submission. Must be a valid
             * idref to an existing instance.
             */
            instance: {
                type: String,
                value: "DEFAULT"
            },
            /**
             * optional attribute pointing to instance node(s) to be replaced for a replace='instance' or 'text'
             * submission.
             */
            targetref:{
                type: String
            },
            /**
             * one of 'all', 'instance', 'text' or 'none' - defaults to 'all'
             *
             * 'all' - use the contents of the response to replace the complete current page effectively ending the
             * form session.
             *
             * 'instance' - replace instance with response. If no 'instance' attribute is present the default instance will be replaced.
             * Returned data must be of content-type 'XML'.
             *
             * 'text' - replace instance node with returned text. A 'targetref' must be given as XPath to refer to the target
             * nodes.
             *
             * 'none' - ignore response of a submission.
             *
             */
            replace:{
                type: String,
                value: "all"
            },
            /**
             * Wether or not to validate before submission is done. Default to 'true' but there are cases when you'd
             * like to store unfinished form data.
             */
            validate:{
                type:Boolean,
                value: true
            },
            /**
             * Wether or not relevance processing is applied before data are submitted. Defaults to 'true' meaning that
             * all nodes that evaluated to 'relevant=false' are filtered out before sending them along.
             */
            relevant:{
                type: Boolean,
                value: true
            }
        };
    }

    execute(){
        console.log('xf-submit executing...');
    }

}

window.customElements.define('xf-submit', XfSubmit);
