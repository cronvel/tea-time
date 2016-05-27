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



// Load modules
var async = require( 'async-kit' ) ;
var termkit = require( 'terminal-kit' ) ;
var term = termkit.terminal ;
var string = require( 'string-kit' ) ;
var minimist = require( 'minimist' ) ;
var glob = require( 'glob' ) ;

var teaTimePackage = require( '../package.json' ) ;

//var Events = require( 'events' ) ;
var NGEvents = require( 'nextgen-events' ) ;
var path = require( 'path' ) ;



function TeaTime() { throw new Error( 'Use TeaTime.create() instead' ) ; }
TeaTime.prototype = Object.create( NGEvents.prototype ) ;
TeaTime.prototype.constructor = TeaTime ;

module.exports = TeaTime ;



TeaTime.diff = require( './diff.js' ) ;


TeaTime.cli = function cli()
{
	var i , iMax , args , v , options = {} ;
	
	// Manage command line arguments
	args = minimist( process.argv.slice( 2 ) ) ;
	
	if ( args.h || args.help )
	{
		TeaTime.usage() ;
		return ;
	}
	
	if ( args.c || args.console ) { options.allowConsole = true ; }
	
	if ( args.b || args.bail ) { options.bail = true ; }
	
	if ( args.timeout && ( v = parseInt( args.timeout , 10 ) ) ) { options.timeout = v ; }
	else if ( args.t && ( v = parseInt( args.t , 10 ) ) ) { options.timeout = v ; }
	
	if ( args.slow && ( v = parseInt( args.slow , 10 ) ) ) { options.slowTime = v ; }
	else if ( args.s && ( v = parseInt( args.s , 10 ) ) ) { options.slowTime = v ; }
	
	if ( args.reporter )
	{
		if ( ! Array.isArray( args.reporter ) ) { args.reporter = [ args.reporter ] ; }
		options.reporters = args.reporter ;
		
		if ( args.R )
		{
			if ( ! Array.isArray( args.R ) ) { args.R = [ args.R ] ; }
			options.reporter = args.reporter.concat( args.R ) ;
		}
		else
		{
			options.reporters = args.reporter ;
		}
	}
	else if ( args.R )
	{
		if ( ! Array.isArray( args.R ) ) { args.R = [ args.R ] ; }
		options.reporters = args.R ;
	}
	else
	{
		options.reporters = [ 'classic' ] ;
	}
	
	// Turn string into regexp for the "grep" feature
	if ( args.g )
	{
		if ( ! Array.isArray( args.g ) ) { args.g = [ args.g ] ; }
		
		for ( i = 0 , iMax = args.g.length ; i < iMax ; i ++ )
		{
			options.grep[ i ] = new RegExp( args.g[ i ] , 'i' ) ;
		}
	}
	
	if ( args._.length )
	{
		options.testFiles = args._ ;
	}
	
	var teaTime = TeaTime.create( options ) ;
	
	teaTime.init( function() {
		teaTime.run() ;
	} ) ;
} ;



TeaTime.create = function createTeaTime( options )
{
	var i , iMax , args , v ;
	
	var self = Object.create( TeaTime.prototype , {
		timeout: { value: options.timeout || 2000 , writable: true , enumerable: true } ,
		slowTime: { value: options.slowTime || 75 , writable: true , enumerable: true } ,
		suite: { value: TeaTime.createSuite() , enumerable: true } ,
		grep: { value: Array.isArray( options.grep ) ? options.grep : [] , writable: true , enumerable: true } ,
		allowConsole: { value: !! options.allowConsole , writable: true , enumerable: true } ,
		bail: { value: !! options.bail , writable: true , enumerable: true } ,
		reporters: { value: Array.isArray( options.reporters ) ? options.reporters : [] , writable: true , enumerable: true } ,
		testFiles: { value: Array.isArray( options.testFiles ) ? options.testFiles : [] , writable: true , enumerable: true } ,
		
		startTime: { value: 0 , writable: true , enumerable: true } ,
		testCount: { value: 0 , writable: true , enumerable: true } ,
		done: { value: 0 , writable: true , enumerable: true } ,
		ok: { value: 0 , writable: true , enumerable: true } ,
		fail: { value: 0 , writable: true , enumerable: true } ,
		skip: { value: 0 , writable: true , enumerable: true } ,
		errors: { value: [] , enumerable: true } ,
		
		intoSuiteIndex: { value: -1 , writable: true , enumerable: true } ,
	} ) ;
	
	Object.defineProperties( self , {
		registerStack: { value: [ self.suite ] , writable: true , enumerable: true } ,
	} ) ;
	
	return self ;
} ;



