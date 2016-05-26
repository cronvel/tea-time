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
	self.runtime.on( 'ok' , Reporter.ok.bind( self ) ) ;
	self.runtime.on( 'fail' , Reporter.fail.bind( self ) ) ;
	self.runtime.on( 'skip' , Reporter.skip.bind( self ) ) ;
	self.runtime.on( 'report' , Reporter.report.bind( self ) ) ;
	self.runtime.on( 'exit' , Reporter.exit.bind( self ) ) ;
	
	return self ;
}

module.exports = Reporter ;



Reporter.init = function init()
{
	term( '1..%i\n' , this.runtime.testCount ) ;
} ;



Reporter.ok = function ok( testName , depth , time , slow )
{
	term( 'ok %i %s\n' , this.runtime.done , testName ) ;
} ;



Reporter.fail = function fail( testName , depth , time , slow , error )
{
	term( 'not ok %i %s\n' , this.runtime.done , testName ) ;
	Reporter.reportOneError( error ) ;
} ;



Reporter.skip = function skip( testName , depth )
{
	term( 'ok %i %s # SKIP -\n' , this.runtime.done , testName ) ;
} ;



Reporter.report = function report( ok , fail , skip , time )
{
	term( "# tests %i\n" , ok + fail + skip ) ;
	term( "# pass %i\n" , ok + skip ) ;
	term( "# fail %i\n" , fail ) ;
} ;



Reporter.reportOneError = function reportOneError( error )
{
	term( "%s\n" , string.inspectError( error ).trim().replace( /^/mg , '  ' ) ) ;
} ;



Reporter.exit = function exit()
{
	//term( "\n" ) ;
	//term.styleReset() ;
} ;

