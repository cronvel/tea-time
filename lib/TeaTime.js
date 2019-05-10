/*
	Tea Time!

	Copyright (c) 2015 - 2019 Cédric Ronvel

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
const NGEvents = require( 'nextgen-events' ) ;
const asyncTryCatch = require( 'async-try-catch' ) ;
asyncTryCatch.substitute() ;
const asyncTry = asyncTryCatch.try ;

const Promise = require( 'seventh' ) ;

const Cover = require( './Cover.js' ) ;



function TeaTime( options ) {
	this.timeout = options.timeout || 2000 ;
	this.slowTime = options.slowTime || 75 ;
	this.suite = TeaTime.createSuite() ;
	this.grep = Array.isArray( options.grep ) ? options.grep : [] ;
	this.igrep = Array.isArray( options.igrep ) ? options.igrep : [] ;
	this.allowConsole = !! options.allowConsole ;
	this.huntConsole = !! options.huntConsole ;
	this.bail = !! options.bail ;
	this.showDiff = options.showDiff !== false ;
	this.skipOptional = !! options.skipOptional ;
	this.cover = options.cover && Cover.create( options.cover ) ;

	this.token = options.token || null ; // for slave instance
	this.acceptTokens = options.acceptTokens || null ; // for master instance

	this.startTime = 0 ;
	this.testCount = 0 ;
	this.done = 0 ;
	this.ok = 0 ;
	this.fail = 0 ;
	this.optionalFail = 0 ;
	this.skip = 0 ;
	this.assertionOk = 0 ;
	this.assertionFail = 0 ;
	this.errors = [] ;
	this.orphanError = null ;

	this.onceUncaughtException = options.onceUncaughtException ;
	this.offUncaughtException = options.offUncaughtException ;

	this.registerStack = [ this.suite ] ;
	this.cliManager = options.cliManager || null ;
}

TeaTime.prototype = Object.create( NGEvents.prototype ) ;
TeaTime.prototype.constructor = TeaTime ;

module.exports = TeaTime ;



// Backward compatibility
TeaTime.create = ( ... args ) => new TeaTime( ... args ) ;



TeaTime.reporterAliases = {
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

	options.cover = args.cover ;
	options.showDiff = args.diff !== false ;

	if ( ! options.reporters ) {
		if ( options.cover ) { options.reporters = [ 'classic' , 'coverage-report' , 'warning-comments-summary' ] ; }
		else { options.reporters = [ 'classic' ] ; }
	}

	if ( ! options.clientReporters ) { options.clientReporters = [ 'classic' ] ; }

	if ( args.huntConsole !== undefined ) { options.huntConsole = args.huntConsole ; }
	else if ( args.console !== undefined ) { options.allowConsole = args.console ; }

	if ( args.bail ) { options.bail = true ; }
	if ( args.skipOptional ) { options.skipOptional = true ; }
	if ( args.timeout && ( v = parseInt( args.timeout , 10 ) ) ) { options.timeout = v ; }
	if ( args.slow && ( v = parseInt( args.slow , 10 ) ) ) { options.slowTime = v ; }

	if ( args.reporter ) {
		options.reporters = args.reporter ;
	}

	// Manage reporter aliases
	options.reporters = options.reporters.map( ( r ) => { return TeaTime.reporterAliases[ r ] || r ; } ) ;

	if ( args.clientReporter ) {
		options.clientReporters = args.clientReporter ;
	}


	// Turn string into regexp for the "grep" feature
	options.grep = [] ;
	options.sourceGrep = [] ;

	if ( ! args.grep ) { args.grep = [] ; }

	for ( i = 0 , iMax = args.grep.length ; i < iMax ; i ++ ) {
		options.grep.push( new RegExp( args.grep[ i ] , 'i' ) ) ;
		options.sourceGrep.push( args.grep[ i ] ) ;
	}


	// Turn string into regexp for the "igrep" feature
	options.igrep = [] ;
	options.sourceIGrep = [] ;

	if ( ! args.igrep ) { args.igrep = [] ; }

	for ( i = 0 , iMax = args.igrep.length ; i < iMax ; i ++ ) {
		options.igrep.push( new RegExp( args.igrep[ i ] , 'i' ) ) ;
		options.sourceIGrep.push( args.igrep[ i ] ) ;
	}


	if ( args.token ) { options.token = args.token ; }
} ;



TeaTime.prototype.init = function init() {
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

	// Built-in assertion lib, provided by Doormen.expect
	global.expect = require( 'doormen/lib/expect.js' ).factory( {
		ok: () => this.assertionOkHook() ,
		fail: () => this.assertionFailHook()
	} ) ;

	if ( this.huntConsole ) { TeaTime.huntConsole() ; }
	else if ( ! this.allowConsole ) { TeaTime.disableConsole() ; }
} ;



TeaTime.disableConsole = function disableConsole() {
	Object.keys( console ).forEach( key => {
		if ( typeof console[ key ] === 'function' ) {
			console[ key ] = function() {} ;
		}
	} ) ;
} ;



TeaTime.huntConsole = function huntConsole() {
	Object.keys( console ).forEach( key => {
		if ( typeof console[ key ] === 'function' ) {
			console[ key ] = () => { throw new ConsoleError( key ) ; } ;
		}
	} ) ;
} ;



// Custom ConsoleError
function ConsoleError( from ) {
	this.message = "The console." + from + "() function was used!" ;
	from = console[ from ] ;
	if ( Error.captureStackTrace ) { Error.captureStackTrace( this , from ) ; }
	else { Object.defineProperty( this , 'stack' , { value: Error().stack , enumerable: true , configurable: true } ) ; }
}

ConsoleError.prototype = Object.create( Error.prototype ) ;
ConsoleError.prototype.constructor = ConsoleError ;
ConsoleError.prototype.name = 'ConsoleError' ;



TeaTime.createSuite = function createSuite( title ) {
	var suite = [] ;

	suite.title = title ;
	suite.parent = null ;
	suite.suiteSetup = [] ;
	suite.suiteTeardown = [] ;
	suite.setup = [] ;
	suite.teardown = [] ;
	suite.order = 0 ;

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



TeaTime.prototype.run = async function run() {
	var duration , coverage ;

	TeaTime.sortSuite( this.suite ) ;

	// Wait for everything to be ready
	await this.waitForEmit( 'ready' ) ;

	this.emit( 'start' , this.testCount ) ;

	// Start coverage tracking NOW!
	if ( this.cover ) { this.cover.start() ; }

	this.startTime = Date.now() ;

	try {
		await this.runSuite( this.suite , 0 ) ;
	}
	catch ( dontCare ) {}

	duration = Date.now() - this.startTime ;

	if ( this.cover ) { coverage = this.cover.getCoverage() ; }

	this.emit( 'report' , {
		ok: this.ok ,
		fail: this.fail ,
		optionalFail: this.optionalFail ,
		skip: this.skip ,
		assertionOk: this.assertionOk ,
		assertionFail: this.assertionFail ,
		coverageRate: coverage && coverage.rate ,
		duration: duration
	} ) ;

	if ( this.fail + this.optionalFail ) { this.emit( 'errorReport' , this.errors ) ; }
	if ( this.cover ) { this.emit( 'coverageReport' , coverage ) ; }

	this.emit( 'end' ) ;

	return Promise.timeLimit( 10000 , this.waitForEmit( 'exit' ) ) ;
} ;



TeaTime.prototype.runSuite = async function runSuite( suite , depth ) {
	if ( depth ) { this.emit( 'enterSuite' , { title: suite.title , depth: depth - 1 } ) ; }

	// Run setup hooks
	try {
		await this.runHooks( suite.suiteSetup , depth ) ;
	}
	catch ( suiteSetupError ) {
		this.patchError( suiteSetupError ) ;

		this.errors.push( {
			title: suiteSetupError.hookFn.title + '[' + suiteSetupError.hookFn.hookType + ']' ,
			type: suiteSetupError.hookFn.hookType ,
			fn: suiteSetupError.hookFn ,
			error: suiteSetupError
		} ) ;

		this.failSuite( suite , depth , 'suiteSetup' , suiteSetupError.hookFn , suiteSetupError ) ;

		// Run teardown anyway?
		try {
			await this.runHooks( suite.suiteTeardown , depth ) ;
		}
		catch ( suiteTeardownError ) {}

		if ( depth ) { this.emit( 'exitSuite' , { title: suite.title , depth: depth - 1 } ) ; }

		throw suiteSetupError ;
	}

	// Run tests
	try {
		await this.runSuiteTests( suite , depth ) ;
	}
	catch ( suiteTestsError ) {
		// Run teardown
		try {
			await this.runHooks( suite.suiteTeardown , depth ) ;
		}
		catch ( suiteTeardownError ) {}

		if ( depth ) { this.emit( 'exitSuite' , { title: suite.title , depth: depth - 1 } ) ; }
		throw suiteTestsError ;
	}

	// Run teardown
	try {
		await this.runHooks( suite.suiteTeardown , depth ) ;
	}
	catch ( suiteTeardownError ) {
		this.patchError( suiteTeardownError ) ;

		this.errors.push( {
			title: suiteTeardownError.hookFn.title + '[' + suiteTeardownError.hookFn.hookType + ']' ,
			type: suiteTeardownError.hookFn.hookType ,
			fn: suiteTeardownError.hookFn ,
			error: suiteTeardownError
		} ) ;

		if ( depth ) { this.emit( 'exitSuite' , { title: suite.title , depth: depth - 1 } ) ; }
		throw suiteTeardownError ;
	}
} ;



TeaTime.prototype.runSuiteTests = async function runSuiteTests( suite , depth ) {
	return Promise.forEach( suite , async ( item ) => {
		try {
			if ( Array.isArray( item ) ) {
				await this.runSuite( item , depth + 1 ) ;
			}
			else {
				await this.runTest( suite , depth , item ) ;
			}
		}
		catch ( error ) {
			if ( this.bail ) { throw error ; }
		}
	} ) ;
} ;



TeaTime.prototype.failSuite = function failSuite( suite , depth , errorType , errorFn , error ) {
	var i , iMax , testFn , data ;

	for ( i = 0 , iMax = suite.length ; i < iMax ; i ++ ) {
		if ( Array.isArray( suite[ i ] ) ) {
			this.failSuite( suite[ i ] , depth + 1 , errorType , errorFn , error ) ;
		}

		this.done ++ ;
		this.fail ++ ;

		testFn = suite[ i ] ;

		data = {
			title: testFn.title ,
			type: testFn.name ,
			optional: testFn.optional ,
			depth: depth ,
			fn: testFn ,
			errorType: errorType ,
			error: error ,
			errorFn: errorFn
		} ;

		this.emit( 'fail' , data ) ;
	}
} ;



TeaTime.prototype.runTest = async function runTest( suite , depth , testFn ) {
	// /!\ Useful?
	this.testInProgress = testFn ;

	var data = {
		title: testFn.title ,
		type: testFn.name ,
		optional: testFn.optional ,
		depth: depth ,
		fn: testFn ,
		duration: null ,
		slow: null ,
		error: null ,
		errorType: null ,
		errorFn: null
	} ;

	// Early exit, if the functions should be skipped
	if ( typeof testFn !== 'function' ) {
		this.done ++ ;
		this.skip ++ ;
		this.emit( 'skip' , data ) ;
		return ;
	}


	// Inherit parent's setup/teardown
	var ancestor = suite , setup = suite.setup , teardown = suite.teardown ;

	while ( ancestor.parent ) {
		ancestor = ancestor.parent ;
		setup = ancestor.setup.concat( setup ) ;
		teardown = ancestor.teardown.concat( teardown ) ;
	}


	// Finishing
	var testFailed = error => {
		this.done ++ ;
		this.patchError( error ) ;

		this.errors.push( {
			title:
				( error.hookFn ? error.hookFn.title + '[' + error.hookFn.hookType + '] ' : '' ) +
				data.title ,
			type: data.errorType ,
			fn: testFn ,
			optional: data.optional ,
			error: error
		} ) ;

		if ( data.optional ) {
			this.optionalFail ++ ;
			this.emit( 'optionalFail' , data ) ;
		}
		else {
			this.fail ++ ;
			this.emit( 'fail' , data ) ;
		}

		if ( this.bail ) { throw error ; }
	} ;

	var testOk = () => {
		this.done ++ ;
		this.ok ++ ;
		this.emit( 'ok' , data ) ;
	} ;


	try {
		await this.runHooks( setup , depth ) ;
	}
	catch ( setupError ) {
		data.errorType = 'setup' ;
		data.error = setupError ;
		data.errorFn = setupError.hookFn ;

		// Run teardown anyway?
		try {
			await this.runHooks( teardown , depth ) ;
		}
		catch ( teardownError ) {}

		testFailed( setupError ) ;
		return ;
	}

	this.orphanError = null ;

	this.emit( 'enterTest' , data ) ;

	try {
		Object.assign( data , await this.runTestFn( testFn ) ) ;
	}
	catch ( testError ) {
		Object.assign( data , testError.data ) ;
		data.error = testError ;
		data.errorType = 'test' ;
		data.errorFn = testFn ;

		this.emit( 'exitTest' , data ) ;

		// Run teardown
		try {
			await this.runHooks( teardown , depth ) ;
		}
		catch ( teardownError ) {}

		testFailed( testError ) ;
		return ;
	}

	this.emit( 'exitTest' , data ) ;

	// Run teardown
	try {
		await this.runHooks( teardown , depth ) ;
	}
	catch ( teardownError ) {
		data.errorType = 'teardown' ;
		data.error = teardownError ;
		data.errorFn = teardownError.hookFn ;
		testFailed( teardownError ) ;
		return ;
	}

	testOk() ;
} ;



TeaTime.prototype.runTestFn = function runTestFn( testFn_ ) {
	var startTime , finishTriggered = false ,
		timer = null , testFn ,
		slowTime = this.slowTime ;

	var promise = new Promise() ;

	var context = {
		timeout: timeout => {
			if ( finishTriggered ) { return ; }
			if ( timer !== null ) { clearTimeout( timer ) ; timer = null ; }

			timer = setTimeout( () => {
				if ( this.orphanError ) {
					finish( this.orphanError ) ;
					return ;
				}

				var timeoutError = new Error( 'Test timeout (local)' ) ;
				timeoutError.testTimeout = true ;
				finish( timeoutError ) ;
			} , timeout ) ;
		} ,
		slow: slowTime_ => { slowTime = slowTime_ ; }
	} ;

	if ( testFn_.length ) {
		testFn = () => {
			return new Promise( ( resolve , reject ) => {
				var returnValue = testFn_.call( context , error => {
					return error ? reject( error ) : resolve() ;
				} ) ;

				if ( Promise.isThenable( returnValue ) ) {
					reject( new Error( "Bad test: mixing the Promise/thenable and the callback interface" ) ) ;
				}
			} ) ;
		} ;
	}
	else {
		testFn = testFn_ ;
	}

	var finish = error => {
		// Immediately, before checking if already called:
		var duration = Date.now() - startTime ;
		this.offUncaughtException( uncaughtExceptionHandler ) ;

		if ( finishTriggered ) { return ; }
		finishTriggered = true ;

		// Stop coverage tracking
		if ( this.cover ) { this.cover.stop() ; }

		if ( timer !== null ) { clearTimeout( timer ) ; timer = null ; }

		var data = { duration , slow: Math.floor( duration / slowTime ) } ;

		if ( error ) {
			error.data = data ;
			promise.reject( error ) ;
		}
		else {
			promise.resolve( data ) ;
		}
	} ;

	var uncaughtExceptionHandler = error => {
		error.uncaught = true ;
		finish( error ) ;
	} ;

	// Should come before running the test, or it would override the user-set timeout
	timer = setTimeout( () => {
		if ( this.orphanError ) {
			finish( this.orphanError ) ;
			return ;
		}

		var timeoutError = new Error( 'Test timeout' ) ;
		timeoutError.testTimeout = true ;
		finish( timeoutError ) ;
	} , this.timeout ) ;

	this.onceUncaughtException( uncaughtExceptionHandler ) ;

	asyncTry( () => {
		// Start coverage tracking NOW!
		if ( this.cover ) { this.cover.start() ; }

		startTime = Date.now() ;
		var returnValue = testFn.call( context ) ;

		if ( Promise.isThenable( returnValue ) ) {
			Promise.resolve( returnValue ).callback( finish ) ;
			return ;
		}

		finish() ;
	} )
		.catch( ( error ) => {
			if ( finishTriggered ) { this.orphanError = error ; }
			finish( error ) ;
		} ) ;

	return promise ;
} ;



TeaTime.prototype.runHooks = function runHooks( hookList , depth ) {
	return Promise.forEach( hookList , hookFn => {
		var data = {
			hookType: hookFn.hookType ,
			title: hookFn.title ,
			depth: depth ,
			fn: hookFn
		} ;

		this.emit( 'enterHook' , data ) ;

		return this.runHookFn( hookFn ).then(
			() => {
				this.emit( 'exitHook' , data ) ;
			} ,
			error => {
				error.hookFn = hookFn ;
				this.emit( 'exitHook' , data ) ;
				throw error ;
			}
		) ;
	} ) ;
} ;



TeaTime.prototype.runHookFn = function runHookFn( hookFn_ ) {
	var hookFn , finishTriggered = false ;

	var promise = new Promise() ;

	if ( hookFn_.length ) {
		hookFn = () => {
			return new Promise( ( resolve , reject ) => {
				var returnValue = hookFn_( error => {
					return error ? reject( error ) : resolve() ;
				} ) ;

				if ( Promise.isThenable( returnValue ) ) {
					reject( new Error( "Bad test: mixing the Promise/thenable and the callback interface" ) ) ;
				}
			} ) ;
		} ;
	}
	else {
		hookFn = hookFn_ ;
	}

	var finish = error => {
		// Immediately, before checking if already called:
		this.offUncaughtException( uncaughtExceptionHandler ) ;

		if ( finishTriggered ) { return ; }
		finishTriggered = true ;

		if ( error ) {
			promise.reject( error ) ;
		}
		else {
			promise.resolve() ;
		}
	} ;

	var uncaughtExceptionHandler = error => {
		error.uncaught = true ;
		finish( error ) ;
	} ;

	this.onceUncaughtException( uncaughtExceptionHandler ) ;

	asyncTry( () => {
		var returnValue = hookFn() ;

		if ( Promise.isThenable( returnValue ) ) {
			Promise.resolve( returnValue ).callback( finish ) ;
			return ;
		}

		finish() ;
	} )
		.catch( ( error ) => {
			if ( finishTriggered ) { this.orphanError = error ; }
			finish( error ) ;
		} ) ;

	return promise ;
} ;



TeaTime.prototype.assertionOkHook = function assertionOkHook() {
	this.assertionOk ++ ;
	this.emit( 'assertionOk' ) ;
} ;



TeaTime.prototype.assertionFailHook = function assertionFailHook() {
	this.assertionFail ++ ;
	this.emit( 'assertionFail' ) ;
} ;





/* User-land global functions */



