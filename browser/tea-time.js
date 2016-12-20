(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.createTeaTime = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global){
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
var falafel = require( 'falafel' ) ;
var packageJson = require( '../package.json' ) ;
var path = require( 'path' ) ;
var fs = require( 'fs' ) ;
var string = require( 'string-kit' ) ;
var escape = string.escape ;



function Cover() { throw new Error( 'Use TeaTime.create() instead' ) ; }
//Cover.prototype = Object.create( NGEvents.prototype ) ;
//Cover.prototype.constructor = Cover ;

module.exports = Cover ;



Cover.create = function createCover( options )
{
	var self = Object.create( Cover.prototype , {
		whiteList: { value: null , writable: true , enumerable: true } ,
		blackList: { value: null , writable: true , enumerable: true } ,
		ecmaVersion: { value: 6 , writable: true , enumerable: true } ,
		tracking: { value: {} , writable: true , enumerable: true } ,
		isTracking: { value: false , writable: true , enumerable: true } ,
		package: { value: null , writable: true , enumerable: true } ,
	} ) ;
	
	// Tmp:
	var rootDir = process.cwd() ;
	
	// Require the package.json (mandatory)
	try {
		self.package = require( rootDir + '/package.json' ) ;
	}
	catch ( error ) {
		if ( error.code === 'MODULE_NOT_FOUND' ) { throw new Error( "[Cover] No package.json found" ) ; }
		else { throw new Error( "[Cover] Error in the package.json: " + error ) ; }
	}
	
	if ( self.package.config && self.package.config['tea-time'] && self.package.config['tea-time'].coverDir )
	{
		self.whiteList = self.package.config['tea-time'].coverDir.map( function( dirPath ) {
			return rootDir + '/' + dirPath + '/' ;
		} ) ;
	}
	
	require.extensions['.js'] = self.requireJs.bind( self ) ;
	
	global[ coverVarName ] = self ;
	
	return self ;
} ;



var nodeRequireJs = require.extensions['.js'] ;



var nodeToTrack = [
	"ExpressionStatement" ,
	"BreakStatement" ,
	"ContinueStatement" ,
	"VariableDeclaration" ,
	"ReturnStatement" ,
	"ThrowStatement" ,
	"TryStatement" ,
	"FunctionDeclaration" ,
	"IfStatement" ,
	"WhileStatement" ,
	"DoWhileStatement" ,
	"ForStatement" ,
	"ForInStatement" ,
	"SwitchStatement" ,
	"WithStatement"
] ;



var nodeNeedingBraces = [
	"IfStatement" ,
	"WhileStatement" ,
	"DoWhileStatement" ,
	"ForStatement" ,
	"ForInStatement" ,
	"WithStatement"
] ;



var coverVarName = '__TEA_TIME_COVER__' ;



// This is the replacement for JS extension require
Cover.prototype.requireJs = function requireJs( localModule , filePath )
{
	var isTrackingBkup = this.isTracking ;
	
	if ( ( ! this.whiteList || ! this.whiteList.length ) && ( ! this.blackList || ! this.blackList.length ) )
	{
		return nodeRequireJs( localModule , filePath ) ;
	}
	
	if ( this.whiteList && this.whiteList.length )
	{
		if ( ! this.whiteList.some( function( dirPath ) { return filePath.indexOf( dirPath ) === 0 ; } ) )
		{
			//console.log( ">>>>>>>>>>>> Normal requireJs (not white-listed)" , filePath ) ;
			return nodeRequireJs( localModule , filePath ) ;
		}
	}
	
	if ( this.blackList && this.blackList.length )
	{
		if ( this.blackList.some( function( dirPath ) { return filePath.indexOf( dirPath ) === 0 ; } ) )
		{
			//console.log( ">>>>>>>>>>>> Normal requireJs (black-listed)" , filePath ) ;
			return nodeRequireJs( localModule , filePath ) ;
		}
	}
	
	//console.log( ">>>>>>>>>>>> Hi-jacked requireJs" , filePath ) ;
	nodeRequireJs( localModule , filePath ) ;
	
	// This is the original require.extensions['.js'] function, as of node v6:
	
	/*
	var content = fs.readFileSync( filePath , 'utf8' ) ;
	module._compile( internalModule.stripBOM( content ) , filePath ) ;
	*/
	
	var content = fs.readFileSync( filePath , 'utf8' ) ;
	var instrumentedContent = this.instrument( content , filePath ) ;
	
	//console.log( "Instrumented content:\n" + instrumentedContent + "\n\n\n" ) ;
	
	// Force the tracking activation during module loading:
	// tests cannot re-trigger global/top-level module exec,
	// if not, it would always report low coverage
	this.isTracking = true ;
	localModule._compile( instrumentedContent , filePath ) ;
	this.isTracking = isTrackingBkup ;
} ;



// instrument the file synchronously
// `next` is optional callback which will be called
// with instrumented code when present
Cover.prototype.instrument = function instrument( content , filePath ) //config, next)
{
	this.tracking[ filePath ] = {
		area: [] ,
		charCount: content.length ,
		sourceLines: content.split( '\n' ) ,
	} ;
	
	// It seems that falafel/acorn counts lines starting at 1, not 0
	this.tracking[ filePath ].sourceLines.unshift( '' ) ;
	
	// Remove shebang: not needed anymore since allowHashBang option exists in acorn
	//content = content.replace( /^\#\!.*/ , '' ) ;
	
	var instrumented = falafel( content , {
			locations: true ,
			comment: true ,
			ecmaVersion: this.ecmaVersion ,
			
			allowHashBang: true ,
			
			//sourceType: 'module' ,
			allowReturnOutsideFunction: true ,
			
			// important or conditional tracking may fail with code like:
			// if ( var1 && ( var2 = expression ) )
			preserveParens: true ,
			
		} , this.injectTrackingCode.bind( this , filePath )
	) ;
	
	return instrumented ;
} ;



Cover.prototype.start = function start() { this.isTracking = true ; } ;
Cover.prototype.stop = function stop() { this.isTracking = false ; } ;



Cover.prototype.track = function track( filePath , index )
{
	if ( ! this.isTracking ) { return ; }
	
	this.tracking[ filePath ].area[ index ].count ++ ;
	//console.log( "Tracked:" , filePath , this.tracking[ filePath ].area[ index ].location.start.line ) ;
} ;



Cover.prototype.initTracking = function initTracking( filePath , node )
{
	var index = this.tracking[ filePath ].area.length ;
	
	this.tracking[ filePath ].area[ index ] = {
		count: 0 ,
		location: node.loc
	} ;
	
	return index ;
} ;



Cover.prototype.injectTrackingCode = function injectTrackingCode( filePath , node )
{
	//console.log( "node type ["+filePath+"]:" , node.type ) ;
	
	// From Blanket, but does it really happen?
	if ( ! node.loc || ! node.loc.start ) { throw new Error( "Node without location" ) ; }
	
	this.injectBraces( node ) ;
	
	//this.injectBlockTrackingCode( filePath , node ) ;
	this.injectStatementTrackingCode( filePath , node ) ;
	this.injectConditionTrackingCode( filePath , node ) ;
} ;



Cover.prototype.injectBraces = function injectBraces( node )
{
	var index ;
	
	if ( nodeNeedingBraces.indexOf( node.type ) !== -1 )
	{
		if ( node.consequent && node.consequent.type !== "BlockStatement" )
		{
			// The 'then' statement
			node.consequent.update( "{\n" + node.consequent.source() + "}\n" ) ;
		}
		else if ( node.body && node.body.type !== "BlockStatement" )
		{
			// Dunno what node.body is supposed to be...
			node.body.update( "{\n" + node.body.source() + "}\n" ) ;
		}
		
		//if ( node.alternate && node.alternate.type !== "BlockStatement" && node.alternate.type !== "IfStatement" )
		if ( node.alternate && node.alternate.type !== "BlockStatement" )
		{
			// The 'else/else if' node
			node.alternate.update( "{\n" + node.alternate.source() + "}\n" ) ;
		}
	}
	
	return false ;
} ;



Cover.prototype.injectStatementTrackingCode = function injectStatementTrackingCode( filePath , node )
{
	var index ;
	
	if ( nodeToTrack.indexOf( node.type ) !== -1 && node.parent.type !== 'LabeledStatement' )
	{
		if (
			node.type === "VariableDeclaration" &&
			( node.parent.type === "ForStatement" || node.parent.type === "ForInStatement" )
		)
		{
			return false ;
		}
		
		index = this.initTracking( filePath , node ) ;
		
		node.update( 
			//'/*' + node.type + '*/' +
			coverVarName + ".track( '" + escape.jsSingleQuote( filePath ) + "' , " + index + " ) ;\n" +
			node.source()
		) ;
		
		return true ;
	}
	
	return false ;
} ;



Cover.prototype.injectConditionTrackingCode = function injectConditionTrackingCode( filePath , node )
{
	var index ;
	
	if ( node.type === 'LogicalExpression' && ( node.operator === '&&' || node.operator === '||' ) )
	{
		//console.log( "#######" , node ) ;
		
		if ( node.left.type !== 'LogicalExpression' )
		{
			index = this.initTracking( filePath , node.left ) ;
			
			node.left.update( 
				//'/*' + node.type + '/' + node.left.type + '*/' +
				'(' + coverVarName + ".track( '" + escape.jsSingleQuote( filePath ) + "' , " + index + " ) || " +
				node.left.source() + ')'
			) ;
		}
		
		if ( node.right.type !== 'LogicalExpression' )
		{
			index = this.initTracking( filePath , node.right ) ;
			
			node.right.update( 
				//'/*' + node.type + '/' + node.right.type + '*/' +
				'(' + coverVarName + ".track( '" + escape.jsSingleQuote( filePath ) + "' , " + index + " ) || " +
				node.right.source() + ')'
			) ;
		}
		
		return true ;
	}
	
	return false ;
} ;



Cover.prototype.injectBlockTrackingCode = function injectBlockTrackingCode( filePath , node )
{
	var index ;
	
	if ( node.type === "Program" )
	{
		index = this.initTracking( filePath , node ) ;
		
		node.update( 
			//'/*' + node.type + '*/' +
			coverVarName + ".track( '" + escape.jsSingleQuote( filePath ) + "' , " + index + " ) ;" +
			node.source()
		) ;
		
		return true ;
	}
	else if ( node.type === "BlockStatement" )
	{
		index = this.initTracking( filePath , node ) ;
		
		node.update( 
			'{' +
			//'/*' + node.type + '*/' +
			coverVarName + ".track( '" + escape.jsSingleQuote( filePath ) + "' , " + index + " ) ;" +
			node.source().slice( 1 )
		) ;
		
		return true ;
	}
	
	return false ;
} ;



Cover.prototype.getCoverage = function getCoverage()
{
	var filePath , i , iMax , j , oneData ;
	
	var coverage = {
		uncoveredFiles: {} ,
		lineCount: 0 ,
		uncoveredLineCount: 0 ,
		areaCount: 0 ,
		uncoveredAreaCount: 0
	} ;
	
	for ( filePath in this.tracking )
	{
		//charCount += this.tracking[ filePath ].charCount ;
		coverage.lineCount += this.tracking[ filePath ].sourceLines.length - 1 ;	// substract empty line 0
		
		for ( i = 0 , iMax = this.tracking[ filePath ].area.length ; i < iMax ; i ++ )
		{
			oneData = this.tracking[ filePath ].area[ i ] ;
			coverage.areaCount ++ ;
			
			if ( ! oneData.count )
			{
				coverage.uncoveredAreaCount ++ ;
				
				if ( ! coverage.uncoveredFiles[ filePath ] )
				{
					coverage.uncoveredFiles[ filePath ] = {
						source: this.tracking[ filePath ].sourceLines ,
						lines: ( new Array( this.tracking[ filePath ].sourceLines.length ) ).fill( false )
					} ;
				}
				
				// Flags the lines as uncovered
				for ( j = oneData.location.start.line ; j <= oneData.location.end.line ; j ++ )
				{
					coverage.uncoveredFiles[ filePath ].lines[ j ] = true ;
				}
				
				/*
				console.log( "\n\n>>> Not covered:" , filePath , i , oneData , "\nline:" , oneData.location.start.line ,
					'\n' + escape.control( this.tracking[ filePath ].sourceLines[ oneData.location.start.line - 1 ] ) ,
					'\n' + escape.control( this.tracking[ filePath ].sourceLines[ oneData.location.start.line ] ) ,
					'\n' + escape.control( this.tracking[ filePath ].sourceLines[ oneData.location.start.line + 1 ] )
				) ;
				*/
			}
		}
		
		if ( coverage.uncoveredFiles[ filePath ] )
		{
			coverage.uncoveredLineCount += coverage.uncoveredFiles[ filePath ].lines.reduce(
				function( accu , element ) { return accu + ( element ? 1 : 0 ) ; } , 0
			) ;
		}
	}
	
	//coverage.rate = 1 - coverage.uncoveredAreaCount / coverage.areaCount ;
	coverage.rate = 1 - coverage.uncoveredLineCount / coverage.lineCount ;
	
	return coverage ;
} ;



}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../package.json":76,"_process":47,"falafel":36,"fs":16,"path":46,"string-kit":62}],2:[function(require,module,exports){
(function (global){
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
var asyncTry = require( 'async-try-catch' ).try ;
var Cover = require( './Cover.js' ) ;



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
	
	options.cover = args.cover || args.C ;
	
	if ( ! options.reporters )
	{
		if ( options.cover ) { options.reporters = [ 'classic' , 'coverage-report' ] ; }
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
	
	
	if ( args.reporter )
	{
		if ( ! Array.isArray( args.reporter ) ) { args.reporter = [ args.reporter ] ; }
		options.reporters = args.reporter ;
		
		if ( args.R )
		{
			if ( ! Array.isArray( args.R ) ) { args.R = [ args.R ] ; }
			options.reporters = args.reporter.concat( args.R ) ;
		}
	}
	else if ( args.R )
	{
		if ( ! Array.isArray( args.R ) ) { args.R = [ args.R ] ; }
		options.reporters = args.R ;
	}
	
	
	if ( args.clientReporter )
	{
		if ( ! Array.isArray( args.clientReporter ) ) { args.clientReporter = [ args.clientReporter ] ; }
		options.clientReporters = args.clientReporter ;
	}
	
	
	// Turn string into regexp for the "grep" feature
	options.grep = [] ;
	options.sourceGrep = [] ;
	
	if ( ! args.grep ) { args.grep = [] ; }
	else if ( args.grep && ! Array.isArray( args.grep ) ) { args.grep = [ args.grep ] ; }
	
	if ( args.g ) { args.grep = args.grep.concat( args.g ) ; }
	
	for ( i = 0 , iMax = args.grep.length ; i < iMax ; i ++ )
	{
		options.grep.push( new RegExp( args.grep[ i ] , 'i' ) ) ;
		options.sourceGrep.push( args.grep[ i ] ) ;
	}
	
	
	if ( args.token ) { options.token = args.token ; }
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
	
		self.emit( 'start' , self.testCount ) ;
		
		var triggerCallback = function() {
			if ( callbackTriggered ) { return ; }
			if ( typeof callback === 'function' ) { callback() ; }
		} ;
		
		// Start coverage tracking NOW!
		if ( self.cover ) { self.cover.start() ; }
		
		self.startTime = Date.now() ;
		
		self.runSuite( self.suite , 0 , function() {
			
			var duration = Date.now() - self.startTime ;
			var coverage ;
			
			if ( self.cover ) { coverage = self.cover.getCoverage() ; }
			
			self.emit( 'report' , self.ok , self.fail , self.optionalFail , self.skip , coverage && coverage.rate , duration ) ;
			
			if ( self.fail + self.optionalFail ) { self.emit( 'errorReport' , self.errors ) ; }
			
			if ( self.cover ) { self.emit( 'coverageReport' , coverage ) ; }
			
			self.emit( 'end' ) ;
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
			self.patchError( error ) ;
			
			self.errors.push( {
				name: 
					( error.hookFn ? error.hookFn.hookName + '[' + error.hookFn.hookType + '] ' : '' ) +
					testFn.testName ,
				type: errorType ,
				fn: testFn ,
				optional: testFn.optional ,
				error: error
			} ) ;
			
			if ( testFn.optional )
			{
				self.optionalFail ++ ;
				self.emit( 'optionalFail' , testFn.testName , depth , time , slow , error ) ;
			}
			else
			{
				self.fail ++ ;
				self.emit( 'fail' , testFn.testName , depth , time , slow , error ) ;
			}
			
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
			
			self.emit( 'exitTest' , testFn.testName , depth , time , slow , testError ) ;
			
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
		// Start coverage tracking NOW!
		if ( this.cover ) { this.cover.start() ; }
		
		startTime = Date.now() ;
		testFn.call( context ) ;
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



TeaTime.asyncTest = function asyncTest( testFn , callback )
{
	var self = this ,
		startTime , time , callbackTriggered = false ,
		timer = null ,
		slowTime = self.slowTime ;
	
	// We need a fresh callstack after each test
	callback = this.freshCallback( callback ) ;
	
	var context = {
		timeout: function( timeout ) {
			if ( callbackTriggered ) { return ; }
			if ( timer !== null ) { clearTimeout( timer ) ; timer = null ; }
			
			timer = setTimeout( function() {
				var timeoutError = new Error( 'Test timeout (local)' ) ;
				timeoutError.testTimeout = true ;
				triggerCallback( timeoutError ) ;
			} , timeout ) ;
		} ,
		slow: function( slowTime_ ) { slowTime = slowTime_ ; }
	} ;
	
	var uncaughtExceptionHandler = function uncaughtExceptionHandler( error ) {
		error.uncaught = true ;
		triggerCallback( error ) ;
	} ;
	
	var triggerCallback = function triggerCallback( error ) {
		
		self.offUncaughtException( uncaughtExceptionHandler ) ;
		if ( callbackTriggered ) { return ; }
		
		time = Date.now() - startTime ;
		
		// Stop coverage tracking
		if ( self.cover ) { self.cover.stop() ; }
		
		callbackTriggered = true ;
		if ( timer !== null ) { clearTimeout( timer ) ; timer = null ; }
		
		callback( error , time , Math.floor( time / slowTime ) ) ;
	} ;
	
	
	// Should come before running the test, or it would override the user-set timeout
	timer = setTimeout( function() {
		var timeoutError = new Error( 'Test timeout' ) ;
		timeoutError.testTimeout = true ;
		triggerCallback( timeoutError ) ;
	} , self.timeout ) ;
	
	asyncTry( function() {
		// Start coverage tracking NOW!
		if ( self.cover ) { self.cover.start() ; }
		
		startTime = Date.now() ;
		testFn.call( context , triggerCallback ) ;
	} )
	.catch( function( error ) {
		triggerCallback( error ) ;
	} ) ;
	
	this.onceUncaughtException( uncaughtExceptionHandler ) ;
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
	
	var uncaughtExceptionHandler = function uncaughtExceptionHandler( error ) {
		error.uncaught = true ;
		triggerCallback( error ) ;
	} ;
	
	var triggerCallback = function triggerCallback( error ) {
		
		self.offUncaughtException( uncaughtExceptionHandler ) ;
		if ( callbackTriggered ) { return ; }
		
		callbackTriggered = true ;
		callback( error ) ;
	} ;
	
	asyncTry( function() {
		hookFn( triggerCallback ) ;
	} )
	.catch( function( error ) {
		triggerCallback( error ) ;
	} ) ;
	
	this.onceUncaughtException( uncaughtExceptionHandler ) ;
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
TeaTime.registerTest = function registerTest( testName , fn , optional )
{
	var i , iMax , j , jMax , found , parentSuite ;
	
	if ( ! testName || typeof testName !== 'string' )
	{
		throw new Error( "Usage is test( name , [fn] , [optional] )" ) ;
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
		optional: { value: !! optional } ,
		order: { value: parentSuite.length }
	} ) ;
	
	parentSuite.push( fn ) ;
} ;



// test.skip(), it.skip(), specify.skip()
TeaTime.registerSkipTest = function registerSkipTest( testName ) //, fn )
{
	return TeaTime.registerTest.call( this , testName ) ;
} ;



// test.next(), it.next(), specify.next()
TeaTime.registerOptionalTest = function registerOptionalTest( testName , fn )
{
	return this.skipOptional ?
		TeaTime.registerTest.call( this , testName ) :
		TeaTime.registerTest.call( this , testName , fn , true ) ;
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



}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./Cover.js":1,"async-kit":9,"async-try-catch":14,"nextgen-events":41}],3:[function(require,module,exports){
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

/* global document */



//var Report = require( './report.js' ) ;
//var ErrorReport = require( './error-report.js' ) ;


function Reporter( teaTime , self )
{
	if ( ! self )
	{
		self = Object.create( Reporter.prototype , {
			teaTime: { value: teaTime , enumerable: true }
		} ) ;
	}
	
	document.querySelector( 'body' )
		.insertAdjacentHTML( 'beforeend' ,
			'<div class="tea-time-classic-reporter" style="background-color:black;color:white"></div>'
		) ;
	
	self.container = document.querySelector( 'div.tea-time-classic-reporter' ) ;
	
	self.teaTime.on( 'enterSuite' , Reporter.enterSuite.bind( self ) ) ;
	self.teaTime.on( 'ok' , Reporter.ok.bind( self ) ) ;
	self.teaTime.on( 'fail' , Reporter.fail.bind( self ) ) ;
	self.teaTime.on( 'optionalFail' , Reporter.optionalFail.bind( self ) ) ;
	self.teaTime.on( 'skip' , Reporter.skip.bind( self ) ) ;
	self.teaTime.on( 'report' , Reporter.report.bind( self ) ) ;
	self.teaTime.on( 'errorReport' , Reporter.errorReport.bind( self ) ) ;
	
	return self ;
}

module.exports = Reporter ;



function scrollDown()
{
	( document.querySelector( 'div.tea-time-classic-reporter p:last-child' ) ||
		document.querySelector( 'div.tea-time-classic-reporter h4:last-child' ) ||
		document.querySelector( 'div.tea-time-classic-reporter pre:last-child' ) )
			.scrollIntoView() ;
}



function indentStyle( depth )
{
	return 'margin-left:' + ( 1 + 2 * depth ) + '%;' ;
}



var timeStyle = "color:grey;" ;
var passingStyle = "color:green;" ;
var failingStyle = "color:red;" ;
var optionalFailingStyle = "color:brown;" ;
var pendingStyle = "color:blue;" ;
var coverageStyle = "color:magenta;" ;

var fastStyle = "color:grey;" ;
var slowStyle = "color:yellow;" ;
var slowerStyle = "color:red;" ;

var optionalErrorStyle = "color:brown;font-weight:bold;" ;
var errorStyle = "color:red;font-weight:bold;" ;
var hookErrorStyle = "background-color:red;color:white;font-weight:bold;" ;

var expectedStyle = "background-color:green;color:white;font-weight:bold;" ;
var actualStyle = "background-color:red;color:white;font-weight:bold;" ;




Reporter.enterSuite = function enterSuite( suiteName , depth )
{
	this.container.insertAdjacentHTML( 'beforeend' ,
		'<h4 class="tea-time-classic-reporter" style="' + indentStyle( depth ) + '">' + suiteName + '</h4>'
	) ;
	
	scrollDown() ;
} ;



Reporter.ok = function ok( testName , depth , time , slow )
{
	var content = '✔ ' + testName ;
	
	if ( ! slow ) { content += ' <span style="' + fastStyle + '">(' + time + 'ms)</span>' ; }
	else if ( slow === 1 ) { content += ' <span style="' + slowStyle + '">(' + time + 'ms)</span>' ; }
	else { content += ' <span style="' + slowerStyle + '">(' + time + 'ms)</span>' ; }
	
	this.container.insertAdjacentHTML( 'beforeend' ,
		'<p class="tea-time-classic-reporter" style="' + passingStyle + indentStyle( depth ) + '">' + content + '</p>'
	) ;
	
	scrollDown() ;
} ;



Reporter.fail = function fail( testName , depth , time , slow , error )
{
	var content = '✘ ' + testName ;
	
	if ( time !== undefined )
	{
		if ( ! slow ) { content += ' <span style="' + fastStyle + '">(' + time + 'ms)</span>' ; }
		else if ( slow === 1 ) { content += ' <span style="' + slowStyle + '">(' + time + 'ms)</span>' ; }
		else { content += ' <span style="' + slowerStyle + '">(' + time + 'ms)</span>' ; }
	}
	
	this.container.insertAdjacentHTML( 'beforeend' ,
		'<p class="tea-time-classic-reporter" style="' + failingStyle + indentStyle( depth ) + '">' + content + '</p>'
	) ;
	
	scrollDown() ;
} ;



Reporter.optionalFail = function optionalFail( testName , depth , time , slow , error )
{
	var content = '✘ ' + testName ;
	
	if ( time !== undefined )
	{
		if ( ! slow ) { content += ' <span style="' + fastStyle + '">(' + time + 'ms)</span>' ; }
		else if ( slow === 1 ) { content += ' <span style="' + slowStyle + '">(' + time + 'ms)</span>' ; }
		else { content += ' <span style="' + slowerStyle + '">(' + time + 'ms)</span>' ; }
	}
	
	this.container.insertAdjacentHTML( 'beforeend' ,
		'<p class="tea-time-classic-reporter" style="' + optionalFailingStyle + indentStyle( depth ) + '">' + content + '</p>'
	) ;
	
	scrollDown() ;
} ;



Reporter.skip = function skip( testName , depth )
{
	var content = '· ' + testName ;
	
	this.container.insertAdjacentHTML( 'beforeend' ,
		'<p class="tea-time-classic-reporter" style="' + pendingStyle + indentStyle( depth ) + '">' + content + '</p>'
	) ;
	
	scrollDown() ;
} ;



Reporter.report = function report( ok , fail , optionalFail , skip , coverageRate , time )
{
	this.container.insertAdjacentHTML(
		'beforeend' ,
		'<hr />' +
		'<p class="tea-time-classic-reporter" style="font-weight:bold;' + passingStyle + indentStyle( 1 ) + '">' + ok + ' passing ' +
		( time < 2000 ?
			'<span style="' + timeStyle + '">(' + Math.round( time ) + 'ms)</span>' :
			'<span style="' + timeStyle + '">(' + Math.round( time / 1000 ) + 's)</span>'
		) +
		'</p>' +
		'<p class="tea-time-classic-reporter" style="font-weight:bold;' + failingStyle + indentStyle( 1 ) + '">' + fail + ' failing</p>' +
		( optionalFail ? '<p class="tea-time-classic-reporter" style="font-weight:bold;' + optionalFailingStyle + indentStyle( 1 ) + '">' + optionalFail + ' opt failing</p>' : '' ) +
		( skip ? '<p class="tea-time-classic-reporter" style="font-weight:bold;' + pendingStyle + indentStyle( 1 ) + '">' + skip + ' pending</p>' : '' ) +
		( coverageRate !== undefined ? '<p class="tea-time-classic-reporter" style="font-weight:bold;' + coverageStyle + indentStyle( 1 ) + '">' + Math.round( coverageRate * 100 ) + '% coverage</p>' : '' )
	) ;
	
	scrollDown() ;
} ;



Reporter.errorReport = function errorReport( errors )
{
	var i , error , content = '' ;
	
	content += '<h4 class="tea-time-classic-reporter" style="' + errorStyle + indentStyle( 0 ) + '">== Errors ==</h4>' ;
	
	for ( i = 0 ; i < errors.length ; i ++ )
	{
		error = errors[ i ] ;
		content += '<p class="tea-time-classic-reporter" style="' +
			( error.optional ? optionalErrorStyle : errorStyle ) +
			indentStyle( 1 ) + '">' + ( i + 1 ) + ' ) ' ;
		
		switch ( error.type )
		{
			case 'test' :
				if ( error.error.testTimeout ) { content += '<span style="' + hookErrorStyle + '">TEST TIMEOUT</span> ' ; }
				break ;
			case 'setup' :
				content += '<span style="' + hookErrorStyle + '">SETUP HOOK</span> ' ;
				break ;
			case 'teardown' :
				content += '<span style="' + hookErrorStyle + '">TEARDOWN HOOK</span> ' ;
				break ;
			case 'suiteSetup' :
				content += '<span style="' + hookErrorStyle + '">SUITE SETUP HOOK</span> ' ;
				break ;
			case 'suiteTeardown' :
				content += '<span style="' + hookErrorStyle + '">SUITE TEARDOWN HOOK</span> ' ;
				break ;
		}
		
		if ( error.error.uncaught ) { content += '<span style="' + hookErrorStyle + '">UNCAUGHT EXCEPTION</span> ' ; }
		
		content += error.name ;
		content += '</p>' ;
		content += this.reportOneError( error.error ) ;
	}
	
	this.container.insertAdjacentHTML( 'beforeend' , '<hr />' + content ) ;
	
	scrollDown() ;
} ;



Reporter.prototype.reportOneError = function reportOneError( error )
{
	var content = '' ;
	
	if ( ( 'expected' in error ) && ( 'actual' in error ) )
	{
		content += '<p class="tea-time-classic-reporter" style="' + indentStyle( 2 ) + '">' +
			'<span style="' + expectedStyle + '">expected</span><span style="' + actualStyle + '">actual</span>' +
			'</p>' ;
		
		content += '<pre class="tea-time-classic-reporter"; style="' + indentStyle( 2 ) + '">' ;
		content += this.teaTime.htmlColorDiff( error.actual , error.expected ) ;
		content += '</pre>' ;
	}
	
	content += 
		'<pre class="tea-time-classic-reporter" style="' + indentStyle( 2 ) + '">' + 
		this.teaTime.inspect.inspectError( { style: 'html' } , error ) +
		'</pre>' ;
	
	return content ;
} ;



},{}],4:[function(require,module,exports){
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



function Reporter( teaTime , self )
{
	if ( ! self )
	{
		self = Object.create( Reporter.prototype , {
			teaTime: { value: teaTime , enumerable: true }
		} ) ;
	}
	
	self.teaTime.on( 'ok' , Reporter.ok.bind( self ) ) ;
	self.teaTime.on( 'fail' , Reporter.fail.bind( self ) ) ;
	self.teaTime.on( 'optionalFail' , Reporter.optionalFail.bind( self ) ) ;
	self.teaTime.on( 'skip' , Reporter.skip.bind( self ) ) ;
	self.teaTime.on( 'report' , Reporter.report.bind( self ) ) ;
	//self.teaTime.on( 'errorReport' , Reporter.errorReport.bind( self ) ) ;
	
	return self ;
}

module.exports = Reporter ;



Reporter.ok = function ok( testName , depth , time , slow )
{
	console.log( 'OK:' , testName , '(' + time + ')' ) ;
} ;



Reporter.fail = function fail( testName , depth , time , slow , error )
{
	console.log( 'Fail:' , testName , time !== undefined ? '(' + time + ')' : '' ) ;
} ;



Reporter.optionalFail = function optionalFail( testName , depth , time , slow , error )
{
	console.log( 'Opt fail:' , testName , time !== undefined ? '(' + time + ')' : '' ) ;
} ;



Reporter.skip = function skip( testName , depth )
{
	console.log( 'Pending:' , testName ) ;
} ;



Reporter.report = function report( ok , fail , optionalFail , skip , coverageRate )
{
	console.log( 'Report -- ok:' , ok , ' fail:' , fail , ' opt fail:' , optionalFail , ' pending:' , skip ,
		' coverage:' , coverageRate !== undefined ? Math.round( coverageRate * 100 ) + '%' : 'n/a'
	) ;
} ;



},{}],5:[function(require,module,exports){
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

/* global document, WebSocket */



function Reporter( teaTime , self )
{
	if ( ! self )
	{
		self = Object.create( Reporter.prototype , {
			teaTime: { value: teaTime , enumerable: true }
		} ) ;
	}
	
	self.teaTime.on( 'ready' , { fn: Reporter.ready.bind( self ) , async: true } ) ;
	
	self.teaTime.on( 'start' , Reporter.forward.bind( self , 'start' ) ) ;
	self.teaTime.on( 'enterSuite' , Reporter.forward.bind( self , 'enterSuite' ) ) ;
	self.teaTime.on( 'exitSuite' , Reporter.forward.bind( self , 'exitSuite' ) ) ;
	self.teaTime.on( 'enterTest' , Reporter.forward.bind( self , 'enterTest' ) ) ;
	self.teaTime.on( 'exitTest' , Reporter.forward.bind( self , 'exitTest' ) ) ;
	self.teaTime.on( 'ok' , Reporter.forward.bind( self , 'ok' ) ) ;
	self.teaTime.on( 'fail' , Reporter.forward.bind( self , 'fail' ) ) ;
	self.teaTime.on( 'optionalFail' , Reporter.forward.bind( self , 'optionalFail' ) ) ;
	self.teaTime.on( 'skip' , Reporter.forward.bind( self , 'skip' ) ) ;
	self.teaTime.on( 'report' , Reporter.forward.bind( self , 'report' ) ) ;
	self.teaTime.on( 'errorReport' , Reporter.forward.bind( self , 'errorReport' ) ) ;
	self.teaTime.on( 'exit' , Reporter.exit.bind( self , 'exit' ) ) ;
	
	
	//self.teaTime.on( 'enterSuite' , Reporter.enterSuite.bind( self ) ) ;
	//self.teaTime.on( 'ok' , Reporter.ok.bind( self ) ) ;
	//self.teaTime.on( 'fail' , Reporter.fail.bind( self ) ) ;
	//self.teaTime.on( 'optionalFail' , Reporter.optionalFail.bind( self ) ) ;
	//self.teaTime.on( 'skip' , Reporter.skip.bind( self ) ) ;
	//self.teaTime.on( 'report' , Reporter.report.bind( self ) ) ;
	//self.teaTime.on( 'errorReport' , Reporter.errorReport.bind( self ) ) ;
	
	return self ;
}

module.exports = Reporter ;



Reporter.ready = function ready( callback )
{
	var self = this ;
	
	//console.log( "Ready event received!" , this.teaTime.token ) ;
	this.ws = new WebSocket( 'ws://127.0.0.1:7357/' + this.teaTime.token ) ;
	
	this.ws.onopen = function onOpen()
	{
		Reporter.forward.call( self , 'ready' ) ;
		console.log( "Websocket opened!" ) ;
		callback() ;
	} ;
	
	this.ws.onclose = function onClose()
	{
		console.log( "Websocket closed!" ) ;
	} ;
} ;



Reporter.forward = function forward( event )
{
	var args = Array.prototype.slice.call( arguments , 1 ) ;
	
	this.teaTime.prepareSerialize( args ) ;
	
	this.ws.send(
		JSON.stringify( {
			event: event ,
			args: args
		} )
	) ;
} ;



Reporter.exit = function exit( callback )
{
	Reporter.forward.call( this , 'exit' ) ;
	//console.log( "Exit event received!" ) ;
	this.ws.close() ;
} ;




},{}],6:[function(require,module,exports){
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

/* global window */



var TeaTime = require( './TeaTime.js' ) ;
var diff = require( './diff.js' ) ;
var htmlColorDiff = require( './htmlColorDiff.js' ) ;
var inspect = require( 'string-kit/lib/inspect.js' ) ;
var dom = require( 'dom-kit' ) ;
var url = require( 'url' ) ;



function createTeaTime()
{
	var options = {
		microTimeout: function( callback ) {
			setTimeout( callback , 0 ) ;
		} ,
		onceUncaughtException: function( callback ) {
			window.onerror = function( message , source , lineno , colno , error ) {
				window.onerror = function() {} ;
				callback( error ) ;
				return true ;	// prevent the event propagation
			} ;
		} ,
		offUncaughtException: function() {
			window.onerror = function() {} ;
		} ,
		allowConsole: true
	} ;
	
	TeaTime.populateOptionsWithArgs( options , url.parse( window.location.href , true ).query ) ;
	
	window.teaTime = TeaTime.create( options ) ;
	
	window.teaTime.init() ;
	window.teaTime.diff = diff ;
	window.teaTime.htmlColorDiff = htmlColorDiff ;
	window.teaTime.inspect = inspect ;
	window.teaTime.prepareSerialize = prepareSerialize ;
	
	window.teaTime.reporters = {
		console: require( './browser-reporters/console.js' ) ,
		classic: require( './browser-reporters/classic.js' ) ,
		websocket: require( './browser-reporters/websocket.js' )
	} ;
	
	options.reporters.forEach( function( reporter ) {
		window.teaTime.reporters[ reporter ]( window.teaTime ) ;
	} ) ;
	
	if ( options.ws )
	{
		window.teaTime.ws = true ;
	}
	
	return window.teaTime ;
}

module.exports = createTeaTime ;



function prepareSerialize( object )
{
	var i , iMax , keys , prototypeName ;
	
	if ( ! object || typeof object !== 'object' ) { return ; }
	
	
	if ( Array.isArray( object ) )
	{
		for ( i = 0 , iMax = object.length ; i < iMax ; i ++ )
		{
			prepareSerialize( object[ i ] ) ;
		}
		
		return ;
	}
	
	prototypeName = object.__proto__ && object.__proto__.constructor.name ; // jshint ignore:line
	
	if ( prototypeName && prototypeName !== 'Object' ) { object.__prototype = prototypeName ; }
	
	if ( object instanceof Error )
	{
		// Make things enumerable, so JSON.stringify() will serialize them like it should
		Object.defineProperties( object , {
			__prototype: { value: object.constructor.name , enumerable: true , writable: true } ,
			name: { value: object.name , enumerable: true , writable: true } ,
			message: { value: object.message , enumerable: true , writable: true } ,
			type: { value: object.type || object.constructor.name , enumerable: true , writable: true } ,
			stack: { value: object.stack , enumerable: true , writable: true }
		} ) ;
	}
	
	keys = Object.keys( object ) ;
	
	for ( i = 0 , iMax = keys.length ; i < iMax ; i ++ )
	{
		prepareSerialize( object[ keys[ i ] ] ) ;
	}
}



createTeaTime() ;

dom.ready( function() {
	window.teaTime.run() ;
} ) ;




},{"./TeaTime.js":2,"./browser-reporters/classic.js":3,"./browser-reporters/console.js":4,"./browser-reporters/websocket.js":5,"./diff.js":7,"./htmlColorDiff.js":8,"dom-kit":33,"string-kit/lib/inspect.js":56,"url":71}],7:[function(require,module,exports){
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



var inspect = require( 'string-kit/lib/inspect.js' ) ;
var jsdiff = require( 'diff' ) ;



var inspectOptions = { minimal: true , depth: 10 , sort: true } ;



function textDiff( oldValue , newValue )
{
	var str = '' ,
		diff = textDiff.raw( oldValue , newValue , true ) ;
	
	diff.forEach( function( part ) {
		
		str += part.value.replace( /^(?!$)/mg , function() {
			if ( part.added ) { return '++' ; }
			else if ( part.removed ) { return '--' ; }
			else { return '  ' ; }
		} ) ;
	} ) ;
	
	return str ;
}

module.exports = textDiff ;



textDiff.raw = function rawDiff( oldValue , newValue , noCharMode )
{
	var diff , score = 0 ;
	
	var oldStr = inspect.inspect( inspectOptions , oldValue ) ;
	var newStr = inspect.inspect( inspectOptions , newValue ) ;
	
	if ( ! noCharMode && Math.max( oldStr.length , newStr.length ) < 2000 )
	{
		// First try the diffChars algorithm, it looks great if there are only few changes
		diff = jsdiff.diffChars( oldStr , newStr ) ;
		
		// Try to evaluate the weirdness
		diff.forEach( function( part ) {
			if ( part.added || part.removed )
			{
				score += 15 + part.value.length ;
			}
		} ) ;
		
		// If too much weirdness, fallback to line mode
		if ( score < 80 ) { return diff ; }
	}
	
	diff = jsdiff.diffLines( oldStr , newStr ) ;
	
	return diff ;
} ;



},{"diff":27,"string-kit/lib/inspect.js":56}],8:[function(require,module,exports){
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



var rawDiff = require( './diff.js' ).raw ;



module.exports = function htmlColorDiff( oldValue , newValue )
{
	var str = '' ,
		diff = rawDiff( oldValue , newValue ) ;
	
	diff.forEach( function( part ) {
		
		if ( part.added )
		{
			str += part.value.replace( /^(\s*)(\S(?:[^\n]*\S)?)(\s*)$/mg , function( match , pre , value , after ) {
				return pre + '<span style="background-color:green;color:white">' + value + '</span>' + after ;
			} ) ;
		}
		else if ( part.removed )
		{
			str += part.value.replace( /^(\s*)(\S(?:[^\n]*\S)?)(\s*)$/mg , function( match , pre , value , after ) {
				return pre + '<span style="background-color:red;color:white">' + value + '</span>' + after ;
			} ) ;
		}
		else
		{  
			str += '<span style="color:grey">' + part.value + '</span>' ;
		}
	} ) ;
	
	return str ;
} ;





},{"./diff.js":7}],9:[function(require,module,exports){
/*
	Async Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



var async = require( './core.js' ) ;
module.exports = async ;

async.wrapper = require( './wrapper.js' ) ;
async.exit = require( './exit.js' ) ;

var safeTimeout = require( './safeTimeout.js' ) ;
async.setSafeTimeout = safeTimeout.setSafeTimeout ;
async.clearSafeTimeout = safeTimeout.clearSafeTimeout ;



},{"./core.js":10,"./exit.js":11,"./safeTimeout.js":12,"./wrapper.js":13}],10:[function(require,module,exports){
(function (process,global){
/*
	Async Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



// Async flow


/*
	TODO:
	- this: in all callback and event, it would be nice to bind the current execContext as 'this',
	  so for example each jobs can access to results of others...
	  -> DONE for callback but not for event
	- serialProgress() callback/event that is called for each element, but that respect sequence order 
	  even in parallel mode
	- config(): just set everything in one place?
	- dependenciesTree(): jobs are resolved using a dependencies' tree, that give arguments to transmit
	  from one Async function to another
	- async.Queue: job can be added after exec(), forever, until quit() is called (it needs some brainstorming here),
	  basicaly, some work should be done to move jobs from async.Plan to async.ExecContext
	- caolan/async's: compose(), detect(), filter() ?
	- Real async try/catch/finally, using node's Domain?
	- exportProxy() export a proxy function, if you call the function twice (or more) with the same arguments,
	  the subsequent call will process immediately, replaying all callback immediately and returning,
	  all with the same value
	
	TODO Promises:
	- promise() returning a Promise
	- Promise as a job item, or action function
	
	TODO Doc:
	- Jeu de piste/Organigramme en Markdown, de simples questions proposent des liens en réponse,
	  menant sur d'autres questions avec d'autres liens de réponses, etc... à la fin, on obtient
	  un code d'exemple qui sert de template à copier/coller.
*/

"use strict" ;



// Load modules dependencies
var NextGenEvents = require( 'nextgen-events' ) ;
var treeExtend = require( 'tree-kit/lib/extend.js' ) ;



var async = {} ;
module.exports = async ;



// Used to store important global variable, like the recursion counter (avoid stack overflow)
if ( ! global.__ASYNC_KIT__ )
{
	global.__ASYNC_KIT__ = {
		recursionCounter: 0 ,
		// Fix that to Infinity by default, until this feature is stable enough
		defaultMaxRecursion: Infinity
	} ;
}





			//////////////////////////
			// Internal Async Error //
			//////////////////////////



// Extend Error
async.AsyncError = function AsyncError( message )
{
	Error.call( this ) ;
	Error.captureStackTrace && Error.captureStackTrace( this , this.constructor ) ;	// jshint ignore:line
	this.message = message ;
} ;

async.AsyncError.prototype = Object.create( Error.prototype ) ;
async.AsyncError.prototype.constructor = async.AsyncError ;



			//////////////////////////////////////////////////////
			// Async Plan factory: create different Plan object //
			//////////////////////////////////////////////////////



// Empty constructor, it is just there to support instanceof operator
async.Plan = function Plan()
{
	throw new Error( "[async] Cannot create an async Plan object directly" ) ;
} ;

//async.Plan.prototype = Object.create( NextGenEvents.prototype ) ;
async.Plan.prototype.constructor = async.Plan ;



// Common properties for all instance of async.Plan
var planCommonProperties = {
	// Configurable
	parallelLimit: { value: 1 , writable: true , enumerable: true , configurable: true } ,
	raceMode: { value: false , writable: true , enumerable: true , configurable: true } ,
	waterfallMode: { value: false , writable: true , enumerable: true , configurable: true } ,
	waterfallTransmitError: { value: false , writable: true , enumerable: true , configurable: true } ,
	whileAction: { value: undefined , writable: true , enumerable: true , configurable: true } ,
	whileActionBefore: { value: false , writable: true , enumerable: true , configurable: true } ,
	errorsAreFatal: { value: true , writable: true , enumerable: true , configurable: true } ,
	returnMapping1to1: { value: false , writable: true , enumerable: true , configurable: true } ,
	
	// Not configurable
	maxRecursion: { value: Infinity , writable: true , enumerable: true } ,
	jobsData: { value: {} , writable: true , enumerable: true } ,
	jobsKeys: { value: [] , writable: true , enumerable: true } ,
	jobsUsing: { value: undefined , writable: true , enumerable: true } ,
	jobsTimeout: { value: undefined , writable: true , enumerable: true } ,
	useSafeTimeout: { value: false , writable: true , enumerable: true } ,
	returnLastJobOnly: { value: false , writable: true , enumerable: true } ,
	defaultAggregate: { value: undefined , writable: true , enumerable: true } ,
	returnAggregate: { value: false , writable: true , enumerable: true } ,
	transmitAggregate: { value: false , writable: true , enumerable: true } ,
	usingIsIterator: { value: false , writable: true , enumerable: true } ,
	thenAction: { value: undefined , writable: true , enumerable: true } ,
	catchAction: { value: undefined , writable: true , enumerable: true } ,
	finallyAction: { value: undefined , writable: true , enumerable: true } ,
	asyncEventNice: { value: -20 , writable: true , enumerable: true } ,
	maxRetry: { value: 0 , writable: true , enumerable: true } ,
	retryTimeout: { value: 0 , writable: true , enumerable: true } ,
	retryMultiply: { value: 1 , writable: true , enumerable: true } ,
	retryMaxTimeout: { value: Infinity , writable: true , enumerable: true } ,
	execMappingMinInputs: { value: 0 , writable: true , enumerable: true } ,
	execMappingMaxInputs: { value: 100 , writable: true , enumerable: true } ,
	execMappingCallbacks: { value: [ 'finally' ] , writable: true , enumerable: true } ,
	execMappingAggregateArg: { value: false , writable: true , enumerable: true } ,
	execMappingMinArgs: { value: 0 , writable: true , enumerable: true } ,
	execMappingMaxArgs: { value: 101 , writable: true , enumerable: true } ,
	execMappingSignature: { value: '( [finallyCallback] )' , writable: true , enumerable: true } ,
	locked: { value: false , writable: true , enumerable: true }
} ;



// Create an async.Plan flow, parallel limit is preset to 1 (series) as default, but customizable with .parallel()
async.do = function _do( jobsData )
{
	var asyncPlan = Object.create( async.Plan.prototype , planCommonProperties ) ;
	
	Object.defineProperties( asyncPlan , {
		execInit: { value: execDoInit.bind( asyncPlan ) } ,
		execNext: { value: execDoNext.bind( asyncPlan ) } ,
		execCallback: { value: execDoCallback } ,
		execLoopCallback: { value: execWhileCallback } ,
		execFinal: { value: execDoFinal.bind( asyncPlan ) }
	} ) ;
	
	asyncPlan.maxRecursion = global.__ASYNC_KIT__.defaultMaxRecursion ;
	
	asyncPlan.do( jobsData ) ;
	
	return asyncPlan ;
} ;



// Create an async parallel flow
async.parallel = function parallel( jobsData )
{
	var asyncPlan = Object.create( async.Plan.prototype , planCommonProperties ) ;
	
	Object.defineProperties( asyncPlan , {
		parallelLimit: { value: Infinity , writable: true , enumerable: true } ,
		execInit: { value: execDoInit.bind( asyncPlan ) } ,
		execNext: { value: execDoNext.bind( asyncPlan ) } ,
		execCallback: { value: execDoCallback } ,
		execLoopCallback: { value: execWhileCallback } ,
		execFinal: { value: execDoFinal.bind( asyncPlan ) }
	} ) ;
	
	asyncPlan.maxRecursion = global.__ASYNC_KIT__.defaultMaxRecursion ;
	
	asyncPlan.do( jobsData ) ;
	
	return asyncPlan ;
} ;



// Create an async series flow
async.series = function series( jobsData )
{
	var asyncPlan = Object.create( async.Plan.prototype , planCommonProperties ) ;
	
	Object.defineProperties( asyncPlan , {
		parallelLimit: { value: 1 , enumerable: true } ,
		execInit: { value: execDoInit.bind( asyncPlan ) } ,
		execNext: { value: execDoNext.bind( asyncPlan ) } ,
		execCallback: { value: execDoCallback } ,
		execLoopCallback: { value: execWhileCallback } ,
		execFinal: { value: execDoFinal.bind( asyncPlan ) }
	} ) ;
	
	asyncPlan.maxRecursion = global.__ASYNC_KIT__.defaultMaxRecursion ;
	
	asyncPlan.do( jobsData ) ;
	
	return asyncPlan ;
} ;



// Create an async parallel flow, and return the result of the first non-error
async.race = function race( jobsData )
{
	var asyncPlan = Object.create( async.Plan.prototype , planCommonProperties ) ;
	
	Object.defineProperties( asyncPlan , {
		raceMode: { value: true , enumerable: true } ,
		parallelLimit: { value: Infinity , writable: true , enumerable: true } ,
		errorsAreFatal: { value: false , writable: true , enumerable: true } ,
		execInit: { value: execDoInit.bind( asyncPlan ) } ,
		execNext: { value: execDoNext.bind( asyncPlan ) } ,
		execCallback: { value: execDoCallback } ,
		execLoopCallback: { value: execWhileCallback } ,
		execFinal: { value: execDoFinal.bind( asyncPlan ) }
	} ) ;
	
	// We only want the result of the first succeeding job
	asyncPlan.returnLastJobOnly = true ;
	asyncPlan.maxRecursion = global.__ASYNC_KIT__.defaultMaxRecursion ;
	
	asyncPlan.do( jobsData ) ;
	
	return asyncPlan ;
} ;



// Create an async series flow, each job transmit its results to the next jobs
async.waterfall = function waterfall( jobsData )
{
	var asyncPlan = Object.create( async.Plan.prototype , planCommonProperties ) ;
	
	Object.defineProperties( asyncPlan , {
		waterfallMode: { value: true , enumerable: true } ,
		waterfallTransmitError: { value: false , writable: true , enumerable: true } ,
		parallelLimit: { value: 1 , enumerable: true } ,
		execInit: { value: execDoInit.bind( asyncPlan ) } ,
		execNext: { value: execDoNext.bind( asyncPlan ) } ,
		execCallback: { value: execDoCallback } ,
		execLoopCallback: { value: execWhileCallback } ,
		execFinal: { value: execDoFinal.bind( asyncPlan ) }
	} ) ;
	
	// We only want the result of the first succeeding job
	asyncPlan.returnLastJobOnly = true ;
	asyncPlan.maxRecursion = global.__ASYNC_KIT__.defaultMaxRecursion ;
	
	asyncPlan.do( jobsData ) ;
	
	return asyncPlan ;
} ;



// Create an async foreach, parallel limit is preset to 1 (series) as default, but customizable with .parallel()
async.foreach = async.forEach = function foreach( jobsData , iterator )
{
	var asyncPlan = Object.create( async.Plan.prototype , planCommonProperties ) ;
	
	Object.defineProperties( asyncPlan , {
		usingIsIterator: { value: true , writable: true , enumerable: true } ,
		errorsAreFatal: { value: false , writable: true , enumerable: true } ,
		execInit: { value: execDoInit.bind( asyncPlan ) } ,
		execNext: { value: execDoNext.bind( asyncPlan ) } ,
		execCallback: { value: execDoCallback } ,
		execLoopCallback: { value: execWhileCallback } ,
		execFinal: { value: execDoFinal.bind( asyncPlan ) }
	} ) ;
	
	asyncPlan.maxRecursion = global.__ASYNC_KIT__.defaultMaxRecursion ;
	
	asyncPlan.do( jobsData ) ;
	asyncPlan.iterator( iterator ) ;
	
	return asyncPlan ;
} ;



// Create an async map, parallel limit is preset to Infinity, but customizable with .parallel()
async.map = function map( jobsData , iterator )
{
	var asyncPlan = Object.create( async.Plan.prototype , planCommonProperties ) ;
	
	Object.defineProperties( asyncPlan , {
		parallelLimit: { value: Infinity , writable: true , enumerable: true } ,
		usingIsIterator: { value: true , writable: true , enumerable: true } ,
		errorsAreFatal: { value: false , writable: true , enumerable: true } ,
		// the result mapping should match the jobs' data 1:1
		returnMapping1to1: { value: true , writable: false , enumerable: true } ,
		execInit: { value: execDoInit.bind( asyncPlan ) } ,
		execNext: { value: execDoNext.bind( asyncPlan ) } ,
		execCallback: { value: execDoCallback } ,
		execLoopCallback: { value: execWhileCallback } ,
		execFinal: { value: execDoFinal.bind( asyncPlan ) }
	} ) ;
	
	asyncPlan.maxRecursion = global.__ASYNC_KIT__.defaultMaxRecursion ;
	
	asyncPlan.do( jobsData ) ;
	asyncPlan.iterator( iterator ) ;
	
	return asyncPlan ;
} ;



// Create an async reduce, force parallel limit to 1 (does it make sense to do it in parallel?)
async.reduce = function reduce( jobsData , defaultAggregate , iterator )
{
	var asyncPlan = Object.create( async.Plan.prototype , planCommonProperties ) ;
	
	Object.defineProperties( asyncPlan , {
		parallelLimit: { value: 1 , writable: false , enumerable: true } ,
		usingIsIterator: { value: true , writable: true , enumerable: true } ,
		execInit: { value: execDoInit.bind( asyncPlan ) } ,
		execNext: { value: execDoNext.bind( asyncPlan ) } ,
		execCallback: { value: execDoCallback } ,
		execLoopCallback: { value: execWhileCallback } ,
		execFinal: { value: execDoFinal.bind( asyncPlan ) }
	} ) ;
	
	if ( arguments.length < 3 )
	{
		// No defaultAggregate given
		iterator = defaultAggregate ;
		defaultAggregate = undefined ;
		
		// Force exec signature to have an aggregateArg
		asyncPlan.execMappingMinInputs = 0 ;
		asyncPlan.execMappingMaxInputs = 100 ;
		asyncPlan.execMappingCallbacks = [ 'finally' ] ;
		asyncPlan.execMappingAggregateArg = true ;
		asyncPlan.execMappingMinArgs = 1 ;
		asyncPlan.execMappingMaxArgs = 102 ;
		asyncPlan.execMappingSignature = '( aggregateArg, [finallyCallback] )' ;
	}
	
	asyncPlan.maxRecursion = global.__ASYNC_KIT__.defaultMaxRecursion ;
	asyncPlan.transmitAggregate = true ;
	asyncPlan.returnAggregate = true ;
	asyncPlan.defaultAggregate = defaultAggregate ;
	
	asyncPlan.do( jobsData ) ;
	asyncPlan.iterator( iterator ) ;
	
	return asyncPlan ;
} ;



// async while
// Here, simple callback is mandatory, since it should process its inputs correctly in order to loop or not
async.while = function _while( whileAction )
{
	var asyncPlan = Object.create( async.Plan.prototype , planCommonProperties ) ;
	
	Object.defineProperties( asyncPlan , {
		waterfallMode: { value: false , enumerable: true } ,
		whileAction: { value: undefined , writable: true , enumerable: true } ,
		whileActionBefore: { value: true , writable: false , enumerable: true } ,
		execInit: { value: execDoInit.bind( asyncPlan ) } ,
		execNext: { value: execDoNext.bind( asyncPlan ) } ,
		execCallback: { value: execDoCallback } ,
		execLoopCallback: { value: execWhileCallback } ,
		execFinal: { value: execDoFinal.bind( asyncPlan ) }
	} ) ;
	
	asyncPlan.maxRecursion = global.__ASYNC_KIT__.defaultMaxRecursion ;
	
	asyncPlan.while( whileAction ) ;
	
	return asyncPlan ;
} ;



// Create an async AND
async.and = function and( jobsData )
{
	var asyncPlan = Object.create( async.Plan.prototype , planCommonProperties ) ;
	
	Object.defineProperties( asyncPlan , {
		elseAction: { value: undefined , writable: true , enumerable: true } ,
		castToBoolean: { value: false , writable: true , enumerable: true } ,
		useLogicAnd: { value: true } ,
		execInit: { value: execDoInit.bind( asyncPlan ) } ,
		execNext: { value: execDoNext.bind( asyncPlan ) } ,
		execCallback: { value: execLogicCallback } ,
		execLoopCallback: { value: execWhileCallback } ,
		execFinal: { value: execLogicFinal.bind( asyncPlan ) }
	} ) ;
	
	asyncPlan.maxRecursion = global.__ASYNC_KIT__.defaultMaxRecursion ;
	
	asyncPlan.do( jobsData ) ;
	
	return asyncPlan ;
} ;



// Create an async OR (it's close to AND)
async.or = function or( jobsData )
{
	var asyncPlan = Object.create( async.Plan.prototype , planCommonProperties ) ;
	
	Object.defineProperties( asyncPlan , {
		elseAction: { value: undefined , writable: true , enumerable: true } ,
		castToBoolean: { value: false , writable: true , enumerable: true } ,
		useLogicAnd: { value: false } ,
		execInit: { value: execDoInit.bind( asyncPlan ) } ,
		execNext: { value: execDoNext.bind( asyncPlan ) } ,
		execCallback: { value: execLogicCallback } ,
		execLoopCallback: { value: execWhileCallback } ,
		execFinal: { value: execLogicFinal.bind( asyncPlan ) }
	} ) ;
	
	asyncPlan.maxRecursion = global.__ASYNC_KIT__.defaultMaxRecursion ;
	
	asyncPlan.do( jobsData ) ;
	
	return asyncPlan ;
} ;



// Syntaxic sugar: various if notations
async.if = function _if( jobsData )
{
	var asyncPlan = Object.create( async.Plan.prototype , planCommonProperties ) ;
	
	Object.defineProperties( asyncPlan , {
		elseAction: { value: true , writable: true , enumerable: true } ,
		castToBoolean: { value: true , writable: true , enumerable: true } ,
		useLogicAnd: { value: true } ,
		execInit: { value: execDoInit.bind( asyncPlan ) } ,
		execNext: { value: execDoNext.bind( asyncPlan ) } ,
		execCallback: { value: execLogicCallback } ,
		execLoopCallback: { value: execWhileCallback } ,
		execFinal: { value: execLogicFinal.bind( asyncPlan ) }
	} ) ;
	
	asyncPlan.maxRecursion = global.__ASYNC_KIT__.defaultMaxRecursion ;
	
	if ( jobsData ) { asyncPlan.do( jobsData ) ; }
	
	return asyncPlan ;
} ;

async.if.and = async.if ;
async.if.or = function ifOr( jobsData )
{
	var asyncPlan = Object.create( async.Plan.prototype , planCommonProperties ) ;
	
	Object.defineProperties( asyncPlan , {
		elseAction: { value: true , writable: true , enumerable: true } ,
		castToBoolean: { value: true , writable: true , enumerable: true } ,
		useLogicAnd: { value: false } ,
		execInit: { value: execDoInit.bind( asyncPlan ) } ,
		execNext: { value: execDoNext.bind( asyncPlan ) } ,
		execCallback: { value: execLogicCallback } ,
		execLoopCallback: { value: execWhileCallback } ,
		execFinal: { value: execLogicFinal.bind( asyncPlan ) }
	} ) ;
	
	asyncPlan.maxRecursion = global.__ASYNC_KIT__.defaultMaxRecursion ;
	
	if ( jobsData ) { asyncPlan.do( jobsData ) ; }
	
	return asyncPlan ;
} ;



			////////////////
			// Shorthands //
			////////////////



// Accept only one function, timeout it
// async.timeout( fn , timeout , [maxRetry] , [retryTimeout] , [multiply] , [maxRetryTimeout] )
//async.timeout = function timeout( func , timeoutValue , maxRetry , retryTimeout , multiply , maxRetryTimeout )
async.callTimeout = function callTimeout( timeout , completionCallback , fn , this_ )
{
	if ( typeof fn !== 'function' ) { throw new Error( '[async] async.callTimeout(): argument #0 should be a function' ) ; }
	
	var asyncPlan = Object.create( async.Plan.prototype , planCommonProperties ) ;
	
	Object.defineProperties( asyncPlan , {
		returnLastJobOnly: { value: true , enumerable: true } ,
		jobsTimeout: { value: timeout , writable: true , enumerable: true } ,
		execInit: { value: execDoInit.bind( asyncPlan ) } ,
		execNext: { value: execDoNext.bind( asyncPlan ) } ,
		execCallback: { value: execDoCallback } ,
		execLoopCallback: { value: execWhileCallback } ,
		execFinal: { value: execDoFinal.bind( asyncPlan ) }
	} ) ;
	
	var job = [ fn.bind( this_ ) ].concat( Array.prototype.slice.call( arguments , 4 ) ) ;
	asyncPlan.do( [ job ] ) ;
	
	//if ( arguments.length > 2 ) { asyncPlan.retry( maxRetry , retryTimeout , multiply , maxRetryTimeout ) ; }
	
	return asyncPlan.exec( completionCallback ) ;
} ;



			///////////////////////
			// Async Plan object //
			///////////////////////



// Set the job's list
async.Plan.prototype.do = function _do( jobsData )
{
	if ( this.locked ) { return this ; }
	
	if ( jobsData && typeof jobsData === 'object' ) { this.jobsData = jobsData ; }
	else if ( typeof jobsData === 'function' )  { this.jobsData = [ jobsData ] ; this.returnLastJobOnly = true ; }
	else { this.jobsData = {} ; }
	
	// Arrays and Objects are unified, Object.keys() does the job but...
	this.jobsKeys = Object.keys( this.jobsData ) ;
	
	// ... we should avoid troubles with arrays that have enumerable properties
	if ( Array.isArray( this.jobsData ) ) { this.jobsKeys.length = this.jobsData.length ; }
	
	return this ;
} ;



// Set number of jobs running in parallel
async.Plan.prototype.parallel = function parallel( parallelLimit )
{
	if ( this.locked ) { return this ; }
	
	if ( parallelLimit === undefined || parallelLimit === true ) { this.parallelLimit = Infinity ; }
	else if ( parallelLimit === false ) { this.parallelLimit = 1 ; }
	else if ( typeof parallelLimit === 'number' ) { this.parallelLimit = parallelLimit ; }
	
	return this ;
} ;



// Set race mode: we stop processing jobs when the first non-error job finish.
// Notice: when using race() this way (without the async.race() factory), you have to call .fatal( false ) too if you want the same behaviour.
async.Plan.prototype.race = function race( raceMode )
{
	if ( ! this.locked ) { this.raceMode = raceMode || raceMode === undefined ? true : false ; }
	return this ;
} ;



// Set waterfall mode: each job pass its results to the next job.
// Be careful, this does not support parallel mode ATM, but may fail silently.
// TODO: should probably raise an exception if we use parallel mode.
async.Plan.prototype.waterfall = function waterfall( waterfallMode )
{
	if ( ! this.locked ) { this.waterfallMode = waterfallMode || waterfallMode === undefined ? true : false ; }
	return this ;
} ;



// Set while action.
// Here, simple callback is mandatory, since it should process its inputs correctly in order to loop or not.
// If whileActionBefore is given and truthy, then it makes a do( jobs ).while( callback , true ) the same as while( whileAction ).do( jobs ):
// the while condition is evaluated before any jobs are processed.
// Write this form only for non-trivial uses.
async.Plan.prototype.while = function _while( whileAction , whileActionBefore )
{
	if ( this.locked ) { return this ; }
	this.whileAction = whileAction ;
	if ( whileActionBefore !== undefined ) { this.whileActionBefore = whileActionBefore ? true : false ; }
	return this ;
} ;



// Set the number of time to repeat the action.
// It is the same as while(), provided with a simple counter function.
async.Plan.prototype.repeat = function repeat( n )
{
	if ( this.locked ) { return this ; }
	
	var i = 0 ;
	
	if ( typeof n !== 'number' ) { n = parseInt( n ) ; }
	this.whileActionBefore = true ;
	
	this.whileAction = function( error , results , callback ) {
		// callback should be called last, to avoid sync vs async mess, hence i++ come first, and we check i<=n rather than i<n
		i ++ ;
		callback( i <= n ) ;
	} ;
	
	return this ;
} ;



// Set if errors are fatal or not
async.Plan.prototype.fatal = function fatal( errorsAreFatal )
{
	if ( ! this.locked ) { this.errorsAreFatal = errorsAreFatal || errorsAreFatal === undefined ? true : false ; }
	return this ;
} ;



// Cast logic jobs to boolean
async.Plan.prototype.boolean = function boolean( castToBoolean )
{
	if ( ! this.locked ) { this.castToBoolean = castToBoolean || castToBoolean === undefined ? true : false ; }
	return this ;
} ;



// Transmit error, in waterfall mode
async.Plan.prototype.transmitError = function transmitError( waterfallTransmitError )
{
	if ( ! this.locked ) { this.waterfallTransmitError = waterfallTransmitError || waterfallTransmitError === undefined ? true : false ; }
	return this ;
} ;



// Set the timeout for each jobs, the callback will be called with an async error for each of them that timeout
async.Plan.prototype.timeout = function timeout( jobsTimeout )
{
	if ( ! this.locked )
	{
		if ( typeof jobsTimeout === 'number' ) { this.jobsTimeout = jobsTimeout ; }
		else { this.jobsTimeout = undefined ; }
	}
	return this ;
} ;



// Set the 'safeTimeout' mode for all internal timeout
async.Plan.prototype.safeTimeout = function safeTimeout( useSafeTimeout )
{
	if ( ! this.locked ) { this.useSafeTimeout = useSafeTimeout === undefined ? true : !! useSafeTimeout ; }
} ;



// Set how to retry jobs in error
async.Plan.prototype.retry = function retry( maxRetry , timeout , multiply , maxTimeout )
{
	if ( this.locked ) { return this ; }
	
	if ( typeof maxRetry === 'number' ) { this.maxRetry = maxRetry ; }
	if ( typeof timeout === 'number' ) { this.retryTimeout = timeout ; }
	if ( typeof multiply === 'number' ) { this.retryMultiply = multiply ; }
	if ( typeof maxTimeout === 'number' ) { this.retryMaxTimeout = maxTimeout ; }
	
	return this ;
} ;



// Set if only the last job's results should be passed to the callback
async.Plan.prototype.lastJobOnly = function lastJobOnly( returnLastJobOnly )
{
	if ( ! this.locked ) { this.returnLastJobOnly = returnLastJobOnly || returnLastJobOnly === undefined ? true : false ; }
	return this ;
} ;



// Set if the result mapping should match the jobs' data 1:1
async.Plan.prototype.mapping1to1 = function mapping1to1( returnMapping1to1 )
{
	if ( ! this.locked ) { this.returnMapping1to1 = returnMapping1to1 || returnMapping1to1 === undefined ? true : false ; }
	return this ;
} ;



// Set the performer of the jobs: if set, do() is not feeded by callback but by arguments for this single callback function.
// The performer function should accept a callback as its last argument, in the nodejs' way.
async.Plan.prototype.using = function using( jobsUsing )
{
	if ( ! this.locked ) { this.jobsUsing = jobsUsing ; }
	return this ;
} ;



// Same as using(), but the given function receive an uniq "element" containing the whole job as its first argument:
// it is like using().usingIterator(), a behaviour similar to the async.foreach() factory
async.Plan.prototype.iterator = function iterator( iterator_ )
{
	if ( this.locked ) { return this ; }
	this.jobsUsing = iterator_ ;
	this.usingIsIterator = true ;
	return this ;
} ;



// Transmit aggregate, for aggregator mode (reduce, etc)
async.Plan.prototype.aggregator = function aggregator( transmitAggregate , returnAggregate , defaultAggregate )
{
	if ( ! this.locked )  { return this ; }
	this.transmitAggregate = transmitAggregate || transmitAggregate === undefined ? true : false ;
	this.returnAggregate = returnAggregate || returnAggregate === undefined ? true : false ;
	if ( arguments.length > 2 )  { this.defaultAggregate = defaultAggregate ; }
	return this ;
} ;



// Set if using() is an iterator (like async.foreach()), if so, the whole job is transmitted as one argument rather than an argument list
// NODOC
async.Plan.prototype.usingIterator = function usingIterator( usingIsIterator )
{
	if ( ! this.locked )  { this.usingIsIterator = usingIsIterator || usingIsIterator === undefined ? true : false ; }
	return this ;
} ;



// Set the async'ness of the flow, even sync jobs can be turned async
async.Plan.prototype.nice = function nice( asyncEventNice )
{
	if ( this.locked ) { return this ; }
	
	if ( asyncEventNice === undefined || asyncEventNice === null || asyncEventNice === true ) { this.asyncEventNice = -1 ; }
	else if ( asyncEventNice === false ) { this.asyncEventNice = -20 ; }
	else { this.asyncEventNice = asyncEventNice ; }
	
	return this ;
} ;



// Set the async'ness of the flow, even sync jobs can be turned async
async.Plan.prototype.setMaxRecursion = function setMaxRecursion( maxRecursion )
{
	if ( this.locked ) { return this ; }
	if ( maxRecursion >= 0 ) { this.maxRecursion = maxRecursion ; }
	return this ;
} ;



// Set action to do on completion.
// If catch() or else() are present and match, then() is not triggered.
async.Plan.prototype.then = function then( thenAction )
{
	if ( ! this.locked ) { this.thenAction = thenAction ; }
	return this ;
} ;



// Set action to do on logical false status
async.Plan.prototype.else = function _else( elseAction )
{
	if ( ! this.locked ) { this.elseAction = elseAction || true ; }
	return this ;
} ;



// Set action to do on error
async.Plan.prototype.catch = function _catch( catchAction )
{
	if ( ! this.locked ) { this.catchAction = catchAction || true ; }
	return this ;
} ;



// Set action to do, that trigger whether it has triggered or not any of then()/catch()/else()
async.Plan.prototype.finally = function _finally( finallyAction )
{
	if ( ! this.locked ) { this.finallyAction = finallyAction || true ; }
	return this ;
} ;



// Return a clone of the object
async.Plan.prototype.clone = function clone()
{
	var asyncPlan = Object.create( async.Plan.prototype , planCommonProperties ) ;
	treeExtend( null , asyncPlan , this ) ;
	asyncPlan.locked = false ;
	return asyncPlan ;
} ;



// Export the async.Plan object as an async function, so it can be called later at will
async.Plan.prototype.export = function _export( execMethod )
{
	switch ( execMethod )
	{
		case 'execFinally' :
			return this.clone().execFinally.bind( this ) ;
		case 'execThenCatch' :
			return this.clone().execThenCatch.bind( this ) ;
		case 'execThenElse' :
			return this.clone().execThenElse.bind( this ) ;
		case 'execThenElseCatch' :
			return this.clone().execThenElseCatch.bind( this ) ;
		case 'execArgs' :
			return this.clone().execArgs.bind( this ) ;
		case 'execKV' :
			return this.clone().execKV.bind( this ) ;
		default :
			return this.clone().exec.bind( this ) ;
	}
} ;



// This is the common exec() function, its arguments can be mapped using execMapping()
async.Plan.prototype.exec = function exec()
{
	var config = { inputs: [] , callbacks: {} } , offset = 0 , i ;
	
	if ( arguments.length < this.execMappingMinArgs )
	{
		throw new Error( "[async] Too few arguments, in this instance, the function signature is: fn" + this.execMappingSignature ) ;
	}
	else if ( arguments.length > this.execMappingMaxArgs )
	{
		throw new Error( "[async] Too much arguments, in this instance, the function signature is: fn" + this.execMappingSignature ) ;
	}
	
	if ( this.execMappingAggregateArg )
	{
		offset ++ ;
		config.aggregate = arguments[ 0 ] ;
	}
	
	if ( this.execMappingMinInputs === this.execMappingMaxInputs )
	{
		// Fixed arguments count, variable callback count possible
		config.inputs = Array.prototype.slice.call( arguments , offset , this.execMappingMaxInputs + offset ) ;
		
		for ( i = 0 ; i < this.execMappingCallbacks.length && config.inputs.length + i < arguments.length ; i ++ )
		{
			config.callbacks[ this.execMappingCallbacks[ i ] ] = arguments[ config.inputs.length + offset + i ] ;
		}
	}
	else
	{
		// Variable arguments count, fixed callback count
		config.inputs = Array.prototype.slice.call( arguments , offset , - this.execMappingCallbacks.length ) ;
		
		for ( i = 0 ; i < this.execMappingCallbacks.length ; i ++ )
		{
			config.callbacks[ this.execMappingCallbacks[ i ] ] = arguments[ config.inputs.length + offset + i ] ;
		}
	}
	
	return this.execInit( config ) ;
} ;



// Exec templates
async.Plan.prototype.execFinally = function execFinally( finallyCallback )
{
	return this.execInit( { inputs: [] , callbacks: { 'finally': finallyCallback } } ) ;
} ;



async.Plan.prototype.execThenCatch = function execThenCatch( thenCallback , catchCallback , finallyCallback )
{
	return this.execInit( { inputs: [] , callbacks: { 'then': thenCallback , 'catch': catchCallback , 'finally': finallyCallback } } ) ;
} ;



async.Plan.prototype.execThenElse = function execThenElse( thenCallback , elseCallback , finallyCallback )
{
	return this.execInit( { inputs: [] , callbacks: { 'then': thenCallback , 'else': elseCallback , 'finally': finallyCallback } } ) ;
} ;



async.Plan.prototype.execThenElseCatch = function execThenElseCatch( thenCallback , elseCallback , catchCallback , finallyCallback )
{
	return this.execInit( { inputs: [] , callbacks: { 'then': thenCallback , 'else': elseCallback , 'catch': catchCallback , 'finally': finallyCallback } } ) ;
} ;



async.Plan.prototype.execArgs = function execArgs()
{
	return this.execInit( { inputs: arguments , callbacks: {} } ) ;
} ;



// Configure the inputs of exec() function
// .callbacks
// .minInputs
// .maxInputs
// .inputsName
// .aggregateArg
async.Plan.prototype.execMapping = function execMapping( config )
{
	if ( this.locked )  { return this ; }
	
	config = treeExtend( null , { minInputs: 0 , maxInputs: 0 } , config ) ;
	
	var i , j , maxUnnamed = 5 ;
	
	config.minInputs = parseInt( config.minInputs ) ;
	config.maxInputs = parseInt( config.maxInputs ) ;
	
	if ( config.minInputs < config.maxInputs )
	{
		this.execMappingMinInputs = config.minInputs ;
		this.execMappingMaxInputs = config.maxInputs ;
	}
	else
	{
		// User is stOopid, swap...
		this.execMappingMinInputs = config.maxInputs ;
		this.execMappingMaxInputs = config.minInputs ;
	}
	
	this.execMappingCallbacks = Array.isArray( config.callbacks ) ? config.callbacks : [] ;
	this.execMappingInputsName = Array.isArray( config.inputsName ) ? config.inputsName : [] ;
	this.execMappingSignature = '( ' ;
	
	if ( this.execMappingMinInputs === this.execMappingMaxInputs )
	{
		// Fixed input count, variable callback count possible
		this.execMappingMinArgs = this.execMappingMinInputs ;
		this.execMappingMaxArgs = this.execMappingMaxInputs + this.execMappingCallbacks.length ;
		
		if ( config.aggregateArg )
		{
			this.execMappingAggregateArg = config.aggregateArg ;
			this.execMappingMinArgs ++ ;
			this.execMappingMaxArgs ++ ;
			this.execMappingSignature += 'aggregateValue' ;
		}
		
		for ( i = 0 ; i < this.execMappingMaxInputs ; i ++ )
		{
			if ( i > 0 || config.aggregateArg )  { this.execMappingSignature += ', ' ; }
			if ( i >= maxUnnamed && typeof this.execMappingInputsName[ i ] !== 'string' )  { this.execMappingSignature += '... ' ; break ; }
			
			this.execMappingSignature += typeof this.execMappingInputsName[ i ] === 'string' ? this.execMappingInputsName[ i ] : 'arg#' + ( i + 1 ) ;
		}
		
		for ( j = 0 ; j < this.execMappingCallbacks.length ; j ++ )
		{
			if ( i + j > 0 || config.aggregateArg )  { this.execMappingSignature += ', ' ; }
			this.execMappingSignature += '[' + this.execMappingCallbacks[ j ] + 'Callback]' ;
		}
	}
	else
	{
		// Variable input count, fixed callback count
		this.execMappingMinArgs = this.execMappingMinInputs + this.execMappingCallbacks.length ;
		this.execMappingMaxArgs = this.execMappingMaxInputs + this.execMappingCallbacks.length ;
		
		if ( config.aggregateArg )
		{
			this.execMappingAggregateArg = config.aggregateArg ;
			this.execMappingMinArgs ++ ;
			this.execMappingMaxArgs ++ ;
			this.execMappingSignature += 'aggregateValue' ;
		}
		
		for ( i = 0 ; i < this.execMappingMaxInputs ; i ++ )
		{
			if ( i > 0 || config.aggregateArg )  { this.execMappingSignature += ', ' ; }
			
			if ( i < this.execMappingMinInputs )
			{
				if ( i >= maxUnnamed && typeof this.execMappingInputsName[ i ] !== 'string' )  { this.execMappingSignature += '... ' ; break ; }
				this.execMappingSignature += typeof this.execMappingInputsName[ i ] === 'string' ? this.execMappingInputsName[ i ] : 'arg#' + ( i + 1 ) ;
			}
			else
			{
				if ( i >= maxUnnamed && typeof this.execMappingInputsName[ i ] !== 'string' )  { this.execMappingSignature += '[...] ' ; break ; }
				this.execMappingSignature += '[' + ( typeof this.execMappingInputsName[ i ] === 'string' ? this.execMappingInputsName[ i ] : 'arg#' + ( i + 1 ) ) + ']' ;
			}
		}
		
		for ( j = 0 ; j < this.execMappingCallbacks.length ; j ++ )
		{
			if ( i + j > 0 || config.aggregateArg )  { this.execMappingSignature += ', ' ; }
			this.execMappingSignature += this.execMappingCallbacks[ j ] + 'Callback' ;
		}
	}
	
	this.execMappingSignature += ' )' ;
	
	return this ;
} ;



// More sage and deterministic exec(), with all arguments given into a single object
async.Plan.prototype.execKV = function execKV( config )
{
	if ( config.inputs === undefined )  { config.inputs = [] ; }
	else if ( ! Array.isArray( config.inputs ) )  { config.inputs = [ config.inputs ] ; }
	
	if ( config.callbacks === undefined || typeof config.callbacks !== 'object' )  { config.callbacks = {} ; }
	if ( config.then )  { config.callbacks.then = config.then ; }
	if ( config.else )  { config.callbacks.else = config.else ; }
	if ( config.catch )  { config.callbacks.catch = config.catch ; }
	if ( config.finally )  { config.callbacks.finally = config.finally ; }
	
	// Nothing to do here, user is free to pass whatever is needed
	//if ( config.aggregate === undefined )  { config.aggregate = null ; }
	
	return this.execInit( config ) ;
} ;



// Internal, what to do on new loop iteration
async.Plan.prototype.execLoop = function execLoop( fromExecContext ) { return this.execInit( {} , fromExecContext ) ; } ;



// Internal exec of callback-like job/action
async.Plan.prototype.execJob = function execJob( execContext , job , indexOfKey , tryIndex )
{
	var self = this , args , key = execContext.jobsKeys[ indexOfKey ] ;
	
	// Create the job's context
	var jobContext = Object.create( async.JobContext.prototype , {
		execContext: { value: execContext , enumerable: true } ,
		indexOfKey: { value: indexOfKey , enumerable: true } ,
		tryIndex: { value: tryIndex , enumerable: true } ,
		aborted: { value: false , writable: true , enumerable: true } ,
		abortedLoop: { value: false , writable: true , enumerable: true }
	} ) ;
	
	// Add the callback to the context
	Object.defineProperty( jobContext , 'callback' , {
		value: this.execCallback.bind( this , jobContext ) ,
		enumerable: true
	} ) ;
	
	// Also add the jobContext into the bounded function: it's an alternate way to access a job's context.
	Object.defineProperty( jobContext.callback , 'jobContext' , {
		value: jobContext ,
		enumerable: true
	} ) ;
	
	
	// Set the current job's status to 'pending'
	execContext.jobsStatus[ key ].status = 'pending' ;
	execContext.jobsStatus[ key ].tried ++ ;
	
	// Set up the nice value? For instance only syncEmit() are used
	//jobContext.setNice( this.asyncEventNice ) ;
	
	
	if ( typeof this.jobsUsing === 'function' )
	{
		if ( this.usingIsIterator )
		{
			if ( this.transmitAggregate )
			{
				if ( this.jobsUsing.length <= 3 )
				{
					this.jobsUsing.call( jobContext , execContext.aggregate , job , jobContext.callback ) ;
				}
				else if ( this.jobsUsing.length <= 4 )
				{
					this.jobsUsing.call( jobContext , execContext.aggregate , job , Array.isArray( execContext.jobsData ) ? indexOfKey : key , jobContext.callback ) ;
				}
				else
				{
					this.jobsUsing.call( jobContext , execContext.aggregate , job , Array.isArray( execContext.jobsData ) ? indexOfKey : key , execContext.jobsData , jobContext.callback ) ;
				}
			}
			else
			{
				if ( this.jobsUsing.length <= 2 )
				{
					this.jobsUsing.call( jobContext , job , jobContext.callback ) ;
				}
				else if ( this.jobsUsing.length <= 3 )
				{
					this.jobsUsing.call( jobContext , job , Array.isArray( execContext.jobsData ) ? indexOfKey : key , jobContext.callback ) ;
				}
				else
				{
					this.jobsUsing.call( jobContext , job , Array.isArray( execContext.jobsData ) ? indexOfKey : key , execContext.jobsData , jobContext.callback ) ;
				}
			}
		}
		else if ( Array.isArray( job ) )
		{
			args = job.slice() ;
			
			if ( this.transmitAggregate )  { args.unshift( execContext.aggregate ) ; }
			
			args.push( jobContext.callback ) ;
			this.jobsUsing.apply( jobContext , args ) ;
		}
		else
		{
			this.jobsUsing.call( jobContext , job , jobContext.callback ) ;
		}
	}
	else if ( typeof job === 'function' )
	{
		if ( this.waterfallMode && indexOfKey > 0 )
		{
			// remove the first, error arg if waterfallTransmitError is false
			//console.log( index , key , execContext.results ) ;
			args = execContext.results[ execContext.jobsKeys[ indexOfKey - 1 ] ].slice( this.waterfallTransmitError ? 0 : 1 ) ;
			args.push( jobContext.callback ) ;
			job.apply( jobContext , args ) ;
		}
		else if ( Array.isArray( this.jobsUsing ) || this.execMappingMaxInputs )
		{
			if ( Array.isArray( this.jobsUsing ) ) { args = treeExtend( null , [] , this.jobsUsing , execContext.execInputs ) ; }
			else { args = treeExtend( null , [] , execContext.execInputs ) ; }
			
			args.push( jobContext.callback ) ;
			job.apply( jobContext , args ) ;
		}
		else
		{
			job.call( jobContext , jobContext.callback ) ;
		}
	}
	else if ( Array.isArray( job ) && typeof job[ 0 ] === 'function' )
	{
		args = job.slice( 1 ) ;
		args.push( jobContext.callback ) ;
		job[ 0 ].apply( jobContext , args ) ;
	}
	else if ( typeof job === 'object' && job instanceof async.Plan )
	{
		// What to do with jobUsing and execContext.execInputs here? Same as if( typeof job === 'function' ) ?
		job.exec( jobContext.callback ) ;
	}
	else
	{
		this.execCallback.call( this , jobContext ) ;
		return this ;
	}
	
	
	// Timers management
	if ( execContext.jobsTimeoutTimers[ key ] !== undefined )
	{
		clearTimeout( execContext.jobsTimeoutTimers[ key ] ) ;
		execContext.jobsTimeoutTimers[ key ] = undefined ;
	}
	
	if ( execContext.retriesTimers[ key ] !== undefined )
	{
		clearTimeout( execContext.retriesTimers[ key ] ) ;
		execContext.retriesTimers[ key ] = undefined ;
	}
	
	if ( typeof this.jobsTimeout === 'number' && this.jobsTimeout !== Infinity )
	{
		execContext.jobsTimeoutTimers[ key ] = setTimeout( function() {
			execContext.jobsTimeoutTimers[ key ] = undefined ;
			execContext.jobsStatus[ key ].status = 'timeout' ;
			jobContext.emit( 'timeout' ) ;
			self.execCallback.call( self , jobContext , new async.AsyncError( 'jobTimeout' ) ) ;
		} , this.jobsTimeout ) ;
	}
	
	return this ;
} ;



// Internal exec of callback-like action
async.Plan.prototype.execAction = function execAction( execContext , action , args )
{
	// call the matching action
	if ( typeof action === 'function' )
	{
		action.apply( execContext , args ) ;
	}
	else if ( typeof action === 'object' && action instanceof async.Plan )
	{
		action.exec() ;
	}
} ;



			/////////////////////////////////////////////////////////////////////////
			// Async JobContext: Context of a job execution, transmitted as *this* //
			/////////////////////////////////////////////////////////////////////////



// Empty constructor, it is just there to support instanceof operator
async.JobContext = function JobContext()
{
	throw new Error( "[async] Cannot create an async JobContext object directly" ) ;
} ;

// Extends it from EventEmitter
async.JobContext.prototype = Object.create( NextGenEvents.prototype ) ;
async.JobContext.prototype.constructor = async.JobContext ;



// Permit a userland-side abort of the job's queue
async.JobContext.prototype.abort = function abort()
{
	this.aborted = true ;
	this.callback.apply( undefined , arguments ) ;
} ;



// Permit a userland-side abort of the job's queue, and event the whole loop
async.JobContext.prototype.abortLoop = function abortLoop()
{
	this.aborted = true ;
	this.abortedLoop = true ;
	this.callback.apply( undefined , arguments ) ;
} ;



			//////////////////////////////////////////////////
			// Async ExecContext: Context of plan execution //
			//////////////////////////////////////////////////



// Empty constructor, it is just there to support instanceof operator
async.ExecContext = function ExecContext()
{
	throw new Error( "[async] Cannot create an async ExecContext object directly" ) ;
} ;

// Extends it from EventEmitter
async.ExecContext.prototype = Object.create( NextGenEvents.prototype ) ;
async.ExecContext.prototype.constructor = async.ExecContext ;



// This is used to complete jobsStatus only on-demand, so big data that are not object (e.g. big string)
// does not get duplicated for nothing
async.ExecContext.prototype.getJobsStatus = function getJobsStatus()
{
	var i , key , fullJobsStatus = Array.isArray( this.jobsData ) ? [] : {} ;
	
	for ( i = 0 ; i < this.jobsKeys.length ; i ++ )
	{
		key = this.jobsKeys[ i ] ;
		
		fullJobsStatus[ key ] = treeExtend( null , {
				job: this.jobsData[ key ] ,
				result: this.results[ key ]
			} ,
			this.jobsStatus[ key ]
		) ;
	}
	
	return fullJobsStatus ;
} ;



function execDoInit( config , fromExecContext )
{
	var i , execContext , isArray = Array.isArray( this.jobsData ) ;
	
	if ( fromExecContext && fromExecContext.whileIterator === -1 )
	{
		// This is a async.while().do() construct, reuse the parent context
		execContext = fromExecContext ;
		execContext.whileIterator = 0 ;
	}
	else
	{
		// Create instanceof ExecContext
		execContext = Object.create( async.ExecContext.prototype , {
			plan: { value: this } ,
			aggregate: { value: ( 'aggregate' in config  ? config.aggregate : this.defaultAggregate ) , writable: true , enumerable: true } ,
			results: { value: ( isArray ? [] : {} ) , writable: true , enumerable: true } ,
			result: { value: undefined , writable: true , enumerable: true } , // Conditionnal version
			jobsTimeoutTimers: { value: ( isArray ? [] : {} ) , writable: true } ,
			jobsStatus: { value: ( isArray ? [] : {} ) , writable: true , enumerable: true } ,
			retriesTimers: { value: ( isArray ? [] : {} ) , writable: true } ,
			retriesCounter: { value: ( isArray ? [] : {} ) , writable: true , enumerable: true } ,
			tryUserResponseCounter: { value: ( isArray ? [] : {} ) , writable: true , enumerable: true } ,
			tryResponseCounter: { value: ( isArray ? [] : {} ) , writable: true , enumerable: true } ,
			iterator: { value: 0 , writable: true , enumerable: true } ,
			pending: { value: 0 , writable: true , enumerable: true } ,
			resolved: { value: 0 , writable: true , enumerable: true } ,
			ok: { value: 0 , writable: true , enumerable: true } ,
			failed: { value: 0 , writable: true , enumerable: true } ,
			status: { value: undefined , writable: true , enumerable: true } ,
			error: { value: undefined , writable: true , enumerable: true } ,
			statusTriggerJobsKey: { value: undefined , writable: true , enumerable: true } ,
			whileStatus: { value: undefined , writable: true } ,
				// true if current execContext has looped in another execContext (one loop per execContext possible)
				// false if this execContext will never loop, undefined if this isn't settled
			whileChecked: { value: false , writable: true }
		} ) ;
		
		// Add some properties depending on inherited ExecContext or not
		if ( ! fromExecContext )
		{
			// This is the top-level/first ExecContext
			Object.defineProperties( execContext , {
				root: { value: execContext , enumerable: true } ,
				jobsData: {
					value: ( isArray ? this.jobsData.slice(0) : treeExtend( null , {} , this.jobsData ) ) ,
					enumerable: true
				} ,
				jobsKeys: { value: this.jobsKeys.slice(0) , enumerable: true } ,
				execInputs: { value: config.inputs , enumerable: true } ,
				execCallbacks: { value: config.callbacks } ,
				whileIterator: { value: 0 , enumerable: true , writable: true }
			} ) ;
		}
		else
		{
			// This is a loop, and this ExecContext is derived from the first one
			Object.defineProperties( execContext , {
				root: { value: fromExecContext.root , enumerable: true } ,
				jobsData: { value: fromExecContext.jobsData , enumerable: true } ,
				jobsKeys: { value: fromExecContext.jobsKeys , enumerable: true } ,
				execInputs: { value: fromExecContext.execInputs , enumerable: true } ,
				execCallbacks: { value: fromExecContext.execCallbacks } ,
				whileIterator: { value: fromExecContext.whileIterator + 1 , enumerable: true , writable: true }
			} ) ;
		}
		
		// Add more properties depending on previous properties
		Object.defineProperties( execContext , {
			waiting: { value: execContext.jobsKeys.length , writable: true , enumerable: true }
		} ) ;
		
		// Init the jobsStatus
		for ( i = 0 ; i < execContext.jobsKeys.length ; i ++ )
		{
			execContext.jobsStatus[ execContext.jobsKeys[ i ] ] = {
				status: 'waiting' ,
				errors: [] ,
				tried: 0
			} ;
		}
		
		// Set up the nice value
		execContext.setNice( this.asyncEventNice ) ;
		
		
		// Initialize event listeners, only the first time
		if ( fromExecContext === undefined )
		{
			// Register execFinal to the 'resolved' event
			execContext.root.on( 'resolved' , this.execFinal.bind( this , execContext ) ) ;
			
			
			// Register whileAction to the 'while' event and exec to the 'nextLoop' event
			// Here, simple callback is mandatory
			if ( typeof this.whileAction === 'function' )
			{
				execContext.root.on( 'while' , this.whileAction.bind( this ) ) ;
				execContext.root.on( 'nextLoop' , this.execLoop.bind( this ) ) ;
			}
			else
			{
				this.whileAction = undefined ; // falsy value: do not trigger while code
				execContext.whileStatus = false ; // settle while status to false
			}
			
			
			// Register execNext to the next event
			execContext.root.on( 'next' , this.execNext.bind( this ) ) ;
			
			
			// If we are in a async.while().do() scheme, start whileAction before doing anything
			if ( this.whileAction && this.whileActionBefore )
			{
				execContext.whileIterator = -1 ;
				execContext.root.emit( 'while' , execContext.error , execContext.results , this.execLoopCallback.bind( this , execContext ) , null ) ;
				return this ;
			}
		}
	}
	
	// If no jobs are provided, then exit right now
	if ( execContext.jobsKeys.length <= 0 )
	{
		execContext.root.emit( 'resolved' , execContext.error , execContext.results ) ;
		execContext.root.emit( 'progress' , {
				resolved: execContext.resolved ,
				ok: execContext.ok ,
				failed: execContext.failed ,
				pending: execContext.pending ,
				waiting: execContext.waiting ,
				loop: execContext.whileIterator
			} ,
			execContext.error , execContext.results
		) ;
		execContext.root.emit( 'finish' , execContext.error , execContext.results ) ;
		return execContext.root ;
	}
	
	// Run...
	execContext.root.emit( 'next' , execContext ) ;
	
	// If uncommented, «if» will emit a «progress» event too, which we don't want
	//execContext.root.emit( 'progress' , { resolved: execContext.resolved , pending: execContext.pending , waiting: execContext.waiting , loop: execContext.whileIterator } , execContext.results ) ;
	
	return execContext.root ;
}



// Iterator/next
function execDoNext( execContext )
{
	// Stack overflow/recursion protection against synchronous jobs
	if ( global.__ASYNC_KIT__.recursionCounter >= execContext.plan.maxRecursion )
	{
		//process.stdout.write( 'Alert: high recursion counter: ' + global.__ASYNC_KIT__.recursionCounter + '\n' ) ;
		process.nextTick( execDoNext.bind( this , execContext ) ) ;
		return ;
	}
	
	var self = this , indexOfKey , key , length = execContext.jobsKeys.length , startIndex , endIndex ;
	
	startIndex = execContext.iterator ;
	
	for ( ; execContext.iterator < length && execContext.pending < this.parallelLimit ; execContext.iterator ++ )
	{
		execContext.pending ++ ;
		execContext.waiting -- ;
		
		// Current key...
		indexOfKey = execContext.iterator ;
		key = execContext.jobsKeys[ indexOfKey ] ;
		
		// Set retriesCounter[] to 0 for this key
		execContext.retriesCounter[ key ] = 0 ;
		
		// Create the retries array for this key
		execContext.tryResponseCounter[ key ] = [] ;
		execContext.tryResponseCounter[ key ][ 0 ] = 0 ;
		execContext.tryUserResponseCounter[ key ] = [] ;
		execContext.tryUserResponseCounter[ key ][ 0 ] = 0 ;
		
		// This is to make the result's keys in the same order than the jobs's keys
		execContext.results[ key ] = undefined ;
		
		// execJob() later, or synchronous jobs will mess up the current code flow
		
		endIndex = execContext.iterator ;
	}
	
	// Defered execution of jobs
	for ( indexOfKey = startIndex ; indexOfKey <= endIndex ; indexOfKey ++ )
	{
		global.__ASYNC_KIT__.recursionCounter ++ ;
		this.execJob( execContext , execContext.jobsData[ execContext.jobsKeys[ indexOfKey ] ] , indexOfKey , 0 ) ;
		global.__ASYNC_KIT__.recursionCounter -- ;
	}
}



// Result callback
function execDoCallback( jobContext , error )
{
	var execContext = jobContext.execContext ,
		aborted = jobContext.aborted ,
		abortedLoop = jobContext.abortedLoop ,
		indexOfKey = jobContext.indexOfKey ,
		tryIndex = jobContext.tryIndex ;
	
	var self = this , timeout , nextTryIndex , length = execContext.jobsKeys.length , key = execContext.jobsKeys[ indexOfKey ] ;
	
	// Emit() are postponed at the end of the function: we want a consistent flow, wheither we are running sync or async
	var emitNext = false , emitResolved = false , emitFinish = false , emitWhile = false ;
	
	// Increment the current tryResponseCounter and tryUserResponseCounter
	execContext.tryResponseCounter[ key ][ tryIndex ] ++ ;
	if ( ! ( error instanceof async.AsyncError ) ) { execContext.tryUserResponseCounter[ key ][ tryIndex ] ++ ; }
	
	// Clear timers if needed
	if ( execContext.jobsTimeoutTimers[ key ] !== undefined )
	{
		clearTimeout( execContext.jobsTimeoutTimers[ key ] ) ;
		execContext.jobsTimeoutTimers[ key ] = undefined ;
	}
	
	if ( execContext.retriesTimers[ key ] !== undefined )
	{
		clearTimeout( execContext.retriesTimers[ key ] ) ;
		execContext.retriesTimers[ key ] = undefined ;
	}
	
	
	/*
	console.log( "\n  key: " , key ) ;
	console.log( "    retriesCounter: " , execContext.retriesCounter[ key ] , "/" , this.maxRetry ) ;
	console.log( "    tryIndex: " , tryIndex ) ;
	console.log( "    tryResponseCounter: " , execContext.tryResponseCounter[ key ][ tryIndex ] ) ;
	console.log( "    tryUserResponseCounter: " , execContext.tryUserResponseCounter[ key ][ tryIndex ] ) ;
	//*/
	
	//console.log( "    --> No result yet" ) ;
	
	// User code shouldn't call the callback more than once... even abort() is cancelled here
	if ( execContext.tryUserResponseCounter[ key ][ tryIndex ] > 1 )
	{
		execContext.jobsStatus[ key ].errors.push( new Error( 'This job has called its completion callback ' + execContext.tryUserResponseCounter[ key ][ tryIndex ] + ' times' ) ) ;
		return ;
	}
	
	// The callback has already been called for this job: either a user error or a timeout reach there before this job completion
	// Not sure if this case still exists
	if ( ! aborted && execContext.results[ key ] !== undefined )
	{
		return ;
	}
	//console.log( "    --> First user's response" ) ;
	
	// Eventually retry on error, if we can retry this job and if this try has not triggered another retry yet
	if ( ! aborted && error && this.maxRetry > execContext.retriesCounter[ key ] && execContext.tryResponseCounter[ key ][ tryIndex ] <= 1 )
	{
		// First "log" the error in the jobsStatus
		execContext.jobsStatus[ key ].errors.push( error ) ;
		
		timeout = this.retryTimeout * Math.pow( this.retryMultiply , execContext.retriesCounter[ key ] ) ;
		if ( timeout > this.retryMaxTimeout ) { timeout = this.retryMaxTimeout ; }
		
		/*
		console.log( "\n    Retry for key: " , key ) ;
		console.log( "      retryMultiply: " , this.retryMultiply ) ;
		console.log( "      retriesCounter: " , execContext.retriesCounter[ key ] ) ;
		console.log( "      timeout: " , timeout ) ;
		//*/
		
		execContext.retriesCounter[ key ] ++ ;
		nextTryIndex = execContext.retriesCounter[ key ] ;
		//console.log( "      nextTryIndex: " , nextTryIndex ) ;
		
		execContext.retriesTimers[ key ] = setTimeout( function() {
			//console.log( "    Retry Timeout triggered... for key: " , key ) ;
			execContext.retriesTimers[ key ] = undefined ;
			execContext.tryResponseCounter[ key ][ nextTryIndex ] = 0 ;
			execContext.tryUserResponseCounter[ key ][ nextTryIndex ] = 0 ;
			self.execJob( execContext , execContext.jobsData[ key ] , indexOfKey , nextTryIndex ) ;
		} , timeout ) ;
		
		return ;
	}
	//console.log( "    --> Don't have to retry" ) ;
	
	// If it is an error and posterior tries are in progress
	if ( ! aborted && error && tryIndex < execContext.retriesCounter[ key ] ) { return ; }
	//console.log( "    --> Can proceed results" ) ;
	
	
	// Update stats & results
	execContext.resolved ++ ;
	execContext.pending -- ;
	execContext.aggregate = arguments[ 2 ] ;
	
	if ( aborted )
	{
		execContext.failed ++ ;
		execContext.jobsStatus[ key ].status = 'aborted' ;
	}
	else if ( error )
	{
		execContext.failed ++ ;
		execContext.jobsStatus[ key ].errors.push( error ) ;
		if ( error instanceof async.AsyncError && error.message === 'jobTimeout' ) { execContext.jobsStatus[ key ].status = 'timeout' ; }
		else { execContext.jobsStatus[ key ].status = 'failed' ; }
	}
	else
	{
		execContext.ok ++ ;
		execContext.jobsStatus[ key ].status = 'ok' ;
	}
	
	if ( this.returnMapping1to1 )  { execContext.results[ key ] = arguments[ 2 ] ; }
	else  { execContext.results[ key ] = Array.prototype.slice.call( arguments , 1 ) ; }
	
	
	// Check immediate success or failure
	if ( execContext.status === undefined )
	{
		if ( this.raceMode && ! error )
		{
			execContext.status = 'ok' ;
			execContext.statusTriggerJobsKey = key ;
			
			if ( this.whileAction && ! abortedLoop ) { emitWhile = true ; }
			else { emitResolved = true ; }
		}
		else if ( ! this.raceMode && error && this.errorsAreFatal )
		{
			execContext.status = 'fail' ;
			execContext.error = error ;
			execContext.statusTriggerJobsKey = key ;
			
			if ( this.whileAction && ! abortedLoop ) { emitWhile = true ; }
			else { emitResolved = true ; }
		}
		else if ( aborted )
		{
			execContext.status = 'aborted' ;
			execContext.statusTriggerJobsKey = key ;
			
			if ( this.whileAction && ! abortedLoop ) { emitWhile = true ; }
			else { emitResolved = true ; }
		}
	}
	
	
	// What to do next?
	if ( execContext.resolved >= length )
	{
		// We have resolved everything
		
		if ( execContext.status === undefined )
		{
			// If still no status, fix the status and emit 'resolved' and 'finish'
			if ( this.raceMode ) { execContext.status = 'fail' ; }
			else { execContext.status = 'ok' ; }
			execContext.statusTriggerJobsKey = key ;
			
			if ( this.whileAction ) { emitWhile = true ; }
			else { emitResolved = emitFinish = true ; }
		}
		else
		{
			// If we are here, whileAction (if any) has already been called
			// So if it is already settled, and false, emit 'finish'
			if ( ! this.whileAction || ( execContext.whileChecked && execContext.whileStatus !== true ) ) { emitFinish = true ; }
		}
	}
	else if ( execContext.status === undefined )
	{
		// Iterate to the next job if status have not been settled (or settled to error in a non-race mode if errors are not fatal)
		if ( execContext.iterator < length ) { emitNext = true ; }
	}
	else if ( execContext.pending <= 0 )
	{
		// No more item are pending, so we can emit 'finish'
		
		// If we are here, whileAction (if any) has already been called
		// So if it is already settled, and false, emit 'finish'
		if ( ! this.whileAction || ( execContext.whileChecked && execContext.whileStatus !== true ) ) { emitFinish = true ; }
	}
	
	// Emit events, the order matter
	if ( emitResolved ) { execContext.root.emit( 'resolved' , execContext.error , execContext.results ) ; }
	if ( emitNext ) { execContext.root.emit( 'next' , execContext ) ; }
	if ( emitWhile ) { execContext.root.emit( 'while' , execContext.error , execContext.results , this.execLoopCallback.bind( this , execContext ) , null ) ; }
	execContext.root.emit( 'progress' , {
			resolved: execContext.resolved ,
			ok: execContext.ok ,
			failed: execContext.failed ,
			pending: execContext.pending ,
			waiting: execContext.waiting ,
			loop: execContext.whileIterator
		} ,
		execContext.error , execContext.results
	) ;
	if ( emitFinish ) { execContext.root.emit( 'finish' , execContext.error , execContext.results ) ; }
}



function execWhileCallback( execContext )
{
	var result , logic ;
	
	// Emit() are postponed at the end of the function: we want a consistent flow, wheither we are running sync or async
	var emitNextLoop = false , emitResolved = false , emitFinish = false ;
	
	// Arguments checking for fn( [Error] , logic )
	if ( arguments.length <= 1 ) { result = undefined ; logic = false ; }
	else if ( arguments[ 1 ] instanceof Error ) { execContext.error = arguments[ 1 ] ; result = arguments[ 1 ] ; logic = false ; }
	else if ( arguments.length <= 2 ) { result = arguments[ 1 ] ; logic = result ? true : false ; }
	else { result = arguments[ 2 ] ; logic = result ? true : false ; }
	
	/*
	console.log( 'execWhileCallback(), logic: ' + logic + ', result: ' + result ) ;
	console.log( arguments ) ;
	*/
	
	if ( logic )
	{
		execContext.whileStatus = true ;
		emitNextLoop = true ;
	}
	else
	{
		execContext.whileStatus = false ;
		emitResolved = true ;
		if ( execContext.pending <= 0 ) { emitFinish = true ; }
	}
	
	// Emit events, the order is important
	if ( emitResolved ) { execContext.root.emit( 'resolved' , execContext.error , execContext.results ) ; }
	if ( emitNextLoop ) { execContext.root.emit( 'nextLoop' , execContext ) ; }
	if ( emitFinish ) { execContext.root.emit( 'finish' , execContext.error , execContext.results ) ; }
	
	execContext.whileChecked = true ;
}



// What to do when the job is resolved
function execDoFinal( execContext , error , results )
{
	var toReturn ;
	
	if ( error )
	{
		// Catch...
		// Should catch() get all the results?
		if ( this.returnAggregate )  { toReturn = [ error , execContext.aggregate ] ; }
		else if ( this.returnLastJobOnly )  { toReturn = results[ execContext.statusTriggerJobsKey ] ; }
		else  { toReturn = [ error , results ] ; }
		
		if ( this.catchAction )  { this.execAction( execContext , this.catchAction , toReturn ) ; }
		if ( error && execContext.execCallbacks.catch )  { this.execAction( execContext , execContext.execCallbacks.catch , toReturn ) ; }
	}
	else
	{
		// Then...
		if ( this.returnAggregate )  { toReturn = [ execContext.aggregate ] ; }
		else if ( this.returnLastJobOnly )  { toReturn = results[ execContext.statusTriggerJobsKey ].slice( 1 ) ; }
		else  { toReturn = [ results ] ; }
		
		if ( this.thenAction )  { this.execAction( execContext , this.thenAction , toReturn ) ; }
		if ( execContext.execCallbacks.then )  { this.execAction( execContext , execContext.execCallbacks.then , toReturn ) ; }
	}
	
	// Finally...
	if ( this.returnAggregate )  { toReturn = [ error , execContext.aggregate ] ; }
	else if ( this.returnLastJobOnly )  { toReturn = results[ execContext.statusTriggerJobsKey ] ; }
	else  { toReturn = [ error , results ] ; }
	
	if ( this.finallyAction )  { this.execAction( execContext , this.finallyAction , toReturn ) ; }
	if ( execContext.execCallbacks.finally )  { this.execAction( execContext , execContext.execCallbacks.finally , toReturn ) ; }
}



// Handle AND & OR
function execLogicCallback( jobContext )
{
	var execContext = jobContext.execContext ,
		indexOfKey = jobContext.indexOfKey ,
		tryIndex = jobContext.tryIndex ;
	
	var self = this , logic , timeout , nextTryIndex , error ,
		length = execContext.jobsKeys.length , key = execContext.jobsKeys[ indexOfKey ] ;
	
	// Emit() are postponed at the end of the function
	var emitNext = false , emitResolved = false , emitFinish = false ;
	
	// Arguments checking for fn( [Error] , logic )
	if ( arguments.length <= 1 ) { execContext.result = undefined ; logic = false ; }
	else if ( arguments[ 1 ] instanceof Error ) { execContext.error = error = arguments[ 1 ] ; execContext.result = arguments[ 1 ] ; logic = false ; }
	else if ( arguments.length <= 2 ) { execContext.result = arguments[ 1 ] ; logic = execContext.result ? true : false ; }
	else { execContext.result = arguments[ 2 ] ; logic = execContext.result ? true : false ; }
	
	
	
	// Increment the current tryResponseCounter and tryUserResponseCounter
	execContext.tryResponseCounter[ key ][ tryIndex ] ++ ;
	if ( ! ( error instanceof async.AsyncError ) ) { execContext.tryUserResponseCounter[ key ][ tryIndex ] ++ ; }
	
	// Clear timers if needed
	if ( execContext.jobsTimeoutTimers[ key ] !== undefined )
	{
		clearTimeout( execContext.jobsTimeoutTimers[ key ] ) ;
		execContext.jobsTimeoutTimers[ key ] = undefined ;
	}
	
	if ( execContext.retriesTimers[ key ] !== undefined )
	{
		clearTimeout( execContext.retriesTimers[ key ] ) ;
		execContext.retriesTimers[ key ] = undefined ;
	}
	
	
	/*
	console.log( "\n  key: " , key ) ;
	console.log( "    retriesCounter: " , execContext.retriesCounter[ key ] , "/" , this.maxRetry ) ;
	console.log( "    tryIndex: " , tryIndex ) ;
	console.log( "    tryResponseCounter: " , execContext.tryResponseCounter[ key ][ tryIndex ] ) ;
	console.log( "    tryUserResponseCounter: " , execContext.tryUserResponseCounter[ key ][ tryIndex ] ) ;
	//*/
	
	// The callback has already been called for this job: either a user error or a timeout reach there before this job completion
	if ( execContext.results[ key ] !== undefined ) { return ; }
	//console.log( "    --> No result yet" ) ;
	
	// User code shouldn't call the callback more than once
	if ( execContext.tryUserResponseCounter[ key ][ tryIndex ] > 1 ) { return ; }
	//console.log( "    --> First user's response" ) ;
	
	// Eventually retry on error, if we can retry this job and if this try has not triggered another retry yet
	if ( error && this.maxRetry > execContext.retriesCounter[ key ] && execContext.tryResponseCounter[ key ][ tryIndex ] <= 1 )
	{
		timeout = this.retryTimeout * Math.pow( this.retryMultiply , execContext.retriesCounter[ key ] ) ;
		if ( timeout > this.retryMaxTimeout ) { timeout = this.retryMaxTimeout ; }
		
		/*
		console.log( "\n    Retry for key: " , key ) ;
		console.log( "      retryMultiply: " , this.retryMultiply ) ;
		console.log( "      retriesCounter: " , execContext.retriesCounter[ key ] ) ;
		console.log( "      timeout: " , timeout ) ;
		//*/
		
		execContext.retriesCounter[ key ] ++ ;
		nextTryIndex = execContext.retriesCounter[ key ] ;
		//console.log( "      nextTryIndex: " , nextTryIndex ) ;
		
		execContext.retriesTimers[ key ] = setTimeout( function() {
			//console.log( "    Retry Timeout triggered... for key: " , key ) ;
			execContext.retriesTimers[ key ] = undefined ;
			execContext.tryResponseCounter[ key ][ nextTryIndex ] = 0 ;
			execContext.tryUserResponseCounter[ key ][ nextTryIndex ] = 0 ;
			self.execJob( execContext , execContext.jobsData[ key ] , indexOfKey , nextTryIndex ) ;
		} , timeout ) ;
		
		return ;
	}
	//console.log( "    --> Don't have to retry" ) ;
	
	// If it is an error and posterior tries are in progress
	if ( error && tryIndex < execContext.retriesCounter[ key ] ) { return ; }
	//console.log( "    --> Can proceed results" ) ;
	
	
	// Update stats & results
	execContext.resolved ++ ;
	execContext.pending -- ;
	
	if ( error )
	{
		execContext.failed ++ ;
		if ( error instanceof async.AsyncError && error.message === 'jobTimeout' ) { execContext.jobsStatus[ key ].status = 'timeout' ; }
		else { execContext.jobsStatus[ key ].status = 'failed' ; }
	}
	else
	{
		execContext.ok ++ ;
		execContext.jobsStatus[ key ].status = 'ok' ;
	}
	
	if ( this.castToBoolean && ( ! ( execContext.result instanceof Error ) || ! this.catchAction ) ) { execContext.result = logic ; }
	execContext.results[ key ] = execContext.result ;
	
	
	// Check immediate success or failure
	if ( logic !== this.useLogicAnd && execContext.status === undefined )
	{
		execContext.status = ! this.useLogicAnd ;
		emitResolved = true ;
	}
	
	
	// What to do next?
	if ( execContext.resolved >= length )
	{
		// We have resolved everything
		
		if ( execContext.status === undefined )
		{
			execContext.status = this.useLogicAnd ;
			emitResolved = true ;
		}
		
		emitFinish = true ;
	}
	else if ( execContext.status === undefined )
	{
		// Iterate to the next job if status have not been settled
		
		if ( execContext.iterator < length ) { emitNext =  true ; }
	}
	else if ( execContext.pending <= 0 )
	{
		// No more item are pending, so we can emit 'finish'
		
		emitFinish = true ;
	}
	
	// Emit events, the order matter
	if ( emitResolved ) { execContext.root.emit( 'resolved' , execContext.result ) ; }
	if ( emitNext ) { execContext.root.emit( 'next' , execContext ) ; }
	execContext.root.emit( 'progress' , { resolved: execContext.resolved , pending: execContext.pending , waiting: execContext.waiting , loop: execContext.whileIterator } , execContext.result ) ;
	if ( emitFinish ) { execContext.root.emit( 'finish' , execContext.result ) ; }
}



// What to do when the job is resolved
function execLogicFinal( execContext , result )
{
	// First, the internally registered action
	if ( result instanceof Error )
	{
		if ( this.catchAction ) { this.execAction( execContext , this.catchAction , [ result ] ) ; }
		else if ( this.elseAction ) { this.execAction( execContext , this.elseAction , [ result ] ) ; }
	}
	else if ( ! execContext.result && this.elseAction ) { this.execAction( execContext , this.elseAction , [ result ] ) ; }
	else if ( execContext.result && this.thenAction ) { this.execAction( execContext , this.thenAction , [ result ] ) ; }
	
	if ( this.finallyAction ) { this.execAction( execContext , this.finallyAction , [ result ] ) ; }
	
	
	// Same things, for execContext callback
	if ( result instanceof Error )
	{
		if ( execContext.execCallbacks.catch ) { this.execAction( execContext , execContext.execCallbacks.catch , [ result ] ) ; }
		else if ( execContext.execCallbacks.else ) { this.execAction( execContext , execContext.execCallbacks.else , [ result ] ) ; }
	}
	else if ( ! execContext.result && execContext.execCallbacks.else ) { this.execAction( execContext , execContext.execCallbacks.else , [ result ] ) ; }
	else if ( execContext.result && execContext.execCallbacks.then ) { this.execAction( execContext , execContext.execCallbacks.then , [ result ] ) ; }
	
	if ( execContext.execCallbacks.finally ) { this.execAction( execContext , execContext.execCallbacks.finally , [ result ] ) ; }
}




}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":47,"nextgen-events":41,"tree-kit/lib/extend.js":66}],11:[function(require,module,exports){
(function (process){
/*
	Async Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



var async = require( './async.js' ) ;



var exitInProgress = false ;



/*
	Asynchronously exit.
	
	Wait for all listeners of the 'asyncExit' event (on the 'process' object) to have called their callback.
	The listeners receive the exit code about to be produced and a completion callback.
*/

function exit( code , timeout )
{
	// Already exiting? no need to call it twice!
	if ( exitInProgress ) { return ; }
	
	exitInProgress = true ;
	
	var listeners = process.listeners( 'asyncExit' ) ;
	
	if ( ! listeners.length ) { process.exit( code ) ; return ; }
	
	if ( timeout === undefined ) { timeout = 1000 ; }
	
	async.parallel( listeners )
	.using( function( listener , usingCallback ) {
		
		if ( listener.length < 3 )
		{
			// This listener does not have a callback, it is interested in the event but does not need to perform critical stuff.
			// E.g. a server will not accept connection or data anymore, but doesn't need cleanup.
			listener( code , timeout ) ;
			usingCallback() ;
		}
		else
		{
			// This listener have a callback, it probably has critical stuff to perform before exiting.
			// E.g. a server that needs to gracefully exit will not accept connection or data anymore,
			// but still want to deliver request in progress.
			listener( code , timeout , usingCallback ) ;
		}
	} )
	.fatal( false )
	.timeout( timeout )
	.exec( function() {
		// We don't care about errors here... We are exiting!
		process.exit( code ) ;
	} ) ;
}

module.exports = exit ;


}).call(this,require('_process'))
},{"./async.js":9,"_process":47}],12:[function(require,module,exports){
/*
	Async Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



/*
	Safe Timeout.
	
	A timeout that ensure a task get the time to perform its action.
*/

exports.setSafeTimeout = function setSafeTimeout( fn , timeout )
{
	var timer = { isSafeTimeout: true } ;
	
	timer.timer = setTimeout( function() {
		timer.timer = setTimeout( function() {
			timer.timer = setTimeout( function() {
				timer.timer = setTimeout( fn , 0 ) ;
			} , timeout / 2 ) ;
		} , timeout / 2 ) ;
	} , 0 ) ;
	
	return timer ;
} ;



exports.clearSafeTimeout = function clearSafeTimeout( timer )
{
	if ( timer && typeof timer === 'object' && timer.isSafeTimeout )
	{
		clearTimeout( timer.timer ) ;
	}
	else
	{
		clearTimeout( timer ) ;
	}
} ;



},{}],13:[function(require,module,exports){
/*
	Async Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



var wrapper = {} ;
module.exports = wrapper ;


// Maybe I should have a look to the 'wrappy' package from npm

wrapper.timeout = function timeout( fn , timeout_ , fnThis )
{
	var fnWrapper = function() {
		
		var this_ = fnThis || this ,
			alreadyCalledBack = false ,
			args = Array.prototype.slice.call( arguments ) ,
			callback = args.pop() ;
		
		var callbackWrapper = function() {
			
			if ( alreadyCalledBack ) { return ; }
			
			alreadyCalledBack = true ;
			callback.apply( this_ , arguments ) ;
		} ;
		
		args.push( callbackWrapper ) ;
		fn.apply( this_ , args ) ;
		
		setTimeout( callbackWrapper.bind( undefined , new Error( 'Timeout' ) ) , timeout_ ) ;
	} ;
	
	// Should we copy own properties of fn into fnWrapper?
	
	return fnWrapper ;
} ;



},{}],14:[function(require,module,exports){
(function (process,global){
/*
	Async Try-Catch
	
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



function AsyncTryCatch() { throw new Error( "Use AsyncTryCatch.try() instead." ) ; }
module.exports = AsyncTryCatch ;
AsyncTryCatch.prototype.__prototypeUID__ = 'async-try-catch/AsyncTryCatch' ;
AsyncTryCatch.prototype.__prototypeVersion__ = require( '../package.json' ).version ;



if ( global.AsyncTryCatch )
{
	if ( global.AsyncTryCatch.prototype.__prototypeUID__ === 'async-try-catch/AsyncTryCatch' )
	{
		//console.log( "Already installed:" , global.AsyncTryCatch.prototype.__prototypeVersion__ , "current:" , AsyncTryCatch.prototype.__prototypeVersion__ ) ;
		
		var currentVersions = AsyncTryCatch.prototype.__prototypeVersion__.split( '.' ) ;
		var installedVersions = global.AsyncTryCatch.prototype.__prototypeVersion__.split( '.' ) ;
		
		// Basic semver comparison
		if (
			installedVersions[ 0 ] !== currentVersions[ 0 ] ||
			( currentVersions[ 0 ] === "0" && installedVersions[ 1 ] !== currentVersions[ 1 ] )
		)
		{
			throw new Error(
				"Incompatible version of AsyncTryCatch already installed on global.AsyncTryCatch: " +
				global.AsyncTryCatch.prototype.__prototypeVersion__ +
				", current version: " + AsyncTryCatch.prototype.__prototypeVersion__
			) ;
		}
	}
	else
	{
		throw new Error( "Incompatible module already installed on global.AsyncTryCatch" ) ;
	}
}
else
{
	global.AsyncTryCatch = AsyncTryCatch ;
	global.AsyncTryCatch.stack = [] ;
	global.AsyncTryCatch.substituted = false ;
	global.AsyncTryCatch.NextGenEvents = [] ;
}



if ( process.browser && ! global.setImmediate )
{
	global.setImmediate = function setImmediate( fn ) { return setTimeout( fn , 0 ) ; } ;
	global.clearImmediate = function clearImmediate( timer ) { return clearTimeout( timer ) ; } ;
}



if ( ! global.Vanilla ) { global.Vanilla = {} ; }
if ( ! global.Vanilla.setTimeout ) { global.Vanilla.setTimeout = setTimeout ; }
if ( ! global.Vanilla.setImmediate ) { global.Vanilla.setImmediate = setImmediate ; }
if ( ! global.Vanilla.nextTick ) { global.Vanilla.nextTick = process.nextTick ; }



AsyncTryCatch.try = function try_( fn )
{
	var self = Object.create( AsyncTryCatch.prototype , {
		fn: { value: fn , enumerable: true } ,
		parent: { value: global.AsyncTryCatch.stack[ global.AsyncTryCatch.stack.length - 1 ] }
	} ) ;
	
	return self ;
} ;



AsyncTryCatch.prototype.catch = function catch_( catchFn )
{
	Object.defineProperties( this , {
		catchFn: { value: catchFn , enumerable: true }
	} ) ;
	
	if ( ! global.AsyncTryCatch.substituted ) { AsyncTryCatch.substitute() ; }
	
	try {
		global.AsyncTryCatch.stack.push( this ) ;
		this.fn() ;
		global.AsyncTryCatch.stack.pop() ;
	}
	catch ( error ) {
		global.AsyncTryCatch.stack.pop() ;
		this.callCatchFn( error ) ;
	}
	
} ;



// Handle the bubble up
AsyncTryCatch.prototype.callCatchFn = function callCatchFn( error )
{
	if ( ! this.parent )
	{
		this.catchFn( error ) ;
		return ;
	}
	
	try {
		global.AsyncTryCatch.stack.push( this.parent ) ;
		this.catchFn( error ) ;
		global.AsyncTryCatch.stack.pop() ;
	}
	catch ( error ) {
		global.AsyncTryCatch.stack.pop() ;
		this.parent.callCatchFn( error ) ;
	}
} ;



// for setTimeout(), setImmediate(), process.nextTick()
AsyncTryCatch.timerWrapper = function timerWrapper( originalMethod , fn )
{
	var fn , context , wrapperFn ,
		args = Array.prototype.slice.call( arguments , 1 ) ;
	
	if ( typeof fn !== 'function' || ! global.AsyncTryCatch.stack.length )
	{
		return originalMethod.apply( this , args ) ;
	}
	
	context = global.AsyncTryCatch.stack[ global.AsyncTryCatch.stack.length - 1 ] ;
	
	wrapperFn = function timerWrapperFn() {
		try {
			global.AsyncTryCatch.stack.push( context ) ;
			return fn.apply( this , arguments ) ;
			global.AsyncTryCatch.stack.pop() ;
		}
		catch ( error ) {
			global.AsyncTryCatch.stack.pop() ;
			context.callCatchFn( error ) ;
		}
	} ;
	
	args[ 0 ] = wrapperFn ;
	
	return originalMethod.apply( this , args ) ;
} ;



// for Node-EventEmitter-compatible .addListener()
AsyncTryCatch.addListenerWrapper = function addListenerWrapper( originalMethod , eventName , fn , options , onceWrapper )
{
	var fn , context , wrapperFn , onceWrapperFired ;
	
	// NextGen event compatibility
	if ( typeof fn === 'object' )
	{
		options = fn ;
		fn = options.fn ;
		delete options.fn ;
	}
	
	if ( typeof fn !== 'function' || ! global.AsyncTryCatch.stack.length )
	{
		return originalMethod.call( this , eventName , fn , options ) ;
	}
	
	context = global.AsyncTryCatch.stack[ global.AsyncTryCatch.stack.length - 1 ] ;
	
	if ( onceWrapper )
	{
		onceWrapperFired = false ;
		
		wrapperFn = function listenerOnceWrapperFn() {
			if ( onceWrapperFired ) { return ; }
			onceWrapperFired = true ;
			this.removeListener( eventName , wrapperFn ) ;
			
			try {
				global.AsyncTryCatch.stack.push( context ) ;
				return fn.apply( this , arguments ) ;
				global.AsyncTryCatch.stack.pop() ;
			}
			catch ( error ) {
				global.AsyncTryCatch.stack.pop() ;
				context.callCatchFn( error ) ;
			}
		} ;
	}
	else
	{
		wrapperFn = function listenerWrapperFn() {
			try {
				global.AsyncTryCatch.stack.push( context ) ;
				return fn.apply( this , arguments ) ;
				global.AsyncTryCatch.stack.pop() ;
			}
			catch ( error ) {
				global.AsyncTryCatch.stack.pop() ;
				context.callCatchFn( error ) ;
			}
		} ;
	}
	
	// This is used to indicate to node.js core events that this function is a wrapper to another.
	// E.g. it is used internally by .removeListener() to find the registered wrapper from the original userland listener.
	wrapperFn.listener = fn ;
	
	return originalMethod.call( this , eventName , wrapperFn , options ) ;
} ;



AsyncTryCatch.setTimeout = AsyncTryCatch.timerWrapper.bind( undefined , global.Vanilla.setTimeout ) ;
AsyncTryCatch.setImmediate = AsyncTryCatch.timerWrapper.bind( undefined , global.Vanilla.setImmediate ) ;
AsyncTryCatch.nextTick = AsyncTryCatch.timerWrapper.bind( process , global.Vanilla.nextTick ) ;

// NodeEvents on()/addListener() replacement
AsyncTryCatch.addListener = function addListener( eventName , fn )
{
	return AsyncTryCatch.addListenerWrapper.call( this , AsyncTryCatch.NodeEvents.__addListener , eventName , fn ) ;
} ;

// NodeEvents once() replacement
AsyncTryCatch.addListenerOnce = function addListenerOnce( eventName , fn )
{
	return AsyncTryCatch.addListenerWrapper.call( this , AsyncTryCatch.NodeEvents.__addListener , eventName , fn , undefined , true ) ;
} ;

// NodeEvents removeListener() replacement
AsyncTryCatch.removeListener = function removeListener( eventName , fn )
{
	return AsyncTryCatch.NodeEvents.__removeListener.call( this , eventName , fn ) ;
} ;

// NextGen Events on()/addListener() replacement
AsyncTryCatch.ngevAddListener = function ngevAddListener( eventName , fn , options )
{
	if ( ! options ) { options = {} ; }
	if ( options.id === undefined ) { options.id = fn ; }
	
	return AsyncTryCatch.addListenerWrapper.call( this ,
		AsyncTryCatch.NextGenEvents[ this.asyncTryCatchId ].on ,
		eventName , fn , options ) ;
} ;

// NextGen Events once() replacement
AsyncTryCatch.ngevAddListenerOnce = function ngevAddListenerOnce( eventName , fn , options )
{
	if ( ! options ) { options = {} ; }
	if ( options.id === undefined ) { options.id = fn ; }
	
	return AsyncTryCatch.addListenerWrapper.call( this ,
		AsyncTryCatch.NextGenEvents[ this.asyncTryCatchId ].once ,
		eventName , fn , options ) ;
} ;

// NextGen Events off()/removeListener() replacement
AsyncTryCatch.ngevRemoveListener = function ngevRemoveListener( eventName , id )
{
	return AsyncTryCatch.NextGenEvents[ this.asyncTryCatchId ].off.call( this , eventName , id ) ;
} ;



AsyncTryCatch.substitute = function substitute()
{
	// This test should be done by the caller, because substitution could be incomplete
	// E.g. browser case: Node Events or NextGen Events are not loaded/accessible at time
	//if ( global.AsyncTryCatch.substituted ) { return ; }
	
	global.AsyncTryCatch.substituted = true ;
	
	global.setTimeout = AsyncTryCatch.setTimeout ;
	global.setImmediate = AsyncTryCatch.setTimeout ;
	process.nextTick = AsyncTryCatch.nextTick ;
	
	// Global is checked first, in case we are running inside a browser
	try {
		AsyncTryCatch.NodeEvents = global.EventEmitter || require( 'events' ) ;
	} catch ( error ) {}
	
	if ( AsyncTryCatch.NodeEvents )
	{
		if ( ! AsyncTryCatch.NodeEvents.__addListener )
		{
			AsyncTryCatch.NodeEvents.__addListener = AsyncTryCatch.NodeEvents.prototype.on ;
		}
		
		if ( ! AsyncTryCatch.NodeEvents.__addListenerOnce )
		{
			AsyncTryCatch.NodeEvents.__addListenerOnce = AsyncTryCatch.NodeEvents.prototype.once ;
		}
		
		if ( ! AsyncTryCatch.NodeEvents.__removeListener )
		{
			AsyncTryCatch.NodeEvents.__removeListener = AsyncTryCatch.NodeEvents.prototype.removeListener ;
		}
		
		AsyncTryCatch.NodeEvents.prototype.on = AsyncTryCatch.addListener ;
		AsyncTryCatch.NodeEvents.prototype.addListener = AsyncTryCatch.addListener ;
		AsyncTryCatch.NodeEvents.prototype.once = AsyncTryCatch.addListenerOnce ;
		AsyncTryCatch.NodeEvents.prototype.removeListener = AsyncTryCatch.removeListener ;
	}
	
	for ( var i = 0 ; i < AsyncTryCatch.NextGenEvents.length ; i ++ )
	{
		//console.log( 'substituting NextGenEvents' , i ) ;
		AsyncTryCatch.NextGenEvents[ i ].prototype.on = AsyncTryCatch.ngevAddListener ;
		AsyncTryCatch.NextGenEvents[ i ].prototype.addListener = AsyncTryCatch.ngevAddListener ;
		AsyncTryCatch.NextGenEvents[ i ].prototype.once = AsyncTryCatch.ngevAddListenerOnce ;
		AsyncTryCatch.NextGenEvents[ i ].prototype.off = AsyncTryCatch.ngevRemoveListener ;
		AsyncTryCatch.NextGenEvents[ i ].prototype.removeListener = AsyncTryCatch.ngevRemoveListener ;
	}
} ;



AsyncTryCatch.restore = function restore()
{
	// This test should be done by the caller, because substitution could be incomplete
	// E.g. browser case: Node Events or NextGen Events are not loaded/accessible at time
	//if ( ! global.AsyncTryCatch.substituted ) { return ; }
	
	global.AsyncTryCatch.substituted = false ;
	
	global.setTimeout = global.Vanilla.setTimeout ;
	global.setImmediate = global.Vanilla.setImmediate ;
	process.nextTick = global.Vanilla.nextTick ;
	
	if ( AsyncTryCatch.NodeEvents )
	{
		AsyncTryCatch.NodeEvents.prototype.on = AsyncTryCatch.NodeEvents.__addListener ;
		AsyncTryCatch.NodeEvents.prototype.addListener = AsyncTryCatch.NodeEvents.__addListener ;
		AsyncTryCatch.NodeEvents.prototype.once = AsyncTryCatch.NodeEvents.__addListenerOnce ;
		AsyncTryCatch.NodeEvents.prototype.removeListener = AsyncTryCatch.NodeEvents.__removeListener ;
	}
	
	for ( var i = 0 ; i < AsyncTryCatch.NextGenEvents.length ; i ++ )
	{
		AsyncTryCatch.NextGenEvents[ i ].prototype.on = AsyncTryCatch.NextGenEvents[ i ].on ;
		AsyncTryCatch.NextGenEvents[ i ].prototype.addListener = AsyncTryCatch.NextGenEvents[ i ].on ;
		AsyncTryCatch.NextGenEvents[ i ].prototype.once = AsyncTryCatch.NextGenEvents[ i ].once ;
		AsyncTryCatch.NextGenEvents[ i ].prototype.off = AsyncTryCatch.NextGenEvents[ i ].off ;
		AsyncTryCatch.NextGenEvents[ i ].prototype.removeListener = AsyncTryCatch.NextGenEvents[ i ].removeListener ;
	}
} ;



}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../package.json":15,"_process":47,"events":35}],15:[function(require,module,exports){
module.exports={
  "name": "async-try-catch",
  "version": "0.3.4",
  "description": "Async try catch",
  "main": "lib/AsyncTryCatch.js",
  "directories": {
    "test": "test"
  },
  "dependencies": {},
  "devDependencies": {
    "browserify": "^13.1.0",
    "expect.js": "^0.3.1",
    "jshint": "^2.9.3",
    "mocha": "^3.0.2",
    "nextgen-events": "^0.9.7",
    "uglify-js": "^2.7.3"
  },
  "scripts": {
    "test": "mocha -R dot"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/cronvel/async-try-catch.git"
  },
  "keywords": [
    "async",
    "try",
    "catch"
  ],
  "author": {
    "name": "Cédric Ronvel"
  },
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/cronvel/async-try-catch/issues"
  },
  "copyright": {
    "title": "Async Try-Catch",
    "years": [
      2015,
      2016
    ],
    "owner": "Cédric Ronvel"
  },
  "readme": "\n\n# Async Try-Catch\n\nThe name says it all: it performs async try catch. \n\n* License: MIT\n* Current status: beta\n* Platform: Node.js only\n\n",
  "readmeFilename": "README.md",
  "gitHead": "ab55eb1391c246e79f8482d6ffd292f0d808094a",
  "homepage": "https://github.com/cronvel/async-try-catch#readme",
  "_id": "async-try-catch@0.3.4",
  "_shasum": "e481b68ff368cbfca3a8b24150eb3e6b4b3c1682",
  "_from": "async-try-catch@0.3.4"
}

},{}],16:[function(require,module,exports){

},{}],17:[function(require,module,exports){
/*istanbul ignore start*/"use strict";

exports.__esModule = true;
exports. /*istanbul ignore end*/convertChangesToDMP = convertChangesToDMP;
// See: http://code.google.com/p/google-diff-match-patch/wiki/API
function convertChangesToDMP(changes) {
  var ret = [],
      change = /*istanbul ignore start*/void 0 /*istanbul ignore end*/,
      operation = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;
  for (var i = 0; i < changes.length; i++) {
    change = changes[i];
    if (change.added) {
      operation = 1;
    } else if (change.removed) {
      operation = -1;
    } else {
      operation = 0;
    }

    ret.push([operation, change.value]);
  }
  return ret;
}


},{}],18:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/convertChangesToXML = convertChangesToXML;
function convertChangesToXML(changes) {
  var ret = [];
  for (var i = 0; i < changes.length; i++) {
    var change = changes[i];
    if (change.added) {
      ret.push('<ins>');
    } else if (change.removed) {
      ret.push('<del>');
    }

    ret.push(escapeHTML(change.value));

    if (change.added) {
      ret.push('</ins>');
    } else if (change.removed) {
      ret.push('</del>');
    }
  }
  return ret.join('');
}

function escapeHTML(s) {
  var n = s;
  n = n.replace(/&/g, '&amp;');
  n = n.replace(/</g, '&lt;');
  n = n.replace(/>/g, '&gt;');
  n = n.replace(/"/g, '&quot;');

  return n;
}


},{}],19:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.arrayDiff = undefined;
exports. /*istanbul ignore end*/diffArrays = diffArrays;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/var arrayDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/arrayDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
arrayDiff.tokenize = arrayDiff.join = function (value) {
  return value.slice();
};

function diffArrays(oldArr, newArr, callback) {
  return arrayDiff.diff(oldArr, newArr, callback);
}


},{"./base":20}],20:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports['default'] = /*istanbul ignore end*/Diff;
function Diff() {}

Diff.prototype = { /*istanbul ignore start*/
  /*istanbul ignore end*/diff: function diff(oldString, newString) {
    /*istanbul ignore start*/var /*istanbul ignore end*/options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    var callback = options.callback;
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    this.options = options;

    var self = this;

    function done(value) {
      if (callback) {
        setTimeout(function () {
          callback(undefined, value);
        }, 0);
        return true;
      } else {
        return value;
      }
    }

    // Allow subclasses to massage the input prior to running
    oldString = this.castInput(oldString);
    newString = this.castInput(newString);

    oldString = this.removeEmpty(this.tokenize(oldString));
    newString = this.removeEmpty(this.tokenize(newString));

    var newLen = newString.length,
        oldLen = oldString.length;
    var editLength = 1;
    var maxEditLength = newLen + oldLen;
    var bestPath = [{ newPos: -1, components: [] }];

    // Seed editLength = 0, i.e. the content starts with the same values
    var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
    if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
      // Identity per the equality and tokenizer
      return done([{ value: this.join(newString), count: newString.length }]);
    }

    // Main worker method. checks all permutations of a given edit length for acceptance.
    function execEditLength() {
      for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
        var basePath = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;
        var addPath = bestPath[diagonalPath - 1],
            removePath = bestPath[diagonalPath + 1],
            _oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
        if (addPath) {
          // No one else is going to attempt to use this value, clear it
          bestPath[diagonalPath - 1] = undefined;
        }

        var canAdd = addPath && addPath.newPos + 1 < newLen,
            canRemove = removePath && 0 <= _oldPos && _oldPos < oldLen;
        if (!canAdd && !canRemove) {
          // If this path is a terminal then prune
          bestPath[diagonalPath] = undefined;
          continue;
        }

        // Select the diagonal that we want to branch from. We select the prior
        // path whose position in the new string is the farthest from the origin
        // and does not pass the bounds of the diff graph
        if (!canAdd || canRemove && addPath.newPos < removePath.newPos) {
          basePath = clonePath(removePath);
          self.pushComponent(basePath.components, undefined, true);
        } else {
          basePath = addPath; // No need to clone, we've pulled it from the list
          basePath.newPos++;
          self.pushComponent(basePath.components, true, undefined);
        }

        _oldPos = self.extractCommon(basePath, newString, oldString, diagonalPath);

        // If we have hit the end of both strings, then we are done
        if (basePath.newPos + 1 >= newLen && _oldPos + 1 >= oldLen) {
          return done(buildValues(self, basePath.components, newString, oldString, self.useLongestToken));
        } else {
          // Otherwise track this path as a potential candidate and continue.
          bestPath[diagonalPath] = basePath;
        }
      }

      editLength++;
    }

    // Performs the length of edit iteration. Is a bit fugly as this has to support the
    // sync and async mode which is never fun. Loops over execEditLength until a value
    // is produced.
    if (callback) {
      (function exec() {
        setTimeout(function () {
          // This should not happen, but we want to be safe.
          /* istanbul ignore next */
          if (editLength > maxEditLength) {
            return callback();
          }

          if (!execEditLength()) {
            exec();
          }
        }, 0);
      })();
    } else {
      while (editLength <= maxEditLength) {
        var ret = execEditLength();
        if (ret) {
          return ret;
        }
      }
    }
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/pushComponent: function pushComponent(components, added, removed) {
    var last = components[components.length - 1];
    if (last && last.added === added && last.removed === removed) {
      // We need to clone here as the component clone operation is just
      // as shallow array clone
      components[components.length - 1] = { count: last.count + 1, added: added, removed: removed };
    } else {
      components.push({ count: 1, added: added, removed: removed });
    }
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
    var newLen = newString.length,
        oldLen = oldString.length,
        newPos = basePath.newPos,
        oldPos = newPos - diagonalPath,
        commonCount = 0;
    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
      newPos++;
      oldPos++;
      commonCount++;
    }

    if (commonCount) {
      basePath.components.push({ count: commonCount });
    }

    basePath.newPos = newPos;
    return oldPos;
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/equals: function equals(left, right) {
    return left === right;
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/removeEmpty: function removeEmpty(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/castInput: function castInput(value) {
    return value;
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/tokenize: function tokenize(value) {
    return value.split('');
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/join: function join(chars) {
    return chars.join('');
  }
};

function buildValues(diff, components, newString, oldString, useLongestToken) {
  var componentPos = 0,
      componentLen = components.length,
      newPos = 0,
      oldPos = 0;

  for (; componentPos < componentLen; componentPos++) {
    var component = components[componentPos];
    if (!component.removed) {
      if (!component.added && useLongestToken) {
        var value = newString.slice(newPos, newPos + component.count);
        value = value.map(function (value, i) {
          var oldValue = oldString[oldPos + i];
          return oldValue.length > value.length ? oldValue : value;
        });

        component.value = diff.join(value);
      } else {
        component.value = diff.join(newString.slice(newPos, newPos + component.count));
      }
      newPos += component.count;

      // Common case
      if (!component.added) {
        oldPos += component.count;
      }
    } else {
      component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
      oldPos += component.count;

      // Reverse add and remove so removes are output first to match common convention
      // The diffing algorithm is tied to add then remove output and this is the simplest
      // route to get the desired output with minimal overhead.
      if (componentPos && components[componentPos - 1].added) {
        var tmp = components[componentPos - 1];
        components[componentPos - 1] = components[componentPos];
        components[componentPos] = tmp;
      }
    }
  }

  // Special case handle for when one terminal is ignored. For this case we merge the
  // terminal into the prior string and drop the change.
  var lastComponent = components[componentLen - 1];
  if (componentLen > 1 && (lastComponent.added || lastComponent.removed) && diff.equals('', lastComponent.value)) {
    components[componentLen - 2].value += lastComponent.value;
    components.pop();
  }

  return components;
}

function clonePath(path) {
  return { newPos: path.newPos, components: path.components.slice(0) };
}


},{}],21:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.characterDiff = undefined;
exports. /*istanbul ignore end*/diffChars = diffChars;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/var characterDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/characterDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
function diffChars(oldStr, newStr, callback) {
  return characterDiff.diff(oldStr, newStr, callback);
}


},{"./base":20}],22:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.cssDiff = undefined;
exports. /*istanbul ignore end*/diffCss = diffCss;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/var cssDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/cssDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
cssDiff.tokenize = function (value) {
  return value.split(/([{}:;,]|\s+)/);
};

function diffCss(oldStr, newStr, callback) {
  return cssDiff.diff(oldStr, newStr, callback);
}


},{"./base":20}],23:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.jsonDiff = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports. /*istanbul ignore end*/diffJson = diffJson;
/*istanbul ignore start*/exports. /*istanbul ignore end*/canonicalize = canonicalize;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

/*istanbul ignore end*/
var /*istanbul ignore start*/_line = require('./line') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/

var objectPrototypeToString = Object.prototype.toString;

var jsonDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/jsonDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
// Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
// dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:
jsonDiff.useLongestToken = true;

jsonDiff.tokenize = /*istanbul ignore start*/_line.lineDiff. /*istanbul ignore end*/tokenize;
jsonDiff.castInput = function (value) {
  return typeof value === 'string' ? value : JSON.stringify(canonicalize(value), undefined, '  ');
};
jsonDiff.equals = function (left, right) {
  return (/*istanbul ignore start*/_base2['default']. /*istanbul ignore end*/prototype.equals(left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'))
  );
};

function diffJson(oldObj, newObj, callback) {
  return jsonDiff.diff(oldObj, newObj, callback);
}

// This function handles the presence of circular references by bailing out when encountering an
// object that is already on the "stack" of items being processed.
function canonicalize(obj, stack, replacementStack) {
  stack = stack || [];
  replacementStack = replacementStack || [];

  var i = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;

  for (i = 0; i < stack.length; i += 1) {
    if (stack[i] === obj) {
      return replacementStack[i];
    }
  }

  var canonicalizedObj = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;

  if ('[object Array]' === objectPrototypeToString.call(obj)) {
    stack.push(obj);
    canonicalizedObj = new Array(obj.length);
    replacementStack.push(canonicalizedObj);
    for (i = 0; i < obj.length; i += 1) {
      canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack);
    }
    stack.pop();
    replacementStack.pop();
    return canonicalizedObj;
  }

  if (obj && obj.toJSON) {
    obj = obj.toJSON();
  }

  if ( /*istanbul ignore start*/(typeof /*istanbul ignore end*/obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null) {
    stack.push(obj);
    canonicalizedObj = {};
    replacementStack.push(canonicalizedObj);
    var sortedKeys = [],
        key = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;
    for (key in obj) {
      /* istanbul ignore else */
      if (obj.hasOwnProperty(key)) {
        sortedKeys.push(key);
      }
    }
    sortedKeys.sort();
    for (i = 0; i < sortedKeys.length; i += 1) {
      key = sortedKeys[i];
      canonicalizedObj[key] = canonicalize(obj[key], stack, replacementStack);
    }
    stack.pop();
    replacementStack.pop();
  } else {
    canonicalizedObj = obj;
  }
  return canonicalizedObj;
}


},{"./base":20,"./line":24}],24:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.lineDiff = undefined;
exports. /*istanbul ignore end*/diffLines = diffLines;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffTrimmedLines = diffTrimmedLines;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

/*istanbul ignore end*/
var /*istanbul ignore start*/_params = require('../util/params') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/var lineDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/lineDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
lineDiff.tokenize = function (value) {
  var retLines = [],
      linesAndNewlines = value.split(/(\n|\r\n)/);

  // Ignore the final empty token that occurs if the string ends with a new line
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }

  // Merge the content and line separators into single tokens
  for (var i = 0; i < linesAndNewlines.length; i++) {
    var line = linesAndNewlines[i];

    if (i % 2 && !this.options.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      if (this.options.ignoreWhitespace) {
        line = line.trim();
      }
      retLines.push(line);
    }
  }

  return retLines;
};

function diffLines(oldStr, newStr, callback) {
  return lineDiff.diff(oldStr, newStr, callback);
}
function diffTrimmedLines(oldStr, newStr, callback) {
  var options = /*istanbul ignore start*/(0, _params.generateOptions) /*istanbul ignore end*/(callback, { ignoreWhitespace: true });
  return lineDiff.diff(oldStr, newStr, options);
}


},{"../util/params":32,"./base":20}],25:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.sentenceDiff = undefined;
exports. /*istanbul ignore end*/diffSentences = diffSentences;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/var sentenceDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/sentenceDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
sentenceDiff.tokenize = function (value) {
  return value.split(/(\S.+?[.!?])(?=\s+|$)/);
};

function diffSentences(oldStr, newStr, callback) {
  return sentenceDiff.diff(oldStr, newStr, callback);
}


},{"./base":20}],26:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.wordDiff = undefined;
exports. /*istanbul ignore end*/diffWords = diffWords;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffWordsWithSpace = diffWordsWithSpace;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

/*istanbul ignore end*/
var /*istanbul ignore start*/_params = require('../util/params') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/

// Based on https://en.wikipedia.org/wiki/Latin_script_in_Unicode
//
// Ranges and exceptions:
// Latin-1 Supplement, 0080–00FF
//  - U+00D7  × Multiplication sign
//  - U+00F7  ÷ Division sign
// Latin Extended-A, 0100–017F
// Latin Extended-B, 0180–024F
// IPA Extensions, 0250–02AF
// Spacing Modifier Letters, 02B0–02FF
//  - U+02C7  ˇ &#711;  Caron
//  - U+02D8  ˘ &#728;  Breve
//  - U+02D9  ˙ &#729;  Dot Above
//  - U+02DA  ˚ &#730;  Ring Above
//  - U+02DB  ˛ &#731;  Ogonek
//  - U+02DC  ˜ &#732;  Small Tilde
//  - U+02DD  ˝ &#733;  Double Acute Accent
// Latin Extended Additional, 1E00–1EFF
var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;

var reWhitespace = /\S/;

var wordDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/wordDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
wordDiff.equals = function (left, right) {
  return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
};
wordDiff.tokenize = function (value) {
  var tokens = value.split(/(\s+|\b)/);

  // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.
  for (var i = 0; i < tokens.length - 1; i++) {
    // If we have an empty string in the next field and we have only word chars before and after, merge
    if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
      tokens[i] += tokens[i + 2];
      tokens.splice(i + 1, 2);
      i--;
    }
  }

  return tokens;
};

function diffWords(oldStr, newStr, callback) {
  var options = /*istanbul ignore start*/(0, _params.generateOptions) /*istanbul ignore end*/(callback, { ignoreWhitespace: true });
  return wordDiff.diff(oldStr, newStr, options);
}
function diffWordsWithSpace(oldStr, newStr, callback) {
  return wordDiff.diff(oldStr, newStr, callback);
}


},{"../util/params":32,"./base":20}],27:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.canonicalize = exports.convertChangesToXML = exports.convertChangesToDMP = exports.parsePatch = exports.applyPatches = exports.applyPatch = exports.createPatch = exports.createTwoFilesPatch = exports.structuredPatch = exports.diffArrays = exports.diffJson = exports.diffCss = exports.diffSentences = exports.diffTrimmedLines = exports.diffLines = exports.diffWordsWithSpace = exports.diffWords = exports.diffChars = exports.Diff = undefined;
/*istanbul ignore end*/
var /*istanbul ignore start*/_base = require('./diff/base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

/*istanbul ignore end*/
var /*istanbul ignore start*/_character = require('./diff/character') /*istanbul ignore end*/;

var /*istanbul ignore start*/_word = require('./diff/word') /*istanbul ignore end*/;

var /*istanbul ignore start*/_line = require('./diff/line') /*istanbul ignore end*/;

var /*istanbul ignore start*/_sentence = require('./diff/sentence') /*istanbul ignore end*/;

var /*istanbul ignore start*/_css = require('./diff/css') /*istanbul ignore end*/;

var /*istanbul ignore start*/_json = require('./diff/json') /*istanbul ignore end*/;

var /*istanbul ignore start*/_array = require('./diff/array') /*istanbul ignore end*/;

var /*istanbul ignore start*/_apply = require('./patch/apply') /*istanbul ignore end*/;

var /*istanbul ignore start*/_parse = require('./patch/parse') /*istanbul ignore end*/;

var /*istanbul ignore start*/_create = require('./patch/create') /*istanbul ignore end*/;

var /*istanbul ignore start*/_dmp = require('./convert/dmp') /*istanbul ignore end*/;

var /*istanbul ignore start*/_xml = require('./convert/xml') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

exports. /*istanbul ignore end*/Diff = _base2['default'];
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffChars = _character.diffChars;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffWords = _word.diffWords;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffWordsWithSpace = _word.diffWordsWithSpace;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffLines = _line.diffLines;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffTrimmedLines = _line.diffTrimmedLines;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffSentences = _sentence.diffSentences;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffCss = _css.diffCss;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffJson = _json.diffJson;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffArrays = _array.diffArrays;
/*istanbul ignore start*/exports. /*istanbul ignore end*/structuredPatch = _create.structuredPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/createTwoFilesPatch = _create.createTwoFilesPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/createPatch = _create.createPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/applyPatch = _apply.applyPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/applyPatches = _apply.applyPatches;
/*istanbul ignore start*/exports. /*istanbul ignore end*/parsePatch = _parse.parsePatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/convertChangesToDMP = _dmp.convertChangesToDMP;
/*istanbul ignore start*/exports. /*istanbul ignore end*/convertChangesToXML = _xml.convertChangesToXML;
/*istanbul ignore start*/exports. /*istanbul ignore end*/canonicalize = _json.canonicalize; /* See LICENSE file for terms of use */

/*
 * Text diff implementation.
 *
 * This library supports the following APIS:
 * JsDiff.diffChars: Character by character diff
 * JsDiff.diffWords: Word (as defined by \b regex) diff which ignores whitespace
 * JsDiff.diffLines: Line based diff
 *
 * JsDiff.diffCss: Diff targeted at CSS content
 *
 * These methods are based on the implementation proposed in
 * "An O(ND) Difference Algorithm and its Variations" (Myers, 1986).
 * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */


},{"./convert/dmp":17,"./convert/xml":18,"./diff/array":19,"./diff/base":20,"./diff/character":21,"./diff/css":22,"./diff/json":23,"./diff/line":24,"./diff/sentence":25,"./diff/word":26,"./patch/apply":28,"./patch/create":29,"./patch/parse":30}],28:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/applyPatch = applyPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/applyPatches = applyPatches;

var /*istanbul ignore start*/_parse = require('./parse') /*istanbul ignore end*/;

var /*istanbul ignore start*/_distanceIterator = require('../util/distance-iterator') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _distanceIterator2 = _interopRequireDefault(_distanceIterator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/function applyPatch(source, uniDiff) {
  /*istanbul ignore start*/var /*istanbul ignore end*/options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  if (typeof uniDiff === 'string') {
    uniDiff = /*istanbul ignore start*/(0, _parse.parsePatch) /*istanbul ignore end*/(uniDiff);
  }

  if (Array.isArray(uniDiff)) {
    if (uniDiff.length > 1) {
      throw new Error('applyPatch only works with a single input.');
    }

    uniDiff = uniDiff[0];
  }

  // Apply the diff to the input
  var lines = source.split(/\r\n|[\n\v\f\r\x85]/),
      delimiters = source.match(/\r\n|[\n\v\f\r\x85]/g) || [],
      hunks = uniDiff.hunks,
      compareLine = options.compareLine || function (lineNumber, line, operation, patchContent) /*istanbul ignore start*/{
    return (/*istanbul ignore end*/line === patchContent
    );
  },
      errorCount = 0,
      fuzzFactor = options.fuzzFactor || 0,
      minLine = 0,
      offset = 0,
      removeEOFNL = /*istanbul ignore start*/void 0 /*istanbul ignore end*/,
      addEOFNL = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;

  /**
   * Checks if the hunk exactly fits on the provided location
   */
  function hunkFits(hunk, toPos) {
    for (var j = 0; j < hunk.lines.length; j++) {
      var line = hunk.lines[j],
          operation = line[0],
          content = line.substr(1);

      if (operation === ' ' || operation === '-') {
        // Context sanity check
        if (!compareLine(toPos + 1, lines[toPos], operation, content)) {
          errorCount++;

          if (errorCount > fuzzFactor) {
            return false;
          }
        }
        toPos++;
      }
    }

    return true;
  }

  // Search best fit offsets for each hunk based on the previous ones
  for (var i = 0; i < hunks.length; i++) {
    var hunk = hunks[i],
        maxLine = lines.length - hunk.oldLines,
        localOffset = 0,
        toPos = offset + hunk.oldStart - 1;

    var iterator = /*istanbul ignore start*/(0, _distanceIterator2['default']) /*istanbul ignore end*/(toPos, minLine, maxLine);

    for (; localOffset !== undefined; localOffset = iterator()) {
      if (hunkFits(hunk, toPos + localOffset)) {
        hunk.offset = offset += localOffset;
        break;
      }
    }

    if (localOffset === undefined) {
      return false;
    }

    // Set lower text limit to end of the current hunk, so next ones don't try
    // to fit over already patched text
    minLine = hunk.offset + hunk.oldStart + hunk.oldLines;
  }

  // Apply patch hunks
  for (var _i = 0; _i < hunks.length; _i++) {
    var _hunk = hunks[_i],
        _toPos = _hunk.offset + _hunk.newStart - 1;
    if (_hunk.newLines == 0) {
      _toPos++;
    }

    for (var j = 0; j < _hunk.lines.length; j++) {
      var line = _hunk.lines[j],
          operation = line[0],
          content = line.substr(1),
          delimiter = _hunk.linedelimiters[j];

      if (operation === ' ') {
        _toPos++;
      } else if (operation === '-') {
        lines.splice(_toPos, 1);
        delimiters.splice(_toPos, 1);
        /* istanbul ignore else */
      } else if (operation === '+') {
          lines.splice(_toPos, 0, content);
          delimiters.splice(_toPos, 0, delimiter);
          _toPos++;
        } else if (operation === '\\') {
          var previousOperation = _hunk.lines[j - 1] ? _hunk.lines[j - 1][0] : null;
          if (previousOperation === '+') {
            removeEOFNL = true;
          } else if (previousOperation === '-') {
            addEOFNL = true;
          }
        }
    }
  }

  // Handle EOFNL insertion/removal
  if (removeEOFNL) {
    while (!lines[lines.length - 1]) {
      lines.pop();
      delimiters.pop();
    }
  } else if (addEOFNL) {
    lines.push('');
    delimiters.push('\n');
  }
  for (var _k = 0; _k < lines.length - 1; _k++) {
    lines[_k] = lines[_k] + delimiters[_k];
  }
  return lines.join('');
}

// Wrapper that supports multiple file patches via callbacks.
function applyPatches(uniDiff, options) {
  if (typeof uniDiff === 'string') {
    uniDiff = /*istanbul ignore start*/(0, _parse.parsePatch) /*istanbul ignore end*/(uniDiff);
  }

  var currentIndex = 0;
  function processIndex() {
    var index = uniDiff[currentIndex++];
    if (!index) {
      return options.complete();
    }

    options.loadFile(index, function (err, data) {
      if (err) {
        return options.complete(err);
      }

      var updatedContent = applyPatch(data, index, options);
      options.patched(index, updatedContent, function (err) {
        if (err) {
          return options.complete(err);
        }

        processIndex();
      });
    });
  }
  processIndex();
}


},{"../util/distance-iterator":31,"./parse":30}],29:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/structuredPatch = structuredPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/createTwoFilesPatch = createTwoFilesPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/createPatch = createPatch;

var /*istanbul ignore start*/_line = require('../diff/line') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/*istanbul ignore end*/function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  if (!options) {
    options = { context: 4 };
  }

  var diff = /*istanbul ignore start*/(0, _line.diffLines) /*istanbul ignore end*/(oldStr, newStr);
  diff.push({ value: '', lines: [] }); // Append an empty value to make cleanup easier

  function contextLines(lines) {
    return lines.map(function (entry) {
      return ' ' + entry;
    });
  }

  var hunks = [];
  var oldRangeStart = 0,
      newRangeStart = 0,
      curRange = [],
      oldLine = 1,
      newLine = 1;
  /*istanbul ignore start*/
  var _loop = function _loop( /*istanbul ignore end*/i) {
    var current = diff[i],
        lines = current.lines || current.value.replace(/\n$/, '').split('\n');
    current.lines = lines;

    if (current.added || current.removed) {
      /*istanbul ignore start*/
      var _curRange;

      /*istanbul ignore end*/
      // If we have previous context, start with that
      if (!oldRangeStart) {
        var prev = diff[i - 1];
        oldRangeStart = oldLine;
        newRangeStart = newLine;

        if (prev) {
          curRange = options.context > 0 ? contextLines(prev.lines.slice(-options.context)) : [];
          oldRangeStart -= curRange.length;
          newRangeStart -= curRange.length;
        }
      }

      // Output our changes
      /*istanbul ignore start*/(_curRange = /*istanbul ignore end*/curRange).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_curRange /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/lines.map(function (entry) {
        return (current.added ? '+' : '-') + entry;
      })));

      // Track the updated file position
      if (current.added) {
        newLine += lines.length;
      } else {
        oldLine += lines.length;
      }
    } else {
      // Identical context lines. Track line changes
      if (oldRangeStart) {
        // Close out any changes that have been output (or join overlapping)
        if (lines.length <= options.context * 2 && i < diff.length - 2) {
          /*istanbul ignore start*/
          var _curRange2;

          /*istanbul ignore end*/
          // Overlapping
          /*istanbul ignore start*/(_curRange2 = /*istanbul ignore end*/curRange).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_curRange2 /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/contextLines(lines)));
        } else {
          /*istanbul ignore start*/
          var _curRange3;

          /*istanbul ignore end*/
          // end the range and output
          var contextSize = Math.min(lines.length, options.context);
          /*istanbul ignore start*/(_curRange3 = /*istanbul ignore end*/curRange).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_curRange3 /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/contextLines(lines.slice(0, contextSize))));

          var hunk = {
            oldStart: oldRangeStart,
            oldLines: oldLine - oldRangeStart + contextSize,
            newStart: newRangeStart,
            newLines: newLine - newRangeStart + contextSize,
            lines: curRange
          };
          if (i >= diff.length - 2 && lines.length <= options.context) {
            // EOF is inside this hunk
            var oldEOFNewline = /\n$/.test(oldStr);
            var newEOFNewline = /\n$/.test(newStr);
            if (lines.length == 0 && !oldEOFNewline) {
              // special case: old has no eol and no trailing context; no-nl can end up before adds
              curRange.splice(hunk.oldLines, 0, '\\ No newline at end of file');
            } else if (!oldEOFNewline || !newEOFNewline) {
              curRange.push('\\ No newline at end of file');
            }
          }
          hunks.push(hunk);

          oldRangeStart = 0;
          newRangeStart = 0;
          curRange = [];
        }
      }
      oldLine += lines.length;
      newLine += lines.length;
    }
  };

  for (var i = 0; i < diff.length; i++) {
    /*istanbul ignore start*/
    _loop( /*istanbul ignore end*/i);
  }

  return {
    oldFileName: oldFileName, newFileName: newFileName,
    oldHeader: oldHeader, newHeader: newHeader,
    hunks: hunks
  };
}

function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  var diff = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options);

  var ret = [];
  if (oldFileName == newFileName) {
    ret.push('Index: ' + oldFileName);
  }
  ret.push('===================================================================');
  ret.push('--- ' + diff.oldFileName + (typeof diff.oldHeader === 'undefined' ? '' : '\t' + diff.oldHeader));
  ret.push('+++ ' + diff.newFileName + (typeof diff.newHeader === 'undefined' ? '' : '\t' + diff.newHeader));

  for (var i = 0; i < diff.hunks.length; i++) {
    var hunk = diff.hunks[i];
    ret.push('@@ -' + hunk.oldStart + ',' + hunk.oldLines + ' +' + hunk.newStart + ',' + hunk.newLines + ' @@');
    ret.push.apply(ret, hunk.lines);
  }

  return ret.join('\n') + '\n';
}

function createPatch(fileName, oldStr, newStr, oldHeader, newHeader, options) {
  return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options);
}


},{"../diff/line":24}],30:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/parsePatch = parsePatch;
function parsePatch(uniDiff) {
  /*istanbul ignore start*/var /*istanbul ignore end*/options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var diffstr = uniDiff.split(/\r\n|[\n\v\f\r\x85]/),
      delimiters = uniDiff.match(/\r\n|[\n\v\f\r\x85]/g) || [],
      list = [],
      i = 0;

  function parseIndex() {
    var index = {};
    list.push(index);

    // Parse diff metadata
    while (i < diffstr.length) {
      var line = diffstr[i];

      // File header found, end parsing diff metadata
      if (/^(\-\-\-|\+\+\+|@@)\s/.test(line)) {
        break;
      }

      // Diff index
      var header = /^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec(line);
      if (header) {
        index.index = header[1];
      }

      i++;
    }

    // Parse file headers if they are defined. Unified diff requires them, but
    // there's no technical issues to have an isolated hunk without file header
    parseFileHeader(index);
    parseFileHeader(index);

    // Parse hunks
    index.hunks = [];

    while (i < diffstr.length) {
      var _line = diffstr[i];

      if (/^(Index:|diff|\-\-\-|\+\+\+)\s/.test(_line)) {
        break;
      } else if (/^@@/.test(_line)) {
        index.hunks.push(parseHunk());
      } else if (_line && options.strict) {
        // Ignore unexpected content unless in strict mode
        throw new Error('Unknown line ' + (i + 1) + ' ' + JSON.stringify(_line));
      } else {
        i++;
      }
    }
  }

  // Parses the --- and +++ headers, if none are found, no lines
  // are consumed.
  function parseFileHeader(index) {
    var headerPattern = /^(---|\+\+\+)\s+([\S ]*)(?:\t(.*?)\s*)?$/;
    var fileHeader = headerPattern.exec(diffstr[i]);
    if (fileHeader) {
      var keyPrefix = fileHeader[1] === '---' ? 'old' : 'new';
      index[keyPrefix + 'FileName'] = fileHeader[2];
      index[keyPrefix + 'Header'] = fileHeader[3];

      i++;
    }
  }

  // Parses a hunk
  // This assumes that we are at the start of a hunk.
  function parseHunk() {
    var chunkHeaderIndex = i,
        chunkHeaderLine = diffstr[i++],
        chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);

    var hunk = {
      oldStart: +chunkHeader[1],
      oldLines: +chunkHeader[2] || 1,
      newStart: +chunkHeader[3],
      newLines: +chunkHeader[4] || 1,
      lines: [],
      linedelimiters: []
    };

    var addCount = 0,
        removeCount = 0;
    for (; i < diffstr.length; i++) {
      // Lines starting with '---' could be mistaken for the "remove line" operation
      // But they could be the header for the next file. Therefore prune such cases out.
      if (diffstr[i].indexOf('--- ') === 0 && i + 2 < diffstr.length && diffstr[i + 1].indexOf('+++ ') === 0 && diffstr[i + 2].indexOf('@@') === 0) {
        break;
      }
      var operation = diffstr[i][0];

      if (operation === '+' || operation === '-' || operation === ' ' || operation === '\\') {
        hunk.lines.push(diffstr[i]);
        hunk.linedelimiters.push(delimiters[i] || '\n');

        if (operation === '+') {
          addCount++;
        } else if (operation === '-') {
          removeCount++;
        } else if (operation === ' ') {
          addCount++;
          removeCount++;
        }
      } else {
        break;
      }
    }

    // Handle the empty block count case
    if (!addCount && hunk.newLines === 1) {
      hunk.newLines = 0;
    }
    if (!removeCount && hunk.oldLines === 1) {
      hunk.oldLines = 0;
    }

    // Perform optional sanity checking
    if (options.strict) {
      if (addCount !== hunk.newLines) {
        throw new Error('Added line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
      }
      if (removeCount !== hunk.oldLines) {
        throw new Error('Removed line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
      }
    }

    return hunk;
  }

  while (i < diffstr.length) {
    parseIndex();
  }

  return list;
}


},{}],31:[function(require,module,exports){
/*istanbul ignore start*/"use strict";

exports.__esModule = true;

exports["default"] = /*istanbul ignore end*/function (start, minLine, maxLine) {
  var wantForward = true,
      backwardExhausted = false,
      forwardExhausted = false,
      localOffset = 1;

  return function iterator() {
    if (wantForward && !forwardExhausted) {
      if (backwardExhausted) {
        localOffset++;
      } else {
        wantForward = false;
      }

      // Check if trying to fit beyond text length, and if not, check it fits
      // after offset location (or desired location on first iteration)
      if (start + localOffset <= maxLine) {
        return localOffset;
      }

      forwardExhausted = true;
    }

    if (!backwardExhausted) {
      if (!forwardExhausted) {
        wantForward = true;
      }

      // Check if trying to fit before text beginning, and if not, check it fits
      // before offset location
      if (minLine <= start - localOffset) {
        return -localOffset++;
      }

      backwardExhausted = true;
      return iterator();
    }

    // We tried to fit hunk before text beginning and beyond text lenght, then
    // hunk can't fit on the text. Return undefined
  };
};


},{}],32:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/generateOptions = generateOptions;
function generateOptions(options, defaults) {
  if (typeof options === 'function') {
    defaults.callback = options;
  } else if (options) {
    for (var name in options) {
      /* istanbul ignore else */
      if (options.hasOwnProperty(name)) {
        defaults[name] = options[name];
      }
    }
  }
  return defaults;
}


},{}],33:[function(require,module,exports){
/*
	The Cedric's Swiss Knife (CSK) - CSK DOM toolbox

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



/* global NamedNodeMap */

// Load modules
//var string = require( 'string-kit' ) ;



var dom = {} ;
module.exports = dom ;



// Load the svg submodule
dom.svg = require( './svg.js' ) ;



// Like jQuery's $(document).ready()
dom.ready = function ready( callback )
{
	document.addEventListener( 'DOMContentLoaded' , function internalCallback() {
		document.removeEventListener( 'DOMContentLoaded' , internalCallback , false ) ;
		callback() ;
	} , false ) ;
} ;



// Return a fragment from html code
dom.fromHtml = function fromHtml( html )
{
	var i , doc , fragment ;
	
	// Fragment allow us to return a collection that... well... is not a collection,
	// and that's fine because the html code may contains multiple top-level element
	fragment = document.createDocumentFragment() ;
	
	doc = document.createElement( 'div' ) ;	// whatever type...
	
	// either .innerHTML or .insertAdjacentHTML()
	//doc.innerHTML = html ;
	doc.insertAdjacentHTML( 'beforeend' , html ) ;
	
	for ( i = 0 ; i < doc.children.length ; i ++ )
	{
		fragment.appendChild( doc.children[ i ] ) ;
	}
	
	return fragment ;
} ;



// Batch processing, like array, HTMLCollection, and so on...
dom.batch = function batch( method , elements )
{
	var i , args = Array.prototype.slice.call( arguments , 1 ) ;
	
	if ( elements instanceof Element )
	{
		args[ 0 ] = elements ;
		method.apply( this , args ) ;
	}
	else if ( Array.isArray( elements ) )
	{
		for ( i = 0 ; i < elements.length ; i ++ )
		{
			args[ 0 ] = elements[ i ] ;
			method.apply( this , args ) ;
		}
	}
	else if ( elements instanceof NodeList || elements instanceof NamedNodeMap )
	{
		for ( i = 0 ; i < elements.length ; i ++ )
		{
			args[ 0 ] = elements[ i ] ;
			method.apply( this , args ) ;
		}
	}
} ;



// Set a bunch of css properties given as an object
dom.css = function css( element , object )
{
	var key ;
	
	for ( key in object )
	{
		element.style[ key ] = object[ key ] ;
	}
} ;



// Set a bunch of attributes given as an object
dom.attr = function attr( element , object )
{
	var key ;
	
	for ( key in object )
	{
		if ( object[ key ] === null ) { element.removeAttribute( key ) ; }
		else { element.setAttribute( key , object[ key ] ) ; }
	}
} ;



// Set/unset a bunch of classes given as an object
dom.class = function class_( element , object )
{
	var key ;
	
	for ( key in object )
	{
		if ( object[ key ] ) { element.classList.add( key ) ; }
		else { element.classList.remove( key ) ; }
	}
} ;



// Remove an element. A little shortcut that ease life...
dom.remove = function remove( element ) { element.parentNode.removeChild( element ) ; } ;



// Remove all children of an element
dom.empty = function empty( element )
{
	// element.innerHTML = '' ;	// According to jsPerf, it is 96% slower
	while ( element.firstChild ) { element.removeChild( element.firstChild ); }
} ;



// Clone a source DOM tree and replace children of the destination
dom.cloneInto = function cloneInto( destination , source )
{
	dom.empty( destination ) ;
	destination.appendChild( source.cloneNode( true ) ) ;
} ;



// Same than cloneInto() without cloning anything
dom.insertInto = function insertInto( destination , source )
{
	dom.empty( destination ) ;
	destination.appendChild( source ) ;
} ;



// Children of this element get all their ID namespaced, any url(#id) references are patched accordingly
dom.idNamespace = function idNamespace( element , namespace )
{
	var elements , replacement = {} ;
	
	elements = element.querySelectorAll( '*' ) ;
	
	dom.batch( dom.idNamespace.idAttributePass , elements , namespace , replacement ) ;
	dom.batch( dom.idNamespace.otherAttributesPass , elements , replacement ) ;
} ;

// Callbacks for dom.idNamespace(), cleanly hidden behind its namespace

dom.idNamespace.idAttributePass = function idAttributePass( element , namespace , replacement ) {
	replacement[ element.id ] = namespace + '.' + element.id ;
	element.id = replacement[ element.id ] ;
} ;

dom.idNamespace.otherAttributesPass = function otherAttributesPass( element , replacement ) {
	dom.batch( dom.idNamespace.oneAttributeSubPass , element.attributes , replacement ) ;
} ;

dom.idNamespace.oneAttributeSubPass = function oneAttributeSubPass( attr , replacement ) {
	
	// We have to search all url(#id) like substring in the current attribute's value
	attr.value = attr.value.replace( /url\(#([^)]+)\)/g , function( match , id ) {
		
		// No replacement? return the matched string
		if ( ! replacement[ id ] ) { return match ; }
		
		// Or return the replacement ID
		return 'url(#' + replacement[ id ] + ')' ;
	} ) ;
} ;



		/* Function useful for .batch() as callback */
		/* ... to avoid defining again and again the same callback function */

// Change id
dom.id = function id( element , id ) { element.id = id ; } ;

// Like jQuery .text().
dom.text = function text( element , text ) { element.textContent = text ; } ;

// Like jQuery .html().
dom.html = function html( element , html ) { element.innerHTML = html ; } ;





},{"./svg.js":34}],34:[function(require,module,exports){
(function (process){
/*
	The Cedric's Swiss Knife (CSK) - CSK DOM toolbox

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



// Load modules
var fs = require( 'fs' ) ;
//var string = require( 'string-kit' ) ;
var dom = require( './dom.js' ) ;



var domSvg = {} ;
module.exports = domSvg ;



/*
	load( container , url , [options] , callback )
	
	* container: null or the DOM element where the <svg> tag will be put
	* url: the URL of the .svg file
	* options: an optional object with optional options
		* id: the id attribute of the <svg> tag (recommanded)
		* class: a class object to add/remove on the <svg> tag
		* hidden: inject the svg but make it hidden (useful to apply modification before the show)
		* noWidthHeightAttr: remove the width and height attribute of the <svg> tag
		* css: a css object to apply on the <svg> tag
	* callback: completion callback
*/
domSvg.load = function load( container , url , options , callback )
{
	if ( typeof options === 'function' ) { callback = options ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	if ( url.substring( 0 , 7 ) === 'file://' && ! process.browser )
	{
		// Use Node.js 'fs' module
		
		fs.readFile( url.slice( 7 ) , function( error , content ) {
			
			if ( error ) { callback( error ) ; return ; }
			
			var parser = new DOMParser() ;
			var svg = parser.parseFromString( content.toString() , 'application/xml' ).documentElement ;
			
			try {
				domSvg.attachXmlTo( container , svg , options ) ;
			}
			catch ( error ) {
				callback( error ) ;
				return ;
			}
			
			callback( undefined , svg ) ;
		} ) ;
	}
	else
	{
		// Use an AJAX HTTP Request
		
		domSvg.ajax( url , function( error , xmlDoc ) {
			
			if ( error ) { callback( error ) ; return ; }
			
			var svg = xmlDoc.documentElement ;
			
			try {
				domSvg.attachXmlTo( container , svg , options ) ;
			}
			catch ( error ) {
				callback( error ) ;
				return ;
			}
			
			callback( undefined , svg ) ;
		} ) ;
	}
} ;



// Dummy ATM...
domSvg.attachXmlTo = function attachXmlTo( container , svg , options )
{
	var viewBox , width , height ;
	
	domSvg.lightCleanup( svg ) ;
	
	// Fix id, if necessary
	if ( options.id !== undefined )
	{
		if ( typeof options.id === 'string' ) { svg.setAttribute( 'id' , options.id ) ; }
		else if ( ! options.id ) { svg.removeAttribute( 'id' ) ; }
	}
	
	if ( options.class && typeof options.class === 'object' ) { dom.class( svg , options.class ) ; }
	
	if ( options.idNamespace ) { dom.idNamespace( svg , options.idNamespace ) ; }
	
	if ( options.hidden ) { svg.style.visibility = 'hidden' ; }
	
	if ( options.noWidthHeightAttr )
	{
		// Save and remove the width and height attribute
		width = svg.getAttribute( 'width' ) ;
		height = svg.getAttribute( 'height' ) ;
		
		svg.removeAttribute( 'height' ) ;
		svg.removeAttribute( 'width' ) ;
		
		// if the svg don't have a viewBox attribute, set it now from the width and height (it works most of time)
		if ( ! svg.getAttribute( 'viewBox' ) && width && height )
		{
			viewBox = '0 0 ' + width + ' ' + height ;
			//console.log( "viewBox:" , viewBox ) ;
			svg.setAttribute( 'viewBox' , viewBox ) ;
		}
	}
	
	if ( options.css ) { dom.css( svg , options.css ) ; }
	
	// If a container was specified, attach to it
	if ( container ) { container.appendChild( svg ) ; }
} ;



domSvg.lightCleanup = function lightCleanup( svgElement )
{
	removeAllTag( svgElement , 'metadata' ) ;
	removeAllTag( svgElement , 'script' ) ;
} ;



// Should remove all tags and attributes that have non-registered namespace,
// e.g.: sodipodi, inkscape, etc...
//domSvg.heavyCleanup = function heavyCleanup( svgElement ) {} ;



function removeAllTag( container , tag )
{
	var i , elements , element ;
	
	elements = container.getElementsByTagName( tag ) ;
	
	for ( i = 0 ; i < elements.length ; i ++ )
	{
		element = elements.item( i ) ;
		element.parentNode.removeChild( element ) ;
	}
}






domSvg.ajax = function ajax( url , callback )
{
	var xhr = new XMLHttpRequest() ;
	
	//console.warn( "ajax url:" , url ) ;
	
	xhr.responseType = 'document' ;
	xhr.onreadystatechange = domSvg.ajax.ajaxStatus.bind( xhr , callback ) ;
	xhr.open( 'GET', url ) ;
	xhr.send() ;
} ;



domSvg.ajax.ajaxStatus = function ajaxStatus( callback )
{
	// From MDN: In the event of a communication error (such as the webserver going down),
	// an exception will be thrown in the when attempting to access the 'status' property. 
	
	try {
		if ( this.readyState === 4 )
		{
			if ( this.status === 200 )
			{
				callback( undefined , this.responseXML ) ;
			}
			else if ( this.status === 0 && this.responseXML )	// Yay, loading with file:// does not provide any status...
			{
				callback( undefined , this.responseXML ) ;
			}
			else
			{
				if ( this.status ) { callback( this.status ) ; }
				else { callback( new Error( "[dom-kit.svg] ajaxStatus(): Error with falsy status" ) ) ; }
			}
		}
	}
	catch ( error ) {
		callback( error ) ;
	}
} ;



}).call(this,require('_process'))
},{"./dom.js":33,"_process":47,"fs":16}],35:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],36:[function(require,module,exports){
var parse = require('acorn').parse;
var isArray = require('isarray');
var objectKeys = require('object-keys');
var forEach = require('foreach');

module.exports = function (src, opts, fn) {
    if (typeof opts === 'function') {
        fn = opts;
        opts = {};
    }
    if (src && typeof src === 'object' && src.constructor.name === 'Buffer') {
        src = src.toString();
    }
    else if (src && typeof src === 'object') {
        opts = src;
        src = opts.source;
        delete opts.source;
    }
    src = src === undefined ? opts.source : src;
    if (typeof src !== 'string') src = String(src);
    if (opts.parser) parse = opts.parser.parse;
    var ast = parse(src, opts);
    
    var result = {
        chunks : src.split(''),
        toString : function () { return result.chunks.join('') },
        inspect : function () { return result.toString() }
    };
    var index = 0;
    
    (function walk (node, parent) {
        insertHelpers(node, parent, result.chunks);
        
        forEach(objectKeys(node), function (key) {
            if (key === 'parent') return;
            
            var child = node[key];
            if (isArray(child)) {
                forEach(child, function (c) {
                    if (c && typeof c.type === 'string') {
                        walk(c, node);
                    }
                });
            }
            else if (child && typeof child.type === 'string') {
                walk(child, node);
            }
        });
        fn(node);
    })(ast, undefined);
    
    return result;
};
 
function insertHelpers (node, parent, chunks) {
    node.parent = parent;
    
    node.source = function () {
        return chunks.slice(node.start, node.end).join('');
    };
    
    if (node.update && typeof node.update === 'object') {
        var prev = node.update;
        forEach(objectKeys(prev), function (key) {
            update[key] = prev[key];
        });
        node.update = update;
    }
    else {
        node.update = update;
    }
    
    function update (s) {
        chunks[node.start] = s;
        for (var i = node.start + 1; i < node.end; i++) {
            chunks[i] = '';
        }
    }
}

},{"acorn":37,"foreach":38,"isarray":40,"object-keys":44}],37:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.acorn = global.acorn || {})));
}(this, function (exports) { 'use strict';

  // Reserved word lists for various dialects of the language

  var reservedWords = {
    3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
    5: "class enum extends super const export import",
    6: "enum",
    7: "enum",
    strict: "implements interface let package private protected public static yield",
    strictBind: "eval arguments"
  }

  // And the keywords

  var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this"

  var keywords = {
    5: ecma5AndLessKeywords,
    6: ecma5AndLessKeywords + " const class extends export import super"
  }

  // ## Character categories

  // Big ugly regular expressions that match characters in the
  // whitespace, identifier, and identifier-start categories. These
  // are only applied when a character is found to actually have a
  // code point above 128.
  // Generated by `bin/generate-identifier-regex.js`.

  var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fd5\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7ae\ua7b0-\ua7b7\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab65\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc"
  var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d4-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d01-\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1cf8\u1cf9\u1dc0-\u1df5\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f"

  var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]")
  var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]")

  nonASCIIidentifierStartChars = nonASCIIidentifierChars = null

  // These are a run-length and offset encoded representation of the
  // >0xffff code points that are a valid part of identifiers. The
  // offset starts at 0x10000, and each pair of numbers represents an
  // offset to the next range, and then a size of the range. They were
  // generated by bin/generate-identifier-regex.js
  var astralIdentifierStartCodes = [0,11,2,25,2,18,2,1,2,14,3,13,35,122,70,52,268,28,4,48,48,31,17,26,6,37,11,29,3,35,5,7,2,4,43,157,19,35,5,35,5,39,9,51,157,310,10,21,11,7,153,5,3,0,2,43,2,1,4,0,3,22,11,22,10,30,66,18,2,1,11,21,11,25,71,55,7,1,65,0,16,3,2,2,2,26,45,28,4,28,36,7,2,27,28,53,11,21,11,18,14,17,111,72,56,50,14,50,785,52,76,44,33,24,27,35,42,34,4,0,13,47,15,3,22,0,2,0,36,17,2,24,85,6,2,0,2,3,2,14,2,9,8,46,39,7,3,1,3,21,2,6,2,1,2,4,4,0,19,0,13,4,159,52,19,3,54,47,21,1,2,0,185,46,42,3,37,47,21,0,60,42,86,25,391,63,32,0,449,56,264,8,2,36,18,0,50,29,881,921,103,110,18,195,2749,1070,4050,582,8634,568,8,30,114,29,19,47,17,3,32,20,6,18,881,68,12,0,67,12,65,0,32,6124,20,754,9486,1,3071,106,6,12,4,8,8,9,5991,84,2,70,2,1,3,0,3,1,3,3,2,11,2,0,2,6,2,64,2,3,3,7,2,6,2,27,2,3,2,4,2,0,4,6,2,339,3,24,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,7,4149,196,60,67,1213,3,2,26,2,1,2,0,3,0,2,9,2,3,2,0,2,0,7,0,5,0,2,0,2,0,2,2,2,1,2,0,3,0,2,0,2,0,2,0,2,0,2,1,2,0,3,3,2,6,2,3,2,3,2,0,2,9,2,16,6,2,2,4,2,16,4421,42710,42,4148,12,221,3,5761,10591,541]
  var astralIdentifierCodes = [509,0,227,0,150,4,294,9,1368,2,2,1,6,3,41,2,5,0,166,1,1306,2,54,14,32,9,16,3,46,10,54,9,7,2,37,13,2,9,52,0,13,2,49,13,10,2,4,9,83,11,7,0,161,11,6,9,7,3,57,0,2,6,3,1,3,2,10,0,11,1,3,6,4,4,193,17,10,9,87,19,13,9,214,6,3,8,28,1,83,16,16,9,82,12,9,9,84,14,5,9,423,9,838,7,2,7,17,9,57,21,2,13,19882,9,135,4,60,6,26,9,1016,45,17,3,19723,1,5319,4,4,5,9,7,3,6,31,3,149,2,1418,49,513,54,5,49,9,0,15,0,23,4,2,14,1361,6,2,16,3,6,2,1,2,4,2214,6,110,6,6,9,792487,239]

  // This has a complexity linear to the value of the code. The
  // assumption is that looking up astral identifier characters is
  // rare.
  function isInAstralSet(code, set) {
    var pos = 0x10000
    for (var i = 0; i < set.length; i += 2) {
      pos += set[i]
      if (pos > code) return false
      pos += set[i + 1]
      if (pos >= code) return true
    }
  }

  // Test whether a given character code starts an identifier.

  function isIdentifierStart(code, astral) {
    if (code < 65) return code === 36
    if (code < 91) return true
    if (code < 97) return code === 95
    if (code < 123) return true
    if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code))
    if (astral === false) return false
    return isInAstralSet(code, astralIdentifierStartCodes)
  }

  // Test whether a given character is part of an identifier.

  function isIdentifierChar(code, astral) {
    if (code < 48) return code === 36
    if (code < 58) return true
    if (code < 65) return false
    if (code < 91) return true
    if (code < 97) return code === 95
    if (code < 123) return true
    if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code))
    if (astral === false) return false
    return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes)
  }

  // ## Token types

  // The assignment of fine-grained, information-carrying type objects
  // allows the tokenizer to store the information it has about a
  // token in a way that is very cheap for the parser to look up.

  // All token type variables start with an underscore, to make them
  // easy to recognize.

  // The `beforeExpr` property is used to disambiguate between regular
  // expressions and divisions. It is set on all token types that can
  // be followed by an expression (thus, a slash after them would be a
  // regular expression).
  //
  // The `startsExpr` property is used to check if the token ends a
  // `yield` expression. It is set on all token types that either can
  // directly start an expression (like a quotation mark) or can
  // continue an expression (like the body of a string).
  //
  // `isLoop` marks a keyword as starting a loop, which is important
  // to know when parsing a label, in order to allow or disallow
  // continue jumps to that label.

  var TokenType = function TokenType(label, conf) {
    if ( conf === void 0 ) conf = {};

    this.label = label
    this.keyword = conf.keyword
    this.beforeExpr = !!conf.beforeExpr
    this.startsExpr = !!conf.startsExpr
    this.isLoop = !!conf.isLoop
    this.isAssign = !!conf.isAssign
    this.prefix = !!conf.prefix
    this.postfix = !!conf.postfix
    this.binop = conf.binop || null
    this.updateContext = null
  };

  function binop(name, prec) {
    return new TokenType(name, {beforeExpr: true, binop: prec})
  }
  var beforeExpr = {beforeExpr: true};
  var startsExpr = {startsExpr: true};
  // Map keyword names to token types.

  var keywordTypes = {}

  // Succinct definitions of keyword token types
  function kw(name, options) {
    if ( options === void 0 ) options = {};

    options.keyword = name
    return keywordTypes[name] = new TokenType(name, options)
  }

  var tt = {
    num: new TokenType("num", startsExpr),
    regexp: new TokenType("regexp", startsExpr),
    string: new TokenType("string", startsExpr),
    name: new TokenType("name", startsExpr),
    eof: new TokenType("eof"),

    // Punctuation token types.
    bracketL: new TokenType("[", {beforeExpr: true, startsExpr: true}),
    bracketR: new TokenType("]"),
    braceL: new TokenType("{", {beforeExpr: true, startsExpr: true}),
    braceR: new TokenType("}"),
    parenL: new TokenType("(", {beforeExpr: true, startsExpr: true}),
    parenR: new TokenType(")"),
    comma: new TokenType(",", beforeExpr),
    semi: new TokenType(";", beforeExpr),
    colon: new TokenType(":", beforeExpr),
    dot: new TokenType("."),
    question: new TokenType("?", beforeExpr),
    arrow: new TokenType("=>", beforeExpr),
    template: new TokenType("template"),
    ellipsis: new TokenType("...", beforeExpr),
    backQuote: new TokenType("`", startsExpr),
    dollarBraceL: new TokenType("${", {beforeExpr: true, startsExpr: true}),

    // Operators. These carry several kinds of properties to help the
    // parser use them properly (the presence of these properties is
    // what categorizes them as operators).
    //
    // `binop`, when present, specifies that this operator is a binary
    // operator, and will refer to its precedence.
    //
    // `prefix` and `postfix` mark the operator as a prefix or postfix
    // unary operator.
    //
    // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
    // binary operators with a very low precedence, that should result
    // in AssignmentExpression nodes.

    eq: new TokenType("=", {beforeExpr: true, isAssign: true}),
    assign: new TokenType("_=", {beforeExpr: true, isAssign: true}),
    incDec: new TokenType("++/--", {prefix: true, postfix: true, startsExpr: true}),
    prefix: new TokenType("prefix", {beforeExpr: true, prefix: true, startsExpr: true}),
    logicalOR: binop("||", 1),
    logicalAND: binop("&&", 2),
    bitwiseOR: binop("|", 3),
    bitwiseXOR: binop("^", 4),
    bitwiseAND: binop("&", 5),
    equality: binop("==/!=", 6),
    relational: binop("</>", 7),
    bitShift: binop("<</>>", 8),
    plusMin: new TokenType("+/-", {beforeExpr: true, binop: 9, prefix: true, startsExpr: true}),
    modulo: binop("%", 10),
    star: binop("*", 10),
    slash: binop("/", 10),
    starstar: new TokenType("**", {beforeExpr: true}),

    // Keyword token types.
    _break: kw("break"),
    _case: kw("case", beforeExpr),
    _catch: kw("catch"),
    _continue: kw("continue"),
    _debugger: kw("debugger"),
    _default: kw("default", beforeExpr),
    _do: kw("do", {isLoop: true, beforeExpr: true}),
    _else: kw("else", beforeExpr),
    _finally: kw("finally"),
    _for: kw("for", {isLoop: true}),
    _function: kw("function", startsExpr),
    _if: kw("if"),
    _return: kw("return", beforeExpr),
    _switch: kw("switch"),
    _throw: kw("throw", beforeExpr),
    _try: kw("try"),
    _var: kw("var"),
    _const: kw("const"),
    _while: kw("while", {isLoop: true}),
    _with: kw("with"),
    _new: kw("new", {beforeExpr: true, startsExpr: true}),
    _this: kw("this", startsExpr),
    _super: kw("super", startsExpr),
    _class: kw("class"),
    _extends: kw("extends", beforeExpr),
    _export: kw("export"),
    _import: kw("import"),
    _null: kw("null", startsExpr),
    _true: kw("true", startsExpr),
    _false: kw("false", startsExpr),
    _in: kw("in", {beforeExpr: true, binop: 7}),
    _instanceof: kw("instanceof", {beforeExpr: true, binop: 7}),
    _typeof: kw("typeof", {beforeExpr: true, prefix: true, startsExpr: true}),
    _void: kw("void", {beforeExpr: true, prefix: true, startsExpr: true}),
    _delete: kw("delete", {beforeExpr: true, prefix: true, startsExpr: true})
  }

  // Matches a whole line break (where CRLF is considered a single
  // line break). Used to count lines.

  var lineBreak = /\r\n?|\n|\u2028|\u2029/
  var lineBreakG = new RegExp(lineBreak.source, "g")

  function isNewLine(code) {
    return code === 10 || code === 13 || code === 0x2028 || code == 0x2029
  }

  var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/

  var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g

  function isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]"
  }

  // Checks if an object has a property.

  function has(obj, propName) {
    return Object.prototype.hasOwnProperty.call(obj, propName)
  }

  // These are used when `options.locations` is on, for the
  // `startLoc` and `endLoc` properties.

  var Position = function Position(line, col) {
    this.line = line
    this.column = col
  };

  Position.prototype.offset = function offset (n) {
    return new Position(this.line, this.column + n)
  };

  var SourceLocation = function SourceLocation(p, start, end) {
    this.start = start
    this.end = end
    if (p.sourceFile !== null) this.source = p.sourceFile
  };

  // The `getLineInfo` function is mostly useful when the
  // `locations` option is off (for performance reasons) and you
  // want to find the line/column position for a given character
  // offset. `input` should be the code string that the offset refers
  // into.

  function getLineInfo(input, offset) {
    for (var line = 1, cur = 0;;) {
      lineBreakG.lastIndex = cur
      var match = lineBreakG.exec(input)
      if (match && match.index < offset) {
        ++line
        cur = match.index + match[0].length
      } else {
        return new Position(line, offset - cur)
      }
    }
  }

  // A second optional argument can be given to further configure
  // the parser process. These options are recognized:

  var defaultOptions = {
    // `ecmaVersion` indicates the ECMAScript version to parse. Must
    // be either 3, or 5, or 6. This influences support for strict
    // mode, the set of reserved words, support for getters and
    // setters and other features. The default is 6.
    ecmaVersion: 6,
    // Source type ("script" or "module") for different semantics
    sourceType: "script",
    // `onInsertedSemicolon` can be a callback that will be called
    // when a semicolon is automatically inserted. It will be passed
    // th position of the comma as an offset, and if `locations` is
    // enabled, it is given the location as a `{line, column}` object
    // as second argument.
    onInsertedSemicolon: null,
    // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
    // trailing commas.
    onTrailingComma: null,
    // By default, reserved words are only enforced if ecmaVersion >= 5.
    // Set `allowReserved` to a boolean value to explicitly turn this on
    // an off. When this option has the value "never", reserved words
    // and keywords can also not be used as property names.
    allowReserved: null,
    // When enabled, a return at the top level is not considered an
    // error.
    allowReturnOutsideFunction: false,
    // When enabled, import/export statements are not constrained to
    // appearing at the top of the program.
    allowImportExportEverywhere: false,
    // When enabled, hashbang directive in the beginning of file
    // is allowed and treated as a line comment.
    allowHashBang: false,
    // When `locations` is on, `loc` properties holding objects with
    // `start` and `end` properties in `{line, column}` form (with
    // line being 1-based and column 0-based) will be attached to the
    // nodes.
    locations: false,
    // A function can be passed as `onToken` option, which will
    // cause Acorn to call that function with object in the same
    // format as tokens returned from `tokenizer().getToken()`. Note
    // that you are not allowed to call the parser from the
    // callback—that will corrupt its internal state.
    onToken: null,
    // A function can be passed as `onComment` option, which will
    // cause Acorn to call that function with `(block, text, start,
    // end)` parameters whenever a comment is skipped. `block` is a
    // boolean indicating whether this is a block (`/* */`) comment,
    // `text` is the content of the comment, and `start` and `end` are
    // character offsets that denote the start and end of the comment.
    // When the `locations` option is on, two more parameters are
    // passed, the full `{line, column}` locations of the start and
    // end of the comments. Note that you are not allowed to call the
    // parser from the callback—that will corrupt its internal state.
    onComment: null,
    // Nodes have their start and end characters offsets recorded in
    // `start` and `end` properties (directly on the node, rather than
    // the `loc` object, which holds line/column data. To also add a
    // [semi-standardized][range] `range` property holding a `[start,
    // end]` array with the same numbers, set the `ranges` option to
    // `true`.
    //
    // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
    ranges: false,
    // It is possible to parse multiple files into a single AST by
    // passing the tree produced by parsing the first file as
    // `program` option in subsequent parses. This will add the
    // toplevel forms of the parsed file to the `Program` (top) node
    // of an existing parse tree.
    program: null,
    // When `locations` is on, you can pass this to record the source
    // file in every node's `loc` object.
    sourceFile: null,
    // This value, if given, is stored in every node, whether
    // `locations` is on or off.
    directSourceFile: null,
    // When enabled, parenthesized expressions are represented by
    // (non-standard) ParenthesizedExpression nodes
    preserveParens: false,
    plugins: {}
  }

  // Interpret and default an options object

  function getOptions(opts) {
    var options = {}
    for (var opt in defaultOptions)
      options[opt] = opts && has(opts, opt) ? opts[opt] : defaultOptions[opt]
    if (options.allowReserved == null)
      options.allowReserved = options.ecmaVersion < 5

    if (isArray(options.onToken)) {
      var tokens = options.onToken
      options.onToken = function (token) { return tokens.push(token); }
    }
    if (isArray(options.onComment))
      options.onComment = pushComment(options, options.onComment)

    return options
  }

  function pushComment(options, array) {
    return function (block, text, start, end, startLoc, endLoc) {
      var comment = {
        type: block ? 'Block' : 'Line',
        value: text,
        start: start,
        end: end
      }
      if (options.locations)
        comment.loc = new SourceLocation(this, startLoc, endLoc)
      if (options.ranges)
        comment.range = [start, end]
      array.push(comment)
    }
  }

  // Registered plugins
  var plugins = {}

  function keywordRegexp(words) {
    return new RegExp("^(" + words.replace(/ /g, "|") + ")$")
  }

  var Parser = function Parser(options, input, startPos) {
    this.options = options = getOptions(options)
    this.sourceFile = options.sourceFile
    this.keywords = keywordRegexp(keywords[options.ecmaVersion >= 6 ? 6 : 5])
    var reserved = options.allowReserved ? "" :
        reservedWords[options.ecmaVersion] + (options.sourceType == "module" ? " await" : "")
    this.reservedWords = keywordRegexp(reserved)
    var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict
    this.reservedWordsStrict = keywordRegexp(reservedStrict)
    this.reservedWordsStrictBind = keywordRegexp(reservedStrict + " " + reservedWords.strictBind)
    this.input = String(input)

    // Used to signal to callers of `readWord1` whether the word
    // contained any escape sequences. This is needed because words with
    // escape sequences must not be interpreted as keywords.
    this.containsEsc = false

    // Load plugins
    this.loadPlugins(options.plugins)

    // Set up token state

    // The current position of the tokenizer in the input.
    if (startPos) {
      this.pos = startPos
      this.lineStart = Math.max(0, this.input.lastIndexOf("\n", startPos))
      this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length
    } else {
      this.pos = this.lineStart = 0
      this.curLine = 1
    }

    // Properties of the current token:
    // Its type
    this.type = tt.eof
    // For tokens that include more information than their type, the value
    this.value = null
    // Its start and end offset
    this.start = this.end = this.pos
    // And, if locations are used, the {line, column} object
    // corresponding to those offsets
    this.startLoc = this.endLoc = this.curPosition()

    // Position information for the previous token
    this.lastTokEndLoc = this.lastTokStartLoc = null
    this.lastTokStart = this.lastTokEnd = this.pos

    // The context stack is used to superficially track syntactic
    // context to predict whether a regular expression is allowed in a
    // given position.
    this.context = this.initialContext()
    this.exprAllowed = true

    // Figure out if it's a module code.
    this.strict = this.inModule = options.sourceType === "module"

    // Used to signify the start of a potential arrow function
    this.potentialArrowAt = -1

    // Flags to track whether we are in a function, a generator.
    this.inFunction = this.inGenerator = false
    // Labels in scope.
    this.labels = []

    // If enabled, skip leading hashbang line.
    if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === '#!')
      this.skipLineComment(2)
  };

  // DEPRECATED Kept for backwards compatibility until 3.0 in case a plugin uses them
  Parser.prototype.isKeyword = function isKeyword (word) { return this.keywords.test(word) };
  Parser.prototype.isReservedWord = function isReservedWord (word) { return this.reservedWords.test(word) };

  Parser.prototype.extend = function extend (name, f) {
    this[name] = f(this[name])
  };

  Parser.prototype.loadPlugins = function loadPlugins (pluginConfigs) {
      var this$1 = this;

    for (var name in pluginConfigs) {
      var plugin = plugins[name]
      if (!plugin) throw new Error("Plugin '" + name + "' not found")
      plugin(this$1, pluginConfigs[name])
    }
  };

  Parser.prototype.parse = function parse () {
    var node = this.options.program || this.startNode()
    this.nextToken()
    return this.parseTopLevel(node)
  };

  var pp = Parser.prototype

  // ## Parser utilities

  // Test whether a statement node is the string literal `"use strict"`.

  pp.isUseStrict = function(stmt) {
    return this.options.ecmaVersion >= 5 && stmt.type === "ExpressionStatement" &&
      stmt.expression.type === "Literal" &&
      stmt.expression.raw.slice(1, -1) === "use strict"
  }

  // Predicate that tests whether the next token is of the given
  // type, and if yes, consumes it as a side effect.

  pp.eat = function(type) {
    if (this.type === type) {
      this.next()
      return true
    } else {
      return false
    }
  }

  // Tests whether parsed token is a contextual keyword.

  pp.isContextual = function(name) {
    return this.type === tt.name && this.value === name
  }

  // Consumes contextual keyword if possible.

  pp.eatContextual = function(name) {
    return this.value === name && this.eat(tt.name)
  }

  // Asserts that following token is given contextual keyword.

  pp.expectContextual = function(name) {
    if (!this.eatContextual(name)) this.unexpected()
  }

  // Test whether a semicolon can be inserted at the current position.

  pp.canInsertSemicolon = function() {
    return this.type === tt.eof ||
      this.type === tt.braceR ||
      lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
  }

  pp.insertSemicolon = function() {
    if (this.canInsertSemicolon()) {
      if (this.options.onInsertedSemicolon)
        this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc)
      return true
    }
  }

  // Consume a semicolon, or, failing that, see if we are allowed to
  // pretend that there is a semicolon at this position.

  pp.semicolon = function() {
    if (!this.eat(tt.semi) && !this.insertSemicolon()) this.unexpected()
  }

  pp.afterTrailingComma = function(tokType) {
    if (this.type == tokType) {
      if (this.options.onTrailingComma)
        this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc)
      this.next()
      return true
    }
  }

  // Expect a token of a given type. If found, consume it, otherwise,
  // raise an unexpected token error.

  pp.expect = function(type) {
    this.eat(type) || this.unexpected()
  }

  // Raise an unexpected token error.

  pp.unexpected = function(pos) {
    this.raise(pos != null ? pos : this.start, "Unexpected token")
  }

  var DestructuringErrors = function DestructuringErrors() {
    this.shorthandAssign = 0
    this.trailingComma = 0
  };

  pp.checkPatternErrors = function(refDestructuringErrors, andThrow) {
    var trailing = refDestructuringErrors && refDestructuringErrors.trailingComma
    if (!andThrow) return !!trailing
    if (trailing) this.raise(trailing, "Comma is not permitted after the rest element")
  }

  pp.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
    var pos = refDestructuringErrors && refDestructuringErrors.shorthandAssign
    if (!andThrow) return !!pos
    if (pos) this.raise(pos, "Shorthand property assignments are valid only in destructuring patterns")
  }

  var pp$1 = Parser.prototype

  // ### Statement parsing

  // Parse a program. Initializes the parser, reads any number of
  // statements, and wraps them in a Program node.  Optionally takes a
  // `program` argument.  If present, the statements will be appended
  // to its body instead of creating a new node.

  pp$1.parseTopLevel = function(node) {
    var this$1 = this;

    var first = true
    if (!node.body) node.body = []
    while (this.type !== tt.eof) {
      var stmt = this$1.parseStatement(true, true)
      node.body.push(stmt)
      if (first) {
        if (this$1.isUseStrict(stmt)) this$1.setStrict(true)
        first = false
      }
    }
    this.next()
    if (this.options.ecmaVersion >= 6) {
      node.sourceType = this.options.sourceType
    }
    return this.finishNode(node, "Program")
  }

  var loopLabel = {kind: "loop"};
  var switchLabel = {kind: "switch"};
  pp$1.isLet = function() {
    if (this.type !== tt.name || this.options.ecmaVersion < 6 || this.value != "let") return false
    skipWhiteSpace.lastIndex = this.pos
    var skip = skipWhiteSpace.exec(this.input)
    var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next)
    if (nextCh === 91 || nextCh == 123) return true // '{' and '['
    if (isIdentifierStart(nextCh, true)) {
      for (var pos = next + 1; isIdentifierChar(this.input.charCodeAt(pos), true); ++pos) {}
      var ident = this.input.slice(next, pos)
      if (!this.isKeyword(ident)) return true
    }
    return false
  }

  // Parse a single statement.
  //
  // If expecting a statement and finding a slash operator, parse a
  // regular expression literal. This is to handle cases like
  // `if (foo) /blah/.exec(foo)`, where looking at the previous token
  // does not help.

  pp$1.parseStatement = function(declaration, topLevel) {
    var starttype = this.type, node = this.startNode(), kind

    if (this.isLet()) {
      starttype = tt._var
      kind = "let"
    }

    // Most types of statements are recognized by the keyword they
    // start with. Many are trivial to parse, some require a bit of
    // complexity.

    switch (starttype) {
    case tt._break: case tt._continue: return this.parseBreakContinueStatement(node, starttype.keyword)
    case tt._debugger: return this.parseDebuggerStatement(node)
    case tt._do: return this.parseDoStatement(node)
    case tt._for: return this.parseForStatement(node)
    case tt._function:
      if (!declaration && this.options.ecmaVersion >= 6) this.unexpected()
      return this.parseFunctionStatement(node)
    case tt._class:
      if (!declaration) this.unexpected()
      return this.parseClass(node, true)
    case tt._if: return this.parseIfStatement(node)
    case tt._return: return this.parseReturnStatement(node)
    case tt._switch: return this.parseSwitchStatement(node)
    case tt._throw: return this.parseThrowStatement(node)
    case tt._try: return this.parseTryStatement(node)
    case tt._const: case tt._var:
      kind = kind || this.value
      if (!declaration && kind != "var") this.unexpected()
      return this.parseVarStatement(node, kind)
    case tt._while: return this.parseWhileStatement(node)
    case tt._with: return this.parseWithStatement(node)
    case tt.braceL: return this.parseBlock()
    case tt.semi: return this.parseEmptyStatement(node)
    case tt._export:
    case tt._import:
      if (!this.options.allowImportExportEverywhere) {
        if (!topLevel)
          this.raise(this.start, "'import' and 'export' may only appear at the top level")
        if (!this.inModule)
          this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'")
      }
      return starttype === tt._import ? this.parseImport(node) : this.parseExport(node)

      // If the statement does not start with a statement keyword or a
      // brace, it's an ExpressionStatement or LabeledStatement. We
      // simply start parsing an expression, and afterwards, if the
      // next token is a colon and the expression was a simple
      // Identifier node, we switch to interpreting it as a label.
    default:
      var maybeName = this.value, expr = this.parseExpression()
      if (starttype === tt.name && expr.type === "Identifier" && this.eat(tt.colon))
        return this.parseLabeledStatement(node, maybeName, expr)
      else return this.parseExpressionStatement(node, expr)
    }
  }

  pp$1.parseBreakContinueStatement = function(node, keyword) {
    var this$1 = this;

    var isBreak = keyword == "break"
    this.next()
    if (this.eat(tt.semi) || this.insertSemicolon()) node.label = null
    else if (this.type !== tt.name) this.unexpected()
    else {
      node.label = this.parseIdent()
      this.semicolon()
    }

    // Verify that there is an actual destination to break or
    // continue to.
    for (var i = 0; i < this.labels.length; ++i) {
      var lab = this$1.labels[i]
      if (node.label == null || lab.name === node.label.name) {
        if (lab.kind != null && (isBreak || lab.kind === "loop")) break
        if (node.label && isBreak) break
      }
    }
    if (i === this.labels.length) this.raise(node.start, "Unsyntactic " + keyword)
    return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement")
  }

  pp$1.parseDebuggerStatement = function(node) {
    this.next()
    this.semicolon()
    return this.finishNode(node, "DebuggerStatement")
  }

  pp$1.parseDoStatement = function(node) {
    this.next()
    this.labels.push(loopLabel)
    node.body = this.parseStatement(false)
    this.labels.pop()
    this.expect(tt._while)
    node.test = this.parseParenExpression()
    if (this.options.ecmaVersion >= 6)
      this.eat(tt.semi)
    else
      this.semicolon()
    return this.finishNode(node, "DoWhileStatement")
  }

  // Disambiguating between a `for` and a `for`/`in` or `for`/`of`
  // loop is non-trivial. Basically, we have to parse the init `var`
  // statement or expression, disallowing the `in` operator (see
  // the second parameter to `parseExpression`), and then check
  // whether the next token is `in` or `of`. When there is no init
  // part (semicolon immediately after the opening parenthesis), it
  // is a regular `for` loop.

  pp$1.parseForStatement = function(node) {
    this.next()
    this.labels.push(loopLabel)
    this.expect(tt.parenL)
    if (this.type === tt.semi) return this.parseFor(node, null)
    var isLet = this.isLet()
    if (this.type === tt._var || this.type === tt._const || isLet) {
      var init$1 = this.startNode(), kind = isLet ? "let" : this.value
      this.next()
      this.parseVar(init$1, true, kind)
      this.finishNode(init$1, "VariableDeclaration")
      if ((this.type === tt._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) && init$1.declarations.length === 1 &&
          !(kind !== "var" && init$1.declarations[0].init))
        return this.parseForIn(node, init$1)
      return this.parseFor(node, init$1)
    }
    var refDestructuringErrors = new DestructuringErrors
    var init = this.parseExpression(true, refDestructuringErrors)
    if (this.type === tt._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
      this.checkPatternErrors(refDestructuringErrors, true)
      this.toAssignable(init)
      this.checkLVal(init)
      return this.parseForIn(node, init)
    } else {
      this.checkExpressionErrors(refDestructuringErrors, true)
    }
    return this.parseFor(node, init)
  }

  pp$1.parseFunctionStatement = function(node) {
    this.next()
    return this.parseFunction(node, true)
  }

  pp$1.parseIfStatement = function(node) {
    this.next()
    node.test = this.parseParenExpression()
    node.consequent = this.parseStatement(false)
    node.alternate = this.eat(tt._else) ? this.parseStatement(false) : null
    return this.finishNode(node, "IfStatement")
  }

  pp$1.parseReturnStatement = function(node) {
    if (!this.inFunction && !this.options.allowReturnOutsideFunction)
      this.raise(this.start, "'return' outside of function")
    this.next()

    // In `return` (and `break`/`continue`), the keywords with
    // optional arguments, we eagerly look for a semicolon or the
    // possibility to insert one.

    if (this.eat(tt.semi) || this.insertSemicolon()) node.argument = null
    else { node.argument = this.parseExpression(); this.semicolon() }
    return this.finishNode(node, "ReturnStatement")
  }

  pp$1.parseSwitchStatement = function(node) {
    var this$1 = this;

    this.next()
    node.discriminant = this.parseParenExpression()
    node.cases = []
    this.expect(tt.braceL)
    this.labels.push(switchLabel)

    // Statements under must be grouped (by label) in SwitchCase
    // nodes. `cur` is used to keep the node that we are currently
    // adding statements to.

    for (var cur, sawDefault = false; this.type != tt.braceR;) {
      if (this$1.type === tt._case || this$1.type === tt._default) {
        var isCase = this$1.type === tt._case
        if (cur) this$1.finishNode(cur, "SwitchCase")
        node.cases.push(cur = this$1.startNode())
        cur.consequent = []
        this$1.next()
        if (isCase) {
          cur.test = this$1.parseExpression()
        } else {
          if (sawDefault) this$1.raiseRecoverable(this$1.lastTokStart, "Multiple default clauses")
          sawDefault = true
          cur.test = null
        }
        this$1.expect(tt.colon)
      } else {
        if (!cur) this$1.unexpected()
        cur.consequent.push(this$1.parseStatement(true))
      }
    }
    if (cur) this.finishNode(cur, "SwitchCase")
    this.next() // Closing brace
    this.labels.pop()
    return this.finishNode(node, "SwitchStatement")
  }

  pp$1.parseThrowStatement = function(node) {
    this.next()
    if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start)))
      this.raise(this.lastTokEnd, "Illegal newline after throw")
    node.argument = this.parseExpression()
    this.semicolon()
    return this.finishNode(node, "ThrowStatement")
  }

  // Reused empty array added for node fields that are always empty.

  var empty = []

  pp$1.parseTryStatement = function(node) {
    this.next()
    node.block = this.parseBlock()
    node.handler = null
    if (this.type === tt._catch) {
      var clause = this.startNode()
      this.next()
      this.expect(tt.parenL)
      clause.param = this.parseBindingAtom()
      this.checkLVal(clause.param, true)
      this.expect(tt.parenR)
      clause.body = this.parseBlock()
      node.handler = this.finishNode(clause, "CatchClause")
    }
    node.finalizer = this.eat(tt._finally) ? this.parseBlock() : null
    if (!node.handler && !node.finalizer)
      this.raise(node.start, "Missing catch or finally clause")
    return this.finishNode(node, "TryStatement")
  }

  pp$1.parseVarStatement = function(node, kind) {
    this.next()
    this.parseVar(node, false, kind)
    this.semicolon()
    return this.finishNode(node, "VariableDeclaration")
  }

  pp$1.parseWhileStatement = function(node) {
    this.next()
    node.test = this.parseParenExpression()
    this.labels.push(loopLabel)
    node.body = this.parseStatement(false)
    this.labels.pop()
    return this.finishNode(node, "WhileStatement")
  }

  pp$1.parseWithStatement = function(node) {
    if (this.strict) this.raise(this.start, "'with' in strict mode")
    this.next()
    node.object = this.parseParenExpression()
    node.body = this.parseStatement(false)
    return this.finishNode(node, "WithStatement")
  }

  pp$1.parseEmptyStatement = function(node) {
    this.next()
    return this.finishNode(node, "EmptyStatement")
  }

  pp$1.parseLabeledStatement = function(node, maybeName, expr) {
    var this$1 = this;

    for (var i = 0; i < this.labels.length; ++i)
      if (this$1.labels[i].name === maybeName) this$1.raise(expr.start, "Label '" + maybeName + "' is already declared")
    var kind = this.type.isLoop ? "loop" : this.type === tt._switch ? "switch" : null
    for (var i$1 = this.labels.length - 1; i$1 >= 0; i$1--) {
      var label = this$1.labels[i$1]
      if (label.statementStart == node.start) {
        label.statementStart = this$1.start
        label.kind = kind
      } else break
    }
    this.labels.push({name: maybeName, kind: kind, statementStart: this.start})
    node.body = this.parseStatement(true)
    this.labels.pop()
    node.label = expr
    return this.finishNode(node, "LabeledStatement")
  }

  pp$1.parseExpressionStatement = function(node, expr) {
    node.expression = expr
    this.semicolon()
    return this.finishNode(node, "ExpressionStatement")
  }

  // Parse a semicolon-enclosed block of statements, handling `"use
  // strict"` declarations when `allowStrict` is true (used for
  // function bodies).

  pp$1.parseBlock = function(allowStrict) {
    var this$1 = this;

    var node = this.startNode(), first = true, oldStrict
    node.body = []
    this.expect(tt.braceL)
    while (!this.eat(tt.braceR)) {
      var stmt = this$1.parseStatement(true)
      node.body.push(stmt)
      if (first && allowStrict && this$1.isUseStrict(stmt)) {
        oldStrict = this$1.strict
        this$1.setStrict(this$1.strict = true)
      }
      first = false
    }
    if (oldStrict === false) this.setStrict(false)
    return this.finishNode(node, "BlockStatement")
  }

  // Parse a regular `for` loop. The disambiguation code in
  // `parseStatement` will already have parsed the init statement or
  // expression.

  pp$1.parseFor = function(node, init) {
    node.init = init
    this.expect(tt.semi)
    node.test = this.type === tt.semi ? null : this.parseExpression()
    this.expect(tt.semi)
    node.update = this.type === tt.parenR ? null : this.parseExpression()
    this.expect(tt.parenR)
    node.body = this.parseStatement(false)
    this.labels.pop()
    return this.finishNode(node, "ForStatement")
  }

  // Parse a `for`/`in` and `for`/`of` loop, which are almost
  // same from parser's perspective.

  pp$1.parseForIn = function(node, init) {
    var type = this.type === tt._in ? "ForInStatement" : "ForOfStatement"
    this.next()
    node.left = init
    node.right = this.parseExpression()
    this.expect(tt.parenR)
    node.body = this.parseStatement(false)
    this.labels.pop()
    return this.finishNode(node, type)
  }

  // Parse a list of variable declarations.

  pp$1.parseVar = function(node, isFor, kind) {
    var this$1 = this;

    node.declarations = []
    node.kind = kind
    for (;;) {
      var decl = this$1.startNode()
      this$1.parseVarId(decl)
      if (this$1.eat(tt.eq)) {
        decl.init = this$1.parseMaybeAssign(isFor)
      } else if (kind === "const" && !(this$1.type === tt._in || (this$1.options.ecmaVersion >= 6 && this$1.isContextual("of")))) {
        this$1.unexpected()
      } else if (decl.id.type != "Identifier" && !(isFor && (this$1.type === tt._in || this$1.isContextual("of")))) {
        this$1.raise(this$1.lastTokEnd, "Complex binding patterns require an initialization value")
      } else {
        decl.init = null
      }
      node.declarations.push(this$1.finishNode(decl, "VariableDeclarator"))
      if (!this$1.eat(tt.comma)) break
    }
    return node
  }

  pp$1.parseVarId = function(decl) {
    decl.id = this.parseBindingAtom()
    this.checkLVal(decl.id, true)
  }

  // Parse a function declaration or literal (depending on the
  // `isStatement` parameter).

  pp$1.parseFunction = function(node, isStatement, allowExpressionBody) {
    this.initFunction(node)
    if (this.options.ecmaVersion >= 6)
      node.generator = this.eat(tt.star)
    var oldInGen = this.inGenerator
    this.inGenerator = node.generator
    if (isStatement || this.type === tt.name)
      node.id = this.parseIdent()
    this.parseFunctionParams(node)
    this.parseFunctionBody(node, allowExpressionBody)
    this.inGenerator = oldInGen
    return this.finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression")
  }

  pp$1.parseFunctionParams = function(node) {
    this.expect(tt.parenL)
    node.params = this.parseBindingList(tt.parenR, false, false, true)
  }

  // Parse a class declaration or literal (depending on the
  // `isStatement` parameter).

  pp$1.parseClass = function(node, isStatement) {
    var this$1 = this;

    this.next()
    this.parseClassId(node, isStatement)
    this.parseClassSuper(node)
    var classBody = this.startNode()
    var hadConstructor = false
    classBody.body = []
    this.expect(tt.braceL)
    while (!this.eat(tt.braceR)) {
      if (this$1.eat(tt.semi)) continue
      var method = this$1.startNode()
      var isGenerator = this$1.eat(tt.star)
      var isMaybeStatic = this$1.type === tt.name && this$1.value === "static"
      this$1.parsePropertyName(method)
      method.static = isMaybeStatic && this$1.type !== tt.parenL
      if (method.static) {
        if (isGenerator) this$1.unexpected()
        isGenerator = this$1.eat(tt.star)
        this$1.parsePropertyName(method)
      }
      method.kind = "method"
      var isGetSet = false
      if (!method.computed) {
        var key = method.key;
        if (!isGenerator && key.type === "Identifier" && this$1.type !== tt.parenL && (key.name === "get" || key.name === "set")) {
          isGetSet = true
          method.kind = key.name
          key = this$1.parsePropertyName(method)
        }
        if (!method.static && (key.type === "Identifier" && key.name === "constructor" ||
            key.type === "Literal" && key.value === "constructor")) {
          if (hadConstructor) this$1.raise(key.start, "Duplicate constructor in the same class")
          if (isGetSet) this$1.raise(key.start, "Constructor can't have get/set modifier")
          if (isGenerator) this$1.raise(key.start, "Constructor can't be a generator")
          method.kind = "constructor"
          hadConstructor = true
        }
      }
      this$1.parseClassMethod(classBody, method, isGenerator)
      if (isGetSet) {
        var paramCount = method.kind === "get" ? 0 : 1
        if (method.value.params.length !== paramCount) {
          var start = method.value.start
          if (method.kind === "get")
            this$1.raiseRecoverable(start, "getter should have no params")
          else
            this$1.raiseRecoverable(start, "setter should have exactly one param")
        }
        if (method.kind === "set" && method.value.params[0].type === "RestElement")
          this$1.raise(method.value.params[0].start, "Setter cannot use rest params")
      }
    }
    node.body = this.finishNode(classBody, "ClassBody")
    return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression")
  }

  pp$1.parseClassMethod = function(classBody, method, isGenerator) {
    method.value = this.parseMethod(isGenerator)
    classBody.body.push(this.finishNode(method, "MethodDefinition"))
  }

  pp$1.parseClassId = function(node, isStatement) {
    node.id = this.type === tt.name ? this.parseIdent() : isStatement ? this.unexpected() : null
  }

  pp$1.parseClassSuper = function(node) {
    node.superClass = this.eat(tt._extends) ? this.parseExprSubscripts() : null
  }

  // Parses module export declaration.

  pp$1.parseExport = function(node) {
    var this$1 = this;

    this.next()
    // export * from '...'
    if (this.eat(tt.star)) {
      this.expectContextual("from")
      node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected()
      this.semicolon()
      return this.finishNode(node, "ExportAllDeclaration")
    }
    if (this.eat(tt._default)) { // export default ...
      var parens = this.type == tt.parenL
      var expr = this.parseMaybeAssign()
      var needsSemi = true
      if (!parens && (expr.type == "FunctionExpression" ||
                      expr.type == "ClassExpression")) {
        needsSemi = false
        if (expr.id) {
          expr.type = expr.type == "FunctionExpression"
            ? "FunctionDeclaration"
            : "ClassDeclaration"
        }
      }
      node.declaration = expr
      if (needsSemi) this.semicolon()
      return this.finishNode(node, "ExportDefaultDeclaration")
    }
    // export var|const|let|function|class ...
    if (this.shouldParseExportStatement()) {
      node.declaration = this.parseStatement(true)
      node.specifiers = []
      node.source = null
    } else { // export { x, y as z } [from '...']
      node.declaration = null
      node.specifiers = this.parseExportSpecifiers()
      if (this.eatContextual("from")) {
        node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected()
      } else {
        // check for keywords used as local names
        for (var i = 0; i < node.specifiers.length; i++) {
          if (this$1.keywords.test(node.specifiers[i].local.name) || this$1.reservedWords.test(node.specifiers[i].local.name)) {
            this$1.unexpected(node.specifiers[i].local.start)
          }
        }

        node.source = null
      }
      this.semicolon()
    }
    return this.finishNode(node, "ExportNamedDeclaration")
  }

  pp$1.shouldParseExportStatement = function() {
    return this.type.keyword || this.isLet()
  }

  // Parses a comma-separated list of module exports.

  pp$1.parseExportSpecifiers = function() {
    var this$1 = this;

    var nodes = [], first = true
    // export { x, y as z } [from '...']
    this.expect(tt.braceL)
    while (!this.eat(tt.braceR)) {
      if (!first) {
        this$1.expect(tt.comma)
        if (this$1.afterTrailingComma(tt.braceR)) break
      } else first = false

      var node = this$1.startNode()
      node.local = this$1.parseIdent(this$1.type === tt._default)
      node.exported = this$1.eatContextual("as") ? this$1.parseIdent(true) : node.local
      nodes.push(this$1.finishNode(node, "ExportSpecifier"))
    }
    return nodes
  }

  // Parses import declaration.

  pp$1.parseImport = function(node) {
    this.next()
    // import '...'
    if (this.type === tt.string) {
      node.specifiers = empty
      node.source = this.parseExprAtom()
    } else {
      node.specifiers = this.parseImportSpecifiers()
      this.expectContextual("from")
      node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected()
    }
    this.semicolon()
    return this.finishNode(node, "ImportDeclaration")
  }

  // Parses a comma-separated list of module imports.

  pp$1.parseImportSpecifiers = function() {
    var this$1 = this;

    var nodes = [], first = true
    if (this.type === tt.name) {
      // import defaultObj, { x, y as z } from '...'
      var node = this.startNode()
      node.local = this.parseIdent()
      this.checkLVal(node.local, true)
      nodes.push(this.finishNode(node, "ImportDefaultSpecifier"))
      if (!this.eat(tt.comma)) return nodes
    }
    if (this.type === tt.star) {
      var node$1 = this.startNode()
      this.next()
      this.expectContextual("as")
      node$1.local = this.parseIdent()
      this.checkLVal(node$1.local, true)
      nodes.push(this.finishNode(node$1, "ImportNamespaceSpecifier"))
      return nodes
    }
    this.expect(tt.braceL)
    while (!this.eat(tt.braceR)) {
      if (!first) {
        this$1.expect(tt.comma)
        if (this$1.afterTrailingComma(tt.braceR)) break
      } else first = false

      var node$2 = this$1.startNode()
      node$2.imported = this$1.parseIdent(true)
      if (this$1.eatContextual("as")) {
        node$2.local = this$1.parseIdent()
      } else {
        node$2.local = node$2.imported
        if (this$1.isKeyword(node$2.local.name)) this$1.unexpected(node$2.local.start)
        if (this$1.reservedWordsStrict.test(node$2.local.name)) this$1.raise(node$2.local.start, "The keyword '" + node$2.local.name + "' is reserved")
      }
      this$1.checkLVal(node$2.local, true)
      nodes.push(this$1.finishNode(node$2, "ImportSpecifier"))
    }
    return nodes
  }

  var pp$2 = Parser.prototype

  // Convert existing expression atom to assignable pattern
  // if possible.

  pp$2.toAssignable = function(node, isBinding) {
    var this$1 = this;

    if (this.options.ecmaVersion >= 6 && node) {
      switch (node.type) {
      case "Identifier":
      case "ObjectPattern":
      case "ArrayPattern":
        break

      case "ObjectExpression":
        node.type = "ObjectPattern"
        for (var i = 0; i < node.properties.length; i++) {
          var prop = node.properties[i]
          if (prop.kind !== "init") this$1.raise(prop.key.start, "Object pattern can't contain getter or setter")
          this$1.toAssignable(prop.value, isBinding)
        }
        break

      case "ArrayExpression":
        node.type = "ArrayPattern"
        this.toAssignableList(node.elements, isBinding)
        break

      case "AssignmentExpression":
        if (node.operator === "=") {
          node.type = "AssignmentPattern"
          delete node.operator
          // falls through to AssignmentPattern
        } else {
          this.raise(node.left.end, "Only '=' operator can be used for specifying default value.")
          break
        }

      case "AssignmentPattern":
        if (node.right.type === "YieldExpression")
          this.raise(node.right.start, "Yield expression cannot be a default value")
        break

      case "ParenthesizedExpression":
        node.expression = this.toAssignable(node.expression, isBinding)
        break

      case "MemberExpression":
        if (!isBinding) break

      default:
        this.raise(node.start, "Assigning to rvalue")
      }
    }
    return node
  }

  // Convert list of expression atoms to binding list.

  pp$2.toAssignableList = function(exprList, isBinding) {
    var this$1 = this;

    var end = exprList.length
    if (end) {
      var last = exprList[end - 1]
      if (last && last.type == "RestElement") {
        --end
      } else if (last && last.type == "SpreadElement") {
        last.type = "RestElement"
        var arg = last.argument
        this.toAssignable(arg, isBinding)
        if (arg.type !== "Identifier" && arg.type !== "MemberExpression" && arg.type !== "ArrayPattern")
          this.unexpected(arg.start)
        --end
      }

      if (isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier")
        this.unexpected(last.argument.start)
    }
    for (var i = 0; i < end; i++) {
      var elt = exprList[i]
      if (elt) this$1.toAssignable(elt, isBinding)
    }
    return exprList
  }

  // Parses spread element.

  pp$2.parseSpread = function(refDestructuringErrors) {
    var node = this.startNode()
    this.next()
    node.argument = this.parseMaybeAssign(false, refDestructuringErrors)
    return this.finishNode(node, "SpreadElement")
  }

  pp$2.parseRest = function(allowNonIdent) {
    var node = this.startNode()
    this.next()

    // RestElement inside of a function parameter must be an identifier
    if (allowNonIdent) node.argument = this.type === tt.name ? this.parseIdent() : this.unexpected()
    else node.argument = this.type === tt.name || this.type === tt.bracketL ? this.parseBindingAtom() : this.unexpected()

    return this.finishNode(node, "RestElement")
  }

  // Parses lvalue (assignable) atom.

  pp$2.parseBindingAtom = function() {
    if (this.options.ecmaVersion < 6) return this.parseIdent()
    switch (this.type) {
    case tt.name:
      return this.parseIdent()

    case tt.bracketL:
      var node = this.startNode()
      this.next()
      node.elements = this.parseBindingList(tt.bracketR, true, true)
      return this.finishNode(node, "ArrayPattern")

    case tt.braceL:
      return this.parseObj(true)

    default:
      this.unexpected()
    }
  }

  pp$2.parseBindingList = function(close, allowEmpty, allowTrailingComma, allowNonIdent) {
    var this$1 = this;

    var elts = [], first = true
    while (!this.eat(close)) {
      if (first) first = false
      else this$1.expect(tt.comma)
      if (allowEmpty && this$1.type === tt.comma) {
        elts.push(null)
      } else if (allowTrailingComma && this$1.afterTrailingComma(close)) {
        break
      } else if (this$1.type === tt.ellipsis) {
        var rest = this$1.parseRest(allowNonIdent)
        this$1.parseBindingListItem(rest)
        elts.push(rest)
        if (this$1.type === tt.comma) this$1.raise(this$1.start, "Comma is not permitted after the rest element")
        this$1.expect(close)
        break
      } else {
        var elem = this$1.parseMaybeDefault(this$1.start, this$1.startLoc)
        this$1.parseBindingListItem(elem)
        elts.push(elem)
      }
    }
    return elts
  }

  pp$2.parseBindingListItem = function(param) {
    return param
  }

  // Parses assignment pattern around given atom if possible.

  pp$2.parseMaybeDefault = function(startPos, startLoc, left) {
    left = left || this.parseBindingAtom()
    if (this.options.ecmaVersion < 6 || !this.eat(tt.eq)) return left
    var node = this.startNodeAt(startPos, startLoc)
    node.left = left
    node.right = this.parseMaybeAssign()
    return this.finishNode(node, "AssignmentPattern")
  }

  // Verify that a node is an lval — something that can be assigned
  // to.

  pp$2.checkLVal = function(expr, isBinding, checkClashes) {
    var this$1 = this;

    switch (expr.type) {
    case "Identifier":
      if (this.strict && this.reservedWordsStrictBind.test(expr.name))
        this.raiseRecoverable(expr.start, (isBinding ? "Binding " : "Assigning to ") + expr.name + " in strict mode")
      if (checkClashes) {
        if (has(checkClashes, expr.name))
          this.raiseRecoverable(expr.start, "Argument name clash")
        checkClashes[expr.name] = true
      }
      break

    case "MemberExpression":
      if (isBinding) this.raiseRecoverable(expr.start, (isBinding ? "Binding" : "Assigning to") + " member expression")
      break

    case "ObjectPattern":
      for (var i = 0; i < expr.properties.length; i++)
        this$1.checkLVal(expr.properties[i].value, isBinding, checkClashes)
      break

    case "ArrayPattern":
      for (var i$1 = 0; i$1 < expr.elements.length; i$1++) {
        var elem = expr.elements[i$1]
        if (elem) this$1.checkLVal(elem, isBinding, checkClashes)
      }
      break

    case "AssignmentPattern":
      this.checkLVal(expr.left, isBinding, checkClashes)
      break

    case "RestElement":
      this.checkLVal(expr.argument, isBinding, checkClashes)
      break

    case "ParenthesizedExpression":
      this.checkLVal(expr.expression, isBinding, checkClashes)
      break

    default:
      this.raise(expr.start, (isBinding ? "Binding" : "Assigning to") + " rvalue")
    }
  }

  var pp$3 = Parser.prototype

  // Check if property name clashes with already added.
  // Object/class getters and setters are not allowed to clash —
  // either with each other or with an init property — and in
  // strict mode, init properties are also not allowed to be repeated.

  pp$3.checkPropClash = function(prop, propHash) {
    if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand))
      return
    var key = prop.key;
    var name
    switch (key.type) {
    case "Identifier": name = key.name; break
    case "Literal": name = String(key.value); break
    default: return
    }
    var kind = prop.kind;
    if (this.options.ecmaVersion >= 6) {
      if (name === "__proto__" && kind === "init") {
        if (propHash.proto) this.raiseRecoverable(key.start, "Redefinition of __proto__ property")
        propHash.proto = true
      }
      return
    }
    name = "$" + name
    var other = propHash[name]
    if (other) {
      var isGetSet = kind !== "init"
      if ((this.strict || isGetSet) && other[kind] || !(isGetSet ^ other.init))
        this.raiseRecoverable(key.start, "Redefinition of property")
    } else {
      other = propHash[name] = {
        init: false,
        get: false,
        set: false
      }
    }
    other[kind] = true
  }

  // ### Expression parsing

  // These nest, from the most general expression type at the top to
  // 'atomic', nondivisible expression types at the bottom. Most of
  // the functions will simply let the function(s) below them parse,
  // and, *if* the syntactic construct they handle is present, wrap
  // the AST node that the inner parser gave them in another node.

  // Parse a full expression. The optional arguments are used to
  // forbid the `in` operator (in for loops initalization expressions)
  // and provide reference for storing '=' operator inside shorthand
  // property assignment in contexts where both object expression
  // and object pattern might appear (so it's possible to raise
  // delayed syntax error at correct position).

  pp$3.parseExpression = function(noIn, refDestructuringErrors) {
    var this$1 = this;

    var startPos = this.start, startLoc = this.startLoc
    var expr = this.parseMaybeAssign(noIn, refDestructuringErrors)
    if (this.type === tt.comma) {
      var node = this.startNodeAt(startPos, startLoc)
      node.expressions = [expr]
      while (this.eat(tt.comma)) node.expressions.push(this$1.parseMaybeAssign(noIn, refDestructuringErrors))
      return this.finishNode(node, "SequenceExpression")
    }
    return expr
  }

  // Parse an assignment expression. This includes applications of
  // operators like `+=`.

  pp$3.parseMaybeAssign = function(noIn, refDestructuringErrors, afterLeftParse) {
    if (this.inGenerator && this.isContextual("yield")) return this.parseYield()

    var ownDestructuringErrors = false
    if (!refDestructuringErrors) {
      refDestructuringErrors = new DestructuringErrors
      ownDestructuringErrors = true
    }
    var startPos = this.start, startLoc = this.startLoc
    if (this.type == tt.parenL || this.type == tt.name)
      this.potentialArrowAt = this.start
    var left = this.parseMaybeConditional(noIn, refDestructuringErrors)
    if (afterLeftParse) left = afterLeftParse.call(this, left, startPos, startLoc)
    if (this.type.isAssign) {
      this.checkPatternErrors(refDestructuringErrors, true)
      if (!ownDestructuringErrors) DestructuringErrors.call(refDestructuringErrors)
      var node = this.startNodeAt(startPos, startLoc)
      node.operator = this.value
      node.left = this.type === tt.eq ? this.toAssignable(left) : left
      refDestructuringErrors.shorthandAssign = 0 // reset because shorthand default was used correctly
      this.checkLVal(left)
      this.next()
      node.right = this.parseMaybeAssign(noIn)
      return this.finishNode(node, "AssignmentExpression")
    } else {
      if (ownDestructuringErrors) this.checkExpressionErrors(refDestructuringErrors, true)
    }
    return left
  }

  // Parse a ternary conditional (`?:`) operator.

  pp$3.parseMaybeConditional = function(noIn, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc
    var expr = this.parseExprOps(noIn, refDestructuringErrors)
    if (this.checkExpressionErrors(refDestructuringErrors)) return expr
    if (this.eat(tt.question)) {
      var node = this.startNodeAt(startPos, startLoc)
      node.test = expr
      node.consequent = this.parseMaybeAssign()
      this.expect(tt.colon)
      node.alternate = this.parseMaybeAssign(noIn)
      return this.finishNode(node, "ConditionalExpression")
    }
    return expr
  }

  // Start the precedence parser.

  pp$3.parseExprOps = function(noIn, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc
    var expr = this.parseMaybeUnary(refDestructuringErrors, false)
    if (this.checkExpressionErrors(refDestructuringErrors)) return expr
    return this.parseExprOp(expr, startPos, startLoc, -1, noIn)
  }

  // Parse binary operators with the operator precedence parsing
  // algorithm. `left` is the left-hand side of the operator.
  // `minPrec` provides context that allows the function to stop and
  // defer further parser to one of its callers when it encounters an
  // operator that has a lower precedence than the set it is parsing.

  pp$3.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, noIn) {
    var prec = this.type.binop
    if (prec != null && (!noIn || this.type !== tt._in)) {
      if (prec > minPrec) {
        var logical = this.type === tt.logicalOR || this.type === tt.logicalAND
        var op = this.value
        this.next()
        var startPos = this.start, startLoc = this.startLoc
        var right = this.parseExprOp(this.parseMaybeUnary(null, false), startPos, startLoc, prec, noIn)
        var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical)
        return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn)
      }
    }
    return left
  }

  pp$3.buildBinary = function(startPos, startLoc, left, right, op, logical) {
    var node = this.startNodeAt(startPos, startLoc)
    node.left = left
    node.operator = op
    node.right = right
    return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression")
  }

  // Parse unary operators, both prefix and postfix.

  pp$3.parseMaybeUnary = function(refDestructuringErrors, sawUnary) {
    var this$1 = this;

    var startPos = this.start, startLoc = this.startLoc, expr
    if (this.type.prefix) {
      var node = this.startNode(), update = this.type === tt.incDec
      node.operator = this.value
      node.prefix = true
      this.next()
      node.argument = this.parseMaybeUnary(null, true)
      this.checkExpressionErrors(refDestructuringErrors, true)
      if (update) this.checkLVal(node.argument)
      else if (this.strict && node.operator === "delete" &&
               node.argument.type === "Identifier")
        this.raiseRecoverable(node.start, "Deleting local variable in strict mode")
      else sawUnary = true
      expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression")
    } else {
      expr = this.parseExprSubscripts(refDestructuringErrors)
      if (this.checkExpressionErrors(refDestructuringErrors)) return expr
      while (this.type.postfix && !this.canInsertSemicolon()) {
        var node$1 = this$1.startNodeAt(startPos, startLoc)
        node$1.operator = this$1.value
        node$1.prefix = false
        node$1.argument = expr
        this$1.checkLVal(expr)
        this$1.next()
        expr = this$1.finishNode(node$1, "UpdateExpression")
      }
    }

    if (!sawUnary && this.eat(tt.starstar))
      return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false), "**", false)
    else
      return expr
  }

  // Parse call, dot, and `[]`-subscript expressions.

  pp$3.parseExprSubscripts = function(refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc
    var expr = this.parseExprAtom(refDestructuringErrors)
    var skipArrowSubscripts = expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")"
    if (this.checkExpressionErrors(refDestructuringErrors) || skipArrowSubscripts) return expr
    return this.parseSubscripts(expr, startPos, startLoc)
  }

  pp$3.parseSubscripts = function(base, startPos, startLoc, noCalls) {
    var this$1 = this;

    for (;;) {
      if (this$1.eat(tt.dot)) {
        var node = this$1.startNodeAt(startPos, startLoc)
        node.object = base
        node.property = this$1.parseIdent(true)
        node.computed = false
        base = this$1.finishNode(node, "MemberExpression")
      } else if (this$1.eat(tt.bracketL)) {
        var node$1 = this$1.startNodeAt(startPos, startLoc)
        node$1.object = base
        node$1.property = this$1.parseExpression()
        node$1.computed = true
        this$1.expect(tt.bracketR)
        base = this$1.finishNode(node$1, "MemberExpression")
      } else if (!noCalls && this$1.eat(tt.parenL)) {
        var node$2 = this$1.startNodeAt(startPos, startLoc)
        node$2.callee = base
        node$2.arguments = this$1.parseExprList(tt.parenR, false)
        base = this$1.finishNode(node$2, "CallExpression")
      } else if (this$1.type === tt.backQuote) {
        var node$3 = this$1.startNodeAt(startPos, startLoc)
        node$3.tag = base
        node$3.quasi = this$1.parseTemplate()
        base = this$1.finishNode(node$3, "TaggedTemplateExpression")
      } else {
        return base
      }
    }
  }

  // Parse an atomic expression — either a single token that is an
  // expression, an expression started by a keyword like `function` or
  // `new`, or an expression wrapped in punctuation like `()`, `[]`,
  // or `{}`.

  pp$3.parseExprAtom = function(refDestructuringErrors) {
    var node, canBeArrow = this.potentialArrowAt == this.start
    switch (this.type) {
    case tt._super:
      if (!this.inFunction)
        this.raise(this.start, "'super' outside of function or class")

    case tt._this:
      var type = this.type === tt._this ? "ThisExpression" : "Super"
      node = this.startNode()
      this.next()
      return this.finishNode(node, type)

    case tt.name:
      var startPos = this.start, startLoc = this.startLoc
      var id = this.parseIdent(this.type !== tt.name)
      if (canBeArrow && !this.canInsertSemicolon() && this.eat(tt.arrow))
        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id])
      return id

    case tt.regexp:
      var value = this.value
      node = this.parseLiteral(value.value)
      node.regex = {pattern: value.pattern, flags: value.flags}
      return node

    case tt.num: case tt.string:
      return this.parseLiteral(this.value)

    case tt._null: case tt._true: case tt._false:
      node = this.startNode()
      node.value = this.type === tt._null ? null : this.type === tt._true
      node.raw = this.type.keyword
      this.next()
      return this.finishNode(node, "Literal")

    case tt.parenL:
      return this.parseParenAndDistinguishExpression(canBeArrow)

    case tt.bracketL:
      node = this.startNode()
      this.next()
      node.elements = this.parseExprList(tt.bracketR, true, true, refDestructuringErrors)
      return this.finishNode(node, "ArrayExpression")

    case tt.braceL:
      return this.parseObj(false, refDestructuringErrors)

    case tt._function:
      node = this.startNode()
      this.next()
      return this.parseFunction(node, false)

    case tt._class:
      return this.parseClass(this.startNode(), false)

    case tt._new:
      return this.parseNew()

    case tt.backQuote:
      return this.parseTemplate()

    default:
      this.unexpected()
    }
  }

  pp$3.parseLiteral = function(value) {
    var node = this.startNode()
    node.value = value
    node.raw = this.input.slice(this.start, this.end)
    this.next()
    return this.finishNode(node, "Literal")
  }

  pp$3.parseParenExpression = function() {
    this.expect(tt.parenL)
    var val = this.parseExpression()
    this.expect(tt.parenR)
    return val
  }

  pp$3.parseParenAndDistinguishExpression = function(canBeArrow) {
    var this$1 = this;

    var startPos = this.start, startLoc = this.startLoc, val
    if (this.options.ecmaVersion >= 6) {
      this.next()

      var innerStartPos = this.start, innerStartLoc = this.startLoc
      var exprList = [], first = true
      var refDestructuringErrors = new DestructuringErrors, spreadStart, innerParenStart
      while (this.type !== tt.parenR) {
        first ? first = false : this$1.expect(tt.comma)
        if (this$1.type === tt.ellipsis) {
          spreadStart = this$1.start
          exprList.push(this$1.parseParenItem(this$1.parseRest()))
          break
        } else {
          if (this$1.type === tt.parenL && !innerParenStart) {
            innerParenStart = this$1.start
          }
          exprList.push(this$1.parseMaybeAssign(false, refDestructuringErrors, this$1.parseParenItem))
        }
      }
      var innerEndPos = this.start, innerEndLoc = this.startLoc
      this.expect(tt.parenR)

      if (canBeArrow && !this.canInsertSemicolon() && this.eat(tt.arrow)) {
        this.checkPatternErrors(refDestructuringErrors, true)
        if (innerParenStart) this.unexpected(innerParenStart)
        return this.parseParenArrowList(startPos, startLoc, exprList)
      }

      if (!exprList.length) this.unexpected(this.lastTokStart)
      if (spreadStart) this.unexpected(spreadStart)
      this.checkExpressionErrors(refDestructuringErrors, true)

      if (exprList.length > 1) {
        val = this.startNodeAt(innerStartPos, innerStartLoc)
        val.expressions = exprList
        this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc)
      } else {
        val = exprList[0]
      }
    } else {
      val = this.parseParenExpression()
    }

    if (this.options.preserveParens) {
      var par = this.startNodeAt(startPos, startLoc)
      par.expression = val
      return this.finishNode(par, "ParenthesizedExpression")
    } else {
      return val
    }
  }

  pp$3.parseParenItem = function(item) {
    return item
  }

  pp$3.parseParenArrowList = function(startPos, startLoc, exprList) {
    return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList)
  }

  // New's precedence is slightly tricky. It must allow its argument to
  // be a `[]` or dot subscript expression, but not a call — at least,
  // not without wrapping it in parentheses. Thus, it uses the noCalls
  // argument to parseSubscripts to prevent it from consuming the
  // argument list.

  var empty$1 = []

  pp$3.parseNew = function() {
    var node = this.startNode()
    var meta = this.parseIdent(true)
    if (this.options.ecmaVersion >= 6 && this.eat(tt.dot)) {
      node.meta = meta
      node.property = this.parseIdent(true)
      if (node.property.name !== "target")
        this.raiseRecoverable(node.property.start, "The only valid meta property for new is new.target")
      if (!this.inFunction)
        this.raiseRecoverable(node.start, "new.target can only be used in functions")
      return this.finishNode(node, "MetaProperty")
    }
    var startPos = this.start, startLoc = this.startLoc
    node.callee = this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true)
    if (this.eat(tt.parenL)) node.arguments = this.parseExprList(tt.parenR, false)
    else node.arguments = empty$1
    return this.finishNode(node, "NewExpression")
  }

  // Parse template expression.

  pp$3.parseTemplateElement = function() {
    var elem = this.startNode()
    elem.value = {
      raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, '\n'),
      cooked: this.value
    }
    this.next()
    elem.tail = this.type === tt.backQuote
    return this.finishNode(elem, "TemplateElement")
  }

  pp$3.parseTemplate = function() {
    var this$1 = this;

    var node = this.startNode()
    this.next()
    node.expressions = []
    var curElt = this.parseTemplateElement()
    node.quasis = [curElt]
    while (!curElt.tail) {
      this$1.expect(tt.dollarBraceL)
      node.expressions.push(this$1.parseExpression())
      this$1.expect(tt.braceR)
      node.quasis.push(curElt = this$1.parseTemplateElement())
    }
    this.next()
    return this.finishNode(node, "TemplateLiteral")
  }

  // Parse an object literal or binding pattern.

  pp$3.parseObj = function(isPattern, refDestructuringErrors) {
    var this$1 = this;

    var node = this.startNode(), first = true, propHash = {}
    node.properties = []
    this.next()
    while (!this.eat(tt.braceR)) {
      if (!first) {
        this$1.expect(tt.comma)
        if (this$1.afterTrailingComma(tt.braceR)) break
      } else first = false

      var prop = this$1.startNode(), isGenerator, startPos, startLoc
      if (this$1.options.ecmaVersion >= 6) {
        prop.method = false
        prop.shorthand = false
        if (isPattern || refDestructuringErrors) {
          startPos = this$1.start
          startLoc = this$1.startLoc
        }
        if (!isPattern)
          isGenerator = this$1.eat(tt.star)
      }
      this$1.parsePropertyName(prop)
      this$1.parsePropertyValue(prop, isPattern, isGenerator, startPos, startLoc, refDestructuringErrors)
      this$1.checkPropClash(prop, propHash)
      node.properties.push(this$1.finishNode(prop, "Property"))
    }
    return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
  }

  pp$3.parsePropertyValue = function(prop, isPattern, isGenerator, startPos, startLoc, refDestructuringErrors) {
    if (this.eat(tt.colon)) {
      prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors)
      prop.kind = "init"
    } else if (this.options.ecmaVersion >= 6 && this.type === tt.parenL) {
      if (isPattern) this.unexpected()
      prop.kind = "init"
      prop.method = true
      prop.value = this.parseMethod(isGenerator)
    } else if (this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
               (prop.key.name === "get" || prop.key.name === "set") &&
               (this.type != tt.comma && this.type != tt.braceR)) {
      if (isGenerator || isPattern) this.unexpected()
      prop.kind = prop.key.name
      this.parsePropertyName(prop)
      prop.value = this.parseMethod(false)
      var paramCount = prop.kind === "get" ? 0 : 1
      if (prop.value.params.length !== paramCount) {
        var start = prop.value.start
        if (prop.kind === "get")
          this.raiseRecoverable(start, "getter should have no params")
        else
          this.raiseRecoverable(start, "setter should have exactly one param")
      }
      if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
        this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params")
    } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
      if (this.keywords.test(prop.key.name) ||
          (this.strict ? this.reservedWordsStrictBind : this.reservedWords).test(prop.key.name) ||
          (this.inGenerator && prop.key.name == "yield"))
        this.raiseRecoverable(prop.key.start, "'" + prop.key.name + "' can not be used as shorthand property")
      prop.kind = "init"
      if (isPattern) {
        prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key)
      } else if (this.type === tt.eq && refDestructuringErrors) {
        if (!refDestructuringErrors.shorthandAssign)
          refDestructuringErrors.shorthandAssign = this.start
        prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key)
      } else {
        prop.value = prop.key
      }
      prop.shorthand = true
    } else this.unexpected()
  }

  pp$3.parsePropertyName = function(prop) {
    if (this.options.ecmaVersion >= 6) {
      if (this.eat(tt.bracketL)) {
        prop.computed = true
        prop.key = this.parseMaybeAssign()
        this.expect(tt.bracketR)
        return prop.key
      } else {
        prop.computed = false
      }
    }
    return prop.key = this.type === tt.num || this.type === tt.string ? this.parseExprAtom() : this.parseIdent(true)
  }

  // Initialize empty function node.

  pp$3.initFunction = function(node) {
    node.id = null
    if (this.options.ecmaVersion >= 6) {
      node.generator = false
      node.expression = false
    }
  }

  // Parse object or class method.

  pp$3.parseMethod = function(isGenerator) {
    var node = this.startNode(), oldInGen = this.inGenerator
    this.inGenerator = isGenerator
    this.initFunction(node)
    this.expect(tt.parenL)
    node.params = this.parseBindingList(tt.parenR, false, false)
    if (this.options.ecmaVersion >= 6)
      node.generator = isGenerator
    this.parseFunctionBody(node, false)
    this.inGenerator = oldInGen
    return this.finishNode(node, "FunctionExpression")
  }

  // Parse arrow function expression with given parameters.

  pp$3.parseArrowExpression = function(node, params) {
    var oldInGen = this.inGenerator
    this.inGenerator = false
    this.initFunction(node)
    node.params = this.toAssignableList(params, true)
    this.parseFunctionBody(node, true)
    this.inGenerator = oldInGen
    return this.finishNode(node, "ArrowFunctionExpression")
  }

  // Parse function body and check parameters.

  pp$3.parseFunctionBody = function(node, isArrowFunction) {
    var isExpression = isArrowFunction && this.type !== tt.braceL

    if (isExpression) {
      node.body = this.parseMaybeAssign()
      node.expression = true
    } else {
      // Start a new scope with regard to labels and the `inFunction`
      // flag (restore them to their old value afterwards).
      var oldInFunc = this.inFunction, oldLabels = this.labels
      this.inFunction = true; this.labels = []
      node.body = this.parseBlock(true)
      node.expression = false
      this.inFunction = oldInFunc; this.labels = oldLabels
    }

    // If this is a strict mode function, verify that argument names
    // are not repeated, and it does not try to bind the words `eval`
    // or `arguments`.
    var useStrict = (!isExpression && node.body.body.length && this.isUseStrict(node.body.body[0])) ? node.body.body[0] : null;
    if (this.strict || useStrict) {
      var oldStrict = this.strict
      this.strict = true
      if (node.id)
        this.checkLVal(node.id, true)
      this.checkParams(node, useStrict)
      this.strict = oldStrict
    } else if (isArrowFunction) {
      this.checkParams(node, useStrict)
    }
  }

  // Checks function params for various disallowed patterns such as using "eval"
  // or "arguments" and duplicate parameters.

  pp$3.checkParams = function(node, useStrict) {
      var this$1 = this;

      var nameHash = {}
      for (var i = 0; i < node.params.length; i++) {
        if (useStrict && this$1.options.ecmaVersion >= 7 && node.params[i].type !== "Identifier")
          this$1.raiseRecoverable(useStrict.start, "Illegal 'use strict' directive in function with non-simple parameter list");
        this$1.checkLVal(node.params[i], true, nameHash)
      }
  }

  // Parses a comma-separated list of expressions, and returns them as
  // an array. `close` is the token type that ends the list, and
  // `allowEmpty` can be turned on to allow subsequent commas with
  // nothing in between them to be parsed as `null` (which is needed
  // for array literals).

  pp$3.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
    var this$1 = this;

    var elts = [], first = true
    while (!this.eat(close)) {
      if (!first) {
        this$1.expect(tt.comma)
        if (allowTrailingComma && this$1.afterTrailingComma(close)) break
      } else first = false

      var elt
      if (allowEmpty && this$1.type === tt.comma)
        elt = null
      else if (this$1.type === tt.ellipsis) {
        elt = this$1.parseSpread(refDestructuringErrors)
        if (this$1.type === tt.comma && refDestructuringErrors && !refDestructuringErrors.trailingComma) {
          refDestructuringErrors.trailingComma = this$1.lastTokStart
        }
      } else
        elt = this$1.parseMaybeAssign(false, refDestructuringErrors)
      elts.push(elt)
    }
    return elts
  }

  // Parse the next token as an identifier. If `liberal` is true (used
  // when parsing properties), it will also convert keywords into
  // identifiers.

  pp$3.parseIdent = function(liberal) {
    var node = this.startNode()
    if (liberal && this.options.allowReserved == "never") liberal = false
    if (this.type === tt.name) {
      if (!liberal && (this.strict ? this.reservedWordsStrict : this.reservedWords).test(this.value) &&
          (this.options.ecmaVersion >= 6 ||
           this.input.slice(this.start, this.end).indexOf("\\") == -1))
        this.raiseRecoverable(this.start, "The keyword '" + this.value + "' is reserved")
      if (!liberal && this.inGenerator && this.value === "yield")
        this.raiseRecoverable(this.start, "Can not use 'yield' as identifier inside a generator")
      node.name = this.value
    } else if (liberal && this.type.keyword) {
      node.name = this.type.keyword
    } else {
      this.unexpected()
    }
    this.next()
    return this.finishNode(node, "Identifier")
  }

  // Parses yield expression inside generator.

  pp$3.parseYield = function() {
    var node = this.startNode()
    this.next()
    if (this.type == tt.semi || this.canInsertSemicolon() || (this.type != tt.star && !this.type.startsExpr)) {
      node.delegate = false
      node.argument = null
    } else {
      node.delegate = this.eat(tt.star)
      node.argument = this.parseMaybeAssign()
    }
    return this.finishNode(node, "YieldExpression")
  }

  var pp$4 = Parser.prototype

  // This function is used to raise exceptions on parse errors. It
  // takes an offset integer (into the current `input`) to indicate
  // the location of the error, attaches the position to the end
  // of the error message, and then raises a `SyntaxError` with that
  // message.

  pp$4.raise = function(pos, message) {
    var loc = getLineInfo(this.input, pos)
    message += " (" + loc.line + ":" + loc.column + ")"
    var err = new SyntaxError(message)
    err.pos = pos; err.loc = loc; err.raisedAt = this.pos
    throw err
  }

  pp$4.raiseRecoverable = pp$4.raise

  pp$4.curPosition = function() {
    if (this.options.locations) {
      return new Position(this.curLine, this.pos - this.lineStart)
    }
  }

  var Node = function Node(parser, pos, loc) {
    this.type = ""
    this.start = pos
    this.end = 0
    if (parser.options.locations)
      this.loc = new SourceLocation(parser, loc)
    if (parser.options.directSourceFile)
      this.sourceFile = parser.options.directSourceFile
    if (parser.options.ranges)
      this.range = [pos, 0]
  };

  // Start an AST node, attaching a start offset.

  var pp$5 = Parser.prototype

  pp$5.startNode = function() {
    return new Node(this, this.start, this.startLoc)
  }

  pp$5.startNodeAt = function(pos, loc) {
    return new Node(this, pos, loc)
  }

  // Finish an AST node, adding `type` and `end` properties.

  function finishNodeAt(node, type, pos, loc) {
    node.type = type
    node.end = pos
    if (this.options.locations)
      node.loc.end = loc
    if (this.options.ranges)
      node.range[1] = pos
    return node
  }

  pp$5.finishNode = function(node, type) {
    return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc)
  }

  // Finish node at given position

  pp$5.finishNodeAt = function(node, type, pos, loc) {
    return finishNodeAt.call(this, node, type, pos, loc)
  }

  var TokContext = function TokContext(token, isExpr, preserveSpace, override) {
    this.token = token
    this.isExpr = !!isExpr
    this.preserveSpace = !!preserveSpace
    this.override = override
  };

  var types = {
    b_stat: new TokContext("{", false),
    b_expr: new TokContext("{", true),
    b_tmpl: new TokContext("${", true),
    p_stat: new TokContext("(", false),
    p_expr: new TokContext("(", true),
    q_tmpl: new TokContext("`", true, true, function (p) { return p.readTmplToken(); }),
    f_expr: new TokContext("function", true)
  }

  var pp$6 = Parser.prototype

  pp$6.initialContext = function() {
    return [types.b_stat]
  }

  pp$6.braceIsBlock = function(prevType) {
    if (prevType === tt.colon) {
      var parent = this.curContext()
      if (parent === types.b_stat || parent === types.b_expr)
        return !parent.isExpr
    }
    if (prevType === tt._return)
      return lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
    if (prevType === tt._else || prevType === tt.semi || prevType === tt.eof || prevType === tt.parenR)
      return true
    if (prevType == tt.braceL)
      return this.curContext() === types.b_stat
    return !this.exprAllowed
  }

  pp$6.updateContext = function(prevType) {
    var update, type = this.type
    if (type.keyword && prevType == tt.dot)
      this.exprAllowed = false
    else if (update = type.updateContext)
      update.call(this, prevType)
    else
      this.exprAllowed = type.beforeExpr
  }

  // Token-specific context update code

  tt.parenR.updateContext = tt.braceR.updateContext = function() {
    if (this.context.length == 1) {
      this.exprAllowed = true
      return
    }
    var out = this.context.pop()
    if (out === types.b_stat && this.curContext() === types.f_expr) {
      this.context.pop()
      this.exprAllowed = false
    } else if (out === types.b_tmpl) {
      this.exprAllowed = true
    } else {
      this.exprAllowed = !out.isExpr
    }
  }

  tt.braceL.updateContext = function(prevType) {
    this.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr)
    this.exprAllowed = true
  }

  tt.dollarBraceL.updateContext = function() {
    this.context.push(types.b_tmpl)
    this.exprAllowed = true
  }

  tt.parenL.updateContext = function(prevType) {
    var statementParens = prevType === tt._if || prevType === tt._for || prevType === tt._with || prevType === tt._while
    this.context.push(statementParens ? types.p_stat : types.p_expr)
    this.exprAllowed = true
  }

  tt.incDec.updateContext = function() {
    // tokExprAllowed stays unchanged
  }

  tt._function.updateContext = function(prevType) {
    if (prevType.beforeExpr && prevType !== tt.semi && prevType !== tt._else &&
        !((prevType === tt.colon || prevType === tt.braceL) && this.curContext() === types.b_stat))
      this.context.push(types.f_expr)
    this.exprAllowed = false
  }

  tt.backQuote.updateContext = function() {
    if (this.curContext() === types.q_tmpl)
      this.context.pop()
    else
      this.context.push(types.q_tmpl)
    this.exprAllowed = false
  }

  // Object type used to represent tokens. Note that normally, tokens
  // simply exist as properties on the parser object. This is only
  // used for the onToken callback and the external tokenizer.

  var Token = function Token(p) {
    this.type = p.type
    this.value = p.value
    this.start = p.start
    this.end = p.end
    if (p.options.locations)
      this.loc = new SourceLocation(p, p.startLoc, p.endLoc)
    if (p.options.ranges)
      this.range = [p.start, p.end]
  };

  // ## Tokenizer

  var pp$7 = Parser.prototype

  // Are we running under Rhino?
  var isRhino = typeof Packages == "object" && Object.prototype.toString.call(Packages) == "[object JavaPackage]"

  // Move to the next token

  pp$7.next = function() {
    if (this.options.onToken)
      this.options.onToken(new Token(this))

    this.lastTokEnd = this.end
    this.lastTokStart = this.start
    this.lastTokEndLoc = this.endLoc
    this.lastTokStartLoc = this.startLoc
    this.nextToken()
  }

  pp$7.getToken = function() {
    this.next()
    return new Token(this)
  }

  // If we're in an ES6 environment, make parsers iterable
  if (typeof Symbol !== "undefined")
    pp$7[Symbol.iterator] = function () {
      var self = this
      return {next: function () {
        var token = self.getToken()
        return {
          done: token.type === tt.eof,
          value: token
        }
      }}
    }

  // Toggle strict mode. Re-reads the next number or string to please
  // pedantic tests (`"use strict"; 010;` should fail).

  pp$7.setStrict = function(strict) {
    var this$1 = this;

    this.strict = strict
    if (this.type !== tt.num && this.type !== tt.string) return
    this.pos = this.start
    if (this.options.locations) {
      while (this.pos < this.lineStart) {
        this$1.lineStart = this$1.input.lastIndexOf("\n", this$1.lineStart - 2) + 1
        --this$1.curLine
      }
    }
    this.nextToken()
  }

  pp$7.curContext = function() {
    return this.context[this.context.length - 1]
  }

  // Read a single token, updating the parser object's token-related
  // properties.

  pp$7.nextToken = function() {
    var curContext = this.curContext()
    if (!curContext || !curContext.preserveSpace) this.skipSpace()

    this.start = this.pos
    if (this.options.locations) this.startLoc = this.curPosition()
    if (this.pos >= this.input.length) return this.finishToken(tt.eof)

    if (curContext.override) return curContext.override(this)
    else this.readToken(this.fullCharCodeAtPos())
  }

  pp$7.readToken = function(code) {
    // Identifier or keyword. '\uXXXX' sequences are allowed in
    // identifiers, so '\' also dispatches to that.
    if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */)
      return this.readWord()

    return this.getTokenFromCode(code)
  }

  pp$7.fullCharCodeAtPos = function() {
    var code = this.input.charCodeAt(this.pos)
    if (code <= 0xd7ff || code >= 0xe000) return code
    var next = this.input.charCodeAt(this.pos + 1)
    return (code << 10) + next - 0x35fdc00
  }

  pp$7.skipBlockComment = function() {
    var this$1 = this;

    var startLoc = this.options.onComment && this.curPosition()
    var start = this.pos, end = this.input.indexOf("*/", this.pos += 2)
    if (end === -1) this.raise(this.pos - 2, "Unterminated comment")
    this.pos = end + 2
    if (this.options.locations) {
      lineBreakG.lastIndex = start
      var match
      while ((match = lineBreakG.exec(this.input)) && match.index < this.pos) {
        ++this$1.curLine
        this$1.lineStart = match.index + match[0].length
      }
    }
    if (this.options.onComment)
      this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos,
                             startLoc, this.curPosition())
  }

  pp$7.skipLineComment = function(startSkip) {
    var this$1 = this;

    var start = this.pos
    var startLoc = this.options.onComment && this.curPosition()
    var ch = this.input.charCodeAt(this.pos+=startSkip)
    while (this.pos < this.input.length && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
      ++this$1.pos
      ch = this$1.input.charCodeAt(this$1.pos)
    }
    if (this.options.onComment)
      this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos,
                             startLoc, this.curPosition())
  }

  // Called at the start of the parse and after every token. Skips
  // whitespace and comments, and.

  pp$7.skipSpace = function() {
    var this$1 = this;

    loop: while (this.pos < this.input.length) {
      var ch = this$1.input.charCodeAt(this$1.pos)
      switch (ch) {
        case 32: case 160: // ' '
          ++this$1.pos
          break
        case 13:
          if (this$1.input.charCodeAt(this$1.pos + 1) === 10) {
            ++this$1.pos
          }
        case 10: case 8232: case 8233:
          ++this$1.pos
          if (this$1.options.locations) {
            ++this$1.curLine
            this$1.lineStart = this$1.pos
          }
          break
        case 47: // '/'
          switch (this$1.input.charCodeAt(this$1.pos + 1)) {
            case 42: // '*'
              this$1.skipBlockComment()
              break
            case 47:
              this$1.skipLineComment(2)
              break
            default:
              break loop
          }
          break
        default:
          if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
            ++this$1.pos
          } else {
            break loop
          }
      }
    }
  }

  // Called at the end of every token. Sets `end`, `val`, and
  // maintains `context` and `exprAllowed`, and skips the space after
  // the token, so that the next one's `start` will point at the
  // right position.

  pp$7.finishToken = function(type, val) {
    this.end = this.pos
    if (this.options.locations) this.endLoc = this.curPosition()
    var prevType = this.type
    this.type = type
    this.value = val

    this.updateContext(prevType)
  }

  // ### Token reading

  // This is the function that is called to fetch the next token. It
  // is somewhat obscure, because it works in character codes rather
  // than characters, and because operator parsing has been inlined
  // into it.
  //
  // All in the name of speed.
  //
  pp$7.readToken_dot = function() {
    var next = this.input.charCodeAt(this.pos + 1)
    if (next >= 48 && next <= 57) return this.readNumber(true)
    var next2 = this.input.charCodeAt(this.pos + 2)
    if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
      this.pos += 3
      return this.finishToken(tt.ellipsis)
    } else {
      ++this.pos
      return this.finishToken(tt.dot)
    }
  }

  pp$7.readToken_slash = function() { // '/'
    var next = this.input.charCodeAt(this.pos + 1)
    if (this.exprAllowed) {++this.pos; return this.readRegexp()}
    if (next === 61) return this.finishOp(tt.assign, 2)
    return this.finishOp(tt.slash, 1)
  }

  pp$7.readToken_mult_modulo_exp = function(code) { // '%*'
    var next = this.input.charCodeAt(this.pos + 1)
    var size = 1
    var tokentype = code === 42 ? tt.star : tt.modulo

    // exponentiation operator ** and **=
    if (this.options.ecmaVersion >= 7 && next === 42) {
      ++size
      tokentype = tt.starstar
      next = this.input.charCodeAt(this.pos + 2)
    }

    if (next === 61) return this.finishOp(tt.assign, size + 1)
    return this.finishOp(tokentype, size)
  }

  pp$7.readToken_pipe_amp = function(code) { // '|&'
    var next = this.input.charCodeAt(this.pos + 1)
    if (next === code) return this.finishOp(code === 124 ? tt.logicalOR : tt.logicalAND, 2)
    if (next === 61) return this.finishOp(tt.assign, 2)
    return this.finishOp(code === 124 ? tt.bitwiseOR : tt.bitwiseAND, 1)
  }

  pp$7.readToken_caret = function() { // '^'
    var next = this.input.charCodeAt(this.pos + 1)
    if (next === 61) return this.finishOp(tt.assign, 2)
    return this.finishOp(tt.bitwiseXOR, 1)
  }

  pp$7.readToken_plus_min = function(code) { // '+-'
    var next = this.input.charCodeAt(this.pos + 1)
    if (next === code) {
      if (next == 45 && this.input.charCodeAt(this.pos + 2) == 62 &&
          lineBreak.test(this.input.slice(this.lastTokEnd, this.pos))) {
        // A `-->` line comment
        this.skipLineComment(3)
        this.skipSpace()
        return this.nextToken()
      }
      return this.finishOp(tt.incDec, 2)
    }
    if (next === 61) return this.finishOp(tt.assign, 2)
    return this.finishOp(tt.plusMin, 1)
  }

  pp$7.readToken_lt_gt = function(code) { // '<>'
    var next = this.input.charCodeAt(this.pos + 1)
    var size = 1
    if (next === code) {
      size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2
      if (this.input.charCodeAt(this.pos + size) === 61) return this.finishOp(tt.assign, size + 1)
      return this.finishOp(tt.bitShift, size)
    }
    if (next == 33 && code == 60 && this.input.charCodeAt(this.pos + 2) == 45 &&
        this.input.charCodeAt(this.pos + 3) == 45) {
      if (this.inModule) this.unexpected()
      // `<!--`, an XML-style comment that should be interpreted as a line comment
      this.skipLineComment(4)
      this.skipSpace()
      return this.nextToken()
    }
    if (next === 61) size = 2
    return this.finishOp(tt.relational, size)
  }

  pp$7.readToken_eq_excl = function(code) { // '=!'
    var next = this.input.charCodeAt(this.pos + 1)
    if (next === 61) return this.finishOp(tt.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2)
    if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) { // '=>'
      this.pos += 2
      return this.finishToken(tt.arrow)
    }
    return this.finishOp(code === 61 ? tt.eq : tt.prefix, 1)
  }

  pp$7.getTokenFromCode = function(code) {
    switch (code) {
      // The interpretation of a dot depends on whether it is followed
      // by a digit or another two dots.
    case 46: // '.'
      return this.readToken_dot()

      // Punctuation tokens.
    case 40: ++this.pos; return this.finishToken(tt.parenL)
    case 41: ++this.pos; return this.finishToken(tt.parenR)
    case 59: ++this.pos; return this.finishToken(tt.semi)
    case 44: ++this.pos; return this.finishToken(tt.comma)
    case 91: ++this.pos; return this.finishToken(tt.bracketL)
    case 93: ++this.pos; return this.finishToken(tt.bracketR)
    case 123: ++this.pos; return this.finishToken(tt.braceL)
    case 125: ++this.pos; return this.finishToken(tt.braceR)
    case 58: ++this.pos; return this.finishToken(tt.colon)
    case 63: ++this.pos; return this.finishToken(tt.question)

    case 96: // '`'
      if (this.options.ecmaVersion < 6) break
      ++this.pos
      return this.finishToken(tt.backQuote)

    case 48: // '0'
      var next = this.input.charCodeAt(this.pos + 1)
      if (next === 120 || next === 88) return this.readRadixNumber(16) // '0x', '0X' - hex number
      if (this.options.ecmaVersion >= 6) {
        if (next === 111 || next === 79) return this.readRadixNumber(8) // '0o', '0O' - octal number
        if (next === 98 || next === 66) return this.readRadixNumber(2) // '0b', '0B' - binary number
      }
      // Anything else beginning with a digit is an integer, octal
      // number, or float.
    case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
      return this.readNumber(false)

      // Quotes produce strings.
    case 34: case 39: // '"', "'"
      return this.readString(code)

      // Operators are parsed inline in tiny state machines. '=' (61) is
      // often referred to. `finishOp` simply skips the amount of
      // characters it is given as second argument, and returns a token
      // of the type given by its first argument.

    case 47: // '/'
      return this.readToken_slash()

    case 37: case 42: // '%*'
      return this.readToken_mult_modulo_exp(code)

    case 124: case 38: // '|&'
      return this.readToken_pipe_amp(code)

    case 94: // '^'
      return this.readToken_caret()

    case 43: case 45: // '+-'
      return this.readToken_plus_min(code)

    case 60: case 62: // '<>'
      return this.readToken_lt_gt(code)

    case 61: case 33: // '=!'
      return this.readToken_eq_excl(code)

    case 126: // '~'
      return this.finishOp(tt.prefix, 1)
    }

    this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'")
  }

  pp$7.finishOp = function(type, size) {
    var str = this.input.slice(this.pos, this.pos + size)
    this.pos += size
    return this.finishToken(type, str)
  }

  // Parse a regular expression. Some context-awareness is necessary,
  // since a '/' inside a '[]' set does not end the expression.

  function tryCreateRegexp(src, flags, throwErrorAt, parser) {
    try {
      return new RegExp(src, flags)
    } catch (e) {
      if (throwErrorAt !== undefined) {
        if (e instanceof SyntaxError) parser.raise(throwErrorAt, "Error parsing regular expression: " + e.message)
        throw e
      }
    }
  }

  var regexpUnicodeSupport = !!tryCreateRegexp("\uffff", "u")

  pp$7.readRegexp = function() {
    var this$1 = this;

    var escaped, inClass, start = this.pos
    for (;;) {
      if (this$1.pos >= this$1.input.length) this$1.raise(start, "Unterminated regular expression")
      var ch = this$1.input.charAt(this$1.pos)
      if (lineBreak.test(ch)) this$1.raise(start, "Unterminated regular expression")
      if (!escaped) {
        if (ch === "[") inClass = true
        else if (ch === "]" && inClass) inClass = false
        else if (ch === "/" && !inClass) break
        escaped = ch === "\\"
      } else escaped = false
      ++this$1.pos
    }
    var content = this.input.slice(start, this.pos)
    ++this.pos
    // Need to use `readWord1` because '\uXXXX' sequences are allowed
    // here (don't ask).
    var mods = this.readWord1()
    var tmp = content, tmpFlags = ""
    if (mods) {
      var validFlags = /^[gim]*$/
      if (this.options.ecmaVersion >= 6) validFlags = /^[gimuy]*$/
      if (!validFlags.test(mods)) this.raise(start, "Invalid regular expression flag")
      if (mods.indexOf("u") >= 0) {
        if (regexpUnicodeSupport) {
          tmpFlags = "u"
        } else {
          // Replace each astral symbol and every Unicode escape sequence that
          // possibly represents an astral symbol or a paired surrogate with a
          // single ASCII symbol to avoid throwing on regular expressions that
          // are only valid in combination with the `/u` flag.
          // Note: replacing with the ASCII symbol `x` might cause false
          // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
          // perfectly valid pattern that is equivalent to `[a-b]`, but it would
          // be replaced by `[x-b]` which throws an error.
          tmp = tmp.replace(/\\u\{([0-9a-fA-F]+)\}/g, function (_match, code, offset) {
            code = Number("0x" + code)
            if (code > 0x10FFFF) this$1.raise(start + offset + 3, "Code point out of bounds")
            return "x"
          })
          tmp = tmp.replace(/\\u([a-fA-F0-9]{4})|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "x")
          tmpFlags = tmpFlags.replace("u", "")
        }
      }
    }
    // Detect invalid regular expressions.
    var value = null
    // Rhino's regular expression parser is flaky and throws uncatchable exceptions,
    // so don't do detection if we are running under Rhino
    if (!isRhino) {
      tryCreateRegexp(tmp, tmpFlags, start, this)
      // Get a regular expression object for this pattern-flag pair, or `null` in
      // case the current environment doesn't support the flags it uses.
      value = tryCreateRegexp(content, mods)
    }
    return this.finishToken(tt.regexp, {pattern: content, flags: mods, value: value})
  }

  // Read an integer in the given radix. Return null if zero digits
  // were read, the integer value otherwise. When `len` is given, this
  // will return `null` unless the integer has exactly `len` digits.

  pp$7.readInt = function(radix, len) {
    var this$1 = this;

    var start = this.pos, total = 0
    for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
      var code = this$1.input.charCodeAt(this$1.pos), val
      if (code >= 97) val = code - 97 + 10 // a
      else if (code >= 65) val = code - 65 + 10 // A
      else if (code >= 48 && code <= 57) val = code - 48 // 0-9
      else val = Infinity
      if (val >= radix) break
      ++this$1.pos
      total = total * radix + val
    }
    if (this.pos === start || len != null && this.pos - start !== len) return null

    return total
  }

  pp$7.readRadixNumber = function(radix) {
    this.pos += 2 // 0x
    var val = this.readInt(radix)
    if (val == null) this.raise(this.start + 2, "Expected number in radix " + radix)
    if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number")
    return this.finishToken(tt.num, val)
  }

  // Read an integer, octal integer, or floating-point number.

  pp$7.readNumber = function(startsWithDot) {
    var start = this.pos, isFloat = false, octal = this.input.charCodeAt(this.pos) === 48
    if (!startsWithDot && this.readInt(10) === null) this.raise(start, "Invalid number")
    var next = this.input.charCodeAt(this.pos)
    if (next === 46) { // '.'
      ++this.pos
      this.readInt(10)
      isFloat = true
      next = this.input.charCodeAt(this.pos)
    }
    if (next === 69 || next === 101) { // 'eE'
      next = this.input.charCodeAt(++this.pos)
      if (next === 43 || next === 45) ++this.pos // '+-'
      if (this.readInt(10) === null) this.raise(start, "Invalid number")
      isFloat = true
    }
    if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number")

    var str = this.input.slice(start, this.pos), val
    if (isFloat) val = parseFloat(str)
    else if (!octal || str.length === 1) val = parseInt(str, 10)
    else if (/[89]/.test(str) || this.strict) this.raise(start, "Invalid number")
    else val = parseInt(str, 8)
    return this.finishToken(tt.num, val)
  }

  // Read a string value, interpreting backslash-escapes.

  pp$7.readCodePoint = function() {
    var ch = this.input.charCodeAt(this.pos), code

    if (ch === 123) {
      if (this.options.ecmaVersion < 6) this.unexpected()
      var codePos = ++this.pos
      code = this.readHexChar(this.input.indexOf('}', this.pos) - this.pos)
      ++this.pos
      if (code > 0x10FFFF) this.raise(codePos, "Code point out of bounds")
    } else {
      code = this.readHexChar(4)
    }
    return code
  }

  function codePointToString(code) {
    // UTF-16 Decoding
    if (code <= 0xFFFF) return String.fromCharCode(code)
    code -= 0x10000
    return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00)
  }

  pp$7.readString = function(quote) {
    var this$1 = this;

    var out = "", chunkStart = ++this.pos
    for (;;) {
      if (this$1.pos >= this$1.input.length) this$1.raise(this$1.start, "Unterminated string constant")
      var ch = this$1.input.charCodeAt(this$1.pos)
      if (ch === quote) break
      if (ch === 92) { // '\'
        out += this$1.input.slice(chunkStart, this$1.pos)
        out += this$1.readEscapedChar(false)
        chunkStart = this$1.pos
      } else {
        if (isNewLine(ch)) this$1.raise(this$1.start, "Unterminated string constant")
        ++this$1.pos
      }
    }
    out += this.input.slice(chunkStart, this.pos++)
    return this.finishToken(tt.string, out)
  }

  // Reads template string tokens.

  pp$7.readTmplToken = function() {
    var this$1 = this;

    var out = "", chunkStart = this.pos
    for (;;) {
      if (this$1.pos >= this$1.input.length) this$1.raise(this$1.start, "Unterminated template")
      var ch = this$1.input.charCodeAt(this$1.pos)
      if (ch === 96 || ch === 36 && this$1.input.charCodeAt(this$1.pos + 1) === 123) { // '`', '${'
        if (this$1.pos === this$1.start && this$1.type === tt.template) {
          if (ch === 36) {
            this$1.pos += 2
            return this$1.finishToken(tt.dollarBraceL)
          } else {
            ++this$1.pos
            return this$1.finishToken(tt.backQuote)
          }
        }
        out += this$1.input.slice(chunkStart, this$1.pos)
        return this$1.finishToken(tt.template, out)
      }
      if (ch === 92) { // '\'
        out += this$1.input.slice(chunkStart, this$1.pos)
        out += this$1.readEscapedChar(true)
        chunkStart = this$1.pos
      } else if (isNewLine(ch)) {
        out += this$1.input.slice(chunkStart, this$1.pos)
        ++this$1.pos
        switch (ch) {
          case 13:
            if (this$1.input.charCodeAt(this$1.pos) === 10) ++this$1.pos
          case 10:
            out += "\n"
            break
          default:
            out += String.fromCharCode(ch)
            break
        }
        if (this$1.options.locations) {
          ++this$1.curLine
          this$1.lineStart = this$1.pos
        }
        chunkStart = this$1.pos
      } else {
        ++this$1.pos
      }
    }
  }

  // Used to read escaped characters

  pp$7.readEscapedChar = function(inTemplate) {
    var ch = this.input.charCodeAt(++this.pos)
    ++this.pos
    switch (ch) {
    case 110: return "\n" // 'n' -> '\n'
    case 114: return "\r" // 'r' -> '\r'
    case 120: return String.fromCharCode(this.readHexChar(2)) // 'x'
    case 117: return codePointToString(this.readCodePoint()) // 'u'
    case 116: return "\t" // 't' -> '\t'
    case 98: return "\b" // 'b' -> '\b'
    case 118: return "\u000b" // 'v' -> '\u000b'
    case 102: return "\f" // 'f' -> '\f'
    case 13: if (this.input.charCodeAt(this.pos) === 10) ++this.pos // '\r\n'
    case 10: // ' \n'
      if (this.options.locations) { this.lineStart = this.pos; ++this.curLine }
      return ""
    default:
      if (ch >= 48 && ch <= 55) {
        var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0]
        var octal = parseInt(octalStr, 8)
        if (octal > 255) {
          octalStr = octalStr.slice(0, -1)
          octal = parseInt(octalStr, 8)
        }
        if (octalStr !== "0" && (this.strict || inTemplate)) {
          this.raise(this.pos - 2, "Octal literal in strict mode")
        }
        this.pos += octalStr.length - 1
        return String.fromCharCode(octal)
      }
      return String.fromCharCode(ch)
    }
  }

  // Used to read character escape sequences ('\x', '\u', '\U').

  pp$7.readHexChar = function(len) {
    var codePos = this.pos
    var n = this.readInt(16, len)
    if (n === null) this.raise(codePos, "Bad character escape sequence")
    return n
  }

  // Read an identifier, and return it as a string. Sets `this.containsEsc`
  // to whether the word contained a '\u' escape.
  //
  // Incrementally adds only escaped chars, adding other chunks as-is
  // as a micro-optimization.

  pp$7.readWord1 = function() {
    var this$1 = this;

    this.containsEsc = false
    var word = "", first = true, chunkStart = this.pos
    var astral = this.options.ecmaVersion >= 6
    while (this.pos < this.input.length) {
      var ch = this$1.fullCharCodeAtPos()
      if (isIdentifierChar(ch, astral)) {
        this$1.pos += ch <= 0xffff ? 1 : 2
      } else if (ch === 92) { // "\"
        this$1.containsEsc = true
        word += this$1.input.slice(chunkStart, this$1.pos)
        var escStart = this$1.pos
        if (this$1.input.charCodeAt(++this$1.pos) != 117) // "u"
          this$1.raise(this$1.pos, "Expecting Unicode escape sequence \\uXXXX")
        ++this$1.pos
        var esc = this$1.readCodePoint()
        if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
          this$1.raise(escStart, "Invalid Unicode escape")
        word += codePointToString(esc)
        chunkStart = this$1.pos
      } else {
        break
      }
      first = false
    }
    return word + this.input.slice(chunkStart, this.pos)
  }

  // Read an identifier or keyword token. Will check for reserved
  // words when necessary.

  pp$7.readWord = function() {
    var word = this.readWord1()
    var type = tt.name
    if ((this.options.ecmaVersion >= 6 || !this.containsEsc) && this.keywords.test(word))
      type = keywordTypes[word]
    return this.finishToken(type, word)
  }

  var version = "3.3.0"

  // The main exported interface (under `self.acorn` when in the
  // browser) is a `parse` function that takes a code string and
  // returns an abstract syntax tree as specified by [Mozilla parser
  // API][api].
  //
  // [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

  function parse(input, options) {
    return new Parser(options, input).parse()
  }

  // This function tries to parse a single expression at a given
  // offset in a string. Useful for parsing mixed-language formats
  // that embed JavaScript expressions.

  function parseExpressionAt(input, pos, options) {
    var p = new Parser(options, input, pos)
    p.nextToken()
    return p.parseExpression()
  }

  // Acorn is organized as a tokenizer and a recursive-descent parser.
  // The `tokenizer` export provides an interface to the tokenizer.

  function tokenizer(input, options) {
    return new Parser(options, input)
  }

  exports.version = version;
  exports.parse = parse;
  exports.parseExpressionAt = parseExpressionAt;
  exports.tokenizer = tokenizer;
  exports.Parser = Parser;
  exports.plugins = plugins;
  exports.defaultOptions = defaultOptions;
  exports.Position = Position;
  exports.SourceLocation = SourceLocation;
  exports.getLineInfo = getLineInfo;
  exports.Node = Node;
  exports.TokenType = TokenType;
  exports.tokTypes = tt;
  exports.TokContext = TokContext;
  exports.tokContexts = types;
  exports.isIdentifierChar = isIdentifierChar;
  exports.isIdentifierStart = isIdentifierStart;
  exports.Token = Token;
  exports.isNewLine = isNewLine;
  exports.lineBreak = lineBreak;
  exports.lineBreakG = lineBreakG;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{}],38:[function(require,module,exports){

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};


},{}],39:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],40:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],41:[function(require,module,exports){
(function (global){
/*
	Next Gen Events
	
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



function NextGenEvents() { return Object.create( NextGenEvents.prototype ) ; }
module.exports = NextGenEvents ;
NextGenEvents.prototype.__prototypeUID__ = 'nextgen-events/NextGenEvents' ;
NextGenEvents.prototype.__prototypeVersion__ = require( '../package.json' ).version ;

			/* Basic features, more or less compatible with Node.js */



NextGenEvents.SYNC = -Infinity ;

// Not part of the prototype, because it should not pollute userland's prototype.
// It has an eventEmitter as 'this' anyway (always called using call()).
NextGenEvents.init = function init()
{
	Object.defineProperty( this , '__ngev' , {
		configurable: true ,
		value: {
			nice: NextGenEvents.SYNC ,
			interruptible: false ,
			recursion: 0 ,
			contexts: {} ,
			
			// States by events
			states: {} ,
			
			// State groups by events
			stateGroups: {} ,
			
			// Listeners by events
			listeners: {
				// Special events
				error: [] ,
				interrupt: [] ,
				newListener: [] ,
				removeListener: []
			}
		}
	} ) ;
} ;



// Use it with .bind()
NextGenEvents.filterOutCallback = function( what , currentElement ) { return what !== currentElement ; } ;



// .addListener( eventName , [fn] , [options] )
NextGenEvents.prototype.addListener = function addListener( eventName , fn , options )
{
	var listener = {} , newListenerListeners ;
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! this.__ngev.listeners[ eventName ] ) { this.__ngev.listeners[ eventName ] = [] ; }
	
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( ".addListener(): argument #0 should be a non-empty string" ) ; }
	if ( typeof fn !== 'function' ) { options = fn ; fn = undefined ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	listener.fn = fn || options.fn ;
	listener.id = options.id !== undefined ? options.id : listener.fn ;
	listener.once = !! options.once ;
	listener.async = !! options.async ;
	listener.eventObject = !! options.eventObject ;
	listener.nice = options.nice !== undefined ? Math.floor( options.nice ) : NextGenEvents.SYNC ;
	listener.context = typeof options.context === 'string' ? options.context : null ;
	
	if ( typeof listener.fn !== 'function' )
	{
		throw new TypeError( ".addListener(): a function or an object with a 'fn' property which value is a function should be provided" ) ;
	}
	
	// Implicit context creation
	if ( listener.context && typeof listener.context === 'string' && ! this.__ngev.contexts[ listener.context ] )
	{
		this.addListenerContext( listener.context ) ;
	}
	
	// Note: 'newListener' and 'removeListener' event return an array of listener, but not the event name.
	// So the event's name can be retrieved in the listener itself.
	listener.event = eventName ;
	
	if ( this.__ngev.listeners.newListener.length )
	{
		// Extra care should be taken with the 'newListener' event, we should avoid recursion
		// in the case that eventName === 'newListener', but inside a 'newListener' listener,
		// .listenerCount() should report correctly
		newListenerListeners = this.__ngev.listeners.newListener.slice() ;
		
		this.__ngev.listeners[ eventName ].push( listener ) ;
		
		// Return an array, because one day, .addListener() may support multiple event addition at once,
		// e.g.: .addListener( { request: onRequest, close: onClose, error: onError } ) ;
		NextGenEvents.emitEvent( {
			emitter: this ,
			name: 'newListener' ,
			args: [ [ listener ] ] ,
			listeners: newListenerListeners
		} ) ;
		
		if ( this.__ngev.states[ eventName ] ) { NextGenEvents.emitToOneListener( this.__ngev.states[ eventName ] , listener ) ; }
		
		return this ;
	}
	
	this.__ngev.listeners[ eventName ].push( listener ) ;
	
	if ( this.__ngev.states[ eventName ] ) { NextGenEvents.emitToOneListener( this.__ngev.states[ eventName ] , listener ) ; }
	
	return this ;
} ;

NextGenEvents.prototype.on = NextGenEvents.prototype.addListener ;



// Shortcut
// .once( eventName , [fn] , [options] )
NextGenEvents.prototype.once = function once( eventName , fn , options )
{
	if ( fn && typeof fn === 'object' ) { fn.once = true ; }
	else if ( options && typeof options === 'object' ) { options.once = true ; }
	else { options = { once: true } ; }
	
	return this.addListener( eventName , fn , options ) ;
} ;



NextGenEvents.prototype.removeListener = function removeListener( eventName , id )
{
	var i , length , newListeners = [] , removedListeners = [] ;
	
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( ".removeListener(): argument #0 should be a non-empty string" ) ; }
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! this.__ngev.listeners[ eventName ] ) { this.__ngev.listeners[ eventName ] = [] ; }
	
	length = this.__ngev.listeners[ eventName ].length ;
	
	// It's probably faster to create a new array of listeners
	for ( i = 0 ; i < length ; i ++ )
	{
		if ( this.__ngev.listeners[ eventName ][ i ].id === id )
		{
			removedListeners.push( this.__ngev.listeners[ eventName ][ i ] ) ;
		}
		else
		{
			newListeners.push( this.__ngev.listeners[ eventName ][ i ] ) ;
		}
	}
	
	this.__ngev.listeners[ eventName ] = newListeners ;
	
	if ( removedListeners.length && this.__ngev.listeners.removeListener.length )
	{
		this.emit( 'removeListener' , removedListeners ) ;
	}
	
	return this ;
} ;

NextGenEvents.prototype.off = NextGenEvents.prototype.removeListener ;



NextGenEvents.prototype.removeAllListeners = function removeAllListeners( eventName )
{
	var removedListeners ;
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	
	if ( eventName )
	{
		// Remove all listeners for a particular event
		
		if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( ".removeAllListeners(): argument #0 should be undefined or a non-empty string" ) ; }
		
		if ( ! this.__ngev.listeners[ eventName ] ) { this.__ngev.listeners[ eventName ] = [] ; }
		
		removedListeners = this.__ngev.listeners[ eventName ] ;
		this.__ngev.listeners[ eventName ] = [] ;
		
		if ( removedListeners.length && this.__ngev.listeners.removeListener.length )
		{
			this.emit( 'removeListener' , removedListeners ) ;
		}
	}
	else
	{
		// Remove all listeners for any events
		// 'removeListener' listeners cannot be triggered: they are already deleted
		this.__ngev.listeners = {} ;
	}
	
	return this ;
} ;



NextGenEvents.listenerWrapper = function listenerWrapper( listener , event , context )
{
	var returnValue , serial , listenerCallback ;
	
	if ( event.interrupt ) { return ; }
	
	if ( listener.async )
	{
		//serial = context && context.serial ;
		if ( context )
		{
			serial = context.serial ;
			context.ready = ! serial ;
		}
		
		listenerCallback = function( arg ) {
			
			event.listenersDone ++ ;
			
			// Async interrupt
			if ( arg && event.emitter.__ngev.interruptible && ! event.interrupt && event.name !== 'interrupt' )
			{
				event.interrupt = arg ;
				
				if ( event.callback )
				{
					event.callback( event.interrupt , event ) ;
					delete event.callback ;
				}
				
				event.emitter.emit( 'interrupt' , event.interrupt ) ;
			}
			else if ( event.listenersDone >= event.listeners.length && event.callback )
			{
				event.callback( undefined , event ) ;
				delete event.callback ;
			}
			
			// Process the queue if serialized
			if ( serial ) { NextGenEvents.processQueue.call( event.emitter , listener.context , true ) ; }
			
		} ;
		
		if ( listener.eventObject ) { listener.fn( event , listenerCallback ) ; }
		else { returnValue = listener.fn.apply( undefined , event.args.concat( listenerCallback ) ) ; }
	}
	else
	{
		if ( listener.eventObject ) { listener.fn( event ) ; }
		else { returnValue = listener.fn.apply( undefined , event.args ) ; }
		
		event.listenersDone ++ ;
	}
	
	// Interrupt if non-falsy return value, if the emitter is interruptible, not already interrupted (emit once),
	// and not within an 'interrupt' event.
	if ( returnValue && event.emitter.__ngev.interruptible && ! event.interrupt && event.name !== 'interrupt' )
	{
		event.interrupt = returnValue ;
		
		if ( event.callback )
		{
			event.callback( event.interrupt , event ) ;
			delete event.callback ;
		}
		
		event.emitter.emit( 'interrupt' , event.interrupt ) ;
	}
	else if ( event.listenersDone >= event.listeners.length && event.callback )
	{
		event.callback( undefined , event ) ;
		delete event.callback ;
	}
} ;



// A unique event ID
var nextEventId = 0 ;



/*
	emit( [nice] , eventName , [arg1] , [arg2] , [...] , [emitCallback] )
*/
NextGenEvents.prototype.emit = function emit()
{
	var event ;
	
	event = { emitter: this } ;
	
	// Arguments handling
	if ( typeof arguments[ 0 ] === 'number' )
	{
		event.nice = Math.floor( arguments[ 0 ] ) ;
		event.name = arguments[ 1 ] ;
		if ( ! event.name || typeof event.name !== 'string' ) { throw new TypeError( ".emit(): when argument #0 is a number, argument #1 should be a non-empty string" ) ; }
		
		if ( typeof arguments[ arguments.length - 1 ] === 'function' )
		{
			event.callback = arguments[ arguments.length - 1 ] ;
			event.args = Array.prototype.slice.call( arguments , 2 , -1 ) ;
		}
		else
		{
			event.args = Array.prototype.slice.call( arguments , 2 ) ;
		}
	}
	else
	{
		//event.nice = this.__ngev.nice ;
		event.name = arguments[ 0 ] ;
		if ( ! event.name || typeof event.name !== 'string' ) { throw new TypeError( ".emit(): argument #0 should be an number or a non-empty string" ) ; }
		event.args = Array.prototype.slice.call( arguments , 1 ) ;
		
		if ( typeof arguments[ arguments.length - 1 ] === 'function' )
		{
			event.callback = arguments[ arguments.length - 1 ] ;
			event.args = Array.prototype.slice.call( arguments , 1 , -1 ) ;
		}
		else
		{
			event.args = Array.prototype.slice.call( arguments , 1 ) ;
		}
	}
	
	return NextGenEvents.emitEvent( event ) ;
} ;



/*
	At this stage, 'event' should be an object having those properties:
		* emitter: the event emitter
		* name: the event name
		* args: array, the arguments of the event
		* nice: (optional) nice value
		* callback: (optional) a callback for emit
		* listeners: (optional) override the listeners array stored in __ngev
*/
NextGenEvents.emitEvent = function emitEvent( event )
{
	var self = event.emitter ,
		i , iMax , count = 0 , state , removedListeners ;
	
	if ( ! self.__ngev ) { NextGenEvents.init.call( self ) ; }
	
	state = self.__ngev.states[ event.name ] ;
	
	// This is a state event, register it now!
	if ( state !== undefined )
	{
		
		if ( state && event.args.length === state.args.length &&
			event.args.every( function( arg , index ) { return arg === state.args[ index ] ; } ) )
		{
			// The emitter is already in this exact state, skip it now!
			return ;
		}
		
		// Unset all states of that group
		self.__ngev.stateGroups[ event.name ].forEach( function( eventName ) {
			self.__ngev.states[ eventName ] = null ;
		} ) ;
		
		self.__ngev.states[ event.name ] = event ;
	}
	
	if ( ! self.__ngev.listeners[ event.name ] ) { self.__ngev.listeners[ event.name ] = [] ; }
	
	event.id = nextEventId ++ ;
	event.listenersDone = 0 ;
	event.once = !! event.once ;
	
	if ( event.nice === undefined || event.nice === null ) { event.nice = self.__ngev.nice ; }
	
	// Trouble arise when a listener is removed from another listener, while we are still in the loop.
	// So we have to COPY the listener array right now!
	if ( ! event.listeners ) { event.listeners = self.__ngev.listeners[ event.name ].slice() ; }
	
	// Increment self.__ngev.recursion
	self.__ngev.recursion ++ ;
	removedListeners = [] ;
	
	// Emit the event to all listeners!
	for ( i = 0 , iMax = event.listeners.length ; i < iMax ; i ++ )
	{
		count ++ ;
		NextGenEvents.emitToOneListener( event , event.listeners[ i ] , removedListeners ) ;
	}
	
	// Decrement recursion
	self.__ngev.recursion -- ;
	
	// Emit 'removeListener' after calling listeners
	if ( removedListeners.length && self.__ngev.listeners.removeListener.length )
	{
		self.emit( 'removeListener' , removedListeners ) ;
	}
	
	
	// 'error' event is a special case: it should be listened for, or it will throw an error
	if ( ! count )
	{
		if ( event.name === 'error' )
		{
			if ( event.args[ 0 ] ) { throw event.args[ 0 ] ; }
			else { throw Error( "Uncaught, unspecified 'error' event." ) ; }
		}
		
		if ( event.callback )
		{
			event.callback( undefined , event ) ;
			delete event.callback ;
		}
	}
	
	return event ;
} ;



// If removedListeners is not given, then one-time listener emit the 'removeListener' event,
// if given: that's the caller business to do it
NextGenEvents.emitToOneListener = function emitToOneListener( event , listener , removedListeners )
{	
	var self = event.emitter ,
		context , currentNice , emitRemoveListener = false ;
	
	context = listener.context && self.__ngev.contexts[ listener.context ] ;
	
	// If the listener context is disabled...
	if ( context && context.status === NextGenEvents.CONTEXT_DISABLED ) { return ; }
	
	// The nice value for this listener...
	if ( context ) { currentNice = Math.max( event.nice , listener.nice , context.nice ) ; }
	else { currentNice = Math.max( event.nice , listener.nice ) ; }
	
	
	if ( listener.once )
	{
		// We should remove the current listener RIGHT NOW because of recursive .emit() issues:
		// one listener may eventually fire this very same event synchronously during the current loop.
		self.__ngev.listeners[ event.name ] = self.__ngev.listeners[ event.name ].filter(
			NextGenEvents.filterOutCallback.bind( undefined , listener )
		) ;
		
		if ( removedListeners ) { removedListeners.push( listener ) ; }
		else { emitRemoveListener = true ; }
	}
	
	if ( context && ( context.status === NextGenEvents.CONTEXT_QUEUED || ! context.ready ) )
	{
		// Almost all works should be done by .emit(), and little few should be done by .processQueue()
		context.queue.push( { event: event , listener: listener , nice: currentNice } ) ;
	}
	else
	{
		try {
			if ( currentNice < 0 )
			{
				if ( self.__ngev.recursion >= - currentNice )
				{
					setImmediate( NextGenEvents.listenerWrapper.bind( self , listener , event , context ) ) ;
				}
				else
				{
					NextGenEvents.listenerWrapper.call( self , listener , event , context ) ;
				}
			}
			else
			{
				setTimeout( NextGenEvents.listenerWrapper.bind( self , listener , event , context ) , currentNice ) ;
			}
		}
		catch ( error ) {
			// Catch error, just to decrement self.__ngev.recursion, re-throw after that...
			self.__ngev.recursion -- ;
			throw error ;
		}
	}
	
	// Emit 'removeListener' after calling the listener
	if ( emitRemoveListener && self.__ngev.listeners.removeListener.length )
	{
		self.emit( 'removeListener' , [ listener ] ) ;
	}
} ;



NextGenEvents.prototype.listeners = function listeners( eventName )
{
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( ".listeners(): argument #0 should be a non-empty string" ) ; }
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! this.__ngev.listeners[ eventName ] ) { this.__ngev.listeners[ eventName ] = [] ; }
	
	// Do not return the array, shallow copy it
	return this.__ngev.listeners[ eventName ].slice() ;
} ;



NextGenEvents.listenerCount = function( emitter , eventName )
{
	if ( ! emitter || ! ( emitter instanceof NextGenEvents ) ) { throw new TypeError( ".listenerCount(): argument #0 should be an instance of NextGenEvents" ) ; }
	return emitter.listenerCount( eventName ) ;
} ;



NextGenEvents.prototype.listenerCount = function( eventName )
{
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( ".listenerCount(): argument #1 should be a non-empty string" ) ; }
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! this.__ngev.listeners[ eventName ] ) { this.__ngev.listeners[ eventName ] = [] ; }
	
	return this.__ngev.listeners[ eventName ].length ;
} ;



NextGenEvents.prototype.setNice = function setNice( nice )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	//if ( typeof nice !== 'number' ) { throw new TypeError( ".setNice(): argument #0 should be a number" ) ; }
	
	this.__ngev.nice = Math.floor( +nice || 0 ) ;
} ;



NextGenEvents.prototype.setInterruptible = function setInterruptible( value )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	//if ( typeof nice !== 'number' ) { throw new TypeError( ".setNice(): argument #0 should be a number" ) ; }
	
	this.__ngev.interruptible = !! value ;
} ;



// Make two objects sharing the same event bus
NextGenEvents.share = function( source , target )
{
	if ( ! ( source instanceof NextGenEvents ) || ! ( target instanceof NextGenEvents ) )
	{
		throw new TypeError( 'NextGenEvents.share() arguments should be instances of NextGenEvents' ) ;
	}
	
	if ( ! source.__ngev ) { NextGenEvents.init.call( source ) ; }
	
	Object.defineProperty( target , '__ngev' , {
		configurable: true ,
		value: source.__ngev
	} ) ;
} ;



NextGenEvents.reset = function reset( emitter )
{
	Object.defineProperty( emitter , '__ngev' , {
        configurable: true ,
        value: null
	} ) ;
} ;



// There is no such thing in NextGenEvents, however, we need to be compatible with node.js events at best
NextGenEvents.prototype.setMaxListeners = function() {} ;

// Sometime useful as a no-op callback...
NextGenEvents.noop = function() {} ;





			/* Next Gen feature: states! */



// .defineStates( exclusiveState1 , [exclusiveState2] , [exclusiveState3] , ... )
NextGenEvents.prototype.defineStates = function defineStates()
{
	var self = this ,
		states = Array.prototype.slice.call( arguments ) ;
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	
	states.forEach( function( state ) {
		self.__ngev.states[ state ] = null ;
		self.__ngev.stateGroups[ state ] = states ;
	} ) ;
} ;



NextGenEvents.prototype.hasState = function hasState( state )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	return !! this.__ngev.states[ state ] ;
} ;



NextGenEvents.prototype.getAllStates = function getAllStates()
{
	var self = this ;
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	return Object.keys( this.__ngev.states ).filter( function( e ) { return self.__ngev.states[ e ] ; } ) ;
} ;





			/* Next Gen feature: groups! */



NextGenEvents.groupAddListener = function groupAddListener( emitters , eventName , fn , options )
{
	// Manage arguments
	if ( typeof fn !== 'function' ) { options = fn ; fn = undefined ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	fn = fn || options.fn ;
	delete options.fn ;
	
	// Preserve the listener ID, so groupRemoveListener() will work as expected
	options.id = options.id || fn ;
	
	emitters.forEach( function( emitter ) {
		emitter.addListener( eventName , fn.bind( undefined , emitter ) , options ) ;
	} ) ;
} ;

NextGenEvents.groupOn = NextGenEvents.groupAddListener ;



// Once per emitter
NextGenEvents.groupOnce = function groupOnce( emitters , eventName , fn , options )
{
	if ( fn && typeof fn === 'object' ) { fn.once = true ; }
	else if ( options && typeof options === 'object' ) { options.once = true ; }
	else { options = { once: true } ; }
	
	return this.groupAddListener( emitters , eventName , fn , options ) ;
} ;



// Globally once, only one event could be emitted, by the first emitter to emit
NextGenEvents.groupGlobalOnce = function groupGlobalOnce( emitters , eventName , fn , options )
{
	var fnWrapper , triggered = false ;
	
	// Manage arguments
	if ( typeof fn !== 'function' ) { options = fn ; fn = undefined ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	fn = fn || options.fn ;
	delete options.fn ;
	
	// Preserve the listener ID, so groupRemoveListener() will work as expected
	options.id = options.id || fn ;
	
	fnWrapper = function() {
		if ( triggered ) { return ; }
		triggered = true ;
		NextGenEvents.groupRemoveListener( emitters , eventName , options.id ) ;
		fn.apply( undefined , arguments ) ;
	} ;
	
	emitters.forEach( function( emitter ) {
		emitter.once( eventName , fnWrapper.bind( undefined , emitter ) , options ) ;
	} ) ;
} ;



// Globally once, only one event could be emitted, by the last emitter to emit
NextGenEvents.groupGlobalOnceAll = function groupGlobalOnceAll( emitters , eventName , fn , options )
{
	var fnWrapper , triggered = false , count = emitters.length ;
	
	// Manage arguments
	if ( typeof fn !== 'function' ) { options = fn ; fn = undefined ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	fn = fn || options.fn ;
	delete options.fn ;
	
	// Preserve the listener ID, so groupRemoveListener() will work as expected
	options.id = options.id || fn ;
	
	fnWrapper = function() {
		if ( triggered ) { return ; }
		if ( -- count ) { return ; }
		
		// So this is the last emitter...
		
		triggered = true ;
		// No need to remove listeners: there are already removed anyway
		//NextGenEvents.groupRemoveListener( emitters , eventName , options.id ) ;
		fn.apply( undefined , arguments ) ;
	} ;
	
	emitters.forEach( function( emitter ) {
		emitter.once( eventName , fnWrapper.bind( undefined , emitter ) , options ) ;
	} ) ;
} ;



NextGenEvents.groupRemoveListener = function groupRemoveListener( emitters , eventName , id )
{
	emitters.forEach( function( emitter ) {
		emitter.removeListener( eventName , id ) ;
	} ) ;
} ;

NextGenEvents.groupOff = NextGenEvents.groupRemoveListener ;



NextGenEvents.groupRemoveAllListeners = function groupRemoveAllListeners( emitters , eventName )
{
	emitters.forEach( function( emitter ) {
		emitter.removeAllListeners( eventName ) ;
	} ) ;
} ;



NextGenEvents.groupEmit = function groupEmit( emitters )
{
	var eventName , nice , argStart = 2 , argEnd , args , count = emitters.length ,
		callback , callbackWrapper , callbackTriggered = false ;
	
	if ( typeof arguments[ arguments.length - 1 ] === 'function' )
	{
		argEnd = -1 ;
		callback = arguments[ arguments.length - 1 ] ;
		
		callbackWrapper = function( interruption ) {
			if ( callbackTriggered ) { return ; }
			
			if ( interruption )
			{
				callbackTriggered = true ;
				callback( interruption ) ;
			}
			else if ( ! -- count )
			{
				callbackTriggered = true ;
				callback() ;
			}
		} ;
	}
	
	if ( typeof arguments[ 1 ] === 'number' )
	{
		argStart = 3 ;
		nice = typeof arguments[ 1 ] ;
	}
	
	eventName = arguments[ argStart - 1 ] ;
	args = Array.prototype.slice.call( arguments , argStart , argEnd ) ;
	
	emitters.forEach( function( emitter ) {
		NextGenEvents.emitEvent( {
			emitter: emitter ,
			name: eventName ,
			args: args ,
			nice: nice ,
			callback: callbackWrapper
		} ) ;
	} ) ;
} ;



NextGenEvents.groupDefineStates = function groupDefineStates( emitters )
{
	var args = Array.prototype.slice.call( arguments , 1 ) ;
	
	emitters.forEach( function( emitter ) {
		emitter.defineStates.apply( emitter , args ) ;
	} ) ;
} ;





			/* Next Gen feature: contexts! */



NextGenEvents.CONTEXT_ENABLED = 0 ;
NextGenEvents.CONTEXT_DISABLED = 1 ;
NextGenEvents.CONTEXT_QUEUED = 2 ;



NextGenEvents.prototype.addListenerContext = function addListenerContext( contextName , options )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( ".addListenerContext(): argument #0 should be a non-empty string" ) ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	if ( ! this.__ngev.contexts[ contextName ] )
	{
		// A context IS an event emitter too!
		this.__ngev.contexts[ contextName ] = Object.create( NextGenEvents.prototype ) ;
		this.__ngev.contexts[ contextName ].nice = NextGenEvents.SYNC ;
		this.__ngev.contexts[ contextName ].ready = true ;
		this.__ngev.contexts[ contextName ].status = NextGenEvents.CONTEXT_ENABLED ;
		this.__ngev.contexts[ contextName ].serial = false ;
		this.__ngev.contexts[ contextName ].queue = [] ;
	}
	
	if ( options.nice !== undefined ) { this.__ngev.contexts[ contextName ].nice = Math.floor( options.nice ) ; }
	if ( options.status !== undefined ) { this.__ngev.contexts[ contextName ].status = options.status ; }
	if ( options.serial !== undefined ) { this.__ngev.contexts[ contextName ].serial = !! options.serial ; }
	
	return this ;
} ;



NextGenEvents.prototype.disableListenerContext = function disableListenerContext( contextName )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( ".disableListenerContext(): argument #0 should be a non-empty string" ) ; }
	if ( ! this.__ngev.contexts[ contextName ] ) { this.addListenerContext( contextName ) ; }
	
	this.__ngev.contexts[ contextName ].status = NextGenEvents.CONTEXT_DISABLED ;
	
	return this ;
} ;



NextGenEvents.prototype.enableListenerContext = function enableListenerContext( contextName )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( ".enableListenerContext(): argument #0 should be a non-empty string" ) ; }
	if ( ! this.__ngev.contexts[ contextName ] ) { this.addListenerContext( contextName ) ; }
	
	this.__ngev.contexts[ contextName ].status = NextGenEvents.CONTEXT_ENABLED ;
	
	if ( this.__ngev.contexts[ contextName ].queue.length > 0 ) { NextGenEvents.processQueue.call( this , contextName ) ; }
	
	return this ;
} ;



NextGenEvents.prototype.queueListenerContext = function queueListenerContext( contextName )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( ".queueListenerContext(): argument #0 should be a non-empty string" ) ; }
	if ( ! this.__ngev.contexts[ contextName ] ) { this.addListenerContext( contextName ) ; }
	
	this.__ngev.contexts[ contextName ].status = NextGenEvents.CONTEXT_QUEUED ;
	
	return this ;
} ;



NextGenEvents.prototype.serializeListenerContext = function serializeListenerContext( contextName , value )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( ".serializeListenerContext(): argument #0 should be a non-empty string" ) ; }
	if ( ! this.__ngev.contexts[ contextName ] ) { this.addListenerContext( contextName ) ; }
	
	this.__ngev.contexts[ contextName ].serial = value === undefined ? true : !! value ;
	
	return this ;
} ;



NextGenEvents.prototype.setListenerContextNice = function setListenerContextNice( contextName , nice )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( ".setListenerContextNice(): argument #0 should be a non-empty string" ) ; }
	if ( ! this.__ngev.contexts[ contextName ] ) { this.addListenerContext( contextName ) ; }
	
	this.__ngev.contexts[ contextName ].nice = Math.floor( nice ) ;
	
	return this ;
} ;



NextGenEvents.prototype.destroyListenerContext = function destroyListenerContext( contextName )
{
	var i , length , eventName , newListeners , removedListeners = [] ;
	
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( ".disableListenerContext(): argument #0 should be a non-empty string" ) ; }
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	
	// We don't care if a context actually exists, all listeners tied to that contextName will be removed
	
	for ( eventName in this.__ngev.listeners )
	{
		newListeners = null ;
		length = this.__ngev.listeners[ eventName ].length ;
		
		for ( i = 0 ; i < length ; i ++ )
		{
			if ( this.__ngev.listeners[ eventName ][ i ].context === contextName )
			{
				newListeners = [] ;
				removedListeners.push( this.__ngev.listeners[ eventName ][ i ] ) ;
			}
			else if ( newListeners )
			{
				newListeners.push( this.__ngev.listeners[ eventName ][ i ] ) ;
			}
		}
		
		if ( newListeners ) { this.__ngev.listeners[ eventName ] = newListeners ; }
	}
	
	if ( this.__ngev.contexts[ contextName ] ) { delete this.__ngev.contexts[ contextName ] ; }
	
	if ( removedListeners.length && this.__ngev.listeners.removeListener.length )
	{
		this.emit( 'removeListener' , removedListeners ) ;
	}
	
	return this ;
} ;



// To be used with .call(), it should not pollute the prototype
NextGenEvents.processQueue = function processQueue( contextName , isCompletionCallback )
{
	var context , job ;
	
	// The context doesn't exist anymore, so just abort now
	if ( ! this.__ngev.contexts[ contextName ] ) { return ; }
	
	context = this.__ngev.contexts[ contextName ] ;
	
	if ( isCompletionCallback ) { context.ready = true ; }
	
	// Should work on serialization here
	
	//console.log( ">>> " , context ) ;
	
	// Increment recursion
	this.__ngev.recursion ++ ;
	
	while ( context.ready && context.queue.length )
	{
		job = context.queue.shift() ;
		
		// This event has been interrupted, drop it now!
		if ( job.event.interrupt ) { continue ; }
		
		try {
			if ( job.nice < 0 )
			{
				if ( this.__ngev.recursion >= - job.nice )
				{
					setImmediate( NextGenEvents.listenerWrapper.bind( this , job.listener , job.event , context ) ) ;
				}
				else
				{
					NextGenEvents.listenerWrapper.call( this , job.listener , job.event , context ) ;
				}
			}
			else
			{
				setTimeout( NextGenEvents.listenerWrapper.bind( this , job.listener , job.event , context ) , job.nice ) ;
			}
		}
		catch ( error ) {
			// Catch error, just to decrement this.__ngev.recursion, re-throw after that...
			this.__ngev.recursion -- ;
			throw error ;
		}
	}
	
	// Decrement recursion
	this.__ngev.recursion -- ;
} ;



// Backup for the AsyncTryCatch
NextGenEvents.on = NextGenEvents.prototype.on ;
NextGenEvents.once = NextGenEvents.prototype.once ;
NextGenEvents.off = NextGenEvents.prototype.off ;



if ( global.AsyncTryCatch )
{
	NextGenEvents.prototype.asyncTryCatchId = global.AsyncTryCatch.NextGenEvents.length ;
	global.AsyncTryCatch.NextGenEvents.push( NextGenEvents ) ;
	
	if ( global.AsyncTryCatch.substituted )
	{
		//console.log( 'live subsitute' ) ;
		global.AsyncTryCatch.substitute() ;
	}
}



// Load Proxy AT THE END (circular require)
NextGenEvents.Proxy = require( './Proxy.js' ) ;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../package.json":43,"./Proxy.js":42}],42:[function(require,module,exports){
/*
	Next Gen Events
	
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



// Create the object && export it
function Proxy() { return Proxy.create() ; }
module.exports = Proxy ;

var NextGenEvents = require( './NextGenEvents.js' ) ;
var MESSAGE_TYPE = 'NextGenEvents/message' ;

function noop() {}



Proxy.create = function create()
{
	var self = Object.create( Proxy.prototype , {
		localServices: { value: {} , enumerable: true } ,
		remoteServices: { value: {} , enumerable: true } ,
		nextAckId: { value: 1 , writable: true , enumerable: true } ,
	} ) ;
	
	return self ;
} ;



// Add a local service accessible remotely
Proxy.prototype.addLocalService = function addLocalService( id , emitter , options )
{
	this.localServices[ id ] = LocalService.create( this , id , emitter , options ) ;
	return this.localServices[ id ] ;
} ;



// Add a remote service accessible locally
Proxy.prototype.addRemoteService = function addRemoteService( id )
{
	this.remoteServices[ id ] = RemoteService.create( this , id ) ;
	return this.remoteServices[ id ] ;
} ;



// Destroy the proxy
Proxy.prototype.destroy = function destroy()
{
	var self = this ;
	
	Object.keys( this.localServices ).forEach( function( id ) {
		self.localServices[ id ].destroy() ;
		delete self.localServices[ id ] ;
	} ) ;
	
	Object.keys( this.remoteServices ).forEach( function( id ) {
		self.remoteServices[ id ].destroy() ;
		delete self.remoteServices[ id ] ;
	} ) ;
	
	this.receive = this.send = noop ;
} ;



// Push an event message.
Proxy.prototype.push = function push( message )
{
	if (
		message.__type !== MESSAGE_TYPE ||
		! message.service || typeof message.service !== 'string' ||
		! message.event || typeof message.event !== 'string' ||
		! message.method
	)
	{
		return ;
	}
	
	switch ( message.method )
	{
		// Those methods target a remote service
		case 'event' :
			return this.remoteServices[ message.service ] && this.remoteServices[ message.service ].receiveEvent( message ) ;
		case 'ackEmit' :
			return this.remoteServices[ message.service ] && this.remoteServices[ message.service ].receiveAckEmit( message ) ;
			
		// Those methods target a local service
		case 'emit' :
			return this.localServices[ message.service ] && this.localServices[ message.service ].receiveEmit( message ) ;
		case 'listen' :
			return this.localServices[ message.service ] && this.localServices[ message.service ].receiveListen( message ) ;
		case 'ignore' :
			return this.localServices[ message.service ] && this.localServices[ message.service ].receiveIgnore( message ) ;
		case 'ackEvent' :
			return this.localServices[ message.service ] && this.localServices[ message.service ].receiveAckEvent( message ) ;
			
		default:
		 	return ;
	}
} ;



// This is the method to receive and decode data from the other side of the communication channel, most of time another proxy.
// In most case, this should be overwritten.
Proxy.prototype.receive = function receive( raw )
{
	this.push( raw ) ;
} ;



// This is the method used to send data to the other side of the communication channel, most of time another proxy.
// This MUST be overwritten in any case.
Proxy.prototype.send = function send()
{
	throw new Error( 'The send() method of the Proxy MUST be extended/overwritten' ) ;
} ;



			/* Local Service */



function LocalService( proxy , id , emitter , options ) { return LocalService.create( proxy , id , emitter , options ) ; }
Proxy.LocalService = LocalService ;



LocalService.create = function create( proxy , id , emitter , options )
{
	var self = Object.create( LocalService.prototype , {
		proxy: { value: proxy , enumerable: true } ,
		id: { value: id , enumerable: true } ,
		emitter: { value: emitter , writable: true , enumerable: true } ,
		internalEvents: { value: Object.create( NextGenEvents.prototype ) , writable: true , enumerable: true } ,
		events: { value: {} , enumerable: true } ,
		canListen: { value: !! options.listen , writable: true , enumerable: true } ,
		canEmit: { value: !! options.emit , writable: true , enumerable: true } ,
		canAck: { value: !! options.ack , writable: true , enumerable: true } ,
		canRpc: { value: !! options.rpc , writable: true , enumerable: true } ,
		destroyed: { value: false , writable: true , enumerable: true } ,
	} ) ;
	
	return self ;
} ;



// Destroy a service
LocalService.prototype.destroy = function destroy()
{
	var self = this ;
	
	Object.keys( this.events ).forEach( function( eventName ) {
		self.emitter.off( eventName , self.events[ eventName ] ) ;
		delete self.events[ eventName ] ;
	} ) ;
	
	this.emitter = null ;
	this.destroyed = true ;
} ;



// Remote want to emit on the local service
LocalService.prototype.receiveEmit = function receiveEmit( message )
{
	if ( this.destroyed || ! this.canEmit || ( message.ack && ! this.canAck ) ) { return ; }
	
	var self = this ;
	
	var event = {
		emitter: this.emitter ,
		name: message.event ,
		args: message.args || [] 
	} ;
	
	if ( message.ack )
	{
		event.callback = function ack( interruption ) {
			
			self.proxy.send( {
				__type: MESSAGE_TYPE ,
				service: self.id ,
				method: 'ackEmit' ,
				ack: message.ack ,
				event: message.event ,
				interruption: interruption
			} ) ;
		} ;
	}
	
	NextGenEvents.emitEvent( event ) ;
} ;



// Remote want to listen to an event of the local service
LocalService.prototype.receiveListen = function receiveListen( message )
{
	if ( this.destroyed || ! this.canListen || ( message.ack && ! this.canAck ) ) { return ; }
	
	if ( message.ack )
	{
		if ( this.events[ message.event ] )
		{
			if ( this.events[ message.event ].ack ) { return ; }
			
			// There is already an event, but not featuring ack, remove that listener now
			this.emitter.off( message.event , this.events[ message.event ] ) ;
		}
		
		this.events[ message.event ] = LocalService.forwardWithAck.bind( this ) ;
		this.events[ message.event ].ack = true ;
		this.emitter.on( message.event , this.events[ message.event ] , { eventObject: true , async: true } ) ;
	}
	else
	{
		if ( this.events[ message.event ] )
		{
			if ( ! this.events[ message.event ].ack ) { return ; }
			
			// Remote want to downgrade:
			// there is already an event, but featuring ack so we remove that listener now
			this.emitter.off( message.event , this.events[ message.event ] ) ;
		}
		
		this.events[ message.event ] = LocalService.forward.bind( this ) ;
		this.events[ message.event ].ack = false ;
		this.emitter.on( message.event , this.events[ message.event ] , { eventObject: true } ) ;
	}
} ;



// Remote do not want to listen to that event of the local service anymore
LocalService.prototype.receiveIgnore = function receiveIgnore( message )
{
	if ( this.destroyed || ! this.canListen ) { return ; }
	
	if ( ! this.events[ message.event ] ) { return ; }
	
	this.emitter.off( message.event , this.events[ message.event ] ) ;
	this.events[ message.event ] = null ;
} ;



// 
LocalService.prototype.receiveAckEvent = function receiveAckEvent( message )
{
	if (
		this.destroyed || ! this.canListen || ! this.canAck || ! message.ack ||
		! this.events[ message.event ] || ! this.events[ message.event ].ack
	)
	{
		return ;
	}
	
	this.internalEvents.emit( 'ack' , message ) ;
} ;



// Send an event from the local service to remote
LocalService.forward = function forward( event )
{
	if ( this.destroyed ) { return ; }
	
	this.proxy.send( {
		__type: MESSAGE_TYPE ,
		service: this.id ,
		method: 'event' ,
		event: event.name ,
		args: event.args
	} ) ;
} ;

LocalService.forward.ack = false ;



// Send an event from the local service to remote, with ACK
LocalService.forwardWithAck = function forwardWithAck( event , callback )
{
	if ( this.destroyed ) { return ; }
	
	var self = this ;
	
	if ( ! event.callback )
	{
		// There is no emit callback, no need to ack this one
		this.proxy.send( {
			__type: MESSAGE_TYPE ,
			service: this.id ,
			method: 'event' ,
			event: event.name ,
			args: event.args
		} ) ;
		
		callback() ;
		return ;
	}
	
	var triggered = false ;
	var ackId = this.proxy.nextAckId ++ ;
	
	var onAck = function onAck( message ) {
		if ( triggered || message.ack !== ackId ) { return ; }	// Not our ack...
		//if ( message.event !== event ) { return ; }	// Do we care?
		triggered = true ;
		self.internalEvents.off( 'ack' , onAck ) ;
		callback() ;
	} ;
	
	this.internalEvents.on( 'ack' , onAck ) ;
	
	this.proxy.send( {
		__type: MESSAGE_TYPE ,
		service: this.id ,
		method: 'event' ,
		event: event.name ,
		ack: ackId ,
		args: event.args
	} ) ;
} ;

LocalService.forwardWithAck.ack = true ;



			/* Remote Service */



function RemoteService( proxy , id ) { return RemoteService.create( proxy , id ) ; }
//RemoteService.prototype = Object.create( NextGenEvents.prototype ) ;
//RemoteService.prototype.constructor = RemoteService ;
Proxy.RemoteService = RemoteService ;



var EVENT_NO_ACK = 1 ;
var EVENT_ACK = 2 ;



RemoteService.create = function create( proxy , id )
{
	var self = Object.create( RemoteService.prototype , {
		proxy: { value: proxy , enumerable: true } ,
		id: { value: id , enumerable: true } ,
		// This is the emitter where everything is routed to
		emitter: { value: Object.create( NextGenEvents.prototype ) , writable: true , enumerable: true } ,
		internalEvents: { value: Object.create( NextGenEvents.prototype ) , writable: true , enumerable: true } ,
		events: { value: {} , enumerable: true } ,
		destroyed: { value: false , writable: true , enumerable: true } ,
		
		/*	Useless for instance, unless some kind of service capabilities discovery mechanism exists
		canListen: { value: !! options.listen , writable: true , enumerable: true } ,
		canEmit: { value: !! options.emit , writable: true , enumerable: true } ,
		canAck: { value: !! options.ack , writable: true , enumerable: true } ,
		canRpc: { value: !! options.rpc , writable: true , enumerable: true } ,
		*/
	} ) ;
	
	return self ;
} ;



// Destroy a service
RemoteService.prototype.destroy = function destroy()
{
	var self = this ;
	this.emitter.removeAllListeners() ;
	this.emitter = null ;
	Object.keys( this.events ).forEach( function( eventName ) { delete self.events[ eventName ] ; } ) ;
	this.destroyed = true ;
} ;



// Local code want to emit to remote service
RemoteService.prototype.emit = function emit( eventName )
{
	if ( this.destroyed ) { return ; }
	
	var self = this , args , callback , ackId , triggered ;
	
	if ( typeof eventName === 'number' ) { throw new TypeError( 'Cannot emit with a nice value on a remote service' ) ; }
	
	if ( typeof arguments[ arguments.length - 1 ] !== 'function' )
	{
		args = Array.prototype.slice.call( arguments , 1 ) ;
		
		this.proxy.send( {
			__type: MESSAGE_TYPE ,
			service: this.id ,
			method: 'emit' ,
			event: eventName ,
			args: args
		} ) ;
		
		return ;
	}
	
	args = Array.prototype.slice.call( arguments , 1 , -1 ) ;
	callback = arguments[ arguments.length - 1 ] ;
	ackId = this.proxy.nextAckId ++ ;
	triggered = false ;
	
	var onAck = function onAck( message ) {
		if ( triggered || message.ack !== ackId ) { return ; }	// Not our ack...
		//if ( message.event !== event ) { return ; }	// Do we care?
		triggered = true ;
		self.internalEvents.off( 'ack' , onAck ) ;
		callback( message.interruption ) ;
	} ;
	
	this.internalEvents.on( 'ack' , onAck ) ;
	
	this.proxy.send( {
		__type: MESSAGE_TYPE ,
		service: this.id ,
		method: 'emit' ,
		ack: ackId ,
		event: eventName ,
		args: args
	} ) ;
} ;



// Local code want to listen to an event of remote service
RemoteService.prototype.addListener = function addListener( eventName , fn , options )
{
	if ( this.destroyed ) { return ; }
	
	// Manage arguments the same way NextGenEvents#addListener() does
	if ( typeof fn !== 'function' ) { options = fn ; fn = undefined ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	options.fn = fn || options.fn ;
	
	this.emitter.addListener( eventName , options ) ;
	
	// No event was added...
	if ( ! this.emitter.__ngev.listeners[ eventName ] || ! this.emitter.__ngev.listeners[ eventName ].length ) { return ; }
	
	// If the event is successfully listened to and was not remotely listened...
	if ( options.async && this.events[ eventName ] !== EVENT_ACK )
	{
		// We need to listen to or upgrade this event
		this.events[ eventName ] = EVENT_ACK ;
		
		this.proxy.send( {
			__type: MESSAGE_TYPE ,
			service: this.id ,
			method: 'listen' ,
			ack: true ,
			event: eventName
		} ) ;
	}
	else if ( ! options.async && ! this.events[ eventName ] )
	{
		// We need to listen to this event
		this.events[ eventName ] = EVENT_NO_ACK ;
		
		this.proxy.send( {
			__type: MESSAGE_TYPE ,
			service: this.id ,
			method: 'listen' ,
			event: eventName
		} ) ;
	}
} ;

RemoteService.prototype.on = RemoteService.prototype.addListener ;

// This is a shortcut to this.addListener()
RemoteService.prototype.once = NextGenEvents.prototype.once ;



// Local code want to ignore an event of remote service
RemoteService.prototype.removeListener = function removeListener( eventName , id )
{
	if ( this.destroyed ) { return ; }
	
	this.emitter.removeListener( eventName , id ) ;
	
	// If no more listener are locally tied to with event and the event was remotely listened...
	if (
		( ! this.emitter.__ngev.listeners[ eventName ] || ! this.emitter.__ngev.listeners[ eventName ].length ) &&
		this.events[ eventName ]
	)
	{
		this.events[ eventName ] = 0 ;
		
		this.proxy.send( {
			__type: MESSAGE_TYPE ,
			service: this.id ,
			method: 'ignore' ,
			event: eventName
		} ) ;
	}
} ;

RemoteService.prototype.off = RemoteService.prototype.removeListener ;



// A remote service sent an event we are listening to, emit on the service representing the remote
RemoteService.prototype.receiveEvent = function receiveEvent( message )
{
	var self = this ;
	
	if ( this.destroyed || ! this.events[ message.event ] ) { return ; }
	
	var event = {
		emitter: this.emitter ,
		name: message.event ,
		args: message.args || [] 
	} ;
	
	if ( message.ack )
	{
		event.callback = function ack() {
			
			self.proxy.send( {
				__type: MESSAGE_TYPE ,
				service: self.id ,
				method: 'ackEvent' ,
				ack: message.ack ,
				event: message.event
			} ) ;
		} ;
	}
	
	NextGenEvents.emitEvent( event ) ;
	
	var eventName = event.name ;
	
	// Here we should catch if the event is still listened to ('once' type listeners)
	//if ( this.events[ eventName ]	) // not needed, already checked at the begining of the function
	if ( ! this.emitter.__ngev.listeners[ eventName ] || ! this.emitter.__ngev.listeners[ eventName ].length )
	{
		this.events[ eventName ] = 0 ;
		
		this.proxy.send( {
			__type: MESSAGE_TYPE ,
			service: this.id ,
			method: 'ignore' ,
			event: eventName
		} ) ;
	}
} ;



// 
RemoteService.prototype.receiveAckEmit = function receiveAckEmit( message )
{
	if ( this.destroyed || ! message.ack || this.events[ message.event ] !== EVENT_ACK )
	{
		return ;
	}
	
	this.internalEvents.emit( 'ack' , message ) ;
} ;



},{"./NextGenEvents.js":41}],43:[function(require,module,exports){
module.exports={
  "_args": [
    [
      {
        "raw": "nextgen-events@0.9.8",
        "scope": null,
        "escapedName": "nextgen-events",
        "name": "nextgen-events",
        "rawSpec": "0.9.8",
        "spec": "0.9.8",
        "type": "version"
      },
      "/home/cedric/inside/github/tea-time"
    ]
  ],
  "_from": "nextgen-events@0.9.8",
  "_id": "nextgen-events@0.9.8",
  "_inCache": true,
  "_location": "/nextgen-events",
  "_nodeVersion": "4.5.0",
  "_npmOperationalInternal": {
    "host": "packages-16-east.internal.npmjs.com",
    "tmp": "tmp/nextgen-events-0.9.8.tgz_1473951316005_0.2686476525850594"
  },
  "_npmUser": {
    "name": "cronvel",
    "email": "cedric.ronvel@gmail.com"
  },
  "_npmVersion": "2.15.9",
  "_phantomChildren": {},
  "_requested": {
    "raw": "nextgen-events@0.9.8",
    "scope": null,
    "escapedName": "nextgen-events",
    "name": "nextgen-events",
    "rawSpec": "0.9.8",
    "spec": "0.9.8",
    "type": "version"
  },
  "_requiredBy": [
    "#USER",
    "/",
    "/async-kit"
  ],
  "_resolved": "https://registry.npmjs.org/nextgen-events/-/nextgen-events-0.9.8.tgz",
  "_shasum": "ed1712c2b37dad55407b3e941672d1568c3a4630",
  "_shrinkwrap": null,
  "_spec": "nextgen-events@0.9.8",
  "_where": "/home/cedric/inside/github/tea-time",
  "author": {
    "name": "Cédric Ronvel"
  },
  "bugs": {
    "url": "https://github.com/cronvel/nextgen-events/issues"
  },
  "copyright": {
    "title": "Next-Gen Events",
    "years": [
      2015,
      2016
    ],
    "owner": "Cédric Ronvel"
  },
  "dependencies": {},
  "description": "The next generation of events handling for javascript! New: abstract away the network!",
  "devDependencies": {
    "browserify": "^13.0.1",
    "expect.js": "^0.3.1",
    "jshint": "^2.9.2",
    "mocha": "^2.5.3",
    "uglify-js": "^2.6.2",
    "ws": "^1.1.1"
  },
  "directories": {
    "test": "test"
  },
  "dist": {
    "shasum": "ed1712c2b37dad55407b3e941672d1568c3a4630",
    "tarball": "https://registry.npmjs.org/nextgen-events/-/nextgen-events-0.9.8.tgz"
  },
  "gitHead": "e91559128a1653ed3b58dcadefcac62aa7056207",
  "homepage": "https://github.com/cronvel/nextgen-events#readme",
  "keywords": [
    "events",
    "async",
    "emit",
    "listener",
    "context",
    "series",
    "serialize",
    "namespace",
    "proxy",
    "network"
  ],
  "license": "MIT",
  "main": "lib/NextGenEvents.js",
  "maintainers": [
    {
      "name": "cronvel",
      "email": "cedric.ronvel@gmail.com"
    }
  ],
  "name": "nextgen-events",
  "optionalDependencies": {},
  "readme": "ERROR: No README data found!",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/cronvel/nextgen-events.git"
  },
  "scripts": {
    "test": "mocha -R dot"
  },
  "version": "0.9.8"
}

},{}],44:[function(require,module,exports){
'use strict';

// modified from https://github.com/es-shims/es5-shim
var has = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var slice = Array.prototype.slice;
var isArgs = require('./isArguments');
var isEnumerable = Object.prototype.propertyIsEnumerable;
var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
var dontEnums = [
	'toString',
	'toLocaleString',
	'valueOf',
	'hasOwnProperty',
	'isPrototypeOf',
	'propertyIsEnumerable',
	'constructor'
];
var equalsConstructorPrototype = function (o) {
	var ctor = o.constructor;
	return ctor && ctor.prototype === o;
};
var excludedKeys = {
	$console: true,
	$external: true,
	$frame: true,
	$frameElement: true,
	$frames: true,
	$innerHeight: true,
	$innerWidth: true,
	$outerHeight: true,
	$outerWidth: true,
	$pageXOffset: true,
	$pageYOffset: true,
	$parent: true,
	$scrollLeft: true,
	$scrollTop: true,
	$scrollX: true,
	$scrollY: true,
	$self: true,
	$webkitIndexedDB: true,
	$webkitStorageInfo: true,
	$window: true
};
var hasAutomationEqualityBug = (function () {
	/* global window */
	if (typeof window === 'undefined') { return false; }
	for (var k in window) {
		try {
			if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
				try {
					equalsConstructorPrototype(window[k]);
				} catch (e) {
					return true;
				}
			}
		} catch (e) {
			return true;
		}
	}
	return false;
}());
var equalsConstructorPrototypeIfNotBuggy = function (o) {
	/* global window */
	if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
		return equalsConstructorPrototype(o);
	}
	try {
		return equalsConstructorPrototype(o);
	} catch (e) {
		return false;
	}
};

var keysShim = function keys(object) {
	var isObject = object !== null && typeof object === 'object';
	var isFunction = toStr.call(object) === '[object Function]';
	var isArguments = isArgs(object);
	var isString = isObject && toStr.call(object) === '[object String]';
	var theKeys = [];

	if (!isObject && !isFunction && !isArguments) {
		throw new TypeError('Object.keys called on a non-object');
	}

	var skipProto = hasProtoEnumBug && isFunction;
	if (isString && object.length > 0 && !has.call(object, 0)) {
		for (var i = 0; i < object.length; ++i) {
			theKeys.push(String(i));
		}
	}

	if (isArguments && object.length > 0) {
		for (var j = 0; j < object.length; ++j) {
			theKeys.push(String(j));
		}
	} else {
		for (var name in object) {
			if (!(skipProto && name === 'prototype') && has.call(object, name)) {
				theKeys.push(String(name));
			}
		}
	}

	if (hasDontEnumBug) {
		var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

		for (var k = 0; k < dontEnums.length; ++k) {
			if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
				theKeys.push(dontEnums[k]);
			}
		}
	}
	return theKeys;
};

keysShim.shim = function shimObjectKeys() {
	if (Object.keys) {
		var keysWorksWithArguments = (function () {
			// Safari 5.0 bug
			return (Object.keys(arguments) || '').length === 2;
		}(1, 2));
		if (!keysWorksWithArguments) {
			var originalKeys = Object.keys;
			Object.keys = function keys(object) {
				if (isArgs(object)) {
					return originalKeys(slice.call(object));
				} else {
					return originalKeys(object);
				}
			};
		}
	} else {
		Object.keys = keysShim;
	}
	return Object.keys || keysShim;
};

module.exports = keysShim;

},{"./isArguments":45}],45:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;

module.exports = function isArguments(value) {
	var str = toStr.call(value);
	var isArgs = str === '[object Arguments]';
	if (!isArgs) {
		isArgs = str !== '[object Array]' &&
			value !== null &&
			typeof value === 'object' &&
			typeof value.length === 'number' &&
			value.length >= 0 &&
			toStr.call(value.callee) === '[object Function]';
	}
	return isArgs;
};

},{}],46:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":47}],47:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],48:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],49:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],50:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],51:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":49,"./encode":50}],52:[function(require,module,exports){
/*
	String Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



// To solve dependency hell, we do not rely on terminal-kit anymore.
module.exports = {
	reset: '\x1b[0m' ,
	bold: '\x1b[1m' ,
	dim: '\x1b[2m' ,
	italic: '\x1b[3m' ,
	underline: '\x1b[4m' ,
	inverse: '\x1b[7m' ,
	defaultColor: '\x1b[39m' ,
	black: '\x1b[30m' ,
	red: '\x1b[31m' ,
	green: '\x1b[32m' ,
	yellow: '\x1b[33m' ,
	blue: '\x1b[34m' ,
	magenta: '\x1b[35m' ,
	cyan: '\x1b[36m' ,
	white: '\x1b[37m' ,
	brightBlack: '\x1b[90m' ,
	brightRed: '\x1b[91m' ,
	brightGreen: '\x1b[92m' ,
	brightYellow: '\x1b[93m' ,
	brightBlue: '\x1b[94m' ,
	brightMagenta: '\x1b[95m' ,
	brightCyan: '\x1b[96m' ,
	brightWhite: '\x1b[97m' ,
} ;



},{}],53:[function(require,module,exports){
/*
	String Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



var camel = {} ;
module.exports = camel ;



// Transform alphanum separated by underscore or minus to camel case
camel.toCamelCase = function toCamelCase( str )
{
	if ( ! str || typeof str !== 'string' ) { return '' ; }
	
	return str.replace( /^[\s_-]*([^\s_-]+)|[\s_-]+([^\s_-]?)([^\s_-]*)/g , function( match , firstWord , firstLetter , endOfWord ) {
		
		if ( firstWord ) { return firstWord.toLowerCase() ; }
		if ( ! firstLetter ) { return '' ; }
		return firstLetter.toUpperCase() + endOfWord.toLowerCase() ;
	} ) ;
} ;



// Transform camel case to alphanum separated by minus
camel.camelCaseToDashed = function camelCaseToDashed( str )
{
	if ( ! str || typeof str !== 'string' ) { return '' ; }
	
	return str.replace( /^([A-Z])|([A-Z])/g , function( match , firstLetter , letter ) {
		
		if ( firstLetter ) { return firstLetter.toLowerCase() ; }
		return '-' + letter.toLowerCase() ;
	} ) ;
} ;



},{}],54:[function(require,module,exports){
/*
	String Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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

/*
	Escape collection.
*/



"use strict" ;



// Load modules
//var tree = require( 'tree-kit' ) ;



// From Mozilla Developper Network
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
exports.regExp = exports.regExpPattern = function escapeRegExpPattern( str ) {
	return str.replace( /([.*+?^${}()|\[\]\/\\])/g , '\\$1' ) ;
} ;

exports.regExpReplacement = function escapeRegExpReplacement( str ) {
	return str.replace( /\$/g , '$$$$' ) ;	// This replace any single $ by a double $$
} ;



exports.format = function escapeFormat( str ) {
	return str.replace( /%/g , '%%' ) ;	// This replace any single % by a double %%
} ;



exports.jsSingleQuote = function escapeJsSingleQuote( str ) {
	return exports.control( str ).replace( /'/g , "\\'" ) ;
} ;

exports.jsDoubleQuote = function escapeJsDoubleQuote( str ) {
	return exports.control( str ).replace( /"/g , '\\"' ) ;
} ;



exports.shellArg = function escapeShellArg( str ) {
	return '\'' + str.replace( /\'/g , "'\\''" ) + '\'' ;
} ;



var escapeControlMap = { '\r': '\\r', '\n': '\\n', '\t': '\\t', '\x7f': '\\x7f' } ;

// Escape \r \n \t so they become readable again, escape all ASCII control character as well, using \x syntaxe
exports.control = function escapeControl( str ) {
	return str.replace( /[\x00-\x1f\x7f]/g , function( match ) {
		if ( escapeControlMap[ match ] !== undefined ) { return escapeControlMap[ match ] ; }
		var hex = match.charCodeAt( 0 ).toString( 16 ) ;
		if ( hex.length % 2 ) { hex = '0' + hex ; }
		return '\\x' + hex ;
	} ) ;
} ;



var escapeHtmlMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' } ;

// Only escape & < > so this is suited for content outside tags
exports.html = function escapeHtml( str ) {
	return str.replace( /[&<>]/g , function( match ) { return escapeHtmlMap[ match ] ; } ) ;
} ;

// Escape & < > " so this is suited for content inside a double-quoted attribute
exports.htmlAttr = function escapeHtmlAttr( str ) {
	return str.replace( /[&<>"]/g , function( match ) { return escapeHtmlMap[ match ] ; } ) ;
} ;

// Escape all html special characters & < > " '
exports.htmlSpecialChars = function escapeHtmlSpecialChars( str ) {
	return str.replace( /[&<>"']/g , function( match ) { return escapeHtmlMap[ match ] ; } ) ;
} ;



},{}],55:[function(require,module,exports){
/*
	String Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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

/*
	String formater, inspired by C's sprintf().
*/



"use strict" ;



// Load modules
//var tree = require( 'tree-kit' ) ;
var inspect = require( './inspect.js' ).inspect ;
var inspectError = require( './inspect.js' ).inspectError ;
var ansi = require( './ansi.js' ) ;



/*
	%%		a single %
	%s		string
	%f		float
	%d	%i	integer
	%u		unsigned integer
	%U		unsigned positive integer (>0)
	%h		hexadecimal
	%x		hexadecimal, force pair of symbols (e.g. 'f' -> '0f')
	%o		octal
	%b		binary
	%I		call string-kit's inspect()
	%Y		call string-kit's inspect(), but do not inspect non-enumerable
	%E		call string-kit's inspectError()
	%J		JSON.stringify()
	%D		drop
	%F		filter function existing in the 'this' context, e.g. %[filter:%a%a]F
	%a		argument for a function
	
	Candidate format:
	%A		for automatic type?
	%c		for char? (can receive a string or an integer translated into an UTF8 chars)
	%C		for currency formating?
	%B		for Buffer objects?
	%e		for scientific notation?
*/

exports.formatMethod = function format( str )
{
	if ( typeof str !== 'string' )
	{
		if ( str === null || str === undefined ) { return '' ; }
		else if ( /*str && typeof str === 'object' && */ typeof str.toString === 'function' ) { str = str.toString() ; }
		else { return '' ; }
	}
	
	var self = this , arg , value ,
		autoIndex = 1 , args = arguments , length = arguments.length ,
		hasMarkup = false , markupStack = [] ;
	
	//console.log( 'format args:' , arguments ) ;
	
	// /!\ each changes here should be reported on string.format.count() and string.format.hasFormatting() too /!\
	//str = str.replace( /\^(.?)|%(?:([+-]?)([0-9]*)(?:\/([^\/]*)\/)?([a-zA-Z%])|\[([a-zA-Z0-9_]+)(?::([^\]]*))?\])/g ,
	str = str.replace( /\^(.?)|(%%)|%([+-]?)([0-9]*)(?:\[([^\]]*)\])?([a-zA-Z])/g ,
		function( match , markup , doublePercent , relative , index , modeArg , mode ) {		// jshint ignore:line
			
			var replacement , i , n , tmp , fn , fnArgString , argMatches , argList = [] ;
			
			//console.log( 'replaceArgs:' , arguments ) ;
			if ( doublePercent ) { return '%'; }
			
			if ( markup )
			{
				if ( markup === '^' ) { return '^' ; }
				if ( ! self.markup || ! self.markup[ markup ] ) { return '' ; }
				hasMarkup = true ;
				
				if ( typeof self.markup[ markup ] === 'function' )
				{
					replacement = self.markup[ markup ]( markupStack ) ;
					// method should manage markup stack themselves
				}
				else
				{
					replacement = self.markup[ markup ] ;
					markupStack.push( replacement ) ;
				}
				
				return replacement ;
			}
			
			
			if ( index )
			{
				index = parseInt( index ) ;
				
				if ( relative )
				{
					if ( relative === '+' ) { index = autoIndex + index ; }
					else if ( relative === '-' ) { index = autoIndex - index ; }
				}
			}
			else
			{
				index = autoIndex ;
			}
			
			autoIndex ++ ;
			
			if ( index >= length || index < 1 ) { arg = undefined ; }
			else { arg = args[ index ] ; }
			
			switch ( mode )
			{
				case 's' :	// string
					if ( arg === null || arg === undefined ) { return '' ; }
					if ( typeof arg === 'string' ) { return arg ; }
					if ( typeof arg === 'number' ) { return '' + arg ; }
					if ( typeof arg.toString === 'function' ) { return arg.toString() ; }
					return '' ;
				case 'f' :	// float
					if ( typeof arg === 'string' ) { arg = parseFloat( arg ) ; }
					if ( typeof arg !== 'number' ) { return '0' ; }
					if ( modeArg !== undefined )
					{
						// Use jQuery number format?
						switch ( modeArg[ 0 ] )
						{
							case 'p' :
								n = parseInt( modeArg.slice( 1 ) , 10 ) ;
								if ( n >= 1 ) { arg = arg.toPrecision( n ) ; }
								break ;
							case 'f' :
								n = parseInt( modeArg.slice( 1 ) , 10 ) ;
								arg = arg.toFixed( n ) ;
								break ;
						}
					}
					return '' + arg ;
				case 'd' :
				case 'i' :	// integer decimal
					if ( typeof arg === 'string' ) { arg = parseInt( arg ) ; }
					if ( typeof arg === 'number' ) { return '' + Math.floor( arg ) ; }
					return '0' ;
				case 'u' :	// unsigned decimal
					if ( typeof arg === 'string' ) { arg = parseInt( arg ) ; }
					if ( typeof arg === 'number' ) { return '' + Math.max( Math.floor( arg ) , 0 ) ; }
					return '0' ;
				case 'U' :	// unsigned positive decimal
					if ( typeof arg === 'string' ) { arg = parseInt( arg ) ; }
					if ( typeof arg === 'number' ) { return '' + Math.max( Math.floor( arg ) , 1 ) ; }
					return '1' ;
				case 'x' :	// unsigned hexadecimal, force pair of symbole
					if ( typeof arg === 'string' ) { arg = parseInt( arg ) ; }
					if ( typeof arg !== 'number' ) { return '0' ; }
					value = '' + Math.max( Math.floor( arg ) , 0 ).toString( 16 ) ;
					if ( value.length % 2 ) { value = '0' + value ; }
					return value ;
				case 'h' :	// unsigned hexadecimal
					if ( typeof arg === 'string' ) { arg = parseInt( arg ) ; }
					if ( typeof arg === 'number' ) { return '' + Math.max( Math.floor( arg ) , 0 ).toString( 16 ) ; }
					return '0' ;
				case 'o' :	// unsigned octal
					if ( typeof arg === 'string' ) { arg = parseInt( arg ) ; }
					if ( typeof arg === 'number' ) { return '' + Math.max( Math.floor( arg ) , 0 ).toString( 8 ) ; }
					return '0' ;
				case 'b' :	// unsigned binary
					if ( typeof arg === 'string' ) { arg = parseInt( arg ) ; }
					if ( typeof arg === 'number' ) { return '' + Math.max( Math.floor( arg ) , 0 ).toString( 2 ) ; }
					return '0' ;
				case 'I' :
					return inspect( { style: ( self && self.color ? 'color' : 'none' ) } , arg ) ;
				case 'Y' :
					return inspect( {
							style: ( self && self.color ? 'color' : 'none' ) ,
							noFunc: true ,
							enumOnly: true ,
							noDescriptor: true
						} ,
						arg ) ;
				case 'E' :
					return inspectError( { style: ( self && self.color ? 'color' : 'none' ) } , arg ) ;
				case 'J' :
					return JSON.stringify( arg ) ;
				case 'D' :
					return '' ;
				case 'F' :	// Function
					
					autoIndex -- ;	// %F does not eat any arg
					
					if ( modeArg === undefined ) { return '' ; }
					tmp = modeArg.split( ':' ) ;
					fn = tmp[ 0 ] ;
					fnArgString = tmp[ 1 ] ;
					if ( ! fn ) { return '' ; }
					
					if ( fnArgString && ( argMatches = fnArgString.match( /%([+-]?)([0-9]*)[a-zA-Z]/g ) ) )
					{
						//console.log( argMatches ) ;
						//console.log( fnArgString ) ;
						for ( i = 0 ; i < argMatches.length ; i ++ )
						{
							relative = argMatches[ i ][ 1 ] ;
							index = argMatches[ i ][ 2 ] ;
							
							if ( index )
							{
								index = parseInt( index , 10 ) ;
								
								if ( relative )
								{
									if ( relative === '+' ) { index = autoIndex + index ; }		// jshint ignore:line
									else if ( relative === '-' ) { index = autoIndex - index ; }	// jshint ignore:line
								}
							}
							else
							{
								index = autoIndex ;
							}
							
							autoIndex ++ ;
							
							if ( index >= length || index < 1 ) { argList[ i ] = undefined ; }
							else { argList[ i ] = args[ index ] ; }
						}
					}
					
					if ( ! self || ! self.fn || typeof self.fn[ fn ] !== 'function' ) { return '' ; }
					return self.fn[ fn ].apply( self , argList ) ;
				
				default :
					return '' ;
			}
	} ) ;
	
	if ( hasMarkup && this.markupReset && this.endingMarkupReset )
	{
		str += typeof this.markupReset === 'function' ? this.markupReset( markupStack ) : this.markupReset ;
	}
	
	if ( this.extraArguments )
	{
		for ( ; autoIndex < length ; autoIndex ++ )
		{
			arg = args[ autoIndex ] ;
			if ( arg === null || arg === undefined ) { continue ; }
			else if ( typeof arg === 'string' ) { str += arg ; }
			else if ( typeof arg === 'number' ) { str += arg ; }
			else if ( typeof arg.toString === 'function' ) { str += arg.toString() ; }
		}
	}
	
	return str ;
} ;



var defaultFormatter = {
	extraArguments: true ,
	endingMarkupReset: true ,
	markupReset: ansi.reset ,
	markup: {
		":": ansi.reset ,
		" ": ansi.reset + " " ,
		
		"-": ansi.dim ,
		"+": ansi.bold ,
		"_": ansi.underline ,
		"/": ansi.italic ,
		"!": ansi.inverse ,
		
		"b": ansi.blue ,
		"B": ansi.brightBlue ,
		"c": ansi.cyan ,
		"C": ansi.brightCyan ,
		"g": ansi.green ,
		"G": ansi.brightGreen ,
		"k": ansi.black ,
		"K": ansi.brightBlack ,
		"m": ansi.magenta ,
		"M": ansi.brightMagenta ,
		"r": ansi.red ,
		"R": ansi.brightRed ,
		"w": ansi.white ,
		"W": ansi.brightWhite ,
		"y": ansi.yellow ,
		"Y": ansi.brightYellow
	}
} ;

exports.format = exports.formatMethod.bind( defaultFormatter ) ;
exports.format.default = defaultFormatter ;



exports.markupMethod = function markup( str )
{
	if ( typeof str !== 'string' )
	{
		if ( str === null || str === undefined ) { return '' ; }
		else if ( /*str && typeof str === 'object' && */ typeof str.toString === 'function' ) { str = str.toString() ; }
		else { return '' ; }
	}
	
	var self = this , hasMarkup = false , markupStack = [] ;
	
	//console.log( 'format args:' , arguments ) ;
	
	str = str.replace( /\^(.?)/g , function( match , markup ) {
		var replacement ;
		
		if ( markup === '^' ) { return '^' ; }
		if ( ! self.markup || ! self.markup[ markup ] ) { return '' ; }
		hasMarkup = true ;
		
		if ( typeof self.markup[ markup ] === 'function' )
		{
			replacement = self.markup[ markup ]( markupStack ) ;
			// method should manage markup stack themselves
		}
		else
		{
			replacement = self.markup[ markup ] ;
			markupStack.push( replacement ) ;
		}
		
		return replacement ;
	} ) ;
	
	if ( hasMarkup && this.markupReset && this.endingMarkupReset )
	{
		str += typeof this.markupReset === 'function' ? this.markupReset( markupStack ) : this.markupReset ;
	}
	
	return str ;
} ;

exports.markup = exports.markupMethod.bind( defaultFormatter ) ;



// Count the number of parameters needed for this string
exports.format.count = function formatCount( str )
{
	var match , index , relative , autoIndex = 1 , maxIndex = 0 ;
	
	if ( typeof str !== 'string' ) { return 0 ; }
	
	// This regex differs slightly from the main regex: we do not count '%%' and %F is excluded
	var regexp = /%([+-]?)([0-9]*)(?:\[([^\]]*)\])?([a-zA-EG-Z])/g ;
	
	
	while ( ( match = regexp.exec( str ) ) !== null )
	{
		//console.log( match ) ;
		relative = match[ 1 ] ;
		index = match[ 2 ] ;
		
		if ( index )
		{
			index = parseInt( index , 10 ) ;
			
			if ( relative )
			{
				if ( relative === '+' ) { index = autoIndex + index ; }
				else if ( relative === '-' ) { index = autoIndex - index ; }
			}
		}
		else
		{
			index = autoIndex ;
		}
		
		autoIndex ++ ;
		
		if ( maxIndex < index ) { maxIndex = index ; }
	}
	
	return maxIndex ;
} ;



// Tell if this string contains formatter chars
exports.format.hasFormatting = function hasFormatting( str )
{
	if ( str.search( /\^(.?)|(%%)|%([+-]?)([0-9]*)(?:\[([^\]]*)\])?([a-zA-Z])/ ) !== -1 ) { return true ; }
	else { return false ; }
} ;



},{"./ansi.js":52,"./inspect.js":56}],56:[function(require,module,exports){
(function (Buffer,process){
/*
	String Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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

/* global Map, Set */

/*
	Variable inspector.
*/



"use strict" ;



// Load modules
var treeExtend = require( 'tree-kit/lib/extend.js' ) ;
var escape = require( './escape.js' ) ;
var ansi = require( './ansi.js' ) ;



/*
	Inspect a variable, return a string ready to be displayed with console.log(), or even as an HTML output.
	
	Options:
		* style:
			* 'none': (default) normal output suitable for console.log() or writing in a file
			* 'color': colorful output suitable for terminal
			* 'html': html output
		* depth: depth limit, default: 3
		* noFunc: do not display functions
		* noDescriptor: do not display descriptor information
		* noType: do not display type and constructor
		* enumOnly: only display enumerable properties
		* funcDetails: display function's details
		* proto: display object's prototype
		* sort: sort the keys
		* minimal: imply noFunc: true, noDescriptor: true, noType: true, enumOnly: true, proto: false and funcDetails: false.
		  Display a minimal JSON-like output
		* useInspect? use .inspect() method when available on an object
*/

function inspect( options , variable )
{
	if ( arguments.length < 2 ) { variable = options ; options = {} ; }
	else if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	var runtime = { depth: 0 , ancestors: [] } ;
	
	if ( ! options.style ) { options.style = inspectStyle.none ; }
	else if ( typeof options.style === 'string' ) { options.style = inspectStyle[ options.style ] ; }
	
	if ( options.depth === undefined ) { options.depth = 3 ; }
	
	// /!\ nofunc is deprecated
	if ( options.nofunc ) { options.noFunc = true ; }
	
	if ( options.minimal )
	{
		options.noFunc = true ;
		options.noDescriptor = true ;
		options.noType = true ;
		options.enumOnly = true ;
		options.funcDetails = false ;
		options.proto = false ;
	}
	
	return inspect_( runtime , options , variable ) ;
}



function inspect_( runtime , options , variable )
{
	var i , funcName , length , propertyList , constructor , keyIsProperty ,
		type , pre , indent , isArray , isFunc , specialObject ,
		str = '' , key = '' , descriptorStr = '' , descriptor , nextAncestors ;
	
	
	// Prepare things (indentation, key, descriptor, ... )
	
	type = typeof variable ;
	indent = options.style.tab.repeat( runtime.depth ) ;
	
	if ( type === 'function' && options.noFunc ) { return '' ; }
	
	if ( runtime.key !== undefined )
	{
		if ( runtime.descriptor )
		{
			descriptorStr = [] ;
			
			if ( ! runtime.descriptor.configurable ) { descriptorStr.push( '-conf' ) ; }
			if ( ! runtime.descriptor.enumerable ) { descriptorStr.push( '-enum' ) ; }
			
			// Already displayed by runtime.forceType
			//if ( runtime.descriptor.get || runtime.descriptor.set ) { descriptorStr.push( 'getter/setter' ) ; } else
			if ( ! runtime.descriptor.writable ) { descriptorStr.push( '-w' ) ; }
			
			//if ( descriptorStr.length ) { descriptorStr = '(' + descriptorStr.join( ' ' ) + ')' ; }
			if ( descriptorStr.length ) { descriptorStr = descriptorStr.join( ' ' ) ; }
			else { descriptorStr = '' ; }
		}
		
		if ( runtime.keyIsProperty )
		{
			if ( keyNeedingQuotes( runtime.key ) )
			{
				key = '"' + options.style.key( runtime.key ) + '": ' ;
			}
			else
			{
				key = options.style.key( runtime.key ) + ': ' ;
			}
		}
		else
		{
			key = '[' + options.style.index( runtime.key ) + '] ' ;
		}
		
		if ( descriptorStr ) { descriptorStr = ' ' + options.style.type( descriptorStr ) ; }
	}
	
	pre = runtime.noPre ? '' : indent + key ;
	
	
	// Describe the current variable
	
	if ( variable === undefined )
	{
		str += pre + options.style.constant( 'undefined' ) + descriptorStr + options.style.nl ;
	}
	else if ( variable === null )
	{
		str += pre + options.style.constant( 'null' ) + descriptorStr + options.style.nl ;
	}
	else if ( variable === false )
	{
		str += pre + options.style.constant( 'false' ) + descriptorStr + options.style.nl ;
	}
	else if ( variable === true )
	{
		str += pre + options.style.constant( 'true' ) + descriptorStr + options.style.nl ;
	}
	else if ( type === 'number' )
	{
		str += pre + options.style.number( variable.toString() ) +
			( options.noType ? '' : ' ' + options.style.type( 'number' ) ) +
			descriptorStr + options.style.nl ;
	}
	else if ( type === 'string' )
	{
		str += pre + '"' + options.style.string( escape.control( variable ) ) + '" ' +
			( options.noType ? '' : options.style.type( 'string' ) + options.style.length( '(' + variable.length + ')' ) ) +
			descriptorStr + options.style.nl ;
	}
	else if ( Buffer.isBuffer( variable ) )
	{
		str += pre + options.style.inspect( variable.inspect() ) + ' ' +
			( options.noType ? '' : options.style.type( 'Buffer' ) + options.style.length( '(' + variable.length + ')' ) ) +
			descriptorStr + options.style.nl ;
	}
	else if ( type === 'object' || type === 'function' )
	{
		funcName = length = '' ;
		isFunc = false ;
		if ( type === 'function' )
		{
			isFunc = true ;
			funcName = ' ' + options.style.funcName( ( variable.name ? variable.name : '(anonymous)' ) ) ;
			length = options.style.length( '(' + variable.length + ')' ) ;
		}
		
		isArray = false ;
		if ( Array.isArray( variable ) )
		{
			isArray = true ;
			length = options.style.length( '(' + variable.length + ')' ) ;
		}
		
		if ( ! variable.constructor ) { constructor = '(no constructor)' ; }
		else if ( ! variable.constructor.name ) { constructor = '(anonymous)' ; }
		else { constructor = variable.constructor.name ; }
		
		constructor = options.style.constructorName( constructor ) ;
		
		str += pre ;
		
		if ( ! options.noType )
		{
			if ( runtime.forceType ) { str += options.style.type( runtime.forceType ) ; }
			else { str += constructor + funcName + length + ' ' + options.style.type( type ) + descriptorStr ; }
			
			if ( ! isFunc || options.funcDetails ) { str += ' ' ; }	// if no funcDetails imply no space here
		}
		
		propertyList = Object.getOwnPropertyNames( variable ) ;
		
		if ( options.sort ) { propertyList.sort() ; }
		
		// Special Objects
		specialObject = specialObjectSubstitution( variable ) ;
		
		if ( specialObject !== undefined )
		{
			str += '=> ' + inspect_( {
					depth: runtime.depth ,
					ancestors: runtime.ancestors ,
					noPre: true
				} ,
				options ,
				specialObject
			) ;
		}
		else if ( isFunc && ! options.funcDetails )
		{
			str += options.style.nl ;
		}
		else if ( ! propertyList.length && ! options.proto )
		{
			str += '{}' + options.style.nl ;
		}
		else if ( runtime.depth >= options.depth )
		{
			str += options.style.limit( '[depth limit]' ) + options.style.nl ;
		}
		else if ( runtime.ancestors.indexOf( variable ) !== -1 )
		{
			str += options.style.limit( '[circular]' ) + options.style.nl ;
		}
		else
		{
			str += ( isArray && options.noType ? '[' : '{' ) + options.style.nl ;
			
			// Do not use .concat() here, it doesn't works as expected with arrays...
			nextAncestors = runtime.ancestors.slice() ;
			nextAncestors.push( variable ) ;
			
			for ( i = 0 ; i < propertyList.length ; i ++ )
			{
				try {
					descriptor = Object.getOwnPropertyDescriptor( variable , propertyList[ i ] ) ;
					
					if ( ! descriptor.enumerable && options.enumOnly ) { continue ; }
					
					keyIsProperty = ! isArray || ! descriptor.enumerable || isNaN( propertyList[ i ] ) ;
					
					if ( ! options.noDescriptor && ( descriptor.get || descriptor.set ) )
					{
						str += inspect_( {
								depth: runtime.depth + 1 ,
								ancestors: nextAncestors ,
								key: propertyList[ i ] ,
								keyIsProperty: keyIsProperty ,
								descriptor: descriptor ,
								forceType: 'getter/setter'
							} ,
							options ,
							{ get: descriptor.get , set: descriptor.set }
						) ;
					}
					else
					{
						str += inspect_( {
								depth: runtime.depth + 1 ,
								ancestors: nextAncestors ,
								key: propertyList[ i ] ,
								keyIsProperty: keyIsProperty ,
								descriptor: options.noDescriptor ? undefined : descriptor
							} ,
							options ,
							variable[ propertyList[ i ] ]
						) ;
					}
				}
				catch ( error ) {
					str += inspect_( {
							depth: runtime.depth + 1 ,
							ancestors: nextAncestors ,
							key: propertyList[ i ] ,
							keyIsProperty: keyIsProperty ,
							descriptor: options.noDescriptor ? undefined : descriptor
						} ,
						options ,
						error
					) ;
				}
			}
			
			if ( options.proto )
			{
				str += inspect_( {
						depth: runtime.depth + 1 ,
						ancestors: nextAncestors ,
						key: '__proto__' ,
						keyIsProperty: true
					} ,
					options ,
					variable.__proto__	// jshint ignore:line
				) ;
			}
			
			str += indent + ( isArray && options.noType ? ']' : '}' ) + options.style.nl ;
		}
	}
	
	
	// Finalizing
	
	if ( runtime.depth === 0 )
	{
		if ( options.style === 'html' ) { str = escape.html( str ) ; }
	}
	
	return str ;
}

exports.inspect = inspect ;



function keyNeedingQuotes( key )
{
	if ( ! key.length ) { return true ; }
	return false ;
}



// Some special object are better written down when substituted by something else
function specialObjectSubstitution( variable )
{
	switch ( variable.constructor.name )
	{
		case 'Date' :
			if ( variable instanceof Date )
			{
				return variable.toString() + ' [' + variable.getTime() + ']' ;
			}
			break ;
		case 'Set' :
			if ( typeof Set === 'function' && variable instanceof Set )
			{
				// This is an ES6 'Set' Object
				return Array.from( variable ) ;
			}
			break ;
		case 'Map' :
			if ( typeof Map === 'function' && variable instanceof Map )
			{
				// This is an ES6 'Map' Object
				return Array.from( variable ) ;
			}
			break ;
		case 'ObjectID' :
			if ( variable._bsontype )
			{
				// This is a MongoDB ObjectID, rather boring to display in its original form
				// due to esoteric characters that confuse both the user and the terminal displaying it.
				// Substitute it to its string representation
				return variable.toString() ;
			}
			break ;
	}
	
	return ;
}



function inspectError( options , error )
{
	var str = '' , stack , type , code ;
	
	if ( arguments.length < 2 ) { error = options ; options = {} ; }
	else if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	if ( ! ( error instanceof Error ) ) { return  ; }
	
	if ( ! options.style ) { options.style = inspectStyle.none ; }
	else if ( typeof options.style === 'string' ) { options.style = inspectStyle[ options.style ] ; }
	
	if ( error.stack ) { stack = inspectStack( options , error.stack ) ; }
	
	type = error.type || error.constructor.name ;
	code = error.code || error.name || error.errno || error.number ;
	
	str += options.style.errorType( type ) +
		( code ? ' [' + options.style.errorType( code ) + ']' : '' ) + ': ' ;
	str += options.style.errorMessage( error.message ) + '\n' ;
	
	if ( stack ) { str += options.style.errorStack( stack ) + '\n' ; }
	
	return str ;
}

exports.inspectError = inspectError ;



function inspectStack( options , stack )
{
	if ( arguments.length < 2 ) { stack = options ; options = {} ; }
	else if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	if ( ! options.style ) { options.style = inspectStyle.none ; }
	else if ( typeof options.style === 'string' ) { options.style = inspectStyle[ options.style ] ; }
	
	if ( ! stack ) { return ; }
	
	if ( ( options.browser || process.browser ) && stack.indexOf( '@' ) !== -1 )
	{
		// Assume a Firefox-compatible stack-trace here...
		stack = stack
			.replace( /[<\/]*(?=@)/g , '' )	// Firefox output some WTF </</</</< stuff in its stack trace -- removing that
			.replace(
				/^\s*([^@]*)\s*@\s*([^\n]*)(?::([0-9]+):([0-9]+))?$/mg ,
				function( matches , method , file , line , column ) {	// jshint ignore:line
					return options.style.errorStack( '    at ' ) +
						( method ? options.style.errorStackMethod( method ) + ' ' : '' ) +
						options.style.errorStack( '(' ) +
						( file ? options.style.errorStackFile( file ) : options.style.errorStack( 'unknown' ) ) +
						( line ? options.style.errorStack( ':' ) + options.style.errorStackLine( line ) : '' ) +
						( column ? options.style.errorStack( ':' ) + options.style.errorStackColumn( column ) : '' ) +
						options.style.errorStack( ')' ) ;
				}
			) ;
	}
	else
	{
		stack = stack.replace( /^[^\n]*\n/ , '' ) ;
		stack = stack.replace(
			/^\s*(at)\s+(?:([^\s:\(\)\[\]\n]+(?:\([^\)]+\))?)\s)?(?:\[as ([^\s:\(\)\[\]\n]+)\]\s)?(?:\(?([^:\(\)\[\]\n]+):([0-9]+):([0-9]+)\)?)?$/mg ,
			function( matches , at , method , as , file , line , column ) {	// jshint ignore:line
				return options.style.errorStack( '    at ' ) +
					( method ? options.style.errorStackMethod( method ) + ' ' : '' ) +
					( as ? options.style.errorStack( '[as ' ) + options.style.errorStackMethodAs( as ) + options.style.errorStack( '] ' ) : '' ) +
					options.style.errorStack( '(' ) +
					( file ? options.style.errorStackFile( file ) : options.style.errorStack( 'unknown' ) ) +
					( line ? options.style.errorStack( ':' ) + options.style.errorStackLine( line ) : '' ) +
					( column ? options.style.errorStack( ':' ) + options.style.errorStackColumn( column ) : '' ) +
					options.style.errorStack( ')' ) ;
			}
		) ;
	}
	
	return stack ;
}

exports.inspectStack = inspectStack ;



// Inspect's styles

var inspectStyle = {} ;

var inspectStyleNoop = function( str ) { return str ; } ;



inspectStyle.none = {
	tab: '    ' ,
	nl: '\n' ,
	limit: inspectStyleNoop ,
	type: function( str ) { return '<' + str + '>' ; } ,
	constant: inspectStyleNoop ,
	funcName: inspectStyleNoop ,
	constructorName: function( str ) { return '<' + str + '>' ; } ,
	length: inspectStyleNoop ,
	key: inspectStyleNoop ,
	index: inspectStyleNoop ,
	number: inspectStyleNoop ,
	inspect: inspectStyleNoop ,
	string: inspectStyleNoop ,
	errorType: inspectStyleNoop ,
	errorMessage: inspectStyleNoop ,
	errorStack: inspectStyleNoop ,
	errorStackMethod: inspectStyleNoop ,
	errorStackMethodAs: inspectStyleNoop ,
	errorStackFile: inspectStyleNoop ,
	errorStackLine: inspectStyleNoop ,
	errorStackColumn: inspectStyleNoop
} ;



inspectStyle.color = treeExtend( null , {} , inspectStyle.none , {
	limit: function( str ) { return ansi.bold + ansi.brightRed + str + ansi.reset ; } ,
	type: function( str ) { return ansi.italic + ansi.brightBlack + str + ansi.reset ; } ,
	constant: function( str ) { return ansi.cyan + str + ansi.reset ; } ,
	funcName: function( str ) { return ansi.italic + ansi.magenta + str + ansi.reset ; } ,
	constructorName: function( str ) { return ansi.magenta + str + ansi.reset ; } ,
	length: function( str ) { return ansi.italic + ansi.brightBlack + str + ansi.reset ; } ,
	key: function( str ) { return ansi.green + str + ansi.reset ; } ,
	index: function( str ) { return ansi.blue + str + ansi.reset ; } ,
	number: function( str ) { return ansi.cyan + str + ansi.reset ; } ,
	inspect: function( str ) { return ansi.cyan + str + ansi.reset ; } ,
	string: function( str ) { return ansi.blue + str + ansi.reset ; } ,
	errorType: function( str ) { return ansi.red + ansi.bold + str + ansi.reset ; } ,
	errorMessage: function( str ) { return ansi.red + ansi.italic + str + ansi.reset ; } ,
	errorStack: function( str ) { return ansi.brightBlack + str + ansi.reset ; } ,
	errorStackMethod: function( str ) { return ansi.brightYellow + str + ansi.reset ; } ,
	errorStackMethodAs: function( str ) { return ansi.yellow + str + ansi.reset ; } ,
	errorStackFile: function( str ) { return ansi.brightCyan + str + ansi.reset ; } ,
	errorStackLine: function( str ) { return ansi.blue + str + ansi.reset ; } ,
	errorStackColumn: function( str ) { return ansi.magenta + str + ansi.reset ; }
} ) ;



inspectStyle.html = treeExtend( null , {} , inspectStyle.none , {
	tab: '&nbsp;&nbsp;&nbsp;&nbsp;' ,
	nl: '<br />' ,
	limit: function( str ) { return '<span style="color:red">' + str + '</span>' ; } ,
	type: function( str ) { return '<i style="color:gray">' + str + '</i>' ; } ,
	constant: function( str ) { return '<span style="color:cyan">' + str + '</span>' ; } ,
	funcName: function( str ) { return '<i style="color:magenta">' + str + '</i>' ; } ,
	constructorName: function( str ) { return '<span style="color:magenta">' + str + '</span>' ; } ,
	length: function( str ) { return '<i style="color:gray">' + str + '</i>' ; } ,
	key: function( str ) { return '<span style="color:green">' + str + '</span>' ; } ,
	index: function( str ) { return '<span style="color:blue">' + str + '</span>' ; } ,
	number: function( str ) { return '<span style="color:cyan">' + str + '</span>' ; } ,
	inspect: function( str ) { return '<span style="color:cyan">' + str + '</span>' ; } ,
	string: function( str ) { return '<span style="color:blue">' + str + '</span>' ; } ,
	errorType: function( str ) { return '<span style="color:red">' + str + '</span>' ; } ,
	errorMessage: function( str ) { return '<span style="color:red">' + str + '</span>' ; } ,
	errorStack: function( str ) { return '<span style="color:gray">' + str + '</span>' ; } ,
	errorStackMethod: function( str ) { return '<span style="color:yellow">' + str + '</span>' ; } ,
	errorStackMethodAs: function( str ) { return '<span style="color:yellow">' + str + '</span>' ; } ,
	errorStackFile: function( str ) { return '<span style="color:cyan">' + str + '</span>' ; } ,
	errorStackLine: function( str ) { return '<span style="color:blue">' + str + '</span>' ; } ,
	errorStackColumn: function( str ) { return '<span style="color:gray">' + str + '</span>' ; }
} ) ;



}).call(this,{"isBuffer":require("../../is-buffer/index.js")},require('_process'))
},{"../../is-buffer/index.js":39,"./ansi.js":52,"./escape.js":54,"_process":47,"tree-kit/lib/extend.js":66}],57:[function(require,module,exports){
module.exports={"߀":"0","́":""," ":" ","Ⓐ":"A","Ａ":"A","À":"A","Á":"A","Â":"A","Ầ":"A","Ấ":"A","Ẫ":"A","Ẩ":"A","Ã":"A","Ā":"A","Ă":"A","Ằ":"A","Ắ":"A","Ẵ":"A","Ẳ":"A","Ȧ":"A","Ǡ":"A","Ä":"A","Ǟ":"A","Ả":"A","Å":"A","Ǻ":"A","Ǎ":"A","Ȁ":"A","Ȃ":"A","Ạ":"A","Ậ":"A","Ặ":"A","Ḁ":"A","Ą":"A","Ⱥ":"A","Ɐ":"A","Ꜳ":"AA","Æ":"AE","Ǽ":"AE","Ǣ":"AE","Ꜵ":"AO","Ꜷ":"AU","Ꜹ":"AV","Ꜻ":"AV","Ꜽ":"AY","Ⓑ":"B","Ｂ":"B","Ḃ":"B","Ḅ":"B","Ḇ":"B","Ƀ":"B","Ɓ":"B","ｃ":"C","Ⓒ":"C","Ｃ":"C","Ꜿ":"C","Ḉ":"C","Ç":"C","Ⓓ":"D","Ｄ":"D","Ḋ":"D","Ď":"D","Ḍ":"D","Ḑ":"D","Ḓ":"D","Ḏ":"D","Đ":"D","Ɗ":"D","Ɖ":"D","ᴅ":"D","Ꝺ":"D","Ð":"Dh","Ǳ":"DZ","Ǆ":"DZ","ǲ":"Dz","ǅ":"Dz","ɛ":"E","Ⓔ":"E","Ｅ":"E","È":"E","É":"E","Ê":"E","Ề":"E","Ế":"E","Ễ":"E","Ể":"E","Ẽ":"E","Ē":"E","Ḕ":"E","Ḗ":"E","Ĕ":"E","Ė":"E","Ë":"E","Ẻ":"E","Ě":"E","Ȅ":"E","Ȇ":"E","Ẹ":"E","Ệ":"E","Ȩ":"E","Ḝ":"E","Ę":"E","Ḙ":"E","Ḛ":"E","Ɛ":"E","Ǝ":"E","ᴇ":"E","ꝼ":"F","Ⓕ":"F","Ｆ":"F","Ḟ":"F","Ƒ":"F","Ꝼ":"F","Ⓖ":"G","Ｇ":"G","Ǵ":"G","Ĝ":"G","Ḡ":"G","Ğ":"G","Ġ":"G","Ǧ":"G","Ģ":"G","Ǥ":"G","Ɠ":"G","Ꞡ":"G","Ᵹ":"G","Ꝿ":"G","ɢ":"G","Ⓗ":"H","Ｈ":"H","Ĥ":"H","Ḣ":"H","Ḧ":"H","Ȟ":"H","Ḥ":"H","Ḩ":"H","Ḫ":"H","Ħ":"H","Ⱨ":"H","Ⱶ":"H","Ɥ":"H","Ⓘ":"I","Ｉ":"I","Ì":"I","Í":"I","Î":"I","Ĩ":"I","Ī":"I","Ĭ":"I","İ":"I","Ï":"I","Ḯ":"I","Ỉ":"I","Ǐ":"I","Ȉ":"I","Ȋ":"I","Ị":"I","Į":"I","Ḭ":"I","Ɨ":"I","Ⓙ":"J","Ｊ":"J","Ĵ":"J","Ɉ":"J","ȷ":"J","Ⓚ":"K","Ｋ":"K","Ḱ":"K","Ǩ":"K","Ḳ":"K","Ķ":"K","Ḵ":"K","Ƙ":"K","Ⱪ":"K","Ꝁ":"K","Ꝃ":"K","Ꝅ":"K","Ꞣ":"K","Ⓛ":"L","Ｌ":"L","Ŀ":"L","Ĺ":"L","Ľ":"L","Ḷ":"L","Ḹ":"L","Ļ":"L","Ḽ":"L","Ḻ":"L","Ł":"L","Ƚ":"L","Ɫ":"L","Ⱡ":"L","Ꝉ":"L","Ꝇ":"L","Ꞁ":"L","Ǉ":"LJ","ǈ":"Lj","Ⓜ":"M","Ｍ":"M","Ḿ":"M","Ṁ":"M","Ṃ":"M","Ɱ":"M","Ɯ":"M","ϻ":"M","Ꞥ":"N","Ƞ":"N","Ⓝ":"N","Ｎ":"N","Ǹ":"N","Ń":"N","Ñ":"N","Ṅ":"N","Ň":"N","Ṇ":"N","Ņ":"N","Ṋ":"N","Ṉ":"N","Ɲ":"N","Ꞑ":"N","ᴎ":"N","Ǌ":"NJ","ǋ":"Nj","Ⓞ":"O","Ｏ":"O","Ò":"O","Ó":"O","Ô":"O","Ồ":"O","Ố":"O","Ỗ":"O","Ổ":"O","Õ":"O","Ṍ":"O","Ȭ":"O","Ṏ":"O","Ō":"O","Ṑ":"O","Ṓ":"O","Ŏ":"O","Ȯ":"O","Ȱ":"O","Ö":"O","Ȫ":"O","Ỏ":"O","Ő":"O","Ǒ":"O","Ȍ":"O","Ȏ":"O","Ơ":"O","Ờ":"O","Ớ":"O","Ỡ":"O","Ở":"O","Ợ":"O","Ọ":"O","Ộ":"O","Ǫ":"O","Ǭ":"O","Ø":"O","Ǿ":"O","Ɔ":"O","Ɵ":"O","Ꝋ":"O","Ꝍ":"O","Œ":"OE","Ƣ":"OI","Ꝏ":"OO","Ȣ":"OU","Ⓟ":"P","Ｐ":"P","Ṕ":"P","Ṗ":"P","Ƥ":"P","Ᵽ":"P","Ꝑ":"P","Ꝓ":"P","Ꝕ":"P","Ⓠ":"Q","Ｑ":"Q","Ꝗ":"Q","Ꝙ":"Q","Ɋ":"Q","Ⓡ":"R","Ｒ":"R","Ŕ":"R","Ṙ":"R","Ř":"R","Ȑ":"R","Ȓ":"R","Ṛ":"R","Ṝ":"R","Ŗ":"R","Ṟ":"R","Ɍ":"R","Ɽ":"R","Ꝛ":"R","Ꞧ":"R","Ꞃ":"R","Ⓢ":"S","Ｓ":"S","ẞ":"S","Ś":"S","Ṥ":"S","Ŝ":"S","Ṡ":"S","Š":"S","Ṧ":"S","Ṣ":"S","Ṩ":"S","Ș":"S","Ş":"S","Ȿ":"S","Ꞩ":"S","Ꞅ":"S","Ⓣ":"T","Ｔ":"T","Ṫ":"T","Ť":"T","Ṭ":"T","Ț":"T","Ţ":"T","Ṱ":"T","Ṯ":"T","Ŧ":"T","Ƭ":"T","Ʈ":"T","Ⱦ":"T","Ꞇ":"T","Þ":"Th","Ꜩ":"TZ","Ⓤ":"U","Ｕ":"U","Ù":"U","Ú":"U","Û":"U","Ũ":"U","Ṹ":"U","Ū":"U","Ṻ":"U","Ŭ":"U","Ü":"U","Ǜ":"U","Ǘ":"U","Ǖ":"U","Ǚ":"U","Ủ":"U","Ů":"U","Ű":"U","Ǔ":"U","Ȕ":"U","Ȗ":"U","Ư":"U","Ừ":"U","Ứ":"U","Ữ":"U","Ử":"U","Ự":"U","Ụ":"U","Ṳ":"U","Ų":"U","Ṷ":"U","Ṵ":"U","Ʉ":"U","Ⓥ":"V","Ｖ":"V","Ṽ":"V","Ṿ":"V","Ʋ":"V","Ꝟ":"V","Ʌ":"V","Ꝡ":"VY","Ⓦ":"W","Ｗ":"W","Ẁ":"W","Ẃ":"W","Ŵ":"W","Ẇ":"W","Ẅ":"W","Ẉ":"W","Ⱳ":"W","Ⓧ":"X","Ｘ":"X","Ẋ":"X","Ẍ":"X","Ⓨ":"Y","Ｙ":"Y","Ỳ":"Y","Ý":"Y","Ŷ":"Y","Ỹ":"Y","Ȳ":"Y","Ẏ":"Y","Ÿ":"Y","Ỷ":"Y","Ỵ":"Y","Ƴ":"Y","Ɏ":"Y","Ỿ":"Y","Ⓩ":"Z","Ｚ":"Z","Ź":"Z","Ẑ":"Z","Ż":"Z","Ž":"Z","Ẓ":"Z","Ẕ":"Z","Ƶ":"Z","Ȥ":"Z","Ɀ":"Z","Ⱬ":"Z","Ꝣ":"Z","ⓐ":"a","ａ":"a","ẚ":"a","à":"a","á":"a","â":"a","ầ":"a","ấ":"a","ẫ":"a","ẩ":"a","ã":"a","ā":"a","ă":"a","ằ":"a","ắ":"a","ẵ":"a","ẳ":"a","ȧ":"a","ǡ":"a","ä":"a","ǟ":"a","ả":"a","å":"a","ǻ":"a","ǎ":"a","ȁ":"a","ȃ":"a","ạ":"a","ậ":"a","ặ":"a","ḁ":"a","ą":"a","ⱥ":"a","ɐ":"a","ɑ":"a","ꜳ":"aa","æ":"ae","ǽ":"ae","ǣ":"ae","ꜵ":"ao","ꜷ":"au","ꜹ":"av","ꜻ":"av","ꜽ":"ay","ⓑ":"b","ｂ":"b","ḃ":"b","ḅ":"b","ḇ":"b","ƀ":"b","ƃ":"b","ɓ":"b","Ƃ":"b","ⓒ":"c","ć":"c","ĉ":"c","ċ":"c","č":"c","ç":"c","ḉ":"c","ƈ":"c","ȼ":"c","ꜿ":"c","ↄ":"c","C":"c","Ć":"c","Ĉ":"c","Ċ":"c","Č":"c","Ƈ":"c","Ȼ":"c","ⓓ":"d","ｄ":"d","ḋ":"d","ď":"d","ḍ":"d","ḑ":"d","ḓ":"d","ḏ":"d","đ":"d","ƌ":"d","ɖ":"d","ɗ":"d","Ƌ":"d","Ꮷ":"d","ԁ":"d","Ɦ":"d","ð":"dh","ǳ":"dz","ǆ":"dz","ⓔ":"e","ｅ":"e","è":"e","é":"e","ê":"e","ề":"e","ế":"e","ễ":"e","ể":"e","ẽ":"e","ē":"e","ḕ":"e","ḗ":"e","ĕ":"e","ė":"e","ë":"e","ẻ":"e","ě":"e","ȅ":"e","ȇ":"e","ẹ":"e","ệ":"e","ȩ":"e","ḝ":"e","ę":"e","ḙ":"e","ḛ":"e","ɇ":"e","ǝ":"e","ⓕ":"f","ｆ":"f","ḟ":"f","ƒ":"f","ﬀ":"ff","ﬁ":"fi","ﬂ":"fl","ﬃ":"ffi","ﬄ":"ffl","ⓖ":"g","ｇ":"g","ǵ":"g","ĝ":"g","ḡ":"g","ğ":"g","ġ":"g","ǧ":"g","ģ":"g","ǥ":"g","ɠ":"g","ꞡ":"g","ꝿ":"g","ᵹ":"g","ⓗ":"h","ｈ":"h","ĥ":"h","ḣ":"h","ḧ":"h","ȟ":"h","ḥ":"h","ḩ":"h","ḫ":"h","ẖ":"h","ħ":"h","ⱨ":"h","ⱶ":"h","ɥ":"h","ƕ":"hv","ⓘ":"i","ｉ":"i","ì":"i","í":"i","î":"i","ĩ":"i","ī":"i","ĭ":"i","ï":"i","ḯ":"i","ỉ":"i","ǐ":"i","ȉ":"i","ȋ":"i","ị":"i","į":"i","ḭ":"i","ɨ":"i","ı":"i","ⓙ":"j","ｊ":"j","ĵ":"j","ǰ":"j","ɉ":"j","ⓚ":"k","ｋ":"k","ḱ":"k","ǩ":"k","ḳ":"k","ķ":"k","ḵ":"k","ƙ":"k","ⱪ":"k","ꝁ":"k","ꝃ":"k","ꝅ":"k","ꞣ":"k","ⓛ":"l","ｌ":"l","ŀ":"l","ĺ":"l","ľ":"l","ḷ":"l","ḹ":"l","ļ":"l","ḽ":"l","ḻ":"l","ſ":"l","ł":"l","ƚ":"l","ɫ":"l","ⱡ":"l","ꝉ":"l","ꞁ":"l","ꝇ":"l","ɭ":"l","ǉ":"lj","ⓜ":"m","ｍ":"m","ḿ":"m","ṁ":"m","ṃ":"m","ɱ":"m","ɯ":"m","ⓝ":"n","ｎ":"n","ǹ":"n","ń":"n","ñ":"n","ṅ":"n","ň":"n","ṇ":"n","ņ":"n","ṋ":"n","ṉ":"n","ƞ":"n","ɲ":"n","ŉ":"n","ꞑ":"n","ꞥ":"n","ԉ":"n","ǌ":"nj","ⓞ":"o","ｏ":"o","ò":"o","ó":"o","ô":"o","ồ":"o","ố":"o","ỗ":"o","ổ":"o","õ":"o","ṍ":"o","ȭ":"o","ṏ":"o","ō":"o","ṑ":"o","ṓ":"o","ŏ":"o","ȯ":"o","ȱ":"o","ö":"o","ȫ":"o","ỏ":"o","ő":"o","ǒ":"o","ȍ":"o","ȏ":"o","ơ":"o","ờ":"o","ớ":"o","ỡ":"o","ở":"o","ợ":"o","ọ":"o","ộ":"o","ǫ":"o","ǭ":"o","ø":"o","ǿ":"o","ꝋ":"o","ꝍ":"o","ɵ":"o","ɔ":"o","ᴑ":"o","œ":"oe","ƣ":"oi","ꝏ":"oo","ȣ":"ou","ⓟ":"p","ｐ":"p","ṕ":"p","ṗ":"p","ƥ":"p","ᵽ":"p","ꝑ":"p","ꝓ":"p","ꝕ":"p","ρ":"p","ⓠ":"q","ｑ":"q","ɋ":"q","ꝗ":"q","ꝙ":"q","ⓡ":"r","ｒ":"r","ŕ":"r","ṙ":"r","ř":"r","ȑ":"r","ȓ":"r","ṛ":"r","ṝ":"r","ŗ":"r","ṟ":"r","ɍ":"r","ɽ":"r","ꝛ":"r","ꞧ":"r","ꞃ":"r","ⓢ":"s","ｓ":"s","ś":"s","ṥ":"s","ŝ":"s","ṡ":"s","š":"s","ṧ":"s","ṣ":"s","ṩ":"s","ș":"s","ş":"s","ȿ":"s","ꞩ":"s","ꞅ":"s","ẛ":"s","ʂ":"s","ß":"ss","ⓣ":"t","ｔ":"t","ṫ":"t","ẗ":"t","ť":"t","ṭ":"t","ț":"t","ţ":"t","ṱ":"t","ṯ":"t","ŧ":"t","ƭ":"t","ʈ":"t","ⱦ":"t","ꞇ":"t","þ":"th","ꜩ":"tz","ⓤ":"u","ｕ":"u","ù":"u","ú":"u","û":"u","ũ":"u","ṹ":"u","ū":"u","ṻ":"u","ŭ":"u","ü":"u","ǜ":"u","ǘ":"u","ǖ":"u","ǚ":"u","ủ":"u","ů":"u","ű":"u","ǔ":"u","ȕ":"u","ȗ":"u","ư":"u","ừ":"u","ứ":"u","ữ":"u","ử":"u","ự":"u","ụ":"u","ṳ":"u","ų":"u","ṷ":"u","ṵ":"u","ʉ":"u","ⓥ":"v","ｖ":"v","ṽ":"v","ṿ":"v","ʋ":"v","ꝟ":"v","ʌ":"v","ꝡ":"vy","ⓦ":"w","ｗ":"w","ẁ":"w","ẃ":"w","ŵ":"w","ẇ":"w","ẅ":"w","ẘ":"w","ẉ":"w","ⱳ":"w","ⓧ":"x","ｘ":"x","ẋ":"x","ẍ":"x","ⓨ":"y","ｙ":"y","ỳ":"y","ý":"y","ŷ":"y","ỹ":"y","ȳ":"y","ẏ":"y","ÿ":"y","ỷ":"y","ẙ":"y","ỵ":"y","ƴ":"y","ɏ":"y","ỿ":"y","ⓩ":"z","ｚ":"z","ź":"z","ẑ":"z","ż":"z","ž":"z","ẓ":"z","ẕ":"z","ƶ":"z","ȥ":"z","ɀ":"z","ⱬ":"z","ꝣ":"z"}
},{}],58:[function(require,module,exports){
/*
	String Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



var map = require( './latinize-map.json' ) ;

module.exports = function( str )
{
	return str.replace( /[^\u0000-\u007e]/g , function( c ) { return map[ c ] || c ; } ) ;
} ;

            

},{"./latinize-map.json":57}],59:[function(require,module,exports){
/*
	String Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



exports.resize = function resize( str , length )
{
	if ( str.length === length )
	{
		return str ;
	}
	else if ( str.length > length )
	{
		return str.slice( 0 , length ) ;
	}
	else
	{
		return str + ' '.repeat( length - str.length ) ;
	}
} ;



},{}],60:[function(require,module,exports){
/*
	String Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



/* All polyfill borrowed from MDN: developer.mozilla.org */



var polyfill = {} ;
module.exports = polyfill ;



// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat
polyfill.repeat = function(count)
{
  if (this === null) {
    throw new TypeError('can\'t convert ' + this + ' to object');
  }
  var str = '' + this;
  count = +count;
  if (count !== count) {
    count = 0;
  }
  if (count < 0) {
    throw new RangeError('repeat count must be non-negative');
  }
  if (count === Infinity) {
    throw new RangeError('repeat count must be less than infinity');
  }
  count = Math.floor(count);
  if (str.length === 0 || count === 0) {
    return '';
  }
  // Ensuring count is a 31-bit integer allows us to heavily optimize the
  // main part. But anyway, most current (August 2014) browsers can't handle
  // strings 1 << 28 chars or longer, so:
  if (str.length * count >= 1 << 28) {
    throw new RangeError('repeat count must not overflow maximum string size');
  }
  var rpt = '';
  for (;;) {
    if ((count & 1) === 1) {
      rpt += str;
    }
    count >>>= 1;
    if (count === 0) {
      break;
    }
    str += str;
  }
  return rpt;
} ;



},{}],61:[function(require,module,exports){
/*
	String Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



var escape = require( './escape.js' ) ;



exports.regexp = {} ;



exports.regexp.array2alternatives = function array2alternatives( array )
{
	var i , sorted = array.slice() ;
	
	// Sort descending by string length
	sorted.sort( function( a , b ) {
		return b.length - a.length ;
	} ) ;
	
	// Then escape what should be
	for ( i = 0 ; i < sorted.length ; i ++ )
	{
		sorted[ i ] = escape.regExpPattern( sorted[ i ] ) ;
	}
	
	return sorted.join( '|' ) ;
} ;



},{"./escape.js":54}],62:[function(require,module,exports){
/*
	String Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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
var tree = require( 'tree-kit' ) ;



var stringKit = {} ;
module.exports = stringKit ;



// Tier 0: add polyfills to stringKit
var fn ;
var polyfill = require( './polyfill.js' ) ;

for ( fn in polyfill )
{
	stringKit[ fn ] = function( str ) { // jshint ignore:line
		return polyfill[ fn ].apply( str , Array.prototype.slice.call( arguments , 1 ) ) ;
	} ; // jshint ignore:line
}



tree.extend( null , stringKit ,
	
	// Tier 1
	{ escape: require( './escape.js' ) } ,
	{ ansi: require( './ansi.js' ) } ,
	{ unicode: require( './unicode.js' ) }
) ;



tree.extend( null , stringKit ,
	
	// Tier 2
	require( './format.js' ) ,
	
	// Tier 3
	require( './misc.js' ) ,
	require( './inspect.js' ) ,
	require( './regexp.js' ) ,
	require( './camel.js' ) ,
	{ latinize: require( './latinize.js' ) }
) ;



// Install all polyfill into String.prototype
stringKit.installPolyfills = function installPolyfills()
{
	var fn ;
	
	for ( fn in polyfill )
	{
		if ( ! String.prototype[ fn ] )
		{
			String.prototype[ fn ] = polyfill[ fn ] ;
		}
	}
} ;





},{"./ansi.js":52,"./camel.js":53,"./escape.js":54,"./format.js":55,"./inspect.js":56,"./latinize.js":58,"./misc.js":59,"./polyfill.js":60,"./regexp.js":61,"./unicode.js":63,"tree-kit":70}],63:[function(require,module,exports){
/*
	String Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



/*
	Javascript does not use UTF-8 but UCS-2.
	The purpose of this module is to process correctly strings containing UTF-8 characters that take more than 2 bytes.
	
	Note: in monospace font, any single unicode character that has a length of 2 is a full-width char, and therefore
	is displayed in 2 monospace cells.
*/



// Load modules
var punycode = require( 'punycode' ) ;



// Create the module and export it
var unicode = {} ;
module.exports = unicode ;



// Get the length of an unicode string
unicode.length = function length( str )
{
	return punycode.ucs2.decode( str ).length ;
} ;



// Return an array of chars
unicode.toArray = function toArray( str )
{
	return punycode.ucs2.decode( str ).map( function( code ) {
		return punycode.ucs2.encode( [ code ] ) ;
	} ) ;
} ;



/*
	Returns:
		0: single char
		1: leading surrogate
		-1: trailing surrogate
	
	Note: it does not check input, to gain perfs.
*/
unicode.surrogatePair = function surrogatePair( char )
{
	var code = char.charCodeAt( 0 ) ;
	
	if ( code < 0xd800 || code >= 0xe000 ) { return 0 ; }
	else if ( code < 0xdc00 ) { return 1 ; }
	else { return -1 ; }
} ;



/*
	Check if a character is a full-width char or not.
	
	Borrowed from Node.js source, from readline.js.
*/
unicode.isFullWidth = function isFullWidth( char )
{
	var code = char.codePointAt( 0 ) ;
	
	// Code points are derived from:
	// http://www.unicode.org/Public/UNIDATA/EastAsianWidth.txt
	if ( code >= 0x1100 && (
			code <= 0x115f ||	// Hangul Jamo
			0x2329 === code || // LEFT-POINTING ANGLE BRACKET
			0x232a === code || // RIGHT-POINTING ANGLE BRACKET
			// CJK Radicals Supplement .. Enclosed CJK Letters and Months
			( 0x2e80 <= code && code <= 0x3247 && code !== 0x303f ) ||
			// Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
			0x3250 <= code && code <= 0x4dbf ||
			// CJK Unified Ideographs .. Yi Radicals
			0x4e00 <= code && code <= 0xa4c6 ||
			// Hangul Jamo Extended-A
			0xa960 <= code && code <= 0xa97c ||
			// Hangul Syllables
			0xac00 <= code && code <= 0xd7a3 ||
			// CJK Compatibility Ideographs
			0xf900 <= code && code <= 0xfaff ||
			// Vertical Forms
			0xfe10 <= code && code <= 0xfe19 ||
			// CJK Compatibility Forms .. Small Form Variants
			0xfe30 <= code && code <= 0xfe6b ||
			// Halfwidth and Fullwidth Forms
			0xff01 <= code && code <= 0xff60 ||
			0xffe0 <= code && code <= 0xffe6 ||
			// Kana Supplement
			0x1b000 <= code && code <= 0x1b001 ||
			// Enclosed Ideographic Supplement
			0x1f200 <= code && code <= 0x1f251 ||
			// CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
			0x20000 <= code && code <= 0x3fffd ) ) {
		return true ;
	}
	
	return false ;
} ;



// Convert normal ASCII chars to their full-width counterpart
unicode.toFullWidth = function toFullWidth( str )
{
	return punycode.ucs2.encode( 
		punycode.ucs2.decode( str ).map( function( code ) {
			if ( code >= 33 && code <= 126 ) { return 0xff00 + code - 0x20 ; }
			else { return code ; }
		} )
	) ;
} ;



},{"punycode":48}],64:[function(require,module,exports){
/*
	Tree Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



/*
	Stand-alone fork of extend.js, without options.
*/

module.exports = function clone( originalObject , circular )
{
	// First create an empty object with
	// same prototype of our original source
	
	var propertyIndex , descriptor , keys , current , nextSource , indexOf ,
		copies = [ {
			source: originalObject ,
			target: Array.isArray( originalObject ) ? [] : Object.create( Object.getPrototypeOf( originalObject ) )
		} ] ,
		cloneObject = copies[ 0 ].target ,
		sourceReferences = [ originalObject ] ,
		targetReferences = [ cloneObject ] ;
	
	// First in, first out
	while ( current = copies.shift() )	// jshint ignore:line
	{
		keys = Object.getOwnPropertyNames( current.source ) ;

		for ( propertyIndex = 0 ; propertyIndex < keys.length ; propertyIndex ++ )
		{
			// Save the source's descriptor
			descriptor = Object.getOwnPropertyDescriptor( current.source , keys[ propertyIndex ] ) ;
			
			if ( ! descriptor.value || typeof descriptor.value !== 'object' )
			{
				Object.defineProperty( current.target , keys[ propertyIndex ] , descriptor ) ;
				continue ;
			}
			
			nextSource = descriptor.value ;
			descriptor.value = Array.isArray( nextSource ) ? [] : Object.create( Object.getPrototypeOf( nextSource ) ) ;
			
			if ( circular )
			{
				indexOf = sourceReferences.indexOf( nextSource ) ;
				
				if ( indexOf !== -1 )
				{
					// The source is already referenced, just assign reference
					descriptor.value = targetReferences[ indexOf ] ;
					Object.defineProperty( current.target , keys[ propertyIndex ] , descriptor ) ;
					continue ;
				}
				
				sourceReferences.push( nextSource ) ;
				targetReferences.push( descriptor.value ) ;
			}
			
			Object.defineProperty( current.target , keys[ propertyIndex ] , descriptor ) ;
			
			copies.push( { source: nextSource , target: descriptor.value } ) ;
		}
	}
	
	return cloneObject ;
} ;

},{}],65:[function(require,module,exports){
/*
	Tree Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



/*
	== Diff function ==
*/

function diff( left , right , options )
{
	var i , key , keyPath ,
		leftKeys , rightKeys , leftTypeof , rightTypeof ,
		depth , diffObject , length , arrayMode ;
	
	leftTypeof = typeof left ;
	rightTypeof = typeof right ;
	
	if (
		! left || ( leftTypeof !== 'object' && leftTypeof !== 'function' ) ||
		! right || ( rightTypeof !== 'object' && rightTypeof !== 'function' )
	)
	{
		throw new Error( '[tree] diff() needs objects as argument #0 and #1' ) ;
	}
	
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	depth = options.depth || 0 ;
	
	// Things applied only for the root, not for recursive call
	if ( ! depth )
	{
		options.diffObject = {} ;
		if ( ! options.path ) { options.path = '' ; }
		if ( ! options.pathSeparator ) { options.pathSeparator = '.' ; }
	}
	
	diffObject = options.diffObject ;
	
	
	// Left part
	if ( Array.isArray( left ) )
	{
		arrayMode = true ;
		length = left.length ;
	}
	else
	{
		arrayMode = false ;
		leftKeys = Object.keys( left ) ;
		length = leftKeys.length ;
	}
	
	for ( i = 0 ; i < length ; i ++ )
	{
		key = arrayMode ? i : leftKeys[ i ] ;
		keyPath = options.path + options.pathSeparator + key ;
		//console.log( 'L keyPath:' , keyPath ) ;
		
		if ( ! right.hasOwnProperty( key ) )
		{
			diffObject[ keyPath ] = { path: keyPath , message: 'does not exist in right-hand side' } ;
			continue ;
		}
		
		leftTypeof = typeof left[ key ] ;
		rightTypeof = typeof right[ key ] ;
		
		if ( leftTypeof !== rightTypeof )
		{
			diffObject[ keyPath ] = { path: keyPath , message: 'different typeof: ' + leftTypeof + ' - ' + rightTypeof } ;
			continue ;
		}
		
		if ( leftTypeof === 'object' || leftTypeof === 'function' )
		{
			// Cleanup the 'null is an object' mess
			if ( ! left[ key ] )
			{
				if ( right[ key ] ) { diffObject[ keyPath ] = { path: keyPath , message: 'different type: null - Object' } ; }
				continue ;
			}
			
			if ( ! right[ key ] )
			{
				diffObject[ keyPath ] = { path: keyPath , message: 'different type: Object - null' } ;
				continue ;
			}
			
			if ( Array.isArray( left[ key ] ) && ! Array.isArray( right[ key ] ) )
			{
				diffObject[ keyPath ] = { path: keyPath , message: 'different type: Array - Object' } ;
				continue ;
			}
			
			if ( ! Array.isArray( left[ key ] ) && Array.isArray( right[ key ] ) )
			{
				diffObject[ keyPath ] = { path: keyPath , message: 'different type: Object - Array' } ;
				continue ;
			}
			
			diff( left[ key ] , right[ key ] , { path: keyPath , pathSeparator: options.pathSeparator , depth: depth + 1 , diffObject: diffObject } ) ;
			continue ;
		}
		
		if ( left[ key ] !== right[ key ] )
		{
			diffObject[ keyPath ] = { path: keyPath , message: 'different value: ' + left[ key ] + ' - ' + right[ key ] } ;
			continue ;
		}
	}
	
	
	// Right part
	if ( Array.isArray( right ) )
	{
		arrayMode = true ;
		length = right.length ;
	}
	else
	{
		arrayMode = false ;
		rightKeys = Object.keys( right ) ;
		length = rightKeys.length ;
	}
	
	for ( i = 0 ; i < length ; i ++ )
	{
		key = arrayMode ? i : rightKeys[ i ] ;
		keyPath = options.path + options.pathSeparator + key ;
		//console.log( 'R keyPath:' , keyPath ) ;
		
		if ( ! left.hasOwnProperty( key ) )
		{
			diffObject[ keyPath ] = { path: keyPath , message: 'does not exist in left-hand side' } ;
			continue ;
		}
	}
	
	return Object.keys( diffObject ).length ? diffObject : null ;
}

exports.diff = diff ;


},{}],66:[function(require,module,exports){
/*
	Tree Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



/*
	== Extend function ==
*/

/*
	options:
		* own: only copy own properties that are enumerable
		* nonEnum: copy non-enumerable properties as well, works only with own:true
		* descriptor: preserve property's descriptor
		* deep: perform a deep (recursive) extend
		* maxDepth: used in conjunction with deep, when max depth is reached an exception is raised, default to 100 when
			the 'circular' option is off, or default to null if 'circular' is on
		* circular: circular references reconnection
		* move: move properties to target (delete properties from the sources)
		* preserve: existing properties in the target object are not overwritten
		* nofunc: skip functions
		* deepFunc: in conjunction with 'deep', this will process sources functions like objects rather than
			copying/referencing them directly into the source, thus, the result will not be a function, it forces 'deep'
		* proto: try to clone objects with the right prototype, using Object.create() or mutating it with Object.setPrototypeOf(),
			it forces option 'own'.
		* inherit: rather than mutating target prototype for source prototype like the 'proto' option does, here it is
			the source itself that IS the prototype for the target. Force option 'own' and disable 'proto'.
		* skipRoot: the prototype of the target root object is NOT mutated only if this option is set.
		* flat: extend into the target top-level only, compose name with the path of the source, force 'deep',
			disable 'unflat', 'proto', 'inherit'
		* unflat: assume sources are in the 'flat' format, expand all properties deeply into the target, disable 'flat'
		* deepFilter
			* blacklist: list of black-listed prototype: the recursiveness of the 'deep' option will be disabled
				for object whose prototype is listed
			* whitelist: the opposite of blacklist
*/
function extend( options , target )
{
	//console.log( "\nextend():\n" , arguments ) ;
	var i , source , newTarget = false , length = arguments.length ;
	
	if ( length < 3 ) { return target ; }
	
	var sources = Array.prototype.slice.call( arguments , 2 ) ;
	length = sources.length ;
	
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	var runtime = { depth: 0 , prefix: '' } ;
	
	if ( ! options.maxDepth && options.deep && ! options.circular ) { options.maxDepth = 100 ; }
	
	if ( options.deepFunc ) { options.deep = true ; }
	
	if ( options.deepFilter && typeof options.deepFilter === 'object' )
	{
		if ( options.deepFilter.whitelist && ( ! Array.isArray( options.deepFilter.whitelist ) || ! options.deepFilter.whitelist.length ) ) { delete options.deepFilter.whitelist ; }
		if ( options.deepFilter.blacklist && ( ! Array.isArray( options.deepFilter.blacklist ) || ! options.deepFilter.blacklist.length ) ) { delete options.deepFilter.blacklist ; }
		if ( ! options.deepFilter.whitelist && ! options.deepFilter.blacklist ) { delete options.deepFilter ; }
	}
	
	// 'flat' option force 'deep'
	if ( options.flat )
	{
		options.deep = true ;
		options.proto = false ;
		options.inherit = false ;
		options.unflat = false ;
		if ( typeof options.flat !== 'string' ) { options.flat = '.' ; }
	}
	
	if ( options.unflat )
	{
		options.deep = false ;
		options.proto = false ;
		options.inherit = false ;
		options.flat = false ;
		if ( typeof options.unflat !== 'string' ) { options.unflat = '.' ; }
	}
	
	// If the prototype is applied, only owned properties should be copied
	if ( options.inherit ) { options.own = true ; options.proto = false ; }
	else if ( options.proto ) { options.own = true ; }
	
	if ( ! target || ( typeof target !== 'object' && typeof target !== 'function' ) )
	{
		newTarget = true ;
	}
	
	if ( ! options.skipRoot && ( options.inherit || options.proto ) )
	{
		for ( i = length - 1 ; i >= 0 ; i -- )
		{
			source = sources[ i ] ;
			if ( source && ( typeof source === 'object' || typeof source === 'function' ) )
			{
				if ( options.inherit )
				{
					if ( newTarget ) { target = Object.create( source ) ; }
					else { Object.setPrototypeOf( target , source ) ; }
				}
				else if ( options.proto )
				{
					if ( newTarget ) { target = Object.create( Object.getPrototypeOf( source ) ) ; }
					else { Object.setPrototypeOf( target , Object.getPrototypeOf( source ) ) ; }
				}
				
				break ;
			}
		}
	}
	else if ( newTarget )
	{
		target = {} ;
	}
	
	runtime.references = { sources: [] , targets: [] } ;
	
	for ( i = 0 ; i < length ; i ++ )
	{
		source = sources[ i ] ;
		if ( ! source || ( typeof source !== 'object' && typeof source !== 'function' ) ) { continue ; }
		extendOne( runtime , options , target , source ) ;
	}
	
	return target ;
}

module.exports = extend ;



function extendOne( runtime , options , target , source )
{
	//console.log( "\nextendOne():\n" , arguments ) ;
	//process.exit() ;
	
	var j , jmax , sourceKeys , sourceKey , sourceValue , sourceValueProto ,
		value , sourceDescriptor , targetKey , targetPointer , path ,
		indexOfSource = -1 ;
	
	// Max depth check
	if ( options.maxDepth && runtime.depth > options.maxDepth )
	{
		throw new Error( '[tree] extend(): max depth reached(' + options.maxDepth + ')' ) ;
	}
	
		
	if ( options.circular )
	{
		runtime.references.sources.push( source ) ;
		runtime.references.targets.push( target ) ;
	}
	
	if ( options.own )
	{
		if ( options.nonEnum ) { sourceKeys = Object.getOwnPropertyNames( source ) ; }
		else { sourceKeys = Object.keys( source ) ; }
	}
	else { sourceKeys = source ; }
	
	for ( sourceKey in sourceKeys )
	{
		if ( options.own ) { sourceKey = sourceKeys[ sourceKey ] ; }
		
		// If descriptor is on, get it now
		if ( options.descriptor )
		{
			sourceDescriptor = Object.getOwnPropertyDescriptor( source , sourceKey ) ;
			sourceValue = sourceDescriptor.value ;
		}
		else
		{
			// We have to trigger an eventual getter only once
			sourceValue = source[ sourceKey ] ;
		}
		
		targetPointer = target ;
		targetKey = runtime.prefix + sourceKey ;
		
		// Do not copy if property is a function and we don't want them
		if ( options.nofunc && typeof sourceValue === 'function' ) { continue; }
		
		// 'unflat' mode computing
		if ( options.unflat && runtime.depth === 0 )
		{
			path = sourceKey.split( options.unflat ) ;
			jmax = path.length - 1 ;
			
			if ( jmax )
			{
				for ( j = 0 ; j < jmax ; j ++ )
				{
					if ( ! targetPointer[ path[ j ] ] ||
						( typeof targetPointer[ path[ j ] ] !== 'object' &&
							typeof targetPointer[ path[ j ] ] !== 'function' ) )
					{
						targetPointer[ path[ j ] ] = {} ;
					}
					
					targetPointer = targetPointer[ path[ j ] ] ;
				}
				
				targetKey = runtime.prefix + path[ jmax ] ;
			}
		}
		
		
		if ( options.deep &&
			sourceValue &&
			( typeof sourceValue === 'object' || ( options.deepFunc && typeof sourceValue === 'function' ) ) &&
			( ! options.descriptor || ! sourceDescriptor.get ) &&
			// not a condition we just cache sourceValueProto now
			( ( sourceValueProto = Object.getPrototypeOf( sourceValue ) ) || true ) &&
			( ! options.deepFilter ||
				( ( ! options.deepFilter.whitelist || options.deepFilter.whitelist.indexOf( sourceValueProto ) !== -1 ) &&
					( ! options.deepFilter.blacklist || options.deepFilter.blacklist.indexOf( sourceValueProto ) === -1 ) ) ) )
		{
			if ( options.circular )
			{
				indexOfSource = runtime.references.sources.indexOf( sourceValue ) ;
			}
			
			if ( options.flat )
			{
				// No circular references reconnection when in 'flat' mode
				if ( indexOfSource >= 0 ) { continue ; }
				
				extendOne(
					{ depth: runtime.depth + 1 , prefix: runtime.prefix + sourceKey + options.flat , references: runtime.references } ,
					options , targetPointer , sourceValue
				) ;
			}
			else
			{
				if ( indexOfSource >= 0 )
				{
					// Circular references reconnection...
					if ( options.descriptor )
					{
						Object.defineProperty( targetPointer , targetKey , {
							value: runtime.references.targets[ indexOfSource ] ,
							enumerable: sourceDescriptor.enumerable ,
							writable: sourceDescriptor.writable ,
							configurable: sourceDescriptor.configurable
						} ) ;
					}
					else
					{
						targetPointer[ targetKey ] = runtime.references.targets[ indexOfSource ] ;
					}
					
					continue ;
				}
				
				if ( ! targetPointer[ targetKey ] || ! targetPointer.hasOwnProperty( targetKey ) || ( typeof targetPointer[ targetKey ] !== 'object' && typeof targetPointer[ targetKey ] !== 'function' ) )
				{
					if ( Array.isArray( sourceValue ) ) { value = [] ; }
					else if ( options.proto ) { value = Object.create( sourceValueProto ) ; }	// jshint ignore:line
					else if ( options.inherit ) { value = Object.create( sourceValue ) ; }
					else { value = {} ; }
					
					if ( options.descriptor )
					{
						Object.defineProperty( targetPointer , targetKey , {
							value: value ,
							enumerable: sourceDescriptor.enumerable ,
							writable: sourceDescriptor.writable ,
							configurable: sourceDescriptor.configurable
						} ) ;
					}
					else
					{
						targetPointer[ targetKey ] = value ;
					}
				}
				else if ( options.proto && Object.getPrototypeOf( targetPointer[ targetKey ] ) !== sourceValueProto )
				{
					Object.setPrototypeOf( targetPointer[ targetKey ] , sourceValueProto ) ;
				}
				else if ( options.inherit && Object.getPrototypeOf( targetPointer[ targetKey ] ) !== sourceValue )
				{
					Object.setPrototypeOf( targetPointer[ targetKey ] , sourceValue ) ;
				}
				
				if ( options.circular )
				{
					runtime.references.sources.push( sourceValue ) ;
					runtime.references.targets.push( targetPointer[ targetKey ] ) ;
				}
				
				// Recursively extends sub-object
				extendOne(
					{ depth: runtime.depth + 1 , prefix: '' , references: runtime.references } ,
					options , targetPointer[ targetKey ] , sourceValue
				) ;
			}
		}
		else if ( options.preserve && targetPointer[ targetKey ] !== undefined )
		{
			// Do not overwrite, and so do not delete source's properties that were not moved
			continue ;
		}
		else if ( ! options.inherit )
		{
			if ( options.descriptor ) { Object.defineProperty( targetPointer , targetKey , sourceDescriptor ) ; }
			else { targetPointer[ targetKey ] = sourceValue ; }
		}
		
		// Delete owned property of the source object
		if ( options.move ) { delete source[ sourceKey ] ; }
	}
}


},{}],67:[function(require,module,exports){
/*
	Tree Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



/*
	== Lazy function ==
*/

exports.defineLazyProperty = function defineLazyProperty( object , name , func )
{
	Object.defineProperty( object , name , {
		configurable: true ,
		enumerable: true ,
		get: function() {
			
			var value = func() ;
			
			Object.defineProperty( object , name , {
				configurable: true ,
				enumerable: true ,
				writable: false ,
				value: value
			} ) ;
			
			return value ;
		}
	} ) ;
} ;

},{}],68:[function(require,module,exports){
/*
	Tree Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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
var tree = require( './tree.js' ) ;
var util = require( 'util' ) ;



// Create and export
var masklib = {} ;
module.exports = masklib ;



/*
	== Mask-family class ==
	
	Recursively select values in the input object if the same path in the mask object is set.
*/

/*
	TODO:
	- negative mask
	- constraint check
	- Maskable object, like in csk-php
*/

masklib.Mask = function Mask()
{
	throw new Error( 'Cannot create a tree.Mask() directly' ) ;
} ;



var maskDefaultOptions = {
	clone: false ,
	path: '<object>' ,
	pathSeparator: '.'
} ;



/*
	options:
		clone: the output clone the input rather than reference it
		pathSeperator: when expressing path, this is the separator
		leaf: a callback to exec for each mask leaf
		node? a callback to exec for each mask node
*/
masklib.createMask = function createMask( maskArgument , options )
{
	if ( maskArgument === null || typeof maskArgument !== 'object' )
	{
		throw new TypeError( '[tree] .createMask() : Argument #1 should be an object' ) ;
	}
	
	if ( options !== null && typeof options === 'object' ) { options = tree.extend( null , {} , maskDefaultOptions , options ) ; }
	else { options = maskDefaultOptions ; }
	
	var mask = Object.create( masklib.Mask.prototype , {
		__options__: { value: options , writable: true  }
	} ) ;
	
	tree.extend( null , mask , maskArgument ) ;
	
	return mask ;
} ;



// Apply the mask to an input tree
masklib.Mask.prototype.applyTo = function applyTo( input , context , contextOverideDefault )
{
	// Arguments checking
	if ( input === null || typeof input !== 'object' )
	{
		throw new TypeError( '[tree] .applyTo() : Argument #1 should be an object' ) ;
	}
	
	if ( contextOverideDefault )
	{
		context = tree.extend( null ,
			{
				mask: this ,
				options: this.__options__ ,
				path: this.__options__.path
			} ,
			context
		) ;
	}
	else if ( context === undefined )
	{
		context = {
			mask: this ,
			options: this.__options__ ,
			path: this.__options__.path
		} ;
	}
	
	
	// Init
	//console.log( context ) ;
	var result , nextPath , output ,
		i , key , maskValue ,
		maskKeyList = Object.keys( context.mask ) ,
		j , inputKey , inputValue , inputKeyList ;
	
	if ( Array.isArray( input ) ) { output = [] ; }
	else { output = {} ; }
	
	
	// Iterate through mask properties
	for ( i = 0 ; i < maskKeyList.length ; i ++ )
	{
		key = maskKeyList[ i ] ;
		maskValue = context.mask[ key ] ;
		
		//console.log( '\nnext loop: ' , key , maskValue ) ;
		
		// The special key * is a wildcard, it match everything
		if ( key === '*' )
		{
			//console.log( 'wildcard' ) ;
			inputKeyList = Object.keys( input ) ;
			
			for ( j = 0 ; j < inputKeyList.length ; j ++ )
			{
				inputKey = inputKeyList[ j ] ;
				inputValue = input[ inputKey ] ;
				
				//console.log( '*: ' , inputKey ) ;
				nextPath = context.path + context.options.pathSeparator + inputKey ;
				
				// If it is an array or object, recursively check it
				if ( maskValue !== null && typeof maskValue === 'object' )
				{
					if ( input[ inputKey ] !== null && typeof input[ inputKey ] === 'object' )
					{
						if ( input[ inputKey ] instanceof masklib.Mask )
						{
							output[ inputKey ] = input[ inputKey ].applyTo( input[ inputKey ] , { path: nextPath } , true ) ;
						}
						else
						{
							output[ inputKey ] = this.applyTo( input[ inputKey ] , tree.extend( null , {} , context , { mask: maskValue , path: nextPath } ) ) ;
						}
					}
					else if ( typeof context.options.leaf === 'function' )
					{
						output[ inputKey ] = this.applyTo( {} , tree.extend( null , {} , context , { mask: maskValue , path: nextPath } ) ) ;
					}
				}
				else if ( maskValue !== null && typeof context.options.leaf === 'function' )
				{
					//console.log( 'leaf callback' ) ;
					result = context.options.leaf( input , inputKey , maskValue , nextPath ) ;
					if ( ! ( result instanceof Error ) ) { output[ inputKey ] = result ; }
				}
				else
				{
					if ( context.options.clone && ( input[ inputKey ] !== null && typeof input[ inputKey ] === 'object' ) )
					{
						output[ inputKey ] = tree.extend( { deep: true } , {} , input[ inputKey ] ) ;
					}
					else
					{
						output[ inputKey ] = input[ inputKey ] ;
					}
				}
			}
			
			continue ;
		}
		
		
		nextPath = context.path + context.options.pathSeparator + key ;
		
		// If it is an object, recursively check it
		//if ( maskValue instanceof masklib.Mask )
		if ( maskValue !== null && typeof maskValue === 'object' )
		{
			//console.log( 'sub' ) ;
			
			if ( input.hasOwnProperty( key ) && input[ key ] !== null && typeof input[ key ] === 'object' )
			{
				//console.log( 'recursive call' ) ;
				
				if ( input.key instanceof masklib.Mask )
				{
					output[ key ] = input.key.applyTo( input[ key ] , { path: nextPath } , true ) ;
				}
				else
				{
					output[ key ] = this.applyTo( input[ key ] , tree.extend( null , {} , context , { mask: maskValue , path: nextPath } ) ) ;
				}
			}
			// recursive call only if there are callback
			else if ( context.options.leaf )
			{
				//console.log( 'recursive call' ) ;
				output[ key ] = this.applyTo( {} , tree.extend( null , {} , context , { mask: maskValue , path: nextPath } ) ) ;
			}
		}
		// If mask exists, add the key
		else if ( input.hasOwnProperty( key ) )
		{
			//console.log( 'property found' ) ;
			
			if ( maskValue !== undefined && typeof context.options.leaf === 'function' )
			{
				//console.log( 'leaf callback' ) ;
				result = context.options.leaf( input , key , maskValue , nextPath ) ;
				if ( ! ( result instanceof Error ) ) { output[ key ] = result ; }
			}
			else
			{
				if ( context.options.clone && ( input[ key ] !== null && typeof input[ key ] === 'object' ) )
				{
					output[ key ] = tree.extend( { deep: true } , {} , input[ key ] ) ;
				}
				else
				{
					output[ key ] = input[ key ] ;
				}
			}
		}
		else if ( maskValue !== undefined && typeof context.options.leaf === 'function' )
		{
			//console.log( 'leaf callback' ) ;
			result = context.options.leaf( input , key , maskValue , nextPath ) ;
			if ( ! ( result instanceof Error ) ) { output[ key ] = result ; }
		}
	}
	
	return output ;
} ;



// InverseMask: create an output tree from the input, by excluding properties of the mask

masklib.InverseMask = function InverseMask()
{
	throw new Error( 'Cannot create a tree.InverseMask() directly' ) ;
} ;

util.inherits( masklib.InverseMask , masklib.Mask ) ;



/*
	options:
		clone: the output clone the input rather than reference it
		pathSeperator: when expressing path, this is the separator
*/
masklib.createInverseMask = function createInverseMask( maskArgument , options )
{
	if ( maskArgument === null || typeof maskArgument !== 'object' )
	{
		throw new TypeError( '[tree] .createInverseMask() : Argument #1 should be an object' ) ;
	}
	
	if ( options !== null && typeof options === 'object' ) { options = tree.extend( null , {} , maskDefaultOptions , options ) ; }
	else { options = maskDefaultOptions ; }
	
	var mask = Object.create( masklib.InverseMask.prototype , {
		__options__: { value: options , writable: true  }
	} ) ;
	
	tree.extend( null , mask , maskArgument ) ;
	
	return mask ;
} ;



// Apply the mask to an input tree
masklib.InverseMask.prototype.applyTo = function applyTo( input , context , contextOverideDefault )
{
	// Arguments checking
	if ( input === null || typeof input !== 'object' )
	{
		throw new TypeError( '[tree] .applyTo() : Argument #1 should be an object' ) ;
	}
	
	if ( contextOverideDefault )
	{
		context = tree.extend( null ,
			{
				mask: this ,
				options: this.__options__ ,
				path: this.__options__.path
			} ,
			context
		) ;
	}
	else if ( context === undefined )
	{
		context = {
			mask: this ,
			options: this.__options__ ,
			path: this.__options__.path
		} ;
	}
	
	
	// Init
	//console.log( context ) ;
	var nextPath , output ,
		i , key , maskValue ,
		maskKeyList = Object.keys( context.mask ) ,
		j , inputKey , inputValue , inputKeyList ;
	
	if ( Array.isArray( input ) ) { output = tree.extend( { deep: true } , [] , input ) ; }
	else { output = tree.extend( { deep: true } , {} , input ) ; }
	
	//console.log( output ) ;
	
	// Iterate through mask properties
	for ( i = 0 ; i < maskKeyList.length ; i ++ )
	{
		key = maskKeyList[ i ] ;
		maskValue = context.mask[ key ] ;
		
		//console.log( '\nnext loop: ' , key , maskValue ) ;
		
		// The special key * is a wildcard, it match everything
		if ( key === '*' )
		{
			//console.log( 'wildcard' ) ;
			inputKeyList = Object.keys( input ) ;
			
			for ( j = 0 ; j < inputKeyList.length ; j ++ )
			{
				inputKey = inputKeyList[ j ] ;
				inputValue = input[ inputKey ] ;
				
				//console.log( '*: ' , inputKey ) ;
				nextPath = context.path + context.options.pathSeparator + inputKey ;
				
				// If it is an array or object, recursively check it
				if ( maskValue !== null && typeof maskValue === 'object' )
				{
					if ( input[ inputKey ] !== null && typeof input[ inputKey ] === 'object' )
					{
						if ( input[ inputKey ] instanceof masklib.Mask )
						{
							output[ inputKey ] = input[ inputKey ].applyTo( input[ inputKey ] , { path: nextPath } , true ) ;
						}
						else
						{
							output[ inputKey ] = this.applyTo( input[ inputKey ] , tree.extend( null , {} , context , { mask: maskValue , path: nextPath } ) ) ;
						}
					}
				}
				else
				{
					delete output[ inputKey ] ;
				}
			}
			
			continue ;
		}
		
		
		nextPath = context.path + context.options.pathSeparator + key ;
		
		// If it is an object, recursively check it
		//if ( maskValue instanceof masklib.Mask )
		if ( maskValue !== null && typeof maskValue === 'object' )
		{
			//console.log( 'sub' ) ;
			
			if ( input.hasOwnProperty( key ) && input[ key ] !== null && typeof input[ key ] === 'object' )
			{
				//console.log( 'recursive call' ) ;
				
				if ( input.key instanceof masklib.Mask )
				{
					output[ key ] = input.key.applyTo( input[ key ] , { path: nextPath } , true ) ;
				}
				else
				{
					output[ key ] = this.applyTo( input[ key ] , tree.extend( null , {} , context , { mask: maskValue , path: nextPath } ) ) ;
				}
			}
		}
		// If mask exists, remove the key
		else if ( input.hasOwnProperty( key ) )
		{
			delete output[ key ] ;
		}
	}
	
	return output ;
} ;

},{"./tree.js":70,"util":75}],69:[function(require,module,exports){
/*
	Tree Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



var treePath = {} ;
module.exports = treePath ;



treePath.op = function op( type , object , path , value )
{
	var i , parts , last , pointer , key , isArray = false , pathArrayMode = false , isGenericSet , canBeEmpty = true ;
	
	if ( ! object || ( typeof object !== 'object' && typeof object !== 'function' ) )
	{
		return ;
	}
	
	if ( typeof path === 'string' )
	{
		// Split the path into parts
		if ( path ) { parts = path.match( /([.#\[\]]|[^.#\[\]]+)/g ) ; }
		else { parts = [ '' ] ; }
		
		if ( parts[ 0 ] === '.' ) { parts.unshift( '' ) ; }
		if ( parts[ parts.length - 1 ] === '.' ) { parts.push( '' ) ; }
	}
	else if ( Array.isArray( path ) )
	{
		parts = path ;
		pathArrayMode = true ;
	}
	else
	{
		throw new TypeError( '[tree.path] .' + type + '(): the path argument should be a string or an array' ) ;
	}
	
	switch ( type )
	{
		case 'get' :
		case 'delete' :
			isGenericSet = false ;
			break ;
		case 'set' :
		case 'define' :
		case 'inc' :
		case 'dec' :
		case 'append' :
		case 'prepend' :
		case 'concat' :
		case 'insert' :
		case 'autoPush' :
			isGenericSet = true ;
			break ;
		default :
			throw new TypeError( "[tree.path] .op(): wrong type of operation '" + type + "'" ) ;
	}
	
	//console.log( parts ) ;
	// The pointer start at the object's root
	pointer = object ;
	
	last = parts.length - 1 ;
	
	for ( i = 0 ; i <= last ; i ++ )
	{
		if ( pathArrayMode )
		{
			if ( key === undefined )
			{
				key = parts[ i ] ;
				continue ;
			}
			
			if ( ! pointer[ key ] || ( typeof pointer[ key ] !== 'object' && typeof pointer[ key ] !== 'function' ) )
			{
				if ( ! isGenericSet ) { return undefined ; }
				pointer[ key ] = {} ;
			}
			
			pointer = pointer[ key ] ;
			key = parts[ i ] ;
			
			continue ;
		}
		else if ( parts[ i ] === '.' )
		{
			isArray = false ;
			
			if ( key === undefined )
			{
				if ( ! canBeEmpty )
				{
					canBeEmpty = true ;
					continue ;
				}
				
				key = '' ;
			}
			
			if ( ! pointer[ key ] || ( typeof pointer[ key ] !== 'object' && typeof pointer[ key ] !== 'function' ) )
			{
				if ( ! isGenericSet ) { return undefined ; }
				pointer[ key ] = {} ;
			}
			
			pointer = pointer[ key ] ;
			canBeEmpty = true ;
			
			continue ;
		}
		else if ( parts[ i ] === '#' || parts[ i ] === '[' )
		{
			isArray = true ;
			canBeEmpty = false ;
			
			if ( key === undefined )
			{
				// The root element cannot be altered, we are in trouble if an array is expected but we have only a regular object.
				if ( ! Array.isArray( pointer ) ) { return undefined ; }
				continue ;
			}
			
			if ( ! pointer[ key ] || ! Array.isArray( pointer[ key ] ) )
			{
				if ( ! isGenericSet ) { return undefined ; }
				pointer[ key ] = [] ;
			}
			
			pointer = pointer[ key ] ;
			
			continue ;
		}
		else if ( parts[ i ] === ']' )
		{
			// Closing bracket: do nothing
			canBeEmpty = false ;
			continue ;
		}
		
		canBeEmpty = false ;
		
		if ( ! isArray ) { key = parts[ i ] ; continue ; }
		
		switch ( parts[ i ] )
		{
			case 'length' :
				key = parts[ i ] ;
				break ;
			
			// Pseudo-key
			case 'first' :
				key = 0 ;
				break ;
			case 'last' :
				key = pointer.length - 1 ;
				if ( key < 0 ) { key = 0 ; }
				break ;
			case 'next' :
				if ( ! isGenericSet ) { return undefined ; }
				key = pointer.length ;
				break ;
			case 'insert' :
				if ( ! isGenericSet ) { return undefined ; }
				pointer.unshift( undefined ) ;
				key = 0 ;
				break ;
			
			// default = number
			default:
				// Convert the string key to a numerical index
				key = parseInt( parts[ i ] , 10 ) ;
		}
	}
	
	switch ( type )
	{
		case 'get' :
			return pointer[ key ] ;
		case 'delete' :
			if ( isArray && typeof key === 'number' ) { pointer.splice( key , 1 ) ; }
			else { delete pointer[ key ] ; }
			return ;
		case 'set' :
			pointer[ key ] = value ;
			return pointer[ key ] ;
		case 'define' :
			// define: set only if it doesn't exist
			if ( ! ( key in pointer ) ) { pointer[ key ] = value ; }
			return pointer[ key ] ;
		case 'inc' :
			if ( typeof pointer[ key ] === 'number' ) { pointer[ key ] ++ ; }
			else if ( ! pointer[ key ] || typeof pointer[ key ] !== 'object' ) { pointer[ key ] = 1 ; }
			return pointer[ key ] ;
		case 'dec' :
			if ( typeof pointer[ key ] === 'number' ) { pointer[ key ] -- ; }
			else if ( ! pointer[ key ] || typeof pointer[ key ] !== 'object' ) { pointer[ key ] = -1 ; }
			return pointer[ key ] ;
		case 'append' :
			if ( ! pointer[ key ] ) { pointer[ key ] = [ value ] ; }
			else if ( Array.isArray( pointer[ key ] ) ) { pointer[ key ].push( value ) ; }
			//else ? do nothing???
			return pointer[ key ] ;
		case 'prepend' :
			if ( ! pointer[ key ] ) { pointer[ key ] = [ value ] ; }
			else if ( Array.isArray( pointer[ key ] ) ) { pointer[ key ].unshift( value ) ; }
			//else ? do nothing???
			return pointer[ key ] ;
		case 'concat' :
			if ( ! pointer[ key ] ) { pointer[ key ] = value ; }
			else if ( Array.isArray( pointer[ key ] ) && Array.isArray( value ) )
			{
				pointer[ key ] = pointer[ key ].concat( value ) ;
			}
			//else ? do nothing???
			return pointer[ key ] ;
		case 'insert' :
			if ( ! pointer[ key ] ) { pointer[ key ] = value ; }
			else if ( Array.isArray( pointer[ key ] ) && Array.isArray( value ) )
			{
				pointer[ key ] = value.concat( pointer[ key ] ) ;
			}
			//else ? do nothing???
			return pointer[ key ] ;
		case 'autoPush' :
			if ( pointer[ key ] === undefined ) { pointer[ key ] = value ; }
			else if ( Array.isArray( pointer[ key ] ) ) { pointer[ key ].push( value ) ; }
			else { pointer[ key ] = [ pointer[ key ] , value ] ; }
			return pointer[ key ] ;
	}
} ;



// get, set and delete use the same op() function
treePath.get = treePath.op.bind( undefined , 'get' ) ;
treePath.delete = treePath.op.bind( undefined , 'delete' ) ;
treePath.set = treePath.op.bind( undefined , 'set' ) ;
treePath.define = treePath.op.bind( undefined , 'define' ) ;
treePath.inc = treePath.op.bind( undefined , 'inc' ) ;
treePath.dec = treePath.op.bind( undefined , 'dec' ) ;
treePath.append = treePath.op.bind( undefined , 'append' ) ;
treePath.prepend = treePath.op.bind( undefined , 'prepend' ) ;
treePath.concat = treePath.op.bind( undefined , 'concat' ) ;
treePath.insert = treePath.op.bind( undefined , 'insert' ) ;
treePath.autoPush = treePath.op.bind( undefined , 'autoPush' ) ;



// Prototype used for object creation, so they can be created with Object.create( tree.path.prototype )
treePath.prototype = {
	get: function( path ) { return treePath.get( this , path ) ; } ,
	delete: function( path ) { return treePath.delete( this , path ) ; } ,
	set: function( path , value ) { return treePath.set( this , path , value ) ; } ,
	define: function( path , value ) { return treePath.define( this , path , value ) ; } ,
	inc: function( path , value ) { return treePath.inc( this , path , value ) ; } ,
	dec: function( path , value ) { return treePath.dec( this , path , value ) ; } ,
	append: function( path , value ) { return treePath.append( this , path , value ) ; } ,
	prepend: function( path , value ) { return treePath.prepend( this , path , value ) ; } ,
	concat: function( path , value ) { return treePath.concat( this , path , value ) ; } ,
	insert: function( path , value ) { return treePath.insert( this , path , value ) ; } ,
	autoPush: function( path , value ) { return treePath.autoPush( this , path , value ) ; }
} ;



// Upgrade an object so it can support get, set and delete at its root
treePath.upgrade = function upgrade( object )
{
	Object.defineProperties( object , {
		get: { value: treePath.op.bind( undefined , 'get' , object ) } ,
		delete: { value: treePath.op.bind( undefined , 'delete' , object ) } ,
		set: { value: treePath.op.bind( undefined , 'set' , object ) } ,
		define: { value: treePath.op.bind( undefined , 'define' , object ) } ,
		inc: { value: treePath.op.bind( undefined , 'inc' , object ) } ,
		dec: { value: treePath.op.bind( undefined , 'dec' , object ) } ,
		append: { value: treePath.op.bind( undefined , 'append' , object ) } ,
		prepend: { value: treePath.op.bind( undefined , 'prepend' , object ) } ,
		concat: { value: treePath.op.bind( undefined , 'concat' , object ) } ,
		insert: { value: treePath.op.bind( undefined , 'insert' , object ) } ,
		autoPush: { value: treePath.op.bind( undefined , 'autoPush' , object ) }
	} ) ;
} ;




},{}],70:[function(require,module,exports){
/*
	Tree Kit
	
	Copyright (c) 2014 - 2016 Cédric Ronvel
	
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



// Create and export
var tree = {} ;
module.exports = tree ;


// Tier 0: extend() is even used to build the module
tree.extend = require( './extend.js' ) ;



tree.extend( null , tree ,
	
	// Tier 1
	require( './lazy.js' ) ,
	
	// Tier 2
	{ clone: require( './clone.js' ) } ,
	
	// Tier 3
	{ path: require( './path.js' ) } ,
	require( './diff.js' ) ,
	require( './mask.js' )
) ;



},{"./clone.js":64,"./diff.js":65,"./extend.js":66,"./lazy.js":67,"./mask.js":68,"./path.js":69}],71:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":72,"punycode":48,"querystring":51}],72:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],73:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],74:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],75:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":74,"_process":47,"inherits":73}],76:[function(require,module,exports){
module.exports={
  "name": "tea-time",
  "version": "0.8.0",
  "engines": {
    "node": ">=4.5.0"
  },
  "description": "Unit test: Tea Time!",
  "main": "lib/TeaTime.js",
  "bin": {
    "tea-time": "./bin/tea-time"
  },
  "directories": {
    "test": "test"
  },
  "dependencies": {
    "async-kit": "^2.2.3",
    "async-try-catch": "^0.3.4",
    "browserify": "^13.1.1",
    "diff": "^3.1.0",
    "dom-kit": "^0.1.2",
    "falafel": "^2.0.0",
    "glob": "^7.1.1",
    "minimist": "^1.2.0",
    "nextgen-events": "^0.9.8",
    "string-kit": "^0.5.14",
    "terminal-kit": "^0.25.6",
    "tree-kit": "^0.5.26",
    "uglify-js": "^2.7.5",
    "ws": "^1.1.1"
  },
  "optionalDependencies": {
    "freedesktop-notifications": "^1.2.2"
  },
  "devDependencies": {
    "expect.js": "^0.3.1",
    "jshint": "^2.9.4",
    "mocha": "^3.2.0"
  },
  "scripts": {
    "test": "mocha -R dot"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/cronvel/tea-time.git"
  },
  "keywords": [
    "unit",
    "test",
    "bdd",
    "tdd",
    "tap",
    "mocha"
  ],
  "author": "Cédric Ronvel",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/cronvel/tea-time/issues"
  },
  "config": {
    "tea-time": {
      "coverDir": [
        "sample"
      ]
    }
  },
  "copyright": {
    "title": "Tea Time!",
    "years": [
      2015,
      2016
    ],
    "owner": "Cédric Ronvel"
  }
}
},{}]},{},[6])(6)
});