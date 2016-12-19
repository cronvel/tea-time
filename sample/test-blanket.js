

var blanket = require( 'blanket' )( {
	/* options are passed as an argument object to the require statement */
	"pattern": [ "/lib/" , "/sample/" ],
	"debug": true ,
} ) ;

var string = require( 'string-kit' ) ;

blanket.options( "reporter" , function() {
	console.log( "Mega bob!" , arguments ) ;
} ) ;

var stuff = require( "./stuff.js" ) ;

//var TeaTime = require( '../lib/TeaTime.js' ) ;
//var teaTime = TeaTime.instance ;

// ----------------------------------------- HERE ---------------------------------

teaTime.on('start', function() {
	blanket.setupCoverage();
});

teaTime.on('end', function() {
	blanket.onTestsDone();
});

// Dunno what's the purpose of that...
teaTime.on('enterSuite', function() {
	blanket.onModuleStart();
});

teaTime.on('enterTest', function() {
	blanket.onTestStart();
});

//*
teaTime.on('exitTest', function(testName,depth,time,slow,error) {
	blanket.onTestDone(true, !error);
});
//*/

/*
teaTime.on('ok', function(test) {
	blanket.onTestDone(1, 1);
});

teaTime.on('fail', function(test) {
	blanket.onTestDone(0, 1);
});

teaTime.on('optionalFail', function(test) {
	blanket.onTestDone(1, 0);
});

teaTime.on('skip', function(test) {
	blanket.onTestDone(1, 1);
});
//*/

/*
teaTime.on('hook', function(){
	blanket.onTestStart();
});

teaTime.on('hook end', function(){
	blanket.onTestsDone();
});
*/





describe( "Tests" , function() {
	
	it( "true" , function() {
		stuff( true ) ;
		stuff( true ) ;
		stuff( true ) ;
		stuff( true ) ;
		//stuff( false ) ;
	} ) ;
} ) ;

