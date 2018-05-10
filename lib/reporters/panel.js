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



var termkit = require( 'terminal-kit' ) ;
var term = termkit.terminal ;

var ErrorReport = require( './error-report.js' ) ;



function Reporter( teaTime , self ) {
	if ( ! self ) {
		self = Object.create( Reporter.prototype , {
			teaTime: { value: teaTime , enumerable: true }
		} ) ;
	}

	self.teaTime.on( 'ok' , Reporter.ok.bind( self ) ) ;
	self.teaTime.on( 'fail' , Reporter.fail.bind( self ) ) ;
	self.teaTime.on( 'optionalFail' , Reporter.optionalFail.bind( self ) ) ;
	self.teaTime.on( 'skip' , Reporter.skip.bind( self ) ) ;
	self.teaTime.on( 'report' , Reporter.report.bind( self ) ) ;
	self.teaTime.on( 'errorReport' , ErrorReport.errorReport.bind( self ) ) ;
	self.teaTime.on( 'exit' , Reporter.exit.bind( self ) ) ;

	term.clear() ;

	return self ;
}

module.exports = Reporter ;



Reporter.prototype.eraseTest = function eraseTest() {
	term.moveTo.eraseLine( 1 , 4 ) ;
	term.moveTo.eraseLine( 1 , 3 ) ;
	term.moveTo.eraseLine( 1 , 2 ) ;
} ;



Reporter.ok = function ok( testName , depth , time , slow ) {
	this.eraseTest() ;
	term.bold.brightGreen( '  ✔ ' ).green( '%s' , testName ) ;

	if ( ! slow ) { term.brightBlack( " (%ims)" , time ) ; }
	else if ( slow === 1 ) { term.brightYellow( " (%ims)" , time ) ; }
	else { term.red( " (%ims)" , time ) ; }

	this.report() ;
} ;



Reporter.fail = function fail( testName , depth , time , slow , error ) {
	this.eraseTest() ;
	term.bold.brightRed( '  ✘ ' ).red( '%s' , testName ) ;

	if ( time !== undefined ) {
		if ( ! slow ) { term.brightBlack( " (%ims)" , time ) ; }
		else if ( slow === 1 ) { term.brightYellow( " (%ims)" , time ) ; }
		else { term.red( " (%ims)" , time ) ; }
	}

	this.report() ;
} ;



Reporter.optionalFail = function optionalFail( testName , depth , time , slow , error ) {
	this.eraseTest() ;
	term.bold.yellow( '  ✘ ' ).yellow( '%s' , testName ) ;

	if ( time !== undefined ) {
		if ( ! slow ) { term.brightBlack( " (%ims)" , time ) ; }
		else if ( slow === 1 ) { term.brightYellow( " (%ims)" , time ) ; }
		else { term.red( " (%ims)" , time ) ; }
	}

	this.report() ;
} ;



Reporter.skip = function skip( testName , depth ) {
	this.eraseTest() ;
	term.bold.blue( '  · ' ).blue( '%s' , testName ) ;
	this.report() ;
} ;



Reporter.prototype.report =
Reporter.report = function report( ok , fail , optionalFail , skip , coverageRate , time , assertionOk , assertionFail ) {
	if ( ! arguments.length ) {
		// This is the internal case
		ok = this.teaTime.ok ;
		fail = this.teaTime.fail ;
		optionalFail = this.teaTime.optionalFail ;
		skip = this.teaTime.skip ;
		time = Date.now() - this.teaTime.startTime ;
		assertionOk = this.teaTime.assertionOk ;
		assertionFail = this.teaTime.assertionFail ;
	}
	else {
		// This is the 'report' event case
		this.eraseTest() ;
	}

	term.moveTo( 1 , 5 ) ;

	// This reporter write in place, so it needs to rewrite things, so Report.report() won't do well here...
	//Report.report.call( this , ok , fail , optionalFail , skip , time ) ;

	if ( assertionOk ) { term.green( "  %i (%i) passing" , ok , assertionOk ) ; }
	else { term.green( "  %i passing" , ok ) ; }

	if ( time < 2000 ) { term.brightBlack( ' (%ims)' , Math.floor( time ) ) ; }
	else { term.brightBlack( ' (%i.%is)' , Math.floor( time / 1000 ) , Math.floor( time % 1000 ) ) ; }

	term.eraseLineAfter( "\n" ) ;

	if ( assertionFail ) { term.red( "  %i (%i) failing" , fail , assertionFail ) ; }
	else { term.red( "  %i failing" , fail ) ; }

	term.eraseLineAfter( "\n" ) ;

	if ( optionalFail ) { term.yellow( "  %i opt failing" , optionalFail ).eraseLineAfter( "\n" ) ; }
	if ( skip ) { term.blue( "  %i pending" , skip ).eraseLineAfter( "\n" ) ; }
	if ( coverageRate !== undefined ) { term.magenta( "  %i%% coverage" , Math.round( coverageRate * 100 ) ).eraseLineAfter( "\n" ) ; }

	term( "\n" ) ;
} ;



Reporter.exit = function exit() {
	//term( "\n" ) ;
	term.styleReset() ;
} ;


