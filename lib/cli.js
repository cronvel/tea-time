/*
	Tea Time!
	
	Copyright (c) 2015 - 2016 Cédric Ronvel
	
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

"use strict" ;



var termkit = require( 'terminal-kit' ) ;
var term = termkit.terminal ;
var string = require( 'string-kit' ) ;
var tree = require( 'tree-kit' ) ;
var async = require( 'async-kit' ) ;
var minimist = require( 'minimist' ) ;
var glob = require( 'glob' ) ;
var path = require( 'path' ) ;
var querystring = require( 'querystring' ) ;
var fs = require( 'fs' ) ;
var os = require( 'os' ) ;
var ws = require( 'ws' ) ;
var execFileSync = require( 'child_process' ).execFileSync ;
var exec = require( 'child_process' ).exec ;
var teaTimePackage = require( '../package.json' ) ;

var TeaTime = require( './TeaTime.js' ) ;



function cli()
{
	var args , testFiles , affix = '' ;
	
	var options = {
		microTimeout: process.nextTick ,
		
		// Do not use 'bind' here, because async-try-catch replaces those methods
		onceUncaughtException: function( fn ) {
			process.once( 'uncaughtException' , fn ) ;
		} ,
		offUncaughtException: function( fn ) {
			process.removeListener( 'uncaughtException' , fn ) ;
		}
	} ;
	
	// Manage command line arguments
	args = minimist( process.argv.slice( 2 ) ) ;
	
	if ( args.h || args.help )
	{
		cli.usage() ;
		return ;
	}
	
	testFiles = args._.length ? args._ : [] ;
	
	args.browser = typeof args.browser === 'string' ? args.browser : ( typeof args.B === 'string' ? args.B : undefined ) ;
	
	if ( typeof args.bb === 'string' )
	{
		args['tmp-html'] = true ;
		args.ws = true ;
		args.browserify = true ;
		args.browser = args.bb ;
	}
	
	if ( args['tmp-html'] )
	{
		affix =
			Math.floor( Math.random() * 65536 ).toString( 16 ) +
			Math.floor( Math.random() * 65536 ).toString( 16 ) ;
		
		args.html = os.tmpdir() + '/tea-time-' + affix + '.html' ;
		//console.log( "tmp:" , args.html ) ;
	}
	
	if ( args.html )
	{
		cli.generateHtml(
			testFiles ,
			typeof args.html === 'string' ? args.html : null ,
			!! args.browserify ,
			affix
		) ;
		
		if ( typeof args.html === 'string' && args.browser && ! args.ws ) { args.ws = true ; }
		
		if ( ! args.ws ) { return ; }
	}
	
	TeaTime.populateOptionsWithArgs( options , args ) ;
	
	// Expose the Tea Time instance in the module, so it can be accessed within tests
	var teaTime = global.teaTime = TeaTime.create( options ) ;
	
	teaTime.init() ;
	
	cli.createReporters( teaTime, options.reporters ) ;
	cli.loadTestFiles( testFiles ) ;
	
	if ( args.ws )
	{
		cli.createWebSocketServer( teaTime , 7357 ) ; // 7357=test
		
		if ( args.browser && typeof args.html === 'string' )
		{
			TeaTime.populateOptionsWithArgs( options , args ) ;
			cli.openBrowser( teaTime , args.browser , args.html , options ) ;
		}
		
		return ;
	}
	
	teaTime.run( function() {
		async.exit( teaTime.fail ? 1 : 0 , 5000 ) ;
	} ) ;
}

module.exports = cli ;



cli.usage = function usage()
{
	term.bold.magenta( 'Tea Time!' ).dim( ' v%s by Cédric Ronvel\n\n' , teaTimePackage.version ) ;
	
	term.blue( "Usage is: tea-time [<test files>] [<option1>] [<option2>] [...]\n" ) ;
	term.blue( "Available options:\n" ) ;
	term.blue( "  -h , --help             Show this help\n" ) ;
	term.blue( "  -C , --cover            Perform test coverage (beta feature, node.js only)\n" ) ;
	term.blue( "  -t , --timeout <time>   Set the default timeout for each test (default: 2000ms)\n" ) ;
	term.blue( "  -s , --slow <time>      Set the default slow time for each test (default: 75ms)\n" ) ;
	term.blue( "  -g , --grep <pattern>   Grep: filter in tests/suites by this pattern (can be used multiple times)\n" ) ;
	term.blue( "  -c , --console          Allow console.log() and friends\n" ) ;
	term.blue( "  -b , --bail             Bail after the first test failure\n" ) ;
	term.blue( "  -O , --skip-optional    Skip optional tests\n" ) ;
	term.blue( "  -R , --reporter <name>  Set/add the reporter (can be used multiple times)\n" ) ;
	term.blue( " --clientReporter <name>  Set/add the client reporter (see --browser, can be used multiple times)\n" ) ;
	term.blue( "       --html <file>      Build one HTML file for all input test files, to run the test in browsers\n" ) ;
	term.blue( "       --tmp-html         Like --html but create a temporary file in the OS temp folder\n" ) ;
	term.blue( "       --browserify       In conjunction with --html, call Browserify to build a browser version\n" ) ;
	term.blue( "                          for each input files\n" ) ;
	term.blue( "       --ws               Start a websocket server, endpoint to the browser websocket client reporter\n" ) ;
	term.blue( "  -B , --browser <exe>    Open the html with the <exe> browser, need --html <file>,\n" ) ;
	term.blue( "                          force --ws and the websocket client reporter\n" ) ;
	term.blue( "       --bb <exe>         Shorthand for --tmp-html --ws --browserify --browser <exe>\n" ) ;
	term( "\n" ) ;
	
	term.blue( "Reporters: classic, coverage-report, coverage-summary, dot, error-report, notify, one-line, panel, progress, report, tap, verbose.\n" ) ;
	term( "\n" ) ;
	
	term.blue( "Cool coverage command: " ).brightBlack( "tea-time -C | less -r\n" ) ;
	term( "\n" ) ;
	
	term.bold.magenta( "Do not miss:" ).brightYellow( " run browser tests directly from the CLI!\n" ) ;
	term.blue( "So you can script browser tests as well! Example:\n" ) ;
	term.brightBlack( "tea-time test/*js --bb firefox\n" ) ;
	
	term( "\n\n" ) ;
} ;



function copyFile( sourcePath , targetPath )
{
	var content = fs.readFileSync( sourcePath ) ;
	fs.writeFileSync( targetPath , content ) ;
}



function browserify( sourcePath , targetPath )
{
	execFileSync( __dirname + '/../node_modules/.bin/browserify' , [ sourcePath , '--ignore-missing' , '-o' , targetPath ] ) ;
}



cli.generateHtml = function generateHtml( testFiles , outputPath , runBrowserify , affix )
{
	var outputDir , testFileName ;
	
	if ( ! Array.isArray( testFiles ) || ! testFiles.length ) { testFiles = cli.testFilesFromPackage() ; }
	else { testFiles = cli.expandTestFiles( testFiles ) ; }
	
	if ( outputPath )
	{
		//outputPath = fs.realpathSync( outputPath ) ;
		outputDir = path.dirname( outputPath ) ;
		
		try {
			fs.mkdirSync( outputDir + '/.tea-time' , 0o777 ) ;	// jshint ignore:line
		}
		catch ( error ) {
			// The dir already exists, do nothing...
		}
		
		copyFile(  __dirname + '/../browser/reporters.css' , outputDir + '/.tea-time/reporters.css' ) ;
		copyFile(  __dirname + '/../browser/tea-time.min.js' , outputDir + '/.tea-time/tea-time.min.js' ) ;
	}
	
	var content =
		'<!DOCTYPE HTML>\n' +
		'<html style="background-color:black">\n' +
		'<head>\n' +
		'	<meta charset="utf8" />\n' +
		'	<link rel="stylesheet" href="' + 
				( outputPath ? '.tea-time/reporters.css' : fs.realpathSync( __dirname + '/../browser/reporters.css' ) ) +
					'" />\n' +
		'</head>\n' +
		'<body>\n' +
		'	<script src="' +
				( outputPath ? '.tea-time/tea-time.min.js' : fs.realpathSync( __dirname + '/../browser/tea-time.js' ) ) +
					'"></script>\n' ;
	
	testFiles.forEach( function( testFile ) {
		if ( outputPath )
		{
			if ( runBrowserify )
			{
				testFileName = path.basename( testFile ) ;
				
				if ( affix ) { testFileName = testFileName.replace( /^(.*?)(\.js)?$/ , '$1-' + affix + '$2' ) ; }
				
				browserify( testFile , outputDir + '/.tea-time/' + testFileName ) ;
				content += '	<script src=".tea-time/' + testFileName + '"></script>\n' ;
			}
			else
			{
				content += '	<script src="' + path.relative( outputDir , testFile ) + '"></script>\n' ;
			}
		}
		else
		{
			content += '	<script src="' + testFile + '"></script>\n' ;
		}
	} ) ;
	
	content += 
		'</body>\n' +
		'</html>\n' ;
	
	if ( outputPath )
	{
		fs.writeFileSync( outputPath , content ) ;
	}
	else
	{
		console.log( content ) ;
	}
} ;



cli.loadTestFiles = function loadTestFiles( testFiles )
{
	var i , iMax ;
	
	if ( ! Array.isArray( testFiles ) || ! testFiles.length ) { testFiles = cli.testFilesFromPackage() ; }
	else { testFiles = cli.expandTestFiles( testFiles ) ; }
	
	// Load all test files
	try {
		for ( i = 0 , iMax = testFiles.length ; i < iMax ; i ++ )
		{
			require( testFiles[ i ] ) ;
		}
	}
	catch ( error ) {
		cli.exitError( "Error in the test file '" + testFiles[ i ] + "':\n%E\n" , error ) ;
	}
} ;



// Expand using glob on all command line file arguments
cli.expandTestFiles = function expandTestFiles( testFiles_ )
{
	var i , iMax , testFiles = [] ;
	
	for ( i = 0 , iMax = testFiles_.length ; i < iMax ; i ++ )
	{
		testFiles = testFiles.concat( glob.sync( process.cwd() + '/' + testFiles_[ i ] ) ) ;
	}
	
	return testFiles ;
} ;



// Get files using package.json
cli.testFilesFromPackage = function testFilesFromPackage()
{
	var package_ ;
	
	// Require the package.json (mandatory)
	try {
		package_ = require( process.cwd() + '/package.json' ) ;
	}
	catch ( error ) {
		if ( error.code === 'MODULE_NOT_FOUND' ) { cli.exitError( "No package.json found.\n" ) ; }
		else { cli.exitError( "Error in the package.json: %E\n" , error ) ; }
	}
	
	// Get the bench directory
	if ( ! package_.directories || ! package_.directories.test )
	{
		cli.exitError( "The package.json miss a directories.test path, set to the directory containing test files.\n" ) ;
	}
	
	return glob.sync( process.cwd() + '/' + package_.directories.test + '/*js' ) ;
} ;



cli.createReporters = function createReporters( teaTime , reporters )
{
	var i , iMax , reporter ;
	
	for ( i = 0 , iMax = reporters.length ; i < iMax ; i ++ )
	{
		reporter = reporters[ i ] ;
		
		try {
			if ( reporter.indexOf( '/' ) === -1 && reporter.indexOf( '.' ) === -1 )
			{
				// No slash and no dot: this is a built-in reporter
				reporter = './reporters/' + reporter + '.js' ;
			}
			else if ( ! path.isAbsolute( reporter ) )
			{
				reporter = process.cwd() + '/' + reporter ;
			}
			
			require( reporter )( teaTime ) ;
		}
		catch ( error ) {
			// Continue on error, simply skip this reporter
			console.error( "Error loading this reporter:" , reporter , error ) ;
		}
	}
} ;



cli.exitError = function exitError()
{
	var message = string.format.apply( null , arguments ) ;
	
	term.bold.red( message ) ;
	
	process.exit( 1 ) ;
} ;



cli.createWebSocketServer = function createWebSocketServer( teaTime , port )
{
	var server = new ws.Server( { port: port } ) ;
	
	server.on( 'connection' , function connection( websocket ) {
		
		//console.log( 'client connected:' , string.inspect( { depth: 4 , style: 'color' } , websocket ) ) ;
		var ok = 0 , fail = 0 , skip = 0 ;
		var token = websocket.upgradeReq.url.slice( 1 ) ;
		
		//console.log( 'Client connected:' , token ) ;
		
		if ( teaTime.acceptTokens )
		{
			if ( ! teaTime.acceptTokens[ token ] )
			{
				//console.log( 'Client rejected: token not authorized' ) ;
				websocket.close() ;
				return ;
			}
			
			delete teaTime.acceptTokens[ token ] ;
		}
		
		websocket.on( 'message' , function incoming( message ) {
			
			//console.log('received: %s', message ) ;
			
			try {
				message = JSON.parse( message ) ;
				cli.restorePrototype( message.args ) ;
			}
			catch ( error ) {
				console.error( 'Parse error (client data): ' + error ) ;
				return ;
			}
			
			
			//console.log( [ message.event ].concat( message.args ) ) ;
			
			if ( message.event === 'exit' )
			{
				//console.log( 'exit event!!!' ) ;
				teaTime.emit( 'exit' , function() {
					//console.log( 'wsClientExit event!!!' ) ;
					teaTime.emit( 'wsClientExit' , ok , fail , skip ) ;
				} ) ;
			}
			if ( message.event === 'report' )
			{
				// Catch ok/fail/skip values
				ok = message.args[ 0 ] ;
				fail = message.args[ 1 ] ;
				skip = message.args[ 2 ] ;
				teaTime.emit.apply( teaTime , [ message.event ].concat( message.args ) ) ;
			}
			else
			{
				teaTime.emit.apply( teaTime , [ message.event ].concat( message.args ) ) ;
			}
		} ) ;
	} ) ;
} ;



cli.openBrowser = function openBrowser( teaTime , exePath , htmlPath , options )
{
	var token , qs , url , execOptions = {} ;
	
	token = path.basename( exePath.split( ' ' )[ 0 ] ) + Math.floor( Math.random() * 1000000 ) ;
	
	if ( ! teaTime.acceptTokens ) { teaTime.acceptTokens = {} ; }
	
	teaTime.acceptTokens[ token ] = true ;
	
	if ( options.clientReporters.indexOf( 'websocket' ) === -1 )
	{
		// Force the websocket reporter for the client, it is this reporter that connect back to the CLI
		options.clientReporters.push( 'websocket' ) ;
	}
	
	qs = tree.extend( {} , {} , options , {
		reporter: options.clientReporters ,
		grep: options.sourceGrep ,
		token: token
	} ) ;
	
	delete qs.microTimeout ;
	delete qs.onceUncaughtException ;
	delete qs.offUncaughtException ;
	delete qs.reporters ;
	delete qs.clientReporters ;
	delete qs.sourceGrep ;
	
	qs = '?' + querystring.stringify( qs ) ;
	url = 'file://' + htmlPath + qs ;
	
	exec( exePath + ' ' + string.escape.shellArg( url ) , execOptions , function( error , stdout , stderr ) {
		
		if ( error )
		{
			console.error( "Browser ERROR:" , error ) ;
			process.exit( 1 ) ;
		}
		//console.log( "Browser STDOUT:" , stdout ) ;
		//console.log( "Browser STDERR:" , stderr ) ;
	} ) ;
	
	teaTime.on( 'wsClientExit' , function( ok , fail , skip ) {
		process.exit( fail ? 1 : 0 ) ;
	} ) ;
} ;



cli.restorePrototype = function restorePrototype( object )
{
	var i , iMax , keys ;
	
	if ( ! object || typeof object !== 'object' ) { return ; }
	
	
	if ( Array.isArray( object ) )
	{
		for ( i = 0 , iMax = object.length ; i < iMax ; i ++ )
		{
			cli.restorePrototype( object[ i ] ) ;
		}
		
		return ;
	}
	
	if ( object.__prototype )
	{
		// Hacky, but well... 
		// Data are transmited using JSON, so we lost the actual prototype
		// in the serialization/unserialization process.
		object.__proto__ = global[ object.__prototype ].prototype ;	// jshint ignore:line
	}
	
	keys = Object.keys( object ) ;
	
	for ( i = 0 , iMax = keys.length ; i < iMax ; i ++ )
	{
		cli.restorePrototype( object[ keys[ i ] ] ) ;
	}
} ;


