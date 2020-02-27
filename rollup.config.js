import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'node_modules/fontoxpath/dist/fontoxpath.js',
    output: {
        dir: 'output',
        format: 'cjs'
    },
    plugins: [commonjs()]
};
