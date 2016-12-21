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



// Load modules
var falafel = require( 'falafel' ) ;
var packageJson = require( '../package.json' ) ;
var path = require( 'path' ) ;
var fs = require( 'fs' ) ;
var string = require( 'string-kit' ) ;
var escape = string.escape ;



function Cover() { throw new Error( 'Use TeaTime.create() instead' ) ; }
//Cover.prototype = Object.create( NGEvents.prototype ) ;
//Cover.prototype.constructor = Cover ;

module.exports = Cover ;



Cover.create = function createCover( options )
{
	var self = Object.create( Cover.prototype , {
		whiteList: { value: null , writable: true , enumerable: true } ,
		blackList: { value: null , writable: true , enumerable: true } ,
		ecmaVersion: { value: 6 , writable: true , enumerable: true } ,
		tracking: { value: {} , writable: true , enumerable: true } ,
		trackingArea: { value: [] , writable: true , enumerable: true } ,
		isTracking: { value: false , writable: true , enumerable: true } ,
		package: { value: null , writable: true , enumerable: true } ,
	} ) ;
	
	// Tmp:
	var rootDir = process.cwd() ;
	
	// Require the package.json (mandatory)
	try {
		self.package = require( rootDir + '/package.json' ) ;
	}
	catch ( error ) {
		if ( error.code === 'MODULE_NOT_FOUND' ) { throw new Error( "[Cover] No package.json found" ) ; }
		else { throw new Error( "[Cover] Error in the package.json: " + error ) ; }
	}
	
	if ( self.package.config && self.package.config['tea-time'] && self.package.config['tea-time'].coverDir )
	{
		self.whiteList = self.package.config['tea-time'].coverDir.map( function( dirPath ) {
			return rootDir + '/' + dirPath + '/' ;
		} ) ;
	}
	
	require.extensions['.js'] = self.requireJs.bind( self ) ;
	
	global[ coverVarName ] = self ;
	
	return self ;
} ;



var nodeRequireJs = require.extensions['.js'] ;



var nodeToTrack = [
	"ExpressionStatement" ,
	"BreakStatement" ,
	"ContinueStatement" ,
	"VariableDeclaration" ,
	"ReturnStatement" ,
	"ThrowStatement" ,
	"TryStatement" ,
	"FunctionDeclaration" ,
	"IfStatement" ,
	"WhileStatement" ,
	"DoWhileStatement" ,
	"ForStatement" ,
	"ForInStatement" ,
	"SwitchStatement" ,
	"WithStatement"
] ;



var nodeNeedingBraces = [
	"IfStatement" ,
	"WhileStatement" ,
	"DoWhileStatement" ,
	"ForStatement" ,
	"ForInStatement" ,
	"WithStatement"
] ;



var coverVarName = '__TEA_TIME_COVER__' ;



// This is the replacement for JS extension require
Cover.prototype.requireJs = function requireJs( localModule , filePath )
{
	var isTrackingBkup = this.isTracking ;
	
	if ( ( ! this.whiteList || ! this.whiteList.length ) && ( ! this.blackList || ! this.blackList.length ) )
	{
		return nodeRequireJs( localModule , filePath ) ;
	}
	
	if ( this.whiteList && this.whiteList.length )
	{
		if ( ! this.whiteList.some( function( dirPath ) { return filePath.indexOf( dirPath ) === 0 ; } ) )
		{
			//console.log( ">>>>>>>>>>>> Normal requireJs (not white-listed)" , filePath ) ;
			return nodeRequireJs( localModule , filePath ) ;
		}
	}
	
	if ( this.blackList && this.blackList.length )
	{
		if ( this.blackList.some( function( dirPath ) { return filePath.indexOf( dirPath ) === 0 ; } ) )
		{
			//console.log( ">>>>>>>>>>>> Normal requireJs (black-listed)" , filePath ) ;
			return nodeRequireJs( localModule , filePath ) ;
		}
	}
	
	//console.log( ">>>>>>>>>>>> Hi-jacked requireJs" , filePath ) ;
	nodeRequireJs( localModule , filePath ) ;
	
	// This is the original require.extensions['.js'] function, as of node v6:
	
	/*
	var content = fs.readFileSync( filePath , 'utf8' ) ;
	module._compile( internalModule.stripBOM( content ) , filePath ) ;
	*/
	
	var content = fs.readFileSync( filePath , 'utf8' ) ;
	var instrumentedContent = this.instrument( content , filePath ) ;
	
	//console.log( "Instrumented content:\n" + instrumentedContent + "\n\n\n" ) ;
	
	// Force the tracking activation during module loading:
	// tests cannot re-trigger global/top-level module exec,
	// if not, it would always report low coverage
	this.isTracking = true ;
	localModule._compile( instrumentedContent , filePath ) ;
	this.isTracking = isTrackingBkup ;
} ;



