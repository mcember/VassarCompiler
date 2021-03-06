 var debugParseTree = "";
 var nodeIndex = 0;
 var symbolNodeIndex = 0;
 var outOfTokens = false; //if getNextToken finds that we are out
 //var baseSymbolNode = new symbolNode();
 //var currentSymbolNode = baseSymbolNode;

 function parse() {

	 baseSymbolNode = new symbolNode();

	 currentSymbolNode = baseSymbolNode;


     EOF.setVals("T_END", lineNum, "$"); //set values of EOF token. Since lexing is already done,
     //value of lineNum is the # of total lines in the program
     var NI = nodeIndex; //keeps track of which node in nodes[] we're on upon entering the parse function

     //create base nodes for nodes and symbolNodes, i.e. top of the trees
     var baseNode = new node("Program", null, 0, -1);
    
     //add the base nodes to symbolNodes and nodes
     symbolNodes.push(baseSymbolNode);
     
     nodes.push(baseNode);
     putMessage("\n\nPARSE ENTERED:");

     // Grab the next token.

     currentToken = getNextToken();
     // A valid parse derives the G(oal) production, so begin there.
     parseStatement(NI);
     parseEND(NI);
     // Report the results.
     putMessage("Parsing found " + parseErrorCount + " error(s).");
     putMessage("Parsing found " + warningCount + " warning(s).\n");

     //putMessage(debugParseTree); //for debugging purposes
     if (parseErrorCount === 0) //only print parse tree and symbol table is there are no errors
     {
         putMessage("Printing Parse Tree...");
         printNodes(nodes);
         putMessage("\nPrinting Symbols...\n");
	 printSymbolTable();
         putMessage("\nPrinting AST nodes...\n");

	buildAST();

	printNodes(ASTnodes);
	semanticAnalysis();
	

     } else {

     }
 }



 function newNode(i, type, tokIndex)
 //function creates a new child node
 //i is the index of nodes[] of the parent. Type is the type of the new node, 
 //	tokIndex is the token associated with the node
 {
     nodeIndex++;
     if (nodes[i] != null) {
         var n = nodes[i].createChild(type, tokIndex);
         nodes[nodeIndex] = n;
     } else {
         putMessage("Big Error!\n");
         alert('error at node ' + i + ", value is: " + nodes[i] + ", node index is: " + nodeIndex);
     }
     return nodeIndex;

 }

 function checkToken(expectedKind) //also CONSUMES TOKEN
 {
     // Validate that we have the expected token kind and et the next token.
     //we pass in the token kind as expectedKind, so we just have to compare it to currenttoken.kind
     var retval = false;
     if (currentToken.kind == expectedKind) {
         if (verboseParse) {
             putMessage(tokenIndex + ". Expecting " + kindToText(currentToken.kind) + ", got it!");
         }
         retval = true;
         if (expectedKind === "T_END" && outOfTokens) //we found an END token, but it was put there automatically
         {
             warningCount++;
             putMessage("Warning on line " + currentToken.line + ": no end marker ('$') found!");
         }
     } else {
         parseErrorCount++;
         putMessage(tokenIndex + ". Error on line " + currentToken.line + ": Expecting " + kindToText(expectedKind) + ", got " + kindToText(currentToken.kind));

         if (errorDetail) //this detailed error message shows the user what the parse tree looks like. e.g. what non-terminal we're on
         {
             putMessage("\tAscending nodes from this token:");
             var curN = nodes[nodeIndex];
             while (curN.parent != undefined) {
                 putMessage("\t  " + curN.parent.type);
                 //iterate to next parent
                 curN = curN.parent;
             }

         }
     }

     // Consume another token, having just checked this one, because that 
     // will allow the code to see what's coming next... a sort of "look-ahead".
     if (expectedKind !== "T_END") {
         currentToken = getNextToken();
     }
     return retval;
 }

 function checkFutureToken(expectedKind, offset) //checks some future token
 {
     var tokey;
     var tokIndex = tokenIndex - 1;
     //note- getNextToken increments the token index, so tokenIndex points to the next token
     //we want tokIndex to point to the current token
     if (tokIndex + offset < tokens.length) {
         tokey = tokens[tokIndex + offset];
     } else //we reached the end of tokens
     {
         return false;
     }
     return (tokey.kind === expectedKind);
 }


 function getNextToken() {
     var thisToken = EOF; // Let's assume that we're at the EOF.
     if (tokenIndex < tokens.length) {
         // If we're not at EOF, then return the next token in the stream and advance the index.
         thisToken = tokens[tokenIndex];
         if (verboseParse) {
             putMessage("Current token:" + thisToken.value);
         }

         tokenIndex++;
     } else //we are out of tokens
     {
         if (!outOfTokens) //check if we haven't set the outOfTokens flag
         {
             warningCount++;
             putMessage("Warning: out of tokens, parsing not done");
             outOfTokens = true;
         }
     }
     return thisToken;
 }

 function kindToText(kind) //converts token kind to text. E.g. T_digit -> digit
 {
     switch (kind) {

         case ("T_space"):
             return "Space";
             break;
         case ("T_char"):
             return "Char";
             break;
         case ("T_int"):
             return "int"
             break;
         case ("T_string"):
             return "string";
             break;
		case ("T_boolean"):
			return "boolean";
			break;
         case ("T_digit"):
             return "Digit";
             break;
         case ("T_leftParen"):
             return "Left Paren";
             break;
         case ("T_rightParen"):
             return "Right Paren";
             break;
         case ("T_leftBrace"):
             return "Left Brace";
             break;
         case ("T_rightBrace"):
             return "right Brace";
             break;
         case ("T_op"):
             return "Operator";
             break;
         case ("T_quote"):
             return "Quote";
             break;
         case ("T_END"):
             return "END";
             break;
         case ("T_equals"):
             return "Equal Sign";
             break;
         case ("T_print"):
             return "print";
             break;
         case ("T_if"):
             return "if";
             break;
         case ("T_while"):
             return "while";
             break;
         case ("T_doubleEquals"):
             return "==";
             break;
         case ("T_true"):
             return "true";
             break;
         case ("T_false"):
             return "false";
             break;
         default:
             return "Unknown token type";
             break;

     }
     return "default kindtotext return value";

 }




 //tokenIndex is global variable, initialized at 0


 function parseStatement(i) {

     //increment the nodeIndex. Then create a new child of the parent node that called this function
     //push that node into nodes[nodeIndex]. 

     var NI = newNode(i, "Statement", -1);


     debugParseTree += tokenIndex + ". Statement\n";
     //option 1: current token is a P, first statement branch
     if (checkFutureToken("T_print", 0)) {
         parsePrint(NI);
         parseLeftParen(NI);
         parseExpr(NI);
         parseRightParen(NI);
     }
     //option 2: current token is an Id (char), second statement branch
     else if (checkFutureToken("T_char", 0)) {
         parseID(NI, "", "VarAssignment");
         parseEquals(NI);
         parseExpr(NI);

     }
     //option 3: current token is a type, third branch
     else if (checkFutureToken("T_string", 0) || checkFutureToken("T_int", 0) || checkFutureToken("T_boolean", 0)) {
         parseVarDecl(NI);
     }
     //option 4: current token is a left brace, fourth branch
     else if (checkFutureToken("T_leftBrace", 0)) { 
	
         parseLeftBrace(NI);
         parseStatementList(NI);

         parseRightBrace(NI);
	}
     else if (checkFutureToken("T_while", 0))
	{
	parseWhileStatement(NI);

	}
     else if (checkFutureToken("T_if", 0))
	{
	parseIfStatement(NI);
	}
      else {
         //ERROR
     }
 }



