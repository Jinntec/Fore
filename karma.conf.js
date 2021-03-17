/* eslint-disable import/no-extraneous-dependencies */
const {createDefaultConfig} = require('@open-wc/testing-karma');
const merge = require('deepmerge');

// Run the tests headless by doing `npm run test --headless`
const headless = process.env.npm_config_headless;

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
            browserDisconnectTimeout: 10000,
            browserDisconnectTolerance: 3,
            browserNoActivityTimeout: 60000,
            flags: [
                '--disable-web-security',
                '--disable-gpu',
                '--no-sandbox'
            ],
            // you can overwrite/extend the config further

            // In headless mode (ie. CI), do not open a browser. The default will suffice
            ...(headless ? {} : {browsers: ['Chrome']}),
        }),
    );
    return config;
};
