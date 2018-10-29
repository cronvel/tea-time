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

/* global Vanilla */

"use strict" ;



// Not needed here, except that it should load before anything else,
// so nothing can get a timer function without it being patched
const asyncTryCatch = require( 'async-try-catch' ) ;
asyncTryCatch.substitute() ;

const termkit = require( 'terminal-kit' ) ;
const term = termkit.terminal ;
const string = require( 'string-kit' ) ;
const tree = require( 'tree-kit' ) ;
const Promise = require( 'seventh' ) ;

const cliManager = require( 'utterminal' ).cli ;

const glob = require( 'glob' ) ;
const path = require( 'path' ) ;
const querystring = require( 'querystring' ) ;
const fs = require( 'fs' ) ;
const os = require( 'os' ) ;
const ws = require( 'ws' ) ;

const execFileSync = require( 'child_process' ).execFileSync ;
const exec = require( 'child_process' ).exec ;

const teaTimePackage = require( '../package.json' ) ;

const TeaTime = require( './TeaTime.js' ) ;



function cli() {
	/* eslint-disable indent */
	cliManager.package( teaTimePackage )
		.usage( "[<test files>] [<option1>] [<option2>] [...]" )
		.app( "Tea Time!" )
		.noIntro	// that's the reporter job
		.helpOption.logOptions
		.camel
		.description( "A wonderful unit-test framework with battery included!\nIt includes code coverage, BDD-style assertions and more!" )
		.restArgs( 'testFiles' ).arrayOf.string
			.description( "The test files" )
		.opt( [ 'cover' , 'C' ] ).flag
			.description( "Report test's code coverage (node.js only)" )
		.opt( [ 'timeout' , 't' ] , 2000 ).number
			.description( "Set the default timeout for each test in ms" )
		.opt( [ 'slow' , 's' ] , 75 ).number
			.description( "Set the default slow time for each test in ms" )
		.opt( [ 'grep' , 'g' ] ).arrayOf.string
			.description( "Grep: filter in tests/suites by this pattern (can be used multiple times)" )
		.opt( [ 'igrep' , 'G' ] ).arrayOf.string
			.description( "Inverse grep: filter out tests/suites by this pattern (can be used multiple times)" )
		.opt( [ 'bail' , 'b' ] ).flag
			.description( "Bail out after the first test failure" )
		.opt( [ 'skip-optional' , 'O' ] ).flag
			.description( "Skip optional tests" )
		.opt( [ 'reporter' , 'R' ] ).arrayOf.string
			.description( "Set/add the reporter (can be used multiple times)" )
		.opt( 'client-reporter' ).arrayOf.string
			.description( "Set/add the client reporter (see --browser, can be used multiple times)" )
		.opt( [ 'console' , 'c' ] ).flag
			.description( "Allow console.log() and friends output" )
		.opt( [ 'hunt-console' , 'H' ] ).flag
			.description( "Hunt console.log() and friends: they throw an error" )
		.opt( 'list-reporters' ).flag
			.description( "List all available reporters" )
			.exec( () => {
				cli.listReporters() ;
				process.exit() ;
			} )
		.opt( [ 'stack-trace' , 'S' ] ).number
			.description( "Set stack-trace size for Error" )
		.opt( [ 'debugger' , 'D' ] ).boolean
			.description( "Turn Node debugger/inspect-mode on" )
		.opt( 'html' )
			.description( "Build one HTML file for all input test files, to run the test in browsers" )
		.opt( 'tmp-html' ).flag
			.description( "Like --html but create a temporary file in the OS temp folder" )
		.opt( 'browserify' ).flag
			.description( "In conjunction with --html, call Browserify to build a browser version for each input files" )
		.opt( 'ws' ).flag
			.description( "Start a websocket server, endpoint to the browser websocket client reporter" )
		.opt( [ 'browser' , 'B' ] ).string
			.description( "Open the html with the <exe> browser, need --html <file>, force --ws and the websocket client reporter" )
		.opt( 'token' ).string
			.description( "The token required for server connection" )
		.opt( 'bb' ).string
			.imply( {
				'tmp-html': true , ws: true , browserify: true , browser: cliManager.ARG
			} )
			.remove
			.description( "Shorthand" )
		.details(
			"Reporters: " + cli.getReportersString() + "\n\n" +
			"Cool coverage command: tea-time -C | less -r\n\n" +
			"Do not miss: run browser tests directly from the CLI! So you can script browser tests as well!\n" +
			"Example:\n" +
			"tea-time test/*js --bb firefox\n\n"
		) ;
	/* eslint-enable indent */

	var args = cliManager.run() ;

	var affix = '' ;

	var options = {
		cliManager ,
		// Do not use 'bind' here, because async-try-catch replaces those methods
		onceUncaughtException: fn => process.once( 'uncaughtException' , fn ) ,
		offUncaughtException: fn => process.removeListener( 'uncaughtException' , fn )
	} ;

	if ( args.tmpHtml ) {
		affix =
			Math.floor( Math.random() * 65536 ).toString( 16 ) +
			Math.floor( Math.random() * 65536 ).toString( 16 ) ;

		args.html = os.tmpdir() + '/tea-time-' + affix + '.html' ;
		//console.log( "tmp:" , args.html ) ;
	}

	if ( args.html ) {
		cli.generateHtml(
			args.testFiles ,
			typeof args.html === 'string' ? args.html : null ,
			!! args.browserify ,
			affix
		) ;

		if ( typeof args.html === 'string' && args.browser && ! args.ws ) { args.ws = true ; }

		if ( ! args.ws ) { return ; }
	}

	TeaTime.populateOptionsWithArgs( options , args ) ;

	// Expose the Tea Time instance in the module, so it can be accessed within tests
	var teaTime = global.teaTime = new TeaTime( options ) ;

	teaTime.init() ;

	cli.createReporters( teaTime , options.reporters ) ;
	cli.loadTestFiles( args.testFiles ) ;

	if ( args.ws ) {
		cli.createWebSocketServer( teaTime , 7357 ) ; // 7357=test

		if ( args.browser && typeof args.html === 'string' ) {
			TeaTime.populateOptionsWithArgs( options , args ) ;
			cli.openBrowser( teaTime , args.browser , args.html , options ) ;
		}

		return ;
	}

	if ( args.stackTrace ) {
		Error.stackTraceLimit = args.stackTrace ;
	}

	if ( args.debugger ) {
		// This allow Node to turn to the inspector from within
		process._debugProcess( process.pid ) ;
		term.brightYellow( "Open Chromium, type “about:inspect” in the bar, then click “Open dedicated DevTools for Node”" )( '\n' ) ;

		// Give some time for the dev-tools to load
		setTimeout( () => {

			teaTime.run().then( () => {
				Promise.asyncExit( teaTime.fail ? 1 : 0 , 5000 ) ;
			} ) ;
		} , 500 ) ;

		return ;
	}

	teaTime.run().then( () => {
		Promise.asyncExit( teaTime.fail ? 1 : 0 , 5000 ) ;
	} ) ;
}

