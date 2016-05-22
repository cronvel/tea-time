


describe( "Sync tests" , function() {
	
	it( "Sync Ok" , function() {
	} ) ;
	
	it( "Sync Exception" , function() {
		throw new Error( "Failed!" ) ;
	} ) ;
	
	it( "Pending" ) ;
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
} ) ;


