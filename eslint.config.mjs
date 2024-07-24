import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import openWcEslintConfig from '@open-wc/eslint-config';
import { FlatCompat } from '@eslint/eslintrc';
import html from '@html-eslint/eslint-plugin';
import htmlParser from '@html-eslint/parser';

const compat = new FlatCompat();

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} */
export default [
  ...compat.config(openWcEslintConfig),
  {
    ignores: ['resources/', 'doc/', 'dist/', '*jinn-codemirror*', 'src/drawdown.js'],
  },
  {
    rules: {
      'no-console': 'off',
      'no-alert': 'off',
      'import/no-extraneous-dependencies': [
        'off',
        {
          devDependencies: ['demo/**/*.html', 'doc/**/*.html'],
        },
      ],
      'no-param-reassign': [
        'off',
        {
          dependencies: ['src/fx-model.js'],
        },
      ],
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_.*',
        },
      ],
    },
  },
  {
    // recommended configuration included in the plugin
    //    ...html.configs['flat/recommended'],
    files: ['**/*.html'],
    languageOptions: {
      parser: htmlParser,
    },
    rules: {
      'spaced-comment': 'off',
    },
  },
  {
    ...eslintPluginPrettierRecommended,
    files: ['src', 'test'],
  },
];