module.exports = cli ;



cli.listReporters = function listReporters() {
	term( "%s\n" , cli.getReportersString( true , '\n' ) ) ;
} ;



cli.getReporterList = function getReporterList( withAliases ) {
	var reporters = fs.readdirSync( path.join( __dirname , 'reporters' ) ).map( filepath => filepath.slice( 0 , -3 ) ) ;
	if ( withAliases ) { reporters.push( ... Object.keys( TeaTime.reporterAliases ) ) ; }
	return reporters ;
} ;



cli.getReportersString = function getReportersString( withAliases = true , glue = ', ' ) {
	var reportersObject = {} ;

	cli.getReporterList( false ).forEach( reporter => reportersObject[ reporter ] = [ reporter ] ) ;
	Object.keys( TeaTime.reporterAliases ).forEach( alias => reportersObject[ TeaTime.reporterAliases[ alias ] ].push( alias ) ) ;

	return Object.keys( reportersObject ).map( reporter => {
		var str = reportersObject[ reporter ][ 0 ] ;
		if ( reportersObject[ reporter ].length > 1 ) {
			str += ' (' + reportersObject[ reporter ].slice( 1 ).join( ', ' ) + ')' ;
		}
		return str ;
	} )
		.join( glue ) ;
} ;



function copyFile( sourcePath , targetPath ) {
	var content = fs.readFileSync( sourcePath ) ;
	fs.writeFileSync( targetPath , content ) ;
}



