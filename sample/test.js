/*
	Tea Time!

	Copyright (c) 2015 - 2018 Cédric Ronvel

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

var SeventhPromise = require( 'seventh' ) ;



describe( "Sync tests" , function() {
	
	it( "Sync Exception" , function() {
		throw new Error( "Failed!" ) ;
	} ) ;
	
	it( "Sync Ok" , function() {
	} ) ;
} ) ;



describe( "Async tests" , function() {
	
	it( "Async sync Ok" , function( done ) {
		done() ;
	} ) ;
	
	it( "Async sync Exception" , function( done ) {
		throw new Error( "Failed!" ) ;
	} ) ;
	
	it( "Async sync fail callback" , function( done ) {
		done( new Error( 'Failed!' ) ) ;
	} ) ;
	
	it( "Async Ok" , function( done ) {
		setTimeout( done , 10 ) ;
	} ) ;
	
	it( "Async Exception" , function( done ) {
		setTimeout( function() {
			throw new Error( "Asyncly Failed!" ) ;
			done() ;
		} , 10 ) ;
	} ) ;
	
	it( "Async fail callback" , function( done ) {
		setTimeout( function() {
			done( new Error( 'Asyncly Failed!' ) ) ;
		} , 10 ) ;
	} ) ;
} ) ;



describe( "Promise-returning function and async function tests" , function() {
	
	it( "Promise sync resolve" , function() {
		return Promise.resolve() ;
	} ) ;
	
	it( "Promise sync reject" , function() {
		return Promise.reject( new Error( "Failed!" ) ) ;
	} ) ;
	
	it( "Promise async resolve" , function() {
		return SeventhPromise.resolveTimeout( 20 ) ;
	} ) ;
	
	it( "Promise async reject" , function() {
		return SeventhPromise.reject( new Error( "Failed!" ) ) ;
	} ) ;
	
	it( "Async function sync resolve" , async function() {
		return ;
	} ) ;
	
	it( "Async function sync reject" , async function() {
		throw new Error( "Failed!" ) ;
	} ) ;
	
	it( "Async function async resolve" , async function() {
		await SeventhPromise.resolveTimeout( 20 ) ;
	} ) ;
	
	it( "Async function async reject" , async function() {
		await SeventhPromise.resolveTimeout( 20 ) ;
		throw new Error( "Failed!" ) ;
	} ) ;
} ) ;



describe( "Mixing Promise/thenable with the callback interface should fail" , function() {
	
	it( "Promise sync resolve" , function( done ) {
		return Promise.resolve() ;
	} ) ;
	
	it( "Promise async resolve" , function( done ) {
		return SeventhPromise.resolveTimeout( 20 ) ;
	} ) ;
	
	it( "Async function sync resolve" , async function( done ) {
		return ;
	} ) ;
	
	it( "Async function async resolve" , async function( done ) {
		await SeventhPromise.resolveTimeout( 20 ) ;
	} ) ;
} ) ;



describe( "Optional tests" , function() {
	
	it.next( "Sync Exception" , function() {
		throw new Error( "Failed!" ) ;
	} ) ;
	
	it.next( "Sync Ok" , function() {
	} ) ;
	
	it.next( "Async sync Ok" , function( done ) {
		done() ;
	} ) ;
	
	it.next( "Async sync Exception" , function( done ) {
		throw new Error( "Failed!" ) ;
	} ) ;
	
	it.next( "Async sync fail callback" , function( done ) {
		done( new Error( 'Failed!' ) ) ;
	} ) ;
	
	it.next( "Async Ok" , function( done ) {
		setTimeout( done , 10 ) ;
	} ) ;
	
	it.next( "Async Exception" , function( done ) {
		setTimeout( function() {
			throw new Error( "Asyncly Failed!" ) ;
			done() ;
		} , 10 ) ;
	} ) ;
	
	it.next( "Async fail callback" , function( done ) {
		setTimeout( function() {
			done( new Error( 'Asyncly Failed!' ) ) ;
		} , 10 ) ;
	} ) ;
} ) ;



describe( "Suite into suite" , function() {
	
	//it( "Some test #1" , function() {} ) ;
	
	describe( "Suite into suite" , function() {
		
		it( "Some sub-test #1" , function() {
		} ) ;
		
		it( "Some sub-test #2" , function() {
			throw new Error( "Failed!" ) ;
		} ) ;
	} ) ;
	
	describe( "Suite into suite" , function() {
		
		it( "Some sub-test #1" , function() {
		} ) ;
		
		it( "Some sub-test #2" , function() {
			throw new Error( "Failed!" ) ;
		} ) ;
	} ) ;
	
	/*
	it( "Some test #2" , function() {
		throw new Error( "Failed!" ) ;
	} ) ;
	*/
} ) ;



