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



var async = require( 'async-kit' ) ;
var termkit = require( 'terminal-kit' ) ;
var term = termkit.terminal ;



function Reporter( teaTime , self )
{
	if ( ! self )
	{
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



Reporter.start = function start( testCount )
{
	this.progressBar.update( {
		items: testCount
	} ) ;
} ;



Reporter.enterTest = function enterTest( testName )
{   
	this.progressBar.startItem( testName ) ;
} ;



Reporter.ok = function ok( testName )
{   
	this.progressBar.itemDone( testName ) ;
} ;



Reporter.fail = function fail( testName )
{   
	this.progressBar.itemDone( testName ) ;
} ;



Reporter.optionalFail = function optionalFail( testName )
{   
	this.progressBar.itemDone( testName ) ;
} ;



Reporter.skip = function skip( testName )
{   
	this.progressBar.itemDone( testName ) ;
} ;



Reporter.report = function report( ok , fail , optionalFail , skip , coverageRate , time )
{
	//this.progressBar.update( 1 ) ;
	term( "\n" ) ;
	term.green( "%i passing" , ok ) ;
	term.red( "  %i failing" , fail ) ;
	
	if ( optionalFail ) { term.yellow( "  %i opt failing" , optionalFail ) ; }
	if ( skip ) { term.blue( "  %i pending" , skip ) ; }
	if ( coverageRate ) { term.magenta( "  %i%% coverage" , Math.round( coverageRate * 100 ) ) ; }
	
	if ( time < 2000 ) { term.brightBlack( '  (%ims)' , time ) ; }
	else { term.brightBlack( '  (%is)' , Math.round( time / 1000 ) ) ; }
} ;



Reporter.exit = function exit( ready )
{
	term( "\n" ) ;
	term.grabInput( false ) ;
	term.styleReset() ;
	async.setSafeTimeout( ready , 100 ) ;
} ;


