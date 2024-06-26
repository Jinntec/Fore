import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import openWcEslintConfig from '@open-wc/eslint-config';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat();

export default [
  ...compat.config(openWcEslintConfig),
  {
    ignores: [
      'demo/',
      'resources/',
      'doc/',
      'dist/',
      '*jinn-codemirror*',
      'test/',
      'src/drawdown.js',
      '*.html',
    ],
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
    },
  },
  eslintPluginPrettierRecommended,
];
