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



var classic = require( './classic.js' ) ;
var termkit = require( 'terminal-kit' ) ;
var term = termkit.terminal ;
var string = require( 'string-kit' ) ;
var teaTimePackage = require( '../../package.json' ) ;



function Reporter( runtime )
{
	var self = Object.create( Reporter.prototype , {
		runtime: { value: runtime , enumerable: true }
	} ) ;
	
	self.runtime.on( 'init' , Reporter.init.bind( self ) ) ;
	self.runtime.on( 'ok' , Reporter.ok.bind( self ) ) ;
	self.runtime.on( 'fail' , Reporter.fail.bind( self ) ) ;
	self.runtime.on( 'skip' , Reporter.skip.bind( self ) ) ;
	self.runtime.on( 'report' , Reporter.report.bind( self ) ) ;
	self.runtime.on( 'errorReport' , classic.errorReport.bind( self ) ) ;
	self.runtime.on( 'exit' , Reporter.exit.bind( self ) ) ;
	
	return self ;
}

module.exports = Reporter ;



Reporter.init = function init()
{
	term.clear() ;
} ;



Reporter.prototype.eraseTest = function eraseTest()
{
	term.moveTo.eraseLine( 1 , 4 ) ;
	term.moveTo.eraseLine( 1 , 3 ) ;
	term.moveTo.eraseLine( 1 , 2 ) ;
} ;



Reporter.ok = function ok( testName , depth , time , slow )
{
	this.eraseTest() ;
	term.bold.brightGreen( '  ✔ ' ).green( '%s' , testName ) ;
	
	if ( ! slow ) { term.brightBlack( " (%ims)" , time ) ; }
	else if ( slow === 1 ) { term.brightYellow( " (%ims)" , time ) ; }
	else { term.red( " (%ims)" , time ) ; }
	
	this.report() ;
} ;



Reporter.fail = function fail( testName , depth , time , slow , error )
{
	this.eraseTest() ;
	term.bold.brightRed( '  ✘ ' ).red( '%s' , testName ) ;
	
	if ( time !== undefined )
	{
		if ( ! slow ) { term.brightBlack( " (%ims)" , time ) ; }
		else if ( slow === 1 ) { term.brightYellow( " (%ims)" , time ) ; }
		else { term.red( " (%ims)" , time ) ; }
	}
	
	this.report() ;
} ;



Reporter.skip = function skip( testName , depth )
{
	this.eraseTest() ;
	term.bold.blue( '  · ' ).blue( '%s' , testName ) ;
	this.report() ;
} ;



Reporter.prototype.report =
Reporter.report = function report( ok , fail , skip , time )
{
	if ( ! arguments.length )
	{
		// This is the internal case
		ok = this.runtime.ok ;
		fail = this.runtime.fail ;
		skip = this.runtime.skip ;
		time = Date.now() - this.runtime.startTime ;
	}
	else
	{
		// This is the 'report' event case
		this.eraseTest() ;
	}
	
	term.moveTo( 1 , 5 ) ;
	term.green( "  %i passing" , ok ) ;
	
	if ( time < 2000 ) { term.brightBlack( ' (%ims)' , time ) ; }
	else { term.brightBlack( ' (%is)' , Math.round( time / 1000 ) ) ; }
	
	term.eraseLineAfter( "\n" ) ;
	
	term.red( "  %i failing" , fail ).eraseLineAfter( "\n" ) ;
	term.blue( "  %i pending" , skip ).eraseLineAfter( "\n" ) ;
	term( "\n" ) ;
} ;



Reporter.exit = function exit()
{
	//term( "\n" ) ;
	term.styleReset() ;
} ;