describe( "Hooks" , function() {
	
	before( "suite setup hook" , function() {
		console.log( 'Sync Before!' ) ;
	} ) ;
	
	after( "suite teardown hook" , function() {
		console.log( 'Sync After!' ) ;
	} ) ;
	
	beforeEach( function beforeEach() {
		console.log( 'Sync BeforeEach!' ) ;
	} ) ;
	
	afterEach( function() {
		console.log( 'Sync AfterEach!' ) ;
	} ) ;
	
	before( function( done ) {
		setTimeout( function() {
			console.log( 'Async Before!' ) ;
			done() ;
		} , 10 ) ;
	} ) ;
	
	after( function( done ) {
		setTimeout( function() {
			console.log( 'Async After!' ) ;
			done() ;
		} , 10 ) ;
	} ) ;
	
	beforeEach( function( done ) {
		setTimeout( function() {
			console.log( 'Async BeforeEach!' ) ;
			done() ;
		} , 10 ) ;
	} ) ;
	
	afterEach( function( done ) {
		setTimeout( function() {
			console.log( 'Async AfterEach!' ) ;
			done() ;
		} , 10 ) ;
	} ) ;
	
	it( "One" , function() {
		throw new Error( "Failed!" ) ;
	} ) ;
	
	it( "Two" , function() {
	} ) ;
	
	it( "Three" , function() {
		throw new Error( "Failed!" ) ;
	} ) ;
} ) ;



describe( "Failing suite setup" , function() {
	
	context( "Sync" , function() {
		
		before( function() {
			console.log( 'Sync Before!' ) ;
			throw new Error( 'Failed hook!' ) ;
		} ) ;
		
		it( "One" , function() {
		} ) ;
		
		it( "Two" , function() {
		} ) ;
	} ) ;
	
	context( "Async" , function() {
		
		before( function( done ) {
			setTimeout( function() {
				console.log( 'Async Before!' ) ;
				throw new Error( 'Failed hook!' ) ;
				done() ;
			} , 10 ) ;
		} ) ;
		
		it( "One" , function() {
		} ) ;
		
		it( "Two" , function() {
		} ) ;
	} ) ;
} ) ;



describe( "Failing setup hooks" , function() {
	
	context( "Sync" , function() {
		
		beforeEach( function() {
			console.log( 'Sync BeforeEach!' ) ;
			throw new Error( 'Failed hook!' ) ;
		} ) ;
		
		it( "One" , function() {
		} ) ;
		
		it( "Two" , function() {
		} ) ;
	} ) ;
	
	context( "Async" , function() {
		
		beforeEach( function( done ) {
			setTimeout( function() {
				console.log( 'Async BeforeEach!' ) ;
				throw new Error( 'Failed hook!' ) ;
				done() ;
			} , 10 ) ;
		} ) ;
		
		it( "One" , function() {
		} ) ;
		
		it( "Two" , function() {
		} ) ;
	} ) ;
} ) ;



