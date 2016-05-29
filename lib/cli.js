/*
	Tea Time!
	
	Copyright (c) 2015 - 2016 Cédric Ronvel
	
	The MIT License (MIT)
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



var termkit = require( 'terminal-kit' ) ;
var term = termkit.terminal ;
var string = require( 'string-kit' ) ;
var minimist = require( 'minimist' ) ;
var glob = require( 'glob' ) ;
var path = require( 'path' ) ;
var fs = require( 'fs' ) ;
var execFileSync = require( 'child_process' ).execFileSync ;
//var execSync = require( 'child_process' ).execSync ;

var TeaTime = require( './tea-time.js' ) ;



function cli()
{
	var args , testFiles ;
	
	var options = {
		microTimeout: process.nextTick ,
		onceUncaughtException: process.once.bind( process , 'uncaughtException' ) ,
		offUncaughtException: process.removeListener.bind( process , 'uncaughtException' )
	} ;
	
	// Manage command line arguments
	args = minimist( process.argv.slice( 2 ) ) ;
	
	if ( args.h || args.help )
	{
		cli.usage() ;
		return ;
	}
	
	testFiles = args._.length ? args._ : [] ;
	
	if ( args.html )
	{
		cli.generateHtml(
			testFiles ,
			typeof args.html === 'string' ? args.html : null ,
			!! args.browserify
		) ;
		return ;
	}
	
	TeaTime.populateOptionsWithArgs( options , args ) ;
	
	var teaTime = TeaTime.create( options ) ;
	
	teaTime.init() ;
	
	cli.createReporters( teaTime, options.reporters ) ;
	cli.loadTestFiles( testFiles ) ;
	
	teaTime.run( function() {
		process.exit( teaTime.fail ? 1 : 0 ) ;
	} ) ;
}

module.exports = cli ;



cli.usage = function usage()
{
	term.blue( "Usage is: tea-time [<test files>] [<option1>] [<option2>] [...]\n" ) ;
	term.blue( "Available options:\n" ) ;
	term.blue( "  -h , --help             Show this help\n" ) ;
	term.blue( "  -t , --timeout <time>   Timeout (default: 2000ms)\n" ) ;
	term.blue( "  -s , --slow <time>      Slow time (default: 75ms)\n" ) ;
	term.blue( "  -g , --grep <pattern>   Grep: filter in tests/suites by this pattern\n" ) ;
	term.blue( "  -c , --console          Allow console.log() and friends\n" ) ;
	term.blue( "  -b , --bail             Bail after first test failure\n" ) ;
	term.blue( "  -R , --reporter <name>  Set the reporter\n" ) ;
	term.blue( "       --html             Output HTML for the specified test files, suitable to run the test in browsers\n" ) ;
	term.blue( "       --browserify       Use in conjunction with --html, it use Browserify on each test files\n" ) ;
	term.blue( "\n" ) ;
} ;



function copyFile( sourcePath , targetPath )
{
	var content = fs.readFileSync( sourcePath ) ;
	fs.writeFileSync( targetPath , content ) ;
}



function browserify( sourcePath , targetPath )
{
	//console.log( sourcePath , targetPath ) ;
	execFileSync( __dirname + '/../node_modules/.bin/browserify' , [ sourcePath , '-o' , targetPath ] ) ;
	//console.log( __dirname + '/../node_modules/.bin/browserify ' + sourcePath + ' -o ' + targetPath ) ;
	//execSync( __dirname + '/../node_modules/.bin/browserify ' + sourcePath + ' -o ' + targetPath ) ;
}



cli.generateHtml = function generateHtml( testFiles , outputPath , runBrowserify )
{
	var outputDir , testFileName ;
	
	if ( ! Array.isArray( testFiles ) || ! testFiles.length ) { testFiles = cli.testFilesFromPackage() ; }
	else { testFiles = cli.expandTestFiles( testFiles ) ; }
	
	if ( outputPath )
	{
		//outputPath = fs.realpathSync( outputPath ) ;
		outputDir = path.dirname( outputPath ) ;
		
		try {
			fs.mkdirSync( outputDir + '/.tea-time' , 0o777 ) ;	// jshint ignore:line
		}
		catch ( error ) {
			// The dir already exists, do nothing...
		}
		
		copyFile(  __dirname + '/../browser/reporters.css' , outputDir + '/.tea-time/reporters.css' ) ;
		copyFile(  __dirname + '/../browser/tea-time.min.js' , outputDir + '/.tea-time/tea-time.min.js' ) ;
	}
	
	var content =
		'<!DOCTYPE HTML>\n' +
		'<html style="background-color:black">\n' +
		'<head>\n' +
		'	<meta charset="utf8" />\n' +
		'	<link rel="stylesheet" href="' + 
				( outputPath ? '.tea-time/reporters.css' : fs.realpathSync( __dirname + '/../browser/reporters.css' ) ) +
					'" />\n' +
		'</head>\n' +
		'<body>\n' +
		'	<script src="' +
				( outputPath ? '.tea-time/tea-time.min.js' : fs.realpathSync( __dirname + '/../browser/tea-time.js' ) ) +
					'"></script>\n' ;
	
	testFiles.forEach( function( testFile ) {
		if ( outputPath )
		{
			if ( runBrowserify )
			{
				testFileName = path.basename( testFile ) ;
				browserify( testFile , outputDir + '/.tea-time/' + testFileName ) ;
				content += '	<script src=".tea-time/' + testFileName + '"></script>\n' ;
			}
			else
			{
				content += '	<script src="' + path.relative( outputDir , testFile ) + '"></script>\n' ;
			}
		}
		else
		{
			content += '	<script src="' + testFile + '"></script>\n' ;
		}
	} ) ;
	
	content += 
		'</body>\n' +
		'</html>\n' ;
	
	if ( outputPath )
	{
		fs.writeFileSync( outputPath , content ) ;
	}
	else
	{
		console.log( content ) ;
	}
} ;



cli.loadTestFiles = function loadTestFiles( testFiles )
{
	var i , iMax ;
	
	if ( ! Array.isArray( testFiles ) || ! testFiles.length ) { testFiles = cli.testFilesFromPackage() ; }
	else { testFiles = cli.expandTestFiles( testFiles ) ; }
	
	// Load all test files
	try {
		for ( i = 0 , iMax = testFiles.length ; i < iMax ; i ++ )
		{
			require( testFiles[ i ] ) ;
		}
	}
	catch ( error ) {
		cli.exitError( "Error in the test file '" + testFiles[ i ] + "':\n%E\n" , error ) ;
	}
} ;



// Expand using glob on all command line file arguments
cli.expandTestFiles = function expandTestFiles( testFiles_ )
{
	var i , iMax , testFiles = [] ;
	
	for ( i = 0 , iMax = testFiles_.length ; i < iMax ; i ++ )
	{
		testFiles = testFiles.concat( glob.sync( process.cwd() + '/' + testFiles_[ i ] ) ) ;
	}
	
	return testFiles ;
} ;



// Get files using package.json
cli.testFilesFromPackage = function testFilesFromPackage()
{
	var package_ ;
	
	// Require the package.json (mandatory)
	try {
		package_ = require( process.cwd() + '/package.json' ) ;
	}
	catch ( error ) {
		if ( error.code === 'MODULE_NOT_FOUND' ) { cli.exitError( "No package.json found.\n" ) ; }
		else { cli.exitError( "Error in the package.json: %E\n" , error ) ; }
	}
	
	// Get the bench directory
	if ( ! package_.directories || ! package_.directories.test )
	{
		cli.exitError( "The package.json miss a directories.test path, set to the directory containing test files.\n" ) ;
	}
	
	return glob.sync( process.cwd() + '/' + package_.directories.test + '/*js' ) ;
} ;



cli.createReporters = function createReporters( teaTime , reporters )
{
	var i , iMax , reporter ;
	
	for ( i = 0 , iMax = reporters.length ; i < iMax ; i ++ )
	{
		reporter = reporters[ i ] ;
		
		try {
			if ( reporter.indexOf( '/' ) === -1 && reporter.indexOf( '.' ) === -1 )
			{
				// No slash and no dot: this is a built-in reporter
				reporter = './reporters/' + reporter + '.js' ;
			}
			else if ( ! path.isAbsolute( reporter ) )
			{
				reporter = process.cwd() + '/' + reporter ;
			}
			
			require( reporter )( teaTime ) ;
		}
		catch ( error ) {
			// Continue on error, simply skip this reporter
			console.error( "Error loading this reporter:" , reporter , error ) ;
		}
	}
} ;



cli.exitError = function exitError()
{
	var message = string.format.apply( null , arguments ) ;
	
	term.bold.red( message ) ;
	
	process.exit( 1 ) ;
} ;



