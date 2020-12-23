let code = 
`
double reverseInteger(double number) { 
    double newNumber=0;
    while (number!=0){
        newNumber=newNumber*10+number%10;
        if (number>0){
          number=floor(number/10);
        }else{
          number=ceil(number/10);
        }
    }
    return newNumber;
}

for (double i=0;i<=500000;i=i+1){
   string m=tostring(reverseInteger(i),null);
}
`;


const {Interpreter, StringObj, NumberObj, BoolObj} = require('./Interpreter');

function print(popFn){
    let str=popFn();

    console.log(str.value);
    return new BoolObj(null, false, false);
}

let interpreter=new Interpreter();

interpreter.runCode( 
                    code,                                                   //The code to run
                    Interpreter.funcDef("print", print, "bool", "string"),  //importing print (returns a bool, accepts a string)
                   );
