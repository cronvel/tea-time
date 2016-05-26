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



var termkit = require( 'terminal-kit' ) ;
var term = termkit.terminal ;
var string = require( 'string-kit' ) ;
var teaTimePackage = require( '../../package.json' ) ;
var teaTime = require( '../tea-time.js' ) ;



function Reporter( runtime , self )
{
	if ( ! self )
	{
		self = Object.create( Reporter.prototype , {
			runtime: { value: runtime , enumerable: true }
		} ) ;
	}
	
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



Reporter.ok = function ok( testName , depth , time , slow )
{
	term.bold.brightGreen( '%s✔ ' , '  '.repeat( depth ) ).green( '%s' , testName ) ;
	
	if ( ! slow ) { term.brightBlack( " (%ims)" , time ) ; }
	else if ( slow === 1 ) { term.brightYellow( " (%ims)" , time ) ; }
	else { term.red( " (%ims)" , time ) ; }
	
	term( "\n" ) ;
} ;



Reporter.fail = function fail( testName , depth , time , slow , error )
{
	term.bold.brightRed( '%s✘ ' , '  '.repeat( depth ) ).red( '%s' , testName ) ;
	
	if ( time !== undefined )
	{
		if ( ! slow ) { term.brightBlack( " (%ims)" , time ) ; }
		else if ( slow === 1 ) { term.brightYellow( " (%ims)" , time ) ; }
		else { term.red( " (%ims)" , time ) ; }
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
		term.red( '\n  %i) ' , i + 1 ) ;
		
		switch ( error.type )
		{
			case 'test' :
				break ;
			case 'setup' :
				term.bgRed.brightWhite( 'SETUP HOOK' )( ' ' ) ;
				break ;
			case 'teardown' :
				term.bgRed.brightWhite( 'TEARDOWN HOOK' )( ' ' ) ;
				break ;
			case 'suiteSetup' :
				term.bgRed.brightWhite( 'SUITE SETUP HOOK' )( ' ' ) ;
				break ;
			case 'suiteTeardown' :
				term.bgRed.brightWhite( 'SUITE TEARDOWN HOOK' )( ' ' ) ;
				break ;
		}
		
		term.red( '%s\n' , error.name ) ;
		Reporter.reportOneError( error.error ) ;
	}
	
	term( "\n" ) ;
} ;



Reporter.reportOneError = function reportOneError( error )
{
	var diff ;
	
	if ( error.expected && error.actual )
	{
		term( '     ' ).bgGreen( 'expected' )( ' ' ).bgRed( 'actual' )( '\n' ) ;
		diff = teaTime.diff.color( error.actual , error.expected ) ;
		diff = diff.replace( /^/mg , '     ' ) ;
		term( diff + "\n" ) ;
	}
	
	term( "%s" , string.inspectError( { style: 'color' } , error ).replace( /^/mg , '     ' ) ) ;
} ;



Reporter.exit = function exit()
{
	//term( "\n" ) ;
	term.styleReset() ;
} ;


