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
describe( "2nd file" , function() {
	
	it( "Sync Exception" , function() {
		throw new Error( "Failed!" ) ;
	} ) ;
	
	function one() { return two() ; }
	function two() { return three() ; }
	function three() { throw new Error( "Traced fail!" ) ; ; }
	
	it( "Sync Exception" , function() {
		one() ;
	} ) ;
	
	it( "Sync Ok" , function() {
	} ) ;
	
	it( "Simple expected/actual" , function() {
		var error = new Error( "Expected some value to be some other" ) ;
		
		error.expected = {
			a: 1 ,
			b: 2 ,
			c: 3 ,
			x: 'four'
		} ;
		
		error.actual = {
			a: 1 ,
			b: 'two' ,
			c: 3 ,
			x: 'five'
		} ;
		
		throw error ;
	} ) ;
	
	it( "Bad order in expected/actual" , function() {
		var error = new Error( "Expected some value to be some other" ) ;
		
		error.expected = {
			a: 1 ,
			b: 2 ,
			x: 'four' ,
			c: 3 ,
		} ;
		
		error.actual = {
			c: 3 ,
			a: 1 ,
			x: 'five' ,
			b: 2 ,
		} ;
		
		throw error ;
	} ) ;
	
	it( "Complex expected/actual" , function() {
		var error = new Error( "Expected some value to be some other" ) ;
		
		error.expected = {
			a: 1 ,
			b: 2 ,
			x: {
				f: 'formidable'
			} ,
			c: 3
		} ;
		
		error.actual = {
			a: 1 ,
			b: 'two' ,
			y: {
				g: 'Gee'
			} ,
			c: 3
		} ;
		
		throw error ;
	} ) ;
} ) ;
