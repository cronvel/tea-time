/*
	Tea Time!
	
	Copyright (c) 2016 Cédric Ronvel
	
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
var string = require( 'string-kit' ) ;
var teaTimePackage = require( '../../package.json' ) ;



function Reporter( runtime )
{
	var self = Object.create( Reporter.prototype , {
		runtime: { value: runtime , enumerable: true }
	} ) ;
	
	self.runtime.on( 'init' , Reporter.init.bind( self ) ) ;
	self.runtime.on( 'enterSuite' , Reporter.enterSuite.bind( self ) ) ;
	self.runtime.on( 'exitSuite' , Reporter.exitSuite.bind( self ) ) ;
	self.runtime.on( 'ok' , Reporter.ok.bind( self ) ) ;
	self.runtime.on( 'fail' , Reporter.fail.bind( self ) ) ;
	self.runtime.on( 'skip' , Reporter.skip.bind( self ) ) ;
	self.runtime.on( 'report' , Reporter.report.bind( self ) ) ;
	self.runtime.on( 'errorReport' , Reporter.errorReport.bind( self ) ) ;
	self.runtime.on( 'exit' , Reporter.exit.bind( self ) ) ;
	
	return self ;
}

module.exports = Reporter ;



Reporter.init = function init()
{
	term.bold.magenta( 'Tea Time' ).dim( ' v%s by Cédric Ronvel\n\n' , teaTimePackage.version ) ;
} ;



Reporter.enterSuite = function enterSuite( suiteName , depth )
{
	term.bold( '\n%s%s\n' , '  '.repeat( depth ) , suiteName ) ;
} ;



Reporter.exitSuite = function exitSuite( suiteName , depth )
{
	//term( '<exit suite>\n' ) ;
	//term( '\n' ) ;
} ;



Reporter.ok = function ok( testName , depth , time )
{
	term.bold.brightGreen( '%s✔ ' , '  '.repeat( depth ) ).green( '%s' , testName ) ;
	
	if ( time !== undefined )
	{
		if ( time < 200 ) { term.brightBlack( " (%ims)" , time ) ; }
		else if ( time < 500 ) { term.brightYellow( " (%ims)" , time ) ; }
		else { term.brightRed( " (%ims)" , time ) ; }
	}
	
	term( "\n" ) ;
} ;



Reporter.fail = function fail( testName , depth , time , error )
{
	term.bold.brightRed( '%s✘ ' , '  '.repeat( depth ) ).red( '%s' , testName ) ;
	
	if ( time !== undefined )
	{
		if ( time < 200 ) { term.brightBlack( " (%ims)" , time ) ; }
		else if ( time < 500 ) { term.brightYellow( " (%ims)" , time ) ; }
		else { term.brightRed( " (%ims)" , time ) ; }
	}
	
	term( "\n" ) ;
} ;



Reporter.skip = function skip( testName , depth )
{
	//term.bold.blue( '%s… ' , '  '.repeat( depth ) ).blue( '%s\n' , testName ) ;
	term.bold.blue( '%s· ' , '  '.repeat( depth ) ).blue( '%s\n' , testName ) ;
} ;



Reporter.report = function report( ok , fail , skip , time )
{
	term.brightBlack( "\n%s\n\n" , '='.repeat( term.width - 1 ) ) ;
	
	term.green( "  %i passing" , ok ) ;
	
	if ( time < 2000 ) { term.brightBlack( ' (%ims)' , time ) ; }
	else { term.brightBlack( ' (%is)' , Math.round( time / 1000 ) ) ; }
	
	term( "\n" ) ;
	
	term.red( "  %i failing\n" , fail ) ;
	term.blue( "  %i pending\n" , skip ) ;
	term( "\n" ) ;
} ;



Reporter.errorReport = function errorReport( errors )
{
	var i , error ;
	term.bold.red( "\n== Errors ==\n" ) ;
	
	for ( i = 0 ; i < errors.length ; i ++ )
	{
		error = errors[ i ] ;
		term.red( '\n  %i) %s\n' , i + 1 , error.name ) ;
		Reporter.reportOneError( error.error ) ;
	}
	
	term( "\n" ) ;
} ;



Reporter.reportOneError = function reportOneError( error )
{
	term( "%s" , string.inspectError( { style: 'color' } , error ).replace( /^/mg , '     ' ) ) ;
} ;



Reporter.exit = function exit()
{
	//term( "\n" ) ;
	term.styleReset() ;
} ;


