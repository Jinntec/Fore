import resolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import strip from '@rollup/plugin-strip';
import versionInjector from 'rollup-plugin-version-injector';

// eslint-disable-next-line no-unused-vars
const { dependencies } = require('./package.json');

export default [
  {
    input: './demo/demo-build.js',
    output: {
      file: 'dist/demo.js',
      format: 'es',
      sourcemap: false,
      inlineDynamicImports: true,
    },
    plugins: [
      versionInjector(),
      resolve(),
      babel({
        babelrc: false,
        plugins: [[require('@babel/plugin-proposal-class-properties'), { loose: true }]],
      }),
      strip(),
      minifyHTML(),
    ],
  },
];
