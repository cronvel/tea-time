/*
	Tea Time!

	Copyright (c) 2015 - 2019 Cédric Ronvel

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
const teaTimePackage = require( '../../package.json' ) ;

const Report = require( './report.js' ) ;
const ErrorReport = require( './error-report.js' ) ;



function Reporter( teaTime , self ) {
	if ( ! self ) {
		self = Object.create( Reporter.prototype , {
			teaTime: { value: teaTime , enumerable: true }
		} ) ;
	}

	self.teaTime.on( 'enterSuite' , Reporter.enterSuite.bind( self ) ) ;
	self.teaTime.on( 'exitSuite' , Reporter.exitSuite.bind( self ) ) ;
	self.teaTime.on( 'ok' , Reporter.ok.bind( self ) ) ;
	self.teaTime.on( 'fail' , Reporter.fail.bind( self ) ) ;
	self.teaTime.on( 'optionalFail' , Reporter.optionalFail.bind( self ) ) ;
	self.teaTime.on( 'skip' , Reporter.skip.bind( self ) ) ;
	self.teaTime.on( 'report' , Reporter.report.bind( self ) ) ;
	self.teaTime.on( 'errorReport' , ErrorReport.errorReport.bind( self ) ) ;
	self.teaTime.on( 'exit' , Reporter.exit.bind( self ) ) ;

	if ( self.teaTime.cliManager ) {
		self.teaTime.cliManager.displayIntro() ;
	}
	else {
		term.bold.magenta( 'Tea Time!' ).dim( ' v%s by Cédric Ronvel' , teaTimePackage.version )( '\n\n' ) ;
	}

	return self ;
}

module.exports = Reporter ;



Reporter.enterSuite = function enterSuite( data ) {
	term( '\n' ) ;
	term.wrapColumn( { x: 1 + data.depth * 2 } ) ;
	term.wrap.bold( '%s' , data.title ) ;
	term( '\n\n' ) ;
} ;



Reporter.exitSuite = function exitSuite( data ) {
	//term( '<exit suite>\n' ) ;
	//term( '\n' ) ;
} ;



Reporter.ok = function ok( data ) {
	//term.wrap.bold.brightGreen( '%s✔ ' , '  '.repeat( data.depth ) ).green( '%s' , data.title ) ;
	term.column.bold.brightGreen( 1 + data.depth * 2 , '✔ ' ) ;
	term.wrapColumn( { x: 3 + data.depth * 2 , continue: true } ) ;
	term.wrap.green( '%s' , data.title ) ;

	if ( ! data.slow ) { term.wrap.brightBlack( " (%ims)" , data.duration ) ; }
	else if ( data.slow === 1 ) { term.wrap.brightYellow( " (%ims)" , data.duration ) ; }
	else { term.wrap.red( " (%ims)" , data.duration ) ; }

	term( '\n' ) ;
} ;



Reporter.fail = function fail( data ) {
	//term.wrap.bold.brightRed( '%s✘ ' , '  '.repeat( data.depth ) ).red( '%s' , data.title ) ;
	term.column.bold.brightRed( 1 + data.depth * 2 , '✘ ' ) ;
	term.wrapColumn( { x: 3 + data.depth * 2 } ) ;
	term.wrap.red( '%s' , data.title ) ;

	if ( data.duration !== undefined ) {
		if ( ! data.slow ) { term.wrap.brightBlack( " (%ims)" , data.duration ) ; }
		else if ( data.slow === 1 ) { term.wrap.brightYellow( " (%ims)" , data.duration ) ; }
		else { term.wrap.red( " (%ims)" , data.duration ) ; }
	}

	term( '\n' ) ;
} ;



Reporter.optionalFail = function optionalFail( data ) {
	//term.wrap.bold.yellow( '%s✘ ' , '  '.repeat( data.depth ) ).yellow( '%s' , data.title ) ;
	term.column.bold.yellow( 1 + data.depth * 2 , '✘ ' ) ;
	term.wrapColumn( { x: 3 + data.depth * 2 } ) ;
	term.wrap.yellow( '%s' , data.title ) ;

	if ( data.duration !== undefined ) {
		if ( ! data.slow ) { term.wrap.brightBlack( " (%ims)" , data.duration ) ; }
		else if ( data.slow === 1 ) { term.wrap.brightYellow( " (%ims)" , data.duration ) ; }
		else { term.wrap.red( " (%ims)" , data.duration ) ; }
	}

	term( '\n' ) ;
} ;



Reporter.skip = function skip( data ) {
	//term.wrap.bold.blue( '%s… ' , '  '.repeat( data.depth ) ).blue( '%s' , data.title )( '\n' ) ;
	//term.wrap.bold.blue( '%s· ' , '  '.repeat( data.depth ) ).blue( "%s" , data.title )( '\n' ) ;
	term.column.bold.blue( 1 + data.depth * 2 , '· ' ) ;
	term.wrapColumn( { x: 3 + data.depth * 2 } ) ;
	term.wrap.blue( '%s' , data.title ) ;
	term( '\n' ) ;
} ;



Reporter.report = function report( data ) {
	term( '\n' ).brightBlack( "%s" , '='.repeat( term.width - 1 ) )( '\n' ) ;
	Report.report.call( this , data ) ;
} ;



Reporter.exit = function exit() {
	//term( '\n' ) ;
	term.styleReset() ;
} ;


