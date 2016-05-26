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

var classic = require( './classic.js' ) ;



function Reporter( runtime , self )
{
	if ( ! self )
	{
		self = Object.create( Reporter.prototype , {
			runtime: { value: runtime , enumerable: true }
		} ) ;
	}
	
	self.runtime.on( 'enterTest' , Reporter.enterTest.bind( self ) ) ;
	self.runtime.on( 'exitTest' , Reporter.exitTest.bind( self ) ) ;
	self.runtime.on( 'enterHook' , Reporter.enterHook.bind( self ) ) ;
	self.runtime.on( 'exitHook' , Reporter.exitHook.bind( self ) ) ;
	
	// Inherit from classic
	classic( runtime , self ) ;
	
	return self ;
}

module.exports = Reporter ;



Reporter.enterTest = function enterTest( testName , depth )
{   
	term.brightBlack( '%sEntering test: %s\n' , '  '.repeat( depth ) , testName ) ;
} ;



Reporter.exitTest = function exitTest( testName , depth )
{   
	term.brightBlack( '%sExiting test: %s\n' , '  '.repeat( depth ) , testName ) ;
} ;



Reporter.enterHook = function enterHook( hookType , hookName , depth )
{   
	term.brightBlack( '%sEntering %s hook: %s\n' , '  '.repeat( depth ) , hookType , hookName ) ;
} ;



Reporter.exitHook = function exitHook( hookType , hookName , depth )
{   
	term.brightBlack( '%sExiting %s hook: %s\n' , '  '.repeat( depth ) , hookType , hookName ) ;
} ;



