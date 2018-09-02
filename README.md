# 2018 Update
This is a compiler that I wrote in my junior year at Vassar College. To run it, open index.html, and copy some of the same cases in the tests file. 

Thanks to [Alan Labouseur](http://labouseur.com/) for teaching the class. 

# Original README

The compiler is finally done! It has been a fun experience. Its a shame that you won't be teaching this class again at Vassar- I'm glad I got in on it.


I've included a file called "TESTS.txt" which contains working and not working tests. All of the features of the grammar that were required are working. The only thing that does not work is subtraction and string comparison, which you stated were not to be done in the project. 

Note that subtraction and string comparison still parse normally. A warning is issued in code gen for these. String comparison always evaluates to false. Subtraction does not generate any code at all and may produce unpredictable behavior (i.e. break other parts of the code).


A few notes about design:

1. I chose to do the "generate code to generate data" method of strings. Even though we discussed how to use the other method when combining it with if statements and conditional string assignment, I could not think of an easy way to implement that. 

This method was fairly easy to code. I was able to generate all of the heap locations before code gen. The only downside is that string assignment takes up a lot of instructions. The size of strings therefore is very limited in this compiler.

2. I did NOT use a jump table. I found a much easier way. When I was inside the function that generated code for if/while statements, I kept track in the function of where I put the temporary variable. 
I then called the function "GenProcessNode," which, in this case, generates all the code for the body of the if/while statement and returns how many instructions it generated. 
Then, back in the if/while function, I patched the jump location right then and there. This was considerably easier than creating a table. 

3. In my code, there is frequent reference to the location "S0 XX." This stands for "Static 0," or the first location of the static memory. I use this address to temporarily store integers while doing addition and other operations. We didn't talk about this in class, but I'm fairly sure an address to use as the goto storage mechanism is necessary (or at least makes the generated code more efficient).

4. The code got kind of jumbled at the end. I originally had functions to evaluate boolean expressions, but only in the context of if and while statements. When I added booleans as variables, I needed to make functions that put '0' or '1' into the accumulator instead of setting the z flag based on the boolean expression's truth value. I ended up making a second function, evalBoolTwo(), to do this, while evalBool() is used only for if and while expressions. 

5. Booleans are represented as '00' for false and '01' for true. Booleans are initialized as '00', strings as empty (i.e. '00'), and ints as '00'.

