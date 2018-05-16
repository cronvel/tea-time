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



var string = require( 'string-kit' ) ;
var notifications ;

try {
	notifications = require( 'freedesktop-notifications' ) ;
	notifications.setAppName( 'Tea Time' ) ;
}
catch ( error ) {
	// Ignore error, but turn off the reporter
}



function Reporter( teaTime , self ) {
	if ( ! self ) {
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



Reporter.exit = function exit( callback ) {
	if ( ! notifications || this.sent ) { callback() ; return ; }
	this.teaTime.once( 'reportNotificationSent' , callback ) ;
} ;



Reporter.report = function report( data ) {
	if ( ! notifications ) { return ; }
	
	var durationStr ;

	if ( data.duration < 2000 ) { durationStr = string.format( '%ims' , Math.floor( data.duration ) ) ; }
	else { durationStr = string.format( '%i.%is' , Math.floor( data.duration / 1000 ) , Math.floor( data.duration % 1000 ) ) ; }

	var body = '' + data.ok + ( data.assertionOk ? '|' + data.assertionOk : '' ) + ' passing - ' +
		data.fail + ( data.assertionFail ? '|' + data.assertionFail : '' ) + ' failing' +
		( data.optionalFail ? ' - ' + data.optionalFail + ' opt failing' : '' ) +
		( data.skip ? ' - ' + data.skip + ' pending' : '' ) +
		( data.coverageRate !== undefined ? ' - ' + Math.round( data.coverageRate * 100 ) + '% coverage' : '' ) +
		' (' + durationStr + ')' ;

	try {
		notifications.createNotification( {
			summary: data.fail ? 'Tea Time: some tests have failed' : 'Tea Time: all tests have succeeded!'  ,
			body: body ,
			icon: data.fail ? 'face-sick' : 'face-cool' ,
			sound: data.fail ? 'dialog-warning' : 'dialog-information'
		} ).push( () => {
			this.sent = true ;
			this.teaTime.emit( 'reportNotificationSent' ) ;
		} ) ;
	}
	catch ( error ) {
		// If we are here, there are good chances that some optional dependencies are not installed
		// We will do nothing, some other reporters are probably still alive
		this.sent = true ;
	}
} ;

