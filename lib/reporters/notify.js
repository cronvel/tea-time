/*
	Tea Time!
	
	Copyright (c) 2015 - 2017 Cédric Ronvel
	
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



function Reporter( teaTime , self )
{
	if ( ! self )
	{
		self = Object.create( Reporter.prototype , {
			teaTime: { value: teaTime , enumerable: true }
		} ) ;
	}
	
	self.sent = false ;
	
	self.teaTime.on( 'report' , Reporter.report.bind( self ) ) ;
	self.teaTime.on( 'exit' , { fn: Reporter.exit.bind( self ) , async: true } ) ;
	
	return self ;
}

module.exports = Reporter ;



Reporter.exit = function exit( callback )
{
	if ( ! notifications || this.sent ) { callback() ; return ; }
	this.teaTime.once( 'reportNotificationSent' , callback ) ;
} ;



Reporter.report = function report( ok , fail , optionalFail , skip , coverageRate , time )
{
	if ( ! notifications ) { return ; }
	
	var self = this ;
	
	if ( time < 2000 ) { time = string.format( '%ims' , Math.floor( time ) ) ; }
	else { time = string.format( '%i.%is' , Math.floor( time / 1000 ) , Math.floor( time % 1000 ) ) ; }
	
	var body = '' + ok + ' passing - ' + fail + ' failing' +
		( optionalFail ? ' - ' + optionalFail + ' opt failing' : '' ) +
		( skip ? ' - ' + skip + ' pending' : '' ) +
		( coverageRate !== undefined ? ' - ' + Math.round( coverageRate * 100 ) + '% coverage' : '' ) +
		' (' + time + ')' ;
	
	try {
		notifications.createNotification( {
			summary: fail ? 'Tea Time: some tests have failed' : 'Tea Time: all tests have succeeded!'  ,
			body: body ,
			icon: fail ? 'face-sick' : 'face-cool' ,
			sound: fail ? 'dialog-warning' : 'dialog-information'
		} ).push( function() {
			self.sent = true ;
			self.teaTime.emit( 'reportNotificationSent' ) ;
		} ) ;
	}
	catch ( error ) {
		// If we are here, there are good chances that some optional dependencies are not installed
		// We will do nothing, some other reporters are probably still alive
		self.sent = true ;
	}
} ;