// suite(), describe(), context()
TeaTime.registerSuite = function registerSuite( title , fn ) {
	if ( ! title || typeof title !== 'string' || typeof fn !== 'function' ) {
		throw new Error( "Usage is suite( title , fn )" ) ;
	}

	var parentSuite = this.registerStack[ this.registerStack.length - 1 ] ;

	var suite = TeaTime.createSuite( title ) ;

	this.registerStack.push( suite ) ;

	fn() ;

	this.registerStack.pop() ;

	// Only add this suite to its parent if it is not empty
	if ( ! suite.length ) { return ; }

	suite.order = parentSuite.length ;
	suite.parent = parentSuite ;

	TeaTime.sortSuite( suite ) ;
	parentSuite.push( suite ) ;
} ;



// test(), it(), specify()
TeaTime.registerTest = function registerTest( title , fn , optional ) {
	var i , iMax , j , jMax , found , parentSuite ;

	if ( ! title || typeof title !== 'string' ) {
		throw new Error( "Usage is test( title , [fn] , [optional] )" ) ;
	}

	parentSuite = this.registerStack[ this.registerStack.length - 1 ] ;

	// Filter out tests that are not relevant,
	// each grep should either match the test title or anyone of the ancestor parent suite.
	for ( i = 0 , iMax = this.grep.length ; i < iMax ; i ++ ) {
		found = false ;

		if ( title.match( this.grep[ i ] ) ) { continue ; }

		for ( j = 1 , jMax = this.registerStack.length ; j < jMax ; j ++ ) {
			if ( this.registerStack[ j ].title.match( this.grep[ i ] ) ) { found = true ; break ; }
		}

		if ( ! found ) { return ; }
	}

	// Filter out tests that are not relevant,
	// each igrep should not match the test title or anyone of the ancestor parent suite.
	for ( i = 0 , iMax = this.igrep.length ; i < iMax ; i ++ ) {
		if ( title.match( this.igrep[ i ] ) ) { return ; }

		for ( j = 1 , jMax = this.registerStack.length ; j < jMax ; j ++ ) {
			if ( this.registerStack[ j ].title.match( this.igrep[ i ] ) ) { return ; }
		}
	}

	this.testCount ++ ;

	if ( typeof fn !== 'function' ) { fn = {} ; }

	fn.title = title ;
	fn.optional = !! optional ;
	fn.order = parentSuite.length ;

	parentSuite.push( fn ) ;
} ;



// test.skip(), it.skip(), specify.skip()
TeaTime.registerSkipTest = function registerSkipTest( title /*, fn */ ) {
	return TeaTime.registerTest.call( this , title ) ;
} ;



// test.next(), it.next(), specify.next()
TeaTime.registerOptionalTest = function registerOptionalTest( title , fn ) {
	return this.skipOptional ?
		TeaTime.registerTest.call( this , title ) :
		TeaTime.registerTest.call( this , title , fn , true ) ;
} ;



// setup(), suiteSetup(), teardown(), suiteTeardown(), before(), beforeEach(), after(), afterEach()
TeaTime.registerHook = function registerHook( type , title , fn ) {
	var parentSuite ;

	if ( typeof title === 'function' ) {
		fn = title ;
		title = undefined ;
	}
	else if ( typeof fn !== 'function' ) {
		throw new Error( "Usage is hook( [title] , fn )" ) ;
	}

	fn.title = title || fn.name || '[no name]' ;
	fn.hookType = type ;

	parentSuite = this.registerStack[ this.registerStack.length - 1 ] ;
	parentSuite[ type ].push( fn ) ;
} ;





/* Misc functions */



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

