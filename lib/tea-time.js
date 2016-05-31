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
var NGEvents = require( 'nextgen-events' ) ;



function TeaTime() { throw new Error( 'Use TeaTime.create() instead' ) ; }
TeaTime.prototype = Object.create( NGEvents.prototype ) ;
TeaTime.prototype.constructor = TeaTime ;

module.exports = TeaTime ;



TeaTime.create = function createTeaTime( options )
{
	var self = Object.create( TeaTime.prototype , {
		timeout: { value: options.timeout || 2000 , writable: true , enumerable: true } ,
		slowTime: { value: options.slowTime || 75 , writable: true , enumerable: true } ,
		suite: { value: TeaTime.createSuite() , enumerable: true } ,
		grep: { value: Array.isArray( options.grep ) ? options.grep : [] , writable: true , enumerable: true } ,
		allowConsole: { value: !! options.allowConsole , writable: true , enumerable: true } ,
		bail: { value: !! options.bail , writable: true , enumerable: true } ,
		
		startTime: { value: 0 , writable: true , enumerable: true } ,
		testCount: { value: 0 , writable: true , enumerable: true } ,
		done: { value: 0 , writable: true , enumerable: true } ,
		ok: { value: 0 , writable: true , enumerable: true } ,
		fail: { value: 0 , writable: true , enumerable: true } ,
		skip: { value: 0 , writable: true , enumerable: true } ,
		errors: { value: [] , enumerable: true } ,
		
		microTimeout: { value: options.microTimeout , enumerable: true } ,
		onceUncaughtException: { value: options.onceUncaughtException , enumerable: true } ,
		offUncaughtException: { value: options.offUncaughtException , enumerable: true } ,
	} ) ;
	
	Object.defineProperties( self , {
		registerStack: { value: [ self.suite ] , writable: true , enumerable: true } ,
	} ) ;
	
	return self ;
} ;



// CLI and browser share the same args
TeaTime.populateOptionsWithArgs = function populateOptionsWithArgs( options , args )
{
	var i , iMax , v ;
	
	if ( ! options.reporters ) { options.reporters = [ 'classic' ] ; }
	
	if ( args.console !== undefined ) { options.allowConsole = args.console ; }
	else if ( args.c !== undefined ) { options.allowConsole = args.c ; }
	
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
			options.reporters = args.reporter.concat( args.R ) ;
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
} ;



