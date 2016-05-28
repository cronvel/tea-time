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
var inspect = require( 'string-kit/lib/inspect.js' ) ;



function createTeaTime()
{
	//var i , iMax , args , v , testFiles , reporters = [ 'classic' ] ;
	
	var options = {
		microTimeout: function( callback ) {
			setTimeout( callback , 0 ) ;
		} ,
		onceUncaughtException: function( callback ) {
			var triggered = false ;
			window.onerror = function( message , source , lineno , colno , error ) {
				if ( triggered ) { return ; }
				callback( error ) ;
				return true ;	// prevent the event propagation
			} ;
		} ,
		offUncaughtException: function() {
			window.onerror = function() {} ;
		} ,
		allowConsole: true
	} ;
	
	window.teaTime = TeaTime.create( options ) ;
	window.teaTime.init() ;
	window.teaTime.diff = diff ;
	window.teaTime.inspect = inspect ;
	
	return window.teaTime ;
}

module.exports = createTeaTime ;

