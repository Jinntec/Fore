import resolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import strip from '@rollup/plugin-strip';

// eslint-disable-next-line no-unused-vars
const { dependencies } = require('./package.json');

export default [
  {
    input: './index.js',
    output: [
      {
        file: 'dist/fore.js',
        format: 'es',
        sourcemap: true,
      },
    ],
    external: moduleName =>
      // All absolute imports should be regarded as external. Examples are 'fontoxpath',
      // 'lit-element' or '@polymer/*'
      !/^(\.\/|\.\.\/)/.test(moduleName),
    plugins: [
      resolve(),
      babel({
        babelrc: false,
        exclude: 'node_modules/**',
        plugins: [
          // Tell babel to accept the `static READONLY_DEFAULT = false;` properties found in some places.
          // TODO: reconsider whether that is a good idea.
          // eslint-disable-next-line global-require
          [require('@babel/plugin-proposal-class-properties'), { loose: true }],
        ],
      }),
      minifyHTML(),
      terser(),
    ],
  },
  {
    input: './index.js',
    output: [
      {
        file: 'dist/fore-all.js',
        format: 'es',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      babel({
        babelrc: false,
        plugins: [
          // Tell babel to accept the `static READONLY_DEFAULT = false;` properties found in some places.
          // TODO: reconsider whether that is a good idea.
          // eslint-disable-next-line global-require
          [require('@babel/plugin-proposal-class-properties'), { loose: true }],
        ],
      }),
      strip(),
      minifyHTML(),
      terser(),
    ],
  }
];
