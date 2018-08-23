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



var Promise = require( 'seventh' ) ;
var termkit = require( 'terminal-kit' ) ;
var term = termkit.terminal ;



function Reporter( teaTime , self ) {
	if ( ! self ) {
		self = Object.create( Reporter.prototype , {
			teaTime: { value: teaTime , enumerable: true }
		} ) ;
	}

	self.teaTime.on( 'start' , Reporter.start.bind( self ) ) ;
	self.teaTime.on( 'enterTest' , Reporter.enterTest.bind( self ) ) ;

	self.teaTime.on( 'ok' , Reporter.ok.bind( self ) ) ;
	self.teaTime.on( 'fail' , Reporter.fail.bind( self ) ) ;
	self.teaTime.on( 'optionalFail' , Reporter.optionalFail.bind( self ) ) ;
	self.teaTime.on( 'skip' , Reporter.skip.bind( self ) ) ;
	self.teaTime.on( 'report' , Reporter.report.bind( self ) ) ;
	self.teaTime.on( 'exit' , { fn: Reporter.exit.bind( self ) , async: true } ) ;

	self.progressBar = term.progressBar( {
		title: 'Tea Time!' ,
		titleStyle: term.bold.magenta ,
		percent: true ,
		eta: true ,
		//items: this.teaTime.testCount ,
		itemSize: term.width / 2
	} ) ;

	return self ;
}

module.exports = Reporter ;



Reporter.start = function start( testCount ) {
	this.progressBar.update( {
		items: testCount
	} ) ;
} ;



Reporter.enterTest = function enterTest( data ) {
	this.progressBar.startItem( data.title ) ;
} ;



Reporter.ok = function ok( data ) {
	this.progressBar.itemDone( data.title ) ;
} ;



Reporter.fail = function fail( data ) {
	this.progressBar.itemDone( data.title ) ;
} ;



Reporter.optionalFail = function optionalFail( data ) {
	this.progressBar.itemDone( data.title ) ;
} ;



Reporter.skip = function skip( data ) {
	this.progressBar.itemDone( data.title ) ;
} ;



Reporter.report = function report( data ) {
	//this.progressBar.update( 1 ) ;
	term( "\n" ) ;

	if ( data.assertionOk ) { term( "^g%i^K|%i ^gpassing" , data.ok , data.assertionOk ) ; }
	else { term.green( "%i passing" , data.ok ) ; }

	if ( data.assertionFail ) { term( "  ^r%i^K|%i ^gfailing" , data.fail , data.assertionFail ) ; }
	else { term.red( "  %i failing" , data.fail ) ; }

	if ( data.optionalFail ) { term.yellow( "  %i opt failing" , data.optionalFail ) ; }
	if ( data.skip ) { term.blue( "  %i pending" , data.skip ) ; }
	if ( data.coverageRate ) { term.magenta( "  %i%% coverage" , Math.round( data.coverageRate * 100 ) ) ; }

	if ( data.duration < 2000 ) { term.brightBlack( '  (%ims)' , Math.floor( data.duration ) ) ; }
	else { term.brightBlack( '  (%i.%is)' , Math.floor( data.duration / 1000 ) , Math.floor( data.duration % 1000 ) ) ; }
} ;



Reporter.exit = async function exit( ready ) {
	term( "\n" ) ;
	term.grabInput( false ) ;
	term.styleReset() ;
	await Promise.resolveSafeTimeout( 100 ) ;
	ready() ;
} ;


