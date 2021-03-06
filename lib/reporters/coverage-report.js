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
const string = require( 'string-kit' ) ;
const CoverageSummary = require( './coverage-summary.js' ) ;



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



const contextLines = 3 ;



Reporter.coverageReport = function coverageReport( coverage ) {
	var filePath , oneFile ,
		nextLine , startLine , endLine , startLineDisplay , endLineDisplay ,
		i , etcFiller ;

	//term( "%Y" , coverage ) ;
	if ( coverage.rate === 1 ) { return ; }

	etcFiller = '.'.repeat( term.width - 8 ) + '\n' ;

	CoverageSummary.coverageReport( coverage ) ;

	// The 'less' command support is greatly improved if styles do not expand over lines
	term( "\n" ) ;
	term.bold.magenta( "== Partly uncovered files details ==" ) ;
	term( "\n\n" ) ;

	for ( filePath in coverage.uncoveredFiles ) {
		oneFile = coverage.uncoveredFiles[ filePath ] ;

		term( "\n" ) ;
		term.bold.brightWhite( "    == File %s " , filePath ) ;
		term.bold.magenta( "%i%% " , Math.round( coverage.uncoveredFiles[ filePath ].rate * 100 ) ) ;
		term.bold.brightWhite( "==" ) ;
		term( "\n\n" ) ;
		//term( "%Y" , oneFile ) ;

		nextLine = 0 ;

		//while ( nextLine < oneFile.lines.length && ( startLine = oneFile.lines.indexOf( true , nextLine ) ) !== -1 )
		while ( nextLine < oneFile.lines.length && ( startLine = nextIndexOf( oneFile.lines , nextLine , true ) ) !== -1 ) {
			startLineDisplay = Math.max( nextLine , startLine - contextLines ) ;

			//endLine = oneFile.lines.indexOf( false , startLine ) ;
			endLine = nextIndexOf( oneFile.lines , startLine , false ) ;
			if ( endLine === -1 ) { endLine = oneFile.lines.length ; }

			endLineDisplay = Math.min( oneFile.source.length , endLine + contextLines ) ;

			if ( startLineDisplay !== nextLine && nextLine ) {
				term.column( 2 ).brightBlack( '…' )
					.column( 6 )
					.brightBlack( etcFiller ) ;
			}

			for ( i = startLineDisplay ; i < endLineDisplay ; i ++ ) {
				// Usually, text editor display the first line as 1, not 0, that's why we add 1
				term.column( 1 ).brightBlack( i + 1 )
					.column( 6 ) ;

				if ( ! oneFile.lines[ i ] ) {
					term.blue.noFormat( patchSourceLine( oneFile.source[ i ] ) + '\n' ) ;
				}
				else if ( oneFile.lines[ i ] === true ) {
					term.red.noFormat( patchSourceLine( oneFile.source[ i ] ) + '\n' ) ;
					endLineDisplay = Math.max( endLineDisplay , Math.min( oneFile.source.length , i + 1 + contextLines ) ) ;
				}
				else {
					// Complex case: array of columns
					displayComplexLine( oneFile.source[ i ] , oneFile.lines[ i ] ) ;
					endLineDisplay = Math.max( endLineDisplay , Math.min( oneFile.source.length , i + 1 + contextLines ) ) ;
				}
			}

			nextLine = endLineDisplay ;
		}
	}

	//term( ">>> END!!!\n\n" ) ;
	term( "\n" ) ;
} ;



function displayComplexLine( sourceLine , columns ) {
	var nextColumn , startColumn , endColumn ;

	nextColumn = 0 ;

	while ( nextColumn < columns.length && ( startColumn = nextIndexOf( columns , nextColumn , true ) ) !== -1 ) {
		endColumn = nextIndexOf( columns , startColumn , false ) ;
		if ( endColumn === -1 ) { endColumn = columns.length ; }

		// Display the covered part
		term.blue.noFormat( patchSourceLine( sourceLine.slice( nextColumn , startColumn ) ) ) ;

		// Display the uncovered part
		term.red.noFormat( patchSourceLine( sourceLine.slice( startColumn , endColumn ) ) ) ;

		nextColumn = endColumn ;
	}

	// Display the remaining columns
	term.blue.noFormat( patchSourceLine( sourceLine.slice( nextColumn ) ) + '\n' ) ;
}



function nextIndexOf( array , index , bool ) {
	var max = array.length ;

	for ( ; index < max ; index ++ ) {
		if ( ! array[ index ] === ! bool ) { return index ; }	// jshint ignore:line
	}

	return -1 ;
}



function patchSourceLine( str ) {
	str = str.replace( /\t/g , '    ' ) ;
	str = string.escape.control( str ) ;
	return str ;
}


