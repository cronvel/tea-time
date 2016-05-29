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

/* global document */



//var Report = require( './report.js' ) ;
//var ErrorReport = require( './error-report.js' ) ;


function Reporter( teaTime , self )
{
	if ( ! self )
	{
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
	self.teaTime.on( 'skip' , Reporter.skip.bind( self ) ) ;
	self.teaTime.on( 'report' , Reporter.report.bind( self ) ) ;
	self.teaTime.on( 'errorReport' , Reporter.errorReport.bind( self ) ) ;
	
	return self ;
}

module.exports = Reporter ;



function scrollDown()
{
	( document.querySelector( 'div.tea-time-classic-reporter p:last-child' ) ||
		document.querySelector( 'div.tea-time-classic-reporter h4:last-child' ) ||
		document.querySelector( 'div.tea-time-classic-reporter pre:last-child' ) )
			.scrollIntoView() ;
}



function indentStyle( depth )
{
	return 'margin-left:' + ( 1 + 2 * depth ) + '%;' ;
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




Reporter.enterSuite = function enterSuite( suiteName , depth )
{
	this.container.insertAdjacentHTML( 'beforeend' ,
		'<h4 class="tea-time-classic-reporter" style="' + indentStyle( depth ) + '">' + suiteName + '</h4>'
	) ;
	
	scrollDown() ;
} ;



Reporter.ok = function ok( testName , depth , time , slow )
{
	var content = '✔ ' + testName ;
	
	if ( ! slow ) { content += ' <span style="' + fastStyle + '">(' + time + 'ms)</span>' ; }
	else if ( slow === 1 ) { content += ' <span style="' + slowStyle + '">(' + time + 'ms)</span>' ; }
	else { content += ' <span style="' + slowerStyle + '">(' + time + 'ms)</span>' ; }
	
	this.container.insertAdjacentHTML( 'beforeend' ,
		'<p class="tea-time-classic-reporter" style="' + passingStyle + indentStyle( depth ) + '">' + content + '</p>'
	) ;
	
	scrollDown() ;
} ;



Reporter.fail = function fail( testName , depth , time , slow , error )
{
	var content = '✘ ' + testName ;
	
	if ( time !== undefined )
	{
		if ( ! slow ) { content += ' <span style="' + fastStyle + '">(' + time + 'ms)</span>' ; }
		else if ( slow === 1 ) { content += ' <span style="' + slowStyle + '">(' + time + 'ms)</span>' ; }
		else { content += ' <span style="' + slowerStyle + '">(' + time + 'ms)</span>' ; }
	}
	
	this.container.insertAdjacentHTML( 'beforeend' ,
		'<p class="tea-time-classic-reporter" style="' + failingStyle + indentStyle( depth ) + '">' + content + '</p>'
	) ;
	
	scrollDown() ;
} ;



Reporter.skip = function skip( testName , depth )
{
	var content = '· ' + testName ;
	
	this.container.insertAdjacentHTML( 'beforeend' ,
		'<p class="tea-time-classic-reporter" style="' + pendingStyle + indentStyle( depth ) + '">' + content + '</p>'
	) ;
	
	scrollDown() ;
} ;



Reporter.report = function report( ok , fail , skip )
{
	this.container.insertAdjacentHTML(
		'beforeend' ,
		'<hr />' +
		'<p class="tea-time-classic-reporter" style="font-weight:bold;' + passingStyle + indentStyle( 1 ) + '">' + ok + ' passing</p>' +
		'<p class="tea-time-classic-reporter" style="font-weight:bold;' + failingStyle + indentStyle( 1 ) + '">' + fail + ' failing</p>' +
		'<p class="tea-time-classic-reporter" style="font-weight:bold;' + pendingStyle + indentStyle( 1 ) + '">' + skip + ' pending</p>'
	) ;
	
	scrollDown() ;
} ;



Reporter.errorReport = function errorReport( errors )
{
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
		content += this.reportOneError( error.error ) ;
	}
	
	this.container.insertAdjacentHTML( 'beforeend' , '<hr />' + content ) ;
	
	scrollDown() ;
} ;



Reporter.prototype.reportOneError = function reportOneError( error )
{
	var content = '' ;
	
	if ( error.expected && error.actual )
	{
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


