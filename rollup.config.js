import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
    input: 'index.js',
    output: {
        dir: 'output',
        format: 'esm'
    },
    plugins: [
        babel(),
        resolve()
    ]
};
