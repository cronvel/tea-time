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
	
	self.runtime.on( 'intro' , Reporter.intro.bind( self ) ) ;
	self.runtime.on( 'enterTopic' , Reporter.enterTopic.bind( self ) ) ;
	self.runtime.on( 'ok' , Reporter.ok.bind( self ) ) ;
	self.runtime.on( 'fail' , Reporter.fail.bind( self ) ) ;
	self.runtime.on( 'exit' , Reporter.exit.bind( self ) ) ;
	
	return self ;
}

module.exports = Reporter ;



Reporter.intro = function intro() {
	term.bold.magenta( 'Tea Time' ).dim( ' v%s by Cédric Ronvel\n\n' , teaTimePackage.version ) ;
} ;



Reporter.enterTopic = function enterTopic( topicName ) {
	term.bold( '\n%s\n' , topicName ) ;
} ;



Reporter.ok = function ok( testName , time ) {
	term.bold.brightGreen( '  ✔ ' ).brightBlack( '%s\n' , testName ) ;
} ;



Reporter.fail = function fail( testName , time ) {
	term.bold.brightRed( '  ✘ ' ).red( '%s\n' , testName ) ;
} ;



Reporter.exit = function exit() {
	term( "\n" ) ;
	term.styleReset() ;
} ;


