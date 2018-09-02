/* lexer.js  */



function lexWord(sourcey, c, word)
{

//here, we assume the index we are currently on of sourceCode is the first letter of word
//we return true if the rest of the word is found, false otherwise

var wordLen = word.length;
//first, make sure we can read enough characters

if ((c + wordLen) <= sourcey.length) {

//check next chars to see if we have har_ 
var nexty = sourcey.substr(c, wordLen);
return (nexty === word); //print can also be followed by an open paren,'('

} else//we don't have enough characters to finish "char_"
{return false;}


}


function lex() {
    //alert('lex entered');
    // Grab the "raw" source code.
    var sourceCode = document.getElementById("taSourceCode").value;
    // Trim the leading and trailing spaces.
    sourceCode = trim(sourceCode);
    var sourceLen = sourceCode.length;
    //string reference
    //http://www.w3schools.com/jsref/jsref_obj_string.asp
    //lineNum declared as global variable
    var inQuotes = false;

    //alert(sourceLen);



    for (var ch = 0; ch < sourceLen; ch++) {
        var chCode = sourceCode.charCodeAt(ch);
        //first, check for characters

        if (inQuotes == false) {
            switch (true) {
                //if the character we are looking as is anything but an i 
              
  	case (chCode >= 97 && chCode <= 122 && chCode !== 112 && chCode !== 115 && chCode !== 105 && chCode !== 98 && chCode!==119 && chCode!==102 && chCode!==116):
                    addToken("T_char", lineNum, sourceCode.charAt(ch));
                    break;

                case (chCode === 112):
                    // 'p'
                    //call lexWord for 'print'
		    if(lexWord(sourceCode, ch, "print"))
			{
                            addToken("T_print", lineNum, "print");
			    ch = ch + 4; //move the pointer past 'rint'
			}
			else
			{	
                            addToken("T_char", lineNum, sourceCode.charAt(ch));
			}
                    break;
	        case (chCode === 98):
                    // 'b'
                    //call lexWord for 'print'
		    if(lexWord(sourceCode, ch, "boolean"))
			{
                            addToken("T_boolean", lineNum, "boolean");
			    ch = ch + 6; //move the pointer past 'rint'
			}
			else
			{	
                            addToken("T_char", lineNum, sourceCode.charAt(ch));
			}
                    break;

                case (chCode === 102):
                    // 'f'
		    if(lexWord(sourceCode, ch, "false"))
			{
                            addToken("T_false", lineNum, "false");
			    ch = ch + 4; //move the pointer past 'rint'
			}
			else
			{	
                            addToken("T_char", lineNum, sourceCode.charAt(ch));
			}
                    break;

                case (chCode === 116):
                    // 't'

		    if(lexWord(sourceCode, ch, "true"))
			{
                            addToken("T_true", lineNum, "true");
			    ch = ch + 3; //move the pointer past 'rint'
			}
			else
			{	
                            addToken("T_char", lineNum, sourceCode.charAt(ch));
			}
                    break;

                case (chCode === 115):
		    // 's'
                   	if(lexWord(sourceCode, ch, "string"))
			{
                            addToken("T_string", lineNum, "string");
			    ch = ch + 5; //move the pointer past 'rint'
			}
			else
			{	
                            addToken("T_char", lineNum, sourceCode.charAt(ch));
			}

                    break;

               case (chCode === 119):
		    // 'w'
                   	if(lexWord(sourceCode, ch, "while"))
			{
                            addToken("T_while", lineNum, "while");
			    ch = ch + 4; //move the pointer past 'rint'
			}
			else
			{	
                            addToken("T_char", lineNum, sourceCode.charAt(ch));
			}

                    break;

                case (chCode === 105):
                    //'i'
                   	if(lexWord(sourceCode, ch, "int"))
			{
                            addToken("T_int", lineNum, "int");
			    ch = ch + 2; //move the pointer past 'rint'
			}
			else if(lexWord(sourceCode, ch, "if"))
			{	
                            addToken("T_if", lineNum, "if");
			    ++ch;
			}
			else
			{
                            addToken("T_char", lineNum, sourceCode.charAt(ch));
			}

                    break;




                case (chCode >= 48 && chCode <= 57):
                    //number, add the token
                    addToken("T_digit", lineNum, chCode - 48);
                    break;


                case (chCode === 40 || chCode === 41):
                    //parens (40 L, 41 R)
                    if (chCode === 40) {
                        addToken("T_leftParen", lineNum, sourceCode.charAt(ch));
                    } else {
                        addToken("T_rightParen", lineNum, sourceCode.charAt(ch));
                    }
                    break;

                case (chCode === 123 || chCode === 125):
                    //curly brace (123 L, 125 R)
                    if (chCode == 123) {
                        addToken("T_leftBrace", lineNum, sourceCode.charAt(ch));
                    } else {

                        addToken("T_rightBrace", lineNum, sourceCode.charAt(ch));
                    }
                    break;

                case (chCode === 43 || chCode === 45):
                    //operators (43 +, 45 -)

                    addToken("T_op", lineNum, sourceCode.charAt(ch));
                    break;

                case (chCode === 34):
                    //quotation
                    addToken("T_quote", lineNum, sourceCode.charAt(ch));
                    inQuotes = !inQuotes;
                    break;


                case (chCode === 32):
                    //space- for now, do nothing
                    break;

                case (chCode === 9):
                    //tab- for now, do nothing
                    break;

                case (chCode === 10):
                    //new line
                    lineNum++;
                    break;


                case (chCode === 36):
                    //dollar sign
                    addToken("T_END", lineNum, sourceCode.charAt(ch));
                    if (ch + 1 !== sourceLen) //we're not at the last char, so there is code after the end marker
                    {
                        lexWarningCount++;
                        putMessage("Warning: Code after end marker ($)\n");
                    }
                    printLex();
                    return sourceCode;

                    break;

                case (chCode === 61):
                    //=
			//check if there is another =, in which case its a double equal
		    if(ch+1 !== sourceLen)
			{	
			if(sourceCode.charAt(ch+1) == '=') 
				{addToken("T_doubleEquals", lineNum, "==");
				//increment character count by 1 since we consumed 2
				++ch;
				}
			else{addToken("T_equals", lineNum, sourceCode.charAt(ch));}
			}
		    else
                    {addToken("T_equals", lineNum, sourceCode.charAt(ch));}
                    break;

                default:
                    lexErrorCount++;
                    putMessage("Lex Error: unrecognized character, " + sourceCode.charAt(ch));
                    break;
                    //THROW ERROR

            }
        } else //inQuotes is TRUE! We are in 
        {
            switch (true) {
                //if the character we are looking as is anything but an i 
                case (chCode >= 97 && chCode <= 122):
                    addToken("T_char", lineNum, sourceCode.charAt(ch));
                    break;
                case (chCode === 32):
                    //space- ONLY recognize space if its inside a quote
                    addToken("T_space", lineNum, sourceCode.charAt(ch));
                    break;
                case (chCode === 34):
                    //quotation
                    addToken("T_quote", lineNum, sourceCode.charAt(ch));
                    inQuotes = !inQuotes;
                    break;
                case (chCode === 36):
                    //dollar sign
                    addToken("T_END", lineNum, sourceCode.charAt(ch));
                    if (ch + 1 !== sourceLen) //we're not at the last char, so there is code after the end marker
                    {
                        lexWarningCount++;
                        putMessage("Warning: Code after end marker ($)\n");
                    }
                    printLex();
                    return sourceCode;
                    break;
                default:
                    lexErrorCount++;
                    putMessage("Lex Error: Unrecognized character found within quotations: " + sourceCode.charAt(ch)) + "found, only characters a-z are allowed";
                    break;
            }
        }

    }
    printLex();
    return sourceCode;
    //alert('lex exited');
}

function printLex() {
    if (lexErrorCount === 0) {
        putMessage("Lex Successful! Found 0 , found " + lexWarningCount + " warning(s)");
    } else {
        putMessage("Lex Unsuccessful, found " + lexErrorCount + " error(s)!");
    }

    if (verboseLex) {
        printArray(tokens);
    }

}
