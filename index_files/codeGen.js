//var codePointer = 0 in index.html, var heapPointer = 255 in index.html
//var strings[], to hold all of the symbols that are strings


function codeGen()
{

fillTempVarNames(); //initialize the array of temp variable names
var currNode = ASTnodes[0];
buildHeap(); //build the heap locations for the strings
//note- code will be outputted to output[], an array of hex values
putMessage("\nAbout to start Code Gen!!!");

GenProcessNode(currNode);
//add the final 00 to the code to halt
out('00');
//now, patch up the static data table

putMessage("Done creating the code. Output before static data patching is: ");
printCode();
patchStaticData();
putMessage("Done patching, output is: ");
printCode();
if(heapPointer<=codePointer)
{
codeGenWarnings+="\nBIG WARNING: The heap and stack overlap...unpredictable behavior might ensue!!!";
}

putMessage(codeGenWarnings);

}

function buildHeap()
{
//first, generate an array of all of the symbols that are strings
 //NOTE- symbolsNodes[0].symbolz is somehow screwed up
for (var i = 1; i < symbolNodes.length; i++) {
	for(var j = 0; j < symbolNodes[i].symbolz.length; j++)
		{
		var s = symbolNodes[i].symbolz[j];
		if(s.kind==="string") {
		strings.push(s);	
		}
		}
    }

//now, symbols[] is filled up with all of the string variables in the program
//traverse through the tree to find all assignment statements with strings
buildMaxStringLen(ASTnodes[0]);

//printStringLoc is where we store maxPrintString's string

//allocate memory in the heap for each string
for(var i = 0; i < strings.length; i++)
{
//subtract the max string len from heapPointer, and also subtract 1 for the null char
heapPointer = heapPointer - strings[i].stringLen;
strings[i].heapLoc = heapPointer;
//move the heapPointer down another so two strings down overlap
heapPointer--;
}
//also allocate room for where we store 'stringy' in print("stringy")
heapPointer = heapPointer - maxPrintString;
//now, heapPointer points to where we store it

}

function buildMaxStringLen(nodey)
{
//maxPrintString is the longest string that is seen in print("stringexpr")
switch(nodey.type)
{

case "block":
	var numChildren = nodey.children.length;
	for(var i = 0; i < numChildren; i++)
	{
	buildMaxStringLen(nodey.children[i]);
	}
break;

case "if":
buildMaxStringLen(nodey.children[1]); //the if's block
break;
case "while":
buildMaxStringLen(nodey.children[1]); //the while's block
break;

case "Assignment": 
//we have an assignment statement, check if the left side ID is a string
var symby = nodey.children[0].symb.symbol;
if(symby.kind==="string")
	{
	//check length of right side
	var lenRight = nodey.children[1].value.length;
	//compare against length of stringLen
	symby.stringLen = (lenRight > symby.stringLen) ? lenRight : symby.stringLen;
	}
break;

case "print":
if(nodey.children[0].type==="string")
	{
	var lengthy = nodey.children[0].value.length;
	if(lengthy > maxPrintString){maxPrintString=lengthy;}
	}
break;

default:
break;
}
}


function patchStaticData()
{
putMessage("Patching Static Data...");
//the index of codePointer is at the end of the code in output[]
//first, replace S0 there are increment codePointer
replaceStaticData("S0XX", codePointer);
//also increment codePointer and initialize S0 to 0
out("00");
//now, go through static data table
for(var i = 0; i < tempVars.length; i++)
	{
	tempVars[i].finalAddress = DtoH(codePointer.toString());
	//do a search for the name of tempVars
	replaceStaticData(tempVars[i].name, codePointer);
	//now, write a 00 to initalize the static variable in the table. Booleans and ints initialized to false
	out("00");
	}
}

function replaceStaticData(AAXX, loc)
{
//AAXX is the name of the static data location in code, e.g. ABXX or S
//first, convert loc to hex
var replacer = DtoH(loc.toString());
if(replacer.length===1)
{
replacer = "0" + replacer;
}

//iterate through output
for(var i = 0; i < 256; i++)
	{
	if(output[i]==AAXX.substr(0,2))
		{
		if(output[i+1]===AAXX.substr(2,2))
			{			
			//we found an instance to replace!
			output[i] = replacer;
			output[i+1] = "00";
			}
		}
	}
}


function out(arg) //write hex code to the output
{
output[codePointer] = arg;

codePointer++;
}


