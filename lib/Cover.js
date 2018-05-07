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

"use strict" ;



// Browser is not supported ATM, because of the require.extensions['.js'] trick
if ( process.browser ) { return ; }

var falafel = require( 'falafel' ) ;
var fs = require( 'fs' ) ;
//var escape = require( 'string-kit/lib/escape.js' ) ;



function Cover( options ) {
	Object.defineProperties( this.prototype , {
		whiteList: { value: null , writable: true , enumerable: true } ,
		blackList: { value: null , writable: true , enumerable: true } ,
		ecmaVersion: { value: 6 , writable: true , enumerable: true } ,
		currentFile: { value: null , writable: true , enumerable: true } ,
		tracking: { value: {} , writable: true , enumerable: true } ,
		trackingArea: { value: [] , writable: true , enumerable: true } ,
		isTracking: { value: false , writable: true , enumerable: true } ,
		package: { value: null , writable: true , enumerable: true } ,
		warningComments: { value: {} , writable: true , enumerable: true } ,
		warningCommentCount: { value: 0 , writable: true , enumerable: true }
	} ) ;

	// Tmp:
	var rootDir = process.cwd() ;

	// Require the package.json (mandatory)
	try {
		this.package = require( rootDir + '/package.json' ) ;
	}
	catch ( error ) {
		if ( error.code === 'MODULE_NOT_FOUND' ) { throw new Error( "[Cover] No package.json found" ) ; }
		else { throw new Error( "[Cover] Error in the package.json: " + error ) ; }
	}

	if ( this.package.config && this.package.config['tea-time'] && this.package.config['tea-time'].coverDir ) {
		this.whiteList = this.package.config['tea-time'].coverDir.map( ( dirPath ) => {
			return rootDir + '/' + dirPath + '/' ;
		} ) ;
	}

	require.extensions['.js'] = this.requireJs.bind( this ) ;

	global[ coverVarName ] = this ;
}

//Cover.prototype = Object.create( NGEvents.prototype ) ;
//Cover.prototype.constructor = Cover ;

module.exports = Cover ;



// Backward compatibility
Cover.create = ( ... args ) => new Cover( ... args ) ;
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
Cover.prototype.requireJs = function requireJs( localModule , filePath ) {
	var isTrackingBkup = this.isTracking ;

	if ( ( ! this.whiteList || ! this.whiteList.length ) && ( ! this.blackList || ! this.blackList.length ) ) {
		return nodeRequireJs( localModule , filePath ) ;
	}

	if ( this.whiteList && this.whiteList.length ) {
		if ( ! this.whiteList.some( ( dirPath ) => { return filePath.indexOf( dirPath ) === 0 ; } ) ) {
			//console.log( ">>>>>>>>>>>> Normal requireJs (not white-listed)" , filePath ) ;
			return nodeRequireJs( localModule , filePath ) ;
		}
	}

	if ( this.blackList && this.blackList.length ) {
		if ( this.blackList.some( ( dirPath ) => { return filePath.indexOf( dirPath ) === 0 ; } ) ) {
			//console.log( ">>>>>>>>>>>> Normal requireJs (black-listed)" , filePath ) ;
			return nodeRequireJs( localModule , filePath ) ;
		}
	}

	//console.log( ">>>>>>>>>>>> Hi-jacked requireJs" , filePath ) ;

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
Cover.prototype.instrument = function instrument( content , filePath /*, config , next */ ) {
	this.tracking[ filePath ] = {
		area: [] ,
		//charCount: content.length ,
		sourceLines: content.split( '\n' )
	} ;

	this.currentFile = filePath ;

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

		onComment: this.onComment.bind( this )

	} , this.injectTrackingCode.bind( this , filePath )
	) ;

	this.currentFile = null ;

	return instrumented ;
} ;



Cover.prototype.start = function start() { this.isTracking = true ; } ;
Cover.prototype.stop = function stop() { this.isTracking = false ; } ;



// Get warning comment, starting with
Cover.prototype.onComment = function onComment( blockComment , content , startOffset , endOffset , start , end ) {
	var match = content.match( /^(\s*\/!\\\s*)+(.+?)(\s*\/!\\\s*)*$/m ) ;
	if ( ! match ) { return ; }

	if ( ! this.warningComments[ this.currentFile ] ) {
		this.warningComments[ this.currentFile ] = [] ;
	}

	this.warningComments[ this.currentFile ].push( { comment: match[ 2 ] , line: start.line } ) ;
	this.warningCommentCount ++ ;
} ;



