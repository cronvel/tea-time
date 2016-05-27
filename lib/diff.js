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



var inspect = require( 'string-kit/lib/inspect.js' ) ;
var jsdiff = require( 'diff' ) ;



var inspectOptions = { minimal: true , depth: 10 , sort: true } ;



module.exports = function textDiff( oldValue , newValue )
{
	var str = '' ,
		diff = exports.raw( oldValue , newValue , true ) ;
	
	diff.forEach( function( part ) {
		
		str += part.value.replace( /^(?!$)/mg , function() {
			if ( part.added ) { return '++' ; }
			else if ( part.removed ) { return '--' ; }
			else { return '  ' ; }
		} ) ;
	} ) ;
	
	return str ;
} ;



module.exports.raw = function rawDiff( oldValue , newValue , noCharMode )
{
	var diff , score = 0 ;
	
	var oldStr = inspect.inspect( inspectOptions , oldValue ) ;
	var newStr = inspect.inspect( inspectOptions , newValue ) ;
	
	if ( ! noCharMode )
	{
		// First try the diffChars algorithm, it looks great if there are only few changes
		diff = jsdiff.diffChars( oldStr , newStr ) ;
		
		// Try to evaluate the weirdness
		diff.forEach( function( part ) {
			if ( part.added || part.removed )
			{
				score += 15 + part.value.length ;
			}
		} ) ;
		
		// If too much weirdness, fallback to line mode
		if ( score < 80 ) { return diff ; }
	}
	
	diff = jsdiff.diffLines( oldStr , newStr ) ;
	
	return diff ;
} ;


