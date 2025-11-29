const webpackConfig = require('./webpack.config.js');

module.exports = function(config) {
    config.set({
        frameworks: ['jasmine'],
        files: [
            'src/unit/**/*.test.js',
            'src/test/setup.js'
        ],

        preprocessors: {
            'src/unit/**/*.test.js': ['webpack'],
            'src/test/setup.js': ['webpack']
        },

        webpack: {
            ...webpackConfig,
            mode: 'development',
            resolve: {
                ...webpackConfig.resolve,
                alias: {
                    ...webpackConfig.alias,
                }
            }
        },

        browsers: ['ChromeHeadlessNoSandbox'],
        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox', '--disable-gpu', '--disable-web-security']
            }
        },
        reporters: ['progress'],
        logLevel: config.LOG_INFO,
        autowatch: true,
        singleRun: process.env.CI === 'true',
        concurrency: Infinity,
        plugins: [
            'karma-jasmine',
            'karma-chrome-launcher',
            'karma-webpack'
        ]
    });
};