// instrument the file synchronously
// `next` is optional callback which will be called
// with instrumented code when present
Cover.prototype.instrument = function instrument( content , filePath ) //config, next)
{
	this.tracking[ filePath ] = {
		area: [] ,
		//charCount: content.length ,
		sourceLines: content.split( '\n' ) ,
	} ;
	
	// It seems that falafel/acorn counts lines starting at 1, not 0
	this.tracking[ filePath ].sourceLines.unshift( '' ) ;
	
	// Remove shebang: not needed anymore since allowHashBang option exists in acorn
	//content = content.replace( /^\#\!.*/ , '' ) ;
	
	var instrumented = falafel( content , {
			locations: true ,
			comment: true ,
			ecmaVersion: this.ecmaVersion ,
			
			allowHashBang: true ,
			
			//sourceType: 'module' ,
			allowReturnOutsideFunction: true ,
			
			// important or conditional tracking may fail with code like:
			// if ( var1 && ( var2 = expression ) )
			preserveParens: true ,
			
		} , this.injectTrackingCode.bind( this , filePath )
	) ;
	
	return instrumented ;
} ;



Cover.prototype.start = function start() { this.isTracking = true ; } ;
Cover.prototype.stop = function stop() { this.isTracking = false ; } ;



Cover.prototype.track = function track( index )
{
	if ( ! this.isTracking ) { return ; }
	
	this.trackingArea[ index ].count ++ ;
	//console.log( "Tracked:" , filePath , this.tracking[ filePath ].area[ index ].location.start.line ) ;
} ;



Cover.prototype.initTracking = function initTracking( filePath , node )
{
	var index = this.trackingArea.length ;
	
	this.trackingArea[ index ] = {
		count: 0 ,
		location: node.loc
	} ;
	
	this.tracking[ filePath ].area[ this.tracking[ filePath ].area.length ] = this.trackingArea[ index ] ;
	
	return index ;
} ;



Cover.prototype.injectTrackingCode = function injectTrackingCode( filePath , node )
{
	//console.log( "node type ["+filePath+"]:" , node.type ) ;
	
	// From Blanket, but does it really happen?
	if ( ! node.loc || ! node.loc.start ) { throw new Error( "Node without location" ) ; }
	
	this.injectBraces( node ) ;
	
	//this.injectBlockTrackingCode( filePath , node ) ;
	this.injectStatementTrackingCode( filePath , node ) ;
	this.injectConditionTrackingCode( filePath , node ) ;
} ;



Cover.prototype.injectBraces = function injectBraces( node )
{
	var index ;
	
	if ( nodeNeedingBraces.indexOf( node.type ) !== -1 )
	{
		if ( node.consequent && node.consequent.type !== "BlockStatement" )
		{
			// The 'then' statement
			node.consequent.update( "{\n" + node.consequent.source() + "}\n" ) ;
		}
		else if ( node.body && node.body.type !== "BlockStatement" )
		{
			// Dunno what node.body is supposed to be...
			node.body.update( "{\n" + node.body.source() + "}\n" ) ;
		}
		
		//if ( node.alternate && node.alternate.type !== "BlockStatement" && node.alternate.type !== "IfStatement" )
		if ( node.alternate && node.alternate.type !== "BlockStatement" )
		{
			// The 'else/else if' node
			node.alternate.update( "{\n" + node.alternate.source() + "}\n" ) ;
		}
	}
	
	return false ;
} ;



Cover.prototype.injectStatementTrackingCode = function injectStatementTrackingCode( filePath , node )
{
	var index ;
	
	if ( nodeToTrack.indexOf( node.type ) !== -1 && node.parent.type !== 'LabeledStatement' )
	{
		if (
			node.type === "VariableDeclaration" &&
			( node.parent.type === "ForStatement" || node.parent.type === "ForInStatement" )
		)
		{
			return false ;
		}
		
		index = this.initTracking( filePath , node ) ;
		
		node.update( 
			//'/*' + node.type + '*/' +
			coverVarName + ".track( " + index + " ) ; " +
			node.source()
		) ;
		
		return true ;
	}
	
	return false ;
} ;



