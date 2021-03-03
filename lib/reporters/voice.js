/*
	Tea Time!

	Copyright (c) 2015 - 2021 Cédric Ronvel

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
	if ( this.sent ) { callback() ; return ; }
	this.teaTime.once( 'reportNotificationSent' , callback ) ;
} ;



const spawn = require( 'child_process' ).spawn ;
const FAST = 180 ;
const SLOW = 130 ;

Reporter.report = function report( data ) {
	var str , speed ;

	if ( ! data.fail ) {
		str = 'great! all of the ' + data.ok + ' tests have succeeded! ' ;
		speed = FAST ;
	}
	else {
		str = 'tests failed! '
			+ data.ok + ' tests passing, '
			+ data.fail + ' tests failing'
			+ ( data.optionalFail ? ', ' + data.optionalFail + ' optional tests failing' : '' )
			+ '.' ;
		speed = SLOW ;
	}

	var child = spawn(
		"espeak-ng" ,
		[
			'-v' , 'en' ,		// voice/language
			'-p' , 30 ,		// pitch (0-99, default: 50)
			//'-a' , 100 ,	// amplitude (0-200, default: 100), i.e.: volume
			'-s' , speed ,		// speed in word per minute (default: 160)
			str
		] ,
		{ detached: true }
	) ;

	child.on( 'error' , error => {
		// If there are error, there are good chances that espeak-ng was not found on this system
		// We will do nothing, some other reporters are probably still alive
		console.error( 'spawn error: ' + error ) ;
		this.sent = true ;
		this.teaTime.emit( 'reportNotificationSent' ) ;
	} ) ;

	// Since the program is detached, we only ensure that we have just enough time to asynchronously start the process
	setTimeout( () => {
		this.sent = true ;
		this.teaTime.emit( 'reportNotificationSent' ) ;
	} , 10 ) ;
} ;

