(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.createTeaTime = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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



var passingStyle = "color:green;" ;
var failingStyle = "color:red;" ;
var optionalFailingStyle = "color:brown;" ;
var pendingStyle = "color:blue;" ;

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



Reporter.report = function report( ok , fail , optionalFail , skip )
{
	this.container.insertAdjacentHTML(
		'beforeend' ,
		'<hr />' +
		'<p class="tea-time-classic-reporter" style="font-weight:bold;' + passingStyle + indentStyle( 1 ) + '">' + ok + ' passing</p>' +
		'<p class="tea-time-classic-reporter" style="font-weight:bold;' + failingStyle + indentStyle( 1 ) + '">' + fail + ' failing</p>' +
		'<p class="tea-time-classic-reporter" style="font-weight:bold;' + optionalFailingStyle + indentStyle( 1 ) + '">' + optionalFail + ' opt failing</p>' +
		'<p class="tea-time-classic-reporter" style="font-weight:bold;' + pendingStyle + indentStyle( 1 ) + '">' + skip + ' pending</p>'
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



},{}],2:[function(require,module,exports){
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



Reporter.report = function report( ok , fail , optionalFail , skip )
{
	console.log( 'Report -- ok:' , ok , ' fail:' , fail , ' opt fail:' , optionalFail , ' pending:' , skip ) ;
} ;



},{}],3:[function(require,module,exports){
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
	
	self.teaTime.on( 'run' , Reporter.forward.bind( self , 'run' ) ) ;
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

/* global window */



var TeaTime = require( './tea-time.js' ) ;
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




},{"./browser-reporters/classic.js":1,"./browser-reporters/console.js":2,"./browser-reporters/websocket.js":3,"./diff.js":5,"./htmlColorDiff.js":6,"./tea-time.js":7,"dom-kit":40,"string-kit/lib/inspect.js":47,"url":23}],5:[function(require,module,exports){
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
	
	if ( ! noCharMode )
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



},{"diff":34,"string-kit/lib/inspect.js":47}],6:[function(require,module,exports){
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





},{"./diff.js":5}],7:[function(require,module,exports){
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
	
	if ( ! options.reporters ) { options.reporters = [ 'classic' ] ; }
	if ( ! options.clientReporters ) { options.clientReporters = [ 'classic' ] ; }
	
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
	if ( args.g )
	{
		if ( ! Array.isArray( args.g ) ) { args.g = [ args.g ] ; }
		
		for ( i = 0 , iMax = args.g.length ; i < iMax ; i ++ )
		{
			options.grep.push( new RegExp( args.g[ i ] , 'i' ) ) ;
			options.sourceGrep.push( args.g[ i ] ) ;
		}
	}
	
	if ( args.grep )
	{
		if ( ! Array.isArray( args.grep ) ) { args.grep = [ args.grep ] ; }
		
		for ( i = 0 , iMax = args.grep.length ; i < iMax ; i ++ )
		{
			options.grep.push( new RegExp( args.grep[ i ] , 'i' ) ) ;
			options.sourceGrep.push( args.grep[ i ] ) ;
		}
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
	
		self.emit( 'run' , self.testCount ) ;
		
		var triggerCallback = function() {
			if ( callbackTriggered ) { return ; }
			if ( typeof callback === 'function' ) { callback() ; }
		} ;
		
		self.startTime = Date.now() ;
		
		self.runSuite( self.suite , 0 , function() {
			
			self.emit( 'report' , self.ok , self.fail , self.optionalFail , self.skip , Date.now() - self.startTime ) ;
			
			if ( self.fail + self.optionalFail ) { self.emit( 'errorReport' , self.errors ) ; }
			
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
	return TeaTime.registerTest.call( this , testName , fn , true ) ;
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
},{"async-kit":8,"async-try-catch":13,"nextgen-events":42}],8:[function(require,module,exports){
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



},{"./core.js":9,"./exit.js":10,"./safeTimeout.js":11,"./wrapper.js":12}],9:[function(require,module,exports){
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
	
	this.jobsKeys = Object.keys( this.jobsData ) ;
	
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
	var indexOfKey , key , length = execContext.jobsKeys.length , startIndex , endIndex ;
	
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
		this.execJob( execContext , execContext.jobsData[ execContext.jobsKeys[ indexOfKey ] ] , indexOfKey , 0 ) ;
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




},{"nextgen-events":42,"tree-kit/lib/extend.js":48}],10:[function(require,module,exports){
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
},{"./async.js":8,"_process":18}],11:[function(require,module,exports){
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



},{}],12:[function(require,module,exports){
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



},{}],13:[function(require,module,exports){
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
		//global.AsyncTryCatch = AsyncTryCatch ;
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
	
	wrapperFn = function() {
		try {
			global.AsyncTryCatch.stack.push( context ) ;
			fn.apply( this , arguments ) ;
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
AsyncTryCatch.addListenerWrapper = function addListenerWrapper( originalMethod , eventName , fn , options )
{
	var fn , context , wrapperFn ;
	
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
	
	// Assume that the function is only wrapped once per eventEmitter
	if ( this.__fnToWrapperMap )
	{
		wrapperFn = this.__fnToWrapperMap.get( fn ) ;
	}
	else 
	{
		// Create the map, make it non-enumerable
		Object.defineProperty( this , '__fnToWrapperMap', { value: new WeakMap() } ) ;
	}
	
	if ( ! wrapperFn )
	{
		wrapperFn = function() {
			try {
				global.AsyncTryCatch.stack.push( context ) ;
				fn.apply( this , arguments ) ;
				global.AsyncTryCatch.stack.pop() ;
			}
			catch ( error ) {
				global.AsyncTryCatch.stack.pop() ;
				context.callCatchFn( error ) ;
			}
		} ;
		
		this.__fnToWrapperMap.set( fn , wrapperFn ) ;
	}
	
	return originalMethod.call( this , eventName , wrapperFn , options ) ;
} ;



AsyncTryCatch.removeListenerWrapper = function removeListenerWrapper( originalMethod , eventName , fn )
{
	//console.log( 'fn:' , fn ) ;
	
	if ( typeof fn === 'function' && this.__fnToWrapperMap )
	{
		fn = this.__fnToWrapperMap.get( fn ) || fn ;
	}
	
	return originalMethod.call( this , eventName , fn ) ;
} ;



AsyncTryCatch.setTimeout = AsyncTryCatch.timerWrapper.bind( undefined , global.Vanilla.setTimeout ) ;
AsyncTryCatch.setImmediate = AsyncTryCatch.timerWrapper.bind( undefined , global.Vanilla.setImmediate ) ;
AsyncTryCatch.nextTick = AsyncTryCatch.timerWrapper.bind( process , global.Vanilla.nextTick ) ;

// NodeEvents on()/addListener() replacement
AsyncTryCatch.addListener = function addListener( eventName , fn )
{
	AsyncTryCatch.addListenerWrapper.call( this , AsyncTryCatch.NodeEvents.__addListener , eventName , fn ) ;
} ;

// NodeEvents once() replacement
AsyncTryCatch.addListenerOnce = function addListenerOnce( eventName , fn )
{
	AsyncTryCatch.addListenerWrapper.call( this , AsyncTryCatch.NodeEvents.__addListenerOnce , eventName , fn ) ;
} ;

// NodeEvents removeListener() replacement
AsyncTryCatch.removeListener = function removeListener( eventName , fn )
{
	AsyncTryCatch.removeListenerWrapper.call( this , AsyncTryCatch.NodeEvents.__removeListener , eventName , fn ) ;
} ;

// NextGen Events on()/addListener() replacement
AsyncTryCatch.ngevAddListener = function ngevAddListener( eventName , fn , options )
{
	/*
	console.log( 'this:' , this ) ;
	console.log( 'this.asyncTryCatchId:' , this.asyncTryCatchId ) ;
	console.log( 'called with:' , Array.from( arguments ) ) ;
	try {*/
	AsyncTryCatch.addListenerWrapper.call( this , AsyncTryCatch.NextGenEvents[ this.asyncTryCatchId ].on , eventName , fn , options ) ;
	/*}
	catch ( error ) {
		console.error( error ) ;
		console.log( index ) ;
		throw error ;
	}*/
} ;

// NextGen Events once() replacement
AsyncTryCatch.ngevAddListenerOnce = function ngevAddListenerOnce( eventName , fn , options )
{
	AsyncTryCatch.addListenerWrapper.call( this , AsyncTryCatch.NextGenEvents[ this.asyncTryCatchId ].once , eventName , fn , options ) ;
} ;

// NextGen Events off()/removeListener() replacement
AsyncTryCatch.ngevRemoveListener = function ngevRemoveListener( eventName , fn )
{
	AsyncTryCatch.removeListenerWrapper.call( this , AsyncTryCatch.NextGenEvents[ this.asyncTryCatchId ].off , eventName , fn ) ;
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
	
	/*
	try {
		AsyncTryCatch.NextGenEvents = global.NextGenEvents || require( 'nextgen-events' ) ;
	} catch ( error ) {}
	*/
	
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
	
	/*
	if ( AsyncTryCatch.NextGenEvents )
	{
		AsyncTryCatch.NextGenEvents.prototype.on = AsyncTryCatch.ngevAddListener ;
		AsyncTryCatch.NextGenEvents.prototype.addListener = AsyncTryCatch.ngevAddListener ;
		AsyncTryCatch.NextGenEvents.prototype.once = AsyncTryCatch.ngevAddListenerOnce ;
		AsyncTryCatch.NextGenEvents.prototype.off = AsyncTryCatch.ngevRemoveListener ;
		AsyncTryCatch.NextGenEvents.prototype.removeListener = AsyncTryCatch.ngevRemoveListener ;
	}
	*/
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
	
	/*
	if ( AsyncTryCatch.NextGenEvents )
	{
		AsyncTryCatch.NextGenEvents.prototype.on = AsyncTryCatch.NextGenEvents.on ;
		AsyncTryCatch.NextGenEvents.prototype.addListener = AsyncTryCatch.NextGenEvents.on ;
		AsyncTryCatch.NextGenEvents.prototype.once = AsyncTryCatch.NextGenEvents.once ;
		AsyncTryCatch.NextGenEvents.prototype.off = AsyncTryCatch.NextGenEvents.off ;
		AsyncTryCatch.NextGenEvents.prototype.removeListener = AsyncTryCatch.NextGenEvents.removeListener ;
	}
	*/
} ;



}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../package.json":14,"_process":18,"events":16}],14:[function(require,module,exports){
module.exports={
  "name": "async-try-catch",
  "version": "0.3.0",
  "description": "Async try catch",
  "main": "lib/AsyncTryCatch.js",
  "directories": {
    "test": "test"
  },
  "dependencies": {},
  "devDependencies": {
    "browserify": "^13.0.1",
    "expect.js": "^0.3.1",
    "jshint": "^2.9.2",
    "mocha": "^2.5.3",
    "nextgen-events": "^0.9.5",
    "uglify-js": "^2.6.2"
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
  "gitHead": "ef7c8947313326a8a5a9f869846072e6007e3bed",
  "homepage": "https://github.com/cronvel/async-try-catch#readme",
  "_id": "async-try-catch@0.3.0",
  "_shasum": "71f922c34ce96e5a88d3799b3bbbadbee355d42c",
  "_from": "async-try-catch@>=0.3.0 <0.4.0"
}

},{}],15:[function(require,module,exports){

},{}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
/**
 * Determine if an object is Buffer
 *
 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * License:  MIT
 *
 * `npm install is-buffer`
 */

module.exports = function (obj) {
  return !!(obj != null &&
    (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
      (obj.constructor &&
      typeof obj.constructor.isBuffer === 'function' &&
      obj.constructor.isBuffer(obj))
    ))
}

},{}],18:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
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
    var timeout = cachedSetTimeout.call(null, cleanUpNextTick);
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
    cachedClearTimeout.call(null, timeout);
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
        cachedSetTimeout.call(null, drainQueue, 0);
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

},{}],19:[function(require,module,exports){
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
},{}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":20,"./encode":21}],23:[function(require,module,exports){
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

},{"./util":24,"punycode":19,"querystring":22}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
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


},{}],26:[function(require,module,exports){
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


},{}],27:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.default = /*istanbul ignore end*/Diff;
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
      return done([{ value: newString.join(''), count: newString.length }]);
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

        component.value = value.join('');
      } else {
        component.value = newString.slice(newPos, newPos + component.count).join('');
      }
      newPos += component.count;

      // Common case
      if (!component.added) {
        oldPos += component.count;
      }
    } else {
      component.value = oldString.slice(oldPos, oldPos + component.count).join('');
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


},{}],28:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.characterDiff = undefined;
exports. /*istanbul ignore end*/diffChars = diffChars;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*istanbul ignore end*/var characterDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/characterDiff = new /*istanbul ignore start*/_base2.default() /*istanbul ignore end*/;
function diffChars(oldStr, newStr, callback) {
  return characterDiff.diff(oldStr, newStr, callback);
}


},{"./base":27}],29:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.cssDiff = undefined;
exports. /*istanbul ignore end*/diffCss = diffCss;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*istanbul ignore end*/var cssDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/cssDiff = new /*istanbul ignore start*/_base2.default() /*istanbul ignore end*/;
cssDiff.tokenize = function (value) {
  return value.split(/([{}:;,]|\s+)/);
};

