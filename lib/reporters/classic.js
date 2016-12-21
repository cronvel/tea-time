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
var teaTimePackage = require( '../../package.json' ) ;

var Report = require( './report.js' ) ;
var ErrorReport = require( './error-report.js' ) ;



function Reporter( teaTime , self )
{
	if ( ! self )
	{
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
	
	term.bold.magenta( 'Tea Time!' ).dim( ' v%s by Cédric Ronvel' , teaTimePackage.version )( '\n\n' ) ;
	
	return self ;
}

module.exports = Reporter ;



Reporter.enterSuite = function enterSuite( suiteName , depth )
{
	term( '\n' ).bold( '%s%s\n' , '  '.repeat( depth ) , suiteName )( '\n' ) ;
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
	
	term( '\n' ) ;
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
	
	term( '\n' ) ;
} ;



Reporter.optionalFail = function optionalFail( testName , depth , time , slow , error )
{
	term.bold.yellow( '%s✘ ' , '  '.repeat( depth ) ).yellow( '%s' , testName ) ;
	
	if ( time !== undefined )
	{
		if ( ! slow ) { term.brightBlack( " (%ims)" , time ) ; }
		else if ( slow === 1 ) { term.brightYellow( " (%ims)" , time ) ; }
		else { term.red( " (%ims)" , time ) ; }
	}
	
	term( '\n' ) ;
} ;



Reporter.skip = function skip( testName , depth )
{
	//term.bold.blue( '%s… ' , '  '.repeat( depth ) ).blue( '%s' , testName )( '\n' ) ;
	term.bold.blue( '%s· ' , '  '.repeat( depth ) ).blue( "%s" , testName )( '\n' ) ;
} ;



Reporter.report = function report( ok , fail , optionalFail , skip , coverageRate , time )
{
	term( '\n' ).brightBlack( "%s" , '='.repeat( term.width - 1 ) )( '\n' ) ;
	Report.report.call( this , ok , fail , optionalFail , skip , coverageRate , time ) ;
} ;



Reporter.exit = function exit()
{
	//term( '\n' ) ;
	term.styleReset() ;
} ;


