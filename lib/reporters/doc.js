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



// This reporter output a markdown documentation



//const string = require( 'string-kit' ) ;



function Reporter( teaTime , self ) {
	if ( ! self ) {
		self = Object.create( Reporter.prototype , {
			teaTime: { value: teaTime , enumerable: true }
		} ) ;
	}

	self.tocStr = '' ;
	self.bodyStr = '' ;

	self.teaTime.on( 'enterSuite' , Reporter.enterSuite.bind( self ) ) ;
	self.teaTime.on( 'exitSuite' , Reporter.exitSuite.bind( self ) ) ;
	self.teaTime.on( 'enterTest' , Reporter.enterTest.bind( self ) ) ;
	self.teaTime.on( 'end' , Reporter.end.bind( self ) ) ;

	return self ;
}

module.exports = Reporter ;



Reporter.enterSuite = function enterSuite( data ) {
	var title = data.title.trim() ;
	var link = title.toLowerCase().replace( / /g , '-' ) ;
	link = link.replace( /[^a-z0-9-]+/g , '' ) ;

	this.tocStr += "* [" + title + "](#" + link + ")\n" ;
	this.bodyStr += '#'.repeat( Math.min( data.depth + 2 , 4 ) ) + ' ' + title + "\n\n" ;
} ;



Reporter.exitSuite = function exitSuite( data ) {} ;



Reporter.enterTest = function enterTest( data ) {
	var title = data.title.trim() ;

	if ( data.type === 'it' ) {
		title = title.replace( /^[Ss]hould/ , "It should" ) ;
	}

	// Force an uppercased first letter
	title = title[ 0 ].toUpperCase() + title.slice( 1 ) ;

	this.bodyStr += "**" + title + "**\n\n" ;

	var fnStr = data.fn.toString().trim() ;

	fnStr = fnStr.replace( /^\s*[^{]*\{([ `\t]*\n)*/ , '' ) ;
	fnStr = fnStr.replace( /\s*}\s*$/ , '' ) ;
	fnStr = fnStr.replace( /^\t+/gm , match => "\t".repeat( Math.max( 0 , match.length - data.depth - 1 ) ) ) ;

	this.bodyStr += "```javascript\n" + fnStr + "\n```\n\n" ;
} ;



function write( str ) {
	process.stdout.write( str ) ;
}



Reporter.end = function end() {
	write( "## Table of Content\n\n" ) ;
	write( this.tocStr ) ;
	write( "\n\n" ) ;
	write( this.bodyStr ) ;
	write( "\n" ) ;
} ;