TeaTime.usage = function usage()
{
	term.blue( "Usage is: tea-time [<files>] [<option1>] [<option2>] [...]\n" ) ;
	term.blue( "Available options:\n" ) ;
	term.blue( "  -t , --timeout <time>        Timeout (default: 2000ms)\n" ) ;
	term.blue( "  -s , --slow <time>           Slow time (default: 75ms)\n" ) ;
	term.blue( "  -g <pattern>                 Grep: filter in tests/suites by this pattern\n" ) ;
	term.blue( "  -c , --console               Allow console.log() and friends\n" ) ;
	term.blue( "  -b , --bail                  Bail after first test failure\n" ) ;
	term.blue( "  -R , --reporter <name>       Set the reporter\n" ) ;
	term.blue( "  -h , --help                  Show this help\n" ) ;
	term.blue( "\n" ) ;
} ;



TeaTime.prototype.init = function init( runtime , callback )
{
	// Register to global
	global.suite =
		global.describe =
		global.context = TeaTime.registerSuite.bind( this , runtime ) ;
	
	global.test =
		global.it =
		global.specify =
			TeaTime.registerTest.bind( this , runtime ) ;
	
	global.test.skip = TeaTime.registerSkipTest.bind( this , runtime ) ;
	
	global.setup =
		global.beforeEach =
			TeaTime.registerHook.bind( this , runtime , 'setup' ) ;
	
	global.teardown =
		global.afterEach =
			TeaTime.registerHook.bind( this , runtime , 'teardown' ) ;
	
	global.suiteSetup =
		global.before =
			TeaTime.registerHook.bind( this , runtime , 'suiteSetup' ) ;
	
	global.suiteTeardown =
		global.after =
			TeaTime.registerHook.bind( this , runtime , 'suiteTeardown' ) ;
	
	TeaTime.loadTestFiles( runtime ) ;
	
	TeaTime.sortSuite( runtime.suite ) ;
	
	if ( ! runtime.allowConsole ) { TeaTime.disableConsole() ; }
	
	// Reporter(s)
	TeaTime.createReporters( runtime ) ;
	
	runtime.emit( 'init' ) ;
	
	callback() ;
} ;



TeaTime.prototype.createReporters = function createReporters( runtime )
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
			console.error( "Error loading this reporter:" , reporter , error ) ;
		}
	}
} ;



TeaTime.prototype.disableConsole = function disableConsole()
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



TeaTime.prototype.createSuite = function createSuite( name )
{
	var suite = [] ;
	
	Object.defineProperties( suite , {
		name: { value: name } ,
		parent: { value: null , writable: true } ,
		suiteSetup: { value: [] } ,
		suiteTeardown: { value: [] } ,
		setup: { value: [] } ,
		teardown: { value: [] }
	} ) ;
	
	return suite ;
} ;



TeaTime.prototype.sortSuite = function sortSuite( suite )
{
	suite.sort( function( a , b ) {
		var va = Array.isArray( a ) ? 1 : 0 ;
		var vb = Array.isArray( b ) ? 1 : 0 ;
		if ( va - vb ) { return va - vb ; }
		return a.order - b.order ;
	} ) ;
} ;



