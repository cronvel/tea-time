
teaTime.on( 'ok' , function( testName , depth , time , slow ) {
	console.log( 'OK:' , testName , '(' + time + ')' ) ;
} ) ;

teaTime.on( 'fail' , function( testName , depth , time , slow , error ) {
	console.log( 'Fail:' , testName , time !== undefined ? '(' + time + ')' : '' ) ;
} ) ;

teaTime.on( 'skip' , function( testName , depth ) {
	console.log( 'Pending:' , testName ) ;
} ) ;

teaTime.on( 'report' , function( ok , fail , skip ) {
	console.log( 'Report -- ok:' , ok , ' fail:' , fail , ' pending:' , skip ) ;
} ) ;