describe( "Failing suite teardown" , function() {
	
	context( "Sync" , function() {
		
		after( function() {
			console.log( 'Sync After!' ) ;
			throw new Error( 'Failed hook!' ) ;
		} ) ;
		
		it( "One" , function() {
		} ) ;
		
		it( "Two" , function() {
		} ) ;
	} ) ;
	
	context( "Async" , function() {
		
		after( function( done ) {
			setTimeout( function() {
				console.log( 'Async After!' ) ;
				throw new Error( 'Failed hook!' ) ;
				done() ;
			} , 10 ) ;
		} ) ;
		
		it( "One" , function() {
		} ) ;
		
		it( "Two" , function() {
		} ) ;
	} ) ;
} ) ;



describe( "Failing teardown" , function() {
	
	context( "Sync" , function() {
		
		afterEach( function() {
			console.log( 'Sync AfterEach!' ) ;
			throw new Error( 'Failed hook!' ) ;
		} ) ;
		
		it( "One" , function() {
		} ) ;
		
		it( "Two" , function() {
		} ) ;
	} ) ;
	
	context( "Async" , function() {
		
		afterEach( function( done ) {
			setTimeout( function() {
				console.log( 'Async AfterEach!' ) ;
				throw new Error( 'Failed hook!' ) ;
				done() ;
			} , 10 ) ;
		} ) ;
		
		it( "One" , function() {
		} ) ;
		
		it( "Two" , function() {
		} ) ;
	} ) ;
} ) ;



describe( "Expected/actual" , function() {
	
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



describe( "Timeout" , function() {
	
	it( "Async Ok 100ms" , function( done ) {
		setTimeout( done , 100 ) ;
	} ) ;
	
	it( "Async Ok 100ms (slow 150)" , function( done ) {
		this.slow( 150 ) ;
		setTimeout( done , 100 ) ;
	} ) ;
	
	it( "Async Ok 300ms" , function( done ) {
		setTimeout( done , 300 ) ;
	} ) ;
	
	it( "Async Ok 1000ms" , function( done ) {
		setTimeout( done , 1000 ) ;
	} ) ;
	
	it( "Async Ok 3000ms (timeout)" , function( done ) {
		setTimeout( done , 3000 ) ;
	} ) ;
	
	it( "Async Ok 3000ms (no timeout)" , function( done ) {
		this.timeout( 4000 ) ;
		setTimeout( done , 3000 ) ;
	} ) ;
	
	it( "Async Exception 100ms" , function( done ) {
		setTimeout( function() {
			throw new Error( "Asyncly Failed!" ) ;
			done() ;
		} , 100 ) ;
	} ) ;
	
	it( "Async Exception 300ms" , function( done ) {
		setTimeout( function() {
			throw new Error( "Asyncly Failed!" ) ;
			done() ;
		} , 300 ) ;
	} ) ;
	
	it( "Async Exception 1000ms" , function( done ) {
		setTimeout( function() {
			throw new Error( "Asyncly Failed!" ) ;
			done() ;
		} , 1000 ) ;
	} ) ;
	
	it( "Async Exception 3000ms (timeout)" , function( done ) {
		setTimeout( function() {
			throw new Error( "Asyncly Failed!" ) ;
			done() ;
		} , 3000 ) ;
	} ) ;
	
	it( "Async Exception 3000ms (no timeout)" , function( done ) {
		this.timeout( 4000 ) ;
		setTimeout( function() {
			throw new Error( "Asyncly Failed!" ) ;
			done() ;
		} , 3000 ) ;
	} ) ;
} ) ;



describe( "Misc tests" , function() {
	
	it( "Pending" ) ;
	
	it.skip( "Skip" , function() {
		throw new Error( "Failed!" ) ;
	} ) ;
	
	it( "Same name" , function() {
	} ) ;
	
	it( "Same name" , function() {
		throw new Error( "Failed!" ) ;
	} ) ;
} ) ;



it( "Out of suite test" , function() {
} ) ;
	

