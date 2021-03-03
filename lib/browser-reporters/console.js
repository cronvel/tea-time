/*
	Tea Time!

	Copyright (c) 2015 - 2021 Cédric Ronvel

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



function Reporter( teaTime , self ) {
	if ( ! self ) {
		self = Object.create( Reporter.prototype , {
			teaTime: { value: teaTime , enumerable: true }
		} ) ;
	}

	self.teaTime.on( 'ok' , Reporter.ok.bind( self ) ) ;
	self.teaTime.on( 'fail' , Reporter.fail.bind( self ) ) ;
	self.teaTime.on( 'optionalFail' , Reporter.optionalFail.bind( self ) ) ;
	self.teaTime.on( 'skip' , Reporter.skip.bind( self ) ) ;
	self.teaTime.on( 'report' , Reporter.report.bind( self ) ) ;
	//self.teaTime.on( 'errorReport' , Reporter.errorReport.bind( self ) ) ;

	return self ;
}

module.exports = Reporter ;



Reporter.ok = function ok( data ) {
	console.log( 'OK:' , data.title , '(' + data.duration + ')' ) ;
} ;



Reporter.fail = function fail( data ) {
	console.log( 'Fail:' , data.title , data.duration !== undefined ? '(' + data.duration + ')' : '' ) ;
} ;



Reporter.optionalFail = function optionalFail( data ) {
	console.log( 'Opt fail:' , data.title , data.duration !== undefined ? '(' + data.duration + ')' : '' ) ;
} ;



Reporter.skip = function skip( data ) {
	console.log( 'Pending:' , data.title ) ;
} ;



Reporter.report = function report( data ) {
	console.log( 'Report -- ok: ' + data.ok + ( data.assertionOk ? '|' + data.assertionOk : '' ) +
		' fail: ' + data.fail + ( data.assertionFail ? '|' + data.assertionFail : '' ) +
		' opt fail: ' + data.optionalFail +
		' pending: ' + data.skip ,
	' coverage: ' + ( typeof data.coverageRate === 'number' ? Math.round( data.coverageRate * 100 ) + '%' : 'n/a' )
	) ;
} ;

