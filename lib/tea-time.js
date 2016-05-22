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
	runtime.testFn = {} ;
	runtime.grep = [] ;
	
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
	term.blue( "Usage is: tea-time [<grep by topic/test name>] [<option1>] [<option2>] [...]\n" ) ;
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
	global.describe = teaTime.registerTopic.bind( runtime ) ;
	global.it = global.test = teaTime.registerTest.bind( runtime ) ;
	
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
	console.log( "+++ " , runtime.testFiles ) ;
} ;



teaTime.exitError = function exitError()
{
	var message = string.format.apply( null , arguments ) ;
	
	term.bold.red( message ) ;
	
	/*
	notifications.createNotification( {
		summary: 'tea-time: error' ,
		body: message ,
		icon: 'dialog-warning'
	} ).push() ;
	*/
	
	process.exit( 1 ) ;
} ;



teaTime.run = function run( runtime )
{
	async.foreach( runtime.testFn , function( e , topicName , outerForeachCallback ) {
		
		runtime.topicInProgress = topicName ;
		runtime.emit( 'enterTopic' , topicName ) ;
		
		async.map( e , function( testFn , testName , innerForeachCallback ) {
			
			runtime.testInProgress = testName ;
			
			teaTime.doOneTest( runtime , testName , testFn , function( error ) {
				// If the bail-out option is set, we should exit here
				innerForeachCallback() ;
			} ) ;
		} )
		.parallel( 1 )
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
	
	if ( testFn.length )
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
		runtime.emit( 'fail' , testName , error ) ;
		callback( error ) ;
		return ;
	}
	
	runtime.emit( 'ok' , testName , time ) ;
	callback() ;
} ;



teaTime.asyncTest = function asyncTest( runtime , testName , testFn , callback )
{
	var startTime , time ;
	
	try {
		startTime = Date.now() ;
		
		testFn( function( error ) {
			time = Date.now() - startTime ;
			
			if ( error )
			{
				runtime.emit( 'fail' , testName , error ) ;
				callback( error ) ;
				return ;
			}
		} ) ;
	}
	catch ( error ) {
		runtime.emit( 'fail' , testName , error ) ;
		callback( error ) ;
		return ;
	}
} ;





			/* User-land global functions */



var intoTopicName = null ;

teaTime.registerTopic = function topic( topicName , fn )
{
	if ( ! topicName || typeof topicName !== 'string' || typeof fn !== 'function' )
	{
		throw new Error( "Usage is topic( name , fn )" ) ;
	}
	
	if ( ! this.testFn[ topicName ] ) { this.testFn[ topicName ] = {} ; }
	
	intoTopicName = topicName ;
	fn() ;
	intoTopicName = null ;
} ;



teaTime.registerTest = function test( testName , fn )
{
	var i , iMax ;
	
	if ( ! testName || typeof testName !== 'string' || typeof fn !== 'function' )
	{
		throw new Error( "Usage is test( name , fn )" ) ;
	}
	
	if ( ! intoTopicName )
	{
		throw new Error( "test() should be called from within a topic() callback" ) ;
	}
	
	// Filter out tests that are not relevant, each grep should either match the topic name or the test name
	for ( i = 0 , iMax = this.grep.length ; i < iMax ; i ++ )
	{
		if ( ! intoTopicName.match( this.grep[ i ] ) && ! testName.match( this.grep[ i ] ) ) { return ; }
	}
	
	this.testFn[ intoTopicName ][ testName ] = fn ;
} ;