function printCode()
{
var outty = "";
for(var i = 0; i < 256; i++)
{
if(output[i]!==undefined && output[i]!==null) 
	{outty += output[i]; outty += " ";}
else{
outty += "00 ";
}

}


putMessage(outty);
}


//the static data table will only need a field for 'temp' and for 'address'
//each node of the AST that is an identifier has a pointer to its corresponding symbol
//each symbol also has a pointer to the temp variable name. 

//generate a bunch of temporary variable names
function fillTempVarNames(){
for(var i = 0; i < 100; i++)
	{
	var c1 = String.fromCharCode(84+i/26);
	var c2 = String.fromCharCode(65+i%26);
	var namey = c1 + c2 + "XX";
	tempVarNames[i] = namey;
	}
}

function tempVar(namey, offsety) 
{
//this.name = (typeof namey !== undefined && typeof namey !== null) ? namey : undefined;
//this.offset = (typeof offsety !== undefined && typeof namey !== null) ? offsety : undefined;
this.name = namey;
this.offset = offsety;

this.finalAddress = "00";

this.toString = function()
	{
	return("Name = " + name + ", offset = " + offset + ", finalAddress = " + finalAddress);
	
	}
}

//tempVars[] is an array of tempVar objects, i.e. the static data table
function newTempVar()
{
//add a temp var object to tempVars[], also return the object
var i = tempVars.length; //the index/offset to use
var TV = new tempVar(tempVarNames[i], i);
tempVars[i] = TV;  
return TV;
}



function GenProcessNode(nodey)
{
var startLoc = codePointer;
switch(nodey.type)
{
case "block":
	var numChildren = nodey.children.length;
	for(var i = 0; i < numChildren; i++)
	{
	GenProcessNode(nodey.children[i]);
	}
break;

case "Declaration":
GenDeclaration(nodey);
break;

case "Assignment": 
GenAssignment(nodey);
break;

case "print":
Genprint(nodey);
break;

case "if":
Genif(nodey);
break;

case "while":
Genwhile(nodey);
break;

default:
break;
}

var endLoc = codePointer;
//now, calculate the jump and return it
var jump = endLoc - startLoc;
//alert('JUMP IS ' + jump);

return jump;
}

function Genif(nodey)
{
//nodey.children[0] is the boolean condition, nodey.children[1] is the block
evalBool(nodey.children[0]);
//now the z flag is set to 1 if the bool is true, and 0 if its false or contains strings
out("D0");
//keep track of where we're putting the jump variable
var patchLoc = codePointer;
out("J0");
var jumpLen = DtoH(GenProcessNode(nodey.children[1]));
//account for if jumpLen is one character long
if(jumpLen.length<2)
{
jumpLen = "0" + jumpLen;
}
//now, we generated the code. Patch jump location
output[patchLoc] = jumpLen;
}


function Genwhile(nodey)
{
var startingLoc = codePointer;
evalBool(nodey.children[0]); //check the boolean expression
//if its false, branch past the while
out("D0");
var patchLoc = codePointer; //where we start while's code block
out("J0");

//now, generate code for the body of the while. 
//we add 2 to the jump length because of the whileJump code we're adding

var bodyJumpLen = DtoH(GenProcessNode(nodey.children[1]) + 12);
if(bodyJumpLen.length<2)
	{
	bodyJumpLen = "0" + bodJumpLen;
	}
output[patchLoc] = bodyJumpLen;
//we also have to generate code to loop back to startingloc!


setZFalse();
var whileJumpLen = DtoH(255 - 1 - (codePointer - startingLoc));
if(whileJumpLen.length<2)
{
whileJumpLen = "0" + whileJumpLen;
}

out("D0");
out(whileJumpLen); //jump the length of code to get back to the beginning of while
}

function evalBool(nodey) //for use in IF and WHILE expressions
{
//first, check if the value is true or false
if(nodey.type==="True")
	{
	setZTrue();
	}
else if(nodey.type==="False")
	{
	setZFalse();
	}
else if(nodey.type==="ID")
{
//first, load the symbols's value into the ACC
evalBoolTwo(nodey);
//store acc in S0XX
out("8D"); 
out("S0");
out("XX");
//now, load the X register with '01'
out("A2");
out("01");
//now compare SOXX, which contains the boolean, to the X register, which is 01
out("EC");
out("S0");
out("XX");
out("D0");
out("08");
//we didn't branch, we want to set Z to true
setZTrue(); //6 instructions
//now branch past setting Z false
out("D0");
out("0A"); //branch 10 past setting Z to false
//now, set Z to false
setZFalse();
}
else
	{ 
	compareExpr(nodey);
	}
}

