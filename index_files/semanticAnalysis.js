//during semantic analysis, we will work with the array ASTnodes which contains node objects
//the node objects which are ID's have an associated .symb which contain .symbol and .symbolNode, 
//	which represent the symbol and symbol block of the ID, respectively



function semanticAnalysis()
{
putMessage("\nSemantic Analysis Entered!\n");
var firstNode = ASTnodes[0]; 

processNode(firstNode);
//after type mismatch and use of uninitialized IDs are checked for, walk through symbols
//	and make sure they are all used

    for (var i = 0; i < symbolNodes.length; i++) {
       for(var j = 0; j < symbolNodes[i].symbolz.length; j++)
	{
	var symby = symbolNodes[i].symbolz[j];
	if(symby.used===false)
	{
	putMessage("Warning: Unused Identifier! ID is \"" + symby.name + "\" in scope: " + symbolNodes[i]);
	}
	}
    } 

putMessage("Semantic Analysis Exited, found " + semanticErrorCount + " errors!");

if(semanticErrorCount===0) 
	{
	codeGen();
	}

}

function processNode(nodey)
{
//alert('processNode entered');
if(nodey.type=="block") //if the node is a block, process each child of the block
	{
	for(var i = 0; i < nodey.children.length; i++)
		{
		processNode(nodey.children[i]);
		}
	}
else
{ 

	switch(nodey.type)
	{
	case("Declaration"):
	//alert('declaration node found');
	//declaration type checking is handled in parsing. Nothing to do here
	break;

	case("Assignment"):
	//alert('assignment node found');
	//we have to make sure the type of the left side is the same as the right side
	var leftSide = nodey.children[0];
	var rightSide = nodey.children[1];
	//left side must be an ID- the type is the type in the symbol table
	var typeLeft = leftSide.symb.symbol.kind;
	
	if(typeLeft === "boolean")
	{
	if(nodey.children[1].type==="doubleEquals")
		{ //check both sides of the doubleEquals
		checkBooleanExpr(nodey.children[1]);
		}
	else //it must just be true or false, do nothing
		{
		}
	
	}
	else
	{
	checkType(rightSide, typeLeft);
	}
	//mark the symbol as initialized, since the assignment statement is 'symbol = expr'
	leftSide.symb.symbol.initialized = true;
	break;
	
	case("print"):
	checkType(nodey.children[0], "print");
	break;
	
	case("if" || "while"):
	if(nodey.children[0].type==="doubleEquals")
		{
		checkBooleanExpr(nodey.children[0]);
		}
		
	//also call processNode on the block of the if statement
	processNode(nodey.children[1]);
	
	break;

	default:

	break;
	}
}

}

function checkBooleanExpr(nodey)
{
		//we are in (expr==expr), check that the type of the expr's match
		var leftSide = nodey.children[0];
		var rightSide = nodey.children[1];
		var typeLeft;
		if(leftSide.type==="ID")
			{
			typeLeft = leftSide.symb.symbol.kind;
			}
		else if(leftSide.type==="string") //typeLeft is a stringExpr
			{
			typeLeft = "string";
			}
		else if(leftSide.type==="True" || leftSide.type==="False")
		{		typeLeft = "boolean";
		}
		else if(leftSide.type==="doubleEquals")
		{
		typeLeft = "boolean";
		}
		else //typeLeft must be an IntExpr. We also have to make sure the IntExpr is consistent
			{		
			typeLeft = "int";
			checkType(leftSide, typeLeft);
			}
		checkType(rightSide, typeLeft);
}

function checkType(nodey, typey)
{
//first, find the type of nodey.
//NOTE- nodey.type is the type of the node, NOT a type in the sense of int or string
//NOTE- we pass in 'print' for typey to recursively walk through the node and make sure the expr 
//	doesn't have type mismatch.
//	We can also issue warning and undeclared IDs and mark all IDs as used

var nodeType;
switch(nodey.type){
	case("ID"):
	nodeType = nodey.symb.symbol.kind;
	//mark the ID as used, since it is used in an assignment
	var symby = nodey.symb.symbol;
	symby.used = true;
	if(symby.initialized===false)
		{
		putMessage("Warning on line " + ((nodey.tok>0) ? tokens[nodey.tok].line : "unknown line") + ", use of an uninitialized identifier " + symby.name);
		}
	break;

	case("True"):
	nodeType = "boolean";
	break;
	
	case("False"):
	nodeType = "boolean";
	break;
	
	
	case("digit"):
	nodeType = "int";
	break;
	
	case("doubleEquals"):
	nodeType = "boolean";
	break;
	
	case("string"):
	nodeType = "string";
	break;
	
	case("op"):
	//in the case of an op, we know we are in an IntExpr for digit op Expr
	//therefore, we can return int, but ALSO have to check that the Expr is of type int
	nodeType = "int";
	checkType(nodey.children[1], "int");
	break;

	default:
	break;
}


if(nodeType !== typey && typey!=="print")
{
semanticErrorCount++;
putMessage("Error on line " + ((nodey.tok>0) ? tokens[nodey.tok].line : "unknown line") + ", type mismatch! Expecting " + typey + ", got " + nodeType);
}

}

