import {DataValue} from "./DataValue";

export class XMLValue extends DataValue{
    constructor(value) {
        super(value);
    }

    get dataValue(){
        // to be implemented by overwriting class
        if (!this.dataValue) {
            return null;
        }
        if (!this.dataValue.nodeType) return this.dataValue;

        if (this.dataValue.nodeType === Node.ATTRIBUTE_NODE) {
            return this.dataValue.nodeValue;
        }
        return this.dataValue.textContent;
    };

    set dataValue(newVal){
        if (newVal.nodeType === Node.ELEMENT_NODE) {
            this.dataValue = newVal;
        }
        if (newVal.nodeType === Node.ATTRIBUTE_NODE) {
            this.dataValue = newVal.getValue();
        }
        if (newVal.nodeType === Node.TEXT_NODE) {
            this.dataValue = newVal.textContent;
        }
    }

}