function parseWhileStatement(i)
{
	var NI = newNode(i, "whileStatement", -1);
	parseWhile(NI);
	parseBooleanExpr(NI);
	parseLeftBrace(NI);
	parseStatementList(NI);
	parseRightBrace(NI);
}

function parseIfStatement(i)
{
	var NI = newNode(i, "ifStatement", -1);
	 parseIf(NI);
	 parseBooleanExpr(NI);
	 parseLeftBrace(NI);
	 parseStatementList(NI);
	 parseRightBrace(NI);
}


function parseIf(i)
{
 var NI = newNode(i, "T_if", tokenIndex-1);
 checkToken("T_if");
}

function parseWhile(i)
{
 var NI = newNode(i, "T_while", tokenIndex-1);
 checkToken("T_while");
}

function parseBooleanExpr(i)
{
 var NI = newNode(i, "BoolExpr", -1);

	if(checkFutureToken("T_leftParen",0)) //we are taking the (Expr == Expr) production
	{
	parseLeftParen(NI);
	parseExpr(NI);
	parseDoubleEquals(NI);
	parseExpr(NI);
	parseRightParen(NI);
	}
	else //else we have a boolVal
	{
	parseBoolVal(NI);
	}

}


function parseDoubleEquals(i)
{
var NI = newNode(i, "T_doubleEquals", tokenIndex-1);
checkToken("T_doubleEquals");
}

