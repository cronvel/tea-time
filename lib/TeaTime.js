/*
	Tea Time!

	Copyright (c) 2015 - 2018 Cédric Ronvel

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



// It should load before anything else,
// so nothing can get a timer function without it being patched
var NGEvents = require( 'nextgen-events' ) ;
var asyncTryCatch = require( 'async-try-catch' ) ;
asyncTryCatch.substitute() ;
var asyncTry = asyncTryCatch.try ;

var async = require( 'async-kit' ) ;
var Cover = require( './Cover.js' ) ;



function TeaTime( options ) {
	Object.defineProperties( this , {
		timeout: { value: options.timeout || 2000 , writable: true , enumerable: true } ,
		slowTime: { value: options.slowTime || 75 , writable: true , enumerable: true } ,
		suite: { value: TeaTime.createSuite() , enumerable: true } ,
		grep: { value: Array.isArray( options.grep ) ? options.grep : [] , writable: true , enumerable: true } ,
		allowConsole: { value: !! options.allowConsole , writable: true , enumerable: true } ,
		bail: { value: !! options.bail , writable: true , enumerable: true } ,
		skipOptional: { value: !! options.skipOptional , writable: true , enumerable: true } ,
		cover: { value: options.cover && Cover.create( options.cover ) , writable: true , enumerable: true } ,

		token: { value: options.token || null , writable: true , enumerable: true } , // for slave instance
		acceptTokens: { value: options.acceptTokens || null , writable: true , enumerable: true } , // for master instance

		startTime: { value: 0 , writable: true , enumerable: true } ,
		testCount: { value: 0 , writable: true , enumerable: true } ,
		done: { value: 0 , writable: true , enumerable: true } ,
		ok: { value: 0 , writable: true , enumerable: true } ,
		fail: { value: 0 , writable: true , enumerable: true } ,
		optionalFail: { value: 0 , writable: true , enumerable: true } ,
		skip: { value: 0 , writable: true , enumerable: true } ,
		errors: { value: [] , enumerable: true } ,
		orphanError: { value: null , enumerable: true , writable: true } ,

		microTimeout: { value: options.microTimeout , enumerable: true } ,
		onceUncaughtException: { value: options.onceUncaughtException , enumerable: true } ,
		offUncaughtException: { value: options.offUncaughtException , enumerable: true }
	} ) ;

	Object.defineProperties( this , {
		registerStack: { value: [ this.suite ] , writable: true , enumerable: true }
	} ) ;
}

TeaTime.prototype = Object.create( NGEvents.prototype ) ;
TeaTime.prototype.constructor = TeaTime ;

module.exports = TeaTime ;



// Backward compatibility
TeaTime.create = ( ... args ) => new TeaTime( ... args ) ;



var reporterAliases = {
	"oneline": "one-line" ,
	"one": "one-line" ,
	"error": "error-report" ,
	"err": "error-report" ,
	"coverage": "coverage-report" ,
	"cov": "coverage-report" ,
	"cov-sum": "coverage-summary" ,
	"wcom": "warning-comments-report" ,
	"wcom-sum": "warning-comments-summary" ,
	"pan": "panel" ,
	"bar": "progress"
} ;



// CLI and browser share the same args
TeaTime.populateOptionsWithArgs = function populateOptionsWithArgs( options , args ) {
	var i , iMax , v ;

	options.cover = args.cover || args.C ;

	if ( ! options.reporters ) {
		if ( options.cover ) { options.reporters = [ 'classic' , 'coverage-report' , 'warning-comments-summary' ] ; }
		else { options.reporters = [ 'classic' ] ; }
	}

	if ( ! options.clientReporters ) { options.clientReporters = [ 'classic' ] ; }

	if ( args.console !== undefined ) { options.allowConsole = args.console ; }
	else if ( args.c !== undefined ) { options.allowConsole = args.c ; }

	if ( args.b || args.bail ) { options.bail = true ; }

	if ( args['skip-optional'] || args.O ) { options.skipOptional = true ; }

	if ( args.timeout && ( v = parseInt( args.timeout , 10 ) ) ) { options.timeout = v ; }
	else if ( args.t && ( v = parseInt( args.t , 10 ) ) ) { options.timeout = v ; }

	if ( args.slow && ( v = parseInt( args.slow , 10 ) ) ) { options.slowTime = v ; }
	else if ( args.s && ( v = parseInt( args.s , 10 ) ) ) { options.slowTime = v ; }


	if ( args.reporter ) {
		if ( ! Array.isArray( args.reporter ) ) { args.reporter = [ args.reporter ] ; }
		options.reporters = args.reporter ;

		if ( args.R ) {
			if ( ! Array.isArray( args.R ) ) { args.R = [ args.R ] ; }
			options.reporters = args.reporter.concat( args.R ) ;
		}
	}
	else if ( args.R ) {
		if ( ! Array.isArray( args.R ) ) { args.R = [ args.R ] ; }
		options.reporters = args.R ;
	}

	// Manage reporter aliases
	options.reporters = options.reporters.map( ( r ) => { return reporterAliases[ r ] || r ; } ) ;


	if ( args.clientReporter ) {
		if ( ! Array.isArray( args.clientReporter ) ) { args.clientReporter = [ args.clientReporter ] ; }
		options.clientReporters = args.clientReporter ;
	}


	// Turn string into regexp for the "grep" feature
	options.grep = [] ;
	options.sourceGrep = [] ;

	if ( ! args.grep ) { args.grep = [] ; }
	else if ( args.grep && ! Array.isArray( args.grep ) ) { args.grep = [ args.grep ] ; }

	if ( args.g ) { args.grep = args.grep.concat( args.g ) ; }

	for ( i = 0 , iMax = args.grep.length ; i < iMax ; i ++ ) {
		options.grep.push( new RegExp( args.grep[ i ] , 'i' ) ) ;
		options.sourceGrep.push( args.grep[ i ] ) ;
	}


	if ( args.token ) { options.token = args.token ; }
} ;



TeaTime.prototype.init = function init( callback ) {
	// Register to global
	global.asyncTry = asyncTry ;

	global.suite =
		global.describe =
		global.context = TeaTime.registerSuite.bind( this ) ;

	global.test =
		global.it =
		global.specify =
			TeaTime.registerTest.bind( this ) ;

	global.test.skip = TeaTime.registerSkipTest.bind( this ) ;

	global.test.optional = TeaTime.registerOptionalTest.bind( this ) ;
	global.test.opt = TeaTime.registerOptionalTest.bind( this ) ;
	global.test.next = TeaTime.registerOptionalTest.bind( this ) ;

	global.setup =
		global.beforeEach =
			TeaTime.registerHook.bind( this , 'setup' ) ;

	global.teardown =
		global.afterEach =
			TeaTime.registerHook.bind( this , 'teardown' ) ;

	global.suiteSetup =
		global.before =
			TeaTime.registerHook.bind( this , 'suiteSetup' ) ;

	global.suiteTeardown =
		global.after =
			TeaTime.registerHook.bind( this , 'suiteTeardown' ) ;

	if ( ! this.allowConsole ) { TeaTime.disableConsole() ; }
} ;



TeaTime.disableConsole = function disableConsole() {
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



TeaTime.createSuite = function createSuite( name ) {
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



TeaTime.sortSuite = function sortSuite( suite ) {
	suite.sort( ( a , b ) => {
		var va = Array.isArray( a ) ? 1 : 0 ;
		var vb = Array.isArray( b ) ? 1 : 0 ;
		if ( va - vb ) { return va - vb ; }
		return a.order - b.order ;
	} ) ;
} ;



TeaTime.prototype.run = function run( callback ) {
	var callbackTriggered = false ;

	TeaTime.sortSuite( this.suite ) ;

	this.emit( 'ready' , () => {

		this.emit( 'start' , this.testCount ) ;

		var triggerCallback = () => {
			if ( callbackTriggered ) { return ; }
			if ( typeof callback === 'function' ) { callback() ; }
		} ;

		// Start coverage tracking NOW!
		if ( this.cover ) { this.cover.start() ; }

		this.startTime = Date.now() ;

		this.runSuite( this.suite , 0 , () => {

			var duration = Date.now() - this.startTime ;
			var coverage ;

			if ( this.cover ) { coverage = this.cover.getCoverage() ; }

			this.emit( 'report' , this.ok , this.fail , this.optionalFail , this.skip , coverage && coverage.rate , duration ) ;

			if ( this.fail + this.optionalFail ) { this.emit( 'errorReport' , this.errors ) ; }

			if ( this.cover ) { this.emit( 'coverageReport' , coverage ) ; }

			this.emit( 'end' ) ;
			this.emit( 'exit' , triggerCallback ) ;

			// Exit anyway after 10 seconds
			setTimeout( triggerCallback , 10000 ) ;
		} ) ;
	} ) ;
} ;



TeaTime.prototype.runSuite = function runSuite( suite , depth , callback ) {
	if ( depth ) { this.emit( 'enterSuite' , suite.name , depth - 1 ) ; }

	var triggerCallback = error => {
		if ( depth ) { this.emit( 'exitSuite' , suite.name , depth - 1 ) ; }
		callback( error ) ;
	} ;

	this.runHooks( suite.suiteSetup , depth , ( suiteSetupError ) => {

		if ( suiteSetupError ) {
			this.patchError( suiteSetupError ) ;

			this.errors.push( {
				name: suiteSetupError.hookFn.hookName + '[' + suiteSetupError.hookFn.hookType + ']' ,
				type: suiteSetupError.hookFn.hookType ,
				fn: suiteSetupError.hookFn ,
				error: suiteSetupError
			} ) ;

			this.failSuite( suite , depth , 'suiteSetup' , suiteSetupError.hookFn , suiteSetupError ) ;

			// Run teardown anyway?
			this.runHooks( suite.suiteTeardown , depth , ( suiteTeardownError ) => {
				triggerCallback( suiteSetupError ) ;
			} ) ;
			return ;
		}

		this.runSuiteTests( suite , depth , ( suiteTestsError ) => {
			this.runHooks( suite.suiteTeardown , depth , ( suiteTeardownError ) => {
				if ( suiteTestsError ) {
					triggerCallback( suiteTestsError ) ;
				}
				else if ( suiteTeardownError ) {
					this.patchError( suiteTeardownError ) ;

					this.errors.push( {
						name: suiteTeardownError.hookFn.hookName + '[' + suiteTeardownError.hookFn.hookType + ']' ,
						type: suiteTeardownError.hookFn.hookType ,
						fn: suiteTeardownError.hookFn ,
						error: suiteTeardownError
					} ) ;

					triggerCallback( suiteTeardownError ) ;
				}
				else {
					triggerCallback() ;
				}
			} ) ;
		} ) ;
	} ) ;
} ;



TeaTime.prototype.runSuiteTests = function runSuiteTests( suite , depth , callback ) {
	async.foreach( suite , ( item , foreachCallback ) => {

		if ( Array.isArray( item ) ) {
			this.runSuite( item , depth + 1 , foreachCallback ) ;
			return ;
		}

		this.runTest( suite , depth , item , foreachCallback ) ;
	} )
	.fatal( this.bail )
	.exec( callback ) ;
} ;



TeaTime.prototype.failSuite = function failSuite( suite , depth , errorType , errorFn , error ) {
	var i , iMax ;

	for ( i = 0 , iMax = suite.length ; i < iMax ; i ++ ) {
		if ( Array.isArray( suite[ i ] ) ) {
			this.failSuite( suite[ i ] , depth + 1 , errorType , errorFn , error ) ;
		}

		this.done ++ ;
		this.fail ++ ;
		this.emit( 'fail' , suite[ i ].testName , depth , undefined , undefined , error ) ;
	}
} ;



TeaTime.prototype.runTest = function runTest( suite , depth , testFn , callback ) {
	// /!\ Useful?
	this.testInProgress = testFn ;


	// Early exit, if the functions should be skipped
	if ( typeof testFn !== 'function' ) {
		this.done ++ ;
		this.skip ++ ;
		this.emit( 'skip' , testFn.testName , depth ) ;
		callback() ;
		return ;
	}


	// Inherit parent's setup/teardown
	var ancestor = suite , setup = suite.setup , teardown = suite.teardown ;

	while ( ancestor.parent ) {
		ancestor = ancestor.parent ;
		setup = ancestor.setup.concat( setup ) ;
		teardown = ancestor.teardown.concat( teardown ) ;
	}


	// Sync or async?
	var testWrapper = testFn.length ? TeaTime.asyncTest.bind( this ) : TeaTime.syncTest.bind( this ) ;


	// Finishing
	var triggerCallback = ( error , time , slow , errorType ) => {

		if ( error ) {
			this.done ++ ;
			this.patchError( error ) ;

			this.errors.push( {
				name:
					( error.hookFn ? error.hookFn.hookName + '[' + error.hookFn.hookType + '] ' : '' ) +
					testFn.testName ,
				type: errorType ,
				fn: testFn ,
				optional: testFn.optional ,
				error: error
			} ) ;

			if ( testFn.optional ) {
				this.optionalFail ++ ;
				this.emit( 'optionalFail' , testFn.testName , depth , time , slow , error ) ;
			}
			else {
				this.fail ++ ;
				this.emit( 'fail' , testFn.testName , depth , time , slow , error ) ;
			}

			callback( error ) ;
		}
		else {
			this.done ++ ;
			this.ok ++ ;
			this.emit( 'ok' , testFn.testName , depth , time , slow ) ;
			callback() ;
		}
	} ;


	// Async flow
	this.runHooks( setup , depth , ( setupError ) => {

		if ( setupError ) {
			// Run teardown anyway?
			this.runHooks( teardown , depth , ( teardownError ) => {
				triggerCallback( setupError , undefined , undefined , 'setup' ) ;
			} ) ;
			return ;
		}

		this.orphanError = null ;
		this.emit( 'enterTest' , testFn.testName , depth ) ;

		testWrapper( testFn , ( testError , time , slow ) => {

			this.emit( 'exitTest' , testFn.testName , depth , time , slow , testError ) ;

			this.runHooks( teardown , depth , ( teardownError , teardownResults ) => {

				if ( testError ) {
					triggerCallback( testError , time , slow , 'test' , testFn ) ;
				}
				else if ( teardownError ) {
					triggerCallback( teardownError , time , slow , 'teardown' , teardownResults[ teardownResults.length - 1 ][ 2 ] ) ;
				}
				else {
					triggerCallback( undefined , time , slow ) ;
				}
			} ) ;
		} ) ;
	} ) ;
} ;



TeaTime.syncTest = function syncTest( testFn , callback ) {
	var startTime , time , returnValue ,
		slowTime = this.slowTime ;

	// We need a fresh callstack after each test
	callback = this.freshCallback( callback ) ;

	var context = {
		timeout: function() {} ,	// Does nothing in sync mode
		slow: ( slowTime_ ) => { slowTime = slowTime_ ; }
	} ;

	try {
		// Start coverage tracking NOW!
		if ( this.cover ) { this.cover.start() ; }

		startTime = Date.now() ;
		returnValue = testFn.call( context ) ;

		if ( returnValue && typeof returnValue === 'object' && returnValue.then ) {
			Promise.resolve( returnValue ).then( () => {
				time = Date.now() - startTime ;

				// Stop coverage tracking
				if ( this.cover ) { this.cover.stop() ; }

				callback( undefined , time , Math.floor( time / slowTime ) ) ;
			} ).catch( error => {
				time = Date.now() - startTime ;

				// Stop coverage tracking
				if ( this.cover ) { this.cover.stop() ; }

				callback( error , time , Math.floor( time / slowTime ) ) ;
			} ) ;
			return ;
		}

		time = Date.now() - startTime ;
	}
	catch ( error ) {
		time = Date.now() - startTime ;

		// Stop coverage tracking
		if ( this.cover ) { this.cover.stop() ; }

		callback( error , time , Math.floor( time / slowTime ) ) ;
		return ;
	}

	// Stop coverage tracking
	if ( this.cover ) { this.cover.stop() ; }

	callback( undefined , time , Math.floor( time / slowTime ) ) ;
} ;



TeaTime.asyncTest = function asyncTest( testFn , callback ) {
	var returnValue , badTest , startTime , time , callbackTriggered = false ,
		timer = null ,
		slowTime = this.slowTime ;

	// We need a fresh callstack after each test
	callback = this.freshCallback( callback ) ;

	var context = {
		timeout: timeout => {
			if ( callbackTriggered ) { return ; }
			if ( timer !== null ) { clearTimeout( timer ) ; timer = null ; }

			timer = setTimeout( () => {
				if ( this.orphanError ) {
					triggerCallback( this.orphanError ) ;
					return ;
				}

				var timeoutError = new Error( 'Test timeout (local)' ) ;
				timeoutError.testTimeout = true ;
				triggerCallback( timeoutError ) ;
			} , timeout ) ;
		} ,
		slow: slowTime_ => { slowTime = slowTime_ ; }
	} ;

	var uncaughtExceptionHandler = error => {
		error.uncaught = true ;
		triggerCallback( error ) ;
	} ;

	var triggerCallback = error => {

		this.offUncaughtException( uncaughtExceptionHandler ) ;
		if ( callbackTriggered ) { return ; }

		time = Date.now() - startTime ;

		// Stop coverage tracking
		if ( this.cover ) { this.cover.stop() ; }

		callbackTriggered = true ;
		if ( timer !== null ) { clearTimeout( timer ) ; timer = null ; }

		callback( error , time , Math.floor( time / slowTime ) ) ;
	} ;


	// Should come before running the test, or it would override the user-set timeout
	timer = setTimeout( () => {
		if ( this.orphanError ) {
			triggerCallback( this.orphanError ) ;
			return ;
		}

		var timeoutError = new Error( 'Test timeout' ) ;
		timeoutError.testTimeout = true ;
		triggerCallback( timeoutError ) ;
	} , this.timeout ) ;

	asyncTry( () => {
		// Start coverage tracking NOW!
		if ( this.cover ) { this.cover.start() ; }

		startTime = Date.now() ;
		returnValue = testFn.call( context , triggerCallback ) ;

		if ( returnValue && typeof returnValue === 'object' && returnValue.then ) {
			badTest = true ;
			triggerCallback( new Error( "Bad test: mixing the Promise/thenable and the callback interface" ) ) ;
		}
	} )
	.catch( ( error ) => {
		if ( callbackTriggered && ! badTest ) { this.orphanError = error ; }
		triggerCallback( error ) ;
	} ) ;

	this.onceUncaughtException( uncaughtExceptionHandler ) ;
} ;



TeaTime.prototype.runHooks = function runHooks( hookList , depth , callback ) {
	async.foreach( hookList , ( hookFn , foreachCallback ) => {

		// Sync or async?
		var hookWrapper = hookFn.length ? TeaTime.asyncHook.bind( this ) : TeaTime.syncHook.bind( this ) ;

		this.emit( 'enterHook' , hookFn.hookType , hookFn.hookName , depth ) ;

		hookWrapper( hookFn , ( error ) => {
			this.emit( 'exitHook' , hookFn.hookType , hookFn.hookName , depth ) ;
			if ( error ) { error.hookFn = hookFn ; }
			foreachCallback( error ) ;
		} ) ;
	} )
	.fatal( true )
	.exec( callback ) ;
} ;



TeaTime.syncHook = function syncHook( hookFn , callback ) {
	var returnValue ;

	// We need a fresh callstack after each hook
	callback = this.freshCallback( callback ) ;

	try {
		returnValue = hookFn() ;

		if ( returnValue && typeof returnValue === 'object' && returnValue.then ) {
			Promise.resolve( returnValue ).then( () => {
				callback() ;
			} ).catch( error => {
				callback( error ) ;
			} ) ;
			return ;
		}
	}
	catch ( error ) {
		callback( error ) ;
		return ;
	}

	callback() ;
} ;



TeaTime.asyncHook = function asyncHook( hookFn , callback ) {
	var returnValue , badHook , callbackTriggered = false ;

	// We need a fresh callstack after each hook
	callback = this.freshCallback( callback ) ;

	var uncaughtExceptionHandler = error => {
		error.uncaught = true ;
		triggerCallback( error ) ;
	} ;

	var triggerCallback = error => {

		this.offUncaughtException( uncaughtExceptionHandler ) ;
		if ( callbackTriggered ) { return ; }

		callbackTriggered = true ;
		callback( error ) ;
	} ;

	asyncTry( () => {
		returnValue = hookFn( triggerCallback ) ;

		if ( returnValue && typeof returnValue === 'object' && returnValue.then ) {
			badHook = true ;
			triggerCallback( new Error( "Bad hook: mixing the Promise/thenable and the callback interface" ) ) ;
		}
	} )
	.catch( ( error ) => {
		if ( callbackTriggered && ! badHook ) { this.orphanError = error ; }
		triggerCallback( error ) ;
	} ) ;

	this.onceUncaughtException( uncaughtExceptionHandler ) ;
} ;





/* User-land global functions */