function browserify( sourcePath , targetPath ) {
	execFileSync( __dirname + '/../node_modules/.bin/browserify' , [ sourcePath , '--ignore-missing' , '-o' , targetPath ] ) ;
}



cli.generateHtml = function generateHtml( testFiles , outputPath , runBrowserify , affix ) {
	var outputDir , testFileName ;

	var teaTimeJs = 'tea-time.min.js' ;
	//var teaTimeJs = 'tea-time.js' ;

	if ( ! Array.isArray( testFiles ) || ! testFiles.length ) { testFiles = cli.testFilesFromPackage() ; }
	else { testFiles = cli.expandTestFiles( testFiles ) ; }

	if ( outputPath ) {
		//outputPath = fs.realpathSync( outputPath ) ;
		outputDir = path.dirname( outputPath ) ;

		try {
			fs.mkdirSync( outputDir + '/.tea-time' , 0o777 ) ;	// jshint ignore:line
		}
		catch ( error ) {
			// The dir already exists, do nothing...
		}

		copyFile(  __dirname + '/../browser/reporters.css' , outputDir + '/.tea-time/reporters.css' ) ;
		copyFile(  __dirname + '/../browser/' + teaTimeJs , outputDir + '/.tea-time/' + teaTimeJs ) ;
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
				( outputPath ? '.tea-time/' + teaTimeJs : fs.realpathSync( __dirname + '/../browser/' + teaTimeJs ) ) +
					'"></script>\n' ;

	testFiles.forEach( ( testFile ) => {
		if ( outputPath ) {
			if ( runBrowserify ) {
				testFileName = path.basename( testFile ) ;

				if ( affix ) { testFileName = testFileName.replace( /^(.*?)(\.js)?$/ , '$1-' + affix + '$2' ) ; }

				browserify( testFile , outputDir + '/.tea-time/' + testFileName ) ;
				content += '	<script src=".tea-time/' + testFileName + '"></script>\n' ;
			}
			else {
				content += '	<script src="' + path.relative( outputDir , testFile ) + '"></script>\n' ;
			}
		}
		else {
			content += '	<script src="' + testFile + '"></script>\n' ;
		}
	} ) ;

	content +=
		'</body>\n' +
		'</html>\n' ;

	if ( outputPath ) {
		fs.writeFileSync( outputPath , content ) ;
	}
	else {
		console.log( content ) ;
	}
} ;



cli.loadTestFiles = function loadTestFiles( testFiles ) {
	var i , iMax ;

	if ( ! Array.isArray( testFiles ) || ! testFiles.length ) { testFiles = cli.testFilesFromPackage() ; }
	else { testFiles = cli.expandTestFiles( testFiles ) ; }

	// Load all test files
	try {
		for ( i = 0 , iMax = testFiles.length ; i < iMax ; i ++ ) {
			require( testFiles[ i ] ) ;
		}
	}
	catch ( error ) {
		cli.exitError( "Error in the test file '" + testFiles[ i ] + "':\n%E\n" , error ) ;
	}
} ;



// Expand using glob on all command line file arguments
cli.expandTestFiles = function expandTestFiles( testFiles_ ) {
	var i , iMax , testFiles = [] ;

	for ( i = 0 , iMax = testFiles_.length ; i < iMax ; i ++ ) {
		testFiles = testFiles.concat( glob.sync( process.cwd() + '/' + testFiles_[ i ] ) ) ;
	}

	return testFiles ;
} ;



// Get files using package.json
cli.testFilesFromPackage = function testFilesFromPackage() {
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
	if ( ! package_.directories || ! package_.directories.test ) {
		cli.exitError( "The package.json miss a directories.test path, set to the directory containing test files.\n" ) ;
	}

	return glob.sync( process.cwd() + '/' + package_.directories.test + '/*js' ) ;
} ;



cli.createReporters = function createReporters( teaTime , reporters ) {
	var i , iMax , reporter ;

	for ( i = 0 , iMax = reporters.length ; i < iMax ; i ++ ) {
		reporter = reporters[ i ] ;

		try {
			if ( reporter.indexOf( '/' ) === -1 && reporter.indexOf( '.' ) === -1 ) {
				// No slash and no dot: this is a built-in reporter
				reporter = './reporters/' + reporter + '.js' ;
			}
			else if ( ! path.isAbsolute( reporter ) ) {
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



cli.exitError = function exitError( ... args ) {
	var message = string.format( ... args ) ;
	term.bold.red( message ) ;
	process.exit( 1 ) ;
} ;



cli.createWebSocketServer = function createWebSocketServer( teaTime , port ) {
	var server = new ws.Server( { port: port } ) ;

	server.on( 'connection' , ( websocket , upgradeReq ) => {

		//console.log( 'client connected:' , string.inspect( { depth: 4 , style: 'color' } , websocket ) ) ;
		var ok = 0 , fail = 0 , skip = 0 ;
		var token = upgradeReq.url.slice( 1 ) ;

		//console.log( 'Client connected:' , token ) ;

		if ( teaTime.acceptTokens ) {
			if ( ! teaTime.acceptTokens[ token ] ) {
				//console.log( 'Client rejected: token not authorized' ) ;
				websocket.close() ;
				return ;
			}

			delete teaTime.acceptTokens[ token ] ;
		}

		websocket.on( 'message' , ( message ) => {

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

			if ( message.event === 'exit' ) {
				//console.log( 'exit event!!!' ) ;
				teaTime.emit( 'exit' , () => {
					//console.log( 'wsClientExit event!!!' ) ;
					teaTime.emit( 'wsClientExit' , ok , fail , skip ) ;
				} ) ;
			}
			if ( message.event === 'report' ) {
				// Catch ok/fail/skip values
				ok = message.args[ 0 ] ;
				fail = message.args[ 1 ] ;
				skip = message.args[ 2 ] ;
				teaTime.emit( ... [ message.event ].concat( message.args ) ) ;
			}
			else {
				teaTime.emit( ... [ message.event ].concat( message.args ) ) ;
			}
		} ) ;
	} ) ;
} ;



cli.openBrowser = function openBrowser( teaTime , exePath , htmlPath , options ) {
	var token , qs , url , execOptions = {} ;

	token = path.basename( exePath.split( ' ' )[ 0 ] ) + Math.floor( Math.random() * 1000000 ) ;

	if ( ! teaTime.acceptTokens ) { teaTime.acceptTokens = {} ; }

	teaTime.acceptTokens[ token ] = true ;

	if ( options.clientReporters.indexOf( 'websocket' ) === -1 ) {
		// Force the websocket reporter for the client, it is this reporter that connect back to the CLI
		options.clientReporters.push( 'websocket' ) ;
	}

	qs = tree.extend( {} , {} , options , {
		reporter: options.clientReporters ,
		grep: options.sourceGrep ,
		igrep: options.sourceIGrep ,
		token: token
	} ) ;

	delete qs.onceUncaughtException ;
	delete qs.offUncaughtException ;
	delete qs.reporters ;
	delete qs.clientReporters ;
	delete qs.sourceGrep ;
	delete qs.sourceIGrep ;

	qs = '?' + querystring.stringify( qs ) ;
	url = 'file://' + htmlPath + qs ;

	exec( exePath + ' ' + string.escape.shellArg( url ) , execOptions , ( error , stdout , stderr ) => {

		if ( error ) {
			console.error( "Browser ERROR:" , error ) ;
			process.exit( 1 ) ;
		}
		//console.log( "Browser STDOUT:" , stdout ) ;
		//console.log( "Browser STDERR:" , stderr ) ;
	} ) ;

	teaTime.on( 'wsClientExit' , ( ok , fail , skip ) => {
		process.exit( fail ? 1 : 0 ) ;
	} ) ;
} ;



cli.restorePrototype = function restorePrototype( object ) {
	var i , iMax , keys ;

	if ( ! object || typeof object !== 'object' ) { return ; }


	if ( Array.isArray( object ) ) {
		for ( i = 0 , iMax = object.length ; i < iMax ; i ++ ) {
			cli.restorePrototype( object[ i ] ) ;
		}

		return ;
	}

	if ( object.__prototype ) {
		// Hacky, but well...
		// Data are transmited using JSON, so we lost the actual prototype
		// in the serialization/unserialization process.
		object.__proto__ = global[ object.__prototype ].prototype ;
	}

	keys = Object.keys( object ) ;

	for ( i = 0 , iMax = keys.length ; i < iMax ; i ++ ) {
		cli.restorePrototype( object[ keys[ i ] ] ) ;
	}
} ;