TeaTime.prototype.loadTestFiles = function loadTestFiles( runtime )
{
	var i , iMax ;
	
	if ( ! runtime.testFiles ) { TeaTime.testFilesFromPackage( runtime ) ; }
	else { TeaTime.expandTestFiles( runtime ) ; }
	
	// Load all test files
	try {
		for ( i = 0 , iMax = runtime.testFiles.length ; i < iMax ; i ++ )
		{
			require( runtime.testFiles[ i ] ) ;
		}
	}
	catch ( error ) {
		TeaTime.exitError( "Error in the test file '" + runtime.testFiles[ i ] + "': %E\n" , error ) ;
	}
} ;



// Expand using glob on all command line file arguments
TeaTime.prototype.expandTestFiles = function expandTestFiles( runtime )
{
	var i , iMax , testFiles = [] ;
	
	for ( i = 0 , iMax = runtime.testFiles.length ; i < iMax ; i ++ )
	{
		testFiles = testFiles.concat( glob.sync( process.cwd() + '/' + runtime.testFiles ) ) ;
	}
	
	runtime.testFiles = testFiles ;
} ;



// Get files using package.json
TeaTime.prototype.testFilesFromPackage = function testFilesFromPackage( runtime )
{
	var package_ ;
	
	// Require the package.json (mandatory)
	try {
		package_ = require( process.cwd() + '/package.json' ) ;
	}
	catch ( error ) {
		if ( error.code === 'MODULE_NOT_FOUND' ) { TeaTime.exitError( "No package.json found.\n" ) ; }
		else { TeaTime.exitError( "Error in the package.json: %E\n" , error ) ; }
	}
	
	// Get the bench directory
	if ( ! package_.directories || ! package_.directories.test )
	{
		TeaTime.exitError( "The package.json miss a directories.test path, set to the directory containing test files.\n" ) ;
	}
	
	runtime.testFiles = glob.sync( process.cwd() + '/' + package_.directories.test + '/*js' ) ;
} ;



TeaTime.prototype.exit = function exit( fail )
{
	process.exit( fail ? 1 : 0 ) ;
} ;



TeaTime.prototype.exitError = function exitError()
{
	var message = string.format.apply( null , arguments ) ;
	
	term.bold.red( message ) ;
	
	process.exit( 1 ) ;
} ;



TeaTime.prototype.run = function run( runtime )
{
	runtime.startTime = Date.now() ;
	
	TeaTime.runSuite( runtime , runtime.suite , 0 , function() {
		
		runtime.emit( 'report' , runtime.ok , runtime.fail , runtime.skip , Date.now() - runtime.startTime ) ;
		
		if ( runtime.fail ) { runtime.emit( 'errorReport' , runtime.errors ) ; }
		
		runtime.emit( 'exit' , TeaTime.exit.bind( undefined , runtime.fail ) ) ;
		
		// Exit anyway after 10 seconds
		setTimeout( TeaTime.exit.bind( undefined , runtime.fail ) , 10000 ) ;
	} ) ;
} ;



TeaTime.prototype.runSuite = function runSuite( runtime , suite , depth , callback )
{
	if ( depth ) { runtime.emit( 'enterSuite' , suite.name , depth - 1 ) ; }
	
	var triggerCallback = function( error ) {
		if ( depth ) { runtime.emit( 'exitSuite' , suite.name , depth - 1 ) ; }
		callback( error ) ;
	} ;
	
	TeaTime.runHooks( runtime , suite.suiteSetup , depth , function( suiteSetupError ) {
		
		if ( suiteSetupError )
		{
			TeaTime.patchError( suiteSetupError ) ;
			
			runtime.errors.push( {
				name: suiteSetupError.hookFn.hookName + '[' + suiteSetupError.hookFn.hookType + ']' ,
				type: suiteSetupError.hookFn.hookType ,
				fn: suiteSetupError.hookFn ,
				error: suiteSetupError
			} ) ;
			
			TeaTime.failSuite( runtime , suite , depth , 'suiteSetup' , suiteSetupError.hookFn , suiteSetupError ) ;
			
			// Run teardown anyway?
			TeaTime.runHooks( runtime , suite.suiteTeardown , depth , function( suiteTeardownError ) {
				triggerCallback( suiteSetupError ) ;
			} ) ;
			return ;
		}
		
		TeaTime.runSuiteTests( runtime , suite , depth , function( suiteTestsError , suiteTestsResults ) {
			TeaTime.runHooks( runtime , suite.suiteTeardown , depth , function( suiteTeardownError ) {
				if ( suiteTestsError )
				{
					triggerCallback( suiteTestsError ) ;
				}
				else if ( suiteTeardownError )
				{
					TeaTime.patchError( suiteTeardownError ) ;
					
					runtime.errors.push( {
						name: suiteTeardownError.hookFn.hookName + '[' + suiteTeardownError.hookFn.hookType + ']' ,
						type: suiteTeardownError.hookFn.hookType ,
						fn: suiteTeardownError.hookFn ,
						error: suiteTeardownError
					} ) ;
					
					triggerCallback( suiteTeardownError ) ;
				}
				else
				{
					triggerCallback() ;
				}
			} ) ;
		} ) ;
	} ) ;
} ;



