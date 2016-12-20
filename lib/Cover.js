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
		isTracking: { value: false , writable: true , enumerable: true } ,
	} ) ;
	
	//Object.defineProperties( self , {} ) ;
	
	if ( packageJson.config && packageJson.config['tea-time'] && packageJson.config['tea-time'].coverDir )
	{
		self.whiteList = packageJson.config['tea-time'].coverDir.map( function( dirPath ) {
			return path.dirname( __dirname ) + '/' + dirPath + '/' ;
		} ) ;
	}
	
	require.extensions['.js'] = self.requireJs.bind( self ) ;
	
	global[ coverVarName ] = self ;
	
	return self ;
} ;



var nodeRequireJs = require.extensions['.js'] ;



var nodeToTrack = [
	"ExpressionStatement",
	"BreakStatement"   ,
	"ContinueStatement" ,
	"VariableDeclaration",
	"ReturnStatement"   ,
	"ThrowStatement"   ,
	"TryStatement"     ,
	"FunctionDeclaration"    ,
	"IfStatement"       ,
	"WhileStatement"    ,
	"DoWhileStatement"   ,
	"ForStatement"   ,
	"ForInStatement"  ,
	"SwitchStatement"  ,
	"WithStatement"
] ;



var nodeNeedingBraces = [
	"IfStatement"       ,
	"WhileStatement"    ,
	"DoWhileStatement"     ,
	"ForStatement"   ,
	"ForInStatement"  ,
	"WithStatement"
] ;



var coverVarName = '__TEA_TIME_COVER__' ;



// This is the replacement for JS extension require
Cover.prototype.requireJs = function requireJs( localModule , filePath )
{
	var isTrackingBkup = this.isTracking ;
	
	if ( this.whiteList && this.whiteList.length )
	{
		if ( ! this.whiteList.some( function( dirPath ) { return filePath.indexOf( dirPath ) === 0 ; } ) )
		{
			console.log( ">>>>>>>>>>>> Normal requireJs (not white-listed)" , filePath ) ;
			return nodeRequireJs( localModule , filePath ) ;
		}
	}
	
	if ( this.blackList && this.blackList.length )
	{
		if ( this.blackList.some( function( dirPath ) { return filePath.indexOf( dirPath ) === 0 ; } ) )
		{
			console.log( ">>>>>>>>>>>> Normal requireJs (black-listed)" , filePath ) ;
			return nodeRequireJs( localModule , filePath ) ;
		}
	}
	
	console.log( ">>>>>>>>>>>> Hi-jacked requireJs" , filePath ) ;
	nodeRequireJs( localModule , filePath ) ;
	
	// This is the original require.extensions['.js'] function, as of node v6:
	
	/*
	var content = fs.readFileSync( filePath , 'utf8' ) ;
	module._compile( internalModule.stripBOM( content ) , filePath ) ;
	*/
	
	var content = fs.readFileSync( filePath , 'utf8' ) ;
	var instrumentedContent = this.instrument( content , filePath ) ;
	
	console.log( "Instrumented content:\n" + instrumentedContent + "\n\n\n" ) ;
	
	// Force the tracking activation during module loading:
	// tests cannot re-trigger global/top-level module exec,
	// if not, it would always report low coverage
	this.isTracking = true ;
	localModule._compile( instrumentedContent , filePath ) ;
	this.isTracking = isTrackingBkup ;
	
	/*
	blanket.instrument({
		inputFile: content,
		inputFileName: blanket.normalizeBackslashes(inputFilename)
	},function(instrumented){
		var baseDirPath = blanket.normalizeBackslashes(path.dirname(filePath))+'/.';
		try{
			instrumented = instrumented.replace(/require\s*\(\s*("|')\./g,'require($1'+baseDirPath);
			localModule._compile(instrumented, originalFilename);
		}
		catch(err){
			if (_blanket.options("ignoreScriptError")){
				//we can continue like normal if
				//we're ignoring script errors,
				//but otherwise we don't want
				//to completeLoad or the error might be
				//missed.
				if (_blanket.options("debug")) {console.log("BLANKET-There was an error loading the file:"+filePath);}
				oldLoader(localModule,filePath);
			}else{
				var e = new Error("BLANKET-Error parsing instrumented code: "+err);
				e.error = err;
				throw e;
			}
		}
	});
	*/
} ;



