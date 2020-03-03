module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      build: {
        src: 'src/form-validator.js',
        dest: 'dist/form-validator.min.js'
      },
      options: {
        banner: '/*!\n * <%= pkg.name %> v<%= pkg.version %>\n * (c) <%= pkg.author %>\n * Released under the <%= pkg.license %> License\n*/'
      }
    },
    jshint: {
      options: {
        eqeqeq: true,
        trailing: true
      },
      files: ['Gruntfile.js', 'src/**/*.js']
    }
  })
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.registerTask('default', ['uglify'])
}
