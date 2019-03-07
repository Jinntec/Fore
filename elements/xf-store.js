import {html, PolymerElement} from '../node_modules/polymer-redux/polymer-redux.js';

const intialState = {
    bindings: []
};

const reducer = (state, action) => {
    if (!state) return intialState;
    switch (action.type) {
        case 'CHANGE_VALUE':
            //clone the 'bindings' state
            let newVal = state.bindings.slice(0);
            newVal.push(action.value);
            return Object.assign({},state, {bindings: newVal});
    }
};

const store = Redux.createStore(reducer); //not correct yet

const ReduxMixin = PolymerRedux(store);