// instrument the file synchronously
// `next` is optional callback which will be called
// with instrumented code when present
Cover.prototype.instrument = function instrument( content , filePath ) //config, next)
{
	this.tracking[ filePath ] = {
		area: [] ,
		charCount: content.length ,
		sourceLines: content.split( '\n' ) ,
	} ;
	
	// Remove shebang
	content = content.replace( /^\#\!.*/ , '' ) ;
	
	var instrumented = falafel( content , {
			locations: true ,
			comment: true ,
			ecmaVersion: this.ecmaVersion
		} , this.injectTrackingCode.bind( this , filePath )
	) ;
	
	return instrumented ;
	
	/*
	//check instrumented hash table,
	//return instrumented code if available.
	console.log( ">>> instrumenting" ) ;
	
	var inFile = config.inputFile,
		inFileName = config.inputFileName;
	
	//check instrument cache
	var sourceArray = _blanket._prepareSource(inFile);
	_blanket._trackingArraySetup=[];
	
	//remove shebang
	inFile = inFile.replace(/^\#\!.+/, "");
	
	var instrumented =  parseAndModify(inFile,{locations:true,comment:true,ecmaVersion:_blanket.options("ecmaVersion")}, _blanket._injectTrackingCode(inFileName));
	
	instrumented = _blanket._trackingSetup(inFileName,sourceArray)+instrumented;
	
	return instrumented ;
	*/
} ;



Cover.prototype.start = function start() { this.isTracking = true ; } ;
Cover.prototype.stop = function stop() { this.isTracking = false ; } ;



Cover.prototype.track = function track( filePath , index )
{
	if ( ! this.isTracking ) { return ; }
	
	this.tracking[ filePath ].area[ index ].count ++ ;
	console.log( "Tracked:" , filePath , this.tracking[ filePath ].area[ index ].location.start.line ) ;
	
	// Return true, because logical expression tracking code needs this
	return true ;
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
		coverage.lineCount += this.tracking[ filePath ].sourceLines.length ;
		
		for ( i = 0 , iMax = this.tracking[ filePath ].area.length ; i < iMax ; i ++ )
		{
			oneData = this.tracking[ filePath ].area[ i ] ;
			coverage.areaCount ++ ;
			
			//if ( ! oneData ) { continue ; }
			
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
				
				console.log( "\n\n>>> Not covered:" , filePath , i , oneData , "\nline:" , oneData.location.start.line ,
					'\n' + escape.control( this.tracking[ filePath ].sourceLines[ oneData.location.start.line - 1 ] ) ,
					'\n' + escape.control( this.tracking[ filePath ].sourceLines[ oneData.location.start.line ] ) ,
					'\n' + escape.control( this.tracking[ filePath ].sourceLines[ oneData.location.start.line + 1 ] )
				) ;
			}
		}
		
		if ( coverage.uncoveredFiles[ filePath ] )
		{
			coverage.uncoveredLineCount += coverage.uncoveredFiles[ filePath ].lines.reduce(
				function( accu , element ) { return accu + ( element ? 1 : 0 ) } , 0
			) ;
		}
	}
	
	//coverage.rate = 1 - coverage.uncoveredAreaCount / coverage.areaCount ;
	coverage.rate = 1 - coverage.uncoveredLineCount / coverage.lineCount ;
	
	return coverage ;
} ;



Cover.prototype.initTracking = function initTracking( filePath , node )
{
	var index = this.tracking[ filePath ].area.length ;
	
	this.tracking[ filePath ].area[ index ] = {
		count: 0 ,
		location: node.loc
	} ;
	
	return index ;
} ;



Cover.prototype.injectTrackingCode = function injectTrackingCode( filePath , node )
{
	console.log( "node type ["+filePath+"]:" , node.type ) ;
	
	//_blanket._blockifyIf(node);
	
	// From Blanket, but does it really happen?
	if ( ! node.loc || ! node.loc.start ) { throw new Error( "Node without location" ) ; }
	
	this.injectBraces( node ) ;
	
	//this.injectBlockTrackingCode( filePath , node ) ;
	this.injectStatementTrackingCode( filePath , node ) ;
	this.injectConditionTrackingCode( filePath , node ) ;
	
	/*
	//*/
	/*
	else if (_blanket.options("branchTracking") && node.type === "ConditionalExpression")
	{
		_blanket._trackBranch(node,filePath);
	}
	*/
} ;



Cover.prototype.injectBraces = function injectBraces( node )
{
	var index ;
	
	if ( nodeNeedingBraces.indexOf( node.type ) !== -1 )
	{
		if ( node.consequent && node.consequent !== "BlockStatement" )
		{
			// The 'then' statement
			node.consequent.update( "{\n" + node.consequent.source() + "}\n" ) ;
		}
		else if ( node.body && node.body !== "BlockStatement" )
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
			'/*' + node.type + '*/' +
			coverVarName + ".track( '" + escape.jsSingleQuote( filePath ) + "' , " + index + " ) ;\n" +
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
		console.log( "#######" , node ) ;
		
		if ( node.left.type !== 'LogicalExpression' )
		{
			index = this.initTracking( filePath , node.left ) ;
			
			node.left.update( 
				'/*' + node.type + '/' + node.left.type + '*/' +
				'(' + coverVarName + ".track( '" + escape.jsSingleQuote( filePath ) + "' , " + index + " ) && " +
				node.left.source() + ')'
			) ;
		}
		
		if ( node.right.type !== 'LogicalExpression' )
		{
			index = this.initTracking( filePath , node.right ) ;
			
			node.right.update( 
				'/*' + node.type + '/' + node.right.type + '*/' +
				'(' + coverVarName + ".track( '" + escape.jsSingleQuote( filePath ) + "' , " + index + " ) && " +
				node.right.source() + ')'
			) ;
		}
		
		return true ;
	}
	
	return false ;
} ;

