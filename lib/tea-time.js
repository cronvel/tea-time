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
var path = require( 'path' ) ;



var teaTime = {} ;
module.exports = teaTime ;



teaTime.cli = function cli()
{
	var i , iMax , args , v ;
	
	var runtime = Object.create( Events.prototype ) ;
	
	runtime.timeout = 2000 ;
	runtime.suite = teaTime.createSuite() ;
	runtime.grep = [] ;
	runtime.startTime = 0 ;
	runtime.testCount = 0 ;
	runtime.ok = 0 ;
	runtime.fail = 0 ;
	runtime.skip = 0 ;
	runtime.errors = [] ;
	runtime.intoSuiteIndex = -1 ;
	runtime.registerStack = [ runtime.suite ] ;
	runtime.allowConsole = false ;
	
	// Manage command line arguments
	args = minimist( process.argv.slice( 2 ) ) ;
	
	if ( args.h || args.help )
	{
		teaTime.usage() ;
		return ;
	}
	
	if ( args.c || args.console ) { runtime.allowConsole = true ; }
	
	if ( args.timeout && ( v = parseInt( args.timeout , 10 ) ) ) { runtime.timeout = v ; }
	else if ( args.t && ( v = parseInt( args.t , 10 ) ) ) { runtime.timeout = v ; }
	
	runtime.reporters = args.r || [ 'classic' ] ;
	if ( ! Array.isArray( runtime.reporters ) ) { runtime.reporters = [ runtime.reporters ] ; }
	
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
	term.blue( "Usage is: tea-time [<files>] [<option1>] [<option2>] [...]\n" ) ;
	term.blue( "Available options:\n" ) ;
	term.blue( "  -t , --timeout <time>   Timeout (default: 2000ms)\n" ) ;
	term.blue( "  -g                      Grep: filter in test/suite by this pattern\n" ) ;
	term.blue( "  -c , --console          Allow console.log() and friends\n" ) ;
	term.blue( "  -b                      Bail out (TODO)\n" ) ;
	term.blue( "  -r <reporter>           Set the reporter (TODO)\n" ) ;
	term.blue( "  -h , --help             Show this help\n" ) ;
	term.blue( "\n" ) ;
} ;



teaTime.init = function init( runtime , callback )
{
	// Register to global
	global.suite =
		global.describe =
		global.context = teaTime.registerSuite.bind( this , runtime ) ;
	
	global.test =
		global.it =
		global.specify =
			teaTime.registerTest.bind( this , runtime ) ;
	
	global.test.skip = teaTime.registerSkipTest.bind( this , runtime ) ;
	
	global.setup =
		global.beforeEach =
			teaTime.registerHook.bind( this , runtime , 'setup' ) ;
	
	global.teardown =
		global.afterEach =
			teaTime.registerHook.bind( this , runtime , 'teardown' ) ;
	
	global.suiteSetup =
		global.before =
			teaTime.registerHook.bind( this , runtime , 'suiteSetup' ) ;
	
	global.suiteTeardown =
		global.after =
			teaTime.registerHook.bind( this , runtime , 'suiteTeardown' ) ;
	
	teaTime.loadTestFiles( runtime ) ;
	
	teaTime.sortSuite( runtime.suite ) ;
	
	if ( ! runtime.allowConsole ) { teaTime.disableConsole() ; }
	
	// Reporter(s)
	teaTime.createReporters( runtime ) ;
	
	runtime.emit( 'init' ) ;
	
	callback() ;
} ;



teaTime.createReporters = function createReporters( runtime )
{
	var i , iMax , reporter ;
	
	for ( i = 0 , iMax = runtime.reporters.length ; i < iMax ; i ++ )
	{
		reporter = runtime.reporters[ i ] ;
		
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
			
			require( reporter )( runtime ) ;
		}
		catch ( error ) {
			// Continue on error, simply skip this reporter
		}
	}
} ;



teaTime.disableConsole = function disableConsole()
{
	console.log =
		console.error =
		console.assert =
		console.info =
		console.dir =
		console.warn =
		console.trace =
		console.time =
		console.timeEnd =
			function() {} ;
} ;



teaTime.createSuite = function createSuite( name )
{
	var suite = [] ;
	
	Object.defineProperties( suite , {
		name: { value: name } ,
		suiteSetup: { value: [] } ,
		suiteTeardown: { value: [] } ,
		setup: { value: [] } ,
		teardown: { value: [] }
	} ) ;
	
	return suite ;
} ;



teaTime.sortSuite = function sortSuite( suite )
{
	suite.sort( function( a , b ) {
		a = Array.isArray( a ) ? 1 : 0 ;
		b = Array.isArray( b ) ? 1 : 0 ;
		return a - b ;
	} ) ;
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
	runtime.startTime = Date.now() ;
	
	teaTime.runSuite( runtime , runtime.suite , 0 , function() {
		
		runtime.emit( 'report' , runtime.ok , runtime.fail , runtime.skip , Date.now() - runtime.startTime ) ;
		
		if ( runtime.fail ) { runtime.emit( 'errorReport' , runtime.errors ) ; }
		
		runtime.emit( 'exit' ) ;
		process.exit( runtime.fail ? 1 : 0 ) ;
	} ) ;
} ;



