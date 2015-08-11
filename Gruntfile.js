module.exports = function(grunt) {
grunt.event.on('qunit.spawn', function (url) {
  grunt.log.ok("Running test: " + url);
});
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        files: [
          { src: ['prototype/fill.js', 'prototype/panels.js'], dest: 'build/panels.min.js' },
          { src: ['prototype/fill.js', 'prototype/angular-panels.js'], dest: 'build/angular-panels.min.js' }
        ]
      }
    },
    qunit: {
      options: {
        timeout: 10000
      },
      all: {
        options: {
          urls: [
            'http://localhost:8000/test/directive-tests.html',
            'http://localhost:8000/test/standard-tests.html'
          ]
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 8000,
          base: '.'
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-qunit');

  // Default task(s).
  grunt.registerTask('default', ['concat', 'connect', 'qunit']);

};