function diffCss(oldStr, newStr, callback) {
  return cssDiff.diff(oldStr, newStr, callback);
}


},{"./base":27}],30:[function(require,module,exports){
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*istanbul ignore end*/

var objectPrototypeToString = Object.prototype.toString;

var jsonDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/jsonDiff = new /*istanbul ignore start*/_base2.default() /*istanbul ignore end*/;
// Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
// dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:
jsonDiff.useLongestToken = true;

jsonDiff.tokenize = /*istanbul ignore start*/_line.lineDiff. /*istanbul ignore end*/tokenize;
jsonDiff.castInput = function (value) {
  return typeof value === 'string' ? value : JSON.stringify(canonicalize(value), undefined, '  ');
};
jsonDiff.equals = function (left, right) {
  return (/*istanbul ignore start*/_base2.default. /*istanbul ignore end*/prototype.equals(left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'))
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


},{"./base":27,"./line":31}],31:[function(require,module,exports){
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*istanbul ignore end*/var lineDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/lineDiff = new /*istanbul ignore start*/_base2.default() /*istanbul ignore end*/;
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


},{"../util/params":39,"./base":27}],32:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.sentenceDiff = undefined;
exports. /*istanbul ignore end*/diffSentences = diffSentences;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*istanbul ignore end*/var sentenceDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/sentenceDiff = new /*istanbul ignore start*/_base2.default() /*istanbul ignore end*/;
sentenceDiff.tokenize = function (value) {
  return value.split(/(\S.+?[.!?])(?=\s+|$)/);
};

function diffSentences(oldStr, newStr, callback) {
  return sentenceDiff.diff(oldStr, newStr, callback);
}


},{"./base":27}],33:[function(require,module,exports){
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var wordDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/wordDiff = new /*istanbul ignore start*/_base2.default() /*istanbul ignore end*/;
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


},{"../util/params":39,"./base":27}],34:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.canonicalize = exports.convertChangesToXML = exports.convertChangesToDMP = exports.parsePatch = exports.applyPatches = exports.applyPatch = exports.createPatch = exports.createTwoFilesPatch = exports.structuredPatch = exports.diffJson = exports.diffCss = exports.diffSentences = exports.diffTrimmedLines = exports.diffLines = exports.diffWordsWithSpace = exports.diffWords = exports.diffChars = exports.Diff = undefined;
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

var /*istanbul ignore start*/_apply = require('./patch/apply') /*istanbul ignore end*/;

var /*istanbul ignore start*/_parse = require('./patch/parse') /*istanbul ignore end*/;

var /*istanbul ignore start*/_create = require('./patch/create') /*istanbul ignore end*/;

var /*istanbul ignore start*/_dmp = require('./convert/dmp') /*istanbul ignore end*/;

var /*istanbul ignore start*/_xml = require('./convert/xml') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* See LICENSE file for terms of use */

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
exports. /*istanbul ignore end*/Diff = _base2.default;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffChars = _character.diffChars;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffWords = _word.diffWords;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffWordsWithSpace = _word.diffWordsWithSpace;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffLines = _line.diffLines;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffTrimmedLines = _line.diffTrimmedLines;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffSentences = _sentence.diffSentences;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffCss = _css.diffCss;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffJson = _json.diffJson;
/*istanbul ignore start*/exports. /*istanbul ignore end*/structuredPatch = _create.structuredPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/createTwoFilesPatch = _create.createTwoFilesPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/createPatch = _create.createPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/applyPatch = _apply.applyPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/applyPatches = _apply.applyPatches;
/*istanbul ignore start*/exports. /*istanbul ignore end*/parsePatch = _parse.parsePatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/convertChangesToDMP = _dmp.convertChangesToDMP;
/*istanbul ignore start*/exports. /*istanbul ignore end*/convertChangesToXML = _xml.convertChangesToXML;
/*istanbul ignore start*/exports. /*istanbul ignore end*/canonicalize = _json.canonicalize;


},{"./convert/dmp":25,"./convert/xml":26,"./diff/base":27,"./diff/character":28,"./diff/css":29,"./diff/json":30,"./diff/line":31,"./diff/sentence":32,"./diff/word":33,"./patch/apply":35,"./patch/create":36,"./patch/parse":37}],35:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/applyPatch = applyPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/applyPatches = applyPatches;

