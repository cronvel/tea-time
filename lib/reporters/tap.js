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
var inspect = require( 'string-kit/lib/inspect.js' ) ;



function Reporter( teaTime , self )
{
	if ( ! self )
	{
		self = Object.create( Reporter.prototype , {
			teaTime: { value: teaTime , enumerable: true }
		} ) ;
	}
	
	self.teaTime.on( 'run' , Reporter.run.bind( self ) ) ;
	self.teaTime.on( 'ok' , Reporter.ok.bind( self ) ) ;
	self.teaTime.on( 'fail' , Reporter.fail.bind( self ) ) ;
	self.teaTime.on( 'optionalFail' , Reporter.optionalFail.bind( self ) ) ;
	self.teaTime.on( 'skip' , Reporter.skip.bind( self ) ) ;
	self.teaTime.on( 'report' , Reporter.report.bind( self ) ) ;
	self.teaTime.on( 'exit' , Reporter.exit.bind( self ) ) ;
	
	return self ;
}

module.exports = Reporter ;



Reporter.run = function run()
{
	term( '1..%i\n' , this.teaTime.testCount ) ;
} ;



Reporter.ok = function ok( testName , depth , time , slow )
{
	term( 'ok %i %s\n' , this.teaTime.done , testName ) ;
} ;



Reporter.fail = function fail( testName , depth , time , slow , error )
{
	term( 'not ok %i %s\n' , this.teaTime.done , testName ) ;
	Reporter.reportOneError( error ) ;
} ;



Reporter.optionalFail = function optionalFail( testName , depth , time , slow , error )
{
	term( 'ok %i %s # OPTIONAL FAIL -\n' , this.teaTime.done , testName ) ;
} ;



Reporter.skip = function skip( testName , depth )
{
	term( 'ok %i %s # SKIP -\n' , this.teaTime.done , testName ) ;
} ;



Reporter.report = function report( ok , fail , optionalFail , skip , time )
{
	term( "# tests %i\n" , ok + fail + skip ) ;
	term( "# pass %i\n" , ok + skip ) ;
	term( "# fail %i\n" , fail ) ;
} ;



Reporter.reportOneError = function reportOneError( error )
{
	// The error can be sent by a browser, so activate the 'browser' option
	term( "%s\n" , inspect.inspectError( { browser: true } , error ).trim().replace( /^/mg , '  ' ) ) ;
} ;



Reporter.exit = function exit()
{
	//term( "\n" ) ;
	//term.styleReset() ;
} ;


