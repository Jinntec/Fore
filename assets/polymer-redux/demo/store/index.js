/// BareSpecifier=polymer-redux/demo/store/index
import { createStore } from '../../../redux/es/redux.js';
import reducer from './reducer.js';

export default createStore(reducer);