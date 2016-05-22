/*
	Tea Time!
	
	Copyright (c) 2016 Cédric Ronvel
	
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



// Load modules
var async = require( 'async-kit' ) ;
var termkit = require( 'terminal-kit' ) ;
var term = termkit.terminal ;
var string = require( 'string-kit' ) ;
var minimist = require( 'minimist' ) ;
var glob = require( 'glob' ) ;

var teaTimePackage = require( '../package.json' ) ;

var Events = require( 'events' ) ;



var teaTime = {} ;
module.exports = teaTime ;



teaTime.cli = function cli()
{
	var i , iMax , args , v ;
	
	var runtime = Object.create( Events.prototype ) ;
	
	runtime.timeout = 2000 ;
	runtime.testFn = [] ;
	runtime.grep = [] ;
	runtime.ok = 0 ;
	runtime.fail = 0 ;
	runtime.pending = 0 ;
	runtime.intoSuiteIndex = -1 ;
	
	// Manage command line arguments
	args = minimist( process.argv.slice( 2 ) ) ;
	
	if ( args.h || args.help )
	{
		teaTime.usage() ;
		return ;
	}
	
	if ( args.t && ( v = parseInt( args.t , 10 ) ) ) { runtime.timeout = v ; }
	
	// Turn string into regexp for the "grep" feature
	if ( args.g )
	{
		if ( ! Array.isArray( args.g ) ) { args.g = [ args.g ] ; }
		
		for ( i = 0 , iMax = args.g.length ; i < iMax ; i ++ )
		{
			runtime.grep[ i ] = new RegExp( args.g[ i ] , 'i' ) ;
		}
	}
	
	if ( args._.length )
	{
		runtime.testFiles = args._ ;
	}
	
	teaTime.init( runtime , function() {
		teaTime.run( runtime ) ;
	} ) ;
} ;



teaTime.usage = function usage()
{
	term.blue( "Usage is: tea-time [<grep by suite/test name>] [<option1>] [<option2>] [...]\n" ) ;
	term.blue( "Available options:\n" ) ;
	term.blue( "  -t              Timeout (default: 2000ms)\n" ) ;
	term.blue( "  -b              Bail out\n" ) ;
	term.blue( "  -r <reporter>   Set the reporter\n" ) ;
	term.blue( "  -h , --help     Show this help\n" ) ;
	term.blue( "\n" ) ;
} ;



teaTime.init = function init( runtime , callback )
{
	// Reporter(s)
	var reporter = require( './reporters/classic.js' )( runtime ) ; 	// Tmp!!!
	runtime.emit( 'intro' ) ;
	
	// Register to global
	global.describe =
		global.context =
		global.suite =
			teaTime.registerSuite.bind( this , runtime ) ;
	
	global.it =
		global.specify =
		global.test =
			teaTime.registerTest.bind( this , runtime ) ;
	
	teaTime.loadTestFiles( runtime ) ;
	
	callback() ;
} ;



teaTime.loadTestFiles = function loadTestFiles( runtime )
{
	var i , iMax , package_ ;
	
	if ( ! runtime.testFiles ) { teaTime.testFilesFromPackage( runtime ) ; }
	else { teaTime.expandTestFiles( runtime ) ; }
	
	// Load all test files
	try {
		for ( i = 0 , iMax = runtime.testFiles.length ; i < iMax ; i ++ )
		{
			require( runtime.testFiles[ i ] ) ;
		}
	}
	catch ( error ) {
		teaTime.exitError( "Error in the test file '" + runtime.testFiles[ i ] + "': %E\n" , error ) ;
	}
} ;



// Expand using glob on all command line file arguments
teaTime.expandTestFiles = function expandTestFiles( runtime )
{
	var i , iMax , testFiles = [] ;
	
	for ( i = 0 , iMax = runtime.testFiles.length ; i < iMax ; i ++ )
	{
		testFiles = testFiles.concat( glob.sync( process.cwd() + '/' + runtime.testFiles ) ) ;
	}
	
	runtime.testFiles = testFiles ;
} ;



// Get files using package.json
teaTime.testFilesFromPackage = function testFilesFromPackage( runtime )
{
	var package_ ;
	
	// Require the package.json (mandatory)
	try {
		package_ = require( process.cwd() + '/package.json' ) ;
	}
	catch ( error ) {
		if ( error.code === 'MODULE_NOT_FOUND' ) { teaTime.exitError( "No package.json found.\n" ) ; }
		else { teaTime.exitError( "Error in the package.json: %E\n" , error ) ; }
	}
	
	// Get the bench directory
	if ( ! package_.directories || ! package_.directories.test )
	{
		teaTime.exitError( "The package.json miss a directories.test path, set to the directory containing test files.\n" ) ;
	}
	
	runtime.testFiles = glob.sync( process.cwd() + '/' + package_.directories.test + '/*js' ) ;
} ;



teaTime.exitError = function exitError()
{
	var message = string.format.apply( null , arguments ) ;
	
	term.bold.red( message ) ;
	
	process.exit( 1 ) ;
} ;



teaTime.run = function run( runtime )
{
	async.foreach( runtime.testFn , function( suite , outerForeachCallback ) {
		
		runtime.emit( 'enterSuite' , suite.name ) ;
		
		async.foreach( suite , function( testFn , innerForeachCallback ) {
			
			runtime.testNameInProgress = typeof testFn === 'function' ? testFn.testName : testFn ;
			
			teaTime.doOneTest( runtime , runtime.testNameInProgress , testFn , function( error ) {
				// If the bail-out option is set, we should exit here
				innerForeachCallback() ;
			} ) ;
		} )
		.exec( outerForeachCallback ) ;
		
	} )
	.exec( function() {
		
		runtime.emit( 'exit' ) ;
		process.exit() ;
	} ) ;
} ;



teaTime.doOneTest = function doOneTest( runtime , testName , testFn , callback )
{
	runtime.testInProgress = testName ;
	
	if ( typeof testFn !== 'function' )
	{
		runtime.pending ++ ;
		runtime.emit( 'pending' , testName ) ;
		callback() ;
	}
	else if ( testFn.length )
	{
		teaTime.asyncTest( runtime , testName , testFn , callback ) ;
	}
	else
	{
		teaTime.syncTest( runtime , testName , testFn , callback ) ;
	}
} ;



teaTime.syncTest = function syncTest( runtime , testName , testFn , callback )
{
	var startTime , time ;
	
	try {
		startTime = Date.now() ;
		testFn() ;
		time = Date.now() - startTime ;
	}
	catch ( error ) {
		time = Date.now() - startTime ;
		runtime.fail ++ ;
		runtime.emit( 'fail' , testName , time , error ) ;
		callback( error ) ;
		return ;
	}
	
	runtime.ok ++ ;
	runtime.emit( 'ok' , testName , time ) ;
	callback() ;
} ;



teaTime.asyncTest = function asyncTest( runtime , testName , testFn , callback )
{
	var startTime , time , callbackTriggered = false ;
	
	//console.log( "Async:" , testName ) ;
	
	var triggerCallback = function triggerCallback( error ) {
		
		if ( callbackTriggered ) { return ; }
		
		time = Date.now() - startTime ;
		callbackTriggered = true ;
		
		process.removeListener( 'uncaughtException' , triggerCallback ) ;
		
		if ( error )
		{
			runtime.fail ++ ;
			runtime.emit( 'fail' , testName , time , error ) ;
			callback( error ) ;
			return ;
		}
		else
		{
			runtime.ok ++ ;
			runtime.emit( 'ok' , testName , time ) ;
			callback() ;
		}
	} ;
	
	process.once( 'uncaughtException' , triggerCallback ) ;
	
	try {
		startTime = Date.now() ;
		testFn( triggerCallback ) ;
	}
	catch ( error ) {
		triggerCallback( error ) ;
	}
} ;





			/* User-land global functions */



