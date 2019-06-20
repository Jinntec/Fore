/// BareSpecifier=loose-envify/index
import { process } from '../process.js';
'use strict';

module.exports = require('./loose-envify')(process.env);