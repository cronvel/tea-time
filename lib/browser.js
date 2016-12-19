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



