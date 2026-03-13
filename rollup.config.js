import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import strip from '@rollup/plugin-strip';
import versionInjector from 'rollup-plugin-version-injector';

const extensions = ['.js'];

// eslint-disable-next-line no-unused-vars
const { dependencies } = require('./package.json');

export default [
  {
    input: './demo/demo-build.js',
    output: [
      {
        file: 'demo/demo.js',
        format: 'es',
        sourcemap: false,
      },
    ],
    treeshake: true,
    plugins: [
      versionInjector(),
      resolve(),
      babel({
        babelHelpers: 'bundled',
        babelrc: false,
        extensions,
        plugins: [
          [require('@babel/plugin-proposal-class-properties'), { loose: true }],
          [require('@babel/plugin-proposal-private-methods'), { loose: true }],
        ],
      }),
      strip(),
      minifyHTML(),
    ],
  }
];
