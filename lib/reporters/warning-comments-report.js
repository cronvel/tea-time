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



function Reporter( teaTime , self )
{
	if ( ! self )
	{
		self = Object.create( Reporter.prototype , {
			teaTime: { value: teaTime , enumerable: true }
		} ) ;
	}
	
	self.teaTime.on( 'coverageReport' , Reporter.coverageReport.bind( self ) ) ;
	
	return self ;
}

module.exports = Reporter ;



Reporter.coverageReport = function coverageReport( coverage )
{
	var filePath , oneFile ;
	
	if ( ! coverage.warningCommentCount ) { return ; }
	
	// The 'less' command support is greatly improved if styles do not expand over lines
	term( "\n" ) ;
	term.bold.magenta( "== %i warning comments ==" , coverage.warningCommentCount ) ;
	term( "\n\n" ) ;
	
	for ( filePath in coverage.warningComments )
	{
		oneFile = coverage.warningComments[ filePath ] ;
		
		term( "\n" ) ;
		term.bold.brightWhite( "    == File %s ==" , filePath ) ;
		term( "\n\n" ) ;
		
		oneFile.forEach( warning => {	// jshint ignore:line
			var lineNumber = warning.line ;
			warning.comment.split( /\n/g ).forEach( line => {	// jshint ignore:line
				term.gray( lineNumber ).column( 6 ).yellow( line )( "\n" ) ;
				lineNumber ++ ;
			} ) ;
			term( '\n' ) ;
		} ) ;
	}
	
	term( "\n" ) ;
} ;

