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

string toFraction(double number) {
    double numerator=number;
    double denominator=1;
    while (abs(floor(numerator)-numerator)>0.000001){
        numerator=numerator*10;
        denominator=denominator*10;
    }

    double maxDivider=10000;

    for (double i = 2;i<maxDivider;i=i+1){
        if (numerator%i==0 && denominator%i==0){
            numerator=numerator/i;
            denominator=denominator/i;
            i=1;
        }
    }
    return tostring(number,null)+" = "+tostring(numerator, 0)+"/"+tostring(denominator, 0);
};

double num=123456789;

string message=tostring(num, null)+" reversed is "+tostring(reverseInteger(num), null);
for (double i=-1;i<1;i=i+.01){
    print(toFraction(i));
}
exit message;
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
