import {LitElement, html, css} from 'lit-element';
import {BoundElement} from "../BoundElement";
import {Fore} from "../fore";
import XfAbstractControl from "./xf-abstract-control";



/**
 * `xf-group`
 * a container allowing to switch between xf-case elements
 *
 *
 *  * todo: implement
 * @customElement
 * @polymer
 */
class XfGroup extends XfAbstractControl{


/*
    init(model){
        super.init(model);
        console.log(this, this.modelItem);

        // this.initializeChildren(this);
    }
*/

    render() {
        return html`
            <slot></slot>
        `;
    }

    initializeChildren(node){
        const children = Array.from(node.children);
        console.log('_initializeChildren ', children);

        children.forEach(child => {
            console.log('child ', child);

            if(Fore.isUiElement(child.nodeName)){
                child.init(this.model);
            }else if(child.children.length !== 0){
                const grantChildren = Array.from(child.children);
                grantChildren.forEach(grantChild =>{
                    this.initializeChildren(grantChild);
                });
            }

        });
        /*
                if(Fore.isUiElement(node.nodeName)){
                    const childElements = children.filter( action => Fore.isUiElement(action.nodeName));
                    console.log('children ', childElements);
                    console.group('init children');
                    if(childElements.length > 0){
                        childElements.forEach( child => {
                            console.log('action ', child);
                            child.init(this.model);
                        });
                    }
                }else if(node){
                    this._initializeChildren(node);
                }
        */


        console.groupEnd();
    }


}

window.customElements.define('xf-group', XfGroup);
