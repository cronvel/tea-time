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

	self.teaTime.on( 'ready' , { fn: Reporter.ready.bind( self ) , async: true } ) ;

	self.teaTime.on( 'start' , Reporter.forward.bind( self , 'start' ) ) ;
	self.teaTime.on( 'enterSuite' , Reporter.forward.bind( self , 'enterSuite' ) ) ;
	self.teaTime.on( 'exitSuite' , Reporter.forward.bind( self , 'exitSuite' ) ) ;
	self.teaTime.on( 'enterTest' , Reporter.forward.bind( self , 'enterTest' ) ) ;
	self.teaTime.on( 'exitTest' , Reporter.forward.bind( self , 'exitTest' ) ) ;
	self.teaTime.on( 'ok' , Reporter.forward.bind( self , 'ok' ) ) ;
	self.teaTime.on( 'fail' , Reporter.forward.bind( self , 'fail' ) ) ;
	self.teaTime.on( 'optionalFail' , Reporter.forward.bind( self , 'optionalFail' ) ) ;
	self.teaTime.on( 'skip' , Reporter.forward.bind( self , 'skip' ) ) ;
	self.teaTime.on( 'assertionOk' , Reporter.forward.bind( self , 'assertionOk' ) ) ;
	self.teaTime.on( 'assertionFail' , Reporter.forward.bind( self , 'assertionFail' ) ) ;
	self.teaTime.on( 'report' , Reporter.forward.bind( self , 'report' ) ) ;
	self.teaTime.on( 'errorReport' , Reporter.forward.bind( self , 'errorReport' ) ) ;
	self.teaTime.on( 'exit' , Reporter.exit.bind( self , 'exit' ) ) ;

	return self ;
}

module.exports = Reporter ;



Reporter.ready = function ready( callback ) {
	var self = this ;

	//console.log( "Ready event received!" , this.teaTime.token ) ;
	this.ws = new WebSocket( 'ws://127.0.0.1:7357/' + this.teaTime.token ) ;

	this.ws.onopen = function onOpen() {
		Reporter.forward.call( self , 'ready' ) ;
		console.log( "Websocket opened!" ) ;
		callback() ;
	} ;

	this.ws.onclose = function onClose() {
		console.log( "Websocket closed!" ) ;
	} ;
} ;



Reporter.forward = function forward( event , ... args ) {
	this.teaTime.prepareSerialize( args ) ;

	this.ws.send(
		JSON.stringify( {
			event: event ,
			args: args
		} )
	) ;
} ;



Reporter.exit = function exit( callback ) {
	Reporter.forward.call( this , 'exit' ) ;
	//console.log( "Exit event received!" ) ;
	this.ws.close() ;
} ;

