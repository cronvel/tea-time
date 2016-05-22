


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



describe( "Misc tests" , function() {
	
	it( "Pending" ) ;
	
	it( "Same name" , function() {
	} ) ;
	
	it( "Same name" , function() {
		throw new Error( "Failed!" ) ;
	} ) ;
} ) ;


