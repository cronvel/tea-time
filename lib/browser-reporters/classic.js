/*
	Tea Time!

	Copyright (c) 2015 - 2019 Cédric Ronvel

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

/* global document */



//const Report = require( './report.js' ) ;
//const ErrorReport = require( './error-report.js' ) ;


function Reporter( teaTime , self ) {
	if ( ! self ) {
		self = Object.create( Reporter.prototype , {
			teaTime: { value: teaTime , enumerable: true }
		} ) ;
	}

	document.querySelector( 'body' )
		.insertAdjacentHTML( 'beforeend' ,
			'<div class="tea-time-classic-reporter" style="background-color:black;color:white"></div>'
		) ;

	self.container = document.querySelector( 'div.tea-time-classic-reporter' ) ;

	self.teaTime.on( 'enterSuite' , Reporter.enterSuite.bind( self ) ) ;
	self.teaTime.on( 'ok' , Reporter.ok.bind( self ) ) ;
	self.teaTime.on( 'fail' , Reporter.fail.bind( self ) ) ;
	self.teaTime.on( 'optionalFail' , Reporter.optionalFail.bind( self ) ) ;
	self.teaTime.on( 'skip' , Reporter.skip.bind( self ) ) ;
	self.teaTime.on( 'report' , Reporter.report.bind( self ) ) ;
	self.teaTime.on( 'errorReport' , Reporter.errorReport.bind( self ) ) ;

	return self ;
}

module.exports = Reporter ;



function scrollDown() {
	( document.querySelector( 'div.tea-time-classic-reporter p:last-child' ) ||
		document.querySelector( 'div.tea-time-classic-reporter h4:last-child' ) ||
		document.querySelector( 'div.tea-time-classic-reporter pre:last-child' ) )
		.scrollIntoView() ;
}



function indentStyle( depth ) {
	return 'margin-left:' + ( 1 + 2 * depth ) + '%;' ;
}



const durationStyle = "color:grey;" ;
const passingStyle = "color:green;" ;
const failingStyle = "color:red;" ;
const optionalFailingStyle = "color:brown;" ;
const pendingStyle = "color:blue;" ;
const coverageStyle = "color:magenta;" ;

const fastStyle = "color:grey;" ;
const slowStyle = "color:yellow;" ;
const slowerStyle = "color:red;" ;

const optionalErrorStyle = "color:brown;font-weight:bold;" ;
const errorStyle = "color:red;font-weight:bold;" ;
const hookErrorStyle = "background-color:red;color:white;font-weight:bold;" ;

const expectedStyle = "background-color:green;color:white;font-weight:bold;" ;
const actualStyle = "background-color:red;color:white;font-weight:bold;" ;




Reporter.enterSuite = function enterSuite( data ) {
	this.container.insertAdjacentHTML( 'beforeend' ,
		'<h4 class="tea-time-classic-reporter" style="' + indentStyle( data.depth ) + '">' + data.title + '</h4>'
	) ;

	scrollDown() ;
} ;



Reporter.ok = function ok( data ) {
	var content = '✔ ' + data.title ;

	if ( ! data.slow ) { content += ' <span style="' + fastStyle + '">(' + data.duration + 'ms)</span>' ; }
	else if ( data.slow === 1 ) { content += ' <span style="' + slowStyle + '">(' + data.duration + 'ms)</span>' ; }
	else { content += ' <span style="' + slowerStyle + '">(' + data.duration + 'ms)</span>' ; }

	this.container.insertAdjacentHTML( 'beforeend' ,
		'<p class="tea-time-classic-reporter" style="' + passingStyle + indentStyle( data.depth ) + '">' + content + '</p>'
	) ;

	scrollDown() ;
} ;



Reporter.fail = function fail( data ) {
	var content = '✘ ' + data.title ;

	if ( data.duration !== undefined ) {
		if ( ! data.slow ) { content += ' <span style="' + fastStyle + '">(' + data.duration + 'ms)</span>' ; }
		else if ( data.slow === 1 ) { content += ' <span style="' + slowStyle + '">(' + data.duration + 'ms)</span>' ; }
		else { content += ' <span style="' + slowerStyle + '">(' + data.duration + 'ms)</span>' ; }
	}

	this.container.insertAdjacentHTML( 'beforeend' ,
		'<p class="tea-time-classic-reporter" style="' + failingStyle + indentStyle( data.depth ) + '">' + content + '</p>'
	) ;

	scrollDown() ;
} ;



Reporter.optionalFail = function optionalFail( data ) {
	var content = '✘ ' + data.title ;

	if ( data.duration !== undefined ) {
		if ( ! data.slow ) { content += ' <span style="' + fastStyle + '">(' + data.duration + 'ms)</span>' ; }
		else if ( data.slow === 1 ) { content += ' <span style="' + slowStyle + '">(' + data.duration + 'ms)</span>' ; }
		else { content += ' <span style="' + slowerStyle + '">(' + data.duration + 'ms)</span>' ; }
	}

	this.container.insertAdjacentHTML( 'beforeend' ,
		'<p class="tea-time-classic-reporter" style="' + optionalFailingStyle + indentStyle( data.depth ) + '">' + content + '</p>'
	) ;

	scrollDown() ;
} ;



