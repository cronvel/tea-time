/*
	Tea Time!

	Copyright (c) 2015 - 2021 Cédric Ronvel

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



const termkit = require( 'terminal-kit' ) ;
const term = termkit.terminal ;

const classic = require( './classic.js' ) ;



function Reporter( teaTime , self ) {
	if ( ! self ) {
		self = Object.create( Reporter.prototype , {
			teaTime: { value: teaTime , enumerable: true }
		} ) ;
	}

	self.teaTime.on( 'enterTest' , Reporter.enterTest.bind( self ) ) ;
	self.teaTime.on( 'exitTest' , Reporter.exitTest.bind( self ) ) ;
	self.teaTime.on( 'enterHook' , Reporter.enterHook.bind( self ) ) ;
	self.teaTime.on( 'exitHook' , Reporter.exitHook.bind( self ) ) ;

	// Inherit from classic
	classic( teaTime , self ) ;

	return self ;
}

module.exports = Reporter ;



Reporter.enterTest = function enterTest( data ) {
	term.brightBlack( '%sEntering test: %s' , '  '.repeat( data.depth ) , data.title )( '\n' ) ;
} ;



Reporter.exitTest = function exitTest( data ) {
	term.brightBlack( '%sExiting test: %s' , '  '.repeat( data.depth ) , data.title )( '\n' ) ;
} ;



Reporter.enterHook = function enterHook( data ) {
	term.brightBlack( '%sEntering %s hook: %s' , '  '.repeat( data.depth ) , data.hookType , data.title )( '\n' ) ;
} ;



Reporter.exitHook = function exitHook( data ) {
	term.brightBlack( '%sExiting %s hook: %s' , '  '.repeat( data.depth ) , data.hookType , data.title )( '\n' ) ;
} ;



