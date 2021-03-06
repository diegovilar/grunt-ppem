module.exports = function (grunt) {
    "use strict";

    var PPem = require("ppem"),
        path = require('path'),
        clone = require("clone");

    function log(msg) {
        console.log('' + msg);
    }

    grunt.registerMultiTask("ppem", "Grunt task to preprocess JS files.", function () {

        var taskOptions = this.data;

        var options = {
            verbose : taskOptions.verbose,
            baseDir : taskOptions.baseDir,
            includes : taskOptions.includes || []
        };
        var globalDefines = taskOptions.defines || {};

        var ppem = new PPem(globalDefines, options);

        this.files.forEach(function(f) {

            var src = f.src.filter(function(filepath) {
                // Warn on and remove invalid source files (if nonull was set).
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            });

            if (src.length === 0) {
                grunt.log.warn('Destination (' + f.dest + ') not written because src files were empty.');
                return;
            }

            // Process files, warn and fail on error.
            try {
                var sourceCode = grunt.file.read("./" + src);
                var processMethod;
                var extname = path.extname(src).replace('.', '').toLowerCase();
                var currentFileIncludes = [path.dirname(src) + ''];

                switch (extname) {
                    case 'xml':
                    case 'html':
                    case 'htm':
                        processMethod = 'processXml';
                        break;
                    case 'css':
                        processMethod = 'processCss';
                        break;
                    case 'shtml':
                        processMethod = 'processShtml';
                        break;
                    default:
                        processMethod = 'processClike';
                }

                options.verbose && grunt.log.writeln("[ppem] Processing " + src + ' using ' + processMethod);
                var processedCode = ppem[processMethod](sourceCode, null, currentFileIncludes);

                if (processedCode !== null) {
                    if (src == f.dest) {
                        grunt.log.writeln("[ppem] " + src + ' preprocessed using ' + processMethod);
                    }
                    else {
                        grunt.log.writeln("[ppem] " + src + ' preprocessed using ' + processMethod + ' and saved to ' + f.dest);
                    }
                    grunt.file.write(f.dest, processedCode);
                }
            }
            catch (e) {
                //console.log(e);
                var err = new Error('Preprocessing error');
                if (e.message) {
                    err.message += ': ' + e.message + '. \n';
                    if (e.line) {
                        err.message += 'Line ' + e.line + ' in ' + src + '\n';
                    }
                }
                err.origError = e;
                grunt.log.warn('[ppem] failed');
                grunt.fail.warn(err);
            }

        });
    });
};