TeaTime.prototype.runSuiteTests = function runSuiteTests( runtime , suite , depth , callback )
{
	async.foreach( suite , function( item , foreachCallback ) {
		
		if ( Array.isArray( item ) )
		{
			TeaTime.runSuite( runtime , item , depth + 1 , foreachCallback ) ;
			return ;
		}
		
		TeaTime.runTest( runtime , suite , depth , item , foreachCallback ) ;
	} )
	.fatal( runtime.bail )
	.exec( callback ) ;
} ;



TeaTime.prototype.failSuite = function failSuite( runtime , suite , depth , errorType , errorFn , error )
{
	var i , iMax ;
	
	for ( i = 0 , iMax = suite.length ; i < iMax ; i ++ )
	{
		if ( Array.isArray( suite[ i ] ) )
		{
			TeaTime.failSuite( runtime , suite[ i ] , depth + 1 , errorType , errorFn , error ) ;
		}
		
		runtime.done ++ ;
		runtime.fail ++ ;
		runtime.emit( 'fail' , suite[ i ].testName , depth , undefined , undefined , error ) ;
	}
} ;



TeaTime.prototype.runTest = function runTest( runtime , suite , depth , testFn , callback )
{
	// /!\ Useful?
	runtime.testInProgress = testFn ;
	
	
	// Early exit, if the functions should be skipped
	if ( typeof testFn !== 'function' )
	{
		runtime.done ++ ;
		runtime.skip ++ ;
		runtime.emit( 'skip' , testFn.testName , depth ) ;
		callback() ;
		return ;
	}
	
	
	// Inherit parent's setup/teardown
	var ancestor = suite , setup = suite.setup , teardown = suite.teardown ;
	
	while ( ancestor.parent )
	{
		ancestor = ancestor.parent ;
		setup = ancestor.setup.concat( setup ) ;
		teardown = ancestor.teardown.concat( teardown ) ;
	}
	
	
	// Sync or async?
	var testWrapper = testFn.length ? TeaTime.asyncTest : TeaTime.syncTest ;
	
	
	// Finishing
	var triggerCallback = function( error , time , slow , errorType ) {
		
		if ( error )
		{
			runtime.done ++ ;
			runtime.fail ++ ;
			TeaTime.patchError( error ) ;
			
			runtime.errors.push( {
				name: 
					( error.hookFn ? error.hookFn.hookName + '[' + error.hookFn.hookType + '] ' : '' ) +
					testFn.testName ,
				type: errorType ,
				fn: testFn ,
				error: error
			} ) ;
			
			runtime.emit( 'fail' , testFn.testName , depth , time , slow , error ) ;
			callback( error ) ;
		}
		else
		{
			runtime.done ++ ;
			runtime.ok ++ ;
			runtime.emit( 'ok' , testFn.testName , depth , time , slow ) ;
			callback() ;
		}
	} ;
	
	
	// Async flow
	TeaTime.runHooks( runtime , setup , depth , function( setupError ) {
		
		if ( setupError )
		{
			// Run teardown anyway?
			TeaTime.runHooks( runtime , teardown , depth , function( teardownError ) {
				triggerCallback( setupError , undefined , undefined , 'setup' ) ;
			} ) ;
			return ;
		}
		
		runtime.emit( 'enterTest' , testFn.testName , depth ) ;

		testWrapper( runtime , testFn , function( testError , time , slow ) {
			
			runtime.emit( 'exitTest' , testFn.testName , depth ) ;
			
			TeaTime.runHooks( runtime , teardown , depth , function( teardownError , teardownResults ) {
				
				if ( testError )
				{
					triggerCallback( testError , time , slow , 'test' , testFn ) ;
				}
				else if ( teardownError )
				{
					triggerCallback( teardownError , time , slow , 'teardown' , teardownResults[ teardownResults.length - 1 ][ 2 ] ) ;
				}
				else
				{
					triggerCallback( undefined , time , slow ) ;
				}
			} ) ;
		} ) ;
	} ) ;
} ;



