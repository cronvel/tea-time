/*
	Tea Time!

	Copyright (c) 2015 - 2019 Cédric Ronvel

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



const rawDiff = require( './diff.js' ).raw ;



module.exports = function htmlColorDiff( oldValue , newValue ) {
	var str = '' ,
		diff = rawDiff( oldValue , newValue ) ;

	diff.forEach( ( part ) => {

		if ( part.added ) {
			str += part.value.replace( /^(\s*)(\S(?:[^\n]*\S)?)(\s*)$/mg , ( match , pre , value , after ) => {
				return pre + '<span style="background-color:green;color:white">' + value + '</span>' + after ;
			} ) ;
		}
		else if ( part.removed ) {
			str += part.value.replace( /^(\s*)(\S(?:[^\n]*\S)?)(\s*)$/mg , ( match , pre , value , after ) => {
				return pre + '<span style="background-color:red;color:white">' + value + '</span>' + after ;
			} ) ;
		}
		else {
			str += '<span style="color:grey">' + part.value + '</span>' ;
		}
	} ) ;

	return str ;
} ;




