
function symbol(namey, kindy, liney, posny) //for symbol table
{
    this.name = (typeof namey !== undefined && typeof namey !== null) ? namey : "";
    this.kind = (typeof kindy !== undefined && typeof kindy !== null) ? kindy : "";
    this.line = (typeof liney !== undefined && typeof kindy !== null) ? liney : -1;
    this.posn = (typeof posny !== undefined && typeof kindy !== null) ? posny : -1; //the token posnition, i.e. location in tokens[]
    this.used = false;
    this.initialized = false;
    this.temp = undefined; //the name of the TEMPORARY VARIABLE for code gen
    this.stringLen = 0; //the max stringLen, used for code gen
    this.heapLoc = undefined; //the location of the starting character on the heap
    this.toString = function () {
        return "Symbol: " + this.name + ", kind: " + this.kind + ", line: " + this.line + ", posn: " + this.posn;
    }

    this.setVals = function (_name, _kind, _line, _posn) {
        this.name = _name;
        this.kind = _kind;
        this.line = _line;
        this.posn = _posn;

    }
}

//Data type for a symbol-symbolNode pairing
function symbolAndNode(symboly, nodey)
{
this.symbol = symboly;
this.symbolNode = nodey;

this.toString = function() 
{
return "Symbol: " + this.symbol + ", SymbolNode: " + this.symbolNode;}

}

function addSymbol(kind, nodey) {
    //if we know the kind, then assign that to the symbol
    if (kind === "int") { //remember, tokenIndex points to the NEXT token. So this token 
        var s = new symbol(currentToken.value, "int", currentToken.line, tokenIndex - 1);
        nodey.symbolz.push(s);
    } else if (kind === "string") {
        var s = new symbol(currentToken.value, "string", currentToken.line, tokenIndex - 1);
        nodey.symbolz.push(s);
    } 
	else if(kind === "boolean")
	{
	       var s = new symbol(currentToken.value, "boolean", currentToken.line, tokenIndex - 1);
        nodey.symbolz.push(s);
	}
	
	else {
        var s = new symbol(currentToken.value, "", currentToken.line, tokenIndex - 1);
        nodey.symbolz.push(s);
    }
}

function searchSymbols(namey, lowestNode) //returns a symbolAndNode. Searches starting at lowestNode
//note- even if namey isn't in the current symbolNode scope, we can still look up the tree
//returns undefined if symbol is not found
{

var nodey = lowestNode;
var retval = undefined;
var shouldContinue = true;
//shouldContinue means nodey as a parent. If it doesn't, we can't check nodey.depth
while(retval==undefined && shouldContinue)	{
    for (var i = 0; i < nodey.symbolz.length; i++) {
        if (nodey.symbolz[i].name === namey) {
            retval = nodey.symbolz[i];
        }
    }
if(nodey.parent!==undefined && nodey.parent!==null && retval==undefined)
 {nodey = nodey.parent;}
else {shouldContinue = false;}

}

  if(retval===undefined) {nodey = lowestNode;}
  return new symbolAndNode(retval, nodey);

}


//Tree nodes
//array of children, initialized as empty
//type, e.g. "T_char", initialized as "Unknown type"
//parent node, initialized as null
//level, initialized as 0
//token index/value


function symbolNode(parentNode, depthy) {
    this.parent = (typeof parentNode !== undefined && typeof parentNode!== null) ? parentNode : null;
    this.depth = (!isNaN(depthy)) ? depthy : 0;
    this.symbolz = new Array();
    //note- symbolz is spelled wrong because we already have a global variable named 'symbols'
    this.children = new Array();

    this.setVals = function (_children, _parent, _depth, _symbolz) {
        this.children = _children;
        this.parent = _parent;
        this.depth = _depth;
        this.symbolz = _symbolz;

    }

    this.toString = function () {

        var symbolString = "";

        for (var i = 0; i < this.symbolz.length; i++) {
		symbolString += this.symbolz[i].kind + " ";            
		symbolString += this.symbolz[i].name;
            if (i + 1 !== this.symbolz.length) {
                symbolString += ", ";
            }
        }
        return " Depth: " + this.depth + ", Num Children: " + this.children.length + ", Num Symbols: " + this.symbolz.length + ", Symbols: " + symbolString;

    }

    this.createChild = function () {
        n = new symbolNode(this, this.depth + 1);
        this.children.push(n);
        return n;
    }

    this.addSymbol = function (symb) {
        this.symbolz.push(symb);
    }


    this.printAllChildren = function () {
        var numChildren = this.children.length;
        var retval = "Printing All Children:\n";
        for (i = 0; i < numChildren; i++) {
            retval += i + ". " + this.children[i];
        }
        return retval;
    }
}




