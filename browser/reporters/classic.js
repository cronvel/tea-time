( function() {
	
	var container ;
	
	document.querySelector( 'body' ).insertAdjacentHTML( 'beforeend' , '<div class="tea-time-classic-reporter"></div>' ) ;
	
	container = document.querySelector( 'div.tea-time-classic-reporter' ) ;
	
	var scrollDown = function scrollDown()
	{
		( document.querySelector( 'div.tea-time-classic-reporter p:last-child' ) ||
			document.querySelector( 'div.tea-time-classic-reporter h4:last-child' ) )
				.scrollIntoView() ;
	}
	
	var indentStyle = function indentStyle( depth )
	{
		return 'margin-left:' + ( 1 + 2 * depth ) + 'em;' ;
	}
	
	var passingStyle = "color:green;" ;
	var failingStyle = "color:red;" ;
	var pendingStyle = "color:blue;" ;
	
	var fastStyle = "color:grey;" ;
	var slowStyle = "color:yellow;" ;
	var slowerStyle = "color:red;" ;
	
	var errorStyle = "color:red;font-weight:bold;" ;
	var hookErrorStyle = "background-color:red;color:white;font-weight:bold;" ;
	
	var expectedStyle = "background-color:green;color:white;font-weight:bold;" ;
	var actualStyle = "background-color:red;color:white;font-weight:bold;" ;
	
	
	teaTime.on( 'enterSuite' , function( suiteName , depth ) {
		
		container.insertAdjacentHTML( 'beforeend' ,
			'<h4 class="tea-time-classic-reporter" style="' + indentStyle( depth ) + '">' + suiteName + '</h4>'
		) ;
		
		scrollDown() ;
	} ) ;
	
	teaTime.on( 'ok' , function( testName , depth , time , slow ) {
		
		var content = '✔ ' + testName ;
		
		if ( ! slow ) { content += ' <span style="' + fastStyle + '">(' + time + 'ms)</span>' ; }
		else if ( slow === 1 ) { content += ' <span style="' + slowStyle + '">(' + time + 'ms)</span>' ; }
		else { content += ' <span style="' + slowerStyle + '">(' + time + 'ms)</span>' ; }
		
		container.insertAdjacentHTML( 'beforeend' ,
			'<p class="tea-time-classic-reporter" style="' + passingStyle + indentStyle( depth ) + '">' + content + '</p>'
		) ;
		
		scrollDown() ;
	} ) ;
	
	teaTime.on( 'fail' , function( testName , depth , time , slow , error ) {
		
		var content = '✘ ' + testName ;
		
		if ( time !== undefined )
		{
			if ( ! slow ) { content += ' <span style="' + fastStyle + '">(' + time + 'ms)</span>' ; }
			else if ( slow === 1 ) { content += ' <span style="' + slowStyle + '">(' + time + 'ms)</span>' ; }
			else { content += ' <span style="' + slowerStyle + '">(' + time + 'ms)</span>' ; }
		}
		
		container.insertAdjacentHTML( 'beforeend' ,
			'<p class="tea-time-classic-reporter" style="' + failingStyle + indentStyle( depth ) + '">' + content + '</p>'
		) ;
		
		scrollDown() ;
	} ) ;

	teaTime.on( 'skip' , function( testName , depth ) {
		
		var content = '· ' + testName ;
		
		container.insertAdjacentHTML( 'beforeend' ,
			'<p class="tea-time-classic-reporter" style="' + pendingStyle + indentStyle( depth ) + '">' + content + '</p>'
		) ;
		
		scrollDown() ;
	} ) ;

	teaTime.on( 'report' , function( ok , fail , skip ) {
		
		container.insertAdjacentHTML(
			'beforeend' ,
			'<hr />' +
			'<p class="tea-time-classic-reporter" style="font-weight:bold;' + passingStyle + indentStyle( 1 ) + '">' + ok + ' passing</p>' +
			'<p class="tea-time-classic-reporter" style="font-weight:bold;' + failingStyle + indentStyle( 1 ) + '">' + fail + ' failing</p>' +
			'<p class="tea-time-classic-reporter" style="font-weight:bold;' + pendingStyle + indentStyle( 1 ) + '">' + skip + ' pending</p>'
		) ;
		
		scrollDown() ;
	} ) ;
	
	var reportOneError = function reportOneError( error )
	{
		var diff , content = '' ;
		
		if ( error.expected && error.actual )
		{
			content += '<p class="tea-time-classic-reporter" style="' + indentStyle( 1 ) + '">' +
				'<span style="' + expectedStyle + '">expected</span><span style="' + actualStyle + '">actual</span>' +
				'</p>' ;
			
			diff = teaTime.diff( error.actual , error.expected ) ;
			
			diff = diff.replace( /^( *)([^\n]*)$/mg , function( line , indent , content ) {
				return '<p class="tea-time-classic-reporter"; style="' + indentStyle( 1 + indent.length / 2 ) + '">' + content + '</p>' ;
			} ) ;
			
			content += diff ;
		}
		
		content += teaTime.inspect.inspectError( { style: 'html' } , error ).replace( /^[^\n]*$/mg , function( line ) {
			return '<p class="tea-time-classic-reporter"; style="' + indentStyle( 3 ) + '">' + line + '</p>' ;
		} ) ;
		
		return content ;
	} ;
	
	teaTime.on( 'errorReport' , function( errors ) {
		
		var i , error , content = '' ;
		
		content += '<h4 class="tea-time-classic-reporter" style="' + errorStyle + indentStyle( 0 ) + '">== Errors ==</h4>' ;
		
		for ( i = 0 ; i < errors.length ; i ++ )
		{
			error = errors[ i ] ;
			content += '<p class="tea-time-classic-reporter" style="' + errorStyle + indentStyle( 1 ) + '">' + ( i + 1 ) + ' ) ' ;
			
			switch ( error.type )
			{
				case 'test' :
					break ;
				case 'setup' :
					content += '<span style="' + hookErrorStyle + '">SETUP HOOK</span>' ;
					break ;
				case 'teardown' :
					content += '<span style="' + hookErrorStyle + '">TEARDOWN HOOK</span>' ;
					break ;
				case 'suiteSetup' :
					content += '<span style="' + hookErrorStyle + '">SUITE SETUP HOOK</span>' ;
					break ;
				case 'suiteTeardown' :
					content += '<span style="' + hookErrorStyle + '">SUITE TEARDOWN HOOK</span>' ;
					break ;
			}
			
			content += error.name ;
			content += '</p>' ;
			content += reportOneError( error.error ) ;
		}
		
		container.insertAdjacentHTML( 'beforeend' , '<hr />' + content ) ;
		
		scrollDown() ;
	} ) ;
} )() ;

