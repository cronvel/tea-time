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
	
	self.runtime.on( 'errorReport' , Reporter.errorReport.bind( self ) ) ;
	
	return self ;
}

module.exports = Reporter ;



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
		Reporter.reportOneError.call( this , error.error ) ;
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