function evalBoolTwo(nodey) //for use with boolean variables. Put value of bool in Acc
{
if(nodey.type==="True")
	{
	//load a '1' into the accumulator
	out("A9");
	out("01");
	}
else if(nodey.type==="False")
	{
	//load a 0 into the accumulator
	out("A9");
	out("00");
	}
else if(nodey.type==="ID")
{
	out("AD"); //load the accumulator from memory
	out(nodey.symb.symbol.temp.name.substr(0,2));
	out(nodey.symb.symbol.temp.name.substr(2,2));
}
else if(nodey.type==="doubleEquals")
{
//we have to evaluate the doubleEquals expression.
compareExprTwo(nodey); 
}
else 
	{
	alert('code shouldnt reach here');
	}
}

function compareExprTwo(nodey) //for use everywhere but IF and WHILE expressions. Set ACC to 1 for true, 0 for false
{
	//nodey is the '==', children[0] and children[1] are what we need to compare
	//we can ONLY compare ints. We need to check that both sides are ints
	var leftValid = false;
	var typey = "";
if(nodey.children[0].type==="digit" || nodey.children[0].type==="op")
	{
	leftValid = true;
	typey = "int";
	}
else if(nodey.children[0].type==="ID")
	{
	leftValid = (nodey.children[0].symb.symbol.kind==="int" || nodey.children[0].symb.symbol.kind==="boolean");
	typey = nodey.children[0].symb.symbol.kind;
	}
else if(nodey.children[0].type==="doubleEquals")
{
leftValid = true;
typey = "boolean";
//compareExprTwo(nodey.children[0];

}
else if(nodey.children[0].type==="True" || nodey.children[0].type==="False")
{
leftValid = true;
typey = "boolean";
}
else //we have something else
	{
	leftValid = false;
	}
if(!leftValid)
{
	codeGenWarnings+="\nWarning! You are trying to do a comparison of a string on the left side of (expr==expr). This is not supported in code gen! Setting comparison to false";
	out("A9");
	out("00");
	return;
	}

	var rightValid = false;
	if(nodey.children[1].type==="digit" || nodey.children[1].type==="op")
	{
	rightValid = true;
	//typey = "int";
	}
	else if(nodey.children[1].type==="ID")
	{
	rightValid = (nodey.children[1].symb.symbol.kind==="int" || nodey.children[1].symb.symbol.kind==="boolean");
	//typey = nodey.children[1].symb.symbol.kind;
	}
	else if(nodey.children[1].type==="True" || nodey.children[1].type==="False")
	{
	rightValid = true;
	//typey = "boolean";
	}
	else if(nodey.children[1].type==="doubleEquals") 
  {
  rightValid = true;
  //typey = "boolean";
  }
	else //we have something else
		{
		rightValid = false;
		out("A9");
		out("00");
		return;
		}
	if(!rightValid)
	{
	codeGenWarnings+="\nWarning! You are trying to do a comparison of a string on right side of (expr==expr). This is not supported in code gen! Setting comparison to false";
	out("A9");
	out("00");
	return;
	}

	//now we know that both children are either symbols of type int or digits.
	//generate code to check if they're equal
	//put the value of the first child in 

	if(leftValid && rightValid)
		{
		if(typey==="int")
		{
		//put the first value in the accumulator
		GenIntExpr(nodey.children[0]);
		//store that in s0
		out("8D"); out("S0"); out("XX");
		//then put it in the x register
		out("AE"); out("S0"); out("XX");
		//now load the right side into the acc
		GenIntExpr(nodey.children[1]);
		//store it in S0
		out("8D"); out("S0"); out("XX");
		//compare both and set Z flag to true if they're equal
		out("EC"); out("S0"); out("XX");
		//if the z flag is zero, its false, so we want to write 00 to the ACC
		out("D0"); //if z flag is false, branch then write 0 to ACC
		out("0E"); //branch 4, past where we write the one
		out("A9"); //here is writing the 1
		out("01");
		setZFalse(); //this makes an extra 10 instructions
		out("D0");//branch past writing the zero
		out("02");
		out("A9"); //here is writing the 0
		out("00");
		}
		else if(typey==="boolean")
		{
		//put the first value in the accumulator
		evalBoolTwo(nodey.children[0]);
		//store that in s0
		out("8D"); out("S0"); out("XX");
		//then put it in the x register
		out("AE"); out("S0"); out("XX");
		//now load the right side into the acc
		evalBoolTwo(nodey.children[1]);
		//store it in S0
		out("8D"); out("S0"); out("XX");
		//compare both and set Z flag to true if they're equal
		out("EC"); out("S0"); out("XX");
		//if the z flag is zero, its false, so we want to write 00 to the ACC
		out("D0"); //if z flag is false, branch then write 0 to ACC
		out("0E"); //branch 4, past where we write the one
		out("A9"); //here is writing the 1
		out("01");
		setZFalse(); //this makes an extra 10 instructions
		out("D0");//branch past writing the zero
		out("02");
		out("A9"); //here is writing the 0
		out("00");
		}
		else{alert('Big Error in compareExpr(), typey could not be determined');}

		//this confused series of branches accomplishes writing the 1 to the acc if both sides of (expr == expr) are equal
		}

}

