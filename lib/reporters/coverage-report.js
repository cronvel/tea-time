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



var contextLines = 3 ;



Reporter.coverageReport = function coverageReport( coverage )
{
	var filePath , oneFile , next , start , end , startDisplay , endDisplay , i ;
	
	if ( coverage.rate === 1 ) { return ; }
	
	term.magenta( "\n\n== Coverage %i%% ==\n" , Math.round( coverage.rate * 100 ) ) ;
	
	for ( filePath in coverage.uncoveredFiles )
	{
		oneFile = coverage.uncoveredFiles[ filePath ] ;
		
		term.bold.brightWhite( "\n    == File %s ==\n\n" , filePath ) ;
		
		// Line 0 doesn't exist
		next = 1 ;
		
		while ( next < oneFile.lines.length && ( start = oneFile.lines.indexOf( true , next ) ) !== -1 )
		{
			startDisplay = Math.max( next , start - contextLines ) ;
			end = oneFile.lines.indexOf( false , start ) ;
			endDisplay = Math.min( oneFile.lines.length , end + contextLines ) ;
			
			if ( end === -1 ) { end = oneFile.lines.length ; }
			
			for ( i = startDisplay ; i < endDisplay ; i ++ )
			{
				term.column( 3 ).brightBlack( i ).column( 7 ) ;
				
				if ( oneFile.lines[ i ] )
				{
					term.red( patchSourceLine( oneFile.source[ i ] ) + '\n' ) ;
				}
				else
				{
					term.blue( patchSourceLine( oneFile.source[ i ] ) + '\n' ) ;
				}
			}
			
			next = endDisplay ;
		}
	}
	
	term( "\n" ) ;
} ;



function patchSourceLine( str )
{
	str = str.replace( /\t/g , '    ' ) ;
	str = string.escape.control( str ) ;
	return str ;
}


