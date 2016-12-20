

module.exports = function( arg )
{
	var bob ;
	
	bob = "init!" ;
	
	if ( arg )
	{
		// Some comment
		return 'yeah!' ;
	}
	else
	{
		// More comment
		if ( arg && bob && true ) bob = "one!" ;
		else if ( ! arg && ! bob ) bob = "two!" ;
		else if ( ! arg && ! bob ) bob = "three!" ;
		else bob = "four!" ;
		
		return 'doh!' ;
	}
	
} ;