Cover.prototype.track = function track( index ) {
	if ( ! this.isTracking ) { return ; }

	this.trackingArea[ index ].count ++ ;
	//console.log( "Tracked:" , filePath , this.tracking[ filePath ].area[ index ].location.start.line ) ;
} ;



Cover.prototype.initTracking = function initTracking( filePath , node ) {
	var index = this.trackingArea.length ;

	// Falafel/Acorn start lines and columns at 1, not 0, and that's troublesome.
	// Fix that now!
	this.trackingArea[ index ] = {
		count: 0 ,
		location: {
			start: {
				line: node.loc.start.line - 1 ,
				column: node.loc.start.column - 1
			} ,
			end: {
				line: node.loc.end.line - 1 ,
				column: node.loc.end.column - 1
			}
		}
	} ;

	this.tracking[ filePath ].area[ this.tracking[ filePath ].area.length ] = this.trackingArea[ index ] ;

	return index ;
} ;



Cover.prototype.injectTrackingCode = function injectTrackingCode( filePath , node ) {
	//console.log( "node type ["+filePath+"]:" , node.type ) ;

	// This is from the Blanket source code, but does it really happen?
	if ( ! node.loc || ! node.loc.start || ! node.loc.end ) { throw new Error( "Node without location" ) ; }

	this.injectBraces( node ) ;

	//this.injectBlockTrackingCode( filePath , node ) ;
	this.injectStatementTrackingCode( filePath , node ) ;
	this.injectConditionTrackingCode( filePath , node ) ;
} ;



Cover.prototype.injectBraces = function injectBraces( node ) {
	var index ;

	if ( nodeNeedingBraces.indexOf( node.type ) !== -1 ) {
		if ( node.consequent && node.consequent.type !== "BlockStatement" ) {
			// The 'then' statement
			node.consequent.update( "{\n" + node.consequent.source() + "}\n" ) ;
		}
		else if ( node.body && node.body.type !== "BlockStatement" ) {
			// Dunno what node.body is supposed to be...
			node.body.update( "{\n" + node.body.source() + "}\n" ) ;
		}

		//if ( node.alternate && node.alternate.type !== "BlockStatement" && node.alternate.type !== "IfStatement" )
		if ( node.alternate && node.alternate.type !== "BlockStatement" ) {
			// The 'else/else if' node
			node.alternate.update( "{\n" + node.alternate.source() + "}\n" ) ;
		}
	}

	return false ;
} ;



