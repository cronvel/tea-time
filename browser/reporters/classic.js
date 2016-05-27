( function() {
	
	var container ;
	
	document.querySelector( 'body' ).insertAdjacentHTML( 'beforeend' , '<div class="tea-time-classic-reporter"></div>' ) ;
	
	container = document.querySelector( 'div.tea-time-classic-reporter' ) ;
	
	var scrollDown = function scrollDown()
	{
		document.querySelector( 'div.tea-time-classic-reporter p:last-child' ).scrollIntoView() ;
	}
	
	
	
	teaTime.on( 'enterSuite' , function( suiteName , depth ) {
		
		container.insertAdjacentHTML( 'beforeend' ,
			'<p class="tea-time-classic-reporter" style="color:black; font-weight:bold; margin-left:' + depth * 2 + 'em"">' + suiteName + '</p>'
		) ;
		
		scrollDown() ;
	} ) ;
	
	teaTime.on( 'ok' , function( testName , depth , time , slow ) {
		
		var content = '✔ ' + testName ;
		
		if ( ! slow ) { content += ' <span style="color:grey">(' + time + 'ms)</span>' ; }
		else if ( slow === 1 ) { content += ' <span style="color:yellow">(' + time + 'ms)</span>' ; }
		else { content += ' <span style="color:red">(' + time + 'ms)</span>' ; }
		
		container.insertAdjacentHTML( 'beforeend' ,
			'<p class="tea-time-classic-reporter" style="color:green; margin-left:' + depth * 2 + 'em">' + content + '</p>'
		) ;
		
		scrollDown() ;
	} ) ;
	
	teaTime.on( 'fail' , function( testName , depth , time , slow , error ) {
		
		var content = '✘ ' + testName ;
		
		if ( ! slow ) { content += ' <span style="color:grey">(' + time + 'ms)</span>' ; }
		else if ( slow === 1 ) { content += ' <span style="color:yellow">(' + time + 'ms)</span>' ; }
		else { content += ' <span style="color:red">(' + time + 'ms)</span>' ; }
		
		container.insertAdjacentHTML( 'beforeend' ,
			'<p class="tea-time-classic-reporter" style="color:red; margin-left:' + depth * 2 + 'em"">' + content + '</p>'
		) ;
		
		scrollDown() ;
	} ) ;

	teaTime.on( 'skip' , function( testName , depth ) {
		
		var content = '· ' + testName ;
		
		container.insertAdjacentHTML( 'beforeend' ,
			'<p class="tea-time-classic-reporter" style="color:blue; margin-left:' + depth * 2 + 'em"">' + content + '</p>'
		) ;
		
		scrollDown() ;
	} ) ;

	teaTime.on( 'report' , function( ok , fail , skip ) {
		
		var content = '' + ok + ' passing<br/>' + fail + ' failing<br/>' + skip + ' pending' ;
		
		container.insertAdjacentHTML(
			'beforeend' ,
			'<hr /><p class="tea-time-classic-reporter" style="margin-left: 2em">' + content + '</p>'
		) ;
		
		scrollDown() ;
	} ) ;
} )() ;

