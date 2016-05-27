( function() {
	
	var container ;
	
	document.querySelector( 'body' ).insertAdjacentHTML( 'beforeend' , '<div class="tea-time-classic-reporter"></div>' ) ;
	
	container = document.querySelector( '.tea-time-classic-reporter' ) ;
	
	teaTime.on( 'ok' , function( testName , depth , time , slow ) {
		container.insertAdjacentHTML(
			'beforeend' ,
			'<p class="tea-time-classic-reporter">OK: ' + testName + '(' + time + ')' + '</p>'
		) ;
	} ) ;
	
	teaTime.on( 'fail' , function( testName , depth , time , slow , error ) {
		container.insertAdjacentHTML(
			'beforeend' ,
			'<p class="tea-time-classic-reporter">Fail: ' + testName + ( time !== undefined ? '(' + time + ')' : '' ) + '</p>'
		) ;
	} ) ;

	teaTime.on( 'skip' , function( testName , depth ) {
		container.insertAdjacentHTML(
			'beforeend' ,
			'<p class="tea-time-classic-reporter">Pending: ' + testName + '</p>'
		) ;
	} ) ;

	teaTime.on( 'report' , function( ok , fail , skip ) {
		container.insertAdjacentHTML(
			'beforeend' ,
			'<p class="tea-time-classic-reporter">Report -- ok: ' + ok + ' ; fail: ' + fail + ' ; pending: ' + skip + '</p>'
		) ;
	} ) ;
} )() ;

