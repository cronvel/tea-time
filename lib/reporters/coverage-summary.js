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
	var filePath , oneFile , percent ;
	
	term( "\n" ) ;
	term.bold.magenta( "== Partly uncovered files (%i%%) ==" , Math.round( coverage.rate * 100 ) ) ;
	term( "\n\n" ) ;
	
	// Summary
	for ( filePath in coverage.uncoveredFiles )
	{
		oneFile = coverage.uncoveredFiles[ filePath ] ;
		
		percent = Math.round( coverage.uncoveredFiles[ filePath ].rate * 100 ) ;
		
		if ( percent >= 90 ) { term.green( "  %i%%" , percent ) ; }
		else if ( percent >= 70 ) { term.yellow( "  %i%%" , percent ) ; }
		else if ( percent >= 50 ) { term.red( "  %i%%" , percent ) ; }
		else { term.bold.brightRed( "  %i%%" , percent ) ; }
		
		term.column( 8 , filePath ) ;
		term( "\n" ) ;
	}
	
	term( "\n" ) ;
} ;
	