function setZTrue() //what to do if we have a true expr
{
//we want to set the z flag to 0
//we have to compare a byte in memory to the X register and get them equal
//we'll use S0 for this
out("AE"); //load x register from memory
out("S0");
out("XX"); //load it with S0
//now compare x register with S0, they should be equal
out("EC");
out("S0");
out("XX");
}

function setZFalse() //what to do if we have a false expr
{
//we want to put a 1 in the z flag
//load x register with 02, S0 is 03, compare them
//02 and 03 are random values. I didn't use 01 and 02 because
 	//they're used for printing with the X register
out("A2"); //load x register with 2
out("02");
out("A9"); //load ACC with 01. This is because we are overwriting the acc wen its set to 1 in some cases
out("01");
out("8D"); //store ACC in S0
out("S0");
out("XX");
out("EC");
out("S0");
out("XX");
}

function compareExpr(nodey) //we to do if we have ( Expr == Expr )
{
//nodey is the '==', children[0] and children[1] are what we need to compare
//we can ONLY compare ints. We need to check that both sides are ints
var leftValid = false;
var typey = "";
if(nodey.children[0].type==="digit")
	{
	leftValid = true;
	typey = "int";
	}
else if(nodey.children[0].type==="ID")
	{
	leftValid = (nodey.children[0].symb.symbol.kind==="int" || nodey.children[0].symb.symbol.kind==="boolean");
	typey = nodey.children[0].symb.symbol.kind;
	}
else if(nodey.children[0].type==="True" || nodey.children[0].type==="False")
{
leftValid = true;
typey = "boolean";
}
else if(nodey.children[1].type==="doubleEquals")
{
leftValid = true;
typey = "boolean";
}
else //we have something else
	{
	leftValid = false;
	}
if(!leftValid)
{
codeGenWarnings+="\nWarning! You are trying to do a comparison of a string on the left side of a doubleEquals expression. This is not supported in code gen! Setting comparison to false";
setZFalse();
return;
}

var rightValid = false;
if(nodey.children[1].type==="digit")
	{
	rightValid = true;
//	typey = "int";
	}
else if(nodey.children[1].type==="ID")
	{
	rightValid = (nodey.children[1].symb.symbol.kind==="int" || nodey.children[1].symb.symbol.kind==="boolean");
	typey = nodey.children[1].symb.symbol.kind;
	}
else if(nodey.children[1].type==="True" || nodey.children[1].type==="False")
{
rightValid = true;
//typey = "boolean";
}
else if(nodey.children[1].type==="doubleEquals")
{
rightValid = true;
//typey = "boolean";
}
else //we have something else
	{
	rightValid = false;
	setZFalse();
	return;
	}
if(!rightValid)
{
codeGenWarnings+="\nWarning! You are trying to do a comparison of a string on the right side of a doubleEquals expression. This is not supported in code gen! Setting comparison to false";
setZFalse();
return;
}

//now we know that both children are either symbols of type int or digits.
//generate code to check if they're equal
//put the value of the first child in 

if(leftValid && rightValid)
	{
	if(typey=="int")
		{
		//put the first value in the accumulator
		GenIntExpr(nodey.children[0]);
		//store that in s0
		out("8D"); out("S0"); out("XX");
		//then put it in the x register
		out("AE"); out("S0"); out("XX");
		//now load the right side into the acc
		GenIntExpr(nodey.children[1]);
		//store it in S0
		out("8D"); out("S0"); out("XX");
		//compare both and set Z flag to true if they're equal
		out("EC"); out("S0"); out("XX");
		}
	else if(typey === "boolean")//we have booleans
		{
		//put the first value in the accumulator
		evalBoolTwo(nodey.children[0]);
		//store that in s0
		out("8D"); out("S0"); out("XX");
		//then put it in the x register
		out("AE"); out("S0"); out("XX");
		//now load the right side into the acc
		evalBoolTwo(nodey.children[1]);
		//store it in S0
		out("8D"); out("S0"); out("XX");
		//compare both and set Z flag to true if they're equal
		out("EC"); out("S0"); out("XX");
		}
	else{alert('Big Error in compareExpr(), typey could not be determined');}
	}

}


