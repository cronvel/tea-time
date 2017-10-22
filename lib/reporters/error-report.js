/*
	Tea Time!
	
	Copyright (c) 2015 - 2017 Cédric Ronvel
	
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
var termColorDiff = require( '../termColorDiff.js' ) ;



function Reporter( teaTime , self )
{
	if ( ! self )
	{
		self = Object.create( Reporter.prototype , {
			teaTime: { value: teaTime , enumerable: true }
		} ) ;
	}
	
	self.teaTime.on( 'errorReport' , Reporter.errorReport.bind( self ) ) ;
	
	return self ;
}

module.exports = Reporter ;



Reporter.errorReport = function errorReport( errors )
{
	var i , error ;
	term( '\n' ).bold.red( "== Errors ==" )( '\n' ) ;
	
	for ( i = 0 ; i < errors.length ; i ++ )
	{
		error = errors[ i ] ;
		
		term( '\n' ) ;
		
		if ( error.optional ) { term.yellow( '  %i) ' , i + 1 ) ; }
		else { term.red( '  %i) ' , i + 1 ) ; }
		
		switch ( error.type )
		{
			case 'test' :
				if ( error.error.testTimeout ) { term.bgRed.brightWhite( 'TEST TIMEOUT' )( ' ' ) ; }
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
		
		if ( error.error.uncaught ) { term.bgRed.brightWhite( 'UNCAUGHT EXCEPTION' )( ' ' ) ; }
		
		if ( error.optional ) { term.yellow( '%s' , error.name ) ; }
		else { term.red( '%s' , error.name ) ; }
		
		term( '\n' ) ;
		
		Reporter.reportOneError.call( this , error.error ) ;
	}
	
	term( "\n" ) ;
} ;



Reporter.reportOneError = function reportOneError( error )
{
	var diff ;
	
	if ( ( 'expected' in error ) && ( 'actual' in error ) )
	{
		term( '     ' ).bgGreen( 'expected' )( ' ' ).bgRed( 'actual' )( '\n' ) ;
		diff = termColorDiff( error.actual , error.expected ) ;
		diff = diff.replace( /^/mg , '     ' ) ;
		term( diff + "\n" ) ;
	}
	
	// Hacky, but well... 
	// Websocket transmit data using JSON, so we lost the actual prototype in the serialization/unserialization process.
	//if ( ! ( error instanceof Error ) ) { error.__proto__ = Error.prototype ; }
	
	// The error can be sent by a browser, so activate the 'browser' option
	term( "%s" , string.inspectError( { style: 'color' , browser: true } , error ).replace( /^/mg , '     ' ) ) ;
} ;



