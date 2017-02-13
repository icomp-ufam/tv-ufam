module.exports = function(grunt) {
    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.registerTask('default', ['browserify']);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            main: {
                src: 'lib/vjs-quality-picker.js',
                dest: 'debug/vjs-quality-picker.js',
                options:  {
                  transform: ['babelify'],
                  browserifyOptions: {
                      debug: true
                  },
                  watch: true,
                  keepAlive: true
               }
            },
            dist: {
                src: 'lib/vjs-quality-picker.js',
                dest: 'dist/vjs-quality-picker.js',
                options:  {
                    transform: ['babelify'],
                    browserifyOptions: {
                        debug: false,
                    },
                    watch: false,
                    keepAlive: false,
                }
            }
        },
        uglify: {
            options: {
                mangle: true,
                compress: {
                    drop_console: true
                },
                beautify: false
            },
            dist: {
                files: {
                    'dist/vjs-quality-picker.min.js': 'dist/vjs-quality-picker.js'
                }
            }
        }
    });

    grunt.registerTask('build', ['browserify:dist', 'uglify:dist']);
};