function node(typey, parentNode, depthy, tokIndex) {

    this.type = (typeof typey !== undefined && typeof typey!==null) ? typey : "Unknown type";
    this.parent = (typeof parentNode !== undefined && typeof parentNode!==null) ? parentNode : undefined;
    this.depth = (typeof depthy !== undefined && typeof depthy!==null) ? depthy : 0;
    this.tok = (typeof tokIndex !== undefined && typeof tokIndex!==null) ? tokIndex : -1;
    this.children = new Array();
    this.value = ""; 
    this.symb = undefined //keeps track of which symbol is associated with an ID

    this.setVals = function (_type, _children, _parent, _depth, _tok) {
        this.type = _type;
        this.children = _children;
        this.parent = _parent;
        this.depth = _depth;
        this.tok = _tok;
    }

    this.toString = function () {
        if (this.parent === null) {
            return "Node, Type: " + this.type + ", Depth: " + this.depth + ", token index: " + this.tok + ", No Parent!, Num Children: " + this.children.length;

        } else {
            return "Node, Type: " + this.type + ", Depth: " + this.depth + ", token index: " + this.tok + ", Parent type: " + this.parent.type + ",# Children: " + this.children.length;
        }
    }


    this.hasChildren = function()
	{
	return(this.children.length > 0);
	}

    this.createChild = function (typey, tokey)

    {
        n = new node(typey, this, this.depth + 1, tokey);
	//if(buildASTstarted) {alert(this.depth);}
        this.children.push(n);
        return n;
    }


    this.printAllChildren = function () {
        var numChildren = this.children.length;
        var retval = "Printing All Children:\n";
        for (i = 0; i < numChildren; i++) {
            retval += i + ". " + this.children[i];
        }
        return retval;


    }



}

//function node(typey, parentNode, depthy, tokIndex)

function testTree() {

    var baseNode = new node();
    putMessage(baseNode);
    baseNode.createChild("T_TEST", -1);
    putMessage(baseNode);
    putMessage(baseNode.printAllChildren());
    var node2 = new node("this type", null, 12, 111);
    putMessage(node2);

}

function testSymbolNodes() {
    //this version tests and prints out symbolNodes individually

    putMessage("testing symbol nodes:");
    var base = new symbolNode();
	alert(base);
    putMessage("printing base node:\n" + base);
    var symb1 = new symbol("a", "string", 5, -1);
    var symb2 = new symbol("b", "int", 5, -1);
    var symb3 = new symbol("c", "string", 2, -1);
    var node2 = base.createChild();
    node2.addSymbol(symb1);
    node2.addSymbol(symb2);
    var node3 = node2.createChild();
    node3.addSymbol(symb3);
    var node4 = node2.createChild();
    node4.addSymbol(symb3);
    putMessage("printing base node:\n" + base);
    putMessage("printing node2:\n" + node2);
    putMessage("printing node3:\n" + node3);
    putMessage("printing node4\n" + node4);


    //this next version will add the symbolNodes to an array and use a function to print all of them
    //note that this modifies the global array, so this test can screw things up later on
    /*
putMessage("testing symbol nodes:");
var base = new symbolNode();
symbolNodes.push(base);
var symb1 = new symbol("a", "string", 5, -1);
var symb2 = new symbol("b", "int", 5, -1);
var symb3 = new symbol("c", "string", 2, -1);
var node2 = base.createChild();
node2.addSymbol(symb1);
node2.addSymbol(symb2);
var node3 = node2.createChild();
node3.addSymbol(symb3);
var node4 = node2.createChild();
node4.addSymbol(symb3);
symbolNodes.push(node2);
symbolNodes.push(node3);
symbolNodes.push(node4);
printSymbolTable();
*/
}



function token() {
    this.kind = "";
    this.line = -1;
    this.value = null;

    this.toString = function () {
        return "Token: " + this.kind + ", Line# " + this.line + ", Value= " + this.value;
    }
    this.setVals = function (_kind, _line, _value) {
        this.kind = _kind;
        this.line = _line;
        this.value = _value;
    }

}

function printNodes(arr) {
    for (var i = 0; i < arr.length; i++) {
        //write token to output
        var depthy = arr[i].depth;

        for (var j = 0; j < depthy; j++) {
            document.getElementById("taOutput").value += "|   ";
        }
        document.getElementById("taOutput").value += (i + 1) + ". ";
        document.getElementById("taOutput").value += arr[i].type;
        if (arr[i].tok >= 0) //if node is associated with a token
        {
	
            document.getElementById("taOutput").value += ", Token= "
            document.getElementById("taOutput").value += tokens[arr[i].tok].value;
        }
	if(arr[i].value !== "" && arr[i].value !== undefined)
	{
	    document.getElementById("taOutput").value += ", Value= "
            document.getElementById("taOutput").value += arr[i].value;
	}	

/*	
	if(arr[i].symb!==undefined)
	{
	   document.getElementById("taOutput").value += ", symb= "
	   document.getElementById("taOutput").value += arr[i].symb.symbol.name;
	}
//*/  
      document.getElementById("taOutput").value += "\n";
    }
}

function printSymbolTable() {
    for (var i = 0; i < symbolNodes.length; i++) {
        //write token to output
        var depthy = symbolNodes[i].depth;

        for (var j = 0; j < depthy; j++) {
            document.getElementById("taOutput").value += "   ";
        }
        document.getElementById("taOutput").value += (i + 1) + ". ";
        //printArray(symbolNodes[i].symbolz);
        document.getElementById("taOutput").value += symbolNodes[i];
        document.getElementById("taOutput").value += "\n"
    }
}


function printArray(arr) {

    for (var i = 0; i < arr.length; i++) {
        //write token to output
        document.getElementById("taOutput").value += (i + 1) + ". ";
        document.getElementById("taOutput").value += arr[i].toString();
        document.getElementById("taOutput").value += "\n"
    }
}

function addToken(type, line, val) //adds token to the array tokens[]
{
    var myToken = new token();
    myToken.setVals(type, line, val);
    tokens.push(myToken);
}
