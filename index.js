/*
 *  Typedoc Webpack Plugin
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved. 
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *   
 *  The above copyright notice and this permission notice shall be included in 
 *  all copies or substantial portions of the Software.
 *   
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

var typedoc = require('typedoc');
var _ = require('lodash');

function TypedocWebpackPlugin(options) {
	this.startTime = Date.now();
  	this.prevTimestamps = {};
  	this.defaultTypedocOptions = {
  		out: './docs',
  		module: 'commonjs',
		target: 'es5',
		exclude: '**/node_modules/**/*.*',
		experimentalDecorators: true,
		excludeExternals: true
  	};

  	// merge user options into default options and assign
  	_.merge(this.defaultTypedocOptions, options);
  	this.typeDocOptions = this.defaultTypedocOptions;
}

/*
*	@param compiler Webpack compiler object. @see <a href="https://webpack.github.io/docs/plugins.html#the-compiler-instance">label</a>
* 	@return void
*/
TypedocWebpackPlugin.prototype.apply = function(compiler) {
	var self = this;

	compiler.plugin('emit', function(compilation, callback) 
	{
		// get list of files that has been changed
		var changedFiles = Object.keys(compilation.fileTimestamps).filter(function(watchfile) {
			return (this.prevTimestamps[watchfile] || this.startTime) < (compilation.fileTimestamps[watchfile] || Infinity);
		}.bind(this));

		// determine if any typescript files have been changed
		var tsFileEdited = false; 
		for (var i = 0; i < changedFiles.length; i++) {
			if (changedFiles[i].indexOf('.ts') > -1) {
				tsFileEdited = true;
				break;
			}
		}

		// if typescript files have been changed or we cannot determine what files have been changed run typedoc build
		if(tsFileEdited || changedFiles.length === 0) {
			var typedocApp = new typedoc.Application(self.typeDocOptions);
			var src = typedocApp.expandInputFiles(['./']);
			var project = typedocApp.convert(src);

			if (project) {
				console.log('Generating updated typedocs');
				typedocApp.generateDocs(project, self.typeDocOptions.out);
			}
		}
		else {
			console.log('No ts filed changed. Not recompling typedocs');
		}

		this.prevTimestamps = compilation.fileTimestamps;
		callback();
	});

	compiler.plugin('done', function (stats) {
		console.log('Typedoc finished generating');
	});
}

module.exports = TypedocWebpackPlugin;