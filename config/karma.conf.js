module.exports = function (config) {
    config.set({
        basePath: '../',
        frameworks: ['jasmine'],
        files: [
            'lib/angular.js',
            'lib/angular-*.js',
            'lib/jquery*.js',
            'lib/jstorage*.js',
            'test/lib/angular/angular-mocks.js',
            'js/*.js',
            'test/unit/*.js'
        ] ,
        autoWatch: true,
        browsers: ['Chrome'],
        junitReporter: {
            outputFile: 'test_out/unit.xml',
            suite: 'unit'
        }
    });
}