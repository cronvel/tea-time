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



function Reporter( teaTime , self ) {
	if ( ! self ) {
		self = Object.create( Reporter.prototype , {
			teaTime: { value: teaTime , enumerable: true }
		} ) ;
	}

	self.teaTime.on( 'coverageReport' , Reporter.coverageReport.bind( self ) ) ;

	return self ;
}

module.exports = Reporter ;



Reporter.coverageReport = function coverageReport( coverage ) {
	var filePath , oneFile , count ;

	if ( ! coverage.warningCommentCount ) { return ; }

	term( "\n" ) ;
	term.bold.magenta( "== %i warning comments ==" , coverage.warningCommentCount ) ;
	term( "\n\n" ) ;

	// Summary
	for ( filePath in coverage.warningComments ) {
		oneFile = coverage.warningComments[ filePath ] ;

		count = coverage.warningComments[ filePath ].length ;

		if ( count <= 2 ) { term.green( "  %i" , count ) ; }
		else if ( count <= 5 ) { term.yellow( "  %i" , count ) ; }
		else if ( count <= 8 ) { term.red( "  %i" , count ) ; }
		else { term.bold.brightRed( "  %i" , count ) ; }

		term.column( 8 , filePath ) ;
		term( "\n" ) ;
	}

	term( "\n" ) ;
} ;