Cover.prototype.injectStatementTrackingCode = function injectStatementTrackingCode( filePath , node ) {
	var index ;

	if ( nodeToTrack.indexOf( node.type ) !== -1 && node.parent.type !== 'LabeledStatement' ) {
		if (
			// Do not track variable declaration inside for and for in
			( node.type === "VariableDeclaration" &&
				( node.parent.type === "ForStatement" || node.parent.type === "ForInStatement" ) ) ||

			// Do not track "use strict"
			( node.type === "ExpressionStatement" && node.parent.type === "Program" &&
				node.expression.type === "Literal" && node.expression.value === "use strict" )
		) {
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



Cover.prototype.injectConditionTrackingCode = function injectConditionTrackingCode( filePath , node ) {
	var index ;

	if ( node.type === 'LogicalExpression' && ( node.operator === '&&' || node.operator === '||' ) ) {
		//console.log( "#######" , node ) ;

		if ( node.left.type !== 'LogicalExpression' ) {
			index = this.initTracking( filePath , node.left ) ;

			node.left.update(
				//'/*' + node.type + '/' + node.left.type + '*/' +
				'(' + coverVarName + ".track( " + index + " ) || " +
				node.left.source() + ')'
			) ;
		}

		if ( node.right.type !== 'LogicalExpression' ) {
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



Cover.prototype.injectBlockTrackingCode = function injectBlockTrackingCode( filePath , node ) {
	var index ;

	if ( node.type === "Program" ) {
		index = this.initTracking( filePath , node ) ;

		node.update(
			//'/*' + node.type + '*/' +
			coverVarName + ".track( " + index + " ) ; " +
			node.source()
		) ;

		return true ;
	}
	else if ( node.type === "BlockStatement" ) {
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



Cover.prototype.getCoverage = function getCoverage() {
	var filePath , i , iMax , j , oneData , col , max ;

	var coverage = {
		uncoveredFiles: {} ,
		lineCount: 0 ,
		uncoveredLineCount: 0 ,
		areaCount: 0 ,
		uncoveredAreaCount: 0 ,
		warningCommentCount: this.warningCommentCount ,
		warningComments: this.warningComments
	} ;

	for ( filePath in this.tracking ) {
		//charCount += this.tracking[ filePath ].charCount ;
		coverage.lineCount += this.tracking[ filePath ].sourceLines.length ;
		coverage.areaCount += this.tracking[ filePath ].area.length ;

		for ( i = 0 , iMax = this.tracking[ filePath ].area.length ; i < iMax ; i ++ ) {
			oneData = this.tracking[ filePath ].area[ i ] ;

			if ( ! oneData.count ) {
				if ( ! coverage.uncoveredFiles[ filePath ] ) {
					coverage.uncoveredFiles[ filePath ] = {
						source: this.tracking[ filePath ].sourceLines ,
						lines: [] ,
						areaCount: this.tracking[ filePath ].area.length ,
						uncoveredAreaCount: 0
					} ;
				}

				coverage.uncoveredAreaCount ++ ;
				coverage.uncoveredFiles[ filePath ].uncoveredAreaCount ++ ;

				//*
				if ( oneData.location.start.line === oneData.location.end.line ) {
					// Flags the line as partially uncovered
					col = coverage.uncoveredFiles[ filePath ].lines[ oneData.location.start.line ] = [] ;

					for ( j = oneData.location.start.column ; j <= oneData.location.end.column ; j ++ ) {
						col[ j ] = true ;
					}
				}
				else {
					// Flags the starting line as partially uncovered
					col = coverage.uncoveredFiles[ filePath ].lines[ oneData.location.start.line ] = [] ;
					max = this.tracking[ filePath ].sourceLines[ oneData.location.start.line ].length ;

					for ( j = oneData.location.start.column ; j < max ; j ++ ) {
						col[ j ] = true ;
					}

					// Flags the ending line as partially uncovered
					col = coverage.uncoveredFiles[ filePath ].lines[ oneData.location.end.line ] = [] ;

					for ( j = 0 ; j <= oneData.location.end.column ; j ++ ) {
						col[ j ] = true ;
					}
				}

				for ( j = oneData.location.start.line + 1 ; j < oneData.location.end.line ; j ++ ) {
					// Flags the whole middle lines as uncovered
					coverage.uncoveredFiles[ filePath ].lines[ j ] = true ;
				}
				//*/

				/*
				console.log( "\n\n>>> Not covered:" , filePath , i , oneData , "\nline:" , oneData.location.start.line ,
					'\n' + escape.control( this.tracking[ filePath ].sourceLines[ oneData.location.start.line - 1 ] ) ,
					'\n' + escape.control( this.tracking[ filePath ].sourceLines[ oneData.location.start.line ] ) ,
					'\n' + escape.control( this.tracking[ filePath ].sourceLines[ oneData.location.start.line + 1 ] )
				) ;
				*/
			}
		}

		if ( coverage.uncoveredFiles[ filePath ] ) {
			coverage.uncoveredFiles[ filePath ].rate =
				1 - coverage.uncoveredFiles[ filePath ].uncoveredAreaCount / coverage.uncoveredFiles[ filePath ].areaCount ;

			coverage.uncoveredLineCount += coverage.uncoveredFiles[ filePath ].lines.reduce(
				( accu , element ) => { return accu + ( element ? 1 : 0 ) ; } , 0
			) ;
		}
	}

	// The first is more accurate, the last count comments, blank lines, etc...
	coverage.rate = 1 - coverage.uncoveredAreaCount / coverage.areaCount ;
	//coverage.rate = 1 - coverage.uncoveredLineCount / coverage.lineCount ;

	return coverage ;
} ;


