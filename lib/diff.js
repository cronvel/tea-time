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



const inspect = require( 'string-kit/lib/inspect.js' ).inspect ;
const jsdiff = require( 'diff' ) ;



const inspectOptions = {
	minimal: true , depth: 10 , maxLength: 1000 , outputMaxLength: 10000 , sort: true
} ;



function textDiff( oldValue , newValue ) {
	var str = '' ,
		diff = textDiff.raw( oldValue , newValue , true ) ;

	diff.forEach( ( part ) => {
		str += part.value.replace( /^(?!$)/mg , () => {
			if ( part.added ) { return '++' ; }
			else if ( part.removed ) { return '--' ; }
			return '  ' ;
		} ) ;
	} ) ;

	return str ;
}

module.exports = textDiff ;



textDiff.raw = function( oldValue , newValue , noCharMode ) {
	var diff , score ;

	var oldStr = inspect( inspectOptions , oldValue ) ;
	var newStr = inspect( inspectOptions , newValue ) ;

	if ( ! noCharMode ) {
		// First try to evaluate if it would be relevant to use diffChars at all,
		// because it is slow and can be produce too much weirdness anyway.
		score = Math.abs( oldStr.length - newStr.length ) + 0.05 * Math.max( oldStr.length , newStr.length ) ;

		if ( score < 100 ) {
			// First try the diffChars algorithm, it looks great if there are only few changes
			//console.time( 'diffChars' ) ;
			diff = jsdiff.diffChars( oldStr , newStr ) ;
			//console.timeEnd( 'diffChars' ) ;

			// Try to evaluate the weirdness
			score = 0 ;
			diff.forEach( ( part ) => {
				if ( part.added || part.removed ) {
					score += 15 + part.value.length ;
				}
			} ) ;

			// If too much weirdness, fallback to line mode
			if ( score < 80 ) { return diff ; }
		}
	}

	//console.time( 'diffLines' ) ;
	diff = jsdiff.diffLines( oldStr , newStr ) ;
	//console.timeEnd( 'diffLines' ) ;

	return diff ;
} ;

