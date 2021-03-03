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



const termkit = require( 'terminal-kit' ) ;
const term = termkit.terminal ;

const ErrorReport = require( './error-report.js' ) ;



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
	self.teaTime.on( 'report' , Reporter.report.bind( self , true ) ) ;
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



Reporter.ok = function ok( data ) {
	this.eraseTest() ;
	term.bold.brightGreen( '  ✔ ' ).green( '%s' , data.title ) ;

	if ( ! data.slow ) { term.brightBlack( " (%ims)" , data.duration ) ; }
	else if ( data.slow === 1 ) { term.brightYellow( " (%ims)" , data.duration ) ; }
	else { term.red( " (%ims)" , data.duration ) ; }

	this.report( false ) ;
} ;



Reporter.fail = function fail( data ) {
	this.eraseTest() ;
	term.bold.brightRed( '  ✘ ' ).red( '%s' , data.title ) ;

	if ( data.duration !== undefined ) {
		if ( ! data.slow ) { term.brightBlack( " (%ims)" , data.duration ) ; }
		else if ( data.slow === 1 ) { term.brightYellow( " (%ims)" , data.duration ) ; }
		else { term.red( " (%ims)" , data.duration ) ; }
	}

	this.report( false ) ;
} ;



Reporter.optionalFail = function optionalFail( data ) {
	this.eraseTest() ;
	term.bold.yellow( '  ✘ ' ).yellow( '%s' , data.title ) ;

	if ( data.duration !== undefined ) {
		if ( ! data.slow ) { term.brightBlack( " (%ims)" , data.duration ) ; }
		else if ( data.slow === 1 ) { term.brightYellow( " (%ims)" , data.duration ) ; }
		else { term.red( " (%ims)" , data.duration ) ; }
	}

	this.report( false ) ;
} ;



Reporter.skip = function skip( data ) {
	this.eraseTest() ;
	term.bold.blue( '  · ' ).blue( '%s' , data.title ) ;
	this.report( false ) ;
} ;



Reporter.prototype.report =
Reporter.report = function report( final , data = {} ) {
	var { ok , fail , optionalFail , skip , assertionOk , assertionFail , coverageRate , duration } = data ;	// eslint-disable-line object-curly-newline

	if ( ! final ) {
		// This is the internal case
		ok = this.teaTime.ok ;
		fail = this.teaTime.fail ;
		optionalFail = this.teaTime.optionalFail ;
		skip = this.teaTime.skip ;
		coverageRate = undefined ;
		duration = Date.now() - this.teaTime.startTime ;
		assertionOk = this.teaTime.assertionOk ;
		assertionFail = this.teaTime.assertionFail ;
	}
	else {
		// This is the 'report' event case
		this.eraseTest() ;
	}

	term.moveTo( 1 , 5 ) ;

	// This reporter write in place, so it needs to rewrite things, so Report.report() won't do well here...
	//Report.report.call( this , data ) ;

	if ( assertionOk ) { term( "  ^g%i|^K%i ^gpassing" , ok , assertionOk ) ; }
	else { term.green( "  %i passing" , ok ) ; }

	if ( duration < 2000 ) { term.brightBlack( ' (%ims)' , Math.floor( duration ) ) ; }
	else { term.brightBlack( ' (%i.%is)' , Math.floor( duration / 1000 ) , Math.floor( duration % 1000 ) ) ; }

	term.eraseLineAfter( "\n" ) ;

	if ( assertionFail ) { term( "  ^r%i^K|%i ^rfailing" , fail , assertionFail ) ; }
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