var /*istanbul ignore start*/_parse = require('./parse') /*istanbul ignore end*/;

var /*istanbul ignore start*/_distanceIterator = require('../util/distance-iterator') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _distanceIterator2 = _interopRequireDefault(_distanceIterator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
  var lines = source.split('\n'),
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

    var iterator = /*istanbul ignore start*/(0, _distanceIterator2.default) /*istanbul ignore end*/(toPos, minLine, maxLine);

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
          content = line.substr(1);

      if (operation === ' ') {
        _toPos++;
      } else if (operation === '-') {
        lines.splice(_toPos, 1);
        /* istanbul ignore else */
      } else if (operation === '+') {
          lines.splice(_toPos, 0, content);
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
    }
  } else if (addEOFNL) {
    lines.push('');
  }
  return lines.join('\n');
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


},{"../util/distance-iterator":38,"./parse":37}],36:[function(require,module,exports){
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


},{"../diff/line":31}],37:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/parsePatch = parsePatch;
function parsePatch(uniDiff) {
  /*istanbul ignore start*/var /*istanbul ignore end*/options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var diffstr = uniDiff.split('\n'),
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
      lines: []
    };

    var addCount = 0,
        removeCount = 0;
    for (; i < diffstr.length; i++) {
      var operation = diffstr[i][0];

      if (operation === '+' || operation === '-' || operation === ' ' || operation === '\\') {
        hunk.lines.push(diffstr[i]);

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


},{}],38:[function(require,module,exports){
/*istanbul ignore start*/"use strict";

exports.__esModule = true;

exports.default = /*istanbul ignore end*/function (start, minLine, maxLine) {
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


},{}],39:[function(require,module,exports){
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


},{}],40:[function(require,module,exports){
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
dom.css = function css( element , object )	// , deb )
{
	var key ;
	
	//if ( deb ) { console.log( 'css: ' + string.inspect( object ) ) ; }
	
	for ( key in object )
	{
		element.style[ key ] = object[ key ] ;
	}
} ;



// Set a bunch of attributes given as an object
dom.attr = function attr( element , object )	// , deb )
{
	var key ;
	
	//if ( deb ) { console.log( 'css: ' + string.inspect( object ) ) ; }
	
	for ( key in object )
	{
		//element.attributes[ key ] = object[ key ] ;
		if ( object[ key ] === null ) { element.removeAttribute( key ) ; }
		else { element.setAttribute( key , object[ key ] ) ; }
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





},{"./svg.js":41}],41:[function(require,module,exports){
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
	
	* container: the DOM element where the <svg> tag will be put
	* url: the URL of the .svg file
	* options: an optional object with optional options
		* id: the id attribute of the <svg> tag (recommanded)
		* class: the class attribute of the <svg> tag
		* hidden: inject the svg but make it hidden (useful to apply modification before the show)
	* callback: completion callback
*/
domSvg.load = function load( container , url , options , callback )
{
	if ( typeof options === 'function' ) { callback = options ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	if ( url.substring( 0 , 7 ) === 'file://' )
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
			
			var svg = xmlDoc.documentElement ;
			
			if ( error ) { callback( error ) ; return ; }
			
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
	domSvg.lightCleanup( svg ) ;
	
	// Fix id, if necessary
	if ( options.id !== undefined )
	{
		if ( typeof options.id === 'string' ) { svg.setAttribute( 'id' , options.id ) ; }
		else if ( ! options.id ) { svg.removeAttribute( 'id' ) ; }
	}
	
	//if ( typeof options.class === 'string' ) { svg.classList.add( options.class ) ; }	// like jQuery .addClass()
	if ( typeof options.class === 'string' ) { svg.setAttribute( 'class' , options.class ) ; }
	
	if ( options.idNamespace ) { dom.idNamespace( svg , options.idNamespace ) ; }
	
	if ( options.hidden ) { svg.style.visibility = 'hidden' ; }
	
	container.appendChild( svg ) ;
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



},{"./dom.js":40,"fs":15}],42:[function(require,module,exports){
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
},{"../package.json":44,"./Proxy.js":43}],43:[function(require,module,exports){
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



},{"./NextGenEvents.js":42}],44:[function(require,module,exports){
module.exports={
  "name": "nextgen-events",
  "version": "0.9.5",
  "description": "The next generation of events handling for javascript! New: abstract away the network!",
  "main": "lib/NextGenEvents.js",
  "directories": {
    "test": "test"
  },
  "dependencies": {},
  "devDependencies": {
    "browserify": "^13.0.1",
    "expect.js": "^0.3.1",
    "jshint": "^2.9.2",
    "mocha": "^2.5.3",
    "uglify-js": "^2.6.2",
    "ws": "^1.1.1"
  },
  "scripts": {
    "test": "mocha -R dot"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/cronvel/nextgen-events.git"
  },
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
  "author": {
    "name": "Cédric Ronvel"
  },
  "license": "MIT",
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
  "readme": "\n\n# NextGen Events\n\nNext generation of events handling for node.js\n\n* License: MIT\n* Current status: close to release\n* Platform: Node.js and browsers\n\n*NextGen Events* solves common trouble that one may encounter when dealing with events and listeners.\n\n## Feature highlights:\n\n* Standard event-handling almost compatible with Node.js built-in events\n* .emit() support a completion callback\n* Support for asynchronous event-handling\n* Multiple listeners can be tied to a single context\n* A context can be temporarly *disabled*\n* A context can be in *queue* mode: events for its listeners are stored, they will be *resumed* when the context is enabled again\n* Context serialization: async listeners can be run one after the other is fully completed\n* **NEW: proxy services!** Abstract away your network: emit and listen to emitter on the other side of the plug!\n\nEmitting events asynchronously or registering a listener that will be triggered asynchronously because it performs\nnon-critical tasks has some virtues: it gives some breath to the event-loop, so important I/O can be processed as soon as possible.\n\nContexts are really useful, it handles a collection of listeners.\nAt first glance, it looks like a sort of namespace for listeners.\nBut it can do more than that: you can turn a context off, so every listener tied to this context will not be triggered anymore,\nthen turn it on and they will be available again. \n\nYou can even switch a context into queue mode: the listeners tied to it will not be triggered, but events for those\nlisteners will be stored in the context. When the context is resumed, all retained events will trigger their listeners.\nThis allow one to postpone some operations, while performing some other high priority tasks, but be careful:\ndepending on your application nature, the queue may grow fast and consumes a lot of memory very quickly.\n\nOne of the top feature of this lib is the context serialization: it greatly eases the flow of the code!\nWhen differents events can fire at the same time, there are use cases when one does not want that async listener run concurrently.\nThe context serialization feature will ensure you that no concurrency will happen for listeners tied to it.\nYou do not have to code fancy or complicated tests to cover all cases anymore: just let *NextGen Events* do it for you!\n\n**Proxy services are awesome.** They abstract away the network so we can emit and listen to emitter on the other side of the plug!\nBoth side of the channel create a Proxy, and add to it local and remote *services*, i.e. event emitters, and that's all.\nA remote service looks like a normal (i.e. local) emitter, and share the same API (with few limitations).\nIt's totally protocol agnostic, you just define two methods for your proxy: one to read from the network and one to send to it\n(e.g. for Web Socket, this is a one-liner).\n\n\n\n# Install\n\nUse npm:\n\n```\nnpm install nextgen-events\n```\n\n\n# Getting started\n\nBy the way you can create an event emitter simply by creating a new object, this way:\n\n```js\nvar NGEmitter = require( 'nextgen-events' ) ;\nvar emitter = new NGEmitter() ;\n```\n\nYou can use `var emitter = Object.create( NGEmitter.prototype )` as well, the object does not need the constructor.\n\nBut in real life, you would make your own objects inherit it:\n\n```js\nvar NGEmitter = require( 'nextgen-events' ) ;\n\nfunction myClass()\n{\n\t// myClass constructor code here\n}\n\nmyClass.prototype = Object.create( NGEmitter.prototype ) ;\nmyClass.prototype.constructor = myClass ;\t// restore the constructor\n\n// define other methods for myClass...\n```\n\nThe basis of the event emitter works like Node.js built-in events:\n\n```js\nvar NGEmitter = require( 'nextgen-events' ) ;\nvar emitter = new NGEmitter() ;\n\n// Normal listener\nemitter.on( 'message' , function( message ) {\n\tconsole.log( 'Message received: ' , message ) ;\n} ) ;\n\n// One time listener:\nemitter.once( 'close' , function() {\n\tconsole.log( 'Connection closed!' ) ;\n} ) ;\n\n// The error listener: if it is not defined, the error event will throw an exception\nemitter.on( 'error' , function( error ) {\n\tconsole.log( 'Shit happens: ' , error ) ;\n} ) ;\n\nemitter.emit( 'message' , 'Hello world!' ) ;\n// ...\n```\n\n\n\n# References\n\nNode.js documentation:\n\n> When an EventEmitter instance experiences an error, the typical action is to emit an 'error' event.\n> Error events are treated as a special case in node. If there is no listener for it,\n> then the default action is to print a stack trace and exit the program.\n\n> All EventEmitters emit the event 'newListener' when new listeners are added and 'removeListener' when a listener is removed. \n\nFor the 'newListener' and 'removeListener' events, see the section about [incompatibilities](#incompatibilities), since there\nare few differences with the built-in Node.js EventEmitter.\n\n\n\n## Table of Content\n\n* [Events](#ref.events)\n\t* [.addListener() / .on()](#ref.events.addListener)\n\t* [.once()](#ref.events.once)\n\t* [.removeListener() / .off()](#ref.events.removeListener)\n\t* [.removeAllListeners()](#ref.events.removeAllListeners)\n\t* [.setMaxListeners()](#ref.events.setMaxListeners)\n\t* [.listeners()](#ref.events.listeners)\n\t* [.listenerCount()](#ref.events.listenerCount)\n\t* [.setNice()](#ref.events.setNice)\n\t* [.emit()](#ref.events.emit)\n\t* [.addListenerContext()](#ref.events.addListenerContext)\n\t* [.disableListenerContext()](#ref.events.disableListenerContext)\n\t* [.queueListenerContext()](#ref.events.queueListenerContext)\n\t* [.enableListenerContext()](#ref.events.enableListenerContext)\n\t* [.setListenerContextNice()](#ref.events.setListenerContextNice)\n\t* [.serializeListenerContext()](#ref.events.serializeListenerContext)\n\t* [.destroyListenerContext()](#ref.events.destroyListenerContext)\n\t* [the *nice feature*](#ref.note.nice)\n\t* [incompatibilities](#incompatibilities)\n* [Proxy Services](#ref.proxy)\n\n\n\n<a name=\"ref.events\"></a>\n## Events\n\n<a name=\"ref.events.addListener\"></a>\n### .addListener( eventName , [fn] , [options] )   *or*   .on( eventName , [fn] , [options] )\n\n* eventName `string` the name of the event to bind to\n* fn `Function` the callback function for this event, this argument is optional: it can be passed to the `fn` property of `options`\n* options `Object` where:\n\t* fn `Function` (mandatory if no `fn` argument provided) the listener function\n\t* id `any type` (default to the provided *fn* function) the identifier of the listener, useful if we have to remove it later\n\t* once `boolean` (default: false) *true* if this is a one-time-listener\n\t* context `string` (default: undefined - no context) a non-empty string identifying a context, if defined the listener\n\t  will be tied to this context, if this context is unexistant, it will be implicitly defined with default behaviour\n\t* nice `integer` (default: -Infinity) see [the nice feature](#ref.note.nice) for details\n\t* async `boolean` (default: false) set it to *true* if the listener is async by nature and a context serialization is wanted,\n\t  when *async* is set for a listener, it **MUST** accept a completion callback as its last argument.\n\t* eventObject `boolean` (default: false) if set, the listener will be passed an unique argument: the very same event object\n\t  that is returned by `.emit()`, if the listener is async, a second argument is passed as the callback\n\nNode.js documentation:\n\n> Adds a listener to the end of the listeners array for the specified event.\n> No checks are made to see if the listener has already been added.\n> Multiple calls passing the same combination of event and listener will result in the listener being added multiple times.\n\n```js\nserver.on( 'connection' , function( stream ) {\n\tconsole.log( 'someone connected!' ) ;\n} ) ;\n```\n\n> Returns emitter, so calls can be chained.\n\nExample, creating implicitly a context the listeners will be tied to:\n\n```js\nserver.on( 'connection' , {\n\tcontext: 'ctx' ,\n\tfn: function( stream ) {\n\t\tconsole.log( 'someone connected!' ) ;\n\t}\n} ) ;\n\nserver.on( 'close' , {\n\tcontext: 'ctx' ,\n\tfn: function() {\n\t\tconsole.log( 'connection closed!' ) ;\n\t\t\n\t\t// Destroy the context and all listeners tied to it:\n\t\tserver.destroyListenerContext( 'ctx' ) ;\n\t}\n} ) ;\n\nserver.on( 'error' , {\n\tcontext: 'ctx' ,\n\tfn: function() {\n\t\t// some error handling code\n\t\t\n\t\t// Destroy the context and all listeners tied to it:\n\t\tserver.destroyListenerContext( 'ctx' ) ;\n\t}\n} ) ;\n```\n\nWhen an async listener is defined, the completion callback is automatically added at the end of the arguments \nsupplied to [.emit()](#ref.events.emit) for any listeners with *async = true*.\n\n\n\n<a name=\"ref.events.once\"></a>\n### .once( eventName , listener )\n\n* eventName `string` the name of the event to bind to\n* listener `Function` or `Object` the listener that will listen to this event, it can be a function or an object where:\n\t* fn `Function` (mandatory) the listener function\n\t* id `any type` (default to the provided *fn* function) the identifier of the listener, useful if we have to remove it later\n\t* context `string` (default: undefined - no context) a non-empty string identifying a context, if defined the listener\n\t  will be tied to this context, if this context is unexistant, it will be implicitly defined with default behaviour\n\t* nice `integer` (default: -Infinity) see [the nice feature](#ref.note.nice) for details\n\t* async `boolean` (default: false) set it to *true* if the listener is async by nature and a context serialization is wanted\n\nNode.js documentation:\n\n> Adds a **one time** listener for the event.\n> This listener is invoked only the next time the event is fired, after which it is removed. \n\n```js\nserver.once( 'connection' , function( stream ) {\n\tconsole.log( 'Ah, we have our first user!' ) ;\n} ) ;\n```\n\n> Returns emitter, so calls can be chained.\n\nNote that using `.once()` in *NextGen Events* lib is just a syntactic sugar (and it's also there for compatibility),\nthe previous example can be rewritten using `.on()`:\n\n```js\nserver.on( 'connection' , {\n\tfn: function( stream ) {\n\t\tconsole.log( 'Ah, we have our first user!' ) ;\n\t} ,\n\tonce: true\n} ) ;\n```\n\n\n\n<a name=\"ref.events.removeListener\"></a>\n### .removeListener( eventName , listenerID )   *or*   .off( eventName , listenerID )\n\n* eventName `string` the name of the event the listener to remove is binded to\n* listenerID `any type` the identifier of the listener to remove\n\nNode.js documentation:\n\n> Remove a listener from the listener array for the specified event.\n> **Caution**: changes array indices in the listener array behind the listener. \n\n```js\nvar callback = function( stream ) {\n\tconsole.log( 'someone connected!' ) ;\n} ;\n\nserver.on( 'connection' , callback ) ;\n// ...\nserver.removeListener( 'connection' , callback ) ;\n```\n\n**CAUTION: Unlike the built-in Node.js emitter**, `.removeListener()` will remove **ALL** listeners whose ID is matching\nthe given *listenerID*.\nIf any single listener has been added multiple times to the listener array for the specified event, then only one\ncall to `.removeListener()` will remove them all.\n\n> Returns emitter, so calls can be chained.\n\nExample using user-defined ID:\n\n```js\nvar callback = function( stream ) {\n\tconsole.log( 'someone connected!' ) ;\n} ;\n\nserver.on( 'connection' , { id: 'foo' , fn: callback } ) ;\nserver.on( 'connection' , { id: 'bar' , fn: callback } ) ;\n\n// ...\n\n// Does nothing! we have used custom IDs!\nserver.removeListener( 'connection' , callback ) ;\n\n// Remove the first listener only, despite the fact they are sharing the same function\nserver.removeListener( 'connection' , 'foo' ) ;\n```\n\nDon't forget that by default, the ID is the callback function itself.\n\n\n\n<a name=\"ref.events.removeAllListeners\"></a>\n### .removeAllListeners( [eventName] )\n\n* eventName `string` (optional) the name of the event the listeners to remove are binded to\n\nNode.js documentation:\n\n> Removes all listeners, or those of the specified event.\n> It's not a good idea to remove listeners that were added elsewhere in the code, especially when it's on an emitter\n> that you didn't create (e.g. sockets or file streams).\n\n> Returns emitter, so calls can be chained.\n\n\n\n<a name=\"ref.events.setMaxListeners\"></a>\n### .setMaxListeners()\n\nOnly available for compatibility with the built-in Node.js emitter, so it does not break the code for people that want\nto make the switch.\n\nBut please note that **there is no such concept of max listener in NextGen Events**, this method does nothing\n(it's an empty function).\n\n\n\n<a name=\"ref.events.listeners\"></a>\n### .listeners( eventName )\n\n* eventName `string` (optional) the name of the event the listeners to list are binded to\n\nNode.js documentation:\n\n> Returns an array of listeners for the specified event.\n\n```js\nserver.on( 'connection' , function( stream ) {\n\tconsole.log( 'someone connected!' ) ;\n} ) ;\n\nconsole.log( util.inspect( server.listeners( 'connection' ) ) ) ;\n// output:\n// [ { id: [Function], fn: [Function], nice: -Infinity, event: 'connection' } ]\n```\n\n\n\n<a name=\"ref.events.listenerCount\"></a>\n### .listenerCount( eventName )\n\n* eventName `string` the name of the event\n\nNode.js documentation:\n\n> Returns the number of listeners listening to the type of event.\n\n\n\n<a name=\"ref.events.setNice\"></a>\n### .setNice( nice )\n\n* nice `integer` (default: -Infinity) see [the nice feature](#ref.note.nice) for details\n\nSet the default *nice value* of the current emitter.\n\n\n\n<a name=\"ref.events.emit\"></a>\n### .emit( [nice] , eventName , [arg1] , [arg2] , [...] , [callback] )\n\n* nice `integer` (default: -Infinity) see [the nice feature](#ref.note.nice) for details\n* eventName `string` (optional) the name of the event to emit\n* arg1 `any type` (optional) first argument to transmit\n* arg2 `any type` (optional) second argument to transmit\n* ...\n* callback `function` (optional) a completion callback triggered when all listener have done, accepting arguments:\n\t* interruption `any type` if truthy, then emit was interrupted with this interrupt value (provided by userland)\n\t* event `Object` representing the current event\n\nIt returns an object representing the current event.\n\nNode.js documentation:\n\n> Execute each of the listeners in order with the supplied arguments.\n\n**It does not returns the emitter!**\n\n\n\n\n<a name=\"ref.note.nice\"></a>\n### A note about the *nice feature*\n\nThe *nice value* represent the *niceness* of the event-emitting processing.\nThis concept is inspired by the UNIX *nice* concept for processus (see the man page for the *nice* and *renice* command).\n\nIn this lib, this represents the asyncness of the event-emitting processing.\n\nThe constant `require( 'nextgen-events' ).SYNC` can be used to have synchronous event emitting, its value is `-Infinity`\nand it's the default value.\n\n* any nice value *N* greater than or equals to 0 will be emitted asynchronously using setTimeout() with a *N* ms timeout\n  to call the listeners\n* any nice value *N* lesser than 0 will emit event synchronously until *-N* recursion is reached, after that, setImmediate()\n  will be used to call the listeners, the first event count as 1 recursion, so if nice=-1, all events will be asynchronously emitted,\n  if nice=-2 the initial event will call the listener synchronously, but if the listener emits events on the same emitter object,\n  the sub-listener will be called through setImmediate(), breaking the recursion... and so on...\n\nThey are many elements that can define their own *nice value*.\n\nHere is how this is resolved:\n\n* First the *emit nice value* will be the one passed to the `.emit()` method if given, or the default *emitter nice value*\n  defined with [.setNice()](#ref.events.setNice).\n* For each listener to be called, the real *nice value* for the current listener will be the **HIGHEST** *nice value* of\n  the *emit nice value* (see above), the listener *nice value* (defined with [.addListener()](#ref.events.addListener)), and\n  if the listener is tied to a context, the context *nice value* (defined with [.addListenerContext()](#ref.events.addListenerContext)\n  or [.setListenerContextNice](#ref.events.setListenerContextNice))\n\n\n\n<a name=\"ref.events.addListenerContext\"></a>\n### .addListenerContext( contextName , options )\n\n* contextName `string` a non-empty string identifying the context to be created\n* options `Object` an object of options, where:\n\t* nice `integer` (default: -Infinity) see [the nice feature](#ref.note.nice) for details\n\t* serial `boolean` (default: false) if true, the async listeners tied to this context will run sequentially,\n\t  one after the other is fully completed\n\nCreate a context using the given *contextName*.\n\nListeners can be tied to a context, enabling some grouping features like turning them on or off just by enabling/disabling\nthe context, queuing them, resuming them, or forcing serialization of all async listeners.\n\n\n\n<a name=\"ref.events.disableListenerContext\"></a>\n### .disableListenerContext( contextName )\n\n* contextName `string` a non-empty string identifying the context to be created\n\nIt disables a context: any listeners tied to it will not be triggered anymore.\n\nThe context is not destroyed, the listeners are not removed, they are just inactive.\nThey can be enabled again using [.enableListenerContext()](#ref.events.enableListenerContext).\n\n\n\n<a name=\"ref.events.queueListenerContext\"></a>\n### .queueListenerContext( contextName )\n\n* contextName `string` a non-empty string identifying the context to be created\n\nIt switchs a context into *queue mode*: any listeners tied to it will not be triggered anymore, but every listener's call\nwill be queued.\n\nWhen the context will be enabled again using [.enableListenerContext()](#ref.events.enableListenerContext), any queued listener's call\nwill be processed.\n\n\n\n<a name=\"ref.events.enableListenerContext\"></a>\n### .enableListenerContext( contextName )\n\n* contextName `string` a non-empty string identifying the context to be created\n\nThis enables a context previously disabled using [.disableListenerContext()](#ref.events.disableListenerContext) or queued\nusing [.disableListenerContext()](#ref.events.disableListenerContext).\n\nIf the context was queued, any queued listener's call will be processed right now for synchronous emitter, or a bit later\ndepending on the *nice value*. E.g. if a listener would have been called with a timeout of 50 ms (nice value = 5),\nand the call has been queued, the timeout will apply at resume time.\n\n\n\n<a name=\"ref.events.setListenerContextNice\"></a>\n### .setListenerContextNice( contextName , nice )\n\n* contextName `string` a non-empty string identifying the context to be created\n* nice `integer` (default: -Infinity) see [the nice feature](#ref.note.nice) for details\n\nSet the *nice* value for the current context.\n\n\n\n<a name=\"ref.events.serializeListenerContext\"></a>\n### .serializeListenerContext( contextName , [value] )\n\n* contextName `string` a non-empty string identifying the context to be created\n* value `boolean` (optional, default is true) if *true* the context will enable serialization for async listeners.\n\nThis is one of the top feature of this lib.\n\nIf set to *true* it enables the context serialization.\n\nIt has no effect on listeners defined without the *async* option (see [.addListener()](#ref.events.addListener)).\nListeners defined with the async option will postpone any other listener's calls part of the same context.\nThose calls will be queued until the completion callback of the listener is triggered.\n\nExample:\n\n```js\napp.on( 'maintenance' , {\n\tcontext: 'maintenanceHandlers' ,\n\tasync: true ,\n\tfn: function( type , done ) {\n\t\tperformSomeCriticalAsyncStuff( function() {\n\t\t\tconsole.log( 'Critical maintenance stuff finished' ) ;\n\t\t\tdone() ;\n\t\t} ) ;\n\t}\n} ) ;\n\napp.serializeListenerContext( maintenanceHandlers ) ;\n\n// ...\n\napp.emit( 'maintenance' , 'doBackup' ) ;\n\n// Despite the fact we emit synchronously, the listener will not be called now,\n// it will be queued and called later when the previous call will be finished\napp.emit( 'maintenance' , 'doUpgrade' ) ;\n```\n\nBy the way, there is only one listener here that will queue itself, and only one event type is fired.\nBut this would work the same with multiple listener and event type, if they share the same context.\n\nSame code with two listeners and two event type:\n\n```js\napp.on( 'doBackup' , {\n\tcontext: 'maintenanceHandlers' ,\n\tasync: true ,\n\tfn: function( done ) {\n\t\tperformBackup( function() {\n\t\t\tconsole.log( 'Backup finished' ) ;\n\t\t\tdone() ;\n\t\t} ) ;\n\t}\n} ) ;\n\napp.on( 'doUpgrade' , {\n\tcontext: 'maintenanceHandlers' ,\n\tasync: true ,\n\tfn: function( done ) {\n\t\tperformUpgrade( function() {\n\t\t\tconsole.log( 'Upgrade finished' ) ;\n\t\t\tdone() ;\n\t\t} ) ;\n\t}\n} ) ;\n\napp.on( 'whatever' , function() {\n\t// Some actions...\n} ) ;\n\napp.serializeListenerContext( maintenanceHandlers ) ;\n\n// ...\n\napp.emit( 'doBackup' ) ;\n\n// Despite the fact we emit synchronously, the second listener will not be called now,\n// it will be queued and called later when the first listener will have finished its job\napp.emit( 'doUpgrade' ) ;\n\n// The third listener is not part of the 'maintenanceHandlers' context, so it will be called\n// right now, before the first listener finished, and before the second listener ever start\napp.emit( 'whatever' ) ;\n```\n\n\n\n<a name=\"ref.events.destroyListenerContext\"></a>\n### .destroyListenerContext( contextName )\n\n* contextName `string` a non-empty string identifying the context to be created\n\nThis destroy a context and remove all listeners tied to it.\n\nAny queued listener's calls will be lost.\n\n\n\n<a name=\"incompatibilities\"></a>\n## Incompatibilities with the built-in Node.js EventEmitter\n\nNextGen Events is almost compatible with Node.js' EventEmitter, except for few things:\n\n* .emit() does not return the emitter, but an object representing the current event.\n\n* If the last argument passed to .emit() is a function, it is not passed to listeners, instead it is a completion callback\n  triggered when all listeners have done their job. If one want to pass function to listeners as the final argument, it is easy\n  to add an extra `null` or `undefined` argument to .emit().\n\n* There is more reserved event name: 'interrupt', 'emitted'.\n\n* There is no such concept of *max listener* in NextGen Events, .setMaxListeners() function exists only to not break compatibility\n  for people that want to make the switch, but it does nothing (it's an empty function).\n\n* .removeListener() will remove all matching listener, not only the first listener found.\n\n* 'newListener'/'removeListener' event listener will receive an array of new/removed *listener object*, instead of only one\n  *listener function*.\n  E.g: it will be fired only once by when .removeListener() or .removeAllListener() is invoked and multiple listeners are deleted.\n  A *listener object* contains a property called 'fn' that hold the actual *listener function*.\n\n* `.removeAllListeners()` without any argument does not trigger 'removeListener' listener, because there are actually removed too.\n  The same apply to `.removeAllListeners( 'removeListener' )`.\n\n* .listeners() same here: rather than providing an array of *listener function* an array of *listener object* is provided.\n\n\n\n<a name=\"ref.proxy\"></a>\n## Proxy Services\n\n**This part of the doc is still a work in progress!**\n\n**Proxy services are awesome.** They abstract away the network so we can emit and listen to emitter on the other side of the plug!\nBoth side of the channel create a Proxy, and add to it local and remote *services*, i.e. event emitters, and that's all.\nA remote service looks like a normal (i.e. local) emitter, and share the same API (with few limitations).\n\nIt's totally protocol agnostic, you just define two methods for your proxy: one to read from the network and one to send to it\n(e.g. for Web Socket, this is a one-liner).\n\n\n\n#### Example, using the Web Socket *ws* node module\n\nThe code below set up a server and a client written in Node.js.\nThe server expose the *heartBeatService* which simply emit an *heartBeat* event once in a while with the beat count as data.\nMost of this code is websocket boiler-plate, the actual proxy code involves only few lines.\nThe client code could be easily rewritten for the browser.\n\n**Server:**\n\n```js\nvar NGEvents = require( 'nextgen-events' ) ;\n\n// Create our service/emitter\nvar heartBeatEmitter = new NGEvents() ;\nvar nextBeat = 1 ;\n\n// Emit one 'heartBeat' event every few seconds\nsetInterval( function() {\n  var beat = nextBeat ++ ;\n  heartBeatEmitter.emit( 'heartBeat' , beat ) ;\n} , 2000 ) ;\n\n// Create our server\nvar WebSocket = require( 'ws' ) ;\nvar server = new WebSocket.Server( { port: 12345 } ) ;\n\n// On new connection... \nserver.on( 'connection' , function connection( ws ) {\n  \n  // Create a proxy for this client\n  var proxy = new NGEvents.Proxy() ;\n  \n  // Add the local service exposed to this client and grant it all right\n  proxy.addLocalService( 'heartBeatService' , heartBeatEmitter ,\n    { listen: true , emit: true , ack: true } ) ;\n  \n  // message received: just hook to proxy.receive()\n  ws.on( 'message' , function incoming( message ) {\n    proxy.receive( message ) ;\n  } ) ;\n  \n  // Define the receive method: should call proxy.push()\n  // after decoding the raw message\n  proxy.receive = function receive( raw ) {\n    try { proxy.push( JSON.parse( raw ) ) ; } catch ( error ) {}\n  } ;\n  \n  // Define the send method\n  proxy.send = function send( message ) {\n    ws.send( JSON.stringify( message ) ) ;\n  } ;\n  \n  // Clean up after everything is done\n  ws.on( 'close' , function close() {\n    proxy.destroy() ;\n  } ) ;\n} ) ;\n```\n\n**Client:**\n\n```js\nvar NGEvents = require( 'nextgen-events' ) ;\nvar WebSocket = require( 'ws' ) ;\nvar ws = new WebSocket( 'ws://127.0.0.1:12345' ) ;\n\n// Create a proxy\nvar proxy = new NGEvents.Proxy() ;\n\n// Once the connection is established...\nws.on( 'open' , function open() {\n  \n  // Add the remote service we want to access\n  proxy.addRemoteService( 'heartBeatService' ) ;\n  \n  // Listen to the event 'heartBeat' on this service\n  proxy.remoteServices.heartBeatService.on( 'heartBeat' , function( beat ) {\n    console.log( '>>> Heart Beat (%d) received!' , beat ) ;\n  } ) ;\n} ) ;\n\n// message received: just hook to proxy.receive()\nws.on( 'message' , function( message ) {\n  proxy.receive( message ) ;\n} ) ;\n\n// Define the receive method: should call proxy.push()\n// after decoding the raw message\nproxy.receive = function receive( raw ) {\n  try { proxy.push( JSON.parse( raw ) ) ; } catch ( error ) {}\n} ;\n\n// Define the send method\nproxy.send = function send( message ) {\n  ws.send( JSON.stringify( message ) ) ;\n} ;\n\n// Clean up after everything is done\nws.on( 'close' , function close() {\n  proxy.destroy() ;\n} ) ;\n```\n\n\n\nOptions passed to `.addLocalService()`:\n\n* listen `boolean` if set, the remote client can listen (addListener()/on()) to the local emitter\n* emit `boolean` if set, the remote client can emit on the local emitter\n* ack `boolean` if set, the remote client can acknowledge or ask for acknowledgement, enabling **async listeners**\n  and .emit()'s **completion callback**\n\n\n\nNextGen Events features available in proxy services:\n\n* All the basic API is supported (the node-compatible API)\n* Emit completion callback supported\n* Async listeners supported\n\n\n\nFeatures that could be supported in the future:\n\n* Emit interruption and retrieving the interruption value\n\n\n\nFeatures that are unlikely to be supported:\n\n* Remote emit with a nice value (does not make sense at all through a network)\n* Contexts cannot be shared across different proxies/client, think of it as if they were namespaced behind their proxy\n\n\n",
  "readmeFilename": "README.md",
  "gitHead": "89c1358487295ba5f815710d06da67d680307c7f",
  "homepage": "https://github.com/cronvel/nextgen-events#readme",
  "_id": "nextgen-events@0.9.5",
  "_shasum": "a8a9ba63a613b83a514078b43628b590ae48be82",
  "_from": "nextgen-events@0.9.5"
}

},{}],45:[function(require,module,exports){
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



},{}],46:[function(require,module,exports){
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



},{}],47:[function(require,module,exports){
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



}).call(this,{"isBuffer":require("../../browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js")},require('_process'))
},{"../../browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js":17,"./ansi.js":45,"./escape.js":46,"_process":18,"tree-kit/lib/extend.js":48}],48:[function(require,module,exports){
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


},{}]},{},[4])(4)
});