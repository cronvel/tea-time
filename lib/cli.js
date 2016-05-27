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

var TeaTime = require( './tea-time.js' ) ;



function cli()
{
	var i , iMax , args , v , testFiles ,
		reporters = [ 'classic' ] ,
		options = {} ;
	
	// Manage command line arguments
	args = minimist( process.argv.slice( 2 ) ) ;
	
	if ( args.h || args.help )
	{
		cli.usage() ;
		return ;
	}
	
	testFiles = args._.length ? args._ : [] ;
	
	if ( args.c || args.console ) { options.allowConsole = true ; }
	
	if ( args.b || args.bail ) { options.bail = true ; }
	
	if ( args.timeout && ( v = parseInt( args.timeout , 10 ) ) ) { options.timeout = v ; }
	else if ( args.t && ( v = parseInt( args.t , 10 ) ) ) { options.timeout = v ; }
	
	if ( args.slow && ( v = parseInt( args.slow , 10 ) ) ) { options.slowTime = v ; }
	else if ( args.s && ( v = parseInt( args.s , 10 ) ) ) { options.slowTime = v ; }
	
	
	if ( args.reporter )
	{
		if ( ! Array.isArray( args.reporter ) ) { args.reporter = [ args.reporter ] ; }
		reporters = args.reporter ;
		
		if ( args.R )
		{
			if ( ! Array.isArray( args.R ) ) { args.R = [ args.R ] ; }
			reporters = args.reporter.concat( args.R ) ;
		}
		else
		{
			reporters = args.reporter ;
		}
	}
	else if ( args.R )
	{
		if ( ! Array.isArray( args.R ) ) { args.R = [ args.R ] ; }
		reporters = args.R ;
	}
	
	
	// Turn string into regexp for the "grep" feature
	options.grep = [] ;
	if ( args.g )
	{
		if ( ! Array.isArray( args.g ) ) { args.g = [ args.g ] ; }
		
		for ( i = 0 , iMax = args.g.length ; i < iMax ; i ++ )
		{
			options.grep.push( new RegExp( args.g[ i ] , 'i' ) ) ;
		}
	}
	
	if ( args.grep )
	{
		if ( ! Array.isArray( args.grep ) ) { args.grep = [ args.grep ] ; }
		
		for ( i = 0 , iMax = args.grep.length ; i < iMax ; i ++ )
		{
			options.grep.push( new RegExp( args.grep[ i ] , 'i' ) ) ;
		}
	}
	
	
	var teaTime = TeaTime.create( options ) ;
	
	teaTime.init( function() {
		
		cli.createReporters( teaTime, reporters ) ;
		cli.loadTestFiles( testFiles ) ;
		
		teaTime.run( function() {
			process.exit( teaTime.fail ? 1 : 0 ) ;
		} ) ;
	} ) ;
}

module.exports = cli ;



cli.usage = function usage()
{
	term.blue( "Usage is: tea-time [<files>] [<option1>] [<option2>] [...]\n" ) ;
	term.blue( "Available options:\n" ) ;
	term.blue( "  -t , --timeout <time>        Timeout (default: 2000ms)\n" ) ;
	term.blue( "  -s , --slow <time>           Slow time (default: 75ms)\n" ) ;
	term.blue( "  -g , --grep <pattern>        Grep: filter in tests/suites by this pattern\n" ) ;
	term.blue( "  -c , --console               Allow console.log() and friends\n" ) ;
	term.blue( "  -b , --bail                  Bail after first test failure\n" ) ;
	term.blue( "  -R , --reporter <name>       Set the reporter\n" ) ;
	term.blue( "  -h , --help                  Show this help\n" ) ;
	term.blue( "\n" ) ;
} ;



cli.loadTestFiles = function loadTestFiles( testFiles )
{
	var i , iMax ;
	
	if ( ! testFiles ) { testFiles = cli.testFilesFromPackage() ; }
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



