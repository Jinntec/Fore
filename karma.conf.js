/* eslint-disable import/no-extraneous-dependencies */
const {createDefaultConfig} = require('@open-wc/testing-karma');
const merge = require('deepmerge');

module.exports = config => {
    config.set(
        merge(createDefaultConfig(config), {
            files: [
                // runs all files ending with .test in the test folder,
                // can be overwritten by passing a --grep flag. examples:
                //
                // npm run test -- --grep test/foo/bar.test.js
                // npm run test -- --grep test/bar/*
                {pattern: config.grep ? config.grep : 'test/**/*.test.js', type: 'module'},
            ],

            esm: {
                nodeResolve: true,
            },
            browsers: ['Chrome'],
            browserDisconnectTimeout: 10000,
            browserDisconnectTolerance: 3,
            browserNoActivityTimeout: 60000,
            flags: [
                '--disable-web-security',
                '--disable-gpu',
                '--no-sandbox'
            ]
            // you can overwrite/extend the config further
        }),
    );
    return config;
};