// suite(), describe(), context()
TeaTime.registerSuite = function registerSuite( suiteName , fn ) {
	if ( ! suiteName || typeof suiteName !== 'string' || typeof fn !== 'function' ) {
		throw new Error( "Usage is suite( name , fn )" ) ;
	}

	var parentSuite = this.registerStack[ this.registerStack.length - 1 ] ;

	var suite = TeaTime.createSuite( suiteName ) ;

	this.registerStack.push( suite ) ;

	fn() ;

	this.registerStack.pop() ;

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
TeaTime.registerTest = function registerTest( testName , fn , optional ) {
	var i , iMax , j , jMax , found , parentSuite ;

	if ( ! testName || typeof testName !== 'string' ) {
		throw new Error( "Usage is test( name , [fn] , [optional] )" ) ;
	}

	parentSuite = this.registerStack[ this.registerStack.length - 1 ] ;

	// Filter out tests that are not relevant,
	// each grep should either match the test name or one of the ancestor parent suite.
	for ( i = 0 , iMax = this.grep.length ; i < iMax ; i ++ ) {
		found = false ;

		if ( testName.match( this.grep[ i ] ) ) { continue ; }

		for ( j = 1 , jMax = this.registerStack.length ; j < jMax ; j ++ ) {
			if ( this.registerStack[ j ].name.match( this.grep[ i ] ) ) { found = true ; break ; }
		}

		if ( ! found ) { return ; }
	}

	this.testCount ++ ;

	if ( typeof fn !== 'function' ) { fn = {} ; }

	Object.defineProperties( fn , {
		testName: { value: testName } ,
		optional: { value: !! optional } ,
		order: { value: parentSuite.length }
	} ) ;

	parentSuite.push( fn ) ;
} ;



// test.skip(), it.skip(), specify.skip()
TeaTime.registerSkipTest = function registerSkipTest( testName /*, fn */ ) {
	return TeaTime.registerTest.call( this , testName ) ;
} ;



// test.next(), it.next(), specify.next()
TeaTime.registerOptionalTest = function registerOptionalTest( testName , fn ) {
	return this.skipOptional ?
		TeaTime.registerTest.call( this , testName ) :
		TeaTime.registerTest.call( this , testName , fn , true ) ;
} ;



// setup(), suiteSetup(), teardown(), suiteTeardown(), before(), beforeEach(), after(), afterEach()
TeaTime.registerHook = function registerHook( type , hookName , fn ) {
	var parentSuite ;

	if ( typeof hookName === 'function' ) {
		fn = hookName ;
		hookName = undefined ;
	}
	else if ( typeof fn !== 'function' ) {
		throw new Error( "Usage is hook( [name] , fn )" ) ;
	}

	Object.defineProperties( fn , {
		hookName: { value: hookName || fn.name || '[no name]' } ,
		hookType: { value: type }
	} ) ;

	parentSuite = this.registerStack[ this.registerStack.length - 1 ] ;
	parentSuite[ type ].push( fn ) ;
} ;





/* Misc functions */



// Transform a callback into a fresh callback:
// It use setImmediate() or process.nextTick() to prevent "Maximum call stack"
TeaTime.prototype.freshCallback = function freshCallback( callback ) {
	return ( ... args ) => {
		this.microTimeout( () => {
			callback.call( this , ... args ) ;
		} ) ;
	} ;
} ;



// Remove the framework from the stack trace
TeaTime.prototype.patchError = function patchError( error ) {
	var i , iMax , stack ;

	if ( ! error.stack ) { return ; }

	stack = error.stack ;
	if ( ! Array.isArray( stack ) ) { stack = error.stack.split( '\n' ) ; }

	for ( i = 0 , iMax = stack.length ; i < iMax ; i ++ ) {
		// This is a bit hacky, but well...
		if ( stack[ i ].match( /(^|\/)tea-time\.(min\.)?js/ ) ) {
			stack = stack.slice( 0 , i ) ;
			break ;
		}
	}

	error.stack = stack.join( '\n' ) ;
} ;