function parseBoolVal(i)
{
var NI = newNode(i, "boolVal",-1);
if(checkFutureToken("T_true",0))
	{
parseTrue(NI);
	}
else //if the token isn't true, it must be false. Check for false
	{
parseFalse(NI);
	}

}

function parseTrue(i)
{
var NI = newNode(i, "T_true", tokenIndex-1);
checkToken("T_true");
}

function parseFalse(i)
{
var NI = newNode(i, "T_false", tokenIndex-1);
checkToken("T_false");
}






 function parseEquals(i) {
     debugParseTree += tokenIndex + ". equals\n";
     var NI = newNode(i, "T_equals", tokenIndex - 1);
     checkToken("T_equals");
 }

 function parsePrint(i) {
     var NI = newNode(i, "T_print", tokenIndex - 1);
     debugParseTree += tokenIndex + ". P\n";
     checkToken("T_print");
 }

 function parseLeftParen(i) {
     var NI = newNode(i, "T_leftParen", tokenIndex - 1);
     debugParseTree += tokenIndex + ". LeftParen\n";
     checkToken("T_leftParen");
 }

 function parseRightParen(i) {
     var NI = newNode(i, "T_rightParen", tokenIndex - 1);
     debugParseTree += tokenIndex + ". RightParen\n";
     checkToken("T_rightParen");
 }

 function parseExpr(i) {
     var NI = newNode(i, "Expr", -1);
     debugParseTree += tokenIndex + ". Expr\n";
     //if there is a digit, parse intExpr
     if (checkFutureToken("T_digit", 0)) {
         parseIntExpr(NI);
     }
     //else, if there is a quote, parse stringExpr
     else if (checkFutureToken("T_quote", 0)) {
         parseStringExpr(NI);
     }
     //else, if there is a char, parseID
     else if (checkFutureToken("T_char", 0)) {
         parseID(NI, "", "Expr");
     }
     //else, error
     else { //we have a boolean expression
        parseBooleanExpr(NI);
     }
 }

  
 function parseIntExpr(i) {
     var NI = newNode(i, "IntExpr", -1);
     debugParseTree += tokenIndex + ". IntExpr\n";
     parseDigit(NI);

     //there can now be either nothing or an op. 
     //since we can't have intExpr op intExpr, we know the lack of an op means
     //we are simply taking the digit branch
     if (checkFutureToken("T_op", 0)) {
         parseOp(NI);
         parseExpr(NI);
     }
 }

 function parseDigit(i) {
     var NI = newNode(i, "T_digit", tokenIndex - 1);
     debugParseTree += tokenIndex + ". digit\n";
     checkToken("T_digit");
 }

 function parseOp(i) {
     debugParseTree += tokenIndex + ". op\n";
     var NI = newNode(i, "T_op", tokenIndex - 1);
     checkToken("T_op");
 }

 function parseStringExpr(i) {
     var NI = newNode(i, "StringExpr", -1);
     debugParseTree += tokenIndex + ". StringExpr\n";
     parseQuote(NI);
     parseCharList(NI);
     parseQuote(NI);
 }

 function parseCharList(i) {
     var NI = newNode(i, "CharList", -1);
     debugParseTree += tokenIndex + ". CharList\n";
     //check to see if there is a char. If there is, we are doing the recursive portion
     if (checkFutureToken("T_char", 0)) {
         parseChar(NI);
         parseCharList(NI);
     } else if (checkFutureToken("T_space", 0)) {
         parseSpace(NI);
         parseCharList(NI);
     } else {
         //else, take the null production
     }
 }

 function parseSpace(i) {
     var NI = newNode(i, "Space", tokenIndex - 1);
     debugParseTree += tokenIndex + ". Space\n";
     checkToken("T_space");
 }

 function parseQuote(i) {
     var NI = newNode(i, "T_quote", tokenIndex - 1);
     debugParseTree += tokenIndex + ". Quote\n";
     checkToken("T_quote");
 }



 function parseID(i, type, context) {

	//the parameter "context" tells where parseID is being called from.
 
     var NI = newNode(i, "ID", -1);
	
     var symbAndNode = searchSymbols(currentToken.value, currentSymbolNode);
	
	var symb = symbAndNode.symbol;
	var needToDeclare = (symb==undefined);
	var declaredUpScope = false; 

//keep track of if we need to declare this variable. If symbol isn't found in searchSymbols, we do
//if searchSymbols returned something from outside the currentSymbolNode, we still have to declare the variable in this most local scope
	if(!needToDeclare){declaredUpScope = (symbAndNode.symbolNode!==currentSymbolNode)}


 //  alert('on line ' + currentToken.line + ", needtodeclare = " + needToDeclare +  ", symbNode is " + symbAndNode.symbolNode + ", currentSymbolNode is" + currentSymbolNode);


 if (needToDeclare || (!needToDeclare && declaredUpScope && context==="VarDecl")) 
	{
         //either we are declaring the variable now, or we are using it without declaring
         if (type !== "int" && type !== "string" & type!=="boolean") {
	     //UNDECLARED VARIABLE ERROR
             parseErrorCount++;
             putMessage(tokenIndex + ". Error on line " + currentToken.line + ", Undeclared identifier!");
         } else { //the symbol is being declared
                addSymbol(type, currentSymbolNode);
		//the symbol is located at currentSymbolNode.symbolz[length-1]

		//add the symbolAndNode to the ID in the parse tree to the current node
		nodes[nodeIndex].symb = new symbolAndNode(currentSymbolNode.symbolz[currentSymbolNode.symbolz.length-1], currentSymbolNode);
        
	 }
     } else { //symbol is declared somewhere in the tree
	nodes[nodeIndex].symb = symbAndNode;
         
	if (context=="VarDecl") {
              parseErrorCount++;
             putMessage(tokenIndex + ". Error on line " + currentToken.line + ", Redeclared identifier!");
         }
       else if(context==="VarAssignment")
	{
	}
	else if(context==="Expr")
	{
	}
     }
     debugParseTree += tokenIndex + ". ID\n";

     parseChar(NI);

 }

 function parseChar(i) {
     var NI = newNode(i, "T_char", tokenIndex - 1);
     debugParseTree += tokenIndex + ". Char\n";
     checkToken("T_char");
 }

 function parseVarDecl(i) {
     var NI = newNode(i, "VarDecl", -1);
     debugParseTree += tokenIndex + ". VarDecl\n";
     var type = parseType(NI);
     parseID(NI, type, "VarDecl");
 }

 function parseType(i) {

     var NI;
     debugParseTree += tokenIndex + ". Type\n";
     if (checkFutureToken("T_int", 0)) {
         NI = newNode(i, "T_int", tokenIndex - 1);
         checkToken("T_int");
         return "int"; //for the symbol table
     } else if (checkFutureToken("T_string", 0)) {
         NI = newNode(i, "T_string", tokenIndex - 1);
         checkToken("T_string");
         return "string"; //for the symbol table

     } else if (checkFutureToken("T_boolean", 0)) {
	 NI = newNode(i, "T_boolean", tokenIndex - 1);
	 checkToken("T_boolean");
	 return "boolean";
	 }
	 else
     {
         putMessage("Expecting int or char, got " + kindToText(currentToken.kind));
         putMessage("Error at position " + tokenIndex + ", on line " + currentToken.line);
         currentToken = getNextToken();
         return "";
     }
 }


 function parseEND(i) {
     var NI = newNode(i, "T_END", tokenIndex - 1);
     debugParseTree += tokenIndex + ". End\n";
     checkToken("T_END");
 }

 function parseLeftBrace(i) {
	//WE JUST ENTERED A NEW SCOPE
	var newScope = currentSymbolNode.createChild();
	symbolNodes.push(newScope);
	currentSymbolNode = newScope;
     var NI = newNode(i, "T_leftBrace", tokenIndex - 1);
     debugParseTree += tokenIndex + ". LeftBrace\n";
     checkToken("T_leftBrace");
 }

 function parseRightBrace(i) {

     var NI = newNode(i, "T_rightBrace", tokenIndex - 1);
     debugParseTree += tokenIndex + ". rightbrace\n";
     checkToken("T_rightBrace");
	//we just EXITED A SCOPE. Go up one in scope
   

 if(currentSymbolNode.parent !== null)
	{
	//alert('just went up a scope');
	currentSymbolNode = currentSymbolNode.parent;
	}
 }

 function parseStatementList(i) {
     var NI = newNode(i, "StatementList", -1);
     debugParseTree += tokenIndex + ". StatementList\n";
     //check if there is another statement to parse
     //we will check the four options from parseStatement
     if (checkFutureToken("T_print", 0) || checkFutureToken("T_char", 0) || checkFutureToken("T_if", 0) || checkFutureToken("T_while", 0) || checkFutureToken("T_string", 0) || checkFutureToken("T_boolean", 0) || checkFutureToken("T_int", 0) || checkFutureToken("T_leftBrace", 0)) {

         parseStatement(NI);
         parseStatementList(NI);
     } else //statementList leads to null prodction, do nothing
     {

     }
 }
