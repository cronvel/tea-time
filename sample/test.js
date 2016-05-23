


describe( "Sync tests" , function() {
	
	it( "Sync Ok" , function() {
	} ) ;
	
	it( "Sync Exception" , function() {
		throw new Error( "Failed!" ) ;
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
			throw new Error( "Failed!" ) ;
			done() ;
		} , 10 ) ;
	} ) ;
	
	it( "Async fail callback" , function( done ) {
		setTimeout( function() {
			done( new Error( 'Failed!' ) ) ;
		} , 10 ) ;
	} ) ;
	
	it( "Async Ok 100ms" , function( done ) {
		setTimeout( done , 100 ) ;
	} ) ;
	
	it( "Async Ok 300ms" , function( done ) {
		setTimeout( done , 300 ) ;
	} ) ;
	
	it( "Async Ok 1000ms" , function( done ) {
		setTimeout( done , 1000 ) ;
	} ) ;
	
	it( "Async Exception 100ms" , function( done ) {
		setTimeout( function() {
			throw new Error( "Failed!" ) ;
			done() ;
		} , 100 ) ;
	} ) ;
	
	it( "Async Exception 300ms" , function( done ) {
		setTimeout( function() {
			throw new Error( "Failed!" ) ;
			done() ;
		} , 300 ) ;
	} ) ;
	
	it( "Async Exception 1000ms" , function( done ) {
		setTimeout( function() {
			throw new Error( "Failed!" ) ;
			done() ;
		} , 1000 ) ;
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
	
	before( function() {
		console.log( 'Sync Before!' ) ;
	} ) ;
	
	after( function() {
		console.log( 'Sync After!' ) ;
	} ) ;
	
	beforeEach( function() {
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
	

