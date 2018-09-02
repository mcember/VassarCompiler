//AST.js
//Takes CST, and creates an AST from that
//CST is stored in nodes[], nodes[0] is basenode
//we will use ASTnodes[] to keep track of the nodes in the AST

var CSTnode; //we have to initialize this to nodes[0] later when buildAST is caled
var ASTnodeIndex = 0;

function newASTnode(i, type, tokIndex, val, symb) {
    //function creates a new child node
    //i is the index of ASTnodes[] of the parent. Type is the type of the new node, 
    //	tokIndex is the token associated with the node
    if (i === -1) { //we are creating the base node
        var n = new node();
        n.type = type;
	n.depth = 0;
	n.value = "";
	n.symb = undefined;
	ASTnodes[0] = n;

    } else {
        ASTnodeIndex++;
        if (ASTnodes[i] != null) {
            var n = ASTnodes[i].createChild(type, tokIndex);
            n.value = val;
	    n.symb = symb;
	    ASTnodes[ASTnodeIndex] = n;

        } else {
            putMessage("Big Error!\n");
            alert('error at node ' + i + ", value is: " + ASTnodes[i] + ", node index is: " + ASTnodeIndex);
        }
    }
    return ASTnodeIndex;
}

function buildAST() {
	buildASTstarted = true;
    CSTnode = nodes[1];
    program();

    

}

function program() {
    //CSTnode = CSTnode.children[0];
    //CSTnode.children[0] should be a statement, call statement
    statement(-1, CSTnode);
}

function statement(i, nodey) {
    nextNode = nodey.children[0];
    switch (nextNode.type) {
        case "T_leftBrace":
            //we are in a statement list
            
                var NI = newASTnode(i, "block", -1); //create a 'block' node, whose children is all the statements
                statementList(NI, nodey.children[1]);
                break;
            
        case "T_print":
            //we are in a print
            var NI = newASTnode(i,"print", nextNode.tok);
	    print(NI, nodey);
                break;
            
        case "VarDecl":
		var NI = newASTnode(i, "Declaration", -1);
     		varDecl(NI, nextNode);
                break;
            
        case "ID":
            //we are in an 'ID = Expr' Statement 
	//we want the '=' to be the next child. Its children are ID on the left and Expr on the right
	var NI = newASTnode(i, "Assignment", -1);
	assignment(NI, nodey);
                break;
	
	case "whileStatement":
	//we are in a while production
	//create the next child as 'while.' Pass in the 'whileStatement' node to whileAST()
	var NI = newASTnode(i, "while", nextNode.children[0].tok);
	ifWhileAST(NI, nextNode);
	break;

	case "ifStatement":
	//we are in an if production
	//create the next child as 'if.' Pass in the 'ifStatement' node to ifAST()
	var NI = newASTnode(i, "if", nextNode.children[0].tok);
	ifWhileAST(NI, nextNode);
	break;
	
            
        default:
            alert('code should never reach here! Parse tree error!');
                break;
           
    }
}

//the AST for IF and WHILE are built the exact same way, so we only need one function
function ifWhileAST(i, nodey)
{
//nodey is the statement whose first child is while/if
//this means children[1] is the boolexpr, children[3] is statementlist, 2 and 4 are braces

boolExpr(i, nodey.children[1]);
var NI = newASTnode(i, "block", -1);
statementList(NI, nodey.children[3]);
}

function boolExpr(i, nodey)
{

//nodey is the boolExpr node of the CST
//i is the 'while' node of the CST

if(nodey.children[0].type==="boolVal")
	{
	var boolNode = nodey.children[0].children[0];
	//we took the boolVal production, simply take boolVal's child and get T_true or T_false
	newASTnode(i, (boolNode.type==="T_true") ? "True" : "False", boolNode.tok);
	}
else
	{
	//we are in the (Expr == Expr)
	//first, create == as the first child
	//then, call expr on both Exprs, which are the [1] and [3] children
	var NI = newASTnode(i, "doubleEquals", nodey.children[2].tok);
	expr(NI, nodey.children[1]);
	expr(NI, nodey.children[3]); 
	}
}

function statementList(i, nodey) {
    //nodey is the StatementList node of the CST.
    //if nodey has children, we know we have the production 'statement statementlist'. 
    if (nodey.hasChildren()) {
        //take the statement route, giving 'block' the statement as a child
        statement(i, nodey.children[0]);
        //the, recursively call this function on the 'statementlist' from the 'statement statementlist' production
        statementList(i, nodey.children[1]);
    }

}

function assignment(i, nodey)
{
//here, nodey is the Statement node of the CST. children[0] is ID, children[2] is Expr
ID(i, nodey.children[0]);
expr(i, nodey.children[2]);

}

function varDecl(i, nodey)
{
//nodey is the VarDecl node of the CST
//we want to create two new nodes on the AST: the left is the type, and the right is the ID
var node1 = nodey.children[0]; //the node for type
if(node1.type==="T_int")
{
newASTnode(i, "int", node1.tok);
}
else if(node1.type==="T_string")
{
newASTnode(i, "string", node1.tok);
}
else
{
newASTnode(i, "boolean", node1.tok);
}
ID(i,nodey.children[1]);

//var node2 = nodey.children[1].children[0]; //the char node of the ID
//newASTnode(i, node2.type, node2.tok);

}

function ID(i, nodey)
{
//nodey is ID node of CST
newASTnode(i, "ID", nodey.children[0].tok, undefined, nodey.symb);
}

function print(i, nodey)
{
//nodey is the statement node whose first child is 'print'
//we can throw out the parens, or nodey.children[1] and nodey.children[3]
//what we want is the expr, or nodey.children[2]
expr(i, nodey.children[2]);
}

function expr(i, nodey)
{
if(nodey.children[0].type=="IntExpr")
	{
	intExpr(i, nodey.children[0]);
	}
else if(nodey.children[0].type=="StringExpr")
	{
	stringExpr(i, nodey.children[0]);
	}
else if(nodey.children[0].type=="BoolExpr")
	{
    boolExpr(i, nodey.children[0]);
	}
else if(nodey.children[0].type=="ID")
	{
	ID(i, nodey.children[0]);
	}
else
	{
	alert('Error! The code should never reach this case! Problem with Expr in CST!');
	}
}

function intExpr(i, nodey)
{
//if num children==1, then we take the 'digit' branch. Otherwise, 'digit op expr'
if(nodey.children.length==1)
{
digit(i, nodey.children[0]);
}
else
{
//op becomes next child. Then op's left child is digit, right is Expr
var NI = newASTnode(i, "op", nodey.children[1].tok);
digit(NI, nodey.children[0]);
expr(NI, nodey.children[2]);

}
}

function digit(i, nodey)
{
newASTnode(i, "digit", nodey.tok);
}

function stringExpr(i, nodey)
{
//For stringExpr, children[0] = quote, children[1] = charlist, children[2] = quote
var charry = nodey.children[1];
var stringVal = "";
while(charry.hasChildren())
	{
	stringVal += tokens[charry.children[0].tok].value; //get the character from the T_char node
	charry = charry.children[1];
	}
//NOTE- give the node the tokenIndex of the first character in the string
//that way, we know the line number later on
var NI = newASTnode(i, "string", nodey.children[0].tok, stringVal);
//NI.value = stringVal; //set the node's value to stringVal
}

