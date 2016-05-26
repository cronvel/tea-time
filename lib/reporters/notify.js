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



var string = require( 'string-kit' ) ;
var notifications ;

try {
	notifications = require( 'freedesktop-notifications' ) ;
	notifications.setAppName( 'Tea Time' ) ;
}
catch ( error ) {
	// Ignore error, but turn off the reporter
}



function Reporter( runtime , self )
{
	if ( ! self )
	{
		self = Object.create( Reporter.prototype , {
			runtime: { value: runtime , enumerable: true }
		} ) ;
	}
	
	self.sent = false ;
	
	self.runtime.on( 'init' , Reporter.init.bind( self ) ) ;
	self.runtime.on( 'report' , Reporter.report.bind( self ) ) ;
	self.runtime.on( 'exit' , { fn: Reporter.exit.bind( self ) , async: true } ) ;
	
	return self ;
}

module.exports = Reporter ;



Reporter.init = function init()
{
} ;



Reporter.exit = function exit( callback )
{
	if ( ! notifications || this.sent ) { callback() ; return ; }
	this.runtime.once( 'reportNotificationSent' , callback ) ;
} ;



Reporter.report = function report( ok , fail , skip , time )
{
	if ( ! notifications ) { return ; }
	
	var self = this ;
	
	if ( time < 2000 ) { time = string.format( '%ims' , time ) ; }
	else { time = string.format( '%is' , Math.round( time / 1000 ) ) ; }
	
	notifications.createNotification( {
		summary: fail ? 'Tea Time: some tests have failed' : 'Tea Time: all tests have succeeded!'  ,
		body: string.format( "%i passing - %i failing - %i pending (%s)" , ok , fail , skip , time ) ,
		icon: fail ? 'face-sick' : 'face-cool' ,
		sound: fail ? 'dialog-warning' : 'dialog-information'
	} ).push( function() {
		self.sent = true ;
		self.runtime.emit( 'reportNotificationSent' ) ;
	} ) ;
} ;


