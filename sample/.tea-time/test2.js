(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){



describe( "2nd file" , function() {
	
	it( "Sync Exception" , function() {
		throw new Error( "Failed!" ) ;
	} ) ;
	
	function one() { return two() ; }
	function two() { return three() ; }
	function three() { throw new Error( "Traced fail!" ) ; ; }
	
	it( "Sync Exception" , function() {
		one() ;
	} ) ;
	
	it( "Sync Ok" , function() {
	} ) ;
	
	it( "Simple expected/actual" , function() {
		var error = new Error( "Expected some value to be some other" ) ;
		
		error.expected = {
			a: 1 ,
			b: 2 ,
			c: 3 ,
			x: 'four'
		} ;
		
		error.actual = {
			a: 1 ,
			b: 'two' ,
			c: 3 ,
			x: 'five'
		} ;
		
		throw error ;
	} ) ;
	
	it( "Bad order in expected/actual" , function() {
		var error = new Error( "Expected some value to be some other" ) ;
		
		error.expected = {
			a: 1 ,
			b: 2 ,
			x: 'four' ,
			c: 3 ,
		} ;
		
		error.actual = {
			c: 3 ,
			a: 1 ,
			x: 'five' ,
			b: 2 ,
		} ;
		
		throw error ;
	} ) ;
	
	it( "Complex expected/actual" , function() {
		var error = new Error( "Expected some value to be some other" ) ;
		
		error.expected = {
			a: 1 ,
			b: 2 ,
			x: {
				f: 'formidable'
			} ,
			c: 3
		} ;
		
		error.actual = {
			a: 1 ,
			b: 'two' ,
			y: {
				g: 'Gee'
			} ,
			c: 3
		} ;
		
		throw error ;
	} ) ;
} ) ;

},{}]},{},[1]);
