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
var jsdiff = require( 'diff' ) ;



var inspectOptions = { minimal: true , depth: 10 , sort: true } ;



exports.raw = function rawDiff( oldValue , newValue )
{
	var diff , score ;
	
	var oldStr = string.inspect( inspectOptions , oldValue ) ;
	var newStr = string.inspect( inspectOptions , newValue ) ;
	
	// First try the diffChars algorithm, it looks great if there are only few changes
	diff = jsdiff.diffChars( oldStr , newStr ) ;
	
	// Try to evaluate the weirdness
	score = diff.length * 10 ;
	
	diff.forEach( function( part ) {
		if ( part.added || part.removed )
		{
			score += part.value.length ;
		}
	} ) ;
	
	// Too much weirdness, fallback to line mode
	if ( score > 80 )
	{
		diff = jsdiff.diffLines( oldStr , newStr ) ;
	}
	
	/*
	diff = jsdiff.diffJson( oldValue , newValue ) ;
	
	// As long as no dedicated diff exists using string.inspect()...
	diff.forEach( function( part ) {
		part.value = part.value.replace( / *,$/mg , '' ) ;
	} ) ;
	//*/
	
	return diff ;
} ;


	
exports.color = function colorDiff( oldValue , newValue )
{
	var str = '' ,
		diff = exports.raw( oldValue , newValue ) ;
	
	diff.forEach( function( part ) {
		
		if ( part.added )
		{
			str += part.value.replace( /^(\s*)(\S(?:[^\n]*\S)?)(\s*)$/mg , function( match , pre , value , after ) {
				return pre + term.str.bgGreen( value ) + after ;
			} ) ;
		}
		else if ( part.removed )
		{
			str += part.value.replace( /^(\s*)(\S(?:[^\n]*\S)?)(\s*)$/mg , function( match , pre , value , after ) {
				//console.log( "match:" , arguments ) ;
				return pre + term.str.bgRed( value ) + after ;
			} ) ;
		}
		else
		{  
			str += term.str.bgDefaultColor.brightBlack( part.value ) ;
		}
	} ) ;
	
	return str ;
} ;



exports.noColor = function noColordiff( oldValue , newValue )
{
	var str = '' ,
		diff = exports.raw( oldValue , newValue ) ;
	
	diff.forEach( function( part ) {
		
		str += part.value.replace( /^(?!$)/mg , function() {
			if ( part.added ) { return '++' ; }
			else if ( part.removed ) { return '--' ; }
			else { return '  ' ; }
		} ) ;
	} ) ;
	
	return str ;
} ;