TeaTime.prototype.init = function init( callback )
{
	// Register to global
	global.suite =
		global.describe =
		global.context = TeaTime.registerSuite.bind( this ) ;
	
	global.test =
		global.it =
		global.specify =
			TeaTime.registerTest.bind( this ) ;
	
	global.test.skip = TeaTime.registerSkipTest.bind( this ) ;
	
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



TeaTime.disableConsole = function disableConsole()
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



TeaTime.createSuite = function createSuite( name )
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



TeaTime.sortSuite = function sortSuite( suite )
{
	suite.sort( function( a , b ) {
		var va = Array.isArray( a ) ? 1 : 0 ;
		var vb = Array.isArray( b ) ? 1 : 0 ;
		if ( va - vb ) { return va - vb ; }
		return a.order - b.order ;
	} ) ;
} ;



TeaTime.prototype.run = function run( callback )
{
	var self = this , callbackTriggered = false ;
	
	TeaTime.sortSuite( this.suite ) ;
	
	this.emit( 'ready' , function() {
	
		self.emit( 'run' , self.testCount ) ;
		
		var triggerCallback = function() {
			if ( callbackTriggered ) { return ; }
			if ( typeof callback === 'function' ) { callback() ; }
		} ;
		
		self.startTime = Date.now() ;
		
		self.runSuite( self.suite , 0 , function() {
			
			self.emit( 'report' , self.ok , self.fail , self.skip , Date.now() - self.startTime ) ;
			
			if ( self.fail ) { self.emit( 'errorReport' , self.errors ) ; }
			
			self.emit( 'exit' , triggerCallback ) ;
			
			// Exit anyway after 10 seconds
			setTimeout( triggerCallback , 10000 ) ;
		} ) ;
	} ) ;
} ;



TeaTime.prototype.runSuite = function runSuite( suite , depth , callback )
{
	var self = this ;
	
	if ( depth ) { self.emit( 'enterSuite' , suite.name , depth - 1 ) ; }
	
	var triggerCallback = function( error ) {
		if ( depth ) { self.emit( 'exitSuite' , suite.name , depth - 1 ) ; }
		callback( error ) ;
	} ;
	
	this.runHooks( suite.suiteSetup , depth , function( suiteSetupError ) {
		
		if ( suiteSetupError )
		{
			self.patchError( suiteSetupError ) ;
			
			self.errors.push( {
				name: suiteSetupError.hookFn.hookName + '[' + suiteSetupError.hookFn.hookType + ']' ,
				type: suiteSetupError.hookFn.hookType ,
				fn: suiteSetupError.hookFn ,
				error: suiteSetupError
			} ) ;
			
			self.failSuite( suite , depth , 'suiteSetup' , suiteSetupError.hookFn , suiteSetupError ) ;
			
			// Run teardown anyway?
			self.runHooks( suite.suiteTeardown , depth , function( suiteTeardownError ) {
				triggerCallback( suiteSetupError ) ;
			} ) ;
			return ;
		}
		
		self.runSuiteTests( suite , depth , function( suiteTestsError ) {
			self.runHooks( suite.suiteTeardown , depth , function( suiteTeardownError ) {
				if ( suiteTestsError )
				{
					triggerCallback( suiteTestsError ) ;
				}
				else if ( suiteTeardownError )
				{
					self.patchError( suiteTeardownError ) ;
					
					self.errors.push( {
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



TeaTime.prototype.runSuiteTests = function runSuiteTests( suite , depth , callback )
{
	var self = this ;
	
	async.foreach( suite , function( item , foreachCallback ) {
		
		if ( Array.isArray( item ) )
		{
			self.runSuite( item , depth + 1 , foreachCallback ) ;
			return ;
		}
		
		self.runTest( suite , depth , item , foreachCallback ) ;
	} )
	.fatal( self.bail )
	.exec( callback ) ;
} ;



TeaTime.prototype.failSuite = function failSuite( suite , depth , errorType , errorFn , error )
{
	var i , iMax ;
	
	for ( i = 0 , iMax = suite.length ; i < iMax ; i ++ )
	{
		if ( Array.isArray( suite[ i ] ) )
		{
			this.failSuite( suite[ i ] , depth + 1 , errorType , errorFn , error ) ;
		}
		
		this.done ++ ;
		this.fail ++ ;
		this.emit( 'fail' , suite[ i ].testName , depth , undefined , undefined , error ) ;
	}
} ;



TeaTime.prototype.runTest = function runTest( suite , depth , testFn , callback )
{
	var self = this ;
	
	// /!\ Useful?
	self.testInProgress = testFn ;
	
	
	// Early exit, if the functions should be skipped
	if ( typeof testFn !== 'function' )
	{
		self.done ++ ;
		self.skip ++ ;
		self.emit( 'skip' , testFn.testName , depth ) ;
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
	var testWrapper = testFn.length ? TeaTime.asyncTest.bind( self ) : TeaTime.syncTest.bind( self ) ;
	
	
	// Finishing
	var triggerCallback = function( error , time , slow , errorType ) {
		
		if ( error )
		{
			self.done ++ ;
			self.fail ++ ;
			self.patchError( error ) ;
			
			self.errors.push( {
				name: 
					( error.hookFn ? error.hookFn.hookName + '[' + error.hookFn.hookType + '] ' : '' ) +
					testFn.testName ,
				type: errorType ,
				fn: testFn ,
				error: error
			} ) ;
			
			self.emit( 'fail' , testFn.testName , depth , time , slow , error ) ;
			callback( error ) ;
		}
		else
		{
			self.done ++ ;
			self.ok ++ ;
			self.emit( 'ok' , testFn.testName , depth , time , slow ) ;
			callback() ;
		}
	} ;
	
	
	// Async flow
	self.runHooks( setup , depth , function( setupError ) {
		
		if ( setupError )
		{
			// Run teardown anyway?
			self.runHooks( teardown , depth , function( teardownError ) {
				triggerCallback( setupError , undefined , undefined , 'setup' ) ;
			} ) ;
			return ;
		}
		
		self.emit( 'enterTest' , testFn.testName , depth ) ;

		testWrapper( testFn , function( testError , time , slow ) {
			
			self.emit( 'exitTest' , testFn.testName , depth ) ;
			
			self.runHooks( teardown , depth , function( teardownError , teardownResults ) {
				
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



TeaTime.syncTest = function syncTest( testFn , callback )
{
	var startTime , time , slowTime = this.slowTime ;
	
	// We need a fresh callstack after each test
	callback = this.freshCallback( callback ) ;
	
	var context = {
		timeout: function() {} ,	// Does nothing in sync mode
		slow: function( slowTime_ ) { slowTime = slowTime_ ; }
	} ;
	
	try {
		startTime = Date.now() ;
		testFn.call( context ) ;
		time = Date.now() - startTime ;
	}
	catch ( error ) {
		time = Date.now() - startTime ;
		callback( error , time , Math.floor( time / slowTime ) ) ;
		return ;
	}
	
	callback( undefined , time , Math.floor( time / slowTime ) ) ;
} ;



TeaTime.asyncTest = function asyncTest( testFn , callback )
{
	var self = this ,
		startTime , time , callbackTriggered = false , timer = null , slowTime = self.slowTime ;
	
	// We need a fresh callstack after each test
	callback = this.freshCallback( callback ) ;
	
	var context = {
		timeout: function( timeout ) {
			if ( callbackTriggered ) { return ; }
			if ( timer !== null ) { clearTimeout( timer ) ; timer = null ; }
			timer = setTimeout( triggerCallback.bind( undefined , new Error( 'Test timeout (local)' ) ) , timeout ) ;
		} ,
		slow: function( slowTime_ ) { slowTime = slowTime_ ; }
	} ;
	
	var triggerCallback = function triggerCallback( error ) {
		
		if ( callbackTriggered ) { return ; }
		
		time = Date.now() - startTime ;
		callbackTriggered = true ;
		if ( timer !== null ) { clearTimeout( timer ) ; timer = null ; }
		
		self.offUncaughtException( triggerCallback ) ;
		//process.removeListener( 'uncaughtException' , triggerCallback ) ;
		
		callback( error , time , Math.floor( time / slowTime ) ) ;
	} ;
	
	self.onceUncaughtException( triggerCallback ) ;
	//process.once( 'uncaughtException' , triggerCallback ) ;
	
	// Should come before running the test, or it would override the user-set timeout
	timer = setTimeout( triggerCallback.bind( undefined , new Error( 'Test timeout' ) ) , self.timeout ) ;
	
	try {
		startTime = Date.now() ;
		testFn.call( context , triggerCallback ) ;
	}
	catch ( error ) {
		triggerCallback( error ) ;
	}
} ;



TeaTime.prototype.runHooks = function runHooks( hookList , depth , callback )
{
	var self = this ;
	
	async.foreach( hookList , function( hookFn , foreachCallback ) {
		
		// Sync or async?
		var hookWrapper = hookFn.length ? TeaTime.asyncHook.bind( self ) : TeaTime.syncHook.bind( self ) ;
		
		self.emit( 'enterHook' , hookFn.hookType , hookFn.hookName , depth ) ;
		
		hookWrapper( hookFn , function( error ) {
			self.emit( 'exitHook' , hookFn.hookType , hookFn.hookName , depth ) ;
			if ( error ) { error.hookFn = hookFn ; }
			foreachCallback( error ) ;
		} ) ;
	} )
	.fatal( true )
	.exec( callback ) ;
} ;



TeaTime.syncHook = function syncHook( hookFn , callback )
{
	// We need a fresh callstack after each hook
	callback = this.freshCallback( callback ) ;
	
	try {
		hookFn() ;
	}
	catch ( error ) {
		callback( error ) ;
		return ;
	}
	
	callback() ;
} ;



TeaTime.asyncHook = function asyncHook( hookFn , callback )
{
	var self = this , callbackTriggered = false ;
	
	// We need a fresh callstack after each hook
	callback = this.freshCallback( callback ) ;
	
	var triggerCallback = function triggerCallback( error ) {
		
		if ( callbackTriggered ) { return ; }
		
		callbackTriggered = true ;
		
		//process.removeListener( 'uncaughtException' , triggerCallback ) ;
		self.offUncaughtException( triggerCallback ) ;
		
		callback( error ) ;
	} ;
	
	//process.once( 'uncaughtException' , triggerCallback ) ;
	this.onceUncaughtException( triggerCallback ) ;
	
	try {
		hookFn( triggerCallback ) ;
	}
	catch ( error ) {
		triggerCallback( error ) ;
	}
} ;





			/* User-land global functions */



// suite(), describe(), context()
TeaTime.registerSuite = function registerSuite( suiteName , fn )
{
	if ( ! suiteName || typeof suiteName !== 'string' || typeof fn !== 'function' )
	{
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
TeaTime.registerTest = function registerTest( testName , fn )
{
	var i , iMax , j , jMax , found , parentSuite ;
	
	if ( ! testName || typeof testName !== 'string' )
	{
		throw new Error( "Usage is test( name , [fn] )" ) ;
	}
	
	parentSuite = this.registerStack[ this.registerStack.length - 1 ] ;
	
	// Filter out tests that are not relevant,
	// each grep should either match the test name or one of the ancestor parent suite.
	for ( i = 0 , iMax = this.grep.length ; i < iMax ; i ++ )
	{
		found = false ;
		
		if ( testName.match( this.grep[ i ] ) ) { continue ; }
		
		for ( j = 1 , jMax = this.registerStack.length ; j < jMax ; j ++ )
		{
			if ( this.registerStack[ j ].name.match( this.grep[ i ] ) ) { found = true ; break ; }
		}
		
		if ( ! found ) { return ; }
	}
	
	this.testCount ++ ;
	
	if ( typeof fn !== 'function' ) { fn = {} ; }
	
	Object.defineProperties( fn , {
		testName: { value: testName } ,
		order: { value: parentSuite.length }
	} ) ;
	
	parentSuite.push( fn ) ;
} ;



// test.skip(), it.skip(), specify.skip()
TeaTime.registerSkipTest = function registerSkipTest( testName ) //, fn )
{
	return TeaTime.registerTest.call( this , testName ) ;
} ;



// setup(), suiteSetup(), teardown(), suiteTeardown(), before(), beforeEach(), after(), afterEach()
TeaTime.registerHook = function registerHook( type , hookName , fn )
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
	
	parentSuite = this.registerStack[ this.registerStack.length - 1 ] ;
	parentSuite[ type ].push( fn ) ;
} ;





			/* Misc functions */



// Transform a callback into a fresh callback:
// It use setImmediate() or process.nextTick() to prevent "Maximum call stack"
TeaTime.prototype.freshCallback = function freshCallback( callback )
{
	var self = this ;
	
	return function() {
		var args = arguments ;
		self.microTimeout( function() {
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
		if ( stack[ i ].match( /(^|\/)tea-time\.(min\.)?js/ ) )
		{
			stack = stack.slice( 0 , i ) ;
			break ;
		}
	}
	
	error.stack = stack.join( '\n' ) ;
} ;