TeaTime.prototype.syncTest = function syncTest( runtime , testFn , callback )
{
	var startTime , time , slowTime = runtime.slowTime ;
	
	// We need a fresh callstack after each test
	callback = TeaTime.freshCallback( callback ) ;
	
	var context = {
		timeout: function() {} ,	// Does nothing in sync mode
		slow: function( slowTime_ ) { slowTime = slowTime_ ; }
	} ;
	
	try {
		startTime = Date.now() ;
		testFn() ;
		time = Date.now() - startTime ;
	}
	catch ( error ) {
		time = Date.now() - startTime ;
		callback( error , time , Math.floor( time / slowTime ) ) ;
		return ;
	}
	
	callback( undefined , time , Math.floor( time / slowTime ) ) ;
} ;



TeaTime.prototype.asyncTest = function asyncTest( runtime , testFn , callback )
{
	var startTime , time , callbackTriggered = false , timer = null , slowTime = runtime.slowTime ;
	
	// We need a fresh callstack after each test
	callback = TeaTime.freshCallback( callback ) ;
	
	var context = {
		timeout: function( timeout ) {
			if ( callbackTriggered ) { return ; }
			if ( timer ) { clearTimeout( timer ) ; timer = null ; }
			timer = setTimeout( triggerCallback.bind( undefined , new Error( 'Test timeout (local)' ) ) , timeout ) ;
		} ,
		slow: function( slowTime_ ) { slowTime = slowTime_ ; }
	} ;
	
	var triggerCallback = function triggerCallback( error ) {
		
		if ( callbackTriggered ) { return ; }
		
		time = Date.now() - startTime ;
		callbackTriggered = true ;
		if ( timer ) { clearTimeout( timer ) ; timer = null ; }
		
		process.removeListener( 'uncaughtException' , triggerCallback ) ;
		
		callback( error , time , Math.floor( time / slowTime ) ) ;
	} ;
	
	process.once( 'uncaughtException' , triggerCallback ) ;
	
	// Should come before running the test, or it would override the user-set timeout
	timer = setTimeout( triggerCallback.bind( undefined , new Error( 'Test timeout' ) ) , runtime.timeout ) ;
	
	try {
		startTime = Date.now() ;
		testFn.call( context , triggerCallback ) ;
	}
	catch ( error ) {
		triggerCallback( error ) ;
	}
} ;



TeaTime.prototype.runHooks = function runHooks( runtime , hookList , depth , callback )
{
	async.foreach( hookList , function( hookFn , foreachCallback ) {
		
		// Sync or async?
		var hookWrapper = hookFn.length ? TeaTime.asyncHook : TeaTime.syncHook ;
		
		runtime.emit( 'enterHook' , hookFn.hookType , hookFn.hookName , depth ) ;
		
		hookWrapper( runtime , hookFn , function( error ) {
			runtime.emit( 'exitHook' , hookFn.hookType , hookFn.hookName , depth ) ;
			if ( error ) { error.hookFn = hookFn ; }
			foreachCallback( error ) ;
		} ) ;
	} )
	.fatal( true )
	.exec( callback ) ;
} ;