/*
Cover.prototype.trackBranch = function trackBranch(node,filePath)
{
	//recursive on consequent and alternative
	var line = node.loc.start.line;
	var col = node.loc.start.column;

	_blanket._branchingArraySetup.push({
		line: line,
		column: col,
		file:filePath,
		consequent: node.consequent.loc,
		alternate: node.alternate.loc
	});

	var updated = "_$branchFcn"+
				  "('"+filePath+"',"+line+","+col+","+node.test.source()+
				  ")?"+node.consequent.source()+":"+node.alternate.source();
	node.update(updated);
} ;
*/


Cover.prototype.injectBlockTrackingCode = function injectBlockTrackingCode( filePath , node )
{
	var index ;
	
	if ( node.type === "Program" )
	{
		index = this.initTracking( filePath , node ) ;
		
		node.update( 
			'/*' + node.type + '*/' +
			coverVarName + ".track( '" + escape.jsSingleQuote( filePath ) + "' , " + index + " ) ;" +
			node.source()
		) ;
		
		return true ;
	}
	else if ( node.type === "BlockStatement" )
	{
		index = this.initTracking( filePath , node ) ;
		
		node.update( 
			'{' +
			'/*' + node.type + '*/' +
			coverVarName + ".track( '" + escape.jsSingleQuote( filePath ) + "' , " + index + " ) ;" +
			node.source().slice( 1 )
		) ;
		
		return true ;
	}
	
	return false ;
} ;



/*
Cover.prototype.prepareSource = function prepareSource(source)
{
	return source.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/(\r\n|\n|\r)/gm,"\n").split('\n');
} ;



Cover.prototype.trackingSetup = function trackingSetup(filePath,sourceArray)
{
	var branches = _blanket.options("branchTracking");
	var sourceString = sourceArray.join("',\n'");
	var intro = "";
	var covVar = _blanket.getCovVar();

	if(_blanket._useStrictMode) {
		intro += "'use strict';\n";
	}

	intro += "if (typeof "+covVar+" === 'undefined') "+covVar+" = {};\n";
	if (branches){
		intro += "var _$branchFcn=function(f,l,c,r){ ";
		intro += "if (!!r) { ";
		intro += covVar+"[f].branchData[l][c][0] = "+covVar+"[f].branchData[l][c][0] || [];";
		intro += covVar+"[f].branchData[l][c][0].push(r); }";
		intro += "else { ";
		intro += covVar+"[f].branchData[l][c][1] = "+covVar+"[f].branchData[l][c][1] || [];";
		intro += covVar+"[f].branchData[l][c][1].push(r); }";
		intro += "return r;};\n";
	}
	intro += "if (typeof "+covVar+"['"+filePath+"'] === 'undefined'){";

	intro += covVar+"['"+filePath+"']=[];\n";
	if (branches){
		intro += covVar+"['"+filePath+"'].branchData=[];\n";
	}
	intro += covVar+"['"+filePath+"'].source=['"+sourceString+"'];\n";
	//initialize array values
	_blanket._trackingArraySetup.sort(function(a,b){
		return parseInt(a,10) > parseInt(b,10);
	}).forEach(function(item){
		intro += covVar+"['"+filePath+"']["+item+"]=0;\n";
	});
	if (branches){
		_blanket._branchingArraySetup.sort(function(a,b){
			return a.line > b.line;
		}).sort(function(a,b){
			return a.column > b.column;
		}).forEach(function(item){
			if (item.file === filePath){
				intro += "if (typeof "+ covVar+"['"+filePath+"'].branchData["+item.line+"] === 'undefined'){\n";
				intro += covVar+"['"+filePath+"'].branchData["+item.line+"]=[];\n";
				intro += "}";
				intro += covVar+"['"+filePath+"'].branchData["+item.line+"]["+item.column+"] = [];\n";
				intro += covVar+"['"+filePath+"'].branchData["+item.line+"]["+item.column+"].consequent = "+JSON.stringify(item.consequent)+";\n";
				intro += covVar+"['"+filePath+"'].branchData["+item.line+"]["+item.column+"].alternate = "+JSON.stringify(item.alternate)+";\n";
			}
		});
	}
	intro += "}";

	return intro;
} ;


*/





