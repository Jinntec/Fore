import resolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';

const { dependencies } = require('./package.json');

export default {
    input: './index.js',
    output: [
        {
            file: 'dist/fore.js',
            format: 'es',
            sourcemap: true,
        },
    ],
    external: Object.keys(dependencies),
    plugins: [
        resolve(),
        babel({
            babelrc: false,
            exclude: 'node_modules/**',
            plugins: [
                // Tell babel to accept the `static READONLY_DEFAULT = false;` properties found in some places.
                // TODO: reconsider whether that is a good idea.
                [require('@babel/plugin-proposal-class-properties'), { loose: true }]
            ],
        }),
    ],
};