teaTime.runSuite = function runSuite( runtime , suite , depth , callback )
{
	//console.log( suite.name , depth ) ;
	
	if ( depth ) { runtime.emit( 'enterSuite' , suite.name , depth - 1 ) ; }
	
	async.series( [
		function( seriesCallback ) {
			teaTime.hook( runtime , suite.suiteSetup , seriesCallback ) ;
		} ,
		async.foreach( suite , function( item , foreachCallback ) {
			
			if ( Array.isArray( item ) )
			{
				teaTime.runSuite( runtime , item , depth + 1 , foreachCallback ) ;
				return ;
			}
			
			runtime.testNameInProgress = typeof item === 'function' ? item.testName : item ;
			
			teaTime.doOneTest( runtime , suite , runtime.testNameInProgress , depth , item , function( error ) {
				// If the bail-out option is set, we should exit here
				foreachCallback() ;
			} ) ;
		} ) ,
		function( seriesCallback ) {
			teaTime.hook( runtime , suite.suiteTeardown , seriesCallback ) ;
		}
	] )
	.fatal( false )
	.exec( function( error ) {
		if ( depth ) { runtime.emit( 'exitSuite' , suite.name , depth - 1 ) ; }
		if ( error ) { callback( error ) ; return ; }
		callback( error ) ;
	} ) ;
} ;



teaTime.doOneTest = function doOneTest( runtime , suite , testName , depth , testFn , callback )
{
	runtime.testInProgress = testName ;
	
	if ( typeof testFn !== 'function' )
	{
		runtime.skip ++ ;
		runtime.emit( 'skip' , testName , depth ) ;
		callback() ;
		return ;
	}
	
	async.series( [
		function( seriesCallback ) {
			teaTime.hook( runtime , suite.setup , seriesCallback ) ;
		} ,
		function( seriesCallback ) {
			if ( testFn.length )
			{
				teaTime.asyncTest( runtime , testName , depth , testFn , seriesCallback ) ;
			}
			else
			{
				teaTime.syncTest( runtime , testName , depth , testFn , seriesCallback ) ;
			}
		} ,
		function( seriesCallback ) {
			teaTime.hook( runtime , suite.teardown , seriesCallback ) ;
		}
	] )
	.fatal( false )
	.exec( callback ) ;
} ;



teaTime.hook = function hook( runtime , hookList , callback )
{
	async.foreach( hookList , function( hookFn , foreachCallback ) {
		
		if ( hookFn.length )
		{
			teaTime.asyncHook( runtime , hookFn , foreachCallback ) ;
		}
		else
		{
			teaTime.syncHook( runtime , hookFn , foreachCallback ) ;
		}
	} )
	.exec( callback ) ;
} ;



teaTime.syncTest = function syncTest( runtime , testName , depth , testFn , callback )
{
	var startTime , time ;
	
	// We need a fresh callstack after each test
	callback = teaTime.freshCallback( callback ) ;
	
	try {
		startTime = Date.now() ;
		testFn() ;
		time = Date.now() - startTime ;
	}
	catch ( error ) {
		time = Date.now() - startTime ;
		runtime.fail ++ ;
		teaTime.patchError( error ) ;
		runtime.errors.push( { name: testName , fn: testFn , error: error } ) ;
		runtime.emit( 'fail' , testName , depth , time , error ) ;
		callback( error ) ;
		return ;
	}
	
	runtime.ok ++ ;
	runtime.emit( 'ok' , testName , depth , time ) ;
	callback() ;
} ;