Reporter.skip = function skip( data ) {
	var content = '· ' + data.title ;

	this.container.insertAdjacentHTML( 'beforeend' ,
		'<p class="tea-time-classic-reporter" style="' + pendingStyle + indentStyle( data.depth ) + '">' + content + '</p>'
	) ;

	scrollDown() ;
} ;



Reporter.report = function report( data ) {
	this.container.insertAdjacentHTML(
		'beforeend' ,
		'<hr />' +
		'<p class="tea-time-classic-reporter" style="font-weight:bold;' + passingStyle + indentStyle( 1 ) + '">' + data.ok +
		( data.assertionOk ? '|' + data.assertionOk : '' ) + ' passing ' +
		( data.duration < 2000 ?
			'<span style="' + durationStyle + '">(' + Math.floor( data.duration ) + 'ms)</span>' :
			'<span style="' + durationStyle + '">(' + Math.floor( data.duration / 1000 ) + '.' + Math.floor( data.duration % 1000 ) + 's)</span>'
		) +
		'</p>' +
		'<p class="tea-time-classic-reporter" style="font-weight:bold;' + failingStyle + indentStyle( 1 ) + '">' + data.fail +
		( data.assertionFail ? '|' + data.assertionFail : '' ) + ' failing</p>' +
		( data.optionalFail ? '<p class="tea-time-classic-reporter" style="font-weight:bold;' + optionalFailingStyle + indentStyle( 1 ) + '">' + data.optionalFail + ' opt failing</p>' : '' ) +
		( data.skip ? '<p class="tea-time-classic-reporter" style="font-weight:bold;' + pendingStyle + indentStyle( 1 ) + '">' + data.skip + ' pending</p>' : '' ) +
		( data.coverageRate !== undefined ? '<p class="tea-time-classic-reporter" style="font-weight:bold;' + data.coverageStyle + indentStyle( 1 ) + '">' + Math.round( data.coverageRate * 100 ) + '% coverage</p>' : '' )
	) ;

	scrollDown() ;
} ;



Reporter.errorReport = function errorReport( errors ) {
	var i , error , content = '' ;

	content += '<h4 class="tea-time-classic-reporter" style="' + errorStyle + indentStyle( 0 ) + '">== Errors ==</h4>' ;

	for ( i = 0 ; i < errors.length ; i ++ ) {
		error = errors[ i ] ;
		content += '<p class="tea-time-classic-reporter" style="' +
			( error.optional ? optionalErrorStyle : errorStyle ) +
			indentStyle( 1 ) + '">' + ( i + 1 ) + ' ) ' ;

		switch ( error.type ) {
			case 'test' :
				if ( error.error.testTimeout ) { content += '<span style="' + hookErrorStyle + '">TEST TIMEOUT</span> ' ; }
				break ;
			case 'setup' :
				content += '<span style="' + hookErrorStyle + '">SETUP HOOK</span> ' ;
				break ;
			case 'teardown' :
				content += '<span style="' + hookErrorStyle + '">TEARDOWN HOOK</span> ' ;
				break ;
			case 'suiteSetup' :
				content += '<span style="' + hookErrorStyle + '">SUITE SETUP HOOK</span> ' ;
				break ;
			case 'suiteTeardown' :
				content += '<span style="' + hookErrorStyle + '">SUITE TEARDOWN HOOK</span> ' ;
				break ;
		}

		if ( error.error.uncaught ) { content += '<span style="' + hookErrorStyle + '">UNCAUGHT EXCEPTION</span> ' ; }

		content += error.title ;
		content += '</p>' ;
		content += this.reportOneError( error.error ) ;
	}

	this.container.insertAdjacentHTML( 'beforeend' , '<hr />' + content ) ;

	scrollDown() ;
} ;



Reporter.prototype.reportOneError = function reportOneError( error ) {
	var content = '' ;

	if ( error.showDiff === true || ( error.showDiff === undefined && ( 'expected' in error ) && ( 'actual' in error ) ) ) {
		content += '<p class="tea-time-classic-reporter" style="' + indentStyle( 2 ) + '">' +
			'<span style="' + expectedStyle + '">expected</span><span style="' + actualStyle + '">actual</span>' +
			'</p>' ;

		content += '<pre class="tea-time-classic-reporter"; style="' + indentStyle( 2 ) + '">' ;
		content += this.teaTime.htmlColorDiff( error.actual , error.expected ) ;
		content += '</pre>' ;
	}

	content +=
		'<pre class="tea-time-classic-reporter" style="' + indentStyle( 2 ) + '">' +
		this.teaTime.inspect.inspectError( { style: 'html' } , error ) +
		'</pre>' ;

	return content ;
} ;


