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



function Reporter( runtime , self )
{
	if ( ! self )
	{
		self = Object.create( Reporter.prototype , {
			runtime: { value: runtime , enumerable: true }
		} ) ;
	}
	
	self.runtime.on( 'init' , Reporter.init.bind( self ) ) ;
	self.runtime.on( 'ok' , Reporter.report.bind( self , false ) ) ;
	self.runtime.on( 'fail' , Reporter.report.bind( self , false ) ) ;
	self.runtime.on( 'skip' , Reporter.report.bind( self , false ) ) ;
	self.runtime.on( 'report' , Reporter.report.bind( self , true ) ) ;
	//self.runtime.on( 'errorReport' , classic.errorReport.bind( self ) ) ;
	self.runtime.on( 'exit' , Reporter.exit.bind( self ) ) ;
	
	return self ;
}

module.exports = Reporter ;



Reporter.init = function init()
{
} ;



Reporter.prototype.report =
Reporter.report = function report( final , ok , fail , skip , time )
{
	if ( ! final )
	{
		// This is the internal case
		ok = this.runtime.ok ;
		fail = this.runtime.fail ;
		skip = this.runtime.skip ;
		time = Date.now() - this.runtime.startTime ;
	}
	
	term.column.eraseLine( 1 ) ;
	term.green( "%i passing" , ok ) ;
	term.red( "  %i failing" , fail ) ;
	term.blue( "  %i pending" , skip ) ;
	
	if ( time < 2000 ) { term.brightBlack( '  (%ims)' , time ) ; }
	else { term.brightBlack( '  (%is)' , Math.round( time / 1000 ) ) ; }
	
	term.brightBlack( final ? '  DONE' : '  IN PROGRESS...' ) ;
} ;



Reporter.exit = function exit()
{
	term( "\n" ) ;
	term.styleReset() ;
} ;

