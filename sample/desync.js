


describe( "Desync" , function() {
	
	it( "should timeout and fail after the timeout" , function( done ) {
		
		this.timeout( 100 ) ;
		
		setTimeout( function() {
			throw new Error( "Delayed fail" ) ;
		} , 200 ) ;
	} ) ;
	
	it( "should pass without being affected by the previous test after-timeout failure" , function( done ) {
		
		setTimeout( function() {
			done() ;
		} , 500 ) ;
	} ) ;
} ) ;
