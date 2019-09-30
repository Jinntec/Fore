'use strict';

var gulp = require('gulp'),
    exist = require('gulp-exist'),
    watch = require('gulp-watch'),
    del = require('del'),
    path = require('path');

var PRODUCTION = (!!process.env.NODE_ENV || process.env.NODE_ENV === 'production');

console.log('Production? %s', PRODUCTION);

exist.defineMimeTypes({
    // 'application/xml': ['odd']
});

var exClient = exist.createClient({
    host: 'localhost',
    port: '8080',
    path: '/exist/xmlrpc',
    basic_auth: {user: 'admin', pass: ''}
});

var html5TargetConfiguration = {
    target: '/db/apps/fore',
    html5AsBinary: true
};

var targetConfiguration = {
    target: '/db/apps/fore/',
    html5AsBinary: true
};

gulp.task('clean', function () {
    return del(['build/**/*']);
});

// styles //

var stylesPath = 'resources/css/*';


// files in project root //

var componentPaths = [
    '*.html',
    'assets/**/*',
    'src/**/*.js'
];

gulp.task('deploy:components', function () {
    return gulp.src(componentPaths, {base: './'})
        .pipe(exClient.newer(html5TargetConfiguration))
        .pipe(exClient.dest(html5TargetConfiguration))
});

var otherPaths = [
    '*.html',
    '*.xql',
    'resources/**/*',
    '!resources/css/*',
    'modules/**/*',
    'src/demo/*.html',
    'doc/**/*.html',
    'doc/styles.css'

];

gulp.task('deploy:other', function () {
    return gulp.src(otherPaths, {base: './'})
        .pipe(exClient.newer(targetConfiguration))
        .pipe(exClient.dest(targetConfiguration))
});

var components = [
    'src/*.js'
];


gulp.task('deploy', ['deploy:other', 'deploy:components']);

gulp.task('watch', function () {
    gulp.watch(otherPaths, ['deploy:other']);
    gulp.watch('src/**/*.js', ['deploy:components'])
});

gulp.task('default', ['watch']);