teaTime.registerSuite = function registerSuite( runtime , suiteName , fn )
{
	if ( ! suiteName || typeof suiteName !== 'string' || typeof fn !== 'function' )
	{
		throw new Error( "Usage is suite( name , fn )" ) ;
	}
	
	runtime.intoSuiteIndex = runtime.testFn.length ;
	runtime.testFn[ runtime.intoSuiteIndex ] = [] ;
	
	Object.defineProperty( runtime.testFn[ runtime.intoSuiteIndex ] , 'name' , { value: suiteName } ) ;
	
	fn() ;
	runtime.intoSuiteIndex = -1 ;
} ;



teaTime.registerTest = function registerTest( runtime , testName , fn )
{
	var i , iMax , suite ;
	
	if ( ! testName || typeof testName !== 'string' )
	{
		throw new Error( "Usage is test( name , [fn] )" ) ;
	}
	
	if ( runtime.intoSuiteIndex < 0 )
	{
		throw new Error( "test() should be called from within a suite() callback" ) ;
	}
	
	suite = runtime.testFn[ runtime.intoSuiteIndex ] ;
	
	// Filter out tests that are not relevant, each grep should either match the suite name or the test name
	for ( i = 0 , iMax = runtime.grep.length ; i < iMax ; i ++ )
	{
		if ( ! suite.name.match( runtime.grep[ i ] ) && ! testName.match( runtime.grep[ i ] ) ) { return ; }
	}
	
	if ( typeof fn === 'function' )
	{
		Object.defineProperty( fn , 'testName' , { value: testName } ) ;
	}
	else
	{
		fn = testName ;
	}
	
	suite.push( fn ) ;
} ;