TeaTime.prototype.syncHook = function syncHook( runtime , hookFn , callback )
{
	// We need a fresh callstack after each hook
	callback = TeaTime.freshCallback( callback ) ;
	
	try {
		hookFn() ;
	}
	catch ( error ) {
		callback( error ) ;
		return ;
	}
	
	callback() ;
} ;



TeaTime.prototype.asyncHook = function asyncHook( runtime , hookFn , callback )
{
	var callbackTriggered = false ;
	
	// We need a fresh callstack after each hook
	callback = TeaTime.freshCallback( callback ) ;
	
	var triggerCallback = function triggerCallback( error ) {
		
		if ( callbackTriggered ) { return ; }
		
		callbackTriggered = true ;
		
		process.removeListener( 'uncaughtException' , triggerCallback ) ;
		
		callback( error ) ;
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
TeaTime.prototype.registerSuite = function registerSuite( runtime , suiteName , fn )
{
	if ( ! suiteName || typeof suiteName !== 'string' || typeof fn !== 'function' )
	{
		throw new Error( "Usage is suite( name , fn )" ) ;
	}
	
	var parentSuite = runtime.registerStack[ runtime.registerStack.length - 1 ] ;
	
	var suite = TeaTime.createSuite( suiteName ) ;
	
	runtime.registerStack.push( suite ) ;
	
	fn() ;
	
	runtime.registerStack.pop() ;
	
	// Only add this suite to its parent if it is not empty
	if ( ! suite.length ) { return ; }
	
	Object.defineProperties( suite , {
		order: { value: parentSuite.length }
	} ) ;
	
	TeaTime.sortSuite( suite ) ;
	parentSuite.push( suite ) ;
	Object.defineProperty( suite , 'parent' , { value: parentSuite } ) ;
} ;



// test(), it(), specify()
TeaTime.prototype.registerTest = function registerTest( runtime , testName , fn )
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
	
	if ( typeof fn !== 'function' ) { fn = {} ; }
	
	Object.defineProperties( fn , {
		testName: { value: testName } ,
		order: { value: parentSuite.length }
	} ) ;
	
	parentSuite.push( fn ) ;
} ;



// test.skip(), it.skip(), specify.skip()
TeaTime.prototype.registerSkipTest = function registerSkipTest( runtime , testName , fn )
{
	return TeaTime.registerTest( runtime , testName ) ;
} ;



// setup(), suiteSetup(), teardown(), suiteTeardown(), before(), beforeEach(), after(), afterEach()
TeaTime.prototype.registerHook = function registerHook( runtime , type , hookName , fn )
{
	var parentSuite ;
	
	if ( typeof hookName === 'function' )
	{
		fn = hookName ;
		hookName = undefined ;
	}
	else if ( typeof fn !== 'function' )
	{
		throw new Error( "Usage is hook( [name] , fn )" ) ;
	}
	
	Object.defineProperties( fn , {
		hookName: { value: hookName || fn.name || '[no name]' } ,
		hookType: { value: type } 
	} ) ;
	
	parentSuite = runtime.registerStack[ runtime.registerStack.length - 1 ] ;
	parentSuite[ type ].push( fn ) ;
} ;





			/* Misc functions */



try {
	// Browsers do not have process.nextTick
	TeaTime.microTimeout = process.nextTick ;
}
catch ( error ) {
	TeaTime.microTimeout = setTimeout ;
}



// Transform a callback into a fresh callback:
// It use setImmediate() or process.nextTick() to prevent "Maximum call stack"
TeaTime.prototype.freshCallback = function freshCallback( callback )
{
	var self = this ;
	
	return function() {
		var args = arguments ;
		TeaTime.microTimeout( function() {
			callback.apply( self , args ) ;
		} ) ;
	} ;
} ;



// Remove the framework from the stack trace
TeaTime.prototype.patchError = function patchError( error )
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