function GenDeclaration(nodey)
{
 
//here, the first child of nodey is the type, and the second child is the ID
//the ID has a pointer to the symbol, which is nodey.children[1].symb.symbol.
if(nodey.children[0].type==="int")
	{
	//allocate a new static variable for the symbol
	nodey.children[1].symb.symbol.temp = newTempVar(); //set up a new temp var for the int
	}
else if(nodey.children[0].type==="boolean")
{
//allocate temp var for the boolean
nodey.children[1].symb.symbol.temp = newTempVar(); 	
}	
else 
	{
	//its a string

	}
}


function GenAssignment(nodey)
{
//nodey.children[0] is the ID, nodey.children[1] is the value assigned

if(nodey.children[0].symb.symbol.kind==="int")
	{
	//first, put value of right side into accumulator
	GenIntExpr(nodey.children[1]);
	//then, write code to store the Acc into the address of the variable
	out("8D");
	var tempLoc = nodey.children[0].symb.symbol.temp.name;//this gives a temp address stored in the symbol, like "ADXX"
	out(tempLoc.substr(0,2));
	out(tempLoc.substr(2,2));
	}
else if(nodey.children[0].symb.symbol.kind==="boolean")
{
//first, put the right side value into the accumulator
evalBoolTwo(nodey.children[1]);
//then, write code to store the Acc into the address of the variable
out("8D");
var tempLoc = nodey.children[0].symb.symbol.temp.name;//this gives a temp address stored in the symbol, like "ADXX"
out(tempLoc.substr(0,2));
out(tempLoc.substr(2,2));
}
else  //we have a string assignment. 
	{
	var symby = nodey.children[0].symb.symbol;
	var heapLocation = symby.heapLoc;
	var stringVal = nodey.children[1].value;
	for(var i = 0; i < stringVal.length; i++)
		{
		//convert character to hex
		var toWrite = StoH(stringVal.substr(i,1));
		out("A9"); //load acc with constant
		out(toWrite); //character we want to write
		out("8D");  //store acc in memory
		out(DtoH(heapLocation));
		//we also have to put '00' in front of the address
		out("00");
		heapLocation++;
		}
		//finally, write a 00 to terminate the string
		out("A9"); //load acc with constant
		out("00"); //character we want to write
		out("8D");  //store acc in memory
		out(DtoH(heapLocation));
		out("00");
	}

}

function Genprint(nodey)
{
//check what type of thing we're printing
var typey;
var isID = false;
if(nodey.children[0].type==="ID")
{
typey = nodey.children[0].symb.symbol.kind;
isID = true;
}
else if(nodey.children[0].type==="op" || nodey.children[0].type==="digit")
{
typey = "int";
}
else if(nodey.children[0].type==="True" || nodey.children[0].type==="False" || nodey.children[0].type==="doubleEquals")
{
typey = "boolean";
}

if(typey==="int")
{
out("A2"); //load the X register with a constant
out("01");
GenIntExpr(nodey.children[0]); //put the value of the expr in the accumulator
out("8D"); //store ACC in memory
out("S0");
out("XX");
out("AC"); //put S0 in Y register
out("S0"); 
out("XX"); 
out("FF"); //syscall
}
else if(typey==="boolean")
{
out("A2"); //load the X register with a constant
out("01");
evalBoolTwo(nodey.children[0]); //put the value of the expr in the accumulator
out("8D"); //store ACC in memory
out("S0");
out("XX");
out("AC"); //put S0 in Y register
out("S0"); 
out("XX"); 
out("FF"); //syscall
}
else if(typey==="string" && isID)
{

//load the x register with 2
out("A2"); //load the X register with a constant
out("02");
//load y register with starting location of string
out("A0");
out(DtoH(nodey.children[0].symb.symbol.heapLoc));
//note- for loading y register with a constant, we DONT need 00 after
	//the heapLocation, just the heapLocation
//do a system call
out("FF");


}
else //we're printing a stringExpr, e.g. print("test")
{
var stringVal = nodey.children[0].value;
var heapLocation = heapPointer;
for(var i = 0; i < stringVal.length; i++)
	{
	//store each character of the string into the starting loc of the heap
	var toWrite = StoH(stringVal.substr(i,1));
	out("A9"); //load acc with constant
	out(toWrite); //character we want to write
	out("8D");  //store acc in memory
	out(DtoH(heapLocation));
	//we also have to put '00' in front of the address
	out("00");
	heapLocation++;
	}
//finally, write a 00 to terminate the string
out("A9"); //load acc with constant
out("00"); //character we want to write
out("8D");  //store acc in memory
out(DtoH(heapLocation));
out("00");

//now, print it
out("A2"); //load the X register with a constant
out("02");
//load y register with starting location of string
out("A0");
out(DtoH(heapPointer));
//do a system call
out("FF");
}

}