Cover.prototype.injectConditionTrackingCode = function injectConditionTrackingCode( filePath , node )
{
	var index ;
	
	if ( node.type === 'LogicalExpression' && ( node.operator === '&&' || node.operator === '||' ) )
	{
		//console.log( "#######" , node ) ;
		
		if ( node.left.type !== 'LogicalExpression' )
		{
			index = this.initTracking( filePath , node.left ) ;
			
			node.left.update( 
				//'/*' + node.type + '/' + node.left.type + '*/' +
				'(' + coverVarName + ".track( " + index + " ) || " +
				node.left.source() + ')'
			) ;
		}
		
		if ( node.right.type !== 'LogicalExpression' )
		{
			index = this.initTracking( filePath , node.right ) ;
			
			node.right.update( 
				//'/*' + node.type + '/' + node.right.type + '*/' +
				'(' + coverVarName + ".track( " + index + " ) || " +
				node.right.source() + ')'
			) ;
		}
		
		return true ;
	}
	
	return false ;
} ;



Cover.prototype.injectBlockTrackingCode = function injectBlockTrackingCode( filePath , node )
{
	var index ;
	
	if ( node.type === "Program" )
	{
		index = this.initTracking( filePath , node ) ;
		
		node.update( 
			//'/*' + node.type + '*/' +
			coverVarName + ".track( " + index + " ) ; " +
			node.source()
		) ;
		
		return true ;
	}
	else if ( node.type === "BlockStatement" )
	{
		index = this.initTracking( filePath , node ) ;
		
		node.update( 
			'{' +
			//'/*' + node.type + '*/' +
			coverVarName + ".track( " + index + " ) ; " +
			node.source().slice( 1 )
		) ;
		
		return true ;
	}
	
	return false ;
} ;



Cover.prototype.getCoverage = function getCoverage()
{
	var filePath , i , iMax , j , oneData ;
	
	var coverage = {
		uncoveredFiles: {} ,
		lineCount: 0 ,
		uncoveredLineCount: 0 ,
		areaCount: 0 ,
		uncoveredAreaCount: 0
	} ;
	
	for ( filePath in this.tracking )
	{
		//charCount += this.tracking[ filePath ].charCount ;
		coverage.lineCount += this.tracking[ filePath ].sourceLines.length - 1 ;	// substract empty line 0
		
		for ( i = 0 , iMax = this.tracking[ filePath ].area.length ; i < iMax ; i ++ )
		{
			oneData = this.tracking[ filePath ].area[ i ] ;
			coverage.areaCount ++ ;
			
			if ( ! oneData.count )
			{
				coverage.uncoveredAreaCount ++ ;
				
				if ( ! coverage.uncoveredFiles[ filePath ] )
				{
					coverage.uncoveredFiles[ filePath ] = {
						source: this.tracking[ filePath ].sourceLines ,
						lines: ( new Array( this.tracking[ filePath ].sourceLines.length ) ).fill( false )
					} ;
				}
				
				// Flags the lines as uncovered
				for ( j = oneData.location.start.line ; j <= oneData.location.end.line ; j ++ )
				{
					coverage.uncoveredFiles[ filePath ].lines[ j ] = true ;
				}
				
				/*
				console.log( "\n\n>>> Not covered:" , filePath , i , oneData , "\nline:" , oneData.location.start.line ,
					'\n' + escape.control( this.tracking[ filePath ].sourceLines[ oneData.location.start.line - 1 ] ) ,
					'\n' + escape.control( this.tracking[ filePath ].sourceLines[ oneData.location.start.line ] ) ,
					'\n' + escape.control( this.tracking[ filePath ].sourceLines[ oneData.location.start.line + 1 ] )
				) ;
				*/
			}
		}
		
		if ( coverage.uncoveredFiles[ filePath ] )
		{
			coverage.uncoveredLineCount += coverage.uncoveredFiles[ filePath ].lines.reduce(
				function( accu , element ) { return accu + ( element ? 1 : 0 ) ; } , 0
			) ;
		}
	}
	
	// The first is more accurate, the last count comments
	coverage.rate = 1 - coverage.uncoveredAreaCount / coverage.areaCount ;
	//coverage.rate = 1 - coverage.uncoveredLineCount / coverage.lineCount ;
	
	return coverage ;
} ;


