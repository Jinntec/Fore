export class DataValue {
    constructor(value) {
        this.dataValue = value;
    }

    get dataValue(){
        // to be implemented by overwriting class
        return this.dataValue;
    }

    set dataValue(newVal){
        // to be implemented by overwriting class
        this.dataValue = newVal;
    }
}