teaTime.asyncTest = function asyncTest( runtime , testName , depth , testFn , callback )
{
	var startTime , time , callbackTriggered = false ;
	
	//console.log( "Async:" , testName ) ;
	
	// We need a fresh callstack after each test
	callback = teaTime.freshCallback( callback ) ;
	
	var triggerCallback = function triggerCallback( error ) {
		
		if ( callbackTriggered ) { return ; }
		
		time = Date.now() - startTime ;
		callbackTriggered = true ;
		
		process.removeListener( 'uncaughtException' , triggerCallback ) ;
		
		if ( error )
		{
			runtime.fail ++ ;
			teaTime.patchError( error ) ;
			runtime.errors.push( { name: testName , fn: testFn , error: error } ) ;
			runtime.emit( 'fail' , testName , depth , time , error ) ;
			callback( error ) ;
		}
		else
		{
			runtime.ok ++ ;
			runtime.emit( 'ok' , testName , depth , time ) ;
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



teaTime.syncHook = function syncHook( runtime , hookFn , callback )
{
	// We need a fresh callstack after each hook
	callback = teaTime.freshCallback( callback ) ;
	
	try {
		hookFn() ;
	}
	catch ( error ) {
		callback( error ) ;
		return ;
	}
	
	callback() ;
} ;



teaTime.asyncHook = function asyncHook( runtime , hookFn , callback )
{
	var callbackTriggered = false ;
	
	//console.log( "Async hook:" , testName ) ;
	
	// We need a fresh callstack after each hook
	callback = teaTime.freshCallback( callback ) ;
	
	var triggerCallback = function triggerCallback( error ) {
		
		if ( callbackTriggered ) { return ; }
		
		callbackTriggered = true ;
		
		process.removeListener( 'uncaughtException' , triggerCallback ) ;
		
		if ( error ) { callback( error ) ; }
		else { callback() ; }
	} ;
	
	process.once( 'uncaughtException' , triggerCallback ) ;
	
	try {
		hookFn( triggerCallback ) ;
	}
	catch ( error ) {
		triggerCallback( error ) ;
	}
} ;





			/* User-land global functions */



// suite(), describe(), context()
teaTime.registerSuite = function registerSuite( runtime , suiteName , fn )
{
	if ( ! suiteName || typeof suiteName !== 'string' || typeof fn !== 'function' )
	{
		throw new Error( "Usage is suite( name , fn )" ) ;
	}
	
	var parentSuite = runtime.registerStack[ runtime.registerStack.length - 1 ] ;
	
	var suite = teaTime.createSuite( suiteName ) ;
	
	runtime.registerStack.push( suite ) ;
	
	fn() ;
	
	runtime.registerStack.pop() ;
	
	// Only add this suite to its parent if it is not empty
	if ( ! suite.length ) { return ; }
	
	teaTime.sortSuite( suite ) ;
	parentSuite.push( suite ) ;
} ;



// test(), it(), specify()
teaTime.registerTest = function registerTest( runtime , testName , fn )
{
	var i , iMax , j , jMax , found , parentSuite ;
	
	if ( ! testName || typeof testName !== 'string' )
	{
		throw new Error( "Usage is test( name , [fn] )" ) ;
	}
	
	parentSuite = runtime.registerStack[ runtime.registerStack.length - 1 ] ;

	// Filter out tests that are not relevant,
	// each grep should either match the test name or one of the ancestor parent suite.
	for ( i = 0 , iMax = runtime.grep.length ; i < iMax ; i ++ )
	{
		found = false ;
		
		if ( testName.match( runtime.grep[ i ] ) ) { continue ; }
		
		for ( j = 1 , jMax = runtime.registerStack.length ; j < jMax ; j ++ )
		{
			if ( runtime.registerStack[ j ].name.match( runtime.grep[ i ] ) ) { found = true ; break ; }
		}
		
		if ( ! found ) { return ; }
	}
	
	runtime.testCount ++ ;
	
	if ( typeof fn === 'function' )
	{
		Object.defineProperty( fn , 'testName' , { value: testName } ) ;
	}
	else
	{
		fn = testName ;
	}
	
	parentSuite.push( fn ) ;
} ;



// test.skip(), it.skip(), specify.skip()
teaTime.registerSkipTest = function registerSkipTest( runtime , testName , fn )
{
	return teaTime.registerTest( runtime , testName ) ;
} ;



// setup(), suiteSetup(), teardown(), suiteTeardown(), before(), beforeEach(), after(), afterEach()
teaTime.registerHook = function registerHook( runtime , type , fn )
{
	var i , iMax , parentSuite ;
	
	if ( typeof fn !== 'function' )
	{
		throw new Error( "Usage is setup( fn )" ) ;
	}
	
	parentSuite = runtime.registerStack[ runtime.registerStack.length - 1 ] ;
	parentSuite[ type ].push( fn ) ;
} ;





			/* Misc functions */



try {
	// Browsers do not have process.nextTick
	teaTime.microTimeout = process.nextTick ;
}
catch ( error ) {
	teaTime.microTimeout = setTimeout ;
}



// Transform a callback into a fresh callback:
// It use setImmediate() or process.nextTick() to prevent "Maximum call stack"
teaTime.freshCallback = function freshCallback( callback )
{
	var self = this ;
	
	return function() {
		var args = arguments ;
		teaTime.microTimeout( function() {
			callback.apply( self , args ) ;
		} ) ;
	} ;
} ;



// Remove the framework from the stack trace
teaTime.patchError = function patchError( error )
{
	var i , iMax , stack ;
	
	if ( ! error.stack ) { return ; }
	
	stack = error.stack ;
	if ( ! Array.isArray( stack ) ) { stack = error.stack.split( '\n' ) ; }
	
	for ( i = 0 , iMax = stack.length ; i < iMax ; i ++ )
	{
		// This is a bit hacky, but well... 
		if ( stack[ i ].match( /(^|\/)tea-time\.js/ ) )
		{
			stack = stack.slice( 0 , i ) ;
			break ;
		}
	}
	
	error.stack = stack.join( '\n' ) ;
} ;