function GenIntExpr(nodey)
{
//we want to put the value of this expression in the accumulator
//the node passed in is either a digit or an op


if(nodey.type==="digit")
	{
	out("A9"); //load ACC with constant
	out(numToString(tokens[nodey.tok].value)); //constant 1
	}

//else(tokens[nodey.tok].kind==="+")
else if(nodey.type==="op")
	{
//we need to keep going down the tree until we find that both children of 'op' are digit
	var n = nodey;
	while(n.children[1].type==="op")
		{
		n = n.children[1]; 
		}	
	//now we have n which is the innermost 'op' node. Add the two digits

	if(tokens[n.tok].value==="-")
	{codeGenWarnings+="\nWarning: You tried to use subtraction...Code Gen does not support subtraction! Unpredictable behavior may ensue";
	n = n.parent;
	}
	else
	{
	addOp(n, true);
	n = n.parent;
	}	
	while(n.type==="op")
		{
		if(tokens[n.tok].value==="+")	
			{
			addOp(n, false);
			}
		else
			{
			codeGenWarnings+="\nWarning: You tried to use subtraction...Code Gen does not support subtraction! Unpredictable behavior may ensue";
			}
		n = n.parent;		
		}	

	}
	else //nodey is an ID
	{

	//we want to load the ACC with the symbol's value
	out("AD"); //load the accumulator from memory
	out(nodey.symb.symbol.temp.name.substr(0,2));
	out(nodey.symb.symbol.temp.name.substr(2,2));
	}
}


function addOp(nodey, twoDigits)
{
//nodey is the operation node
//two digits says whether op branches to two digits
//if it does, add the two and store them in the accumulator
//otherwise, the result of the previous ops should already be in the accumulator
if(twoDigits)
	{
	//check if children[1] is a digit. If it is, we're adding digits
	if(nodey.children[1].type==="digit")
		{
		out("A9"); //load ACC with constant
		out(numToString(tokens[nodey.children[1].tok].value)); //constant 1
		out("8D"); //store acc in memory
		out("S0"); out("XX"); //put the number in "static 0"
		out("A9"); //load ACC with constant
		out(numToString(tokens[nodey.children[0].tok].value)); //constant 2
		//now add them up! result is in accumulator
		out("6D");
		out("S0"); out("XX");
		}
	else //otherwise, children[1] is a symbol.
		{
		out("A9"); //load ACC with constant
		out(numToString(tokens[nodey.children[0].tok].value)); //a constant
		//now add acc with the location of the variable
		out("6D");
		var varLoc = nodey.children[1].symb.symbol.temp.name;
		out(varLoc.substr(0,2)); out(varLoc.substr(2,2)); 
		}
	}
else
	{
	
	//accumulator already has value from adding, store it in memory
	out("8D"); //store acc in memory
	out("S0"); out("XX"); //put the number in "static 0"
	out("A9"); //load ACC with constant
	out(numToString(tokens[nodey.children[0].tok].value)); 
	//now add them up! result is in accumulator
	out("6D");
	out("S0"); out("XX");

	}
}

function DtoH(x) //decimal to hex
{
return Number(x).toString(16);
}

function StoH(x) //string to hex
{
return x.charCodeAt(0).toString(16);
}

function HtoD(h) //hex to decimal
{
return parseInt(h, 16);
}

function numToString(x)
{
var retVal = "0";
retVal+=x;
return(retVal);

}
